# Domain Packs — 이중 구조 규약

`packs/modules/<모듈>/`은 SAP 모듈(FI/CO/MM/SD 등)별 실전 지식이 쌓이는 곳이다.
구조 정본은 `DESIGN.md` §12(이중 구조). 이 문서는 그 규약을 팩 작성·운용 시점에
바로 참조할 수 있도록 정리한다.

## 이중 구조

- **CONSULT 본체** (`CONSULTANT.md` 등) — 사람이 소유하는 CONSULT/계획 세션에서만
  읽는 지식. 테이블·T코드·SPRO·확장 체계·업무 흐름·함정 노트.
- **RULES.seed.md** — 실패에서 증류된, 무인 step에 강제할 가치가 있는 소수 규칙의
  **후보 풀**.

## 무인 주입 경계 (하드 규칙)

- CONSULT 본체는 **무인 step에 절대 주입하지 않는다** — 사람 소유 세션 전용.
- RULES.seed.md도 자동 주입원이 아니다. `.harness/RULES.md`로의 승격은 반드시
  사람 승인 게이트(`.harness/PROTOCOL.md`의 FAIL→INVESTIGATE→VERIFY→RULE→CONSULT)를
  경유한다.

## thin+pointer 원칙

지식 정본이 레포 내 다른 위치(`interactive/core/knowledge/modules/<MOD>/`)에 이미
있으면 팩은 그것을 **복사하지 않고** CONSULTANT.md에서 상대 링크로 가리킨다.
정본을 두 곳에 두면 갱신 시 하나만 고치고 다른 하나가 썩는 drift가 생기기 때문이다.

## 챕터 분리 트리거

시작 형태는 thin(포인터 허브 1파일)이다. **CONSULT 세션이 특정 챕터(테이블·T코드·
SPRO 등)를 반복적으로 개별 참조하게 되면 그때** 해당 챕터를 `TABLES.md` 등 별도
파일로 분리한다. 그 전까지는 CONSULTANT.md의 포인터 절만으로 충분하다. DESIGN §12의
전체 트리 예시(TABLES.md/TCODES.md/SPRO.md 분리)는 이 분리가 끝난 뒤의 **완전형**
목표 형태이며, thin은 그 시작점이다.

## 성장 방향

팩은 이 프로젝트가 실전에서 벌어들이는 지식의 축적처다(DESIGN §12 "독자 진화").
실전 CONSULT에서 마주친 함정·결정훅은 CONSULTANT.md에, 실패(LESSONS)에서 증류된
규칙 후보는 RULES.seed.md에 계속 추가된다 — 기계장치는 final-harness가 제공하고,
차별화는 이 레포에 쌓이는 검증된 규칙이다.

## 규칙 예산

`.harness/RULES.md` 전체 예산은 30~40개·12~16KB(DESIGN §15-F3)다. 팩 하나가 후보를
아무리 많이 쌓아도 승격은 소수 정예만 — 예산을 초과하면 다른 팩·다른 모듈의 규칙과
경쟁한다는 뜻이다.
