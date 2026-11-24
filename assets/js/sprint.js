/* 冲刺 · 背诵计划 / 闪卡 / 检测 / 错题本
   数据按当前备考方向（四级/六级）取；进度存在 store 的 sprint 键下，和原有任务互不干扰。 */
(function (global) {
  'use strict';
  var St = global.StudyHub.state;
  var ui = global.StudyHub.ui;
  var store = global.StudyHub.store;
  var TRACK = (global.StudyHub.tracks && global.StudyHub.tracks.current()) || { id: 'cet4', name: '四级', label: 'CET-4', data: { items: [] } };
  var TRACK_ID = TRACK.id;
  var TRACK_NAME = TRACK.name;
  var TRACK_LABEL = TRACK.label;
  var STATE_KEY = TRACK_ID === 'cet4' ? 'sprint' : 'sprint.' + TRACK_ID;
  var CAT = TRACK.data;
  var ITEMS = (CAT && CAT.items) || [];
  var MAP = {};
  ITEMS.forEach(function (it) { MAP[it.id] = it; });

  var STAGE_DAYS = [0, 1, 2, 4, 7, 15, 30];
  var TYPE_NAME = {
    pattern: '句型', template: '模板', word: '词块', vocab: '词汇', phrase: '短语'
  };
  var SECTION_NAME = { writing: '作文', translation: '翻译' };

  function ns() { return store.ns(store.profile()); }
  function today() { return St.dateKey(); }
  function addDays(d, n) { return St.addDays(d, n); }
  function examDate() {
    var s = St.settings();
    return s.targetDate || s.examDate || '2026-12-19';
  }
  function daysLeft() { return St.daysUntil(examDate()); }
  function diffDays(a, b) {
    var pa = a.split('-'), pb = b.split('-');
    var x = new Date(+pa[0], +pa[1] - 1, +pa[2]);
    var y = new Date(+pb[0], +pb[1] - 1, +pb[2]);
    return Math.round((y - x) / 86400000);
  }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function pct(n, d) { return d <= 0 ? 0 : clamp(Math.round(n / d * 100), 0, 100); }

  /* ---------- 状态 ---------- */
  function defaults() {
    return {
      start: today(), dailyNew: 0, direction: 'zh2en',
      progress: {}, log: {}, wrong: [], history: []
    };
  }
  var state = ns().get(STATE_KEY, null);
  if (!state || typeof state !== 'object') state = defaults();
  if (!state.progress || typeof state.progress !== 'object') state.progress = {};
  if (!state.log || typeof state.log !== 'object') state.log = {};
  if (!Array.isArray(state.wrong)) state.wrong = [];
  if (!Array.isArray(state.history)) state.history = [];
  if (!state.start) state.start = today();
  if (!state.direction) state.direction = 'zh2en';
  function save() { ns().set(STATE_KEY, state); }
  save();

  function progress(id) { return state.progress[id] || null; }
  function isLearned(id) { var p = progress(id); return !!(p && p.seen); }
  function isMastered(id) { var p = progress(id); return !!(p && p.stage >= 4); }
  function isDue(id) {
    var p = progress(id);
    return !!(p && p.stage > 0 && p.due && p.due <= today());
  }
  function logToday() {
    var d = today();
    if (!state.log[d]) state.log[d] = { new: [], review: [], quiz: { total: 0, right: 0 } };
    if (!Array.isArray(state.log[d].new)) state.log[d].new = [];
    if (!Array.isArray(state.log[d].review)) state.log[d].review = [];
    if (!state.log[d].quiz) state.log[d].quiz = { total: 0, right: 0 };
    return state.log[d];
  }

  /* ---------- 队列与计划 ---------- */
  function typeRank(it) {
    if (it.track === 'writing') return it.type === 'pattern' ? 0 : (it.type === 'template' ? 1 : 2);
    return it.type === 'pattern' ? 0 : (it.type === 'vocab' ? 1 : 2);
  }
  function nextNew(track, n) {
    return ITEMS.filter(function (it) {
      return it.track === track && !isLearned(it.id);
    }).sort(function (a, b) {
      return (typeRank(a) - typeRank(b)) || (a.seq - b.seq);
    }).slice(0, n);
  }
  function dueQueue(limit) {
    var list = ITEMS.filter(function (it) { return isDue(it.id); });
    list.sort(function (a, b) {
      var pa = progress(a.id), pb = progress(b.id);
      return String(pa.due).localeCompare(String(pb.due)) || (a.seq - b.seq);
    });
    return limit ? list.slice(0, limit) : list;
  }
  function autoDaily() {
    var left = Math.max(1, daysLeft() - 3);
    var remain = ITEMS.filter(function (it) { return !isLearned(it.id); }).length;
    return clamp(Math.ceil(remain / left), 6, 12);
  }
  function dailyTarget() { return state.dailyNew ? clamp(+state.dailyNew, 4, 16) : autoDaily(); }
  function plan() {
    var left = daysLeft();
    var reviewOnly = left <= 3;
    var wNew = [], tNew = [];
    if (!reviewOnly && left > 0) {
      var target = Math.max(0, dailyTarget() - logToday().new.length);
      var wRemain = ITEMS.filter(function (it) { return it.track === 'writing' && !isLearned(it.id); }).length;
      var tRemain = ITEMS.filter(function (it) { return it.track === 'translation' && !isLearned(it.id); }).length;
      var wN = 0;
      if (wRemain > 0 && tRemain > 0) {
        wN = clamp(Math.round(target * wRemain / (wRemain + tRemain)), 1, target - 1);
      } else if (wRemain > 0) {
        wN = target;
      }
      wNew = nextNew('writing', wN);
      var tN = target - wNew.length;
      tNew = nextNew('translation', Math.max(0, tN));
      var short = target - wNew.length - tNew.length;
      if (short > 0) {
        if (wRemain > wNew.length) wNew = wNew.concat(nextNew('writing', short).filter(function (x) {
          return wNew.indexOf(x) === -1;
        }).slice(0, short));
        else if (tRemain > tNew.length) tNew = tNew.concat(nextNew('translation', short).filter(function (x) {
          return tNew.indexOf(x) === -1;
        }).slice(0, short));
      }
    }
    var due = dueQueue(40);
    return { left: left, reviewOnly: reviewOnly, wNew: wNew, tNew: tNew, due: due, dueAll: dueQueue(0) };
  }
  function todayDone() {
    var lg = logToday();
    var newDone = lg.new.length;
    /* 新卡当天「不会→重背」也会写进 review，不重复算成额外任务 */
    var reviewDone = lg.review.filter(function (id) { return lg.new.indexOf(id) === -1; }).length;
    var quizDone = lg.quiz.total > 0 ? 1 : 0;
    return { newDone: newDone, reviewDone: reviewDone, quizDone: quizDone };
  }
  function todayStats() {
    var p = plan(), d = todayDone();
    var newTarget = d.newDone + p.wNew.length + p.tNew.length;
    var reviewTarget = d.reviewDone + p.due.length;
    var total = newTarget + reviewTarget + 1;
    var done = d.newDone + d.reviewDone + d.quizDone;
    return {
      plan: p, done: d, newTarget: newTarget, reviewTarget: reviewTarget,
      total: total, finished: Math.min(done, total), percent: pct(done, total)
    };
  }

  /* ---------- 评分与记录 ---------- */
  function addWrong(id) { if (state.wrong.indexOf(id) === -1) state.wrong.push(id); }
  function removeWrong(id) { state.wrong = state.wrong.filter(function (x) { return x !== id; }); }
  function gradeItem(id, grade, isReview) {
    var p = progress(id) || { stage: 0, due: '', seen: 0, right: 0, wrong: 0, last: '' };
    p.seen = (p.seen || 0) + 1;
    p.last = today();
    if (grade === 0) {
      p.stage = 0;
      p.wrong = (p.wrong || 0) + 1;
      p.due = addDays(today(), 1);
      addWrong(id);
    } else if (grade === 1) {
      if (p.stage < 1) p.stage = 1;
      p.due = addDays(today(), 1);
    } else {
      p.stage = clamp((p.stage || 0) + 1, 1, 6);
      p.right = (p.right || 0) + 1;
      p.due = addDays(today(), STAGE_DAYS[p.stage]);
      removeWrong(id);
    }
    state.progress[id] = p;
    var lg = logToday();
    var bucket = isReview ? lg.review : lg.new;
    if (bucket.indexOf(id) === -1) bucket.push(id);
    save();
  }
  function recordQuiz(total, right) {
    var lg = logToday();
    lg.quiz.total += total;
    lg.quiz.right += right;
    state.history.unshift({ date: today(), total: total, right: right });
    state.history = state.history.slice(0, 20);
    save();
  }

  /* ---------- 题组生成 ---------- */
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function optionsFrom(item, field) {
    var pool = ITEMS.filter(function (x) {
      return x.id !== item.id && x[field] && x.track === item.track;
    });
    var sameType = pool.filter(function (x) { return x.type === item.type; });
    if (sameType.length >= 3) pool = sameType;
    shuffle(pool);
    var opts = [item[field]], seen = {};
    seen[String(item[field])] = 1;
    for (var i = 0; i < pool.length && opts.length < 4; i++) {
      var v = pool[i][field];
      if (!v || seen[String(v)]) continue;
      seen[String(v)] = 1;
      opts.push(v);
    }
    return opts;
  }
  function makeQuestion(item) {
    if (item.type === 'template') {
      var names = ITEMS.filter(function (x) { return x.type === 'template'; }).map(function (x) { return x.name; });
      shuffle(names);
      var opts0 = [item.name];
      names.forEach(function (n) { if (n !== item.name && opts0.length < 4 && opts0.indexOf(n) === -1) opts0.push(n); });
      shuffle(opts0);
      return {
        id: item.id, prompt: '「' + item.scene + '」最适合用哪个模板？',
        options: opts0, answer: opts0.indexOf(item.name),
        explain: item.name + '：' + (item.frames && item.frames[0] ? item.frames[0] : '')
      };
    }
    var zh2en = Math.random() < 0.65;
    var field = zh2en ? 'en' : 'zh';
    var ask = zh2en ? item.zh : item.en;
    var opts = optionsFrom(item, field);
    var correct = item[field];
    shuffle(opts);
    return {
      id: item.id,
      prompt: '「' + ask + '」' + (zh2en ? '的英文表达是？' : '的意思是？'),
      options: opts, answer: opts.indexOf(correct),
      explain: item.en + ' — ' + item.zh + (item.note ? '（' + item.note + '）' : '')
    };
  }
  function buildQuiz(count, mode) {
    var pool = [];
    if (mode === 'wrong') {
      pool = state.wrong.map(function (id) { return MAP[id]; }).filter(Boolean);
    } else if (mode === 'today') {
      pool = Object.keys(state.progress).filter(function (id) {
        return state.progress[id].last === today();
      }).map(function (id) { return MAP[id]; }).filter(Boolean);
    } else {
      pool = ITEMS.filter(function (it) { return isLearned(it.id); });
    }
    /* 不用没背过的卡来「检测」：题量随已学内容增长 */
    if (mode !== 'wrong' && pool.length < 6) {
      pool = ITEMS.filter(function (it) { return isLearned(it.id); });
    }
    if (!pool.length) return [];
    var picked = pool.length <= count ? shuffle(pool.slice()) : shuffle(pool.slice()).slice(0, count);
    return picked.map(makeQuestion).filter(function (q) { return q.answer >= 0; });
  }
  function quizCount() {
    return Math.min(10, ITEMS.filter(function (it) { return isLearned(it.id); }).length);
  }

  /* ---------- 小组件 ---------- */
  function badge(it) {
    var p = progress(it.id);
    if (!p || !p.seen) return '<span class="sp-dot sp-dot-new">未学</span>';
    if (p.stage >= 4) return '<span class="sp-dot sp-dot-ok">已掌握</span>';
    if (p.stage === 0) return '<span class="sp-dot sp-dot-warn">待巩固</span>';
    return '<span class="sp-dot sp-dot-mid">复习中</span>';
  }
  function hotBadge(it) { return it.hot ? '<span class="sp-hot">高频</span>' : ''; }
  function typeLabel(it) { return SECTION_NAME[it.track] + ' · ' + (TYPE_NAME[it.type] || '内容'); }
  function titleOf(it) {
    if (it.type === 'template') return it.name;
    return it.en || it.zh;
  }
  function subOf(it) {
    if (it.type === 'template') return it.scene;
    return it.en && it.zh ? it.zh : '';
  }
  function itemBody(it) {
    if (it.type === 'template') {
      return '<div class="sp-body-block"><b>结构</b><ol>' + (it.structure || []).map(function (s) {
        return '<li>' + ui.esc(s) + '</li>';
      }).join('') + '</ol></div>' +
        '<div class="sp-body-block"><b>可套用句</b>' + (it.frames || []).map(function (s) {
          return '<p class="sp-frame">' + ui.esc(s) + '</p>';
        }).join('') + '</div>' +
        (it.note ? '<p class="sp-note">' + ui.esc(it.note) + '</p>' : '');
    }
    return '<p class="sp-en">' + ui.esc(it.en) + '</p>' +
      '<p class="sp-zh">' + ui.esc(it.zh) + '</p>' +
      (it.note ? '<p class="sp-note">' + ui.esc(it.note) + '</p>' : '') +
      (it.example ? '<p class="sp-ex">例：' + ui.esc(it.example) + '</p>' : '');
  }
  function itemCard(it) {
    return '<details class="sp-item"><summary>' +
      '<div class="sp-item-main"><div class="sp-item-title">' + ui.esc(titleOf(it)) + '</div>' +
      '<div class="sp-item-sub">' + ui.esc(subOf(it)) + '</div></div>' +
      '<div class="sp-item-meta">' + hotBadge(it) + badge(it) + '</div>' +
      '</summary><div class="sp-item-body">' + itemBody(it) + '</div></details>';
  }
  function bar(value, total, cls) {
    return '<div class="sp-bar ' + (cls || '') + '"><span style="width:' + pct(value, total) + '%"></span></div>';
  }

  /* ---------- 主视图 ---------- */
  var uiTab = 'writing';
  var subTab = { writing: 'pattern', translation: 'vocab' };
  var topicFilter = { writing: '', translation: '' };
  var recListener = null, recHost = null;

  function render(host) {
    if (!CAT || !ITEMS.length) {
      host.innerHTML = '<div class="card"><h2>' + TRACK_NAME + '冲刺</h2><p class="muted">内容库未加载。</p></div>';
      return;
    }
    recHost = host;
    paint(host);
  }

  function paint(host) {
    detachKeys();
    var left = daysLeft();
    var ts = todayStats();
    var exam = examDate();
    var dayNo = Math.max(1, diffDays(state.start, today()) + 1);
    var examPassed = left < 0;
    var heroPct = ts.percent;

    var html = '<div class="view-inner sp-wrap">' +
      '<div class="sp-hero">' +
        '<div class="sp-hero-main">' +
          '<span class="sp-kicker">' + TRACK_NAME + '冲刺 · ' + TRACK_LABEL + '</span>' +
          '<h2>' + (examPassed ? '目标日期已过' : (left === 0 ? '今天就是目标日' : '距目标 <b>' + left + '</b> 天')) + '</h2>' +
          '<p>' + (examPassed ? '可以回看错题和模板，做复盘。' :
            ('计划第 ' + dayNo + ' 天 · 目标日 ' + exam + ' · ' +
              (ts.plan.reviewOnly ? '最后冲刺：只复习，不背新卡' : '今日新卡 ' + (ts.plan.wNew.length + ts.plan.tNew.length) + ' 张'))) + '</p>' +
          '<div class="sp-hero-actions">' +
            (ts.plan.reviewOnly
              ? '<button class="btn primary" data-act="recite-all"' + (ts.plan.due.length ? '' : ' disabled') + '>' +
                (ts.plan.due.length ? '复习到期卡 ' + ts.plan.due.length + ' 张' : '今天没有待复习') + '</button>'
              : '<button class="btn primary" data-act="recite-all">开始今日背诵</button>') +
            '<button class="btn" data-act="quiz"' + (quizCount() ? '' : ' disabled title="先背几张卡"') + '>' +
            (quizCount() ? quizCount() + ' 题检测' : '检测') + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="sp-ring" style="--pct:' + heroPct + '"><div><b>' + heroPct + '%</b><span>今日完成</span></div></div>' +
      '</div>' +
      '<div class="sp-tabs">' +
        tabBtn('writing', '作文') + tabBtn('translation', '翻译') +
        tabBtn('test', '检测') + tabBtn('progress', '进度') +
      '</div>';

    if (uiTab === 'writing') html += browsePane('writing');
    else if (uiTab === 'translation') html += browsePane('translation');
    else if (uiTab === 'test') html += testPane();
    else html += progressPane();
    html += '</div>';
    host.innerHTML = html;
    bind(host);
    if (uiTab !== 'today') window.scrollTo(0, 0);
  }

  function tabBtn(key, label) {
    return '<button class="sp-tab' + (uiTab === key ? ' active' : '') + '" data-tab="' + key + '">' + label + '</button>';
  }

  /* ---------- 今日 ---------- */
  function todayPane(ts) {
    var d = ts.done, p = ts.plan;
    var quizPct = d.quizDone ? pct(logToday().quiz.right, Math.max(1, logToday().quiz.total)) : 0;
    var tasks = [
      { act: 'recite-writing', num: p.wNew.length, label: '作文新卡', sub: p.reviewOnly ? '最后冲刺不背新卡' : '句型 / 模板 / 词块', done: !p.reviewOnly && p.wNew.length === 0, off: p.reviewOnly, offText: '只复习' },
      { act: 'recite-translation', num: p.tNew.length, label: '翻译新卡', sub: p.reviewOnly ? '最后冲刺不背新卡' : '句型 / 高频词 / 短语', done: !p.reviewOnly && p.tNew.length === 0, off: p.reviewOnly, offText: '只复习' },
      { act: 'recite-due', num: p.due.length, label: '到期复习', sub: p.dueAll.length > p.due.length ? '今天先清 ' + p.due.length + ' 张，共 ' + p.dueAll.length + ' 张' : '按遗忘曲线自动排', done: p.due.length === 0 },
      { act: 'quiz', num: d.quizDone ? '✓' : (quizCount() || '—'), label: '今日检测', sub: d.quizDone ? '正确率 ' + quizPct + '%' : (quizCount() ? '混合选择，查漏补缺' : '先背几张卡再来'), done: !!d.quizDone, off: !d.quizDone && !quizCount(), offText: '先背卡' }
    ];
    return '<div class="sp-task-grid">' + tasks.map(function (t) {
      var locked = t.done || t.off;
      var label = t.done ? (t.act === 'quiz' ? '再测一次' : '已完成') : (t.off ? (t.offText || '已关闭') : '开始');
      return '<div class="sp-task' + (locked ? ' done' : '') + '">' +
        '<div class="sp-task-num">' + t.num + '</div>' +
        '<b>' + t.label + '</b><span>' + t.sub + '</span>' +
        '<button class="btn small' + (locked ? '' : ' primary') + '" data-act="' + t.act + '"' +
        (t.off || (t.done && t.act !== 'quiz') ? ' disabled' : '') + '>' + label + '</button></div>';
    }).join('') + '</div>' +

    '<div class="card sp-card">' +
      '<div class="sp-card-head"><h2>今日完成度</h2><span class="muted">' + ts.finished + ' / ' + ts.total + ' 项</span></div>' +
      bar(ts.finished, ts.total, 'big') +
      '<div class="sp-mini-stats">' +
        '<span>新背 <b>' + d.newDone + '</b></span>' +
        '<span>复习 <b>' + d.reviewDone + '</b></span>' +
        '<span>待复习 <b>' + p.due.length + '</b></span>' +
        '<span>已掌握 <b>' + ITEMS.filter(function (it) { return isMastered(it.id); }).length + '</b></span>' +
      '</div>' +
      '<p class="sp-tip">' + ui.esc((CAT.tips && CAT.tips[0]) || '') + '</p>' +
    '</div>' +

    '<div class="card sp-card">' +
      '<div class="sp-card-head"><h2>急救速览</h2><span class="muted">考前反复滚这几页</span></div>' +
      '<div class="sp-quick">' +
        '<button class="sp-quick-btn" data-act="quick-writing">作文模板 9 套<span>开头 / 主体 / 结尾</span></button>' +
        '<button class="sp-quick-btn" data-act="quick-translation">翻译高频词<span>文化 · 社会 · 科技</span></button>' +
        '<button class="sp-quick-btn" data-act="quick-wrong">错题本<span>' + state.wrong.length + ' 道待清</span></button>' +
      '</div>' +
    '</div>' +

    '<div class="card sp-card">' +
      '<div class="sp-card-head"><h2>最近 7 天</h2><span class="muted">新背 + 复习</span></div>' +
      weekBars() +
    '</div>';
  }

  function weekBars() {
    var days = [], max = 1;
    for (var i = 6; i >= 0; i--) {
      var d = addDays(today(), -i);
      var lg = state.log[d] || { new: [], review: [] };
      var n = (lg.new || []).length + (lg.review || []).length;
      if (n > max) max = n;
      days.push({ d: d, n: n });
    }
    return '<div class="sp-week">' + days.map(function (x) {
      var h = x.n ? Math.max(8, Math.round(x.n / max * 64)) : 3;
      return '<div class="sp-week-col"><div class="sp-week-bar" style="height:' + h + 'px"></div>' +
        '<span>' + (+x.d.split('-')[2]) + '</span><b>' + (x.n || '') + '</b></div>';
    }).join('') + '</div>';
  }

  /* ---------- 作文 / 翻译浏览 ---------- */
  function browsePane(track) {
    var list = ITEMS.filter(function (it) { return it.track === track; });
    var types = track === 'writing' ? ['pattern', 'template', 'word'] : ['vocab', 'phrase', 'pattern'];
    var labels = track === 'writing' ? { pattern: '万能句型', template: '模板', word: '词块' } :
      { vocab: '高频词', phrase: '救命短语', pattern: '句型' };
    var cur = subTab[track];
    var subset = list.filter(function (it) { return it.type === cur; });
    var topics = [];
    if (track === 'translation') {
      subset.forEach(function (it) { if (topics.indexOf(it.topic) === -1) topics.push(it.topic); });
    }
    var tf = topicFilter[track];
    if (tf) subset = subset.filter(function (it) { return it.topic === tf; });
    var learned = subset.filter(function (it) { return isLearned(it.id); }).length;

    return '<div class="sp-subtabs">' + types.map(function (t) {
      return '<button class="sp-subtab' + (cur === t ? ' active' : '') + '" data-sub="' + t + '">' +
        labels[t] + ' <em>' + list.filter(function (x) { return x.type === t; }).length + '</em></button>';
    }).join('') + '</div>' +

    '<div class="sp-list-head">' +
      '<div><b>' + labels[cur] + '</b><span class="muted">已学 ' + learned + ' / ' + subset.length + '</span></div>' +
      '<button class="btn small primary" data-act="recite-sub">背这一组</button>' +
    '</div>' +
    (topics.length ? '<div class="sp-chips">' + chip('', '全部') + topics.map(function (t) { return chip(t, t); }).join('') + '</div>' : '') +
    '<div class="sp-list">' + (subset.length ? subset.map(itemCard).join('') : '<p class="muted">这个分类暂时没有内容。</p>') + '</div>';

    function chip(v, label) {
      return '<button class="sp-chip' + (tf === v ? ' active' : '') + '" data-topic="' + ui.esc(v) + '">' + ui.esc(label) + '</button>';
    }
  }

  /* ---------- 检测 ---------- */
  function testPane() {
    var totalQ = 0, totalR = 0, qn = quizCount();
    state.history.forEach(function (h) { totalQ += h.total; totalR += h.right; });
    var rate = totalQ ? pct(totalR, totalQ) : 0;
    return '<div class="sp-test-hero">' +
      '<div><h2>' + (qn ? qn + ' 题检测' : '检测') + '</h2><p class="muted">选择题为主：中译英、英译中、句型/模板匹配。答完立刻给答案和出处。</p></div>' +
      '<button class="btn primary" data-act="quiz">开始检测</button></div>' +
    '<div class="sp-mini-stats sp-test-stats">' +
      '<span>累计 <b>' + totalQ + '</b> 题</span><span>正确率 <b>' + rate + '%</b></span>' +
      '<span>错题本 <b>' + state.wrong.length + '</b></span>' +
    '</div>' +
    '<div class="sp-quick">' +
      '<button class="sp-quick-btn" data-act="quiz-today">只考今天学过的<span>趁热打铁</span></button>' +
      '<button class="sp-quick-btn" data-act="quiz-wrong">只考错题<span>' + state.wrong.length + ' 道待清</span></button>' +
      '<button class="sp-quick-btn" data-act="quiz">随机 ' + (qn || 10) + ' 题<span>' + (qn ? '覆盖已背内容' : '先背几张再来') + '</span></button>' +
    '</div>' +
    '<div class="card sp-card"><div class="sp-card-head"><h2>错题本</h2><span class="muted">答对自动移出</span></div>' +
      (state.wrong.length ? '<div class="sp-wrong-list">' + state.wrong.slice(0, 12).map(function (id) {
        var it = MAP[id]; if (!it) return '';
        return '<div class="sp-wrong-item"><div><b>' + ui.esc(titleOf(it)) + '</b><span>' + ui.esc(subOf(it)) + '</span></div>' +
          '<button class="btn small" data-act="recite-one" data-id="' + id + '">看一遍</button></div>';
      }).join('') + '</div>' : '<p class="muted">还没有错题。先去做一组检测。</p>') +
    '</div>' +
    '<div class="card sp-card"><div class="sp-card-head"><h2>检测记录</h2><span class="muted">最近 5 次</span></div>' +
      (state.history.length ? '<ul class="plain-list">' + state.history.slice(0, 5).map(function (h) {
        return '<li><span>' + h.date + '</span><b>' + h.right + ' / ' + h.total + ' · ' + pct(h.right, h.total) + '%</b></li>';
      }).join('') + '</ul>' : '<p class="muted">还没有检测记录。</p>') +
    '</div>';
  }

  /* ---------- 进度 ---------- */
  function progressPane() {
    var learned = ITEMS.filter(function (it) { return isLearned(it.id); }).length;
    var mastered = ITEMS.filter(function (it) { return isMastered(it.id); }).length;
    var due = ITEMS.filter(function (it) { return isDue(it.id); }).length;
    var wL = ITEMS.filter(function (it) { return it.track === 'writing' && isLearned(it.id); }).length;
    var tL = ITEMS.filter(function (it) { return it.track === 'translation' && isLearned(it.id); }).length;
    var wAll = ITEMS.filter(function (it) { return it.track === 'writing'; }).length;
    var tAll = ITEMS.filter(function (it) { return it.track === 'translation'; }).length;

    return '<div class="sp-stat-grid">' +
      stat(learned, '已学内容') + stat(mastered, '已掌握') + stat(due, '今天待复习', due ? 'warn' : '') +
      stat(pct(learned, ITEMS.length) + '%', '总覆盖率') +
    '</div>' +

    '<div class="card sp-card">' +
      '<div class="sp-card-head"><h2>两条线</h2><span class="muted">作文 / 翻译</span></div>' +
      '<div class="sp-line"><div class="sp-line-head"><b>作文</b><span>' + wL + ' / ' + wAll + '</span></div>' + bar(wL, wAll) + '</div>' +
      '<div class="sp-line"><div class="sp-line-head"><b>翻译</b><span>' + tL + ' / ' + tAll + '</span></div>' + bar(tL, tAll) + '</div>' +
    '</div>' +

    '<div class="card sp-card">' +
      '<div class="sp-card-head"><h2>冲刺日历</h2><span class="muted">从 ' + state.start + ' 到目标日</span></div>' +
      calendarGrid() +
    '</div>' +

    '<div class="card sp-card"><div class="sp-card-head"><h2>背诵设置</h2><span class="muted">目标日期在学习计划里改</span></div>' +
      '<div class="form-row"><label>每日新卡量</label><select id="spDaily">' +
        '<option value="0"' + (!state.dailyNew ? ' selected' : '') + '>自动（按剩余天数）</option>' +
        [6, 8, 10, 12].map(function (n) {
          return '<option value="' + n + '"' + (+state.dailyNew === n ? ' selected' : '') + '>' + n + ' 张 / 天</option>';
        }).join('') +
      '</select><span class="muted small">当前建议 ' + dailyTarget() + ' 张 / 天</span></div>' +
      '<div class="form-row"><label>背诵方向</label><select id="spDir">' +
        '<option value="zh2en"' + (state.direction === 'zh2en' ? ' selected' : '') + '>中 → 英（推荐，练输出）</option>' +
        '<option value="en2zh"' + (state.direction === 'en2zh' ? ' selected' : '') + '>英 → 中（认词）</option>' +
      '</select></div>' +
      '<div class="row-actions"><button class="btn danger" id="spReset">重置冲刺进度</button></div>' +
      '<p class="muted small">重置只清空冲刺的背诵/检测记录，不影响收件箱、草稿和其他数据。</p>' +
    '</div>' +

    '<div class="card sp-card"><div class="sp-card-head"><h2>使用建议</h2></div><ul class="sp-tips">' +
      (CAT.tips || []).map(function (t) { return '<li>' + ui.esc(t) + '</li>'; }).join('') +
    '</ul><p class="muted small">内容来源：' + ui.esc((CAT.meta && CAT.meta.source) || (TRACK_NAME + '备考资料')) +
    ' · 共 ' + ITEMS.length + ' 条（作文 ' + (CAT.meta ? CAT.meta.writingCount : '') +
    ' / 翻译 ' + (CAT.meta ? CAT.meta.translationCount : '') + '）</p></div>';
  }
  function stat(n, label, cls) {
    return '<div class="sp-stat"><b class="' + (cls || '') + '">' + n + '</b><span>' + label + '</span></div>';
  }
  function calendarGrid() {
    var start = state.start;
    var total = Math.max(1, diffDays(start, examDate()));
    total = Math.min(total, 45);
    var cells = [];
    for (var i = 0; i <= total; i++) {
      var d = addDays(start, i);
      var lg = state.log[d] || {};
      var n = (lg.new || []).length + (lg.review || []).length;
      var cls = n >= 8 ? 'lv3' : (n >= 4 ? 'lv2' : (n > 0 ? 'lv1' : ''));
      cells.push('<div class="sp-cell ' + cls + (d === today() ? ' today' : '') + '"><b>' + (i + 1) + '</b><span>' + (+d.split('-')[2]) + '</span></div>');
    }
    return '<div class="sp-grid26">' + cells.join('') + '</div>';
  }
  /* ---------- 绑定 ---------- */
  function bind(host) {
    host.querySelectorAll('.sp-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        uiTab = btn.getAttribute('data-tab');
        paint(host);
      });
    });
    host.querySelectorAll('.sp-subtab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var track = uiTab;
        subTab[track] = btn.getAttribute('data-sub');
        topicFilter[track] = '';
        paint(host);
      });
    });
    host.querySelectorAll('.sp-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        topicFilter[uiTab] = btn.getAttribute('data-topic');
        paint(host);
      });
    });
    host.querySelectorAll('[data-act]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var act = btn.getAttribute('data-act');
        if (act === 'recite-all') startRecite(host, { mode: 'all' });
        else if (act === 'recite-writing') startRecite(host, { mode: 'writing' });
        else if (act === 'recite-translation') startRecite(host, { mode: 'translation' });
        else if (act === 'recite-due') startRecite(host, { mode: 'due' });
        else if (act === 'recite-sub') startRecite(host, { mode: 'sub' });
        else if (act === 'recite-one') startRecite(host, { mode: 'one', id: btn.getAttribute('data-id') });
        else if (act === 'quiz') startQuiz(host, { mode: 'all' });
        else if (act === 'quiz-today') startQuiz(host, { mode: 'today' });
        else if (act === 'quiz-wrong') startQuiz(host, { mode: 'wrong' });
        else if (act === 'quick-writing') { uiTab = 'writing'; subTab.writing = 'template'; paint(host); }
        else if (act === 'quick-translation') { uiTab = 'translation'; subTab.translation = 'vocab'; paint(host); }
        else if (act === 'quick-wrong') { uiTab = 'test'; paint(host); }
      });
    });
    var dl = host.querySelector('#spDaily');
    if (dl) dl.addEventListener('change', function () {
      state.dailyNew = +dl.value || 0; save(); paint(host);
    });
    var dir = host.querySelector('#spDir');
    if (dir) dir.addEventListener('change', function () {
      state.direction = dir.value === 'en2zh' ? 'en2zh' : 'zh2en'; save(); paint(host);
    });
    var reset = host.querySelector('#spReset');
    if (reset) reset.addEventListener('click', function () {
      if (!confirm('确定重置冲刺进度？背诵、复习、检测和错题记录都会清空。')) return;
      state = defaults(); save(); uiTab = 'writing'; paint(host);
    });
  }

  /* ---------- 闪卡背诵 ---------- */
  function detachKeys() {
    if (recListener) {
      document.removeEventListener('keydown', recListener);
      recListener = null;
    }
  }
  function startRecite(host, opts) {
    var p = plan();
    var queue = [];
    if (opts.mode === 'one') {
      var one = MAP[opts.id];
      if (one) queue = [{ it: one, review: isDue(one.id) }];
    } else if (opts.mode === 'due') {
      queue = p.due.map(function (it) { return { it: it, review: true }; });
    } else if (opts.mode === 'writing') {
      queue = p.wNew.map(function (it) { return { it: it, review: false }; });
    } else if (opts.mode === 'translation') {
      queue = p.tNew.map(function (it) { return { it: it, review: false }; });
    } else if (opts.mode === 'sub') {
      var track = uiTab, type = subTab[track];
      var tf = topicFilter[track];
      queue = ITEMS.filter(function (it) {
        return it.track === track && it.type === type && (!tf || it.topic === tf) && !isLearned(it.id);
      }).slice(0, 12).map(function (it) { return { it: it, review: false }; });
    } else {
      queue = p.due.map(function (it) { return { it: it, review: true }; })
        .concat(p.wNew.map(function (it) { return { it: it, review: false }; }))
        .concat(p.tNew.map(function (it) { return { it: it, review: false }; }));
    }
    if (!queue.length) {
      host.innerHTML = '<div class="view-inner"><div class="card"><h2>这一组已经清空</h2>' +
        '<p class="muted">今天没有待背的卡了。可以做一组检测，或者去「作文 / 翻译」里自由背。</p>' +
        '<div class="row-actions"><button class="btn primary" data-act="quiz">做 ' + (quizCount() || 10) + ' 题检测</button>' +
        '<button class="btn" data-act="back">回到冲刺</button></div></div></div>';
      bindSimple(host);
      return;
    }
    var session = { queue: queue, index: 0, revealed: false, grades: {}, retry: [], retried: false };
    paintCard();

    function paintCard() {
      detachKeys();
      var cur = session.queue[session.index];
      var it = cur.it;
      var total = session.queue.length;
      var front, back;
      if (it.type === 'template') {
        front = '<span class="sp-rec-badge">作文 · 模板</span>' +
          '<h2 class="sp-rec-title">' + ui.esc(it.name) + '</h2>' +
          '<p class="sp-rec-scene">' + ui.esc(it.scene) + '</p>' +
          '<p class="sp-rec-hint">想好三段结构，再翻面。</p>';
        back = '<div class="sp-rec-back-inner">' +
          '<h3>结构</h3><ol>' + (it.structure || []).map(function (s) { return '<li>' + ui.esc(s) + '</li>'; }).join('') + '</ol>' +
          '<h3>可套用句</h3>' + (it.frames || []).map(function (s) { return '<p class="sp-frame">' + ui.esc(s) + '</p>'; }).join('') +
          (it.note ? '<p class="sp-note">' + ui.esc(it.note) + '</p>' : '') + '</div>';
      } else {
        var dir = state.direction;
        var ask = dir === 'zh2en' ? it.zh : it.en;
        var answer = dir === 'zh2en' ? it.en : it.zh;
        front = '<span class="sp-rec-badge">' + typeLabel(it) + (cur.review ? ' · 复习' : ' · 新卡') + '</span>' +
          '<h2 class="sp-rec-title">' + ui.esc(ask) + '</h2>' +
          '<p class="sp-rec-hint">' + (dir === 'zh2en' ? '先在心里说出英文，再翻面核对。' : '先说出中文意思，再翻面。') + '</p>';
        back = '<div class="sp-rec-back-inner">' +
          '<p class="sp-rec-answer">' + ui.esc(answer) + '</p>' +
          (it.note ? '<p class="sp-note">' + ui.esc(it.note) + '</p>' : '') +
          (it.example ? '<p class="sp-ex">例：' + ui.esc(it.example) + '</p>' : '') +
          '<p class="sp-source">' + (it.hot ? '高频考点 · ' : '') + SECTION_NAME[it.track] + ' ' + (TYPE_NAME[it.type] || '') + '</p></div>';
      }

      host.innerHTML = '<div class="view-inner sp-recite">' +
        '<div class="sp-rec-top"><button class="btn small" data-act="back">← 返回</button>' +
          '<span class="muted">' + (session.index + 1) + ' / ' + session.queue.length + (session.retried ? ' · 重背轮' : '') + '</span></div>' +
        '<div class="sp-bar big"><span style="width:' + pct(session.index, session.queue.length) + '%"></span></div>' +
        '<div class="sp-rec-card' + (session.revealed ? ' revealed' : '') + '">' +
          '<div class="sp-rec-front">' + front + '</div>' +
          (session.revealed ? '<div class="sp-rec-back">' + back + '</div>' : '') +
        '</div>' +
        (session.revealed ?
          '<div class="sp-rec-ops">' +
            '<button class="btn bad" data-grade="0">不会 <em>1</em></button>' +
            '<button class="btn mid" data-grade="1">模糊 <em>2</em></button>' +
            '<button class="btn good" data-grade="2">会了 <em>3</em></button>' +
          '</div>' :
          '<div class="sp-rec-ops"><button class="btn primary big-btn" data-act="reveal">显示答案（空格）</button></div>' +
          '<p class="sp-rec-kbd">快捷键：空格翻面 · 1 不会 · 2 模糊 · 3 会了</p>') +
      '</div>';

      host.querySelector('[data-act="back"]').addEventListener('click', backToDash);
      var rev = host.querySelector('[data-act="reveal"]');
      if (rev) rev.addEventListener('click', function () { session.revealed = true; paintCard(); });
      host.querySelectorAll('[data-grade]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          grade(parseInt(btn.getAttribute('data-grade'), 10));
        });
      });
      recListener = function (e) {
        if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
        if (e.code === 'Space' || e.key === ' ') {
          e.preventDefault();
          if (!session.revealed) { session.revealed = true; paintCard(); }
        } else if (session.revealed && (e.key === '1' || e.key === '2' || e.key === '3')) {
          grade(parseInt(e.key, 10) - 1);
        }
      };
      document.addEventListener('keydown', recListener);
    }

    function grade(g) {
      var cur = session.queue[session.index];
      if (!cur) return;
      session.grades[cur.it.id] = g;
      gradeItem(cur.it.id, g, cur.review);
      if (g === 0 && session.retry.indexOf(cur.it.id) === -1) session.retry.push(cur.it.id);
      session.index++;
      session.revealed = false;
      if (session.index >= session.queue.length) {
        if (session.retry.length && !session.retried) {
          session.retried = true;
          session.queue = session.retry.map(function (id) { return { it: MAP[id], review: true }; });
          session.retry = [];
          session.index = 0;
          paintCard();
        } else {
          summary();
        }
      } else {
        paintCard();
      }
    }

    function summary() {
      detachKeys();
      var good = 0, mid = 0, again = 0;
      Object.keys(session.grades).forEach(function (id) {
        var g = session.grades[id];
        if (g === 2) good++; else if (g === 1) mid++; else again++;
      });
      host.innerHTML = '<div class="view-inner"><div class="card sp-result">' +
        '<h2>这一组背完了</h2>' +
        '<p class="muted">' + good + ' 张会了 · ' + mid + ' 张模糊 · ' + again + ' 张不会。' +
        (mid + again > 0 ? '模糊和不会的已排进明天复习。' : '全对，明天按遗忘曲线再复习一次。') + '</p>' +
        '<div class="sp-result-nums">' +
          '<div><b>' + good + '</b><span>会了</span></div>' +
          '<div><b class="warn">' + mid + '</b><span>模糊</span></div>' +
          '<div><b class="bad">' + again + '</b><span>不会</span></div>' +
        '</div>' +
        '<div class="row-actions"><button class="btn primary" data-act="quiz">趁热做 ' + (quizCount() || 10) + ' 题检测</button>' +
        '<button class="btn" data-act="back">回到冲刺</button></div></div></div>';
      host.querySelector('[data-act="quiz"]').addEventListener('click', function () { startQuiz(host, { mode: 'today' }); });
      host.querySelector('[data-act="back"]').addEventListener('click', backToDash);
    }

    function backToDash() {
      detachKeys();
      paint(host);
    }
  }

  /* ---------- 检测 ---------- */
  function startQuiz(host, opts) {
    var want = opts.mode === 'wrong' ? 10 : (quizCount() || 10);
    var qs = buildQuiz(want, opts.mode);
    if (!qs.length) {
      host.innerHTML = '<div class="view-inner"><div class="card"><h2>题库还不够</h2><p class="muted">先去背几张卡，再回来检测。</p>' +
        '<button class="btn" data-act="back">返回</button></div></div>';
      host.querySelector('[data-act="back"]').addEventListener('click', function () { paint(host); });
      return;
    }
    var idx = 0, right = 0, wrongIds = [];
    function paintQ() {
      var q = qs[idx];
      host.innerHTML = '<div class="view-inner sp-quiz">' +
        '<div class="sp-rec-top"><button class="btn small" data-act="back">← 退出</button>' +
          '<span class="muted">第 ' + (idx + 1) + ' / ' + qs.length + ' 题</span></div>' +
        '<div class="sp-bar big"><span style="width:' + pct(idx, qs.length) + '%"></span></div>' +
        '<div class="card sp-q-card"><h2 class="sp-q-prompt">' + ui.esc(q.prompt) + '</h2>' +
          '<div class="sp-q-opts">' + q.options.map(function (o, i) {
            return '<button class="sp-q-opt" data-opt="' + i + '"><b>' + String.fromCharCode(65 + i) + '</b>' + ui.esc(o) + '</button>';
          }).join('') + '</div>' +
          '<div class="sp-q-explain" id="spExplain" hidden></div>' +
          '<div class="sp-q-next"><button class="btn primary" id="spNext" hidden>' + (idx === qs.length - 1 ? '看结果' : '下一题') + '</button></div>' +
        '</div></div>';
      host.querySelector('[data-act="back"]').addEventListener('click', function () { paint(host); });
      var answered = false;
      host.querySelectorAll('.sp-q-opt').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (answered) return;
          answered = true;
          var pick = +btn.getAttribute('data-opt');
          var ok = pick === q.answer;
          if (ok) right++; else wrongIds.push(q.id);
          host.querySelectorAll('.sp-q-opt').forEach(function (b, i) {
            b.disabled = true;
            if (i === q.answer) b.classList.add('right');
            else if (i === pick) b.classList.add('wrong');
          });
          var ex = host.querySelector('#spExplain');
          ex.hidden = false;
          ex.innerHTML = '<b class="' + (ok ? 'judge-ok' : 'judge-no') + '">' + (ok ? '答对了' : '答错了') + '</b>　' + ui.esc(q.explain);
          host.querySelector('#spNext').hidden = false;
        });
      });
      host.querySelector('#spNext').addEventListener('click', function () {
        idx++;
        if (idx >= qs.length) result(); else paintQ();
      });
    }
    function result() {
      qs.forEach(function (q) {
        if (wrongIds.indexOf(q.id) !== -1) addWrong(q.id);
        else removeWrong(q.id);
      });
      recordQuiz(qs.length, right);
      var rate = pct(right, qs.length);
      host.innerHTML = '<div class="view-inner"><div class="card sp-result">' +
        '<h2>检测结果</h2>' +
        '<div class="sp-score ' + (rate >= 80 ? 'ok' : (rate >= 60 ? 'mid' : 'bad')) + '">' + right + '<span> / ' + qs.length + '</span></div>' +
        '<p class="muted">正确率 ' + rate + '%。' + (rate >= 80 ? '这个状态可以进下一组了。' : '错题已进错题本，今天再回看一遍。') + '</p>' +
        (wrongIds.length ? '<div class="sp-result-wrong"><b>这次错的：</b>' + wrongIds.map(function (id) {
          var it = MAP[id];
          return '<span class="sp-wrong-tag">' + ui.esc(it ? titleOf(it) : id) + '</span>';
        }).join('') + '</div>' : '') +
        '<div class="row-actions"><button class="btn primary" data-act="quiz-again">再来一组</button>' +
        '<button class="btn" data-act="quiz-wrong-now">练这次错题</button>' +
        '<button class="btn" data-act="back">回到冲刺</button></div></div></div>';
      host.querySelector('[data-act="quiz-again"]').addEventListener('click', function () { startQuiz(host, { mode: 'all' }); });
      host.querySelector('[data-act="quiz-wrong-now"]').addEventListener('click', function () {
        startQuiz(host, { mode: 'wrong' });
      });
      host.querySelector('[data-act="back"]').addEventListener('click', function () { paint(host); });
    }
    paintQ();
  }

  function bindSimple(host) {
    host.querySelectorAll('[data-act]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var act = btn.getAttribute('data-act');
        if (act === 'quiz') startQuiz(host, { mode: 'all' });
        else paint(host);
      });
    });
  }

  /* 给今日页等外部入口用的一行摘要（只读） */
  function summary() {
    var s = todayStats(), p = s.plan;
    return {
      daysLeft: p.left,
      newTarget: s.newTarget,
      done: s.finished,
      total: s.total,
      percent: s.percent,
      due: p.due.length,
      reviewOnly: p.reviewOnly,
      learned: Object.keys(state.progress).length,
      totalItems: ITEMS.length
    };
  }

  /* 清理键盘监听 */
  function destroy() { detachKeys(); }

  global.StudyHub.views = global.StudyHub.views || {};
  global.StudyHub.views.sprint = { render: render, destroy: destroy };
  global.StudyHub.sprint = { summary: summary };
})(window);