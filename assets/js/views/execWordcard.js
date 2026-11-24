/* 执行器 · 背单词闪卡：认识/模糊/不认识 → 1/3/7 天间隔队列；退出保留进度 */
(function (global) {
  'use strict';
  var St = global.StudyHub.state, ui = global.StudyHub.ui, learn = global.StudyHub.learn;

  var D = global.StudyHubData;
  var FREE_NAME = 'free-wordcard';
  function freeNameOf(taskId) { return taskId ? '' : FREE_NAME; }
  function isFree(taskId) { return !taskId; }

  function words() {
    if (!D || !D.words || !D.words.length) return null;
    return D.words.map(function (x) {
      return x && x.w ? { w: x.w, pos: x.pos || '', zh: x.zh || x.m || '', ex: x.ex || '' } : null;
    }).filter(Boolean);
  }

  function render(host, payload) {
    var taskId = payload.taskId || '';
    var task = taskId ? St.taskById(taskId) : { id: '', intent: '', title: '直接练习·背单词' };
    var list = words();
    if (!list) {
      host.innerHTML = ui.emptyState('词表还没有导入。等 data/words.js 准备好后，这里就能直接开背。', 'practice');
      return;
    }
    var prog = learn.execGet(taskId, freeNameOf(taskId));
    if (prog && prog.phase === 'run') return runCard(host, task, prog);
    if (prog && prog.phase === 'done') return done(host, task, prog);
    setup(host, task, taskId, list);
  }

  /* 开始屏：今日到期复习数 + 选新词数（自适应配额） */
  function setup(host, task, taskId, list) {
    var q = learn.wordQueue(list, 0);
    var isF = isFree(taskId);
    var cap = learn.adaptiveNewCap(list, { base: 20, adaptive: St.settings().adaptive });
    var selOpts = [10, 20, 30].map(function (n) {
      return '<option value="' + n + '"' + (n === cap.cap ? ' selected' : '') + '>' + n + ' 个</option>';
    }).join('');
    host.innerHTML =
      '<div class="view-inner"><div class="card exec">' +
      '<h2>' + ui.esc(task.title) + (isF ? ' · 自由练习' : '') + '</h2>' +
      '<p class="muted">今日到期复习 <b>' + q.due.length + '</b> 个 · 词库共 ' + list.length + ' 词</p>' +
      (cap.reason ? '<p class="muted cmp">' + cap.reason + '，新词配额自动调为 ' + cap.cap + '。</p>' : '') +
      '<div class="exec-setup"><label>今日新词</label>' +
      '<select id="wcNew">' + selOpts + '</select>' +
      '<button class="btn primary" id="wcStart">开始</button>' +
      '<button class="btn" id="wcBack">退出</button></div></div></div>';
    host.querySelector('#wcBack').addEventListener('click', function () {
      global.StudyHub.app.navigate(isF ? 'practice' : 'today');
    });
    host.querySelector('#wcStart').addEventListener('click', function () {
      var n = +host.querySelector('#wcNew').value;
      var qq = learn.wordQueue(list, n);
      var prog = {
        phase: 'run',
        queue: qq.due.concat(qq.fresh).map(function (x) { return x.w; }),
        index: 0, newCount: qq.fresh.length, dueCount: qq.due.length,
        stats: { known: 0, vague: 0, unknown: 0 }, nextDates: [],
        free: isF
      };
      if (!prog.queue.length) {
        host.innerHTML = ui.emptyState('今天没有到期复习的词，新词也已学完。明天再来。', isF ? 'practice' : 'today');
        return;
      }
      learn.execSet(taskId, freeNameOf(taskId), prog);
      runCard(host, task, prog);
    });
  }

  /* 卡片屏 */
  function runCard(host, task, prog) {
    var list = words() || [];
    var w = null;
    for (var i = 0; i < list.length; i++) if (list[i].w === prog.queue[prog.index]) w = list[i];
    if (!w) { prog.index += 1; learn.execSet(task.id, freeNameOf(task.id), prog); return runCard(host, task, prog); }
    host.innerHTML =
      '<div class="view-inner"><div class="card exec">' +
      '<div class="exec-top"><span>第 ' + (prog.index + 1) + ' / ' + prog.queue.length + ' 张 · 剩余 ' + (prog.queue.length - prog.index) + '</span>' +
      '<button class="btn small" id="wcQuit">退出（保留进度）</button></div>' +
      '<div class="flashcard" id="wcCard"><b class="fc-w">' + ui.esc(w.w) + '</b>' +
      '<span class="fc-pos">' + ui.esc(w.pos || '') + '</span>' +
      '<div class="fc-back" hidden><p class="fc-zh">' + ui.esc(w.zh || '') + '</p>' +
      (w.ex ? '<p class="fc-ex">' + ui.esc(w.ex) + '</p>' : '') + '</div></div>' +
      '<div class="exec-ops" id="wcOps"><button class="btn primary" id="wcFlip">显示释义</button></div></div></div>';

    host.querySelector('#wcQuit').addEventListener('click', function () {
      global.StudyHub.app.navigate(isFree(task.id) ? 'practice' : 'today');
    });
    host.querySelector('#wcFlip').addEventListener('click', function () {
      host.querySelector('.fc-back').hidden = false;
      host.querySelector('#wcOps').innerHTML =
        '<button class="btn good" data-g="known">认识</button>' +
        '<button class="btn mid" data-g="vague">模糊</button>' +
        '<button class="btn bad" data-g="unknown">不认识</button>';
      host.querySelectorAll('#wcOps [data-g]').forEach(function (btn) {
        btn.addEventListener('click', function () { grade(host, task, prog, w, btn.getAttribute('data-g')); });
      });
    });
  }

  function grade(host, task, prog, w, g) {
    var next = learn.markWord(w.w, g);
    prog.stats[g] += 1;
    if (g === 'unknown') prog.queue.push(w.w); /* 不认识的本轮尾部再见一次 */
    else prog.nextDates.push(next);
    prog.index += 1;
    if (prog.index >= prog.queue.length) {
      prog.phase = 'done';
      prog.outcome = buildOutcome(task, prog);
      learn.addOutcome(prog.outcome);
    }
    learn.execSet(task.id, freeNameOf(task.id), prog);
    if (prog.phase === 'done') done(host, task, prog);
    else runCard(host, task, prog);
  }

  function buildOutcome(task, prog) {
    var s = prog.stats, total = s.known + s.vague + s.unknown;
    var dates = prog.nextDates.sort();
    var nextText = s.unknown ? '明天' : (dates.length ? ui.dateCN(dates[0]) : '—');
    var prefix = prog.free ? '【自由练习】' : '';
    return {
      taskId: task.id, intent: task.intent, tool: 'wordcard', free: prog.free || false,
      summary: prefix + '背了 ' + total + ' 个词（新词 ' + prog.newCount + '），' + s.known + ' 个认识、' +
        s.unknown + ' 个不认识，已排入复习队列，下次重现 ' + nextText,
      meta: { known: s.known, vague: s.vague, unknown: s.unknown, newCount: prog.newCount, dueCount: prog.dueCount }
    };
  }

  /* 结束屏：成果卡 + 对比（不再自动跳转，等用户点） */
  function done(host, task, prog) {
    var isF = prog.free || isFree(task.id);
    var cmp = learn.compareText(prog.outcome, learn.previousOutcome(prog.outcome));
    host.innerHTML =
      '<div class="view-inner"><div class="card exec">' +
      '<h2>本轮背完了' + (isF ? '（自由练习）' : '') + '</h2>' +
      ui.outcomeCard(prog.outcome) +
      '<p class="cmp">↳ ' + cmp + '</p>' +
      '<div class="exec-ops"><button class="btn primary" id="wcDone">完成，回' + (isF ? '练习' : '今日') + '</button>' +
      '<button class="btn" id="wcAgain">再背一轮</button></div></div></div>';
    host.querySelector('#wcDone').addEventListener('click', function () {
      if (!isF) St.completeTask(task.id, true);
      learn.execClear(task.id, freeNameOf(task.id));
      global.StudyHub.app.navigate(isF ? 'practice' : 'today');
    });
    host.querySelector('#wcAgain').addEventListener('click', function () {
      learn.execClear(task.id, freeNameOf(task.id));
      render(host, { taskId: task.id });
    });
  }

  global.StudyHub.views = global.StudyHub.views || {};
  global.StudyHub.views['exec-wordcard'] = { render: render };
})(window);
