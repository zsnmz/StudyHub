import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './config.js';
import { openDb, closeDb } from './db.js';

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

export function pruneBackups(backupDir, keep = 14) {
  if (!fs.existsSync(backupDir)) return [];
  const files = fs.readdirSync(backupDir)
    .filter(function (name) { return /^studyhub-.*\.db$/.test(name); })
    .map(function (name) {
      const file = path.join(backupDir, name);
      return { file, mtime: fs.statSync(file).mtimeMs };
    })
    .sort(function (a, b) { return b.mtime - a.mtime; });
  const removed = [];
  files.slice(Math.max(keep, 1)).forEach(function (item) {
    try { fs.unlinkSync(item.file); removed.push(item.file); } catch (e) { /* ignore */ }
  });
  return removed;
}

export function backupDatabase(db, config) {
  fs.mkdirSync(config.backupDir, { recursive: true });
  const target = path.join(config.backupDir, 'studyhub-' + stamp() + '.db');
  const tmp = target + '.tmp';
  try { fs.unlinkSync(tmp); } catch (e) { /* ignore */ }
  const escaped = tmp.replace(/'/g, "''");
  db.exec("VACUUM INTO '" + escaped + "'");
  const size = fs.statSync(tmp).size;
  if (!size) throw new Error('备份文件为空');
  fs.renameSync(tmp, target);
  const removed = pruneBackups(config.backupDir, config.backupKeep);
  return { file: target, size, removed };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const config = loadConfig();
  const db = openDb(config.dbPath);
  try {
    const result = backupDatabase(db, config);
    console.log('备份完成：' + result.file + ' (' + result.size + ' bytes)');
    if (result.removed.length) console.log('清理旧备份：' + result.removed.length + ' 个');
  } finally {
    closeDb(db);
  }
}