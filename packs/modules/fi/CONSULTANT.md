# FI Domain Pack — CONSULTANT

> **용도**: 사람이 소유하는 CONSULT/계획 세션 전용 지식 허브. **무인 step에 주입
> 금지**(DESIGN §12, `packs/modules/README.md`). thin+pointer 구조 — 지식 정본은
> `interactive/core/knowledge/modules/FI/`에 있고 이 문서는 링크로만 가리킨다.

## 지식 포인터

- [테이블 — ECC/S4 분기 표](../../../interactive/core/knowledge/modules/FI/tables.md)
- [T-code](../../../interactive/core/knowledge/modules/FI/tcodes.md)
- [BAPI/표준 API](../../../interactive/core/knowledge/modules/FI/bapi.md)
- [SPRO — IMG 경로](../../../interactive/core/knowledge/modules/FI/spro.md)
- [확장 체계 — BTE·BAdI·GGB0/GGB1·Coding Block](../../../interactive/core/knowledge/modules/FI/enhancements.md)
- [업무 흐름](../../../interactive/core/knowledge/modules/FI/workflows.md)
- [상담 페르소나 — sap-fi-consultant](../../../interactive/core/personas/sap-fi-consultant.md)
  (CONSULT 시 이 페르소나 관점을 사용한다)

## 트랙 A 결정훅·함정

**금액/라인아이템 소스 결정 (→ FI-002)**
S/4 대상이면 전표 라인아이템 금액을 BSEG가 아니라 ACDOCA에서 읽는다 — S/4에서
ACDOCA가 주도 테이블이다(tables.md·
enhancements.md §7 "In S/4HANA, BSEG remains as a compatibility view but ACDOCA
is the leading table"). `.sc4sap/config.json`의 `sapVersion`으로 ECC/S4를
분기한다. 이 오용은 lint·활성화를 전부 통과하고 커넥티드 실행/리뷰에서만 드러난다.

**전표 기입 방식 (→ FI-001)**
BKPF/BSEG/ACDOCA를 ABAP SQL INSERT/UPDATE로 직접 조작하지 않는다 — 전기는
`BAPI_ACC_DOCUMENT_POST` 등 표준 posting API로만 한다(bapi.md, workflows.md
Workflow 1 참조).

**검증/대체 로직 (→ FI-003)**
GGB0(Validation)/GGB1(Substitution)로 충족되는 규칙은 커스텀 BAdI·User Exit
ABAP으로 구현하지 않는다 — zero-code 규칙이 업그레이드 안전하다(enhancements.md
§5, §8 "권장 접근" 2번).

**row-data 경계**
ACDOCA는 domain `S-013`의 row-data 차단 카테고리 목록에 명시적으로 포함된
테이블이다 — CONSULT 산출물·리포트는 집계 SELECT만 다루고, GetTableContents/
GetSqlQuery 등으로 ACDOCA 원시 라인아이템을 추출하지 않는다.

## 후보 규칙 색인

FI 고유 후보 규칙 5건(FI-001~005)은 [`RULES.seed.md`](./RULES.seed.md) 참조.
문법·버전 축(ECC vs S/4 테이블/문법, Cloud 제약, row-data denylist)은
`domain/abap/RULES.seed.md`의 S-009/010/011/013이 이미 커버하므로 여기서
재작성하지 않는다.

## 실전 노트

(아직 없음) — 실전 CONSULT/실패에서 얻은 함정을 여기에 계속 추가한다.
