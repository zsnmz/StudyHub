import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS progress (
    profile_id TEXT PRIMARY KEY,
    data       TEXT NOT NULL,
    rev        INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS progress_history (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id TEXT NOT NULL,
    rev        INTEGER NOT NULL,
    data       TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_history_profile
    ON progress_history(profile_id, id DESC);
  CREATE TABLE IF NOT EXISTS feedback (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at  TEXT NOT NULL,
    category    TEXT NOT NULL,
    message     TEXT NOT NULL,
    contact     TEXT,
    page        TEXT,
    track       TEXT,
    app_version TEXT,
    sync_id     TEXT,
    user_agent  TEXT
  );
  PRAGMA user_version = 2;
`;

export function openDb(dbPath) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  return db;
}

function parseData(json) {
  try { return JSON.parse(json); } catch (e) { return null; }
}

function rowToProgress(row) {
  if (!row) return null;
  return {
    profileId: row.profile_id,
    data: parseData(row.data),
    rev: row.rev,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function getProgress(db, profileId) {
  const row = db.prepare('SELECT * FROM progress WHERE profile_id = ?').get(profileId);
  return rowToProgress(row);
}

export function saveProgress(db, profileId, data, options = {}) {
  const json = JSON.stringify(data);
  if (typeof json !== 'string') throw new Error('进度数据无法序列化');
  const now = new Date().toISOString();
  const force = options.force === true;
  const baseRev = options.baseRev == null ? null : Number(options.baseRev);

  db.exec('BEGIN IMMEDIATE');
  try {
    const row = db.prepare('SELECT * FROM progress WHERE profile_id = ?').get(profileId);
    if (!row) {
      db.prepare(
        'INSERT INTO progress(profile_id, data, rev, created_at, updated_at) VALUES (?, ?, 1, ?, ?)'
      ).run(profileId, json, now, now);
      db.prepare(
        'INSERT INTO progress_history(profile_id, rev, data, created_at) VALUES (?, 1, ?, ?)'
      ).run(profileId, json, now);
      db.exec('COMMIT');
      return { conflict: false, rev: 1, updatedAt: now, created: true };
    }

    if (!force && baseRev !== row.rev) {
      db.exec('ROLLBACK');
      return { conflict: true, current: rowToProgress(row) };
    }

    const rev = row.rev + 1;
    db.prepare('UPDATE progress SET data = ?, rev = ?, updated_at = ? WHERE profile_id = ?')
      .run(json, rev, now, profileId);
    db.prepare(
      'INSERT INTO progress_history(profile_id, rev, data, created_at) VALUES (?, ?, ?, ?)'
    ).run(profileId, rev, json, now);
    db.prepare(
      'DELETE FROM progress_history WHERE profile_id = ? AND id NOT IN ' +
      '(SELECT id FROM progress_history WHERE profile_id = ? ORDER BY id DESC LIMIT 50)'
    ).run(profileId, profileId);
    db.exec('COMMIT');
    return { conflict: false, rev, updatedAt: now, created: false };
  } catch (err) {
    try { db.exec('ROLLBACK'); } catch (e) { /* ignore */ }
    throw err;
  }
}

export function listHistory(db, profileId, limit = 50) {
  const n = Math.min(Math.max(Number(limit) || 50, 1), 200);
  return db.prepare(
    'SELECT rev, created_at FROM progress_history WHERE profile_id = ? ORDER BY id DESC LIMIT ?'
  ).all(profileId, n).map(function (row) {
    return { rev: row.rev, createdAt: row.created_at };
  });
}

export function getRevisionData(db, profileId, rev) {
  const row = db.prepare(
    'SELECT data FROM progress_history WHERE profile_id = ? AND rev = ? ORDER BY id DESC LIMIT 1'
  ).get(profileId, Number(rev));
  if (!row) return null;
  return parseData(row.data);
}

export function stats(db) {
  const p = db.prepare('SELECT COUNT(*) AS count, COALESCE(SUM(rev), 0) AS revs FROM progress').get();
  const h = db.prepare('SELECT COUNT(*) AS count FROM progress_history').get();
  const f = db.prepare('SELECT COUNT(*) AS count FROM feedback').get();
  return { profiles: p.count, revisions: p.revs, historyRows: h.count, feedbackRows: f.count };
}

const FEEDBACK_CATEGORIES = new Set(['bug', 'content', 'feature', 'other']);

function cleanText(value, max) {
  if (value == null) return '';
  return String(value).replace(/\s+/g, ' ').trim().slice(0, max);
}

export function addFeedback(db, input) {
  const category = FEEDBACK_CATEGORIES.has(input.category) ? input.category : 'other';
  const message = cleanText(input.message, 2000);
  if (message.length < 5) throw new Error('反馈内容至少 5 个字');
  const row = {
    created_at: new Date().toISOString(),
    category,
    message,
    contact: cleanText(input.contact, 120) || null,
    page: cleanText(input.page, 200) || null,
    track: cleanText(input.track, 20) || null,
    app_version: cleanText(input.app_version, 40) || null,
    sync_id: cleanText(input.sync_id, 64) || null,
    user_agent: cleanText(input.user_agent, 300) || null
  };
  const result = db.prepare(
    `INSERT INTO feedback(created_at, category, message, contact, page, track, app_version, sync_id, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(row.created_at, row.category, row.message, row.contact, row.page, row.track, row.app_version, row.sync_id, row.user_agent);
  return { id: Number(result.lastInsertRowid), createdAt: row.created_at };
}

export function listFeedback(db, limit = 100) {
  const n = Math.min(Math.max(Number(limit) || 100, 1), 500);
  return db.prepare('SELECT * FROM feedback ORDER BY id DESC LIMIT ?').all(n);
}

export function closeDb(db) {
  try { db.close(); } catch (e) { /* ignore */ }
}