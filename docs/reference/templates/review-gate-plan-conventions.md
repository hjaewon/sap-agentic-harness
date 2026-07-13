# 리뷰 게이트 — harness-plan 배선 관례

> harness-plan으로 phase를 계획할 때 **리뷰 스텝을 게이트로 성립시키는** 배선 규약.
> 스펙 정본: `docs/reference/designs/2026-07-13-unattended-review-gate.md`. 스텝 지시문
> 템플릿: `review-step.md`. verdict 계약: `review-verdict.schema.json`. 검사기 실체:
> `scripts/check-review-verdict.ps1`(**병렬 작업자가 별도 구현** — 여기서는 경로·핀
> 플레이스홀더로만 참조하고 내용에 의존하지 않는다).
>
> 이 파일은 `docs/*.md`(비재귀) 주입 글롭 밖이라 매 스텝에 주입되지 않는다 — 계획
> 시점 참조용이다.

## 1. 리뷰 스텝 배치 규칙 (Decisions #3)

`phases/{p}/index.json`의 steps를 다음 순서로 구성한다:

```
impl 스텝들  →  [리뷰 스텝]  →  vsp write 스텝들
```

- 리뷰 스텝은 **모든 impl 완료 후 · 첫 vsp write(deploy/copy) 스텝 직전**에 넣는다.
- 근거: FAIL이면 게이트가 write 스텝 도달을 막아 **SAP 무접촉으로 정지**한다. 첫 write
  전이라 FAIL 시 SAP에 흔적이 남지 않는다.
- 리뷰 스텝의 지시문은 `review-step.md`를 복사하고 `{N}`·`{p}`·`{TYPE}`/`{NAME}`/
  `{PROG}` 플레이스홀더를 채워 `phases/{p}/stepN.md`로 쓴다.

## 2. 리뷰 스텝의 verify 명령 (게이트 본체)

게이트 차단력의 전부는 **리뷰 스텝 자신의 verify 명령 exit code**다(엔진 무수정 — D-018).
verify 명령은 아래 형태로 계획에 넣는다 — `<PIN-64HEX>`와 `{p}`는 플레이스홀더:

```json
"verify": "powershell -NoProfile -Command \"$s='scripts/check-review-verdict.ps1'; if ((Get-FileHash $s -Algorithm SHA256).Hash -ne '<PIN-64HEX>') { Write-Output 'CHECKER_TAMPERED'; exit 1 }; & $s -Phase {p} -Verdict phases/{p}/review-verdict.json\""
```

두 부분으로 읽는다:

- **sha256 핀 가드** — 위임 검사기 `scripts/check-review-verdict.ps1`의 해시를
  `<PIN-64HEX>`와 대조해 불일치면 `exit 1`. verify 스냅샷은 **명령 문자열만**
  보호(execute.py:314-324)하고 위임 스크립트 변경은 WARN뿐(:614-618)이라, 핀이 없으면
  세션이 검사기를 변조할 수 있다(필수 조항 #2).
- **검사기 호출** — `-Phase {p} -Verdict phases/{p}/review-verdict.json`. 검사기가
  ① `verdict=="PASS"` → ② `reviewed_head == 현재 HEAD` → ③ 등식형 dirty 검사(아래) 순으로
  판정하고 하나라도 어긋나면 `exit≠0`. exit≠0 → 엔진 재시도 3회 → error·`sys.exit(1)` →
  **write 스텝 미도달**.

검사기 내부 판정 로직은 병렬 작업자가 구현한다. 계획은 **경로와 핀만** 알면 되고 내부에
의존하지 않는다.

### 등식형 dirty 검사 (검사기가 수행 — 계획이 알아야 할 계약)

검사기는 bookkeeping 제외 집합을 뺀 dirty 파일 집합이 **정확히 `{review-verdict.json}`**
하나와 같은지 본다(공집합·초과 모두 FAIL). 제외 집합(스펙 필수 조항 #1, 개정은 스펙으로만):

```
phases/{p}/index.json
phases/{p}/step*-output.json
phases/{p}/run-summary.json
phases/{p}/run-history.jsonl
.harness/**
```

이로써 (a) 커밋에 실려 온 stale PASS(이번 시도 dirty 없음)와 (b) 리뷰어의 코드 몰래
수정(verdict 초과 dirty)이 둘 다 차단된다.

## 3. verdict 파일명 규칙 (한 줄 근거)

verdict 파일은 반드시 **`review-verdict.json`** — `step[0-9]*.md` 글롭을 피한다. 이유:
엔진이 세션이 생성한 `step*.md` 파일을 삭제·원복하므로(execute.py:499-521) 그 글롭에
걸리는 이름이면 verdict가 사라진다. `.json`은 프롬프트 주입 표면도 아니다.

## 4. 핀 갱신 절차

`scripts/check-review-verdict.ps1`이 바뀌면(1바이트라도) 기존 `<PIN-64HEX>`와 불일치해
모든 리뷰 스텝이 `CHECKER_TAMPERED`로 exit 1 한다. 검사기 변경 시:

1. 새 해시 계산:
   ```powershell
   (Get-FileHash -Algorithm SHA256 scripts/check-review-verdict.ps1).Hash
   ```
   (출력은 대문자 64-hex. PowerShell `-ne` 비교는 대소문자 무시라 케이스는 무관.)
2. 계획의 리뷰 스텝 verify 명령에서 `<PIN-64HEX>` 자리를 이 값으로 교체.
3. 이후 phase 계획은 갱신된 핀을 쓴다.

## 5. 에스코트 조항 (Decisions #5) — 요약

씨앗 시맨틱 결함(INNER→LEFT JOIN 급)을 게이트가 **라이브에서 실제 FAIL로 차단함을 1회
실증**하기 전까지, gated write 스텝은 **사람이 셰퍼딩**(에스코트 기간 write는 운영자가
수행)한다. 실증 후 무인 전환. 즉 리뷰 스텝·검사기·verify 배선은 지금 계획에 넣되, 첫
write 자동 실행은 실증 게이트를 통과할 때까지 보류한다.

## 6. 이 게이트가 건드리는 파일

| 파일 | 역할 | 소유 |
|---|---|---|
| `docs/reference/templates/review-step.md` | 리뷰 스텝 지시문 템플릿 | 이 산출물 |
| `docs/reference/templates/review-verdict.schema.json` | verdict 파일 계약 | 이 산출물 |
| `phases/{p}/stepN.md` | 계획이 생성하는 실제 리뷰 스텝 | harness-plan |
| `phases/{p}/review-verdict.json` | 리뷰 세션이 쓰는 판정 | 리뷰 세션 |
| `scripts/check-review-verdict.ps1` | 위임 검사기(sha256 핀 대상) | **병렬 작업자** |

## 7. 실패 phase 잔존물 정리 (계획 관례)

엔진은 최대 재시도 소진 후 실패 스텝을 `wip({phase})` 커밋으로 기록한 **다음**
`_run_replan`으로 `phases/{p}/replan-proposal.md`를 쓴다(execute.py:2712→2716) — wip
커밋의 `git add -A`가 이미 지나간 뒤라 이 파일은 **untracked로 잔존**한다. 이 잔존물이
다음 phase 실행 때까지 남아 있으면, 그 phase 리뷰 스텝의 등식형 dirty 검사(위 2절)가
`{review-verdict.json}` 외의 초과 dirty로 오판해 **오탐 FAIL**을 낸다(fail-closed 방향
이라 안전은 유지되나 재시도 3회 소음 — AC3 재현 실측, 2026-07-13).

**계획 관례**: 실패한 phase 다음에 새 phase를 계획·실행하기 전, 이전 phase의
`replan-proposal.md`를 검토 후 **커밋하거나 삭제**해 정리한다.

제외 집합(위 2절)을 확대해 흡수하는 대안은 택하지 않았다 — `replan-proposal.md`는
`phases/{p}/` 아래 임의 phase 경로에 남는 파일이라, 이를 제외 집합에 넣으면 **타 phase
경로를 통한 주입 표면**이 되어 등식형 검사의 초과-dirty 차단력을 정면으로 우회한다.
정리는 계획 관례로 맡기고, 차단력은 검사기 쪽에 그대로 남긴다.
