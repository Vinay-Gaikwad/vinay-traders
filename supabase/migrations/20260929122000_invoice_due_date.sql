-- Preserve a customer payment due date for invoices with outstanding balances.
alter table if exists public.vt_invoices add column if not exists due_date date;
