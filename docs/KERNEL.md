# 学习舱 StudyHub · 项目内核

- 版本：0.6.1
- 更新：2026-11-24
- 适用范围：`index.html`、`assets/`、`data/`、`server/`、`scripts/`

---

## 1. 设计原则

1. **本地优先**：任何功能先保证 `file://` 双击可用；网络/服务端是增强，不是前提。
2. **无构建**：没有打包器、没有 npm 前端依赖；改完 JS 刷新即可。
3. **单一存储入口**：页面只通过 `StudyHub.store` 读写 localStorage。
4. **数据与视图分离**：题库在 `data/*.js`，视图只消费 `StudyHubData`。
5. **可回退**：单文件、完整目录、服务端三种形态都能用；同步失败自动退回本地。
6. **可验证**：每个关键路径都有 `node --check`、服务端测试或浏览器冒烟。

---

## 2. 运行时结构

### 2.1 启动顺序（`index.html`）

```text
store.js
sync.js                 ← 可选；单文件构建会移除
data/words.js … cet4-write.js → cet6-vocab.js → cet6-reading.js → cet6-listening.js
→ cet6-listening-audio.js → cet6-write.js → cet6.js
ui.js → core.js → tracks.js → learn.js → demo.js → timer.js → parser.js
app.js                  ← DOMContentLoaded 时 boot()
views/*.js              ← 注册 StudyHub.views.<name>
sprint.js               ← 注册 sprint 视图 + StudyHub.sprint.summary()
views/full.js           ← 注册 full 视图（词汇打字检测、写译 textarea 作答）
```

关键点：

- `store.js` 必须最先加载；`sync.js` 依赖它。
- 所有视图在 `app.js` 之后加载，但 `app.js` 的 `boot()` 等 `DOMContentLoaded` 才执行，所以注册顺序安全。
- 数据文件挂到 `window.StudyHubData`；`full.js` 用 `D.cet4Vocab`、`D.cet4Listening`、`D.cet4ListeningAudio` 等。

### 2.2 全局命名空间

```js
window.StudyHub = {
  store, sync, ui, state, learn, demo, timer, parser, app, bus,
  views, sprint
};
window.StudyHubData = { words, questions, notes, courses, intents,
  cet4, cet4Vocab, cet4Reading, cet4Listening, cet4ListeningAudio, cet4Write };
```

### 2.3 视图协议

每个视图：

```js
StudyHub.views.<name> = {
  render: function (host, payload) { host.innerHTML = '…'; },
  destroy: function () { /* 可选：清理计时器、audio、事件 */ },
  onTick: function (snap) { /* 可选：计时变化 */ }
};
```

`app.render(name, payload)` 在切换视图前调用上一个视图的 `destroy()`；同页重渲染保留滚动位置。

---

## 3. 存储层

### 3.1 localStorage 键

```text
studyhub.v1.@profile                 当前档案：real | demo
studyhub.v1.<profile>.<key>          业务数据（JSON 序列化）
studyhub.sync.id                     32 位同步码 / 服务端档案 ID
studyhub.sync.api                    自定义 API 基地址（可选）
studyhub.sync.meta                   { rev, updatedAt, lastSync }
```

业务 key 由各模块自定，例如：

- `settings`：考试日期、自适应开关
- `tasks` / `sessions` / `draft`：待办、专注记录、草稿
- `full`：`{start, vocab:{p,log}, done:{listening,reading,writing,translation}, lastTab}`
- `sprint`：`{start,dailyNew,direction,progress,log,wrong,history}`
- `learn.words` / `learn.wrong` / `learn.outcomes` 等

### 3.2 `StudyHub.store` API

| 方法 | 作用 |
| --- | --- |
| `ns(profile)` | 返回 `{get,set,remove,keys,profile}` |
| `profile()` / `setProfile(p)` | 读/切当前档案 |
| `snapshot(p)` | 整份档案 → 普通对象 |
| `replace(p, data)` | 用对象覆盖整份档案（会逐 key 触发事件） |
| `exportData()` | 导出 `{app,version,exportedAt,profile,profiles}` |
| `importData(obj)` | 导入并覆盖两个档案；返回提示文本 |
| `download(filename, text)` | 触发浏览器下载 |
| `clear(p)` | 清空指定档案 |

写入时派发：

```js
document.dispatchEvent(new CustomEvent('studyhub:store', {
  detail: { profile, key, value }
}));
```

同步层监听这个事件；`replace()` 期间用 `state.applying` 抑制回环上传。

### 3.3 隐私模式

localStorage 不可用时自动退化为内存 `memFallback`，当次会话可用，刷新即丢。设置页会显示当前档案，但不会专门提示“隐私模式”。

### 3.4 备考方向（轨道）

`assets/js/tracks.js` 注册 `cet4` / `cet6` 两个方向，每个方向带：

```js
{ id, name, label, full, data, vocab, reading, listening, audio, write }
```

- `StudyHub.tracks.current()` 读取 `settings().track`（默认 `cet4`）；
- `full.js`、`sprint.js` 在加载时取当前轨道，切轨道需要刷新页面；
- 进度键按轨道隔离：四级 `full` / `sprint`，六级 `full.cet6` / `sprint.cet6`；
- 数据加载顺序必须保证 `cet6-vocab.js` 在 `cet6.js` 之前（`cet6.js` 会用前者的词生成翻译词卡）。

目标日期：

```text
settings.targetDate  用户自选目标学习日期（默认等于 examDate）
settings.examDate    仅记录考试日期，不参与排期
```

`full.js` 的 `daysLeft()`、`sprint.js` 的 `examDate()` 都优先用 `targetDate`；计划表按目标日期生成，最后 3 天只复习。

---

## 4. 同步层（`assets/js/sync.js`）

### 4.1 状态

```js
{ status, message, lastSync, rev, dirty, applying, busy, conflict, started, timer, api, id }
```

`status`：`local | syncing | synced | dirty | offline | conflict | error`，对应顶部 `#syncState`。

### 4.2 地址选择

1. localStorage 有 `studyhub.sync.api` → 用它；
2. `http:` / `https:` 页面 → `location.origin + '/api'`；
3. `file:` 页面 → `http://127.0.0.1:8787/api`。

所以：

- `http://127.0.0.1:8787` 打开时同源，最省事；
- 双击 `index.html` 时也能连本机服务端；
- 单文件版默认移除 sync.js，避免在 https 静态页请求 `http://127.0.0.1` 被浏览器拦截。

### 4.3 拉取（pull）

```text
GET /api/progress/:id
  404 → push({force:true}) 创建
  200 → 比较 server.updatedAt 与本地 meta.updatedAt
          云端更新 且 本地不脏 → replace + 可选 reload
          本地脏            → conflict
          否则              → 只更新 meta
超时/断网 → offline，继续本地保存
```

注意：比较必须是**严格大于** `serverTime > localTime`。早期用 `>=` 导致每次初始化都 reload，形成无限刷新；已修。

### 4.4 推送（push）

```text
PUT /api/progress/:id
body: { data: snapshot('real'), baseRev: meta.rev, force?: true }
  200 → 保存 rev/updatedAt，dirty=false
  409 → conflict，保留 current，等用户在设置页选择
  其他 → offline
```

触发时机：

- 任意 `studyhub:store` 事件后 1.2 秒防抖；
- 每 60 秒重试；
- `online` / `visibilitychange`；
- 设置页“立即同步”。

### 4.5 冲突与恢复

- 设置页“从云端恢复”：`restoreFromCloud()` → `pull({preferServer:true, force:true, reload:true})`；
- “上传本地覆盖”：`pushForce()` → `PUT {force:true}`；
- 服务端保留 50 个历史版本，可通过 `POST /restore` 回滚到某个 rev。

---

## 5. 服务端

### 5.1 模块

| 文件 | 职责 |
| --- | --- |
| `server/config.js` | 读环境变量、默认路径/端口/限额 |
| `server/db.js` | SQLite 打开、schema、进度读写、历史、统计 |
| `server/backup.js` | `VACUUM INTO` 备份、清理旧备份、CLI |
| `server/static.js` | 静态文件、MIME、Range、目录穿越防护 |
| `server/api.js` | REST API、CORS、JSON 解析、校验、错误 |
| `server/index.js` | HTTP 服务、路由、请求日志、定时备份、优雅退出 |

### 5.2 配置（环境变量）

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `PORT` | `8787` | 监听端口 |
| `HOST` | `127.0.0.1` | 默认只本机；公网需改 `0.0.0.0` 并加反代/HTTPS |
| `DATA_DIR` | `server/data` | SQLite 目录 |
| `BACKUP_DIR` | `server/backups` | 备份目录 |
| `BACKUP_INTERVAL_HOURS` | `24` | 自动备份间隔 |
| `BACKUP_KEEP` | `14` | 保留份数 |
| `CORS_ORIGIN` | `*` | 生产应收紧 |
| `MAX_BODY_BYTES` | `2 MB` | 请求体上限 |

### 5.3 API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 健康检查 + 统计 |
| GET | `/api/stats` | 档案/修订/历史行数 |
| GET | `/api/progress/:id` | 取进度；404 表示还没有 |
| PUT | `/api/progress/:id` | 保存进度；`baseRev` 不匹配返回 409 |
| GET | `/api/progress/:id/history` | 最近 50 个版本 |
| GET | `/api/progress/:id/export` | 下载 JSON |
| POST | `/api/progress/:id/restore` | body `{rev}`，恢复到历史版本 |
| POST | `/api/feedback` | 提交反馈；5–2000 字、四类、10 次/10 分钟限流 |
| OPTIONS | `/api/*` | CORS 预检 |

`id` 规则：`^[A-Za-z0-9_-]{8,64}$`。

### 5.4 数据库 schema

```sql
CREATE TABLE progress (
  profile_id TEXT PRIMARY KEY,
  data       TEXT NOT NULL,
  rev        INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE progress_history (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL,
  rev        INTEGER NOT NULL,
  data       TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_history_profile ON progress_history(profile_id, id DESC);

CREATE TABLE feedback (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at  TEXT NOT NULL,
  category    TEXT NOT NULL,
  message     TEXT NOT NULL,
  contact     TEXT,
  page        TEXT,
  track       TEXT,
  app_version TEXT,
  sync_id     TEXT,
  user_agent  TEXT
);
```

- WAL、`synchronous=NORMAL`、`busy_timeout=5000`、外键开。
- 每次写入递增 `rev`，并写一条 history；只保留最近 50 条。
- `saveProgress` 用 `BEGIN IMMEDIATE` 事务；`force` 跳过 `baseRev` 检查。

### 5.5 备份

- `backupDatabase()`：`VACUUM INTO` 到临时文件，校验非空后改名；
- 启动时备份一次；每 24 小时一次；`SIGINT/SIGTERM` 退出前再备份；
- `pruneBackups()` 按 mtime 保留最近 N 份；
- 手动：`npm.cmd run backup`。

### 5.6 静态文件

只允许：

```text
/                    → index.html
/index.html
/favicon.ico
/manifest.webmanifest
/assets/*            → css/js/audio/image
/data/*              → 数据脚本
```

其他路径 404；解析后必须仍在 `publicRoot` 内，防止 `../` 穿越。支持 `Range`（音频拖动）与 `HEAD`。

---

## 6. 听力音频管线

### 6.1 为什么不用 `speechSynthesis`

浏览器语音包因系统/浏览器而异，同一句在 Edge、Chrome、Firefox 上可能没声音或音色不同。改为**预生成 MP3 + `<audio>`**：

- 语音由 edge-tts 生成，和浏览器无关；
- 逐句文件，可上一句/下一句/重播/倍速；
- 以 data URI 内联进 `data/cet4-listening-audio.js`，避免额外目录/跨域；
- 单文件打包时自动带上。

### 6.2 生成

```powershell
pip install edge-tts
npm.cmd run audio
```

`scripts/build-listening-audio.mjs`：

1. 用 `vm` 读 `data/cet4-listening.js`（沙箱同时提供 `window` 与 `StudyHubData`）；
2. 逐句调用 `python -m edge_tts --voice … --rate=-5%`；
3. 男声 `en-US-GuyNeural`，女声 `en-US-AriaNeural`；
4. 输出 `assets/audio/listening/<setId>-<nn>.mp3`；
5. 生成 `assets/audio/listening/manifest.json`；
6. 生成 `data/cet4-listening-audio.js`（`StudyHubData.cet4ListeningAudio`）。

当前：4 套、25 句，data 文件约 992 KB。

### 6.3 播放

`assets/js/views/full.js`：

- `audioLines()` 取当前套的 data URI 数组；
- `ensureAudio()` 创建/复用 `#fu-audio-el`，监听 `ended` 自动下一句；
- `playAudio/toggleAudio/stopAudio/prevAudio/nextAudio/replayAudio/setAudioRate`；
- `audioPos()` 更新“第 n / N 句”、进度条、按钮文案；
- `cleanup()` 暂停并清空 src，防止离开页面后继续响。

---

## 7. 单文件构建

```powershell
npm.cmd run single
# 或
node scripts/make-single.mjs --keep-sync --out studyhub-single.html
```

`scripts/make-single.mjs`：

1. 读 `index.html`；
2. 把 `<link rel="stylesheet" href="assets/css/app.css">` 换成 `<style>`；
3. 把每个 `<script src="…">` 换成内联 `<script>`；
4. 默认移除 `sync.js`，并把 footer 改成“单文件版 · 数据保存在本机浏览器”；
5. 校验没有残留 `script src` 或 `assets/` 样式引用；
6. 输出 `studyhub-single.html`（当前约 1.5 MB）。

`--keep-sync` 适合“同源 http 部署 + 有服务端”的场景；纯静态托管不要保留，否则 https 页面会尝试请求 `http://127.0.0.1:8787`。

---

## 8. 扩展点

### 加一个词

1. 在 `data/cet4-vocab.js` 的 `words` 追加 `{id:'v197',w,f,zh,note}`；
2. 更新 `meta.count`；
3. 确认 id 唯一；刷新即可。

### 加一套阅读/听力/写译

- 阅读：`data/cet4-reading.js` 的 `sets` 追加；`questions[].answer` 是 0-based 索引。
- 听力：`data/cet4-listening.js` 追加 `script`/`questions`；然后 `npm.cmd run audio` 重新生成音频与 data URI。
- 写译：`data/cet4-write.js` 的 `writing` / `translation` 追加；字段见文件头。

### 加一个页面

1. 新建 `assets/js/views/foo.js`，注册 `StudyHub.views.foo`；
2. `index.html` 加 `<script src="assets/js/views/foo.js">`；
3. `app.js` 的 `LABELS` 加 `foo:'名称'`；
4. `index.html` tabbar 加 `<button class="tab" data-view="foo">名称</button>`；
5. 如需样式，追加到 `app.css` 末尾。

### 加一个 API

1. `server/api.js` 增加路由分支；
2. `server/db.js` 增加查询/写入函数；
3. 更新本文档 API 表与 `tests/server.test.js`。

---

## 9. 不变量与坑

1. **脚本顺序不能乱**：`store.js` → `sync.js` → 数据 → `ui/core` → `app` → `views`。
2. **数据文件用 `window.StudyHubData`**；VM 生成音频时要同时提供 `window` 和 `StudyHubData`。
3. **不要用 `speechSynthesis` 做听力主路径**；跨浏览器不可靠。
4. **同步比较用 `>` 不用 `>=`**；否则无限 reload。
5. **`store.replace()` 会逐 key 触发事件**；同步层必须用 `applying` 抑制上传。
6. **同步码就是密码**；不要发到公开群。
7. **单文件版不要保留 sync.js**（除非同源有服务端）。
8. **`server/data` 与 `server/backups` 是运行时数据**，不要提交/打包进分享 zip。
9. **改 `examDate` 后**，全套计划与冲刺计划按新日期重算；已学进度不丢。
10. **localStorage 有容量上限**；音频不要写 localStorage，只作为 JS 常量加载。

---

## 10. 排障

| 现象 | 先查 |
| --- | --- |
| 页面空白/按钮无反应 | 控制台第一个报错；`npm.cmd run check` |
| `npm start` 报执行策略 | 用 `npm.cmd start` |
| 8787 打不开 | 进程是否在跑；`PORT` 是否被占；防火墙 |
| 顶部一直“离线本地” | 服务端是否启动；`/api/health`；设置里的服务器地址 |
| 同步冲突 | 设置页选“从云端恢复”或“上传本地覆盖”；先导出 JSON |
| 听力没声音 | 是否点了播放；浏览器是否静音；`#fu-audio-el` 的 `src` 是否 data URI |
| 数据不见了 | 是否换了浏览器/无痕；检查 `studyhub.v1.` 键；用导出 JSON 恢复 |
| 单文件打不开同步 | 预期行为：单文件版无 sync.js；用完整目录 + 服务端 |
| 测试失败 | 先看 `npm.cmd test` 具体断言；服务端测试会建临时目录 |