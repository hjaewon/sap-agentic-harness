# FI 핵심 트랜잭션 코드 — 발췌

> **증류본.** `interactive/core/knowledge/modules/FI/tcodes.md`의 핵심 발췌다(전체 아님).
> **드리프트 시 정본 우선.** System 열의 ECC↔S4 델타를 유지한다.

## 마스터 데이터
| TCode | System | 설명 |
|---|---|---|
| FS00 | ECC/S4 | G/L 계정 마스터 (계정과목표) |
| FK01/FK02 · FD01/FD02 | ECC | 공급업체 / 고객 생성·변경 — **S/4: BP 사용** |
| BP | **S4** | Business Partner 유지 |
| AS01/AS02/AS03 | ECC/S4 | 자산 마스터 생성/변경/조회 |

## 전표 입력
| TCode | System | 설명 |
|---|---|---|
| FB50 | ECC/S4 | G/L 계정 전표 입력 |
| F-02 | ECC/S4 | G/L 계정 전기 |
| FB60 / FB70 | ECC/S4 | 공급업체 송장 / 고객 송장 입력 |
| F-53 / F-28 | ECC/S4 | 공급업체 지급 / 고객 수납 전기 |
| F110 | ECC/S4 | 자동 지급 실행 |
| F150 | ECC/S4 | 독촉 실행 |

## 결산
| TCode | System | 설명 |
|---|---|---|
| OB52 | ECC/S4 | 전기 기간 개설/마감 |
| F.16 / F.05 | ECC/S4 | G/L 잔액 이월 / 외화 평가 |
| AJRW / AJAB | ECC/S4 | 자산 회계연도 변경 / 연말 결산 |

## 조회
| TCode | System | 설명 |
|---|---|---|
| FS10N | ECC/S4 | G/L 계정 잔액 (S/4: **FAGLL03H** 선호) |
| FAGLL03H | **S4** | G/L 계정 항목 (신규) |
| FBL1N / FBL3N / FBL5N | ECC/S4 | 공급업체 / G/L / 고객 항목 (S/4: FAGLL03H 선호) |
| F.01 | ECC/S4 | 재무제표 |

> 전체 T-code(구성 OB41/OB53/OBB8/FBKP·모니터링 SM35/FBV0/FBRA·현금분개 FBCJ 등):
> 정본 `interactive/core/knowledge/modules/FI/tcodes.md`.
