---
name: release
description: CTS transport release procedure — list transports, validate pre-release conditions, release, and confirm import readiness
source:
  - sc4sap-custom/skills/release/SKILL.md
---

# Release Transport (CTS)

Full CTS (Change and Transport System) transport release procedure for a single agent. This is a **Guided-P4** path — there is no Direct-P4 entry. Transport selection, validation, and the release are attended: a present human operator confirms the exact task number and parent request number before the release call. Import is Basis / STMS only.

## Purpose

Guide the complete CTS transport release process: listing available transports, selecting the target, validating pre-release conditions, performing the release, and confirming import readiness. It prevents releasing transports with syntax errors or inactive objects.

## Use When

- User says "release", "release transport", "release CTS", "push to QAS", or "transport release"
- A development cycle is complete and objects need to move to the next system (QAS/PRD)
- User wants to validate a transport before releasing
- User wants to check what is in a transport before releasing

## Do Not Use When

- User wants to create a new transport — use the [create-object](create-object.md) procedure (which handles transport assignment) or `CreateTransport` directly
- User wants to import a transport (import is done on the target system by Basis)
- Task is not transport-related

## Track A Policy Alignment (attended-only) — P4

Transport release is **P4** and irreversible-adjacent. Apply the Policy:

- **No Direct-P4 entry.** This path is **Guided-P4**. It is never run unattended
  (`unattended` is sealed — D-025 §7).
- **Readiness is separated from release.** Steps 1–3 (list · select · validate) plus
  the inventory establish **READY_FOR_RELEASE**. They perform no release.
- **The release itself needs explicit per-object human approval.** Before calling
  `ReleaseTransport`, present the exact task number AND its parent request number to
  the operator and get an affirmative for each. A single earlier "release it"
  confirmation does NOT authorize the actual release call.
- **`supported: false` is BLOCKED**, not a soft skip — stop and route to manual
  SE09 / SE10 / STMS.
- **Import is Basis / STMS only** — this procedure never imports to QAS/PRD.

Selecting a transport confirms *which* transport; it does not pre-authorize the
release. The release call is a second, explicit, per-task-and-parent approval.

## Workflow Steps

### Step 1 — List Transports (auto)

- Call `ListTransports` to retrieve open modifiable transports
- Display table: Transport No | Description | Owner | Object Count | Last Changed
- Highlight transports owned by current user

### Step 2 — Select Transport (confirmation gate)

- Present the list and ask: "Which transport do you want to release? (Enter transport number)"
- User confirms the transport number
- Call `GetTransport` to show full transport details including the object list

### Step 3 — Pre-Release Validation (attended, after selection)

- **Syntax check**: For each ABAP source object in the transport (class / program / interface / include / function module), verify via `CheckSyntax` — a server-side ADT check run against the staged version (function modules additionally require `function_group_name` — resolve it from the transport object list's `R3TR FUGR` entry, or via `SearchObject` on the FM name) — abort if any syntax errors. Non-source objects (DDIC etc.) are covered by the inactive-objects check below
- **Inactive objects check**: Call `GetInactiveObjects` — abort if any objects in the transport are still inactive
- **Object completeness**: Verify all referenced objects (used classes, interfaces) are either in this transport or already in the target system
- Display validation report: PASS / FAIL per check

### Step 4 — Release (attended, only if Step 3 all PASS — explicit per-task + parent approval)

- If any validation failed: display errors and stop — do NOT release.
- Before any `ReleaseTransport` call, present to the operator the **exact task
  number(s)** and the **parent request number**, and get an explicit affirmative for
  each. A prior transport-selection confirmation is NOT this approval. Acceptable
  keywords: `승인` / `approve` / `approved` / `release` / `confirmed`; anything
  ambiguous ("go", "ok", "빨리", silence) is NOT approval.
- On approval: call `ReleaseTransport` — release the open task(s) first, then the
  parent request (SAP requires tasks released before the request). Re-confirm the
  parent request number immediately before releasing it.
- If the response reports `supported: false` (ADT release action unavailable on this
  system): this is **BLOCKED** — stop and instruct manual release via SE09 / SE10 or
  STMS. Do not treat it as a skip.
- Report release result: transport number, release status returned by SAP, timestamp.
- Actual QAS/PRD import is out of scope here — Basis / STMS only (see Step 5).

### Step 5 — Import Confirmation

- Display post-release summary:
  - Transport number and description
  - Released-at timestamp
  - Object count
  - Target system(s) in transport route
- Reminder: "Transport released. Import on target system must be triggered by Basis or via STMS."
- Optionally display next steps for the target system import queue

## Error Handling

- Syntax errors found: list each object with error message; do not release; suggest fix via direct MCP `Update*` calls or re-run the `create-program` procedure
- Inactive objects found: list each inactive object; do not release; suggest activation
- Transport already released: report status and skip release step
- Authorization error on release: report S_TRANSPRT authorization requirement

## Backend Tools Used

- `ListTransports` — retrieve open transports
- `GetTransport` — transport details and object list
- `CheckSyntax` — server-side syntax validation per source object
- `ReleaseTransport` — perform the CTS release (tasks first, then the request)
- `GetInactiveObjects` — check for inactive objects
