-- ─────────────────────────────────────────────────────────────────────────────
-- Page Views tracking table — Merlin Analytics
-- Run once in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists page_views (
  id          uuid        default gen_random_uuid() primary key,
  path        text        not null,
  session_id  text,
  referrer    text,
  created_at  timestamptz default now()
);

-- Indexes for fast dashboard queries
create index if not exists idx_page_views_created_at on page_views (created_at desc);
create index if not exists idx_page_views_path       on page_views (path);
create index if not exists idx_page_views_session    on page_views (session_id);

-- Allow anonymous inserts (public users visiting the site)
alter table page_views enable row level security;

create policy "anyone can insert page views"
  on page_views for insert
  with check (true);

create policy "service role can select page views"
  on page_views for select
  using (true);
