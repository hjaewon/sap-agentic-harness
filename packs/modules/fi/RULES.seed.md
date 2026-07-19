# FI RULES.seed — 후보 풀 (팩 로컬 FI-NNN)

후보 풀 — `.harness/RULES.md` 승격은 사람 승인 게이트(PROTOCOL) 경유, 자동 주입 금지
(DESIGN §12). 이 파일 자체는 무인 step에 주입되지 않는다. 실전 실패(LESSONS)가 이 중
하나를 재확인하면 harness-lesson 절차로 `.harness/RULES.md`에 개별 승격을 검토한다.
번호는 팩 로컬(FI-NNN) — 전역 `S-NNN`(domain/abap, ABAP 언어 레벨)과 네임스페이스가
분리된다(packs/README 참조).

증류본이므로 각 규칙은 정본 소스 좌표를 단다 — 팩과 정본이 어긋나면 정본을 따른다.
출처 경로 중 `modules/`·`country/`는 `interactive/core/knowledge/` 하위, `domain/`·
`HANDOFF.md`는 레포 루트 기준.

형식: `- FI-NNN [area] <부정형 규칙> — <실패 모드> (출처: ...)`

병합 표기: 두 머신 분기 통합(2026-07-19) 시 원격 스트림에서 이식한 항목은 말미에
`[원격 유래: 구 FI-NNN]` 태그를 단다 — 로컬 번호(FI-001~005)를 유지하고 원격 고유
항목을 FI-006부터 이어 번호했다.

---

- FI-001 [fi-co-boundary] S/4HANA에서 원가요소(cost element)를 G/L 계정과 별개 오브젝트로 다루거나(KA01/KA02식) CSKA/CSKB 위에 커스텀 로직을 걸지 마라 — S/4에서 원가요소는 G/L 계정이고 유지는 FS00 경유이며 CSKA/CSKB는 호환 뷰일 뿐이라, 별도 취급이나 CSKA/CSKB 기반 로직은 주도 데이터(ACDOCA·G/L)와 어긋난다 (출처: modules/CO/enhancements.md §7 Note·§8-3)
- FI-002 [coding-block] FI 계정 할당(account-assignment) 커스텀 필드를 BSEG/BKPF 등 개별 테이블에 산발적으로 append하지 마라 — 시스템 전반 계정 할당 필드는 Coding Block(트랜잭션 OXK3·구조 COBL·append CI_COBL) 경유로 확장해야 FB01/MIRO/MIGO 등 모든 FI 관련 전기에 일관 전파되며, 산발 Z필드는 전기 경로별로 누락된다 (출처: modules/FI/enhancements.md §4·§6)
- FI-003 [validation] FI 전기 검증·대체를 성급하게 User-Exit/BAdI/커스텀 코드로 구현하지 마라 — 단순 규칙은 GGB0(검증)/GGB1(대체)의 무코드 경로가 우선이고 업그레이드 안전하며(콜업 포인트 0001/0002/0003), CO-PA 도출도 KEDR(규칙) 우선·KEDRU(user-exit) 최후다; 코드부터 짜면 업그레이드 위험과 유지보수 부담이 남는다 (출처: modules/FI/enhancements.md §8-2·§5 + modules/CO/enhancements.md §8-4)
- FI-004 [authz] G/L 계정 마스터(SKA1/SKB1)를 조회하는 프로그램을 SELECT만으로 종결하지 마라 — ABAP SQL은 DB 권한 검사를 우회하므로 F_SKA1_BUK(회사코드)/F_SKA1_KTP(계정과목표) 등 AUTHORITY-CHECK를 명시하지 않으면 무인가 조회가 그대로 통과한다 (출처: 실사례 ZR_FI_GL_LIST 교차 리뷰 발견 — HANDOFF.md §4 L6; 일반형 domain/abap/RULES.seed.md S-020 연관)
- FI-005 [kr] KR: 주민등록번호(RRN)를 커스텀 Z-테이블에 비암호화 평문으로 저장하거나 사업자등록번호를 체크디지트 검증 없이 단순 텍스트로 다루지 마라 — 전자는 개인정보보호법/정보통신망법 위반(RRN은 13자리 규제 PII·기본은 저장 안 함·masking/암호화), 후자는 체크디지트(FI-KR 표준) 검증 누락으로 무효 전자세금계산서가 발행된다 (출처: country/kr.md Pitfalls/Anti-patterns + Master Data Peculiarities)
- FI-006 [fi-posting] FI 전표(BKPF/BSEG/ACDOCA)를 ABAP SQL INSERT/UPDATE/MODIFY로 직접 기입하지 마라 — 전표번호범위·원장 업데이트·Universal Journal 정합성을 우회해 데이터가 불일치하며, 반드시 BAPI_ACC_DOCUMENT_POST 등 표준 posting API로 전기한다 (출처: interactive/core/knowledge/modules/FI/bapi.md · workflows.md) [원격 유래: 구 FI-001]
- FI-007 [fi-version] S/4HANA 대상에서 전표 라인아이템 금액을 BSEG에서 SELECT하지 마라 — S/4에서 실 데이터는 ACDOCA(Universal Journal)가 주도 테이블이라(tables.md "data mostly in ACDOCA"), BSEG만 읽으면 원장별·전 통화 금액이 불완전할 수 있다. 활성화는 통과하므로 커넥티드/리뷰에서만 드러난다 (출처: interactive/core/knowledge/modules/FI/tables.md · enhancements.md) [원격 유래: 구 FI-002] **[승격 완료 → .harness/RULES.md R-009 (2026-07-14 원격 줄기에서 R-007/L-002로 승격, 분기 통합 재번호로 R-009/L-004 — 4a 씨앗 차단 실증)]**
- FI-008 [fi-orgunit] FI 리포트/전기 로직에 회사코드(BUKRS)·계정과목표·회계연도변형·전표유형을 리터럴로 하드코딩하지 마라 — 설정 테이블(T001/T004/T009/T003) 또는 선택화면에서 읽지 않으면 다중 회사코드·다국가 시스템에서 오작동한다 (출처: interactive/core/knowledge/modules/FI/tables.md) [원격 유래: 구 FI-004]
- FI-009 [fi-period] FI 전기/시뮬레이션 전에 OB52 기간 개설 상태를 확인하지 않고 전기 기간을 가정하지 마라 — 마감된 기간 전기는 문법·활성화가 아니라 런타임에만 거부되어 오프라인 게이트로 못 잡는다 (출처: interactive/core/knowledge/modules/FI/tcodes.md · spro.md) [원격 유래: 구 FI-005]

> **참고 (중복 병합 제외)**: 원격 스트림의 구 FI-003 [fi-enhancement]("GGB0/GGB1로 충족되는
> 규칙을 커스텀 BAdI로 구현하지 마라")은 로컬 FI-003 [validation]과 동일 규칙이라 별도
> 항목으로 병합하지 않았다 — 손실 없음(개념 동일, 로컬 쪽이 콜업 포인트·CO-PA/KEDR까지
> 다뤄 범위가 더 넓다).
