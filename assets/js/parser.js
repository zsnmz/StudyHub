/* 解析器 · 纯本地规则：文本 → 意图 → 待办草稿；不联网、不接大模型 */
(function (global) {
  'use strict';
  var St = global.StudyHub.state;

  /* ---------- 从文本里抽信息 ---------- */
  function extractMinutes(text) {
    var h = text.match(/(\d+(?:\.\d+)?)\s*(?:个)?小时/);
    if (h) return Math.round(+h[1] * 60);
    var m = text.match(/(\d+)\s*分钟/);
    if (m) return +m[1];
    return null;
  }
  /* 返回 {course, chapter, label}；没提课程则 course 为空串 */
  function extractChapter(text) {
    var course = /javaweb|java\s*web/i.test(text) ? 'JavaWeb'
      : /数据结构/.test(text) ? '数据结构' : '';
    var m = text.match(/第\s*([0-9一二三四五六七八九十]+)\s*章/);
    if (m) {
      var chapter = '第' + m[1] + '章';
      return { course: course, chapter: chapter, label: (course ? course + ' ' : '') + chapter };
    }
    /* 没写「第N章」时，按课程大纲的真实章节名直接匹配（如「复习栈和队列」） */
    var cs = (global.StudyHubData && global.StudyHubData.courses) || [];
    for (var i = 0; i < cs.length; i++) {
      if (course && cs[i].title !== course) continue;
      var chs = cs[i].chapters || [];
      for (var j = 0; j < chs.length; j++) {
        var t = chs[j].title || '';
        /* 跳过单字章节名（串/树/图），避免「图书馆」这类误匹配 */
        if (t.length >= 2 && text.indexOf(t) !== -1) {
          return { course: cs[i].title, chapter: t, label: cs[i].title + ' ' + t };
        }
      }
    }
    return null;
  }
  function extractDate(text) {
    var today = St.dateKey();
    if (/后天/.test(text)) return St.addDays(today, 2);
    if (/明天/.test(text)) return St.addDays(today, 1);
    if (/周末|周六/.test(text)) {
      var d = new Date(); var gap = (6 - d.getDay() + 7) % 7;
      return St.addDays(today, gap);
    }
    if (/周日|星期天/.test(text)) {
      var d2 = new Date(); var gap2 = (7 - d2.getDay()) % 7;
      return St.addDays(today, gap2);
    }
    return today; /* 今天 / 今晚 / 默认 */
  }

  /* ---------- 意图匹配：按模板顺序，命中第一个关键词即停 ---------- */
  function matchIntent(text) {
    var lower = text.toLowerCase();
    var list = global.StudyHubData.intents;
    for (var i = 0; i < list.length; i++) {
      var ks = list[i].keywords;
      for (var j = 0; j < ks.length; j++) {
        if (lower.indexOf(ks[j].toLowerCase()) !== -1) return list[i];
      }
    }
    /* 二次兜底：所有意图都没命中，但文本含英语类暗示词 → 强制走 words（背单词） */
    if (/英语|英文|四级|六级|四六级/.test(lower)) {
      for (var k = 0; k < list.length; k++) if (list[k].id === 'words') return list[k];
    }
    return null;
  }

  function fill(tpl, minutes, ch) {
    var title = tpl.title
      .replace(/\{min\|(\d+)\}/g, function (_, d) { return minutes || d; })
      .replace(/\{chapter\|([^}]*)\}/g, ch ? ch.label : '$1');
    return {
      title: title,
      minutes: minutes && /\{min/.test(tpl.title) ? minutes : tpl.minutes
    };
  }

  /* 按意图生成草稿待办（供命中后或用户点候选按钮时调用）；章节信息随待办带走 */
  function buildFromIntent(intent, text) {
    var minutes = extractMinutes(text);
    var ch = extractChapter(text);
    var date = extractDate(text);
    return intent.outputs.map(function (o) {
      var t = fill(o, minutes, ch);
      var todo = { title: t.title, minutes: t.minutes, intent: intent.id, plannedDate: date };
      if (ch) { todo.course = ch.course; todo.chapter = ch.chapter; }
      return todo;
    });
  }

  /* 兜底：普通待办，时长留 0 让用户自己填 */
  function buildPlain(text) {
    return [{
      title: text.replace(/^(我想|我要|帮我|请|明天|今天|今晚|后天)/g, '').trim() || text,
      minutes: 0, intent: 'plain', plannedDate: extractDate(text)
    }];
  }

  /* 主入口：返回 {ok, intentName?, todos?, candidates?} */
  function parse(text) {
    text = (text || '').trim();
    if (!text) return { ok: false, empty: true };
    var intent = matchIntent(text);
    if (intent) {
      return { ok: true, intentId: intent.id, intentName: intent.name, todos: buildFromIntent(intent, text) };
    }
    return { ok: false, candidates: ['words', 'review-chapter', 'video', 'algo', 'contest', 'plain'] };
  }

  /* 用户点了候选按钮后，按所选意图重试 */
  function parseAs(intentId, text) {
    if (intentId === 'plain') return { ok: true, intentId: 'plain', intentName: '普通待办', todos: buildPlain(text) };
    var list = global.StudyHubData.intents;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === intentId) {
        return { ok: true, intentId: intentId, intentName: list[i].name, todos: buildFromIntent(list[i], text) };
      }
    }
    return { ok: false, candidates: ['words', 'review-chapter', 'video', 'algo', 'contest', 'plain'] };
  }

  global.StudyHub.parser = { parse: parse, parseAs: parseAs };
})(window);
