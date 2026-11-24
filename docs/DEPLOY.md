# 部署：GitHub Pages + Supabase

目标：固定公网地址、换设备能继续、更新代码后自动上线。

## 1. 静态站（GitHub Pages）

1. 仓库：`https://github.com/zsnmz/StudyHub`
2. 把本目录推到 `main` 分支（不要提交 `server/data/`、`.work/`、`.env`）。
3. 仓库 **Settings → Pages**：
   - Source：`Deploy from a branch`
   - Branch：`main`，目录 `/ (root)`
4. 地址：`https://zsnmz.github.io/StudyHub/`
5. 更新内容：本地改完 → 提交 → 推送，Pages 会自动重新发布。

## 2. 云端数据（Supabase）

1. 项目：`bheonzqtihbvjvrviodf`（Auto 区域）
2. SQL Editor 运行 [`../supabase/schema.sql`](../supabase/schema.sql)
3. 把 Project URL 与 publishable key 写入 [`../data/supabase.js`](../data/supabase.js)
4. 表：`studyhub_progress`、`studyhub_history`；RPC：`studyhub_get`、`studyhub_save`
5. 前端只拿 publishable key；**不要**把 service_role key 放进代码。

## 3. 跨设备

1. 设备 A：设置 → 云端同步 → 复制同步码。
2. 设备 B：打开同一网址 → 设置 → 云端同步 → 粘贴同步码 → 使用这个同步码。
3. 页面会重新加载并拉取云端进度；之后每 1.2 秒防抖自动上传。

> 同步码就是档案钥匙，谁拿到都能读写这份进度，不要公开。

## 4. 校园网 DNS

部分校园网无法解析 `*.supabase.co`（本项目实测：默认 DNS 失败，`223.5.5.5` 可解析到 Cloudflare IP）。处理方式：

- 系统 DNS 改为 `223.5.5.5` / `119.29.29.29`；或
- 浏览器开启“安全 DNS / DNS over HTTPS”；或
- 用 Cloudflare Worker 代理 Supabase（固定 `*.workers.dev` 域名），前端只连 Worker。

## 5. 本地服务端（可选）

`npm.cmd start` → `http://127.0.0.1:8787`，数据存 `server/data/studyhub.db`。本地服务端与 Supabase 二选一即可；页面在 `127.0.0.1/localhost` 时默认走本地 `/api`，在 GitHub Pages 上默认走 Supabase。