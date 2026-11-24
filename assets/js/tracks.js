/* 备考方向注册：四级 / 六级。页面与数据通过这里取当前方向，
   切换方向后刷新页面，各方向的进度分开保存。 */
(function (global) {
  'use strict';
  var D = global.StudyHubData || {};
  var DEFS = [
    {
      id: 'cet4', name: '四级', label: 'CET-4', full: '大学英语四级',
      data: D.cet4 || { items: [] },
      vocab: D.cet4Vocab || { words: [] },
      reading: D.cet4Reading || { sets: [] },
      listening: D.cet4Listening || { sets: [] },
      audio: D.cet4ListeningAudio || { sets: {} },
      write: D.cet4Write || { writing: [], translation: [] }
    },
    {
      id: 'cet6', name: '六级', label: 'CET-6', full: '大学英语六级',
      data: D.cet6 || { items: [] },
      vocab: D.cet6Vocab || { words: [] },
      reading: D.cet6Reading || { sets: [] },
      listening: D.cet6Listening || { sets: [] },
      audio: D.cet6ListeningAudio || { sets: {} },
      write: D.cet6Write || { writing: [], translation: [] }
    }
  ];

  function byId(id) {
    var want = id === 'cet6' ? 'cet6' : 'cet4';
    for (var i = 0; i < DEFS.length; i++) if (DEFS[i].id === want) return DEFS[i];
    return DEFS[0];
  }
  function currentId() {
    try { return byId(global.StudyHub.state.settings().track).id; } catch (e) { return 'cet4'; }
  }
  function current() { return byId(currentId()); }
  function set(id) {
    var t = byId(id);
    try { global.StudyHub.state.saveSettings({ track: t.id }); } catch (e) { return false; }
    return t.id;
  }

  global.StudyHub.tracks = {
    list: DEFS,
    get: byId,
    current: current,
    currentId: currentId,
    set: set
  };
})(window);