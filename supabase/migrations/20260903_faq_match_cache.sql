-- FAQ match result cache.
-- Stores the resolved faq_id (or null for unmatched) for a normalized query hash.
-- Written only when the embedding tier resolves (lexical hits are already free).
-- Invalidated on FAQ upsert/delete/seed via the service layer.

create table if not exists public.faq_match_cache (
  query_hash   text primary key
    check (char_length(query_hash) = 64), -- hex SHA-256
  faq_id       uuid references public.faq_entries (id) on delete cascade,
  hit_count    integer not null default 1,
  last_hit_at  timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

comment on table public.faq_match_cache is
  'Cached FAQ match results keyed by SHA-256 of the normalized query.';
comment on column public.faq_match_cache.faq_id is
  'NULL means a previous embedding call returned unmatched.';
comment on column public.faq_match_cache.hit_count is
  'Number of times this exact query was served from cache.';

create index if not exists faq_match_cache_faq_id_idx
  on public.faq_match_cache (faq_id)
  where faq_id is not null;

create index if not exists faq_match_cache_last_hit_idx
  on public.faq_match_cache (last_hit_at desc);

-- RLS: public traffic never touches this table directly; Express uses service_role.
alter table public.faq_match_cache enable row level security;

-- Service role can do everything; no anon/authenticated access.
revoke all on table public.faq_match_cache from public, anon, authenticated;
grant select, insert, update, delete
  on table public.faq_match_cache to service_role;

-- Cleanup: purge cache entries older than 30 days (run via pg_cron if available).
-- create extension if not exists pg_cron;
-- select cron.schedule('faq-cache-cleanup', '0 3 * * *',
--   $$delete from public.faq_match_cache where last_hit_at < now() - interval '30 days'$$);
