/**
 * Regression tests for the create-payload logon-language mismatch
 * (HANDOFF §6 engine backlog 11-⑧, fixed in 4.13.10).
 *
 * Live-measured pathology on IDES (S/4HANA 2021, logon language CS):
 *  - The vendored create payloads hardcode adtcore:language="EN" /
 *    adtcore:masterLanguage="EN".
 *  - DDLS (CreateView): the create service HARD-REJECTS the payload with
 *    HTTP 400 "Sprache EN zum Anlegen der Beschreibung entspricht nicht
 *    Mastersprache CS" (T100 DDIC_ADT_DDLS/016) — no object is created.
 *  - DOMA/DTEL (CreateDomain/CreateDataElement): the create succeeds but SAP
 *    DROPS the description (the skeleton's GET XML carries no
 *    adtcore:description attribute at all), so the read-modify-write update
 *    step fails with "Die Beschreibung fehlt" (T100 SWB_TOOL/019) and leaves
 *    a half-created skeleton.
 *
 * The fix is dynamic, not another hardcoded language: the handlers resolve
 * the system's logon language from the live ADT system-information document
 * (`/sap/bc/adt/core/http/systeminformation` — the same source GetSystemInfo
 * reads, live-verified to return "CS" on the IDES box) and inject it into the
 * create payload; EN remains only as the discovery-unavailable fallback.
 *
 * Companion fix (same backlog item): the vendored patchXmlAttribute used by
 * the domain/data-element read-modify-write updates is replace-only, so the
 * description of an existing half-skeleton could never be repaired. It now
 * supports add-if-missing for adtcore:description, which these tests assert
 * via the real Update handlers over skeleton GET XML (the live repair
 * scenario for skeletons created by older bundles).
 *
 * SAP-independent: drives the real handlers through the real AdtClient over a
 * fake IAbapConnection (same pattern as createHandlersStatefulSessionFamily).
 */

process.env.ADT_ACCEPT_CORRECTION = 'false';
delete process.env.SAP_VERSION;

import { handleCreateDataElement } from '../../handlers/data_element/high/handleCreateDataElement';
import { handleUpdateDataElement } from '../../handlers/data_element/high/handleUpdateDataElement';
import { handleCreateDomain } from '../../handlers/domain/high/handleCreateDomain';
import { handleUpdateDomain } from '../../handlers/domain/high/handleUpdateDomain';
import { handleCreateView } from '../../handlers/view/high/handleCreateView';

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

// Modeled on the live IDES capture of a half-created skeleton: SAP stamps
// language/masterLanguage with the LOGON language and omits
// adtcore:description entirely.
const DOMAIN_SKELETON_XML =
  '<?xml version="1.0" encoding="utf-8"?>' +
  '<doma:domain adtcore:responsible="HUB2150" adtcore:masterLanguage="CS" adtcore:name="ZSAH_DOMA_TEST" adtcore:type="DOMA/DD" adtcore:version="new" adtcore:language="CS" xmlns:doma="http://www.sap.com/dictionary/domain" xmlns:adtcore="http://www.sap.com/adt/core">' +
  '<adtcore:packageRef adtcore:uri="/sap/bc/adt/packages/%24tmp" adtcore:type="DEVC/K" adtcore:name="$TMP"/>' +
  '<doma:content><doma:typeInformation><doma:datatype/><doma:length>000000</doma:length><doma:decimals>000000</doma:decimals></doma:typeInformation>' +
  '<doma:outputInformation><doma:length>000000</doma:length><doma:style>00</doma:style><doma:conversionExit/><doma:signExists>false</doma:signExists><doma:lowercase>false</doma:lowercase></doma:outputInformation>' +
  '<doma:valueInformation><doma:valueTableRef/><doma:appendExists>false</doma:appendExists><doma:fixValues/></doma:valueInformation></doma:content>' +
  '</doma:domain>';

const DTEL_SKELETON_XML =
  '<?xml version="1.0" encoding="utf-8"?>' +
  '<blue:wbobj xmlns:blue="http://www.sap.com/wbobj/dictionary/dtel" xmlns:adtcore="http://www.sap.com/adt/core" xmlns:dtel="http://www.sap.com/adt/dictionary/dataelements" adtcore:masterLanguage="CS" adtcore:name="ZSAH_DTEL_TEST" adtcore:type="DTEL/DE" adtcore:language="CS">' +
  '<adtcore:packageRef adtcore:name="$TMP"/>' +
  '<dtel:dataElement><dtel:typeKind>domain</dtel:typeKind><dtel:typeName>ZSAH_DOMA_TEST</dtel:typeName>' +
  '<dtel:dataType/><dtel:dataTypeLength>000000</dtel:dataTypeLength><dtel:dataTypeDecimals>000000</dtel:dataTypeDecimals>' +
  '<dtel:shortFieldLabel/><dtel:mediumFieldLabel/><dtel:longFieldLabel/><dtel:headingFieldLabel/>' +
  '</dtel:dataElement></blue:wbobj>';

interface CapturedRequest {
  url: string;
  method: string;
  data?: string;
}

class FakeConnection {
  sessionMode: 'stateful' | 'stateless' = 'stateless';
  captured: CapturedRequest[] = [];
  /** When false, the systeminformation endpoint 404s (fallback path). */
  systemInfoAvailable = true;
  /** Language advertised by the systeminformation endpoint. */
  systemLanguage = 'CS';

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
    const { url, method, data } = options;
    this.captured.push({
      url,
      method: String(method).toUpperCase(),
      data: typeof data === 'string' ? data : undefined,
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
    if (url.includes('/core/http/systeminformation')) {
      if (!this.systemInfoAvailable) {
        const err: any = new Error('Request failed with status code 404');
        err.response = { status: 404, data: '' };
        throw err;
      }
      return ok(
        JSON.stringify({
          systemID: 'S4H',
          client: '100',
          language: this.systemLanguage,
          userName: 'TESTER',
        }),
      );
    }
    if (url.includes('_action=LOCK')) return ok(LOCK_XML);
    if (url.includes('_action=UNLOCK')) return ok('');
    if (url.includes('/checkruns')) return ok(CHECK_OK_XML);
    if (method === 'GET' && url.includes('/ddic/domains/'))
      return ok(DOMAIN_SKELETON_XML);
    if (method === 'GET' && url.includes('/ddic/dataelements/'))
      return ok(DTEL_SKELETON_XML);
    return ok('');
  }

  /** The create POST for the given collection (excludes /validation). */
  createPost(collection: string): CapturedRequest | undefined {
    return this.captured.find(
      (r) =>
        r.method === 'POST' &&
        r.url.includes(collection) &&
        !r.url.includes('validation') &&
        !r.url.includes('/checkruns'),
    );
  }

  /** The write PUT for the given collection. */
  put(collection: string): CapturedRequest | undefined {
    return this.captured.find(
      (r) => r.method === 'PUT' && r.url.includes(collection),
    );
  }
}

function makeContext(connection: FakeConnection) {
  return { connection, logger: undefined } as any;
}

describe('Create-payload logon-language consistency (backlog 11-⑧)', () => {
  const CREATE_CASES = [
    {
      name: 'CreateDomain',
      collection: '/ddic/domains',
      run: (ctx: any) =>
        handleCreateDomain(ctx, {
          domain_name: 'ZSAH_DOMA_TEST',
          package_name: '$TMP',
          description: 'language family test',
          datatype: 'CHAR',
          length: 10,
          activate: false,
        }),
    },
    {
      name: 'CreateDataElement',
      collection: '/ddic/dataelements',
      run: (ctx: any) =>
        handleCreateDataElement(ctx, {
          data_element_name: 'ZSAH_DTEL_TEST',
          package_name: '$TMP',
          description: 'language family test',
          type_kind: 'domain',
          type_name: 'ZSAH_DOMA_TEST',
          activate: false,
        }),
    },
    {
      name: 'CreateView',
      collection: '/ddic/ddl/sources',
      run: (ctx: any) =>
        handleCreateView(ctx, {
          view_name: 'ZSAH_DDLS_TEST',
          package_name: '$TMP',
          description: 'language family test',
        }),
    },
  ] as const;

  for (const c of CREATE_CASES) {
    it(`${c.name} stamps the create payload with the system logon language (CS)`, async () => {
      const connection = new FakeConnection();
      const result = await c.run(makeContext(connection));
      expect(result.isError).toBeFalsy();

      const post = connection.createPost(c.collection);
      expect(post).toBeDefined();
      expect(post?.data).toContain('adtcore:language="CS"');
      expect(post?.data).toContain('adtcore:masterLanguage="CS"');
      expect(post?.data).not.toContain('adtcore:language="EN"');
    });

    it(`${c.name} falls back to EN when systeminformation is unavailable`, async () => {
      const connection = new FakeConnection();
      connection.systemInfoAvailable = false;
      const result = await c.run(makeContext(connection));
      expect(result.isError).toBeFalsy();

      const post = connection.createPost(c.collection);
      expect(post).toBeDefined();
      expect(post?.data).toContain('adtcore:language="EN"');
      expect(post?.data).toContain('adtcore:masterLanguage="EN"');
    });
  }
});

describe('Update repairs description-less skeletons (add-if-missing, backlog 11-⑧)', () => {
  it('UpdateDomain injects adtcore:description into a skeleton whose GET XML has none', async () => {
    const connection = new FakeConnection();
    const result = await handleUpdateDomain(makeContext(connection), {
      domain_name: 'ZSAH_DOMA_TEST',
      package_name: '$TMP',
      description: 'repaired description',
      datatype: 'CHAR',
      length: 10,
      activate: false,
    });
    expect(result.isError).toBeFalsy();

    const put = connection.put('/ddic/domains/');
    expect(put).toBeDefined();
    // The GET fixture has NO adtcore:description — with replace-only
    // patching the PUT body would still have none ("Die Beschreibung
    // fehlt"); add-if-missing must inject it.
    expect(put?.data).toContain('adtcore:description="repaired description"');
  });

  it('UpdateDataElement injects adtcore:description into a skeleton whose GET XML has none', async () => {
    const connection = new FakeConnection();
    const result = await handleUpdateDataElement(makeContext(connection), {
      data_element_name: 'ZSAH_DTEL_TEST',
      package_name: '$TMP',
      description: 'repaired description',
      type_kind: 'domain',
      type_name: 'ZSAH_DOMA_TEST',
      activate: false,
    });
    expect(result.isError).toBeFalsy();

    const put = connection.put('/ddic/dataelements/');
    expect(put).toBeDefined();
    expect(put?.data).toContain('adtcore:description="repaired description"');
  });
});
