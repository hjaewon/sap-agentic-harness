# ARCHITECTURE — sap-agentic-harness

> 무인 엔진이 docs/*.md를 매 스텝 프롬프트에 주입한다(48KB 경고·64KB 기동 거부). 구조의
> **지도와 계약**만 얇게 적는다 — 설계 서사는 DESIGN.md·interactive/DESIGN.md, 결정의
> '왜'는 docs/DECISIONS.md, 살아있는 상태는 HANDOFF.md. 리뷰 체크리스트가 참조하는
> docs/ADR.md는 존재하지 않는다 — ADR 역할은 docs/DECISIONS.md가 겸한다(D-012·D-020).

## 스택 · 두 트랙 경계

단일 git 레포에 두 트랙이 **실행 코드 의존 없이** 공존한다:

- **트랙 A(하네스 트랙)** — Python 무인 엔진(final-harness) + Go CLI(vsp-custom)가 ABAP
  개발을 step 루프로 구동. 레포 자체는 문서·템플릿·스킬·verify 래퍼·ABAP 소스만 갖고,
  두 실행 의존은 외부 레포로 분리 유지(D-018).
- **트랙 B(대화형 플러그인)** — Node MCP 서버 + 3사 어댑터. 도구 표면 소스 정본은 레포 내
  engine/(D-017 편입), 배포 형태는 interactive/server/의 번들.

유일한 물류: 트랙 A packs ← interactive/core/knowledge 선별 이식(커밋 이력 = provenance).

## 핵심 의존 (부트스트랩 시 버전 lock — D-018)

| 의존 | 역할 | lock 파일 · 고정값 |
|---|---|---|
| final-harness | 트랙 A 무인 엔진 (자체 제작 독립 제품) | `adapters/final-harness.lock.json` — v0.17.3, 커밋 8f7f13b, §15-F1~F7 재검증 전량 유지 |
| vsp-custom | 트랙 A 유일 SAP 접점·검증/배포 백엔드 (CLI) | `adapters/vsp/vsp.lock.json` — v2.38.1-91-g0b03ef2, 커밋 0b03ef2, 바이너리 sha256 고정 |
| engine/ (MCP 서버) | 트랙 B 도구 표면 소스 정본 | 레포 내 편입(D-017). 수리→재번들→interactive/server 반영은 `interactive/server/UPDATE-RUNBOOK.md` 절차로만 |

두 실행 의존을 편입하지 않는 이유: 소비 계약이 CLI 바이너리/독립 제품이고 업스트림이
활발해 편입 이득이 0에 가깝다(D-018). 엔진(engine/)만 편입한 대조 근거는 D-017 원문.

## 파일 지도 (실측 트리 — 여기 뭐가 살고 왜)

루트:
```
HANDOFF.md              프로젝트 전체 상태·재개 지침 정본 (상태 바뀔 때마다 갱신)
DESIGN.md               트랙 A 설계 정본 v2.1 (§16 부트스트랩부터 시작)
CLAUDE.md · AGENTS.md   세션 시작 규약 + 루프 하네스(트랙 B) 진입점
docs/DECISIONS.md       append-only 결정 로그 D-001~ (ADR 역할, 무인 주입 대상)
docs/PRD.md             스코프·비목표·품질 모델 (무인 주입 대상, thin+pointer)
docs/ARCHITECTURE.md    이 문서 — 구조·파일 지도·불변식 (무인 주입 대상)
docs/superpowers/       설계 스냅샷 아카이브 (docs/*.md glob 밖 = 무인 미주입)
docs/reference/templates/ 리뷰 게이트 산출물(비재귀 docs/*.md glob 밖 = 무인 미주입) —
                        review-step.md(리뷰 스텝 지시문)·review-verdict.schema.json·
                        review-gate-plan-conventions.md(harness-plan 배선 관례)
engine/                 MCP 엔진 소스 정본 — TS 소스·tests·번들 도구·patches·
                        UPSTREAM-FIX-HANDOFF.md·CHANGELOG (D-017 편입, 플러그인 표면 밖)
interactive/            트랙 B 플러그인 루트 (아래 세부)
adapters/               트랙 A 의존 lock 2종 + vsp/ 어댑터 문서(COMMANDS·VERIFY-PATTERNS·
                        SAFETY-PROFILES.md — 리뷰 스텝 read-only 프로파일·allowlist)
domain/                 트랙 A 도메인 규칙 시드 — 현재 abap/만(CHECKLIST·RULES.seed, S-001~025)
scripts/                무인 엔진 step executor(execute.py) + SAP verify 래퍼
                        (quality-gate-sap·verify-sap·vsp-env.ps1) + test_execute·test_hooks
                        + 리뷰 게이트 검사기(check-review-verdict.ps1·test-check-
                        review-verdict.ps1)
src/                    하네스가 만든 ABAP 소스, abapGit 호환 파일명
                        (현재 3건: zsah1_workdays · zcl_sah2_workdays · zsah2_duedate)
phases/                 무인 엔진 phase 기록 (0-example · 1-workdays-util · 2-duedate-reuse;
                        각 step/review/run-summary/index.json)
.harness/               final-harness 설치본 — RULES(R-001~006)·PROTOCOL·LESSONS·STATE·
                        GOAL·VERIFY-PATTERNS(정본은 adapters/vsp/로의 스텁)
.claude/                quality-gate.json(→scripts/quality-gate-sap.ps1) · settings(.local)
```

interactive/ 세부:
```
interactive/DESIGN.md              트랙 B 설계 정본 (상태는 여기 기록 안 함 — HANDOFF가 정본)
interactive/MIGRATION-MANIFEST.md  원본 508파일 5분류 (분류 변경은 이 파일 수정으로만)
interactive/core/                  하네스 중립 지식·페르소나 26·절차·정책·vocabulary
interactive/server/                MCP 번들 + keyring + tool-catalog + sap-assets + UPDATE-RUNBOOK
interactive/adapters/ (claude·codex·antigravity)  어댑터별 설치·안전모델 가이드 + compatibility.json
interactive/skills/ agents/ plugin.json           플러그인 표면
interactive/scripts/               게이트 스크립트 (check-links·check-migration-coverage·
                                   smoke-mcp·gen-permissions·doctor)
.claude-plugin/ .agents/ (루트)    마켓플레이스 (source: ./interactive)
```

미존재(로드맵 예정): `packs/`(모듈 지식팩, Phase 4) · `domain/cds·rap·amdp`(Phase 1+).
실측 시 없는 것이 정상.

## 불변식 (요약 — 전문은 HANDOFF §8 · .harness/RULES.md)

- **HANDOFF §8 (7개)**: 지식 정본=interactive/core/(동결 레포 수정 금지) · private/ 영구
  denylist · server.bundle.cjs `.gitattributes` 보호(갱신은 UPDATE-RUNBOOK) · 실데이터 2종
  자동 승인 금지 · 게이트 상시 통과 · superpowers 재활성화 제안 금지 · 굵직한 결정은
  DECISIONS.md append.
- **.harness/RULES.md (R-001~R-006)**: ENV/LOCK_FAIL 마커 실패는 규칙 승격 제외 · vsp는 CLI
  전용(MCP 금지) · QA/PRD tier write 금지 · 동결 레포 수정·private 읽기 금지 · 접속정보 커밋
  금지 · vsp write 후 `vsp source read`로 반영 확인.

## 검증 게이트 (구조 변경 시 항상 통과 유지)

구조 변경 시 게이트 5종(coverage·links·verify-engine·smoke-mcp·doctor)을 통과 상태로
유지한다 — 명령 목록 정본은 HANDOFF §9 (CLAUDE.md 게이트 절과 동일, 여기 중복 게재 안 함).
