-- Versioned product photography for the interactive model viewer.
-- Binary files stay in the public site-media bucket.

create table if not exists public.product_media_sets (
  id bigint generated always as identity primary key,
  model_id bigint not null references public.scooter_models (id) on delete cascade,
  mode text not null,
  version integer not null default 1,
  label text not null,
  lifecycle text not null default 'draft',
  start_key text,
  direction text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_media_sets_mode_check
    check (mode in (
      'exterior', 'seat', 'storage', 'battery', 'charging',
      'lights', 'dashboard', 'features', '360'
    )),
  constraint product_media_sets_lifecycle_check
    check (lifecycle in ('draft', 'published', 'archived')),
  constraint product_media_sets_direction_check
    check (direction is null or direction in ('clockwise', 'counterclockwise')),
  constraint product_media_sets_label_len check (char_length(label) between 2 and 80),
  constraint product_media_sets_version_positive check (version >= 1)
);

create unique index if not exists product_media_sets_model_mode_version_idx
  on public.product_media_sets (model_id, mode, version);

create unique index if not exists product_media_sets_one_published_idx
  on public.product_media_sets (model_id, mode)
  where lifecycle = 'published';

create index if not exists product_media_sets_model_id_idx
  on public.product_media_sets (model_id);

create table if not exists public.product_media_assets (
  id bigint generated always as identity primary key,
  set_id bigint not null references public.product_media_sets (id) on delete cascade,
  object_path text not null unique,
  original_filename text not null,
  state_key text not null,
  sequence_index integer not null,
  width integer not null,
  height integer not null,
  mime_type text not null,
  byte_size integer not null,
  checksum text not null,
  alt text not null,
  approval text not null default 'hold',
  hotspots jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint product_media_assets_sequence_positive check (sequence_index >= 0),
  constraint product_media_assets_dims_positive check (width > 0 and height > 0),
  constraint product_media_assets_bytes_positive check (byte_size > 0),
  constraint product_media_assets_mime_check
    check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  constraint product_media_assets_approval_check
    check (approval in ('approved', 'hold')),
  constraint product_media_assets_alt_len check (char_length(alt) between 4 and 200),
  constraint product_media_assets_hotspots_array check (jsonb_typeof(hotspots) = 'array'),
  constraint product_media_assets_checksum_sha256 check (checksum ~ '^[a-f0-9]{64}$')
);

create unique index if not exists product_media_assets_set_sequence_idx
  on public.product_media_assets (set_id, sequence_index);

create unique index if not exists product_media_assets_set_state_idx
  on public.product_media_assets (set_id, state_key);

create index if not exists product_media_assets_set_id_idx
  on public.product_media_assets (set_id);

alter table public.product_media_sets enable row level security;
alter table public.product_media_assets enable row level security;

drop policy if exists product_media_sets_select on public.product_media_sets;
create policy product_media_sets_select
on public.product_media_sets
for select
to anon, authenticated
using (
  lifecycle = 'published'
  or exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid())
      and da.role = 'admin'
  )
);

drop policy if exists product_media_sets_admin_insert on public.product_media_sets;
create policy product_media_sets_admin_insert
on public.product_media_sets
for insert
to authenticated
with check (
  exists (
    select 1 from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid()) and da.role = 'admin'
  )
);

drop policy if exists product_media_sets_admin_update on public.product_media_sets;
create policy product_media_sets_admin_update
on public.product_media_sets
for update
to authenticated
using (
  exists (
    select 1 from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid()) and da.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid()) and da.role = 'admin'
  )
);

drop policy if exists product_media_sets_admin_delete on public.product_media_sets;
create policy product_media_sets_admin_delete
on public.product_media_sets
for delete
to authenticated
using (
  exists (
    select 1 from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid()) and da.role = 'admin'
  )
);

drop policy if exists product_media_assets_select on public.product_media_assets;
create policy product_media_assets_select
on public.product_media_assets
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.product_media_sets sets
    where sets.id = set_id
      and sets.lifecycle = 'published'
  )
  or exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid())
      and da.role = 'admin'
  )
);

drop policy if exists product_media_assets_admin_insert on public.product_media_assets;
create policy product_media_assets_admin_insert
on public.product_media_assets
for insert
to authenticated
with check (
  exists (
    select 1 from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid()) and da.role = 'admin'
  )
);

drop policy if exists product_media_assets_admin_update on public.product_media_assets;
create policy product_media_assets_admin_update
on public.product_media_assets
for update
to authenticated
using (
  exists (
    select 1 from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid()) and da.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid()) and da.role = 'admin'
  )
);

drop policy if exists product_media_assets_admin_delete on public.product_media_assets;
create policy product_media_assets_admin_delete
on public.product_media_assets
for delete
to authenticated
using (
  exists (
    select 1 from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid()) and da.role = 'admin'
  )
);

grant select on table public.product_media_sets to anon, authenticated;
grant insert, update, delete on table public.product_media_sets to authenticated;
grant all on table public.product_media_sets to service_role;
grant usage, select on sequence public.product_media_sets_id_seq to authenticated, service_role;

grant select on table public.product_media_assets to anon, authenticated;
grant insert, update, delete on table public.product_media_assets to authenticated;
grant all on table public.product_media_assets to service_role;
grant usage, select on sequence public.product_media_assets_id_seq to authenticated, service_role;

revoke insert, update, delete on table public.product_media_sets from anon;
revoke insert, update, delete on table public.product_media_assets from anon;
