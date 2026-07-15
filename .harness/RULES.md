# Rules

<!-- Cap: 40 rules (engine warns above; the only hard startup gate is 16KB
     total). F3 proactive audit starts at >=30 rules or >=12KB; this is a
     maintenance trigger, not a hard gate. Engine behavior remains >40 rules
     WARN and >16KB hard startup refusal. Add or merge only via the Memory Loop
     (.harness/PROTOCOL.md). One line each:

- R-NNN [area] short imperative rule (from L-NNN)

     Prefer negative constraints ("do not X - it causes Y") over positive
     style guidance ("write clean X"). Prohibitions tied to a concrete
     failure steer sessions of any model strength; aspirational wording
     does not, and dilutes the rules that matter.

     Style, persona, and tone guidance are not RULES material at all -
     route them to project docs (harness-docs). RULES is reserved for
     verified prohibitions and invariants.
-->

- R-001 [verify] ENV_FAIL/LOCK_FAIL 마커가 찍힌 verify 실패를 코드 결함으로 기록하거나 규칙 승격 후보로 올리지 않는다 — 환경 실패는 LESSONS 오염원 (from tailor)
- R-002 [vsp] vsp를 MCP 서버 모드로 기동하지 않는다 — 트랙 A는 CLI 전용, powerup MCP와 도구 중복·권한 이원화 (from tailor)
- R-003 [sap-safety] QA/PRD tier SAP 시스템에 vsp write(deploy/copy/execute 등)를 실행하지 않는다 — write는 DEV tier에서만 (from tailor)
- R-004 [repo] 동결 레포(sc4sap-custom·sc4sap-lite)를 수정하지 않으며 sc4sap-custom/private/는 읽지도 않는다 (from tailor)
- R-005 [secrets] SAP 접속 정보(호스트·자격증명·.env 내용)를 레포에 커밋하지 않는다 (from tailor)
- R-006 [vsp] SAP write(deploy/copy) 후 성공 보고만 믿지 말고 `vsp source read`로 반영을 확인한다 — CLAS 거짓 성공 실증 이력(L-001; v2.38.1-89에서 수리 완료·라이브 검증). v2.38.1-89 미만 빌드로 CLAS deploy/copy를 실행하지 않는다 (from L-001)
- R-007 [fi-version] S/4HANA 대상에서 전표 라인아이템 금액을 BSEG에서 SELECT하지 않는다 — 금액 소스는 ACDOCA(Universal Journal)+리딩원장 한정(rldnr = '0L'). BSEG은 rldnr가 없어 원장 한정이 구조적으로 불가하며, lint·유닛테스트를 전부 통과해 리뷰에서만 드러난다(4a 씨앗 차단 실증) (from L-002)
