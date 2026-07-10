---
name: analyze-symptom
description: Step-by-step root cause analysis for SAP operational errors — inspect dumps, logs, transports, and where-used relations directly via MCP, narrow hypotheses with minimal user questions, and provide SAP Note search keywords
---

# analyze-symptom (wrapper)

1. Resolve project context first: read `${CLAUDE_PLUGIN_ROOT}/core/project-context.md` and the project's `.sc4sap/config.json`.
2. Read `${CLAUDE_PLUGIN_ROOT}/core/procedures/analyze-symptom.md` and follow it exactly, in order, honoring every gate.
3. Policies in `${CLAUDE_PLUGIN_ROOT}/core/policies/` override convenience. Personas live in `${CLAUDE_PLUGIN_ROOT}/core/personas/`.

Task: {{ARGUMENTS}}
