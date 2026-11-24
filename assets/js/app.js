/* 应用外壳 · v0.2：收件箱 / 草稿 / 今日 / 复盘 / 设置 */
(function (global) {
  'use strict';
  var store = global.StudyHub.store;
  var ui = global.StudyHub.ui, timer = global.StudyHub.timer;
  var views = global.StudyHub.views = (global.StudyHub.views || {});
  var current = null, pendingPayload = null;
  var nav = document.getElementById('tabbar');
  var host = document.getElementById('view');

  var LABELS = {
    inbox: '收件箱', draft: '草稿', today: '今日', full: '全套', sprint: '冲刺', practice: '练习', review: '复盘', settings: '设置'
  };

  function render(name, payload) {
    var view = views[name];
    if (!view) {
      host.innerHTML = '<div class="card">这个页面还没有加载出来：' + name + '</div>';
      return;
    }
    /* 换页才回顶部；同页重渲染（勾完一条待办）保留原滚动位置 */
    var navigating = name !== current;
    if (current && views[current] && views[current].destroy) {
      try { views[current].destroy(); } catch (e) { console.warn(e); }
    }
    try {
      view.render(host, payload || {});
    } catch (err) {
      console.error(err);
      host.innerHTML = '<div class="card"><h2>页面渲染出错</h2><p class="muted">' +
        String(err && err.message ? err.message : err) + '</p></div>';
    }
    if (navigating) window.scrollTo(0, 0);
    current = name;
    Array.prototype.forEach.call(nav.children, function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-view') === name);
    });
  }

  function navigate(name, payload) {
    if (!LABELS[name]) name = 'inbox';
    if (location.hash !== '#' + name) {
      location.hash = '#' + name;
      pendingPayload = payload || null;
      return;
    }
    render(name, payload);
  }

  nav.addEventListener('click', function (e) {
    var btn = e.target.closest('.tab');
    if (btn) navigate(btn.getAttribute('data-view'));
  });
  window.addEventListener('hashchange', function () {
    var name = location.hash.replace('#', '') || 'inbox';
    render(LABELS[name] ? name : 'inbox', pendingPayload);
    pendingPayload = null;
  });
  /* 计时变化只推给当前视图 */
  global.StudyHub.bus.on('timer:change', function (snap) {
    syncTimerBar();
    var view = views[current];
    if (view && view.onTick) view.onTick(snap);
  });
  global.StudyHub.bus.on('timer:done', function (info) {
    hideOvertime();
    syncTimerBar();
    if (current === 'today') render('today');
    if (current === 'review') render('review');
  });
  global.StudyHub.bus.on('timer:overtime', function (info) {
    showOvertime(info);
  });

  /* ---------- v0.5 计时控制条：跨页面常驻，能暂停/继续/结束 ---------- */
  function barEl() {
    var el = document.getElementById('timerBar');
    if (!el) {
      el = document.createElement('div');
      el.id = 'timerBar';
      el.className = 'timer-bar';
      el.hidden = true;
      document.body.appendChild(el);
    }
    return el;
  }
  /* 只在状态/文案真变了才重建 DOM；每秒一跳只改时钟和进度条 ——
     否则按钮每秒被销毁重建，按下瞬间就被换掉，点不中 */
  var barKey = '';
  function buildBar(el, snap) {
    var paused = snap.status === 'paused';
    el.innerHTML =
      '<div class="tb-main">' +
        '<span class="tb-dot"></span>' +
        '<div class="tb-text"><b>' + ui.esc(snap.title || '自由学习') + '</b>' +
        '<span>' + (paused ? '已暂停' : '正在计时') + ' · 目标 ' + snap.targetMin + ' 分钟</span></div>' +
        '<span class="tb-clock">' + timer.format(snap.seconds) + '</span>' +
      '</div>' +
      '<div class="progress tb-progress"><div class="progress-bar" style="width:0%"></div></div>' +
      '<div class="tb-ops">' +
        '<button class="btn small" id="tbPause">' + (paused ? '继续' : '暂停') + '</button>' +
        '<button class="btn small primary" id="tbStop">结束并记下</button>' +
      '</div>';
    el.querySelector('#tbPause').addEventListener('click', function () {
      if (timer.snapshot().status === 'paused') timer.resume(); else timer.pause();
      syncTimerBar();
    });
    el.querySelector('#tbStop').addEventListener('click', function () {
      timer.stop();
      hideOvertime();
      syncTimerBar();
    });
  }
  function tickBar(el, snap) {
    var paused = snap.status === 'paused';
    var cls = 'timer-bar' + (paused ? ' paused' : '');
    if (el.className !== cls) el.className = cls;
    var clock = el.querySelector('.tb-clock');
    if (clock) clock.textContent = timer.format(snap.seconds);
    var fill = el.querySelector('.tb-progress .progress-bar');
    if (fill) fill.style.width = Math.max(0, Math.min(100, Math.round((snap.progress || 0) * 100))) + '%';
  }
  function syncTimerBar() {
    var el = barEl();
    var snap = timer.snapshot();
    if (!snap || snap.status === 'idle') {
      barKey = '';
      el.hidden = true;
      el.className = 'timer-bar';
      if (el.innerHTML) el.innerHTML = '';
      document.body.classList.remove('timing-on');
      return;
    }
    el.hidden = false;
    document.body.classList.add('timing-on');
    var key = [snap.status, snap.title, snap.taskId, snap.targetMin].join('\u0001');
    if (key !== barKey || !el.querySelector('.tb-main')) {
      buildBar(el, snap);
      barKey = key;
    }
    tickBar(el, snap);
  }

  /* C2 超时横幅：非模态，主区域顶部 */
  function showOvertime(info) {
    var host2 = document.getElementById('otBanner');
    if (!host2) {
      host2 = document.createElement('div');
      host2.id = 'otBanner';
      var viewEl = document.getElementById('view');
      if (viewEl && viewEl.parentNode) viewEl.parentNode.insertBefore(host2, viewEl);
      else document.body.appendChild(host2);
    }
    var mins = Math.round(info.seconds / 60);
    var tgtMin = Math.round(info.targetSec / 60);
    host2.className = 'ot-banner';
    host2.innerHTML =
      '<span>⏱ 已 ' + mins + ' 分钟（估 ' + tgtMin + '），「' + (info.title || '本次专注') + '」超时了</span>' +
      '<button class="btn small" id="otStop">收尾</button>' +
      '<button class="btn small primary" id="otMore">再 15 分钟</button>' +
      '<button class="icon" id="otClose">×</button>';
    host2.querySelector('#otStop').addEventListener('click', function () {
      global.StudyHub.timer.stop();
      hideOvertime();
    });
    host2.querySelector('#otMore').addEventListener('click', function () {
      global.StudyHub.timer.start({ title: info.title || '本次专注', targetMin: 15 });
      hideOvertime();
    });
    host2.querySelector('#otClose').addEventListener('click', hideOvertime);
  }
  function hideOvertime() {
    var h = document.getElementById('otBanner');
    if (h) h.remove();
  }

  function header() {
    var d = new Date(), wk = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
    document.getElementById('topbarDate').textContent =
      d.getMonth() + 1 + '月' + d.getDate() + '日 周' + wk;
    document.getElementById('demoTag').hidden = store.profile() !== 'demo';
  }

  function boot() {
    if (store.profile() === 'demo') global.StudyHub.demo.seed();
    global.StudyHub.timer.restore();
    syncTimerBar();
    header();
    var name = location.hash.replace('#', '') || 'inbox';
    render(LABELS[name] ? name : 'inbox');
    if (global.StudyHub.sync) global.StudyHub.sync.init();
  }

  global.StudyHub.app = {
    navigate: navigate, render: render, header: header,
    current: function () { return current; }, LABELS: LABELS
  };
  document.addEventListener('DOMContentLoaded', boot);
})(window);
