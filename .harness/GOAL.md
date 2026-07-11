# Current Goal

<!-- Overwritten at the start of each task (Task Loop step 2).
     The verifier reads ONLY this file plus the produced artifact. -->

## Task

트랙 A Phase 1.5 — Connected Online Validation (0b에서 ATC/health 기반으로 재정의,
DESIGN §13). 대상: ZSAH1_WORKDAYS → IDES-DEV $TMP. write는 $TMP 한정(R-003),
연결 verify는 scripts/verify-sap.ps1 경유(R-001·VERIFY-PATTERNS 규약).

## Success criteria

- [ ] **red/green 실측**: 스텁 버전(git 5271cc95 시점 소스) deploy → ABAP Unit 실행 →
      전 케이스 FAIL(red) / 최종 버전 deploy → 전 5케이스 PASS(green) — Phase 1
      desk-check의 실검증 (리뷰 권고 이행)
- [ ] ATC 실측 1회 (findings 유무 무관 — exit 0 거동 재확인 + 출력 기록)
- [ ] **완료 기준(DESIGN §13)**: offline lint를 통과하는 결함 소스(ENDIF 누락 —
      Phase 1-A 실측 재사용) 1건이 connected 단계(deploy 서버 문법 검사)에서
      검출됨을 실증 — 래퍼 마커(CODE_FAIL)로 분류 확인
- [ ] VERIFY-PATTERNS 정본에 connected 층 실측 결과 반영
- [ ] 게이트 4종 통과 + STATE/HANDOFF 갱신 + 커밋

## Verification method

1. vsp test 출력에서 red 실행 = 5 FAIL, green 실행 = 5 PASS (또는 vsp test가
   REPORT 로컬 테스트를 미지원이면 그 실측 자체를 기록하고 대체 경로 판정)
2. ENDIF 누락 소스: `vsp lint --file` exit 0 (offline 통과) → deploy 시도 →
   verify-sap.ps1 경유 CODE_FAIL + exit 1 (connected 검출)
3. HANDOFF §9 게이트 4종 exit code
