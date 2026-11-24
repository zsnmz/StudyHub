/* 复盘 · 能力三指标为主：掌握度变化 / 错题复现 / 时间估算准度；完成率降为过程指标 */
(function (global) {
  'use strict';
  var St = global.StudyHub.state, ui = global.StudyHub.ui, learn = global.StudyHub.learn;

  /* 时间估算：本周有计时且能关联到任务（有预计分钟）的，算 实际-预计 */
  function estimateRows(ws, today) {
    var byTask = {};
    St.sessionsBetween(ws, today).forEach(function (s) {
      if (!s.taskId) return;
      byTask[s.taskId] = (byTask[s.taskId] || 0) + (+s.minutes || 0);
    });
    var rows = [];
    Object.keys(byTask).forEach(function (tid) {
      var t = St.taskById(tid);
      if (!t || !t.minutes) return;
      var diff = byTask[tid] - t.minutes;
      if (diff !== 0) rows.push({ title: t.title, est: t.minutes, act: byTask[tid], diff: diff });
    });
    rows.sort(function (a, b) { return Math.abs(b.diff) - Math.abs(a.diff); });
    return rows.slice(0, 3);
  }

  /* 连续学习天数（有成果或计时即算；今天还没有就从昨天往回数，不做断签惩罚） */
  function streak() {
    var days = {}, n = 0, cur = St.dateKey();
    St.sessions().forEach(function (s) { days[s.date] = 1; });
    learn.outcomes().forEach(function (o) { days[o.date] = 1; });
    if (!days[cur]) cur = St.addDays(cur, -1);
    while (days[cur]) { n++; cur = St.addDays(cur, -1); }
    return n;
  }

  function render(host) {
    var y = ui.captureScroll();
    var ws = St.weekStart(), today = St.dateKey();
    var sessions = St.sessionsBetween(ws, today);
    var totalMin = sessions.reduce(function (s, x) { return s + (+x.minutes || 0); }, 0);
    var allData = (global.StudyHubData) || {};
    var allCourses = allData.courses || [];
    var allWords = allData.words || [];

    /* A 累积进度 */
    var wp = learn.wordProgress(allWords);
    var wgp = learn.wrongProgress();
    var grid = learn.masteryGrid(allCourses);
    var rh = learn.rhythm();

    /* 指标一：掌握度变化 */
    var changes = learn.masteryChanges();

    /* 指标二：错题复现（同一知识点第二次还错 = 没学会，标红） */
    var wb = learn.wrongbook();
    var repeated = wb.filter(function (w) { return w.times >= 2; });

    /* 指标三：时间估算准度 */
    var ests = estimateRows(ws, today);

    /* 过程指标（次要）：完成率 */
    var tasks = St.tasks();
    var weekTasks = tasks.filter(function (t) { return t.plannedDate >= ws && t.plannedDate <= today; });
    var doneN = weekTasks.filter(function (t) { return t.status === 'done'; }).length;
    var rate = weekTasks.length ? Math.round(doneN / weekTasks.length * 100) : null;

    /* 错题本按 课程→章节 分组 */
    var grouped = {};
    wb.forEach(function (w) {
      var c = w.course || '未分类', ch = w.chapter || '未分章';
      grouped[c] = grouped[c] || {}; grouped[c][ch] = grouped[c][ch] || [];
      grouped[c][ch].push(w);
    });

    /* 16 章格子：2 门课各 8 章；level null→空 0→灰 1→浅 → 5→深紫 */
    function gridCell(g) {
      var lv = g.level;
      var cls = 'gm';
      if (lv === null || lv === undefined) cls += ' lv-n';
      else cls += ' lv-' + lv;
      var title = (g.course ? g.course + ' · ' : '') + (g.chapter || '');
      if (lv !== null && lv !== undefined) title += ' · 掌握度 ' + lv + '/5';
      if (g.last) title += ' · 上次 ' + ui.dateCN(g.last);
      return '<button class="' + cls + '" data-course="' + ui.esc(g.course) + '" data-chapter="' + ui.esc(g.chapter) + '" title="' + ui.esc(title) + '">' +
        (g.chapter || '?') + '</button>';
    }

    var courseNames = allCourses.map(function (c) { return c.title; });
    var byCourseCells = {};
    grid.forEach(function (g) {
      var c = g.course || '';
      byCourseCells[c] = (byCourseCells[c] || []).push(g) && byCourseCells[c] || [];
      byCourseCells[c].push(g);
    });
    /* 修正：上面那行有 bug，重新算 */
    byCourseCells = {};
    grid.forEach(function (g) {
      var c = g.course || '';
      if (!byCourseCells[c]) byCourseCells[c] = [];
      byCourseCells[c].push(g);
    });

    var gridHTML = courseNames.map(function (cn) {
      var cells = (byCourseCells[cn] || []).map(gridCell).join('');
      return '<div class="grid-course"><b>' + ui.esc(cn) + '</b>' +
        '<div class="grid-row">' + cells + '</div></div>';
    }).join('');

    host.innerHTML =
      '<div class="view-inner">' +

      /* A 累积进度区 */
      '<div class="card"><h2>累积进度</h2>' +
      '<div class="stat-grid">' +
      '<div class="stat"><b>' + wp.mastered + ' / ' + wp.total + '</b><span>词汇已掌握（' + wp.rate + '%）</span>' +
        '<div class="progress"><div class="progress-bar" style="width:' + wp.rate + '%"></div></div></div>' +
      '<div class="stat"><b>' + wp.due + '</b><span>今日到期复习词</span></div>' +
      '<div class="stat"><b>' + wgp.total + '</b><span>错题本中</span></div>' +
      '<div class="stat"><b>' + wgp.repeated + '</b><span>错题复现 ≥2 次</span></div>' +
      '</div>' +
      '<h3>章节掌握度分布</h3>' +
      '<p class="muted">方块越深色掌握越好，点击可直接进该章复习</p>' +
      gridHTML +
      (rh.enough
        ? '<p class="muted cmp">节奏：' + rh.msg + '</p>'
        : '<p class="muted cmp">节奏：' + rh.msg + '</p>') +
      '</div>' +

      '<div class="card"><h3>本周复盘</h3><p class="muted">' + ui.dateCN(ws) + ' 至 ' + ui.dateCN(today) +
      ' · 连续学习 ' + streak() + ' 天</p></div>' +

      '<div class="card"><h3>掌握度变化</h3>' +
      (changes.length
        ? '<ul class="plain-list">' + changes.map(function (c) {
            var up = c.to > c.from;
            return '<li><span>' + ui.esc((c.course ? c.course + ' ' : '') + c.chapter) + '</span>' +
              '<b class="' + (up ? 'judge-ok' : 'judge-no') + '">' + c.from + ' → ' + c.to + (up ? ' 涨' : ' 掉') + '</b></li>';
          }).join('') + '</ul>'
        : '<p class="muted">本周还没有章节回填过掌握度。复习完一章记得在「章节复习」里回填。</p>') +
      '</div>' +

      '<div class="card"><h3>错题复现</h3>' +
      (repeated.length
        ? '<p class="muted">这些知识点错了不止一次——是没学会，不是运气：</p>' +
          '<ul class="plain-list">' + repeated.map(function (w) {
            return '<li><span class="judge-no">' + ui.esc((w.course ? w.course + ' ' : '') + (w.chapter || '') + ' · ' + w.stem.slice(0, 24)) + '</span>' +
              '<b class="judge-no">错 ' + w.times + ' 次</b></li>';
          }).join('') + '</ul>'
        : '<p class="muted">' + (wb.length ? '错题本里暂无重复犯错的知识点，保持。' : '还没有错题记录。') + '</p>') +
      '</div>' +

      '<div class="card"><h3>时间估算准度</h3>' +
      (ests.length
        ? '<ul class="plain-list">' + ests.map(function (r) {
            return '<li><span>' + ui.esc(r.title) + '</span><b>估 ' + r.est + ' 分钟，实际 ' + r.act + ' 分钟' +
              (r.diff > 0 ? '（多花了 ' + r.diff + '）' : '（少花了 ' + (-r.diff) + '）') + '</b></li>';
          }).join('') + '</ul>'
        : '<p class="muted">还没有「预计 vs 实际」能对上的计时记录。给待办启动计时后即可对比。</p>') +
      '</div>' +

      '<div class="card subtle"><p class="muted">过程指标：本周时长 ' + ui.minutes(totalMin) +
      ' · 计时 ' + sessions.length + ' 次 · 完成率 ' + (rate === null ? '—' : rate + '%（' + doneN + '/' + weekTasks.length + '）') +
      ' · 本周成果 ' + learn.outcomesBetween(ws, today).length + ' 条</p></div>' +

      '<div class="card"><h3><button class="btn small" id="wbToggle">错题本（' + wb.length + '）▸</button>' +
      (wb.length ? ' <button class="btn small primary" id="wbRedo">重做这些（' + wb.length + '）</button>' : '') +
      '</h3>' +
      '<div id="wbBody" hidden>' +
      (wb.length
        ? Object.keys(grouped).map(function (c) {
            return '<h4>' + ui.esc(c) + '</h4>' + Object.keys(grouped[c]).map(function (ch) {
              return '<p class="muted">' + ui.esc(ch) + '</p><ul class="plain-list">' +
                grouped[c][ch].map(function (w) {
                  return '<li><span' + (w.times >= 2 ? ' class="judge-no"' : '') + '>' + ui.esc(w.stem) +
                    '</span><b>错 ' + w.times + ' 次 <button class="icon wb-del" data-qid="' + ui.esc(w.qid) + '" title="已掌握，移除">×</button></b></li>';
                }).join('') + '</ul>';
            }).join('');
          }).join('')
        : '<p class="muted">错题本还是空的。刷题答错会自动进这里。</p>') +
      '</div></div></div>';

    host.querySelector('#wbToggle').addEventListener('click', function () {
      var body = host.querySelector('#wbBody');
      body.hidden = !body.hidden;
      this.textContent = '错题本（' + wb.length + '）' + (body.hidden ? '▸' : '▾');
    });
    var redoBtn = host.querySelector('#wbRedo');
    if (redoBtn) redoBtn.addEventListener('click', function () {
      global.StudyHub.app.render('exec-quiz', { taskId: '', onlyWrong: true });
    });
    host.querySelectorAll('.wb-del').forEach(function (btn) {
      btn.addEventListener('click', function () {
        learn.removeWrong(btn.getAttribute('data-qid'));
        render(host);
      });
    });
    host.querySelectorAll('.gm').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var co = btn.getAttribute('data-course'), ch = btn.getAttribute('data-chapter');
        if (!co || !ch) return;
        global.StudyHub.app.render('exec-chapter', { taskId: '', course: co, chapter: ch, free: true });
      });
    });

    ui.restoreScroll(y);
  }

  global.StudyHub.views = global.StudyHub.views || {};
  global.StudyHub.views.review = { render: render };
})(window);
