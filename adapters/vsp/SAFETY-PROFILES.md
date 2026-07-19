# vsp 안전 프로파일 정본 — SAFETY-PROFILES.md

## ① 헤더 (실측 근거·좌표)

- **문서 목적**: DESIGN.md §8.4가 요구한 "서사가 아니라 실행 가능한 수준"의
  모드별 허용/차단 allowlist + 차단 동작 검증 절차. §13 Phase 3(Gated Deploy)의
  첫 완료 요건 산출물이다.
- **작성·프로브 실측 일자**: 2026-07-19
- **vsp 버전**: `vsp version v2.38.1-94-g5a8bedb (commit: 5a8bedb, built:
  2026-07-18T02:53:23Z)` — `adapters/vsp/vsp.lock.json` `verified_commit`·바이너리
  sha256·`--version` 일치 재확인(§⑨ 프로브 실행 전 확인).
- **프로브 대상**: 더미 호스트(`https://dummy.invalid:44300`) — **실 SAP 무접속·
  write 무수행**. write 게이트가 네트워크 dial 이전에 거부하므로 오프라인으로 재현된다.
- **참조 좌표**: DESIGN.md §8(실행 모드 3종)·§13 Phase 3 · 리뷰 게이트 스펙
  `docs/reference/designs/2026-07-17-phase3-review-gate.md` §5·§7 · `adapters/vsp/
  vsp.lock.json` write_profile_gate/reverification · `adapters/vsp/COMMANDS.md` §②·§④ ·
  `adapters/vsp/VERIFY-PATTERNS.md` §④ · `.harness/RULES.md` R-002·R-003·R-005·R-006.
- **기계 강제 원천**: vsp-custom `5a8bedb` 신설 write 게이트 —
  write 가능 서브커맨드가 `getWriteClient = enforceWriteProfile()+getClient` 경유로
  **네트워크 호출 이전** `SAP_READ_ONLY`/`SAP_TIER`를 검사(거부 시 dial 없음).
  read 명령은 `getClient` 직접 사용이라 무영향.

---

## ② 명령 분류 (COMMANDS.md 실물 명령명)

vsp write 게이트가 다루는 경계선이 곧 이 분류다. 근거: vsp.lock.json
write_profile_gate._comment + spike-evidence part_b gate_mechanism.

- **write 계열 (게이트 대상 — dial 이전 거부)**: `deploy` · `copy` · `execute` ·
  `install`(abapgit/zadt-vsp) · `source write` · `source edit` ·
  `recover-failed-create`.
- **read 계열 (게이트 무영향 — 그대로 실행)**: `system info` · `lint`(`--file`
  오프라인 및 `<TYPE> <NAME>` 연결 fetch) · `parse --file` · `atc <type> <name>` ·
  `test [type] [name] [--package]` · `health --package` · `source read` ·
  `source context` · `search` · `grep` · `boundaries`.
- **실데이터 추출 (별도 상시 게이트 — write 게이트 밖)**: `query`(SQL row
  extraction). read op라 write 게이트가 막지 않는다 — 차단은 정책+감사 등급(§⑦).
  DESIGN.md §8.2 "테이블 데이터 row extraction은 별도 승인 없이 금지".
- **transport 계열**: `transport list`/`get`(조회) — read. `transport release`(CTS
  릴리스) — write 게이트 미커버(§⑤·§⑦).

---

## ③ 모드별 프로파일 (3종 + 배포 래퍼)

| # | 프로파일 | env 설정 | 자격증명 소재 | 허용 명령 | 차단 명령 | 사용 경로 |
|---|---|---|---|---|---|---|
| ① | **offline** | SAP_* 부재 | 없음 | `lint --file` · `parse --file` (완전 오프라인) | 그 외 전부 — 연결 필요 명령은 **자격증명 부재로 SAP 미도달**(ENV_FAIL) | 무인 워커 authoring 스텝 · 리뷰어 세션(클린 allowlist env, SAP_* 미전달) |
| ② | **read-only online** | `SAP_READ_ONLY=true` | 프로세스 스코프 주입 | read 계열 전부: `system info`·`lint`·`parse`·`atc`·`test`·`health`·`source read`·`source context`·`search`·`grep`·`boundaries` | write 계열 전부(`deploy`·`copy`·`execute`·`install`·`source write`·`source edit`·`recover-failed-create`) = 게이트 pre-network 거부 · `query`(정책 차단) | `scripts/verify-sap.ps1` 기본 실행 · read-only 계획/분석 세션(DESIGN §8.2) |
| ③ | **gated write** | `SAP_TIER=dev` · `SAP_READ_ONLY` 미설정 | 배포 래퍼 프로세스 스코프만 | read 계열 + write 계열(게이트 통과) — 단 대상 package는 allowlist(§④) 한정 | dev 외 tier의 write(R-003, §⑨ 프로브 2) · allowlist 밖 package로의 write · `transport release`(대화형만, §⑤) | 배포 스텝 래퍼 실행 경로 **전용**: `scripts/verify-sap.ps1 -Write` 또는 `. scripts\vsp-env.ps1 -Write` |

**정밀 주석 (오해 방지 — DESIGN §8.4·VERIFY-PATTERNS §④):** 무인 워커의 authoring
서브프로세스 **자신**은 SAP_* 를 갖지 않는다(§8.4 "offline/read-only phase 무인 세션
환경에서는 자격증명 제거"). 즉 워커 스텝의 실제 바닥은 **① offline**(credential-absence
floor)이다. **② read-only online**은 자격증명이 read-only로 조달되는 경로 — 즉
`verify-sap.ps1`가 자기 프로세스 안에서 self-provision하는 verify 스텝과 대화형
read-only 세션 — 의 프로파일이며, 워커 세션 env에 직접 주입되지 않는다. `execute.py`가
`{**os.environ}`로 자식에 부모 env를 전량 상속시키므로, 엔진 기동 셸에 SAP_*가 없어야만
이 분리가 성립한다(§⑧).

---

## ④ package allowlist

- **현행 = `$TMP` 한정** (파일럿). IDES-DEV(dev tier), 생성물 `ZSAH*_` 프리픽스 —
  COMMANDS.md §①·부록.
- **규칙**: allowlist에 명시되지 않은 package를 대상 인자로 하는 write(`deploy <file>
  <package>` / `copy … --to <package>`)를 금지한다. allowlist에 없는 package = write
  불가.
- **확장 절차**: 대상 package를 이 절 목록에 append + 그 시스템이 dev tier임을 확인
  (R-003). package 화이트리스트는 현재 vsp 게이트가 **기계 강제하지 않는다** — 대상
  package 인자 검사는 배포 래퍼/harness-plan 계획의 책임이므로 **절차+감사 등급**(§⑦
  정직 표기).

---

## ⑤ transport 정책

- **현행 `$TMP` = local object → transport 불요**. 생성물이 `$TMP` 로컬 오브젝트라
  CTS(transport)를 개입시키지 않는다(COMMANDS.md 부록 — `$TMP` 잔존 객체는 transport
  없이 생성).
- **`transport list`/`get`(조회)**: 무인 자동화에 불필요 — 무인 세션 미배치(COMMANDS.md
  §④ "이번 실측 범위 밖"). 필요 시 대화형 read-only로만.
- **`transport release`(CTS 릴리스)**: vsp write 게이트가 커버하는 서브커맨드 목록에
  **없다**(vsp.lock write_profile_gate._comment 열거 밖 · reverification "CTS/transport는
  잠금 획득 없음·상태 필드만"). 따라서 release는 **기계 차단이 아니라 대화형 절차로만**
  수행하며(§⑦ 절차+감사 등급), 무인 런의 계획에 release 스텝을 배치하지 않는다.

---

## ⑥ spec 승인 게이트 (무인 런)

- 무인 런에서 **"spec 승인" = harness-plan 계획 동결(사람 승인)**이 gated write 진입의
  유일 조건이다. 승인된 계획의 배포 스텝 실행 경로에서만 gated write 프로파일(③)이
  공급된다.
- 리뷰 게이트 스펙 §4.0: 리뷰 캡슐이 **승인 기준/스펙 사본**을 동봉하고, 스펙 버전이
  **캡슐 해시**에 반영된다 — 스펙·정책 변경 = 새 해시 = 재리뷰(낡은 PASS 재사용 불가,
  스펙 §5-8). 즉 스펙 승인은 캡슐 해시 바인딩으로 write 직전까지 전파된다.

---

## ⑦ 기계 강제층 매핑 (정직 표기 — 스펙 §2 Non-Goals)

어느 차단이 **기계 강제**(vsp CLI write 게이트 — dial 이전 거부)이고 어느 것이
**절차+감사 등급**(파일시스템/정책 우회 가능)인지 구분한다.

| 차단 대상 | 강제 등급 | 근거 좌표 |
|---|---|---|
| `deploy`·`copy`·`execute`·`install`·`source write`·`source edit`·`recover-failed-create` | **기계 강제** — write 게이트가 `SAP_READ_ONLY` truthy 시 dial 이전 거부 | vsp-custom 5a8bedb · lock v2.38.1-94 write_profile_gate · §⑨ 프로브 1 · spike part_b |
| 위 write를 dev 외 tier에서 시도 | **기계 강제** — `SAP_TIER≠dev`(비어있지 않음) 시 거부 | R-003 · §⑨ 프로브 2 · spike refusal_marker_tier |
| `query` (실데이터 row extraction) | **절차+감사** — write 게이트는 read op를 막지 않음. 무인 워커는 credential-absence floor(① offline)로 실접속 불가하나, 자격증명이 있는 read-only 세션에서는 CLI 실행 가능 → 승인 정책+감사로만 차단 | DESIGN §8.2 · §② |
| `transport release` | **절차+감사** — 게이트 미커버. `$TMP` local이라 현행 무관, 대화형 절차로만 | §⑤ · vsp.lock reverification |
| allowlist 밖 package로의 write | **절차+감사** — 게이트는 package 화이트리스트 미강제; 래퍼/계획 책임 | §④ |
| 파일시스템 우회(워커가 자격증명 파일 직접 read / PASS 레코드 위조) | **절차+감사** — OS 수준 격리 아님(워커·래퍼 동일 FS/OS 계정). run 로그·git 이력·SAP 변경 이력으로 사후 감사 | 스펙 §2 · §5-4 |

---

## ⑧ 자격증명 스코핑 규칙 (DESIGN §8.4)

- **gated write phase 세션에만 주입**: 자격증명은 배포 스텝 래퍼(`verify-sap.ps1
  -Write` / `vsp-env.ps1 -Write`)의 **자기 프로세스에만** 스코프된다 —
  `powershell -File`로 자식 프로세스 실행이라 부모 셸·다른 워커 스텝에 전파되지 않는다
  (VERIFY-PATTERNS §④ "배포 스텝 래퍼 관례").
- **무인 read-only/offline 세션 미공급**: 엔진 기동 셸에 SAP_*가 없어야 한다 — 사전
  dot-source 금지. `execute.py`가 워커/verify/advisory 서브프로세스에 부모 env를 전량
  상속(`{**os.environ}`)하므로, 기동 셸에 SAP_*가 없어야만 워커 스텝이 SAP에 닿지
  못한다(§8.4 · VERIFY-PATTERNS §④ "엔진 기동 셸 관례").
- **리뷰어 세션**: 클린 allowlist env로 스폰, SAP_* 미전달(스펙 §5-3). 실측:
  spike-evidence part_a "reviewer received only the 9 allowlisted vars, no SAP_*
  connection vars".
- **`.env`·자격증명 파일 커밋 금지 (R-005)**: `.gitignore`에 `.env` 등재 확인됨
  (line 2). 프로파일 값의 원천은 `<sc4sap home>\profiles\<name>\sap.env`(레포 밖);
  비밀번호는 `keychain:` 참조 시 Windows Credential Manager에서 조달하며 스크립트는
  시크릿을 출력/기록하지 않는다(vsp-env.ps1).
- **write 후 확인 (R-006)**: gated write 이후 `vsp source read <TYPE> <NAME>`로 반영을
  대조한다(CLAS 거짓 성공 실증 이력 L-001). 현행 lock v2.38.1-94 ≥ v2.38.1-89 이므로
  CLAS deploy/copy 허용 조건 충족.

---

## ⑨ 검증 절차 (실행 가능한 재현 명령)

### 프로브 방식 (오프라인 — 실 SAP 무접속)

더미 호스트 + `SAP_READ_ONLY`/`SAP_TIER` 조합으로 **write는 dial 이전 거부**되고
**read는 네트워크에 도달**함을 대조한다. write 게이트가 클라이언트측 pre-network이므로
더미 호스트로도 재현되며 실 write가 발생하지 않는다 — AC-10 실증(spike-evidence.json
part_b)이 쓴 방식을 더미 호스트로 축약한 것.

바이너리는 lock 고정 경로: `D:\Claude for SAP\vsp-custom\build\vsp.exe`.

```bash
VSP="D:/Claude for SAP/vsp-custom/build/vsp.exe"
printf 'REPORT zsah_probe.\nWRITE / 42.\n' > zsah_probe.prog.abap
DUMMY=(SAP_URL="https://dummy.invalid:44300" SAP_CLIENT=100 SAP_USER=DUMMY SAP_PASSWORD=DUMMY)

# 프로브 1: SAP_READ_ONLY 게이트 (write 거부, dial 이전)
env SAP_READ_ONLY=true "${DUMMY[@]}" "$VSP" deploy zsah_probe.prog.abap '$TMP'
# 프로브 2: SAP_TIER 게이트 (dev 외 tier write 거부)
env SAP_TIER=QA        "${DUMMY[@]}" "$VSP" deploy zsah_probe.prog.abap '$TMP'
# 프로브 3: read 분리 (동일 READ_ONLY 하에 system info는 네트워크 도달)
env SAP_READ_ONLY=true "${DUMMY[@]}" "$VSP" system info
```

### 본 문서 작성 시점 실행 결과 (2026-07-19, 상기 명령 직접 실행)

| 프로브 | env | 명령 | 결과(핵심 라인) | exit |
|---|---|---|---|---|
| 1 | `SAP_READ_ONLY=true` | `deploy … $TMP` | `Error: blocked: SAP_READ_ONLY=true — write operations are disabled for this profile …` | 1 |
| 2 | `SAP_TIER=QA` | `deploy … $TMP` | `Error: blocked: SAP_TIER=QA — write operations are only allowed on the dev tier …` | 1 |
| 3 | `SAP_READ_ONLY=true` | `system info` | `Error: failed to get system info: … dial tcp: lookup dummy.invalid: no such host` | 1 |

**대조 결론**: 동일한 `SAP_READ_ONLY=true` 하에서 프로브 1(`deploy`)은 **dial 이전**
거부되고(게이트 마커), 프로브 3(`system info`)은 **네트워크 dial에 도달해** DNS에서
실패한다(연결 실패 마커). 즉 게이트는 **write 한정·기계 강제**이며 read는 무영향임을
1회 재현. `zsah_probe.prog.abap`은 스크래치패드에서 작성·실행(레포 미커밋).

### 이미 실증된 항목 (날짜·좌표 인용)

- **AC-10 라이브 재실증 (2026-07-18)** — `phases/3-review-gate/spike-evidence.json`
  part_b: 실 IDES-DEV 프로파일 복사본 + `SAP_TIER=QA`+`SAP_READ_ONLY=true`(및 tier
  단독) 각각 `vsp deploy … $TMP`가 `created=no·dialed=no`로 클라이언트측 거부, 동일
  env에서 `vsp system info` exit 0(read 분리 입증), 사전/사후 `source read` 404(생성
  無). R-003 준수(tier LABEL만 QA로, 실접속 대상은 DEV 유지). lock
  write_profile_gate.verified.block_live = RESOLVED.
- **오프라인 유닛 테스트 (2026-07-18)** — `cmd/vsp/write_profile_test.go`:
  `enforceWriteProfile` 12케이스 + `getWriteClient`/read-path 4케이스 전부 PASS
  (lock write_profile_gate.verified.offline_unit_tests).
- **passthrough 라이브 (2026-07-18)** — `SAP_READ_ONLY`/`SAP_TIER` 미설정 시 deploy/copy
  정상 진행 = 게이트 통과 분기 확인 (lock write_profile_gate.verified.passthrough_live).

---

## ⑩ 규칙 정합 (RULES.md)

- **R-002** — vsp는 CLI 전용(MCP 서버 모드 금지). 본 문서의 3 프로파일 전부 CLI 경로;
  리뷰어의 SAP 읽기도 vsp CLI read-only로만(스펙 §5-10).
- **R-003** — write는 dev tier 한정. gated write 프로파일 `SAP_TIER=dev`; §⑨ 프로브 2가
  QA 거부를 재현.
- **R-005** — SAP 접속 정보·`.env` 레포 커밋 금지. §⑧ + `.gitignore` 확인.
- **R-006** — write 후 `vsp source read`로 반영 확인, v2.38.1-89 미만으로 CLAS
  deploy/copy 금지. §⑧ + 현행 lock v2.38.1-94 충족.
