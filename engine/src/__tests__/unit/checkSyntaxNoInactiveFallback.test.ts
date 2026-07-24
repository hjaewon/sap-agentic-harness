/**
 * #12 (ZUNIWTH dogfooding, 2026-07-24): CheckSyntax on a fully-active program
 * with no inactive version staged made the vendored inactive check throw
 * "The REPORT/PROGRAM statement is missing, or the program type is INCLUDE" —
 * a false positive (nothing inactive to compile) that leaked out as a -32603
 * MCP tool error. runSyntaxCheck's program/no-source branch now CATCHES that
 * specific noise and falls back to the noise-aware active program-tree check,
 * returning a NORMAL result instead of throwing.
 *
 * Two levels of coverage:
 *   1. the DETECTION predicate that triggers the fallback (isReportMissingNoiseText);
 *   2. the branch WIRING in runSyntaxCheck — noise → fallback (no throw),
 *      non-noise → propagate, already-checked → EMPTY_RESULT — driven over a
 *      mocked client + fake connection.
 * The live red→green replay against ZUNIWR2030 is tracked as
 * UPSTREAM-FIX-HANDOFF Known-remaining #12.
 */

// getProgram().check is controlled per-test; the fallback's program-tree check
// runs over the fake connection (an empty checkruns body → clean result).
const mockProgramCheck = jest.fn();
jest.mock('../../lib/clients', () => ({
  createAdtClient: () => ({
    getProgram: () => ({ check: mockProgramCheck }),
  }),
}));

import {
  isReportMissingNoiseText,
  runSyntaxCheck,
} from '../../lib/preCheckBeforeActivation';

const NOISE =
  'Program check failed: The REPORT/PROGRAM statement is missing, or the program type is INCLUDE.';

// Fake connection: every ADT round-trip (the D010INC include SQL and the raw
// /checkruns) returns an empty body → no includes, no check report → clean.
const fakeConnection = {
  setSessionType() {},
  getSessionMode: () => 'stateless',
  getSessionId: () => 'testsessionid00000000000000000000',
  getBaseUrl: async () => 'https://sap.example.com:44300',
  getAuthHeaders: async () => ({}),
  async makeAdtRequest() {
    return { status: 200, statusText: 'OK', data: '<empty/>', headers: {} };
  },
};

beforeEach(() => mockProgramCheck.mockReset());

describe('isReportMissingNoiseText — CheckSyntax no-inactive fallback trigger (#12)', () => {
  it('recognises the exact live ZUNIWTH message as noise (fallback fires)', () => {
    expect(isReportMissingNoiseText(NOISE)).toBe(true);
  });

  it('recognises both noise phrasings independently', () => {
    expect(
      isReportMissingNoiseText('The REPORT/PROGRAM statement is missing'),
    ).toBe(true);
    expect(isReportMissingNoiseText('… the program type is INCLUDE')).toBe(
      true,
    );
  });

  it('does NOT flag a real syntax error as noise (genuine errors still propagate)', () => {
    expect(isReportMissingNoiseText('Statement "DATAX" is not defined.')).toBe(
      false,
    );
    expect(isReportMissingNoiseText('Field "LV_X" is unknown.')).toBe(false);
    expect(isReportMissingNoiseText('')).toBe(false);
  });
});

describe('runSyntaxCheck program/no-source fallback wiring (#12)', () => {
  it('noise throw → falls back to program-tree check and returns a NORMAL result (no -32603)', async () => {
    mockProgramCheck.mockRejectedValue(new Error(NOISE));
    const result = await runSyntaxCheck({ connection: fakeConnection } as any, {
      kind: 'program',
      name: 'ZFOO',
    });
    // Fallback ran (clean program-tree check) instead of throwing the noise out.
    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('a genuine (non-noise) error still propagates as a throw', async () => {
    mockProgramCheck.mockRejectedValue(new Error('Field "LV_X" is unknown.'));
    await expect(
      runSyntaxCheck({ connection: fakeConnection } as any, {
        kind: 'program',
        name: 'ZFOO',
      }),
    ).rejects.toThrow(/LV_X/);
  });

  it('an already-checked error is re-thrown to the outer catch → EMPTY_RESULT', async () => {
    mockProgramCheck.mockRejectedValue(
      Object.assign(new Error('already checked'), { isAlreadyChecked: true }),
    );
    const result = await runSyntaxCheck({ connection: fakeConnection } as any, {
      kind: 'program',
      name: 'ZFOO',
    });
    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
  });
});
