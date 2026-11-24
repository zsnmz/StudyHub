/* 意图模板 · 新增一类 = 在这里加一条数据，不改视图逻辑 */
/* {min} 会被解析到的时长替换，{chapter} 被解析到的章节替换 */
/* tool 决定待办「开始」进哪个执行器：wordcard 背单词 / quiz 刷题 / chapter 章节复习 / timer 通用计时（兜底） */
(function (global) {
  'use strict';
  global.StudyHubData = global.StudyHubData || {};
  global.StudyHubData.intents = [
    {
      id: 'words', name: '背单词', tool: 'wordcard',
      keywords: ['单词', '背词', '词汇', '四级词', '背英语', '背英文'],
      desc: '背单词任务，默认按复习到期词优先',
      outputs: [
        { title: '背单词 {min|20} 分钟（先做到期复习，再学新词）', minutes: 20 },
        { title: '把今天不认识的词抄进生词本', minutes: 5 }
      ]
    },
    {
      id: 'cet4-listen', name: '四级听力', tool: 'timer',
      keywords: ['听力', '四级听力', '精听', '练英语听力', '练英文听力', '听英语', '听英文'],
      desc: '听力精听 + 错题回听',
      outputs: [
        { title: '精听一套四级听力 {min|30} 分钟', minutes: 30 },
        { title: '回听错的那段，跟读原文 10 分钟', minutes: 10 }
      ]
    },
    {
      id: 'cet4-paper', name: '四级真题', tool: 'quiz',
      keywords: ['真题', '四级卷', '试卷', '四级题'],
      desc: '限时真题 + 逐题判对错',
      outputs: [
        { title: '做四级真题 {min|40} 分钟', minutes: 40 },
        { title: '对答案，把错题标出来 15 分钟', minutes: 15 }
      ]
    },
    {
      id: 'review-chapter', name: '复习某章', tool: 'chapter',
      keywords: ['复习', '章节', '讲义'],
      desc: '针对某一章：看要点 → 回填掌握度',
      outputs: [
        { title: '看{chapter|本章}讲义 40 分钟', minutes: 40 },
        { title: '做{chapter|本章}练习题 5 道', minutes: 30 },
        { title: '订正并记下易错点 15 分钟', minutes: 15 }
      ]
    },
    {
      id: 'video', name: '看课程视频', tool: 'timer',
      keywords: ['视频', '网课', '看课', '课程视频', 'mooc', 'b站'],
      desc: '看视频并落 3 条要点，防止只看不想',
      outputs: [
        { title: '看课程视频 {min|30} 分钟', minutes: 30 },
        { title: '写下 3 条要点 10 分钟', minutes: 10 }
      ]
    },
    {
      id: 'algo', name: '刷算法题', tool: 'quiz',
      keywords: ['算法', '刷题', '力扣', 'leetcode', 'oj'],
      desc: '限时刷题，选完即判对错',
      outputs: [
        { title: '刷算法题 {min|40} 分钟', minutes: 40 },
        { title: '订正卡住的题，记下思路 15 分钟', minutes: 15 }
      ]
    },
    {
      id: 'coding', name: '写代码练习', tool: 'timer',
      keywords: ['写代码', '编程', '敲代码', '代码练习', '写个'],
      desc: '一段不被打断的编码练习',
      outputs: [
        { title: '写代码练习 {min|45} 分钟', minutes: 45 },
        { title: '自测一遍并修掉问题 10 分钟', minutes: 10 }
      ]
    },
    {
      id: 'notes', name: '整理笔记', tool: 'timer',
      keywords: ['笔记', '整理', '总结'],
      desc: '把零散内容收成一份能复习的笔记',
      outputs: [
        { title: '整理笔记 {min|25} 分钟', minutes: 25 }
      ]
    },
    {
      id: 'homework', name: '做课程作业', tool: 'timer',
      keywords: ['作业', '课程设计', '实验报告'],
      desc: '做作业并留出检查时间',
      outputs: [
        { title: '做课程作业 {min|60} 分钟', minutes: 60 },
        { title: '检查一遍再提交 10 分钟', minutes: 10 }
      ]
    },
    {
      id: 'contest', name: '准备比赛', tool: 'timer',
      keywords: ['比赛', '竞赛', '蓝桥杯', '数学建模', '软件杯', '大赛'],
      desc: '先弄清要求，再定最小目标，再动手一步',
      outputs: [
        { title: '查赛事要求与时间节点（以官网为准）', minutes: 20 },
        { title: '定一个最小作品/备赛目标', minutes: 15 },
        { title: '先动手写 1 个小功能或做 1 类题 40 分钟', minutes: 40 }
      ]
    },
    {
      id: 'mock', name: '模考', tool: 'timer',
      keywords: ['模考', '模拟考', '模拟'],
      desc: '完整限时模考 + 分析',
      outputs: [
        { title: '限时模考 {min|60} 分钟，中途不查资料', minutes: 60 },
        { title: '对答案并分析错题 30 分钟', minutes: 30 }
      ]
    },
    {
      id: 'weakup', name: '查漏补缺', tool: 'quiz',
      keywords: ['查漏', '补缺', '错题', '薄弱', '补短板'],
      desc: '从错题出发补薄弱点',
      outputs: [
        { title: '翻错题，挑出 3 个最弱的点 20 分钟', minutes: 20 },
        { title: '针对每个薄弱点各做 2 道题 30 分钟', minutes: 30 }
      ]
    }
  ];
  /* 按 intent id 查执行器类型，缺省兜底 timer */
  global.StudyHubData.toolOf = function (intentId) {
    var list = global.StudyHubData.intents;
    for (var i = 0; i < list.length; i++) if (list[i].id === intentId) return list[i].tool || 'timer';
    return 'timer';
  };
})(window);
