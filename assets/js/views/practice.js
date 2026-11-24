/* 练习入口 · 不绑定任何待办的直接练习：背单词 / 刷题 / 章节复习 */
(function (global) {
  'use strict';
  var D = global.StudyHubData;
  function hasData(key) { return D && D[key] && D[key].length > 0; }

  function card(title, sub, tool, enabled) {
    return '<button class="p-card' + (enabled ? '' : ' disabled') + '" data-tool="' + tool + '">' +
      '<b class="p-t">' + title + '</b><span class="p-s">' + sub + '</span>' +
      (enabled ? '<span class="p-go">开始 →</span>' : '<span class="p-nope">素材待导入</span>') +
      '</button>';
  }

  function render(host) {
    var wcOK = hasData('words');
    var qzOK = hasData('questions');
    var chOK = hasData('notes') || hasData('courses');
    host.innerHTML =
      '<div class="view-inner">' +
      '<div class="card"><h2>直接练习</h2>' +
      '<p class="muted">这里开的练习<b>不绑定待办</b>，成果仍会落库进复盘，标记为「自由练习」。想安排成今天的待办 → 去 <a href="#inbox">收件箱</a>。</p></div>' +
      '<div class="card"><h3>选一个直接开练</h3>' +
      '<div class="p-grid">' +
      card('背单词', wcOK ? '词库 ' + D.words.length + ' 词 · 间隔复习' : '词表尚未导入', 'wordcard', wcOK) +
      card('刷题', qzOK ? '题库 ' + D.questions.length + ' 题 · 逐题判对错' : '题库尚未导入', 'quiz', qzOK) +
      card('章节复习', chOK ? '按课程/章节回填掌握度' : '章节素材尚未导入', 'chapter', chOK) +
      '</div></div></div>';
    host.querySelectorAll('.p-card').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tool = btn.getAttribute('data-tool');
        if (btn.classList.contains('disabled')) return;
        global.StudyHub.app.render('exec-' + tool, { taskId: '' });
      });
    });
  }

  global.StudyHub.views = global.StudyHub.views || {};
  global.StudyHub.views.practice = { render: render };
})(window);
