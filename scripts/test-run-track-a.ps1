# test-run-track-a.ps1 - negative tests for the Track A Engine entry wrapper
# (scripts/run-track-a.ps1).
#
# Spec: docs/reference/designs/2026-07-16-integration-hardening-roadmap.md S2-C.
# Pass criteria (S2 §8.5): "legacy deny 음성시험 전부 PASS".
#
# The wrapper is fail-closed: today it can never launch the Engine (the lock's
# candidate is 'selected', not 'staged'). These tests pin the exit-code contract
# so a later change cannot silently widen authority.
#
# Exit codes under test:
#   64 LEGACY_PHASE_DENY  | 65 ENGINE_UNAVAILABLE
#   66 CONTRACT_MISSING   | 67 LOCK_INVALID   | 0 OK (-WhatIf)
#
# Each case builds a throwaway fixture under the OS temp dir (never the real
# repo) and drives the real wrapper as a fresh child process rooted there.
#
# PowerShell 5.1 compatible. ASCII only.

$ErrorActionPreference = "Stop"

$script:WrapperPath = Join-Path $PSScriptRoot "run-track-a.ps1"
if (-not (Test-Path -LiteralPath $script:WrapperPath)) {
    Write-Output "TEST_ABORT: wrapper not found at $script:WrapperPath"
    exit 1
}
$script:RealLock = Join-Path (Split-Path -Parent $PSScriptRoot) "adapters\final-harness.lock.json"

$script:Fixtures = @()
$script:Pass = 0
$script:Fail = 0
$script:Rows = @()

# --- helpers ---------------------------------------------------------------

function New-Fixture {
    $dir = Join-Path ([System.IO.Path]::GetTempPath()) ("rta-" + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $dir | Out-Null
    $script:Fixtures += $dir
    return $dir
}

function Write-Fixt($dir, $rel, $content) {
    $full = Join-Path $dir ($rel -replace '/', '\')
    $parent = Split-Path -Parent $full
    if (-not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    Set-Content -LiteralPath $full -Value $content -Encoding ASCII
}

$script:SafetyBlock = @'
  "safety_state": {
    "execution": "attended-only",
    "unattended": "sealed",
    "historical_rv4_classifier": "open",
    "sap_mutation_boundary": "unverified"
  },
'@

function Write-Lock($dir, $candState, $safetyBlock) {
    if ([string]::IsNullOrEmpty($safetyBlock)) { $safetyBlock = $script:SafetyBlock }
    $json = @"
{
  "schema_version": 2,
$safetyBlock
  "verified": { "commit": "8f7f13bc977bb686e62dd44651ce78c5250e2e8a", "version": "v0.17.3" },
  "candidate": { "commit": "d4a0aeb0bdbcea008dbe2926006ee2e06eac2fc3", "version": "v0.20.0", "state": "$candState" }
}
"@
    Write-Fixt $dir "adapters/final-harness.lock.json" $json
}

function Write-Run($dir, $runId, $approved, $manifestRunId) {
    if ([string]::IsNullOrEmpty($manifestRunId)) { $manifestRunId = $runId }
    Write-Fixt $dir ".harness/runs/$runId/contract.md" "# run contract"
    Write-Fixt $dir ".harness/runs/$runId/manifest.json" ('{ "run_id": "' + $manifestRunId + '", "approved": ' + $approved + ' }')
}

# NOTE: must use -File, not -Command. `powershell.exe -Command` normalizes the
# child exit code to 0/1, which would collapse 64/65/66/67 into 1 and make this
# whole suite vacuous (measured 2026-07-16). -File propagates the real code.
# The child inherits the working directory from the parent process, so we set
# both Set-Location and [Environment]::CurrentDirectory before launching.
function Invoke-Wrapper($dir, [string[]]$wrapperArgs) {
    $prev = (Get-Location).Path
    try {
        Set-Location -LiteralPath $dir
        [Environment]::CurrentDirectory = $dir
        $out = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $script:WrapperPath @wrapperArgs 2>&1
        $exit = $LASTEXITCODE
        return [pscustomobject]@{ Exit = $exit; Out = ($out | Out-String) }
    } finally {
        Set-Location -LiteralPath $prev
        [Environment]::CurrentDirectory = $prev
    }
}

function Check($name, $expectedExit, $result, $expectMarker) {
    $markerOk = $true
    if ($expectMarker) { $markerOk = ($result.Out -match [regex]::Escape($expectMarker)) }
    $ok = ($result.Exit -eq $expectedExit) -and $markerOk
    if ($ok) { $script:Pass++ } else { $script:Fail++ }
    $status = if ($ok) { "PASS" } else { "FAIL" }
    $script:Rows += [pscustomobject]@{
        Case = $name; Expected = $expectedExit; Actual = $result.Exit; Result = $status
    }
    Write-Output ("[{0}] {1} -- expected exit {2}, got {3}" -f $status, $name, $expectedExit, $result.Exit)
    if (-not $ok) {
        Write-Output ("       output: " + ($result.Out -replace "`r?`n", " ").Trim())
    }
}

$run = "r-demo-001"

# --- test body -------------------------------------------------------------

try {

    # --- 64 LEGACY_PHASE_DENY ---------------------------------------------

    {
        $dir = New-Fixture; Write-Lock $dir "staged" $null; Write-Run $dir $run "true" $null
        $r = Invoke-Wrapper $dir @('-Phase', '1-demo', '-Candidate')
        Check "legacy -Phase -> 64" 64 $r "LEGACY_PHASE_DENY"
    }.Invoke()

    {
        $dir = New-Fixture; Write-Lock $dir "staged" $null; Write-Run $dir $run "true" $null
        $r = Invoke-Wrapper $dir @('-Candidate')
        Check "no -RunId -> 64" 64 $r "LEGACY_PHASE_DENY"
    }.Invoke()

    {
        $dir = New-Fixture; Write-Lock $dir "staged" $null; Write-Run $dir $run "true" $null
        $r = Invoke-Wrapper $dir @('-RunId', '../escape', '-Candidate')
        Check "bad run id format -> 64" 64 $r "LEGACY_PHASE_DENY"
    }.Invoke()

    # --- 67 LOCK_INVALID ---------------------------------------------------

    {
        $dir = New-Fixture; Write-Run $dir $run "true" $null
        $r = Invoke-Wrapper $dir @('-RunId', $run, '-Candidate')
        Check "lock missing -> 67" 67 $r "LOCK_INVALID"
    }.Invoke()

    {
        $dir = New-Fixture
        Write-Fixt $dir "adapters/final-harness.lock.json" '{ "verified_commit": "8f7f13b", "version": "v0.17.3" }'
        Write-Run $dir $run "true" $null
        $r = Invoke-Wrapper $dir @('-RunId', $run, '-Candidate')
        Check "v1 lock (no schema_version 2) -> 67" 67 $r "LOCK_INVALID"
    }.Invoke()

    {
        # safety_state drift: someone tries to unseal unattended by editing JSON
        $drift = @'
  "safety_state": {
    "execution": "attended-only",
    "unattended": "open",
    "historical_rv4_classifier": "open",
    "sap_mutation_boundary": "unverified"
  },
'@
        $dir = New-Fixture; Write-Lock $dir "staged" $drift; Write-Run $dir $run "true" $null
        $r = Invoke-Wrapper $dir @('-RunId', $run, '-Candidate')
        Check "safety_state unattended drift -> 67" 67 $r "LOCK_INVALID"
    }.Invoke()

    {
        # dishonest boundary: claiming the RV4 gap is closed
        $drift = @'
  "safety_state": {
    "execution": "attended-only",
    "unattended": "sealed",
    "historical_rv4_classifier": "closed",
    "sap_mutation_boundary": "unverified"
  },
'@
        $dir = New-Fixture; Write-Lock $dir "staged" $drift; Write-Run $dir $run "true" $null
        $r = Invoke-Wrapper $dir @('-RunId', $run, '-Candidate')
        Check "safety_state rv4 'closed' drift -> 67" 67 $r "LOCK_INVALID"
    }.Invoke()

    # --- 65 ENGINE_UNAVAILABLE --------------------------------------------

    {
        $dir = New-Fixture; Write-Lock $dir "selected" $null; Write-Run $dir $run "true" $null
        $r = Invoke-Wrapper $dir @('-RunId', $run, '-Candidate')
        Check "candidate selected (not staged) -> 65" 65 $r "ENGINE_UNAVAILABLE"
    }.Invoke()

    {
        $dir = New-Fixture; Write-Lock $dir "staged" $null; Write-Run $dir $run "true" $null
        $r = Invoke-Wrapper $dir @('-RunId', $run)
        Check "staged but no -Candidate opt-in -> 65" 65 $r "ENGINE_UNAVAILABLE"
    }.Invoke()

    # --- 66 CONTRACT_MISSING ----------------------------------------------

    {
        $dir = New-Fixture; Write-Lock $dir "staged" $null
        $r = Invoke-Wrapper $dir @('-RunId', $run, '-Candidate')
        Check "no run dir -> 66" 66 $r "CONTRACT_MISSING"
    }.Invoke()

    {
        $dir = New-Fixture; Write-Lock $dir "staged" $null
        Write-Fixt $dir ".harness/runs/$run/manifest.json" ('{ "run_id": "' + $run + '", "approved": true }')
        $r = Invoke-Wrapper $dir @('-RunId', $run, '-Candidate')
        Check "no contract.md -> 66" 66 $r "CONTRACT_MISSING"
    }.Invoke()

    {
        $dir = New-Fixture; Write-Lock $dir "staged" $null
        Write-Fixt $dir ".harness/runs/$run/contract.md" "# c"
        $r = Invoke-Wrapper $dir @('-RunId', $run, '-Candidate')
        Check "no manifest.json -> 66" 66 $r "CONTRACT_MISSING"
    }.Invoke()

    {
        $dir = New-Fixture; Write-Lock $dir "staged" $null; Write-Run $dir $run "false" $null
        $r = Invoke-Wrapper $dir @('-RunId', $run, '-Candidate')
        Check "manifest.approved=false -> 66" 66 $r "CONTRACT_MISSING"
    }.Invoke()

    {
        $dir = New-Fixture; Write-Lock $dir "staged" $null; Write-Run $dir $run "true" "r-other-999"
        $r = Invoke-Wrapper $dir @('-RunId', $run, '-Candidate')
        Check "manifest.run_id cross-run replay -> 66" 66 $r "CONTRACT_MISSING"
    }.Invoke()

    # --- 0 OK (-WhatIf, all gates pass) ------------------------------------

    {
        $dir = New-Fixture; Write-Lock $dir "staged" $null; Write-Run $dir $run "true" $null
        $r = Invoke-Wrapper $dir @('-RunId', $run, '-Candidate', '-WhatIf')
        Check "all gates pass (-WhatIf) -> 0" 0 $r "TRACK_A_GATES_PASS"
    }.Invoke()

    # --- the REAL lock must currently deny (candidate is selected) ---------

    {
        $dir = New-Fixture
        New-Item -ItemType Directory -Path (Join-Path $dir "adapters") -Force | Out-Null
        Copy-Item -LiteralPath $script:RealLock -Destination (Join-Path $dir "adapters\final-harness.lock.json") -Force
        Write-Run $dir $run "true" $null
        $r = Invoke-Wrapper $dir @('-RunId', $run, '-Candidate')
        Check "REAL lock today -> 65 (candidate selected)" 65 $r "ENGINE_UNAVAILABLE"
    }.Invoke()

}
finally {
    foreach ($f in $script:Fixtures) {
        if ($f -and (Test-Path -LiteralPath $f)) {
            Remove-Item -LiteralPath $f -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# --- summary ---------------------------------------------------------------

Write-Output ""
Write-Output "==================== SUMMARY ===================="
$script:Rows | Format-Table -AutoSize | Out-String | Write-Output
Write-Output ("Total: {0}  Passed: {1}  Failed: {2}" -f ($script:Pass + $script:Fail), $script:Pass, $script:Fail)

if ($script:Fail -eq 0) {
    Write-Output "RESULT: ALL PASS"
    exit 0
} else {
    Write-Output "RESULT: FAILURES PRESENT"
    exit 1
}
