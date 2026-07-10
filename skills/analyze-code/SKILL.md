---
name: analyze-code
description: ABAP code review procedure — read source, run AST/semantic/where-used analysis, evaluate 14 dimensions against the rule files, and report severity-rated findings with fixes
---

# analyze-code (wrapper)

1. Resolve project context first: read `${CLAUDE_PLUGIN_ROOT}/core/project-context.md` and the project's `.sc4sap/config.json`.
2. Read `${CLAUDE_PLUGIN_ROOT}/core/procedures/analyze-code.md` and follow it exactly, in order, honoring every gate.
3. Policies in `${CLAUDE_PLUGIN_ROOT}/core/policies/` override convenience. Personas live in `${CLAUDE_PLUGIN_ROOT}/core/personas/`.

Task: {{ARGUMENTS}}
