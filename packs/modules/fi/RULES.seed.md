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

---

- FI-001 [fi-co-boundary] S/4HANA에서 원가요소(cost element)를 G/L 계정과 별개 오브젝트로 다루거나(KA01/KA02식) CSKA/CSKB 위에 커스텀 로직을 걸지 마라 — S/4에서 원가요소는 G/L 계정이고 유지는 FS00 경유이며 CSKA/CSKB는 호환 뷰일 뿐이라, 별도 취급이나 CSKA/CSKB 기반 로직은 주도 데이터(ACDOCA·G/L)와 어긋난다 (출처: modules/CO/enhancements.md §7 Note·§8-3)
- FI-002 [coding-block] FI 계정 할당(account-assignment) 커스텀 필드를 BSEG/BKPF 등 개별 테이블에 산발적으로 append하지 마라 — 시스템 전반 계정 할당 필드는 Coding Block(트랜잭션 OXK3·구조 COBL·append CI_COBL) 경유로 확장해야 FB01/MIRO/MIGO 등 모든 FI 관련 전기에 일관 전파되며, 산발 Z필드는 전기 경로별로 누락된다 (출처: modules/FI/enhancements.md §4·§6)
- FI-003 [validation] FI 전기 검증·대체를 성급하게 User-Exit/BAdI/커스텀 코드로 구현하지 마라 — 단순 규칙은 GGB0(검증)/GGB1(대체)의 무코드 경로가 우선이고 업그레이드 안전하며(콜업 포인트 0001/0002/0003), CO-PA 도출도 KEDR(규칙) 우선·KEDRU(user-exit) 최후다; 코드부터 짜면 업그레이드 위험과 유지보수 부담이 남는다 (출처: modules/FI/enhancements.md §8-2·§5 + modules/CO/enhancements.md §8-4)
- FI-004 [authz] G/L 계정 마스터(SKA1/SKB1)를 조회하는 프로그램을 SELECT만으로 종결하지 마라 — ABAP SQL은 DB 권한 검사를 우회하므로 F_SKA1_BUK(회사코드)/F_SKA1_KTP(계정과목표) 등 AUTHORITY-CHECK를 명시하지 않으면 무인가 조회가 그대로 통과한다 (출처: 실사례 ZR_FI_GL_LIST 교차 리뷰 발견 — HANDOFF.md §4 L6; 일반형 domain/abap/RULES.seed.md S-020 연관)
- FI-005 [kr] KR: 주민등록번호(RRN)를 커스텀 Z-테이블에 비암호화 평문으로 저장하거나 사업자등록번호를 체크디지트 검증 없이 단순 텍스트로 다루지 마라 — 전자는 개인정보보호법/정보통신망법 위반(RRN은 13자리 규제 PII·기본은 저장 안 함·masking/암호화), 후자는 체크디지트(FI-KR 표준) 검증 누락으로 무효 전자세금계산서가 발행된다 (출처: country/kr.md Pitfalls/Anti-patterns + Master Data Peculiarities)
