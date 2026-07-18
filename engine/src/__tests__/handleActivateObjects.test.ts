/**
 * Documentation regression pin for the ActivateObjects FUGR recipe
 * (backlog 5-13 layer 1 Wave 3, item 4 — description only).
 *
 * The code already activates any object set in one run; the gap was that a
 * caller does not know the FUGR family must go in TOGETHER (function group +
 * TOP include + every FM + the SAPL<group> main program) and that the system
 * include L<group>UXX must NOT be included. This pins that guidance in the tool
 * description so it is not silently dropped.
 */

import { TOOL_DEFINITION } from '../handlers/common/high/handleActivateObjects';

describe('ActivateObjects FUGR recipe is documented (backlog 5-13 W3 item 4)', () => {
  const d = TOOL_DEFINITION.description;

  it('names the SAPL<group> main program and the FUGR family object types', () => {
    expect(d).toContain('SAPL');
    expect(d).toContain('FUGR/FF');
    expect(d).toContain('FUGR/I');
  });

  it('warns not to include the L<group>UXX system include', () => {
    expect(d).toContain('UXX');
  });

  it('warns against mixing unrelated objects into one activation run', () => {
    expect(d.toLowerCase()).toContain('never mix');
  });
});
