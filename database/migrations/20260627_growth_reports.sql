-- Migration: growth_reports table
-- Stores output of the AI growth loop agent (agents/growth-loop.ts).
-- Run once in Supabase SQL editor.

create table if not exists growth_reports (
  id              uuid primary key default gen_random_uuid(),
  ran_at          timestamptz not null default now(),
  site_health_score integer,
  failed_routes   jsonb,
  total_users     integer,
  total_quotes    integer,
  friction_signals jsonb,
  market_headlines jsonb,
  growth_brief    text,
  raw             jsonb,
  created_at      timestamptz not null default now()
);

-- Only admins / service role can read/write
alter table growth_reports enable row level security;

create policy "service role full access" on growth_reports
  using (true)
  with check (true);

-- Index for fetching latest reports
create index if not exists growth_reports_ran_at_idx on growth_reports (ran_at desc);
