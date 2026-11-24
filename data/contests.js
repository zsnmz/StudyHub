/* 数据层 · 竞赛信息（时间窗口、门槛一律以官网为准，不写具体日期与链接） */
(function () {
  'use strict';
  window.StudyHubData = window.StudyHubData || {};

  window.StudyHubData.contests = [
    {
      id: 'lanqiao', title: '蓝桥杯全国软件和信息技术专业人才大赛',
      fit: '算法/程序设计方向，适合大二打基础',
      window: '报名与比赛时间以官网为准',
      threshold: '分组与报名资格以官网为准；建议先能把基础算法题稳定做出来',
      steps: [
        { id: 'lq-1', text: '去官网确认本届赛程、组别和报名方式' },
        { id: 'lq-2', text: '按周刷基础算法题（枚举、排序、搜索、简单 DP）' },
        { id: 'lq-3', text: '完整限时做一套往年题，记录卡住的知识点' }
      ]
    },
    {
      id: 'jsjds', title: '中国大学生计算机设计大赛',
      fit: '偏作品/项目，适合把 JavaWeb 项目包装成参赛作品',
      window: '各赛道时间窗口以官网为准',
      threshold: '赛道分类、组队人数与提交要求以官网为准',
      steps: [
        { id: 'js-1', text: '查阅官网，确认想报的赛道和作品要求' },
        { id: 'js-2', text: '写一页作品方案：解决什么问题、用什么技术' },
        { id: 'js-3', text: '联系指导老师，确认可行性和时间安排' }
      ]
    },
    {
      id: 'mathor', title: '全国大学生数学建模竞赛',
      fit: '偏建模与写作，需要三人组队',
      window: '报名与赛期以官网为准',
      threshold: '组队方式与参赛资格以官网为准',
      steps: [
        { id: 'mcm-1', text: '找齐 3 人并明确建模/编程/写作分工' },
        { id: 'mcm-2', text: '过一遍常用模型：评价、预测、优化' },
        { id: 'mcm-3', text: '用一篇往年赛题完整走一遍“建模→求解→写论文”' }
      ]
    },
    {
      id: 'ruanjianbei', title: '“中国软件杯”大学生软件设计大赛',
      fit: '偏工程实现，适合练团队协作与完整交付',
      window: '赛题发布与报名时间以官网为准',
      threshold: '赛题、组队和提交形式以官网为准',
      steps: [
        { id: 'rjb-1', text: '到官网看赛题列表和本届报名通知' },
        { id: 'rjb-2', text: '组队后选一道赛题，拆出最小可运行功能' },
        { id: 'rjb-3', text: '两周内做出能演示的原型，再补文档' }
      ]
    }
  ];
})();
