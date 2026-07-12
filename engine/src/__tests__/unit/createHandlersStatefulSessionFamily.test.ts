/**
 * Family regression test for the lock-session bug (vsp issue #88 class) across
 * every high-level Create handler that orchestrates an inline
 * create -> lock -> (attribute-write / post-create check) -> unlock chain:
 *
 *   CreateDomain, CreateDataElement, CreateTable, CreateMetadataExtension,
 *   CreateBehaviorDefinition, CreateInclude
 *
 * (CreateStructure locks and immediately unlocks with no request in between —
 * the mechanism does not apply there, so it carries no pin and no test case.
 * The Update-handler family is covered by updateHandlersStatefulSessionFamily
 * and the per-handler updateXxxStatefulSession tests — 4.13.3/4.13.4/4.13.5.)
 *
 * SAP-independent: drives each real handler through the real AdtClient over a
 * fake IAbapConnection whose makeAdtRequest mirrors AbstractAbapConnection's
 * header injection (it stamps `x-sap-adt-sessiontype: stateful` whenever the
 * connection's session mode is stateful) and captures every outbound request.
 *
 * The bug (live-proven on IDES during the 4.13.5 red phase: CreateDomain and
 * CreateDataElement failed mid-chain with ExceptionResourceInvalidLockHandle,
 * leaving half-created skeletons): the wrapper's lock() resets the connection
 * to stateless, so the requests issued while the ENQUEUE lock is held —
 * read-modify-write GETs + attribute PUT (domain/data element), skeleton PUT
 * (table), post-create /checkruns POST (DDLX/BDEF), main-program source PUT
 * (include) — went out stateless. On systems that recycle the HTTP connection
 * between requests SAP tears the stateful session down, the lock evaporates,
 * and the chain fails with "resource not locked (invalid lock handle)"
 * (HTTP 423).
 *
 * The guard (keeping the session stateful from the inline lock through the
 * unlock) pins every request in that window — which is what this test asserts.
 */

// Disable the AdtClient accept-header negotiation wrapper so the fake
// connection's makeAdtRequest is invoked verbatim and capture is deterministic.
process.env.ADT_ACCEPT_CORRECTION = 'false';
// Domain / data-element handlers fall back to a different ECC path when
// SAP_VERSION=ECC — make sure the standard path is under test.
delete process.env.SAP_VERSION;

import { handleCreateBehaviorDefinition } from '../../handlers/behavior_definition/high/handleCreateBehaviorDefinition';
import { handleCreateDataElement } from '../../handlers/data_element/high/handleCreateDataElement';
import { handleCreateMetadataExtension } from '../../handlers/ddlx/high/handleCreateMetadataExtension';
import { handleCreateDomain } from '../../handlers/domain/high/handleCreateDomain';
import { handleCreateInclude } from '../../handlers/include/high/handleCreateInclude';
import { handleCreateTable } from '../../handlers/table/high/handleCreateTable';

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

const MAIN_PROGRAM_SOURCE = 'REPORT zsah_main_test.\n';

interface CapturedRequest {
  url: string;
  method: string;
  sessionType?: string;
}

/**
 * Minimal IAbapConnection stand-in. Only the surface the create chains touch
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
    if (
      method === 'GET' &&
      url.includes('/programs/programs/') &&
      url.includes('/source/main')
    )
      return ok(MAIN_PROGRAM_SOURCE);
    return ok('');
  }
}

interface FamilyCase {
  name: string;
  run: (context: any) => Promise<any>;
}

const CASES: FamilyCase[] = [
  {
    name: 'CreateDomain',
    run: (ctx) =>
      handleCreateDomain(ctx, {
        domain_name: 'ZSAH_DOMA_TEST',
        package_name: '$TMP',
        description: 'stateful family test',
        datatype: 'CHAR',
        length: 10,
        activate: false,
      }),
  },
  {
    name: 'CreateDataElement',
    run: (ctx) =>
      handleCreateDataElement(ctx, {
        data_element_name: 'ZSAH_DTEL_TEST',
        package_name: '$TMP',
        description: 'stateful family test',
        type_kind: 'domain',
        type_name: 'ZSAH_DOMA_TEST',
        activate: false,
      }),
  },
  {
    name: 'CreateTable',
    run: (ctx) =>
      handleCreateTable(ctx, {
        table_name: 'ZSAH_TAB_TEST',
        package_name: '$TMP',
        description: 'stateful family test',
      }),
  },
  {
    name: 'CreateMetadataExtension',
    run: (ctx) =>
      handleCreateMetadataExtension(ctx, {
        name: 'ZSAH_DDLX_TEST',
        package_name: '$TMP',
        description: 'stateful family test',
        activate: false,
      }),
  },
  {
    name: 'CreateBehaviorDefinition',
    run: (ctx) =>
      handleCreateBehaviorDefinition(ctx, {
        name: 'ZSAH_BDEF_TEST',
        package_name: '$TMP',
        description: 'stateful family test',
        root_entity: 'ZSAH_V_TEST',
        implementation_type: 'managed',
        activate: false,
      }),
  },
  {
    name: 'CreateInclude',
    run: (ctx) =>
      handleCreateInclude(ctx, {
        include_name: 'ZSAH_INC_TEST',
        main_program: 'ZSAH_MAIN_TEST',
        package_name: '$TMP',
        description: 'stateful family test',
        activate_main_program: false,
        skip_program_tree_check: true,
      }),
  },
];

describe('Create-handler family stateful lock session (regression: invalid lock handle / HTTP 423)', () => {
  for (const c of CASES) {
    it(`${c.name} keeps the connection stateful from the inline lock through the unlock`, async () => {
      const connection = new FakeConnection();
      const context = { connection, logger: undefined } as any;

      const result = await c.run(context);

      // Handler must succeed against the mocked backend.
      expect(result.isError).toBeFalsy();

      const reqs = connection.captured;

      // The handler's own lock/unlock pair is the LAST unlock and the last
      // lock before it (wrapper-internal create chains may lock earlier).
      const unlockIdx = reqs
        .map((r, i) => (r.url.includes('_action=UNLOCK') ? i : -1))
        .filter((i) => i >= 0)
        .pop();
      expect(unlockIdx).toBeDefined();
      const lockIdx = reqs
        .slice(0, unlockIdx)
        .map((r, i) => (r.url.includes('_action=LOCK') ? i : -1))
        .filter((i) => i >= 0)
        .pop();
      expect(lockIdx).toBeDefined();

      // Sanity: at least one request rides between lock and unlock — that is
      // the request whose statelessness tore the session down pre-fix.
      expect((unlockIdx as number) - (lockIdx as number)).toBeGreaterThan(1);

      // EVERY request from the lock through the unlock must ride the same
      // stateful session — one stateless request in this window is enough
      // to tear the session down and evaporate the ENQUEUE lock.
      for (const r of reqs.slice(lockIdx, (unlockIdx as number) + 1)) {
        expect(`${r.method} ${r.url} -> ${r.sessionType}`).toBe(
          `${r.method} ${r.url} -> stateful`,
        );
      }
    });
  }
});
