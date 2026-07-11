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
