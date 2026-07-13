# FI RULES.seed — 후보 풀 (모듈: FI)

후보 풀 — `.harness/RULES.md` 승격은 사람 승인 게이트(PROTOCOL.md) 경유, 자동 주입
금지(DESIGN §12). 이 파일은 무인 step에 주입되지 않는다. 실전 실패(LESSONS)가 이 중
하나를 재확인하면 개별 승격을 검토한다.

문법·버전 축(ECC vs S/4 테이블/문법, Cloud 제약, row-data denylist)은 domain/abap/
RULES.seed.md의 S-009·S-010·S-011·S-013이 이미 커버한다 — 여기서는 재작성하지 않고
FI 고유 의미론만 담는다.

원천: interactive/core/knowledge/modules/FI/ (이식 정본, 읽기 전용).

형식: `- FI-NNN [area] <부정형 규칙> — <실패 모드> (출처: ...)`

---

- FI-001 [fi-posting] FI 전표(BKPF/BSEG/ACDOCA)를 ABAP SQL INSERT/UPDATE/MODIFY로 직접 기입하지 마라 — 전표번호범위·원장 업데이트·Universal Journal 정합성을 우회해 데이터가 불일치하며, 반드시 BAPI_ACC_DOCUMENT_POST 등 표준 posting API로 전기한다 (출처: interactive/core/knowledge/modules/FI/bapi.md · workflows.md)
- FI-002 [fi-version] S/4HANA 대상에서 전표 라인아이템 금액을 BSEG에서 SELECT하지 마라 — S/4에서 실 데이터는 ACDOCA(Universal Journal)가 주도 테이블이라(tables.md "data mostly in ACDOCA"), BSEG만 읽으면 원장별·전 통화 금액이 불완전할 수 있다. 활성화는 통과하므로 커넥티드/리뷰에서만 드러난다 (출처: interactive/core/knowledge/modules/FI/tables.md · enhancements.md)
- FI-003 [fi-enhancement] GGB0/GGB1(검증/대체)로 충족되는 규칙을 커스텀 BAdI·User Exit ABAP으로 구현하지 마라 — zero-code 규칙이 업그레이드 안전하며, 커스텀 코드는 표준 callup point와 중복·충돌한다 (출처: interactive/core/knowledge/modules/FI/enhancements.md)
- FI-004 [fi-orgunit] FI 리포트/전기 로직에 회사코드(BUKRS)·계정과목표·회계연도변형·전표유형을 리터럴로 하드코딩하지 마라 — 설정 테이블(T001/T004/T009/T003) 또는 선택화면에서 읽지 않으면 다중 회사코드·다국가 시스템에서 오작동한다 (출처: interactive/core/knowledge/modules/FI/tables.md)
- FI-005 [fi-period] FI 전기/시뮬레이션 전에 OB52 기간 개설 상태를 확인하지 않고 전기 기간을 가정하지 마라 — 마감된 기간 전기는 문법·활성화가 아니라 런타임에만 거부되어 오프라인 게이트로 못 잡는다 (출처: interactive/core/knowledge/modules/FI/tcodes.md · spro.md)
