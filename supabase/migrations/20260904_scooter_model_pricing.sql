-- Pricing, colours, story, and optional film on the public model catalog.
-- Existing RLS on scooter_models is unchanged: published rows stay readable.

alter table public.scooter_models
  add column if not exists price_inr integer,
  add column if not exists price_placeholder boolean not null default true,
  add column if not exists colours jsonb not null default '[]'::jsonb,
  add column if not exists story jsonb not null default '[]'::jsonb,
  add column if not exists video_url text;

alter table public.scooter_models
  drop constraint if exists scooter_models_colours_array;

alter table public.scooter_models
  add constraint scooter_models_colours_array
  check (jsonb_typeof(colours) = 'array');

alter table public.scooter_models
  drop constraint if exists scooter_models_story_array;

alter table public.scooter_models
  add constraint scooter_models_story_array
  check (jsonb_typeof(story) = 'array');

alter table public.scooter_models
  drop constraint if exists scooter_models_price_inr_positive;

alter table public.scooter_models
  add constraint scooter_models_price_inr_positive
  check (price_inr is null or price_inr > 0);
