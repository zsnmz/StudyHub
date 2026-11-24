/* 学习舱 · 本地优先同步层
 * localStorage 仍是第一落点；有服务端时把真实档案同步到 SQLite。
 * 同步码就是档案 ID（32 位随机串），请当作密码保存。
 */
(function (global) {
  'use strict';
  var store = global.StudyHub && global.StudyHub.store;
  if (!store) return;

  var CFG = global.StudyHubConfig || {};
  var ID_KEY = 'studyhub.sync.id';
  var API_KEY = 'studyhub.sync.api';
  var META_KEY = 'studyhub.sync.meta';
  var FORCE_PULL_KEY = 'studyhub.sync.forcePull';
  var state = {
    status: 'local', message: '本地保存', lastSync: null, rev: 0,
    dirty: false, applying: false, busy: false, conflict: null,
    started: false, timer: null, api: '', id: ''
  };
  var LABEL = {
    local: '本地保存', syncing: '同步中…', synced: '已同步', dirty: '待同步',
    offline: '离线本地', conflict: '同步冲突', error: '同步失败'
  };

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }

  function randomId() {
    if (global.crypto && global.crypto.randomUUID) {
      return global.crypto.randomUUID().replace(/-/g, '');
    }
    var s = '';
    while (s.length < 32) s += Math.random().toString(16).slice(2);
    return s.slice(0, 32);
  }

  function getProfileId() {
    var id = lsGet(ID_KEY);
    if (!id || !/^[A-Za-z0-9_-]{8,64}$/.test(id)) {
      id = randomId();
      lsSet(ID_KEY, id);
    }
    return id;
  }

  function getApi() {
    var saved = lsGet(API_KEY);
    if (saved) return saved.replace(/\/+$/, '');
    /* 本地 Node 服务端 */
    if (location.protocol === 'file:') return 'http://127.0.0.1:8787/api';
    if (location.hostname === '127.0.0.1' || location.hostname === 'localhost') {
      return location.origin + '/api';
    }
    /* GitHub Pages 等静态托管：直连 Supabase（若已配置） */
    if (CFG.supabaseUrl) return String(CFG.supabaseUrl).replace(/\/+$/, '');
    if (location.protocol === 'http:' || location.protocol === 'https:') return location.origin + '/api';
    return 'http://127.0.0.1:8787/api';
  }

  function isSupabase() {
    return /\.supabase\.co$/i.test(getApi());
  }

  function getMeta() {
    try { return JSON.parse(lsGet(META_KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function setMeta(rev, updatedAt) {
    var m = { rev: Number(rev) || 0, updatedAt: updatedAt || '', lastSync: new Date().toISOString() };
    lsSet(META_KEY, JSON.stringify(m));
    state.rev = m.rev;
    state.lastSync = m.lastSync;
  }

  function setStatus(status, message) {
    state.status = status;
    state.message = message || LABEL[status] || '';
    var el = document.getElementById('syncState');
    if (el) {
      el.textContent = LABEL[status] || status;
      el.setAttribute('data-status', status);
      el.title = state.message + '\n同步码：' + getProfileId() + '\n服务器：' + getApi();
    }
  }

  function sbRequest(method, path, body) {
    var m = String(path || '').match(/^\/progress\/([A-Za-z0-9_-]{8,64})$/);
    if (!m) return Promise.reject(new Error('bad sync path'));
    var id = m[1];
    var name, payload;
    if (method === 'GET') {
      name = 'studyhub_get';
      payload = { p_code: id };
    } else if (method === 'PUT') {
      name = 'studyhub_save';
      payload = {
        p_code: id,
        p_data: (body && body.data) || {},
        p_base_rev: (body && body.baseRev) || null,
        p_force: !!(body && body.force)
      };
    } else {
      return Promise.reject(new Error('bad sync method'));
    }
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () { if (controller) controller.abort(); }, 12000);
    var opts = {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'apikey': CFG.supabaseKey,
        'Authorization': 'Bearer ' + CFG.supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    };
    if (controller) opts.signal = controller.signal;
    return fetch(getApi() + '/rest/v1/rpc/' + name, opts).then(function (res) {
      clearTimeout(timer);
      return res.text().then(function (text) {
        var data = null;
        try { data = JSON.parse(text); } catch (e) { /* ignore */ }
        if (method === 'GET') {
          if (!res.ok || !data || data.ok !== true) {
            return { res: { ok: false, status: res.status }, data: data, text: text };
          }
          if (!data.exists) {
            return { res: { ok: false, status: 404 }, data: { ok: true, exists: false }, text: text };
          }
          return {
            res: { ok: true, status: 200 },
            data: { ok: true, exists: true, data: data.data, rev: data.rev, updatedAt: data.updatedAt },
            text: text
          };
        }
        if (data && data.conflict) {
          return {
            res: { ok: false, status: 409 },
            data: { ok: false, conflict: true, current: data.current },
            text: text
          };
        }
        if (!res.ok || !data || data.ok !== true) {
          return { res: { ok: false, status: res.status }, data: data, text: text };
        }
        return {
          res: { ok: true, status: 200 },
          data: { ok: true, rev: data.rev, updatedAt: data.updatedAt },
          text: text
        };
      });
    }).catch(function (err) {
      clearTimeout(timer);
      throw err;
    });
  }

  function request(method, path, body) {
    if (isSupabase()) return sbRequest(method, path, body);
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () { if (controller) controller.abort(); }, 8000);
    var opts = { method: method, headers: {}, cache: 'no-store' };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    if (controller) opts.signal = controller.signal;
    return fetch(getApi() + path, opts).then(function (res) {
      clearTimeout(timer);
      return res.text().then(function (text) {
        var data = null;
        try { data = JSON.parse(text); } catch (e) { /* ignore */ }
        return { res: res, data: data, text: text };
      });
    }).catch(function (err) {
      clearTimeout(timer);
      throw err;
    });
  }

  function applyRemote(data, opts) {
    state.applying = true;
    try { store.replace('real', data || {}); }
    finally { state.applying = false; }
    state.dirty = false;
    state.conflict = null;
    if (global.StudyHub.app) {
      try { global.StudyHub.app.header(); } catch (e) { /* ignore */ }
    }
    if (opts && opts.reload) {
      location.reload();
      return true;
    }
    return true;
  }

  function pull(opts) {
    opts = opts || {};
    if (state.busy) return Promise.resolve(false);
    state.busy = true;
    setStatus('syncing', '正在读取云端进度');
    return request('GET', '/progress/' + getProfileId()).then(function (r) {
      if (r.res.status === 404) {
        state.busy = false;
        return push({ force: true });
      }
      if (!r.res.ok || !r.data || !r.data.ok) {
        throw new Error((r.data && r.data.error && r.data.error.message) || ('HTTP ' + r.res.status));
      }
      var row = r.data;
      var m = getMeta();
      var serverTime = Date.parse(row.updatedAt || 0) || 0;
      var localTime = Date.parse(m.updatedAt || 0) || 0;
      var shouldTakeServer = opts.preferServer === true ||
        (!state.dirty && serverTime > localTime);
      if (shouldTakeServer) {
        setMeta(row.rev, row.updatedAt);
        applyRemote(row.data, { reload: opts.reload === true });
        setStatus('synced', '已从云端恢复');
        state.busy = false;
        return true;
      }
      if (state.dirty) {
        state.conflict = { server: row };
        setStatus('conflict', '本地和云端都有改动，请到设置里选择保留哪边');
        state.busy = false;
        return false;
      }
      setMeta(row.rev, row.updatedAt);
      setStatus('synced', '云端已是最新');
      state.busy = false;
      return true;
    }).catch(function (err) {
      state.busy = false;
      if (err && err.name === 'AbortError') setStatus('offline', '连接服务器超时，继续本地保存');
      else setStatus('offline', '连不上同步服务器，继续本地保存');
      return false;
    });
  }

  function push(opts) {
    opts = opts || {};
    if (state.busy) return Promise.resolve(false);
    state.busy = true;
    setStatus('syncing', '正在保存到云端');
    var data = store.snapshot('real');
    var m = getMeta();
    var body = { data: data, force: opts.force === true };
    if (m.rev) body.baseRev = m.rev;
    return request('PUT', '/progress/' + getProfileId(), body).then(function (r) {
      if (r.res.status === 409) {
        state.conflict = { server: r.data && r.data.current };
        state.busy = false;
        setStatus('conflict', '云端版本更新了，请到设置里选择保留哪边');
        return false;
      }
      if (!r.res.ok || !r.data || !r.data.ok) {
        throw new Error((r.data && r.data.error && r.data.error.message) || ('HTTP ' + r.res.status));
      }
      state.dirty = false;
      state.conflict = null;
      setMeta(r.data.rev, r.data.updatedAt);
      setStatus('synced', '已保存到云端');
      state.busy = false;
      return true;
    }).catch(function (err) {
      state.busy = false;
      setStatus('offline', '保存到云端失败，已留在本地');
      return false;
    });
  }

  function onStoreChange(e) {
    if (state.applying) return;
    if (!e.detail || e.detail.profile !== 'real') return;
    state.dirty = true;
    setStatus('dirty', '本地有新改动，稍后自动上传');
    if (state.timer) clearTimeout(state.timer);
    state.timer = setTimeout(function () {
      if (!state.busy && state.dirty) push();
    }, 1200);
  }

  function setApi(value) {
    var v = String(value || '').trim().replace(/\/+$/, '');
    if (v) lsSet(API_KEY, v); else lsSet(API_KEY, '');
    state.api = getApi();
    setStatus('local', '同步服务器已切换');
    return pull({ reload: false });
  }

  function setId(value) {
    var v = String(value || '').trim();
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(v)) return false;
    lsSet(ID_KEY, v);
    lsSet(META_KEY, '');
    lsSet(FORCE_PULL_KEY, '1');
    state.id = v;
    location.reload();
    return true;
  }

  function init() {
    if (state.started) return;
    state.started = true;
    var forcePull = lsGet(FORCE_PULL_KEY) === '1';
    if (forcePull) lsSet(FORCE_PULL_KEY, '');
    state.api = getApi();
    state.id = getProfileId();
    var badge = document.getElementById('syncState');
    if (badge) badge.addEventListener('click', function () {
      if (global.StudyHub.app) global.StudyHub.app.navigate('settings');
    });
    document.addEventListener('studyhub:store', onStoreChange);
    window.addEventListener('online', function () {
      setStatus('syncing', '网络恢复，正在重试');
      if (state.dirty) push(); else pull({ reload: false });
    });
    window.addEventListener('offline', function () { setStatus('offline', '当前离线，继续本地保存'); });
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && state.dirty && !state.busy) push();
    });
    setInterval(function () {
      if (state.dirty && !state.busy) push();
    }, 60000);
    pull(forcePull ? { preferServer: true, reload: true } : { reload: true });
  }

  function info() {
    return {
      id: getProfileId(), api: getApi(), status: state.status,
      message: state.message, rev: state.rev, lastSync: state.lastSync,
      dirty: state.dirty, conflict: !!state.conflict
    };
  }

  global.StudyHub.sync = {
    init: init, info: info, pull: pull, push: push,
    pushForce: function () { return push({ force: true }); },
    restoreFromCloud: function () { state.dirty = false; return pull({ preferServer: true, force: true, reload: true }); },
    syncNow: function () { return state.dirty ? push() : pull({ reload: false }); },
    setApi: setApi,
    setId: setId,
    status: function () { return state.status; }
  };
})(window);