/* 意见反馈：优先写入 Supabase / 本机 API，失败时留在本机待复制 */
(function (global) {
  'use strict';

  var PENDING_KEY = 'studyhub.feedback.pending';
  var CATEGORIES = {
    bug: '功能异常',
    content: '内容纠错',
    feature: '功能建议',
    other: '其他'
  };

  function config() { return global.StudyHubConfig || {}; }
  function settings() {
    try { return global.StudyHub.state.settings(); }
    catch (e) { return {}; }
  }
  function syncInfo() {
    try { return global.StudyHub.sync.info(); }
    catch (e) { return {}; }
  }
  function appVersion() {
    try {
      var meta = global.StudyHubData && global.StudyHubData.cet4 && global.StudyHubData.cet4.meta;
      return (meta && meta.version) || '0.6.1';
    } catch (e) { return '0.6.1'; }
  }

  function target() {
    var cfg = config();
    var loc = global.location;
    if (loc.protocol === 'file:') {
      return { mode: 'local', url: 'http://127.0.0.1:8787/api/feedback' };
    }
    if (loc.hostname === '127.0.0.1' || loc.hostname === 'localhost') {
      return { mode: 'local', url: loc.origin + '/api/feedback' };
    }
    if (cfg.supabaseUrl && cfg.supabaseKey) {
      return { mode: 'supabase', url: String(cfg.supabaseUrl).replace(/\/$/, '') + '/rest/v1/feedback' };
    }
    var api = String(syncInfo().api || '').replace(/\/$/, '');
    if (api) {
      if (/\/api$/.test(api)) return { mode: 'local', url: api + '/feedback' };
      return { mode: 'supabase', url: api + '/rest/v1/feedback' };
    }
    return { mode: 'none', url: '' };
  }

  function buildPayload(fields) {
    var s = settings();
    var info = syncInfo();
    return {
      category: CATEGORIES[fields.category] ? fields.category : 'other',
      message: String(fields.message || '').trim(),
      contact: String(fields.contact || '').trim().slice(0, 120) || null,
      page: (global.location.hash || global.location.pathname || '').slice(0, 200),
      track: s.track === 'cet6' ? 'cet6' : 'cet4',
      app_version: appVersion(),
      sync_id: info.id || null,
      user_agent: String(global.navigator.userAgent || '').slice(0, 300)
    };
  }

  function buildText(fields) {
    var data = buildPayload(fields);
    return [
      '【StudyHub 反馈】',
      '类型：' + (CATEGORIES[data.category] || data.category),
      '内容：' + data.message,
      '联系方式：' + (data.contact || '未填写'),
      '页面：' + (data.page || ''),
      '备考方向：' + data.track,
      '版本：' + data.app_version
    ].join('\n');
  }

  function pending() {
    try {
      var rows = JSON.parse(global.localStorage.getItem(PENDING_KEY) || '[]');
      return Array.isArray(rows) ? rows : [];
    } catch (e) { return []; }
  }

  function savePending(data) {
    try {
      var rows = pending();
      rows.unshift({ at: new Date().toISOString(), data: data });
      rows = rows.slice(0, 20);
      global.localStorage.setItem(PENDING_KEY, JSON.stringify(rows));
      return true;
    } catch (e) { return false; }
  }

  function clearPending() {
    try { global.localStorage.removeItem(PENDING_KEY); } catch (e) { /* ignore */ }
  }

  function submit(fields) {
    var data = buildPayload(fields);
    if (data.message.length < 5) {
      return Promise.resolve({ ok: false, error: '反馈内容至少 5 个字' });
    }
    if (data.message.length > 2000) {
      return Promise.resolve({ ok: false, error: '反馈内容最多 2000 个字' });
    }
    var t = target();
    if (t.mode === 'none') {
      savePending(data);
      return Promise.resolve({ ok: false, saved: true, error: '没有可用的反馈服务器，已保存到本机' });
    }
    var headers = { 'Content-Type': 'application/json' };
    if (t.mode === 'supabase') {
      var cfg = config();
      headers.apikey = cfg.supabaseKey;
      headers.Authorization = 'Bearer ' + cfg.supabaseKey;
      headers.Prefer = 'return=minimal';
    }
    return global.fetch(t.url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data)
    }).then(function (res) {
      if (res.ok) return { ok: true, mode: t.mode };
      return res.text().then(function (text) {
        throw new Error('HTTP ' + res.status + (text ? ' ' + text.slice(0, 160) : ''));
      });
    }).catch(function (err) {
      savePending(data);
      return { ok: false, saved: true, error: err.message || '网络不可用' };
    });
  }

  function retryPending() {
    var rows = pending();
    if (!rows.length) return Promise.resolve({ ok: true, sent: 0 });
    var sent = 0;
    var chain = Promise.resolve();
    rows.forEach(function (row) {
      chain = chain.then(function () {
        return submit(row.data).then(function (r) { if (r.ok) sent += 1; });
      });
    });
    return chain.then(function () {
      clearPending();
      return { ok: true, sent: sent };
    });
  }

  global.StudyHub = global.StudyHub || {};
  global.StudyHub.feedback = {
    categories: CATEGORIES,
    submit: submit,
    buildText: buildText,
    pending: pending,
    pendingCount: function () { return pending().length; },
    clearPending: clearPending,
    retryPending: retryPending,
    target: target
  };
})(window);