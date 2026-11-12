-- MANUAL SECURITY CUTOVER -- DO NOT ADD THIS FILE TO supabase/migrations.
-- ONLY run from the Supabase SQL editor after verified backup and owner membership.
-- This script blocks anonymous access to all public.vt_* application tables.
-- It intentionally leaves public.products and unrelated project tables unchanged.
-- If there is no verified owner membership, it aborts without changing policies.

do $cutover$
declare
 rec record;
 pol record;
begin
 if not exists (
  select 1 from public.vt_workspace_members where role = 'Owner'
 ) then
  raise exception 'Security cutover aborted: add a verified Owner to vt_workspace_members first.';
 end if;

 for rec in
  select tablename from pg_tables
  where schemaname = 'public'
    and tablename like 'vt_%'
    and tablename <> 'vt_workspace_members'
 loop
  execute format('alter table public.%I enable row level security', rec.tablename);

  for pol in
   select policyname from pg_policies
   where schemaname = 'public' and tablename = rec.tablename
  loop
   execute format('drop policy if exists %I on public.%I', pol.policyname, rec.tablename);
  end loop;

  execute format('revoke all on table public.%I from anon', rec.tablename);
  execute format('grant select, insert, update, delete on table public.%I to authenticated', rec.tablename);
  execute format(
   'create policy %I on public.%I for all to authenticated using (public.vt_has_workspace_access()) with check (public.vt_has_workspace_access())',
   'vinay authenticated members', rec.tablename
  );
 end loop;

 raise notice 'Workspace membership policies applied; verify access with owner and anonymous test clients.';
end
$cutover$;

-- Verify manually, then use the application to read a saved purchase.
select tablename, policyname, roles
from pg_policies
where schemaname = 'public' and tablename like 'vt_%'
order by tablename, policyname;
