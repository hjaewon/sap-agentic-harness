/**
 * Regression test for UpdateFunctionGroup content-type negotiation
 * (HANDOFF §6 backlog 11-③).
 *
 * The handler issues a raw metadata PUT to
 * /sap/bc/adt/functions/groups/<name> that historically hardcoded the
 * request content type to `...functions.groups.v3+xml`. Systems that only
 * advertise v2 in their ADT discovery document (e.g. IDES / S/4HANA 2021)
 * reject a v3 PUT with HTTP 415 "ExceptionUnsupportedMediaType" (supported
 * media type: ...functions.groups.v2+xml) — live-reproduced on IDES.
 *
 * The fix negotiates the content type from the live discovery document (the
 * same negotiation CreateFunctionGroup has used since 4.13.1) and injects the
 * advertised media type into the PUT, falling back to the hardcoded v3 default
 * only when discovery is unavailable.
 *
 * SAP-independent: drives the real handler over a fake IAbapConnection that
 * serves a controllable discovery document and captures every outbound
 * request (including headers).
 */

// Keep the AdtClient accept-header correction wrapper out of the way so the
// captured headers on the raw PUT are exactly what the handler set.
process.env.ADT_ACCEPT_CORRECTION = 'false';
delete process.env.SAP_SYSTEM_TYPE;

import { handleUpdateFunctionGroup } from '../../handlers/function/high/handleUpdateFunctionGroup';

const LOCK_XML =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<asx:abap xmlns:asx="http://www.sap.com/abapxml" version="1.0">' +
  '<asx:values><DATA><LOCK_HANDLE>TESTHANDLE-1</LOCK_HANDLE></DATA></asx:values>' +
  '</asx:abap>';

const FUGR_XML =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<group:abapFunctionGroup xmlns:group="http://www.sap.com/adt/functions/groups" ' +
  'xmlns:adtcore="http://www.sap.com/adt/core" adtcore:name="ZSAH_FG_TEST" ' +
  'adtcore:description="old description"/>';

// Discovery Atom Service Document advertising ONLY v2 for the function-groups
// collection (the shape IDES / S/4HANA 2021 returns).
const DISCOVERY_V2_ONLY =
  '<?xml version="1.0" encoding="utf-8"?>' +
  '<app:service xmlns:app="http://www.w3.org/2007/app" ' +
  'xmlns:atom="http://www.w3.org/2005/Atom">' +
  '<app:workspace>' +
  '<app:collection href="/sap/bc/adt/functions/groups">' +
  '<atom:title>Function Groups</atom:title>' +
  '<app:accept>application/vnd.sap.adt.functions.groups.v2+xml</app:accept>' +
  '</app:collection>' +
  '</app:workspace></app:service>';

interface CapturedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
}

/**
 * Minimal IAbapConnection stand-in. `discoveryBody === undefined` simulates
 * discovery being unavailable (the GET rejects), exercising the fallback path.
 */
class FakeConnection {
  sessionMode: 'stateful' | 'stateless' = 'stateless';
  captured: CapturedRequest[] = [];
  constructor(private readonly discoveryBody?: string) {}

  setSessionType(type: 'stateful' | 'stateless') {
    this.sessionMode = type;
  }
  getSessionMode() {
    return this.sessionMode;
  }
  getSessionId() {
    return 'testsessionid00000000000000000000';
  }
  async getBaseUrl() {
    return 'https://sap.example.com:44300';
  }
  async getAuthHeaders() {
    return {};
  }

  async makeAdtRequest(options: any): Promise<any> {
    const { url, method, headers } = options;
    this.captured.push({
      url,
      method: String(method).toUpperCase(),
      headers: { ...(headers || {}) },
    });
    return this.route(url, String(method).toUpperCase());
  }

  private route(url: string, method: string): any {
    const ok = (data: string) => ({
      status: 200,
      statusText: 'OK',
      data,
      headers: {},
    });
    if (url.includes('/sap/bc/adt/discovery')) {
      if (this.discoveryBody === undefined) {
        const err: any = new Error('Request failed with status code 404');
        err.response = { status: 404 };
        throw err;
      }
      return ok(this.discoveryBody);
    }
    if (url.includes('_action=LOCK')) return ok(LOCK_XML);
    if (url.includes('_action=UNLOCK')) return ok('');
    if (method === 'GET' && url.includes('/functions/groups/'))
      return ok(FUGR_XML);
    return ok(''); // the metadata PUT lands here
  }
}

const isMetadataPut = (r: CapturedRequest) =>
  r.method === 'PUT' &&
  r.url.includes('/functions/groups/') &&
  r.url.includes('lockHandle=') &&
  !r.url.includes('_action=');

describe('UpdateFunctionGroup content-type negotiation (regression: HTTP 415 on v2-only systems)', () => {
  it('uses the discovery-advertised v2 media type for the metadata PUT', async () => {
    const connection = new FakeConnection(DISCOVERY_V2_ONLY);
    const context = { connection, logger: undefined } as any;

    const result = await handleUpdateFunctionGroup(context, {
      function_group_name: 'ZSAH_FG_TEST',
      description: 'new description',
    });

    expect(result.isError).toBeFalsy();

    // Discovery must have been consulted.
    expect(
      connection.captured.some((r) => r.url.includes('/sap/bc/adt/discovery')),
    ).toBe(true);

    const put = connection.captured.find(isMetadataPut);
    expect(put).toBeDefined();
    expect(put?.headers['Content-Type']).toBe(
      'application/vnd.sap.adt.functions.groups.v2+xml; charset=utf-8',
    );
    expect(put?.headers.Accept).toBe(
      'application/vnd.sap.adt.functions.groups.v2+xml',
    );
  });

  it('falls back to the v3 default when discovery is unavailable', async () => {
    const connection = new FakeConnection(undefined); // discovery GET rejects
    const context = { connection, logger: undefined } as any;

    const result = await handleUpdateFunctionGroup(context, {
      function_group_name: 'ZSAH_FG_TEST',
      description: 'new description',
    });

    expect(result.isError).toBeFalsy();

    const put = connection.captured.find(isMetadataPut);
    expect(put).toBeDefined();
    expect(put?.headers['Content-Type']).toBe(
      'application/vnd.sap.adt.functions.groups.v3+xml; charset=utf-8',
    );
    expect(put?.headers.Accept).toBe(
      'application/vnd.sap.adt.functions.groups.v3+xml',
    );
  });
});
