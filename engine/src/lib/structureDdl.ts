/**
 * Structure DDL builder — turns a CreateStructure field/include spec into
 * DDIC "define structure" DDL source (backlog 5-13 layer 1 Wave 2, item 3).
 *
 * CreateStructure used to discard the required `fields` input and create an
 * empty shell (`create({ ddlCode: '' })`), reporting success while read-back
 * showed no fields — a false success. This generator produces the real DDL
 * that the handler then applies under lock, and fails EXPLICITLY (before any
 * object is created) when a field spec is incomplete, so no partial structure
 * is left behind.
 *
 * Ported from the frozen sc4sap-custom v4.14.0 reference (read-only). The
 * header always emits `@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE`
 * (item 11-①) — a DDIC structure is rejected without it.
 */

export interface StructureDdlField {
  name: string;
  data_type?: string;
  length?: number;
  decimals?: number;
  domain?: string;
  data_element?: string;
  structure_ref?: string;
  table_ref?: string;
  description?: string;
  /** For CURR fields: the CUKY field in THIS structure carrying the currency. */
  currency_reference?: string;
  /** For QUAN fields: the UNIT field in THIS structure carrying the unit. */
  unit_reference?: string;
}

export interface StructureDdlInclude {
  name: string;
  suffix?: string;
}

export interface StructureDdlInput {
  structureName: string;
  description?: string;
  fields?: StructureDdlField[];
  includes?: StructureDdlInclude[];
}

type BuiltinKind = 'len' | 'lendec' | 'none';

const BUILTIN_TYPES: Record<string, { ddl: string; kind: BuiltinKind }> = {
  CHAR: { ddl: 'abap.char', kind: 'len' },
  NUMC: { ddl: 'abap.numc', kind: 'len' },
  RAW: { ddl: 'abap.raw', kind: 'len' },
  UNIT: { ddl: 'abap.unit', kind: 'len' },
  STRING: { ddl: 'abap.string', kind: 'len' },
  DEC: { ddl: 'abap.dec', kind: 'lendec' },
  CURR: { ddl: 'abap.curr', kind: 'lendec' },
  QUAN: { ddl: 'abap.quan', kind: 'lendec' },
  DATS: { ddl: 'abap.dats', kind: 'none' },
  TIMS: { ddl: 'abap.tims', kind: 'none' },
  CUKY: { ddl: 'abap.cuky', kind: 'none' },
  INT1: { ddl: 'abap.int1', kind: 'none' },
  INT2: { ddl: 'abap.int2', kind: 'none' },
  INT4: { ddl: 'abap.int4', kind: 'none' },
  INT8: { ddl: 'abap.int8', kind: 'none' },
  FLTP: { ddl: 'abap.fltp', kind: 'none' },
};

function isPositiveLength(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function renderField(
  field: StructureDdlField,
  structureNameLower: string,
): string[] {
  const fieldName = field?.name?.trim();
  if (!fieldName) {
    throw new Error('A structure field is missing its required "name".');
  }
  const nameLower = fieldName.toLowerCase();

  const dataElement = field.data_element?.trim();
  if (dataElement) {
    return [`  ${nameLower} : ${dataElement.toLowerCase()};`];
  }

  const dataType = field.data_type?.trim();
  if (dataType) {
    const key = dataType.toUpperCase();
    const def = BUILTIN_TYPES[key];
    if (!def) {
      throw new Error(
        `Field "${fieldName}": unsupported data_type "${dataType}". Use a data_element, or one of: ${Object.keys(BUILTIN_TYPES).join(', ')}.`,
      );
    }
    let typeExpr: string;
    if (def.kind === 'none') {
      typeExpr = def.ddl;
    } else {
      if (!isPositiveLength(field.length)) {
        throw new Error(
          `Field "${fieldName}": data_type ${key} requires a positive "length".`,
        );
      }
      if (def.kind === 'lendec') {
        const decimals = field.decimals ?? 0;
        typeExpr = `${def.ddl}(${field.length},${decimals})`;
      } else {
        typeExpr = `${def.ddl}(${field.length})`;
      }
    }
    const lines: string[] = [];
    if (key === 'CURR' && field.currency_reference?.trim()) {
      lines.push(
        `  @Semantics.amount.currencyCode : '${structureNameLower}.${field.currency_reference.trim().toLowerCase()}'`,
      );
    } else if (key === 'QUAN' && field.unit_reference?.trim()) {
      lines.push(
        `  @Semantics.quantity.unitOfMeasure : '${structureNameLower}.${field.unit_reference.trim().toLowerCase()}'`,
      );
    }
    lines.push(`  ${nameLower} : ${typeExpr};`);
    return lines;
  }

  throw new Error(
    `Field "${fieldName}" cannot be expressed as DDL: provide "data_element" or a built-in "data_type" (with "length"/"decimals" where required). The generator does not infer a type from domain/structure_ref/table_ref.`,
  );
}

/**
 * Generate DDIC "define structure" DDL from a field/include spec.
 * Throws (before any SAP object is created) on an incomplete spec.
 */
export function generateStructureDdl(input: StructureDdlInput): string {
  const structureName = input?.structureName?.trim();
  if (!structureName) {
    throw new Error('structureName is required to generate structure DDL.');
  }
  const structureNameLower = structureName.toLowerCase();

  const fields = input.fields ?? [];
  const includes = input.includes ?? [];
  if (fields.length === 0 && includes.length === 0) {
    throw new Error(
      'At least one field or include is required to generate structure DDL.',
    );
  }

  const bodyLines: string[] = [];
  for (const field of fields) {
    bodyLines.push(...renderField(field, structureNameLower));
  }
  for (const include of includes) {
    const includeName = include?.name?.trim();
    if (!includeName) {
      throw new Error('An include entry is missing its required "name".');
    }
    if (include.suffix?.trim()) {
      throw new Error(
        `Include "${includeName}": a "suffix" cannot be expressed in generated DDL; include the structure without a suffix.`,
      );
    }
    bodyLines.push(`  include ${includeName.toLowerCase()};`);
  }

  const header: string[] = [];
  const description = input.description?.trim();
  if (description) {
    header.push(`@EndUserText.label : '${description.replace(/'/g, "''")}'`);
  }
  header.push('@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE');
  header.push(`define structure ${structureNameLower} {`);

  return [...header, ...bodyLines, '}'].join('\n');
}
