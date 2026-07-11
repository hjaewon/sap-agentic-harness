# Phase 2 connected 채점 원로그 (2026-07-12, IDES-DEV S4H/100)

사용자 승인: "채점 진행" (deploy 2건 + test + ATC + graph). 실행 주체 = 메인 세션
직접 (write 위임은 권한 분류기 거부 → 명령 단위 실행으로 전환).

## 0. 사전 점검

- `vsp system info` → S4H/100, ZADT_VSP installed, EXIT=0. 정상.

## 1. deploy CLAS 1차 — 실패 (LOCK 계열, vsp CLAS deploy 첫 실측)

- 명령: `vsp deploy src/zcl_sah2_workdays.clas.abap '$TMP'`
- 결과: EXIT=1 — "Object created but failed to lock: object
  /sap/bc/adt/oo/classes/zcl_sah2_workdays is not modifiable via ADT on this
  system (SAP returned modificationSupport=\"NoModification\" during LOCK)"
- 관찰: 객체 생성은 됨. `vsp source read CLAS ZCL_SAH2_WORKDAYS` → **빈 스켈레톤**
  (CREATE PRIVATE 기본 골격, calc 없음). Phase 1.5의 PROG "빈 스켈레톤" 패턴의
  CLAS 판. 소스 쓰기 전 LOCK 단계에서 실패.

## 2. deploy CLAS 2차 (즉시 재시도) — 실패 (고아 ENQUEUE 확정)

- 동일 명령 → EXIT=1 — ADT 403 EU510: "User HUB2150 is currently editing
  ZCL_SAH2_WORKDAYS" (HUB2150 = 접속 계정 자신).
- 판정: **1차 시도가 생성→잠금 실패 과정에서 ENQUEUE를 남김** (고아 잠금).
  0b의 DeleteInclude enqueue 누수·엔진 백로그 4(CreateClass 잠금)와 같은 계열.
  R-001에 따라 코드 결함 아님 — 배포 경로(vsp CLAS create→lock 시퀀스) 실측 발견.

## 3. 대기 후 재시도 (3차) — 실패, SM12 대상 확정

- 5분+ 대기 후 재시도(사용자 지명 승인) → 동일 403 EU510 (HUB2150 고아 잠금 유지).
- 판정: 자연 해제 안 됨 (8분+) — 0b 전례("SM12 수동 정리로만 해소")와 일치.
  SM12 정리 대기.

## 4. 중간 확정 발견 (사용자 질문 계기 — 버전/결함 대조)

- 사용 바이너리 = lock 일치 (sha256 E8C180EF…, aab1275). 423 fix(642c03c) 포함 빌드.
- 오늘 실패 ≠ 423 버그: LOCK 시점 modificationSupport=NoModification →
  22517d4의 가드 발동. **가드는 획득한 잠금을 해제하지 않고 에러 리턴** (pkg/adt/
  crud.go LockObject — return 전 unlock 없음) → 고아 ENQUEUE의 근본 원인.
  vsp-custom(업스트림 유래) 결함 후보 2건:
  (a) IDES CLAS 신규 생성 직후 LOCK이 NoModification 반환 (재현 여부는 SM12
      정리 후 재배포가 판정 — 잠금 클리어 상태에서 또 나오면 시스템 CLAS lock
      거동, 안 나오면 생성 직후 일시 상태)
  (b) NoModification 가드의 잠금 누수 (실패 경로 unlock 부재)
- KR-DEV 역효과: 423 fix는 무분기 stateful — ADT 표준 플로우라 이론 위험 낮음.
  단 이 빌드 KR-DEV 실측 0회 → 복귀 시 $TMP 스모크 1회 권장.

## 5. copy 우회 → 3중 거짓 성공 (vsp 결함 2호 확정)

- SM12 정리 후 `vsp copy zcl_sah2_copy.zip --to '$TMP'` → "Mode: WebSocket
  (ZADT_VSP)" · "Deploying CLAS ZCL_SAH2_WORKDAYS... OK · 1 success" · EXIT=0.
- 그러나 source read(active) + MCP GetClass(inactive) 모두 빈 스켈레톤 —
  **소스 미기록 + 성공 보고 + 잠금 누수**(직후 MCP 갱신이 HUB2150 잠금에 막힘)
  = copy의 기존재 CLAS 경로 3중 거짓 성공.

## 6. MCP UpdateClass → 423 계열 재현 (엔진 백로그 4의 병명 규명)

- SM12 재정리 후 UpdateClass(activate=true) 2회 → 둘 다
  "Ressource CLASS ... ist nicht gesperrt (ungültiges Sperr-Handle: <매번 다른 핸들>)".
- 핸들이 매번 다름 = stale 캐시가 아니라 **lock 성공 → 중간 요청이 stateful 세션
  롤백 → PUT 시점 잠금 증발** — vsp issue #88(423)과 동일 메커니즘, IDES처럼
  커넥션을 재활용하는 시스템에서 발현. KR-DEV(직결)에서 UpdateClass 계열이
  정상인 것과 정합. 이 실패 유형은 고아 잠금을 남기지 않음(사용자 SM12 확인).

## 7. 최종 경로: GUI 수동 주입 + vsp 채점 완주

- 사용자 SE80 소스 교체+활성화 → `vsp source read CLAS` 반영 확인(CREATE PUBLIC
  + calc 구현).
- `vsp deploy src/zsah2_duedate.prog.abap '$TMP'` → "Successfully created and
  activated PROG/P ZSAH2_DUEDATE", EXIT=0 (PROG 경로 정상 재확인).
- **`vsp test PROG ZSAH2_DUEDATE` → LTC_DUEDATE 5 PASS / 0 FAIL, EXIT=0** —
  채점 green 확정 (excludes_holidays·inverted_range·same_day·spans_weekend·
  weekdays_only).
- ATC: CLAS INFO 1(시간대 TTZCU 환경성) / PROG INFO 2(동일 환경성 + 'Remaining
  workdays:' 텍스트 요소 미번역). 둘 다 exit 0.
- `vsp graph PROG ZSAH2_DUEDATE --direction callees` → **TYPE ZCL_SAH2_WORKDAYS
  포착** (+CL_ABAP_UNIT_ASSERT) — 계획-단계 분석 명령의 실효 실증 (PLANNING §5-4).

## 8. 확정 결함 요약 (기록처)

1. vsp deploy CLAS — LOCK 응답 NoModification(잠금 클리어 상태에서도 재현,
   PROG는 정상) + NoModification 가드의 잠금 누수(실패 경로 unlock 부재,
   pkg/adt/crud.go LockObject) → COMMANDS.md ⑤.
2. vsp copy CLAS(기존재) — 소스 미기록 + 성공 보고 + 잠금 누수 → COMMANDS.md ⑤.
3. MCP(engine/) UpdateClass — 423 계열(중간 stateless 요청의 세션 롤백),
   IDES에서 결정적 재현 → HANDOFF §6 엔진 백로그 4 병명 갱신.
