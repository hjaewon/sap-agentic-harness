# verify-sap.ps1 - verify wrapper for live-SAP targets (Phase 0a skeleton).
#
# Self-provisions SAP credentials: it dot-sources scripts/vsp-env.ps1 into its
# OWN process (read-only by default; -Write for deploy chains). The caller's
# shell needs NO pre-dot-source and stays free of SAP_* - credentials are scoped
# to this process only. See adapters/vsp/VERIFY-PATTERNS.md sec 4.
#
# Marker contract (DESIGN.md section 9 - failure classification):
#   CODE_FAIL - code defect; eligible as a rule-promotion candidate
#   ENV_FAIL  - connectivity/auth/system failure; never promote to rules
#   LOCK_FAIL - transient lock (transport/enqueue); never promote to rules
# vsp exits 1 on every error type, so classification relies on output
# pattern parsing only.
#
# Phase 0b (2026-07-11): measured real output for all three markers against
# IDES-DEV (S4H/100) - see adapters/vsp/COMMANDS.md and .harness/STATE.md for
# the raw captures. Classification below matches the measured strings first,
# falling back to the original keyword heuristic when a measured string does
# not match (covers failure shapes not yet observed). Remaining TODO: the
# ENV_FAIL "403" fallback keyword has no measured non-lock case backing it
# (the one measured 403 was LOCK_FAIL) - kept as an unverified fallback only.
#
# PowerShell 5.1 compatible. ASCII only.

param(
    # -ProfileName / -Write are named-only (VspArgs claims Position 0), so the
    # vsp args after `--` are never siphoned into ProfileName. Keeps the existing
    # `... -- <vsp args>` convention intact.
    [string]$ProfileName = "IDES-DEV",
    [switch]$Write,
    [Parameter(Position = 0, ValueFromRemainingArguments = $true)]
    [string[]]$VspArgs
)

# pinned by adapters/vsp/vsp.lock.json - keep in sync
# machine-specific path (this is the main machine - binary_main_machine); the
# secondary machine's path is lock's "binary" entry.
$VSP = "D:\claude for SAP\vsp\vsp-custom\build\vsp.exe"

if (-not (Test-Path -LiteralPath $VSP)) {
    Write-Output "ENV_FAIL: vsp binary not found at $VSP"
    exit 1
}

if (-not $VspArgs -or $VspArgs.Count -eq 0) {
    Write-Output "CODE_FAIL: no vsp arguments"
    exit 1
}

# Self-provision SAP credentials into THIS process (no pre-dot-source needed).
# Default = read-only (SAP_READ_ONLY=true); -Write opts into the dev-tier write
# path for verify chains that deploy (VERIFY-PATTERNS.md sec 3 / sec 4). Because
# this runs as its own process, credentials never leak back to the parent shell.
$vspEnvScript = Join-Path $PSScriptRoot 'vsp-env.ps1'
try {
    if ($Write) {
        . $vspEnvScript -ProfileName $ProfileName -Write > $null
    } else {
        . $vspEnvScript -ProfileName $ProfileName > $null
    }
} catch {
    Write-Output "ENV_FAIL: SAP credential provisioning failed (profile '$ProfileName' via vsp-env.ps1)"
    exit 1
}

# Preflight: separate ENV_FAIL early via connectivity check.
$null = & $VSP system info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Output "ENV_FAIL: no SAP connectivity (vsp system info exit $LASTEXITCODE)"
    exit 1
}

# Run the actual verify command; capture stdout+stderr for classification.
$rawOutput = & $VSP @VspArgs 2>&1
$exitCode = $LASTEXITCODE
$text = ($rawOutput | ForEach-Object { $_.ToString() }) -join "`n"
if ($text) { Write-Output $text }

if ($exitCode -eq 0) {
    Write-Output "VERIFY_PASS"
    exit 0
}

# Classification (case-insensitive). Order matters: LOCK_FAIL is checked before
# ENV_FAIL because the one measured lock case returns HTTP 403, which the
# ENV_FAIL "403" fallback keyword would otherwise misclassify.
$lower = $text.ToLowerInvariant()

# LOCK_FAIL - measured 2026-07-11: concurrent deploy on an object another
# session is editing triggers a real SAP ENQUEUE lock. Raw capture:
#   "Failed to lock object: locking object: ADT API error: status 403 ...
#    ExceptionResourceNoAccess ... User <x> is currently editing <object> ...
#    (by an ENQUEUE lock)"
$lockMeasured = "failed to lock object|lock failed:|exceptionresourcenoaccess|is currently editing|enqueue lock"
$lockFallback = "lock|enqueue|sperr"  # keyword fallback; not independently measured

# ENV_FAIL - measured 2026-07-11, four sub-cases (adapters/vsp/COMMANDS.md):
#   DNS failure      -> "dial tcp: lookup <host>: no such host"
#   port unreachable -> "dial tcp <ip>:<port>: connectex: ..." (~21s to time out)
#   bad credentials  -> "authentication failed (401): check username/password"
#   TLS cert failure -> "tls: failed to verify certificate: x509: certificate
#                        signed by unknown authority"
$envMeasured = "no such host|dial tcp|connectex|authentication failed \(401\)|certificate signed by unknown authority"
$envFallback = "connection|timeout|unauthorized|401|403|refused"  # keyword fallback

if ($lower -match $lockMeasured -or $lower -match $lockFallback) {
    Write-Output "LOCK_FAIL: transient lock detected (vsp exit $exitCode)"
} elseif ($lower -match $envMeasured -or $lower -match $envFallback) {
    Write-Output "ENV_FAIL: connectivity/auth failure (vsp exit $exitCode)"
} else {
    # CODE_FAIL - measured 2026-07-11 (adapters/vsp/COMMANDS.md):
    #   syntax error on deploy -> "Object created but has N syntax errors" /
    #                             "Syntax errors:" / "Error: deploy failed"
    #   object not found       -> "ADT API error: status 404" (e.g. source read
    #                             of a nonexistent object)
    #   lint failure           -> "Error: N issues found" appears TWICE with a
    #                             full cobra Usage block sandwiched between the
    #                             two occurrences; harmless for the substring
    #                             match used here, but a caller extracting the
    #                             exact count must take the FIRST match only.
    Write-Output "CODE_FAIL: vsp exit $exitCode"
}
exit 1
