# 学习舱 StudyHub · 迭代记录

- 记录人：开发/维护
- 更新时间：2026-11-24
- 版本：0.6.1

> 目的：以后改功能、查问题时，先看这里“为什么变成现在这样”，再看 `KERNEL.md` 的接口与不变量。

---

## 版本总览

| 版本 | 日期 | 主题 | 状态 |
| --- | --- | --- | --- |
| 0.1 | 接手时 | 基础学习舱：收件箱/今日/计时/复盘 | 已有 |
| 0.2 | 2026-11-23 | 四级冲刺：223 条作文翻译高频内容 | 完成 |
| 0.3 | 2026-11-23 | 全套四级：词/听力/阅读/写译/键盘作答/26 天计划 | 完成 |
| 0.4 | 2026-11-23 | 公网单文件：html.cafe | 完成 |
| 0.5 | 2026-11-24 | 后端 SQLite + 同步 + 跨浏览器听力 + 工程化 | 完成 |
| 0.5.1 | 2026-11-24 | 词汇改打字默写、写译改 textarea 键盘作答 | 完成 |
| 0.6.0 | 2026-11-24 | 六级轨道 + 自选目标学习日期 + 六级听力 MP3 | 完成 |
| 0.6.1 | 2026-11-24 | 意见反馈 + Supabase/SQLite 入库 + 本机待发 | 完成 |

---

## 0.2 四级冲刺（2026-11-23）

### 目标

把 266 页 PDF 里的作文/翻译高频内容压缩成每天能背的卡片，并能自测。

### 做了什么

- 用 PyMuPDF 抽取 PDF 到 `.work/cet4/*.txt`，按页标记。
- 从写作 p5–43、翻译 p135–209 提炼 223 条：
  - 写作 78：句型 24、模板 9、词块 45；
  - 翻译 145：高频词 80、救命短语 45、句型 20。
- 新建 `data/cet4.js`：`StudyHubData.cet4 = {meta,items,writing,translation,tips}`。
- 新建 `assets/js/sprint.js`：
  - 状态 `studyhub.v1.real.sprint`；
  - SRS `[0,1,2,4,7,15,30]`；
  - 今日计划、5 页签、闪卡、10 题检测、错题本、7 天柱、冲刺日历。
- `index.html` 加「冲刺」tab、`data/cet4.js`、`sprint.js`；`app.js` 加 `sprint:'冲刺'`。
- 今日页加冲刺入口卡（`today.js` 的 `sprintCard()`），显示距考试天数/今日新卡/完成百分比。

### 关键修复

| 问题 | 根因 | 修复 |
| --- | --- | --- |
| `data/cet4.js` 语法错误 | `w-t09` 行尾多一个 `)` | 删除；`node --check` 通过 |
| 今日新卡越背越多 | 目标数没有减去今天已学 | `target = dailyTarget() - logToday().new.length` |
| 测验分数显示成对象 | `done` 存了对象 | 改为 `done: s.finished` |
| 重背后任务数变 12 | 复习统计把“当天重背”也算进去 | `reviewDone` 排除当天重背 id |
| 最后 3 天仍推新词 | `reviewOnly` 用 `<=4` | 改为 `<=3`，与排期一致 |

### 验证

- `node --check` 全部通过。
- 浏览器 CDP：作文 3 张→小结→3 题检测（2/3）→今日 3/11；翻译页 80/45/20；进度 27 格；390px 无横向溢出。
- 截图：`.screenshots/sprint-*.png`。

---

## 0.3 全套四级（2026-11-23）

### 目标

从“只背作文翻译”扩展到“全套”：高频词、听力、阅读、写译、手写、逐日计划。

### 做了什么

- `data/cet4-vocab.js`：196 个高频词（来自翻译高频词表，去重；含词频）。
- `data/cet4-reading.js`：3 套仿真阅读，每套 5 题。
- `data/cet4-listening.js`：4 套短对话，共 25 句。
- `data/cet4-write.js`：4 篇写作 + 4 篇翻译，含范文/参考译文/关键点。
- `assets/js/handwriting.js`：canvas 手写板，笔/橡皮/撤销/清空/保存 PNG。
- `assets/js/views/full.js`：6 页签（今日/高频词/听力/阅读/写译/计划），约 860 行。
- `index.html` 加「全套」tab 与数据/视图脚本；`app.js` 加 `full:'全套'`。
- `app.css` 追加 `.fu-*` 与 `.hw-*` 样式。
- 26 天计划：11/23–12/18 学习，12/19 考试；最后 3 天只复习；今日 10 新词。

### 关键修复

| 问题 | 根因 | 修复 |
| --- | --- | --- |
| 词卡评分按钮点了没反应 | `onBodyClick` 只处理 `[data-act]` | 开头加 `[data-grade]` 分支，调 `sessionGrade()` |
| 手写“看答案”重绘丢笔迹 | 整块重渲染 | 只切换 `#fu-hw-answer` 的 `hidden` |
| 阅读选项重渲染丢答案 | 选择后整页重绘 | `onBodyChange` 捕获 `fu-lq-*` / `fu-rq-*` |
| 写译自评输入跑到下一行 | 布局 | 输入与保存按钮同一行 |
| `go('sprint')` 不跳转 | 直接改 hash 与路由不同步 | 改走 `StudyHub.app.navigate('sprint')` |
| app.css 注释乱码 | 两处 GBK 字节 | 转 UTF-8 |

### 验证

- 数据：196 词唯一、阅读 3、听力 4、写译 4/4、冲刺 223 唯一。
- CDP：10 词卡→小结→“再背不会的 4 张”；手写 491 像素；阅读 5/5；听力 2/2；写作手写 351 像素、保存 12 分并刷新持久；390px 无溢出；无 console error。
- 明确说明：PDF 无完整真题原卷，听力/阅读为仿真；手写检测为自评，不是 OCR。

---

## 0.4 公网单文件（2026-11-23）

### 目标

用户要一个可直接打开/分享的网址。

### 方案对比

| 方案 | 结果 |
| --- | --- |
| HTMLSave | index 限 30,000 字符、其它 15,000；免费站 24h 不活跃删除；本应用 CSS/JS 超限，放弃 |
| Netlify 匿名 API | `POST /api/v1/sites` 401；Drop 只能匿名、1 小时、带密码，不适合交付 |
| html.cafe | 单 HTML、无需登录、永久链接、10MB；采用 |

### 做了什么

- `.work/build-single.js` 把 CSS 与 30 个脚本内联，生成 `studyhub-single.html`（当时 462 KB）。
- 上传 html.cafe，公开地址 `https://html.cafe/xe2160dd0`。
- 用全新 Edge profile 验证：全套/冲刺可开、390px 无溢出、localStorage 可写、无 console error。
- 生成 `公开网址二维码.png`、`公开网址.txt`。
- 备注：html.cafe 会追加自己的 analytics；不提供目录/子路径，所有资源必须在一个 HTML 内；单文件版没有服务端同步。

### 用户反馈

用户实测子路径（`sprint.js`、`data/cet4.js` 等）全部 404，指出“整个网站就是一个单 HTML 文件，线上没有任何目录结构”。这促成了 0.5 的后端与工程化需求。

---

## 0.5 后端持久化 + 跨浏览器听力（2026-11-24）

### 目标

1. 不再只是纯前端：数据要能存到服务端，刷新/换设备不丢。
2. 补齐项目基础配置、计划书、内核、迭代记录。
3. 修复听力只适配一个浏览器的问题。

### 5.1 服务端

新增：

```text
server/config.js   环境变量/路径/限额
server/db.js       SQLite schema、进度、历史
server/backup.js   VACUUM INTO 备份/清理
server/static.js   静态文件/Range/防穿越
server/api.js      REST API/CORS/校验
server/index.js    HTTP 服务/日志/优雅退出
```

- Node ≥ 22.9，内置 `node:sqlite`，零第三方依赖。
- 默认 `127.0.0.1:8787`；数据库 `server/data/studyhub.db`；备份 `server/backups/`。
- 表：`progress`、`progress_history`；每次写入递增 `rev`，历史保留 50 版。
- API：health/stats/progress/history/export/restore；`baseRev` 冲突返回 409。
- 启动、每 24h、退出前备份；保留 14 份。
- 新增 `package.json`、`.env.example`、`.gitignore`、`.editorconfig`。

### 5.2 同步层

- `store.js` 增加 `snapshot()` / `replace()`，并在 `set/remove` 后派发 `studyhub:store`。
- 新增 `sync.js`：同步码（32 位）、API 地址、pull/push/冲突/恢复/强制覆盖。
- `index.html` 顶部加 `#syncState`；设置页加“云端同步”卡；`app.js` boot 调 `sync.init()`。
- 单文件构建默认移除 `sync.js`，避免 https 静态页请求 `http://127.0.0.1`。

### 5.3 跨浏览器听力

- 原实现：`speechSynthesis` 把整段脚本拼成一句，依赖系统语音包；换浏览器/系统可能没声音。
- 新实现：`scripts/build-listening-audio.mjs` 用 edge-tts 逐句生成 25 个 MP3（Guy/Aria，-5%），内联到 `data/cet4-listening-audio.js`（约 992 KB）。
- `full.js` 改为隐藏 `<audio id="fu-audio-el">`，逐句播放，支持上一句/下一句/重播/0.75–1.5 倍速/显示原文。
- `data/cet4-listening.js` 的 `meta.note` 改为“逐句 MP3，不依赖系统语音包”。

### 5.4 关键 bug 与修复

| 问题 | 根因 | 修复 |
| --- | --- | --- |
| `store.snapshot is not a function` | `store.js` 定义了函数但没挂到 `StudyHub.store` | 补 `snapshot` / `replace` 导出 |
| 每次打开都无限刷新 | `pull` 用 `serverTime >= localTime`，云端和本地时间相同也 reload | 改严格 `>` |
| 测试 3/4 失败 | 断言 `/local-first/i`，sync.js 是中文注释 | 改为 `/本地优先/` |
| 听力只适配一个浏览器 | `speechSynthesis` + 系统语音包 | 预生成 MP3 + `<audio>` |
| favicon 404 | 没有图标 | index.html 加 data URI SVG favicon；另补根目录 `favicon.ico` |
| 首次 `/api/progress` 404 | 新档案尚未创建 | 预期；pull 404 时自动 push 创建 |

### 5.5 验证

- `npm.cmd test`：4/4 通过（健康/静态、进度/冲突/历史、校验/穿越、备份）。
- `node --check`：`full.js`、`sync.js`、`settings.js`、`app.js` 等通过。
- 服务端冒烟：`/api/health` 200；PUT rev=1；GET 一致；`/` 200；备份 24,576 bytes。
- CDP：初次“已同步”；写 `syncTest` 后 1.2s 上传，服务端 rev=2；刷新后仍在；音频 `readyState=4`、`paused=false`、下一句 2/6、倍速 1.5 生效；设置页同步卡正常。
- 第二个浏览器 Chrome 141（headless，CDP 9226）：`canPlayType('audio/mpeg')` 非空；`#fu-audio-el` 存在、`paused=false`、`readyState=4`、`duration=3.744`；下一句 2/6；倍速 1.5。证明不只是 Edge 能播。
- 390px 无横向溢出。首次访问 `/api/progress/:id` 会 404（新档案尚未创建），属预期；不是 JS 错误。

### 5.6 工程化

- 新增 `scripts/check-syntax.mjs`、`scripts/make-single.mjs`。
- 新增 `tests/server.test.js`。
- 新增 `README.md`、`docs/PROJECT_PLAN.md`、`docs/KERNEL.md`、`docs/ITERATIONS.md`（本文）。

### 5.7 公开预览更新（2026-11-24）

- 重新生成单文件：1,464.8 KB、31 个脚本，默认移除 `sync.js`；听力为 25 句 MP3。
- 上传 html.cafe 新地址：<https://html.cafe/xddd1d469>；旧的 `https://html.cafe/xe2160dd0` 仍是 0.4 版，已被新地址取代。
- 390px 验证：音频 `readyState=4`、`paused=false`、时长 3.744s、第 1/6 句；无 JS 报错。页面里的 2 个外部 script 是 html.cafe 自己注入的 analytics，不是应用依赖。
- 同步更新 `公开网址.txt` 与 `公开网址二维码.png`。

### 5.8 键盘输入替代手写板（2026-11-24）

- 用户澄清：“手写”指手动打字，不是用鼠标/触屏书写；要求电脑和手机都能用。
- 词汇“手写检测”改为“打字检测”：`#fu-dict-input` 输入英文，回车或“检查”自动比对答案；答错显示正确答案；`dict-reveal` 看答案，`dict-next` 下一题；结果计入小结。
- 写译“手写板”改为 `textarea#fu-answer`：显示词数/字符数，输入后 350ms 防抖把草稿写入 `S.answers`；保存时把 `text`/`words` 一并写入 `S.done`，刷新或重进可恢复。
- 移除 `full.js` 的 `handwriting` 依赖与 `handwriting.js` 加载；`index.html` 不再加载旧手写板；旧文件保留但不再使用。
- `data/cet4-write.js` 标题改为“键盘作答”；README/PROJECT_PLAN/KERNEL 同步更新。
- 验证：CDP 9227 输入正确/错误答案、回车检查、下一题；写译输入 24 词→草稿落盘→保存 12 分→刷新恢复；390px `scrollWidth=390` 无横向溢出。

### 5.9 公开预览更新到 0.5.1（2026-11-24）

- 重新构建单文件：1,461.6 KB、30 个脚本（不再加载 `handwriting.js`），键盘输入版。
- 上传 html.cafe 新地址：<https://html.cafe/x0e2050ae>；旧的 `xddd1d469` 仍是 0.5.0，已被新地址取代。
- 同步更新 `公开网址.txt` 与 `公开网址二维码.png`。

---

## 0.6.0 六级轨道 + 自选目标日期（2026-11-24）

### 目标

用户提供 `E:\学习资料\英语资料\整理版\六级\`，要求做一份可自由替换的六级版本，并让用户自己选目标学习日期，而不是把计划写死在四六级考试当天。

### 做了什么

- 新增六级数据：196 词、3 套阅读、4 套听力（27 句 MP3）、4 篇写作 + 4 篇翻译、223 条冲刺卡；`data/cet6.js` 的翻译词卡直接复用 `cet6Vocab`，避免重复维护。
- 新增 `assets/js/tracks.js`：`cet4` / `cet6` 两个轨道，各自带 `data/vocab/reading/listening/audio/write`。
- `full.js` / `sprint.js` 改为按当前轨道取数；进度键隔离：`full` / `full.cet6`、`sprint` / `sprint.cet6`。
- 设置页增加“备考方向”和“目标学习日期”；`examDate` 改为仅记录。
- 计划表不再写死 26 天/12 月 19 日，而是按 `targetDate` 生成基础/强化/冲刺三段。
- `scripts/build-listening-audio.mjs` 支持 `cet4` / `cet6` 参数；六级 27 句 MP3 已生成。

### 修过的坑

- `full.js` 的 `audioLines()` 仍硬编码 `cet4ListeningAudio`，切六级会播四级音频；已改为 `TRACK.audio`。
- `sprint.js` 里重复声明 `var TRACK_NAME`，后一次覆盖前一次，导致六级标题变四级；已拆成 `TRACK_NAME` 与 `SECTION_NAME`。
- `cet6.js` 的翻译词卡依赖 `cet6Vocab`，`index.html` 必须先加载 `cet6-vocab.js` 再加载 `cet6.js`。

### 验证

- `npm.cmd run check`：51 个文件，0 失败。
- `npm.cmd test`：4/4。
- `node .work/cdp-cet6.mjs`：`DATA OK`（223/78/145/196/3/4）、`PLAN OK`（26 天、三段）、`DICT6 OK`、`SPRINT OK`（223 卡）、`AUDIO OK`（data URI、第 1/7 句）、`CET4 OK`（切回四级）、`MOBILE OK`（390px）、无 console error。
- 单文件 2643.1 KB、38 个内联脚本、sync 已移除。

---

## 0.6.1 意见反馈（2026-11-24）

### 目标

用户希望在设置页直接提交意见反馈，并确认“学习进度”和“代码改动”是否会自动同步到网站。

### 做了什么

- 设置页新增“意见反馈”卡：类型（功能异常/内容纠错/功能建议/其他）、内容 5–2000 字、可选联系方式；支持复制反馈内容。
- 新增 `assets/js/feedback.js`：GitHub Pages 走 Supabase `feedback` 表；本机 8787 走 `POST /api/feedback`；失败时写入 `studyhub.feedback.pending`，可重试。
- Supabase `public.feedback` 表：匿名/登录用户只能 insert，不开放 select；维护者在 Table Editor 查看。
- 本机 SQLite 新增 `feedback` 表；服务端新增 `POST /api/feedback`（5–2000 字、四类、10 次/10 分钟限流）。
- 版本号 0.6.1；测试新增匿名反馈写入与字段校验。

### 同步边界（答复用户）

- 学习进度：GitHub Pages 通过 Supabase 自动同步；本机 8787 用 SQLite，不会自动进 Supabase。
- 代码/内容改动：不会自动上线；需要提交并 push 到 GitHub，Pages 才会更新。
- 反馈：公网写 Supabase 表；本机写 SQLite；网络失败留在本机。

### 验证

- `npm.cmd run check`：52 个文件，0 失败。
- `npm.cmd test`：5/5（新增反馈测试）。
- CDP：设置页提交反馈成功，`#fbMsg` 显示“已提交，谢谢！”，服务端 `feedbackRows` 增加。
- Supabase REST 匿名 insert 返回 201。

---

## 已知问题 / 待办

| 优先级 | 事项 | 说明 |
| --- | --- | --- |
| 高 | Firefox/Safari 实机听力 | 已实测 Edge + Chrome（Chromium 141）；Firefox/Safari 未实机，MP3 理论兼容 |
| 高 | 校园 DNS | 本机校园 DNS 无法解析 `*.github.io` / `*.supabase.co`；需改 223.5.5.5 / 119.29.29.29 或用手机流量 |
| 中 | PWA | 无 manifest/service worker，手机不能“添加到主屏” |
| 中 | 数据加密 | SQLite/备份未加密；同步码泄露=进度泄露 |
| 中 | 真题版权 | 当前为仿真题；引入真题需合法来源 |
| 低 | 单文件体积 | 0.6.1 约 2.65 MB（两套音频占大头）；可改外链/压缩 |
| 低 | 同步并发 | 基于 `rev` 的乐观锁；多设备同时写会 409，需手工选边 |

---

## 复现命令

```powershell
npm.cmd test
npm.cmd run check
npm.cmd start
# 另开一个窗口
curl.exe http://127.0.0.1:8787/api/health
npm.cmd run backup
npm.cmd run single
```

---

## 经验教训

1. **先小步交付，再扩展**：一次性生成太多内容容易中断；0.3 之后改成“数据/视图/样式/测试”分步。
2. **静态托管要认清边界**：html.cafe 只托管一个 HTML，不要承诺目录结构；需要服务端就单独部署。
3. **同步必须有防回环**：`>=` 与 `replace` 事件都可能造成刷新/重复上传；`applying` 与严格比较是必需的。
4. **跨浏览器能力不要赌系统组件**：语音、字体、剪贴板都可能因环境不同；能预生成就预生成。
5. **测试要测行为，不只测文件存在**：409、历史、恢复、目录穿越都值得进测试。