#!/usr/bin/env node
// 레포 내 모든 .md의 상대 링크가 실재하는 파일/디렉토리를 가리키는지,
// #앵커가 대상 문서(또는 자기 자신)의 헤딩에 실재하는지 검증.
// 깨진 링크/앵커 존재 → exit 1
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.argv[2] ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['.git', 'node_modules']);

const mdFiles = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith('.md')) mdFiles.push(full);
  }
})(ROOT);

// GitHub 스타일 헤딩 슬러그: 서식 제거(백틱/굵게/링크는 텍스트만) → trim → 소문자 →
// 유니코드 문자·숫자·공백·하이픈·언더스코어 외 제거 → 공백을 하이픈으로.
function slugify(headingText) {
  const plain = headingText
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  return plain
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');
}

// 파일의 ATX 헤딩(# ~ ######)에서 슬러그 집합을 만든다. fenced code block(```) 내부는 제외.
// 같은 파일 내 중복 슬러그는 두 번째부터 -1, -2 접미.
function extractHeadingSlugs(text) {
  const slugs = new Set();
  const counts = new Map();
  let inFence = false;
  for (const line of text.split('\n')) {
    if (/^ {0,3}```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^ {0,3}(#{1,6})\s+(.+?)\s*$/);
    if (!m) continue;
    const base = slugify(m[2]);
    if (!base) continue;
    const n = counts.get(base) ?? 0;
    counts.set(base, n + 1);
    slugs.add(n === 0 ? base : `${base}-${n}`);
  }
  return slugs;
}

const slugCache = new Map();
function getSlugs(file) {
  if (slugCache.has(file)) return slugCache.get(file);
  let slugs;
  try {
    slugs = extractHeadingSlugs(fs.readFileSync(file, 'utf8'));
  } catch {
    slugs = new Set();
  }
  slugCache.set(file, slugs);
  return slugs;
}

const LINK_RE = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
let broken = 0;
let checked = 0;
for (const file of mdFiles) {
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(LINK_RE)) {
    const target = m[1];
    if (/^(https?:|mailto:|<)/.test(target)) continue;

    if (target.startsWith('#')) {
      // 순수 #anchor 링크 — 같은 파일의 헤딩 슬러그와 대조
      const anchor = decodeURIComponent(target.slice(1));
      if (!anchor) continue;
      checked++;
      if (!getSlugs(file).has(anchor)) {
        broken++;
        console.log(`❌ ${path.relative(ROOT, file)} → ${target} (앵커 없음)`);
      }
      continue;
    }

    const hashIdx = target.indexOf('#');
    const rawPath = hashIdx === -1 ? target : target.slice(0, hashIdx);
    const rawAnchor = hashIdx === -1 ? '' : target.slice(hashIdx + 1);
    const targetPath = decodeURIComponent(rawPath);
    if (!targetPath) continue;
    checked++;
    const resolved = path.resolve(path.dirname(file), targetPath);
    if (!fs.existsSync(resolved)) {
      broken++;
      console.log(`❌ ${path.relative(ROOT, file)} → ${target}`);
      continue;
    }
    // file.md#anchor — 대상이 실재하는 .md 파일일 때만 앵커 검증 (디렉터리·비-md는 skip)
    if (rawAnchor && resolved.toLowerCase().endsWith('.md') && fs.statSync(resolved).isFile()) {
      const anchor = decodeURIComponent(rawAnchor);
      if (!getSlugs(resolved).has(anchor)) {
        broken++;
        console.log(`❌ ${path.relative(ROOT, file)} → ${target} (앵커 없음)`);
      }
    }
  }
}
console.log(`\nmd ${mdFiles.length}개, 상대 링크 ${checked}개 검사, 깨짐 ${broken}개`);
process.exit(broken ? 1 : 0);
