/* 设置 · 考试日期 / 演示模式 / 导入导出 / 清空 / 意图模板一览 */
(function (global) {
  'use strict';
  var St = global.StudyHub.state, ui = global.StudyHub.ui, store = global.StudyHub.store;
  var sync = global.StudyHub.sync;
  var feedback = global.StudyHub.feedback;

  function render(host) {
    var s = St.settings();
    var isDemo = store.profile() === 'demo';
    var intents = global.StudyHubData.intents;

    host.innerHTML =
      '<div class="view-inner">' +
      '<div class="card"><h2>设置</h2>' +
      '<div class="form-row"><label>备考方向</label>' +
      '<select id="trackSelect" class="input">' +
      '<option value="cet4"' + (s.track === 'cet4' ? ' selected' : '') + '>四级 CET-4</option>' +
      '<option value="cet6"' + (s.track === 'cet6' ? ' selected' : '') + '>六级 CET-6</option>' +
      '</select></div>' +
      '<p class="muted">切换方向后页面会刷新；四级和六级的背诵、练习进度分别保存，互不覆盖。</p>' +
      '<div class="form-row"><label>目标学习日期</label>' +
      '<input id="targetDate" type="date" value="' + s.targetDate + '" /></div>' +
      '<p class="muted">今天距目标日期还有 <b>' + Math.max(0, St.daysUntil(s.targetDate)) +
      '</b> 天。每日新卡、听力/阅读/写译和冲刺计划都按这个日期自动分配，不必等于考试当天。</p>' +
      '<div class="form-row"><label>考试日期（仅记录）</label>' +
      '<input id="examDate" type="date" value="' + s.examDate + '" /></div>' +
      '<p class="muted">' + s.examDateNote + '；今天距考试还有 <b>' +
      Math.max(0, St.daysUntil(s.examDate)) + '</b> 天。</p>' +
      '<div class="form-row"><label>自适应新词配额</label>' +
      '<input id="adaptiveQ" type="checkbox"' + (s.adaptive !== false ? ' checked' : '') + ' />' +
      '<span class="muted small">开启时，昨天错题 ≥3 道或今日到期复习词 >40 个，新词自动减半</span></div>' +
      '</div>' +
      '<div class="card"><h3>数据</h3>' +
      '<div class="row-actions">' +
      '<button id="demoToggle" class="btn">' + (isDemo ? '切回我的数据' : '查看演示数据') + '</button>' +
      '<button id="exportBtn" class="btn">导出 JSON</button>' +
      '<label class="btn file-btn">导入 JSON<input id="importFile" type="file" accept=".json" hidden /></label>' +
      '<button id="clearBtn" class="btn danger">清空当前档案</button>' +
      '</div>' +
      (isDemo ? '<p class="muted">当前在看演示数据，改动不会影响你自己的记录。</p>' : '') +
      '<p class="muted" id="setMsg"></p>' +
      '</div>' +
      '<div class="card"><h3>云端同步</h3>' +
      '<p class="muted" id="syncDesc">本地优先；没有网络时照常保存，联网后自动同步到云端。同步码就是你的档案钥匙，换电脑或手机时输入同一串即可。</p>' +
      '<div class="form-row"><label>同步码</label><code class="sync-code" id="syncCode">—</code></div>' +
      '<div class="form-row"><label>使用已有同步码</label><input id="syncCodeInput" type="text" maxlength="64" placeholder="粘贴另一台设备/以前复制过的同步码" /></div>' +
      '<div class="row-actions">' +
      '<button id="syncUseCode" class="btn">使用这个同步码</button>' +
      '<button id="syncCopy" class="btn">复制同步码</button>' +
      '</div>' +
      '<div class="form-row"><label>同步服务器</label><input id="syncApi" type="url" placeholder="https://你的项目.supabase.co 或 http://127.0.0.1:8787/api" /></div>' +
      '<div class="row-actions">' +
      '<button id="syncNow" class="btn">立即同步</button>' +
      '<button id="syncPull" class="btn">从云端恢复</button>' +
      '<button id="syncPush" class="btn">上传本地覆盖</button>' +
      '</div>' +
      '<p class="muted small" id="syncMsg"></p>' +
      '</div>' +
      '<div class="card"><h3>意见反馈</h3>' +
      '<p class="muted">遇到报错、内容错误，或想要新功能，可以直接写在这里。提交后会进入维护者的反馈表；网络不通时会先保存在本机，可复制后发给我。</p>' +
      '<div class="form-row"><label>类型</label>' +
      '<select id="fbCategory" class="input">' +
      '<option value="bug">功能异常</option>' +
      '<option value="content">内容纠错</option>' +
      '<option value="feature">功能建议</option>' +
      '<option value="other">其他</option>' +
      '</select></div>' +
      '<div class="form-row"><label>内容</label>' +
      '<textarea id="fbMessage" class="input" rows="4" maxlength="2000" placeholder="请写清楚：在哪个页面、做了什么、期望是什么（至少 5 个字）"></textarea></div>' +
      '<div class="form-row"><label>联系方式（可选）</label>' +
      '<input id="fbContact" class="input" type="text" maxlength="120" placeholder="邮箱 / 微信 / QQ，方便回复你" /></div>' +
      '<div class="row-actions">' +
      '<button id="fbSubmit" class="btn primary">提交反馈</button>' +
      '<button id="fbCopyText" class="btn">复制反馈内容</button>' +
      '<button id="fbRetry" class="btn">重试本机待发</button>' +
      '</div>' +
      '<p class="muted small" id="fbMsg"></p>' +
      '</div>' +
      '<div class="card"><h3>意图模板一览</h3>' +
      '<p class="muted">收件箱就靠这些模板把一句话拆成待办，共 ' + intents.length + ' 类：</p>' +
      '<ul class="intent-list">' +
      intents.map(function (it) {
        return '<li><b>' + ui.esc(it.name) + '</b>' +
          '<span class="muted">关键词：' + it.keywords.map(ui.esc).join(' / ') + '</span>' +
          '<ol>' + it.outputs.map(function (o) {
            return '<li>' + ui.esc(o.title.replace(/\{[^}]*\|([^}]*)\}/g, '$1')) +
              '（约 ' + o.minutes + ' 分钟）</li>';
          }).join('') + '</ol></li>';
      }).join('') +
      '</ul></div></div>';

    function msg(t) { host.querySelector('#setMsg').textContent = t; }

    /* ---------- 意见反馈 ---------- */
    var fbMsgEl = host.querySelector('#fbMsg');
    function fbMsg(t) { if (fbMsgEl) fbMsgEl.textContent = t; }
    function copyText(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
      }
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) { /* ignore */ }
      ta.remove();
      return Promise.resolve();
    }
    if (!feedback) {
      fbMsg('反馈模块没有加载（feedback.js 缺失），暂时不能提交。');
      ['fbSubmit', 'fbCopyText', 'fbRetry'].forEach(function (id) {
        var b = host.querySelector('#' + id);
        if (b) b.disabled = true;
      });
    } else {
      var fbPending = feedback.pendingCount();
      if (fbPending) fbMsg('本机还有 ' + fbPending + ' 条待发送反馈，可点“重试本机待发”。');
      host.querySelector('#fbSubmit').addEventListener('click', function () {
        var category = host.querySelector('#fbCategory').value;
        var message = host.querySelector('#fbMessage').value;
        var contact = host.querySelector('#fbContact').value;
        if (String(message).trim().length < 5) { fbMsg('请至少写 5 个字，方便定位问题。'); return; }
        var btn = host.querySelector('#fbSubmit');
        btn.disabled = true; fbMsg('正在提交……');
        feedback.submit({ category: category, message: message, contact: contact }).then(function (r) {
          btn.disabled = false;
          if (r.ok) {
            fbMsg('已提交，谢谢！');
            host.querySelector('#fbMessage').value = '';
          } else if (r.saved) {
            fbMsg('网络不可用，已保存到本机（' + (r.error || '提交失败') + '）。可以复制内容后发给我。');
          } else {
            fbMsg('提交失败：' + (r.error || '未知错误'));
          }
        });
      });
      host.querySelector('#fbCopyText').addEventListener('click', function () {
        var text = feedback.buildText({
          category: host.querySelector('#fbCategory').value,
          message: host.querySelector('#fbMessage').value,
          contact: host.querySelector('#fbContact').value
        });
        copyText(text).then(function () { fbMsg('反馈内容已复制，可以直接粘贴发给我。'); })
          .catch(function () { fbMsg('复制失败，请手动选中内容。'); });
      });
      host.querySelector('#fbRetry').addEventListener('click', function () {
        if (!feedback.pendingCount()) { fbMsg('本机没有待发送的反馈。'); return; }
        fbMsg('正在重试……');
        feedback.retryPending().then(function (r) {
          fbMsg('已发送 ' + r.sent + ' 条；没发出去的仍保存在本机。');
        });
      });
    }

    host.querySelector('#trackSelect').addEventListener('change', function (e) {
      var next = e.target.value === 'cet6' ? 'cet6' : 'cet4';
      if (next === s.track) return;
      if (!confirm('切换到' + (next === 'cet6' ? '六级' : '四级') + '？页面会刷新，两个方向的进度分开保存。')) {
        e.target.value = s.track; return;
      }
      St.saveSettings({ track: next });
      global.location.reload();
    });
    host.querySelector('#targetDate').addEventListener('change', function (e) {
      if (!e.target.value) return;
      St.saveSettings({ targetDate: e.target.value });
      render(host);
    });
    host.querySelector('#examDate').addEventListener('change', function (e) {
      if (!e.target.value) return;
      St.saveSettings({ examDate: e.target.value });
      render(host);
    });
    host.querySelector('#adaptiveQ').addEventListener('change', function (e) {
      St.saveSettings({ adaptive: e.target.checked });
      render(host);
    });
    host.querySelector('#demoToggle').addEventListener('click', function () {
      var next = isDemo ? 'real' : 'demo';
      store.setProfile(next);
      if (next === 'demo') global.StudyHub.demo.seed();
      global.StudyHub.app.header();
      render(host);
    });
    host.querySelector('#exportBtn').addEventListener('click', function () {
      store.download('studyhub-backup-' + St.dateKey() + '.json',
        JSON.stringify(store.exportData(), null, 2));
      msg('已导出备份文件。');
    });
    host.querySelector('#importFile').addEventListener('change', function (e) {
      var f = e.target.files[0];
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        try {
          msg(store.importData(JSON.parse(rd.result)) + '。');
          global.StudyHub.app.header();
        } catch (err) { msg('导入失败：' + err.message); }
      };
      rd.readAsText(f);
    });
    host.querySelector('#clearBtn').addEventListener('click', function () {
      if (!confirm('确定清空「' + (isDemo ? '演示数据' : '我的数据') + '」？此操作不可恢复。')) return;
      store.clear();
      render(host);
    });

    /* ---------- 云端同步 ---------- */
    var syncMsgEl = host.querySelector('#syncMsg');
    function sm(t) { if (syncMsgEl) syncMsgEl.textContent = t; }
    if (sync) {
      var info = sync.info();
      host.querySelector('#syncCode').textContent = info.id;
      host.querySelector('#syncApi').value = info.api;
      sm('当前状态：' + info.message + '；同步码请备份，换电脑恢复时要用。');

      function copyText(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          return navigator.clipboard.writeText(text);
        }
        var ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e) { /* ignore */ }
        ta.remove();
        return Promise.resolve();
      }
      host.querySelector('#syncCopy').addEventListener('click', function () {
        copyText(info.id).then(function () { sm('同步码已复制，请保存到安全的地方。'); })
          .catch(function () { sm('复制失败，请手动选中上面的同步码。'); });
      });
      host.querySelector('#syncUseCode').addEventListener('click', function () {
        var input = host.querySelector('#syncCodeInput');
        var v = (input.value || '').trim();
        if (!v) { sm('请先粘贴同步码。'); return; }
        if (!confirm('切换到同步码 ' + v + ' ？页面会重新加载，并拉取这个同步码的云端进度。')) return;
        if (!sync.setId(v)) sm('同步码格式不对：需要 8–64 位字母、数字、下划线或短横线。');
      });
      host.querySelector('#syncNow').addEventListener('click', function () {
        sm('正在同步……');
        sync.syncNow().then(function (ok) {
          sm(ok ? '同步完成。' : '没有完成：请检查服务器地址，或先在下方处理冲突。');
        });
      });
      host.querySelector('#syncPull').addEventListener('click', function () {
        if (!confirm('用云端进度覆盖这台设备的本地进度？建议先导出 JSON 备份。')) return;
        sm('正在从云端恢复……');
        sync.restoreFromCloud();
      });
      host.querySelector('#syncPush').addEventListener('click', function () {
        if (!confirm('用这台设备的本地进度覆盖云端？云端历史版本仍可在服务器备份里找回。')) return;
        sm('正在上传……');
        sync.pushForce().then(function (ok) {
          sm(ok ? '已用本地覆盖云端。' : '上传失败，请检查服务器。');
        });
      });
      host.querySelector('#syncApi').addEventListener('change', function (e) {
        sm('正在测试新服务器……');
        sync.setApi(e.target.value).then(function (ok) {
          sm(ok ? '服务器可用，已拉取云端进度。' : '连不上这个服务器，仍使用本地保存。');
        });
      });
    } else {
      host.querySelector('#syncDesc').textContent = '同步层没有加载（sync.js 缺失），当前只能本地保存。';
      ['syncNow', 'syncPull', 'syncPush', 'syncCopy', 'syncUseCode'].forEach(function (id) {
        var b = host.querySelector('#' + id);
        if (b) b.disabled = true;
      });
    }
  }

  global.StudyHub.views = global.StudyHub.views || {};
  global.StudyHub.views.settings = { render: render };
})(window);
