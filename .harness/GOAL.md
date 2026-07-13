# Current Goal

<!-- Overwritten at the start of each task (Task Loop step 2).
     The verifier reads ONLY this file plus the produced artifact. -->

## Task

**③ Phase 3 선결 설계 (백로그 5-11) — 무인 gated write 체인에 새-컨텍스트 리뷰 게이트
편입 방식 설계.** harness-design 계약의 스코프드 적용(그린필드 아님 — 택지 3개 기제시):
탐색(증거 기반) → 택지 구체화 → 독립 검토 → **사용자 택1** → 스펙 기록
(`docs/reference/designs/`) + D-021 + DESIGN.md §8.3/§13 갱신. 메인=오케스트레이션만,
분석·검토·스펙 작성=모델 지정 서브에이전트 (사용자 지시 패턴 유지).

### 배경 (5-11 원문)

트랙 B E2E 실증: 문법·ATC·활성화 전부 통과한 시맨틱 결함(INNER vs LEFT JOIN)은 기계
verify가 못 잡고 새-컨텍스트 리뷰만 잡는다(HANDOFF §4.1). 무인 엔진의 완료 판정은 기계
verify뿐 → gated write 체인(DESIGN §8.3: deploy→activate→drift→ATC→unit)에 이 구멍이
열려 있음. **편입 전까지 무인 write는 켜지 않는다.**

### 택지 (5-11 기제시 — 증거로 구체화 후 사용자 택1)

(a) 엔진 verifier 프롬프트 강화 (b) 별도 리뷰 스텝 (c) 사람 셰퍼딩 유지

## Success criteria

- [x] 택지별 메커니즘 엔진 실소스 근거 구체화 — file:line 인용, "opus 사후 리뷰" 실체
      규명(엔진 내장 `_run_review` 비게이트 — 완료 마킹 후 실행·verdict 미소비)
- [x] 트랙 B 리뷰 자산 재사용 판정 — 체크리스트 기준·verdict 스키마는 이식 가능,
      도구 계약은 정반대(MCP↔vsp CLI)라 치환 필요
- [x] 나머지 선결 2건 기완료 판정(0b 마커 DESIGN:478 · §14-2 drift :477, export만
      보류) — 리뷰 게이트가 마지막 선결이었음
- [x] **독립 검토 3왕복** — 원안 (b) 위조 창 BLOCKER 적중 → (b′) 정정 → 조건부 성립
      + 필수 3조항 확정 + A와 1:1 비교
- [x] **사용자 택1** = (b′) 강화판 (12살 설명 재제시 후 결정, 2026-07-13)
- [x] 스펙 196줄(§5 계약 11섹션·AC 5건 testable) + D-021 append + DESIGN v2.2
      (§8.3·§13 — 선결 3건 전부 해소, 완료 기준에 씨앗 결함 차단 1회 실증 추가)
- [x] HANDOFF(§5-11 종결·헤더)·STATE 갱신 + 게이트 유지 + 커밋

## Verification method

1. 독립 검토자가 분석의 엔진 인용(file:line) 실소스 대조
2. 스펙이 harness-design §5 섹션 계약(Goal/Non-Goals/…/Decisions made) 충족하는지 확인
3. 게이트 exit code 실측
