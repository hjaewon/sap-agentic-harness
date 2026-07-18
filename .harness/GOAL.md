# Current Goal

<!-- Overwritten at the start of each task (Task Loop step 2).
     The verifier reads ONLY this file plus the produced artifact. -->

## Task

**백로그 5-13 층2 (2026-07-18, HANDOFF 다음 착수 ①)** — JNC 교훈 팩 층2
(8항목)를 `interactive/core` 지식으로 이식. 대상 = conventions 확장 3종
(field-typing-rule·function-module-rule·clean-code) + 신규 2건
(abapgit-roundtrip-rule·source-repair-protocol). 원천 = 팩
(`D:\Claude for SAP\JNC-Dashboard\docs\reference\sap-adt-lessons-pack.md`
층2 절) + 동결 sc4sap-custom `common/*.md` 신판(07-17 커밋 f7257c0+ffb422b,
읽기만 — R-004). **선결 판정 필수**: 정본(팩 vs 원본 신판)을
MIGRATION-MANIFEST 대조로 확정 후 이식.

## Success criteria (기계 검증 가능)

- [x] **선결 판정 기록**: 대상 5파일 각각 정본 판정(팩 vs 신판) + 근거,
      팩 층2 8항목 → 이식 파일:위치 커버리지 표(누락 0 또는 누락 사유 명시).
      감사 정본 = `docs/reference/audits/2026-07-18-5-13-layer2-audit.md`.
- [x] **이식 완료**: conventions 3종이 신판 델타를 반영하고 신규 2건이
      `interactive/core/knowledge/abap/conventions/`에 실재. 하네스 중립
      적응(sc4sap 고유 참조 제거)은 L1 기존 적응 관례와 일관.
- [x] **분류·수치 정합**: 신규 2건이 MIGRATION-MANIFEST 분류에 포섭(분류
      변경 필요 시 매니페스트 수정으로만) + CLAUDE.md 헤드라인 수치(지식
      175) 실측 재계수 갱신 + conventions 참조 INDEX/앵커 갱신.
- [x] **게이트 5종 green** (coverage·links·verify-engine·smoke 155·doctor)
      — 엔진 재번들 불요(지식은 번들 밖), 번들 무변경.
- [x] **새-컨텍스트 독립 리뷰 PASS(BLOCKER/MAJOR 0)** — 리뷰어가 원천
      (팩+신판) 대 이식본을 직접 대조.
- [x] **HANDOFF·STATE 기록 + 커밋**.

## Verification method

1. 게이트 5종 exit code 실측.
2. 리뷰어(새 컨텍스트, read-only)가 팩 8항목 커버리지를 이식본 좌표로 재확인
   + 신판 델타 누락·왜곡 여부 diff 대조 + 수치(지식 파일 수) 재계수.
3. 동결 레포 무수정 확인(`git -C sc4sap-custom status` 드리프트 불변 —
   기존 1파일 ` M docs/skill-model-architecture.md` 외 변화 0).

## 제약 (전 기간 유효)

- 동결 레포 sc4sap-custom **읽기만**(R-004, private/는 읽기도 금지) —
  기존 드리프트 1파일(docs/skill-model-architecture.md)은 손대지 않고 보고만
- 무인 SAP write 금지(5-11) · final-harness 플러그인 업데이트 금지(5-12)
- QA/PRD write 금지(R-003) · vsp MCP 서버 모드 금지(R-002) · 자격증명 기록
  금지(R-005)
- `.harness/RULES.md` 직접 대량 추가 금지(층3에서도 시드/문서 경유)
- 분류 변경은 MIGRATION-MANIFEST 수정으로만
