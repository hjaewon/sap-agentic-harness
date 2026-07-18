# Source Repair Protocol — Editing Existing Server Objects

**Scope.** Every edit to an object that already exists on the server — any `Update*` on an object not created in the current session (function module, class, program, include, DDIC). "Repair" here means changing existing server state, not authoring a new object.

## Read Before Edit — Never Re-Author From the Repo

Repair is: read the server source first → apply a minimal edit on top of it → write → **re-read to confirm the previous edit survived** → mirror to the repo immediately. Never re-author the object from the repo copy and push it over server state — the repo may lag the server (someone edited directly through ADT), and re-authoring silently overwrites those changes.

## Inactive-Version Trap

If an object may hold an unactivated edit, reading with the default `version=active` returns the **pre-edit** source; writing on top of that silently destroys the previous edit. No gate catches it — the update succeeds, syntax is clean, and the already-committed mirror shows no diff. When re-editing an object that may have a pending change, read `version=inactive` first (or check `GetInactiveObjects` before reading).

## "Active Source Returned" Is Not Activation Evidence

A read tool returning "active" source is not proof the object was ever activated — never-activated and non-compiling FMs still return "active" source. Real evidence that an object works =

- group syntax check **0 / 0**, AND
- post-activation source comparison (the source you wrote is the source now active), AND
- an end-to-end **live call**.

## Sibling-Defect False Failure

FM write tools postcheck the entire function group, so a pre-existing defect in a **sibling** FM can report *your* write as failed while the write actually persisted. Re-read the FM before assuming the write was lost — see [`function-module-rule.md`](function-module-rule.md) § Function Group Is One Compile and Activation Unit. For mass repairs across many FMs, use the abapGit path (see [`abapgit-roundtrip-rule.md`](abapgit-roundtrip-rule.md)) instead of serial per-FM writes — it avoids the repeated whole-group postchecks and the false-failure churn they cause.

## Identity-Write Isolation

When a write tool is suspected of false success (or false failure), perform an **identity write** — re-send the exact unchanged source — to separate a tool defect from an edit defect. If the identity write behaves the same way as the real edit, the tool is the variable, not your change.
