# Supabase 云端同步

StudyHub 在 GitHub Pages 上不依赖自建服务器，直接用 Supabase 的两个 RPC 保存进度。

## 一次性初始化

1. 新建 Supabase 项目（Region 选 Auto 即可）。
2. SQL Editor → 粘贴 [`schema.sql`](schema.sql) 全文 → Run。
3. Project Settings → API：
   - Project URL 形如 `https://<ref>.supabase.co`
   - 复制 publishable / anon key（**不要**把 service_role key 放到前端）
4. 把这两个值填入 [`../data/supabase.js`](../data/supabase.js)。

## 数据设计

- `studyhub_progress`：每个同步码一行，`data` 为 JSONB，`rev` 每次写入 +1。
- `studyhub_history`：保留最近 50 个版本，用于排查/恢复。
- 表不直接开放给 anon；只开放 `security definer` 的 `studyhub_get` / `studyhub_save`。
- 同步码是 32 位随机串，相当于档案密码；不要公开自己的同步码。
- `feedback`：意见反馈表。只允许 anon/authenticated 插入，不开放 select；维护者在 Table Editor 查看。反馈内容 5–2000 字，类型限 bug/content/feature/other。

## 验证

在 SQL Editor 运行：

```sql
select public.studyhub_get('test-code-123');
```

返回 `{"ok": true, "exists": false, "rev": 0}` 即函数可用。