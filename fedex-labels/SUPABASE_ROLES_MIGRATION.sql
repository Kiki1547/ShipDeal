-- 1. Add role to profiles table (auto-created from auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'customer'
    check (role in ('customer', 'reseller', 'admin')),
  created_at timestamptz default now() not null
);

-- 2. Auto-create profile on signup
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

-- 3. Add assigned_to column to orders
alter table public.orders
  add column if not exists assigned_to uuid references public.profiles(id) on delete set null;

create index if not exists orders_assigned_to_idx on public.orders(assigned_to);

-- 4. RLS on profiles
alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Admin & reseller can view all profiles (via service role in API)
create policy "Service role full access profiles"
  on public.profiles for all
  using (true);

-- 5. Make yourself admin — REPLACE with your actual user ID from Supabase Auth
-- Run this separately after checking your user ID:
-- update public.profiles set role = 'admin' where email = 'ton@email.com';
