-- Safe preparation only: this migration does not change existing access policies.
-- IMPORTANT: apply the manual cutover in docs/security/ only AFTER:
-- 1. Creating an owner in Supabase Auth,
-- 2. Adding that user's UUID to vt_workspace_members,
-- 3. Verifying a full workspace backup,
-- 4. Checking sign-in against a staging copy.

create table if not exists public.vt_workspace_members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null default 'Staff' check (role in ('Owner', 'Manager', 'Staff')),
 created_at timestamptz not null default now()
);

alter table public.vt_workspace_members enable row level security;
revoke all on table public.vt_workspace_members from anon, authenticated;

create or replace function public.vt_has_workspace_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
 select auth.uid() is not null
 and exists (select 1 from public.vt_workspace_members m where m.user_id = auth.uid());
$$;

revoke all on function public.vt_has_workspace_access() from public;
grant execute on function public.vt_has_workspace_access() to authenticated;
