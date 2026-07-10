// Launcher shim for the SAP MCP server bundle.
//
// WHY: server.bundle.cjs runs activateProfile() at startup (reading
// <cwd>/.sc4sap/active-profile.txt -> <home>/profiles/<alias>/sap.env and
// exporting SAP_* into the environment), but that activation does NOT feed the
// bundle's connection broker. The broker only builds a REAL connection when it
// gets an env-file path via --env-path / --mcp / MCP_ENV_PATH / a cwd .env;
// otherwise it silently falls back to a mock connection and every real call
// fails with "Basic authentication requires SAP_CLIENT to be provided".
//
// This shim bridges that gap: it resolves the active profile's sap.env using
// the SAME home/pointer logic as the bundle and, if found, points the bundle at
// it via MCP_ENV_PATH before require()-ing the bundle in this same process
// (stdio + argv/env intact). If nothing resolves, it does nothing and the
// bundle starts in inspection-only mode exactly as before.

const path = require("path");
const os = require("os");
const fs = require("fs");

try {
  const home = process.env.SC4SAP_HOME_DIR || path.join(os.homedir(), ".sc4sap");
  const ptr = path.join(process.cwd(), ".sc4sap", "active-profile.txt");

  let candidate;
  if (fs.existsSync(ptr)) {
    const alias = fs.readFileSync(ptr, "utf8").trim();
    if (alias) {
      const p = path.join(home, "profiles", alias, "sap.env");
      if (fs.existsSync(p)) candidate = p;
    }
  }
  if (!candidate) {
    const legacy = path.join(process.cwd(), ".sc4sap", "sap.env");
    if (fs.existsSync(legacy)) candidate = legacy;
  }

  const hasConnArg = process.argv.includes("--env-path") || process.argv.includes("--mcp");
  if (candidate && !hasConnArg && !process.env.MCP_ENV_PATH) {
    process.env.MCP_ENV_PATH = candidate;
  }
} catch (err) {
  // Never let the shim crash the server; degrade to the bundle's default behavior.
  console.error("[launch] active-profile resolution failed, starting bundle as-is:", err.message);
}

require("./server.bundle.cjs");
