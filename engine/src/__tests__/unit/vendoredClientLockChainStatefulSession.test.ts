/**
 * Family regression test for the lock-session bug (vsp issue #88 class) in the
 * VENDORED CLIENT's own full-chain lock -> write -> unlock paths — the cases
 * 4.13.5 explicitly deferred ("requires a vendored-client patch"):
 *
 *   AdtLocalTestClass.update  (UpdateLocalTestClass / UpdateCdsUnitTest)
 *   AdtLocalTypes.update      (UpdateLocalTypes)
 *   AdtLocalMacros.update     (UpdateLocalMacros)
 *   AdtLocalDefinitions.update(UpdateLocalDefinitions)
 *   AdtBehaviorImplementation.update (UpdateBehaviorImplementation — full
 *     chain with TWO writes: main source PUT + implementations include PUT)
 *   AdtClass.updateTestClasses (public client API, named in the backlog)
 *
 * Unlike the 4.13.3–4.13.6 fixes (handler-side pins), these handlers delegate
 * the ENTIRE lock -> check -> PUT -> unlock chain to the vendored wrapper and
 * pass no lockHandle, so no handler-side pin can help: the wrapper's internal
 * lock() resets the connection to stateless before the intermediate check and
 * the write PUT go out. On backends that recycle the HTTP connection between
 * requests (e.g. IDES) SAP routes a stateless request through a fresh work
 * process, tears the stateful ADT session down, the ENQUEUE lock evaporates,
 * and the write fails with "resource not locked (invalid lock handle)"
 * (HTTP 423). The 4.13.7 vendored-client patch re-pins
 * setSessionType('stateful') immediately after each wrapper-internal lock
 * (and, for AdtClass.updateTestClasses, stops resetting to stateless between
 * lock and PUT); unlock() restores stateless.
 *
 * SAP-independent: drives the real handlers (and, for updateTestClasses, the
 * real AdtClient method) over a fake IAbapConnection whose makeAdtRequest
 * mirrors AbstractAbapConnection's header injection (it stamps
 * `x-sap-adt-sessiontype: stateful` whenever the connection's session mode is
 * stateful) and captures every outbound request.
 */

// Disable the AdtClient accept-header negotiation wrapper so the fake
// connection's makeAdtRequest is invoked verbatim and capture is deterministic.
process.env.ADT_ACCEPT_CORRECTION = 'false';
// Make sure the standard (non-ECC, non-legacy) paths are under test.
delete process.env.SAP_VERSION;
delete process.env.SAP_SYSTEM_TYPE;

import { handleUpdateBehaviorImplementation } from '../../handlers/behavior_implementation/high/handleUpdateBehaviorImplementation';
import { handleUpdateLocalDefinitions } from '../../handlers/class/high/handleUpdateLocalDefinitions';
import { handleUpdateLocalMacros } from '../../handlers/class/high/handleUpdateLocalMacros';
import { handleUpdateLocalTestClass } from '../../handlers/class/high/handleUpdateLocalTestClass';
import { handleUpdateLocalTypes } from '../../handlers/class/high/handleUpdateLocalTypes';
import { handleUpdateCdsUnitTest } from '../../handlers/unit_test/high/handleUpdateCdsUnitTest';
import { createAdtClient } from '../../lib/clients';

const LOCK_XML =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<asx:abap xmlns:asx="http://www.sap.com/abapxml" version="1.0">' +
  '<asx:values><DATA><LOCK_HANDLE>TESTHANDLE-1</LOCK_HANDLE></DATA></asx:values>' +
  '</asx:abap>';

const CHECK_OK_XML =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<chkrun:checkRunReports xmlns:chkrun="http://www.sap.com/adt/checkrun">' +
  '<chkrun:checkReport chkrun:reporter="abapCheckRun" chkrun:status="processed" chkrun:statusText="OK"/>' +
  '</chkrun:checkRunReports>';

const TEST_CLASS_CODE =
  'CLASS ltc_test DEFINITION FINAL FOR TESTING DURATION SHORT RISK LEVEL HARMLESS.\n' +
  'ENDCLASS.\nCLASS ltc_test IMPLEMENTATION.\nENDCLASS.';

interface CapturedRequest {
  url: string;
  method: string;
  sessionType?: string;
}

/**
 * Minimal IAbapConnection stand-in. Only the surface the chains touch is
 * implemented; makeAdtRequest replicates AbstractAbapConnection's rule of
 * emitting `x-sap-adt-sessiontype: stateful` exactly when session mode is
 * stateful, then records the effective header for assertions.
 */
class FakeConnection {
  sessionMode: 'stateful' | 'stateless' = 'stateless';
  captured: CapturedRequest[] = [];

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
    const effective: Record<string, string> = { ...(headers || {}) };
    if (this.sessionMode === 'stateful') {
      effective['x-sap-adt-sessiontype'] = 'stateful';
    }
    this.captured.push({
      url,
      method: String(method).toUpperCase(),
      sessionType: effective['x-sap-adt-sessiontype'],
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
    if (url.includes('_action=LOCK')) return ok(LOCK_XML);
    if (url.includes('_action=UNLOCK')) return ok('');
    if (url.includes('/checkruns')) return ok(CHECK_OK_XML);
    if (method === 'GET') return ok('CLASS zcl_x DEFINITION.\nENDCLASS.');
    return ok('');
  }
}

interface FamilyCase {
  name: string;
  run: (context: any) => Promise<any>;
  /** Matches the write request whose statelessness caused the HTTP 423. */
  isWrite: (r: CapturedRequest) => boolean;
  /** For direct client-method cases (no MCP result envelope). */
  direct?: boolean;
}

const CASES: FamilyCase[] = [
  {
    name: 'UpdateLocalTestClass',
    run: (ctx) =>
      handleUpdateLocalTestClass(ctx, {
        class_name: 'ZCL_SAH_TEST',
        test_class_code: TEST_CLASS_CODE,
      }),
    isWrite: (r) =>
      r.method === 'PUT' && r.url.includes('/includes/testclasses'),
  },
  {
    name: 'UpdateLocalTypes',
    run: (ctx) =>
      handleUpdateLocalTypes(ctx, {
        class_name: 'ZCL_SAH_TEST',
        local_types_code: 'CLASS lcl_helper DEFINITION.\nENDCLASS.',
      }),
    isWrite: (r) =>
      r.method === 'PUT' && r.url.includes('/includes/implementations'),
  },
  {
    name: 'UpdateLocalMacros',
    run: (ctx) =>
      handleUpdateLocalMacros(ctx, {
        class_name: 'ZCL_SAH_TEST',
        macros_code: 'DEFINE _add.\n  &1 = &1 + &2.\nEND-OF-DEFINITION.',
      }),
    isWrite: (r) => r.method === 'PUT' && r.url.includes('/includes/macros'),
  },
  {
    name: 'UpdateLocalDefinitions',
    run: (ctx) =>
      handleUpdateLocalDefinitions(ctx, {
        class_name: 'ZCL_SAH_TEST',
        definitions_code: 'TYPES ty_id TYPE c LENGTH 10.',
      }),
    isWrite: (r) =>
      r.method === 'PUT' && r.url.includes('/includes/definitions'),
  },
  {
    // Delegates to AdtLocalTestClass.update() full chain internally
    // (AdtCdsUnitTest.update -> adtLocalTestClass.update with
    // activateOnUpdate: true) — proves the transitive fix.
    name: 'UpdateCdsUnitTest',
    run: (ctx) =>
      handleUpdateCdsUnitTest(ctx, {
        class_name: 'ZCL_SAH_CDS_TEST',
        test_class_source: TEST_CLASS_CODE,
      }),
    isWrite: (r) =>
      r.method === 'PUT' && r.url.includes('/includes/testclasses'),
  },
  {
    // Full chain with TWO writes under one lock: main source PUT
    // (/source/main) then implementations include PUT. The window is
    // asserted through the SECOND write, so the main-source PUT and the
    // intermediate /checkruns POST are covered too.
    name: 'UpdateBehaviorImplementation',
    run: (ctx) =>
      handleUpdateBehaviorImplementation(ctx, {
        class_name: 'ZBP_SAH_TEST',
        behavior_definition: 'ZSAH_BDEF_TEST',
        implementation_code:
          'CLASS lhc_test DEFINITION INHERITING FROM cl_abap_behavior_handler.\nENDCLASS.',
        activate: false,
      }),
    isWrite: (r) =>
      r.method === 'PUT' &&
      r.url.includes('/includes/implementations') &&
      r.url.includes('lockHandle='),
  },
  {
    // Public vendored-client API named in the backlog (no MCP handler
    // drives it today) — exercised directly on the real AdtClient.
    name: 'AdtClass.updateTestClasses',
    direct: true,
    run: async (ctx) => {
      const client = createAdtClient(ctx.connection, undefined);
      // updateTestClasses is not part of the narrowed IAdtObject interface
      // that getClass() advertises — cast like the low-level handlers do.
      return (client.getClass() as any).updateTestClasses({
        className: 'ZCL_SAH_TEST',
        testClassCode: TEST_CLASS_CODE,
      });
    },
    isWrite: (r) =>
      r.method === 'PUT' && r.url.includes('/includes/testclasses'),
  },
];

describe('Vendored-client lock-chain stateful session (regression: invalid lock handle / HTTP 423)', () => {
  for (const c of CASES) {
    it(`${c.name} keeps the connection stateful from lock through the write`, async () => {
      const connection = new FakeConnection();
      const context = { connection, logger: undefined } as any;

      const result = await c.run(context);

      // Chain must succeed against the mocked backend.
      if (c.direct) {
        expect(result).toBeDefined();
      } else {
        expect(result.isError).toBeFalsy();
      }

      const reqs = connection.captured;

      // The lock must have been acquired statefully (sanity).
      const lockIdx = reqs.findIndex((r) => r.url.includes('_action=LOCK'));
      expect(lockIdx).toBeGreaterThanOrEqual(0);
      expect(reqs[lockIdx].sessionType).toBe('stateful');

      // The write must exist and come after the lock.
      const writeIdx = reqs.findIndex(c.isWrite);
      expect(writeIdx).toBeGreaterThan(lockIdx);

      // EVERY request from the lock through the write must ride the same
      // stateful session — one stateless request in this window is enough
      // to tear the session down and evaporate the ENQUEUE lock.
      for (const r of reqs.slice(lockIdx, writeIdx + 1)) {
        expect(`${r.method} ${r.url} -> ${r.sessionType}`).toBe(
          `${r.method} ${r.url} -> stateful`,
        );
      }
    });
  }
});
