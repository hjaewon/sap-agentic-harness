// 이식 목적지 자산의 내용 해시 — build-migration-snapshot과 check-migration-snapshot의
// **공유 계약**. 두 곳에 복제하면 조용히 갈라져 게이트가 무력해지므로 여기 한 곳에만 둔다.
//
// EOL 정규화가 필수인 이유 (2026-07-16 실측):
//   이 레포엔 .gitattributes가 없고 core.autocrlf=true라, 같은 커밋이라도
//   Windows 체크아웃은 CRLF · Linux(CI) 체크아웃은 LF다. 원시 바이트를 해시하면
//   같은 내용이 플랫폼마다 다른 해시가 되어 ubuntu 러너에서 게이트가 거짓 FAIL한다.
//   provenance가 봐야 하는 것은 **내용**이지 체크아웃의 EOL 관습이 아니다.
//   → 텍스트는 CRLF를 LF로 정규화한 뒤 해시한다. 바이너리는 손대지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');

// NUL 바이트 휴리스틱 — git의 바이너리 판정과 같은 관습.
export function isBinary(buf) {
  const n = Math.min(buf.length, 8000);
  for (let i = 0; i < n; i++) if (buf[i] === 0) return true;
  return false;
}

// 체크아웃 EOL과 무관한 내용 해시.
// 정규화는 **바이트 수준**으로 한다: toString('utf8')로 왕복하면 잘못된 UTF-8 바이트가
// U+FFFD로 치환돼 내용이 조용히 바뀐다(해시가 거짓말을 하게 된다). CRLF(0x0D 0x0A) 쌍만
// LF(0x0A)로 접으면 인코딩을 몰라도 안전하다.
export function hashContent(buf) {
  if (isBinary(buf)) return sha256(buf);
  const out = Buffer.allocUnsafe(buf.length);
  let n = 0;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 0x0d && buf[i + 1] === 0x0a) continue; // CRLF → LF
    out[n++] = buf[i];
  }
  return sha256(out.subarray(0, n));
}

// 목적지 토큰(파일 또는 디렉터리) → { kind, sha256, files? }
// 디렉터리는 정렬된 '<relpath> <contenthash>\n' 라인들의 해시(tree hash).
export function hashTarget(root, token) {
  const abs = path.join(root, token);
  if (!fs.existsSync(abs)) return null;
  if (fs.statSync(abs).isFile()) return { kind: 'file', sha256: hashContent(fs.readFileSync(abs)) };

  const files = [];
  (function walk(d) {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) walk(full);
      else files.push(full);
    }
  })(abs);

  // 경로 문자열 기준 정렬 — 플랫폼 구분자를 '/'로 통일한 뒤 정렬해야 재현된다.
  const rows = files
    .map((f) => ({ rel: path.relative(abs, f).replaceAll('\\', '/'), abs: f }))
    .sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0));

  const lines = rows.map((r) => `${r.rel} ${hashContent(fs.readFileSync(r.abs))}\n`);
  return { kind: 'tree', files: rows.length, sha256: sha256(lines.join('')) };
}
