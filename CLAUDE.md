# CLAUDE.md — sap-agentic-harness

## 세션 시작 (필수)

1. **`HANDOFF.md`를 먼저 읽는다** — 프로젝트 전체 상태·재개 지침·백로그의 정본.
2. 필요 시 트랙 설계 정본: 트랙 A = `DESIGN.md`(루트), 트랙 B = `interactive/DESIGN.md`.
3. 과거 결정의 '왜'는 `docs/DECISIONS.md` (append-only 결정 로그).

## 문서 계약 — 갱신까지가 작업의 일부 (커밋 전 확인)

| 문서 | 갱신 시점 |
|---|---|
| `HANDOFF.md` | **상태가 바뀔 때마다** (설치·검증·백로그 증감·머신 환경) |
| `docs/DECISIONS.md` | 대안을 기각한 굵직한 결정 발생 시 **append** (수정·삭제 금지, 정정도 새 항목) |
| `DESIGN.md` · `interactive/DESIGN.md` | 해당 트랙의 **설계가 변경될 때만** (상태 변화로는 갱신하지 않음) |
| `interactive/MIGRATION-MANIFEST.md` | 원본 파일 분류 변경 시 — 분류 변경은 이 파일 수정으로만 |

불변 규칙 전체(동결 레포·private denylist·번들 보호·실데이터 승인 등)는 **HANDOFF §8**.

## 게이트 (구조 변경 시 항상 통과 상태 유지)

```bash
node interactive/scripts/check-migration-coverage.mjs   # 미분류 0 (경고 exit 2는 비차단)
node interactive/scripts/check-links.mjs interactive     # 깨짐 0
node interactive/server/verify-engine.mjs                # 번들 무결성 OK
node interactive/scripts/smoke-mcp.mjs                   # tools 155 (무프로파일)
```

git push는 사용자 판단 — 커밋까지만 하고 push는 요청 시에만.
