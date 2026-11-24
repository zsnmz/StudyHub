/* 数据层 · 专业课大纲（资源只给“平台 + 搜索入口”，具体视频请人工补齐） */
(function () {
  'use strict';
  window.StudyHubData = window.StudyHubData || {};

  function bili(q) {
    return 'https://search.bilibili.com/all?keyword=' + encodeURIComponent(q);
  }

  window.StudyHubData.courses = [
    {
      id: 'ds', title: '数据结构', term: '大二 · 专业核心课',
      chapters: [
        { id: 'ds-01', title: '绪论', focus: '抽象数据类型、时间/空间复杂度分析' },
        { id: 'ds-02', title: '线性表', focus: '顺序表与链表的插入删除、双链表、循环链表' },
        { id: 'ds-03', title: '栈和队列', focus: '栈的应用、循环队列、表达式求值' },
        { id: 'ds-04', title: '串', focus: '模式匹配、KMP 思想' },
        { id: 'ds-05', title: '树', focus: '二叉树遍历、线索树、哈夫曼树' },
        { id: 'ds-06', title: '图', focus: 'DFS/BFS、最小生成树、最短路径、拓扑排序' },
        { id: 'ds-07', title: '查找', focus: '折半查找、二叉排序树、哈希表' },
        { id: 'ds-08', title: '排序', focus: '快排、归并、堆排序及稳定性对比' }
      ],
      resources: [
        { platform: 'B站', label: '搜索：数据结构 王道', url: bili('数据结构 王道'), status: '搜索入口' },
        { platform: '中国大学MOOC', label: '搜索入口待填', url: '', status: '待填' }
      ]
    },
    {
      id: 'javaweb', title: 'JavaWeb', term: '大二 · 专业核心课',
      chapters: [
        { id: 'jw-01', title: '前端基础', focus: 'HTML/CSS/JS 与表单提交' },
        { id: 'jw-02', title: 'Servlet', focus: '生命周期、请求响应、转发与重定向' },
        { id: 'jw-03', title: 'JSP', focus: '指令、内置对象、EL 与 JSTL' },
        { id: 'jw-04', title: '会话与 Cookie', focus: 'Session 原理、Cookie 存取、登录状态' },
        { id: 'jw-05', title: 'JDBC', focus: '连接池、增删改查、事务' },
        { id: 'jw-06', title: 'MVC 分层', focus: 'Servlet + Service + DAO 的职责划分' },
        { id: 'jw-07', title: '过滤器与监听器', focus: 'Filter 链、编码过滤、Listener 场景' },
        { id: 'jw-08', title: '综合项目', focus: '把前面的知识串成一个可运行的小系统' }
      ],
      resources: [
        { platform: 'B站', label: '搜索：JavaWeb 入门', url: bili('JavaWeb 入门'), status: '搜索入口' },
        { platform: 'CSDN', label: '关键词：Servlet 生命周期', url: 'https://so.csdn.net/so/search?q=Servlet%20%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F', status: '搜索入口' }
      ]
    }
  ];

  /* 章节资源说明：后续人工补充时按 chapters[].id 追加到 courses[].chapterResources */
  window.StudyHubData.resourceGuide = '每章可补充：平台、标题、链接、备注。当前只保留搜索入口，避免出现失效或编造的链接。';
})();
