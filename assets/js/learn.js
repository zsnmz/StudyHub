/* 学习数据层 · 词卡间隔队列 / 错题本 / 掌握度 / 成果 / 执行器进度，统一走 store */
(function (global) {
  'use strict';
  var store = global.StudyHub.store, St = global.StudyHub.state;
  function ns() { return store.ns(store.profile()); }

  /* ---------- 词卡：认识 → 1/3/7 天逐级拉长；模糊/不认识 → 明天重现 ---------- */
  /* level 1→1 天、2→3 天、3→7 天（封顶） */
  var GAP = [1, 1, 3, 7];
  function wordState() { return ns().get('wordState', {}) || {}; }
  function markWord(w, grade) {
    var all = wordState(), today = St.dateKey();
    var cur = all[w] || { level: 0, next: '' };
    if (grade === 'known') {
      cur.level = Math.min(cur.level + 1, 3);
      cur.next = St.addDays(today, GAP[cur.level]);
    } else { /* vague / unknown 都明天重现，不认识清级 */
      if (grade === 'unknown') cur.level = 0;
      cur.next = St.addDays(today, 1);
    }
    all[w] = cur;
    ns().set('wordState', all);
    return cur.next;
  }
  /* 今日队列：到期复习词 + 新词补足 n 个（state 里没有记录的算新词） */
  function wordQueue(words, n) {
    var today = St.dateKey(), st = wordState();
    var due = [], fresh = [];
    (words || []).forEach(function (x) {
      if (!x || !x.w) return;
      var s = st[x.w];
      if (s && s.next && s.next <= today) due.push(x);
      else if (!s) fresh.push(x);
    });
    return { due: due, fresh: fresh.slice(0, n || 0) };
  }

  /* ---------- 错题本：同题再错 times+1（复现） ---------- */
  function wrongbook() { return ns().get('wrongbook', []) || []; }
  function addWrong(q) {
    var l = wrongbook(), today = St.dateKey();
    for (var i = 0; i < l.length; i++) {
      if (l[i].qid === q.id) {
        l[i].times += 1; l[i].lastWrong = today;
        ns().set('wrongbook', l);
        return l[i];
      }
    }
    var item = {
      qid: q.id, stem: q.stem, course: q.course || '', chapter: q.chapter || '',
      times: 1, lastWrong: today
    };
    l.push(item);
    ns().set('wrongbook', l);
    return item;
  }
  function removeWrong(qid) {
    ns().set('wrongbook', wrongbook().filter(function (x) { return x.qid !== qid; }));
  }

  /* ---------- 掌握度：每次变化记一条 log，供复盘算周变化 ---------- */
  function mastery() { return ns().get('mastery', {}) || {}; }
  function masteryKey(course, chapter) { return (course || '') + '::' + (chapter || ''); }
  function setMastery(course, chapter, level) {
    var all = mastery(), k = masteryKey(course, chapter), today = St.dateKey();
    var cur = all[k] || { level: null, log: [] };
    if (cur.level === level) return;
    cur.level = level;
    cur.log.push({ date: today, level: level });
    if (cur.log.length > 60) cur.log = cur.log.slice(-60);
    all[k] = cur;
    ns().set('mastery', all);
  }
  /* 本周有变化的章节：[{course, chapter, from, to}]，涨了为正、掉了为负 */
  function masteryChanges() {
    var ws = St.weekStart(), all = mastery(), out = [];
    Object.keys(all).forEach(function (k) {
      var log = all[k].log || [];
      if (!log.length) return;
      var base = null, touched = false;
      log.forEach(function (e) {
        if (e.date < ws) base = e.level;
        else { touched = true; if (base === null) base = e.level; }
      });
      var to = all[k].level;
      if (touched && base !== null && to !== null && base !== to) {
        var p = k.split('::');
        out.push({ course: p[0], chapter: p[1], from: base, to: to });
      }
    });
    return out;
  }

  /* ---------- 成果：任务完成时留下的东西，供复盘统计 ---------- */
  function outcomes() { return ns().get('outcomes', []) || []; }
  function addOutcome(o) {
    var l = outcomes();
    o.id = 'o' + Date.now();
    o.date = o.date || St.dateKey();
    l.push(o);
    if (l.length > 300) l = l.slice(-300);
    ns().set('outcomes', l);
    return o;
  }
  function updateOutcome(id, patch) {
    var l = outcomes();
    for (var i = 0; i < l.length; i++) {
      if (l[i].id === id) { for (var k in patch) l[i][k] = patch[k]; ns().set('outcomes', l); return l[i]; }
    }
    return null;
  }
  function outcomesBetween(from, to) {
    return outcomes().filter(function (o) { return o.date >= from && o.date <= to; });
  }

  /* ---------- 章节口径归一化：把「第3章」换成课程大纲里的真实章节名 ---------- */
  /* 数据里的章节名是「栈和队列」这类名字，解析器给的是「第3章」，不换会抽不到题 */
  var CN_NUM = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10 };
  function resolveChapter(course, chapter) {
    var cs = (global.StudyHubData && global.StudyHubData.courses) || [];
    var co = null, i;
    for (i = 0; i < cs.length; i++) if (!course || cs[i].title === course) { co = cs[i]; break; }
    if (!co) return { course: course || '', chapter: chapter || '' };
    if (!chapter) return { course: co.title, chapter: '' };
    var m = String(chapter).match(/第\s*([0-9一二三四五六七八九十]+)\s*章/);
    if (!m) return { course: co.title, chapter: chapter };
    var n = /^[0-9]+$/.test(m[1]) ? +m[1] : (CN_NUM[m[1]] || 0);
    if (!n || !co.chapters || n > co.chapters.length) return { course: co.title, chapter: chapter };
    return { course: co.title, chapter: co.chapters[n - 1].title };
  }

  /* ---------- 执行器进度：退出保留，再进接着来 ---------- */
  /* taskId 有值 → 按任务 id；自由练习 → 执行器名 + 日期，同一天不重叠、跨天自动全新 */
  function execKey(taskId, freeName) {
    if (taskId) return 'exec.' + taskId;
    return 'exec.free.' + (freeName || 'unknown') + '.' + St.dateKey();
  }
  function execGet(taskId, freeName) { return ns().get(execKey(taskId, freeName), null); }
  function execSet(taskId, freeName, data) { ns().set(execKey(taskId, freeName), data); }
  function execClear(taskId, freeName) { ns().remove(execKey(taskId, freeName)); }

  /* ---------- 累积统计 ---------- */
  /* 词汇：已掌握（level ≥ 3 且有下一次）、总词数、到期复习 */
  function wordProgress(words) {
    var total = (words || []).length, st = wordState(), today = St.dateKey();
    var mastered = 0, due = 0, pending = 0;
    Object.keys(st).forEach(function (w) {
      if (st[w].level >= 3) mastered++;
      if (st[w].next && st[w].next <= today) due++;
      pending++;
    });
    return { total: total, mastered: mastered, due: due, pending: pending, rate: total ? Math.round(mastered / total * 100) : 0 };
  }
  /* 错题：已掌握移除数、总数、复现的（times ≥ 2） */
  function wrongProgress() {
    var l = wrongbook();
    var byCourse = {};
    l.forEach(function (w) {
      var c = w.course || '未分类';
      byCourse[c] = (byCourse[c] || 0) + 1;
    });
    return { total: l.length, removed: 0, repeated: l.filter(function (w) { return w.times >= 2; }).length, byCourse: byCourse };
  }
  /* 章节掌握度分布：返回 16 章 [{course, chapter, level, touchedDays}] */
  function masteryGrid(courses) {
    var out = [];
    (courses || []).forEach(function (co) {
      (co.chapters || []).forEach(function (ch) {
        var k = co.title + '::' + ch.title;
        var m = mastery()[k] || { level: null, log: [] };
        var last = null;
        if (m.log && m.log.length) last = m.log[m.log.length - 1].date;
        out.push({ course: co.title, chapter: ch.title, level: m.level, last: last });
      });
    });
    return out;
  }

  /* ---------- 对比：上一次同类成果（产出"比上次/比上周"一行） ---------- */
  /* 找到同 tool、相近 type 的上一条，计算对比 */
  function previousOutcome(o) {
    var l = outcomes();
    for (var i = 0; i < l.length; i++) {
      if (l[i].id === o.id) continue;
      if (l[i].tool === o.tool && (!o.taskId || l[i].taskId === o.taskId)) return l[i];
    }
    return null;
  }
  function compareText(curOut, prevOut) {
    if (!prevOut) return '第一次记录，下周就能比。';
    var cur = curOut.meta || {}, prev = prevOut.meta || {};
    var deltaDay = (function () {
      var d = new Date(); var a = new Date(prevOut.date);
      return Math.round((d - a) / 86400000);
    })();
    if (curOut.tool === 'wordcard') {
      var knownC = cur.known || 0, knownP = prev.known || 0;
      if (cur.dueCount !== undefined && prev.dueCount !== undefined) {
        return knownC > knownP
          ? '上次 ' + prevOut.date + '（' + deltaDay + ' 天前）认识 ' + knownP + ' 个，这次 ' + knownC + ' 个，+' + (knownC - knownP) + ' 个。'
          : '上次认识 ' + knownP + ' 个，这次 ' + knownC + ' 个。';
      }
    }
    if (curOut.tool === 'quiz') {
      var wrC = cur.wrong || 0, wrP = prev.wrong || 0;
      return (wrC < wrP
        ? '上次 ' + prevOut.date + '（' + deltaDay + ' 天前）错 ' + wrP + ' 道，这次 ' + wrC + ' 道，少错了。'
        : '上次错 ' + wrP + ' 道，这次 ' + wrC + ' 道。');
    }
    if (curOut.tool === 'chapter') {
      if (cur.from !== undefined && cur.to !== undefined && cur.from !== null) {
        return '上次回填 ' + cur.from + '/5，这次 ' + cur.to + '/5。';
      }
    }
    if (curOut.tool === 'timer') {
      if (cur.minutes !== undefined && prev.minutes !== undefined) {
        var d = cur.minutes - prev.minutes;
        return '上次专注 ' + prev.minutes + ' 分钟，这次 ' + cur.minutes + ' 分钟。';
      }
    }
    return '上次 ' + prevOut.date + '（' + deltaDay + ' 天前）有过同类记录。';
  }

  /* ---------- 提醒规则引擎 ---------- */
  /* 今日到期词 N 个、今日到期错题（wrongbook 里 lastWrong ≤ 7 天）N 个 */
  function dueReminders(words) {
    var q = wordQueue(words, 0);
    var seven = St.addDays(St.dateKey(), -7);
    var stale = wrongbook().filter(function (w) { return w.lastWrong && w.lastWrong <= seven; }).length;
    return { wordDue: q.due.length, staleWrong: stale };
  }
  /* 冷落章节：距上次触碰 ≥3 天且掌握度 ≤3 */
  function coldChapters() {
    var all = mastery(), out = [];
    var three = St.addDays(St.dateKey(), -3);
    Object.keys(all).forEach(function (k) {
      var m = all[k];
      if (!m || m.level === null || m.level > 3) return;
      var last = (m.log && m.log.length) ? m.log[m.log.length - 1].date : null;
      if (last && last <= three) {
        var p = k.split('::');
        out.push({ course: p[0], chapter: p[1], level: m.level, days: Math.round((new Date() - new Date(last)) / 86400000) });
      }
    });
    return out.sort(function (a, b) { return b.days - a.days; });
  }
  /* 自适应配额：昨天错题 ≥3 或到期词 >40 → 今日新词减半 */
  function adaptiveNewCap(words, wordsConfig) {
    var y = St.addDays(St.dateKey(), -1);
    var yWrong = wrongbook().filter(function (w) { return w.lastWrong === y; }).length;
    var due = wordQueue(words, 0).due.length;
    var reason = '';
    if (yWrong >= 3) reason = '昨天错题 ' + yWrong + ' 道，';
    else if (due > 40) reason = '今天到期复习词 ' + due + ' 个，';
    var base = (wordsConfig && wordsConfig.base) || 20;
    var halve = reason && (wordsConfig && wordsConfig.adaptive !== false);
    return halve ? { cap: Math.max(5, Math.round(base / 2)), reason: reason + '今天先复习' }
                 : { cap: base, reason: '' };
  }
  /* 节奏建议：按小时落 sessions，数据够两周才算 */
  function rhythm() {
    var sessions = St.sessions();
    var byDay = {};
    sessions.forEach(function (s) {
      if (!s.date) return;
      byDay[s.date] = (byDay[s.date] || 0) + (+s.minutes || 0);
    });
    var days = Object.keys(byDay).sort();
    if (days.length < 14) return { enough: false, msg: '记录还不到两周，暂时不说。' };
    /* 每小时平均分钟 */
    var sum = 0; days.forEach(function (d) { sum += byDay[d]; });
    var avg = Math.round(sum / days.length);
    /* 哪几天完成：分钟 ≥ 1/2 总量的天 */
    return { enough: true, avgDaily: avg, totalDays: days.length,
      msg: '最近 ' + days.length + ' 天平均每天 ' + avg + ' 分钟。' };
  }

  /* ---------- 日终小结 ---------- */
  function endOfDay() {
    var t = St.dateKey();
    var tasks = St.tasks();
    var done = tasks.filter(function (x) { return (x.repeat === 'daily' ? x.lastDoneDate === t : x.status === 'done'); });
    var sessions = St.sessions().filter(function (s) { return s.date === t; });
    var minutes = sessions.reduce(function (a, s) { return a + (+s.minutes || 0); }, 0);
    var outcomes = outcomesBetween(t, t);
    /* 明天预计：未完成 + 到期词 */
    var tomorrow = St.addDays(t, 1);
    var plan = tasks.filter(function (x) {
      if (x.status === 'done' && x.plannedDate <= t && x.repeat !== 'daily') return false;
      if (x.repeat === 'daily') return true;
      return x.plannedDate >= t && x.plannedDate <= tomorrow;
    });
    var words = (global.StudyHubData && global.StudyHubData.words) || [];
    var wc = wordQueue(words, 0);
    return {
      doneCount: done.length, minutes: Math.round(minutes),
      outcomeCount: outcomes.length,
      tomorrow: { taskCount: plan.length, wordDue: wc.due.length }
    };
  }

  global.StudyHub.learn = {
    wordState: wordState, markWord: markWord, wordQueue: wordQueue,
    wrongbook: wrongbook, addWrong: addWrong, removeWrong: removeWrong,
    mastery: mastery, setMastery: setMastery, masteryChanges: masteryChanges,
    outcomes: outcomes, addOutcome: addOutcome, updateOutcome: updateOutcome, outcomesBetween: outcomesBetween,
    resolveChapter: resolveChapter,
    execGet: execGet, execSet: execSet, execClear: execClear,
    /* v0.4 新增 */
    wordProgress: wordProgress, wrongProgress: wrongProgress, masteryGrid: masteryGrid,
    previousOutcome: previousOutcome, compareText: compareText,
    dueReminders: dueReminders, coldChapters: coldChapters,
    adaptiveNewCap: adaptiveNewCap, rhythm: rhythm,
    endOfDay: endOfDay
  };
})(window);
