-- Split public SELECT from admin writes so authenticated reads use a single policy.

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
