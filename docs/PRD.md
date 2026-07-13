# PRD — sap-agentic-harness

> 무인 엔진이 이 파일을 **매 스텝 프롬프트에 주입**한다(scripts/execute.py: docs/*.md
> 전량, 48KB 경고·64KB 기동 거부). 그러므로 스코프의 **가드레일**만 얇게 적고 상세는
> 포인터로 돌린다. 상태 정본은 HANDOFF.md, 설계 정본은 DESIGN.md·interactive/DESIGN.md,
> 결정의 '왜'는 docs/DECISIONS.md. 중괄호 플레이스홀더 금지(엔진이 해당 문서를 스킵).

## 목표

SAP ABAP/RAP/CDS/AMDP 개발을 AI 하네스로 수행한다. 세션의 자기보고를 신뢰하지 않고
**하네스가 독립 검증**하고, 실전 실패에서 증류된 규칙을 모듈 지식으로 축적하는 것이 핵심.
단일 레포·두 트랙 구조(아래 §트랙별 기능). 철학: 차용 후 완전 소유(sc4sap 지식 이식,
엔진 편입 D-017) · 가볍지만 강력하게 · 3사 하네스 중립.

## 사용자

**개인 도구 — SAP ABAP 개발자 1인**(소유자 겸 유일 사용자). 팀 배포·다중 사용자·상업
배포 대상이 아니다(다국어 README 미작성 결정 근거, HANDOFF 5-6). 이 전제가 아래 비목표와
품질 모델의 규모를 정한다 — "senior 1명이 과설계라 부를 것은 짓지 않는다".

## 트랙별 기능과 우선순위

### 트랙 A — 하네스 트랙 (무인 step + 대화형 레인 겸용)
final-harness 무인 엔진 + vsp-custom CLI로 ABAP 개발을 계획→실행→verify→LESSONS/RULES
학습 루프로 관리한다. **vsp-custom = 트랙 A의 유일한 SAP 접점·검증/배포 백엔드** — 없으면
verify 루프가 성립하지 않는다(DESIGN §3; powerup 엔진은 이 트랙에서 미사용). 현황: Phase
0a~2 완료(1.5 red/green 서버 실증 포함), Phase 3(Gated Deploy)는 3대 선결 진행 중. 로드맵과
Phase별 완료 기준 = DESIGN §13.

### 트랙 B — 대화형 플러그인 (interactive/)
sc4sap-custom의 전 자산(지식 217 · 페르소나 26 · 절차 15 · 정책)을 하네스 중립 코어 +
MCP 서버 번들 + 어댑터 3사(Claude/Codex/Antigravity)로 재편한 라이트 플러그인(플러그인명
sap-agentic-harness). 현황: L0~L5 구현 + E2E + 3사 교차검증 완료. 설계 정본 =
interactive/DESIGN.md.

두 트랙의 유일한 접점: 트랙 A의 packs가 interactive/core/knowledge에서 선별 이식한다
(같은 레포라 커밋 이력이 곧 provenance).

## 비목표 (의도적으로 버린 것)

- **멀티에이전트 자동 디스패치** · **team 협업** — sc4sap-custom에서 이식하지 않은 유일한
  두 자산(D-002). 품질 모델을 "1명 작업 + 1명 리뷰"로 단순화한 결과다.
- **엔진 도구 삭제로 MCP 표면 경량화** — 기각(D-016). 경량화는 하네스별 노출 정책으로 한다.
- **표준 문서 남발** — docs/ADR.md는 만들지 않는다. ADR 역할은 docs/DECISIONS.md가 겸한다
  (D-012·D-020, 이중 체계 금지).

## 품질·안전 모델

- **품질**: 1명 작업 + 1명 **새-컨텍스트 리뷰**(read-only, 자기 리뷰 금지) + SAP 기계 검증
  (CheckSyntax→활성화→ABAP Unit→ATC). 완료의 최소 기계 증거는 D-019가 봉인(check_syntax·
  activate는 SKIPPED 불허).
- **안전 3층 방어**: 도구 단위 권한 allowlist · PreToolUse 훅 · 엔진 tier 게이트.
- **실데이터 2종 상시 게이트**: GetTableContents/GetSqlQuery는 어떤 하네스에서도 자동 승인
  금지 — 매 호출 사람 승인(D-008).
- 불변 규칙 전문 = HANDOFF §8 · .harness/RULES.md(R-001~R-006). 구조/파일 지도 = ARCHITECTURE.md.
