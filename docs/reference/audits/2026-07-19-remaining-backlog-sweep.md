# 잔여 백로그 전수 조사 + 스프린트 배치 (2026-07-19)

> 소진 스프린트(사용자 지시 "5-12 제외 몽땅")의 W0 정찰 산출물 — 정본.
> 조사 방법: HANDOFF 전체 · .harness/STATE.md · 층1~3 감사 · UPSTREAM-FIX-HANDOFF
> Known-remaining · DECISIONS D-018~D-021 · phases/3-review-gate 정독 +
> `잔여|후속|후보|대기|미실측|미검증|재검토|재론` 전역 grep 교차 확인.
> 배치(Wave)는 스프린트 오케스트레이터 판정. 진행 상태는 이 파일이 아니라
> `.harness/GOAL.md`·STATE.md가 정본.

## A. 실행 가능한 잔여 작업 (24) — Wave 배치

| # | 요약 | 출처 | 크기 | 배치 |
|---|---|---|---|---|
| 1 | Phase 3 리뷰 게이트 실장(harness-plan 경유, AC-1~15·AC-8 실증) | HANDOFF 헤더·DESIGN §13·스펙 §10 | 대 | **W1·W2** |
| 2 | Phase 3 완료 기준에 실데이터 RFC E2E 편입 여부(층3-⑤) | 층3 감사 §6-2 | 소 | **사용자 결정 목록**(승인 설계 변경) |
| 3 | CLAS 테스트 include 배포 미실측("Phase 3에서 계속") | DESIGN §14-4 | — | **W2** 채점 중 프로브(불가 시 정직 기록) |
| 4 | 11-⑩ Delete 로컬 4종 상시 실패 — 설계 판단+수리 | HANDOFF §6·KR#1 | 중 | **W3** (조사 진행 중) |
| 5 | 11-⑦ RFC-backed write 4종 별개 병리 | HANDOFF §6·KR#4 | 중 | **W3** (A-12와 연계) |
| 6 | 엔진 백로그 2 — `.sc4sap/` 폴더명 configurable화(D-004 후속) | HANDOFF §6 | 중 | **W3** |
| 7 | add-if-missing description GET 비직렬화 규명 | HANDOFF 11-⑧·KR#5 | 소 | **W3** (조사 진행 중) |
| 8 | /checkruns stale 관찰 — 종결 기록 | HANDOFF 11-⑪·KR#8 | 극소 | **W3** 문서 기록 |
| 9 | CreateProgramLow 타입치환 뿌리 공유 — 판정 | KR#2 | 소 | **W3** 판정(수리/근거 기각) |
| 10 | Low wrapper 전체체인 stateless 누수(미도달) — 방어 수정 여부 | KR#3 | 소 | **W3** 판정 |
| 11 | Low unit-test cloud 전용 무동작 파라미터 4종 광고 정리 | HANDOFF §6·KR#6 | 소 | **W3** (조사 진행 중) |
| 12 | WriteTextElementsBulk E2E — soap 전환+ZMCP FM 설치(install-sap-assets 절차) | HANDOFF §3·§4.1 | 중 | **W3 스트레치** — MCP 경유 시도, 진짜 수동 단계 봉착 시 정직 중단·보고 |
| 13 | Codex launch.cjs 이름 보존형 tools/list 필터 검토 | §5-8·codex README | 중 | **W5** 판정(구현/근거 유보) |
| 14 | AG excludeTools 1회 실측 → "실증" 승격 | §5-8·AG README | 소 | **W5** (agy enable→프로브→disable) |
| 15 | required_capabilities 선언+프리셋 자동검사 [낮음] | §5-8 | 중 | **W5** 판정 |
| 16 | smoke-mcp write 판정 카탈로그 기반 개선 [낮음] | §5-8 | 소 | **W5** |
| 17 | review-result.schema description 구 계약 서술 정정 | §5-10 잔여 | 소 | **W5** |
| 18 | vsp RenameObject 잠금누수 수리의 라이브 재현 검증 | STATE 07-12·COMMANDS ⑤-6 | 소 | **W3** 라이브 배치 |
| 19 | vsp transport list/get 1회 실측(read-only) | COMMANDS §④ | 소 | **W2** 채점 배치 |
| 20 | ATC Error급 finding의 exit 거동 실측 | VERIFY-PATTERNS §②-4 | 소 | **W2** 채점 배치(의도 Error 샘플) |
| 21 | VERIFY-PATTERNS §②-1 "Error 4종" vs 실측 6종 정합(재실측 후) | 층3 감사 §6-3 | 소 | **W5** (offline lint 재실측 동반) |
| 22 | layer2 잔여#2 — Tier-3 자동로딩 트리거 편입 설계 판단 | 층2 감사 §7-2 | 소 | **W5** 판정 |
| 23 | DESIGN §14 미결 표 — 경과·판정 항목 체크 반영(①⑤⑥⑦⑧) | DESIGN §14 | 소 | **W5** 판정(§14 기존 ✅ 선례 확인 후) |
| 24 | packs Phase 4 — FI/CO 이중 구조 팩 | HANDOFF 헤더·DESIGN §12·§13 | 대 | **W4** (인벤토리 진행 중) |

## B. 사용자 판단 유보 (실행 금지 — 스프린트 말 보고)

1. 동결 sc4sap-custom 드리프트 1파일(` M docs/skill-model-architecture.md`) 정리.
2. `vsp install abapgit` 실행·verify 사다리 편입 — **사용자 지시로 실행 금지**.
3. 엔진 3-8 abapunit Cloud API 병행 지원 — 온프레미스 포크 정체성 판단.
4. (A-2 이월) Phase 3 완료 기준에 실데이터 RFC E2E 편입 — 승인 설계 변경.

## C. 트리거 대기 (실행 불가 — 조건 명시 보고)

| 항목 | 트리거 |
|---|---|
| --mcp 서비스키 tier 기본값 재검토 | 서비스키 운용 시작 전 |
| sap-reviewer disallowedTools 라이브 실증 | 다음 create-program 완주 시 |
| 주 머신 install-hooks --project 재실행 | 주 머신 세션 재개 시 |
| D-018 재론(vsp 편입) | 2-레포 마찰 3회 실증 시 |
| Codex 드라이버 리뷰어 설정 실측 | Codex 무인 운용 시작 전 |
| vsp 서버측 CAS | 다중 사용자·QA+ tier 확장 시 |
| ADR-002 재배치 | vsp CLAS 테스트 include 배포 지원 시 |
| ENV_FAIL 비-락 403 표 추가 | 재현 시 |
| vsp export 기반 drift 재평가 | export WebSocket 403 해소 시(외부) |
| DCL 등 EN 하드코딩 | 도달 가능/영향 실증 시 |
| DeleteStructure read-back 승격 | no-op 2xx 실측 시 |
| WriteTextElementsBulk KR-DEV 재실행 | KR-DEV 복구 시(대안=A-12) |

## 제외 확인

5-12(claude-final v0.20 흡수)와 그 트리거 대기, 외부 레포 업스트림 기여(vsp-custom
자체·claude-final·tdd-guard 템플릿)는 지시대로 전 목록에서 제외 — 외부 상태가 이
레포 판단에 영향을 주는 부분만 B/C에 반영.
