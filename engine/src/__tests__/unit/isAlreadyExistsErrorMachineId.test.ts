/**
 * Regression tests for language-independent already-exists detection
 * (HANDOFF §6 engine backlog 11-⑥, fixed in 4.13.10).
 *
 * The previous isAlreadyExistsError matched only English message text
 * ("already exists"), so on systems whose backend message pool is not
 * English the check silently failed — live-measured on IDES (logon language
 * CS): the ADT already-exists rejection arrives as an <exc:exception> whose
 * message text is GERMAN ("Domain mit Name X ist bereits vorhanden") even
 * under lang="EN". That broke UpdateDataElement's pre-validation (which
 * treats already-exists as the EXPECTED case for an update).
 *
 * The rewrite detects machine identifiers first:
 *   - T100 message key SWB_TOOL/016 (live-captured on IDES for both DOMA and
 *     DTEL: "&1 mit Name &2 ist bereits vorhanden", V1=object type, V2=name)
 *   - exception type ids containing "AlreadyExists"
 * and only falls back to multilingual message-text matching (EN + DE) when
 * no machine signal is present.
 */

import { isAlreadyExistsError } from '../../lib/utils';

// Verbatim live capture (IDES S/4HANA 2021, logon language CS) — the
// already-exists rejection for an existing domain. Note: German text under
// lang="EN"; machine signals are the type id and the T100 key.
const LIVE_DOMAIN_ALREADY_EXISTS_XML =
  '<?xml version="1.0" encoding="utf-8"?><exc:exception xmlns:exc="http://www.sap.com/abapxml/types/communicationframework">' +
  '<namespace id="com.sap.adt"/><type id="InvalidObjName"/>' +
  '<message lang="EN">Domain mit Name ZDEL_SAH4_D1 ist bereits vorhanden.</message>' +
  '<localizedMessage lang="CS">Domain mit Name ZDEL_SAH4_D1 ist bereits vorhanden.</localizedMessage>' +
  '<properties><entry key="LONGTEXT"/><entry key="T100KEY-ID">SWB_TOOL</entry><entry key="T100KEY-NO">016</entry>' +
  '<entry key="T100KEY-V1">Domain</entry><entry key="T100KEY-V2">ZDEL_SAH4_D1</entry></properties></exc:exception>';

// Verbatim live capture — a DIFFERENT German error (missing description,
// SWB_TOOL/019) that must NOT be classified as already-exists.
const LIVE_DESCRIPTION_MISSING_XML =
  '<?xml version="1.0" encoding="utf-8"?><exc:exception xmlns:exc="http://www.sap.com/abapxml/types/communicationframework">' +
  '<namespace id="com.sap.adt"/><type id="ExceptionInvalidData"/>' +
  '<message lang="EN">Die Beschreibung fehlt</message>' +
  '<localizedMessage lang="CS">Die Beschreibung fehlt</localizedMessage>' +
  '<properties><entry key="com.sap.adt.communicationFramework.subType">scr_prop_no_decr</entry>' +
  '<entry key="T100KEY-ID">SWB_TOOL</entry><entry key="T100KEY-NO">019</entry></properties></exc:exception>';

function axiosLikeError(body: string, status = 400): Error {
  const err: any = new Error(`Request failed with status code ${status}`);
  err.response = { status, data: body };
  return err;
}

describe('isAlreadyExistsError — machine identifiers first (backlog 11-⑥)', () => {
  it('detects the live German already-exists rejection via T100 key SWB_TOOL/016 (response body)', () => {
    expect(
      isAlreadyExistsError(axiosLikeError(LIVE_DOMAIN_ALREADY_EXISTS_XML)),
    ).toBe(true);
  });

  it('detects it when the XML is embedded in a wrapped error MESSAGE (re-thrown errors)', () => {
    // Handlers frequently re-wrap: new Error(`Failed …: ${responseData}`).
    expect(
      isAlreadyExistsError(
        new Error(
          `Failed to update data element BUKRS: ${LIVE_DOMAIN_ALREADY_EXISTS_XML}`,
        ),
      ),
    ).toBe(true);
  });

  it('detects an AlreadyExists exception TYPE id regardless of message language', () => {
    const body =
      '<?xml version="1.0" encoding="utf-8"?><exc:exception>' +
      '<type id="ExceptionResourceAlreadyExists"/>' +
      '<message lang="FR">La ressource existe.</message></exc:exception>';
    expect(isAlreadyExistsError(axiosLikeError(body))).toBe(true);
  });

  it('does NOT classify a different German error (SWB_TOOL/019, "Die Beschreibung fehlt") as already-exists', () => {
    expect(
      isAlreadyExistsError(axiosLikeError(LIVE_DESCRIPTION_MISSING_XML)),
    ).toBe(false);
  });

  it('keeps the English text fallback (no machine signal present)', () => {
    expect(
      isAlreadyExistsError(new Error('Resource already exists in package')),
    ).toBe(true);
  });

  it('adds a German text fallback for plain-text messages without machine signals', () => {
    expect(
      isAlreadyExistsError(new Error('Objekt ist bereits vorhanden')),
    ).toBe(true);
  });

  it('still rejects unrelated errors', () => {
    expect(isAlreadyExistsError(new Error('Syntax error in line 3'))).toBe(
      false,
    );
    expect(isAlreadyExistsError(undefined)).toBe(false);
  });
});
