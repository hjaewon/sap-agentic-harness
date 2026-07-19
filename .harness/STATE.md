# FROZEN LEGACY — Historical Singleton STATE

> 2026-07-15 migration: 아래 내용은 과거 singleton Task Loop 기록으로 동결했다.
> 새 작업은 이 파일을 쓰지 않으며 삭제·덮어쓰기·압축·과거 내용 재작성 금지다. Guided는
> `.harness/runs/<run-id>/`의 run-scoped goal/state/review를, Engine은 승인된
> contract/manifest를 사용한다.

# State

<!-- Durable task memory (Task Loop steps 3 and 5). Keep it small: fold
     older entries into one-line summaries (see PROTOCOL.md Maintenance). -->

## Done

- 2026-07-15 | **새-컨텍스트 리뷰 지적 수리 완료** — MAJOR 6·MINOR 4 전건을 v2
  설계서/HANDOFF/GOAL/STATE에 반영하고 O-1도 게이트 증거 해석에 수용. SAP/vsp 호출,
  v0.19.2 분석 재실행, 커밋/push 0건. 작성자 자체 확인(self-check)과 분리된
  새-컨텍스트 read-only reviewer 판정은 **overall PASS, BLOCKER/MAJOR/MINOR 잔여 0**.
  D-025 본문은 append-only 원칙으로 미수정이며 D-026 정정 후보는 사용자 판단 대기.
- 2026-07-15 | **트랙 A 실행 모델 재기준 v2 작성 + 작성자 자체 확인(self-check,
  독립 검증 아님)** — 사용자 확정
  O1=(가)·O2=P4 transport 지금 설계·O3=Guided 파일럿 A 트랙 B MCP write를 같은
  설계서에 반영. 당시 D-019 SAP reviewer 기계 격리 약화와 `attended-only`/
  `unattended=sealed`/`historical_rv4_classifier=open`/
  `reviewer_mutation_boundary=unverified`를 봉인하고, reviewer transport 0·DEV-only
  생성/할당·사람 전용 release/import 실계약을 추가. D-025는 DECISIONS EOF 순수
  append, HANDOFF는 당시 헤더만 갱신. 작성자가 GOAL 18개를 모두 체크하고 **18/18
  PASS로 잘못 보고했으나 이는 자체 확인**이었다. 새-컨텍스트 독립 리뷰의 실제 판정은
  `PASS with fixes — MAJOR 6 · MINOR 4`; 종전 독립 검증 주장은 철회. 본 수리 설계는
  `sap_mutation_boundary=unverified`를 reviewer + 모든 attended child로 확장했으며
  D-025의 기존 필드에는 D-026 정정 판단이 남음. SAP write/release/import 실행 0건,
  커밋/push 없음.
- 2026-07-15 | **트랙 A 실행 모델 재기준 v2 설계 완료** — 신규 정본 후보
  `docs/reference/designs/2026-07-15-track-a-rebase-v2.md` 작성. candidate=6de63ba
  (commit blob v0.19.3; dirty worktree 0.19.4 제외), 3구조×5프로필·사람 Direct-P3
  PROVISIONAL_WRITE·reviewer/unattended 좁은 차단·RV4 4안·legacy deny wrapper·F/N·lock
  PROMOTE/REJECT·문서 연쇄·G1~G14/파일럿 계약 확정. 독립 reviewer 1차 11/14 뒤 모순
  3건+MINOR 3건 수리, 재검증 **14/14 PASS, BLOCKER/MAJOR/MINOR 0**. 금지 경로 diff 0,
  커밋/push 없음.
- 2026-07-11 | harness-tailor 산출물 배치 (사용자 승인분) — quality-gate 래퍼 2종
  (scripts/quality-gate-sap.ps1·verify-sap.ps1) + .claude/quality-gate.json(추적화) +
  VERIFY-PATTERNS 스텁 + RULES R-001~R-005 시드. 게이트 차단 실증 0→1→0 완료
  → **Phase 0a 완료 기준 3항목 전부 충족** (DESIGN §13). GOAL.md 전 기준 검증 통과.
- 2026-07-11 | Phase 0b 완료 — §16-2 연결(vsp-env.ps1) + COMMANDS.md 전수 실측 +
  실패 패턴 실측(ENV4·CODE2·LOCK 실재현)→verify-sap.ps1 마커 완성 + §14-2/3/9 판정 +
  VERIFY-PATTERNS 정본. GOAL 전 기준 충족
- 2026-07-11 | Phase 1 완료 — 커버리지 표(ABAP 부분 실효·CDS/BDEF 무의미·AMDP 본문
  불투명) + domain/abap 시드(S-001~025 + CHECKLIST) + **무인 엔진 첫 완주**
  (1-workdays-util, bridge 드라이버, 2 steps 각 1회 시도·verify 실패 0, 사후 리뷰
  하드 위반 0) → src/zsah1_workdays.prog.abap (테스트 클래스 먼저 — 스텝 경계로 기계
  증명). lint Error 차단 실증은 Phase 0a의 0→1→0 기록으로 충족. GOAL 전 기준 충족

- 2026-07-11 | Phase 1.5 완료 — **red/green 서버 실증**: 스텁 deploy→5 FAIL(red),
  최종본 deploy→**5 PASS(green)** — 무인 산출물의 정확성 실채점 확인. ATC 1건
  (INFO, exit 0 규약 재확인). **완료 기준 충족**: ENDIF 누락 소스가 offline lint
  exit 0 → connected deploy CODE_FAIL exit 1 (검출 1건 실증). 발견: vsp test가
  REPORT 로컬 테스트 클래스 지원 확인(Phase 3 red/green 루프 성립 근거), 문법 오류
  deploy는 깨진 잔존이 아니라 빈 스켈레톤 롤백(0b 서술 정정 — VERIFY-PATTERNS 반영)

- 2026-07-12 | Phase 2 계획 수립 — IDES-DEV read-only 답사(sonnet 위임, 원로그
  phases/2-duedate-reuse/recon-raw.md) → **답사가 계획 결정 3건 변경**(대상 객체
  CLAS+PROG 2개로 / 테스트 리포트 배치+deploy 순서 클래스 먼저 / 분석 스코프 객체
  단위) → PLANNING.md 기록(§13 완료 기준 "계획 문서 기록" 충족). 스텝 2개(계약+
  테스트 먼저 → calc 이식) 생성, D-4 린트 통과(경로 실재·맥락 표현 0·verify 체인
  CHAIN_EXIT=0 실증). offline lint가 .clas.abap에도 동작 실측(verify 전제).

- 2026-07-12 | Phase 2 완료 — 무인 완주(사용자 직접 기동, 2 steps attempts 2/2·
  verify 실패 0, 사후 리뷰 위반 0) + connected 채점 **vsp test 5 PASS/0 FAIL**
  (ATC INFO만, graph가 ZCL 참조 포착). 채점 중 CLAS 배포 3결함 실측·기록:
  vsp deploy LOCK NoModification+잠금 누수, vsp copy 거짓 성공(→L-001/R-006,
  COMMANDS.md ⑤-6/7), 엔진 UpdateClass 423 계열 병명 규명(HANDOFF §6 백로그 4).
  클래스는 GUI 수동 주입, 리포트·테스트는 vsp 체인. 잔존 +2(ZCL_SAH2_WORKDAYS·
  ZSAH2_DUEDATE)

- 2026-07-12 | 수리 스프린트(사용자 지시, Phase 2 채점 발견분) — ① vsp 잠금 누수:
  NoModification 가드에 unlock 추가(vsp-custom 00b4b21, sonnet 위임), 라이브 검증
  연속 2회 시도 잔존 잠금 0, vsp.lock v2.38.1-87 갱신. ② 엔진 UpdateClass 423 계열:
  4.13.3 — lock 직후 setSessionType('stateful') 1줄(opus 위임), jest 439+회귀(역검증),
  번들 반영(런북), **IDES 라이브 red→green**(당일 실패 호출이 updated+activated).
  잔여: UpdateInterface/UpdateProgram 동일 잠복(HANDOFF §6 백로그 9), vsp
  RenameObject 누수 후보, CLAS deploy NoModification 근본(3번 — 조사 후 결정 대기)

- 2026-07-12 | 수리 3 완료 — 조사(opus 위임: vsp vs 엔진 lock 흐름 대조로 원인
  특정) → 라이브 프로브(Accept v1/v2 동일 NoModification = 가드 오탐 H1 확정) →
  수리(sonnet 위임): ① 가드 경고 강등+진행(vsp 8279a7c) ② copy 5함수
  result.Success 검사+배너 정직화(322320f). 라이브 검증: **deploy CLAS
  "Successfully updated and activated" 최초 완주** + copy 소스 실기록 정직 성공.
  vsp.lock v2.38.1-89, §14-4 CLAS 개통, R-006 개정(수리 반영). 잔여: RenameObject
  누수 후보(COMMANDS ⑤-6), 엔진 UpdateInterface/UpdateProgram 잠복(§6 백로그 9)

- 2026-07-12 | 백로그 5-7 완료 (트랙 B, opus 위임) — install-sap-assets.md 신설
  (동결 원본 wizard-step-09 이식 — 게이트 로직 6종 보존, 동봉 실재 22파일만 참조,
  zrfc/_EXT 미동봉 명시) + 3계열 SKIPPED 규칙 기입측·소비측 반영 + 매니페스트 갱신.
  1차 새-컨텍스트 리뷰(opus) FAIL — 소비측(review-checklist known_outages 범위)
  누락 검출 → 수리 → 2차 PASS. 부수: doctor.mjs 사각지대 수리(.py 훅 인식 +
  CLAUDE_PROJECT_DIR 치환 — FAIL 5건이 전부 오탐이었음 실증). 게이트 5종 green

- 2026-07-12 | vsp RenameObject 잠금 누수 수리 (sonnet 위임) — 구객체 삭제 실패
  경로에 unlock 추가(7a2ef66, 00b4b21 동일 패턴·원 에러 보존). pkg/adt lock 사이트
  감사 추가 누수 0. 검증은 코드 리뷰 수준(RenameObject 테스트 전무 실측 —
  build/vet/test green, 라이브 재현 미실시)으로 한계를 COMMANDS ⑤-6에 명기.
  vsp.lock v2.38.1-90 갱신

- 2026-07-12 | 엔진 4.13.4 — UpdateInterface·UpdateProgram 잠금 세션 유지 (opus
  위임, HANDOFF §6 백로그 9 해소) — 4.13.3과 동일 1줄(lock 직후 stateful 핀) +
  회귀 테스트 2본(역-검증). jest 515/0, 런북 재번들(capability diff no-op),
  **IDES 라이브 red→green 양 핸들러**(구 번들 Sperr-Handle 재현 → 신 번들 완주,
  $TMP 한정·임시 객체 정리). 동일 시그니처 스캔이 UpdateView 등 후보 발굴 →
  신규 백로그 10(감사)로 이관

- 2026-07-12 | vsp 전수 감사 완료 (sonnet 위임, 사용자 "vsp 다 수정" 지시) — 잠금
  지점 24곳 + 비ADT 흐름 전수 판정표. 추가 누수 1건 수리(ExecuteABAP 정리 경로:
  delete 실패 시 unlock + CleanedUp 정직화) + 거짓 성공 4건 수리(devops 설치 루프
  2·MCP 설치 핸들러 2 — WriteSource Success=false 무시하고 OK 출력, 322320f 계열).
  커밋 0b03ef2, lock v2.38.1-91. 잔존(수리 불가 문서화): LockObject parseLockResult
  실패 경로는 핸들 부재로 클라이언트측 unlock 불가. report-only 판단 유보 3건
  (runExecute exit 0·Rename 부분 성공·CreateClassWithTests)은 COMMANDS ⑤-6 기록.
  touched 패키지 테스트 green(실패 3패키지는 clean HEAD 동일 — 환경성 실증)

- 2026-07-12 | 엔진 4.13.5 — 백로그 10 전량 (opus 위임, 사용자 "발굴분도 수리"
  지시) — Update 핸들러 10종 stateful 핀 + 계열 테스트 10케이스(역-검증), jest
  525/0, 런북 재번들. 라이브 red→green: Table·Domain 423 재현→해소. PUT-first
  계열(FM·SRVD·DDLX·BDEF)은 라이브 미재현이나 unlock 노출+프로토콜 정본 근거로
  핀 유지. $TMP 임시 객체 8/8 정리, 고아 잠금 0. 감사 부산물 7건(Create 계열
  동일 병리 **라이브 실증** 포함) → HANDOFF §6 백로그 11 기록. 별건: 업스트림
  사용자용 vsp-423-fix-handoff.md에 §3c(오늘 vsp 수리분, 포크 전용 파일 제외
  검증) 추가

- 2026-07-12 | 엔진 4.13.6 — 백로그 11-① Create 계열 (opus 위임) — 수리 6종
  (핀 5 + CreateInclude의 lock 직후 stateless 리셋 제거), 재스캔이 raw-lock 2종
  추가 발굴(CreateInclude 수리·CreateTextElement는 별개 병리로 11-⑦ 편입).
  CreateStructure는 죽은 잠금 쌍(무수리, 11-⑨). 테스트 6케이스 역-검증, jest
  531/0, 재번들. 라이브: CreateDomain·CreateDataElement red 423 → green 423
  소멸. 신규 발굴: 로그온 언어 불일치 결함(라이브 확정, 11-⑧ — 잠금 수리 후
  지배적 차단 요인). $TMP 잔존물 0·고아 잠금 0 검증. 누적 19 핸들러(4.13.3~6)

- 2026-07-12 | 5-5 우선분 완료 (sonnet 위임) — fetch 스크립트 2종을 동결 원본에서
  `interactive/tools/fetch/`로 이식(순수 stdlib·private 결합 0, 실동작 증명:
  ABAP 키워드 문서 + SAP Help 실fetch). sap-doc-specialist 페르소나의 깨진
  "bundled" 참조 해소 + help-portal-fetch/spro-lookup 경로 갱신 + 매니페스트
  deferred→copy 재분류. 부수: 동결 레포에 전역 sc4sap 플러그인이 남긴 런타임
  로그 드리프트(.sc4sap/state/) 실측 → 매니페스트 obsolete 규칙 추가로 게이트
  복구. 나머지 deferred(extract 2종·sap-profile-cli)는 유지

- 2026-07-12 | 5-8 필수분 완료 (opus 위임, IDES 라이브) — **Codex approval_mode
  fail-open 실증**(prompt 설정에도 T000 실데이터 반환 — 승인 방식 신뢰 불가) →
  row-data 2종은 `disabled_tools` 하드 차단만 실효, 어댑터 README에 필수 설정
  정본화. AG excludeTools는 문서 수준 기록(미실증 — 승격 대기). launch.cjs 필터
  대안은 백로그. 평시 OFF 복원 검증(toggle off·mcp remove·config 청정). 잔여
  5-8 하위 2건(required_capabilities·smoke write 판정)은 [낮음] 유지

- 2026-07-12 | 엔진 4.13.7 — 백로그 11-② 래퍼 내부 stateless 누수 (opus 위임,
  사용자 "full로 끝까지" 스프린트 Wave 1/5 — GOAL.md) — vendored client 직접
  패치를 patch-package로 정본화(engine/patches/, npm install 자동 재적용):
  Local 4계열 create+update 풀체인 재핀·updateTestClasses 리셋 제거 +
  **UpdateBehaviorImplementation 4.13.5 목록 누락 추가 발굴·수리**. 회귀 7케이스
  (역-검증 — 패치 원복 시 전부 FAIL 실측), jest 538/0, 재번들(capability no-op),
  라이브 red→green(UpdateLocalTestClass $TMP — 구 번들 423 → 신 번들 완주),
  $TMP 정리·고아 잠금 0. 새-컨텍스트 리뷰(opus) PASS(BLOCKER/MAJOR 0). 신규
  발굴: Delete 로컬 계열 4종 클라이언트 레벨 항상 실패(선재 결함 → 백로그
  11-⑩), 미도달 풀체인 동일 결함은 upstream 수리 후보

- 2026-07-12 | 엔진 4.13.8 — Wave 2/5 CT 협상 계열 (opus 위임) — 11-③
  UpdateFunctionGroup raw PUT에 4.13.1 discovery 협상 적용(잠금 전 협상·v3
  폴백·legacy 스킵), **라이브 red 415→green**(read-back masterLanguage=CS).
  구 3-7 상수 비대칭은 흡수 해소 판정(도달 가능 FUGR 쓰기 경로 전부 협상 —
  vendored 폴백은 도달 불가 죽은 코드, 미수정 근거 CHANGELOG). 11-④ CreateView
  400은 원인 확정·이관 — CT 계열 아님, 언어 불일치(11-⑧ 뿌리, vendored
  language="EN" 하드코딩) + 쉘 잔류 없음(구 서술 정정) + handleCreateView가
  ADT 에러 body를 버리는 부수 결함 발굴(11-⑧에서 함께). jest 540/0(역-검증),
  capability no-op, 게이트 5종 green, 새-컨텍스트 리뷰(opus) PASS. $TMP
  실삭제 검증·고아 잠금 0

- 2026-07-12 | 엔진 4.13.9 — Wave 3/5 정직성 계열 (opus 위임) — ① 구 3-5:
  `/deletion/delete` 계열 **공통 뿌리 수리** — vendored 공용 헬퍼(patch-package)
  로 delete 12종 일괄 정직화 + 캐스케이드 배열 정규화(라이브 발굴) + 인식 불가
  body HTTP 폴백. 라이브 red(잠긴 FUGR 삭제 거짓 성공+잔존)→green(SAP 메시지
  정직 실패)+정상 삭제 무영향. ② 구 3-3: CreateProgram 미지원 4타입 사전 거부
  +enum 6→2, 라이브 red(가짜 REPORT)→green(거부+미생성). compact 경로는 수리
  상속(리뷰 검증), CreateProgramLow 잔여. ③ 11-⑨: 죽은 잠금 쌍 제거, 동작
  동일. jest 556/0(역-검증 전 항목), capability no-op, 게이트 5종 green,
  새-컨텍스트 리뷰(opus) PASS(MINOR 2 — CHANGELOG 과대 기술 정정 완료).
  $TMP 정리·실삭제 검증(SearchObject 잔존 1) — **ZSAH39_FGL 세션 잠금 잔존**
  (red 재현용 SIGKILL 산물, SAP 세션 타임아웃 자동 해소·SM12 정리 가능,
  기능 영향 0 — 스프린트 종료 시 해소 재확인). 부수: 에이전트 잔존 정리
  루프 프로세스 종료(메인). 별건: fewer-permission-prompts로 게이트 5종
  Bash/PowerShell 정확 형태 10건을 .claude/settings.json allow에 추가

- 2026-07-12 | 엔진 4.13.10 — Wave 4/5 언어 계열 (opus 위임, 세션 한도로 1회
  중단→재개) — ① 11-⑧(+11-④ 본수리): 로그온 언어 동적 해석(systeminformation
  실측 CS → resolveLogonLanguage, 캐시·EN 폴백) + Create 3종 주입 + vendored
  master_language 수용(patch 32파일) + patchXmlAttribute opt-in add-if-missing
  → 라이브 red→green 3종(View 400 소멸·Domain/DTEL description 착지) + **구
  번들이 남긴 반쪽 스켈레톤 2건 Update 복구 실증**(영구 불구 해소). ② 11-⑥:
  already-exists 판별을 기계 식별자 우선(타입→T100 SWB_TOOL/016[실측]→다국어
  폴백)으로 재설계 — 사용자 "동적 적용" 지시 반영, 라이브 red(독어 오분류
  거부)→green. ③ CreateView 에러 body 전달(형제 판정표 기록). jest 572/0
  (역-검증 3계열), capability no-op, 게이트 5종 green, 새-컨텍스트 리뷰(opus)
  PASS(MINOR 2 관찰만). $TMP 5종 실삭제 검증·고아 잠금 0. 잔여 관찰:
  add-if-missing 추가 description GET 비직렬화(백로그 후보, HANDOFF 11-⑧ 기록)

- 2026-07-13 | 엔진 4.13.11 — Wave 5/5 조사·확장 계열 (opus 위임) — ① 11-⑤:
  원인 확정 = vendored AdtStructure.check의 ddlCode 조용한 드랍(새 DDL 대신
  저장본 검사 — 빈 에러·PUT 불투명 실패 공통 뿌리, 미구현 아님). 수리 =
  check-with-source 전달(+저수준 CheckStructure ddl_code 경로 부활) + bare
  에러 상태 폴백. 라이브 red(불투명 Kein Sichern)→green(진짜 원인 사전
  표면화+정정 DDL 완주). ② 구 3-6: low 3종+CDS 리더 3종을 4.13.1 클래식
  헬퍼 재사용으로 전환(계약·스키마 보존), 라이브 red 404→green(실 runResult,
  --exposition low 실증). jest 580/0(역-검증 양방향), capability no-op(155),
  게이트 5종 green, 새-컨텍스트 리뷰(opus) PASS — 리뷰가 동류 1건 추가 발굴
  (AdtTable.check 동일 드랍 → HANDOFF 11-⑪). $TMP 2종 실삭제 검증·고아
  잠금 0

- 2026-07-13 | **엔진 수리 스프린트 종결** (GOAL.md 전 기준 충족) — 목표
  11건/5 Wave 전량 해소(4.13.7~4.13.11), Wave별 리뷰 5/5 PASS, 라이브
  red→green 누적 12건+, jest 538→580(실패 0 유지). Wave 3 잔존물
  ZSAH39_FGL은 삭제 완료 확인(read-back not found — 정리 루프가 종료 전
  성공). 신규 백로그 11-⑩·⑪ + 관찰 2건 HANDOFF 등재. HANDOFF 헤더 정리
  (다음 착수 후보 3안 — 사용자 판단)

- 2026-07-13 | 업스트림 핸드오프 작성 (opus 위임, 사용자 지시 "원본도 고칠 수
  있게") — `engine/UPSTREAM-FIX-HANDOFF.md` 신설: 영어 자립형(vsp-423 선례
  형식), 4.13.2~4.13.11 전량을 병리별 9섹션(증상 원문→root cause→수정 위치
  [서버 vs 클라이언트 패키지 구분]→테스트→라이브 검증) + 잔여 결함 7 + 적용·
  검증 절차. CHANGELOG 대조 누락 0, 게이트 통과. 부수 수리: CHANGELOG
  4.13.8 헤더 누락(4.13.9에 중첩) 발굴·수정. 신규 백로그 11-⑫ 등재 —
  잔여 create 경로 EN 하드코딩(포크 클론에서 번들 직편집 KO 핸드핵 발견 =
  실수요 실증, 원복 권장·근본 수리는 11-⑫). 다음 착수 ①을 11-⑪·⑫ 묶음으로
  확대(HANDOFF 헤더 반영)

- 2026-07-13 | **엔진 11-⑪·⑫ 수리 완료 (4.13.12, 1 Wave, 메인 워커)** — 착수 ①.
  **11-⑪**: 정독이 백로그 "1줄"을 확장 — table `runTableCheckRun`이 parse/throw
  안 해 AdtTable.check가 항상 errors:[] → 나쁜 update 무차단. 2편집(ddlCode 전달
  + parse/throw, structure 미러, check()에만 surgical). **11-⑫**: 8종 create
  언어 확장(Class·Interface·Program·Package·Table·Structure·SRVD·DDLX), DCL은
  도달불가 죽은코드로 제외. 회귀 테스트 2본 신설 + **역-검증 두 편집/스레딩 각각
  실측**(원복 시 FAIL). jest **599/0**(+19), build clean, 재번들 4.13.12 +
  verify-engine OK + capability **155 no-op**. **KR-DEV(KO) 라이브 red→green**:
  11-⑪ = 나쁜 DDL 구 번들 `success:true`(거짓 성공) → 신 번들 정직 에러+차단,
  good DDL 통과. 11-⑫ = KO 페이로드 create-수락 확인(class·table). 설명 readback은
  도구 한계(SearchObject 클래스 short text 미반환, CL_SALV_TABLE 대조 확인)로 불가
  — 페이로드 언어 역-검증(unit)+§5 라이브 메커니즘 재사용으로 근거. $TMP 4종 전량
  삭제 검증(Z*SAH412* 무결과)·고아 0. **새-컨텍스트 리뷰 PASS**(BLOCKER/MAJOR 0;
  MINOR = CheckTableLow 구조화출력 parity, 의도된 4.13.11 선례). 문서: CHANGELOG
  4.13.12 + UPSTREAM §5·§7 갱신 + Known-remaining #2 제거 + HANDOFF §6·헤더. 게이트:
  coverage/links/verify-engine/smoke155 green, doctor는 agy 드리프트 1건(1.0.16→
  1.1.1, 환경·무관·R-001)

- 2026-07-13 | **② 지식 문서 부트스트랩 완료 (D-020, 메인=오케스트레이션·작업=opus
  서브에이전트 위임)** — harness-docs Mode A 계약을 lock 커밋(8f7f13b) 절차문에서
  직접 소비(플러그인 이 머신 미설치). 산출: docs/PRD.md(55줄/3.6KB)·
  docs/ARCHITECTURE.md(87줄/6.1KB — 파일 지도는 실측 트리 기반, 미존재 항목은 "예정"
  표기) 신설 + D-020 append(D-012의 PRD·ARCHITECTURE 기각분 갱신, **ADR.md 미신설
  유지**). 주입 합계 33.5KB < 48KB, 중괄호 플레이스홀더 0. **새-컨텍스트 리뷰
  PASS**(opus, read-only — 엔진 주입 glob·48/64KB 수치까지 execute.py 실측 대조,
  HANDOFF/DESIGN 68/40KB 실측). 리뷰 발견 MINOR 2 수리 반영(게이트 블록→포인터,
  D-020 문구 3건 정정 후 append). 워커가 지시문 오류도 실측 정정(§8 "8규칙"→7개).
  HANDOFF §7·헤더 갱신

- 2026-07-13 | **③ Phase 3 선결 설계 완료 (D-021, 백로그 5-11 해소 — 메인=오케스트레이션,
  분석·검증·스펙=opus 서브에이전트 3왕복)** — harness-design 계약의 스코프드 적용.
  ① 분석: 엔진 실측(lock 8f7f13b)이 결정적 사실 확정 — 기존 `_run_review`는 완료
  마킹 *후* 실행+verdict 미소비(비게이트), 체인을 멈추는 유일한 것 = verify exit
  code; 나머지 선결 2건(0b 마커·§14-2 drift)은 기완료 판정. ② 독립 검증: 분석의
  (b) 원안(다음-스텝-verify)에서 **verdict 위조 창 BLOCKER 적중**(일반 step 세션
  full-write+원복 없음). ③ 정정 재검증: (b′) 자기-verify 구성 + 필수 3조항(등식형
  변경검사·검사 로직 인라인/sha256 핀·reviewed_head 바인딩)이면 조건부 성립 —
  엔진 승격(A)과 1:1 비교 후 A는 이연 판정(D-018 논리). **사용자 택1 = (b′) 강화판**
  (12살 설명 재제시 후 결정). 기록: 스펙 196줄(harness-design §5 계약 11섹션) +
  DESIGN v2.2(§8.3·§13, 선결 3건 전부 해소) + D-021 + HANDOFF §5-11 종결.
  에스코트 조항: 씨앗 결함 라이브 차단 1회 실증까지 사람 셰퍼딩

- 2026-07-13 | **Phase 3 A-청크 완료 — 무인 리뷰 게이트 구현 (메인=오케스트레이션,
  작업=opus×4+sonnet×2)** — 산출물: 검사기 `scripts/check-review-verdict.ps1`(필수
  3조항 구현, sha256 7B4F211F…FA0223) + 재현 테스트 `scripts/test-check-review-
  verdict.ps1`(13케이스 전건 통과) + `docs/reference/templates/`(review-step.md —
  트랙 B 12항목 이식+시맨틱 §13~15 신규 · review-verdict.schema.json ·
  review-gate-plan-conventions.md) + `adapters/vsp/SAFETY-PROFILES.md`(DESIGN §8.4
  4건 커버). 실측: AC1~4 로컬 테스트 **13/13** + **AC3 엔진 통합 재현 성립**
  (scratchpad 클론 실엔진: FAIL verdict→3회 재시도 소진→error 종료→write 스텝
  미도달, attempt_secs [26,48,42]) + **Assumption #1 일치**(PASS 경로 초과 dirty 0,
  제외 집합 개정 불요, 리뷰 스텝 verify 시점 attempt_secs [23]). 새-컨텍스트 리뷰
  (opus, read-only) **PASS — MAJOR 0, MINOR 2**: F1(실패 phase replan-proposal.md
  잔존이 다음 phase 게이트를 오탐시키는 경로 미문서화)은
  review-gate-plan-conventions.md §7 관례 명문화로 수리(제외 집합 확대는 타
  phase 경로 주입 표면이라 기각) / F2(검사기 reviewed_head 대소문자 관대, 스키마는
  lowercase)는 수용 편차로 기록(검사기 바이트 변경 시 "동일 바이트 검사기×실 엔진"
  증거 사슬 역사화 비용 > 정합 이득). GOAL 전 기준 [x] 충족

- 2026-07-13 | **Phase 3 B-청크 완료 — 커넥티드 실증(AC5 라이브 차단 + §13 완료
  기준 ①②③ 전부 실측)** — B-1 vsp 주 머신 빌드: lock 커밋 0b03ef2 재현 빌드,
  sha256 바이트 불일치(+3,072B, Go 경로 임베딩 아티팩트 판정)·기능 일치(--version
  정확 일치+오프라인 계약 스모크) → 사용자 결정: 수용 + lock에
  `binary_main_machine` 병기(164eb52). B-2 SAP: IDEA-JNC 프로파일(= IDES-DEV와
  동일 시스템의 이 머신 프로파일명 — S4H/100, ABAP 756, DEV tier. 이 머신 홈
  ~\.sah에는 IDEA-JNC·KR-DEV만 존재, IDES-DEV 명칭 없음). 주 머신 엔진 훅 설치
  (install_engine.py 병합, 트랙 B MCP 훅 3개 보존, ENFORCEMENT_ALIVE_OK 실측,
  경로 정정 43ccac5·aabcf1b) — **이 머신 트랙 A 무인 실행 최초 가동**(기존 실적은
  보조 머신). phase 3a-carrflt-seed(씨앗 INNER JOIN 결함 ZSAH3A_CARRFLT, opus):
  impl completed(attempts 2) → 리뷰 3회(209/257/306s) **전부 FAIL — B2/MAJOR로
  INNER JOIN을 file:line까지 적중**(리뷰어는 씨앗 메타 모름, 독립 대조) →
  REVIEW_GATE_FAIL exit 1 ×3 → error 종료, escort-write-deploy 미시작. 증거는
  feat-3a-carrflt-seed 브랜치에 봉인(2f5d2a2, main 미병합 — INNER 소스·L-002·
  replan-proposal 전부 branch만). phase 3b-carrflt-gated(정상 경로 LEFT OUTER,
  ZSAH3_CARRFLT+osql 단위테스트): impl 1회(136s)·리뷰 1회(156s) **PASS(findings
  0)** → completed → main ff 병합(c7a2d51). 에스코트 체인(사람 셰퍼딩, IDEA-JNC —
  deploy는 권한 계층 차단으로 사용자가 직접 실행): E1 deploy+activate
  **VERIFY_PASS** → E2 drift clean(유일 차이 = EOF 개행 정규화, 내용 동일) → E3
  ATC INFO 1건만(시간대 SLIN 캐시, phase 2 선례)·VERIFY_PASS → E4 unit **1
  passed/0 failed**(zero_flight_carrier_present — ZZ 0건 행 생존 기계 증명).
  drift SE80 검출: 사용자가 SE80에서 주석 1줄 추가+활성화(D1) → vsp source read
  재대조가 `+* drift test by SE80` 정확 검출(D2), 복원은 레포 정본 재배포(D3,
  메인 세션 확인). **DESIGN §13 완료 기준 ①②③ 전부 실측 충족** →
  D-021 에스코트 해제 조건(§13 조항) 성립. 단 SAFETY-PROFILES 무인 전환 3조건 중
  2번째(§⑥ 차단 검증 V1~V5+RV1~RV4 실측)는 **미수행 — 정직하게 미완 기록**.
  상세 원로그 = `phases/3b-carrflt-gated/scoring-raw.md`

- 2026-07-13 | **SAFETY-PROFILES §⑥ 차단 검증 실측 완료 — 에스코트 해제 3조건 전부
  충족** — V1(offline deploy, `Get-ChildItem Env:SAP_*` 0건 확인 후 실행): exit 1
  `ENV_FAIL: no SAP connectivity` 일치. V2(offline atc): 동일 ENV_FAIL 일치.
  V3(`vsp lint --file`, 무자격증명): exit 0 `No issues found` — offline lint는
  자격증명 없이 동작. V4(IDEA-JNC 자격증명 주입, read만): `source read`
  ZSAH1_WORKDAYS exit 0(전문 반환)·`health --package $TMP` exit 0(WARN은 기존
  객체 ATC 지적, 명령 자체 정상)·`verify-sap.ps1 -- atc` exit 0 VERIFY_PASS(INFO
  1). V5(정적 감사, 전 5 phase index.json): impl 5스텝 전부 `lint --file`,
  review-gate 2스텝(3a/3b) 전부 로컬 검사기 호출뿐(vsp 인자 0) — `deploy`
  유일 1건은 3a step2 `escort-write-deploy`(gated-write 전용 명명 스텝, 미도달)뿐,
  `copy`/`query`/`execute`/`source write` 전 phase 0건. RV1(3b 리뷰 세션
  산출물 전수): step1-output.json 세션 최종응답이 "no vsp write; no src/
  edits" 명시 + review.md도 diff/소스 정독뿐 — SAP 접촉 0건, 3a·3b 무인 실행은
  offline 스코핑(엔진 phase 셸에 SAP_* 미주입, 에스코트 체인은 별도 사람 주도
  셸)이라 접촉이 구조적으로 0. RV2(frozen verify 감사): check-review-verdict.ps1
  전문 grep(`vsp.exe|vsp-env|SAP_|deploy|copy|query|execute`) 매치 1건뿐(git
  rename 감지 주석, SAP copy와 무관) — SAP verb 0건. RV3: test-check-review-
  verdict.ps1 재실행 **13/13 PASS**(AC1(b) verdict+src 동시 dirty→exit 1 포함).
  RV4(음성 대조, 신규 배포 없이 기실측 인용): scoring-raw.md E1(IDEA-JNC 자격증명
  주입 셸에서 `verify-sap.ps1 -- deploy … '$TMP'` → VERIFY_PASS 성공)·D3(동일
  자격증명 상태 재배포 성공) 인용 → 리뷰 스텝이 같은 gated phase 승계 env를
  공유하므로 실제 호출했다면 동등 성공했을 것 = SAP-write 차단이 §④(자격증명
  부재)로 성립하지 않고 관례+package allowlist+에스코트 참관의 합임을 확정
  기록(갭은 없애지 않고 정직 문서화, §⑧ 알려진 한계로 존속). **결론**: DESIGN §13
  완료 기준 ①②③(2026-07-13 오전 B-청크 실증) + 본 §⑥ V1~V5/RV1~RV4 = 에스코트
  해제 3조건 전부 실측 충족 → SAFETY-PROFILES §⑦ "무인 전환 가능(2026-07-13
  실측 완료)" 명기. 무인 전환 실행 여부(RV4 갭 감수 vs 리뷰/write phase 분리
  선행)는 사용자 판단으로 남김(발명 금지). 문서 갱신: SAFETY-PROFILES.md §①·⑥·⑦.

- 2026-07-13 | **Phase 4 착수 — FI 팩 오프라인 부트스트랩 완료 (메인=오케스트레이션,
  설계 opus·작성 sonnet·리뷰 opus read-only)** — 설계 발견: FI/CO 지식은 트랙 B가
  이미 interactive/core/knowledge/modules/FI(6파일)+페르소나로 이식 완료 → Phase 4는
  "이식"이 아니라 "접착+증류". 사용자 확정 3건: ① thin+pointer 최소 3파일(복사 0,
  링크만 — 챕터 분리 트리거를 README·DESIGN §12 양쪽에 명시) ② 규칙 승격=씨앗 결함
  주입 ③ 파일럿=ZR_FI_GL_OPEN(GL 미결항목, $TMP). 산출: packs/modules/README.md
  (이중 구조 규약·무인 주입 경계·분리 트리거·성장 방향)·fi/CONSULTANT.md(지식
  포인터 7+결정훅 4: ACDOCA vs BSEG·BAPI 전기·GGB0 우선·row-data 경계)·
  fi/RULES.seed.md(FI-001~005, S-009/010/011/013 재작성 0 — 인용만)·DESIGN v2.3
  (§12 구현 노트, 수술적 — 타 섹션 diff 0). 워커가 초안 출처 5건 실측 교정(무근거
  필드명 삭제·무관 R-003 참조 제거 등). 새-컨텍스트 리뷰(opus) **PASS**(MAJOR 0,
  MINOR 3 — FI-002 "호환 뷰/빈 값" 문구를 원천 정확도로 정밀화 수리, FI-002↔S-010·
  FI-004↔S-007 인접은 중복 아님 판정·관찰). 게이트: links(packs 8링크 0깨짐,
  interactive 588 green)·coverage·verify-engine(4.13.12)·smoke155 green, doctor는
  기존 agy 드리프트 1건뿐(1.0.16→1.1.1, 환경성·이번 작업 무관)

- 2026-07-13 | **Phase 4 커넥티드 준비 완료 (메인=오케스트레이션, 답사 sonnet·계획
  opus)** — ① 연결 확인: `vsp system info` S4H/100/ABAP 756(IDEA-JNC, read-only).
  ② CONSULT 답사(sonnet 위임): FI 팩 경유 로드(CONSULTANT.md→지식→페르소나) →
  read-only 실측(ZSAH4* 충돌 0 · ACDOCA/BSEG/BKPF/T001 실재 · I_JournalEntryItem
  DDL로 반제 시맨틱 구조 확인, row-data 0건) → **팩 전/후 결정 델타 5건 기록**
  (`phases/4-glopen-recon/recon-raw.md` §2 — DESIGN §13 완료 기준 ① 증거).
  ③ 메인이 ACDOCA 원시 컬럼명 확정(I_GLAccountLineItemRawData DDL — rbukrs/gjahr/
  racct/augbl/hsl/xopvw) + **RLDNR 원장 키 신규 발견**(§5 — 필터 없으면 복수 원장
  중복 합산, 4b `p_rldnr DEFAULT '0L'` 반영). ④ 4a/4b phase 계획(opus 위임):
  3a/3b 미러 + 리뷰 체크리스트 **§16 신설**(S/4 금액 소스=FI-002, B2/MAJOR) +
  계획 린트 전건(검사기 sha256 핀 실측 일치 · 추출 코드 lint exit 0 · 경로 실재 ·
  기존 phase 무수정). ⑤ 메인 검수가 4a PLANNING(리뷰어 가시 정답지)의 **씨앗 누설
  3곳 적발·정정**(3a 중립 수위로 — 리뷰어 블라인드 불변식 복구). 커밋 6ff695e.
  사용자 결정: 배포=에스코트 · 객체명 ZSAH4 계열 · "배포는 완료 기준에 비필수"
  인지 하 진행

## Next

- **다음 = D-025 후속 재기준 집행**: 설계서 §11의 연쇄 문서/Policy/legacy 변경 → clean
  detached `6de63ba` staging·주 머신 설치·복제본 migration → §12 G1~G14·파일럿 A/B·
  P4 T1~T5 검증 → lock promote/reject. 현재 O1은 attended-only이며 unattended는
  sealed, reviewer + 모든 attended child의 `sap_mutation_boundary`는 unverified다.
  이 작업에서는 구현·migration 미착수.
- **✅ Phase 4(Domain Packs) 완료 (2026-07-14)**: DESIGN §13 완료 기준 ①(팩 CONSULT
  실사용 = recon 팩 전/후 결정 델타 5건) + ②(LESSONS 유래 규칙 승격 = 4a 씨앗→L-002→
  R-007) **둘 다 충족**. 에스코트 보강까지 완료 — 4a 씨앗(BSEG 결함) 리뷰 3회 FAIL
  차단(feat-4a-glopen-seed 봉인 646c691, main 미병합) + 4b 정상(ACDOCA·rldnr='0L')
  리뷰 PASS→main 병합(55b4ea3)→에스코트 E1~E4 전부 통과(deploy VERIFY_PASS·drift
  clean[정규화 후 내용 동일]·ATC INFO 2건만·unit 1 passed). 원로그 =
  phases/4b-glopen-gated/scoring-raw.md.
- **✅ 재기준 설계 확정(D-023~D-025, 2026-07-15)**: Direct 기본 + Guided 명시
  승격 + Engine attended 특수, candidate=`6de63ba`(v0.19.3 blob; dirty 0.19.4 제외).
  07-14 초안은 v2 확정판이 대체하며 v0.19.2 분석 재실행 금지는 유지.
- 소형 잔여 후보(재기준과 무관, 존속): **백로그 5-13 CI ✅ 완료**(2-job green, run
  ddd3878) · 엔진 11-⑩ · doctor 핀 드리프트(codex 0.144.3·agy 1.1.1) · vsp source
  read lock 편입 · 5-5 fetch 참조.

## 보조 머신 줄기 기록 (2026-07-13~19, 분기 기간)

<!-- 분기 통합 2026-07-19: 아래는 보조 머신(로컬) 줄기가 2026-07-15 동결 이후에도 singleton STATE에 계속 append 한 기록이다. 위 ## Done / ## Next(원격 주 머신 줄기)이 구조 정본이며, 두 줄기 기록의 무손실 병존을 위해 로컬 고유 기록을 이 절에 편입한다. 원격·로컬이 각자 독립 수행한 엔진 4.13.12(11-⑪·⑫)는 양 줄기에 중복으로 남되 무손실 원칙상 병존시킨다. 이후 작업은 원격 규약(run-scoped .harness/runs/<run-id>/)을 따른다. -->

### Done (보조 머신 줄기)

- 2026-07-17 | 감사 보완 2건 완료 (워밍업, 2026-07-17 객관 감사 등재분) —
  ① Codex 0.144.3 재검증 스모크(sonnet 위임): installed+enabled + 캐시
  core/server 전체 패키징 실측, 스모크 후 marketplace/plugin 완전 제거로
  평시 복원(이 머신 평시 = disabled가 아니라 **완전 미설치** 실측) →
  compatibility.json 0.144.3·verified 2026-07-17 갱신 → doctor **5 OK/0
  FAIL(exit 0)**. ② CLAUDE.md 헤드라인 지식 217→175·절차 15→16(실측 정합:
  knowledge .md 175·procedures .md 16). 게이트 5종 green, 독립 리뷰
  (sonnet, read-only) PASS — 기준 전 항목 충족·스코프 이탈 0

- 2026-07-17 | 엔진 11-⑪·⑫ Wave 완료 (4.13.12, opus 위임 + 세션 재시작 걸쳐
  2단계 진행) — ① 11-⑪ Table check-with-source **2계층**(vendored ddlCode 전달
  + 핸들러 PUT 전 차단 — table check는 non-throwing 계약이라 선례 '1줄' 추정
  부정확 발견) ② 11-⑫ Create 로그온 언어 도달 가능 8종 확장(DCL은 죽은 코드
  판정·미수정). jest **599/0(+19)**·두 수리 모두 두 계층 역-검증 실측, 라이브
  red→green(11-⑪ 명확 재현·해소, 11-⑫는 CS 박스 EN 관용으로 델타 관측 불가 —
  jest+4.13.10 선례가 정본 증거), $TMP 생성 8·삭제 8·고아 잠금 0, 재번들
  OK@4.13.12·155 유지, CHANGELOG·UPSTREAM-FIX-HANDOFF §5·§10·§11 갱신.
  **새-컨텍스트 리뷰(opus) PASS — BLOCKER/MAJOR 0**, MINOR 4(전부 문서 등재로
  수용). 신규 관찰 = ADT /checkruns 세션 캐시 stale 재반환(Known-remaining #8).
  중간 인계 파일(docs/wave-4.13.12-report.md)은 마감 후 삭제 — 내용은
  CHANGELOG·UPSTREAM-FIX-HANDOFF·HANDOFF·이 항목으로 흡수

- 2026-07-18 | **§5-4 보완 세션 완료** (오케스트레이션 — 실행 전량 서브에이전트
  위임: Go 수리·lock 재검증·MINOR 5건·자격증명 구조·Part B 재실증 각 opus,
  Codex 스모크 sonnet, 정찰 Explore) — ① vsp-custom 5a8bedb: CLI write 8종
  진입점 게이트(SAP_READ_ONLY·SAP_TIER≠dev dial 이전 거부, go test 16케이스,
  오프라인 프로브 4종) ② lock v2.38.1-94 재검증(계약 10종 라이브 전부 통과·
  JNC 델타 5항목·$TMP 정리·고아 잠금 0) ③ 리뷰 게이트 MINOR 5건 실코드
  (42→46 — ④ 캡슐 basename이 실제 배포 결함이었음을 vsp 소스로 실측)
  ④ 자격증명 미공급 구조(vsp-env read-only 기본+-Write opt-in·verify-sap
  자체 조달·VERIFY-PATTERNS §④ 관례 — execute.py 스크럽은 엔진 lock·B1
  충돌로 기각) ⑤ Part B 재실증(AC-10) → step 5 completed(반증 이력 보존) +
  스펙 §3·§5-4·§7 정합화 ⑥ 새-컨텍스트 리뷰 PASS(BLOCKER/MAJOR 0) + 게이트
  5종 green(Codex 0.144.5 재검증 동반). 부수: tdd-guard.py 로컬 수리
  (tests/ 인식+레포 밖 제외 — 훅 ask의 bypass 관통 승인 폭주 해소, 무추적
  이 머신 한정). 무인 write 금지(5-11) 계속 유효(개방은 Phase 3 완주 후)

- 2026-07-18 | **5-13 층1 완료** (같은 오케스트레이션 세션, 감사·수리·리뷰
  전량 위임) — 대조 감사 12항목(신규 6·부분 2·설명 1·겹침 3, 사전 추정 정정
  2) → 엔진 **4.13.13**(SQL self-closing NULL 셀 위치보존+메타 3필드+400
  재시도 — T000 라이브 red→green, GetTableContents 공유 파서 동반 치유) +
  **4.13.14**(CreateStructure fields→DDL 실생성·거짓 성공 제거 — $TMP 라이브
  red→green + FM check_inactive 경고 + 설명 3건). 11-② 병리 미재현 기각,
  lock-window는 engine stateful-핀 유지 결정. jest 599→643/5(역-검증 전
  항목), 재번들 155 유지·번들 byte 동일, 새-컨텍스트 리뷰 PASS(BLOCKER/
  MAJOR 0). 감사 정본 = docs/reference/audits/2026-07-18-5-13-layer1-audit.md.
  후속 권고: 동결 sc4sap-custom 전일 드리프트 1파일 정리(사용자 판단)

- 2026-07-18 | **5-13 층2 완료** (오케스트레이션 세션 — 감사·이식·리뷰 전량
  위임: 감사 opus·이식 sonnet·리뷰 opus) — **선결 판정**: 정본 = 원본 신판
  (동결 sc4sap HEAD common/*.md — 07-17 f7257c0+ffb422b가 팩 층2를 이미
  접어 넣어 팩을 상회, 8항목 커버리지 누락 0, L1 관례 실측 = 본문 verbatim
  +재배치 링크만 재경로). **이식** = conventions 수정 3(clean-code
  null-vs-zero·field-typing DD03L step0+필드명≠의미·function-module RFC
  타입/DEC 오버플로/FUGR 단일 컴파일+UXX) + 신규 2(abapgit-roundtrip-rule·
  source-repair-protocol) 전부 verbatim(신규 링크가 conventions 내부
  형제라 재경로 0) + **배선 4**(sap-executor 표+2행·sap-debugger +1줄·
  create-program FUGR 레시피·review-checklist +2항 — 3항째 활성화-증거는
  층1 #6 기반영+source-repair-protocol 내장으로 의도 제외, 리뷰어 타당
  판정) + 매니페스트 규약 18→20종(catch-all 기포섭)·CLAUDE.md 지식
  175→177(실측). 게이트 5종 green(smoke 155·links 599/0·doctor 5 OK,
  엔진 무변경). **새-컨텍스트 리뷰 PASS(BLOCKER/MAJOR 0·INFO 3)** —
  verbatim byte 대조·8항목 좌표 재확증·배선 f7257c0 대조·동결 레포
  무손상 실측. 감사 정본 =
  docs/reference/audits/2026-07-18-5-13-layer2-audit.md. 부수: 첫 리뷰어
  기동이 오작동 빈 응답(도구 0회) → 새 컨텍스트 재기동으로 정상 수행

- 2026-07-18 | **5-13 층3 감사 완료·반영 대기** (같은 세션, 토큰 소진으로
  실행 전 중단) — 감사(opus 위임) 판정: 신규 3(②결함목록=표본·⑦미검증
  표시 회수·⑧오라클 의심)·보강 3(①게이트 미검사 산출물·③세로 관통·
  ④liveness)·기반영 2(⑤독립 검증=D-019 등·⑥메모리 루프=PROTOCOL — 중복
  주입 안 함). 반영 계획(구체 문안 포함) 정본 =
  docs/reference/audits/2026-07-18-5-13-layer3-audit.md. 요지: RULES.seed
  S-026·S-027(+헤더 원천 2→3곳, 표제 4종→6종 동반 수리) / VERIFY-PATTERNS
  §⑤ 안티패턴 2불릿 / 계획 관례 = docs/ARCHITECTURE.md 신설 절 4건 /
  리뷰 게이트 스펙 §6 additive AC-14·AC-15(승인 결정 불변). DESIGN.md
  갱신 불요·interactive 게이트/CLAUDE.md 수치 비영향 판정. GOAL.md는
  층3 기준 세팅 완료(미체크 상태로 재개)

- 2026-07-19 | **5-13 층3 완료 = 5-13 전체 종결** (오케스트레이션 세션 —
  이식 sonnet·리뷰 opus 위임) — 감사 문서(2026-07-18-5-13-layer3-audit.md)
  파일별 계획 verbatim 반영: RULES.seed(원천 2→3곳 + S-026·S-027 [verify]
  + 표제 4종→6종 동반 수리) / VERIFY-PATTERNS §⑤ 안티패턴 2불릿(미검사
  유형 green 오인 금지·오라클 불신) / ARCHITECTURE 신설 절 "방법론 관례"
  4건(세로 관통·liveness·결함 목록=표본·미검증 회수) / 리뷰 게이트 스펙
  §6 AC-14·15 additive(기존 AC 1~13·§5 무변경, INSUFFICIENT_CONTEXT 기존
  용례 정합 — D-021 불침해). 게이트 5종 green(coverage exit 2 = .omc 매칭
  0 정보성 경고·links 599/0·verify-engine 4.13.14·smoke 155·doctor 5 OK).
  새-컨텍스트 독립 리뷰 PASS(BLOCKER/MAJOR/MINOR 0, INFO 3 — verbatim
  3블록·팩 8항목 좌표 전량 실측·§6 additive·외부 레포 무수정 재확증).
  .harness/RULES.md·LESSONS.md 무수정 준수. E2E 실호출 편입은 후속 후보
  (감사 §6-리스크 2)

- 2026-07-19 | **잔여 소진 스프린트 착수** (사용자 지시 "5-12 제외 몽땅" —
  오케스트레이션 세션·실행 전량 모델 지정 위임, 기준=GOAL.md) — W0 전수
  스윕 정본(docs/reference/audits/2026-07-19-remaining-backlog-sweep.md,
  실행 A24·유보 B4·대기 C12) · W1a `adapters/vsp/SAFETY-PROFILES.md` 신설
  (§8.4 실행 가능 수준 — 모드별 allowlist·기계/절차 등급 구분·오프라인
  프로브 3종 재실측) · W4a FI 첫 팩(packs/modules/fi 5파일+README —
  포인터+얇은 발췌 구조, FI-001~005 소스 재검증 저술) · Phase 3 런 계획
  동결(phases/4-gated-deploy 7스텝 + .harness/runs/20260719-4-gated-deploy
  계약·매니페스트, 스펙은 red 워커가 아닌 계획 시점 동결로 승격[게이트
  무결성], config.json prompt v1.1 서버증거 대조 의무[AC-15 (c)안 — Bash
  개방 기각: 스파이크가 부모 bypass env 상속으로 오염 판별], deploy-shim
  신설[R1 공백 split 해소]) · CONSULT 실사용 기록(FI-004→스펙 요구 2,
  KR·SKAT→요구 3 — PLANNING §0, Phase 4 실사용 기준 충족분). SAP
  프리플라이트 VERIFY_PASS. 병행: 엔진 W3a(low 무동작 파라미터 4종 제거 +
  11-⑩ Delete 로컬 4종 Option A) 위임 진행 중

- 2026-07-19 | **잔여 소진 스프린트 W0~W4 완주 + 잔챙이** (오케스트레이션 —
  실행 전량 위임) — W2 Phase 3 완주·main 병합(eca4d717, 검토 게이트 실증
  AC-8·14·15·drift, run-summary completed·verify 0, 독립 리뷰 PASS, 런 중
  계획 결함 2건 자가 수정) · W3 엔진 4.13.15 3수리+조사(jest 655/5·155·리뷰
  PASS, b438abdf) · W4 FI 팩+R-007 승격(d0fd1a28) · W1 SAFETY-PROFILES+계획
  (e0fedd0d) · 잔챙이 A-17·A-23(53f9407c). 소품 정직 판정: A-12 SE37 수동
  지점 중단·A-18 R-002 하 정적확인·A-21 실측 반전(offline lint 4종). **정지
  사유 = Fable 5→Opus 자동 전환(사용자 지시 일시 정지)** — 원인·재발방지는
  HANDOFF 헤더 §모델-전환. 상세 = HANDOFF 「▶▶ 잔여 소진 스프린트」 블록

- 2026-07-19 | **잔여 소진 스프린트 W5 마감 = 스프린트 종결** (오케스트레이션 —
  문서 동기화 sonnet·A-21 opus·A-14 sonnet·수리 sonnet·종합 리뷰 opus 위임) —
  ① 종합 독립 리뷰(211fabef..HEAD): 1차 FAIL(MAJOR 1 = gate-e2e prompt_version
  스테일 red 46/45/1 실측·MINOR 3) → 수리(ac5b8f31: 테스트 1.1 정렬 46/46
  green·agy 1.1.4 재-핀 doctor 5 OK·DESIGN §14 item4/8 정합) → **재판정
  PASS(0/0/0)**. ② 문서 동기화(6a4102be): PRD Phase 3·4 완료 표기(상시 개방
  결정 대기 명시)·ADR-002 Addendum·DESIGN §13 drift 채널+D-022 append.
  ③ A-21 소스 재검증 확증 → RULES.seed·CHECKLIST 4/2 재프레이밍(VERIFY-
  PATTERNS §②-1 무수정). ④ A-14 excludeTools 미작동 실측(3중 근거) → AG
  README 권장 철회·재실측 트리거·compatibility 1.1.4 재-핀. ⑤ A-7 = KR#5
  문서화 유보 판정. 게이트 5종 최종 green. A 목록 24항 전량 소진(실행 12·
  부분 정직 1[A-20]·유보/이관 11). Phase 5 착수 가능 판정 기록. GOAL 전 기준
  충족. 부수: opus 위임 빈 응답 오작동 2회 — 재기동·재개로 해소(층2 선례 동형)

- 2026-07-19 | **push 분기 발견 + 두 줄기 전수 조사** — 사용자 지시 push 거부
  (non-fast-forward)로 주/보조 6일 분기 실측(공통 조상 8d09e571, 로컬 67·원격
  65커밋·공유 0). 사용자 정정("pull부터") → L-003→R-008 규칙화. 로컬 줄기
  `sprint-20260719` 가지 push(무손실 백업). 위임 조사 2건(원격 의미 조사 opus·
  충돌 지도 sonnet, 전 과정 read-only·트리 불변 실측): 실충돌 48파일 ·
  D-020~023 4중 충돌(원격은 로그를 docs/reference/로 이전, D-029까지 자체
  진행) · R-007/L-002 번호 충돌(내용은 별개 유효) · 엔진 4.13.12 병렬 중복
  (로컬 4.13.15 strict superset) · 리뷰 게이트+파일럿 이중 구현(캡슐 vs
  run-scoped) · 원격 재기준(v0.19 3축·unattended=sealed·v0.20 candidate
  staged·CI green 주장)이 로컬 D-023(무인 개방)과 방향 상충 — 같은 사용자가
  두 머신에서 반대 방향 승인 상태. 평가 정본 =
  docs/reference/audits/2026-07-19-branch-divergence-assessment.md

### Next (보조 머신 줄기, 분기 시점 계획)

- **다음 착수 = 분기 통합 세션 실행** (결정 5건 전부 확정 2026-07-19 — 새 세션
  권장). 실행 정본 = docs/reference/audits/2026-07-19-branch-divergence-
  assessment.md §5(결정)·§6(기계 작업)·§7(베이스): ⑴ 절충안(대화형 중심 틀 +
  무인은 관문 경유) ⑵ 리뷰 게이트 역할 분담(원격 run-scoped 골격 + 무인 write
  경로에 로컬 캡슐 편입) ⑶ 원격 로그 구조 + 로컬 4건 D-031~034 재번호 + ADR
  내용 reference 이동 ⑷ vsp 편입 확정(통합 직후 D-030) ⑸ 베이스 = 원격 main +
  로컬 우월 자산(엔진 4.13.15·vsp lock 94·FI 팩·지식 이식·캡슐 게이트) 이식.
  통합 완료 기준: 충돌 48파일 해소·게이트(신형 기준) green·독립 리뷰 PASS·main
  push. 5-12는 원격 S1~S4 채택으로 통합에서 해소 예정. 로컬 D-023 실사용은
  재기술 전 보류. 스프린트 잔여 결정 ②③④⑤⑦은 통합 뒤로. 동결 드리프트
  1파일은 사용자 판단.

## Attempts & dead ends

<!-- one line per attempt, appended: date | task | what was tried | outcome -->
- 2026-07-15 | 리뷰 수리 별도 새-컨텍스트 검토(read-only) | 작성자와 분리된 reviewer가 GOAL current repair 기준을 설계서/HANDOFF/STATE/diff 및 로컬 근거에 대조 | **overall PASS, BLOCKER/MAJOR/MINOR 잔여 0**; INFO=untracked review 원문은 Git만으로 pre-task byte baseline 재구성 불가, 이번 세션 write 0·반대 증거 없음
- 2026-07-15 | 리뷰 수리 자체 확인(self-check, 독립 검증 아님) | `git diff --check`, active stale 용어·trailing whitespace 검색, §10 JSON parse, HANDOFF diff/첫 separator, 금지 경로 diff, DECISIONS numstat 점검 | diff-check 오류 0(EOL 경고만), stale/후행공백 0, lock schema JSON OK(`v0.17.3`/`v0.19.3`, safety scope 포함), HANDOFF 첫 separator 146·지정 본문 1곳만 변경, 금지 경로 diff 0, DECISIONS 시작 상태와 같은 +61/-0; SAP/vsp 실행 0
- 2026-07-15 | 리뷰 MAJOR-A~E·MINOR-1/2/4·O-1 문서 수리 | 설계 §0/4/5/6/10/11/12/14/15, HANDOFF 지정 헤더+본문 1곳을 로컬 근거에 맞춰 편집 | reviewer 전용 경계를 모든 attended child로 확장, lock safety_state+v1 증거 보존, vsp transport 출력 미확인/G14+사람 fallback, LOCAL 삭제, DEV no-op 명시; SAP 호출 0
- 2026-07-15 | 새-컨텍스트 리뷰 지적 수리 착수 | 리뷰 정본·RULES/PROTOCOL·PRD·ARCHITECTURE와 기존 diff를 대조하고 수리 GOAL 기록 | MAJOR 6·MINOR 4를 모두 수리 대상으로 채택; SAP 무접촉, DECISIONS/금지 경로 무변경 조건으로 문서 편집 시작
- 2026-07-15 | 새-컨텍스트 독립 리뷰(Claude opus, read-only) | `docs/reference/designs/2026-07-15-fresh-review-of-rebase-v2.md`가 설계서·D-025·HANDOFF·GOAL/STATE를 새 컨텍스트에서 대조 | **PASS with fixes — MAJOR 6 · MINOR 4**; 종전 작성자 자체 확인의 “18/18 PASS”를 반증해 본 수리의 정본이 됨
- 2026-07-15 | 재기준 v2 확정판 작성자 자체 확인(self-check, 독립 검증 아님) | 작성자가 GOAL 18항을 설계서·D-025·HANDOFF와 diff/표면 증거에 대조 | 당시 **18/18 PASS로 잘못 명명·보고**; 새-컨텍스트 독립 리뷰가 MAJOR 6·MINOR 4를 발견해 판정 무효. GOAL 18번 체크 해제 및 기록 relabel
- 2026-07-15 | 재기준 v2 확정판 transport 표면 자체 확인(self-check) | v0.19.2 분석 재실행 없이 고정 vsp help·lock/COMMANDS, 트랙 B tool-catalog/handler/tier guard, install-sap-assets Step 0, 공식 abapGit package/transport 문서를 대조 | vsp `transport list/get`은 help 존재만 확인, 실제 출력 형상 미확인·command contract 미등재; `deploy --transport`만 등재. MCP=Create/List/Get/Release+object별 transport field 표면, release endpoint 지원 미확인, abapGit 현장 흐름 미실측; 실제 SAP 호출/write/release/import 0건
- 2026-07-15 | 재기준 v2 근거·설계 | 필수 정본 전부 정독 + 상류 `929685a..6de63ba` diff·HEAD blob/working-tree 분리 + 현 manifest hash 대조 | candidate=6de63ba 결정(blob v0.19.3; 보이는 v0.19.4는 20파일 미커밋이라 제외), F1~F7/N1~N6 재사용·N7/N8/retired 표면 갱신, 신규 설계서 작성; 독립 검증 14/14 PASS
- 2026-07-15 | 트랙 A 재기준 v2 설계 착수 | 기본 샌드박스에서 git/PowerShell 읽기 실행 | Windows CreateProcessAsUserW 1312로 2회 실패, 승인된 read-only 셸로 우회; 파일 변경 전 git 상태는 기존 미추적 `2026-07-15-codex-review-of-rebase-draft.md` 1건
- 2026-07-14 | CI 게이트 검증 | 클린 클론(autocrlf=false)에서 5게이트 exit 0 확인 후 CI에 5종 투입 | 첫 push에서 check-migration-coverage만 FAIL — 이 게이트는 절대 외부경로(SC4SAP_SRC=D:/.../sc4sap-custom)를 읽어 클론 위치와 무관하게 로컬 레포 참조(사각지대). 러너엔 그 경로 부재→크래시. 교훈: 외부 절대경로 읽는 스크립트는 클린-클론으로 CI 적합성 검증 불가 → 실제 러너가 유일한 판정. check-migration-coverage·doctor는 CI 제외(로컬 전용)
- 2026-07-14 | 에스코트 E1 | PS 세션 내에서 `powershell -File scripts/verify-sap.ps1 -- deploy ...`(3b 런북 형태) | 실패 — PositionalParameterNotFound(부모 PS가 `--`/자식 -File 인자 오분해). PS 세션 내에서는 `& .\scripts\verify-sap.ps1 deploy ...`(호출 연산자·자격증명 세션 상속)로 정정
- 2026-07-14 | 에스코트 E2 drift | `vsp source read ... > file` 후 `git diff --no-index` | git이 "Binary files differ" 오인 — PS `>`가 UTF-16 LE로 기록(첫바이트 255,254). 인코딩·개행 정규화 후 -ceq 대조 → 내용 동일(clean). 대안: `Out-File -Encoding utf8`
- 2026-07-11 | quality-gate | git status --porcelain(기본)로 미추적 수집 | 실패 — 신규 디렉토리가 "src/" 한 줄로 접혀 내부 .abap 미탐 → -uall로 수리
- 2026-07-11 | verify 래퍼 | powershell -File + `--file` 대시 인자 전달 | 실패 — PS 5.1 -File 모드 바인딩 오류 → 대시 인자는 -Command "& '...' -- <args>" 형태로 (VERIFY-PATTERNS 주의 기록)
- 2026-07-11 | lint 실측 | 규칙 7종 스니펫별 exit code | E 4종(line_length>255·empty_statement·max_one_statement·preferred_compare_operator), W 3종(obsolete·colon·naming, len 120~255도 W) — §14-8 --strict 검토 근거
- 2026-07-11 | 실패 패턴 | 403을 ENV로 분류하던 휴리스틱 | 실측상 403의 유일 사례가 ENQUEUE 락 — LOCK 우선 검사로 교정
- 2026-07-11 | deploy | 문법 오류 소스 deploy | 오류에도 객체 생성됨(exit 1이지만 서버 잔존) — 배포 성공≠코드 정상, $TMP에 ZSAH0B_BROKEN 잔존
- 2026-07-13 | AC3 엔진 재현 | 클론 엔진을 스크래치패드에서 그대로 재현 실행 | 환경 전제 3가지 필요 실측 — core.longpaths 설정·.claude 훅은 gitignored라 install_engine.py --target 정식 설치 필요·quality-gate.json의 vsp.exe 부재 시 fail-closed 기동 거부 → 전제 충족 후 재현 성립
- 2026-07-13 | 리뷰 게이트 dirty 검사 | AC3 재현 중 실패 phase 다음 phase 실행 | 실패 phase의 replan-proposal.md가 wip 커밋 **후** 생성돼 untracked 잔존 → 다음 phase 게이트 오탐 FAIL(F1, 재시도 3회 소음) → review-gate-plan-conventions.md §7 관례로 수리
- 2026-07-13 | 검사기 verify 명령 구성 | verdict 경로를 verify 명령 문자열에 포함 | 세션의 verdict 기록이 verify-surface WARN으로 찍힘(엔진의 위임 타겟 변경 감지, execute.py:614-618) — 비차단 예상 소음으로 판정
- 2026-07-13 | 주 머신 첫 무인 기동 | 엔진 훅 미설치 상태로 스텝 실행 시도 | fail-closed 거부(quality-gate.json이 vsp.exe/훅 부재 감지 — 보조 머신만 설치돼 있었음) → install_engine.py 병합 설치로 해소(트랙 B MCP 훅 3개 보존)
- 2026-07-13 | 에스코트 셸 명령 구성 | `!` bash 프롬프트에서 PowerShell dot-source(`. .\scripts\vsp-env.ps1`)+대시 인자를 직접 실행 | 실패(bash 파서가 PS 전용 구문을 오분해) → 전체를 `powershell -NoProfile -Command "..."` 한 겹으로 감싸 해소

## 분기 통합 세션 상태 (2026-07-19)

- 2026-07-19 | 분기 통합 세션 진행 중 — 원격(주 머신) 구조를 정본으로 채택하고 로컬(보조 머신) 줄기 기록을 「보조 머신 줄기 기록」 절로 무손실 편입. `.harness/` 상태 5파일(RULES·LESSONS·STATE·GOAL·profile.json) 병합 해결 단계이며, 규칙·교훈은 문구 불변·번호만 조정해 병존(원격 R-007→R-009·L-002→L-004, 로컬 R-007[sql]·R-008[repo]·L-002[sql-completeness]·L-003[repo-sync] 보존). 이후 작업은 원격 run-scoped 규약을 따른다.
- 2026-07-19 | 분기 통합 세션 완주 — 병합 `7a37ee90`(충돌 48 전량 해소·부모 2 보존) + provenance 재바인딩 `cf110c36` + 종결 커밋. 게이트 전량 green(코어 6종+PS 3종 exit 0·smoke 155; snapshot 음성시험 러너는 이 머신 자식 프로세스 수거 비결정 블록 — 17개 시나리오 개별 유효 실측으로 보증, 기계 완주 정본=CI). 새-컨텍스트 독립 리뷰 PASS(BLOCKER/MAJOR/MINOR 0, INFO 3 — merge-tree로 무마커 중복 8핸들러 정리 확증). GOAL S1~S8 전항 충족. 다음 = vsp-custom 편입 실행(D-030). 이 항목이 singleton STATE의 마지막 기록 — 이후는 run-scoped.
