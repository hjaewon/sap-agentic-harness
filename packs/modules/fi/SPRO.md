# FI 헤드라인 IMG 경로 — 발췌

> **증류본.** leaf 구성명·Table/View 좌표는 `interactive/core/knowledge/modules/FI/spro.md`
> 정본에서 가져왔고, 앞단 SPRO 네비게이션은 표준 경로다. **드리프트 시 정본 우선**
> (특히 S/4HANA는 일부 노드에서 "(New)" 접미사가 사라진다 — 실제 IMG 트리로 확인).
> 경로는 모두 `SPRO > ` 하위. 전 영역은 정본 참조.

## Enterprise Structure
- **Company Code 정의** — Enterprise Structure > Definition > Financial Accounting >
  Edit, Copy, Delete, Check Company Code → `V_T001`

## General Ledger
- **Chart of Accounts** — Financial Accounting > General Ledger Accounting > Master Data >
  G/L Accounts > Preparations > Edit Chart of Accounts List → `V_T004`
- **Fiscal Year Variant** — Financial Accounting > FI Global Settings > Ledgers >
  Fiscal Year and Posting Periods > Maintain Fiscal Year Variant → `V_T009`
- **Open/Close Posting Periods** (OB52) — Financial Accounting > FI Global Settings >
  Ledgers > Fiscal Year and Posting Periods > Posting Periods > Open and Close → `V_T001B`
- **Document Types (Entry View)** — Financial Accounting > FI Global Settings >
  Document > Document Types > Define Document Types for Entry View → `V_T003`
- **Field Status Variants** — Financial Accounting > FI Global Settings > Ledgers >
  Fields > Define Field Status Variants → `V_T004V`

## Tax / AR
- **Tax Codes** (FTXP) — Financial Accounting > FI Global Settings > Tax on Sales/Purchases >
  Calculation > Define Tax Codes → `V_T007A`
- **Dunning Procedures** — Financial Accounting > AR and AP > Business Transactions >
  Dunning > Dunning Procedure > Define Dunning Procedures → `V_T047`

> 전체 구성 항목(AP 자동지급 V_T042Z·주거래은행 V_T012·자산 감가상각 V_T090/V_T096·
> 신용통제영역 V_T014 등): 정본 `interactive/core/knowledge/modules/FI/spro.md`.
