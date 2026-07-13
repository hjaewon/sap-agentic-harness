# Current Goal

<!-- Overwritten at the start of each task (Task Loop step 2).
     The verifier reads ONLY this file plus the produced artifact. -->

## Task

**② 트랙 A 지식 문서 부트스트랩 (harness-docs Mode A 계약 준수, 알림 3회째 해소)** —
사용자 확정 착수 순서의 두 번째. 메인=오케스트레이션만, 작업=모델 지정 서브에이전트
위임(사용자 지시 2026-07-13). 절차 정본 = final-harness `skills/harness-docs/SKILL.md`
(플러그인 미설치 — lock 커밋 8f7f13b의 절차문을 직접 소비).

### 산출물 (D-012 원문 대조 후 확정)

- `docs/PRD.md` — 목표·비목표·사용자·기능 우선순위 (신설)
- `docs/ARCHITECTURE.md` — 스택·두 트랙 경계·**파일 지도**(디렉토리별 1줄)·불변식 (신설)
- **ADR.md는 신설하지 않음** — D-012의 유효 부분(DECISIONS.md가 ADR 역할, 이중 체계
  금지) 준수. D-012의 "3종 기각" 부분 갱신은 **DECISIONS.md 새 엔트리 append**로만.
- HANDOFF §7 파일 지도 + 헤더(② 완료) + STATE 갱신

### 하드 룰 (harness-docs SKILL.md)

- 문서당 ~300줄 이하, **top-level docs/*.md 합계 48KB 미만**(현 DECISIONS.md 20.8KB
  포함 — 엔진이 무인 스텝마다 전량 주입, 64KB에서 기동 거부)
- `{중괄호}` 플레이스홀더 금지(엔진이 해당 문서 스킵)
- 코드/타 문서가 이미 말하는 사실은 중복 금지 — 포인터만(DESIGN.md·HANDOFF·DECISIONS
  와의 3중 중복이 D-012의 기각 사유였음 — thin+pointer 구조가 해소책)
- `.harness/`·`phases/`·동결 레포 불가침, DECISIONS.md는 append만

## Success criteria

- [x] docs/PRD.md(55줄)·docs/ARCHITECTURE.md(87줄) 실재 + 각 300줄 이하 + 중괄호 0
- [x] top-level docs/*.md 합계 33.5KB < 48KB 실측 (D-020 append 포함)
- [x] 파일 지도 실측 트리 기반 — 리뷰어가 인용 경로 전량 실재 + "예정" 항목 미존재 확인
- [x] ADR.md 미신설(리뷰어 docs/ 실측 확인) + D-020 append(정정 3건 반영 후)
- [x] **새-컨텍스트 read-only 리뷰 PASS** — opus, 엔진 소스(execute.py)까지 실측 대조,
      BLOCKER/MAJOR 0 (MINOR 2 수리 반영: 게이트 블록→포인터, D-020 문구)
- [x] 게이트 유지 + HANDOFF §7·헤더·STATE 갱신
- [x] 메인은 오케스트레이션·게이트·커밋만 — 초안=opus 워커, 검증=opus 새-컨텍스트
      리뷰어, MINOR 수리=워커 재위임(SendMessage)

## Verification method

1. 파일 실재·줄수·바이트 합계·중괄호 grep 실측
2. 독립 리뷰어(새 컨텍스트, read-only)가 초안을 corpus(DESIGN.md·HANDOFF·DECISIONS·
   phases)와 대조해 사실 오류·중복·규칙 위반 판정
3. 게이트 exit code 실측
