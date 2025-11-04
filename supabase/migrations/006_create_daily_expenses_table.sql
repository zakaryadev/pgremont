-- Daily Expenses table for universal daily costs
-- Creates table, indices, RLS with user ownership, and updated_at trigger

-- Extension required for gen_random_uuid() on some Postgres setups
-- (Supabase generally has it enabled by default)
create extension if not exists pgcrypto;

create table if not exists public.daily_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null,
  cash numeric not null default 0,
  click numeric not null default 0,
  transfer numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- basic sanity checks
  constraint chk_non_negative_values
    check (
      amount >= 0 and cash >= 0 and click >= 0 and transfer >= 0
    )
);

-- Make user_id nullable since we use custom auth
alter table public.daily_expenses alter column user_id drop not null;

-- Helpful indexes
create index if not exists idx_daily_expenses_user_id on public.daily_expenses(user_id);
create index if not exists idx_daily_expenses_created_at on public.daily_expenses(created_at desc);

-- Row Level Security
alter table public.daily_expenses enable row level security;

-- Policies: allow all operations (same as customer_orders, since we use custom auth)
-- Drop existing policies if they exist
drop policy if exists "daily_expenses_select_own" on public.daily_expenses;
drop policy if exists "daily_expenses_insert_own" on public.daily_expenses;
drop policy if exists "daily_expenses_update_own" on public.daily_expenses;
drop policy if exists "daily_expenses_delete_own" on public.daily_expenses;
drop policy if exists "Allow all operations on daily_expenses" on public.daily_expenses;

create policy "Allow all operations on daily_expenses" on public.daily_expenses
  for all using (true) with check (true);

-- updated_at trigger
create or replace function public.set_current_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_daily_expenses_updated_at on public.daily_expenses;
create trigger trg_daily_expenses_updated_at
before update on public.daily_expenses
for each row execute function public.set_current_timestamp();


