/**
 * Discovery of the connected system's logon / master language.
 *
 * SAP stamps every newly-created repository object with a *master language*
 * equal to the creating user's logon language, and some create services
 * (notably DDLS/CDS view create) hard-reject a create payload whose
 * `adtcore:masterLanguage` differs from that logon language:
 *   "Sprache EN zum Anlegen der Beschreibung entspricht nicht Mastersprache CS"
 *   (T100 DDIC_ADT_DDLS/016) → HTTP 400.
 * The vendored @babamba2/mcp-abap-adt-clients create payloads hardcode
 * `adtcore:language="EN"` / `adtcore:masterLanguage="EN"`, which fails on any
 * system whose logon language is not EN (e.g. an S/4HANA system logged on in
 * CS). Rather than hardcode a second language, this resolves the actual logon
 * language at runtime from the live ADT system-information document and lets
 * the caller inject it into the create payload.
 *
 * Source: `GET /sap/bc/adt/core/http/systeminformation` — the same endpoint
 * GetSystemInfo reads; live-verified to return `language: "CS"` on an on-prem
 * S/4HANA system logged on in CS. Result is cached per connection object
 * (stdio mode reuses one connection for the whole session). If the endpoint is
 * unavailable or the value looks unusable, the caller keeps the library's
 * historical `EN` default.
 */
import type {
  IAbapConnection,
  ILogger,
} from '@babamba2/mcp-abap-adt-interfaces';
import { parseSystemInformation, tryAdtGet } from './systemInfoParsers';

const SYSTEMINFO_URL = '/sap/bc/adt/core/http/systeminformation';
const SYSTEMINFO_ACCEPT =
  'application/vnd.sap.adt.core.http.systeminformation.v1+json';

/** Historical vendored default, used when discovery is unavailable. */
export const DEFAULT_MASTER_LANGUAGE = 'EN';

// Successful resolutions are cached per connection. Failures are not cached so
// a transient hiccup doesn't pin the fallback for the whole session.
const languageCache = new WeakMap<IAbapConnection, string>();

/**
 * Resolves the connected system's logon/master language (e.g. `"CS"`),
 * falling back to `EN` when the system-information endpoint is unavailable or
 * advertises no usable language code. The value is returned uppercased and is
 * suitable for `adtcore:language` / `adtcore:masterLanguage`.
 */
export async function resolveLogonLanguage(
  connection: IAbapConnection,
  logger?: ILogger,
): Promise<string> {
  const cached = languageCache.get(connection);
  if (cached) return cached;

  const result = await tryAdtGet(connection, SYSTEMINFO_URL, {
    Accept: SYSTEMINFO_ACCEPT,
  });
  if (result.ok) {
    const info = parseSystemInformation(result.data);
    const lang = info.language?.trim().toUpperCase();
    // ADT language codes are 1–3 letter tokens (E / EN / CS / DE …). Guard
    // against an unexpected shape so we never inject garbage into the payload.
    if (lang && /^[A-Z]{1,3}$/.test(lang)) {
      logger?.info?.(`Logon language resolved from systeminformation: ${lang}`);
      languageCache.set(connection, lang);
      return lang;
    }
  }

  logger?.debug?.(
    `Logon language unavailable, using default ${DEFAULT_MASTER_LANGUAGE}`,
  );
  return DEFAULT_MASTER_LANGUAGE;
}
