/**
 * Regression tests for CreateStructure REAL field generation (backlog 5-13
 * layer 1 Wave 2, item 3 + item 11-①).
 *
 * BEFORE: the handler discarded the required `fields` input and called
 *   create({ ddlCode: '' }) — an empty structure shell — then reported
 *   success. Read-back showed no fields: a false success.
 *
 * AFTER: the handler generates DDIC DDL from the fields/includes
 *   (generateStructureDdl), and applies it under lock via a real
 *   create → check-with-source → lock → update(ddlCode) → unlock chain.
 *   An incomplete spec fails BEFORE any object is created (no partial
 *   creation), and the generated header carries
 *   @AbapCatalog.enhancement.category : #NOT_EXTENSIBLE (item 11-①).
 *
 * SAP-independent: drives the REAL handler through the real AdtClient over a
 * fake connection that answers /checkruns differently for source vs no-source
 * (mirroring live SAP, same shape as updateStructureCheckSource.test.ts).
 *
 * Reverse-verify: restore create({ ddlCode: '' }) with no update chain and the
 * "fields transmitted" + "lock brackets the update PUT" cases fail; drop the
 * pre-create generateStructureDdl fail-fast and the incomplete-spec case fails.
 */

process.env.ADT_ACCEPT_CORRECTION = 'false';
delete process.env.SAP_VERSION;
delete process.env.SAP_SYSTEM_TYPE;

import { handleCreateStructure } from '../handlers/structure/high/handleCreateStructure';
import { generateStructureDdl } from '../lib/structureDdl';

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

interface CapturedRequest {
  url: string;
  method: string;
  body: string;
}

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
    const { url, method, data } = options;
    const body = typeof data === 'string' ? data : '';
    this.captured.push({ url, method: String(method).toUpperCase(), body });
    const ok = (payload: string) => ({
      status: 200,
      statusText: 'OK',
      data: payload,
      headers: {},
    });
    if (url.includes('_action=LOCK')) return ok(LOCK_XML);
    if (url.includes('_action=UNLOCK')) return ok('');
    if (url.includes('/checkruns')) return ok(CHECK_OK_XML);
    // systeminformation (logon language), validate, create POST, source PUT,
    // activation — all tolerate an empty 200.
    return ok('');
  }
}

const checkrunsWithSource = (c: FakeConnection) =>
  c.captured.filter(
    (r) =>
      r.method === 'POST' &&
      r.url.includes('/checkruns') &&
      r.body.includes('chkrun:content'),
  );
const sourcePuts = (c: FakeConnection) =>
  c.captured.filter(
    (r) =>
      r.method === 'PUT' &&
      r.url.includes('/ddic/structures/') &&
      r.url.includes('/source/main'),
  );

describe('CreateStructure generates and applies real fields (backlog 5-13 W2 item 3)', () => {
  it('generates DDL from the fields and transmits it (check-with-source), including enhancement.category', async () => {
    const connection = new FakeConnection();
    const context = { connection, logger: undefined } as any;

    const result = await handleCreateStructure(context, {
      structure_name: 'ZSAH_S_TEST',
      package_name: '$TMP',
      fields: [
        { name: 'ID', data_type: 'CHAR', length: 10 },
        { name: 'AMOUNT', data_type: 'DEC', length: 15, decimals: 2 },
      ],
    });

    expect(result.isError).toBeFalsy();

    // The exact generated DDL — with the real field lines and the mandatory
    // enhancement.category header (item 11-①) — is what we expect on the wire.
    // The handler passes args.description (here undefined) to the generator, so
    // no @EndUserText.label is emitted for this input.
    const expectedDdl = generateStructureDdl({
      structureName: 'ZSAH_S_TEST',
      fields: [
        { name: 'ID', data_type: 'CHAR', length: 10 },
        { name: 'AMOUNT', data_type: 'DEC', length: 15, decimals: 2 },
      ],
    });
    expect(expectedDdl).toContain('id : abap.char(10);');
    expect(expectedDdl).toContain('amount : abap.dec(15,2);');
    expect(expectedDdl).toContain(
      '@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE',
    );

    // It was validated with-source — proof the real fields were built and sent,
    // not an empty shell. (base64 body, same shape as updateStructureCheckSource.)
    const withSource = checkrunsWithSource(connection);
    expect(withSource.length).toBeGreaterThan(0);
    const b64 = Buffer.from(expectedDdl, 'utf-8').toString('base64');
    expect(withSource.some((r) => r.body.includes(b64))).toBe(true);
  });

  it('applies the generated DDL under a real lock — the lock brackets a source PUT (no longer a dead pair)', async () => {
    const connection = new FakeConnection();
    const context = { connection, logger: undefined } as any;

    const result = await handleCreateStructure(context, {
      structure_name: 'ZSAH_S_TEST',
      package_name: '$TMP',
      fields: [{ name: 'ID', data_type: 'CHAR', length: 10 }],
    });

    expect(result.isError).toBeFalsy();

    // Exactly one source PUT applied the DDL.
    expect(sourcePuts(connection).length).toBe(1);

    // It sits BETWEEN a LOCK and an UNLOCK (the lock is not dead).
    const idxLock = connection.captured.findIndex((r) =>
      r.url.includes('_action=LOCK'),
    );
    const idxPut = connection.captured.findIndex(
      (r) => r.method === 'PUT' && r.url.includes('/source/main'),
    );
    const idxUnlock = connection.captured.findIndex((r) =>
      r.url.includes('_action=UNLOCK'),
    );
    expect(idxLock).toBeGreaterThanOrEqual(0);
    expect(idxUnlock).toBeGreaterThanOrEqual(0);
    expect(idxLock).toBeLessThan(idxPut);
    expect(idxPut).toBeLessThan(idxUnlock);
  });

  it('fails an incomplete spec BEFORE creating anything (no partial creation)', async () => {
    const connection = new FakeConnection();
    const context = { connection, logger: undefined } as any;

    // The generator throws before validate/create; the handler surfaces it as
    // an InvalidParams McpError (re-thrown by the outer catch, per contract).
    await expect(
      handleCreateStructure(context, {
        structure_name: 'ZSAH_S_TEST',
        package_name: '$TMP',
        // CHAR without a length — the generator cannot resolve it.
        fields: [{ name: 'NAME', data_type: 'CHAR' }],
      }),
    ).rejects.toThrow(
      /Cannot generate structure DDL[\s\S]*requires a positive/,
    );

    // Nothing hit the wire — no shell was created.
    expect(connection.captured).toEqual([]);
  });
});
