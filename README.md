# 学习舱 StudyHub

一个**本地优先**的四/六级复习应用：可选四级 CET-4 / 六级 CET-6，按自选目标日期生成逐日计划，196 个高频词、听力/阅读/写作/翻译练习、键盘作答与自评、作文翻译冲刺库，以及可选的 SQLite 本地服务端 / Supabase 云端同步。

没有构建步骤，没有前端依赖。直接打开 `index.html` 就能用；启动 `server/` 后，同一份进度会额外保存到服务端 SQLite；部署到 GitHub Pages 后，同一份进度会自动同步到 Supabase，换设备输入同步码即可恢复。

固定公网地址：<https://zsnmz.github.io/StudyHub/>

---

## 1. 现在有什么

| 模块 | 内容 |
| --- | --- |
| 设置 | 备考方向（四级/六级，进度分开保存）、目标学习日期（不必等于考试日）、考试日期仅记录 |
| 全套 · 今日 | 距目标天数、今日新词/复习/练习任务、完成百分比 |
| 全套 · 高频词 | 196 个当前方向高频词（四级/六级各自一套），闪卡、拼写检测、打字默写检测、SRS 间隔 `0/1/2/4/7/15/30` 天 |
| 全套 · 听力 | 4 套短对话、逐句 MP3（edge-tts 生成、内联 data URI），支持上一句/下一句/重播/0.75–1.5 倍速/显示原文 |
| 全套 · 阅读 | 3 套仿真阅读，每套 5 题，选择后即时判分并给出解释 |
| 全套 · 写译 | 4 篇写作 + 4 篇翻译，30/15 分钟计时、键盘作答、草稿自动保存、范文/关键点、0–15 自评 |
| 全套 · 计划 | 从今天到目标日期的逐日排期，最后 3 天只复习；换目标日期后重新分配 |
| 冲刺 | 223 条作文/翻译高频内容（四/六级各一套），闪卡、10 题检测、错题本、7 天柱、冲刺日历 |
| 反馈 | 设置页提交功能异常/内容纠错/功能建议；公网写 Supabase，本机写 SQLite，失败可本机待发 |
| 数据 | localStorage 本地保存；可选服务端 SQLite 或 Supabase 云端同步；JSON 导入导出；服务端历史版本与备份 |

> 说明：PDF 里没有完整真题原卷。听力/阅读是按四/六级题型编写的**仿真练习**，不冒充官方真题；词汇打字检测会自动比对答案，写译作答保存文本，不做 OCR 识别。四级/六级的历史进度分别存在 `full` / `full.cet6` 与 `sprint` / `sprint.cet6`，切换方向不会互相覆盖。

---

## 2. 三种打开方式

### A. 直接打开（最简单，只保存在本机浏览器）

双击 `E:\学习舱StudyHub\index.html`。

如果被记事本打开：右键 → 打开方式 → Microsoft Edge / Chrome。

地址形如：

```text
file:///E:/学习舱StudyHub/index.html
```

### B. 启动服务端（推荐，数据同时写入 SQLite）

在本目录打开 PowerShell：

```powershell
npm.cmd start
```

然后访问：

```text
http://127.0.0.1:8787
```

- 首次启动会自动建库：`server/data/studyhub.db`
- 每 24 小时自动备份到 `server/backups/`，保留 14 份
- 页面右上角会显示“已同步 / 本地保存 / 离线本地”
- 同一台电脑上，`file://` 打开时默认也会尝试连 `http://127.0.0.1:8787/api`

> Windows 上如果 `npm start` 被 PowerShell 执行策略拦住，用 `npm.cmd start`。

### C. 单文件版（分享、静态托管）

```powershell
npm.cmd run single
```

生成 `studyhub-single.html`，CSS/JS/音频全部内联，可直接发给别人或上传到静态托管。

固定公网地址：<https://zsnmz.github.io/StudyHub/>（GitHub Pages + Supabase；首次打开会自动创建同步码，换设备用「设置 → 云端同步」输入同步码即可恢复）。

注意：单文件版默认**移除 sync.js**，只使用浏览器 localStorage，不会请求本机 8787；需要同步时用 A/B 方式的完整目录。

### D. GitHub Pages + Supabase（固定公网网址，云端保存）

适合“链接固定、换设备还能继续、更新内容自动上线”的用法（详细步骤见 [`docs/DEPLOY.md`](docs/DEPLOY.md)）：

1. 把本目录推到 GitHub 仓库（`main` 分支）。
2. 仓库 **Settings → Pages**：Source 选 `Deploy from a branch`，Branch 选 `main` / `/(root)`。
3. 打开 `https://<用户名>.github.io/<仓库名>/`。
4. 云端数据库：在 Supabase 项目 SQL Editor 运行 [`supabase/schema.sql`](supabase/schema.sql)。
5. 把 `data/supabase.js` 里的 `supabaseUrl` / `supabaseKey` 换成自己的项目（当前文件已填入 `zsnmz/StudyHub` 用的项目）。
6. 页面右上角显示“已同步”即成功。

同步码就是档案钥匙：设置 → 云端同步 → 复制同步码；换电脑/手机时，在同一位置输入这串码，点“使用这个同步码”，就会拉取云端进度。

> 校园网若解析不了 `*.supabase.co`，可把系统 DNS 改为 `223.5.5.5` / `119.29.29.29`，或在浏览器开启“安全 DNS”。公共网络一般不需要改。

---

## 3. 数据保存在哪里

### 浏览器本地

- localStorage 键前缀：`studyhub.v1.`
- 真实档案：`studyhub.v1.real.*`
- 演示档案：`studyhub.v1.demo.*`
- 同步码：`studyhub.sync.id`（32 位随机串，等同于档案密码）
- 同步服务器：`studyhub.sync.api`
- 同步元数据：`studyhub.sync.meta`

### 服务端

- 数据库：`server/data/studyhub.db`（WAL 模式）
- 自动备份：`server/backups/studyhub-<时间>.db`
- 每个档案保留最近 50 个历史版本
- 手动备份：`npm.cmd run backup`

### Supabase 云端（GitHub Pages）

- 项目地址与 publishable key：`data/supabase.js`（公开信息，不是 service_role）
- 数据表：`studyhub_progress`、`studyhub_history`
- 只开放两个 RPC：`studyhub_get(p_code)`、`studyhub_save(p_code, p_data, p_base_rev, p_force)`
- 同步码：`studyhub.sync.id`（32 位随机串，等同于档案密码）
- 页面每 1.2 秒防抖上传；冲突时在设置页选择保留哪边
- 换设备：设置 → 云端同步 → 粘贴同步码 → 使用这个同步码

### 意见反馈

- 设置 → 意见反馈：类型、内容（5–2000 字）、可选联系方式。
- GitHub Pages 公开站直接写入 Supabase `feedback` 表；本机 8787 写入 SQLite `feedback` 表。
- Supabase 的 `feedback` 表只允许匿名 insert，不开放 select；维护者在 Table Editor 查看。
- 网络不通时反馈先存在浏览器 `studyhub.feedback.pending`，可在设置页重试。
- 代码/内容改动不会自动上线：需要 `git push` 到 GitHub，Pages 才会更新；学习进度才会通过 Supabase 自动同步。

### 不会丢的三层保护

1. 每次操作先写 localStorage；
2. 联网时 1.2 秒防抖自动上传云端（SQLite 或 Supabase）；
3. 服务端每天自动 `VACUUM INTO` 备份；Supabase 保留最近 50 个历史版本。

仍然建议定期在「设置 → 数据 → 导出 JSON」做一份手动备份。

---

## 4. 常用命令

```powershell
npm.cmd start          # 启动服务端，默认 http://127.0.0.1:8787
npm.cmd run dev        # 文件变动自动重启（node --watch）
npm.cmd test           # 服务端 API / 数据库测试
npm.cmd run check      # 全项目 JS 语法检查
npm.cmd run backup     # 立即备份数据库
npm.cmd run audio      # 重新生成四级听力 MP3 与 data URI（需 Python + edge-tts）
node scripts/build-listening-audio.mjs cet6   # 重新生成六级听力
npm.cmd run single     # 生成 studyhub-single.html
```

环境要求：Node.js ≥ 22.9（使用内置 `node:sqlite` 与 `--env-file-if-exists`，无第三方后端依赖）。

---

## 5. 目录结构

```text
学习舱StudyHub/
├─ index.html                 入口，按顺序加载脚本
├─ favicon.ico                站点图标
├─ assets/
│  ├─ css/app.css             全部样式
│  ├─ js/
│  │  ├─ store.js             localStorage 读写 / 快照 / 替换
│  │  ├─ sync.js              本地优先同步层（可选）
│  │  ├─ core.js              日期、设置、任务、草稿、会话
│  │  ├─ learn.js             背词 SRS、错题本、成果
│  │  ├─ timer.js             计时引擎
│  │  ├─ parser.js            本地规则解析
│  │  ├─ app.js               外壳、hash 路由、常驻计时条

│  │  └─ views/               各页面视图
│  └─ audio/listening/        四级 25 句 MP3（源文件）
│  └─ audio/listening6/       六级 27 句 MP3（源文件）
├─ data/                      词表、题库、冲刺库、听力/阅读/写译数据
├─ server/                    Node HTTP + SQLite 服务端
├─ scripts/                   音频生成、语法检查、单文件打包
├─ tests/                     服务端测试
├─ docs/                      计划书 / 内核 / 迭代记录
├─ server/data/               SQLite 数据库（运行时生成）
└─ server/backups/            自动备份（运行时生成）
```

---

## 6. 文档

- [项目计划书](docs/PROJECT_PLAN.md)：目标、范围、里程碑、风险、验收
- [项目内核](docs/KERNEL.md)：模块边界、数据流、同步协议、API、数据库、扩展点
- [迭代记录](docs/ITERATIONS.md)：每个版本做了什么、修过什么、怎么验证

---

## 7. 已知限制

- 服务端默认只监听 `127.0.0.1`，没有账号体系；同步码就是密码，泄露等于泄露进度。
- 服务端 CORS 默认 `*`，仅适合本机/可信内网；公网部署请设置 `CORS_ORIGIN`、加 HTTPS 和反向代理。
- 单文件版没有服务端，换浏览器/清站点数据后进度不会自动跟着走，需导出/导入 JSON。
- 听力音频为内联 data URI，单文件版体积约 1.5 MB；对静态托管足够，但不适合极慢网络。
- 阅读/听力/写译为仿真练习，不是官方真题；写译用键盘输入，不做笔迹识别。
- 题目和词表是静态数据，更新内容需要改 `data/*.js`。