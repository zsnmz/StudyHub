/* 收件箱 · 一句话 → 待办草稿的入口 */
(function (global) {
  'use strict';
  var St = global.StudyHub.state, ui = global.StudyHub.ui, parser = global.StudyHub.parser;

  var EXAMPLES = [
    '明天要背 30 分钟四级单词',
    '帮我安排复习数据结构第 3 章',
    '我想准备蓝桥杯',
    '今晚刷算法题 1 小时'
  ];

  function intentName(id) {
    if (id === 'plain') return '普通待办';
    var list = global.StudyHubData.intents;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i].name;
    return id;
  }

  function render(host) {
    var draft = St.getDraft();
    host.innerHTML =
      '<div class="view-inner">' +
      '<div class="card">' +
      '  <h2>收件箱</h2>' +
      '  <p class="muted">随便写一句话，我来把它拆成今天的待办。解析在本地完成，不联网。</p>' +
      '  <div class="inbox-row">' +
      '    <input id="inboxInput" class="inbox-input" type="text" placeholder="例如：' + EXAMPLES[0] + '" />' +
      '    <button id="inboxGo" class="btn primary">拆成待办</button>' +
      '  </div>' +
      '  <div class="examples">' +
      EXAMPLES.map(function (s) {
        return '<button class="chip" data-say="' + ui.esc(s) + '">' + ui.esc(s) + '</button>';
      }).join('') +
      '  </div>' +
      '  <div id="inboxAsk"></div>' +
      (draft && draft.todos && draft.todos.length
        ? '<p class="muted">有一份「' + ui.esc(draft.intentName) + '」草稿还没确认，' +
          '<a href="#draft">去确认</a>。</p>'
        : '') +
      '</div>' +
      '<div class="card"><h3>它怎么工作</h3>' +
      '<p class="muted">本地规则匹配关键词，命中就按模板拆 1–3 条待办；' +
      '拿不准会反问你，不会瞎编。模板清单见「设置 → 意图模板一览」。</p></div>' +
      '</div>';

    var input = host.querySelector('#inboxInput');
    var askBox = host.querySelector('#inboxAsk');

    function go(text) {
      var res = parser.parse(text);
      if (res.empty) { input.focus(); return; }
      if (res.ok) {
        St.setDraft({ source: text, intentId: res.intentId, intentName: res.intentName, todos: res.todos });
        global.StudyHub.app.navigate('draft');
        return;
      }
      /* 未命中：反问，绝不硬凑 */
      askBox.innerHTML =
        '<div class="ask"><p>没看懂「' + ui.esc(text) + '」。你是想做哪一类？</p>' +
        res.candidates.map(function (id) {
          return '<button class="chip" data-intent="' + id + '">' + ui.esc(intentName(id)) + '</button>';
        }).join('') + '</div>';
      askBox.querySelectorAll('[data-intent]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var r2 = parser.parseAs(btn.getAttribute('data-intent'), text);
          St.setDraft({ source: text, intentId: r2.intentId, intentName: r2.intentName, todos: r2.todos });
          global.StudyHub.app.navigate('draft');
        });
      });
    }

    host.querySelector('#inboxGo').addEventListener('click', function () { go(input.value); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(input.value); });
    host.querySelectorAll('[data-say]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        input.value = btn.getAttribute('data-say');
        go(input.value);
      });
    });
    input.focus();
  }

  global.StudyHub.views = global.StudyHub.views || {};
  global.StudyHub.views.inbox = { render: render };
})(window);
