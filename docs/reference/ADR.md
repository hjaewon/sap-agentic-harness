# ADR — SAP 수행 작업 결정 기록 (보조 줄기 이력 보존, append-only)

> **성격**: 이 파일은 보조(로컬) 머신 줄기가 트랙 A "수행 레벨"(하네스로 수행한 SAP
> 개발 작업) 결정을 담기 위해 신설했던 ADR 로그다(보조 머신 D-020 = 통합 후 D-031).
> 분기 통합(D-035)에서 결정 로그는 `docs/reference/DECISIONS.md` 단일 체계로 확정됐고
> (원격 D-020·D-026의 "이중 체계 금지"), 이 파일은 **top-level 활성 로그가 아니라 보조
> 줄기 산출물의 이력으로 `docs/reference/`에 보존**된다(폐기 아님 — D-035·⑶). 활성
> ADR 역할은 `docs/reference/DECISIONS.md`가 겸하며, 새 결정은 그곳에 append한다.
> 아래 ADR-001~003은 작성 시점 사실의 증거로 무수정 보존한다.
>
> 경계(원문, 경로만 갱신): 하네스 "자체"(레포 구조·플러그인·엔진)의 결정은
> `docs/reference/DECISIONS.md`(D-번호). 이 파일은 하네스로 "수행한 SAP 개발 작업"의
> 결정만 담는다. 수정·삭제 금지 — 정정도 새 항목으로.


## ADR-001 | 2026-07-12 | Phase 2 대상 객체: PROG 1개 → CLAS+PROG 2개

- Context: 재사용 시나리오에서 REPORT 로컬 클래스는 외부 호출 불가 (답사에서
  서버 정본으로 확정).
- Decision: 재사용 로직을 글로벌 클래스 zcl_sah2_workdays로 승격, 소비자
  리포트 zsah2_duedate와 분리.
- Consequences: 답사가 계획 결정을 바꾼 첫 실증 (Phase 2 완료 기준 충족).
  상세: phases/2-duedate-reuse/PLANNING.md §4-1.

## ADR-002 | 2026-07-12 | 배포 순서 클래스 먼저 + 테스트는 리포트 로컬 배치

- Context: vsp가 CLAS 테스트 include 배포 미지원(TODO). 리포트가 클래스를
  참조하므로 의존 역순 배포 필요.
- Decision: 클래스 → 리포트 순서 배포, 단위 테스트는 리포트의 로컬 테스트
  클래스에 배치.
- Consequences: vsp test PROG로 5 PASS 채점 가능. 클래스 테스트 include
  지원되면 재배치 재론. 상세: phases/2-duedate-reuse/PLANNING.md §4-2.
- Addendum (2026-07-19): Phase 3 소품 프로브(A-3)가 vsp v2.38.1-94에서 CLAS 테스트
  include(.clas.testclasses.abap) 배포 지원을 실측 확인 — 위 Context의 전제("미지원/TODO")
  역전(phases/4-gated-deploy/state/phase3-evidence.json). 재배치(신규 ADR) 여부는 사용자
  결정 대기.

## ADR-003 | 2026-07-12 | CLAS 배포 결함 노출 시 GUI 수동 주입으로 완주

- Context: 채점 중 vsp CLAS 배포 3결함 실측 (deploy LOCK 거부·잠금 누수·copy
  거짓 성공).
- Decision: 채점 완주를 위해 클래스 소스는 SE80 수동 주입, 결함은 당일 수리
  (vsp v2.38.1-89)로 해소.
- Consequences: R-006 신설 (배포 후 source read 확인). CLAS 배포 경로 개통 —
  수동 우회 불필요. 상세: phases/2-duedate-reuse/scoring-raw.md.
