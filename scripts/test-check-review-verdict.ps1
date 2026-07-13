# test-check-review-verdict.ps1 - reproduction tests for the unattended
# review-gate checker (scripts/check-review-verdict.ps1).
#
# Spec: docs/reference/designs/2026-07-13-unattended-review-gate.md
#   Acceptance criteria 1-4 (AC5 is a live-SAP criterion, out of scope here).
#
# Each case builds a throwaway git fixture repo under the OS temp dir (never
# the real repo) and drives the real checker as a fresh child process whose
# working directory is the fixture - exactly how the engine runs verify
# (execute.py:2399, cwd = repo root). The child sets both Set-Location and
# [Environment]::CurrentDirectory so native git and the relative -Verdict path
# both resolve against the fixture.
#
# Capture files live OUTSIDE the fixture so they never pollute git status.
# Fixtures are removed on exit.
#
# PowerShell 5.1 compatible. ASCII only. Dependencies: git only.

$ErrorActionPreference = "Stop"

$script:CheckerPath = Join-Path $PSScriptRoot "check-review-verdict.ps1"
if (-not (Test-Path -LiteralPath $script:CheckerPath)) {
    Write-Output "TEST_ABORT: checker not found at $script:CheckerPath"
    exit 1
}

$script:Fixtures = @()
$script:Pass = 0
$script:Fail = 0
$script:Rows = @()

# --- helpers ---------------------------------------------------------------

function New-Fixture {
    $dir = Join-Path ([System.IO.Path]::GetTempPath()) ("crv-" + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $dir | Out-Null
    $script:Fixtures += $dir
    & git -C $dir init -q 2>$null | Out-Null
    & git -C $dir config user.email "test@example.com" 2>$null | Out-Null
    & git -C $dir config user.name  "crv-test"         2>$null | Out-Null
    & git -C $dir config commit.gpgsign false          2>$null | Out-Null
    & git -C $dir config core.autocrlf false           2>$null | Out-Null
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

function Set-Verdict($dir, $phase, $verdict, $head, $findingsJson) {
    $rel = "phases/$phase/review-verdict.json"
    $json = "{`n  ""verdict"": ""$verdict"",`n  ""reviewed_head"": ""$head"",`n  ""findings"": $findingsJson`n}"
    Write-Fixt $dir $rel $json
    return $rel
}

function Commit-All($dir, $msg) {
    & git -C $dir add -A 2>$null | Out-Null
    & git -C $dir commit -q -m $msg 2>$null | Out-Null
}

function Head-Of($dir) {
    return (& git -C $dir rev-parse HEAD 2>$null).Trim()
}

# Run the real checker as a fresh child powershell rooted at the fixture.
function Invoke-Checker($dir, $phase, $verdictRel) {
    $cmd = "Set-Location -LiteralPath '$dir'; [Environment]::CurrentDirectory='$dir'; & '$script:CheckerPath' -Phase '$phase' -Verdict '$verdictRel'"
    $out = & powershell.exe -NoProfile -ExecutionPolicy Bypass -Command $cmd 2>&1
    $exit = $LASTEXITCODE
    return [pscustomobject]@{ Exit = $exit; Out = ($out | Out-String) }
}

# Run the spec's sha256-pin wrapper command form (Key entities example),
# rooted at the fixture (so the relative 'scripts/...' path resolves there).
function Invoke-Wrapper($dir, $phase, $pin) {
    $inner = "`$s='scripts/check-review-verdict.ps1'; if ((Get-FileHash `$s -Algorithm SHA256).Hash -ne '$pin') { Write-Output 'CHECKER_TAMPERED'; exit 1 }; & `$s -Phase '$phase' -Verdict 'phases/$phase/review-verdict.json'"
    $cmd = "Set-Location -LiteralPath '$dir'; [Environment]::CurrentDirectory='$dir'; $inner"
    $out = & powershell.exe -NoProfile -ExecutionPolicy Bypass -Command $cmd 2>&1
    $exit = $LASTEXITCODE
    return [pscustomobject]@{ Exit = $exit; Out = ($out | Out-String) }
}

function Check($name, $expectedExit, $result, $extraOk, $note) {
    if ($null -eq $extraOk) { $extraOk = $true }
    $ok = ($result.Exit -eq $expectedExit) -and $extraOk
    if ($ok) { $script:Pass++ } else { $script:Fail++ }
    $status = if ($ok) { "PASS" } else { "FAIL" }
    $script:Rows += [pscustomobject]@{
        Case = $name; Expected = $expectedExit; Actual = $result.Exit; Result = $status
    }
    Write-Output ("[{0}] {1} -- expected exit {2}, got {3}{4}" -f `
        $status, $name, $expectedExit, $result.Exit, $(if ($note) { " ($note)" } else { "" }))
    if (-not $ok) {
        Write-Output ("       reason line: " + ($result.Out -replace "`r?`n", " ").Trim())
    }
}

# Common building blocks for a phase fixture.
$MINOR = '[ { "bucket": "B1", "severity": "MINOR", "object": "ZCL_X", "finding": "naming" } ]'
$MAJOR = '[ { "bucket": "B2", "severity": "MAJOR", "object": "ZCL_X", "finding": "INNER vs LEFT JOIN drops rows" } ]'
$phase = "1-demo"

function Scaffold-Base($dir) {
    Write-Fixt $dir "src/zcl_foo.abap"                "CLASS zcl_foo DEFINITION. ENDCLASS."
    Write-Fixt $dir "phases/$phase/index.json"        '{ "steps": [] }'
    Write-Fixt $dir "phases/$phase/step0.md"          "# step0"
}

# --- test body -------------------------------------------------------------

try {

    # AC2 - normal path: fresh PASS verdict, reviewed_head == HEAD, only the
    # verdict is dirty -> exit 0.
    {
        $dir = New-Fixture
        Scaffold-Base $dir
        Commit-All $dir "c1 base"
        $rel = Set-Verdict $dir $phase "PASS" (Head-Of $dir) $MINOR
        $r = Invoke-Checker $dir $phase $rel
        Check "AC2 normal PASS (only verdict dirty)" 0 $r $true "the happy path"
    }.Invoke()

    # AC1(a) - stale PASS committed in the previous commit, no dirty this
    # attempt -> exit 1. (reviewed_head is the source commit the reviewer saw;
    # HEAD advanced when the engine committed the verdict -> blocked.)
    {
        $dir = New-Fixture
        Scaffold-Base $dir
        Commit-All $dir "c1 base"
        $shaA = Head-Of $dir
        $rel = Set-Verdict $dir $phase "PASS" $shaA $MINOR
        Commit-All $dir "c2 commit verdict (stale)"
        $r = Invoke-Checker $dir $phase $rel
        Check "AC1(a) stale committed PASS -> blocked" 1 $r $true "no dirty this attempt"
    }.Invoke()

    # AC1(b) - reviewer sneaks a code change: verdict + src/*.abap both dirty
    # -> superset -> exit 1.
    {
        $dir = New-Fixture
        Scaffold-Base $dir
        Commit-All $dir "c1 base"
        $rel = Set-Verdict $dir $phase "PASS" (Head-Of $dir) $MINOR
        Add-Content -LiteralPath (Join-Path $dir "src\zcl_foo.abap") -Value "* sneaked edit"
        $r = Invoke-Checker $dir $phase $rel
        $extra = ($r.Out -match "zcl_foo\.abap")
        Check "AC1(b) reviewer code edit -> blocked" 1 $r $extra "verdict + src both dirty"
    }.Invoke()

    # AC1(c) - reviewed_head does not match current HEAD -> exit 1.
    {
        $dir = New-Fixture
        Scaffold-Base $dir
        Commit-All $dir "c1 base"
        $rel = Set-Verdict $dir $phase "PASS" ("0" * 40) $MINOR
        $r = Invoke-Checker $dir $phase $rel
        $extra = ($r.Out -match "HEAD")
        Check "AC1(c) reviewed_head != HEAD -> blocked" 1 $r $extra "head binding"
    }.Invoke()

    # AC3 basis - FAIL verdict -> exit 1.
    {
        $dir = New-Fixture
        Scaffold-Base $dir
        Commit-All $dir "c1 base"
        $rel = Set-Verdict $dir $phase "FAIL" (Head-Of $dir) $MAJOR
        $r = Invoke-Checker $dir $phase $rel
        Check "AC3 FAIL verdict -> blocked" 1 $r $true "verdict != PASS"
    }.Invoke()

    # Defense - verdict says PASS but a MAJOR finding is present -> exit 1.
    {
        $dir = New-Fixture
        Scaffold-Base $dir
        Commit-All $dir "c1 base"
        $rel = Set-Verdict $dir $phase "PASS" (Head-Of $dir) $MAJOR
        $r = Invoke-Checker $dir $phase $rel
        $extra = ($r.Out -match "MAJOR")
        Check "DEFENSE PASS-with-MAJOR -> blocked" 1 $r $extra "consistency check"
    }.Invoke()

    # Exclusion set - all bookkeeping files dirty + verdict dirty -> exit 0.
    {
        $dir = New-Fixture
        Scaffold-Base $dir
        Write-Fixt $dir "phases/$phase/step0-output.json" '{ "ok": true }'
        Write-Fixt $dir "phases/$phase/run-summary.json"  '{ "ok": true }'
        Write-Fixt $dir "phases/$phase/run-history.jsonl" '{"t":1}'
        Write-Fixt $dir ".harness/STATE.md"               "# state"
        Commit-All $dir "c1 base + bookkeeping"
        $rel = Set-Verdict $dir $phase "PASS" (Head-Of $dir) $MINOR
        Add-Content -LiteralPath (Join-Path $dir "phases\$phase\index.json")        -Value " "
        Add-Content -LiteralPath (Join-Path $dir "phases\$phase\step0-output.json") -Value " "
        Add-Content -LiteralPath (Join-Path $dir "phases\$phase\run-summary.json")  -Value " "
        Add-Content -LiteralPath (Join-Path $dir "phases\$phase\run-history.jsonl") -Value "`n{""t"":2}"
        Add-Content -LiteralPath (Join-Path $dir ".harness\STATE.md")               -Value "more"
        $r = Invoke-Checker $dir $phase $rel
        Check "EXCLUSION bookkeeping+verdict dirty -> pass" 0 $r $true "bookkeeping excluded"
    }.Invoke()

    # verdict file absent -> exit 1.
    {
        $dir = New-Fixture
        Scaffold-Base $dir
        Commit-All $dir "c1 base"
        $r = Invoke-Checker $dir $phase "phases/$phase/review-verdict.json"
        $extra = ($r.Out -match "not found")
        Check "MISSING verdict file -> blocked" 1 $r $extra "fail-closed"
    }.Invoke()

    # Untracked NEW directory with a file inside must be seen (-uall) -> exit 1,
    # and the checker must report the nested FILE path (plain --porcelain would
    # collapse the directory and hide it).
    {
        $dir = New-Fixture
        Scaffold-Base $dir
        Commit-All $dir "c1 base"
        $rel = Set-Verdict $dir $phase "PASS" (Head-Of $dir) $MINOR
        Write-Fixt $dir "src/newpkg/sneak.abap" "CLASS sneak DEFINITION. ENDCLASS."
        $r = Invoke-Checker $dir $phase $rel
        $extra = ($r.Out -match "src/newpkg/sneak\.abap")
        Check "UALL nested untracked file -> blocked" 1 $r $extra "file inside new dir is seen"
    }.Invoke()

    # Malformed JSON -> exit 1 (fail-closed on parse error).
    {
        $dir = New-Fixture
        Scaffold-Base $dir
        Commit-All $dir "c1 base"
        Write-Fixt $dir "phases/$phase/review-verdict.json" "{ this is not valid json "
        $r = Invoke-Checker $dir $phase "phases/$phase/review-verdict.json"
        Check "MALFORMED json -> blocked" 1 $r $true "fail-closed parse"
    }.Invoke()

    # Missing reviewed_head field -> exit 1.
    {
        $dir = New-Fixture
        Scaffold-Base $dir
        Commit-All $dir "c1 base"
        Write-Fixt $dir "phases/$phase/review-verdict.json" '{ "verdict": "PASS", "findings": [] }'
        $r = Invoke-Checker $dir $phase "phases/$phase/review-verdict.json"
        $extra = ($r.Out -match "reviewed_head")
        Check "MISSING reviewed_head -> blocked" 1 $r $extra "field required"
    }.Invoke()

    # AC4 - sha256-pin wrapper. Correct pin runs the checker (exit 0); after a
    # 1-byte tamper the pin mismatches -> CHECKER_TAMPERED, exit 1.
    {
        $dir = New-Fixture
        Scaffold-Base $dir
        New-Item -ItemType Directory -Path (Join-Path $dir "scripts") -Force | Out-Null
        $copied = Join-Path $dir "scripts\check-review-verdict.ps1"
        Copy-Item -LiteralPath $script:CheckerPath -Destination $copied -Force
        Commit-All $dir "c1 base + checker copy"
        $rel = Set-Verdict $dir $phase "PASS" (Head-Of $dir) $MINOR
        $pin = (Get-FileHash -LiteralPath $copied -Algorithm SHA256).Hash

        # correct pin -> checker runs, verdict valid -> exit 0, no tamper marker
        $r1 = Invoke-Wrapper $dir $phase $pin
        $extra1 = (-not ($r1.Out -match "CHECKER_TAMPERED"))
        Check "AC4 wrapper correct pin -> pass" 0 $r1 $extra1 "pin matches, checker runs"

        # tamper the copied checker by 1 byte -> pin mismatch
        Add-Content -LiteralPath $copied -Value "#"
        $r2 = Invoke-Wrapper $dir $phase $pin
        $extra2 = ($r2.Out -match "CHECKER_TAMPERED")
        Check "AC4 wrapper tampered checker -> blocked" 1 $r2 $extra2 "sha256 mismatch"
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
