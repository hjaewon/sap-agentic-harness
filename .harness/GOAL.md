# Current Goal

<!-- Overwritten at the start of each task (Task Loop step 2).
     The verifier reads ONLY this file plus the produced artifact. -->

## Task

**트랙 A Phase 4(Domain Packs) 착수 — FI 팩 이중 구조 부트스트랩(오프라인 1단계).**
구조 정본 = DESIGN §12(이중 구조)·§13(Phase 4 완료 기준). 지식 원천 =
`interactive/core/knowledge/modules/FI/`(이식 정본 6파일 — **무수정·무복사, 링크로만
참조**). 사용자 확정 결정(2026-07-13): ① 팩은 thin+pointer 최소 3파일로 시작하되
**챕터 분리 트리거를 README와 DESIGN §12에 명시**(사람 기억이 아니라 문서가 기억)
② 규칙 승격은 씨앗 결함 주입 경로 ③ 파일럿 = GL 미결항목 리포트(ZR_FI_GL_OPEN, $TMP).
이번 청크 범위 = 오프라인 산출물(팩 3파일 + DESIGN §12 반영)까지. CONSULT 실사용(①)과
씨앗 주입→규칙 승격(②)은 커넥티드 후속 청크. 메인=오케스트레이션, 작업=모델 지정
서브에이전트(작성 sonnet, 리뷰 opus read-only).

### 산출물

1. `packs/modules/README.md` — 이중 구조 규약: CONSULT 본체는 무인 step에 주입 금지,
   RULES.seed→`.harness/RULES.md` 승격은 사람 승인 게이트(PROTOCOL.md) 경유,
   **챕터 분리 트리거**("CONSULT 세션이 개별 앵커를 요구하면 그때 TABLES.md 등을
   분리한다"), 팩이 실전 지식 축적처라는 성장 방향(DESIGN §12 독자 진화 문단).
2. `packs/modules/fi/CONSULTANT.md` — thin 허브: FI 지식 6파일+sap-fi-consultant
   페르소나 포인터(상대 링크 유효) + 트랙 A 고유 함정/결정훅(ACDOCA vs BSEG,
   GGB0 우선, row-data 경계 등) + 후보 규칙 색인.
3. `packs/modules/fi/RULES.seed.md` — FI 고유 후보 5건(FI-001~005), 기존
   `domain/abap/RULES.seed.md` 포맷 준수. **중복 금지**: S-009/010/011/013을
   재작성하지 않고 인용.
4. DESIGN.md §12 소폭 반영 — thin+pointer 구현 채택 + 분리 트리거 명기(수술적 편집,
   원안 구조 예시는 "완전형"으로 보존).
5. 새-컨텍스트 리뷰(opus, read-only) + 게이트 + 문서 계약(HANDOFF·STATE·ARCHITECTURE
   파일 지도) + 커밋.

## Success criteria

- [x] 팩 3파일 존재, CONSULTANT.md의 모든 상대 링크가 실재 파일을 가리킴(링크 검사
      실측 — check-links packs: 8링크 0깨짐 + 리뷰어 파일시스템 재확인)
- [x] 기존 지식 6파일·동결 레포 무수정 (git diff interactive/core/knowledge 0건,
      sc4sap-custom 무접촉 — 워커·리뷰어 이중 실측)
- [x] RULES.seed.md: FI-001~005가 부정형 규칙+실패 모드+출처 포맷 준수, S-009/010/
      011/013 내용 재작성 0건(인용만 — 리뷰 전수 대조)
- [x] 분리 트리거가 packs/modules/README.md와 DESIGN.md §12 양쪽에 명시됨
- [x] DESIGN.md 변경이 §12+헤더(v2.3 이력)에 국한(git diff 3 hunks 실측)
- [x] 새-컨텍스트 리뷰(opus, read-only) PASS — MAJOR 0 (MINOR 3: FI-002 문구
      정밀화 수리 반영, 인접 2건은 중복 아님 판정·관찰만)
- [x] 게이트 통과(coverage·links·verify-engine·smoke 155 green, doctor는 기존
      agy 드리프트 1건뿐 — 이번 작업 무관) + HANDOFF/STATE 갱신 + 커밋

## Verification method

1. 링크 유효성: check-links.mjs를 packs에 적용(미지원 시 수동 존재 검사 실측)
2. 무수정 보증: `git status --porcelain -uall`로 변경 파일 목록이 산출물 목록과
   정확히 일치하는지 대조
3. 독립 리뷰어(opus)가 DESIGN §12·§13 완료 기준·중복 금지 경계 대비 산출물 전체 판정
