# Current Goal

<!-- Overwritten at the start of each task (Task Loop step 2).
     The verifier reads ONLY this file plus the produced artifact. -->

## Task

**주/보조 머신 분기 통합 세션 (2026-07-19)** — 실행 정본 =
`docs/reference/audits/2026-07-19-branch-divergence-assessment.md` (결정 5건 확정
완료). 병합 베이스 = 원격 main(주 머신 줄기), 로컬 우월 자산(§4 대차대조표)을
그 위에 이식. 오케스트레이션 세션 — git 상태 조작·조율·커밋은 메인, 파일 해결·
검증·리뷰는 전량 모델 지정 서브에이전트 위임.

## Success criteria (기계 검증 가능)

- [ ] **S1 — 병합 완료**: `origin/main` 기반 통합 브랜치에 로컬 main 병합, 충돌
      전량(실측 48±α) 해소, 병합 커밋 생성. 양쪽 줄기 이력 무손실(커밋 그래프에
      두 부모 보존, phase 산출물 양쪽 다 보존 — 결정 ⑵).
- [ ] **S2 — 채택 원칙 준수** (평가 문서 §4·§5): 구조(로그 위치·게이트 신형
      스크립트·CI·docs/reference/) = 원격 / 엔진 = 로컬 4.13.15 → **4.13.16
      재채번 + CHANGELOG 통합 + provenance(integrity.json sourceCommit) 재바인딩**
      / vsp lock = 로컬 v2.38.1-94 / FI 팩·지식 이식(5-13) = 로컬 /
      final-harness = 원격 v0.20 candidate lock / 리뷰 게이트 = 원격 run-scoped
      골격 + 로컬 캡슐은 무인 write 경로 부품(역할 분담 설계 문서 신설, 실배선
      코드는 후속 백로그로 명시).
- [ ] **S3 — 결정 로그 정리** (결정 ⑶·⑷): 정본 = `docs/reference/DECISIONS.md`
      단일 체계. D-030(vsp 편입 확정 — subtree 실행은 통합 후 별도 단계) ·
      D-031~034(로컬 D-020~023 재기술, 원 항목 supersede 표기) append. D-023
      내용은 "무조건 상시 개방"이 아닌 "대화형 중심 틀 + U-gate 관문 경유 조건부
      개방"으로 재기술(결정 ⑴). append-only 규약 준수(기존 항목 수정 없음).
- [ ] **S4 — 게이트 정의 갱신 + 전량 green**: 원격 신형 게이트 스크립트 기준으로
      CLAUDE.md 게이트 정의 갱신(check-migration-coverage.mjs 삭제 반영), 통합
      트리에서 게이트 전체 실행 green. verify-engine이 재번들된 4.13.16 번들
      무결성 OK + smoke tools 155.
- [ ] **S5 — 서술 문서 통합**: HANDOFF·`.harness/STATE.md`·CLAUDE.md 를 두 줄기
      상태를 무손실 통합한 서술로 갱신(재개점 = vsp 편입 D-030 실행). R/L 규칙
      병존 재번호(원격 R-007[fi-version]→R-009 등, 로컬 R-007[sql]·R-008[repo]
      보존, L 번호 동일 원칙).
- [ ] **S6 — 원격 줄기 주장 재확인**: S1~S4 완주·CI green·v0.20 candidate 등
      원격 줄기 핵심 주장을 새-컨텍스트 위임으로 실측 재확인(별도 worktree,
      read-only) — 보고서 확보. 반증 발견 시 해당 자산 채택 보류 + 기록.
- [ ] **S7 — 새-컨텍스트 독립 리뷰 PASS**: 통합 결과 전체(병합 커밋 + 후속
      정리 커밋) 대상 read-only 리뷰, BLOCKER/MAJOR 0.
- [ ] **S8 — 종결**: main을 통합 결과로 이동(fast-forward), 커밋 완료. push·
      원격 stale 브랜치(feat-3a-carrflt-seed) 삭제는 사용자 판단 — 권고만 제시.

## Verification method

1. 병합 상태: `git rev-list --count` 두 부모 이력 포함 확인, `git status` clean,
   충돌 마커 잔존 0 (`git grep -l '<<<<<<<'` = 0건).
2. 게이트: 통합 트리의 신형 게이트 스크립트 전량 exit 0 + verify-engine OK +
   smoke 155 실행 로그.
3. 결정 로그: docs/reference/DECISIONS.md에 D-030~034 실재 + 기존 항목 diff
   무수정 확인.
4. 독립 리뷰: read-only 위임 리뷰어의 PASS 판정문(BLOCKER/MAJOR 0).
5. SAP 접속 불요 — 이 세션은 레포 통합만, SAP write 0 (R-003 자동 충족).

## 제약 (전 기간 유효)

- 로컬 줄기 백업 = `origin/sprint-20260719` (이미 push) — 통합 실패 시 복구점.
  원격 main 자체는 이 세션에서 rewrite 금지(push는 사용자 판단).
- 동결 레포 읽기만(R-004) · 자격증명 커밋 금지(R-005) · append-only 결정 로그.
- 무인 SAP write 봉인 유지 — D-023 재기술 전이며, 이 세션은 SAP 비접속.
- final-harness 플러그인 업데이트 금지(5-12)는 원격 v0.20 candidate lock 채택
  으로 대체 여부를 S2에서 판정(원격이 이미 흡수했으면 5-12 종결 표기).
- 서브에이전트 위임 프롬프트는 순화 어휘 원칙(메모리 softened-security-wording)
  준수 — 보안 오해 소지 서술어 금지.
