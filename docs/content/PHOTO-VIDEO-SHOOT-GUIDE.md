# Photo and video shoot guide

Amptron’s public site is built to accept a consistent studio set per model. Until files land, Volt, Storm, and Cruise use the current stills and the Storm viewer set in `public/products/amptron-storm/`.

Brand photography (see `docs/brand/AMPTRON-BRAND-GUIDELINES.md` §30.7): three-quarter scooter, clean ground, everyday roads. No future-city, neon, or gadget-theatre sets. Do not overlay teal gradients on photos.

## What to shoot (each of Volt, Storm, Cruise)

Shoot the primary colourway first. Additional colours are optional; the site can preview them with a disclosed CSS filter until real frames exist.

| Set          | Frames   | Viewer mode | Notes                                                                            |
| ------------ | -------- | ----------- | -------------------------------------------------------------------------------- |
| Exterior     | 4 stills | `exterior`  | Front, front-right, rear, front-left. Same height, same lighting, tripod locked. |
| Seat         | 1–2      | `seat`      | Rider view plus a three-quarter of the saddle.                                   |
| Storage      | 1–2      | `storage`   | Under-seat open, floorboard if relevant.                                         |
| Battery      | 1–2      | `battery`   | Pack in place; labels readable.                                                  |
| Charging     | 1–2      | `charging`  | Household socket, cable seated.                                                  |
| Details      | 4–8      | hotspots    | Suspension, brakes, console, ports.                                              |
| Lights       | 1–2      | `lights`    | Optional. Leave unpublished if not shot.                                         |
| Dashboard    | 1–2      | `dashboard` | Optional.                                                                        |
| 360 sequence | 24 or 36 | `360`       | Optional. Even yaw steps, locked exposure.                                       |

Hero film (shared or per flagship): 10–15 s muted loop, 1920×1080, under 4 MB, scooter fully in frame, navy-friendly grade. Export a still poster from a mid frame.

## File names and folders

Drop optimized stills here (JPEG or WebP, long edge 1600–2048 px):

```
public/products/<slug>/
  exterior/angle-front.jpg
  exterior/angle-front-right.jpg
  exterior/angle-rear.jpg
  exterior/angle-front-left.jpg
  seat/seat-main.jpg
  storage/under-seat.jpg
  battery/pack.jpg
  charging/plugged-in.jpg
  details/<part>.jpg
```

Raw masters (PNG/TIFF) go in `src/assets/raw/` and are processed with `npm run images` into `src/assets/images/` for catalog cards (`volt.webp`, `storm.webp`, `cruise.webp`) and `hero-scooter.webp`.

Hero loop: `src/assets/videos/hero-showcase.mp4`.

## After you drop files

1. Storm already has a viewer config. Copy `[src/data/products/amptron-storm.ts](../../src/data/products/amptron-storm.ts)` to `amptron-volt.ts` / `amptron-cruise.ts`, set `modelSlug`, paths, and `enabled` flags for modes you actually shot.
2. Export the new config from `[src/data/products/index.ts](../../src/data/products/index.ts)` and register it in `LOCAL_PRODUCT_VIEWERS`.
3. Point `image` (and optional `video`) on that model in `[src/data/models.ts](../../src/data/models.ts)`.
4. If a colour has real photos, add `image` on that colour and omit CSS `filter` on the matching colorway.
5. Run `npm run images` for catalog stills, then `npm run sync:content` if Supabase should host the public URLs.

Do not invent a second folder convention. The viewer resolves media from these paths.
