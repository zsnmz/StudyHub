/* 学习舱 · 统一存储层（页面只允许经过这里读写本地数据） */
(function (global) {
  'use strict';

  var PREFIX = 'studyhub.v1.';
  var PROFILE_KEY = PREFIX + '@profile';
  var memFallback = {}; // localStorage 不可用时（如隐私模式）退化为内存

  function lsAvailable() {
    try {
      localStorage.setItem(PREFIX + 'ping', '1');
      localStorage.removeItem(PREFIX + 'ping');
      return true;
    } catch (e) { return false; }
  }
  var available = lsAvailable();

  function rawGet(k) {
    if (available) { try { return localStorage.getItem(k); } catch (e) { /* ignore */ } }
    return memFallback.hasOwnProperty(k) ? memFallback[k] : null;
  }
  function rawSet(k, v) {
    if (available) { try { localStorage.setItem(k, v); return; } catch (e) { /* 配额满等情况 */ } }
    memFallback[k] = v;
  }
  function rawRemove(k) {
    if (available) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
    delete memFallback[k];
  }
  function rawKeys() {
    var out = [];
    if (available) {
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf(PREFIX) === 0) out.push(k);
        }
      } catch (e) { /* ignore */ }
    }
    Object.keys(memFallback).forEach(function (k) {
      if (k.indexOf(PREFIX) === 0 && out.indexOf(k) === -1) out.push(k);
    });
    return out;
  }

  function parse(json, def) {
    if (json === null || json === undefined) return def;
    try { return JSON.parse(json); } catch (e) { return def; }
  }

  function profile() {
    return rawGet(PROFILE_KEY) || 'real';
  }

  /* 通知同步层：任何经 store 的写入都会触发，避免各视图漏调保存 */
  function emitChange(profileName, key, value) {
    try {
      document.dispatchEvent(new CustomEvent('studyhub:store', {
        detail: { profile: profileName, key: key, value: value }
      }));
    } catch (e) { /* 老浏览器没有 CustomEvent 时忽略 */ }
  }

  /* 按“档案 + key”读写：演示数据与用户真实数据各存一份，互不覆盖 */
  function ns(p) {
    var profileName = p || 'real';
    var base = PREFIX + profileName + '.';
    return {
      profile: profileName,
      get: function (key, def) { return parse(rawGet(base + key), def); },
      set: function (key, val) {
        if (val === undefined) {
          rawRemove(base + key);
          emitChange(profileName, key, null);
          return;
        }
        rawSet(base + key, JSON.stringify(val));
        emitChange(profileName, key, val);
      },
      remove: function (key) {
        rawRemove(base + key);
        emitChange(profileName, key, null);
      },
      keys: function () {
        return rawKeys().filter(function (k) { return k.indexOf(base) === 0; })
          .map(function (k) { return k.slice(base.length); });
      }
    };
  }

  /* 同步层用：整份档案快照 / 用远端快照覆盖本档案 */
  function snapshot(p) {
    var target = ns(p);
    var out = {};
    target.keys().forEach(function (k) { out[k] = target.get(k); });
    return out;
  }
  function replace(p, data) {
    var target = ns(p);
    var next = data || {};
    target.keys().forEach(function (k) {
      if (!Object.prototype.hasOwnProperty.call(next, k)) target.remove(k);
    });
    Object.keys(next).forEach(function (k) { target.set(k, next[k]); });
  }

  function setProfile(p) { rawSet(PROFILE_KEY, p === 'demo' ? 'demo' : 'real'); }

  /* 整份数据导出（含两个档案） */
  function exportData() {
    var profiles = { real: {}, demo: {} };
    rawKeys().forEach(function (k) {
      if (k === PROFILE_KEY) return;
      var rest = k.slice(PREFIX.length);
      var dot = rest.indexOf('.');
      var p = rest.slice(0, dot), key = rest.slice(dot + 1);
      if (!profiles[p]) return;
      profiles[p][key] = parse(rawGet(k), null);
    });
    return {
      app: 'StudyHub', version: 1, exportedAt: new Date().toISOString(),
      profile: profile(), profiles: profiles
    };
  }

  /* 从导出的 JSON 覆盖导入；返回提示文本 */
  function importData(obj) {
    if (!obj || typeof obj !== 'object' || !obj.profiles) throw new Error('文件格式不正确');
    var count = 0;
    ['real', 'demo'].forEach(function (p) {
      var data = obj.profiles[p];
      if (!data || typeof data !== 'object') return;
      var target = ns(p);
      target.keys().forEach(function (k) { if (!data.hasOwnProperty(k)) target.remove(k); });
      Object.keys(data).forEach(function (k) { target.set(k, data[k]); count++; });
    });
    if (obj.profile) setProfile(obj.profile);
    return '已导入 ' + count + ' 项数据';
  }

  function download(filename, text) {
    var blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 500);
  }

  /* 清空指定档案（默认当前档案） */
  function clear(targetProfile) {
    var p = targetProfile || profile();
    ns(p).keys().forEach(function (k) { ns(p).remove(k); });
  }

  global.StudyHub = global.StudyHub || {};
  global.StudyHub.store = {
    ns: ns, profile: profile, setProfile: setProfile,
    snapshot: snapshot, replace: replace,
    exportData: exportData, importData: importData, download: download,
    clear: clear, available: available
  };
})(window);
