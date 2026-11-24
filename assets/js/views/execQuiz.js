/* 执行器 · 刷题：按课程+章节抽题，选完即判对错，错题自动入册；退出保留进度 */
(function (global) {
  'use strict';
  var St = global.StudyHub.state, ui = global.StudyHub.ui, learn = global.StudyHub.learn;
  var FREE_NAME = 'free-quiz', WRONG_NAME = 'free-wrong';
  /* 当前这次练习的进度键：错题重做单独存，不覆盖自由刷题的进度 */
  var freeName = FREE_NAME;
  function freeNameOf(taskId) { return taskId ? '' : freeName; }
  function isFree(taskId) { return !taskId; }
  function backOf(prog) { return prog.backTo || (prog.free ? 'practice' : 'today'); }
  function backName(prog) {
    var b = backOf(prog);
    return b === 'review' ? '复盘' : (b === 'today' ? '今日' : '练习');
  }

  function bank() {
    var d = global.StudyHubData;
    return (d && d.questions && d.questions.length) ? d.questions : null;
  }
  function courses(qs) {
    var seen = {}, out = [];
    qs.forEach(function (q) { if (q.course && !seen[q.course]) { seen[q.course] = 1; out.push(q.course); } });
    return out;
  }
  function chaptersOf(qs, course) {
    var seen = {}, out = [];
    qs.forEach(function (q) {
      if (q.course === course && q.chapter && !seen[q.chapter]) { seen[q.chapter] = 1; out.push(q.chapter); }
    });
    return out;
  }
  /* 宽松匹配：章节双向包含，匹配不到则退化为整课程 */
  function pick(qs, course, chapter, n) {
    var pool = qs.filter(function (q) { return q.course === course; });
    var inCh = chapter ? pool.filter(function (q) {
      return q.chapter && (q.chapter.indexOf(chapter) !== -1 || chapter.indexOf(q.chapter) !== -1);
    }) : [];
    var fellBack = chapter && !inCh.length;
    var src = chapter && inCh.length ? inCh : pool;
    var shuffled = src.slice().sort(function () { return Math.random() - 0.5; });
    return { list: shuffled.slice(0, n), fellBack: fellBack };
  }

  /* 错题重做：按 qid 从题库取回题目，错得多的排前面 */
  function wrongQuestions(qs) {
    var map = {}, out = [];
    qs.forEach(function (q) { map[q.id] = q; });
    learn.wrongbook().slice().sort(function (a, b) { return (b.times || 1) - (a.times || 1); })
      .forEach(function (w) { if (map[w.qid]) out.push(map[w.qid]); });
    return out;
  }
  function startWrong(host, task, qs) {
    var list = wrongQuestions(qs);
    if (!list.length) {
      host.innerHTML = ui.emptyState('错题本里没有能重做的题了（题目可能已从题库移除）。', 'review');
      return;
    }
    var prog = {
      phase: 'run', course: '', chapter: '', fellBack: false,
      order: list.map(function (q) { return q.id; }), index: 0, results: {}, wrongs: [],
      free: true, onlyWrong: true, backTo: 'review'
    };
    learn.execSet('', freeNameOf(''), prog);
    runQ(host, task, prog, qs);
  }

  function render(host, payload) {
    var taskId = payload.taskId || '';
    var onlyWrong = !!payload.onlyWrong;
    freeName = onlyWrong ? WRONG_NAME : FREE_NAME;
    var task = taskId ? St.taskById(taskId) : (onlyWrong
      ? { id: '', intent: '', title: '错题重做' }
      : { id: '', intent: '', title: '直接练习·刷题' });
    var qs = bank();
    if (!qs) {
      host.innerHTML = ui.emptyState('题库还没有导入。等 data/questions.js 准备好后，这里就能直接刷题。',
        onlyWrong ? 'review' : (isFree(taskId) ? 'practice' : 'today'));
      return;
    }
    var prog = learn.execGet(taskId, freeNameOf(taskId));
    /* 错题重做：进行中的那轮接着做；上一轮已经出完成果页的，就开新的一轮，
       不然从复盘再点「重做这些」会看到上一轮的旧成果 */
    if (onlyWrong) {
      if (prog && prog.phase === 'run' && prog.onlyWrong) return runQ(host, task, prog, qs);
      return startWrong(host, task, qs);
    }
    if (prog && prog.phase === 'run') return runQ(host, task, prog, qs);
    if (prog && prog.phase === 'done') return done(host, task, prog);
    setup(host, task, taskId, qs);
  }

  function opt(list, sel) {
    return list.map(function (c) { return '<option' + (c === sel ? ' selected' : '') + '>' + ui.esc(c) + '</option>'; }).join('');
  }

  /* 抽题设置屏 */
  function setup(host, task, taskId, qs) {
    var isF = isFree(taskId);
    var cs = courses(qs);
    var rc = learn.resolveChapter(task.course || '', task.chapter || '');
    var course = cs.indexOf(rc.course) !== -1 ? rc.course : cs[0];
    var chs = chaptersOf(qs, course);
    var preCh = chs.indexOf(rc.chapter) !== -1 ? rc.chapter : '';
    host.innerHTML =
      '<div class="view-inner"><div class="card exec">' +
      '<h2>' + ui.esc(task.title) + (isF ? ' · 自由练习' : '') + '</h2>' +
      (task.chapter && !preCh && !isF
        ? '<p class="muted">任务里的章节与本课程题库对不上，已按整门课抽题。</p>' : '') +
      '<div class="exec-setup">' +
      '<label>课程</label><select id="qCourse">' + opt(cs, course) + '</select>' +
      '<label>章节</label><select id="qChapter"><option value="">全部章节</option>' + opt(chs, preCh) + '</select>' +
      '<label>题数</label><select id="qCount"><option>5</option><option selected>10</option><option>15</option></select>' +
      '<button class="btn primary" id="qStart">开始做题</button>' +
      '<button class="btn" id="qBack">退出</button></div></div></div>';
    host.querySelector('#qCourse').addEventListener('change', function (e) {
      var chs2 = chaptersOf(qs, e.target.value);
      host.querySelector('#qChapter').innerHTML = '<option value="">全部章节</option>' + opt(chs2, '');
    });
    host.querySelector('#qBack').addEventListener('click', function () {
      global.StudyHub.app.navigate(isF ? 'practice' : 'today');
    });
    host.querySelector('#qStart').addEventListener('click', function () {
      var c = host.querySelector('#qCourse').value;
      var ch = host.querySelector('#qChapter').value;
      var n = +host.querySelector('#qCount').value || 10;
      var r = pick(qs, c, ch, n);
      if (!r.list.length) {
        host.innerHTML = ui.emptyState('「' + c + '」还没有可出的题。', isF ? 'practice' : 'today');
        return;
      }
      var prog = {
        phase: 'run', course: c, chapter: ch, fellBack: r.fellBack,
        order: r.list.map(function (q) { return q.id; }), index: 0, results: {}, wrongs: [],
        free: isF, onlyWrong: false, backTo: isF ? 'practice' : 'today'
      };
      learn.execSet(taskId, freeNameOf(taskId), prog);
      runQ(host, task, prog, qs);
    });
  }

  /* 选项若已自带「A 」前缀（题库约定），直接原样显示；否则补字母标签 */
  function hasLetterPrefix(opts) {
    if (!opts || !opts.length) return false;
    for (var i = 0; i < opts.length; i++) {
      if (!new RegExp('^\\s*' + 'ABCD'[i] + '(?![A-Za-z])').test(String(opts[i]))) return false;
    }
    return true;
  }
  function optCell(o, i, pre) {
    var s = String(o == null ? '' : o);
    if (pre) return ui.esc(s);
    return '<b>' + 'ABCD'[i] + '</b> ' + ui.esc(s);
  }

  /* 答题屏：选完即判对错 + 解析 */
  function runQ(host, task, prog, qs) {
    var q = null;
    for (var i = 0; i < qs.length; i++) if (qs[i].id === prog.order[prog.index]) q = qs[i];
    if (!q) { prog.index += 1; learn.execSet(task.id, freeNameOf(task.id), prog); return runQ(host, task, prog, qs); }
    host.innerHTML =
      '<div class="view-inner"><div class="card exec">' +
      '<div class="exec-top"><span>第 ' + (prog.index + 1) + ' / ' + prog.order.length + ' 题 · ' +
      ui.esc(q.course || '') + (q.chapter ? ' · ' + ui.esc(q.chapter) : '') +
      (prog.fellBack ? '（该章暂无题，已按全课程抽）' : '') + '</span>' +
      '<button class="btn small" id="qQuit">退出（保留进度）</button></div>' +
      '<p class="q-stem">' + ui.esc(q.stem) + '</p>' +
      '<div class="q-opts" id="qOpts">' +
      (q.options || []).map(function (o, i) {
        return '<button class="q-opt" data-i="' + i + '">' + optCell(o, i, hasLetterPrefix(q.options)) + '</button>';
      }).join('') + '</div>' +
      '<div class="q-judge" id="qJudge"></div></div></div>';

    host.querySelector('#qQuit').addEventListener('click', function () {
      global.StudyHub.app.navigate(backOf(prog));
    });
    /* 已答过的题（中途退出再进）直接还原判题状态，不重复计错 */
    var rec = prog.results[q.id];
    if (rec) paint(host, task, prog, q, rec.pick);
    else host.querySelectorAll('.q-opt').forEach(function (btn) {
      btn.addEventListener('click', function () { judge(host, task, prog, q, +btn.getAttribute('data-i')); });
    });
  }

  /* answer 字母对应到 options 下标：优先按选项自带的前缀定位，避免顺序错位 */
  function answerIdxOf(q) {
    var a = String(q.answer == null ? '' : q.answer).trim().toUpperCase().charAt(0);
    var opts = q.options || [];
    for (var i = 0; i < opts.length; i++) {
      var m = String(opts[i]).match(/^\s*([ABCD])(?![A-Za-z])/);
      if (m && m[1] === a) return i;
    }
    return 'ABCD'.indexOf(a);
  }

  function judge(host, task, prog, q, pickIdx) {
    if (prog.results[q.id]) return;
    var ok = pickIdx === answerIdxOf(q);
    prog.results[q.id] = { pick: pickIdx, ok: ok };
    if (!ok) {
      var w = learn.addWrong(q);
      prog.wrongs.push({ stem: q.stem, chapter: q.chapter, times: w.times });
    }
    learn.execSet(task.id, freeNameOf(task.id), prog);
    paint(host, task, prog, q, pickIdx);
  }

  /* 判题视觉 + 解析 + 下一题 */
  function paint(host, task, prog, q, pickIdx) {
    var answerIdx = answerIdxOf(q);
    var ok = pickIdx === answerIdx;
    host.querySelectorAll('.q-opt').forEach(function (btn, i) {
      btn.disabled = true;
      if (i === answerIdx) btn.classList.add('right');
      else if (i === pickIdx) btn.classList.add('wrong');
    });
    var last = prog.index + 1 >= prog.order.length;
    host.querySelector('#qJudge').innerHTML =
      '<p class="' + (ok ? 'judge-ok' : 'judge-no') + '">' +
      (ok ? '答对了' : '答错了，正确答案 ' + 'ABCD'[answerIdx < 0 ? 0 : answerIdx]) + '</p>' +
      (q.explain ? '<p class="q-explain">' + ui.esc(q.explain) + '</p>' : '') +
      '<button class="btn primary" id="qNext">' + (last ? '查看成果' : '下一题') + '</button>';
    host.querySelector('#qNext').addEventListener('click', function () {
      prog.index += 1;
      if (prog.index >= prog.order.length) {
        prog.phase = 'done';
        prog.outcome = buildOutcome(task, prog);
        learn.addOutcome(prog.outcome);
        learn.execSet(task.id, freeNameOf(task.id), prog);
        done(host, task, prog);
      } else {
        learn.execSet(task.id, freeNameOf(task.id), prog);
        runQ(host, task, prog, bank() || []);
      }
    });
  }

  function buildOutcome(task, prog) {
    var total = prog.order.length, wrong = prog.wrongs.length;
    var points = [], seen = {};
    prog.wrongs.forEach(function (w) {
      var p = w.chapter || w.stem.slice(0, 10);
      if (!seen[p]) { seen[p] = 1; points.push(p); }
    });
    var prefix = prog.free ? '【自由练习】' : '';
    if (prog.onlyWrong) {
      var right = total - wrong;
      return {
        taskId: task.id, intent: task.intent, tool: 'quiz', free: true, onlyWrong: true,
        summary: '错题重做 ' + total + ' 道，答对 ' + right + ' 道' +
          (wrong ? '，仍有 ' + wrong + ' 道没对：' + points.join('、') : '，全对'),
        meta: { total: total, wrong: wrong, points: points, onlyWrong: true }
      };
    }
    return {
      taskId: task.id, intent: task.intent, tool: 'quiz', free: prog.free || false,
      summary: prefix + '做了 ' + total + ' 题，错 ' + wrong + ' 题' +
        (wrong ? '，错题已入册：' + points.join('、') : '，全对'),
      meta: { total: total, wrong: wrong, points: points, course: prog.course, chapter: prog.chapter }
    };
  }

  function done(host, task, prog) {
    var isF = prog.free || isFree(task.id);
    var onlyW = !!prog.onlyWrong;
    var clean = onlyW && !prog.wrongs.length;
    var cmp = learn.compareText(prog.outcome, learn.previousOutcome(prog.outcome));
    host.innerHTML =
      '<div class="view-inner"><div class="card exec">' +
      '<h2>做完了' + (onlyW ? '（错题重做）' : (isF ? '（自由练习）' : '')) + '</h2>' +
      ui.outcomeCard(prog.outcome) +
      '<p class="cmp">↳ ' + cmp + '</p>' +
      '<div class="exec-ops"><button class="btn primary" id="qDone">完成，回' + backName(prog) + '</button>' +
      '<button class="btn" id="qAgain">再做一组</button>' +
      (clean ? '<button class="btn good" id="qCleanWb">这批已拿下，移出错题本</button>' : '') +
      '</div></div></div>';
    host.querySelector('#qDone').addEventListener('click', function () {
      if (!isF && task.id) St.completeTask(task.id, true);
      learn.execClear(task.id, freeNameOf(task.id));
      global.StudyHub.app.navigate(backOf(prog));
    });
    host.querySelector('#qAgain').addEventListener('click', function () {
      learn.execClear(task.id, freeNameOf(task.id));
      render(host, { taskId: task.id, onlyWrong: onlyW });
    });
    var cleanBtn = host.querySelector('#qCleanWb');
    if (cleanBtn) cleanBtn.addEventListener('click', function () {
      prog.order.forEach(function (qid) { learn.removeWrong(qid); });
      learn.execClear(task.id, freeNameOf(task.id));
      global.StudyHub.app.navigate('review');
    });
  }

  global.StudyHub.views = global.StudyHub.views || {};
  global.StudyHub.views['exec-quiz'] = { render: render };
})(window);
