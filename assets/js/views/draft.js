/* 待办草稿确认 · 逐条编辑后才写入今日清单，绝不跳过确认 */
(function (global) {
  'use strict';
  var St = global.StudyHub.state, ui = global.StudyHub.ui;

  function dateLabel(key) {
    var today = St.dateKey();
    if (key === today) return '今天';
    if (key === St.addDays(today, 1)) return '明天';
    if (key === St.addDays(today, 2)) return '后天';
    return ui.dateCN(key);
  }

  function render(host) {
    var draft = St.getDraft();
    if (!draft || !draft.todos || !draft.todos.length) {
      host.innerHTML = '<div class="view-inner"><div class="card"><h2>待办草稿</h2>' +
        '<p class="muted">现在没有待确认的草稿。先去 <a href="#inbox">收件箱</a> 写一句话。</p></div></div>';
      return;
    }

    host.innerHTML =
      '<div class="view-inner"><div class="card">' +
      '<h2>确认这份草稿</h2>' +
      '<p class="muted">来源：「' + ui.esc(draft.source || '') + '」 · 识别为 <b>' +
      ui.esc(draft.intentName || '') + '</b>。可以改标题、改时长、删掉或调顺序，确认后才会进今日清单。</p>' +
      '<ul class="draft-list">' +
      draft.todos.map(function (t, i) {
        return '<li class="draft-item" data-i="' + i + '">' +
          '<span class="draft-order">' + (i + 1) + '</span>' +
          '<input class="d-title" type="text" value="' + ui.esc(t.title) + '" />' +
          '<input class="d-min" type="number" min="0" step="5" value="' + (t.minutes || 0) + '" title="预计分钟" />' +
          '<span class="draft-meta">分钟 · ' + dateLabel(t.plannedDate) + '</span>' +
          '<span class="draft-ops">' +
          '<button class="icon up" title="上移">↑</button>' +
          '<button class="icon down" title="下移">↓</button>' +
          '<button class="icon del" title="删除">×</button></span></li>';
      }).join('') +
      '</ul>' +
      '<div class="row-actions">' +
      '<button id="draftOk" class="btn primary">确认，写入今日清单</button>' +
      '<button id="draftCancel" class="btn">放弃草稿</button>' +
      '</div></div></div>';

    function rerender() { render(host); }

    host.querySelectorAll('.draft-item').forEach(function (li) {
      var i = +li.getAttribute('data-i');
      li.querySelector('.d-title').addEventListener('change', function (e) {
        draft.todos[i].title = e.target.value.trim() || draft.todos[i].title;
        St.setDraft(draft);
      });
      li.querySelector('.d-min').addEventListener('change', function (e) {
        draft.todos[i].minutes = Math.max(0, +e.target.value || 0);
        St.setDraft(draft);
      });
      li.querySelector('.up').addEventListener('click', function () {
        if (i === 0) return;
        var t = draft.todos.splice(i, 1)[0];
        draft.todos.splice(i - 1, 0, t);
        St.setDraft(draft); rerender();
      });
      li.querySelector('.down').addEventListener('click', function () {
        if (i >= draft.todos.length - 1) return;
        var t = draft.todos.splice(i, 1)[0];
        draft.todos.splice(i + 1, 0, t);
        St.setDraft(draft); rerender();
      });
      li.querySelector('.del').addEventListener('click', function () {
        draft.todos.splice(i, 1);
        St.setDraft(draft); rerender();
      });
    });

    host.querySelector('#draftOk').addEventListener('click', function () {
      draft.todos.forEach(function (t) {
        if (!t.title.trim()) return;
        St.addTask({
          title: t.title, minutes: t.minutes, intent: draft.intentId,
          plannedDate: t.plannedDate, course: t.course || '', chapter: t.chapter || ''
        });
      });
      St.clearDraft();
      global.StudyHub.app.navigate('today');
    });
    host.querySelector('#draftCancel').addEventListener('click', function () {
      St.clearDraft();
      global.StudyHub.app.navigate('inbox');
    });
  }

  global.StudyHub.views = global.StudyHub.views || {};
  global.StudyHub.views.draft = { render: render };
})(window);
