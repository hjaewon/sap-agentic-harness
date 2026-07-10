# L0 실측: Codex·Antigravity CLI 플러그인 표면 (2026-07-10)

DESIGN.md §5-4 미결 1·2의 실측 기록. 로컬 머신(Windows 11)에서 직접 실행한 결과다.

## Codex CLI 0.144.1 (`codex plugin`)

```
codex plugin add|list|marketplace|remove
```

- 마켓플레이스 기반 설치: 루트에 `.agents/plugins/marketplace.json`, 플러그인은 `plugins/<name>/`.
- **매니페스트 실측** (`openai-bundled/plugins/visualize`): `.codex-plugin/plugin.json` —
  `name/version/description/author/license/keywords` + `"skills": "./skills/"` +
  `interface{displayName, capabilities, ...}` (스토어 표시용).
- 스킬 구조: `skills/<name>/SKILL.md` (+ agents/, assets/, scripts/ 동봉 가능) —
  **Claude 플러그인과 사실상 동형**. `.claude-plugin/plugin.json` ↔ `.codex-plugin/plugin.json`
  변환은 필드 매핑 수준.
- MCP 등록은 별도 `codex mcp` 서브커맨드도 존재 (`~/.codex/config.toml` 관리).

**§5-4 미결 1 해소**: 매니페스트 스키마 실측 완료. adapters/codex는
`.codex-plugin/plugin.json` + `skills/` 래퍼 + marketplace.json 1장으로 구성한다.

## Antigravity CLI (agy) 1.0.7 (`agy plugin`)

```
agy plugin list | import [source] | install <target> | uninstall | enable | disable
           | validate [path] | link <mp> <target>
```

- **`agy plugin import` — "Import plugins from gemini or claude"**: Claude 플러그인을
  직접 임포트하는 공식 경로가 존재한다. → **L5의 유력 경로: adapters/claude를 만들고
  agy import로 가져온 뒤, 변환 결과를 검증·보정하는 방식.** 전용 Antigravity 플러그인을
  손으로 만드는 것보다 비용이 낮을 가능성이 높다. L5 착수 시 import 결과물(스킬·훅·MCP
  설정이 어떻게 매핑되는지) 실측이 첫 작업.
- `agy plugin validate [path]` — 어댑터 CI 스모크에 사용 가능.
- `--sandbox`, `--dangerously-skip-permissions` 플래그 존재 — L3 안전모델 매핑 시 참조.
- 현재 임포트된 플러그인 0개 (깨끗한 상태).

**§5-4 미결 2 진행**: CLI 표면은 1.0.7 기준 실측 완료. rules/workflows 파일 경로·한도
(12,000자)는 문서 기준이며 L5 착수 시 재검증.

## 설계 영향

1. 어댑터 3벌의 "동형 플러그인" 전제가 실측으로 확정됨 (Claude ↔ Codex 매니페스트 필드 매핑).
2. Antigravity 어댑터는 "신규 제작"이 아니라 "**Claude 어댑터 import + 보정**" 경로를
   1순위로 검토한다 — DESIGN.md §4-2의 antigravity 절은 L5에서 이 실측으로 갱신 예정.
3. `compatibility.json` 초기값: codex-cli 0.144.1, agy 1.0.7.
