/* 视图共用小工具 */
(function (global) {
  'use strict';
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function minutes(n) {
    var v = Math.round((+n || 0) * 10) / 10;
    if (v < 60) return v + ' 分钟';
    var h = Math.floor(v / 60), m = Math.round(v % 60);
    return h + ' 小时' + (m ? ' ' + m + ' 分钟' : '');
  }
  function dateCN(key) {
    var p = key.split('-');
    return +p[1] + ' 月 ' + +p[2] + ' 日';
  }
  /* 成果卡：任务完成时"留下了什么"，不是撒花 */
  function outcomeCard(o, extra) {
    return '<div class="outcome"><span class="outcome-tag">成果</span>' +
      '<p class="outcome-text">' + esc(o.summary) + '</p>' + (extra || '') + '</div>';
  }
  /* 空态：素材缺失时展示，不报错不白屏 */
  function emptyState(text, back) {
    return '<div class="view-inner"><div class="card empty">' +
      '<h2>素材待导入</h2><p class="muted">' + esc(text) + '</p>' +
      (back ? '<button class="btn" onclick="StudyHub.app.navigate(\'' + back + '\')">返回</button>' : '') +
      '</div></div>';
  }
  /* 同页重渲染时保住滚动位置：整块 innerHTML 替换会让高度先塌陷、滚动归零 */
  function captureScroll() {
    return window.pageYOffset || document.documentElement.scrollTop || 0;
  }
  function restoreScroll(y) {
    if (!y) return;
    window.scrollTo(0, y);
    /* 新内容的高度要等下一次布局才稳定，再兜一次 */
    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(function () { window.scrollTo(0, y); });
    }
  }
  global.StudyHub.ui = {
    esc: esc, minutes: minutes, dateCN: dateCN, outcomeCard: outcomeCard, emptyState: emptyState,
    captureScroll: captureScroll, restoreScroll: restoreScroll
  };
})(window);
