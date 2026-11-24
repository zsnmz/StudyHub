/* 计时引擎 · 状态落盘，切换页面不丢；结束写入学习记录 */
(function (global) {
  'use strict';
  var store = global.StudyHub.store, bus = global.StudyHub.bus, St = global.StudyHub.state;
  var KEY = 'timer';
  var state = null, ticker = null;

  function ns() { return store.ns(store.profile()); }
  function load() {
    var s = ns().get(KEY, null);
    state = s || { status: 'idle', startedAt: 0, accSec: 0, targetMin: 25, mode: 'pomodoro', taskId: '', title: '' };
    return state;
  }
  function save() { ns().set(KEY, state); }
  function nowSec() {
    var sec = state.accSec;
    if (state.status === 'running' && state.startedAt) sec += (Date.now() - state.startedAt) / 1000;
    return Math.floor(sec);
  }
  function snapshot() {
    return {
      status: state.status, mode: state.mode, title: state.title, taskId: state.taskId,
      targetMin: state.targetMin, seconds: nowSec(),
      targetSec: state.targetMin * 60, progress: Math.min(1, nowSec() / (state.targetMin * 60 || 1))
    };
  }

  function emit() { bus.emit('timer:change', snapshot()); }

  function start(opts) {
    load();
    opts = opts || {};
    state.status = 'running';
    state.startedAt = Date.now();
    state.accSec = 0;
    state._overtimeNotified = false;
    if (opts.targetMin) state.targetMin = opts.targetMin;
    if (opts.mode) state.mode = opts.mode;
    if (opts.taskId !== undefined) state.taskId = opts.taskId;
    if (opts.title !== undefined) state.title = opts.title;
    save(); ensureTick(); emit();
  }
  function pause() {
    if (state.status !== 'running') return;
    state.accSec = nowSec();
    state.status = 'paused';
    state.startedAt = 0;
    save(); emit();
  }
  function resume() {
    if (state.status !== 'paused') return;
    state.startedAt = Date.now();
    state.status = 'running';
    save(); ensureTick(); emit();
  }

  /* 结束并写入记录；minutes 过短（<30 秒）不记录 */
  function stop(silent) {
    load();
    var sec = nowSec();
    var rec = null;
    if (sec >= 30) {
      rec = St.addSession({
        minutes: Math.round((sec / 60) * 10) / 10,
        taskId: state.taskId || '', title: state.title || '自由学习',
        kind: state.mode
      });
      /* 通用计时也留成果：时长先落库，笔记可在「今日」补 */
      var learn = global.StudyHub.learn, ui = global.StudyHub.ui;
      if (learn && ui) {
        learn.addOutcome({
          taskId: state.taskId || '', intent: rec.intent || '', tool: 'timer',
          summary: '专注了 ' + ui.minutes(rec.minutes) + '（' + (state.title || '自由学习') + '）',
          meta: { minutes: rec.minutes }
        });
      }
    }
    state = { status: 'idle', startedAt: 0, accSec: 0, targetMin: 25, mode: 'pomodoro', taskId: '', title: '' };
    save();
    if (!silent) emit();
    return rec;
  }
  function reset() {
    state = { status: 'idle', startedAt: 0, accSec: 0, targetMin: 25, mode: 'pomodoro', taskId: '', title: '' };
    save(); emit();
  }

  function ensureTick() {
    if (ticker) return;
    ticker = setInterval(function () {
      if (!state || state.status !== 'running') return;
      emit();
      var sec = nowSec();
      if (state.targetMin > 0) {
        /* 超时 1.3 倍触发一次提醒，不自动停 */
        var overtimeSec = state.targetMin * 60 * 1.3;
        if (sec >= overtimeSec && !state._overtimeNotified) {
          state._overtimeNotified = true; save();
          bus.emit('timer:overtime', { title: state.title || '本次专注', seconds: sec, targetSec: state.targetMin * 60 });
        }
        if (sec >= state.targetMin * 60) {
          var doneTitle = state.title || '本次专注';
          stop(true);
          bus.emit('timer:done', { title: doneTitle });
          emit();
        }
      }
    }, 1000);
  }

  function restore() {
    load();
    if (state.status === 'running') ensureTick();
  }

  function format(sec) {
    var m = Math.floor(sec / 60), s = sec % 60;
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
  }

  global.StudyHub.timer = {
    restore: restore, snapshot: snapshot, start: start, pause: pause,
    resume: resume, stop: stop, reset: reset, format: format
  };
})(window);
