import fs from 'node:fs';
import path from 'node:path';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.woff2': 'font/woff2'
};

function resolvePublicFile(publicRoot, pathname) {
  let rel;
  if (pathname === '/' || pathname === '/index.html') rel = 'index.html';
  else if (pathname === '/favicon.ico') rel = 'favicon.ico';
  else if (pathname === '/manifest.webmanifest') rel = 'manifest.webmanifest';
  else if (pathname.startsWith('/assets/') || pathname.startsWith('/data/')) rel = pathname.slice(1);
  else return null;

  const file = path.resolve(publicRoot, rel);
  const base = path.resolve(publicRoot) + path.sep;
  if (!file.startsWith(base)) return null;
  return file;
}

function cacheControl(ext) {
  if (ext === '.mp3' || ext === '.wav' || ext === '.ogg') return 'public, max-age=86400';
  if (ext === '.png' || ext === '.svg' || ext === '.ico' || ext === '.woff2') return 'public, max-age=3600';
  return 'no-cache';
}

function sendRange(req, res, file, stat, ext) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (!m) return false;
  let start = m[1] === '' ? null : Number(m[1]);
  let end = m[2] === '' ? null : Number(m[2]);
  if (start === null && end === null) return false;
  if (start === null) {
    start = Math.max(0, stat.size - end);
    end = stat.size - 1;
  } else {
    if (end === null || end >= stat.size) end = stat.size - 1;
  }
  if (start < 0 || start > end || start >= stat.size) {
    res.writeHead(416, { 'Content-Range': 'bytes */' + stat.size });
    res.end();
    return true;
  }
  res.writeHead(206, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Content-Length': end - start + 1,
    'Content-Range': 'bytes ' + start + '-' + end + '/' + stat.size,
    'Accept-Ranges': 'bytes',
    'Cache-Control': cacheControl(ext),
    'X-Content-Type-Options': 'nosniff'
  });
  if (req.method === 'HEAD') { res.end(); return true; }
  fs.createReadStream(file, { start, end }).pipe(res);
  return true;
}

export function serveStatic(req, res, pathname, config) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch (e) { return false; }
  if (decoded.indexOf('\0') !== -1) return false;
  const file = resolvePublicFile(config.publicRoot, decoded);
  if (!file) return false;

  let stat;
  try { stat = fs.statSync(file); } catch (e) { return false; }
  if (!stat.isFile()) return false;

  const ext = path.extname(file).toLowerCase();
  const range = req.headers.range;
  if (range && sendRange(req, res, file, stat, ext)) return true;

  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Content-Length': stat.size,
    'Accept-Ranges': 'bytes',
    'Cache-Control': cacheControl(ext),
    'X-Content-Type-Options': 'nosniff'
  });
  if (req.method === 'HEAD') { res.end(); return true; }
  const stream = fs.createReadStream(file);
  stream.on('error', function () { try { res.destroy(); } catch (e) { /* ignore */ } });
  stream.pipe(res);
  return true;
}