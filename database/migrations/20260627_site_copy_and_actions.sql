-- ── site_copy ────────────────────────────────────────────────────────────────
-- AI-writable key/value store for all live copy on the site.
-- React components read from here and fall back to compiled defaults.
-- The AI growth loop writes here autonomously; every write is logged.

create table if not exists site_copy (
  key            text primary key,
  value          text    not null,
  previous_value text,                       -- always saved for one-click rollback
  updated_at     timestamptz not null default now(),
  updated_by     text not null default 'human', -- 'human' | 'ai-growth-loop'
  rationale      text                        -- why the AI made this change
);

-- Seed with current hardcoded defaults so rollback always has a baseline
insert into site_copy (key, value, updated_by, rationale) values
  ('hero_headline_prefix',  'Reduce Utility Risk',                              'human', 'initial'),
  ('hero_accent_lines',     '["Through Energy Stacking.","Into an Energy Strategy.","Before Utility Risk Hits Growth."]', 'human', 'initial'),
  ('hero_subtext',          'Merlin compares utility power, storage, solar, generators, and flexible loads to recommend the right energy architecture for your business.', 'human', 'initial'),
  ('hero_badge_text',       'Independent B2B Energy Intelligence',              'human', 'initial'),
  ('hero_proof_items',      '["Free & Instant","No Utility Login Required","CFO-Ready Report"]', 'human', 'initial'),
  ('modal_headline',        'Get your free energy analysis',                    'human', 'initial'),
  ('modal_subtext',         'See how much you could save on your energy bill.', 'human', 'initial'),
  ('modal_cta_text',        'Get My Free Analysis',                             'human', 'initial'),
  ('nav_cta_text',          'Get Started',                                      'human', 'initial'),
  ('hero_cta_primary',      'Get Your Free Energy Report',                      'human', 'initial'),
  ('hero_cta_secondary',    'See How It Works',                                 'human', 'initial')
on conflict (key) do nothing;

-- RLS: service role writes; anon/authenticated can read
alter table site_copy enable row level security;

create policy "anon read site_copy"  on site_copy for select using (true);
create policy "service write site_copy" on site_copy for all using (true) with check (true);

-- ── growth_actions ────────────────────────────────────────────────────────────
-- Append-only log of every autonomous action the AI growth loop takes.
-- Used for the admin rollback UI and weekly digest email.

create table if not exists growth_actions (
  id              uuid primary key default gen_random_uuid(),
  ran_at          timestamptz not null default now(),
  copy_key        text not null,
  old_value       text,
  new_value       text not null,
  rationale       text,
  rolled_back     boolean not null default false,
  rolled_back_at  timestamptz,
  report_id       uuid references growth_reports(id) on delete set null
);

alter table growth_actions enable row level security;
create policy "service full growth_actions" on growth_actions using (true) with check (true);

create index if not exists growth_actions_ran_at_idx on growth_actions (ran_at desc);
create index if not exists growth_actions_key_idx    on growth_actions (copy_key);
