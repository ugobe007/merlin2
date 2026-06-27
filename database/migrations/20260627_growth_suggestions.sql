-- Growth suggestions table
-- Stores every AI-generated suggestion before it is applied.
-- Humans approve/reject in the admin panel; only approved copy changes
-- are written to site_copy. Code/design/workflow suggestions are
-- informational — the admin reads them and acts manually.

create table if not exists growth_suggestions (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  report_id     uuid references growth_reports(id) on delete set null,

  -- Category of suggestion
  type          text not null check (type in ('copy','code','design','workflow','ui','optimization')),

  -- Human-readable title and full description
  title         text not null,
  description   text not null,
  rationale     text,
  priority      text not null default 'medium' check (priority in ('high','medium','low')),

  -- For copy suggestions: the specific key/value to apply on approval
  copy_key      text,
  copy_value    text,
  copy_previous text,   -- current value before the change

  -- Review state
  status        text not null default 'pending' check (status in ('pending','approved','rejected','applied')),
  reviewed_at   timestamptz,
  reviewed_note text,   -- optional rejection reason or approval comment
  applied_at    timestamptz
);

alter table growth_suggestions enable row level security;
create policy "service full growth_suggestions" on growth_suggestions
  using (true) with check (true);

create index if not exists growth_suggestions_status_idx  on growth_suggestions (status, created_at desc);
create index if not exists growth_suggestions_type_idx    on growth_suggestions (type);
