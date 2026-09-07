---
name: amptron-product-quality
description: Improve and review the Amptron React application using its brand system, rider and dealer journeys, and documented regression lessons. Use for Amptron UI, navigation, forms, product content, and portal changes.
---

# Amptron product quality

Read `docs/brand/AMPTRON-BRAND-GUIDELINES.md` for the current identity. The former navy/teal guide is archived and does not govern new UI. Use `references/lessons.md` when changing the related interactions, and `references/design-references.md` when choosing new patterns.

## Product context

Amptron sources components and assembles electric scooters, selling to riders and dealers. Energy, Parts, and Service are planned dedicated verticals. Existing support tools can remain available without implying those verticals have launched.

- Keep rider buying/test-ride paths distinct from dealer applications and authenticated operations.
- Product specs and pricing come from `useSiteContent()` and existing model/pricing data. Never infer sales, certification, availability, warranty or performance claims from a mockup or an older document.
- Use the approved user-supplied wordmark in `reference/approved-brand/amptron-wordmark.svg`. Runtime dark/light variants preserve its exact paths; only colour and crop change. Never redraw or substitute its A.
- Existing scooter photos/videos are retired in `reference/retired-media`. Keep public media empty until explicitly added via the catalog. Never restore archived imagery as a fallback. A 3D view requires a real GLB, not image sequencing or invented scooter geometry.
- For model templates, publication and media upload work, read `docs/brand/CATALOG-STUDIO.md`.
- Keep the existing React/Express/Supabase architecture and shared Zod/API contracts unless the task calls for a migration.

## Visual decisions

Use tokens in `src/index.css`. Graphite `#171C1B`, paper `#F3F2EC`, electric green `#C2F34B`, steel `#76817B`. Legacy `--navy`/`--teal` names are compatibility aliases, not the old palette. `--accent-text` supplies a darker readable green on light surfaces; electric green is an accent fill or dark-surface colour, not body text on white. Keep functional warning/error/success colours separate.

Outfit Variable and Geist Variable are bundled locally; `src/main.tsx` imports the font packages. Use Outfit for display titles and Geist for workspace headings, controls and data. `src/styles/workspace.css` owns the admin/dealer system. Do not claim a custom Amptron font exists. Extend shared components before writing a page-specific override. Use restrained corners, generous hierarchy on public pages, and compact task-first layouts in authenticated screens.

## Verify the changed experience

- Follow the task from its entry CTA to a real destination and its result. Match labels to actual capabilities: a request form does not reserve a slot or take a payment.
- Cover keyboard navigation, mobile navigation, long content, reduced motion, and relevant loading/error/success states.
- Keep entered information through tab changes in memory. Do not persist personal data to browser storage without a reason and an explicit retention decision.
- Run targeted behavioral tests for changed interactions, then lint, typecheck, build and the existing applicable suites. Use the memory repository for local submissions. Do not test by writing to production.
- State any unverified authenticated/live-data path in the handoff rather than representing it as tested.

## Maintain lessons from evidence

When a defect is observed, add or revise one entry in `references/lessons.md`: trigger, user impact, cause, correction, and the test/check that would catch recurrence. Record open limitations separately from fixed defects. Do not turn a one-off preference into a universal rule, accumulate duplicate rules, or claim this file trains the model or guarantees zero mistakes.
