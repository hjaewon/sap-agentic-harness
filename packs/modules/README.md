# Domain Packs — 모듈 지식 팩 (트랙 A CONSULT용)

> 무인 스텝이 아니라 **사람 소유 CONSULT 단계**가 읽는 모듈 지식의 증류본.
> 설계 근거는 `DESIGN.md` §12(이중 구조), 실행 구조는 `docs/ARCHITECTURE.md`.

## 이중 구조 (DESIGN §12)

RULES 예산(30/40개·12/16KB — DESIGN §15-F3) 때문에 모듈 지식 전체를 RULES로 주입하는
것은 불가능하다. 그래서 팩은 두 부분으로 나뉜다:

```text
packs/modules/<mod>/
  CONSULTANT.md   ← CONSULT 본체 (페르소나 요지 + 권장 접근 + 워크플로 + BAPI + 로컬라이제이션)
  TABLES.md       ← 조회 빈도 상위 테이블 발췌 (ECC↔S4 델타 유지)
  TCODES.md       ← 핵심 T-code 발췌
  SPRO.md         ← 헤드라인 IMG 경로
  RULES.seed.md   ← RULES 승격 후보 풀 (무인 주입 안 됨)
```

- **CONSULT 본체(CONSULTANT/TABLES/TCODES/SPRO)** 는 무인 step(`execute.py`)에 **주입되지
  않는다.** 사람이 소유한 대화형 세션의 CONSULT 단계에서만 참조한다 (DESIGN §11 루프의
  `CONSULT → GOAL → PLAN → EXECUTE → VERIFY → RECORD` 중 첫 단계).
- **RULES.seed.md** 는 **후보 풀**이지 자동 주입원이 아니다. 여기 등재된 규칙은 실전
  실패(LESSONS)가 하나를 재확인했을 때 **PROTOCOL 사람 승인 게이트**를 통과한 것만
  `.harness/RULES.md`에 개별 승격된다. 파일 자체는 어떤 step에도 주입되지 않는다.

## 번호 관례 — 네임스페이스 분리

| 파일 | 접두사 | 범위 |
|---|---|---|
| `packs/modules/<mod>/RULES.seed.md` | **`<MOD>-NNN`** (예: `FI-001`) | 팩 로컬 — 해당 모듈 도메인 규칙 |
| `domain/abap/RULES.seed.md` | `S-NNN` | 전역 — ABAP 언어/컨벤션 레벨 전용 |

- 팩 로컬 번호는 모듈별로 독립 채번한다(FI-001은 FI 팩 안에서만 유일).
- 전역 `S-NNN`(domain/abap)은 언어 레벨 규칙 전용이라 팩 규칙과 번호 공간이 겹치지 않는다.
- 팩 규칙이 전역 규칙의 모듈 특화 사례이면 출처에 전역 번호를 연관 명기한다
  (예: `FI-004`는 전역 `S-020`의 FI 특화 인스턴스).

## 증류본 · 정본 · provenance

- **소스 정본은 레포 내 `interactive/core/`** (페르소나 26 + knowledge). 팩은 그 **증류
  발췌**다 — verbatim 미러가 아니라 CONSULT용 요지 + 포인터.
- **드리프트 시 정본 우선**: 팩과 정본이 어긋나면 **항상 `interactive/core/`를 따른다.**
  각 팩 파일 상단에 이 규칙을 배너로 반복하고, 절마다 정본 파일 좌표를 남긴다.
- **provenance = 같은 레포 커밋 이력.** 팩은 별도 레포에서 복사한 것이 아니라 같은 레포
  `interactive/core/`에서 선별 이식했으므로 git 이력이 곧 출처 증빙이다(DESIGN §12 콜드스타트).

## 현재 팩

- `fi/` — Financial Accounting (첫 팩 · 트랙 A Phase 4). 이식 근거: E2E 선례
  ZR_FI_GL_LIST(ACTIVE) + KR 실사용 (DESIGN §12 "실전 프로젝트가 있는 것부터").
