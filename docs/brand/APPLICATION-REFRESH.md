# Amptron application refresh

September 2026. Implements the founder's request to apply the new identity and turn observed gaps into reusable project guidance.

## Delivered

- Graphite, paper and electric-green tokens across shared public, dealer/admin and assistant styles; preserved semantic status colours and actual vehicle colour data.
- Product-led homepage, clearer model cards and visible price/finance context, refined typography, actions and surfaces.
- Planned Energy, Parts and Service family on home/about, with clear status and no fictional product inventory.
- Rider support page connecting existing assistant, warranty and showroom paths; corrected spares/support links.
- In-memory enquiry drafts preserved across tabs, keyboard tab navigation, mobile drawer focus handling, honest test-ride request language and clearer receipt/privacy copy.
- Pause control and reduced-motion behavior for the hero video.
- Native labelled showroom filters and customer-facing login-unavailability states.
- Lazy-loaded admin/dealer routes. Initial bundle fell from about 1,034 kB to 941 kB (uncompressed); it still has a >500 kB build warning and warrants further performance work if required.
- Refreshed SVG logo colours, generated browser icons, manifest and share metadata. Existing vector geometry retained; concept artwork is not a final vector logo replacement.
- Canonical brand guide, archived historical guide, root agent instructions and validated `skills/amptron-product-quality` with concrete regression lessons and reference decisions. Local Cursor guidance now points to the same source.

## Validation

- Full Vitest suite: 216 passed across 28 files.
- Playwright: 39 passed, 3 existing viewport skips across desktop Chromium and mobile WebKit. Covers enquiries, API errors/privacy, product viewer, twelve public routes and new support/navigation journeys.
- TypeScript, oxlint, production client/server build and git whitespace checks passed.
- Skill frontmatter validation passed. Brand icon generation completed from the SVG master.
- Local preview: Vite on 5173; API on 3001 with in-memory enquiries. Test submissions are not retained in the production applications store.

## Boundaries

No production deployment, database migration or live business-data edits were performed. Authenticated live Supabase operations were not end-to-end verified with an account. Existing seeded product/business claims still require company verification before release. The skill guides future agents and records tests; it is not model training and cannot guarantee mistake-free work.

## References

Interaction references and the specific decisions taken from [Ather](https://www.atherenergy.com/), [NIU](https://global.niu.com/en-us), [OpenAI](https://openai.com/brand/) and [GOV.UK](https://www.gov.uk/service-manual/design/form-structure) are maintained in `skills/amptron-product-quality/references/design-references.md`.

## September 2026 catalog and approved-logo follow-up

The user-supplied full SVG wordmark now replaces the interim logo in public and authenticated layouts. The separately supplied symbol PNG generates favicon, touch and app icons. Both originals are preserved under `reference/approved-brand`.

All prior product photos and videos are retired outside served paths. The studio now supports real GLB rotation/zoom/reset/fullscreen, optional photo/film/caption slots, and honest empty/error states. The admin catalog supports structured templates, duplication, JSON import/export, draft saving and publication. Dealer catalog and ticket feedback, shared sign-in/recovery and chatbot contact/restart/retry flows were updated. Legacy media seed scripts are retired to prevent restoring removed content.

Operating instructions and unapplied database setup are in `CATALOG-STUDIO.md`. Current unit/API validation: 229 passed across 32 files; the final changed client suite has 90 passing tests. All 32 desktop Chromium/mobile WebKit browser tests pass, including actual GLB loading and missing-asset recovery. Typecheck, lint and production build pass. The 3D renderer is lazy-loaded but still produces a large-chunk build advisory. No live database, deployment or authenticated production records were modified.
