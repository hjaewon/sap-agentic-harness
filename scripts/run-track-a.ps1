# run-track-a.ps1 - the SOLE entry point for Track A Engine attended runs.
#
# AGENTS.md: "The sole entry is scripts/run-track-a.ps1; raw scripts/execute.py
# invocation is prohibited. Missing wrapper or contract means Engine is
# unavailable, with no bypass."
#
# Spec: docs/reference/designs/2026-07-16-integration-hardening-roadmap.md S2-C.
# Decisions: D-025 (attended-only, unattended=sealed), D-027 (order),
#            D-028 (candidate d4a0aeb, state=selected).
#
# This wrapper is deliberately FAIL-CLOSED. It refuses more often than it runs.
# In particular, at the time of writing it CANNOT launch the Engine at all: the
# lock's candidate is `selected`, not `staged`, and S4 (independent review +
# disposable staging) has not run. That is the intended state - S2 builds the
# contract; it does not grant execution.
#
# Exit codes (stable - callers and tests depend on them):
#   0   OK                  - all gates passed; Engine launched (or -WhatIf ok)
#   64  LEGACY_PHASE_DENY   - no run id, or a legacy -Phase invocation
#   65  ENGINE_UNAVAILABLE  - candidate not staged, or -Candidate not given
#   66  CONTRACT_MISSING    - no approved run contract/manifest for this run
#   67  LOCK_INVALID        - lock unreadable / wrong schema / safety_state drift
#
# Usage (once the candidate is staged - not yet):
#   & scripts/run-track-a.ps1 -RunId <id> -Candidate
#   & scripts/run-track-a.ps1 -RunId <id> -Candidate -WhatIf   (gate check only)
#
# PowerShell 5.1 compatible. ASCII only.

param(
    [string]$RunId,
    [switch]$Candidate,
    [switch]$WhatIf,
    [string]$Phase
)

$ErrorActionPreference = "Stop"

function Deny([int]$code, [string]$marker, [string]$reason) {
    Write-Output "${marker}: $reason"
    exit $code
}

# --- (1) legacy axis / missing run id -> 64 -------------------------------
# The phase axis is retired (roadmap S2-B). A run id is mandatory: without it
# there is no contract to bind authority to, so there is nothing to authorize.

if (-not [string]::IsNullOrWhiteSpace($Phase)) {
    Deny 64 "LEGACY_PHASE_DENY" "legacy -Phase '$Phase' is not supported; Track A runs on the run axis (-RunId). See roadmap S2-B."
}

if ([string]::IsNullOrWhiteSpace($RunId)) {
    Deny 64 "LEGACY_PHASE_DENY" "missing -RunId; the Engine has no entry without a run contract. Raw 'python scripts/execute.py <phase>' is prohibited (AGENTS.md)."
}

$runId = $RunId.Trim()
if ($runId -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$') {
    Deny 64 "LEGACY_PHASE_DENY" "run id has an unsupported format (got '$runId')"
}

# --- (2) lock: schema + safety_state -------------------------------------

$lockPath = "adapters/final-harness.lock.json"
if (-not (Test-Path -LiteralPath $lockPath -PathType Leaf)) {
    Deny 67 "LOCK_INVALID" "lock not found at $lockPath - fail-closed"
}
try {
    $lock = Get-Content -LiteralPath $lockPath -Raw -Encoding UTF8 -ErrorAction Stop | ConvertFrom-Json -ErrorAction Stop
} catch {
    Deny 67 "LOCK_INVALID" "lock unreadable/unparseable: $($_.Exception.Message)"
}
if ($null -eq $lock) { Deny 67 "LOCK_INVALID" "lock is empty" }

if ("$($lock.schema_version)" -cne "2") {
    Deny 67 "LOCK_INVALID" "lock schema_version must be 2 (got '$($lock.schema_version)') - this wrapper requires the v2 lock (verified/candidate/safety_state split)"
}

# safety_state must be present and exact. Drift here is never a routine edit;
# it means someone tried to widen authority by editing a JSON file.
$ss = $lock.safety_state
if ($null -eq $ss) { Deny 67 "LOCK_INVALID" "lock.safety_state missing - fail-closed" }
$expectSafety = @{
    "execution"                 = "attended-only";
    "unattended"                = "sealed";
    "historical_rv4_classifier" = "open";
    "sap_mutation_boundary"     = "unverified"
}
foreach ($k in $expectSafety.Keys) {
    $actual = "$($ss.$k)".Trim()
    if ($actual -cne $expectSafety[$k]) {
        Deny 67 "LOCK_INVALID" "lock.safety_state.$k must be exactly '$($expectSafety[$k])' (got '$actual') - safety state drift, fail-closed"
    }
}

# --- (3) candidate must be staged AND explicitly opted into -> else 65 ----

$cand = $lock.candidate
if ($null -eq $cand) { Deny 67 "LOCK_INVALID" "lock.candidate missing - fail-closed" }
$candState = "$($cand.state)".Trim()
$candSha = "$($cand.commit)".Trim()

if ($candState -cne "staged") {
    Deny 65 "ENGINE_UNAVAILABLE" "candidate $candSha is '$candState', not 'staged'. The Engine does not run on a candidate that has not passed S4 (independent review + disposable staging). Existing code is not authority - see roadmap S2.4/S4.6."
}

if (-not $Candidate) {
    Deny 65 "ENGINE_UNAVAILABLE" "candidate $candSha is staged but -Candidate was not given. Running a staged (not verified) engine requires an explicit opt-in on every invocation."
}

# --- (4) approved run contract/manifest -> else 66 ------------------------

$runDir      = ".harness/runs/$runId"
$contractPath = "$runDir/contract.md"
$manifestPath = "$runDir/manifest.json"

if (-not (Test-Path -LiteralPath $runDir -PathType Container)) {
    Deny 66 "CONTRACT_MISSING" "run directory $runDir does not exist. Promote a Track B draft with scripts/promote-track-b-run.ps1, or author the contract first."
}
if (-not (Test-Path -LiteralPath $contractPath -PathType Leaf)) {
    Deny 66 "CONTRACT_MISSING" "no run contract at $contractPath - the Engine is unavailable without an approved contract (AGENTS.md)"
}
if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
    Deny 66 "CONTRACT_MISSING" "no manifest at $manifestPath - authority is carried by the manifest; fail-closed"
}
try {
    $manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 -ErrorAction Stop | ConvertFrom-Json -ErrorAction Stop
} catch {
    Deny 66 "CONTRACT_MISSING" "manifest unreadable/unparseable: $($_.Exception.Message)"
}
if ($null -eq $manifest) { Deny 66 "CONTRACT_MISSING" "manifest is empty" }

if ("$($manifest.run_id)".Trim() -cne $runId) {
    Deny 66 "CONTRACT_MISSING" "manifest.run_id '$($manifest.run_id)' != -RunId '$runId' - a manifest cannot be replayed into another run"
}
if ("$($manifest.approved)".Trim() -cne "True" -and "$($manifest.approved)".Trim() -cne "true") {
    Deny 66 "CONTRACT_MISSING" "manifest.approved is not true - a human must approve the run contract before the Engine runs (attended-only)"
}

# --- (5) all gates passed -------------------------------------------------

if ($WhatIf) {
    Write-Output "TRACK_A_GATES_PASS: run=$runId, candidate=$candSha (staged), contract+manifest approved. -WhatIf: Engine not launched."
    exit 0
}

Write-Output "TRACK_A_LAUNCH: run=$runId, candidate=$candSha (staged, explicit -Candidate). attended-only; a human operator must remain present."

# The Engine invocation itself is deliberately NOT wired yet: no staged
# candidate exists, so this path is unreachable today and wiring it blind would
# be inventing an interface we have not measured against the candidate. S4
# stages the candidate and measures the installed entry point; the launch line
# lands then, in the same change that flips candidate.state to 'staged'.
Deny 65 "ENGINE_UNAVAILABLE" "launch path not wired - reachable only after S4 stages a candidate and measures the installed Engine entry point. This is fail-closed by design, not a bug."
