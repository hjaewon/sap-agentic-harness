# aegis 방법론 흡수 설계 (D-047 집행안) — v2 (Codex 리뷰 반영)

> 작성 2026-07-23 · 작성자 = 주 세션(Claude) · 상태 = **v2 — 독립 리뷰 반영 완료, 집행 대기**
> 근거 결정 = D-047 (DECISIONS.md)
> **원천 스냅샷 = aegis v0.21.0 @ `33f61df`** (`D:\claude-practice\claude-fable-final`,
> plugin.json version·git HEAD 실측). "한 루프 세 강도" 방법론은 v0.20에서 확립된
> 계보명이며 흡수 스냅샷 버전과 구분한다 (리뷰 M7 반영).
> 독립 리뷰 = Codex `gpt-5.6-sol` + `reasoning=max` + read-only (배너 실측), 2026-07-23,
> verdict **"수정 후 기록"** — BLOCKER 0 · MAJOR 9 · MINOR 3 → **전건 반영** (§7).

## 0. 한 문장 요약

sapkit(트랙 B 제품)이 sc4sap에서 승계한 개발방법론을 aegis의 엔진-외 조각으로
**보완**한다 — 갭 3.5개(최소 강도 절차·발견 표면 / execution_owner / LESSONS→RULES /
보증 등급 어휘)를 주입하고, 이미 있는 것(승인 해시 결합·재개·bounded 리뷰 루프)은
재발명하지 않는다.

## 1. 배경

- D-047: 사용자 원목적 = "sc4sap 개발방법론 대신 최신화된 방법론". ENGINE은
  template-only(D-040)로 버렸으나 엔진-외 방법론 조각은 흡수됐어야 했다.
- 원천 실사 (2026-07-23, 주 세션 — 파일별 차용 원천, 리뷰 M7 반영):

  | 원천 파일 (aegis v0.21.0 @ `33f61df`) | 차용 내용 |
  |---|---|
  | `skills/direct/SKILL.md` (67줄) | 최소 강도 루프 골격 — 흔적 0, 검증 없는 완료 주장 금지, 승격 제안 기준 |
  | `skills/loop/SKILL.md` | 수리·재검증 라운드 ≤2 · execution_owner 소유권 경계 · control artifact main-only |
  | `skills/lesson/SKILL.md` | LESSONS→RULES 5단계 + Demote 모드 |
  | `skills/using-aegis/SKILL.md` | "실질 위험을 덮는 가장 가벼운 강도" 선택 원칙 (L34) |
  | `README.md` | 보증 등급 어휘와 모드별 등급표 (L37-53) |

- **원천의 보증 등급 (원문 그대로 — 리뷰 M5 반영)**: Direct = **절차적만**,
  Guided = 절차적+**감사 가능**, 기계 강제는 Engine 전용, Memory는 경로별 혼합.
  이식되는 조각의 등급은 기능별 매트릭스로만 서술한다 (§3-1 ④·§8).
- Direct 스킬·Guided 강화는 원천 레포에서 외부 독립 리뷰 게이트 통과(`9b23601`) ·
  도그푸딩 완료 (README L30-35 확인).
- 공급선 구분(D-047 ④): 이 차용은 D-038의 ENGINE 공급선(verified v0.17.3 동결)과
  별개다. 절차 텍스트만 가져오며 엔진 코드 무접촉.

## 2. 현재 상태 정밀 실사 — 갭 재측정 (v2: 리뷰 M1·M3·M4 반영)

| 조각 | 실사 결과 (v2 확정) | 처분 |
|---|---|---|
| ⑴ 최소 강도 경로 | **부분 존재** — create-program L66이 "기존 프로그램 수정 → 직접 `Update*`"로 경로를 가리키나, 그 경로의 **절차·검증 계약·발견 표면이 없다**(직접 Update* 호출이 어떤 정책 문서도 로드하지 않음) | **주입 — 절차+스킬 신설 (§3-1)** |
| ⑵ run 증거+중단재개 | **부분 존재** — `.sc4sap/program/{PROG}/` artifact 14종(파일 수는 조건·consult 모듈 수에 따라 변동 — 리뷰 MINOR-1), `state.json` 재개, approval은 spec sha256 결합. 단 **subject 결합(고유 run-id 아님)** · 최종 소스가 리뷰 결과에 미결합(MINOR 수정 후 재리뷰 없음 — Phase 6 step 6) — aegis `reviewed_diff_sha`·"리뷰 후 모든 코드 변경 재리뷰" 대비 약함 | 재발명 금지 · 동등 주장 철회 · 잔여 갭은 백로그 (§3-5) |
| ⑶ bounded 수리 루프 | **존재 — aegis Guided와 이미 동일** (리뷰 M3: 단위 혼동 정정). aegis = 수리·재검증 라운드 ≤2 → 초기 리뷰 포함 리뷰 iteration ≤3. 현행 Phase 6 = 리뷰 iteration ≤3 → blocked. 동일 bound다. aegis Direct에는 한도가 **없다** | 변경 없음 · 어휘 통일만 (§3-4) |
| ⑷ execution_owner | **없음 확인** — "A single agent executes every phase" 단정 | **주입 + SAP 정책 경계 (§3-3)** |
| ⑸ LESSONS→RULES | **없음 확인** — 상위 DESIGN.md §2 목표 2의 미집행분 | **주입 (§3-2)** |
| ⑹ 보증 등급 어휘 | **부분 존재** — review-checklist 어댑터별 구분·approval-gates "관문=문서 규약" 있음, 3등급 어휘 체계 없음 | 어휘 통일 — 기능별 매트릭스 (§3-1 ④) |

## 3. 흡수 설계

### 3-1. 강도 축 신설 — 정책 `development-loop.md` + 절차 `modify-object.md` + 14번째 스킬

**축 정의 (리뷰 M2 반영 — Track A와의 직교 명문)**: Minimal/Standard/Full은
**"절차 강도(procedure intensity)" 축**이다 — 어떤 sapkit 절차를 얼마나 무겁게
적용하는가의 선택일 뿐이며, **Track A 실행 구조(Direct/Guided)·SAP Policy
프로파일(P0~P4) 배정에는 어떤 영향도 주지 않는다**. 모든 행동은 종전대로 AGENTS.md
라우팅을 별도로 받는다(파일·단계·검증 수는 라우팅에 무영향 — AGENTS 원칙 그대로).
`.sc4sap/**` 산출물은 작업 자료이지 Track A 완료 증거가 아니며, Guided run
증거(`.harness/runs/`)·R-PASS·V-PASS를 **대체하지 않는다**. aegis의 Direct/Guided
용어는 제품 문서에서 강도 이름으로 쓰지 않는다(트랙 A 용어 충돌 — 리뷰 M1).

**신설 ① `core/policies/development-loop.md`** (정책 — 불변조건만, §3-3 규약 1 준수):

1. 한 루프 선언: 의도 파악 → 계약 → 실행 → 검증 → 독립 리뷰 → 수리 → 재검증 →
   판정 → 교훈 반영.
2. 강도 3단과 선택 규칙:

   | 강도 | sapkit 실체 | 산출물 | 차용 원천 |
   |---|---|---|---|
   | **Minimal** | `modify-object` 절차 — 기존 객체 소수정·명백한 단건 | 0 (흔적 없음) | aegis direct |
   | **Standard** | `create-object` | Step 산출물 (durable state 아님 — §3-5) | — (기존) |
   | **Full** | `create-program` | `.sc4sap/program/{PROG}/` artifact 체계 | — (기존) |

   선택 규칙 = **실질 위험을 덮는 가장 가벼운 강도** (using-aegis L34). 작업
   라벨이 아니라 모호성·파급 범위와 되돌리기 난이도·외부 부작용·중단재개 필요·통합
   필요로 판단. 승격 제안 기준(aegis direct 이식): 위 요인이 실질화되면 상위 강도
   (또는 create-program 전체 파이프라인)를 제안하고 수락을 기다린다.
3. execution_owner 규약 (§3-3 정본).
4. **보증 등급 매트릭스 (리뷰 M5 반영 — 기능별, 일괄 주장 금지)**:

   | 기능 | 등급 |
   |---|---|
   | 강도 선택 · RULES consult · Minimal 루프 전체 | **절차적** (모델 지시 — 생략·오적용 가능) |
   | Full의 state/approval/verification/review 파일 · LESSONS/RULES 파일 | **감사 가능** (모델 작성 기록 — 사후 점검 가능하나 발생 사실의 증명 아님) |
   | Claude 어댑터 리뷰어 도구 차단 · PreToolUse 훅 · 서버 blocklist | **기계 강제 — 해당 어댑터/서버 한정** |

   approval-gates.md·review-checklist.md의 기존 정직성 문구와 상호참조(내용 이동 없음).

**신설 ② `core/procedures/modify-object.md` + `skills/modify-object/SKILL.md`**
(리뷰 M1·Q1 대안 채택 — 정책 문서만으로는 직접 `Update*` 경로에 발견·로드 배선이
없다. 이름은 Track A `Direct`와의 충돌을 피해 `modify-object`):

Minimal 강도의 운영 절차 (aegis direct 67줄의 SAP 각색):
① 관련 규칙 읽기 — `.sc4sap/RULES.md` 있으면 관련 규칙만(없으면 조용히 진행) +
   대상 객체 유형의 기존 Mandatory Rule Reads ② 요청 범위 안에서만 구현(`Update*`
   계열; **신규 객체 생성이 필요해지면 이 절차 밖 — create-object/-program으로 승격
   제안**) ③ 기계 검증: CheckSyntax → ActivateObjects → 해당 시 unit/ATC —
   **검증 없는 완료 주장 금지** ④ 실행 명령·결과를 증거로 보고 ⑤ 상태 상한 =
   Track A 모델 그대로 **PROVISIONAL_WRITE**(MCP 성공 ≠ 완료·V-PASS 없이 "done"
   금지) ⑥ 수리→재검증 라운드 ≤2, 3라운드째 필요 시 중단·보고 — **주의: 이 bound는
   aegis Direct 원형이 아니라 aegis Guided에서 차용한 sapkit 각색이다** (aegis
   Direct는 무한도 — 리뷰 M3 반영. SAP 쓰기 반복의 무한 배회 방지 목적) ⑦ 프로젝트
   흔적 0 — run/state 파일을 만들지 않는다(절차적 제약).

### 3-2. LESSONS→RULES 이식 — `core/procedures/lesson.md` + 스킬 (조각 ⑸)

aegis `skills/lesson/SKILL.md`의 SAP 각색. 신설 절차 + 스킬 래퍼.

- **파일 규약**: `.sc4sap/LESSONS.md` + `.sc4sap/RULES.md`. **project-context.md의
  WIP state 절에 두 파일을 등록**하고 "로컬 전용·머신 간 공유 없음·setup 재실행 시
  덮어쓰지 않음"을 명시한다(리뷰 Q5 조건 반영). 기존 권한 템플릿
  `Read/Edit(.sc4sap/**)`가 이미 덮는 경로 — 신규 권한 불요. 팀 공유 규칙이
  필요해지는 시점의 추적 가능 위치는 그때 재검토(비약속).
- **유지 (리뷰 MINOR-2 반영 — 원천 세부 보존 명문)**: 5단계(FAIL→INVESTIGATE→
  VERIFY→RULE→CONSULT) · VERIFY 없는 규칙화 금지 · RULE은 사용자 명시 승인 필수 ·
  부정 제약 문형 · 스타일/톤 배제 · 40개 캡 + 병합 우선 · **scope 메타데이터 3차원
  전부**(`[path:…] [action:…] [domain:…]`) · **신규 RULE 제안 전 RULES.md 전문
  대조(의미 충돌·근접 중복 검사, 충돌 시 병합/개정 제안)** · **L-id ↔ R-id 상호
  연결**(`RULE: -> R-…` / `(from L-…)` / Demote 시 `R-… demoted -> L-…`) ·
  **Demote 모드**(승격과 동일 엄격성) · 평범한 실패의 자동 승격 금지.
- **각색**: area 태그 SAP 어휘 예시(abap, cds, transport, mcp, atc, module-FI …).
  scope 메타데이터는 유지하되 **기계 매칭 조항만 제거** — aegis에서 매칭 주체는
  Engine이며 sapkit엔 없다. scope는 CONSULT 때 읽는 필터 힌트(절차적)임을 명시.
- **제외**: Triage 모드(`| engine |` 항목 — 엔진 전용) · "mechanically injected"
  전제 문구.
- **CONSULT 배선 3곳**: ① create-program Phase 2 도입부 1문장 ② create-object
  "Mandatory Rule Reads"에 1행 ③ modify-object step ① (내장). 없으면 조용히 진행 —
  opt-in, 설치 부담 0.
- **쓰기 트리거**: 사용자 명시 요청, 또는 반복 가능성 있는 검증된 원인 발생 시
  절차가 **제안**(자동 실행 아님). create-program Phase 7·8에 제안 포인트 각 1문장.

### 3-3. execution_owner 주입 + SAP 정책 경계 (조각 ⑷ — 리뷰 M6 반영)

정본 = development-loop.md. aegis loop/direct의 소유권 규약 + sapkit 정책 경계:

- `execution_owner = auto | main | delegated`. main = 현 대화가 구현. delegated =
  fresh worker가 구현, main은 조정·검증·리뷰 배분. auto(기본) = 소규모·국소·저출력은
  main, 탐색 많음·다파일·장황한 출력이 메인 컨텍스트를 실질 소모하면 delegated.
- **소유권 경계 (aegis 이식 — 전체)**: 구현 worker는 자기 변경의 독립 리뷰어가 될
  수 없다 · worker/리뷰어 배분은 main만 수행(worker에게 중첩 리뷰어 생성을 기대하지
  않음) · worker에는 계약·과업 조각·**관련 프로젝트 지침·경로·관련 RULES**·검증
  기대를 주되 전체 대화·이전 기록은 주지 않는다 · **비밀(자격증명·sap.env)은
  전달하지 않는다** · 결과는 압축 형식(변경 경로·결정·명령과 결과·블로커)만 회수 ·
  main이 최종 diff 경계를 확인하고 최종 검증을 직접 실행 또는 관찰.
- **control artifact는 main 전용**: `approval.json` · `state.json` ·
  `verification.json` · `review-request.json` · `review-result.json` · spec 승인
  기록 · `.sc4sap/RULES.md`/`LESSONS.md`. worker는 계약이 배정한 구현 경로만 만진다.
- **SAP 정책 경계 (sapkit 고유 — aegis에 없음)**:
  - execution_owner는 **Track A 라우팅·P-프로파일 분류가 끝난 뒤의 구현 조각에만**
    적용된다. 위임이 정책 분류를 바꾸지 않는다.
  - **P2(실데이터)는 항상 main 전용** — subagent/batch 금지는 D-043 소유자 머신
    예외에서도 유지되는 불변이다(AGENTS.md P2 원문).
  - **P4(transport)는 위임 불가** — 기존 소유 계약(사람 전용 게이트) 그대로.
    Phase 4 구현을 위임할 때 transport 생성/할당 같은 혼합 행동은 분리해 main이
    소유한다.
  - delegated P3는 attended·DEV tier·PROVISIONAL_WRITE 상한을 그대로 상속한다.
- **하네스 중립**: "환경이 fresh worker/subagent를 지원하면"으로 조건화. 미지원
  환경에서 auto는 main으로 안전 폴백. 명시적 delegated 요청을 조용히 무시하지
  않는다(제약을 설명하고 방향을 묻는다 — aegis 원문).
- **절차 배선**: create-program Phase 4 도입부 1문단("A single agent…" 단정을
  "main 소유 + Phase 4 구현은 execution_owner 규약에 따라 위임 가능(리뷰어 독립성·
  control artifact·P2/P4 경계 유지)"로 완화) · create-object Step 4 참조 1문장 ·
  modify-object(내장). read-only 계열 절차는 무접촉.

### 3-4. bounded 수리 루프 — 변경 없음, 어휘 통일만 (조각 ⑶ — 리뷰 M3 반영)

- 현행 Phase 6는 **aegis Guided와 이미 동일 bound**다: 초기 리뷰 1회 + 수리·재검증
  라운드 ≤2 = 리뷰 iteration ≤3 → 소진 시 blocked. v1의 "3회 유지 vs 2회 정렬"은
  단위 혼동(리뷰 iteration vs 수리 라운드)이 만든 거짓 선택지였다 — 철회.
- development-loop.md가 이 어휘("초기 리뷰 + 수리·재검증 라운드 ≤2")로 전 강도를
  통일 표기한다. Phase 6 본문 동작은 무변경.
- Minimal의 라운드 ≤2는 §3-1 ⑥의 명시대로 aegis Guided 차용의 sapkit 각색.

### 3-5. run 증거·재개 — 동등 주장 철회, 명문화 + 재진입 규칙 (조각 ⑵ — 리뷰 M4·Q2 반영)

- `.sc4sap/program/{PROG}/` 체계를 development-loop.md 강도 표에서 "Full 강도의
  작업 증거"로 명명하되, **aegis run 증거와 동등하다고 주장하지 않는다** — 실차:
  subject 결합(고유 run-id 아님) · 최종 소스가 리뷰 결과에 미결합(MINOR 수정 후
  재리뷰 없음) · reviewed_diff_sha 부재. aegis `manifest.json`/`review.md` 형식은
  이식하지 않는다(기존 스키마 교체는 이득 대비 파손 위험).
- **백로그 등재 (이번 배치에서 집행하지 않음)**: 리뷰 결과에 최종 소스
  해시를 결합하거나 "리뷰 후 모든 코드 수정은 재리뷰" 규칙 채택 — 도그푸딩에서
  MINOR-수정-후-드리프트가 실제 관찰되면 그때 결정.
- create-object: 경량 state 추가는 **보류 유지**(Q2 본안). 대신 **재진입 규칙
  1문장 명문화**: 중단 후 재호출 시 SearchObject로 기존 객체를 발견하면 Create를
  건너뛰고 `Update*`/`ActivateObjects`로 복구 진행. "Step 산출물"을 durable
  state로 표현하지 않는다.

### 3-6. 수정 파일 총람 (v2 — 리뷰 M8 반영)

| 처분 | 파일 | 내용 |
|---|---|---|
| **신설** | `interactive/core/policies/development-loop.md` | §3-1 정책 + §3-3 + 보증 매트릭스 |
| **신설** | `interactive/core/procedures/modify-object.md` | Minimal 강도 절차 (§3-1 ②) |
| **신설** | `interactive/core/procedures/lesson.md` | §3-2 |
| **신설** | `interactive/skills/modify-object/SKILL.md` · `interactive/skills/lesson/SKILL.md` | 래퍼 2 (기존 패턴) |
| 수정 | `core/procedures/create-program.md` | Use When 강도 안내 1문장 · Phase 2 CONSULT 1문장 · Phase 4 execution_owner 1문단 · Phase 7/8 lesson 제안 각 1문장 |
| 수정 | `core/procedures/create-object.md` | Use When 안내 · Mandatory Rule Reads 1행 · Step 4 참조 1문장 · 재진입 규칙 1문장 |
| 수정 | `core/policies/approval-gates.md` | development-loop 상호참조 + **Gate B 분리: 배포 기본값(호출별 승인) vs 소유자 머신 D-043 예외(서버 blocklist 바닥선) — 양쪽 모두 P2 subagent/batch 금지 불변** (리뷰 M9) |
| 수정 | `core/project-context.md` | WIP state 절에 RULES/LESSONS 등록 + 로컬 전용·비공유·setup 비덮어쓰기 (Q5) |
| 수정 | `interactive/plugin-metadata.json` | **버전 0.2.1→0.3.0** + long-description의 "single-agent/No multi-agent orchestration" 문구를 execution_owner 반영으로 조정(품질 모델 문장은 유지 — 1작업+1리뷰 불변) |
| 수정 | 루트 `CLAUDE.md` | 제품 계수 갱신 (지식 177·페르소나 26·**절차 19·스킬 14**) |
| 수정 | `HANDOFF.md` | 집행 후 상태 갱신 (문서 계약) |
| 수정 | 어댑터 README 3벌 | 신설 스킬 2행 |
| 재생성 | 플러그인 매니페스트 5종 | 스킬 **14**·절차 **19** 자동 계수 |
| 재핀 | `interactive/provenance/migration-map.json` | 수정된 기존 파일 목적지 sha256 (파일 수 불변 확인 동반) |
| 갱신 | `interactive/DESIGN.md` | §3-2 디렉토리(신설 5파일)·§3-3 규약(방법론 항목) |

**예상** 무게 영향(D-040 척도 — 리뷰 MINOR-3 반영: 실측 아님): 상시 주입 0,
신설 문서 전부 온디맨드. 고정 비용 = 스킬 목록 2행(description). **집행 후 실측
계획**: 설치 전후 tool/skill-schema 토큰·세션 고정 토큰 비교를 §6 ⑨에 포함.

## 4. 무접촉·불변

엔진(`engine/`)·서버 번들·vsp·MIGRATION-MANIFEST 분류·실데이터 2종 게이트(배포
기본값 잠금 + D-043 소유자 예외 그대로)·unattended=sealed·ENGINE
template-only(D-040)·`.harness/` 트랙 A 자산 — 전부 무접촉. approval-gates Gate B
분리는 정책 완화가 아니라 **이미 결정된 D-043을 문서에 정합시키는 것**이다.

## 5. Provenance (리뷰 M7 반영)

- **흡수 스냅샷 = aegis v0.21.0 @ `33f61df`** — 이 문서 머리말과 신설 파일
  frontmatter가 보존한다. 신설 파일별 `source:`: development-loop.md ←
  `using-aegis/SKILL.md`+`loop/SKILL.md`+`README.md` / modify-object.md ←
  `direct/SKILL.md`(+loop의 라운드 bound) / lesson.md ← `lesson/SKILL.md`.
  전 항목에 `(aegis v0.21.0 @ 33f61df, D-047 차용)` 병기.
- MIGRATION-MANIFEST 비관여(sc4sap-custom 전용 — D-045 선례). 기존 파일 수정분은
  `check-migration-snapshot` 목적지 sha 재핀(파일 수 불변 확인 동반).
- 상류 추종 없음 — 차용 시점 스냅샷 각색, aegis 후속 버전 정기 대조 안 함
  (sc4sap 휴면형 미추종과 동일 태도).

## 6. 집행·검증 계획 (v2 — 리뷰 M8 순서 재배열)

1. **모든 편집 완료 + 0.3.0 범프까지 한 배치로**: 신설 5파일 → 기존 파일 주입
   (외과적) → CLAUDE.md 계수·plugin-metadata(버전+문구)·project-context·
   approval-gates·DESIGN.md·README 3벌
2. `gen-plugin-manifests.mjs` 재생성 (계수 14/19 확인)
3. migration-map 목적지 재핀 (파일 수 불변 확인)
4. 게이트 전종: snapshot · links · verify-engine · engine-provenance · smoke-mcp ·
   manifests --check · doctor(로컬 — 기지 agy 드리프트 1건 제외 green) ·
   음성시험 2종(16/16·17/17)
5. **fresh-context behavioral smoke**: 새 세션/서브에이전트에서 modify-object·
   lesson 스킬이 발견·로드되고 development-loop.md 참조가 해석되는지 확인
6. **최종 diff 새-컨텍스트 독립 리뷰** (레포 표준)
7. 리뷰 수정 발생 시 → 2~6 재실행 (최종 diff = 검증·리뷰된 diff 불변식)
8. HANDOFF 갱신 + 집행 D-결정 append(§8의 D-047 정정 부기 포함) + 커밋
9. 주 머신 `claude plugin update sapkit --scope local` + 재시작 → **전후 토큰
   실측**(스킬 스키마·세션 고정분) 기록
10. → ZUNIWHT 도그푸딩 착수 (D-043 선행 2건 유효)

## 7. 독립 리뷰 반영 기록 (2026-07-23)

- verdict **"수정 후 기록"** · BLOCKER 0 · **MAJOR 9 전건 반영**: M1(갭 ⑴ 부분
  존재로 정정 + modify-object 스킬 신설) · M2(강도 축 = Track A 직교 명문) ·
  M3(bound 단위 혼동 철회 — 현행이 이미 aegis 동일) · M4(run 증거 동등 주장 철회 +
  백로그) · M5(보증 등급 기능별 매트릭스로 교체) · M6(execution_owner에 P2 main-only·
  P4 비위임·delegated P3 상한·control artifact main-only·비밀 미전달 추가) ·
  M7(원천 = v0.21.0 @ 33f61df 정정 + 파일별 source) · M8(집행 순서 재배열: 범프
  선행·HANDOFF·CLAUDE 계수·metadata 문구·behavioral smoke 추가) · M9(Gate B를
  배포 기본값/D-043 예외로 분리).
- **MINOR 3 전건 반영**: artifact "14종(파일 수 변동)" 표현 · lesson 원천 세부
  (domain scope·semantic-conflict 검사·L↔R 연결) 명문 · 토큰 영향 "예상" 강등 +
  실측 계획.
- **열린 질문 5건 확정**: Q1 = 대안 채택(modify-object 스킬 — 최종 계수 14스킬/
  19절차) · Q2 = 본안(보류 + 재진입 규칙 명문) · Q3 = 전제 수정(변경 없음) ·
  Q4 = 본안(lesson 스킬) · Q5 = 조건부 본안(project-context 등록 + 로컬 전용 명시).
- 검증자 주장 독립 대조(주 세션): 원천 v0.21.0·HEAD `33f61df`·using-aegis L34 ·
  approval-gates Gate B 절대 문구 · CLAUDE.md L24 계수 · plugin-metadata
  single-agent 문구 — 전부 실물 확인.

## 8. 정직 유보

- 흡수 후 방법론의 실전 실효는 **미실측** — ZUNIWHT 도그푸딩이 관찰 자리(특히
  modify-object 발견·사용률, RULES CONSULT 실사용률, execution_owner의 3사 격차).
- 보증 등급은 §3-1 ④ 매트릭스가 정본 — 이식 조각 대부분은 **절차적**이며, 감사
  가능성은 파일을 남기는 기능에만, 기계 강제는 기존 어댑터/서버 층에만 있다.
  "방법론 흡수 = 보증 강화"가 아니다.
- **D-047 정정 예고**: D-047 맥락문의 "Direct·Guided … 보증 등급은 절차적+감사
  가능"은 원천 등급표보다 반 단계 높다(원천: Direct = 절차적만). append-only
  원칙에 따라 집행 D-결정에서 정정을 부기한다.
- Codex/Antigravity에서의 신설 문서 로드·스킬 실행은 매니페스트 구조상 자동이나
  실연결 검증은 미실측(D-045 ⓒ와 동일 유보).
- 토큰 무게는 예상치 — §6 ⑨ 실측 전 "달성" 선언 금지(D-040).
