# Phase 3b 에스코트 체인 원로그 (2026-07-13, IDEA-JNC S4H/100)

에스코트 조항 수행(DESIGN §13·SAFETY-PROFILES §⑦): Claude 실행 + 사용자 참관, deploy는
권한 계층 차단으로 사용자가 직접 실행. PLANNING.md §6 런북 그대로 수행. 목적: DESIGN.md
§13 Phase 3 완료 기준 ①(리뷰 게이트 PASS 객체가 SAP 전체 write 체인 통과) ②(SE80 수동
변경의 drift 검출)을 phase 2 채점(phases/2-duedate-reuse/scoring-raw.md) 선례 형식으로
실증한다. 완료 기준 ③(리뷰 게이트의 씨앗 시맨틱 결함 차단)은 별도 브랜치
feat-3a-carrflt-seed(3a-carrflt-seed)에서 실증 — 본 로그 범위 밖(§4 요약만 병기).

## 0. 선결

- **P0** — `scripts/verify-sap.ps1`의 `$VSP` 경로를 주 머신 실제 경로
  (`D:\claude for SAP\vsp\vsp-custom\build\vsp.exe`, 0b03ef2 재현 빌드)로 정정.
- **P1** — `phases/3b-carrflt-gated/index.json` 두 스텝 모두 `completed`(step1 리뷰
  verdict PASS, `reviewed_head=d1706baa`) 확인.
- **P2** — 자격증명 로드: `. .\scripts\vsp-env.ps1 -ProfileName IDEA-JNC`
  (S4H/100, ABAP 756, DEV tier — write는 `$TMP`에만, R-003·package allowlist
  SAFETY-PROFILES §⑤).

## 1. 체인 (E) — deploy → activate → drift → ATC → unit

### E1 — deploy(+activate)

- 명령: `powershell -File scripts/verify-sap.ps1 -- deploy src/zsah3_carrflt.prog.abap '$TMP'`
- 결과: **VERIFY_PASS** — "Successfully created and activated PROG ...
  ZSAH3_CARRFLT" (deploy가 활성화를 겸함, COMMANDS §8과 일치).

### E2 — drift(clean, 완료 기준 ① 일부)

- `vsp source read PROG ZSAH3_CARRFLT`로 라이브 소스 재조회 → `git diff --no-index`로
  레포 소스(`src/zsah3_carrflt.prog.abap`)와 대조.
- 결과: 유일한 차이 = 파일 말미 개행(EOF newline) 서버 정규화 — 내용은 바이트
  단위로 동일. clean 판정(DESIGN §6 정규화 규칙과 일치, phase 0b 선례 재확인).

### E3 — ATC

- 명령: `powershell -File scripts/verify-sap.ps1 -- atc PROG ZSAH3_CARRFLT`
- 결과: **VERIFY_PASS**. findings = **INFO 1건만**(시간대 TTZCU/SLIN 캐시 환경성 —
  phase 2 CLAS/PROG 채점에서 나온 것과 동일 계열, 코드 결함 아님). Error 0건.

### E4 — unit (red/green, 완료 기준 ① 핵심)

- 명령: `powershell -File scripts/verify-sap.ps1 -- test PROG ZSAH3_CARRFLT`
- 결과: **Total: 1 passed, 0 failed**, `VERIFY_PASS`. `zero_flight_carrier_present`
  green — LEFT OUTER JOIN이 운항편 0건 항공사(ZZ)를 3행 결과에 살려 두는 것을
  서버 ABAP Unit이 기계로 증명(AA=2·LH=1·ZZ=0 픽스처, 픽스처는
  `cl_osql_test_environment` 결정론 double — 라이브 데이터 행수 무관).

→ **E1~E4 전부 통과 = DESIGN §13 완료 기준 ① 충족**: 리뷰 게이트 PASS 객체(3b
step1 verdict PASS, `findings: []`) 1건이 deploy→activate→drift→ATC→unit 전체
write 체인을 통과해 SAP에 존재.

## 2. drift SE80 검출 (D) — 완료 기준 ②

### D1 — SE80 수동 변경

- 사용자가 SE80/ADT(GUI)에서 `ZSAH3_CARRFLT`에 주석 1줄을 직접 추가 후 활성화.
  무인 경로로는 만들 수 없는 "SAP 쪽 직접 변경" 지점 — 사람 개입 필수.

### D2 — drift 재검출

- E2와 동일 대조(`vsp source read` → `git diff --no-index`) 재실행.
- 결과: **차이 있음(non-empty diff)** — 정확히 `+* drift test by SE80` 1줄이
  검출됨. 그 외 차이 0건(SE80이 추가한 정확히 그 줄만 포착, 오탐/누락 없음).

→ **D1~D2 통과 = DESIGN §13 완료 기준 ② 충족**: SE80 수동 변경을 drift check가
실제로 검출함을 1회 실증.

### D3 — 복원

- 레포 정본(`src/zsah3_carrflt.prog.abap`)을 E1과 동등한 절차로 재배포해 SAP
  상태를 레포와 재일치. 메인 세션이 확인(운영 노트).

## 3. 완료 기준 ③ (참조 — 별도 브랜치 실증, 본 로그 범위 밖)

phase `3a-carrflt-seed`(씨앗 INNER JOIN 결함, `ZSAH3A_CARRFLT`, opus 리뷰 모델)에서
실증: impl completed(attempts 2) → review-gate 3회 시도(attempt_secs
209/257/306s) **전부 verdict FAIL** — `reviewed_head=9bf0811`에서 독립 재도출한
리뷰가 `B2/MAJOR`로 "SELECT ... INNER JOIN sflight ...
(src/zsah3a_carrflt.prog.abap:21-22)"를 file:line까지 적중(리뷰어는 씨앗 메타를
모르는 상태의 독립 대조) → 검사기 `REVIEW_GATE_FAIL: verdict is not PASS (got
'FAIL')` exit 1 ×3 → 재시도 소진 → phase `error` 종료, `escort-write-deploy`
(step2) 미도달. 증거는 `feat-3a-carrflt-seed` 브랜치에 봉인(2f5d2a2 — INNER 소스·
LESSONS 항목·`replan-proposal.md` 전부 해당 브랜치에만 존재, main 미병합 —
결함 소스는 main·SAP 어디에도 도달하지 않음, PLANNING.md §7 관례).

## 4. 확정 결과 요약

1. **완료 기준 ①** — 리뷰 게이트 PASS 객체(ZSAH3_CARRFLT)가 에스코트 체인
   E1~E4를 전부 통과: deploy+activate VERIFY_PASS, drift clean, ATC INFO만,
   unit 1 passed/0 failed.
2. **완료 기준 ②** — SE80 수동 drift(D1)가 `vsp source read` 재대조(D2)로
   정확히 검출됨(`+* drift test by SE80` 1줄, 과탐/누락 0).
3. **완료 기준 ③** — 별도 브랜치(feat-3a-carrflt-seed)에서 리뷰 게이트가 씨앗
   INNER JOIN 결함을 3회 전부 FAIL로 차단, write 미도달까지 실증(§3 참조).
4. **에스코트 조항(D-021)** — 위 ③(AC5)이 DESIGN §13의 에스코트 해제 조건을
   충족. 단 SAFETY-PROFILES §⑦ "무인 전환 조건" 3건 중 2번째(§⑥ 차단 검증
   V1~V5+RV1~RV4 실측 통과)는 이번 세션 범위 밖 — **미수행으로 정직하게 기록**
   (무인 전환은 3건 전부 충족 후).
