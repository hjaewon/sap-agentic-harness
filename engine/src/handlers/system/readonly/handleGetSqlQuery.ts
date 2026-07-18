import type { ILogger } from '@babamba2/mcp-abap-adt-interfaces';
import { createAdtClient } from '../../../lib/clients';
import type { HandlerContext } from '../../../lib/handlers/interfaces';
import {
  activeProfile,
  checkTables,
  evaluateHits,
  extractTablesFromSql,
  isAggregateOnly,
  sqlHasTableSource,
} from '../../../lib/policy/tableBlocklist';
import { ErrorCode, McpError } from '../../../lib/utils';
import { writeResultToFile } from '../../../lib/writeResultToFile';
export const TOOL_DEFINITION = {
  name: 'GetSqlQuery',
  available_in: ['onprem', 'cloud'] as const,
  description:
    '[read-only] Execute ABAP SQL SELECT queries on database tables and CDS views via SAP ADT Data Preview API. Use for ad-hoc data retrieval, row counts, and filtered queries. Empty cells (including self-closing XML cells) are preserved as null in row order. Complex statements (e.g. 4-way joins, long IN lists) can fail with HTTP 400 — shorten table aliases or replace a long IN list with a BETWEEN range; a sporadic 400 (e.g. under concurrent calls) is retried once automatically. The response also reports returned_row_count (rows actually parsed), truncated (true when the row_number cap was hit or the server total exceeds it), and server_total_rows (server-reported total when the XML provides it).',
  inputSchema: {
    type: 'object',
    properties: {
      sql_query: {
        type: 'string',
        description: 'SQL query to execute',
      },
      row_number: {
        type: 'number',
        description: '[read-only] Maximum number of rows to return',
        default: 100,
      },
      acknowledge_risk: {
        type: 'boolean',
        description:
          "Set to true ONLY after the user has explicitly authorized row extraction from an 'ask'-tier protected table. The approval is logged to stderr for audit. Has no effect on 'deny'-tier tables.",
        default: false,
      },
    },
    required: ['sql_query'],
  },
} as const;

/**
 * Interface for SQL query execution response
 */
export interface SqlQueryResponse {
  sql_query: string;
  row_number: number;
  execution_time?: number;
  total_rows?: number;
  returned_row_count?: number;
  truncated?: boolean;
  server_total_rows?: number;
  ragged_columns?: string;
  columns: Array<{
    name: string;
    type: string;
    description?: string;
    length?: number;
  }>;
  rows: Array<Record<string, any>>;
}

/**
 * Parse SAP ADT XML response from freestyle SQL query and convert to JSON format
 * @param xmlData - Raw XML response from ADT
 * @param sqlQuery - Original SQL query
 * @param rowNumber - Number of rows requested
 * @returns Parsed SQL query response
 */
export function parseSqlQueryXml(
  xmlData: string,
  sqlQuery: string,
  rowNumber: number,
  logger?: ILogger,
): SqlQueryResponse {
  try {
    // Extract basic information
    const totalRowsMatch = xmlData.match(
      /<dataPreview:totalRows>(\d+)<\/dataPreview:totalRows>/,
    );
    const totalRows = totalRowsMatch ? parseInt(totalRowsMatch[1], 10) : 0;

    const queryTimeMatch = xmlData.match(
      /<dataPreview:queryExecutionTime>([\d.]+)<\/dataPreview:queryExecutionTime>/,
    );
    const queryExecutionTime = queryTimeMatch
      ? parseFloat(queryTimeMatch[1])
      : 0;

    // Extract column metadata
    const columns: Array<{
      name: string;
      type: string;
      description?: string;
      length?: number;
    }> = [];
    const columnMatches = xmlData.match(/<dataPreview:metadata[^>]*>/g);

    if (columnMatches) {
      columnMatches.forEach((match) => {
        const nameMatch = match.match(/dataPreview:name="([^"]+)"/);
        const typeMatch = match.match(/dataPreview:type="([^"]+)"/);
        const descMatch = match.match(/dataPreview:description="([^"]+)"/);
        const lengthMatch = match.match(/dataPreview:length="(\d+)"/);

        if (nameMatch) {
          columns.push({
            name: nameMatch[1],
            type: typeMatch ? typeMatch[1] : 'UNKNOWN',
            description: descMatch ? descMatch[1] : '',
            length: lengthMatch ? parseInt(lengthMatch[1], 10) : undefined,
          });
        }
      });
    }

    // Extract row data
    const rows: Array<Record<string, any>> = [];
    let raggedColumns: string | undefined;

    // Find all column sections
    const columnSections = xmlData.match(
      /<dataPreview:columns>.*?<\/dataPreview:columns>/gs,
    );

    if (columnSections && columnSections.length > 0) {
      // Extract data for each column
      const columnData: Record<string, (string | null)[]> = {};

      columnSections.forEach((section, index) => {
        if (index < columns.length) {
          const columnName = columns[index].name;
          // Match a self-closing `<dataPreview:data/>` (a nil / NULL cell) as
          // its own empty match BEFORE the paired `<data>…</data>` form. The
          // old regex required a closing tag, so a self-closing cell was skipped
          // and the pattern then spanned forward to the NEXT cell's closing tag
          // — swallowing that value and shifting every following row up in this
          // column. matchAll preserves cell position: a self-closing or empty
          // cell → null; any other content (including a blank " " CHAR value) is
          // kept verbatim, so a nil NULL is distinguished from an empty string.
          const dataRe =
            /<dataPreview:data(?:\s[^>]*?)?\/>|<dataPreview:data(?:\s[^>]*?)?>([\s\S]*?)<\/dataPreview:data>/g;
          const values: (string | null)[] = [];
          for (const m of section.matchAll(dataRe)) {
            values.push(m[1] === undefined || m[1] === '' ? null : m[1]);
          }
          columnData[columnName] = values;
        }
      });

      // Convert column-based data to row-based data. Every column must yield the
      // same number of cells; if they do not (a genuinely ragged response the
      // parser cannot align — as opposed to the self-closing artifact fixed
      // above) surface it as `ragged_columns` and log it, rather than silently
      // shifting rows.
      const lengths = Object.values(columnData).map((arr) => arr.length);
      const maxRowCount = Math.max(...lengths, 0);
      if (lengths.some((len) => len !== maxRowCount)) {
        raggedColumns = Object.entries(columnData)
          .map(([name, arr]) => `${name}:${arr.length}`)
          .join(' ');
        logger?.error(
          `parseSqlQueryXml: ragged columns, rows are NOT aligned (${raggedColumns})`,
        );
      }

      for (let rowIndex = 0; rowIndex < maxRowCount; rowIndex++) {
        const row: Record<string, any> = {};
        columns.forEach((column) => {
          const columnValues = columnData[column.name] || [];
          row[column.name] = columnValues[rowIndex] ?? null;
        });
        rows.push(row);
      }
    }

    // Honest row-count meta: what was actually parsed, and whether the caller is
    // seeing a truncated view (row_number cap reached, or the server reports
    // more rows than were returned).
    const returnedRowCount = rows.length;
    const serverTotalRows = totalRowsMatch ? totalRows : undefined;
    const truncated =
      returnedRowCount >= rowNumber ||
      (serverTotalRows !== undefined && serverTotalRows > returnedRowCount);

    return {
      sql_query: sqlQuery,
      row_number: rowNumber,
      execution_time: queryExecutionTime,
      total_rows: totalRows,
      returned_row_count: returnedRowCount,
      truncated,
      server_total_rows: serverTotalRows,
      ragged_columns: raggedColumns,
      columns,
      rows,
    };
  } catch (parseError) {
    logger?.error('Failed to parse SQL query XML:', parseError as any);

    // Return basic structure on parse error
    return {
      sql_query: sqlQuery,
      row_number: rowNumber,
      columns: [],
      rows: [],
      error: 'Failed to parse XML response',
    } as any;
  }
}

/**
 * True when an error thrown by the ADT client (an axios error) carries an HTTP
 * 400. The Data Preview endpoint draws a sporadic 400 on complex or concurrent
 * queries that succeeds on an immediate re-run; a 400 is the only status we
 * retry.
 */
function isHttp400(err: any): boolean {
  return err?.response?.status === 400 || err?.status === 400;
}

/**
 * Handler to execute freestyle SQL queries via SAP ADT Data Preview API
 *
 * @param args - Tool arguments containing sql_query and optional row_number parameter
 * @returns Response with parsed SQL query results or error
 */
export async function handleGetSqlQuery(context: HandlerContext, args: any) {
  const { connection, logger } = context;
  try {
    logger?.info('handleGetSqlQuery called');

    if (!args?.sql_query) {
      throw new McpError(ErrorCode.InvalidParams, 'SQL query is required');
    }

    const sqlQuery = args.sql_query;
    const rowNumber = args.row_number || 100; // Default to 100 rows if not specified

    const tables = extractTablesFromSql(sqlQuery);
    if (tables.length === 0) {
      // Fail closed: the query names a table source (FROM/JOIN survives comment
      // stripping) but no table could be parsed, so the blocklist gate cannot be
      // evaluated. Refuse rather than let a parser blind spot bypass the guard.
      if (sqlHasTableSource(sqlQuery)) {
        logger?.warn(
          'Blocked GetSqlQuery: table extraction failed (fail-closed)',
        );
        throw new McpError(
          ErrorCode.InvalidRequest,
          'mcp-abap-adt blocklist — could not extract any table name from this query, ' +
            'so the protected-table gate cannot evaluate it; the query is refused (fail-closed). ' +
            'Rewrite it with a simple `FROM <table>` reference (one table per FROM/JOIN, no comment ' +
            'between FROM and the table name) so the server can verify it against the blocklist.',
        );
      }
    } else if (!isAggregateOnly(sqlQuery)) {
      const hits = checkTables(tables);
      const verdict = evaluateHits(
        hits,
        args.acknowledge_risk === true,
        activeProfile(),
      );
      if (verdict.kind === 'deny') {
        logger?.warn(`Blocked GetSqlQuery: ${tables.join(',')}`);
        throw new McpError(ErrorCode.InvalidRequest, verdict.message);
      }
      if (verdict.kind === 'ask') {
        logger?.warn(
          `GetSqlQuery requires user acknowledgement: ${tables.join(',')}`,
        );
        throw new McpError(ErrorCode.InvalidRequest, verdict.message);
      }
      if (verdict.kind === 'approved') {
        process.stderr.write(
          `[mcp-abap-adt][blocklist] AUDIT: user-acknowledged GetSqlQuery on ${verdict.tables.join(',')}\n`,
        );
        logger?.warn(
          `AUDIT: user-acknowledged GetSqlQuery on ${verdict.tables.join(',')}`,
        );
      }
    }

    logger?.info(`Executing SQL query (rows=${rowNumber})`);

    const client = createAdtClient(connection, logger);
    // Complex statements (multi-way joins, long IN lists) and concurrent calls
    // can draw a sporadic HTTP 400 from the Data Preview endpoint that succeeds
    // on an immediate re-run. Retry exactly once on a 400; any other error (and
    // a second 400) propagates unchanged to the error handler below.
    const runQuery = () =>
      client
        .getUtils()
        .getSqlQuery({ sql_query: sqlQuery, row_number: rowNumber });
    let response: Awaited<ReturnType<typeof runQuery>>;
    try {
      response = await runQuery();
    } catch (err) {
      if (!isHttp400(err)) throw err;
      logger?.warn(
        'GetSqlQuery: HTTP 400 on first attempt — retrying once (sporadic 400 on complex/concurrent queries)',
      );
      response = await runQuery();
    }

    if (response.status === 200 && response.data) {
      logger?.info('SQL query request completed successfully');

      // Parse the XML response
      const parsedData = parseSqlQueryXml(
        response.data,
        sqlQuery,
        rowNumber,
        logger,
      );

      logger?.debug(
        `Parsed SQL query data: rows=${parsedData.rows.length}/${parsedData.total_rows ?? 0}, columns=${parsedData.columns.length}`,
      );

      const result = {
        isError: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify(parsedData, null, 2),
          },
        ],
      };
      if (args.filePath) {
        logger?.debug(`Writing SQL query result to file: ${args.filePath}`);
        writeResultToFile(result, args.filePath);
      }
      return result;
    } else {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to execute SQL query. Status: ${response.status}`,
      );
    }
  } catch (error) {
    logger?.error('Failed to execute SQL query', error as any);
    // MCP-compliant error response: always return content[] with type "text"
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `ADT error: ${String(error)}`,
        },
      ],
    };
  }
}
