# /sapkit:setup 대화형 설치 마법사 — 설계 (백로그 5-15 집행)

- 작성 2026-07-22 · 상태: 사용자 승인(대화 섹션별) · 집행 근거 = D-045(append 예정)
- 관련: HANDOFF §5-15 · MIGRATION-MANIFEST 40~42행(원본 setup 계열 transform 판정) ·
  `interactive/adapters/claude/README.md`(현행 수동 절차)

## 0. 결론 / 범위

**신설 2파일**로 원본 sc4sap `/setup`의 대화형 온보딩 경험을 하네스 중립으로 복원한다:

1. `interactive/core/procedures/setup.md` — 마법사 절차서 (정본)
2. `interactive/skills/setup/SKILL.md` — 얇은 래퍼 (기존 11 스킬과 동일 패턴)

목표 경험: `/plugin install sapkit@agentic-sap` → `/sapkit:setup` **한 번**으로
SAP 연결 파일·권한·안전훅·(선택)vsp까지 완료. `skills/`는 `.claude-plugin`·
`.codex-plugin`이 공유하므로(실측) 3사 자동 노출 — 어댑터 전용 단계는 절차 내 분기.

## 1. 배경 (실수요 트리거 — 보류 해제 근거)

- 원본 sc4sap의 `/setup`(12단계 마법사)·`/sap-doctor`는 이식 때 **transform으로 해체**
  (MIGRATION-MANIFEST 40~42행): 내용은 `troubleshooting.md`(12문서 흡수)·어댑터 README
  3벌·`install-hooks.mjs`·`install-sap-assets.md`·`doctor.mjs`에 보존됐으나 **"한 명령이
  순서대로 물어보며 세팅해주는" 대화형 경험은 소실**됐다.
- 5-15 등재(07-22 오전) 시점엔 "ZUNIWHT 도그푸딩 후 설계"로 보류했다.
- **보류 해제 근거**: 같은 날 소유자 실감 발화 2회(① "원본은 setup으로 설치했는데
  없나" ② "배포용으론 너무 불편") = 실수요 트리거 충족 + **JNC 설치가 이 스킬의 첫
  실전 검증장으로 즉시 가용** — 도그푸딩을 기다리는 게 아니라 설치 자체가 도그푸딩이
  된다. 결정 기록 = D-045.

## 2. 마법사 흐름 (설계 정본)

```
/sapkit:setup
 0. 하네스 감지(Claude/Codex/AG) + 플러그인·MCP 연결 확인
    (프로파일 없으면 inspection-only로 뜨는 것 = 정상으로 인지·설명)
 1. 프로파일: ~/.sah/profiles/ 스캔
    → 있으면 목록 제시·선택
    → 없으면 문답(별칭·호스트·클라이언트·SAP_TIER 등 — 키 목록은
      core/project-context.md 정본)으로 sap.env 뼈대 생성.
      SAP_PASSWORD는 빈칸 + "이 파일을 직접 열어 채우세요" 안내 (사용자 결정
      2026-07-22: 비밀은 대화·세션 로그에 남기지 않는다)
 2. 프로젝트 파일 2개 생성:
    .sc4sap/active-profile.txt (별칭 1줄)
    .sc4sap/config.json (sapVersion·abapRelease·activeModules·industry·country 문답)
 3. [Claude] 권한 병합 — adapters/claude/permissions-template.json의 allow를
    프로젝트 .claude/settings.local.json에 **추가-전용 병합**
    (기존 항목 삭제·축소 절대 금지 — D-042 회귀 사고의 교훈을 절차 규칙으로.
     병합 전/후 항목 수를 보고한다)
    [Codex/AG] 해당 어댑터 README의 등가 절 안내 (자동 실행은 비범위)
 4. [Claude] 안전훅 — node <PLUGIN_ROOT>/adapters/claude/hooks/install-hooks.mjs
    --project . (사용자 확인 후 실행)
    [Codex/AG] 어댑터 README 안내
 5. (선택) vsp 오프라인 검증기 — node <PLUGIN_ROOT>/scripts/get-vsp.mjs 제안
 6. 자가 점검 — core/procedures/troubleshooting.md §1 층별 체크 재사용,
    층별 PASS/FAIL/WARN/SKIP 보고로 종료
```

**경로 규약**: 래퍼의 기존 규약(PLUGIN_ROOT = SKILL.md 두 단계 위 — `core/`·`server/`
포함 디렉터리)을 그대로 쓴다. `adapters/`·`scripts/`가 배포 캐시에 포함되는지
구현 시 실측으로 확인한다(미포함이면 해당 단계는 안내형으로 강등 — 정직 표기).

## 3. 안전 규칙

- **R-005**: 자격증명은 파일 뼈대 + 사용자 직접 입력. sap.env는 레포 밖(`~/.sah`).
  마법사는 비밀값을 묻지도, 출력하지도 않는다.
- **권한 병합 = 추가-전용**: 기존 allow 항목을 줄이는 어떤 산출도 금지(D-042).
- **attended**: settings 수정·스크립트 실행은 각 단계 사용자 확인 후.
- **실데이터 2종(GetTableContents/GetSqlQuery)은 템플릿에서 계속 제외** — 기존
  배포 기본값 잠금 정책 불변(D-043은 소유자 머신 예외일 뿐).

## 4. 파급

| 항목 | 처리 |
|---|---|
| 매니페스트 5종 | `gen-plugin-manifests.mjs` 재실행 — 스킬 11→12·절차 16→17 자동 계수 |
| 루트 `CLAUDE.md` | 헤드라인 "절차 16" → 17 (1줄) |
| 어댑터 README 3벌 | 수동 단계 절에 "`/sapkit:setup` 한 번으로 대체 가능" 병기. 스냅샷 게이트 드리프트 검출 시 이 머신(원본 보유)에서 재생성 |
| `DECISIONS.md` | D-045 append (5-15 보류 해제 — 실수요 발화 2회 + JNC 검증장) |
| `HANDOFF.md` | 5-15 상태 갱신 (등재→집행) |
| `interactive/DESIGN.md` | 불변 — 기존 구조(절차+래퍼) 안의 자산 추가, 설계 변경 아님 |
| `MIGRATION-MANIFEST.md` | 불변 — 이식 아닌 신규 저작 (원본 transform 판정도 불변) |

## 5. 검증 / 완료 기준

1. 게이트 전량 green — 특히 `gen-plugin-manifests --check`·`check-links`·
   `check-migration-snapshot`·`smoke-mcp`(무영향 확인).
2. **실전 E2E = JNC 프로젝트에 이 스킬로 실제 설치** — 첫 검증이자 도그푸딩.
   여기서 나오는 마찰은 즉시 수정하고 기록한다.
3. 새-컨텍스트 독립 리뷰 1회 (이 레포 품질 모델 — 구현 후).

## 6. 비범위 (YAGNI)

- Codex/Antigravity 전용 단계의 **자동 실행** (안내만 — 실측 후 후속).
- 원본 12단계 마법사의 전체 복원 (필요 단계만 — 나머지는 troubleshooting이 이미 보유).
- `gen-permissions.mjs` 재생성 로직 변경 (inspection-only 기동 문제는 별건 잔여).
- SAP측 자산 설치(`install-sap-assets.md`) 자동화 — 기존 절차 포인터로 충분.
