/**
 * Documentation regression pin for the UpdateFunctionModule sibling-persist
 * note (backlog 5-13 layer 1 Wave 3, item 5 — description only).
 *
 * Because a function group compiles as a whole, the post-write syntax check can
 * report errors that originate from PRE-EXISTING defects in sibling FMs of the
 * same group — but the write itself still persists as the inactive version.
 * Without this note a caller sees the check error and wrongly assumes its write
 * was lost. This pins the guidance in the tool description.
 */

import { TOOL_DEFINITION } from '../handlers/function/high/handleUpdateFunctionModule';

describe('UpdateFunctionModule sibling-persist note is documented (backlog 5-13 W3 item 5)', () => {
  const d = TOOL_DEFINITION.description.toLowerCase();

  it('states the write persists even when the post-write check fails', () => {
    expect(d).toContain('persist');
  });

  it('explains check errors can come from sibling FMs of the same group', () => {
    expect(d).toContain('sibling');
  });
});
