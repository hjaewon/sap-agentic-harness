# Lessons

<!-- Append-only failure log (Memory Loop steps 1-3).
     Read when investigating a failure; not loaded by default.
     Entry format:

## L-NNN | YYYY-MM-DD | <area>
FAIL: what was attempted, what happened, exact error/symptom
CAUSE: root cause (verified: how)
RULE: -> R-NNN | not generalizable: why | unverified
-->

## L-001 | 2026-07-12 | vsp-clas-deploy
FAIL: Phase 2 connected 채점에서 CLAS ZCL_SAH2_WORKDAYS를 vsp deploy로 배포 — LOCK에서 modificationSupport="NoModification" 거부 + 시도마다 고아 ENQUEUE 잔존(SM12 수동 정리 반복). copy(ZIP·ZADT_VSP) 우회는 "1 success/EXIT=0" 보고하나 active·inactive 모두 소스 미기록(거짓 성공). MCP UpdateClass도 "ungültiges Sperr-Handle"(매번 새 핸들) 2회 실패.
CAUSE: (검증: 소스 대조 + SM12 클린 상태 재현 + source read/ADT inactive 조회) ① deploy — IDES가 CLAS 루트 lock에 NoModification 반환 + vsp NoModification 가드(업스트림 22517d4)가 실패 경로에서 unlock 누락. ② copy — 기존재 CLAS에 소스를 안 쓰고 성공 보고. ③ MCP — lock→중간 stateless 요청이 세션 롤백→PUT 시점 잠금 증발(vsp issue #88=423과 동일 메커니즘, 커넥션 재활용 시스템에서 발현). PROG 경로는 세 도구 모두 정상.
RULE: -> R-006

## L-002 | 2026-07-14 | fi-amount-source | 4a-glopen-seed/step1
FAIL: 4a 씨앗 phase — S/4HANA(IDEA-JNC, S4H/100) 대상 GL 미결항목 리포트(ZSAH4A_GLOPEN)가 금액을 bkpf INNER JOIN bseg + SUM(b~dmbtr)로 읽는 구현이 vsp lint(exit 0)·자기충족 유닛테스트(green)를 전부 통과 — 리뷰 게이트만 3회 전부 FAIL(B2/MAJOR, file:line 적중, 리뷰어는 씨앗 메타 무지) → error 종료·step2(escort-write) 미도달. 엔진 원기록은 feat-4a-glopen-seed 봉인분(L-002 raw).
CAUSE: (검증: review-verdict.json 독립 재도출 3회 일치 + 인버스 검증 SEED_BLOCK_OK + src 무변경 git diff --quiet) S/4에서 전표 라인아이템 금액 소스는 ACDOCA(Universal Journal)가 정본인데 BSEG(ECC 라인아이템)를 선택 — BSEG에는 원장 차원(rldnr)이 없어 리딩원장(0L) 한정이 구조적으로 불가, 원장별·전 통화 금액 불완전. 문법·활성화·오프라인 게이트로는 못 잡고 시맨틱 리뷰에서만 드러남(팩 씨앗 FI-002의 실전 재확인 — R-001 해당 없음: ENV/LOCK 마커 아님, 설계된 씨앗 차단).
RULE: -> R-007
