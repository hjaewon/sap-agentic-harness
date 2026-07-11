# Current Goal

<!-- Overwritten at the start of each task (Task Loop step 2).
     The verifier reads ONLY this file plus the produced artifact. -->

## Task

트랙 A Phase 0b — Connected Discovery (DESIGN §13). 선결 §16-2(vsp SAP 연결) 포함.
대상 시스템: IDES-DEV(S4H/100), 파일럿 패키지 $TMP. write는 DEV tier 한정(R-003).

## Success criteria

- [ ] §16-2: `vsp system info` 성공 (IDES-DEV 실연결 — 접속 정보는 레포에 커밋 금지 R-005)
- [ ] `adapters/vsp/COMMANDS.md` 작성 — 서두에 등재 명령 범위 고정(vsp.lock.json
      command_contract 10건 기준), 등재 명령 전부에 실측 시그니처 + 실행 로그
- [ ] 실패 유형별 출력 패턴 실측(ENV/LOCK/CODE 각 1회 이상 실제 재현) →
      `scripts/verify-sap.ps1` 휴리스틱을 실측 패턴으로 교체, 마커 3종 재현 확인
- [ ] §14-9: read-only syntax check 명령 실재 여부 판정 (없으면 Phase 1.5 재정의 기록)
- [ ] §14-2: drift check용 export/비교 명령 + 정규화 규칙 실측 (최소 1개 객체 왕복)
- [ ] `adapters/vsp/VERIFY-PATTERNS.md` 정본 작성 (.harness/ 스텁이 가리키는 그 파일)
- [ ] 게이트 4종 통과 + HANDOFF 갱신 + 커밋

## Verification method

1. `vsp system info` 출력에 system id/client 실데이터 (S4H/100)
2. COMMANDS.md 서두 명령 목록 vs 본문 실행 로그 절 1:1 대조 — 누락 0
3. `scripts/verify-sap.ps1`로 ENV_FAIL(잘못된 호스트)·CODE_FAIL(문법 오류 소스)·
   LOCK_FAIL(잠금 충돌, 재현 가능 시) 각각 유도 → 마커 출력 + exit 1 확인
4. HANDOFF §9 게이트 4종 exit code
