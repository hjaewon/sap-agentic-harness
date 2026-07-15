# 무인 gated write 새-컨텍스트 리뷰 게이트 — (b′) plan-레벨 리뷰 스텝

> **v0.17 legacy**: 본문은 phase-only 리뷰 게이트의 역사 증거로 보존한다.
> 현 실행·리뷰 계약은 `2026-07-15-track-a-rebase-v2.md` §5·§11이 대체한다.
>
> 2026-07-13 확정 (사용자 택1 + 독립 검증 조건부 성립 판정). DESIGN.md v2.2 §8.3·§13
> Phase 3에 반영. 엔진 인용은 final-harness lock(`adapters/final-harness.lock.json`)
> 워킹트리의 `skills/harness-init/templates/engine/scripts/execute.py` file:line 기준.

## Goal

무인 gated write 체인(DESIGN §8.3)에서 기계 verify(명령 exit code, execute.py:2382-2412)가
못 잡는 시맨틱 결함 — 문법·ATC·활성화를 전부 통과한 INNER vs LEFT JOIN 급(트랙 B E2E
실증, HANDOFF §4.1) — 을 **첫 vsp write 전에** 새-컨텍스트 리뷰로 차단하는 **기계
게이트**를 **엔진 무수정**(D-018 분리 유지 + 버전 lock)으로 성립시킨다. HANDOFF §5-11
(Phase 3 선결)의 해소 설계다.

## Non-Goals

- 엔진(execute.py) 수정·리뷰 게이트의 엔진 네이티브 승격(A안) — 기각 아닌 **이연**
  (재론 트리거는 Deferred #2).
- 트랙 B 대화형 리뷰 계약(sap-reviewer 서브에이전트·D-019) 변경 — 트랙 B는 그대로.
- 리뷰어 판단 품질 자체의 기계 보증 — 어느 구성에서도 환원 불가(잔존 표면 ②).
- inactive-deploy 후 SAP 반영본 리뷰 변형 — Deferred #1.
- 기존 기계 verify 체인(deploy→activate→drift→ATC→unit)의 변경.

## Users-actors

- **무인 엔진**(execute.py) — step 실행·verify 직접 실행(:2382)·커밋(:2641) 주체.
- **impl 스텝 세션** — 코드 작성. 자기보고 불신 원칙의 대상(:2383).
- **리뷰 스텝 세션** — 판정자. step마다 독립 OS 프로세스(:2337)라 새-컨텍스트가 기계적
  으로 성립. vsp CLI read 계열로 SAP 라이브 참조 가능.
- **사람 운영자** — 계획 승인(harness-plan), 에스코트 기간 write 수행, WIP 커밋 감사.
- **SAP DEV 시스템** — 리뷰 참조 대상(read)·write 스텝의 대상.

## Key flows

1. **계획**(harness-plan): `phases/{p}/index.json`을 impl 스텝들 → **리뷰 스텝** →
   write 스텝들 순으로 구성. 리뷰 스텝은 **impl 완료 후 · 첫 vsp write 스텝 직전** 배치
   (FAIL 시 SAP 무접촉으로 정지 — 배치 근거는 Decisions #3).
2. **리뷰 스텝 실행**: 새 프로세스 세션이 step{N}.md 지시(체크리스트 — Decisions #4)에
   따라 main 대비 diff·`src/` 소스·(연결 시) vsp read 계열 라이브 참조를 독립 재도출로
   판정 → `git rev-parse HEAD`를 읽어 `phases/{p}/review-verdict.json`(스키마는 Key
   entities)을 기록 → index에 status=completed 보고.
3. **게이트 판정**: 엔진이 리뷰 스텝 **자신의** verify를 직접 실행(:2632). verify 명령은
   기동 시 스냅샷 고정(:314-324, :2386)이라 세션이 못 바꾼다. 검사 내용 = 필수 3조항
   (아래). exit≠0 → 재시도(:2686-2694) → 3회 후 `error`·`sys.exit(1)`(:2697-2717) —
   **write 스텝에 도달 불가**. 이것이 차단력의 전부이며 프롬프트 규율에 의존하지 않는다.
4. **통과** → 엔진 feat 커밋(:2641) → write 스텝 진행. 에스코트 기간(Decisions #5)에는
   write 스텝을 사람이 수행한다.

### 필수 3조항 (독립 검증 확정 — 전부 필수, 하나라도 빠지면 게이트 불성립)

1. **등식형 변경 검사**: 엔진 bookkeeping(`phases/{p}/index.json` ·
   `phases/{p}/step*-output.json` · `phases/{p}/run-summary.json` ·
   `phases/{p}/run-history.jsonl` · `.harness/**`)을 제외한 dirty 집합이 **정확히**
   `{review-verdict.json}` 하나와 같아야 한다(공집합도, 초과도 실패). verdict가 **이번
   시도의 dirty**여야 하므로 커밋에 실려 온 stale PASS가 차단되고, 초과 금지로 리뷰어의
   코드 몰래 수정이 차단된다. 부분집합형(⊆)은 두 축 모두 뚫린다.
2. **검사 로직 봉인**: verdict 검사 로직은 verify **명령 문자열에 인라인**하거나, 위임
   스크립트의 **sha256을 명령 문자열에 핀**(해시 검증 후 실행)한다. verify 스냅샷은
   명령 문자열만 보호(:314-324)하고 위임 타겟 변경은 WARN 뿐(:614-618, :667-707)이라,
   핀 없는 위임 스크립트는 세션이 변조할 수 있다.
3. **HEAD-sha 바인딩**: verdict에 `reviewed_head`(= 리뷰 시점 `git rev-parse HEAD`)
   필수, 검사기가 현재 HEAD와 대조. impl 스텝의 feat 커밋 sha는 **세션 종료 후 엔진이
   생성**(:2641)하므로 impl 세션이 예측 불가 — 선제 위조가 원천 차단된다. phase/step
   바인딩만으로는 부족(impl 세션이 index를 읽어 위조 가능).

## Constraints

- 엔진 무수정 (D-018). 게이트 로직 전부가 "verify 명령 exit code" 표면 안에 들어가야 함.
- verdict 파일명은 `step[0-9]*.md` 글롭을 피할 것 — 엔진이 세션 생성 step 파일을 삭제
  원복한다(:499-521). `.json` 채택( 프롬프트 주입 표면도 아님).
- 리뷰 스텝은 일반 step이라 `--disallowedTools` 미부착(advisory 세션 전용, :2836) —
  리뷰어 격리는 조항 1(레포 쓰기 차단) + §8.4(vsp read-only 프로파일·package allowlist·
  자격증명 스코핑)으로 성립.
- per-step 모델 배정 없음 — profile `step_model`은 전 step 공통(:184, :2334-2335).
- 세션 env는 phase 공통(:2298 os.environ 승계) — step별 자격증명 분리는 엔진 밖에서 불가.
- 리뷰 세션 예산 = SESSION_TIMEOUT 1800s(:2111).

## Acceptance criteria (testable)

1. **위조 시나리오 3종이 각각 verify exit 1로 차단** (로컬 재현 테스트):
   (a) stale PASS — 직전 커밋에 포함된 PASS verdict만 존재, 이번 시도 dirty 없음 → 실패
   (b) 리뷰어 코드 수정 — verdict + `src/*.abap` 동시 dirty → 실패
   (c) HEAD 불일치 — `reviewed_head` ≠ 현재 HEAD → 실패
2. **정상 경로**: 새로 쓴 PASS verdict(정확히 그 파일만 dirty, reviewed_head 일치) → exit 0.
3. **FAIL verdict** → exit 1 → 엔진 재시도→error 종료로 write 스텝 미도달 (엔진 콘솔
   로그·index status로 확인).
4. **위임 스크립트 변조**: 검사기 1바이트 변경 → sha256 불일치 → exit 1.
5. **라이브 실증**(Phase 3 완료 기준 연동): 씨앗 시맨틱 결함(INNER→LEFT JOIN 급) 주입
   phase에서 리뷰 게이트가 FAIL을 내어 write 도달을 실제로 차단함 **1회**.

## Key entities

- **`phases/{p}/review-verdict.json`** — verdict 파일 계약:
  ```json
  {
    "verdict": "PASS | FAIL",
    "reviewed_head": "<git rev-parse HEAD, 40-hex>",
    "findings": [
      { "bucket": "B1-B4", "severity": "MINOR|MAJOR", "object": "...", "finding": "..." }
    ]
  }
  ```
  트랙 B `interactive/core/procedures/schemas/review-result.schema.json`의
  verdict/findings 계약 이식 + `reviewed_head` 필드 추가. MAJOR ≥ 1 → FAIL.
- **리뷰 스텝 `step{N}.md`** — 체크리스트(Decisions #4) + "보고를 신뢰하지 말고 diff·
  소스·라이브에서 독립 재도출" 지시 + vsp read 계열 명령 안내 + verdict 기록 계약.
- **검사기** — verify 명령 인라인 또는 sha256 핀 위임 스크립트
  `scripts/check-review-verdict.ps1`(리포 내 배치로 §9 verify 위임 감사 표면에 포함).
  판정 순서: ① verdict=="PASS" ② reviewed_head==HEAD ③ 등식형 dirty 검사.
- **verify 명령 형태 예시** (위임+핀 방식):
  ```json
  "verify": "powershell -NoProfile -Command \"$s='scripts/check-review-verdict.ps1'; if ((Get-FileHash $s -Algorithm SHA256).Hash -ne '<PIN-64HEX>') { Write-Output 'CHECKER_TAMPERED'; exit 1 }; & $s -Phase {p} -Verdict phases/{p}/review-verdict.json\""
  ```
- **bookkeeping 제외 집합** — 조항 1의 열거 목록(위 필수 3조항 #1). 추가·삭제는 이
  스펙 개정으로만.

## Coverage table

| 결정 표면 | 상태 | 기록 위치 |
|---|---|---|
| 게이트 메커니즘 (verdict를 무엇이 검사하나) | 결정 — 리뷰 스텝 자신의 verify | Decisions #1 |
| 위조 대책 | 결정 — 필수 3조항 | Key flows |
| verdict 파일 계약 (경로·스키마·reviewed_head) | 결정 | Key entities |
| 리뷰 스텝 배치 | 결정(권고) — impl 완료 후·첫 vsp write 전 | Decisions #3 |
| 체크리스트 내용 | 결정 — 트랙 B 12항목 이식 + 업무로직 신규 | Decisions #4 |
| 무인 전환 시점 | 결정 — 에스코트 조항 | Decisions #5 |
| 잔존 표면 수용 | 결정 — 2건 + 정직 실패 소음 | Decisions #6 |
| inactive-deploy 후 리뷰 | 이연 | Deferred #1 |
| 엔진 네이티브 승격 (A) | 이연 | Deferred #2 |
| 리뷰 스텝 전용 모델 배정 | 이연 | Deferred #3 |

## Deferred items (reason + risk)

1. **inactive-deploy 후 리뷰 변형** — 이유: 첫 write 전 리뷰가 FAIL 시 SAP 무접촉이라
   더 안전하고, deploy 타입 커버리지가 미완(§14-4). 리스크: repo 소스와 SAP 반영본의
   차이를 리뷰가 못 봄 — 이 갭은 drift check(§6)가 기계적으로 담당.
2. **(A) 엔진 승격** — 기각 아닌 이연. **재론 트리거**: (b′) 잔존 표면(이탈 프로세스
   writer의 verify 창 쓰기, 정직 실패 소음의 재시도 낭비)이 **실전에서 실증**될 때 —
   D-018 방식(lock 재검증 후 업스트림 수리·재lock)으로 진행. 리스크: 트리거 전까지
   해당 표면은 무보호로 남음(엔진 전역이 이미 수용 중인 등급).
3. **리뷰 스텝 전용 모델(예: Opus) 배정** — 이유: profile `step_model`이 전 step
   공통(:184)이라 엔진 무수정으로는 불가. 리스크: 리뷰 품질이 phase의 step 모델에
   묶임 — 필요 시 phase 전체 모델 상향으로 완충, 항구 해법은 A 재론에 편입.

## Assumptions requiring validation

1. **bookkeeping 제외 집합의 완전성** — 엔진이 리뷰 스텝 verify 시점에 남기는 dirty가
   열거 집합과 정확히 일치하는지. 검증: 첫 리뷰 스텝 실행에서 verify 직전
   `git status --porcelain` 실측, 불일치 시 이 스펙의 제외 집합 개정(오탐 방향 —
   fail-closed라 안전은 유지).
2. **리뷰어의 SAP write 차단이 §8.4로 충분한지** — 등식 검사는 git dirty만 보므로 SAP
   직접 write는 안 잡는다. 검증: SAFETY-PROFILES.md 차단 검증 절차에 리뷰 스텝
   시나리오(read 계열만 허용) 포함해 실측.
3. **씨앗 결함을 체크리스트가 실제 FAIL로 내는지** — 리뷰어 판단은 확률적(잔존 표면 ②,
   에스코트 조항의 존재 이유). 검증: AC #5의 라이브 실증 1회.
4. **1800s 안에 리뷰 완주** — 트랙 B Phase 6 리뷰 실적으로 개연성 있으나 무인 재현
   미실측. 검증: 첫 리뷰 스텝의 attempt_secs(run-summary) 실측.

## Decisions made

1. **게이트 메커니즘 = (b′) plan-레벨 리뷰 스텝 + 스텝 자신의 verify가 verdict 검사.**
   대안과 트레이드오프: **(b) 원안**(다음-스텝-verify가 검사)은 검사가 한 스텝 뒤로
   밀려 그 사이 write 스텝 자신이 verdict를 재사용·위조할 수 있는 창이 독립 검증에서
   확인돼 기각. **(a) 단독**(엔진 review.md 체크리스트 강화만)은 `_run_review`가 완료
   마킹 뒤 실행되는 명시적 비게이트(:2955-2956, :2989-2992)이고 verdict를 소비하는
   코드 경로가 없어 차단력 0 — 기각(체크리스트 이식이라는 구성 요소로만 채택). **(A)
   엔진 승격**은 가장 깔끔하나 D-018 lock 위반 + 수리 마찰 실증 0건 상태의 선제 개조 —
   기각 아닌 이연(Deferred #2). **(c) 사람 셰퍼딩 유지**는 안전하나 Phase 3의 무인
   목표를 무기한 유예 — 상시안으론 기각, 에스코트 조항으로 부분 채택. 사용자가 (b′)를
   택한 이유: 엔진 무수정으로 기계 차단력이 성립하는 유일안(D-018·D-019 동시 충족)이며
   독립 검증이 필수 3조항 부가를 조건으로 성립 판정. 귀결: harness-plan 계획 관례 +
   검사기 + 체크리스트 이식이 Phase 3 작업에 편입되고, 잔존 표면 2건을 수용한다.
2. **필수 3조항 전부 채택** — 각각의 기각 대안: 부분집합형 검사(stale/몰래 수정 미차단),
   핀 없는 위임(스냅샷이 명령 문자열만 보호), phase/step 바인딩(예측 가능 값이라 위조
   가능). 세부는 Key flows의 3조항 절.
3. **배치 = impl 완료 후·첫 vsp write 전 (권고).** 대안 inactive-deploy 후 리뷰: SAP
   반영본을 직접 검사할 수 있으나 FAIL 시 이미 SAP에 흔적 — Deferred #1로 이연. 귀결:
   리뷰어는 repo 소스·diff·vsp read 계열 라이브 참조로 판정한다.
4. **체크리스트 = 트랙 B 12항목 이식 + 업무로직 항목 신규.**
   `interactive/core/procedures/review-checklist.md`(12항목·MAJOR/MINOR·false-positive
   패턴)를 이식하되 SAP 접근을 MCP → vsp CLI read 계열로 치환(트랙 A는 MCP 미사용 —
   D-001, DESIGN §3), JOIN 카디널리티·spec 정합 등 순수 업무로직 항목을 신규 추가
   (기존 12항목은 관례 중심이라 INNER/LEFT 급을 명시 커버하지 않음). 대안 신규 작성:
   E2E 검증된 자산 폐기 — 기각.
5. **에스코트 조항**: 씨앗 시맨틱 결함을 게이트가 라이브에서 실제 차단함을 **1회 실증**
   하기 전까지 gated write는 사람 셰퍼딩 유지, 실증 후 무인 전환. 대안 즉시 무인:
   리뷰어 판단이 확률적이라 "안전 주장-실체 격차가 열린 채 편의를 쌓는" 것(§5-11 재배열
   근거의 재발) — 기각. §13 Phase 3 완료 기준에 실증 항목으로 편입.
6. **잔존 표면 2건 + 소음 1건 정직 수용**:
   ① **이탈(detached) 프로세스 writer** — 세션이 남긴 백그라운드 writer가 quiescence
   대기(:2610) 후 verify 창에 쓸 가능성. 엔진 전역이 이미 수용 중인 잔여와 동급
   ("격리는 컨테이너 몫").
   ② **리뷰어 판단 자체** — 어느 구성에서도 기계 환원 불가. 에스코트 조항 + 3회
   재시도 + 실패 시 WIP 커밋 감사(:2712)로 완충.
   ③ **정직 실패 소음** — 리뷰 시도 #1의 verdict 오염이 #2에 남아 재시도를 낭비하는
   케이스는 fail-closed 방향이라 수용(3회 후 사람이 WIP 커밋으로 본다).
