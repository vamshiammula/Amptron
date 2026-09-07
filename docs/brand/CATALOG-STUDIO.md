# Amptron catalog and product studio

The public website currently ships without scooter photography or video. Previous assets live in `reference/retired-media`, outside served and bundled paths. Legacy database media stays hidden until explicitly enabled. Brand logos and interface icons remain.

## Managing models

Admin → Models & templates offers Everyday, Extended range and Blank starting points. These are structural templates, without fabricated prices or performance figures. Fill in the name, unique URL slug, description, highlights and verified specifications. Save a draft, preview its product studio, then publish. New models automatically appear in the public catalog and dealer catalog. A successful empty published catalog remains empty.

Duplicate any saved model for reuse. Copies start unpublished and need a unique slug. Export a completed model as JSON to retain a reusable template; import it for another model and review every value before publishing. “Remove from site” unpublishes the model while retaining its saved details. This avoids accidentally destroying a reusable model record.

## Media slots

Upload or enter a URL for a self-contained GLB, photo, film and optional WebVTT captions. Uploads use the existing admin-only `site-media` bucket policies and have a 50 MB client limit. Use the project's storage URLs or same-origin assets allowed by the application's content security policy. Keep GLB textures embedded. Prefer compact, optimized assets for mobile connections. Saving publishes the entered media only when the model is published and media is enabled.

The studio uses Google's model-viewer for actual rotation, zoom, reset and fullscreen. Controls stay disabled until a GLB loads. Without a GLB, the branded placeholder is honest about the missing view. No scooter model has been invented or supplied with this implementation. Photos and film can be added later; those modes stay disabled while empty.

## Database setup

Apply `supabase/migrations/20260906_model_templates_3d.sql` to the intended Supabase environment before using the new save/upload fields. It adds opt-in media, GLB, captions and numeric comparison fields and extends the existing bucket MIME allowlist. It retains existing admin-only RLS. This migration has not been applied to the live account by this task. Test live authentication, storage permissions and publication in a staging account before rollout.

## Support and portals

The FAQ assistant now offers retry, contact escalation and a fresh conversation. It identifies itself as an FAQ assistant. Adding a model does not automatically create verified FAQ answers; update the FAQ corpus alongside product content. Dealer access has a read-only published catalog, clearer ticket submission state and sign-out. The shared admin/dealer sign-in has password visibility, recoverable errors and a password-reset completion form. Supabase reset redirect URLs must allow `/portal/login?recovery=1` on the site's origin.

## Approved identity

Use `reference/approved-brand/amptron-wordmark.svg` for the exact full wordmark. Header/footer/login variants only change fill and surrounding whitespace. Favicons and app icons come from the separately supplied `amptron-symbol.png`; run `npm run brand:icons` to regenerate sizes. Do not replace either approved asset with a reconstruction.
