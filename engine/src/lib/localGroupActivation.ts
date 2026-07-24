/**
 * Local mass-activation helper.
 *
 * Why this exists
 * ---------------
 * adt-clients v3.10.2 exposes `AdtUtils.activateObjectsGroup(objects, preaudit)`
 * which POSTs to `/sap/bc/adt/activation/runs` and long-polls for results.
 * However its wrapper:
 *   1. Calls upstream `buildObjectUri(name, type)` internally — which has no
 *      `PROG/I` mapping (and silently builds `/sap/bc/adt/prog/i/{name}`).
 *   2. Accepts no caller-supplied explicit URI, so we can't override.
 *   3. Throws a generic "Failed to extract activation run ID" error on
 *      legacy NetWeaver < 7.50 where `/runs` is not available, hiding the
 *      need to fall back to the sync `/sap/bc/adt/activation` endpoint.
 *
 * `activateObjectsLocal()` below mirrors the upstream flow but uses
 * `resolveAdtUri` (which accepts explicit URIs and covers PROG/I + friends)
 * and falls back to the sync single-POST endpoint when the async run flow
 * is unavailable. It also returns a parsed per-object result list instead
 * of an opaque AxiosResponse.
 */

import type { IAbapConnection } from '@babamba2/mcp-abap-adt-interfaces';
import { XMLParser } from 'fast-xml-parser';
import { createAdtClient } from './clients';
import { resolveAdtUri } from './resolveAdtUri';
import { makeAdtRequestWithTimeout } from './utils';

export interface ActivationObjectInput {
  name: string;
  type: string;
  uri?: string;
  parent_name?: string;
}

export interface ActivationMessage {
  type: string; // 'E' | 'W' | 'I'
  text: string;
  line?: string | number;
  column?: string | number;
  href?: string;
  objectName?: string;
  objectUri?: string;
}

export interface ActivationObjectResult {
  name: string;
  type: string;
  uri: string;
  status: 'activated' | 'failed';
  errors: ActivationMessage[];
  warnings: ActivationMessage[];
}

export interface GroupActivationResult {
  endpoint: 'runs' | 'sync';
  success: boolean;
  activated: boolean;
  checked: boolean;
  generated: boolean;
  run_id?: string;
  objects: ActivationObjectResult[];
  errors: ActivationMessage[];
  warnings: ActivationMessage[];
  raw_response?: string;
}

const ACTIVATION_CT =
  'application/vnd.sap.adt.activation.request+xml; charset=utf-8';

function buildObjectReferencesXml(
  entries: Array<{ uri: string; name: string; type?: string }>,
): string {
  const refs = entries
    .map(
      (e) =>
        `  <adtcore:objectReference adtcore:uri="${e.uri}"${
          e.type ? ` adtcore:type="${e.type}"` : ''
        } adtcore:name="${e.name}"/>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?><adtcore:objectReferences xmlns:adtcore="http://www.sap.com/adt/core">
${refs}
</adtcore:objectReferences>`;
}

function extractRunId(location: string | undefined): string | null {
  if (!location) return null;
  const match = location.match(/\/activation\/runs\/([^/?#]+)/);
  return match ? match[1] : null;
}

function headerToString(
  value: string | string[] | number | undefined,
): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value))
    return value.length > 0 ? String(value[0]) : undefined;
  return String(value);
}

/**
 * Long-poll the activation run endpoint until it finishes or times out.
 */
async function waitForRun(
  connection: IAbapConnection,
  runId: string,
  maxWaitMs: number,
  pollMs: number,
): Promise<void> {
  const url = `/sap/bc/adt/activation/runs/${runId}?withLongPolling=true`;
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
  });
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const resp = await makeAdtRequestWithTimeout(
      connection,
      url,
      'GET',
      'default',
      undefined,
      undefined,
      {
        Accept: 'application/xml, application/vnd.sap.adt.backgroundrun.v1+xml',
      },
    );
    const parsed = parser.parse(resp.data);
    const run = parsed?.run;
    if (!run) {
      throw new Error(
        'Invalid activation run response — missing <run> element',
      );
    }
    const status = run['@_status'];
    if (status === 'finished') return;
    if (status === 'error' || status === 'failed') {
      throw new Error(
        `Activation run ${runId} terminated with status ${status}`,
      );
    }
    await new Promise((r) => setTimeout(r, pollMs));
  }
  throw new Error(
    `Activation run ${runId} did not finish within ${maxWaitMs}ms`,
  );
}

/**
 * Parse `<chkl:messages>` + per-object markup from an activation response
 * into structured per-object results. Handles both the run-results shape
 * (`/sap/bc/adt/activation/results/{id}`) and the sync shape
 * (`/sap/bc/adt/activation`), which differ slightly.
 */
export function parseActivationResults(
  xmlBody: string,
  inputObjects: Array<{ name: string; type: string; uri: string }>,
): {
  activated: boolean;
  checked: boolean;
  generated: boolean;
  objects: ActivationObjectResult[];
  errors: ActivationMessage[];
  warnings: ActivationMessage[];
} {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
  });
  const parsed = parser.parse(xmlBody ?? '');
  const root = parsed?.messages ?? parsed ?? {};
  const props = root.properties ?? {};
  const activated =
    props['@_activationExecuted'] === 'true' ||
    props['@_activationExecuted'] === true;
  const checked =
    props['@_checkExecuted'] === 'true' || props['@_checkExecuted'] === true;
  const generated =
    props['@_generationExecuted'] === 'true' ||
    props['@_generationExecuted'] === true;

  const rawMessages = root.msg;
  const msgArray = Array.isArray(rawMessages)
    ? rawMessages
    : rawMessages
      ? [rawMessages]
      : [];

  const allErrors: ActivationMessage[] = [];
  const allWarnings: ActivationMessage[] = [];

  // Attach messages to objects by URI match when SAP includes an href
  // pointing back at the object. Fallback: add to the group-level bucket.
  const perObjectErrors = new Map<string, ActivationMessage[]>();
  const perObjectWarnings = new Map<string, ActivationMessage[]>();
  for (const obj of inputObjects) {
    perObjectErrors.set(obj.uri, []);
    perObjectWarnings.set(obj.uri, []);
  }

  for (const raw of msgArray) {
    if (!raw || typeof raw !== 'object') continue;
    const rawLine = raw['@_line'] ?? raw.line;
    const href = raw['@_href'] ?? raw.href;
    let line: string | number | undefined = rawLine;
    // SAP often emits line="1" and encodes the real line/column inside the
    // href fragment: `#start=line,col;end=line,col`.
    if (typeof href === 'string') {
      const m = href.match(/#start=(\d+),(\d+)?/);
      if (m) line = m[1];
    }
    const shortText =
      (raw.shortText &&
        (raw.shortText['#text'] ?? raw.shortText.txt ?? raw.shortText)) ??
      raw['@_shortText'] ??
      '';
    const type = String(raw['@_type'] ?? raw.type ?? '').toUpperCase();
    const message: ActivationMessage = {
      type,
      text: String(shortText),
      line,
      href: typeof href === 'string' ? href : undefined,
    };

    // Best-effort: locate which input object this message belongs to by
    // checking which input URI appears as a prefix of the href.
    if (typeof href === 'string') {
      const owner = inputObjects.find(
        (o) => href.startsWith(o.uri) || href.includes(o.uri),
      );
      if (owner) {
        message.objectUri = owner.uri;
        message.objectName = owner.name;
      }
    }

    if (type === 'E' || type === 'A' || type === 'X') {
      allErrors.push(message);
      const bucket = message.objectUri
        ? perObjectErrors.get(message.objectUri)
        : undefined;
      bucket?.push(message);
    } else if (type === 'W') {
      allWarnings.push(message);
      const bucket = message.objectUri
        ? perObjectWarnings.get(message.objectUri)
        : undefined;
      bucket?.push(message);
    }
  }

  // An object is "failed" only when it carries an actual activation error.
  // The group-level activationExecuted flag is NOT a reliable per-object gate:
  // SAP's /activation/runs results can report generationExecuted="true" WITHOUT
  // activationExecuted="true" on a fully successful run (observed on S/4HANA
  // 2021 activating a program-with-screens family — the run returned 0 errors,
  // generationExecuted="true", and the objects read back active, yet every
  // object was reported "failed"). Generation is downstream of activation, so
  // its success implies activation ran. Gating solely on `activated` turned a
  // clean run into an all-objects-failed false report (lessons-pack layer1
  // #6/#11: a success flag is not proof — and, symmetrically, the absence of
  // one is not proof of failure; re-query the server to confirm).
  const runExecuted = activated || generated;
  const perObject: ActivationObjectResult[] = inputObjects.map((obj) => {
    const errs = perObjectErrors.get(obj.uri) ?? [];
    const wrns = perObjectWarnings.get(obj.uri) ?? [];
    return {
      name: obj.name,
      type: obj.type,
      uri: obj.uri,
      status: errs.length === 0 && runExecuted ? 'activated' : 'failed',
      errors: errs,
      warnings: wrns,
    };
  });

  return {
    activated,
    checked,
    generated,
    objects: perObject,
    errors: allErrors,
    warnings: allWarnings,
  };
}

export interface LocalGroupActivationOptions {
  preauditRequested?: boolean;
  /** Max wait for run to finish, in ms. Default 120000 (2 minutes). */
  runTimeoutMs?: number;
  /** Polling interval while waiting for run, ms. Default 1000. */
  pollIntervalMs?: number;
  /** Optional logger — lets the best-effort oracle re-query trace a swallowed failure. */
  logger?: { debug?: (message: string) => void };
}

/**
 * Best-effort oracle confirmation (lessons-pack layer1 #6/#11): the activation
 * run's success flags are NOT proof. After the run, re-query the inactive-object
 * worklist; any object we tried to activate that is STILL inactive did not
 * actually activate, whatever the response said. This is exactly what the
 * ZUNIWTH operator did by hand (GetInactiveObjects → 0 = truly active).
 *
 * Matching is by uppercased name + base type prefix. The inactive worklist
 * reports `{ type, name }` where `type` is a `<base>/<subtype>` code
 * (PROG/P, TABL/DS, DDLS/DF …) whose subtype does not always equal the
 * activation input's subtype — live-measured 2026-07-24 — so we compare the
 * base type (before `/`) plus the name, and fall back to name-only when our
 * object arrived without a type (the {name, uri} input mode), so an empty base
 * can never silently disable the check for that object.
 *
 * Downgraded objects flip to `failed` and get an error message; the returned
 * messages are merged into the run's error list so `success`/counts stay
 * consistent. A failure of the re-query itself never changes the flag-based
 * result — the probe is swallowed (same discipline as the 4.13.14 FM
 * check_inactive probe).
 */
async function confirmActivationViaOracle(
  connection: IAbapConnection,
  objects: ActivationObjectResult[],
  logger?: { debug?: (message: string) => void },
): Promise<ActivationMessage[]> {
  const oracleErrors: ActivationMessage[] = [];
  try {
    const client = createAdtClient(connection);
    const inactive: any = await client.getUtils().getInactiveObjects();
    const list: Array<{ type?: string; name?: string }> = Array.isArray(
      inactive?.objects,
    )
      ? inactive.objects
      : [];
    const base = (type: string | undefined) =>
      String(type ?? '')
        .split('/')[0]
        .toUpperCase();
    const upper = (name: string | undefined) =>
      String(name ?? '').toUpperCase();
    const baseNameKeys = new Set(
      list.map((o) => `${base(o.type)}|${upper(o.name)}`),
    );
    // Name-only fallback: an input supplied as {name, uri} with no type has an
    // empty base that could never match a worklist entry, silently disabling
    // the oracle for that object (the dangerous false-success direction). When
    // our object has no base type, match on name alone.
    const names = new Set(list.map((o) => upper(o.name)));
    for (const obj of objects) {
      if (obj.status !== 'activated') continue;
      const b = base(obj.type);
      const stillInactive = b
        ? baseNameKeys.has(`${b}|${upper(obj.name)}`)
        : names.has(upper(obj.name));
      if (!stillInactive) continue;
      obj.status = 'failed';
      const msg: ActivationMessage = {
        type: 'E',
        text: `Object ${obj.name} is still inactive after the activation run (oracle re-query via GetInactiveObjects) — activation did not take, despite the run response.`,
        objectName: obj.name,
        objectUri: obj.uri,
      };
      obj.errors.push(msg);
      oracleErrors.push(msg);
    }
  } catch (err: any) {
    // Best-effort: an errored/uncertain re-query must never flip a real result.
    // Log so a permanently-disabled oracle (a legacy 404, a wiring regression)
    // is detectable rather than an invisible no-op.
    logger?.debug?.(
      `activation oracle re-query skipped (result unchanged): ${err?.message ?? String(err)}`,
    );
  }
  return oracleErrors;
}

/**
 * Activate many ABAP objects in a single request. Attempts the run-based
 * endpoint first and falls back to the sync endpoint on legacy systems.
 */
export async function activateObjectsLocal(
  connection: IAbapConnection,
  objects: ActivationObjectInput[],
  options: LocalGroupActivationOptions = {},
): Promise<GroupActivationResult> {
  if (!objects || objects.length === 0) {
    throw new Error('activateObjectsLocal: objects must be a non-empty array');
  }
  const preauditRequested = options.preauditRequested !== false;
  const runTimeoutMs = options.runTimeoutMs ?? 120_000;
  const pollIntervalMs = options.pollIntervalMs ?? 1000;

  const resolved = objects.map((obj) => ({
    name: obj.name.toUpperCase(),
    type: obj.type,
    uri: resolveAdtUri({
      name: obj.name,
      type: obj.type,
      uri: obj.uri,
      parentName: obj.parent_name,
    }),
  }));

  const xmlBody = buildObjectReferencesXml(resolved);

  // ── Attempt run-based endpoint first ──────────────────────────────────
  try {
    const startUrl = `/sap/bc/adt/activation/runs?method=activate&preauditRequested=${preauditRequested}`;
    const startResp = await makeAdtRequestWithTimeout(
      connection,
      startUrl,
      'POST',
      'long',
      xmlBody,
      undefined,
      {
        Accept: 'application/xml',
        'Content-Type': 'application/xml',
      },
    );
    const location =
      headerToString(startResp.headers?.location) ??
      headerToString(startResp.headers?.Location) ??
      headerToString(startResp.headers?.['content-location']) ??
      headerToString(startResp.headers?.['Content-Location']);
    const runId = extractRunId(location);
    if (runId) {
      await waitForRun(connection, runId, runTimeoutMs, pollIntervalMs);
      const resultsResp = await makeAdtRequestWithTimeout(
        connection,
        `/sap/bc/adt/activation/results/${runId}`,
        'GET',
        'default',
        undefined,
        undefined,
        { Accept: 'application/xml' },
      );
      const body =
        typeof resultsResp.data === 'string'
          ? resultsResp.data
          : String(resultsResp.data ?? '');
      const parsed = parseActivationResults(body, resolved);
      const oracleErrors = await confirmActivationViaOracle(
        connection,
        parsed.objects,
        options.logger,
      );
      const errors = [...parsed.errors, ...oracleErrors];
      return {
        endpoint: 'runs',
        success: (parsed.activated || parsed.generated) && errors.length === 0,
        activated: parsed.activated,
        checked: parsed.checked,
        generated: parsed.generated,
        run_id: runId,
        objects: parsed.objects,
        errors,
        warnings: parsed.warnings,
        raw_response: body,
      };
    }
    // Missing Location header → treat as fallback signal; fall through.
  } catch (runError: any) {
    // Only fall back for "endpoint unavailable" symptoms (404, 501); for any
    // other error (auth, timeout) re-throw so callers see the real cause.
    const status = runError?.response?.status;
    if (status !== 404 && status !== 501) {
      throw runError;
    }
  }

  // ── Sync fallback ─────────────────────────────────────────────────────
  const syncResp = await makeAdtRequestWithTimeout(
    connection,
    `/sap/bc/adt/activation?method=activate&preauditRequested=${preauditRequested}`,
    'POST',
    'long',
    xmlBody,
    undefined,
    {
      Accept: 'application/xml',
      'Content-Type': ACTIVATION_CT,
    },
  );
  const body =
    typeof syncResp.data === 'string'
      ? syncResp.data
      : String(syncResp.data ?? '');
  const parsed = parseActivationResults(body, resolved);
  const oracleErrors = await confirmActivationViaOracle(
    connection,
    parsed.objects,
    options.logger,
  );
  const errors = [...parsed.errors, ...oracleErrors];
  return {
    endpoint: 'sync',
    success: (parsed.activated || parsed.generated) && errors.length === 0,
    activated: parsed.activated,
    checked: parsed.checked,
    generated: parsed.generated,
    objects: parsed.objects,
    errors,
    warnings: parsed.warnings,
    raw_response: body,
  };
}
