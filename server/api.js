import {
  getProgress, saveProgress, listHistory, getRevisionData, stats
} from './db.js';

const ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

function httpError(status, code, message) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

function cors(config, req, res) {
  res.setHeader('Access-Control-Allow-Origin', config.corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Cache-Control', 'no-store');
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(body);
}

function readJson(req, limit) {
  return new Promise(function (resolve, reject) {
    let size = 0;
    const chunks = [];
    req.on('data', function (chunk) {
      size += chunk.length;
      if (size > limit) {
        reject(httpError(413, 'payload_too_large', '请求体超过 ' + limit + ' 字节'));
        req.removeAllListeners('data');
        req.resume();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', function () {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch (e) { reject(httpError(400, 'invalid_json', '请求体不是合法 JSON')); }
    });
    req.on('error', reject);
  });
}

function validateId(id) {
  if (!ID_RE.test(id)) throw httpError(400, 'invalid_profile_id', 'profileId 必须是 8–64 位字母、数字、下划线或短横线');
  return id;
}

function jsonSize(value) {
  try { return Buffer.byteLength(JSON.stringify(value), 'utf8'); }
  catch (e) { throw httpError(400, 'invalid_data', 'data 无法序列化'); }
}

export async function handleApi(req, res, url, ctx) {
  const config = ctx.config;
  const db = ctx.db;
  cors(config, req, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const segments = url.pathname.split('/').filter(Boolean);
  // /api/...
  if (segments[0] !== 'api') throw httpError(404, 'not_found', '接口不存在');

  try {
    if (segments.length === 2 && segments[1] === 'health' && req.method === 'GET') {
      return sendJson(res, 200, {
        ok: true,
        app: 'studyhub',
        version: '0.5.1',
        now: new Date().toISOString(),
        uptimeSec: Math.round(process.uptime()),
        stats: stats(db),
        dbPath: config.dbPath
      });
    }

    if (segments.length === 2 && segments[1] === 'stats' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, stats: stats(db) });
    }

    if (segments[1] === 'progress' && segments[2]) {
      const profileId = validateId(segments[2]);

      if (segments.length === 3 && req.method === 'GET') {
        const row = getProgress(db, profileId);
        if (!row) return sendJson(res, 404, { ok: false, error: { code: 'not_found', message: '还没有这个档案的云端进度' } });
        return sendJson(res, 200, { ok: true, ...row });
      }

      if (segments.length === 3 && req.method === 'PUT') {
        const body = await readJson(req, config.maxBodyBytes);
        if (!body || typeof body.data !== 'object' || body.data === null || Array.isArray(body.data)) {
          throw httpError(400, 'invalid_data', 'data 必须是一个对象');
        }
        const size = jsonSize(body.data);
        if (size > config.maxBodyBytes) {
          throw httpError(413, 'payload_too_large', 'data 超过 ' + config.maxBodyBytes + ' 字节');
        }
        const result = saveProgress(db, profileId, body.data, {
          baseRev: body.baseRev,
          force: body.force === true
        });
        if (result.conflict) {
          return sendJson(res, 409, {
            ok: false,
            error: { code: 'conflict', message: '云端有更新的版本，请先拉取或 force 上传' },
            current: result.current
          });
        }
        return sendJson(res, 200, { ok: true, profileId, rev: result.rev, updatedAt: result.updatedAt, created: result.created });
      }

      if (segments.length === 4 && segments[3] === 'history' && req.method === 'GET') {
        return sendJson(res, 200, { ok: true, profileId, history: listHistory(db, profileId) });
      }

      if (segments.length === 4 && segments[3] === 'export' && req.method === 'GET') {
        const row = getProgress(db, profileId);
        if (!row) throw httpError(404, 'not_found', '还没有这个档案的云端进度');
        res.setHeader('Content-Disposition', 'attachment; filename="studyhub-' + profileId.slice(0, 8) + '.json"');
        return sendJson(res, 200, {
          app: 'StudyHub',
          version: 1,
          exportedAt: new Date().toISOString(),
          profileId,
          rev: row.rev,
          updatedAt: row.updatedAt,
          data: row.data
        });
      }

      if (segments.length === 4 && segments[3] === 'restore' && req.method === 'POST') {
        const body = await readJson(req, config.maxBodyBytes);
        const rev = Number(body.rev);
        if (!Number.isInteger(rev) || rev < 1) throw httpError(400, 'invalid_rev', 'rev 必须是正整数');
        const data = getRevisionData(db, profileId, rev);
        if (data === null) throw httpError(404, 'revision_not_found', '找不到这个版本');
        const result = saveProgress(db, profileId, data, { force: true });
        return sendJson(res, 200, { ok: true, profileId, rev: result.rev, restoredFrom: rev, updatedAt: result.updatedAt });
      }
    }

    throw httpError(404, 'not_found', '接口不存在');
  } catch (err) {
    if (res.headersSent) throw err;
    const status = err.status || 500;
    if (status >= 500) {
      (config.logger || console).error('[api] ' + req.method + ' ' + url.pathname, err);
    }
    sendJson(res, status, {
      ok: false,
      error: { code: err.code || 'internal_error', message: err.message || '服务器内部错误' }
    });
  }
}