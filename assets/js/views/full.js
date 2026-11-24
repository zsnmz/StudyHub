/* 全套四级：高频词 SRS、听力/阅读练习、写译键盘作答、26 天计划。 */
(function (global) {
  'use strict';
  var SH = global.StudyHub;
  var D = global.StudyHubData || {};
  var CAT = D.cet4Vocab || { words: [] };
  var RD = D.cet4Reading || { sets: [] };
  var LS = D.cet4Listening || { sets: [] };
  var WR = D.cet4Write || { writing: [], translation: [] };
  var WORDS = (CAT.words || []).slice();
  var BY_ID = {};
  WORDS.forEach(function (w) { BY_ID[w.id] = w; });
  var GAP = [0, 1, 2, 4, 7, 15, 30];
  var TABS = [
    ['home', '今日'], ['vocab', '高频词'], ['listening', '听力'],
    ['reading', '阅读'], ['write', '写译'], ['plan', '计划']
  ];

  var el = null, body = null, st = null, S = null, tab = 'home';
  var session = null, quiz = null, player = null, timer = null, audio = null, draftTimer = null;
  var writeMode = 'writing';

  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function esc(s) { return SH.ui && SH.ui.esc ? SH.ui.esc(s == null ? '' : s) : String(s == null ? '' : s); }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function dk(d) { return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }
  function today() { return dk(new Date()); }
  function addDays(base, n) {
    var d = new Date(base + 'T12:00:00');
    d.setDate(d.getDate() + n);
    return dk(d);
  }
  function settings() { return SH.state.settings(); }
  function daysLeft() {
    var n = 0;
    try { n = SH.state.daysUntil(settings().examDate); } catch (e) { n = 0; }
    return Math.max(0, n);
  }
  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'fu-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2200);
  }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function defaults() {
    return {
      start: today(),
      vocab: { p: {}, log: {} },
      done: { listening: {}, reading: {}, writing: {}, translation: {} },
      answers: {},
      lastTab: 'home'
    };
  }
  function load() {
    var s = st.get('state', null);
    if (!s || !s.vocab || !s.done) { s = defaults(); st.set('state', s); }
    if (!s.vocab.p) s.vocab.p = {};
    if (!s.vocab.log) s.vocab.log = {};
    if (!s.answers || typeof s.answers !== 'object') s.answers = {};
    ['listening', 'reading', 'writing', 'translation'].forEach(function (k) {
      if (!s.done[k]) s.done[k] = {};
    });
    return s;
  }
  function save() { st.set('state', S); }

  function learnedWords() { return WORDS.filter(function (w) { return !!S.vocab.p[w.id]; }); }
  function learnedCount() { return learnedWords().length; }
  function dueWords() {
    var t = today();
    return WORDS.filter(function (w) {
      var p = S.vocab.p[w.id];
      return p && p.next && p.next <= t;
    });
  }
  function newWords(n) {
    var out = [];
    for (var i = 0; i < WORDS.length && out.length < n; i++) {
      if (!S.vocab.p[WORDS[i].id]) out.push(WORDS[i]);
    }
    return out;
  }
  function dailyNew() {
    var left = daysLeft();
    if (left <= 3) return 0;
    var remaining = Math.max(0, WORDS.length - learnedCount());
    if (!remaining) return 0;
    var span = Math.max(4, left - 4);
    return Math.max(10, Math.min(25, Math.ceil(remaining / span)));
  }
  function logFor(d) { return S.vocab.log[d] || { new: [], review: [] }; }
  function todayNewCount() { return logFor(today()).new.length; }
  function todayReviewCount() { return logFor(today()).review.length; }
  function logWord(id, isNew) {
    var d = today();
    var log = S.vocab.log[d] || { new: [], review: [] };
    var arr = isNew ? log.new : log.review;
    if (arr.indexOf(id) < 0) arr.push(id);
    S.vocab.log[d] = log;
  }
  function gradeWord(id, grade) {
    var p = S.vocab.p[id] || { stage: 0, right: 0, wrong: 0 };
    if (grade === 'known') {
      p.stage = Math.min(GAP.length - 1, (p.stage || 0) + 1);
      p.right = (p.right || 0) + 1;
      p.next = addDays(today(), GAP[p.stage]);
    } else if (grade === 'vague') {
      p.stage = Math.max(0, (p.stage || 0) - 1);
      p.wrong = (p.wrong || 0) + 1;
      p.next = addDays(today(), 1);
    } else {
      p.stage = 0;
      p.wrong = (p.wrong || 0) + 1;
      p.next = today();
    }
    p.last = today();
    S.vocab.p[id] = p;
    save();
  }
  function queueVocab() {
    var due = dueWords().slice(0, 20);
    var need = Math.max(0, dailyNew() - todayNewCount());
    return due.concat(newWords(need));
  }
  function doneOn(kind, id) {
    var d = S.done[kind] && S.done[kind][id];
    return !!(d && d.date === today());
  }
  function doneAny(kind) {
    var map = S.done[kind] || {};
    return Object.keys(map).some(function (k) { return map[k] && map[k].date === today(); });
  }
  function nextSet(kind, sets) {
    var map = S.done[kind] || {};
    for (var i = 0; i < sets.length; i++) if (!map[sets[i].id]) return sets[i];
    return sets[0];
  }
  function nextWriteItem() {
    var order = [];
    WR.writing.forEach(function (x) { order.push({ mode: 'writing', item: x }); });
    WR.translation.forEach(function (x) { order.push({ mode: 'translation', item: x }); });
    for (var i = 0; i < order.length; i++) {
      if (!S.done[order[i].mode][order[i].item.id]) return order[i];
    }
    return order[0];
  }
  function sprintSummary() {
    try { return SH.sprint && SH.sprint.summary ? SH.sprint.summary() : null; } catch (e) { return null; }
  }
  function sprintDone() {
    var s = sprintSummary();
    return !!(s && s.total > 0 && s.done >= s.total);
  }
  function todayPercent() {
    var parts = [
      (todayNewCount() >= dailyNew() || (dailyNew() === 0 && dueWords().length === 0)),
      doneAny('listening'), doneAny('reading'), doneAny('writing') || doneAny('translation'), sprintDone()
    ];
    var n = parts.filter(Boolean).length;
    return Math.round(n / parts.length * 100);
  }

  function cleanup() {
    if (timer) { clearInterval(timer); timer = null; }
    if (draftTimer) { clearTimeout(draftTimer); draftTimer = null; }
    if (audio) {
      try { audio.pause(); audio.removeAttribute('src'); audio.load(); } catch (e) {}
      audio = null;
    }
  }

  function heroHTML() {
    var left = daysLeft();
    var pct = todayPercent();
    return '<section class="fu-hero">' +
      '<div class="fu-hero-main">' +
        '<div class="fu-kicker">CET-4 · 全套复习</div>' +
        '<h1>把四级拆成每天能做完的小任务</h1>' +
        '<p>高频词 ' + WORDS.length + ' 个 · 听力 ' + LS.sets.length + ' 套 · 阅读 ' + RD.sets.length +
          ' 篇 · 写译 ' + (WR.writing.length + WR.translation.length) + ' 题 · 冲刺 223 卡</p>' +
        '<div class="fu-hero-actions">' +
          '<button type="button" class="btn primary" data-act="start-daily">开始今日全套</button>' +
          '<button type="button" class="btn" data-go="plan">看 26 天计划</button>' +
        '</div>' +
      '</div>' +
      '<div class="fu-ring"><b>' + left + '</b><span>天后考试</span>' +
        '<div class="fu-ring-bar"><i style="width:' + pct + '%"></i></div>' +
        '<em>今日完成 ' + pct + '%</em></div>' +
    '</section>';
  }
  function tabsHTML() {
    return '<nav class="fu-tabs">' + TABS.map(function (t) {
      return '<button type="button" class="fu-tab' + (t[0] === tab ? ' active' : '') + '" data-go="' + t[0] + '">' + t[1] + '</button>';
    }).join('') + '</nav>';
  }

  function renderShell() {
    cleanup();
    session = null; quiz = null; player = null;
    S.lastTab = tab;
    save();
    el.innerHTML = heroHTML() + tabsHTML() + '<div class="fu-body" id="fu-body"></div>';
    body = qs('#fu-body', el);
    body.addEventListener('click', onBodyClick);
    body.addEventListener('change', onBodyChange);
    body.addEventListener('input', onBodyInput);
    body.addEventListener('keydown', onBodyKey);
    qsa('.fu-tabs [data-go], .fu-hero [data-go]', el).forEach(function (b) {
      b.addEventListener('click', function () { go(b.getAttribute('data-go')); });
    });
    var start = qs('.fu-hero [data-act="start-daily"]', el);
    if (start) start.addEventListener('click', function () {
      if (!queueVocab().length) { toast('今天的词已经完成，去做听力或阅读吧'); return; }
      go('vocab');
      startVocab();
    });
    renderTab();
  }
  function go(name) {
    if (name === 'sprint') { SH.app.navigate('sprint'); return; }
    tab = name;
    session = null; quiz = null; player = null;
    renderShell();
  }
  function renderTab() {
    if (session) return renderSession();
    if (quiz) return renderQuiz();
    if (player) return renderPlayer();
    if (tab === 'home') return renderHome();
    if (tab === 'vocab') return renderVocab();
    if (tab === 'listening') return renderListeningList();
    if (tab === 'reading') return renderReadingList();
    if (tab === 'write') return renderWriteList();
    if (tab === 'plan') return renderPlan();
  }

  /* ---------- 今日 ---------- */
  function renderHome() {
    var left = daysLeft();
    var due = dueWords().length;
    var daily = dailyNew();
    var nv = todayNewCount();
    var nextL = nextSet('listening', LS.sets);
    var nextR = nextSet('reading', RD.sets);
    var nw = nextWriteItem();
    var sp = sprintSummary();
    var vocabDone = (daily === 0 && due === 0) || nv >= daily;
    var tasks = [
      { key: 'vocab', title: '高频词', desc: daily + ' 个新词 · ' + due + ' 个待复习', done: vocabDone, go: 'vocab', btn: '去背词' },
      { key: 'write', title: '写作 / 翻译', desc: nw ? nw.item.title : '暂无', done: doneAny('writing') || doneAny('translation'), go: 'write', btn: '去作答' },
      { key: 'listening', title: '听力短对话', desc: nextL ? nextL.title + ' · ' + nextL.questions.length + ' 题' : '暂无', done: doneAny('listening'), go: 'listening', btn: '去练习' },
      { key: 'reading', title: '仔细阅读', desc: nextR ? nextR.title + ' · ' + nextR.questions.length + ' 题' : '暂无', done: doneAny('reading'), go: 'reading', btn: '去练习' },
      { key: 'sprint', title: '冲刺背诵', desc: sp ? ('今日 ' + sp.done + '/' + sp.total + ' 项') : '作文 / 翻译卡片', done: sprintDone(), go: 'sprint', btn: '去冲刺' }
    ];
    body.innerHTML =
      '<div class="fu-grid">' +
        '<div class="fu-stat"><span>已学词汇</span><b>' + learnedCount() + '</b><em>/ ' + WORDS.length + '</em></div>' +
        '<div class="fu-stat"><span>今日新词</span><b>' + nv + '</b><em>/ ' + daily + '</em></div>' +
        '<div class="fu-stat"><span>待复习</span><b>' + due + '</b><em>个</em></div>' +
        '<div class="fu-stat"><span>距考试</span><b>' + left + '</b><em>天</em></div>' +
      '</div>' +
      '<div class="card fu-card">' +
        '<div class="fu-card-head"><h2>今日任务</h2><span class="muted small">按顺序做，做完一项算一项</span></div>' +
        '<div class="fu-task-list">' + tasks.map(function (t) {
          return '<div class="fu-task' + (t.done ? ' done' : '') + '">' +
            '<div class="fu-check">' + (t.done ? '✓' : '') + '</div>' +
            '<div class="fu-task-main"><b>' + t.title + '</b><span>' + esc(t.desc) + '</span></div>' +
            '<button type="button" class="btn small" data-go="' + t.go + '">' + t.btn + '</button>' +
          '</div>';
        }).join('') + '</div>' +
      '</div>' +
      '<div class="card fu-card">' +
        '<div class="fu-card-head"><h2>怎么用</h2></div>' +
        '<p class="muted small">先背高频词（10 个新词 + 到期复习），再做一套听力或阅读，最后用键盘写一篇作文或翻译。冲刺页的 223 张卡是作文/翻译素材，零碎时间刷。所有进度只存在这个浏览器里。</p>' +
        '<p class="muted small">听力/阅读是按四级题型编写的仿真练习（PDF 资料里没有完整真题原卷）；写译用键盘作答，草稿自动保存，电脑和手机都能用。</p>' +
      '</div>';
  }

  /* ---------- 高频词 ---------- */
  function renderVocab() {
    var due = dueWords().length;
    var mastered = WORDS.filter(function (w) { var p = S.vocab.p[w.id]; return p && p.stage >= 4; }).length;
    body.innerHTML =
      '<div class="fu-grid">' +
        '<div class="fu-stat"><span>已学</span><b>' + learnedCount() + '</b><em>/ ' + WORDS.length + '</em></div>' +
        '<div class="fu-stat"><span>待复习</span><b>' + due + '</b><em>个</em></div>' +
        '<div class="fu-stat"><span>今日新词</span><b>' + todayNewCount() + '</b><em>/ ' + dailyNew() + '</em></div>' +
        '<div class="fu-stat"><span>熟悉</span><b>' + mastered + '</b><em>个</em></div>' +
      '</div>' +
      '<div class="fu-actions">' +
        '<button type="button" class="btn primary" data-act="vocab-start">开始背词</button>' +
        '<button type="button" class="btn" data-act="spell-start">拼写检测</button>' +
        '<button type="button" class="btn" data-act="dict-start">打字检测</button>' +
      '</div>' +
      '<div class="card fu-card">' +
        '<div class="fu-card-head"><h2>196 个高频词</h2><span class="muted small">按真题词频排序</span></div>' +
        '<div class="fu-vtools"><input id="fu-vsearch" class="fu-input" placeholder="搜索单词或中文" autocomplete="off">' +
        '<select id="fu-vfilter" class="fu-input fu-select"><option value="all">全部</option><option value="new">未学</option><option value="learning">学习中</option><option value="mastered">已熟悉</option></select></div>' +
        '<div class="fu-vlist" id="fu-vlist"></div>' +
      '</div>';
    renderVocabList();
  }
  function renderVocabList() {
    var box = qs('#fu-vlist');
    if (!box) return;
    var kw = ((qs('#fu-vsearch') || {}).value || '').trim().toLowerCase();
    var filter = ((qs('#fu-vfilter') || {}).value || 'all');
    var rows = WORDS.filter(function (w) {
      if (kw && (w.w + ' ' + w.zh).toLowerCase().indexOf(kw) < 0) return false;
      var p = S.vocab.p[w.id];
      if (filter === 'new' && p) return false;
      if (filter === 'learning' && (!p || p.stage >= 4)) return false;
      if (filter === 'mastered' && (!p || p.stage < 4)) return false;
      return true;
    });
    if (!rows.length) { box.innerHTML = '<p class="muted small">没有匹配的词。</p>'; return; }
    box.innerHTML = rows.map(function (w) {
      var p = S.vocab.p[w.id];
      var badge = !p ? '未学' : (p.stage >= 4 ? '熟悉' : '学习中');
      return '<div class="fu-vrow">' +
        '<div class="fu-vword"><b>' + esc(w.w) + '</b><span class="fu-freq">词频 ' + w.f + '</span></div>' +
        '<div class="fu-vzh">' + esc(w.zh) + '</div>' +
        '<span class="fu-badge ' + (badge === '熟悉' ? 'ok' : (badge === '未学' ? '' : 'warn')) + '">' + badge + '</span>' +
      '</div>';
    }).join('');
  }

  function startVocab() {
    var q = queueVocab();
    if (!q.length) { toast(dailyNew() === 0 ? '今天以复习为主，暂时没有待背词' : '今天的词已经背完了'); return; }
    session = { queue: q, i: 0, flipped: false, grades: {}, stats: { known: 0, vague: 0, unknown: 0 } };
    renderSession();
  }
  function renderSession() {
    var w = session.queue[session.i];
    var total = session.queue.length;
    var isNew = !S.vocab.p[w.id];
    body.innerHTML =
      '<div class="fu-session">' +
        '<div class="fu-session-top"><button type="button" class="btn small" data-act="session-exit">← 返回</button>' +
          '<span class="muted small">第 ' + (session.i + 1) + ' / ' + total + ' 张 · ' + (isNew ? '新词' : '复习') + '</span></div>' +
        '<div class="fu-flash">' +
          '<div class="fu-flash-word">' + esc(w.w) + '</div>' +
          '<div class="fu-flash-freq">真题词频 ' + w.f + ' 次</div>' +
          (session.flipped
            ? '<div class="fu-flash-zh">' + esc(w.zh) + '</div><div class="fu-flash-note">' + esc(w.note || '') + '</div>'
            : '<button type="button" class="btn primary fu-flip" data-act="session-flip">显示释义</button>') +
        '</div>' +
        (session.flipped
          ? '<div class="fu-grades">' +
              '<button type="button" class="fu-grade ok" data-grade="known"><b>认识</b><span>明天再复习</span></button>' +
              '<button type="button" class="fu-grade warn" data-grade="vague"><b>模糊</b><span>明天再来</span></button>' +
              '<button type="button" class="fu-grade bad" data-grade="unknown"><b>不认识</b><span>今天再背</span></button>' +
            '</div>'
          : '<p class="muted small fu-center">先回忆中文意思，再点“显示释义”。</p>') +
      '</div>';
  }
  function sessionGrade(g) {
    var w = session.queue[session.i];
    var isNew = !S.vocab.p[w.id];
    logWord(w.id, isNew);
    gradeWord(w.id, g);
    session.grades[w.id] = g;
    session.stats[g]++;
    session.i++;
    session.flipped = false;
    if (session.i >= session.queue.length) renderSessionSummary();
    else renderSession();
  }
  function renderSessionSummary() {
    var stt = session.stats;
    var unknown = Object.keys(session.grades).filter(function (id) { return session.grades[id] === 'unknown'; });
    var total = session.queue.length;
    body.innerHTML =
      '<div class="fu-session">' +
        '<div class="fu-result">' +
          '<div class="fu-result-num">' + total + '</div><div class="muted">张卡片完成</div>' +
          '<div class="fu-result-row"><span>认识</span><b>' + stt.known + '</b></div>' +
          '<div class="fu-result-row"><span>模糊</span><b>' + stt.vague + '</b></div>' +
          '<div class="fu-result-row"><span>不认识</span><b>' + stt.unknown + '</b></div>' +
          (unknown.length ? '<p class="muted small">不会的词：' + unknown.map(function (id) { return esc(BY_ID[id].w); }).join('、') + '</p>' : '<p class="muted small">全部认识，明天按遗忘曲线再复习。</p>') +
          '<div class="fu-actions">' +
            (unknown.length ? '<button type="button" class="btn primary" data-act="session-retry">再背不会的</button>' : '') +
            '<button type="button" class="btn" data-act="session-exit">返回词汇页</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function startSpell() {
    var pool = learnedWords();
    if (pool.length < 5) pool = WORDS.slice(0, Math.min(10, WORDS.length));
    if (!pool.length) { toast('还没有可检测的词'); return; }
    quiz = { type: 'spell', queue: shuffle(pool).slice(0, Math.min(10, pool.length)), i: 0, right: 0, wrong: [], answered: false, lastOk: false };
    renderSpell();
  }
  function renderSpell() {
    var w = quiz.queue[quiz.i];
    var total = quiz.queue.length;
    body.innerHTML =
      '<div class="fu-session">' +
        '<div class="fu-session-top"><button type="button" class="btn small" data-act="quiz-exit">← 返回</button>' +
          '<span class="muted small">拼写检测 · 第 ' + (quiz.i + 1) + ' / ' + total + ' 题</span></div>' +
        '<div class="fu-quiz">' +
          '<div class="fu-quiz-zh">' + esc(w.zh) + '</div>' +
          '<p class="muted small">' + esc(w.note || '') + ' · 首字母 ' + esc(w.w.charAt(0)) + ' · ' + w.w.length + ' 个字母</p>' +
          '<input id="fu-spell-input" class="fu-input fu-spell" autocomplete="off" spellcheck="false" placeholder="在这里拼写">' +
          (quiz.answered
            ? '<div class="fu-feedback ' + (quiz.lastOk ? 'ok' : 'bad') + '">' +
                (quiz.lastOk ? '✓ 拼写正确' : '✗ 正确拼写：' + esc(w.w)) + '</div>' +
              '<button type="button" class="btn primary" data-act="spell-next">' + (quiz.i + 1 >= total ? '看结果' : '下一题') + '</button>'
            : '<button type="button" class="btn primary" data-act="spell-check">提交</button>') +
        '</div>' +
      '</div>';
    var input = qs('#fu-spell-input');
    if (input) input.focus();
  }
  function checkSpell() {
    var input = qs('#fu-spell-input');
    if (!input) return;
    var w = quiz.queue[quiz.i];
    var val = (input.value || '').trim().toLowerCase();
    var ok = val === w.w.toLowerCase();
    quiz.answered = true;
    quiz.lastOk = ok;
    if (ok) quiz.right++; else quiz.wrong.push(w.id);
    renderSpell();
  }
  function nextSpell() {
    quiz.i++;
    quiz.answered = false;
    if (quiz.i >= quiz.queue.length) renderSpellSummary();
    else renderSpell();
  }
  function renderSpellSummary() {
    body.innerHTML =
      '<div class="fu-session"><div class="fu-result">' +
        '<div class="fu-result-num">' + quiz.right + '</div><div class="muted">/ ' + quiz.queue.length + ' 题拼写正确</div>' +
        '<p class="muted small">' + (quiz.wrong.length ? '需要再看的词：' + quiz.wrong.map(function (id) { return esc(BY_ID[id].w); }).join('、') : '全对，继续保持。') + '</p>' +
        '<div class="fu-actions"><button type="button" class="btn primary" data-act="spell-start">再来一组</button>' +
        '<button type="button" class="btn" data-act="quiz-exit">返回</button></div>' +
      '</div></div>';
  }

  function normTyped(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9' -]/g, '').replace(/\s+/g, ' ').trim();
  }
  function startDictQuiz() {
    var pool = learnedWords();
    if (pool.length < 4) pool = WORDS.slice(0, Math.min(8, WORDS.length));
    quiz = { type: 'dict', queue: shuffle(pool).slice(0, Math.min(6, pool.length)), i: 0, results: [], answered: false, correct: false, input: '' };
    renderDictQuiz();
  }
  function renderDictQuiz() {
    var w = quiz.queue[quiz.i];
    var total = quiz.queue.length;
    var feedback = '';
    if (quiz.answered) {
      feedback = quiz.correct
        ? '<div class="fu-feedback ok">✓ 正确：<b>' + esc(w.w) + '</b></div>'
        : '<div class="fu-feedback bad">✗ 正确答案：<b>' + esc(w.w) + '</b>' + (quiz.input ? '<br><span class="muted small">你写的是：' + esc(quiz.input) + '</span>' : '') + '</div>';
    }
    body.innerHTML =
      '<div class="fu-session">' +
        '<div class="fu-session-top"><button type="button" class="btn small" data-act="quiz-exit">← 返回</button>' +
          '<span class="muted small">打字检测 · 第 ' + (quiz.i + 1) + ' / ' + total + ' 题</span></div>' +
        '<div class="fu-quiz">' +
          '<div class="fu-quiz-zh">' + esc(w.zh) + '</div>' +
          '<p class="muted small">看中文，用键盘打出英文；回车检查，写不出来可看答案。</p>' +
          '<input id="fu-dict-input" class="fu-input fu-dict-input" type="text" value="' + esc(quiz.input) + '"' +
            (quiz.answered ? ' readonly' : '') + ' autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="在这里输入英文">' +
          feedback +
          '<div class="fu-actions">' +
            (quiz.answered
              ? '<button type="button" class="btn primary" data-act="dict-next">' + (quiz.i + 1 >= total ? '看结果' : '下一题') + '</button>'
              : '<button type="button" class="btn primary" data-act="dict-check">检查</button>' +
                '<button type="button" class="btn" data-act="dict-reveal">看答案</button>') +
          '</div>' +
        '</div>' +
      '</div>';
    if (!quiz.answered) {
      var input = qs('#fu-dict-input');
      if (input) { input.focus(); try { input.setSelectionRange(input.value.length, input.value.length); } catch (e) {} }
    }
  }
  function checkDict() {
    var input = qs('#fu-dict-input');
    if (!input) return;
    var val = String(input.value || '').trim();
    if (!val) { toast('先输入英文再检查'); return; }
    var w = quiz.queue[quiz.i];
    quiz.input = val;
    quiz.answered = true;
    quiz.correct = normTyped(val) === normTyped(w.w);
    quiz.results.push(quiz.correct);
    renderDictQuiz();
  }
  function revealDict() {
    quiz.answered = true;
    quiz.correct = false;
    quiz.results.push(false);
    renderDictQuiz();
  }
  function nextDict() {
    quiz.i++;
    quiz.answered = false;
    quiz.correct = false;
    quiz.input = '';
    if (quiz.i >= quiz.queue.length) renderDictSummary();
    else renderDictQuiz();
  }
  function renderDictSummary() {
    var ok = quiz.results.filter(Boolean).length;
    body.innerHTML =
      '<div class="fu-session"><div class="fu-result">' +
        '<div class="fu-result-num">' + ok + '</div><div class="muted">/ ' + quiz.results.length + ' 个写对</div>' +
        '<p class="muted small">打字检测自动比对答案，重点是把“认得”变成“写得出”。</p>' +
        '<div class="fu-actions"><button type="button" class="btn primary" data-act="dict-start">再来一组</button>' +
        '<button type="button" class="btn" data-act="quiz-exit">返回</button></div>' +
      '</div></div>';
  }

  /* ---------- 听力 ---------- */
  function renderListeningList() {
    body.innerHTML =
      '<div class="card fu-card"><div class="fu-card-head"><h2>听力短对话</h2><span class="muted small">先听，再做题，最后看原文</span></div>' +
      '<div class="fu-paper-list">' + LS.sets.map(function (s) {
        var d = S.done.listening[s.id];
        return '<div class="fu-paper">' +
          '<div><b>' + esc(s.title) + '</b><span class="muted small">' + esc(s.scene) + ' · ' + s.questions.length + ' 题 · 建议 ' + s.minutes + ' 分钟</span></div>' +
          '<div class="fu-paper-right">' + (d ? '<span class="fu-badge ok">' + d.score + '/' + d.total + '</span>' : '<span class="fu-badge">未做</span>') +
          '<button type="button" class="btn small" data-act="listen-start" data-id="' + s.id + '">' + (d ? '再做一次' : '开始') + '</button></div>' +
        '</div>';
      }).join('') + '</div></div>' +
      '<p class="muted small">每套听力是逐句 MP3，可逐句重播、调倍速，不依赖系统语音包；做完题再看原文。</p>';
  }
  function startListening(id) {
    var set = null;
    LS.sets.forEach(function (s) { if (s.id === id) set = s; });
    if (!set) return;
    if (audio) { try { audio.pause(); audio = null; } catch (e) {} }
    player = { kind: 'listening', set: set, answers: {}, submitted: false, score: 0, showScript: false, audioIdx: 0, rate: 1, playing: false };
    renderListeningPlayer();
  }
  function renderListeningPlayer() {
    var s = player.set;
    body.innerHTML =
      '<div class="fu-player">' +
        '<div class="fu-session-top"><button type="button" class="btn small" data-act="player-exit">← 返回</button>' +
          '<span class="muted small">' + esc(s.scene) + ' · 建议 ' + s.minutes + ' 分钟</span></div>' +
        '<h2>' + esc(s.title) + '</h2>' +
        '<div class="fu-tts fu-audio">' +
          '<button type="button" class="btn primary" data-act="audio-toggle">' + (player.playing ? '⏸ 暂停' : '▶ 播放听力') + '</button>' +
          '<button type="button" class="btn small" data-act="audio-prev">上一句</button>' +
          '<button type="button" class="btn small" data-act="audio-next">下一句</button>' +
          '<button type="button" class="btn small" data-act="audio-replay">重播本句</button>' +
          '<button type="button" class="btn small" data-act="audio-stop">停止</button>' +
          '<select id="fu-rate" class="fu-input fu-select">' +
            '<option value="0.75"' + (player.rate === 0.75 ? ' selected' : '') + '>0.75×</option>' +
            '<option value="1"' + (player.rate === 1 ? ' selected' : '') + '>1.0×</option>' +
            '<option value="1.25"' + (player.rate === 1.25 ? ' selected' : '') + '>1.25×</option>' +
            '<option value="1.5"' + (player.rate === 1.5 ? ' selected' : '') + '>1.5×</option>' +
          '</select>' +
          '<span id="fu-audio-pos" class="muted small">第 1 句</span>' +
          '<button type="button" class="btn small" data-act="audio-script">' + (player.showScript ? '隐藏原文' : '显示原文') + '</button>' +
        '</div>' +
        '<div class="fu-audio-track"><i id="fu-audio-bar"></i></div>' +
        '<p class="muted small">逐句 MP3，可倍速、重播；不依赖系统语音包。</p>' +
        (player.showScript ? '<div class="fu-script">' + s.script.map(function (x) {
          return '<p><b>' + esc(x.role) + ':</b> ' + esc(x.text) + '</p>';
        }).join('') + '</div>' : '') +
        '<div class="fu-questions">' + s.questions.map(function (q, i) {
          return '<div class="fu-question"><p><b>' + (i + 1) + '.</b> ' + esc(q.q) + '</p>' +
            q.options.map(function (o, j) {
              return '<label class="fu-option"><input type="radio" name="fu-lq-' + i + '" value="' + j + '"' +
                (player.answers[i] === j ? ' checked' : '') + '> ' + esc(o) + '</label>';
            }).join('') +
            (player.submitted ? '<p class="fu-explain">答案：' + 'ABCD'.charAt(q.answer) + ' · ' + esc(q.explain) + '</p>' : '') +
          '</div>';
        }).join('') + '</div>' +
        (player.submitted
          ? '<div class="fu-feedback ok">得分：' + player.score + ' / ' + s.questions.length + '</div>' +
            '<div class="fu-actions"><button type="button" class="btn primary" data-act="listen-start" data-id="' + s.id + '">再做一次</button>' +
            '<button type="button" class="btn" data-act="player-exit">返回列表</button></div>'
          : '<button type="button" class="btn primary" data-act="listen-submit">提交答案</button>') +
      '</div>';
    audioPos();
  }
  function submitListening() {
    var s = player.set;
    var right = 0;
    s.questions.forEach(function (q, i) {
      var checked = qs('input[name="fu-lq-' + i + '"]:checked');
      player.answers[i] = checked ? Number(checked.value) : -1;
      if (player.answers[i] === q.answer) right++;
    });
    player.score = right;
    player.submitted = true;
    S.done.listening[s.id] = { score: right, total: s.questions.length, date: today() };
    save();
    renderListeningPlayer();
  }

  /* ---------- 阅读 ---------- */
  function renderReadingList() {
    body.innerHTML =
      '<div class="card fu-card"><div class="fu-card-head"><h2>仔细阅读</h2><span class="muted small">每篇 5 题，建议 8 分钟</span></div>' +
      '<div class="fu-paper-list">' + RD.sets.map(function (s) {
        var d = S.done.reading[s.id];
        return '<div class="fu-paper">' +
          '<div><b>' + esc(s.title) + '</b><span class="muted small">' + esc(s.topic) + ' · ' + s.questions.length + ' 题</span></div>' +
          '<div class="fu-paper-right">' + (d ? '<span class="fu-badge ok">' + d.score + '/' + d.total + '</span>' : '<span class="fu-badge">未做</span>') +
          '<button type="button" class="btn small" data-act="read-start" data-id="' + s.id + '">' + (d ? '再做一次' : '开始') + '</button></div>' +
        '</div>';
      }).join('') + '</div></div>';
  }
  function startReading(id) {
    var set = null;
    RD.sets.forEach(function (s) { if (s.id === id) set = s; });
    if (!set) return;
    player = { kind: 'reading', set: set, answers: {}, submitted: false, score: 0 };
    renderReadingPlayer();
  }
  function renderReadingPlayer() {
    var s = player.set;
    body.innerHTML =
      '<div class="fu-player">' +
        '<div class="fu-session-top"><button type="button" class="btn small" data-act="player-exit">← 返回</button>' +
          '<span class="muted small">' + esc(s.topic) + ' · 建议 ' + s.minutes + ' 分钟</span></div>' +
        '<h2>' + esc(s.title) + '</h2>' +
        '<div class="fu-passage">' + s.passage.split('\n\n').map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>' +
        '<div class="fu-questions">' + s.questions.map(function (q, i) {
          return '<div class="fu-question"><p><b>' + (i + 1) + '.</b> ' + esc(q.q) + '</p>' +
            q.options.map(function (o, j) {
              return '<label class="fu-option"><input type="radio" name="fu-rq-' + i + '" value="' + j + '"' +
                (player.answers[i] === j ? ' checked' : '') + '> ' + esc(o) + '</label>';
            }).join('') +
            (player.submitted ? '<p class="fu-explain">答案：' + 'ABCD'.charAt(q.answer) + ' · ' + esc(q.explain) + '</p>' : '') +
          '</div>';
        }).join('') + '</div>' +
        (player.submitted
          ? '<div class="fu-feedback ok">得分：' + player.score + ' / ' + s.questions.length + '</div>' +
            '<div class="fu-actions"><button type="button" class="btn primary" data-act="read-start" data-id="' + s.id + '">再做一次</button>' +
            '<button type="button" class="btn" data-act="player-exit">返回列表</button></div>'
          : '<button type="button" class="btn primary" data-act="read-submit">提交答案</button>') +
      '</div>';
  }
  function submitReading() {
    var s = player.set;
    var right = 0;
    s.questions.forEach(function (q, i) {
      var checked = qs('input[name="fu-rq-' + i + '"]:checked');
      player.answers[i] = checked ? Number(checked.value) : -1;
      if (player.answers[i] === q.answer) right++;
    });
    player.score = right;
    player.submitted = true;
    S.done.reading[s.id] = { score: right, total: s.questions.length, date: today() };
    save();
    renderReadingPlayer();
  }

  /* ---------- 写译 ---------- */
  function renderWriteList() {
    var list = writeMode === 'writing' ? WR.writing : WR.translation;
    body.innerHTML =
      '<div class="fu-wtabs">' +
        '<button type="button" class="fu-wtab' + (writeMode === 'writing' ? ' active' : '') + '" data-act="write-mode" data-mode="writing">写作 ' + WR.writing.length + '</button>' +
        '<button type="button" class="fu-wtab' + (writeMode === 'translation' ? ' active' : '') + '" data-act="write-mode" data-mode="translation">翻译 ' + WR.translation.length + '</button>' +
      '</div>' +
      '<div class="fu-paper-list">' + list.map(function (x) {
        var d = S.done[writeMode][x.id];
        return '<div class="fu-paper">' +
          '<div><b>' + esc(x.title) + '</b><span class="muted small">' + esc(writeMode === 'writing' ? x.type : x.topic) + ' · 建议 ' + x.minutes + ' 分钟</span></div>' +
          '<div class="fu-paper-right">' + (d ? '<span class="fu-badge ok">' + d.score + ' 分</span>' : '<span class="fu-badge">未写</span>') +
          '<button type="button" class="btn small" data-act="write-start" data-mode="' + writeMode + '" data-id="' + x.id + '">' + (d ? '再写一次' : '开始作答') + '</button></div>' +
        '</div>';
      }).join('') + '</div>' +
      '<p class="muted small">用键盘作答，计时结束再看范文；自评分按四级 15 分制，作答文本会保存。</p>';
  }
  function findWrite(mode, id) {
    var arr = mode === 'writing' ? WR.writing : WR.translation;
    for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i];
    return null;
  }
  function startWrite(mode, id) {
    var item = findWrite(mode, id);
    if (!item) return;
    cleanup();
    var rec = S.done[mode][id];
    var key = mode + ':' + id;
    var text = (rec && rec.text) || S.answers[key] || '';
    player = { kind: 'write', mode: mode, item: item, revealed: false, remain: item.minutes * 60, started: false, text: text };
    renderWritePlayer();
  }
  function fmt(sec) {
    sec = Math.max(0, sec);
    return p2(Math.floor(sec / 60)) + ':' + p2(sec % 60);
  }
  function countText(s) {
    var t = String(s || '').trim();
    if (!t) return '0 词 · 0 字符';
    var words = t.split(/\s+/).filter(Boolean).length;
    return words + ' 词 · ' + t.length + ' 字符';
  }
  function renderWritePlayer() {
    var x = player.item;
    var isW = player.mode === 'writing';
    body.innerHTML =
      '<div class="fu-player fu-write">' +
        '<div class="fu-session-top"><button type="button" class="btn small" data-act="player-exit">← 返回</button>' +
          '<span class="muted small">' + (isW ? '写作' : '翻译') + ' · 建议 ' + x.minutes + ' 分钟</span></div>' +
        '<h2>' + esc(x.title) + '</h2>' +
        '<div class="fu-prompt">' + (isW ? esc(x.direction) : '<p class="muted small">把下面这段中文翻译成英文：</p><p>' + esc(x.zh) + '</p>') + '</div>' +
        '<div class="fu-timerbar"><b id="fu-timer">' + fmt(player.remain) + '</b>' +
          '<button type="button" class="btn small" data-act="timer-start">开始计时</button>' +
          '<button type="button" class="btn small" data-act="timer-pause">暂停</button>' +
          '<button type="button" class="btn small" data-act="timer-reset">重置</button>' +
        '</div>' +
        '<label class="fu-answer-label" for="fu-answer">' + (isW ? '你的作文' : '你的译文') + '（键盘输入，自动保存草稿）</label>' +
        '<textarea id="fu-answer" class="fu-input fu-textarea fu-answer" rows="10" spellcheck="false" placeholder="' + (isW ? '在这里输入英文作文…' : '在这里输入英文译文…') + '">' + esc(player.text) + '</textarea>' +
        '<div class="fu-answer-meta"><span id="fu-answer-count">' + countText(player.text) + '</span><span class="muted small">电脑 / 手机键盘均可输入</span></div>' +
        '<div class="fu-actions fu-write-actions">' +
          '<label class="fu-score-inline">自评 <input id="fu-score" class="fu-input fu-score-input" type="number" min="0" max="15" step="1" value="' + (S.done[player.mode][x.id] ? S.done[player.mode][x.id].score : '') + '"> 分</label>' +
          '<button type="button" class="btn" data-act="write-reveal">' + (isW ? '看范文' : '看参考译文') + '</button>' +
          '<button type="button" class="btn primary" data-act="write-save">保存并完成</button>' +
        '</div>' +
        '<p class="muted small">对照范文和关键点给自己打分（0–15），再点保存；作答文本会一起存进进度。</p>' +
        '<div class="fu-model" id="fu-model" hidden><h3>' + (isW ? '范文' : '参考译文') + '</h3><p>' + esc(x.model).replace(/\n/g, '<br>') + '</p>' +
          '<h3>关键点</h3><ul>' + (x.tips || []).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>' +
      '</div>';
    }
  function timerTick() {
    if (!player || player.kind !== 'write') return;
    player.remain--;
    var out = qs('#fu-timer');
    if (out) out.textContent = fmt(player.remain);
    if (player.remain <= 0) {
      clearInterval(timer); timer = null;
      toast('时间到，先停笔看范文，再自评。');
    }
  }
  function startTimer() {
    if (timer) return;
    timer = setInterval(timerTick, 1000);
  }
  function pauseTimer() { if (timer) { clearInterval(timer); timer = null; } }
  function resetTimer() { pauseTimer(); if (player) { player.remain = player.item.minutes * 60; var o = qs('#fu-timer'); if (o) o.textContent = fmt(player.remain); } }
  function saveWrite() {
    var input = qs('#fu-score');
    var score = input ? Number(input.value) : NaN;
    if (isNaN(score) || score < 0 || score > 15) { toast('自评分请填 0–15'); return; }
    var text = ((qs('#fu-answer') || {}).value || '').trim();
    if (!text) { toast('先输入作答内容'); return; }
    var key = player.mode + ':' + player.item.id;
    S.done[player.mode][player.item.id] = {
      score: score,
      date: today(),
      text: text,
      words: text.split(/\s+/).filter(Boolean).length
    };
    delete S.answers[key];
    save();
    pauseTimer();
    cleanup();
    toast('已保存：' + player.item.title);
    player = null;
    renderWriteList();
  }

  /* ---------- 计划 ---------- */
  function renderPlan() {
    var left = daysLeft();
    var phases = [
      { name: '基础期', range: '第 1–10 天', desc: '每天 10 个新词 + 1 套听力/阅读交替 + 1 篇写译', cls: 'blue' },
      { name: '强化期', range: '第 11–20 天', desc: '新词减半、错词优先；听力阅读二刷，写译换题型', cls: 'orange' },
      { name: '冲刺期', range: '最后 6 天', desc: '只复习到期词和错题；每天 1 套限时写译 + 冲刺卡', cls: 'red' }
    ];
    var rows = [];
    for (var i = 0; i < left; i++) {
      var date = addDays(today(), i);
      var phase = i < 10 ? '基础' : (i < 20 ? '强化' : '冲刺');
      var vocab = i < left - 3 ? (i < 10 ? '10 新词' : '复习 20 词') : '只复习';
      var lset = LS.sets[i % Math.max(1, LS.sets.length)];
      var rset = RD.sets[i % Math.max(1, RD.sets.length)];
      var witem = i % 2 ? WR.writing[(Math.floor(i / 2)) % Math.max(1, WR.writing.length)] : WR.translation[(Math.floor(i / 2)) % Math.max(1, WR.translation.length)];
      rows.push('<tr' + (i === 0 ? ' class="today"' : '') + '><td>' + date.slice(5) + '</td><td>' + phase + '</td><td>' + vocab +
        '</td><td>' + esc(lset ? lset.title : '—') + '</td><td>' + esc(rset ? rset.title : '—') +
        '</td><td>' + esc(witem ? witem.title : '—') + '</td><td>10 卡</td></tr>');
    }
    body.innerHTML =
      '<div class="fu-phases">' + phases.map(function (p) {
        return '<div class="fu-phase ' + p.cls + '"><b>' + p.name + '</b><span>' + p.range + '</span><p>' + p.desc + '</p></div>';
      }).join('') + '</div>' +
      '<div class="card fu-card"><div class="fu-card-head"><h2>到考试前的逐日安排</h2><span class="muted small">按完成情况顺延，不必死卡日期</span></div>' +
      '<div class="fu-table-wrap"><table class="fu-table"><thead><tr><th>日期</th><th>阶段</th><th>词汇</th><th>听力</th><th>阅读</th><th>写译</th><th>冲刺</th></tr></thead><tbody>' +
      (rows.length ? rows.join('') : '<tr><td colspan="7">考试日期已过，请在设置里修改。</td></tr>') +
      '</tbody></table></div><p class="muted small" style="margin:8px 0 0">12 月 19 日考试；最后 3 天只复习，不再开新词。表里按“建议内容”轮换，没做完的顺延到第二天。</p></div>' +
      '<div class="card fu-card"><div class="fu-card-head"><h2>数据</h2></div>' +
      '<p class="muted small">全套进度和冲刺进度都保存在本机浏览器。换浏览器或清理网站数据会丢失。</p>' +
      '<button type="button" class="btn danger" data-act="reset-all">清空全套进度</button></div>';
  }

  /* ---------- 事件 ---------- */
  function onBodyClick(e) {
    var goBtn = e.target.closest('[data-go]');
    if (goBtn) { go(goBtn.getAttribute('data-go')); return; }
    var gradeBtn = e.target.closest('[data-grade]');
    if (gradeBtn && session) { sessionGrade(gradeBtn.getAttribute('data-grade')); return; }
    var btn = e.target.closest('[data-act]');
    if (!btn) return;
    var act = btn.getAttribute('data-act');
    if (act === 'start-daily') {
      if (!queueVocab().length) { toast('今天的词已经完成，去做听力或阅读吧'); return; }
      go('vocab');
      startVocab();
      return;
    }
    if (act === 'vocab-start') { if (!session) startVocab(); return; }
    if (act === 'session-flip') { session.flipped = true; renderSession(); return; }
    if (act === 'session-exit') { session = null; renderVocab(); return; }
    if (act === 'session-retry') {
      var ids = Object.keys(session.grades).filter(function (id) { return session.grades[id] === 'unknown'; });
      var q = ids.map(function (id) { return BY_ID[id]; });
      session = { queue: q, i: 0, flipped: false, grades: {}, stats: { known: 0, vague: 0, unknown: 0 } };
      renderSession(); return;
    }
    if (act === 'spell-start') { startSpell(); return; }
    if (act === 'spell-check') { checkSpell(); return; }
    if (act === 'spell-next') { nextSpell(); return; }
    if (act === 'dict-start') { startDictQuiz(); return; }
    if (act === 'dict-check') { checkDict(); return; }
    if (act === 'dict-reveal') { revealDict(); return; }
    if (act === 'dict-next') { nextDict(); return; }
    if (act === 'quiz-exit') { quiz = null; renderVocab(); return; }
    if (act === 'listen-start') { startListening(btn.getAttribute('data-id')); return; }
    if (act === 'listen-submit') { submitListening(); return; }
    if (act === 'read-start') { startReading(btn.getAttribute('data-id')); return; }
    if (act === 'read-submit') { submitReading(); return; }
    if (act === 'player-exit') { player = null; cleanup(); if (tab === 'listening') renderListeningList(); else if (tab === 'reading') renderReadingList(); else renderWriteList(); return; }
    if (act === 'audio-toggle') { toggleAudio(); return; }
    if (act === 'audio-prev') { prevAudio(); return; }
    if (act === 'audio-next') { nextAudio(); return; }
    if (act === 'audio-replay') { replayAudio(); return; }
    if (act === 'audio-stop') { stopAudio(); return; }
    if (act === 'audio-script') { player.showScript = !player.showScript; renderListeningPlayer(); return; }
    if (act === 'write-mode') { writeMode = btn.getAttribute('data-mode'); renderWriteList(); return; }
    if (act === 'write-start') { startWrite(btn.getAttribute('data-mode'), btn.getAttribute('data-id')); return; }
    if (act === 'write-reveal') { var m = qs('#fu-model'); if (m) m.hidden = !m.hidden; return; }
    if (act === 'write-save') { saveWrite(); return; }
    if (act === 'timer-start') { startTimer(); return; }
    if (act === 'timer-pause') { pauseTimer(); return; }
    if (act === 'timer-reset') { resetTimer(); return; }
    if (act === 'reset-all') {
      if (!global.confirm('确定清空全套进度？冲刺页的进度不会受影响。')) return;
      S = defaults(); st.set('state', S); session = null; quiz = null; player = null; renderShell(); return;
    }
  }
  function onBodyChange(e) {
    var m = /^fu-(l|r)q-(\d+)$/.exec(e.target.name || '');
    if (m && player && (player.kind === 'listening' || player.kind === 'reading')) {
      player.answers[Number(m[2])] = Number(e.target.value);
    }
    if (e.target.id === 'fu-vfilter') renderVocabList();
    if (e.target.id === 'fu-rate' && player && player.kind === 'listening') {
      setAudioRate(e.target.value);
    }
  }
  function onBodyInput(e) {
    if (e.target.id === 'fu-vsearch') renderVocabList();
    if (e.target.id === 'fu-dict-input' && quiz && quiz.type === 'dict') {
      quiz.input = e.target.value;
    }
    if (e.target.id === 'fu-answer' && player && player.kind === 'write') {
      player.text = e.target.value;
      var count = qs('#fu-answer-count');
      if (count) count.textContent = countText(player.text);
      if (draftTimer) clearTimeout(draftTimer);
      draftTimer = setTimeout(function () {
        if (player && player.kind === 'write') {
          S.answers[player.mode + ':' + player.item.id] = player.text;
          save();
        }
      }, 350);
    }
  }
  function onBodyKey(e) {
    if (e.target.id === 'fu-spell-input' && e.key === 'Enter' && !quiz.answered) { e.preventDefault(); checkSpell(); }
    if (e.target.id === 'fu-dict-input' && e.key === 'Enter') {
      e.preventDefault();
      if (quiz && quiz.answered) nextDict(); else checkDict();
    }
  }

  /* ---------- 听力音频（逐句 MP3，跨浏览器） ---------- */
  function audioLines() {
    if (!player || !player.set) return [];
    var lib = (global.StudyHubData && global.StudyHubData.cet4ListeningAudio) || {};
    var sets = lib.sets || {};
    return sets[player.set.id] || [];
  }
  function audioPos() {
    if (!player || player.kind !== 'listening') return;
    var lines = audioLines();
    var pos = qs('#fu-audio-pos');
    if (pos) pos.textContent = lines.length ? ('第 ' + (player.audioIdx + 1) + ' / ' + lines.length + ' 句') : '音频未生成';
    var btn = qs('[data-act="audio-toggle"]');
    if (btn) btn.textContent = player.playing ? '⏸ 暂停' : '▶ 播放听力';
    var bar = qs('#fu-audio-bar');
    if (bar) bar.style.width = lines.length ? Math.round((player.audioIdx + 1) / lines.length * 100) + '%' : '0%';
  }
  function ensureAudio() {
    if (!audio) {
      audio = document.getElementById('fu-audio-el');
      if (!audio) {
        audio = document.createElement('audio');
        audio.id = 'fu-audio-el';
        audio.preload = 'auto';
        audio.style.display = 'none';
        document.body.appendChild(audio);
      }
      audio.addEventListener('ended', function () {
        if (!player || player.kind !== 'listening') return;
        var lines = audioLines();
        if (player.audioIdx + 1 < lines.length) {
          player.audioIdx++;
          playAudio();
        } else {
          player.playing = false;
          audioPos();
        }
      });
    }
    return audio;
  }
  function playAudio() {
    if (!player || player.kind !== 'listening') return;
    var lines = audioLines();
    if (!lines.length) { toast('这组听力还没有生成音频，可以先看原文'); return; }
    if (player.audioIdx < 0) player.audioIdx = 0;
    if (player.audioIdx >= lines.length) player.audioIdx = lines.length - 1;
    var a = ensureAudio();
    a.src = lines[player.audioIdx];
    a.currentTime = 0;
    a.playbackRate = player.rate || 1;
    player.playing = true;
    audioPos();
    var p = a.play();
    if (p && p.catch) {
      p.catch(function () {
        player.playing = false;
        audioPos();
        toast('浏览器阻止了自动播放，请再点一次“播放听力”');
      });
    }
  }
  function toggleAudio() {
    if (!player || player.kind !== 'listening') return;
    if (player.playing) {
      if (audio) audio.pause();
      player.playing = false;
      audioPos();
      return;
    }
    if (audio && audio.src && audio.paused && audio.currentTime > 0 &&
        audio.currentTime < (audio.duration || Infinity)) {
      var p = audio.play();
      player.playing = true;
      audioPos();
      if (p && p.catch) p.catch(function () { player.playing = false; audioPos(); });
      return;
    }
    playAudio();
  }
  function stopAudio(render) {
    if (audio) {
      try { audio.pause(); audio.currentTime = 0; } catch (e) {}
    }
    if (player) { player.playing = false; player.audioIdx = 0; }
    if (render !== false) renderListeningPlayer();
  }
  function prevAudio() {
    if (!player) return;
    player.audioIdx = Math.max(0, player.audioIdx - 1);
    if (player.playing) playAudio(); else audioPos();
  }
  function nextAudio() {
    if (!player) return;
    var lines = audioLines();
    player.audioIdx = Math.min(lines.length - 1, player.audioIdx + 1);
    if (player.playing) playAudio(); else audioPos();
  }
  function replayAudio() {
    if (player) playAudio();
  }
  function setAudioRate(v) {
    if (!player) return;
    player.rate = Number(v) || 1;
    if (audio) audio.playbackRate = player.rate;
  }

  global.StudyHub.views.full = {
    render: function (host, payload) {
      el = host;
      st = SH.store.ns('full');
      S = load();
      tab = (payload && payload.tab) || S.lastTab || 'home';
      if (!TABS.some(function (t) { return t[0] === tab; })) tab = 'home';
      renderShell();
    },
    destroy: function () {
      cleanup();
      session = null; quiz = null; player = null;
      el = null; body = null;
    }
  };
})(window);