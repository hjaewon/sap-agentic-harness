# Current Goal

<!-- Overwritten at the start of each task (Task Loop step 2).
     The verifier reads ONLY this file plus the produced artifact. -->

## Task

**트랙 A Phase 3(Gated Deploy) 착수 — A-청크: 무인 리뷰 게이트 구현 (오프라인 완결분).**
스펙 정본 = `docs/reference/designs/2026-07-13-unattended-review-gate.md` (D-021, AC 5건).
이 청크의 범위 = AC 1·2·3·4 (git·엔진만 필요) + SAFETY-PROFILES.md + 체크리스트 이식.
AC 5(라이브 씨앗 결함 차단 실증)와 §13 완료 기준 ①②는 B-청크(커넥티드, vsp 빌드 선결)로
분리 — A 완료 후 사용자 재결정. 메인=오케스트레이션만, 작업=모델 지정 서브에이전트
(스텝 1~3 opus 병렬, 스텝 4·6 sonnet, 스텝 5 리뷰 opus read-only).

### 산출물

1. **검사기** `scripts/check-review-verdict.ps1` — 필수 3조항 구현
   (① verdict=="PASS" ② reviewed_head==HEAD ③ 등식형 dirty 검사, bookkeeping 제외
   집합은 스펙 열거 그대로). PS 5.1 호환, `git status --porcelain -uall`
   (미추적 디렉토리 접힘 함정 — STATE.md Attempts 2026-07-11 실증).
2. **재현 테스트** — 임시 git fixture에서 AC1 위조 3종(stale PASS · 리뷰어 코드 동시
   수정 · HEAD 불일치)·AC2 정상 경로·AC4 검사기 1바이트 변조(sha256 핀)를 exit code로 판정.
3. **리뷰 스텝 템플릿 + 체크리스트** — 트랙 B `interactive/core/procedures/
   review-checklist.md` 12항목 이식(MCP→vsp CLI read 치환) + 시맨틱 항목 신규(JOIN
   카디널리티·spec 정합 등), verdict 스키마(`review-verdict.json`, reviewed_head 필수),
   verify 명령 관례(sha256 핀 갱신 절차 포함).
4. **SAFETY-PROFILES.md** — spec 승인 게이트 + package allowlist + transport 정책 +
   모드별 명령 allowlist(차단: query/execute/source write·edit/install/deploy/copy/
   transport 계열) + 차단 검증 절차(리뷰 스텝 read-only 시나리오 포함 — 스펙 Assumption #2).
5. **AC3 엔진 통합 재현** — 미니 오프라인 phase에서 FAIL verdict → 재시도 → error
   종료·write 스텝 미도달을 엔진 콘솔 로그·index status로 실측.
6. 문서 계약(HANDOFF 헤더·STATE.md·ARCHITECTURE 파일 지도) + 5종 게이트 + 커밋.

## Success criteria

- [x] AC1: 위조 시나리오 3종 각각 검사기 exit 1 (재현 테스트 통과)
- [x] AC2: 정상 PASS verdict(정확히 그 파일만 dirty, reviewed_head 일치) → exit 0
- [x] AC4: 검사기 1바이트 변조 → sha256 핀 불일치 → exit 1
- [x] AC3: 엔진 실행에서 FAIL verdict → 재시도 소진 → error 종료, write 스텝 미도달
      (엔진 콘솔·index status 실측)
- [x] 체크리스트: 트랙 B 12항목 전부 이식(vsp read 치환) + 시맨틱 항목 ≥1 신규,
      verdict 스키마가 스펙 Key entities와 항목별 일치
- [x] SAFETY-PROFILES.md: DESIGN §8.4 요구 4건(주입 스코핑·read-only 기본·allowlist·
      .gitignore) 전부 실행 가능 수준으로 커버
- [x] 새-컨텍스트 리뷰(opus, read-only) PASS — MAJOR 0
- [x] 게이트 5종 green + 문서 계약 갱신 + 커밋

## Verification method

1. 재현 테스트 실행 — exit code 실측 (자기보고 불신)
2. AC3는 엔진 콘솔 로그·`phases/{p}/index.json` status 직접 확인
3. 독립 리뷰어가 스펙 AC·D-021·DESIGN §8.3 대비 산출물 전체 판정
