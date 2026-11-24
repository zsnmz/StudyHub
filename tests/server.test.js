import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { start } from '../server/index.js';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'studyhub-test-'));
const app = await start({
  port: 0,
  host: '127.0.0.1',
  dataDir: path.join(tmp, 'data'),
  backupDir: path.join(tmp, 'backups'),
  backupEnabled: false,
  logRequests: false,
  logger: { log() {}, error() {} }
});
const base = app.url;
const profileId = 'test-' + Date.now().toString(36);

async function call(method, p, body) {
  const res = await fetch(base + p, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* ignore */ }
  return { status: res.status, text, json };
}

test('health and static files', async () => {
  const health = await call('GET', '/api/health');
  assert.equal(health.status, 200);
  assert.equal(health.json.ok, true);
  assert.equal(health.json.app, 'studyhub');

  const home = await call('GET', '/');
  assert.equal(home.status, 200);
  assert.match(home.text, /学习舱 StudyHub/);

  const js = await call('GET', '/assets/js/sync.js');
  assert.equal(js.status, 200);
  assert.match(js.text, /本地优先/);
  assert.match(js.text, /studyhub\.sync\.id/);
});

test('progress write, read, conflict and history', async () => {
  const created = await call('PUT', '/api/progress/' + profileId, { data: { a: 1 } });
  assert.equal(created.status, 200);
  assert.equal(created.json.ok, true);
  assert.equal(created.json.rev, 1);

  const read = await call('GET', '/api/progress/' + profileId);
  assert.equal(read.status, 200);
  assert.deepEqual(read.json.data, { a: 1 });
  assert.equal(read.json.rev, 1);

  const next = await call('PUT', '/api/progress/' + profileId, { data: { a: 2 }, baseRev: 1 });
  assert.equal(next.status, 200);
  assert.equal(next.json.rev, 2);

  const conflict = await call('PUT', '/api/progress/' + profileId, { data: { a: 3 }, baseRev: 1 });
  assert.equal(conflict.status, 409);
  assert.equal(conflict.json.error.code, 'conflict');
  assert.equal(conflict.json.current.rev, 2);

  const history = await call('GET', '/api/progress/' + profileId + '/history');
  assert.equal(history.status, 200);
  assert.equal(history.json.history.length, 2);

  const restore = await call('POST', '/api/progress/' + profileId + '/restore', { rev: 1 });
  assert.equal(restore.status, 200);
  assert.equal(restore.json.restoredFrom, 1);
  assert.equal(restore.json.rev, 3);

  const after = await call('GET', '/api/progress/' + profileId);
  assert.deepEqual(after.json.data, { a: 1 });
});

test('validation and path traversal', async () => {
  const badId = await call('GET', '/api/progress/短');
  assert.equal(badId.status, 400);
  assert.equal(badId.json.error.code, 'invalid_profile_id');

  const badData = await call('PUT', '/api/progress/' + profileId, { data: [] });
  assert.equal(badData.status, 400);
  assert.equal(badData.json.error.code, 'invalid_data');

  const traversal = await call('GET', '/assets/../server/db.js');
  assert.equal(traversal.status, 404);
});

test('feedback accepts anonymous insert and validates fields', async () => {
  const ok = await call('POST', '/api/feedback', {
    category: 'bug',
    message: '测试反馈：设置页提交是否成功。',
    contact: 'test@example.com',
    page: '#settings',
    track: 'cet6',
    app_version: '0.6.1'
  });
  assert.equal(ok.status, 201);
  assert.equal(ok.json.ok, true);
  assert.ok(ok.json.id > 0);

  const tooShort = await call('POST', '/api/feedback', { category: 'other', message: '短' });
  assert.equal(tooShort.status, 400);
  assert.equal(tooShort.json.error.code, 'invalid_message');

  const badCategory = await call('POST', '/api/feedback', { category: 'spam', message: '这是一条类型不合法的反馈。' });
  assert.equal(badCategory.status, 400);
  assert.equal(badCategory.json.error.code, 'invalid_category');

  const stats = await call('GET', '/api/stats');
  assert.equal(stats.status, 200);
  assert.ok(stats.json.stats.feedbackRows >= 1);
});

test('backup copy exists', () => {
  const files = fs.readdirSync(path.join(tmp, 'data'));
  assert.ok(files.includes('studyhub.db'));
});

test.after(async () => {
  await app.close({ backup: false });
  fs.rmSync(tmp, { recursive: true, force: true });
});