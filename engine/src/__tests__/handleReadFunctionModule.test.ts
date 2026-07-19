/**
 * Regression tests for ReadFunctionModule inactive-edit-loss warning
 * (backlog 5-13 layer 1 Wave 3, item 2 + item 6).
 *
 * item 2 — same inactive-edit-loss hazard as GetFunctionModule, but the
 *   `check_inactive` parameter is OPT-IN here (default FALSE) because
 *   ReadFunctionModule is the bulk-read surface and the extra ADT call per FM
 *   would be costly. When opted in and reading active, the handler reads the
 *   inactive version and, if it exists and DIFFERS, attaches a `warning`.
 *
 * item 6 — a returned 'active' source is not proof of successful activation;
 *   the tool description says so.
 *
 * SAP-independent: drives the REAL handler over a fake connection that serves
 * active vs inactive source by the ?version= query param.
 *
 * Reverse-verify: default the flag to true and the "default does not read
 * inactive" case fails; remove the opt-in branch and the "opt-in → warning"
 * case fails.
 */

import {
  handleReadFunctionModule,
  TOOL_DEFINITION,
} from '../handlers/function_module/readonly/handleReadFunctionModule';

interface Captured {
  url: string;
}

class FakeConnection {
  captured: Captured[] = [];
  activeSource = 'FUNCTION z_fm. active. ENDFUNCTION.';
  inactiveSource = 'FUNCTION z_fm. INACTIVE EDIT. ENDFUNCTION.';

  setSessionType() {}
  getSessionMode() {
    return 'stateless';
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
    this.captured.push({ url });
    const ok = (payload: string) => ({
      status: 200,
      statusText: 'OK',
      data: payload,
      headers: {},
    });
    if (url.includes('/source/main')) {
      if (url.includes('version=inactive')) return ok(this.inactiveSource);
      return ok(this.activeSource);
    }
    return ok('<meta/>'); // metadata read
  }
}

const WARNING_SIG = 'inactive (unactivated) version';
const hadInactiveRead = (c: FakeConnection) =>
  c.captured.some((r) => r.url.includes('version=inactive'));

describe('ReadFunctionModule inactive-edit-loss warning (backlog 5-13 W3 item 2)', () => {
  it('default (opt-in OFF): does NOT read inactive and attaches no warning even when it differs', async () => {
    const connection = new FakeConnection();
    const result = await handleReadFunctionModule({ connection } as any, {
      function_module_name: 'Z_FM',
      function_group_name: 'Z_FG',
    });
    expect(result.isError).toBeFalsy();
    expect(JSON.stringify(result)).not.toContain(WARNING_SIG);
    expect(hadInactiveRead(connection)).toBe(false);
  });

  it('check_inactive=true + inactive DIFFERS: attaches a warning', async () => {
    const connection = new FakeConnection();
    const result = await handleReadFunctionModule({ connection } as any, {
      function_module_name: 'Z_FM',
      function_group_name: 'Z_FG',
      check_inactive: true,
    });
    expect(result.isError).toBeFalsy();
    expect(JSON.stringify(result)).toContain(WARNING_SIG);
    expect(hadInactiveRead(connection)).toBe(true);
  });

  it('check_inactive=true + inactive IDENTICAL: no warning', async () => {
    const connection = new FakeConnection();
    connection.inactiveSource = connection.activeSource;
    const result = await handleReadFunctionModule({ connection } as any, {
      function_module_name: 'Z_FM',
      function_group_name: 'Z_FG',
      check_inactive: true,
    });
    expect(result.isError).toBeFalsy();
    expect(JSON.stringify(result)).not.toContain(WARNING_SIG);
  });

  it('item 6: the description warns that active source is not proof of activation', () => {
    expect(TOOL_DEFINITION.description.toLowerCase()).toContain('not proof');
  });
});
