-- Public marketing content: scooter models, blog posts, and site media URLs.
-- Binary files live in the public `site-media` storage bucket (not Amptron branding).

create table if not exists public.scooter_models (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  tagline text not null,
  description text not null,
  image_url text not null,
  featured boolean not null default false,
  published boolean not null default true,
  sort_order integer not null default 0,
  highlights jsonb not null default '[]'::jsonb,
  specs jsonb not null default '[]'::jsonb,
  features text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scooter_models_slug_len check (char_length(slug) between 2 and 80),
  constraint scooter_models_name_len check (char_length(name) between 2 and 80),
  constraint scooter_models_highlights_array check (jsonb_typeof(highlights) = 'array'),
  constraint scooter_models_specs_array check (jsonb_typeof(specs) = 'array')
);

create index if not exists scooter_models_published_sort_idx
  on public.scooter_models (sort_order)
  where published = true;

create table if not exists public.blog_posts (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  excerpt text not null,
  body text not null default '',
  cover_image_url text,
  published boolean not null default true,
  published_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_posts_slug_len check (char_length(slug) between 2 and 120),
  constraint blog_posts_title_len check (char_length(title) between 2 and 160)
);

create index if not exists blog_posts_published_at_idx
  on public.blog_posts (published_at desc)
  where published = true;

create table if not exists public.site_media (
  key text primary key,
  url text not null,
  alt text not null default '',
  kind text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_media_key_len check (char_length(key) between 2 and 80),
  constraint site_media_kind_check check (kind in ('image', 'video'))
);

alter table public.scooter_models enable row level security;
alter table public.blog_posts enable row level security;
alter table public.site_media enable row level security;

drop policy if exists scooter_models_public_read on public.scooter_models;
drop policy if exists scooter_models_admin_write on public.scooter_models;
drop policy if exists scooter_models_select on public.scooter_models;
create policy scooter_models_select
on public.scooter_models
for select
to anon, authenticated
using (
  published = true
  or exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid())
      and da.role = 'admin'
  )
);

drop policy if exists scooter_models_admin_insert on public.scooter_models;
create policy scooter_models_admin_insert
on public.scooter_models
for insert
to authenticated
with check (
  exists (
    select 1 from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid()) and da.role = 'admin'
  )
);

drop policy if exists scooter_models_admin_update on public.scooter_models;
create policy scooter_models_admin_update
on public.scooter_models
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

drop policy if exists scooter_models_admin_delete on public.scooter_models;
create policy scooter_models_admin_delete
on public.scooter_models
for delete
to authenticated
using (
  exists (
    select 1 from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid()) and da.role = 'admin'
  )
);

drop policy if exists blog_posts_public_read on public.blog_posts;
drop policy if exists blog_posts_admin_write on public.blog_posts;
drop policy if exists blog_posts_select on public.blog_posts;
create policy blog_posts_select
on public.blog_posts
for select
to anon, authenticated
using (
  published = true
  or exists (
    select 1 from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid()) and da.role = 'admin'
  )
);

drop policy if exists blog_posts_admin_insert on public.blog_posts;
create policy blog_posts_admin_insert
on public.blog_posts
for insert
to authenticated
with check (
  exists (
    select 1 from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid()) and da.role = 'admin'
  )
);

drop policy if exists blog_posts_admin_update on public.blog_posts;
create policy blog_posts_admin_update
on public.blog_posts
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

drop policy if exists blog_posts_admin_delete on public.blog_posts;
create policy blog_posts_admin_delete
on public.blog_posts
for delete
to authenticated
using (
  exists (
    select 1 from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid()) and da.role = 'admin'
  )
);

drop policy if exists site_media_public_read on public.site_media;
drop policy if exists site_media_admin_write on public.site_media;
drop policy if exists site_media_select on public.site_media;
create policy site_media_select
on public.site_media
for select
to anon, authenticated
using (true);

drop policy if exists site_media_admin_insert on public.site_media;
create policy site_media_admin_insert
on public.site_media
for insert
to authenticated
with check (
  exists (
    select 1 from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid()) and da.role = 'admin'
  )
);

drop policy if exists site_media_admin_update on public.site_media;
create policy site_media_admin_update
on public.site_media
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

drop policy if exists site_media_admin_delete on public.site_media;
create policy site_media_admin_delete
on public.site_media
for delete
to authenticated
using (
  exists (
    select 1 from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid()) and da.role = 'admin'
  )
);

grant select on table public.scooter_models to anon, authenticated;
grant insert, update, delete on table public.scooter_models to authenticated;
grant all on table public.scooter_models to service_role;
grant usage, select on sequence public.scooter_models_id_seq to authenticated, service_role;

grant select on table public.blog_posts to anon, authenticated;
grant insert, update, delete on table public.blog_posts to authenticated;
grant all on table public.blog_posts to service_role;
grant usage, select on sequence public.blog_posts_id_seq to authenticated, service_role;

grant select on table public.site_media to anon, authenticated;
grant insert, update, delete on table public.site_media to authenticated;
grant all on table public.site_media to service_role;

revoke insert, update, delete on table public.scooter_models from anon;
revoke insert, update, delete on table public.blog_posts from anon;
revoke insert, update, delete on table public.site_media from anon;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists site_media_objects_public_read on storage.objects;
create policy site_media_objects_public_read
on storage.objects
for select
to public
using (bucket_id = 'site-media');

drop policy if exists site_media_objects_admin_insert on storage.objects;
create policy site_media_objects_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'site-media'
  and exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid())
      and da.role = 'admin'
  )
);

drop policy if exists site_media_objects_admin_update on storage.objects;
create policy site_media_objects_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'site-media'
  and exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid())
      and da.role = 'admin'
  )
)
with check (
  bucket_id = 'site-media'
  and exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid())
      and da.role = 'admin'
  )
);

drop policy if exists site_media_objects_admin_delete on storage.objects;
create policy site_media_objects_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'site-media'
  and exists (
    select 1
    from public.dealer_accounts da
    where da.auth_user_id = (select auth.uid())
      and da.role = 'admin'
  )
);
