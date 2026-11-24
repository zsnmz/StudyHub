import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './config.js';
import { openDb, closeDb } from './db.js';
import { backupDatabase } from './backup.js';
import { serveStatic } from './static.js';
import { handleApi } from './api.js';

function log(config, level, message) {
  const logger = config.logger || console;
  const fn = logger[level] || logger.log;
  if (typeof fn === 'function') fn.call(logger, '[' + new Date().toISOString() + '] ' + message);
}

function sendText(res, status, text) {
  const body = Buffer.from(text, 'utf8');
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(body);
}

export function createApp(options = {}) {
  const config = loadConfig(options);
  fs.mkdirSync(config.dataDir, { recursive: true });
  fs.mkdirSync(config.backupDir, { recursive: true });

  const db = openDb(config.dbPath);
  const ctx = { db, config };
  let backupTimer = null;

  const server = http.createServer(function (req, res) {
    const started = Date.now();
    let url;
    try {
      url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
    } catch (e) {
      sendText(res, 400, 'Bad Request');
      return;
    }

    res.on('finish', function () {
      if (config.logRequests) {
        log(config, 'log', req.method + ' ' + url.pathname + ' ' + res.statusCode + ' ' + (Date.now() - started) + 'ms');
      }
    });

    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      handleApi(req, res, url, ctx).catch(function (err) {
        log(config, 'error', 'API 未处理异常：' + (err && err.stack ? err.stack : err));
        if (!res.headersSent) {
          sendText(res, 500, 'Internal Server Error');
        } else {
          try { res.destroy(); } catch (e) { /* ignore */ }
        }
      });
      return;
    }

    if (serveStatic(req, res, url.pathname, config)) return;
    sendText(res, 404, 'Not Found');
  });

  server.requestTimeout = 30000;
  server.headersTimeout = 15000;

  function startBackupTimer() {
    if (!config.backupEnabled || backupTimer) return;
    backupTimer = setInterval(function () {
      try {
        const result = backupDatabase(db, config);
        log(config, 'log', '自动备份完成：' + result.file + ' (' + result.size + ' bytes)');
      } catch (err) {
        log(config, 'error', '自动备份失败：' + (err && err.stack ? err.stack : err));
      }
    }, config.backupIntervalHours * 3600 * 1000);
    if (backupTimer.unref) backupTimer.unref();
  }

  async function close(opts = {}) {
    if (backupTimer) {
      clearInterval(backupTimer);
      backupTimer = null;
    }
    if (opts.backup !== false && config.backupEnabled) {
      try {
        const result = backupDatabase(db, config);
        log(config, 'log', '退出前备份：' + result.file);
      } catch (err) {
        log(config, 'error', '退出前备份失败：' + (err && err.message ? err.message : err));
      }
    }
    await new Promise(function (resolve) {
      if (!server.listening) return resolve();
      server.close(function () { resolve(); });
      setTimeout(function () {
        try { server.closeAllConnections(); } catch (e) { /* ignore */ }
      }, 5000).unref();
    });
    closeDb(db);
  }

  return { server, db, config, close, startBackupTimer };
}

export async function start(options = {}) {
  const app = createApp(options);
  await new Promise(function (resolve, reject) {
    function onError(err) {
      app.server.removeListener('listening', onListening);
      reject(err);
    }
    function onListening() {
      app.server.removeListener('error', onError);
      resolve();
    }
    app.server.once('error', onError);
    app.server.once('listening', onListening);
    app.server.listen(app.config.port, app.config.host);
  });
  const addr = app.server.address();
  app.url = 'http://' + (addr.address === '::' ? '127.0.0.1' : addr.address) + ':' + addr.port;
  app.startBackupTimer();
  if (app.config.backupEnabled) {
    try {
      const result = backupDatabase(app.db, app.config);
      log(app.config, 'log', '启动备份完成：' + result.file);
    } catch (err) {
      log(app.config, 'error', '启动备份失败：' + (err && err.message ? err.message : err));
    }
  }
  return app;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  start().then(function (app) {
    log(app.config, 'log', '学习舱已启动：' + app.url + '（按 Ctrl+C 停止）');
    log(app.config, 'log', '数据库：' + app.config.dbPath);
    let closing = false;
    function shutdown(signal) {
      if (closing) return;
      closing = true;
      log(app.config, 'log', '收到 ' + signal + '，正在保存并退出……');
      app.close().then(function () { process.exit(0); }).catch(function (err) {
        console.error(err);
        process.exit(1);
      });
    }
    process.on('SIGINT', function () { shutdown('SIGINT'); });
    process.on('SIGTERM', function () { shutdown('SIGTERM'); });
  }).catch(function (err) {
    console.error('启动失败：', err);
    process.exit(1);
  });
}