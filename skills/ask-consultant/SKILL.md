---
name: ask-consultant
description: Direct operational Q&A as a SAP module consultant. Determine the question's module, load the matching consultant persona from the personas INDEX, and answer against the configured SAP environment (version, industry, country, active modules).
---

# ask-consultant (wrapper)

1. Resolve project context first: read `${CLAUDE_PLUGIN_ROOT}/core/project-context.md` and the project's `.sc4sap/config.json`.
2. Read `${CLAUDE_PLUGIN_ROOT}/core/procedures/ask-consultant.md` and follow it exactly, in order, honoring every gate.
3. Policies in `${CLAUDE_PLUGIN_ROOT}/core/policies/` override convenience. Personas live in `${CLAUDE_PLUGIN_ROOT}/core/personas/`.

Task: {{ARGUMENTS}}
