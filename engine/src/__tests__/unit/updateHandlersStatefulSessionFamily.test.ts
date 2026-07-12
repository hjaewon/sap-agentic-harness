/**
 * Family regression test for the lock-session bug (vsp issue #88 class) across
 * every remaining high-level Update handler that orchestrates an inline
 * lock -> (intermediate request(s)) -> write PUT chain:
 *
 *   UpdateView, UpdateServiceDefinition, UpdateFunctionModule,
 *   UpdateFunctionGroup, UpdateMetadataExtension, UpdateBehaviorDefinition,
 *   UpdateTable, UpdateStructure, UpdateDomain, UpdateDataElement
 *
 * (UpdateClass / UpdateInterface / UpdateProgram are covered by their own
 * updateXxxStatefulSession.test.ts files — 4.13.3 / 4.13.4.)
 *
 * SAP-independent: drives each real handler through the real AdtClient over a
 * fake IAbapConnection whose makeAdtRequest mirrors AbstractAbapConnection's
 * header injection (it stamps `x-sap-adt-sessiontype: stateful` whenever the
 * connection's session mode is stateful) and captures every outbound request.
 *
 * The bug: every wrapper's lock() does setSessionType('stateful') -> lock ->
 * setSessionType('stateless'), so the connection comes back STATELESS. The
 * low-level update branch (options.lockHandle provided) performs the raw
 * write with no session pin at all, and several handlers also issue
 * intermediate requests between lock and PUT (pre-write /checkruns POSTs for
 * view/table/structure, read-modify-write GETs for domain/dataElement/
 * functionGroup). On systems that recycle the HTTP connection between
 * requests (e.g. IDES) SAP routes a stateless request through a fresh work
 * process, tears the stateful session down, the ENQUEUE lock evaporates, and
 * the write fails with "resource not locked (invalid lock handle)" (HTTP 423).
 *
 * The guard (setSessionType('stateful') immediately after the inline lock)
 * pins the session so EVERY request from the lock through the write PUT rides
 * the same stateful session — which is exactly what this test asserts.
 */

// Disable the AdtClient accept-header negotiation wrapper so the fake
// connection's makeAdtRequest is invoked verbatim and capture is deterministic.
process.env.ADT_ACCEPT_CORRECTION = 'false';
// Domain / data-element handlers fall back to a different ECC path when
// SAP_VERSION=ECC — make sure the standard path is under test.
delete process.env.SAP_VERSION;

import { handleUpdateBehaviorDefinition } from '../../handlers/behavior_definition/high/handleUpdateBehaviorDefinition';
import { handleUpdateDataElement } from '../../handlers/data_element/high/handleUpdateDataElement';
import { handleUpdateMetadataExtension } from '../../handlers/ddlx/high/handleUpdateMetadataExtension';
import { handleUpdateDomain } from '../../handlers/domain/high/handleUpdateDomain';
import { handleUpdateFunctionGroup } from '../../handlers/function/high/handleUpdateFunctionGroup';
import { handleUpdateFunctionModule } from '../../handlers/function/high/handleUpdateFunctionModule';
import { handleUpdateServiceDefinition } from '../../handlers/service_definition/high/handleUpdateServiceDefinition';
import { handleUpdateStructure } from '../../handlers/structure/high/handleUpdateStructure';
import { handleUpdateTable } from '../../handlers/table/high/handleUpdateTable';
import { handleUpdateView } from '../../handlers/view/high/handleUpdateView';

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

// Minimal current-object XML for the read-modify-write update paths.
const DOMAIN_XML =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<doma:domain xmlns:doma="http://www.sap.com/adt/ddic/domains" xmlns:adtcore="http://www.sap.com/adt/core" adtcore:name="ZSAH_DOMA_TEST" adtcore:description="old description">' +
  '<doma:content><doma:typeInformation><doma:datatype>CHAR</doma:datatype><doma:length>10</doma:length><doma:decimals>0</doma:decimals></doma:typeInformation>' +
  '<doma:outputInformation/><doma:valueTableRef/><doma:fixValues/></doma:content>' +
  '</doma:domain>';

const DTEL_XML =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<dtel:dataElement xmlns:dtel="http://www.sap.com/adt/ddic/dataelements" xmlns:adtcore="http://www.sap.com/adt/core" adtcore:name="ZSAH_DTEL_TEST" adtcore:description="old description">' +
  '<dtel:typeKind>domain</dtel:typeKind><dtel:typeName>ZSAH_DOMA_TEST</dtel:typeName>' +
  '<dtel:shortFieldLabel>old</dtel:shortFieldLabel>' +
  '</dtel:dataElement>';

const FUGR_XML =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<group:abapFunctionGroup xmlns:group="http://www.sap.com/adt/functions/groups" xmlns:adtcore="http://www.sap.com/adt/core" adtcore:name="ZSAH_FG_TEST" adtcore:description="old description"/>';

interface CapturedRequest {
  url: string;
  method: string;
  sessionType?: string;
}

/**
 * Minimal IAbapConnection stand-in. Only the surface the update chains touch
 * is implemented; makeAdtRequest replicates AbstractAbapConnection's rule of
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
    if (method === 'GET' && url.includes('/ddic/domains/'))
      return ok(DOMAIN_XML);
    if (method === 'GET' && url.includes('/ddic/dataelements/'))
      return ok(DTEL_XML);
    if (method === 'GET' && url.includes('/functions/groups/'))
      return ok(FUGR_XML);
    return ok('');
  }
}

interface FamilyCase {
  name: string;
  run: (context: any) => Promise<any>;
  /** Matches the write request whose statelessness caused the HTTP 423. */
  isWrite: (r: CapturedRequest) => boolean;
}

const CASES: FamilyCase[] = [
  {
    name: 'UpdateView',
    run: (ctx) =>
      handleUpdateView(ctx, {
        view_name: 'ZSAH_V_TEST',
        ddl_source:
          'define view entity ZSAH_V_TEST as select from t000 { key mandt }',
        activate: false,
      }),
    isWrite: (r) =>
      r.method === 'PUT' &&
      r.url.includes('/ddic/ddl/sources/') &&
      r.url.includes('/source/main'),
  },
  {
    name: 'UpdateServiceDefinition',
    run: (ctx) =>
      handleUpdateServiceDefinition(ctx, {
        service_definition_name: 'ZSAH_SRVD_TEST',
        source_code: 'define service ZSAH_SRVD_TEST { expose ZSAH_V_TEST; }',
        activate: false,
      }),
    isWrite: (r) => r.method === 'PUT' && r.url.includes('/ddic/srvd/sources/'),
  },
  {
    name: 'UpdateFunctionModule',
    run: (ctx) =>
      handleUpdateFunctionModule(ctx, {
        function_module_name: 'Z_SAH_FM_TEST',
        function_group_name: 'ZSAH_FG_TEST',
        source_code: 'FUNCTION z_sah_fm_test.\nENDFUNCTION.',
      }),
    isWrite: (r) =>
      r.method === 'PUT' &&
      r.url.includes('/fmodules/') &&
      r.url.includes('/source/main'),
  },
  {
    name: 'UpdateFunctionGroup',
    run: (ctx) =>
      handleUpdateFunctionGroup(ctx, {
        function_group_name: 'ZSAH_FG_TEST',
        description: 'new description',
      }),
    isWrite: (r) =>
      r.method === 'PUT' &&
      r.url.includes('/functions/groups/') &&
      !r.url.includes('_action='),
  },
  {
    name: 'UpdateMetadataExtension',
    run: (ctx) =>
      handleUpdateMetadataExtension(ctx, {
        name: 'ZSAH_DDLX_TEST',
        source_code:
          '@Metadata.layer: #CUSTOMER annotate view ZSAH_V_TEST with { mandt; }',
        activate: false,
      }),
    isWrite: (r) => r.method === 'PUT' && r.url.includes('/ddic/ddlx/sources/'),
  },
  {
    name: 'UpdateBehaviorDefinition',
    run: (ctx) =>
      handleUpdateBehaviorDefinition(ctx, {
        name: 'ZSAH_BDEF_TEST',
        source_code:
          'managed implementation in class zbp_sah_test unique; define behavior for ZSAH_V_TEST {}',
        activate: false,
      }),
    isWrite: (r) =>
      r.method === 'PUT' && r.url.includes('/bo/behaviordefinitions/'),
  },
  {
    name: 'UpdateTable',
    run: (ctx) =>
      handleUpdateTable(ctx, {
        table_name: 'ZSAH_TAB_TEST',
        ddl_code:
          'define table zsah_tab_test { key client : abap.clnt; key id : abap.char(10); }',
        activate: false,
      }),
    isWrite: (r) =>
      r.method === 'PUT' &&
      r.url.includes('/ddic/tables/') &&
      r.url.includes('/source/main'),
  },
  {
    name: 'UpdateStructure',
    run: (ctx) =>
      handleUpdateStructure(ctx, {
        structure_name: 'ZSAH_STRU_TEST',
        ddl_code: 'define structure zsah_stru_test { id : abap.char(10); }',
        activate: false,
      }),
    isWrite: (r) =>
      r.method === 'PUT' &&
      r.url.includes('/ddic/structures/') &&
      r.url.includes('/source/main'),
  },
  {
    name: 'UpdateDomain',
    run: (ctx) =>
      handleUpdateDomain(ctx, {
        domain_name: 'ZSAH_DOMA_TEST',
        package_name: '$TMP',
        description: 'new description',
        activate: false,
      }),
    isWrite: (r) =>
      r.method === 'PUT' &&
      r.url.includes('/ddic/domains/') &&
      r.url.includes('lockHandle='),
  },
  {
    name: 'UpdateDataElement',
    run: (ctx) =>
      handleUpdateDataElement(ctx, {
        data_element_name: 'ZSAH_DTEL_TEST',
        package_name: '$TMP',
        description: 'new description',
        activate: false,
      }),
    isWrite: (r) =>
      r.method === 'PUT' &&
      r.url.includes('/ddic/dataelements/') &&
      r.url.includes('lockHandle='),
  },
];

describe('Update-handler family stateful lock session (regression: invalid lock handle / HTTP 423)', () => {
  for (const c of CASES) {
    it(`${c.name} keeps the connection stateful from lock through the write`, async () => {
      const connection = new FakeConnection();
      const context = { connection, logger: undefined } as any;

      const result = await c.run(context);

      // Handler must succeed against the mocked backend.
      expect(result.isError).toBeFalsy();

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
