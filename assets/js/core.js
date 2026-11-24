/* 状态层 · v0.2：任务 / 执行记录 / 草稿 / 设置，统一走 store */
(function (global) {
  'use strict';
  var store = global.StudyHub.store;

  /* ---------- 日期工具（本地时区 YYYY-MM-DD） ---------- */
  function dateKey(d) {
    var x = d ? new Date(d) : new Date();
    var m = x.getMonth() + 1, day = x.getDate();
    return x.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
  }
  function addDays(key, n) {
    var p = key.split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    d.setDate(d.getDate() + n);
    return dateKey(d);
  }
  function daysUntil(key) {
    var p = key.split('-');
    var t = new Date(+p[0], +p[1] - 1, +p[2]);
    var now = new Date(); now.setHours(0, 0, 0, 0);
    return Math.round((t - now) / 86400000);
  }
  function weekStart() {
    var d = new Date(); var w = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - w); d.setHours(0, 0, 0, 0);
    return dateKey(d);
  }
  function ns() { return store.ns(store.profile()); }

  /* ---------- 设置 ---------- */
  function settings() {
    var s = ns().get('settings', {}) || {};
    var exam = s.examDate || '2026-12-19';
    return {
      examDate: exam,
      targetDate: s.targetDate || exam,
      track: s.track === 'cet6' ? 'cet6' : 'cet4',
      examDateNote: '日期需按官方通知确认，可在设置里修改',
      adaptive: s.adaptive !== false
    };
  }
  function saveSettings(patch) {
    var cur = ns().get('settings', {}) || {};
    var merged = {};
    for (var k in cur) merged[k] = cur[k];
    for (var kk in patch) merged[kk] = patch[kk];
    ns().set('settings', merged);
  }

  /* ---------- 任务 ---------- */
  /* task: {id,title,minutes,intent,status,createdAt,plannedDate,repeat,chapterId,lastDoneDate} */
  function tasks() { return ns().get('tasks', []) || []; }
  function saveTasks(list) { ns().set('tasks', list); }
  function taskById(id) {
    var all = tasks();
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }
  function addTask(t) {
    var list = tasks();
    t.id = 't' + Date.now() + Math.floor(Math.random() * 1000);
    t.status = 'todo';
    t.createdAt = new Date().toISOString();
    t.plannedDate = t.plannedDate || dateKey();
    t.repeat = t.repeat || '';
    t.minutes = +t.minutes || 0;
    list.push(t);
    saveTasks(list);
    return t;
  }
  function updateTask(id, patch) {
    var list = tasks();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        for (var k in patch) list[i][k] = patch[k];
        saveTasks(list);
        return list[i];
      }
    }
    return null;
  }
  function removeTask(id) { saveTasks(tasks().filter(function (t) { return t.id !== id; })); }

  /* 今日清单：今天计划的 + 逾期未完成的 + 每天重复的 */
  function todayTasks() {
    var today = dateKey();
    return tasks().filter(function (t) {
      if (t.repeat === 'daily') return true;
      if (t.plannedDate > today) return false;
      if (t.status === 'done' && t.plannedDate < today) return false; /* 已完成的旧任务不堆在今日 */
      return true;
    }).map(function (t) {
      var doneToday = t.repeat === 'daily'
        ? t.lastDoneDate === today
        : t.status === 'done';
      return {
        id: t.id, title: t.title, minutes: t.minutes, intent: t.intent || '',
        plannedDate: t.plannedDate, repeat: t.repeat, overdue: t.plannedDate < today,
        done: doneToday
      };
    });
  }
  function completeTask(id, on) {
    var t = taskById(id);
    if (!t) return;
    if (t.repeat === 'daily') {
      updateTask(id, { lastDoneDate: on ? dateKey() : '' });
    } else {
      updateTask(id, { status: on ? 'done' : 'todo', completedAt: on ? new Date().toISOString() : '' });
    }
  }
  function postpone(id) {
    var t = taskById(id);
    if (t) updateTask(id, { plannedDate: addDays(dateKey(), 1) });
  }

  /* ---------- 待办草稿（确认后才写入任务） ---------- */
  function getDraft() { return ns().get('draft', null); }
  function setDraft(d) { ns().set('draft', d); }
  function clearDraft() { ns().remove('draft'); }

  /* ---------- 执行记录：{id,taskId,intent,title,minutes,date,startedAt} ---------- */
  function sessions() { return ns().get('sessions', []) || []; }
  function addSession(rec) {
    var list = sessions();
    var t = rec.taskId ? taskById(rec.taskId) : null;
    rec.id = 's' + Date.now();
    rec.date = rec.date || dateKey();
    rec.intent = rec.intent || (t ? t.intent : '') || '';
    list.push(rec);
    if (list.length > 500) list = list.slice(-500);
    ns().set('sessions', list);
    return rec;
  }
  function sessionsBetween(from, to) {
    return sessions().filter(function (s) { return s.date >= from && s.date <= to; });
  }

  global.StudyHub = global.StudyHub || {};
  global.StudyHub.state = {
    dateKey: dateKey, addDays: addDays, daysUntil: daysUntil, weekStart: weekStart,
    settings: settings, saveSettings: saveSettings,
    tasks: tasks, taskById: taskById, addTask: addTask, updateTask: updateTask,
    removeTask: removeTask, todayTasks: todayTasks, completeTask: completeTask, postpone: postpone,
    getDraft: getDraft, setDraft: setDraft, clearDraft: clearDraft,
    sessions: sessions, addSession: addSession, sessionsBetween: sessionsBetween
  };

  /* 简易事件总线 */
  var handlers = {};
  global.StudyHub.bus = {
    on: function (evt, fn) { (handlers[evt] = handlers[evt] || []).push(fn); },
    emit: function (evt, payload) {
      (handlers[evt] || []).forEach(function (fn) { try { fn(payload); } catch (e) { console.warn(e); } });
    }
  };
})(window);
