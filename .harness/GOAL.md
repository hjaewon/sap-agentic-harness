# Current Goal

<!-- Overwritten at the start of each task (Task Loop step 2).
     The verifier reads ONLY this file plus the produced artifact. -->

## Task

**잔여 백로그 전체 소진 스프린트 (2026-07-19, 사용자 지시 — "5-12 제외 몽땅")** —
오케스트레이션 세션(실행 전량 모델 지정 서브에이전트 위임), Wave별 기계 검증 +
새-컨텍스트 독립 리뷰. 무인 상시 개방 여부·승인 설계 변경(E2E 실호출 편입)·push는
작업이 아니라 정책 결정이므로 스프린트 끝 **사용자 결정 목록**으로 이월.

Wave 구성: W0 정찰 → W1 Phase 3 계획(SAFETY-PROFILES + harness-plan) → W2 Phase 3
런·완주 → W3 엔진 잔여 → W4 packs Phase 4 → W5 잔챙이·Phase 5 판정·종합.

## Success criteria (기계 검증 가능)

- [ ] **W0 — 정찰**: 잔여 작업 전수 목록(실행 A / 사용자 유보 B / 트리거 대기 C)
      확보 — A 전 항목이 W1~W5 어딘가에 배치됨.
- [ ] **W1 — Phase 3 계획**: `adapters/vsp/SAFETY-PROFILES.md` 실재(DESIGN §8.4
      "실행 가능한 수준" — 모드별 허용/차단 명령 allowlist + 차단 동작 검증 절차) +
      harness-plan 계획 동결(배포 단위마다 [구현→기계검증]→[리뷰 스텝]→[배포 스텝]
      배치, 리뷰 스텝 재시도 예산 ≥5 — 스펙 §4.1·§4.2 계약) + 계획 린트 통과.
- [ ] **W2 — Phase 3 완주 (DESIGN §13 Phase 3 완료 기준 전 항목)**:
      ① 객체 1건이 전체 체인(deploy→activate→drift check→ATC→unit test)을 통과해
      SAP에 실재 ② drift check가 out-of-band 변경(하네스 밖 채널의 $TMP 수정)을
      실검출 1회 ③ **AC-8: 기계 검증을 전부 통과한 실제 시맨틱 결함을 리뷰
      게이트가 차단(red) → 수정본 PASS(green) 실증 1회** ④ 신설 AC-14·15의 동작
      증거(캡슐 미검증 유형 명시·리뷰어 vsp read-only 실측 대조) ⑤ run 기록 정직
      (실패·재시도 있으면 그대로 기록).
- [ ] **W3 — 엔진 잔여**: 11-⑩(Delete 로컬 4종) 설계 판정 후 수리 또는 근거 기각 +
      관찰 2건(add-if-missing GET 비직렬화·low 무동작 파라미터) 처리 + W0 목록 A의
      엔진 항목 전부 판정. 수리분 jest 역-검증·재번들 시 smoke 155 유지.
- [ ] **W4 — packs Phase 4 (DESIGN §13 완료 기준)**: `packs/modules/<fi|co>/` 이중
      구조(§12 — CONSULT 본체 + RULES.seed.md) 실재·interactive에서 선별 이식(동결
      원본 아닌 레포 내 정본 사용) + CONSULT 단계 실사용 1회 + LESSONS 유래 규칙
      1건 `.harness/RULES.md` 승격(자연 실패 없으면 의도적 실패 주입 허용 — 설계
      명시, PROTOCOL/harness-lesson 절차 경유·대량 추가 금지).
- [ ] **W5 — 잔챙이·종합**: W0 목록 A 전 항목 소진 또는 근거 기각 + Phase 5 착수
      가능 판정 기록 + 게이트 5종 green + **스프린트 전체 대상 새-컨텍스트 독립
      리뷰 PASS(BLOCKER/MAJOR 0)** + HANDOFF·STATE·(대안 기각 결정 발생 시
      DECISIONS append) 갱신 + 커밋 + 사용자 결정 목록 보고.

## Verification method

1. Wave마다 기계 검증(node:test·jest·게이트 5종·라이브 red→green·exit code 실측)
   후 새-컨텍스트 독립 리뷰(read-only, 작업 세션 주장 불신·실측 재확인) PASS를
   확인하고 다음 Wave 진입. W5 리뷰는 스프린트 전체 diff 대상.
2. SAP 잔존물: $TMP 임시 객체는 Wave 종료 시 실삭제·read-back 404·고아 잠금 0 확인
   (Phase 3 완료 기준 산출물 1건은 의도 잔존 — 기록).
3. `.harness/RULES.md` 변경은 W4 승격 1건(개별, PROTOCOL 경유)만 허용 — 그 외
   무수정을 git diff로 확인.

## 제약 (전 기간 유효)

- SAP write = DEV tier·$TMP 한정(R-003) + **attended bridge(메인 세션 감독)로만**.
  무인 상시(headless) 개방은 스프린트 스코프 밖 — 사용자 결정.
- 실데이터 row 2종(GetTableContents/GetSqlQuery)은 상시 게이트 유지 — 필요 시에만
  개별 승인 요청.
- 동결 레포 읽기만(R-004) · JNC-Dashboard 읽기만 · 5-12(claude-final v0.20 흡수)
  및 그 트리거 대기 항목 제외 · 외부 레포 업스트림 기여 제외.
- 엔진(execute.py) 무수정(스펙 B1·D-018 lock) · vsp.lock v2.38.1-94 계약 준수 —
  vsp-custom 재수리가 필요해지면 D-018 재검증 절차 동반.
- QA/PRD tier write 금지(R-003) · deploy/copy 후 source read 확인(R-006) ·
  ENV/LOCK 마커 실패를 코드 결함으로 기록 금지(R-001).
