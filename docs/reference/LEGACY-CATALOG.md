# LEGACY-CATALOG — 레거시 아티팩트 분류 정본

> 작성 2026-07-16 (로드맵 S2-C · D-027). 기계 판독 정본은
> `adapters/final-harness/legacy-phase-policy.json`. 이 문서는 사람이 읽는 분류표다.

## 왜 이 문서가 있나

트랙 A의 축이 **phase에서 run으로** 바뀌었다(D-027 / 로드맵 S2-B). 그래서 `phases/**`에
남은 것들은 **작업 대기열이 아니라 증거 보관소**다. 이 구분이 흐려지면 두 가지 사고가
난다:

1. 누군가 `python scripts/execute.py <phase>`를 실행한다 — **AGENTS.md 금지 행위**.
2. 씨앗 phase의 미완 상태를 "실패·미완료"로 오독하고 "고치려" 든다 — 실은 **리뷰
   게이트가 의도대로 차단한 성공 증거**다.

## 처분 원칙 (요약)

| 항목 | 정책 |
|---|---|
| phase 축 | **폐기(retired)** — D-027 / S2-B |
| 실행 | **거부** — `scripts/run-track-a.ps1`이 exit **64 `LEGACY_PHASE_DENY`** |
| raw `execute.py` | **금지** — 어떤 표면도 안내하지 않는다 |
| 보존 | **유지(keep)** — 실측 증거다. 미완 status도 결말의 증거 |
| 수정 | **금지** — `phases/**` byte diff 0 (재기준 v2 §11 · 로드맵 S0/S2 합격 기준) |

## phases/** 분류

| phase | 상태 | 정체 | 오독 주의 |
|---|---|---|---|
| `0-example` | pending | 설치기가 배포한 **데모** | 우리 작업이 아니다. 실행하지 않는다 |
| `1-workdays-util` | 완료 | Phase 1 — 엔진 첫 완주(2 steps) + Phase 1.5 red/green 서버 실증(스텁 5 FAIL → 최종 5 PASS) | — |
| `2-duedate-reuse` | 완료 | Phase 2 — 답사→계획 변경 기록 + connected 채점 5 PASS/0 FAIL. CLAS 배포 결함 3건 발굴 | — |
| `3a-carrflt-seed` | **미완 (의도)** | **씨앗 결함 phase** — INNER JOIN 결함 주입. 리뷰 게이트 **3회 전부 FAIL**로 write 미도달 | ⚠️ **결함이 아니라 AC5 성공 증거**. 산출물은 `feat-3a-carrflt-seed`(2f5d2a2)에 봉인, main 미병합 |
| `3b-carrflt-gated` | 완료 | Phase 3 정상 경로 — 리뷰 PASS → 에스코트 E1~E4 + SE80 drift 검출 D1~D2 전부 통과. 원로그 `scoring-raw.md` | RV4 음성 대조(E1·D3)의 근거가 여기 있다 |
| `4-glopen-recon` | 완료 | Phase 4 CONSULT 답사 — 팩 전/후 결정 델타 5건(완료 기준 ① 증거) + ACDOCA/RLDNR 함정 발견 | — |
| `4a-glopen-seed` | **미완 (의도)** | **씨앗 결함 phase** — BSEG 결함 주입. 리뷰 **3회 전부 FAIL**(BSEG→ACDOCA를 file:line 적중) | ⚠️ **성공 증거**. `feat-4a-glopen-seed`(646c691) 봉인, main 미병합 → **main의 `phases/index.json`에 4a가 pending으로 남는 것이 정상** |
| `4b-glopen-gated` | 완료 | Phase 4 정상 경로 — ACDOCA·`rldnr='0L'` → 리뷰 PASS → main 병합(55b4ea3) → 에스코트 E1~E4 통과 | L-002 → FI-002 → R-007 승격의 근거 |

## 동결 싱글턴

| 파일 | 상태 |
|---|---|
| `.harness/GOAL.md` | **동결(legacy)** — 내용 보존. 신규 작업은 여기 쓰지 않는다 |
| `.harness/STATE.md` | **동결(legacy)** — 동일 |

어떤 신규 모드도 이 두 파일에 쓰지 않는다(AGENTS.md). 신규 작업의 상태는
`.harness/runs/<run-id>/` 아래에 산다.

## 구 문서·스펙의 위치

| 문서 | 상태 |
|---|---|
| `docs/reference/designs/2026-07-13-unattended-review-gate.md` | 역사 스펙(D-021) — 리뷰 게이트의 원설계. 현행 계약은 로드맵 S2-B + `review-verdict.schema.json` v2 |
| `docs/reference/designs/2026-07-14-track-a-v019-rebase.md` | 초안 — v2 설계서가 대체 |
| `docs/reference/designs/2026-07-15-track-a-rebase-v2.md` | **Policy는 유효**(D-025). 단 candidate·실행순서는 D-027이 대체(문서 헤더에 supersede 주석) |
| 07-15 리뷰 기록 2건 | 작성 시점 증거 — 갱신하지 않는다 |
| `DESIGN.md` Phase 5 · §16 | D-027 supersede 경고 부착 — 실행 지시로 쓰지 않는다 |

## 새 작업은 어디로

```
계획·계약   .harness/runs/<run-id>/contract.md · manifest.json
리뷰 판정   .harness/runs/<run-id>/review-verdict.json   (schema v2)
검증 증거   .harness/runs/<run-id>/verification.json
Engine 진입 scripts/run-track-a.ps1 -RunId <id> [-Candidate]
```

현재 Engine은 **fail-closed**다 — lock의 `candidate.state=selected`(staged 아님)이므로
wrapper가 exit **65 `ENGINE_UNAVAILABLE`**로 거부한다. S4(독립 리뷰 + disposable
staging) 통과 전에는 실행 경로가 열리지 않는다.
