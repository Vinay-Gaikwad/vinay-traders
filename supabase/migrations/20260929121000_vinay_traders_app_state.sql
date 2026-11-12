create table if not exists public.vt_app_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.vt_app_state enable row level security;
drop policy if exists "vinay workspace access" on public.vt_app_state;
create policy "vinay workspace access" on public.vt_app_state
for all to anon, authenticated
using (true)
with check (true);
