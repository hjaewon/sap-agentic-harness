/**
 * Unit tests for the structure DDL builder (backlog 5-13 layer 1 Wave 2,
 * item 3 + item 11-①).
 *
 * item 3 — CreateStructure used to discard the required `fields` input and
 *   create an empty structure shell (`ddlCode:''`), reporting success while
 *   read-back showed no fields (false success). `generateStructureDdl` turns
 *   the field/include spec into real DDIC `define structure` DDL, and fails
 *   EXPLICITLY (before any object is created) when a field spec is incomplete
 *   — an unresolved built-in type, a length-bearing type missing its length,
 *   or a field with neither data_element nor a built-in data_type. No partial
 *   creation.
 *
 * item 11-① — the generated header ALWAYS emits
 *   `@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE` (a DDIC structure
 *   rejects the source without it — the annotation UpdateStructure 4.13.11
 *   surfaces as the real error when missing).
 *
 * Ported from the frozen sc4sap-custom v4.14.0 reference (read-only); a pure
 * function, SAP-independent. Reverse-verify: drop the enhancement.category
 * push, or the incomplete-spec throws, and the pinned cases fail.
 */

import { generateStructureDdl } from '../lib/structureDdl';

describe('generateStructureDdl — field/include spec → DDIC DDL', () => {
  it('renders a data_element-typed field (lower-cased, no length)', () => {
    const ddl = generateStructureDdl({
      structureName: 'ZSAH_S_TEST',
      fields: [{ name: 'MANDT', data_element: 'MANDT' }],
    });
    expect(ddl).toContain('mandt : mandt;');
    expect(ddl).toContain('define structure zsah_s_test {');
    expect(ddl.trimEnd().endsWith('}')).toBe(true);
  });

  it('renders a length-bearing built-in (CHAR) with its length', () => {
    const ddl = generateStructureDdl({
      structureName: 'ZSAH_S_TEST',
      fields: [{ name: 'NAME', data_type: 'CHAR', length: 30 }],
    });
    expect(ddl).toContain('name : abap.char(30);');
  });

  it('renders a length+decimals built-in (DEC) — decimals default 0, explicit honored', () => {
    const ddlDefault = generateStructureDdl({
      structureName: 'ZSAH_S_TEST',
      fields: [{ name: 'AMOUNT', data_type: 'DEC', length: 15 }],
    });
    expect(ddlDefault).toContain('amount : abap.dec(15,0);');

    const ddlExplicit = generateStructureDdl({
      structureName: 'ZSAH_S_TEST',
      fields: [{ name: 'AMOUNT', data_type: 'DEC', length: 15, decimals: 2 }],
    });
    expect(ddlExplicit).toContain('amount : abap.dec(15,2);');
  });

  it('renders a no-length built-in (DATS) without requiring a length', () => {
    const ddl = generateStructureDdl({
      structureName: 'ZSAH_S_TEST',
      fields: [{ name: 'CREATED_ON', data_type: 'DATS' }],
    });
    expect(ddl).toContain('created_on : abap.dats;');
  });

  it('ALWAYS emits @AbapCatalog.enhancement.category : #NOT_EXTENSIBLE (item 11-①), even with no description', () => {
    const ddl = generateStructureDdl({
      structureName: 'ZSAH_S_TEST',
      fields: [{ name: 'ID', data_type: 'CHAR', length: 10 }],
    });
    expect(ddl).toContain(
      '@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE',
    );
  });

  it('emits @EndUserText.label when a description is given, with doubled single-quotes', () => {
    const ddl = generateStructureDdl({
      structureName: 'ZSAH_S_TEST',
      description: "Bob's data",
      fields: [{ name: 'ID', data_type: 'CHAR', length: 10 }],
    });
    expect(ddl).toContain("@EndUserText.label : 'Bob''s data'");
  });

  it('renders an include (lower-cased) with no suffix', () => {
    const ddl = generateStructureDdl({
      structureName: 'ZSAH_S_TEST',
      fields: [{ name: 'ID', data_type: 'CHAR', length: 10 }],
      includes: [{ name: 'ZSAH_S_BASE' }],
    });
    expect(ddl).toContain('include zsah_s_base;');
  });

  it('emits currency/unit semantics annotations when referenced', () => {
    const ddl = generateStructureDdl({
      structureName: 'ZSAH_S_TEST',
      fields: [
        { name: 'WAERS', data_type: 'CUKY' },
        {
          name: 'NETWR',
          data_type: 'CURR',
          length: 15,
          decimals: 2,
          currency_reference: 'WAERS',
        },
      ],
    });
    expect(ddl).toContain(
      "@Semantics.amount.currencyCode : 'zsah_s_test.waers'",
    );
    expect(ddl).toContain('netwr : abap.curr(15,2);');
  });

  // ---- incomplete specs fail EXPLICITLY, before any object is created ----

  it('throws when a length-bearing built-in is missing its length', () => {
    expect(() =>
      generateStructureDdl({
        structureName: 'ZSAH_S_TEST',
        fields: [{ name: 'NAME', data_type: 'CHAR' }],
      }),
    ).toThrow(/requires a positive "length"/);
  });

  it('throws on an unsupported data_type (unresolved built-in)', () => {
    expect(() =>
      generateStructureDdl({
        structureName: 'ZSAH_S_TEST',
        fields: [{ name: 'X', data_type: 'ZFANCY', length: 5 }],
      }),
    ).toThrow(/unsupported data_type/);
  });

  it('throws when a field carries neither data_element nor a built-in data_type', () => {
    expect(() =>
      generateStructureDdl({
        structureName: 'ZSAH_S_TEST',
        // domain/structure_ref/table_ref are NOT inferred by the generator
        fields: [{ name: 'X', domain: 'SOME_DOMAIN' }],
      }),
    ).toThrow(/cannot be expressed as DDL/);
  });

  it('throws when there are no fields and no includes', () => {
    expect(() =>
      generateStructureDdl({ structureName: 'ZSAH_S_TEST', fields: [] }),
    ).toThrow(/At least one field or include/);
  });

  it('throws on a field missing its name', () => {
    expect(() =>
      generateStructureDdl({
        structureName: 'ZSAH_S_TEST',
        fields: [{ name: '  ', data_type: 'CHAR', length: 10 }],
      }),
    ).toThrow(/missing its required "name"/);
  });

  it('throws on an include carrying a suffix (not expressible in generated DDL)', () => {
    expect(() =>
      generateStructureDdl({
        structureName: 'ZSAH_S_TEST',
        fields: [{ name: 'ID', data_type: 'CHAR', length: 10 }],
        includes: [{ name: 'ZSAH_S_BASE', suffix: 'X' }],
      }),
    ).toThrow(/suffix/);
  });

  it('throws when structureName is missing', () => {
    expect(() =>
      generateStructureDdl({
        structureName: '  ',
        fields: [{ name: 'ID', data_type: 'CHAR', length: 10 }],
      }),
    ).toThrow(/structureName is required/);
  });
});
