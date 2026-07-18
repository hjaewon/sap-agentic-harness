/**
 * Regression tests for GetFunctionModule inactive-edit-loss warning
 * (backlog 5-13 layer 1 Wave 3, item 2 + item 6).
 *
 * item 2 — reading version='active' (the default) returns the pre-edit source
 *   when an unactivated edit exists; writing on top of it silently destroys the
 *   pending edit and no gate catches it. A new `check_inactive` parameter
 *   (default TRUE for Get) makes the handler also read the inactive version and,
 *   when it exists and DIFFERS, attach a `warning` to the response. The extra
 *   read never fails or slows the main read.
 *
 * item 6 — a returned 'active' source is NOT proof the FM was ever activated;
 *   the tool description says so.
 *
 * SAP-independent: drives the REAL handler over a fake connection that serves
 * active vs inactive source by the ?version= query param.
 *
 * Reverse-verify: remove the check_inactive branch and the "differs → warning"
 * and "same → no warning" cases collapse; flip the Get default to false and the
 * "default attaches a warning" case fails.
 */

import {
  handleGetFunctionModule,
  TOOL_DEFINITION,
} from '../handlers/function_module/high/handleGetFunctionModule';

interface Captured {
  url: string;
}

class FakeConnection {
  captured: Captured[] = [];
  activeSource = 'FUNCTION z_fm. active. ENDFUNCTION.';
  inactiveSource: string | null = null; // null → inactive read throws (no inactive version)
  inactiveThrowsStatus = 404;

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
      if (url.includes('version=inactive')) {
        if (this.inactiveSource === null) {
          const err: any = new Error('not found');
          err.response = { status: this.inactiveThrowsStatus };
          throw err;
        }
        return ok(this.inactiveSource);
      }
      return ok(this.activeSource); // active (or unversioned)
    }
    return ok('<meta/>');
  }
}

const WARNING_SIG = 'inactive (unactivated) version';
const hadInactiveRead = (c: FakeConnection) =>
  c.captured.some((r) => r.url.includes('version=inactive'));

describe('GetFunctionModule inactive-edit-loss warning (backlog 5-13 W3 item 2)', () => {
  it('default (check_inactive on): attaches a warning when the inactive version DIFFERS', async () => {
    const connection = new FakeConnection();
    connection.inactiveSource = 'FUNCTION z_fm. INACTIVE EDIT. ENDFUNCTION.';
    const result = await handleGetFunctionModule({ connection } as any, {
      function_module_name: 'Z_FM',
      function_group_name: 'Z_FG',
    });
    expect(result.isError).toBeFalsy();
    expect(JSON.stringify(result)).toContain(WARNING_SIG);
    expect(hadInactiveRead(connection)).toBe(true);
  });

  it('no warning when the inactive version is IDENTICAL to active', async () => {
    const connection = new FakeConnection();
    connection.inactiveSource = connection.activeSource;
    const result = await handleGetFunctionModule({ connection } as any, {
      function_module_name: 'Z_FM',
      function_group_name: 'Z_FG',
    });
    expect(result.isError).toBeFalsy();
    expect(JSON.stringify(result)).not.toContain(WARNING_SIG);
  });

  it('check_inactive=false: no extra inactive read and no warning', async () => {
    const connection = new FakeConnection();
    connection.inactiveSource = 'FUNCTION z_fm. INACTIVE EDIT. ENDFUNCTION.';
    const result = await handleGetFunctionModule({ connection } as any, {
      function_module_name: 'Z_FM',
      function_group_name: 'Z_FG',
      check_inactive: false,
    });
    expect(result.isError).toBeFalsy();
    expect(JSON.stringify(result)).not.toContain(WARNING_SIG);
    expect(hadInactiveRead(connection)).toBe(false);
  });

  it('reading version=inactive directly does not compare/warn', async () => {
    const connection = new FakeConnection();
    connection.inactiveSource = 'FUNCTION z_fm. INACTIVE EDIT. ENDFUNCTION.';
    const result = await handleGetFunctionModule({ connection } as any, {
      function_module_name: 'Z_FM',
      function_group_name: 'Z_FG',
      version: 'inactive',
    });
    expect(result.isError).toBeFalsy();
    expect(JSON.stringify(result)).not.toContain(WARNING_SIG);
  });

  it('a failing inactive read (no inactive version) never breaks the main read', async () => {
    const connection = new FakeConnection();
    connection.inactiveSource = null; // inactive read throws 404
    const result = await handleGetFunctionModule({ connection } as any, {
      function_module_name: 'Z_FM',
      function_group_name: 'Z_FG',
    });
    expect(result.isError).toBeFalsy();
    expect(JSON.stringify(result)).toContain('active. ENDFUNCTION.');
    expect(JSON.stringify(result)).not.toContain(WARNING_SIG);
  });

  it('item 6: the description warns that active source is not proof of activation', () => {
    expect(TOOL_DEFINITION.description.toLowerCase()).toContain('not proof');
  });
});
