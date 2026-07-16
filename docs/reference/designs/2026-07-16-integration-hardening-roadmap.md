# SAP Agentic Harness 통합 보강 실행 설계

> 상태: 사용자 승인 실행순서 정본
>
> 작성일: 2026-07-16
>
> 결정: D-027
>
> 적용 범위: sap-agentic-harness, claude-fable-final, vsp-custom의 통합 경계
>
> 대체 범위: 2026-07-15 Track A rebase v2의 Policy 결정은 유지한다. 다만 그 문서의
> candidate=6de63ba 고정과 “§11 덩어리 3부터 곧바로 진행” 순서는 이 문서가 대체한다.
>
> 이 문서는 Claude 등 새 컨텍스트의 구현자가 단독으로 읽고 순서·게이트·중단 조건을
> 복원할 수 있게 만든 실행 설계서다. 세부 Track A Policy와 P4 state machine은
> 2026-07-15-track-a-rebase-v2.md를 함께 따른다.

---

## 1. 목적

현재 저장소는 세 자산을 한 레포 안에서 사용하지만, 아직 하나의 완료 계약으로 닫히지
않았다.

1. final-harness는 Direct / Guided / Engine 실행 구조와 검증·재시도·학습 루프를 제공한다.
2. sc4sap-custom에서 이식한 Track B는 SAP 지식, 절차, MCP 도구와 3사 어댑터를 제공한다.
3. vsp-custom은 Engine 실행 backend와 적용 경로에 독립적인 SAP 완료 증거 backend다.

현 상태의 핵심 문제는 “부품 부재”가 아니라 “부품 사이 계약 불일치”다.

- Track A의 새 실행 구조는 문서에만 반영됐고 실제 executor는 v0.17.3이다.
- 필수 wrapper가 없어 Engine은 의도적으로 사용할 수 없다.
- Track B 절차는 별도 .sc4sap 승인·상태·리뷰 체계를 유지한다.
- Track B의 create/release 절차에는 과거 auto/unattended 계약이 남아 있다.
- final-harness 계획 candidate는 v0.19.3이지만 upstream은 v0.20 계열로 이동했다.
- sc4sap 이식 검증은 source commit을 고정하지 않고 private 디렉터리 엔트리까지 걷는다.
- CI 일부는 상태를 출력할 뿐 안전 계약을 assert하지 않는다.

따라서 이번 작업의 목표는 기능을 추가하는 것이 아니다. 먼저 아래의 단일 완료 흐름을
만드는 것이다.

~~~text
Track B 지식·인터뷰·spec
    -> Guided 승격 시 .harness/runs/<run-id> 계약으로 동결
    -> 승인된 MCP / vsp CLI / 사람 abapGit 경로로 적용
    -> vsp source-read + syntax + activate + unit + ATC 증거
    -> exact-subject R-PASS + V-PASS일 때만 COMPLETE
~~~

---

## 2. 권위와 불변식

### 2.1 문서 권위

충돌 시 다음 순서를 적용한다.

1. AGENTS.md와 .harness/RULES.md
2. D-025의 Policy 선택과 2026-07-15 Track A rebase v2의 P0~P4 계약
3. D-027과 이 문서의 작업 순서·candidate 재선정 계약
4. DESIGN.md와 HANDOFF.md의 살아있는 포인터
5. phases 아래의 과거 실행 기록

이 문서는 D-025의 O1/O2/O3를 뒤집지 않는다. 다음만 바꾼다.

- 6de63ba를 곧바로 staging하는 순서를 중단한다.
- Track B 안전 충돌을 먼저 제거한다.
- clean v0.20.x candidate를 다시 선정한 뒤 Track A Phase 5를 구현한다.
- Track A와 Track B 사이에 단방향 artifact handoff를 둔다.

### 2.2 현재 안전 상태

아래 문자열과 의미는 전 단계에서 exact 보존한다.

- attended-only
- unattended=sealed
- historical_rv4_classifier=open
- sap_mutation_boundary=unverified
- scope: reviewer + all attended children

추가 불변식:

- reviewer는 P0/P1만 수행한다.
- reviewer는 조회를 포함한 transport 동작을 하지 않는다.
- P2는 호출마다 범위·필드·row cap을 제시하고 사람 승인을 받는다.
- P2는 batch, subagent, auto-approval로 수행하지 않는다.
- SAP write는 DEV tier에서만 한다.
- Direct-P4 지원 경로는 없다.
- 실제 release/import는 전달 목적이 있는 별도 run에서만 한다.
- raw scripts/execute.py 호출은 지원하지 않는다.
- sc4sap-custom은 수정하지 않으며 private 디렉터리를 탐색하지 않는다.
- SAP 접속정보와 secret 값은 어떤 증거에도 기록하지 않는다.

### 2.3 완료 상태

SAP 코드 상태는 다음 네 단계로만 표현한다.

| 상태 | 의미 | 허용되는 근거 |
|---|---|---|
| DRAFT | 로컬 초안 또는 Direct 코드 | 로컬 diff, lint 등 |
| PROVISIONAL_WRITE | DEV에 반영됐지만 완료 게이트 미충족 | MCP/vsp/abapGit 적용 응답 |
| COMPLETE | exact-subject review와 vsp 검증 전부 충족 | R-PASS + V-PASS |
| READY_FOR_RELEASE | P4 T1~T5 완료, request는 modifiable | inventory hash + R/V-PASS |

MCP의 success, 활성 상태, 단일 syntax 결과만으로 COMPLETE를 선언하지 않는다.

---

## 3. 2026-07-16 기준선

### 3.1 sap-agentic-harness

- 분석 시작 시 main 작업트리는 clean이었으며, 이 설계 반영 뒤에는 문서 변경만 남는다.
- origin/main보다 로컬 커밋 5개가 앞서 있다.
- Track A 실행기 scripts/execute.py는 lock의 v0.17.3 blob과 동일하다.
- adapters/final-harness.lock.json은 schema v1이다.
- scripts/run-track-a.ps1는 없다.
- legacy-phase-policy.json과 LEGACY-CATALOG.md는 없다.
- .harness/runs 디렉터리는 아직 없다.
- 기존 phase-only review checker test는 13/13 PASS지만 새 run-scoped 계약은 아니다.

### 3.2 final-harness

- 기존 계획 candidate는 6de63ba, v0.19.3이다.
- upstream HEAD는 1209553이며 v0.20.0 이후 memory lifecycle 수정까지 포함한다.
- 현재 upstream working tree에는 별도의 미커밋 변경이 있다.
- v0.20은 Engine hook을 Engine child 수명주기로 격리하고 Direct zero-footprint를
  제품 계약으로 만든다.
- 미커밋 working tree는 candidate로 고정하지 않는다.

### 3.3 Track B

- link gate: Markdown 269개, 상대 링크 588개, broken 0.
- bundled engine integrity: 4.13.12 PASS.
- bundled engine offline/unit: 92 suites, 599 tests PASS.
- default inspection-only tools/list는 155개이며 write 이름도 노출된다.
- readonly exposition은 65개이며 write 이름은 0개다.
- 두 exposition 모두 GetTableContents/GetSqlQuery 이름은 노출한다.
- doctor는 설치된 Codex/Antigravity와 compatibility pin 차이로 FAIL한다.
- 역사적 L3/L6 E2E는 있으나 현재 CLI 버전 조합의 재검증은 없다.

### 3.4 sc4sap migration

- 매니페스트는 2026-07-10의 508파일을 기록한다.
- 현 live-source gate는 494파일을 보고한다.
- 매니페스트에 exact source commit이 없다.
- gate는 외부 source를 재귀 순회하므로 private 경계를 위반할 수 있다.
- source repo는 이식 시점 뒤 공개 영역도 변경됐다.

### 3.5 vsp-custom

- HEAD 0b03ef2와 lock이 일치한다.
- binary version과 SHA-256도 lock의 main-machine 항목과 일치한다.
- transport list/get help와 deploy --transport 표면은 존재한다.
- transport list/get의 live 출력 형상은 아직 검증하지 않았다.
- Windows CGO0 환경의 go test ./...는 전체 green이 아니다.
  - SQLite cache test는 go-sqlite3와 CGO0가 충돌한다.
  - jseval oracle test는 Windows에서 /tmp 경로를 사용한다.
  - recording history test는 빠른 ID 생성 시 중복으로 보이는 실패가 있다.

---

## 4. 목표 구조와 artifact 소유권

### 4.1 역할

| 구성요소 | 최종 역할 | 하지 않는 일 |
|---|---|---|
| Track B core | 지식·질문·spec·대화형 UX | 완료 판정 정본이 되지 않음 |
| Track B MCP | 사람 소유 Direct/Guided 적용 경로 | success를 완료 증거로 바꾸지 않음 |
| Track A | authority, run contract, review, retry, 상태 전이 | SAP 도구 표면을 중복 소유하지 않음 |
| vsp CLI | Engine 실행과 공통 V-PASS backend | MCP server로 기동하지 않음 |
| 사람/Basis | irreversible P4 release/import | reviewer 역할과 섞지 않음 |

### 4.2 artifact 정본

| artifact | 위치 | 정본 시점 |
|---|---|---|
| 인터뷰·초기 spec | .sc4sap/program/<object>/ | Direct 초안 단계 |
| Guided/Engine 계약 | .harness/runs/<run-id>/contract.md | 승격 순간부터 |
| manifest/authority | .harness/runs/<run-id>/manifest.json | Engine 또는 P4 |
| review verdict | .harness/runs/<run-id>/review-verdict.json | exact subject review |
| verification | .harness/runs/<run-id>/verification.json | vsp V-PASS |
| P4 inventory | .harness/runs/<run-id>/transport/ | Guided P4 |

승격 전에는 .sc4sap artifact가 작업 자료다. 승격 후에는 .harness/runs의 frozen hash가
정본이다. 두 위치를 양방향으로 갱신하지 않는다.

### 4.3 승격 adapter

Track B에서 Guided로 넘어가는 adapter는 다음 입력만 소비한다.

- 승인된 spec
- spec SHA-256
- 대상 SID/client/tier
- package
- object allowlist
- transport 의도
- 적용 경로

출력은 새 run 디렉터리 하나뿐이다. 기존 .sc4sap 파일을 수정하지 않는다.

승격 뒤 spec byte가 바뀌면 기존 review와 verification은 stale다. 새 hash로 다시
승격하거나 같은 run의 명시적 revision을 만들어야 한다.

---

## 5. 전체 작업 순서

~~~text
S0 Track B 안전 호환성 봉인
  -> S1 clean final-harness v0.20.x candidate 확정
  -> S2 Track A Policy/review/wrapper/bridge 구현
  -> S3 provenance·CI·vsp test 계약 보강
  -> S4 독립 리뷰 + disposable staging
  -> S5 attended connected gates와 pilot
  -> S6 기능 확장
~~~

S0은 지금 즉시 시작할 수 있다. S1의 candidate SHA가 없으면 S2의 candidate-specific
lock/wrapper 부분은 완료할 수 없다. S4 이전에는 주 머신에 새 Engine을 설치하지 않는다.
S5 이전에는 SAP connected/write를 실행하지 않는다.

---

## 6. S0 — Track B 안전 호환성 봉인

### 6.1 라우팅

- execution structure: Direct
- SAP Policy: P0 offline
- SAP 접속: 금지
- run artifact: 생성하지 않음

### 6.2 목적

현재 사용 가능한 Track B가 새 전역 Policy를 우회하지 못하게 한다. 이 단계는 upstream
candidate와 독립적이므로 가장 먼저 수행한다.

### 6.3 수정 대상

필수:

- interactive/core/procedures/create-program.md
- interactive/core/procedures/create-object.md
- interactive/core/procedures/release.md
- interactive/core/procedures/review-checklist.md

정합성 확인:

- interactive/core/policies/approval-gates.md
- interactive/core/policies/data-protection/data-extraction-policy.md
- interactive/core/procedures/schemas/*
- interactive/skills/create-program/SKILL.md
- interactive/skills/create-object/SKILL.md
- interactive/skills/release/SKILL.md
- interactive/adapters/*/README.md
- interactive/adapters/*의 AGENTS/rules template

### 6.4 변경 계약

#### create-program

- auto / manual / hybrid의 unattended 의미를 제거한다.
- Direct 단계는 interview/spec/local draft까지만 허용한다.
- SAP write 또는 완료 요청이 생기면 Guided 승격을 요구한다.
- 기존 .sc4sap state는 작업 자료로만 취급한다.
- final report는 R-PASS와 vsp V-PASS가 없으면 DRAFT 또는 PROVISIONAL_WRITE로 기록한다.

#### create-object

- 한 번 승인한 뒤 create/write/activate를 자동 완주하는 문구를 제거한다.
- DEV tier, package, object allowlist, transport 의도를 먼저 동결한다.
- P3 적용은 사람 attended 상태에서만 수행한다.
- MCP 활성화 성공은 PROVISIONAL_WRITE다.
- 완료하려면 Guided run으로 handoff한다.

#### release

- Direct-P4 entry를 제거한다.
- “선택 1회 확인 후 자동 release”를 금지한다.
- inventory 확인과 readiness는 T1~T5로 분리한다.
- 실제 release는 task 번호와 parent 번호를 각각 사람에게 즉시 제시하고 승인받는다.
- supported:false는 BLOCKED다.
- import는 사람/Basis STMS 전용이다.

#### reviewer

- 하네스 중립 core에서 “mechanically enforced”라고 단정하지 않는다.
- reviewer는 P0/P1만, 수정 금지, transport 동작 0을 명시한다.
- adapter별 방어 차이는 별도 표로 기록한다.
- 경계 상태는 sap_mutation_boundary=unverified로 유지한다.

#### P2

- Claude, Codex, Antigravity의 지원 상태를 분리한다.
- Codex에서 disabled_tools로 막혀 있으면 P2 unsupported로 표시한다.
- Antigravity excludeTools 미실측이면 P2 unsupported로 표시한다.
- “정책상 승인 가능”과 “현재 adapter가 기계적으로 지원”을 혼동하지 않는다.

### 6.5 합격 기준

- Track B mutation 절차에 unattended 권장 문구가 0건이다.
- release 자동 실행 문구가 0건이다.
- reviewer 기계격리 보편 주장 0건이다.
- DRAFT / PROVISIONAL_WRITE / COMPLETE / READY_FOR_RELEASE 상태가 절차와 일치한다.
- links gate가 PASS한다.
- server bundle byte는 변경되지 않는다.
- phases 아래 파일은 변경되지 않는다.
- current check-migration-coverage는 실행하지 않는다. S3에서 private-safe gate로
  교체하기 전에는 해당 명령 자체가 금지다.

### 6.6 중단 조건

- 변경이 D-025의 O1/O2/O3 선택을 뒤집어야만 가능해 보이면 중단한다.
- 실제 SAP 호출이 필요해지면 중단한다.
- sc4sap-custom/private의 내용을 요구하는 문서가 있으면 읽지 말고 public 대안으로
  다시 설계한다.

### 6.7 권장 commit

한 개의 독립 commit으로 묶는다.

예시 subject:

docs(interactive): align mutation workflows with attended Track A policy

---

## 7. S1 — clean final-harness v0.20.x candidate 확정

### 7.1 라우팅

- sap-agentic-harness에서의 분석: Direct-P0
- external final-harness 변경: 해당 repo의 별도 작업
- SAP 접속: 금지

### 7.2 목적

6de63ba를 계속 backport 대상으로 삼지 않고, Direct zero-footprint와 Engine-scoped hook을
포함한 clean v0.20.x SHA를 재현 가능한 candidate로 만든다.

### 7.3 선행조건

- final-harness working tree의 미커밋 파일 소유권을 확인한다.
- 사용자 작업을 reset, checkout, restore로 제거하지 않는다.
- secret.env 내용은 읽지 않는다.

### 7.4 절차

1. current HEAD, status, diff stat을 기록한다.
2. 미커밋 변경을 다음 중 하나로 명시적으로 처분한다.
   - 제품 변경으로 완료·테스트·commit
   - 별도 branch/worktree로 격리
   - 사용자가 명시적으로 제외
3. candidate가 될 commit에서 plugin version과 changelog를 정합화한다.
4. release_check.py를 authoritative 모드로 실행한다.
5. Python 3.9와 3.12 전체 tests를 통과한다.
6. Codex real CLI E2E와 Bridge/router repeat를 통과한다.
7. git diff --check와 clean status를 확인한다.
8. exact SHA, plugin blob version, release-check evidence hash를 기록한다.
9. 새 SHA 선택은 별도 append-only D-결정으로 봉인한다.

### 7.5 candidate 선택 기준

필수:

- clean commit
- v0.20의 Engine hook lifecycle 포함
- 1209553의 bounded docs lifecycle 포함
- 현재 dirty Git/install trust fixes를 포함할지 명시
- authoritative release check success=true
- user-owned hook 보존 계약
- Direct/Guided zero router process 계약

미충족 시 candidate를 선택하지 않는다.

### 7.6 합격 기준

- CANDIDATE_SHA가 하나로 확정된다.
- 해당 SHA는 clean detached checkout에서 재현된다.
- release evidence가 exact SHA에 묶인다.
- 6de63ba는 verified도 staged도 아니며 historical considered candidate로만 남는다.
- sap-agentic-harness lock은 아직 verified v0.17.3을 유지한다.

### 7.7 중단 조건

- dirty 변경 소유권이 불명확하다.
- release check가 비권위 또는 일부 lane SKIP이다.
- v0.20 installer가 Track B hook을 보존하지 못한다.
- Direct task에서 repo 흔적이나 router process가 발생한다.

---

## 8. S2 — Track A 계약·코드·bridge 구현

### 8.1 라우팅

- 구현과 로컬 테스트: Direct-P0
- fresh review 실행: 명시적 Guided-P0
- SAP 접속: 금지

### 8.2 목적

새 candidate에 맞춰 Track A Phase 5의 문서와 실행 코드를 함께 닫는다.

### 8.3 내부 순서

#### S2-A Policy 문서

수정:

- adapters/vsp/SAFETY-PROFILES.md
- adapters/vsp/VERIFY-PATTERNS.md
- 필요 시 adapters/vsp/COMMANDS.md의 미실측 상태

요구:

- old mode 축을 role + P0~P4로 교체
- reviewer credential과 worker credential을 분리해 설명
- historical RV4와 현재 open 상태를 구분
- “무인 전환 가능” 문구 제거
- P2/P4 owner와 approval 시점을 exact화

#### S2-B run-scoped review

수정:

- docs/reference/templates/review-step.md
- docs/reference/templates/review-gate-plan-conventions.md
- docs/reference/templates/review-verdict.schema.json
- scripts/check-review-verdict.ps1
- scripts/test-check-review-verdict.ps1

요구:

- -Phase 대신 -RunId
- exact source/diff hash
- exact dirty set
- boundary field
- reviewer output은 run의 review-verdict 하나
- source byte 변경 시 stale
- legacy -Phase는 신규 wrapper에서 거부

#### S2-C lock v2와 wrapper

신설/수정:

- adapters/final-harness.lock.json
- adapters/final-harness/legacy-phase-policy.json
- docs/reference/LEGACY-CATALOG.md
- scripts/run-track-a.ps1
- wrapper test

요구:

- verified v0.17.3 snapshot을 history 손실 없이 보존
- 새 CANDIDATE_SHA를 selected로 기록
- safety_state를 top-level에 둠
- no-run-id와 legacy phase는 exit 64 LEGACY_PHASE_DENY
- candidate는 staged + 명시 -Candidate 전에는 실행 불가
- raw execute 안내를 사용자 표면에서 제거

#### S2-D Track B -> Guided bridge

권장 신설:

- scripts/promote-track-b-run.ps1
- bridge schema 또는 mapping 문서
- bridge test

요구:

- 입력 .sc4sap 파일은 read-only
- 출력은 새 .harness/runs/<run-id>만
- spec hash, system, package, objects, transport intent, apply path를 동결
- 중복 run-id 거부
- source missing/malformed/hash mismatch fail-closed
- Direct에서는 자동 호출하지 않음

### 8.4 lock state

S2 완료 시에도 candidate는 selected다. 코드가 존재한다는 이유로 staged로 바꾸지 않는다.

### 8.5 합격 기준

- old “무인 전환 가능” current-state 문구 0건
- wrapper 외 Engine 안내 0건
- legacy deny 음성시험 전부 PASS
- run-scoped review checker tests 전부 PASS
- bridge 정상/중복/hash mismatch/malformed tests PASS
- safety_state exact 보존
- phases byte diff 0
- Engine을 실제로 실행하지 않음

---

## 9. S3 — provenance·CI·vsp test 계약 보강

### 9.1 라우팅

- Direct-P0
- SAP 접속: 금지
- sc4sap-custom 수정: 금지

### 9.2 sc4sap migration

현재 live filesystem walk를 폐기하고 다음 두 gate로 나눈다.

#### historical migration gate

- exact public source commit
- 명시된 public root allowlist
- path inventory hash
- copy 자산 content hash
- transform 자산 source list + target + review record
- private path enumeration 0

#### upstream drift report

- pinned source commit과 현재 public HEAD의 차이만 보고
- 자동 이식하지 않음
- private pathspec을 요청하지 않음
- 각 변경을 adopted / intentionally-diverged / obsolete / pending으로 분류

권장 위치:

- interactive/provenance/sc4sap-public-source.json
- interactive/provenance/migration-map.json
- interactive/scripts/check-migration-snapshot.mjs
- interactive/scripts/report-sc4sap-public-drift.mjs

### 9.3 engine source/bundle provenance

- integrity.json의 sourceCommit을 실제 sap-agentic-harness engine source commit에 묶는다.
- VERSION의 working tree, uncommitted 문구를 제거한다.
- 같은 commit에서 bundle을 다시 만들었을 때 byte/hash가 재현되는지 검사한다.
- 재현 불가하면 build environment와 artifact hash를 별도 lock에 기록한다.
- engine source tests 599개를 CI에 추가한다.

### 9.4 MCP smoke assertions

관찰 출력만 하지 말고 다음을 assert한다.

- inspection-only server 기동
- readonly exposition에서 mutation tools 0
- expected row-data tools의 노출/차단 상태
- adapter의 disabled/exclude tool contract
- tool count 변화 시 intentional manifest update 요구

고정 숫자만 보지 말고 tool class와 deny invariant를 함께 본다.

### 9.5 plugin metadata

- plugin version의 단일 source를 정한다.
- root marketplace, Claude manifest, Codex manifest, agy manifest를 생성한다.
- 실제 자산 수와 설명을 동기화한다.
- Codex 0.144.4, Antigravity 1.1.1을 재검증한 뒤 compatibility pin을 갱신한다.

### 9.6 vsp test

vsp-custom 별도 repo에서 수행한다.

필수 수리/판정:

- Windows /tmp oracle test는 t.TempDir로 교체
- recording ID는 timestamp 단독이 아닌 충돌 불가 식별자로 교체
- CGO0에서 SQLite cache tests를 명시적으로 skip하거나 pure-Go backend를 채택
- production CGO0 Windows lane
- 필요 시 CGO1 cache lane
- command-contract 관련 deploy/source/test/atc tests

vsp 전체 test green 전에도 현 lock binary를 사용할 수는 있으나, 실패를 숨기지 않고
“lock command contract 관련 PASS / unrelated known failure”로 분리 기록한다.

### 9.7 CI 합격 기준

- external source 없이 historical migration gate 실행 가능
- private 탐색 0
- links, engine integrity, engine tests, MCP assertions PASS
- review checker, wrapper, bridge tests PASS
- doctor는 현재 지원 CLI에서 PASS
- git diff --check PASS

---

## 10. S4 — 독립 리뷰와 disposable staging

### 10.1 라우팅

- staging: Direct-P0
- 독립 리뷰: 명시적 Guided-P0
- SAP 접속: 금지

### 10.2 선행조건

- S0~S3 전부 commit
- working tree clean
- CANDIDATE_SHA 확정
- candidate release evidence 존재
- wrapper와 lock v2 구현

### 10.3 독립 리뷰

한 번의 fresh-context review로 S0~S3 전체를 본다.

review subject:

- exact main HEAD
- exact dirty set 0
- 변경된 Policy/procedure/schema/code
- candidate SHA와 external evidence

reviewer 제한:

- P0/P1
- 수정 금지
- transport 동작 0
- SAP credential 사용 0

MAJOR 0이 될 때까지 worker가 수정하고 새 reviewer로 재검토한다.

### 10.4 disposable staging

clean clone 또는 disposable target에서 실행한다.

1. candidate installer dry/migration
2. install output key 검사
3. Track B hook matcher+command exact 비교
4. Direct Claude/Codex zero-footprint
5. Guided footprint가 run-id 디렉터리로만 제한되는지 확인
6. legacy/no-run-id deny
7. fake-vsp reviewer/child boundary 관찰
8. phases와 interactive의 installer 전후 byte 비교

S0에서 의도적으로 수정한 interactive byte가 baseline이다. candidate installer가 그
baseline을 바꾸지 않아야 한다.

### 10.5 RED 기록

G9/G10에서 reviewer 또는 attended child가 write credential을 얻을 수 있으면 예상대로
security RED다. RED를 PASS라고 부르지 않는다. 아래 상태를 유지한 채 attended candidate
staging은 가능하다.

- attended-only
- unattended=sealed
- historical_rv4_classifier=open
- sap_mutation_boundary=unverified

### 10.6 staged 전이

다음 전부가 PASS일 때만 candidate.state를 staged로 변경한다.

- clean detached upstream tests
- disposable migration/install
- hook preservation
- Direct zero-footprint
- legacy deny
- expected RED의 정직 기록

verified는 여전히 v0.17.3이다.

---

## 11. S5 — attended connected gate와 pilot

### 11.1 공통 선행조건

- candidate.state=staged
- 사람 operator present
- DEV tier exact
- 대상과 package allowlist 동결
- fresh review subject 동결
- 접속정보 비기록
- 작업별 execution structure와 P0~P4 분리

### 11.2 S5-A P1 transport read shape

사람 소유 Guided-P1 evidence 작업으로 수행한다.

- vsp transport list 1회
- exact request 대상 transport get 1회
- exit code와 출력 field shape 기록
- request/object/task inventory 충분성 판정
- reviewer는 참여하지 않음

충분하면 COMMANDS.md와 vsp lock command_contract를 갱신한다. 불충분하면 Engine-P4
inventory는 사람 GetTransport handoff로 고정한다.

### 11.3 S5-B P2 adapter 지원

도구별 상태를 먼저 확정한다.

| adapter | 현 상태 | P2 허용 조건 |
|---|---|---|
| Claude | 호출별 prompt/hook 경로 있음 | scope, fields, cap 승인 |
| Codex | hard-disabled가 정본 | human approval broker 전 unsupported |
| Antigravity | excludeTools 미실측 | 현 버전 실증 전 unsupported |

P2 broker를 구현하더라도 batch, subagent, auto-approval은 금지한다.

### 11.4 S5-C Pilot A

- execution: Guided-P3
- apply path: Track B MCP write
- 대상: DEV의 승인된 단일 object
- package: 파일럿 직전 exact 확정
- local package면 transport_request 생략
- unresolved/QA fixture는 SAP 호출 없이 deny 확인
- MCP success 후 vsp로 source hash, syntax, activate, unit, ATC 검증
- exact R-PASS + V-PASS 전에는 PROVISIONAL_WRITE

### 11.5 S5-D Pilot B

- execution: Engine attended-P3
- build P0/P1 run -> review run -> write run 분리
- review FAIL seed에서 write sentinel 미도달
- 정상 subject에서 R-PASS consume
- vsp CLI로 deploy/activate/source read/ATC/unit
- operator가 전 과정 present
- unattended flag 없음

### 11.6 S5-E P4 T1~T5

목표는 READY_FOR_RELEASE다. 실제 release는 하지 않는다.

1. T1 Guided manifest 승인
2. T2 package/request 준비와 modifiable 확인
3. T3 exact R-PASS object 할당
4. T4 inventory exact + vsp V-PASS
5. T5 사람 readiness 판정

request는 modifiable 상태로 남긴다. T6/T7은 실제 전달 run에서만 수행한다.

### 11.7 PROMOTE

다음 전부가 exact candidate SHA에 묶여야 한다.

- G1~G14
- Pilot A
- Pilot B
- P4 T1~T5
- independent R-PASS
- vsp V-PASS
- repo drift 0
- tracked secret 0

그때만 원자적으로:

1. 이전 verified를 history로 이동
2. staged candidate를 verified로 이동
3. candidate를 null로 비움
4. safety_state 보존

---

## 12. S6 — 재기준 이후 기능 확장

아래는 PROMOTE 뒤에만 시작한다.

- domain/cds
- domain/rap
- domain/amdp
- FI 다음 CO pack
- class include/testclass 배포 지원
- Track B deferred extract/profile 도구 재심사
- plugin public release/bump

unattended 해제는 기능 확장이 아니다. 별도 U-gate와 별도 사용자 D-결정 없이는 계속
sealed다.

---

## 13. 단계별 검증표

| 단계 | 필수 검증 | 금지 |
|---|---|---|
| S0 | links, policy grep, bundle unchanged | SAP, migration live walk |
| S1 | release_check, Py3.9/3.12, clean SHA | dirty pin |
| S2 | review/wrapper/bridge tests | raw execute |
| S3 | snapshot migration, engine tests, MCP asserts, vsp lanes | private walk |
| S4 | fresh review, disposable install, zero-footprint | main-machine install |
| S5 | G1~G14, pilots, T1~T5 | unattended, real release/import |
| S6 | domain-specific tests | U-gate 없는 unattended |

현재 유효한 로컬 명령 (S3 완료 시점 갱신, 2026-07-16):

~~~powershell
# 오프라인 게이트 — doctor를 뺀 전부가 CI에서도 돈다
node interactive/scripts/check-migration-snapshot.mjs        # 이식 provenance (원본 무접촉)
node interactive/scripts/check-links.mjs interactive
node interactive/server/verify-engine.mjs                    # VERSION↔integrity↔바이트
node interactive/scripts/check-engine-provenance.mjs         # 엔진 소스 커밋 ↔ 번들
node interactive/scripts/smoke-mcp.mjs                       # 도구 표면 계약 assert
node interactive/scripts/gen-plugin-manifests.mjs --check    # 매니페스트 5종 ↔ 단일 정본
node interactive/scripts/doctor.mjs                          # 3사 동기화 (로컬 전용)
Set-Location engine; npm test -- --runInBand                 # 599 passed / 5 skipped

# 게이트의 음성시험 — 게이트가 '통과만 하는 장식'이 아님을 증명
node interactive/scripts/test-check-migration-snapshot.mjs   # 17/17
node interactive/scripts/test-smoke-mcp.mjs                  # 16/16

# 트랙 A 테스트 (S2 산출 — 전부 SAP 무접촉)
powershell -NoProfile -File scripts/test-check-review-verdict.ps1   # 23/23 run-scoped 리뷰 계약
powershell -NoProfile -File scripts/test-run-track-a.ps1            # 16/16 wrapper 음성시험
powershell -NoProfile -File scripts/test-promote-track-b-run.ps1    # 17/17 bridge

# 동결 원본이 있는 머신에서만 (CI 아님 · allowlist pathspec만 → private/ 미질의)
node interactive/scripts/build-migration-snapshot.mjs [--check]     # 스냅샷 재생성/재현성
node interactive/scripts/report-sc4sap-public-drift.mjs             # 상류 드리프트 리포트
node interactive/scripts/check-engine-provenance.mjs --rebuild      # 번들 재현 빌드(devDeps 필요)
~~~

> 테스트 하네스 함정(실측 2026-07-16): `powershell.exe -Command`는 자식 종료코드를
> **0/1로 뭉갠다**. 64/65/66/67을 구분하는 스위트는 반드시 **`-File`**로 띄운다.
> GitHub Actions의 `shell: powershell`도 -Command라서 ps-gate는 cmd에서 -File로 부른다.

> 의도된 변경을 반영하는 법(스냅샷은 손으로 고치지 않는다):
> 도구 표면이 바뀌면 `smoke-mcp.mjs --update` · 이식 자산이 바뀌면
> `build-migration-snapshot.mjs` · 매니페스트/자산 수가 바뀌면
> `gen-plugin-manifests.mjs` · 엔진을 올리면 `verify-engine.mjs --refresh` +
> VERSION의 source commit 갱신. 각각 사유를 커밋 메시지에 남긴다.

현재 실행 금지:

~~~text
node interactive/scripts/check-migration-coverage.mjs        (S3에서 폐기 — 대체: check-migration-snapshot)
python scripts/execute.py <phase>                            (AGENTS.md 금지 — 진입은 run-track-a.ps1)
scripts/run-track-a.ps1 ... 로 Engine 실제 기동               (candidate=selected — 오늘은 exit 65가 정상)
vsp transport list/get without S5-A human-owned connected scope
any GetTableContents/GetSqlQuery without per-call human approval
any ReleaseTransport outside an actual delivery run
~~~

---

## 14. commit·review·push 전략

저장소별 변경을 섞지 않는다.

### sap-agentic-harness

권장 commit 경계:

1. S0 Track B safety compatibility
2. S2-A/S2-B Policy + review contract
3. S2-C wrapper + lock + legacy
4. S2-D bridge
5. S3 provenance + CI
6. S4 review follow-up

### final-harness

- dirty cleanup과 v0.20.x release는 별도 commit/history
- candidate SHA 확정 전 sap-agentic-harness lock을 바꾸지 않음

### vsp-custom

- Windows test portability
- recording ID
- CGO/cache contract
- 필요 시 각각 분리

push는 사용자 승인 후 수행한다. 현재 sap-agentic-harness의 로컬 5커밋을 새 변경과
무관하게 잃지 않도록 보존한다.

---

## 15. 주요 리스크와 대응

| 리스크 | 영향 | 대응 |
|---|---|---|
| upstream moving target | wrapper/installer 재작업 | clean exact SHA 뒤에만 구현 |
| Track B auto 계약 잔존 | Policy 우회 SAP write/release | S0 최우선 |
| .sc4sap/.harness dual state | stale review·잘못된 완료 | 단방향 승격 |
| live migration walk | private 경계 위반·count drift | pinned snapshot gate |
| smoke 출력만 PASS | 안전 표면 회귀 미검출 | class invariant assert |
| source/bundle commit 불일치 | 재현성 상실 | actual source commit pin |
| Codex P2 approval fail-open | 무승인 row data | unsupported/hard-disable 유지 |
| P4 release 자동화 | irreversible 오작동 | exact human approval per task/parent |
| vsp test 비green | backend 신뢰 과장 | command scope와 known failure 분리 |
| HANDOFF 역사 혼재 | Claude가 옛 순서 실행 | 이 문서를 현재 재개점으로 고정 |

---

## 16. Claude 실행 지침

새 Claude 세션은 다음 순서로 읽는다.

1. .harness/RULES.md
2. AGENTS.md 또는 CLAUDE.md
3. 이 문서
4. docs/reference/DECISIONS.md의 D-025~D-027
5. 필요한 단계의 대상 파일

첫 작업은 반드시 S0 하나만 수행한다.

Claude에 전달할 시작 지시문:

~~~text
Direct / P0 offline으로 S0만 수행해라.
먼저 .harness/RULES.md와
docs/reference/designs/2026-07-16-integration-hardening-roadmap.md를 읽어라.
Track B의 create-program, create-object, release, review-checklist를 현재
attended-only / unattended=sealed Policy에 맞춰 정렬해라.
SAP에 연결하거나 호출하지 마라.
sc4sap-custom과 private를 읽거나 수정하지 마라.
current check-migration-coverage는 실행하지 마라.
links와 bundle unchanged를 검증하고, 결과를 HANDOFF에 반영하라.
작업트리의 기존 사용자 변경을 보존하고 push하지 마라.
~~~

S0 완료 뒤에는 즉시 S1로 자동 진행하지 않는다. diff, test, 독립 검토 필요성, external
final-harness dirty 소유권을 사용자에게 보고한 뒤 다음 단계 권한을 확인한다.

---

## 17. 완료 판정

이 통합 보강 설계는 다음 상태에서 완료다.

- Track B mutation/release 절차가 새 Policy와 모순되지 않음
- clean v0.20.x candidate exact SHA 확정
- Track A lock v2, wrapper, run-scoped review, bridge 구현
- private-safe migration provenance와 CI 계약 구현
- disposable staging PASS
- attended Pilot A/B PASS
- P4 T1~T5 READY_FOR_RELEASE
- exact candidate PROMOTE
- attended-only / unattended=sealed 유지
- historical_rv4_classifier=open 정직 보존
- sap_mutation_boundary=unverified 정직 보존

실제 transport RELEASED/IMPORTED와 unattended 해제는 이 설계의 완료 조건이 아니다.
