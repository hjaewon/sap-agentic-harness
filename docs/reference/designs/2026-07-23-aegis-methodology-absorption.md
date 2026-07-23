# aegis v0.20 방법론 흡수 설계 (D-047 집행안) — 초안 v1

> 작성 2026-07-23 · 작성자 = 주 세션(Claude) · 상태 = **초안, Codex 독립 리뷰 대기**
> 근거 결정 = D-047 (DECISIONS.md) · 원천 = `D:\claude-practice\claude-fable-final` (aegis v0.20)
> 리뷰 방식 = read-only 새-컨텍스트, `gpt-5.6-sol` + `reasoning=max`, BLOCKER/MAJOR/MINOR 판정

## 0. 한 문장 요약

sapkit(트랙 B 제품)이 sc4sap에서 승계한 개발방법론을 aegis v0.20("한 루프 세 강도")의
엔진-외 조각으로 **보완**한다 — 진짜 갭 3개(강도 선택 · execution_owner ·
LESSONS→RULES)를 주입하고, 이미 있는 것(run 증거·재개·bounded 수리)은 재발명하지
않고 방법론 어휘로 **재명명·명문화**만 한다.

## 1. 배경

- D-047: 사용자 원목적 = "sc4sap 개발방법론 대신 최신화된 방법론". ENGINE은
  template-only(D-040)로 버렸으나 엔진-외 방법론 조각은 흡수됐어야 했다.
- 원천 실사 (2026-07-23, 주 세션):
  - `skills/direct/SKILL.md` (67줄) — 최소 강도 루프. 프로젝트 흔적 0(절차적 제약),
    execution_owner(main/delegated/auto), 검증 없는 완료 주장 금지, Guided 승격 제안 기준.
  - `skills/loop/SKILL.md` — Guided. run-scoped 계약(`contract.md` sha256 결합) ·
    `manifest.json` 증거 · `review.md`(finding ID 구조) · 수정→재검증 최대 2회 →
    3회째 필요 시 `blocked` · execution_owner 소유권 경계(worker는 자기 변경의
    리뷰어가 될 수 없음, control artifact는 main만 작성).
  - `skills/lesson/SKILL.md` — Memory 루프. FAIL→INVESTIGATE→VERIFY→RULE→CONSULT
    5단계, RULE은 검증된 원인만·사용자 승인 필수·부정 제약 문형, RULES.md 40개 캡,
    Demote 모드(잘못된 규칙의 강등도 승격과 동일 엄격성), Triage 모드(엔진 전용 — 제외).
  - 보증 등급 어휘: **절차적(procedural) / 감사 가능(auditable) / 기계 강제
    (mechanically enforced)**. Direct/Guided는 절차적+감사가능, 기계 강제는 Engine 전용.
  - Direct 스킬·Guided 강화는 원천 레포에서 외부 독립 리뷰 게이트 통과(`9b23601`) ·
    도그푸딩 완료 상태.
- 공급선 구분(D-047 ④): 이 차용은 D-038의 ENGINE 공급선(verified v0.17.3 동결)과
  별개다. 절차 텍스트만 가져오며 엔진 코드 무접촉 — D-040 template-only·D-018
  소스 비혼합과 충돌 없음.

## 2. 현재 상태 정밀 실사 — 갭 재측정 (초기 6조각 지도의 정정)

D-047 기록 시점의 6조각 지도는 대화 수준 추정이었다. 절차 원문 정독 결과 3조각은
**이미 존재**한다. 이 재측정이 본 설계의 출발점이다:

| 조각 | 초기 추정 | 실사 결과 | 처분 |
|---|---|---|---|
| ⑴ 강도 선택 | 없음 | **없음 확인** — create-program은 전부-아니면-전무. 기존 프로그램 소수정 경로 부재 | **주입 (§3-1)** |
| ⑵ run 증거+중단재개 | 없음 | **create-program에 이미 존재** — `.sc4sap/program/{PROG}/` 14파일, `state.json` per-phase status + Resume Behavior 절, approval은 spec sha256 결합(aegis contract_sha256 등가) | 재발명 금지, 어휘 명문화만 (§3-5) |
| ⑶ bounded 수정→재검증 | 없음 | **존재** — Phase 6 verdict 처리: MAJOR 수리 → 기계검증 체인 재실행 → 새 컨텍스트 재리뷰, **3회 소진 시 blocked** | 현행 유지, 최소 루프만 2회 (§3-4) |
| ⑷ execution_owner | 없음 | **없음 확인** — "A single agent executes every phase" 단정, 위임 소유권 개념 부재 | **주입 (§3-3)** |
| ⑸ LESSONS→RULES | 없음 | **없음 확인** — 상위 DESIGN.md §2 목표 2의 미집행분. `.sc4sap/`에 LESSONS/RULES 규약 없음 | **주입 (§3-2) — 본 설계의 최대 조각** |
| ⑹ 보증 등급 명문 | 부분 | **부분 존재** — review-checklist의 어댑터별 기계강제/절차적 구분, approval-gates.md "관문=문서 규약" 명시. 단 3등급 어휘 체계는 없음 | 어휘 통일 (§3-5) |

## 3. 흡수 설계

### 3-1. 방법론 정책 문서 신설 — `core/policies/development-loop.md` (조각 ⑴⑹의 정본)

신설 1파일이 방법론 어휘의 단일 정본이 된다 (§3-3 핵심 규약 1 "단일 원천" 준수 —
절차들은 이 문서를 참조만 한다). 내용 (영어, core 문서 언어 관행):

1. **한 루프 선언**: 의도 파악 → 계약 → 실행 → 검증 → 독립 리뷰 → 수리 → 재검증 →
   판정 → 교훈 반영. sapkit의 모든 개발 절차는 이 루프의 강도별 구현이다.
2. **세 강도와 최경량 원칙** (aegis 핵심 통찰의 sapkit 매핑):

   | 강도 | sapkit 실체 | run 파일 | 리뷰 |
   |---|---|---|---|
   | **Minimal** (aegis Direct 등가) | 본 문서에 내장된 최소 루프 — 기존 객체 소수정·명백한 단건 작업 | **0** (프로젝트 흔적 없음) | 불요 (기계 검증만) |
   | **Standard** (aegis Guided 부분 등가) | `create-object` — 메타데이터 확인 게이트 + 완료 보고 | Step 산출물 | 조건부 |
   | **Full** (aegis Guided 완전 등가) | `create-program` — 인터뷰→스펙→승인→구현→리뷰 파이프라인 | `.sc4sap/program/{PROG}/` 전체 | 필수 (Phase 6) |

   선택 규칙 = **실질 위험을 덮는 가장 가벼운 강도** (aegis 원문: "Choose the lightest
   strength that covers the material risk"). 작업 라벨(버그/기능/UI)이 강도를 정하지
   않는다 — 모호성·파급 범위와 되돌리기 난이도·외부 부작용·중단재개 필요·통합 필요로
   판단한다. 승격 제안 기준(aegis direct §Procedure 5 이식): 모호한 성공 기준 ·
   광범위/비가역 영향 · 외부 부작용 · 중단재개 가능성 · 통합 필요 워크스트림이
   실질화되면 상위 강도를 제안하고 수락을 기다린다.
3. **최소 강도 루프 내장** (aegis direct 67줄의 SAP 각색 — 신규 스킬 아님, 이 문서의
   한 절): ① 관련 규칙 읽기(`.sc4sap/RULES.md` 있으면 관련 규칙만; 없으면 조용히 진행 +
   기존 Mandatory Rule Reads) ② 요청 범위 안에서만 구현(`Update*` 계열) ③ 기계 검증
   (CheckSyntax → ActivateObjects → 해당 시 unit/ATC) — **검증 없는 완료 주장 금지**
   ④ 실행 명령·결과를 증거로 보고 ⑤ 상태는 Track A 모델 그대로(**PROVISIONAL_WRITE**
   상한 — MCP 성공 ≠ 완료, V-PASS 없이 "done" 금지) ⑥ 수정→재검증 **최대 2회**, 3회째
   필요 시 중단·보고. 프로젝트 흔적 0 — run 파일·상태 파일을 만들지 않는다.
4. **보증 등급 어휘** (조각 ⑹): 절차적/감사가능/기계강제 3등급 정의 + sapkit 현행
   매핑 — 스펙 승인 게이트·강도 선택 = **절차적**, state/verification/review-result
   파일 = **감사 가능**(모델 작성 기록이며 발생 사실의 증명이 아님 — aegis 정직성
   문구 이식), Claude 어댑터 리뷰어 도구 차단·PreToolUse 훅·서버 blocklist =
   **기계 강제(어댑터/서버 한정)**. approval-gates.md·review-checklist.md의 기존
   정직성 문구와 상호참조(내용 이동 없음 — 어휘만 이 문서가 소유).
5. **execution_owner 규약** (조각 ⑷ 정본 — §3-3에서 절차에 배선).

frontmatter `source:`에 aegis 원천 경로 3종 + D-047을 명기한다 (§5 provenance).

### 3-2. LESSONS→RULES 이식 — `core/procedures/lesson.md` + 13번째 스킬 (조각 ⑸)

aegis `skills/lesson/SKILL.md`을 SAP 각색해 **18번째 절차·13번째 스킬**로 신설한다.

- **파일 규약**: `.sc4sap/LESSONS.md` + `.sc4sap/RULES.md` (프로젝트 로컬 —
  `.sc4sap/`은 기존 프로젝트 컨텍스트 규약과 권한 템플릿(`Read/Edit(.sc4sap/**)`)이
  이미 덮는 경로다. 신규 권한 불요).
- **유지**: 5단계(FAIL→INVESTIGATE→VERIFY→RULE→CONSULT) · VERIFY 없는 규칙화 금지 ·
  RULE은 사용자 명시 승인 필수 · 부정 제약 문형("do not X — it causes Y") · 스타일/
  톤은 RULES 소재 아님 · 40개 캡 + 병합 우선 · **Demote 모드**(모순 증거 →
  검증 → 사용자 승인 강등 — 승격과 동일 엄격성) · 평범한 실패의 자동 승격 금지.
- **각색**: area 태그를 SAP 어휘로 예시(abap, cds, transport, mcp, atc, module-FI …).
  scope 메타데이터 문법(`[path:…] [action:…]`)은 **유지하되 기계 매칭 조항 제거** —
  aegis에서 그 매칭은 Engine이 수행한다. sapkit에는 엔진이 없으므로 scope는 CONSULT
  때 사람/모델이 읽는 필터 힌트다(절차적). 이 강등을 문서에 명시한다(보증 등급 정직성).
- **제외**: Triage 모드(`| engine |` 항목 처리 — 엔진 전용) · "mechanically injected"
  전제 문구 전부.
- **CONSULT 배선 3곳** (읽기 쪽): ① create-program Phase 2(Planning) 도입부에
  "`.sc4sap/RULES.md` 있으면 관련 규칙 읽기 — 매칭 규칙은 hard constraint" 1문장
  ② create-object "Mandatory Rule Reads" 절에 동일 1행 추가 ③ 최소 강도 루프 step ①
  (§3-1에 내장). 없으면 조용히 진행 — 설치 부담 0, opt-in 구조(aegis와 동일).
- **쓰기 쪽 트리거**: 사용자 명시 요청 또는 반복 가능성 있는 검증된 원인 발생 시
  절차가 lesson 절차를 **제안**(자동 실행 아님). create-program Phase 7(Debug)과
  Phase 8 보고에 제안 포인트 1문장씩.

### 3-3. execution_owner 주입 (조각 ⑷)

정본은 development-loop.md §5 (aegis loop·direct의 소유권 규약 통합 이식):

- `execution_owner = auto | main | delegated`. main = 현 대화가 구현. delegated =
  fresh worker가 구현하고 main은 조정·검증·리뷰 배분에 집중. auto(기본) = 소규모·
  국소·저출력은 main, 탐색 많음·다파일·장황한 구현 출력이 메인 컨텍스트를 실질
  소모하면 delegated.
- **소유권 경계** (aegis 이식): 구현 worker는 자기 변경의 독립 리뷰어가 될 수 없다 ·
  리뷰어/worker 배분은 main만 수행 · worker에는 계약·과업 조각·검증 기대만 주고
  전체 대화를 주지 않는다 · worker 결과는 압축 형식(변경 경로·결정·명령과 결과·
  블로커)만 회수 · main이 최종 검증을 직접 실행 또는 관찰.
- **하네스 중립 문구**: "환경이 fresh worker/subagent를 지원하면"으로 조건화 —
  Claude 어댑터 = 서브에이전트, 미지원 하네스에서는 auto가 main으로 안전 폴백
  (aegis 원문 폴백 조항 이식). 명시적 delegated 요청을 조용히 무시하지 않는다.
- **절차 배선**: create-program Phase 4 도입부에 1문단 — "A single agent executes
  every phase" 단정을 "main이 소유하되 Phase 4 구현은 execution_owner 규약에 따라
  위임 가능(Phase 6 리뷰어 독립성 경계 유지)"으로 완화. create-object Step 4에
  참조 1문장. 그 외 절차(analyze-*, ask-consultant 등 read-only 계열)는 무접촉.

### 3-4. bounded 수정→재검증 — 현행 유지 + 최소 루프만 2회 (조각 ⑶)

- create-program Phase 6의 **리뷰 3회 소진 → blocked**는 유지한다. 정렬(3→2)을
  하지 않는 이유: 이 루프는 12항목 규약 체크리스트 리뷰이고 수리 후 기계검증 체인
  재실행이 aegis의 코드 diff 재리뷰보다 싸다 — 기존 캘리브레이션을 근거 없이
  흔들지 않는다(도그푸딩 관찰 대상으로 명시).
- 최소 강도 루프(신설)는 aegis 원형대로 **2회** (§3-1 ⑥).
- development-loop.md가 두 bound를 나란히 표기해 차이가 의도임을 명문화한다.

### 3-5. run 증거·재개 — 재발명 금지, 명문화만 (조각 ⑵)

- `.sc4sap/program/{PROG}/` 체계를 development-loop.md의 강도 표에서 "Full 강도의
  run-scoped 증거"로 **명명**한다. aegis `manifest.json`/`review.md` 형식은 이식하지
  않는다 — 기존 approval/verification/review-result JSON+스키마가 동일 역할을 이미
  수행하며(스펙 sha256 결합 포함), 형식 교체는 이득 0·파손 위험만.
- create-object 경량 state 추가 여부 = **보류** (열린 질문 §7-2). 기본안 = 추가하지
  않음(Standard 강도는 단일 세션 완결이 통례) — 도그푸딩 마찰이 근거를 만들면 그때.

### 3-6. 수정 파일 총람

| 처분 | 파일 | 내용 |
|---|---|---|
| **신설** | `interactive/core/policies/development-loop.md` | §3-1·3-3·3-4 정본 (aegis direct+loop 발췌 각색) |
| **신설** | `interactive/core/procedures/lesson.md` | §3-2 (aegis lesson 각색) |
| **신설** | `interactive/skills/lesson/SKILL.md` | 래퍼 (기존 12스킬 패턴) |
| 수정 | `core/procedures/create-program.md` | Use When 강등 조항 1문장 · Phase 2 CONSULT 1문장 · Phase 4 execution_owner 1문단 · Phase 7/8 lesson 제안 각 1문장 |
| 수정 | `core/procedures/create-object.md` | Use When 강등 조항 · Mandatory Rule Reads 1행 · Step 4 참조 1문장 |
| 수정 | `core/policies/approval-gates.md` | development-loop.md 상호참조 1행 (내용 이동 없음) |
| 재생성 | 플러그인 매니페스트 5종 | 스킬 13·절차 18 자동 계수 (`gen-plugin-manifests.mjs`) |
| 재핀 | `interactive/provenance/migration-map.json` | 수정된 기존 파일들의 목적지 sha256 (파일 수 불변) |
| 갱신 | `interactive/DESIGN.md` | §3-2 디렉토리(신설 3파일) · §3-3 규약(방법론 항목 추가 — 설계 변경이므로 갱신 대상) |
| 갱신 | 어댑터 README 3벌 | lesson 스킬 1행 (기존 스킬 나열부) |
| 범프 | `interactive/plugin-metadata.json` | **0.2.1 → 0.3.0** (기능 추가 = minor) |

무게 영향(D-040 척도 = 세션 토큰): 상시 주입 0 — 신설 3파일 전부 온디맨드 로드
(policies는 절차가 참조할 때만, lesson 스킬은 호출 시만). 고정 비용은 스킬 목록
1행(lesson description)뿐.

## 4. 무접촉·불변

엔진(`engine/`)·서버 번들·vsp·MIGRATION-MANIFEST 분류·실데이터 2종 게이트(D-043
포함)·unattended=sealed·ENGINE template-only(D-040)·`.harness/` 트랙 A 자산 — 전부
무접촉. 이 흡수는 `interactive/core/` 문서 + 스킬 래퍼 1개 + 생성물 재생성으로 완결된다.

## 5. Provenance

- 신설 3파일 frontmatter `source:`에 aegis 원천을 명기:
  `claude-fable-final/skills/{direct,loop,lesson}/SKILL.md (aegis v0.20, D-047 차용)`.
  MIGRATION-MANIFEST는 sc4sap-custom 원본 분류 전용이므로 **비관여**(D-045 setup.md
  선례 — 신규 자생 파일은 스냅샷 게이트의 roots/inventory에 영향 없음 실측).
- 기존 파일 수정분은 `check-migration-snapshot` 목적지 sha 재핀으로 흡수(D-046 선례,
  파일 수 불변 확인 동반).
- 상류 추종 없음: 차용 시점 스냅샷 각색이며 aegis 후속 버전을 정기 대조하지 않는다
  (sc4sap 휴면형 미추종과 동일 태도 — D-040 ⑧ 정합). 원천 커밋/버전은 이 문서와
  frontmatter가 보존한다.

## 6. 집행·검증 계획

1. 신설 3파일 작성 → 기존 2절차+1정책 주입(각 1~2문장/문단, 외과적) → DESIGN·README 갱신
2. `gen-plugin-manifests.mjs` 재생성(계수 13/18 확인) → migration-map 재핀
3. 게이트 6종 green: snapshot · links(신규 링크 포함 깨짐 0) · verify-engine ·
   engine-provenance · smoke-mcp · manifests --check (+ 로컬 doctor — 기지 agy
   드리프트 1건 제외 green)
4. **새-컨텍스트 독립 리뷰**(레포 표준 — 본 설계 리뷰와 별개로 집행 결과물 리뷰)
5. v0.3.0 범프 → 커밋 → 주 머신 `claude plugin update sapkit --scope local` + 재시작
6. → ZUNIWHT 도그푸딩 착수 (새 방법론이 시험 대상. D-043 선행 2건 유효)

## 7. 열린 질문 (Codex 리뷰 요청 포인트)

1. **최소 강도 루프의 소재** — 본안: development-loop.md 내장(스킬 아님). 대안:
   14번째 스킬로 노출. 본안 근거 = 스킬 표면 증가 억제 + "명시 호출 없이도 적용되는
   기본 자세"라는 성격. 반론 가능: 발견 가능성(스킬 목록에 없으면 모델이 안 읽음).
   ※ 3사 어댑터에서 policies 문서의 로드 경로가 실제로 작동하는지 검증 필요.
2. **create-object 경량 state** — 본안: 보류. 반론 가능: Standard 강도에도 중단재개가
   필요하다는 도그푸딩 이전의 선제 근거가 있는가.
3. **Phase 6 bound 3회 유지 vs 2회 정렬** — 본안: 유지(§3-4). 반론 가능: 방법론
   통일성이 캘리브레이션 보존보다 중요한가.
4. **lesson의 스킬 노출** — 본안: 13번째 스킬. 반론 가능: 쓰기 트리거가 절차 내
   제안뿐이면 스킬 없이 절차 참조만으로 충분한가 (스킬 표면 최소주의).
5. **RULES 40캡·2파일 규약을 `.sc4sap/` 직하에 두는 것** — 프로젝트 컨텍스트
   규약(project-context.md)과의 충돌 여부.

## 8. 정직 유보

- 흡수 후 방법론의 실전 실효는 **미실측** — ZUNIWHT 도그푸딩이 관찰 자리다(특히
  최소 루프의 발견 가능성, RULES CONSULT의 실사용률, execution_owner의 3사 격차).
- aegis 원천의 보증 등급 그대로: 이식되는 전 조각이 **절차적+감사가능**이다. 기계
  강제는 기존 어댑터/서버 층(리뷰어 차단·훅·blocklist)에 이미 있는 것 외에 늘지
  않는다 — "방법론 흡수 = 보증 강화"가 아님을 명시한다.
- Codex/Antigravity에서의 신설 문서 로드·스킬 실행은 매니페스트 구조상 자동이나
  실연결 검증은 미실측(기존 D-045 ⓒ와 동일 유보).
