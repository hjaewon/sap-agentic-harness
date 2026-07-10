#!/usr/bin/env node
// trust-session 대체: server/tool-catalog에서 도구를 열거해 정적 권한 템플릿 생성.
// GetTableContents/GetSqlQuery는 정책상 절대 포함하지 않는다 (매 호출 사람 승인).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = path.join(ROOT, 'server', 'tool-catalog');
const NAMESPACE = process.env.SC4SAP_LITE_NS ?? 'mcp__plugin_sc4sap-lite_sap__';
const EXCLUDE = new Set(['GetTableContents', 'GetSqlQuery']);

const names = new Set();
for (const f of fs.readdirSync(CATALOG)) {
  if (!/sc4sap-mcp-tools-(read|write|runtime)\.md$/.test(f)) continue;
  for (const m of fs.readFileSync(path.join(CATALOG, f), 'utf8').matchAll(/^- `?(?:mcp__[A-Za-z0-9_-]+__)?([A-Za-z]\w+)`?\s*$/gm)) {
    if (!EXCLUDE.has(m[1])) names.add(m[1]);
  }
}
if (!names.size) { console.error('카탈로그에서 도구 0개 — 파싱 실패'); process.exit(1); }

const template = {
  _comment: [
    'sc4sap-lite 정적 권한 템플릿 (구 trust-session 대체).',
    '프로젝트 .claude/settings.local.json의 permissions.allow에 병합해 사용.',
    'GetTableContents/GetSqlQuery는 의도적으로 제외 — 매 호출 사람 승인 (data-extraction-policy).',
    '주의: 네임스페이스 접두어는 설치 후 실제 도구명으로 검증할 것 (README 참조).',
  ],
  permissions: {
    allow: [
      ...[...names].sort().map((n) => NAMESPACE + n),
      'Read(.sc4sap/**)',
      'Write(.sc4sap/**)',
      'Edit(.sc4sap/**)',
      'Glob(.sc4sap/**)',
      'Grep(.sc4sap/**)',
    ],
  },
};
const out = path.join(ROOT, 'adapters', 'claude', 'permissions-template.json');
fs.writeFileSync(out, JSON.stringify(template, null, 2) + '\n');
console.log(`도구 ${names.size}개 (제외 2종 미포함) → ${path.relative(ROOT, out)}`);
