/* 演示数据 · 存在 demo 档案，与真实数据完全分开 */
(function (global) {
  'use strict';
  var St = global.StudyHub.state, store = global.StudyHub.store;

  function seed() {
    var ns = store.ns('demo');
    if (ns.get('seeded')) return false;
    var today = St.dateKey();
    ns.set('settings', { examDate: St.addDays(today, 48), adaptive: true });

    var tasks = [
      { id: 'dt1', title: '背单词 20 分钟（先复习到期词）', minutes: 20, intent: 'words', status: 'done', plannedDate: today, repeat: '', createdAt: today + 'T08:00:00', completedAt: today + 'T08:25:00' },
      { id: 'dt2', title: '看数据结构 第3章讲义 40 分钟', minutes: 40, intent: 'review-chapter', status: 'todo', plannedDate: today, repeat: '', createdAt: today + 'T08:00:00', course: '数据结构', chapter: '第3章' },
      { id: 'dt3', title: '做数据结构 第3章练习题 5 道', minutes: 30, intent: 'review-chapter', status: 'todo', plannedDate: today, repeat: '', createdAt: today + 'T08:00:00', course: '数据结构', chapter: '第3章' },
      { id: 'dt4', title: '精听一套四级听力 30 分钟', minutes: 30, intent: 'cet4-listen', status: 'todo', plannedDate: today, repeat: 'daily', createdAt: today + 'T08:00:00', lastDoneDate: '' },
      { id: 'dt5', title: '查蓝桥杯赛事要求与时间节点', minutes: 20, intent: 'contest', status: 'todo', plannedDate: St.addDays(today, -1), repeat: '', createdAt: St.addDays(today, -1) + 'T09:00:00' },
      { id: 'dt6', title: '限时做四级真题 40 分钟', minutes: 40, intent: 'cet4-paper', status: 'done', plannedDate: St.addDays(today, -1), repeat: '', createdAt: St.addDays(today, -1) + 'T09:00:00', completedAt: St.addDays(today, -1) + 'T15:00:00' }
    ];
    ns.set('tasks', tasks);

    /* v0.4 种子：两个冷落章节 + 昨日 3 道错题（触发 adaptive halve）+ 到期复习词 */
    ns.set('mastery', {
      '数据结构::线性表': { level: 4, log: [{ date: St.addDays(today, -9), level: 2 }, { date: today, level: 4 }] },
      '数据结构::栈和队列': { level: 2, log: [{ date: St.addDays(today, -8), level: 3 }, { date: today, level: 2 }] },
      'JavaWeb::Servlet': { level: 1, log: [{ date: St.addDays(today, -12), level: 1 }] },
      '数据结构::串': { level: null, log: [] }
    });
    ns.set('wrongbook', [
      { qid: 'q023', stem: '栈的出栈顺序不可能是哪一种', course: '数据结构', chapter: '栈和队列', times: 2, lastWrong: St.addDays(today, -1) },
      { qid: 'q024', stem: '循环队列判空的条件是什么', course: '数据结构', chapter: '栈和队列', times: 1, lastWrong: St.addDays(today, -1) },
      { qid: 'q025', stem: '二叉树前序遍历非递归实现', course: '数据结构', chapter: '树', times: 1, lastWrong: St.addDays(today, -1) },
      { qid: 'q026', stem: 'HashMap 扩容触发阈值', course: 'JavaWeb', chapter: '集合', times: 1, lastWrong: St.addDays(today, -8) }
    ]);
    ns.set('outcomes', [
      { id: 'do1', taskId: 'dt6', intent: 'cet4-paper', tool: 'quiz', date: St.addDays(today, -1),
        summary: '做了 5 题，错 2 题，错题已入册：栈和队列', meta: { total: 5, wrong: 2, points: ['栈和队列'] } },
      { id: 'do2', taskId: 'dt1', intent: 'words', tool: 'wordcard', date: today,
        summary: '背了 24 个词（新词 20），16 个认识、8 个不认识，已排入复习队列，下次重现 明天',
        meta: { known: 16, vague: 0, unknown: 8, newCount: 20, dueCount: 4 } }
    ]);
    /* 3 个到期词（触发 due 置顶） */
    ns.set('wordState', {
      abandon: { level: 1, next: St.addDays(today, -1) },
      ability: { level: 0, next: today },
      academic: { level: 2, next: St.addDays(today, 5) },
      absolute: { level: 1, next: today },
      abstract: { level: 3, next: today }
    });

    /* 仅 7 天 sessions（rhythm 显示"还不到两周"） */
    var samples = [
      [-6, 70, '刷算法题', 'algo'], [-5, 45, '背单词', 'words'], [-4, 60, '写代码练习', 'coding'],
      [-3, 30, '四级听力', 'cet4-listen'], [-2, 80, '复习数据结构', 'review-chapter'],
      [-1, 55, '四级真题', 'cet4-paper'], [0, 25, '背单词', 'words']
    ];
    ns.set('sessions', samples.map(function (s, i) {
      return {
        id: 'ds' + i, taskId: '', intent: s[3], title: s[2],
        minutes: s[1], date: St.addDays(today, s[0]), startedAt: ''
      };
    }));
    ns.set('seeded', true);
    return true;
  }

  function reset() {
    store.ns('demo').keys().forEach(function (k) { store.ns('demo').remove(k); });
    seed();
  }

  global.StudyHub.demo = { seed: seed, reset: reset };
})(window);
