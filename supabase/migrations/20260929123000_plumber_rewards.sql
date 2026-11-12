alter table if exists public.vt_plumbers add column if not exists reward_rate numeric(5,2) not null default 0;
alter table if exists public.vt_plumbers add column if not exists reward_balance numeric(14,2) not null default 0;
alter table if exists public.vt_plumbers add column if not exists reward_paid numeric(14,2) not null default 0;
