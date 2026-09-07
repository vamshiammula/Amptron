-- Media is opt-in: previously seeded images/videos stay hidden after this change.
-- Existing admin-only scooter_models RLS policies continue to govern all writes.
alter table public.scooter_models
  add column if not exists captions_url text not null default '',
  add column if not exists model_3d_url text not null default '',
  add column if not exists media_ready boolean not null default false,
  add column if not exists battery_kwh numeric not null default 0,
  add column if not exists certified_range_km numeric not null default 0;

alter table public.scooter_models alter column image_url set default '';

-- New model assets are uploaded through the existing admin-only storage policies.
-- 80 MB covers the current NIRA GLB (~67 MB) plus stills and film.
update storage.buckets set
  file_size_limit = 83886080,
  allowed_mime_types = array[
    'image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm',
    'text/vtt', 'model/gltf-binary', 'application/octet-stream'
  ]
where id = 'site-media';
