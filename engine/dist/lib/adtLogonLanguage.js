"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MASTER_LANGUAGE = void 0;
exports.resolveLogonLanguage = resolveLogonLanguage;
const systemInfoParsers_1 = require("./systemInfoParsers");
const SYSTEMINFO_URL = '/sap/bc/adt/core/http/systeminformation';
const SYSTEMINFO_ACCEPT = 'application/vnd.sap.adt.core.http.systeminformation.v1+json';
/** Historical vendored default, used when discovery is unavailable. */
exports.DEFAULT_MASTER_LANGUAGE = 'EN';
// Successful resolutions are cached per connection. Failures are not cached so
// a transient hiccup doesn't pin the fallback for the whole session.
const languageCache = new WeakMap();
/**
 * Resolves the connected system's logon/master language (e.g. `"CS"`),
 * falling back to `EN` when the system-information endpoint is unavailable or
 * advertises no usable language code. The value is returned uppercased and is
 * suitable for `adtcore:language` / `adtcore:masterLanguage`.
 */
async function resolveLogonLanguage(connection, logger) {
    const cached = languageCache.get(connection);
    if (cached)
        return cached;
    const result = await (0, systemInfoParsers_1.tryAdtGet)(connection, SYSTEMINFO_URL, {
        Accept: SYSTEMINFO_ACCEPT,
    });
    if (result.ok) {
        const info = (0, systemInfoParsers_1.parseSystemInformation)(result.data);
        const lang = info.language?.trim().toUpperCase();
        // ADT language codes are 1–3 letter tokens (E / EN / CS / DE …). Guard
        // against an unexpected shape so we never inject garbage into the payload.
        if (lang && /^[A-Z]{1,3}$/.test(lang)) {
            logger?.info?.(`Logon language resolved from systeminformation: ${lang}`);
            languageCache.set(connection, lang);
            return lang;
        }
    }
    logger?.debug?.(`Logon language unavailable, using default ${exports.DEFAULT_MASTER_LANGUAGE}`);
    return exports.DEFAULT_MASTER_LANGUAGE;
}
//# sourceMappingURL=adtLogonLanguage.js.map