# 프로젝트 현재 상태·방향성 객관 진단 — 설계 전 검토본

> 작성일: 2026-07-20
> 검토 예정일: 2026-07-21
> 상태: **진단 완료 / 설계 미결정**
> 실행 분류: **Direct / P0 offline**

이 문서는 현재 저장소가 실제로 무엇을 담고 있고 어떤 방식으로 작동하는지를
코드, 파일 구성, 실행 진입점, 테스트 결과, 원본 저장소와의 차이로 진단한
설계 전 검토 자료다. 기존 문서에 적힌 목표나 명칭은 구현과 일치하는지
교차 확인하는 보조 근거로만 사용했다.

이 문서는 새 아키텍처를 승인하거나 기존 결정을 대체하지 않는다. 2026-07-21
검토에서 제품 경계와 우선순위를 정한 뒤 별도의 설계를 작성한다.

## 0. 한 문장 결론

현재 프로젝트는 **“가벼운 SAP 개발 플러그인 + 실제 모듈 에이전트 +
필요할 때 붙이는 로컬 하네스 템플릿”**이라기보다,
**“SAP 개발 도구·안전 정책·검증 증거를 한 저장소에 보존한 고보증 개발
모노레포”**에 더 가깝다.

망가진 프로젝트는 아니다. SAP 도구 표면, 검증 게이트, 모듈 지식,
프로비넌스는 상당히 잘 구축되어 있다. 다만 원래 의도와 비교하면 다음 세
가지가 크게 어긋났다.

1. 모듈 전문가는 실제 위임 가능한 에이전트가 아니라 대부분 정적
   페르소나 문서로 바뀌었다.
2. “경량화”는 설치 제품 전체보다 기존 멀티에이전트 구조를 제거하는 방식에
   집중되었고, 저장소에는 여전히 MCP 원본·번들·전체 vsp·하네스가 함께 있다.
3. Track A 엔진은 계약과 검증 틀은 있으나, 승인된 유일 진입점에서 실제
   실행기로 연결되지 않아 현재 실행 불가다.

따라서 지금 필요한 것은 기능을 더 쌓는 일이 아니라 **제품 경계, 에이전트의
의미, 엔진 소유권을 먼저 다시 고정하는 것**이다.

## 1. 원래 의도와 현재 결과

사용자가 설명한 원래 의도를 구현 단위로 풀면 다음과 같다.

| 원래 의도 | 기대되는 구현 형태 | 현재 실제 상태 | 판정 |
|---|---|---|---|
| 무거운 SAP 플러그인 2개를 가볍게 결합 | 배포물은 작고, 필요한 SAP 기능만 노출 | `interactive/`는 일부 축소되었지만 저장소에는 MCP 원본, 번들, 전체 vsp가 공존 | 부분 달성 |
| SAP 개발에 최적화 | 개발·검증·안전 흐름이 일관됨 | 도구 표면, 읽기 전용 프리셋, 리뷰·검증 게이트가 강함 | 상당 부분 달성 |
| 모듈까지 도움받음 | FI/MM/SD 등 전문가에게 실제 위임 가능 | 모듈 지식은 풍부하나 실행 에이전트는 reviewer 1개뿐 | 핵심 미달 |
| 로컬 ENGINE에 ABAP parser 제공 | 하네스 단계에서 로컬 구문/품질 판정 사용 | vsp lint/parse는 있으나 실행 루프에 직접 결합되지 않음 | 부분 달성 |
| fable의 하네스/루프 엔지니어링 활용 | 계약 기반 루프가 승인 진입점에서 실제 실행 | 실행기 코드는 가져왔지만 wrapper가 launch하지 않음 | 틀만 존재 |
| 엔진을 쓰지 않아도 템플릿으로 활용 | 플러그인과 하네스가 느슨하게 결합 | 현재는 경계보다 모든 구성요소의 동거가 두드러짐 | 방향 재정의 필요 |

## 2. 진단 범위와 방법

### 2.1 범위

- 현재 저장소: `D:/claude for SAP/sap-agentic-harness`
- 비교 원본:
  - `D:/claude for SAP/sc4sap-custom`
  - `D:/claude for SAP/abap-mcp-adt-powerup`
  - `D:/claude for SAP/vsp/vsp-custom`
  - `D:/claude-practice/claude-fable-final`
- `sc4sap-custom/private`는 읽거나 비교하지 않았다.
- SAP 시스템에는 연결하지 않았고 행 데이터 조회나 SAP 변경을 수행하지
  않았다.

### 2.2 판단 우선순위

1. 실제 파일과 실행 코드
2. 실행 가능한 테스트와 로컬 프로브
3. Git 계보·해시·원본 저장소 비교
4. 문서에 적힌 목표와 결정 기록

즉, 문서가 “완료”라고 말해도 진입점이 실행기를 호출하지 않으면 실행 불가로
판정했고, 반대로 문서에 충분히 강조되지 않았어도 테스트되는 기능은 현존
기능으로 판정했다.

### 2.3 정책 상태

다음 상태는 본 진단에서도 그대로 전제한다.

- `attended-only`
- `unattended=sealed`
- `historical_rv4_classifier=open`
- `sap_mutation_boundary=unverified`
  - scope: reviewer + all attended children

## 3. 현재 프로젝트의 실제 구조

현재 코드를 기준으로 보면 책임은 다음처럼 분리되어 있다.

| 영역 | 실제 역할 | 제품 실행에 필수인가 |
|---|---|---|
| `interactive/` | Claude/Codex에 설치되는 플러그인, 지식·절차·MCP 런처 | 예, 현재 가장 명확한 제품 |
| `interactive/server/` | 설치용 SAP ADT MCP 번들 | 플러그인 연결 기능에는 예 |
| `engine/` | ABAP ADT MCP의 전체 TypeScript 원본과 테스트 | 런타임 번들이 있으면 배포에는 불필요할 수 있음 |
| `scripts/` | 계약 검증, Track A wrapper, 리뷰·브리지·품질 게이트 | 선택한 하네스 운영 방식에 따라 다름 |
| 외부 final-harness + `scripts/execute.py` | 루프 실행기의 기반 | 현재 승인 경로에서는 연결되지 않음 |
| `vsp/` | Go 기반 ADT CLI, lint/parse, graph, debugger, WASM 등 전체 소스 | 현재 플러그인 핵심에는 과대 범위 |
| `packs/modules/` | Track A용 모듈 참고 팩 | 현재 FI 중심이며 human CONSULT용 |
| `phases/` | 과거 단계별 증거와 산출물 | 런타임 제품에는 불필요 |

이 구조에서 “제품”을 무엇으로 보느냐에 따라 평가는 크게 달라진다.
`interactive/`만 제품으로 보면 어느 정도 경량화되었다. 저장소 전체를
제품으로 보면 경량 프로젝트라고 부르기 어렵다.

## 4. 정량 측정

### 4.1 저장소 구성

추적 파일의 워킹트리 바이트 합계를 기준으로 측정했다.

| 구분 | 파일 수 | 크기 | 해석 |
|---|---:|---:|---|
| 저장소 전체 | 2,804 | 48.18 MiB | 개발 모노레포 규모 |
| `engine/` | 1,601 | 20.40 MiB | 전체 MCP 원본·테스트 |
| `interactive/` | 403 | 15.89 MiB | 실제 플러그인과 번들 |
| `vsp/` | 570 | 9.79 MiB | 전체 Go 도구체인 |
| `scripts/` | 41 | 0.71 MiB | 하네스와 게이트 |
| `phases/` | 124 | 0.45 MiB | 과거 증거 |
| `docs/` | 22 | 0.45 MiB | 설계·운영 문서 |

상위 세 디렉터리 `engine/`, `interactive/`, `vsp/`가 전체 용량의
약 96%다. 경량화 논의는 문서나 스크립트보다 이 세 경계를 어떻게 다룰지가
핵심이다.

### 4.2 중복과 구현 비중

| 항목 | 측정값 |
|---|---:|
| 정확히 동일한 추적 콘텐츠 그룹 | 10개 |
| 중복으로 추가 점유한 크기 | 8.12 MiB |
| 가장 큰 동일 파일 | `engine/dist/server.bundle.cjs`, `interactive/server/server.bundle.cjs` |
| 각 번들 크기 | 7.91 MiB |
| 두 번들의 SHA-256 | `FA5698...`로 동일 |
| 제품 ABAP 소스 `src/` | 6파일, 442줄, 0.02 MiB |
| 루트 모듈 팩 | 6파일, 330줄, 0.03 MiB |
| 루트 도메인 규칙 | 2파일, 105줄 |
| 하네스 런타임·검증 스크립트 | 41파일, 12,828줄 |
| 그중 런타임 | 17파일, 4,828줄 |
| 그중 테스트 | 24파일, 8,000줄 |
| 과거 phase 증거 | 124파일, 5,649줄 |

가장 큰 단일 절감 후보는 동일 MCP 번들의 이중 보관이다. 다만 원본과 설치
아티팩트의 책임을 먼저 정하지 않고 한쪽을 지우면 재현 가능한 배포 경로를
잃을 수 있으므로, 이는 단순 삭제가 아니라 배포 구조 설계 문제다.

### 4.3 변경의 중심

경로별 Git 이력에서 해당 경로를 건드린 커밋 수는 다음과 같다.

| 경로 | 관련 커밋 수 |
|---|---:|
| `.harness/` | 64 |
| `interactive/` | 57 |
| `docs/` | 49 |
| `phases/` | 46 |
| `scripts/` | 25 |
| `engine/` | 19 |
| `src/` | 9 |
| `packs/` | 4 |
| `domain/` | 3 |
| `vsp/` | 2 |

실제 개발 에너지는 SAP 기능 자체보다 하네스 상태, 검증 증거, 문서,
마이그레이션에 더 많이 투입되었다. 이것이 현재 프로젝트의 품질을 높였지만,
동시에 원래 제품 목표를 흐리게 만든 가장 큰 구조적 신호다.

## 5. SAP 플러그인의 현재 상태

### 5.1 확보된 자산

`interactive/plugin-metadata.json` 기준 구성은 다음과 같다.

| 종류 | 수 |
|---|---:|
| personas | 26 |
| skills | 11 |
| procedures | 16 |
| agents | 1 |
| modules | 15 |
| industries | 14 |
| countries | 16 |
| 기본 MCP 도구 | 155 |
| connected MCP 도구 | 186 |

SAP 개발·산업·국가별 지식과 절차를 한 플러그인에서 탐색할 수 있다는 점은
강점이다. Claude와 Codex 설치도 로컬 진단에서 정상으로 확인되었다.

### 5.2 “가벼움”의 실제 의미

비공개 영역을 제외한 원본 `sc4sap-custom`은 487파일, 24.5 MiB이고,
현재 `interactive/`는 403파일, 15.89 MiB다. 설치 트리만 보면 약 35%
작아졌다.

하지만 기본 도구 표면 155개는 여전히 넓다.

| 분류 | 기본 프리셋 | readonly 프리셋 |
|---|---:|---:|
| read | 87 | 60 |
| mutation | 62 | 0 |
| row-data | 2 | 2 |
| server-control | 1 | 1 |
| execution | 3 | 2 |
| 합계 | 155 | 65 |

readonly는 쓰기 도구를 제거하지만 실행·행 데이터 도구까지 모두 제거하는
프리셋은 아니다. 따라서 현재 경량화는 **바이너리·스키마·도구 수를 최소화한
제품 경량화**라기보다 **기존 팀/멀티에이전트 실행 구조를 제거한 운영
경량화**에 가깝다.

## 6. 모듈 에이전트의 현재 상태

### 6.1 지식은 남았고 에이전트는 사라졌다

`interactive/core/knowledge/modules/`에는 Ariba, BC, BW, CO, FI, HCM,
MM, PM, PP, PS, QM, SD, TM, TR, WM 및 common 지식이 있다. 총 94개
파일이며, 일반적인 모듈은 약 6개 파일과 300~470줄의 참고 내용을 갖는다.

반면 실제 agent 정의는 `interactive/agents/sap-reviewer.md` 하나뿐이다.
26개 전문 역할은 `interactive/core/personas/`의 문서로 바뀌었고,
`ask-consultant` 절차는 여러 모듈이 필요할 때 역할 A와 B를 순차적으로
연기하도록 안내한다.

원본 `sc4sap-custom`에는 26개 전문 agent와 실제 `Agent(...)` 위임,
병렬 상담 및 team round가 있었다. 현재 마이그레이션은 team skill과
team-consultation protocol을 obsolete로 분류하고 agent를 persona로
변환했다.

따라서 현재 시스템은 “모듈 에이전트를 담았다”기보다 **“한 모델이 읽고
연기할 수 있는 모듈별 지식과 페르소나를 담았다”**고 표현하는 것이 정확하다.

### 6.2 지식 자산의 한계

94개 모듈 지식 파일에서 확인한 유지보수 신호는 다음과 같다.

- 외부 출처 URL: 0
- Last updated 표기: 0
- frontmatter 기반 버전·소유권: 0/94
- SAP Note 직접 언급: 1개 파일

현재 내용은 빠른 상담용 치트시트로 유용하지만, SAP 릴리스와 고객별
Customizing 차이를 감안하면 장기 정본으로 쓰기에는 출처·적용 버전·검증
상태가 부족하다.

또한 루트 `packs/modules/`는 별도 계층이다. 현재 FI 중심의 첫 팩이며
human CONSULT용으로 설계되어 unattended 단계에 자동 주입되지 않는다.
interactive의 15개 모듈 지식과 Track A 모듈 팩을 같은 “모듈 지원”으로
묶으면 실제 범위를 오해하게 된다.

## 7. Track A 하네스/ENGINE의 현재 상태

### 7.1 가져온 것은 실행기와 계약 틀이다

`scripts/execute.py`는 `claude-fable-final`의 검증된 v0.17.3 템플릿
blob과 정확히 일치한다. 따라서 단순히 비슷하게 재작성한 것이 아니라 실제
루프 실행기 기반을 가져온 것은 맞다.

그러나 현재 정책상 raw `scripts/execute.py` 호출은 금지되고,
`scripts/run-track-a.ps1`만 유일한 진입점이다. 이 wrapper의 마지막
경로에는 실제 launch가 구현되어 있지 않으며 `ENGINE_UNAVAILABLE`
종료 코드 65로 끝난다.

즉 현재 상태는 다음과 같다.

1. run contract와 manifest 형식이 있다.
2. lock, 승인 여부, 일부 preflight 검사가 있다.
3. wrapper 자체의 실패·WhatIf 동작 테스트는 통과한다.
4. 그러나 승인된 경로에서 executor를 시작하지 않는다.
5. bridge가 기대하는 `harness-worker` companion skill도 루트에 없다.

따라서 “엔진이 준비되어 있으나 잠시 비활성화”가 아니라 **“실행 계약
프로토타입과 구형 실행기는 있으나 승인된 실행 경로는 미완성”**으로 보는
것이 객관적이다.

### 7.2 버전 상태

- 현재 가져온 verified 기반: fable v0.17.3
- v0.20 candidate: 현재 파일 대비 약 +1,019/-261줄 차이
- candidate promotion: 현재 suspended
- wrapper: `-Candidate` 경로를 요구

검증된 구버전은 wrapper의 정상 실행 경로가 없고, wrapper가 요구하는
candidate는 승격되지 않은 상태라 운영 조합이 서로 맞물리지 않는다.

### 7.3 설계 선택지

내일 아래 둘 중 하나를 명시적으로 고를 필요가 있다.

**A. 템플릿 전용 — 단기 권고**

- contract, checklist, review schema, vsp adapter만 보존
- “현재 실행 가능한 ENGINE”이라는 표현은 제거
- 실제 반복 실행은 필요가 확정될 때 별도 프로젝트로 완성
- 플러그인 제품 경계를 먼저 안정화

**B. 실행 가능한 ENGINE**

- `harness-worker` 계약과 companion skill 복구
- wrapper에서 실제 launch 구현
- contract hash binding 및 handshake/preflight 완성
- pause/resume, retry, seed, evidence 경계를 black-box 테스트
- verified executor와 candidate 정책을 한 버전으로 정렬

B는 단순 배선 작업이 아니라 독립 제품 수준의 구현·운영 책임을 추가한다.

## 8. vsp와 ABAP parser의 현재 상태

### 8.1 확인된 기능

로컬 `vsp/build/vsp.exe`는 존재하며 버전은
`v2.38.1-94-g5a8bedb`다. 오프라인 lint 샘플과 parse 샘플이 실행되었고,
CGO 비활성 상태의 전체 Go 테스트도 통과했다.

그러나 하네스와의 결합은 제한적이다.

- `scripts/execute.py`에는 vsp 또는 abaplint 직접 호출이 없다.
- `scripts/quality-gate-sap.ps1`는 `vsp lint --file`만 호출한다.
- `vsp parse`는 토큰화·문장 분류 결과를 내지만 구문 오류를 권위 있게
  pass/fail 하는 완전한 ABAP 문법 게이트는 아니다.
- 기본 lint 규칙은 line length, obsolete statement, statement 수,
  비교 연산자, spacing, 지역 변수명 등 8개 기본 규칙 중심이다.

따라서 vsp가 “ABAP parser가 필요해서 들어온 최소 컴포넌트”라고 보기는
어렵다. 현재는 ADT, graph, debugger, WASM, JS 평가까지 포함한 전체 CLI
소스이며, 하네스는 그중 lint 일부만 사용한다.

### 8.2 권위 경계

로컬 parser/linter는 빠른 피드백과 명백한 오류 차단에 유용하지만,
SAP 시스템의 실제 CheckSyntax, activation, ATC를 대체할 수 없다.
최종 구문·활성화 권위는 서버 측에 남겨야 한다.

### 8.3 설계 선택지

1. **외부 고정 CLI 사용 — 단기 권고:** vsp를 별도 버전 도구로 설치하고
   플러그인에는 adapter와 pin만 둔다.
2. **최소 라이브러리 추출:** 실제 필요한 `pkg/abaplint` 범위만 별도
   패키지로 관리한다.
3. **전체 소스 내장:** debugger, graph, ADT CLI까지 프로젝트 제품 범위로
   공식 채택한다.

현재 요구가 “로컬 1차 ABAP 검사”라면 1 또는 2가 목적에 맞고, 3은
소유 비용이 과하다.

## 9. 원본 저장소와의 계보·드리프트

### 9.1 sc4sap-custom

- 현재 원본 HEAD: `5e087eda...`
- interactive가 기록한 pin: `a95eb0f...` (2026-07-07)
- pin 이후 공개 영역 변경: 58개
  - transform 36
  - copy 6
  - obsolete 8
  - archive 8
- copy/transform 재검토 필요: 42개

현재 interactive는 일회성 축소본이 아니라 계속 동기화 정책이 필요한
포크다. 전체를 다시 가져오는 방식은 경량화 목표를 되돌리므로 42개를
기능 단위로 선별해야 한다.

### 9.2 abap-mcp-adt-powerup

- 외부 원본: v4.14.0, 1,573파일, 19.85 MiB
- 현재 `engine/`: v4.13.16, 1,601파일, 20.40 MiB
- 공통 상대 경로: 1,565
- 동일: 1,416
- 내용 다름: 149
- 현재만 존재: 36
- 외부에만 존재: 8

현재 engine은 단순 구버전 복사본이 아니라 로컬 변경이 축적된 divergent
fork다. “최신 원본으로 교체”도, “현재 것을 그대로 정본화”도 자동 결정할
수 없으며 149개 변경의 소유권을 먼저 분류해야 한다.

### 9.3 vsp-custom

사용자가 지목한 `D:/claude for SAP/vsp/vsp-custom`의 현재 HEAD는
`0b03ef...`이고 741파일, 12.18 MiB다. 이 저장소에는 현재 내장 vsp가
표시하는 `5a8bedb...` commit object가 없다. 또한
`D:/claude for SAP/vsp-custom` 경로는 존재하지 않는다.

즉 내장 vsp의 실제 수입 계보와 현재 비교 대상으로 기억한 저장소가
일치하지 않는다. 기능 판단 전에 “어느 vsp가 정본인가”를 복원해야 한다.

### 9.4 claude-fable-final

- 현재 외부 HEAD: `b30a706...`
- 저장소 규모: 223파일, 2.33 MiB
- 현재 `scripts/execute.py`: verified v0.17.3과 동일
- 외부의 더 최신 후보와는 상당한 차이
- 현재 저장소에는 fable companion harness skill 전체가 없음

가져온 실행기 파일은 분명하지만, 그 실행기를 둘러싼 worker 계약과 최신
운영 틀은 함께 수입되지 않았다.

## 10. 현재 잘 되어 있는 것

방향이 어긋났다는 판단과 품질이 낮다는 판단은 다르다. 다음 자산은 유지할
가치가 높다.

1. **안전 경계가 명시적이다.** P0~P4, row-data 승인, SAP mutation,
   review/verification의 차이가 코드와 검사에 반영되어 있다.
2. **MCP 표면이 기계 검증된다.** bundle integrity, provenance,
   surface/negative surface 검사가 존재한다.
3. **플러그인 설치 경로가 실제 작동한다.** Claude와 Codex 설치 진단이
   통과했다.
4. **모듈 지식의 폭이 넓다.** 실제 에이전트화는 부족하지만 SAP 상담
   출발점으로 쓸 자산은 이미 있다.
5. **Track A 계약 사고방식은 유용하다.** 실행이 미완성이어도 bounded step,
   review, evidence, retry를 계약으로 분리한 틀은 재사용 가치가 있다.
6. **vsp 로컬 도구는 기술적으로 건강하다.** 오프라인 프로브와 전체 Go
   테스트가 통과했다.
7. **프로비넌스 추적 습관이 있다.** 원본 pin과 변환 규칙을 두어 완전히
   출처 불명인 복사본이 되는 것을 막고 있다.

이 프로젝트는 “잘못 만든 것”보다 **“좋은 부품을 원래 목표보다 넓은 범위로
한곳에 모은 것”**에 가깝다.

## 11. 핵심 불일치와 위험

| 우선도 | 불일치/위험 | 현재 영향 |
|---|---|---|
| P0 | 제품 경계 불명확 | interactive, engine, vsp, harness 중 무엇을 배포·지원할지 판단 불가 |
| P0 | agent와 persona 용어 혼용 | 사용자는 위임을 기대하지만 실제로는 단일 모델 역할극 |
| P0 | ENGINE 실행 가능성 과대 표현 | contract가 있어도 승인 entry에서 launch 불가 |
| P1 | 네 원본의 정본·업데이트 정책 부재 | 업그레이드마다 대규모 수동 비교 필요 |
| P1 | 전체 vsp 내장 대비 실제 사용 범위가 작음 | 유지보수·빌드·보안 표면 증가 |
| P1 | MCP 원본과 동일 번들 이중 보관 | 약 8 MiB 중복 및 release ownership 혼란 |
| P1 | 모듈 지식에 출처·버전 메타데이터 부재 | SAP 릴리스 변화에 따른 신뢰도 하락 |
| P2 | 검증 증거가 제품 코드보다 빠르게 성장 | 새 기능보다 운영 틀 유지가 중심이 될 위험 |

## 12. 내일 결정해야 할 질문

아래 질문에 답하기 전에는 상세 설계를 시작하지 않는 편이 안전하다.

### 12.1 제품 정의

1. 사용자가 설치하는 **제품 아티팩트**는 `interactive/` 하나인가?
2. `engine/`, `vsp/`, `scripts/`는 제품인가, 개발 도구인가,
   vendor source인가?
3. “가볍다”의 1순위 측정 기준은 무엇인가?
   - 설치 용량
   - 노출 tool 수
   - 모델 context/token 비용
   - 시작 시간
   - 업데이트·유지보수 비용

### 12.2 모듈 지원

4. “모듈 에이전트”는 실제 독립 subagent 위임을 뜻하는가, 한 모델의
   persona 전환을 뜻하는가?
5. 15개 모듈 모두를 1차 지원할 것인가, FI/MM/SD 같은 핵심 모듈부터
   검증할 것인가?
6. 모듈 지식의 정본과 적용 SAP 버전은 어떻게 표시할 것인가?

### 12.3 ENGINE

7. 당장 필요한 것은 실행 가능한 autonomous loop인가, 설계 템플릿과
   체크리스트인가?
8. 실행 엔진이 필요하다면 이 저장소가 그 런타임의 소유자가 되는가?
9. unattended를 향후 열 계획이 있는가, attended-only를 제품 원칙으로
   유지할 것인가?

### 12.4 ABAP 검사와 SAP 연결

10. vsp의 역할은 로컬 lint/parser인가, SAP 실행 backend 전체인가?
11. 첫 번째 핵심 workflow는 무엇인가?
    - ABAP 코드 탐색·작성·검증
    - 모듈/Customizing 상담
    - connected read
    - DEV write/execute
    - transport
12. 로컬 검사의 성공 기준과 SAP 서버 검증의 성공 기준을 어디서 나눌
    것인가?

### 12.5 원본 소유권

13. sc4sap, MCP engine, vsp, fable 각각 어느 저장소를 정본으로 삼을
    것인가?
14. vendoring, subtree, release artifact, 외부 설치 중 어떤 방식으로
    업데이트할 것인가?

## 13. 권고 방향 — 검토용 후보

### 13.1 권고 제품 형태

**plugin-first, harness-optional**을 권고한다.

`interactive/`를 유일한 설치 제품으로 정의하고, 나머지는 다음처럼
분리한다.

- MCP: 검증된 release bundle을 생성하는 외부/내부 canonical source
- vsp: 버전 고정된 개발 CLI 또는 최소 lint 라이브러리
- harness: 필요할 때만 설치하는 optional developer kit
- `phases/`: 제품 외부의 archive/evidence

이렇게 하면 이미 구축한 안전·검증 자산을 버리지 않으면서 “가벼운 SAP
플러그인”이라는 설명과 실제 배포물이 일치한다.

### 13.2 권고 모듈 에이전트 형태

26개 전체 팀 시스템을 복원하기보다 **15개 얇은 module consultant
agent**를 권고한다.

- 에이전트 파일은 역할, 입력, 금지 행동, 참조 지식만 가진다.
- 공통 지식은 중복하지 않고 기존 module knowledge를 참조한다.
- 일반 질문은 단일 모듈 agent에 위임한다.
- cross-module 질문만 상위 orchestrator가 2~3개 agent에 제한적으로
  위임한다.
- SAP 변경은 모듈 agent가 직접 실행하지 않고 기존 P3/P4 경계를 따른다.

이 방식은 실제 위임 능력을 회복하면서 원본의 무거운 team round와 병렬
토론 전체를 되살리지 않는다.

### 13.3 권고 구현 순서

| 단계 | 목표 | 완료 기준 |
|---|---|---|
| 0 | 제품 경계와 용어 확정 | 제품/개발도구/vendor/archive 표 1개 승인 |
| 1 | 실제 모듈 agent 최소 복원 | 핵심 3개 모듈 위임 E2E와 지식 provenance |
| 2 | ENGINE 선택 | template-only 선언 또는 runnable black-box 통과 |
| 3 | vsp/MCP 소유권 정리 | canonical source와 update 방식 확정 |
| 4 | 물리적 경량화 | 중복 번들·전체 소스·archive 배치 재구성 |
| 5 | 문서 정리 | 실제 구현과 일치하는 PRD/architecture 갱신 |

설계를 먼저 크게 쓰기보다 단계 0의 한 페이지 결정표를 승인하고 단계 1의
작은 vertical slice로 가정을 검증하는 편이 좋다.

## 14. 내일 검토 기록용 템플릿

아래 표는 2026-07-21 검토 시 바로 채우기 위한 것이다.

| 결정 항목 | 선택지 | 선택 | 근거/제약 |
|---|---|---|---|
| 제품 경계 | interactive-only / monorepo | 미결정 | |
| 모듈 지원 | thin agents / persona-only / full team | 미결정 | |
| ENGINE | template-only / runnable | 미결정 | |
| vsp | external CLI / minimal extract / full embedded | 미결정 | |
| MCP source | external canonical / in-repo canonical | 미결정 | |
| 첫 workflow | ABAP dev / module consult / connected / write / transport | 미결정 | |
| 경량화 KPI | bytes / tools / context / startup / maintenance | 미결정 | |

결정 후 산출할 설계 문서에는 최소한 다음을 포함한다.

1. 제품/개발도구/외부 의존성 경계
2. 런타임 흐름과 신뢰 경계
3. module agent 호출 계약
4. parser/lint와 SAP 서버 검증의 권위 분리
5. 원본별 update·provenance 정책
6. 단계별 migration 및 rollback
7. 수치화된 경량화 acceptance criteria

## 15. 검증 결과와 주의사항

### 15.1 통과한 로컬 검사

- Git local/remote 비교: `main...origin/main = 0/0`
- migration snapshot: 487개, 규칙 81개, target hash 45개
- negative migration: 17/17
- 링크 검사: Markdown 271개, 상대 링크 599개, broken 0
- bundle integrity
- engine provenance
- MCP surface 및 negative surface 16/16
- plugin manifest 검사
- review verdict PowerShell 검사 23/23
- Track A wrapper 검사 16/16
- Track B bridge 검사 17/17
- review-gate Node 검사 102개
- `scripts/test_execute.py`
- `scripts/test_hooks.py`
- vsp `go test -count=1 ./...` (CGO disabled)

Track A wrapper 검사 통과는 wrapper의 실패·WhatIf 게이트가 명세대로
작동한다는 의미이며, 실제 executor launch가 된다는 의미는 아니다.

### 15.2 현재 로컬 진단 이상

MCP engine 테스트는 99 suite 통과, 1 skip, 1 fail이었고 4개 실패가 모두
`deleteLocalIncludesFamily.test.ts`에 모였다. 추적 patch에는 필요한
clear 함수가 있으나 현재 `engine/node_modules`에는 patch marker가 없어,
현 시점 증거로는 소스 결함보다 로컬 dependency install에 patch-package가
적용되지 않은 상태와 일치한다. 깨끗한 재설치 전에는 확정 판정하지 않는다.

플러그인 doctor에서는 Claude와 Codex가 정상이고, Antigravity만 설치
버전 1.1.1이 pin 1.1.4와 달라 1건 실패했다.

이 두 항목은 이번 방향성 진단의 결론을 바꾸지는 않지만 다음 구현 시작 전
개발 환경 baseline을 맞출 필요가 있다.

## 16. 최종 판정

현재 프로젝트의 방향은 원래 구상에서 **부분적으로 벗어났다**. 가장 중요한
이탈은 기능 부족이 아니라 구성요소의 역할이 바뀐 점이다.

- SAP 모듈 **에이전트**를 원했지만 SAP 모듈 **지식 문서**가 남았다.
- 가벼운 설치 제품을 원했지만 무거운 원본과 검증 체계가 한 저장소에
  축적되었다.
- 하네스 템플릿 또는 엔진을 원했지만 템플릿과 실행기 사이의 마지막
  연결이 비어 있다.
- ABAP parser를 원했지만 parser보다 훨씬 큰 vsp 전체를 소유하게 되었다.

반대로 안전 정책, SAP 도구 표면 검증, 모듈 지식, 프로비넌스라는 기반은
이미 충분하다. 그러므로 전면 재작성보다 **제품을 interactive로 좁히고,
얇은 실제 module agent를 복원하며, ENGINE과 vsp를 optional 경계로
분리하는 재구성**이 가장 비용 대비 효과가 높다.

2026-07-21 검토에서는 이 권고를 승인하는 것이 아니라, §12의 질문과
§14의 결정표를 채워 설계의 출발점을 고정한다.
