-- StudyHub 意见反馈表（在已有项目上单独运行一次即可）
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  category text not null default 'other',
  message text not null,
  contact text,
  page text,
  track text,
  app_version text,
  sync_id text,
  user_agent text,
  constraint feedback_message_len check (char_length(message) between 5 and 2000),
  constraint feedback_category_chk check (category in ('bug', 'content', 'feature', 'other'))
);

alter table public.feedback enable row level security;

drop policy if exists "feedback_insert_anon" on public.feedback;
create policy "feedback_insert_anon" on public.feedback
  for insert to anon, authenticated
  with check (char_length(message) between 5 and 2000);

grant insert on public.feedback to anon, authenticated;