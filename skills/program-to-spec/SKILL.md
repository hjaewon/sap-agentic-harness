---
name: program-to-spec
description: Reverse-engineer an ABAP program into a Functional/Technical Specification artifact (Markdown or Excel). Socratic scope narrowing from "everything" to "only what the user needs".
---

# program-to-spec (wrapper)

1. Resolve project context first: read `${CLAUDE_PLUGIN_ROOT}/core/project-context.md` and the project's `.sc4sap/config.json`.
2. Read `${CLAUDE_PLUGIN_ROOT}/core/procedures/program-to-spec.md` and follow it exactly, in order, honoring every gate.
3. Policies in `${CLAUDE_PLUGIN_ROOT}/core/policies/` override convenience. Personas live in `${CLAUDE_PLUGIN_ROOT}/core/personas/`.

Task: {{ARGUMENTS}}
