#!/usr/bin/env node
// MIGRATION-MANIFEST.md의 규칙이 원본(sc4sap-custom) 전 파일을 빠짐없이 분류하는지 검증.
// 미분류 파일 존재 → exit 1 / 매칭 0건 규칙 존재 → exit 2 / 완전 → exit 0
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = process.env.SC4SAP_SRC ?? 'D:/claude for SAP/sc4sap-custom';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = path.join(ROOT, 'MIGRATION-MANIFEST.md');
const CLASSES = ['copy', 'transform', 'archive', 'exclude-private', 'obsolete'];

const rules = [];
for (const line of fs.readFileSync(MANIFEST, 'utf8').split('\n')) {
  const m = line.match(/^\|\s*`([^`]+)`\s*\|\s*(copy|transform|archive|exclude-private|obsolete)\s*\|(.*)/);
  if (m) rules.push({ pattern: m[1], cls: m[2], hits: 0, destCell: m[3] });
}
if (!rules.length) {
  console.error('규칙 0개 — 매니페스트 파싱 실패');
  process.exit(1);
}

function toMatcher(p) {
  if (p.endsWith('/**')) {
    const prefix = p.slice(0, -2);
    return (f) => f.startsWith(prefix);
  }
  if (p.includes('*')) {
    const re = new RegExp(
      '^' + p.split('*').map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*') + '$'
    );
    return (f) => re.test(f);
  }
  return (f) => f === p;
}
for (const r of rules) r.match = toMatcher(r.pattern);

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else files.push(path.relative(SRC, full).replaceAll('\\', '/'));
  }
})(SRC);

const counts = Object.fromEntries(CLASSES.map((c) => [c, 0]));
const unmatched = [];
for (const f of files) {
  const r = rules.find((r) => r.match(f));
  if (r) {
    r.hits++;
    counts[r.cls]++;
  } else unmatched.push(f);
}
const dead = rules.filter((r) => !r.hits);

// copy/transform 행의 목적지(3열 backtick 토큰)가 interactive/ 기준으로 실재하는지 검사.
// deferred 행과 backtick 토큰 없는(프로즈만) 행은 목적지 개념이 없어 skip.
let destChecked = 0;
let deferredSkipped = 0;
let noTokenSkipped = 0;
const missingDest = [];
for (const r of rules) {
  if (r.cls !== 'copy' && r.cls !== 'transform') continue;
  if (r.destCell.includes('deferred')) {
    deferredSkipped++;
    continue;
  }
  const tokens = [...r.destCell.matchAll(/`([^`]+)`/g)].map((m) => m[1]).filter((t) => !t.includes('*'));
  if (!tokens.length) {
    noTokenSkipped++;
    continue;
  }
  for (const t of tokens) {
    destChecked++;
    if (!fs.existsSync(path.join(ROOT, t))) missingDest.push({ pattern: r.pattern, token: t });
  }
}

console.log(`원본 파일: ${files.length} (규칙 ${rules.length}개)`);
for (const c of CLASSES) console.log(`  ${c.padEnd(15)} ${counts[c]}`);
if (dead.length) {
  console.log(`\n⚠ 매칭 0건 규칙 ${dead.length}개:`);
  for (const r of dead) console.log('  ' + r.pattern);
}
console.log(`\n목적지 검사: 토큰 ${destChecked}개 (deferred 스킵 ${deferredSkipped}행, 유효 토큰 없음 스킵 ${noTokenSkipped}행)`);
if (missingDest.length) {
  console.log(`❌ 목적지 부재 ${missingDest.length}개:`);
  for (const d of missingDest) console.log(`  ${d.pattern} → ${d.token}`);
}
if (unmatched.length) {
  console.log(`\n❌ 미분류 ${unmatched.length}개:`);
  for (const f of unmatched) console.log('  ' + f);
}
if (unmatched.length || missingDest.length) process.exit(1);
console.log('\n✅ 미분류 0, 목적지 전부 실재 — 검증 통과');
process.exit(dead.length ? 2 : 0);
