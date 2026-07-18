# abapGit Round-Trip Rule — Line Endings, Mirror Completeness, Pull Semantics

**Scope.** Any workflow that serializes ABAP objects to a Git working tree and moves them through abapGit — ZIP export/import, offline repo mirror, or bulk multi-FM repair via the abapGit path instead of serial `Update*` writes.

## Line Endings — LF only

abapGit serialization is LF (UTF-8 BOM + LF). Never ZIP a working tree produced on a `core.autocrlf=true` machine as-is — every `.abap` line gains a trailing CR and activation fails with "period missing" (the CR lands where ABAP expects the statement terminator). The failure misdiagnoses badly: `.xml` files are parser-normalized so they stay asymptomatic, which makes the symptom read as "structures work but FMs are broken" when the real cause is CRs across every source file.

Fix — both halves are required:

- Pin `* text eol=lf` in `.gitattributes` so the working tree stays LF.
- After building the ZIP, verify the archive contains **zero CRLF bytes** in every `.abap` entry — the `.gitattributes` pin alone does not prove the bytes that actually landed in the ZIP are clean.

## FUGR Pull Is Delete-and-Recreate

Pulling a function group is delete-and-recreate, not merge — **mirror completeness is critical**. Pulling a partial ZIP silently deletes the objects missing from it. Never pull a partial function-group mirror; always pull a complete FUGR mirror containing every member.

## Overwrite-All on Pull Is Normal (after direct ADT edits)

After the server has been edited directly through ADT tools, expect the Pull confirmation to list **every** object as Overwrite — every object now differs from abapGit's last-known state. With a full same-source mirror ZIP this is harmless: it is the same source being re-applied, not data loss.

## Skip SUSH Delete Proposals

Skip any SUSH (start-authorization) delete proposal on Pull. SUSH entries are auto-generated start-authorization defaults for RFC-enabled FMs, managed outside the repo — accepting the delete removes system-managed data the mirror never owned.

## Structure Serialization Fields

When hand-checking or hand-authoring a serialized structure:

- Data-element-typed fields serialize as `ROLLNAME` + `COMPTYPE E`.
- Built-in-typed fields serialize as `DATATYPE` / `LENG` / `DECIMALS`.
- `CURR` fields additionally need `REFTABLE` / `REFFIELD` for the currency reference — omitting it yields an incomplete/invalid field.

## Caveat — Re-Verify Per Server

These serialization details are specific to the abapGit build installed on the target server. Before the first round-trip on a new server, Export one known object through abapGit and re-confirm every rule above against what that server actually produces. Do not treat these as invariant until you have checked.
