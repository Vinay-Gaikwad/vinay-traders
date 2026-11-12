-- Vinay Traders production data model.
-- The vt_ prefix keeps the starter products table from the original scaffold intact.

create table if not exists public.vt_products (
  id text primary key,
  name text not null,
  brand text not null default '',
  category text not null default '',
  subcategory text,
  product_family text,
  sku text not null default '',
  barcode text not null default '',
  hsn text not null default '',
  gst numeric(5,2) not null default 0 check (gst >= 0 and gst <= 100),
  size text not null default '',
  variant text not null default '',
  attributes jsonb not null default '{}'::jsonb,
  purchase_unit text not null default 'Piece',
  sales_unit text not null default 'Piece',
  base_unit text not null default 'Piece',
  conversion_factor numeric(14,4) not null default 1 check (conversion_factor > 0),
  purchase_rate numeric(14,2) not null default 0 check (purchase_rate >= 0),
  selling_rate numeric(14,2) not null default 0 check (selling_rate >= 0),
  mrp numeric(14,2) not null default 0 check (mrp >= 0),
  minimum_selling_price numeric(14,2) not null default 0 check (minimum_selling_price >= 0),
  stock numeric(14,4) not null default 0,
  reserved numeric(14,4) not null default 0,
  reorder_level numeric(14,4) not null default 0,
  minimum_stock numeric(14,4) not null default 0,
  rack text not null default '',
  shelf text,
  warehouse text not null default '',
  supplier_id text,
  images text[] not null default '{}'::text[],
  notes text not null default '',
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  historical_source jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vt_inventory_batches (
  id text primary key,
  product_id text not null references public.vt_products(id) on delete cascade,
  batch_number text not null default '',
  date timestamptz not null default now(),
  original_purchase_qty numeric(14,4) not null default 0,
  purchase_unit text not null default 'Piece',
  conversion_factor numeric(14,4) not null default 1,
  converted_qty numeric(14,4) not null default 0,
  sales_unit text not null default 'Piece',
  sold_qty numeric(14,4) not null default 0,
  remaining_qty numeric(14,4) not null default 0,
  purchase_rate numeric(14,2) not null default 0,
  roll_number text,
  width numeric(14,4),
  length numeric(14,4),
  weight numeric(14,4),
  wastage numeric(14,4),
  created_at timestamptz not null default now()
);

create table if not exists public.vt_suppliers (
  id text primary key,
  name text not null,
  mobile text not null default '',
  gstin text not null default '',
  address text not null default '',
  balance numeric(14,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vt_customers (
  id text primary key,
  name text not null,
  mobile text not null default '',
  alternate_mobile text,
  area text not null default '',
  address text not null default '',
  delivery_address text,
  gstin text not null default '',
  type text not null default 'Regular' check (type in ('Walk-in', 'Regular', 'Business', 'Contractor')),
  opening_balance numeric(14,2) not null default 0,
  credit_limit numeric(14,2) not null default 0,
  credit_days integer not null default 0,
  plumber_id text,
  notes text not null default '',
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  balance numeric(14,2) not null default 0,
  total_purchase numeric(14,2) not null default 0,
  bills integer not null default 0,
  last_purchase timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vt_plumbers (
  id text primary key,
  name text not null,
  mobile text not null default '',
  alternate_mobile text,
  area text not null default '',
  address text not null default '',
  joined_date date,
  commission_rate numeric(5,2) not null default 0,
  bank text,
  upi text,
  notes text not null default '',
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  referral_sales numeric(14,2) not null default 0,
  commission_earned numeric(14,2) not null default 0,
  commission_paid numeric(14,2) not null default 0,
  customers integer not null default 0,
  bills integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vt_workers (
  id text primary key,
  name text not null,
  mobile text not null default '',
  address text not null default '',
  role text not null default '',
  joined_date date,
  salary_type text not null default 'Monthly Fixed' check (salary_type in ('Monthly Fixed', 'Daily Wage')),
  salary numeric(14,2) not null default 0,
  daily_wage numeric(14,2) not null default 0,
  bonus numeric(14,2) not null default 0,
  advance numeric(14,2) not null default 0,
  deduction numeric(14,2) not null default 0,
  overtime_rate numeric(14,2) not null default 0,
  bank text not null default '',
  upi text not null default '',
  adjustment_period text,
  emergency_contact text,
  dob date,
  notes text not null default '',
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vt_attendance (
  id text primary key,
  worker_id text not null references public.vt_workers(id) on delete cascade,
  date date not null,
  status text not null check (status in ('Present', 'Absent', 'Half Day', 'Paid Leave', 'Unpaid Leave', 'Weekly Off')),
  check_in time,
  check_out time,
  overtime numeric(8,2) not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (worker_id, date)
);

create table if not exists public.vt_invoices (
  id text primary key,
  number text not null unique,
  date timestamptz not null default now(),
  customer_id text,
  customer_name text not null default 'Walk-in customer',
  customer_mobile text,
  customer_address text,
  plumber_id text,
  totals jsonb not null default '{}'::jsonb,
  initial_paid numeric(14,2) not null default 0,
  payment_method text not null default 'Cash' check (payment_method in ('Cash', 'UPI', 'Card', 'Bank', 'Credit', 'Mixed')),
  payment_status text not null default 'Pending' check (payment_status in ('Paid', 'Partial', 'Pending', 'Overdue', 'Credit', 'Refunded')),
  payment_splits jsonb,
  status text not null default 'Draft' check (status in ('Draft', 'Held', 'Completed')),
  commission numeric(14,2) not null default 0,
  commission_rate numeric(5,2) not null default 0,
  commission_basis text not null default 'before-gst' check (commission_basis in ('before-gst', 'invoice-total')),
  notes text not null default '',
  created_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vt_invoice_items (
  id text primary key,
  invoice_id text not null references public.vt_invoices(id) on delete cascade,
  product_id text not null,
  name text not null default '',
  variant text not null default '',
  hsn text not null default '',
  quantity numeric(14,4) not null check (quantity > 0),
  unit text not null default 'Piece',
  rate numeric(14,2) not null default 0,
  discount numeric(5,2) not null default 0,
  gst numeric(5,2) not null default 0,
  conversion_factor numeric(14,4),
  batch_id text
);

create table if not exists public.vt_purchases (
  id text primary key,
  number text not null unique,
  date timestamptz not null default now(),
  supplier_id text not null,
  supplier_invoice text not null,
  invoice_date date not null,
  due_date date not null,
  totals jsonb not null default '{}'::jsonb,
  initial_paid numeric(14,2) not null default 0,
  payment_method text not null default 'Credit' check (payment_method in ('Cash', 'UPI', 'Card', 'Bank', 'Credit', 'Mixed')),
  payment_status text not null default 'Pending' check (payment_status in ('Paid', 'Partial', 'Pending', 'Overdue', 'Credit', 'Refunded')),
  payment_splits jsonb,
  status text not null default 'Draft' check (status in ('Draft', 'Completed')),
  notes text not null default '',
  created_by text not null default '',
  attachment_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (supplier_id, supplier_invoice)
);

create table if not exists public.vt_purchase_items (
  id text primary key,
  purchase_id text not null references public.vt_purchases(id) on delete cascade,
  product_id text not null,
  name text not null default '',
  variant text not null default '',
  hsn text not null default '',
  quantity numeric(14,4) not null check (quantity > 0),
  unit text not null default 'Piece',
  rate numeric(14,2) not null default 0,
  discount numeric(5,2) not null default 0,
  gst numeric(5,2) not null default 0,
  conversion_factor numeric(14,4),
  batch_id text
);

create table if not exists public.vt_payments (
  id text primary key,
  date date not null default current_date,
  entity_type text not null check (entity_type in ('customer', 'supplier', 'plumber', 'worker')),
  entity_id text not null,
  amount numeric(14,2) not null check (amount > 0),
  method text not null check (method in ('Cash', 'UPI', 'Card', 'Bank', 'Credit', 'Mixed')),
  reference text not null default '',
  notes text not null default '',
  kind text not null default 'Payment' check (kind in ('Payment', 'Advance', 'Bonus', 'Deduction')),
  invoice_id text,
  purchase_id text,
  period text,
  created_at timestamptz not null default now()
);

create table if not exists public.vt_payment_splits (
  id bigint generated by default as identity primary key,
  invoice_id text references public.vt_invoices(id) on delete cascade,
  purchase_id text references public.vt_purchases(id) on delete cascade,
  method text not null check (method in ('Cash', 'UPI', 'Card', 'Bank')),
  amount numeric(14,2) not null check (amount > 0),
  check ((invoice_id is not null) <> (purchase_id is not null))
);

create table if not exists public.vt_deposits (
  id text primary key,
  date date not null unique,
  expected numeric(14,2) not null default 0,
  paid numeric(14,2) not null default 0,
  status text not null default 'Skipped' check (status in ('Paid', 'Partial', 'Skipped', 'Holiday')),
  method text not null default 'UPI' check (method in ('Cash', 'UPI', 'Bank')),
  receipt text not null default '',
  notes text not null default '',
  attachment_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vt_stock_transactions (
  id text primary key,
  product_id text not null,
  date timestamptz not null default now(),
  type text not null check (type in ('Opening', 'Purchase', 'Sale', 'Sale Return', 'Purchase Return', 'Adjustment', 'Damage', 'Transfer', 'Correction')),
  reference text not null default '',
  quantity_in numeric(14,4) not null default 0,
  quantity_out numeric(14,4) not null default 0,
  balance numeric(14,4) not null default 0,
  unit text not null default 'Piece',
  location text not null default '',
  user_name text not null default '',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.vt_price_history (
  id text primary key,
  product_id text not null,
  supplier_id text not null default '',
  date timestamptz not null default now(),
  previous_purchase_rate numeric(14,2) not null default 0,
  purchase_rate numeric(14,2) not null default 0,
  previous_selling_rate numeric(14,2) not null default 0,
  selling_rate numeric(14,2) not null default 0,
  reason text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.vt_settings (
  id text primary key,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.vt_role_permissions (
  id bigint generated by default as identity primary key,
  role text not null,
  module text not null,
  can_view boolean not null default false,
  can_create boolean not null default false,
  can_edit boolean not null default false,
  can_delete boolean not null default false,
  unique (role, module)
);

create table if not exists public.vt_notifications (
  id text primary key,
  type text not null default 'info',
  title text not null,
  description text not null default '',
  date timestamptz not null default now(),
  read boolean not null default false,
  href text not null default '/',
  severity text not null default 'info' check (severity in ('info', 'warning', 'danger')),
  created_at timestamptz not null default now()
);

create index if not exists vt_products_supplier_idx on public.vt_products(supplier_id);
create index if not exists vt_products_category_idx on public.vt_products(category);
create index if not exists vt_batches_product_idx on public.vt_inventory_batches(product_id);
create index if not exists vt_attendance_worker_date_idx on public.vt_attendance(worker_id, date desc);
create index if not exists vt_invoices_date_idx on public.vt_invoices(date desc);
create index if not exists vt_invoices_customer_idx on public.vt_invoices(customer_id);
create index if not exists vt_purchases_date_idx on public.vt_purchases(date desc);
create index if not exists vt_purchases_supplier_idx on public.vt_purchases(supplier_id);
create index if not exists vt_payments_entity_idx on public.vt_payments(entity_type, entity_id, date desc);
create index if not exists vt_stock_product_date_idx on public.vt_stock_transactions(product_id, date desc);
create index if not exists vt_price_product_date_idx on public.vt_price_history(product_id, date desc);

create or replace function public.vt_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'vt_products', 'vt_suppliers', 'vt_customers', 'vt_plumbers', 'vt_workers',
    'vt_attendance', 'vt_invoices', 'vt_purchases', 'vt_deposits', 'vt_settings'
  ] loop
    execute format('drop trigger if exists %I_updated_at on public.%I', table_name, table_name);
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.vt_touch_updated_at()', table_name, table_name);
  end loop;
end
$$;

-- The UI has no sign-in screen yet, so the first connected workspace needs anon access.
-- Replace these policies with authenticated business/branch policies before public launch.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'vt_products', 'vt_inventory_batches', 'vt_suppliers', 'vt_customers', 'vt_plumbers',
    'vt_workers', 'vt_attendance', 'vt_invoices', 'vt_invoice_items', 'vt_purchases',
    'vt_purchase_items', 'vt_payments', 'vt_payment_splits', 'vt_deposits',
    'vt_stock_transactions', 'vt_price_history', 'vt_settings', 'vt_role_permissions',
    'vt_notifications'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists "vinay workspace access" on public.%I', table_name);
    execute format('create policy "vinay workspace access" on public.%I for all to anon, authenticated using (true) with check (true)', table_name);
  end loop;
end
$$;
