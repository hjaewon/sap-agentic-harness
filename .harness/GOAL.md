# Current Goal

<!-- Overwritten at the start of each task (Task Loop step 2).
     The verifier reads ONLY this file plus the produced artifact. -->

## Task

**백로그 5-13 층1 (2026-07-18, HANDOFF 다음 착수 ②)** — JNC 교훈 팩
(`D:\Claude for SAP\JNC-Dashboard\docs\reference\sap-adt-lessons-pack.md`,
라이브 S/4 2021 관통 확정본)을 `engine/`(4.13.12)과 **대조 감사 + 선별 이식**.
참조 구현 = sc4sap-custom 엔진 v4.14.0(동결 — 읽기만, R-004) ·
vsp-custom 0cb26cb+731b871(층1 기반영).

## Success criteria (기계 검증 가능)

- [x] **대조 감사표**: 팩 전 항목에 대해 겹침(기반영)/신규(미반영)/N-A 판정 +
      engine 좌표(파일:라인) + sc4sap v4.14.0 참조 위치. 겹침 추정 3건
      (lock-window=4.13.3~7 · 삭제 2xx 정직화=4.13.9 · check-with-source=
      4.13.11) 검증 포함.
- [x] **신규 판정분 선별 이식** — SQL self-closing NULL 셀 드롭·시프트
      (GetSqlQuery/GetTableContents, 실데이터 게이트 도구) **최우선**.
      수리별 jest 회귀 테스트 신설 + **역-검증**(수리 원복 시 신설 테스트
      FAIL) 실증. jest 전량 통과(기준선 599/0 유지·확장).
- [x] **라이브 red→green** — 가능 항목은 IDES 실측(구 번들 red → 신 번들
      green), 불가 항목은 사유 명시 + 대체 정본 증거(jest·참조 구현 대조).
      실데이터 조회는 무해 시스템 테이블(T000 등) 검증 목적 최소한.
- [x] **UPDATE-RUNBOOK 재번들** — verify-engine OK, capability 155 유지.
- [x] **문서 계약** — engine/CHANGELOG.md + UPSTREAM-FIX-HANDOFF §해당 절
      갱신(수리 시 동반 — 백로그 5-13 명시 요구).
- [x] **게이트 5종 green + 새-컨텍스트 독립 리뷰 PASS(BLOCKER/MAJOR 0)** +
      HANDOFF·STATE 기록 + 커밋.

## Verification method

1. jest·게이트 5종 exit code 실측 + 역-검증 로그.
2. 라이브 red→green 증거(구 vs 신 번들 실행 결과) 또는 불가 사유+대체 증거.
3. 감사표의 겹침 판정을 리뷰어가 engine 좌표로 재확인.
4. 독립 리뷰어(새 컨텍스트, read-only)가 diff를 이 GOAL 기준으로 항목별 판정.

## 제약 (전 기간 유효)

- 동결 레포 sc4sap-custom **읽기만**(R-004, private/는 읽기도 금지)
- 무인 SAP write 금지(5-11) · final-harness 플러그인 업데이트 금지(5-12)
- QA/PRD write 금지(R-003) · vsp MCP 서버 모드 금지(R-002) · 자격증명 기록
  금지(R-005) · $TMP 산출물 정리 + read-back 확인(R-006)
- 엔진 수리는 레포 내 `engine/`에서 (D-017) · 재번들은 UPDATE-RUNBOOK 절차로만
