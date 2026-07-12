/**
 * Regression test: handleCreateView must surface the ADT exception BODY,
 * not just axios' generic status-line message (Wave 2 side-discovery,
 * fixed in 4.13.10).
 *
 * Live-measured on IDES: the DDLS create rejection carries the actual
 * diagnosis only in the response body —
 *   "Sprache EN zum Anlegen der Beschreibung entspricht nicht
 *    Mastersprache CS" (T100 DDIC_ADT_DDLS/016)
 * — but the handler's catch forwarded only error.message ("Request failed
 * with status code 400"), hiding the root cause from the caller.
 */

process.env.ADT_ACCEPT_CORRECTION = 'false';

import { handleCreateView } from '../../handlers/view/high/handleCreateView';

// Modeled on the live IDES capture of the DDLS master-language rejection.
const DDLS_LANGUAGE_REJECTION_XML =
  '<?xml version="1.0" encoding="utf-8"?><exc:exception xmlns:exc="http://www.sap.com/abapxml/types/communicationframework">' +
  '<namespace id="com.sap.adt"/><type id="ExceptionResourceCreationFailure"/>' +
  '<message lang="EN">Sprache EN zum Anlegen der Beschreibung entspricht nicht Mastersprache CS</message>' +
  '<localizedMessage lang="CS">Sprache EN zum Anlegen der Beschreibung entspricht nicht Mastersprache CS</localizedMessage>' +
  '<properties><entry key="T100KEY-ID">DDIC_ADT_DDLS</entry><entry key="T100KEY-NO">016</entry>' +
  '<entry key="T100KEY-V1">EN</entry><entry key="T100KEY-V2">CS</entry></properties></exc:exception>';

class FakeConnection {
  sessionMode: 'stateful' | 'stateless' = 'stateless';

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
    const { url, method } = options;
    const ok = (data: string) => ({
      status: 200,
      statusText: 'OK',
      data,
      headers: {},
    });
    if (url.includes('/core/http/systeminformation')) {
      const err: any = new Error('Request failed with status code 404');
      err.response = { status: 404, data: '' };
      throw err; // language falls back to EN — irrelevant for this test
    }
    if (url.includes('/ddic/ddl/validation')) return ok('');
    if (
      String(method).toUpperCase() === 'POST' &&
      url.includes('/ddic/ddl/sources')
    ) {
      // The DDLS create rejection, as axios raises it.
      const err: any = new Error('Request failed with status code 400');
      err.response = {
        status: 400,
        statusText: 'Bad Request',
        data: DDLS_LANGUAGE_REJECTION_XML,
      };
      throw err;
    }
    return ok('');
  }
}

describe('handleCreateView error propagation (ADT body, not generic axios message)', () => {
  it('surfaces the SAP diagnosis from the response body plus the HTTP status', async () => {
    const context = { connection: new FakeConnection(), logger: undefined };
    const result: any = await handleCreateView(context as any, {
      view_name: 'ZSAH_DDLS_TEST',
      package_name: '$TMP',
      description: 'error body test',
    });

    expect(result.isError).toBe(true);
    const text = result.content?.[0]?.text ?? '';
    // The actual SAP diagnosis must be visible to the caller…
    expect(text).toContain('Sprache EN');
    expect(text).toContain('Mastersprache CS');
    // …along with the HTTP status…
    expect(text).toContain('[HTTP 400]');
    // …instead of ONLY the generic axios status line.
    expect(text).not.toBe('Error: Request failed with status code 400');
  });
});
