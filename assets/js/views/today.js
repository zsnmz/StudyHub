/* 今日 · 当天待办 + 到期置顶 + 冷落提醒 + 日终小结 */
(function (global) {
  'use strict';
  var St = global.StudyHub.state, ui = global.StudyHub.ui, timer = global.StudyHub.timer;
  var learn = global.StudyHub.learn;

  function intentName(id) {
    if (!id || id === 'plain') return '待办';
    var list = global.StudyHubData.intents;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i].name;
    return id;
  }
  function words() { return (global.StudyHubData && global.StudyHubData.words) || []; }

  /* 今天最新一条成果 */
  function latestOutcome() {
    var today = St.dateKey(), l = learn.outcomes();
    for (var i = l.length - 1; i >= 0; i--) if (l[i].date === today) return l[i];
    return null;
  }

  function outcomeBlock(o) {
    if (!o) return '';
    var note = o.meta && o.meta.note ? o.meta.note : '';
    return '<div class="card" id="ocCard"><h3>最近成果</h3>' +
      ui.outcomeCard(o,
        '<div class="oc-note"><input id="ocNote" type="text" placeholder="补一句笔记（可选）" value="' + ui.esc(note) + '" />' +
        '<button class="btn small" id="ocSave">记下</button>' +
        '<span class="muted" id="ocCount">' + (note ? note.length + ' 字' : '') + '</span></div>') +
      '</div>';
  }

  /* 四级冲刺入口：把今天的新卡/检测进度带进今日页 */
  function sprintCard() {
    var sp = global.StudyHub.sprint;
    if (!sp || !sp.summary) return '';
    var s = sp.summary();
    if (s.daysLeft == null) return '';
    var tr = (StudyHub.tracks && StudyHub.tracks.current()) || { name: '四级' };
    var head = s.daysLeft > 0 ? '距目标 ' + s.daysLeft + ' 天' : '今天就是目标日';
    return '<div class="card card-sprint"><div class="cs-main">' +
      '<div><h3>' + tr.name + '冲刺 · ' + head + '</h3>' +
      '<p class="muted">今日新卡 ' + s.newTarget + ' 张 · 已完成 ' + s.done + '/' + s.total + ' 项' +
      (s.reviewOnly ? ' · 已进入复习期' : '') + ' · 今日完成 ' + s.percent + '%</p></div>' +
      '<button class="btn primary" id="gotoSprint">去冲刺</button></div>' +
      '<div class="progress"><div class="progress-bar" style="width:' + s.percent + '%"></div></div></div>';
  }

  /* C1 到期置顶：有到期词或过期错题 */
  function dueCard() {
    var d = learn.dueReminders(words());
    if (!d.wordDue && !d.staleWrong) return '';
    var parts = [];
    if (d.wordDue) parts.push(d.wordDue + ' 个复习词今天到期');
    if (d.staleWrong) parts.push(d.staleWrong + ' 道错题该重做');
    return '<div class="card card-due"><h3>今天别忘</h3>' +
      '<p>' + parts.join('，') + '。</p>' +
      '<div class="exec-ops">' +
      (d.wordDue ? '<button class="btn primary" id="gotoWord">去背单词</button>' : '') +
      (d.staleWrong ? '<button class="btn" id="gotoReview">去复盘错题</button>' : '') +
      '</div></div>';
  }

  /* C3 冷落章节 */
  function coldCard() {
    var cold = learn.coldChapters();
    if (!cold.length) return '';
    var top = cold[0];
    var text = '「' + top.chapter + '」已 ' + top.days + ' 天没碰，掌握度 ' + top.level + '/5，要加个复习吗？';
    return '<div class="card card-cold"><h3>建议复习</h3>' +
      '<p>' + ui.esc(text) + '</p>' +
      '<div class="exec-ops"><button class="btn primary" id="coldAdd">加进今日</button>' +
      '<button class="btn" id="coldSkip">忽略</button></div>' +
      '<input type="hidden" id="coldCourse" value="' + ui.esc(top.course) + '" />' +
      '<input type="hidden" id="coldChapter" value="' + ui.esc(top.chapter) + '" />' +
      '</div>';
  }

  /* D 日终小结 */
  function endCard() {
    var e = learn.endOfDay();
    var tm = e.tomorrow;
    return '<div class="card card-end"><h3>今天的账</h3>' +
      '<div class="stat-grid">' +
      '<div class="stat"><b>' + e.doneCount + '</b><span>今日完成</span></div>' +
      '<div class="stat"><b>' + ui.minutes(e.minutes) + '</b><span>专注时长</span></div>' +
      '<div class="stat"><b>' + e.outcomeCount + '</b><span>留下的成果</span></div>' +
      '<div class="stat"><b>' + tm.taskCount + '</b><span>明天待办</span></div>' +
      '<div class="stat"><b>' + tm.wordDue + '</b><span>明天到期复习词</span></div>' +
      '</div></div>';
  }

  function render(host) {
    var y = ui.captureScroll();
    var list = St.todayTasks();
    var snap = timer.snapshot();
    var doneCount = list.filter(function (t) { return t.done; }).length;
    var plannedMin = list.reduce(function (s, t) { return s + (t.done ? 0 : t.minutes); }, 0);
    /* 概览条只读数据 */
    var eod = learn.endOfDay();
    var dueRem = learn.dueReminders(words());
    var remain = list.length - doneCount;
    var ovBar =
      '<div class="overview-bar">' +
      '<div class="ov-cell"><div class="ov-num">' + doneCount + '/' + list.length + '</div><div class="ov-lab">今日完成</div></div>' +
      '<div class="ov-cell"><div class="ov-num">' + Math.round(eod.minutes) + '</div><div class="ov-lab">专注分钟</div></div>' +
      '<div class="ov-cell"><div class="ov-num warn">' + dueRem.wordDue + '</div><div class="ov-lab">到期复习词</div></div>' +
      '<div class="ov-cell"><div class="ov-num">' + remain + '</div><div class="ov-lab">待办剩余</div></div>' +
      '</div>';

    host.innerHTML =
      '<div class="view-inner">' +
      ovBar +
      sprintCard() +
      dueCard() +
      outcomeBlock(latestOutcome()) +
      coldCard() +
      '<div class="card today-tasks"><div class="today-head"><h2>今日待办</h2>' +
      '<span class="muted small">' + list.length + ' 条 · 已完成 ' + doneCount +
      ' 条 · 剩余约 ' + ui.minutes(plannedMin) + '</span></div>' +
      (snap.status !== 'idle'
        ? '<p class="timing">' + (snap.status === 'paused' ? '计时已暂停：' : '正在计时：') +
          ui.esc(snap.title || '自由学习') + ' · ' + timer.format(snap.seconds) + '</p>'
        : '') +
      (list.length
        ? '<ul class="task-list">' + list.map(function (t) {
            var tool = global.StudyHubData.toolOf(t.intent);
            var hasProg = !!learn.execGet(t.id);
            var ticking = snap.status !== 'idle' && snap.taskId === t.id;
            var primaryBtn = tool === 'timer'
              ? '<button class="btn t-time' + (ticking ? ' primary' : '') + '" style="font-weight:600">' +
                (ticking ? '⏱ ' + timer.format(snap.seconds) : '⏱ 计时') + '</button>'
              : '<button class="btn primary t-start" style="font-weight:700">' + (hasProg ? '▶ 继续练习' : '▶ 开始练习') + '</button>';
            return '<li class="task' + (t.done ? ' done' : '') + '" data-id="' + t.id + '" data-tool="' + tool + '">' +
              '<label class="check"><input type="checkbox" class="ck" ' + (t.done ? 'checked' : '') + ' />' +
              '<span class="box"></span></label>' +
              '<div class="task-body">' +
              '<div class="task-title">' + ui.esc(t.title) + '</div>' +
              '<div class="task-meta">' + ui.esc(intentName(t.intent)) +
              (t.minutes ? ' · 约 ' + t.minutes + ' 分钟' : '') +
              (t.repeat === 'daily' ? ' · 每天' : '') +
              (hasProg && !t.done ? ' · <b class="prog">有进度</b>' : '') +
              (t.overdue && !t.done ? ' · <b class="warn">逾期</b>' : '') +
              '</div></div>' +
              '<div class="task-ops">' + primaryBtn +
              '<button class="btn small t-put">推明天</button>' +
              '<button class="icon t-del" title="删除">×</button>' +
              '</div></li>';
          }).join('') + '</ul>'
        : '<div class="empty-hint"><p>今天还没有待办。</p>' +
          '<p class="muted">→ 点 <a href="#inbox">收件箱</a> 写一句话生成待办，或点 <a href="#practice">▶ 练习</a> 直接开始背单词/刷题/复习。</p>' +
          '</div>') +
      '</div>' +
      endCard() +
      '</div>';

    /* 到期置顶按钮 */
    var gs = host.querySelector('#gotoSprint');
    if (gs) gs.addEventListener('click', function () { global.StudyHub.app.navigate('sprint'); });
    var gw = host.querySelector('#gotoWord');
    if (gw) gw.addEventListener('click', function () { global.StudyHub.app.render('exec-wordcard', { taskId: '' }); });
    var gr = host.querySelector('#gotoReview');
    if (gr) gr.addEventListener('click', function () { global.StudyHub.app.navigate('review'); });

    /* 冷落章节：加进今日或忽略 */
    var addBtn = host.querySelector('#coldAdd');
    if (addBtn) addBtn.addEventListener('click', function () {
      var co = host.querySelector('#coldCourse').value;
      var ch = host.querySelector('#coldChapter').value;
      St.addTask({ title: '复习 ' + co + ' ' + ch + '（从冷落提醒来）', intent: 'review-chapter',
        course: co, chapter: ch, minutes: 25, plannedDate: St.dateKey() });
      render(host);
    });
    var skipBtn = host.querySelector('#coldSkip');
    if (skipBtn) skipBtn.addEventListener('click', function () {
      learn.setMastery(host.querySelector('#coldCourse').value, host.querySelector('#coldChapter').value, 4);
      render(host);
    });

    /* 最近成果：补笔记 */
    var noteBtn = host.querySelector('#ocSave');
    if (noteBtn) {
      noteBtn.addEventListener('click', function () {
        var o = latestOutcome();
        var v = host.querySelector('#ocNote').value.trim();
        if (!o) return;
        o.meta = o.meta || {};
        o.meta.note = v;
        learn.updateOutcome(o.id, { meta: o.meta });
        host.querySelector('#ocCount').textContent = v ? v.length + ' 字' : '';
      });
    }

    host.querySelectorAll('.task').forEach(function (li) {
      var id = li.getAttribute('data-id');
      li.querySelector('.ck').addEventListener('change', function (e) {
        St.completeTask(id, e.target.checked);
        render(host);
      });
      var startBtn = li.querySelector('.t-start');
      if (startBtn) {
        startBtn.addEventListener('click', function () {
          var tool = li.getAttribute('data-tool');
          global.StudyHub.app.render('exec-' + tool, { taskId: id });
        });
      }
      var timeBtn = li.querySelector('.t-time');
      if (timeBtn) {
        timeBtn.addEventListener('click', function () {
          var t = St.taskById(id);
          if (!t) return;
          var cur = timer.snapshot();
          if (cur.status !== 'idle') {
            /* 已经在计这一条：不重启，避免把已计时长清零 */
            if (cur.taskId === t.id) return;
            if (!confirm('正在计「' + (cur.title || '自由学习') + '」' + timer.format(cur.seconds) +
                '，先结束它再开始新的吗？\n已计时长会记进学习记录。')) return;
            timer.stop();
          }
          timer.start({ title: t.title, taskId: t.id, targetMin: t.minutes || 25, mode: 'focus' });
          render(host);
        });
      }
      li.querySelector('.t-put').addEventListener('click', function () {
        St.postpone(id);
        render(host);
      });
      li.querySelector('.t-del').addEventListener('click', function () {
        learn.execClear(id);
        St.removeTask(id);
        render(host);
      });
    });

    ui.restoreScroll(y);
  }

  global.StudyHub.views = global.StudyHub.views || {};
  global.StudyHub.views.today = {
    render: render,
    onTick: function (snap) {
      var el = document.querySelector('.timing');
      if (snap.status === 'idle') {
        if (el) el.remove();
      } else if (el) {
        el.textContent = (snap.status === 'paused' ? '计时已暂停：' : '正在计时：') +
          (snap.title || '自由学习') + ' · ' + timer.format(snap.seconds);
      }
      /* 按钮文案跟着秒表走，结束时自动回到「⏱ 计时」，不用整页重绘 */
      var running = snap.status !== 'idle';
      document.querySelectorAll('.task').forEach(function (li) {
        var btn = li.querySelector('.t-time');
        if (!btn) return;
        var on = running && snap.taskId === li.getAttribute('data-id');
        var label = on ? '⏱ ' + timer.format(snap.seconds) : '⏱ 计时';
        if (btn.textContent !== label) btn.textContent = label;
        btn.classList.toggle('primary', on);
      });
    }
  };
})(window);
