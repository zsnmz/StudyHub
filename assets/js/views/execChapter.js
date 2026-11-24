/* 执行器 · 章节复习：章要点 + 资源入口（平台搜索占位）+ 掌握度回填（0–5） */
(function (global) {
  'use strict';
  var St = global.StudyHub.state, ui = global.StudyHub.ui, learn = global.StudyHub.learn;

  function findNote(course, chapter) {
    var d = global.StudyHubData;
    var notes = (d && d.notes) || [];
    if (!notes.length) return null;
    for (var i = 0; i < notes.length; i++) {
      var n = notes[i];
      if (course && n.course !== course) continue;
      if (chapter && n.chapter &&
        (n.chapter.indexOf(chapter) !== -1 || chapter.indexOf(n.chapter) !== -1)) return n;
    }
    return null;
  }
  function courses() {
    return ((global.StudyHubData && global.StudyHubData.courses) || []).map(function (c) { return c.title; });
  }
  function chaptersOf(course) {
    var cs = (global.StudyHubData && global.StudyHubData.courses) || [];
    for (var i = 0; i < cs.length; i++) if (cs[i].title === course) {
      return (cs[i].chapters || []).map(function (ch) { return ch.title; });
    }
    return [];
  }

  /* 选章屏：自由练习没有待办指定章节，让用户选 */
  function pickScreen(host, payload) {
    host.innerHTML =
      '<div class="view-inner"><div class="card exec">' +
      '<h2>章节复习 · 自由练习</h2>' +
      '<p class="muted">先选一门课和章节，就能看要点、回填掌握度。（完成后不生成待办、不计时）</p>' +
      '<div class="exec-setup">' +
      '<label>课程</label><select id="chCourse">' +
      courses().map(function (c) { return '<option>' + ui.esc(c) + '</option>'; }).join('') + '</select>' +
      '<label>章节</label><select id="chCh"></select>' +
      '<button class="btn primary" id="chGo">开始复习</button>' +
      '<button class="btn" id="chBack">退出</button></div></div></div>';
    host.querySelector('#chCourse').addEventListener('change', function (e) {
      var sel = document.getElementById('chCh');
      sel.innerHTML = chaptersOf(e.target.value).map(function (c) { return '<option>' + ui.esc(c) + '</option>'; }).join('');
    });
    /* 初始化章节下拉 */
    host.querySelector('#chCourse').dispatchEvent(new Event('change'));
    host.querySelector('#chBack').addEventListener('click', function () {
      global.StudyHub.app.navigate('practice');
    });
    host.querySelector('#chGo').addEventListener('click', function () {
      render(host, { taskId: '', course: host.querySelector('#chCourse').value, chapter: host.querySelector('#chCh').value, free: true });
    });
  }

  function render(host, payload) {
    var taskId = payload.taskId || '';
    var task = taskId ? St.taskById(taskId) : null;

    /* 无任务且没指定课程 → 走选章屏 */
    if (!taskId && !payload.course) { pickScreen(host, payload); return; }

    var isFree = !taskId || payload.free;
    var rc = isFree
      ? { course: payload.course || '', chapter: payload.chapter || '' }
      : learn.resolveChapter(task.course || '', task.chapter || '');
    var course = rc.course, chapter = rc.chapter;
    if (!course || !chapter) {
      host.innerHTML = ui.emptyState('还没选好课程和章节。', isFree ? 'practice' : 'today');
      return;
    }
    var label = course + ' ' + chapter;
    var note = findNote(course, chapter);
    var mKey = course + '::' + chapter;
    var cur = (learn.mastery()[mKey] || {}).level;

    host.innerHTML =
      '<div class="view-inner"><div class="card exec">' +
      '<div class="exec-top"><h2>' + ui.esc(label) + (isFree ? ' · 自由练习' : '') + '</h2>' +
      '<button class="btn small" id="chQuit">退出</button></div>' +
      '<h3>本章要点</h3>' +
      (note && note.points && note.points.length
        ? '<ul class="plain-list">' + note.points.map(function (p) { return '<li><span>' + ui.esc(p) + '</span></li>'; }).join('') + '</ul>' +
          (note.keywords && note.keywords.length
            ? '<p class="muted">关键词：' + note.keywords.map(ui.esc).join('、') + '</p>' : '')
        : '<p class="muted">本章要点素材待导入（data/notes.js 准备好后自动显示）。</p>') +
      '<h3>资源入口</h3>' +
      '<p class="muted">不存具体链接，需要时按平台搜索：</p>' +
      '<div class="row-actions">' +
      '<a class="btn small" target="_blank" rel="noopener" href="https://search.bilibili.com/all?keyword=' +
        encodeURIComponent(label + ' 讲解') + '">B 站搜「' + ui.esc(label) + '」</a>' +
      '<a class="btn small" target="_blank" rel="noopener" href="https://www.icourse163.org/search.htm?search=' +
        encodeURIComponent(label) + '">MOOC 搜「' + ui.esc(label) + '」</a>' +
      '</div>' +
      '<h3>掌握度回填</h3>' +
      '<p class="muted">0 = 完全不会，5 = 能给别人讲清楚。当前：' + (cur == null ? '未标' : cur) + '</p>' +
      '<div class="mastery-row" id="chM">' +
      [0, 1, 2, 3, 4, 5].map(function (v) {
        return '<button class="m-btn' + (cur === v ? ' on' : '') + '" data-v="' + v + '">' + v + '</button>';
      }).join('') + '</div>' +
      '<div class="exec-ops"><button class="btn primary" id="chDone" disabled>完成复习</button></div>' +
      '<div id="chOutcome"></div></div></div>';

    host.querySelector('#chQuit').addEventListener('click', function () {
      global.StudyHub.app.navigate(isFree ? 'practice' : 'today');
    });
    var picked = null;
    host.querySelectorAll('#chM .m-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        picked = +btn.getAttribute('data-v');
        host.querySelectorAll('#chM .m-btn').forEach(function (b) { b.classList.toggle('on', b === btn); });
        host.querySelector('#chDone').disabled = false;
      });
    });
    host.querySelector('#chDone').addEventListener('click', function () {
      var before = cur;
      learn.setMastery(course, chapter, picked);
      var delta = (before == null) ? '' :
        picked > before ? '（比上次涨 ' + (picked - before) + ' 格）' :
        picked < before ? '（比上次掉 ' + (before - picked) + ' 格）' : '（和上次持平）';
      var prefix = isFree ? '【自由练习】' : '';
      var outcome = learn.addOutcome({
        taskId: taskId, intent: task ? task.intent : '', tool: 'chapter', free: isFree,
        summary: prefix + '复习了「' + label + '」，掌握度回填为 ' + picked + '/5' + delta,
        meta: { course: course, chapter: chapter, from: before, to: picked }
      });
      if (!isFree) St.completeTask(taskId, true);
      var cmp = learn.compareText(outcome, learn.previousOutcome(outcome));
      host.querySelector('#chOutcome').innerHTML = ui.outcomeCard(outcome) +
        '<p class="cmp">↳ ' + cmp + '</p>' +
        '<div class="exec-ops"><button class="btn primary" id="chBack">返回' + (isFree ? '练习' : '今日') + '</button>' +
        '<button class="btn" id="chRetry">再复习一轮</button></div>';
      host.querySelector('#chOutcome').hidden = false;
      host.querySelector('#chDone').hidden = true;
      host.querySelector('#chOutcome').querySelector('#chBack').addEventListener('click', function () {
        global.StudyHub.app.navigate(isFree ? 'practice' : 'today');
      });
      host.querySelector('#chOutcome').querySelector('#chRetry').addEventListener('click', function () {
        render(host, { taskId: taskId, course: course, chapter: chapter, free: isFree });
      });
    });
  }

  global.StudyHub.views = global.StudyHub.views || {};
  global.StudyHub.views['exec-chapter'] = { render: render };
})(window);
