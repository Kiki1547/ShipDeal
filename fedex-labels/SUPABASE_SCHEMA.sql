-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Orders table
create table if not exists public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  weight_kg numeric(6,3) not null check (weight_kg > 0 and weight_kg <= 30),
  price_usd numeric(6,2) not null,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'paid', 'label_ready', 'cancelled')),
  stripe_session_id text,
  label_url text,
  recipient_name text not null,
  recipient_address text not null,
  recipient_city text not null,
  recipient_country text not null,
  recipient_zip text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger orders_updated_at
  before update on public.orders
  for each row execute function update_updated_at();

-- RLS Policies
alter table public.orders enable row level security;

-- Users can only see their own orders
create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

-- Users can insert their own orders (server-side creates via service role)
create policy "Service role can insert orders"
  on public.orders for insert
  with check (true); -- Enforced at API level

-- Service role can update orders (for webhook + admin)
create policy "Service role can update orders"
  on public.orders for update
  using (true);

-- Index for performance
create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_stripe_session_idx on public.orders(stripe_session_id);
