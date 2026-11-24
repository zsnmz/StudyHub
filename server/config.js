import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function pickDir(value, fallback) {
  if (!value) return fallback;
  return path.isAbsolute(value) ? value : path.resolve(ROOT, value);
}

function pickInt(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) return fallback;
  return Math.floor(n);
}

export function loadConfig(overrides = {}) {
  const env = process.env;
  const dataDir = pickDir(overrides.dataDir || env.DATA_DIR, path.join(ROOT, 'server', 'data'));
  const backupDir = pickDir(overrides.backupDir || env.BACKUP_DIR, path.join(ROOT, 'server', 'backups'));
  const cfg = {
    root: ROOT,
    publicRoot: path.resolve(overrides.publicRoot || ROOT),
    dataDir,
    backupDir,
    dbPath: path.resolve(overrides.dbPath || path.join(dataDir, 'studyhub.db')),
    host: overrides.host || env.HOST || '127.0.0.1',
    port: pickInt(overrides.port ?? env.PORT, 8787, 0, 65535),
    corsOrigin: overrides.corsOrigin || env.CORS_ORIGIN || '*',
    maxBodyBytes: pickInt(overrides.maxBodyBytes ?? env.MAX_BODY_BYTES, 2 * 1024 * 1024, 1024, 20 * 1024 * 1024),
    backupEnabled: overrides.backupEnabled !== false,
    backupKeep: pickInt(overrides.backupKeep ?? env.BACKUP_KEEP, 14, 1, 365),
    backupIntervalHours: pickInt(overrides.backupIntervalHours ?? env.BACKUP_INTERVAL_HOURS, 24, 1, 24 * 30),
    logRequests: overrides.logRequests !== false,
    logger: overrides.logger || console
  };
  return cfg;
}