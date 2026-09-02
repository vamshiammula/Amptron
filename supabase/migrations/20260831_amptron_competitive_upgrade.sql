-- Amptron competitive upgrade schema
-- Includes public-site dealer discovery, authenticated dealer portal, and admin console entities.

create extension if not exists "pgcrypto";

create table if not exists public.dealer_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 80),
  email text not null unique check (char_length(email) <= 160),
  phone text not null check (char_length(phone) between 8 and 20),
  city text not null check (char_length(city) between 2 and 80),
  profile text not null check (char_length(profile) between 20 and 2000),
  status text not null default 'new' check (status in ('new', 'contacted', 'approved', 'rejected')),
  source text not null default 'website',
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists dealer_applications_created_at_idx
  on public.dealer_applications (created_at desc);

create table if not exists public.dealers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  state text not null,
  area text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.dealer_accounts (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  account_name text not null,
  role text not null default 'dealer' check (role in ('dealer', 'admin')),
  territory text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  dealer_account_id uuid not null references public.dealer_accounts(id) on delete cascade,
  model text not null,
  quantity int not null check (quantity > 0),
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  dealer_account_id uuid not null references public.dealer_accounts(id) on delete cascade,
  subject text not null,
  detail text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'closed')),
  created_at timestamptz not null default now()
);

alter table public.dealer_applications enable row level security;
alter table public.dealers enable row level security;
alter table public.dealer_accounts enable row level security;
alter table public.orders enable row level security;
alter table public.resources enable row level security;
alter table public.announcements enable row level security;
alter table public.tickets enable row level security;

drop policy if exists applications_insert_public on public.dealer_applications;
create policy applications_insert_public on public.dealer_applications
for insert to anon, authenticated
with check (true);

drop policy if exists applications_admin_read on public.dealer_applications;
create policy applications_admin_read on public.dealer_applications
for select to authenticated
using (
  exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = auth.uid() and da.role = 'admin'
  )
);

drop policy if exists dealers_public_read on public.dealers;
create policy dealers_public_read on public.dealers
for select
using (true);

drop policy if exists dealer_accounts_self_or_admin on public.dealer_accounts;
create policy dealer_accounts_self_or_admin on public.dealer_accounts
for select to authenticated
using (
  auth_user_id = auth.uid()
  or exists (
    select 1 from public.dealer_accounts da
    where da.auth_user_id = auth.uid() and da.role = 'admin'
  )
);

drop policy if exists orders_dealer_or_admin on public.orders;
create policy orders_dealer_or_admin on public.orders
for select to authenticated
using (
  dealer_account_id in (
    select id from public.dealer_accounts
    where auth_user_id = auth.uid()
  )
  or exists (
    select 1 from public.dealer_accounts da
    where da.auth_user_id = auth.uid() and da.role = 'admin'
  )
);

drop policy if exists resources_authenticated_read on public.resources;
create policy resources_authenticated_read on public.resources
for select to authenticated
using (is_active = true);

drop policy if exists announcements_authenticated_read on public.announcements;
create policy announcements_authenticated_read on public.announcements
for select to authenticated
using (true);

drop policy if exists tickets_dealer_or_admin_read on public.tickets;
create policy tickets_dealer_or_admin_read on public.tickets
for select to authenticated
using (
  dealer_account_id in (
    select id from public.dealer_accounts
    where auth_user_id = auth.uid()
  )
  or exists (
    select 1 from public.dealer_accounts da
    where da.auth_user_id = auth.uid() and da.role = 'admin'
  )
);

drop policy if exists tickets_dealer_insert on public.tickets;
create policy tickets_dealer_insert on public.tickets
for insert to authenticated
with check (
  dealer_account_id in (
    select id from public.dealer_accounts
    where auth_user_id = auth.uid()
  )
);
