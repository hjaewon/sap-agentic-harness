/**
 * Regression tests for the real-data gate honesty Wave (JNC lesson pack items
 * 1 + 9 + 8 — backlog 5-13 layer 1 Wave 1).
 *
 * item 1 — SQL self-closing NULL cell drop/shift. The cell regex
 *   `/<dataPreview:data[^>]*>(.*?)<\/dataPreview:data>/g` requires a closing
 *   tag, so a self-closing `<dataPreview:data/>` (a nil / NULL cell) is not
 *   captured and the regex spans forward to the NEXT column cell's closing tag,
 *   swallowing it — the column array comes up short and every following row in
 *   that column SHIFTS. `parseSqlQueryXml` is shared by GetSqlQuery AND
 *   GetTableContents, so both real-data gate tools are vulnerable.
 *
 * item 9 — self-contradicting meta. The response only emitted `total_rows`.
 *   It now also reports `returned_row_count` (rows actually parsed),
 *   `truncated` (row_number cap hit OR server total > returned), and
 *   `server_total_rows` (server-reported total when the XML provides it).
 *
 * item 8 — sporadic HTTP 400 on complex queries. The handler called the ADT
 *   client once and threw immediately; it now retries exactly once on a 400.
 *
 * SAP-independent: `parseSqlQueryXml` is a pure function, and the handler tests
 * drive the REAL handlers over a fake connection. Reverse-verify: revert the
 * self-closing regex (or the retry / meta fields) and the pinned cases fail.
 */

import {
  handleGetSqlQuery,
  parseSqlQueryXml,
} from '../handlers/system/readonly/handleGetSqlQuery';
import { handleGetTableContents } from '../handlers/table/readonly/handleGetTableContents';

// ---- XML fixture builders (shape of a real ADT freestyle / DDIC preview) ----

/** A single data cell: null → self-closing (nil NULL); string → wrapped value. */
const cell = (v: string | null): string =>
  v === null
    ? '<dataPreview:data/>'
    : `<dataPreview:data>${v}</dataPreview:data>`;

/** One `<dataPreview:columns>` block: metadata + its ordered data cells. */
const columnBlock = (
  name: string,
  type: string,
  length: number,
  cells: Array<string | null>,
): string =>
  '<dataPreview:columns>' +
  `<dataPreview:metadata dataPreview:name="${name}" dataPreview:type="${type}" ` +
  `dataPreview:description="${name} description" dataPreview:length="${length}"/>` +
  `<dataPreview:dataSet>${cells.map(cell).join('')}</dataPreview:dataSet>` +
  '</dataPreview:columns>';

const wrapTableData = (totalRows: number, columns: string[]): string =>
  '<?xml version="1.0" encoding="utf-8"?>' +
  '<dataPreview:tableData xmlns:dataPreview="http://www.sap.com/adt/datapreview">' +
  `<dataPreview:totalRows>${totalRows}</dataPreview:totalRows>` +
  '<dataPreview:queryExecutionTime>1.0</dataPreview:queryExecutionTime>' +
  columns.join('') +
  '</dataPreview:tableData>';

function textOf(result: any): string {
  return result?.content?.find((c: any) => c.type === 'text')?.text ?? '';
}

describe('parseSqlQueryXml — item 1: self-closing NULL cells keep row alignment', () => {
  it('places a self-closing NULL in its own row instead of shifting the next value up', () => {
    // BNAME: [null, "BOB", null]. The old regex swallowed the leading
    // self-closing cell together with "BOB", yielding ["BOB"] and mis-placing
    // "BOB" onto the MANDT="000" row.
    const xml = wrapTableData(3, [
      columnBlock('MANDT', 'C', 3, ['000', '001', '100']),
      columnBlock('BNAME', 'C', 12, [null, 'BOB', null]),
    ]);

    const parsed = parseSqlQueryXml(xml, 'SELECT ... FROM T000', 100);

    expect(parsed.rows.length).toBe(3);
    expect(parsed.rows[0]).toEqual({ MANDT: '000', BNAME: null });
    expect(parsed.rows[1]).toEqual({ MANDT: '001', BNAME: 'BOB' });
    expect(parsed.rows[2]).toEqual({ MANDT: '100', BNAME: null });
  });

  it('distinguishes a self-closing NULL cell from an empty CHAR cell that holds a space', () => {
    // `<data/>` → null (nil); `<data> </data>` → " " (a real blank CHAR value
    // that must be preserved, not collapsed to null).
    const xml = wrapTableData(2, [
      columnBlock('K', 'C', 1, ['a', 'b']),
      columnBlock('V', 'C', 4, [null, ' ']),
    ]);

    const parsed = parseSqlQueryXml(xml, 'SELECT ... FROM T000', 100);

    expect(parsed.rows[0]).toEqual({ K: 'a', V: null });
    expect(parsed.rows[1]).toEqual({ K: 'b', V: ' ' });
  });

  it('handles an all-NULL (all self-closing) column as all nulls with correct length', () => {
    const xml = wrapTableData(3, [
      columnBlock('MANDT', 'C', 3, ['000', '001', '100']),
      columnBlock('X', 'C', 5, [null, null, null]),
    ]);

    const parsed = parseSqlQueryXml(xml, 'SELECT ... FROM T000', 100);

    expect(parsed.rows.map((r: any) => r.X)).toEqual([null, null, null]);
    expect(parsed.rows.map((r: any) => r.MANDT)).toEqual(['000', '001', '100']);
  });
});

describe('parseSqlQueryXml — item 1: ragged-column warning field', () => {
  it('does NOT flag ragged_columns when self-closing cells keep columns aligned', () => {
    const xml = wrapTableData(3, [
      columnBlock('MANDT', 'C', 3, ['000', '001', '100']),
      columnBlock('BNAME', 'C', 12, [null, 'BOB', null]),
    ]);

    const parsed = parseSqlQueryXml(xml, 'SELECT ... FROM T000', 100);

    expect(parsed.ragged_columns).toBeUndefined();
  });

  it('flags ragged_columns with the per-column shape when the XML is genuinely unaligned', () => {
    // EXTRA has only 2 cells while MANDT has 3 — not a self-closing artifact but
    // a truly ragged response the parser cannot align. It must be surfaced, not
    // silently shifted.
    const xml = wrapTableData(3, [
      columnBlock('MANDT', 'C', 3, ['000', '001', '100']),
      columnBlock('EXTRA', 'C', 4, ['X', 'Y']),
    ]);

    const parsed = parseSqlQueryXml(xml, 'SELECT ... FROM T000', 100);

    expect(typeof parsed.ragged_columns).toBe('string');
    expect(parsed.ragged_columns).toContain('MANDT:3');
    expect(parsed.ragged_columns).toContain('EXTRA:2');
    // Rows are still returned at max length (last EXTRA is null).
    expect(parsed.rows.length).toBe(3);
    expect(parsed.rows[2].EXTRA).toBeNull();
  });
});

describe('parseSqlQueryXml — item 9: honest row-count meta', () => {
  it('reports returned_row_count and server_total_rows, truncated=true when server total exceeds returned', () => {
    const xml = wrapTableData(10, [
      columnBlock('MANDT', 'C', 3, ['000', '001']),
    ]);

    const parsed = parseSqlQueryXml(xml, 'SELECT MANDT FROM T000', 100);

    expect(parsed.returned_row_count).toBe(2);
    expect(parsed.server_total_rows).toBe(10);
    expect(parsed.truncated).toBe(true);
  });

  it('reports truncated=true when the row_number cap is exactly reached', () => {
    const xml = wrapTableData(2, [
      columnBlock('MANDT', 'C', 3, ['000', '001']),
    ]);

    const parsed = parseSqlQueryXml(xml, 'SELECT MANDT FROM T000', 2);

    expect(parsed.returned_row_count).toBe(2);
    expect(parsed.truncated).toBe(true);
  });

  it('reports truncated=false when all rows fit under the cap and server total matches', () => {
    const xml = wrapTableData(2, [
      columnBlock('MANDT', 'C', 3, ['000', '001']),
    ]);

    const parsed = parseSqlQueryXml(xml, 'SELECT MANDT FROM T000', 100);

    expect(parsed.returned_row_count).toBe(2);
    expect(parsed.server_total_rows).toBe(2);
    expect(parsed.truncated).toBe(false);
  });
});

// ---- Fake connection to drive the real handlers (SAP-independent) ----

const SQL_OK_XML = wrapTableData(1, [columnBlock('MANDT', 'C', 3, ['000'])]);

type CallAction = 'throw400' | 'throw500' | 'ok';

class SqlFakeConnection {
  sessionMode: 'stateful' | 'stateless' = 'stateless';
  freestyleCalls = 0;
  constructor(private readonly plan: CallAction[]) {}
  setSessionType(t: 'stateful' | 'stateless') {
    this.sessionMode = t;
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
    const url = String(options.url);
    if (url.includes('/datapreview/freestyle')) {
      const action = this.plan[this.freestyleCalls] ?? 'ok';
      this.freestyleCalls++;
      if (action === 'throw400') {
        const e: any = new Error('Request failed with status code 400');
        e.response = { status: 400 };
        throw e;
      }
      if (action === 'throw500') {
        const e: any = new Error('Request failed with status code 500');
        e.response = { status: 500 };
        throw e;
      }
      return { status: 200, statusText: 'OK', data: SQL_OK_XML, headers: {} };
    }
    return { status: 200, statusText: 'OK', data: '', headers: {} };
  }
}

describe('handleGetSqlQuery — item 8: retry once on HTTP 400', () => {
  it('retries once and succeeds when the first attempt returns HTTP 400', async () => {
    const connection = new SqlFakeConnection(['throw400', 'ok']);
    const result = await handleGetSqlQuery(
      { connection, logger: undefined } as any,
      { sql_query: 'SELECT MANDT FROM T000', row_number: 10 },
    );
    expect(result.isError).toBeFalsy();
    expect(connection.freestyleCalls).toBe(2);
    const data = JSON.parse(textOf(result));
    expect(data.rows.length).toBe(1);
  });

  it('gives up after exactly one retry when the 400 persists', async () => {
    const connection = new SqlFakeConnection(['throw400', 'throw400']);
    const result = await handleGetSqlQuery(
      { connection, logger: undefined } as any,
      { sql_query: 'SELECT MANDT FROM T000', row_number: 10 },
    );
    expect(result.isError).toBeTruthy();
    expect(connection.freestyleCalls).toBe(2);
  });

  it('does NOT retry a non-400 error (e.g. HTTP 500)', async () => {
    const connection = new SqlFakeConnection(['throw500', 'ok']);
    const result = await handleGetSqlQuery(
      { connection, logger: undefined } as any,
      { sql_query: 'SELECT MANDT FROM T000', row_number: 10 },
    );
    expect(result.isError).toBeTruthy();
    expect(connection.freestyleCalls).toBe(1);
  });
});

// ---- GetTableContents reuses the same parser: prove the fix flows through ----

const TABLE_METADATA_XML =
  '<?xml version="1.0" encoding="utf-8"?>' +
  '<dataPreview:tableData xmlns:dataPreview="http://www.sap.com/adt/datapreview">' +
  '<dataPreview:metadata dataPreview:name="MANDT"/>' +
  '<dataPreview:metadata dataPreview:name="BNAME"/>' +
  '</dataPreview:tableData>';

class TableContentsFakeConnection {
  sessionMode: 'stateful' | 'stateless' = 'stateless';
  constructor(private readonly dataXml: string) {}
  setSessionType(t: 'stateful' | 'stateless') {
    this.sessionMode = t;
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
    const url = String(options.url);
    const ok = (data: string) => ({
      status: 200,
      statusText: 'OK',
      data,
      headers: {},
    });
    // /metadata must be matched before the generic /datapreview/ddic POST url.
    if (url.includes('/metadata')) return ok(TABLE_METADATA_XML);
    if (url.includes('/datapreview/ddic')) return ok(this.dataXml);
    return ok('');
  }
}

describe('handleGetTableContents — item 1: shared parser fix flows through', () => {
  it('keeps self-closing NULL cells row-aligned via the same parseSqlQueryXml', async () => {
    const dataXml = wrapTableData(3, [
      columnBlock('MANDT', 'C', 3, ['000', '001', '100']),
      columnBlock('BNAME', 'C', 12, [null, 'BOB', null]),
    ]);
    const connection = new TableContentsFakeConnection(dataXml);
    const result = await handleGetTableContents(
      { connection, logger: undefined } as any,
      { table_name: 'T000', max_rows: 100 },
    );
    expect(result.isError).toBeFalsy();
    const data = JSON.parse(textOf(result));
    expect(data.rows[0]).toEqual({ MANDT: '000', BNAME: null });
    expect(data.rows[1]).toEqual({ MANDT: '001', BNAME: 'BOB' });
    expect(data.rows[2]).toEqual({ MANDT: '100', BNAME: null });
    expect(data.returned_row_count).toBe(3);
  });
});
