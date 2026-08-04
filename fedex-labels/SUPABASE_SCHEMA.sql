-- ============================================
-- SHIPDEAL — SCHEMA COMPLET SUPABASE
-- Exécuter dans Supabase → SQL Editor
-- ============================================

create extension if not exists "uuid-ossp";

-- Table orders
create table if not exists public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  weight_kg numeric(6,3) not null default 0 check (weight_kg >= 0 and weight_kg <= 30),
  price_usd numeric(8,2) not null,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'paid', 'label_ready', 'cancelled')),
  stripe_session_id text,
  label_url text,
  recipient_name text not null,
  recipient_address text not null default '',
  recipient_city text not null default '',
  recipient_country text not null default '',
  recipient_zip text not null default '',
  assigned_to uuid references auth.users(id) on delete set null,
  is_bulk boolean default false,
  bulk_recipients jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
  before update on public.orders
  for each row execute function update_updated_at();

alter table public.orders enable row level security;

drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

drop policy if exists "Service role can insert orders" on public.orders;
create policy "Service role can insert orders"
  on public.orders for insert
  with check (true);

drop policy if exists "Service role can update orders" on public.orders;
create policy "Service role can update orders"
  on public.orders for update
  using (true);

create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_stripe_session_idx on public.orders(stripe_session_id);
create index if not exists orders_assigned_to_idx on public.orders(assigned_to);

-- ============================================
-- Table profiles (rôles + adresse expéditeur)
-- ============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'customer'
    check (role in ('customer', 'reseller', 'admin')),
  full_name text,
  address text,
  city text,
  zip text,
  country text,
  created_at timestamptz default now() not null
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Anyone authenticated can read profiles" on public.profiles;
create policy "Anyone authenticated can read profiles"
  on public.profiles for select
  using (auth.role() = 'authenticated');

drop policy if exists "Service role full access profiles" on public.profiles;
create policy "Service role full access profiles"
  on public.profiles for all
  using (true);

-- ============================================
-- Storage bucket policies (bucket "labels" doit
-- être créé manuellement dans Storage → New bucket,
-- coché "Public")
-- ============================================
drop policy if exists "Authenticated users can upload labels" on storage.objects;
create policy "Authenticated users can upload labels"
  on storage.objects for insert
  with check (bucket_id = 'labels' AND auth.role() = 'authenticated');

drop policy if exists "Public can read labels" on storage.objects;
create policy "Public can read labels"
  on storage.objects for select
  using (bucket_id = 'labels');

-- ============================================
-- IMPORTANT: Pour te passer admin, lance ensuite :
-- update public.profiles set role = 'admin' where email = 'ton@email.com';
-- ============================================
