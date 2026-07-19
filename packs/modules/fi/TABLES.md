# FI 주요 테이블 — 조회 빈도 상위 발췌

> **증류본.** `interactive/core/knowledge/modules/FI/tables.md`의 상위 발췌다(전체 아님).
> **드리프트 시 정본 우선.** System 열의 ECC↔S4 델타를 유지한다.

## 마스터 데이터
| Table | System | 설명 · ECC↔S4 델타 |
|---|---|---|
| SKA1 | ECC/S4 | G/L 계정 — 계정과목표 레벨 |
| SKB1 | ECC/S4 | G/L 계정 — 회사코드 레벨 (S/4: 원가요소 포함) |
| SKAT | ECC/S4 | G/L 계정 명 |
| KNA1 / KNB1 | ECC | 고객 (일반/회사코드) — **S/4: BP(BUT000)로 통합** |
| LFA1 / LFB1 | ECC | 공급업체 (일반/회사코드) — **S/4: BP(BUT000)로 통합** |
| BUT000 | S4 | Business Partner (고객·공급업체 단일화) |
| ANLA | ECC/S4 | 자산 마스터 |

## 트랜잭션 데이터
| Table | System | 설명 · ECC↔S4 델타 |
|---|---|---|
| BKPF | ECC/S4 | 회계 문서 헤더 (S/4도 헤더는 잔존) |
| BSEG | ECC/S4 | 회계 문서 세그먼트 — **S/4: 라인 데이터 대부분 ACDOCA로 이동, BSEG는 호환 뷰** |
| ACDOCA | **S4** | Universal Journal — 단일 진실 원천(FI·CO 통합) |
| BSID / BSIK | ECC/S4 | 고객 / 공급업체 미결 항목 |
| BSIS | ECC/S4 | G/L 미결 항목 — **S/4: ACDOCA에서 생성된 뷰** |
| REGUH / REGUP | ECC/S4 | 지급 데이터 (정산 / 처리) |

## 구성 / Customizing
| Table | System | 설명 |
|---|---|---|
| T001 | ECC/S4 | 회사코드 |
| T003 | ECC/S4 | 문서 유형 |
| T009 | ECC/S4 | 회계연도 변형 |
| T030 | ECC/S4 | G/L 계정 결정 |

## 교차 모듈 (CO)
| Table | System | 설명 |
|---|---|---|
| CSKS / CEPC | ECC/S4 | 원가 센터 / 수익 센터 마스터 |
| CSKA / CSKB | ECC | 원가요소 — **S/4: G/L 계정으로 관리, 호환 뷰만 잔존(→ RULES.seed FI-001)** |

> 전체 표(FAGLFLEXA/T·ACDOCP·BSAD/BSAK·ANLB/ANLC·T004/T007A/T012 등):
> 정본 `interactive/core/knowledge/modules/FI/tables.md`.
