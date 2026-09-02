-- Portal strict cutover
-- Creates isolated dealer-portal tables and resets old portal data.

create extension if not exists "pgcrypto";

create table if not exists public.dealer_orders (
  id uuid primary key default gen_random_uuid(),
  dealer_account_id uuid not null references public.dealer_accounts(id) on delete cascade,
  model text not null,
  quantity int not null check (quantity > 0),
  status text not null default 'pending' check (status in ('pending','in_dispatch','shipped','delivered','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.dealers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  state text not null,
  area text not null,
  phone text not null,
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
  status text not null default 'open' check (status in ('open','in_progress','closed')),
  created_at timestamptz not null default now()
);

-- Clear legacy portal content so only new schema data remains.
truncate table public.dealer_orders restart identity;
truncate table public.dealers restart identity;
truncate table public.resources restart identity;
truncate table public.announcements restart identity;
truncate table public.tickets restart identity;

alter table public.dealer_applications enable row level security;
alter table public.dealer_accounts enable row level security;
alter table public.dealer_orders enable row level security;
alter table public.dealers enable row level security;
alter table public.resources enable row level security;
alter table public.announcements enable row level security;
alter table public.tickets enable row level security;

drop policy if exists dealer_applications_insert_public on public.dealer_applications;
drop policy if exists applications_insert_public on public.dealer_applications;
create policy dealer_applications_insert_public
on public.dealer_applications
for insert to anon, authenticated
with check (true);

drop policy if exists dealer_applications_admin_select on public.dealer_applications;
drop policy if exists applications_admin_read on public.dealer_applications;
create policy dealer_applications_admin_select
on public.dealer_applications
for select to authenticated
using (
  exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = auth.uid() and da.role = 'admin'
  )
);

drop policy if exists dealer_accounts_self_select on public.dealer_accounts;
drop policy if exists dealer_accounts_self_or_admin on public.dealer_accounts;
create schema if not exists private;
revoke all on schema private from public;

create or replace function private.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = auth.uid() and da.role = 'admin'
  );
$$;

revoke all on function private.is_current_user_admin() from public;
grant execute on function private.is_current_user_admin() to authenticated;

create policy dealer_accounts_self_select
on public.dealer_accounts
for select to authenticated
using (
  auth_user_id = auth.uid() or private.is_current_user_admin()
);

drop policy if exists dealer_accounts_self_insert on public.dealer_accounts;
create policy dealer_accounts_self_insert
on public.dealer_accounts
for insert to authenticated
with check (
  (auth_user_id = auth.uid() and role = 'dealer')
  or private.is_current_user_admin()
);

drop policy if exists dealer_accounts_admin_all on public.dealer_accounts;
drop policy if exists dealer_accounts_admin_update on public.dealer_accounts;
drop policy if exists dealer_accounts_admin_delete on public.dealer_accounts;
create policy dealer_accounts_admin_update
on public.dealer_accounts
for update to authenticated
using (private.is_current_user_admin())
with check (private.is_current_user_admin());

create policy dealer_accounts_admin_delete
on public.dealer_accounts
for delete to authenticated
using (private.is_current_user_admin());

drop policy if exists dealers_public_read on public.dealers;
create policy dealers_public_read
on public.dealers
for select
using (true);

drop policy if exists dealers_admin_write on public.dealers;
create policy dealers_admin_write
on public.dealers
for all to authenticated
using (
  exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = auth.uid() and da.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = auth.uid() and da.role = 'admin'
  )
);

drop policy if exists dealer_orders_dealer_or_admin_select on public.dealer_orders;
create policy dealer_orders_dealer_or_admin_select
on public.dealer_orders
for select to authenticated
using (
  dealer_account_id in (
    select id
    from public.dealer_accounts
    where auth_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = auth.uid() and da.role = 'admin'
  )
);

drop policy if exists dealer_orders_admin_write on public.dealer_orders;
create policy dealer_orders_admin_write
on public.dealer_orders
for all to authenticated
using (
  exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = auth.uid() and da.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = auth.uid() and da.role = 'admin'
  )
);

drop policy if exists resources_authenticated_read on public.resources;
create policy resources_authenticated_read
on public.resources
for select to authenticated
using (is_active = true);

drop policy if exists resources_admin_write on public.resources;
create policy resources_admin_write
on public.resources
for all to authenticated
using (
  exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = auth.uid() and da.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = auth.uid() and da.role = 'admin'
  )
);

drop policy if exists announcements_authenticated_read on public.announcements;
create policy announcements_authenticated_read
on public.announcements
for select to authenticated
using (true);

drop policy if exists announcements_admin_write on public.announcements;
create policy announcements_admin_write
on public.announcements
for all to authenticated
using (
  exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = auth.uid() and da.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = auth.uid() and da.role = 'admin'
  )
);

drop policy if exists tickets_dealer_or_admin_read on public.tickets;
create policy tickets_dealer_or_admin_read
on public.tickets
for select to authenticated
using (
  dealer_account_id in (
    select id
    from public.dealer_accounts
    where auth_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = auth.uid() and da.role = 'admin'
  )
);

drop policy if exists tickets_dealer_insert on public.tickets;
create policy tickets_dealer_insert
on public.tickets
for insert to authenticated
with check (
  dealer_account_id in (
    select id
    from public.dealer_accounts
    where auth_user_id = auth.uid()
  )
);

drop policy if exists tickets_admin_write on public.tickets;
create policy tickets_admin_write
on public.tickets
for all to authenticated
using (
  exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = auth.uid() and da.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = auth.uid() and da.role = 'admin'
  )
);
