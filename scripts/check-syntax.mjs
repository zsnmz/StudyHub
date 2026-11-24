/* 全项目 JavaScript 语法检查。
 * 用法：node scripts/check-syntax.mjs
 * 说明：只做 `node --check`，不执行代码；用于提交前快速发现语法错误。
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set([
  '.git', 'node_modules', '.work', '.deploy', '.trae-html-share-packages',
  '.screenshots', 'backups'
]);
const SKIP_PATH_PARTS = ['server' + path.sep + 'backups', 'server' + path.sep + 'data'];

function shouldSkip(file) {
  const rel = path.relative(root, file);
  if (SKIP_PATH_PARTS.some(function (part) { return rel.startsWith(part); })) return true;
  return rel.split(path.sep).some(function (part) { return SKIP_DIRS.has(part); });
}

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name);
    let stat;
    try { stat = fs.statSync(file); } catch (e) { continue; }
    if (stat.isDirectory()) {
      if (!shouldSkip(file)) walk(file, out);
      continue;
    }
    if (!stat.isFile()) continue;
    if (shouldSkip(file)) continue;
    if (/\.(js|mjs)$/i.test(name)) out.push(file);
  }
  return out;
}

const files = walk(root, []).sort();
let failed = 0;
for (const file of files) {
  const rel = path.relative(root, file);
  const r = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (r.status === 0) {
    console.log('OK   ' + rel);
  } else {
    failed++;
    console.error('FAIL ' + rel);
    if (r.stderr) console.error(r.stderr.trim());
  }
}

console.log('\n检查 ' + files.length + ' 个文件，失败 ' + failed + ' 个。');
process.exitCode = failed ? 1 : 0;