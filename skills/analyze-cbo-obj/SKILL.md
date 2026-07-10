---
name: analyze-cbo-obj
description: Analyze a CBO (Customer Business Object) package — discover frequently-used Z tables / function modules / data elements / classes / structures / table types — and save a per-module / per-package reference file so later program / program-to-spec runs prefer existing CBO elements over new ones.
---

# analyze-cbo-obj (wrapper)

1. Resolve project context first: read `${CLAUDE_PLUGIN_ROOT}/core/project-context.md` and the project's `.sc4sap/config.json`.
2. Read `${CLAUDE_PLUGIN_ROOT}/core/procedures/analyze-cbo-obj.md` and follow it exactly, in order, honoring every gate.
3. Policies in `${CLAUDE_PLUGIN_ROOT}/core/policies/` override convenience. Personas live in `${CLAUDE_PLUGIN_ROOT}/core/personas/`.

Task: {{ARGUMENTS}}
