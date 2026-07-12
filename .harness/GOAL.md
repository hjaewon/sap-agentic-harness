# Current Goal

<!-- Overwritten at the start of each task (Task Loop step 2).
     The verifier reads ONLY this file plus the produced artifact. -->

## Task

백로그 5-7 (트랙 B) — sap-assets 설치 절차 이식 + FM 부재 시 3계열 SKIPPED 규칙.
원천: 동결 레포 `D:\claude for SAP\sc4sap-custom\skills\setup\wizard-step-09-abap-objects.md`
(읽기 전용 — R-004). 목적지: `interactive/core/procedures/`.

## Success criteria

- [x] **신규 절차 문서** `interactive/core/procedures/install-sap-assets.md`:
      원본 스텝 9의 게이트 로직 보존 — ① tier 게이트(dev만 진행, QA/PRD 전면 거부 +
      CTS 안내) ② 시스템 dedup(sentinel 파일) ③ 기존재 skip ④ 부분 실패 시 사용자
      판단(자동 삭제 금지) ⑤ RFC-enabled는 SE37 수동(TFDIR.FMODE ADT 불가) ⑥
      SAP_VERSION별 소스 선택(S4/ECC)
- [x] 절차가 참조하는 소스 파일은 전부 `interactive/server/sap-assets/`에 **실재**
      (미동봉 파일 — 예: zrfc 핸들러 클래스 — 을 설치 대상으로 참조하지 않음)
- [x] **하네스 중립**: bare capability name(vocabulary.md 계약) 사용, `/sc4sap:` 등
      특정 하네스 명령·죽은 참조 0 (기존 core/procedures 문체·언어[영어] 정합)
- [x] **3계열 SKIPPED 규칙**: create-program.md·create-object.md에 "textpool FM 부재
      또는 RFC 백엔드 미구성 시 Screen·GUI Status·Text Element 3계열 SKIPPED 처리 +
      `environment_context.known_outages` 기입" 명시 (5-3 스키마 필드와 정합)
- [x] MIGRATION-MANIFEST.md의 wizard-step-09/setup 해당 행 목적지 갱신
      (3열 백틱 경로는 실재 검사 대상 — 주의)
- [x] **게이트 5종 전부 통과**: check-migration-coverage(미분류 0) ·
      check-links(깨짐 0, 앵커 포함) · verify-engine(OK) · smoke-mcp(155) · doctor
- [x] 새-컨텍스트 read-only 리뷰 PASS (이 GOAL 기준 대조 — 1차 FAIL[소비측
      review-checklist 범위 누락 검출] → 수리 → 2차 PASS)
- [x] HANDOFF 갱신(5-7 완료 + 헤더 "다음 착수" 재지정) + STATE.md 기록 + 커밋

## Verification method

1. 게이트 5종 exit code 실측 (0 또는 문서화된 비차단 warning만)
2. 신규 문서 내 참조 파일명을 sap-assets 실재 목록과 대조 (누락/유령 0)
3. 독립 리뷰어(새 컨텍스트, read-only)가 GOAL 기준 항목별 판정
