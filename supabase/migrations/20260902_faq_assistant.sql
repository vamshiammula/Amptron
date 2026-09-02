-- FAQ matcher and unmatched-query queue.
-- Public traffic never hits these tables directly; Express uses the service role.

create extension if not exists vector with schema extensions;

create table if not exists public.faq_entries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (char_length(slug) between 2 and 80),
  question text not null
    check (char_length(question) between 8 and 240),
  answer text not null
    check (char_length(answer) between 12 and 2000),
  audience text not null default 'both'
    check (audience in ('rider', 'dealer', 'both')),
  category text not null default 'general'
    check (char_length(category) between 2 and 40),
  aliases text[] not null default '{}'::text[],
  cta text
    check (cta is null or cta in ('buy', 'test_ride', 'showroom', 'stock')),
  is_active boolean not null default true,
  is_seed boolean not null default false,
  embedding extensions.vector(1024),
  created_by uuid references public.dealer_accounts (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists faq_entries_active_updated_idx
  on public.faq_entries (is_active, updated_at desc);

create index if not exists faq_entries_created_by_idx
  on public.faq_entries (created_by);

create table if not exists public.support_queries (
  id uuid primary key default gen_random_uuid(),
  question text not null
    check (char_length(question) between 1 and 500),
  name text not null
    check (char_length(name) between 2 and 80),
  phone text
    check (phone is null or char_length(phone) between 8 and 20),
  email text
    check (email is null or char_length(email) between 5 and 160),
  preferred_language text not null default 'english'
    check (preferred_language in ('english', 'hindi', 'telugu', 'hinglish')),
  reason text not null
    check (reason in ('unmatched', 'quota')),
  status text not null default 'new'
    check (status in ('new', 'contacted', 'resolved')),
  notes text
    check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_queries_contact_required check (
    (phone is not null and char_length(btrim(phone)) >= 8)
    or (email is not null and char_length(btrim(email)) >= 5)
  )
);

create index if not exists support_queries_status_created_idx
  on public.support_queries (status, created_at desc);

create index if not exists support_queries_reason_created_idx
  on public.support_queries (reason, created_at desc);

alter table public.faq_entries enable row level security;
alter table public.support_queries enable row level security;

create or replace function public.faq_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists faq_entries_set_updated_at on public.faq_entries;
create trigger faq_entries_set_updated_at
  before update on public.faq_entries
  for each row
  execute function public.faq_set_updated_at();

drop trigger if exists support_queries_set_updated_at on public.support_queries;
create trigger support_queries_set_updated_at
  before update on public.support_queries
  for each row
  execute function public.faq_set_updated_at();

create or replace function public.match_faq_entries(
  query_embedding extensions.vector(1024),
  match_count integer default 5
)
returns table (
  id uuid,
  slug text,
  question text,
  answer text,
  audience text,
  category text,
  cta text,
  similarity double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    e.id,
    e.slug,
    e.question,
    e.answer,
    e.audience,
    e.category,
    e.cta,
    (1 - (e.embedding <=> query_embedding))::double precision as similarity
  from public.faq_entries e
  where e.is_active = true
    and e.embedding is not null
  order by e.embedding <=> query_embedding
  limit least(greatest(coalesce(match_count, 5), 1), 20);
$$;

revoke all on function public.match_faq_entries(extensions.vector, integer)
  from public, anon, authenticated;
grant execute on function public.match_faq_entries(extensions.vector, integer)
  to service_role;

drop policy if exists faq_entries_admin_select on public.faq_entries;
create policy faq_entries_admin_select
on public.faq_entries
for select
to authenticated
using (
  exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid())
      and da.role = 'admin'
  )
);

drop policy if exists faq_entries_admin_insert on public.faq_entries;
create policy faq_entries_admin_insert
on public.faq_entries
for insert
to authenticated
with check (
  exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid())
      and da.role = 'admin'
  )
);

drop policy if exists faq_entries_admin_update on public.faq_entries;
create policy faq_entries_admin_update
on public.faq_entries
for update
to authenticated
using (
  exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid())
      and da.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid())
      and da.role = 'admin'
  )
);

drop policy if exists faq_entries_admin_delete on public.faq_entries;
create policy faq_entries_admin_delete
on public.faq_entries
for delete
to authenticated
using (
  exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid())
      and da.role = 'admin'
  )
);

drop policy if exists support_queries_admin_select on public.support_queries;
create policy support_queries_admin_select
on public.support_queries
for select
to authenticated
using (
  exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid())
      and da.role = 'admin'
  )
);

drop policy if exists support_queries_admin_update on public.support_queries;
create policy support_queries_admin_update
on public.support_queries
for update
to authenticated
using (
  exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid())
      and da.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid())
      and da.role = 'admin'
  )
);

-- No insert policy for anon/authenticated: public submissions go through Express.
revoke insert, update, delete on public.faq_entries from anon;
revoke insert, update, delete on public.support_queries from anon;
