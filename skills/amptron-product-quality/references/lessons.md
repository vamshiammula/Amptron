# Observed lessons

## Competing brand sources

- Trigger: a new graphite/green identity was approved while the repository guide and Cursor rule still prescribed navy/teal.
- Impact: later work could revert colours and voice depending on which document was loaded.
- Correction: archive v2, publish one current implementation guide, link it from the root AGENTS.md and this skill, migrate the shared token API.
- Check: inspect current tokens, SVG logo fills, public/ops/chat surfaces, and metadata together. Preserve semantic status colours.

## Enquiry drafts lost when switching tabs

- Trigger: switching Buy / Test Ride / Stock unmounted InquiryForm and discarded its local state.
- Impact: a visitor lost entered contact details and their request.
- Correction: keep separate in-memory drafts in Contact, restore initial values on remount, clear only the submitted draft on success.
- Check: type in two different enquiry tabs, return to each, and confirm values remain distinct. Do not store PII in localStorage as an incidental fix.

## Incomplete tab keyboard semantics

- Trigger: all enquiry tabs were tabbable but lacked arrow-key navigation and explicit tab/panel relationships.
- Correction: roving tabindex, Left/Right/Home/End handling, aria-controls and aria-labelledby.
- Check: traverse tabs by keyboard and verify focus and selected panel agree.

## Requests presented as reservations

- Trigger: a 'Pick a slot' CTA opened a free-text request form with no scheduling inventory.
- Impact: visitors could mistake an enquiry for a confirmed booking.
- Correction: 'Request a test ride' and availability confirmation language.
- Check: any booking or payment language must match the actual API result and capabilities.

## Rider parts support led to dealer recruitment

- Trigger: the spares card linked to #contact / Stock Amptron; footer support linked to #buy.
- Correction: dedicated /support routing to the existing assistant, showroom finder and warranty guidance.
- Check: follow support from footer and ownership cards as a rider; no B2B application should be required.

## Motion without a pause control

- Trigger: the homepage loop respected reduced motion but offered no pause for other visitors.
- Correction: visible pause/play control with accessible labels; reduced-motion users retain the poster.
- Check: pause and resume the actual video; reduced-motion preference must stop autoplay.

## Keyboard focus behind mobile navigation

- Trigger: an open drawer locked body scroll but did not contain keyboard focus.
- Correction: cycle focus from the last drawer link to its toggle, restore focus on Escape, close after desktop resize.
- Check: Tab, Shift+Tab, Escape, route change and resize. Closed drawer stays inert.

## Developer configuration exposed to customers

- Trigger: dealer login described missing Supabase environment variables in the public UI.
- Correction: useful unavailability message and disabled sign-in/reset when unconfigured.
- Check: review unconfigured and network failure states as a dealer, not a developer.

## Custom filter used incomplete listbox semantics

- Trigger: showroom filters used buttons inside a listbox without native select keyboard behavior. Lint exposed invalid semantic roles.
- Correction: native labelled select elements preserve the same controlled filtering contract.
- Check: select a state and city by keyboard and assert the resulting showroom list; use selectOptions in tests.

## Public visitors loaded operations code

- Trigger: the initial application bundle included eagerly imported admin and dealer workspaces.
- Correction: lazy-load authenticated routes with an accessible loading state.
- Check: compare build output and verify route transitions and sign-in behavior.

## An event can arrive before a lazy component is ready

- Trigger: the new support CTA dispatched its open event before ChatWidget mounted.
- Impact: clicking support appeared to do nothing.
- Correction: queue an in-memory open request and consume it when the widget subscribes.
- Check: click a support CTA immediately on first page load; assert the assistant opens.

## Non-mutating sort results must be used

- Trigger: replacing an in-place sort with toSorted without assigning its return value left FAQ rankings unsorted.
- Impact: the existing natural-language FAQ tests returned no answer.
- Correction: pass and return the sorted array explicitly; keep the existing corpus tests.
- Check: run ranking tests after collection-method refactors, even when changing code to satisfy lint.

# Remaining boundaries

- Product evidence, headquarters/contact data and commercial claims already present in seeded content still require business verification before release. This redesign is not verification of those claims.
- The generated board is concept artwork. The user-supplied September 2026 SVG is now the approved wordmark; no further geometry redesign is implied.
- Live Supabase authentication, real orders and production support delivery need a configured test environment; memory-backed tests do not verify live operations.
- This skill is repository guidance, not model training or a guarantee against future defects.

## Retired media must stay retired

- Trigger: changing page imports alone left legacy database images and public files available.
- Impact: old photos could return when remote content loaded.
- Correction: archive source media outside public/build paths, clear defaults, and gate remote media on explicit `media_ready`.
- Check: mapping tests cover legacy rows; browser tests assert no retired-media requests.

## New catalog models require loading-aware routes

- Trigger: a deep link to a newly created model was absent from seeded fallback data.
- Impact: redirect could run before the catalog response arrived.
- Correction: wait for `catalogReady` before treating a slug as missing; preserve a successfully empty published catalog.
- Check: browser test loads a model existing only in the mocked catalog response.

## Auth transitions cannot change hook order

- Trigger: dealer-page memo hooks appeared after conditional authentication returns.
- Impact: a session transition could break React rendering.
- Correction: run hooks before early returns; keep loading/unauthenticated states below them.
- Check: inspect hook order and exercise authentication transitions when changing the portal.

## Match the approved logo, not a reconstruction

- Trigger: an interim engineered A did not match the user's supplied wordmark.
- Correction: preserve the seven path definitions from the supplied SVG, crop whitespace and change only fill for contrast. Use the separately supplied `amptron-symbol.png` for favicons and app icons.
- Check: compare SVG path data against the approved source and visually review header and login at mobile/desktop sizes.

## Custom 3D elements can fail before passive effects attach

- Trigger: a fast missing-GLB response did not reliably surface the error on mobile WebKit.
- Impact: the viewer could remain on its loading message.
- Correction: attach load/error listeners in a layout effect and bound loading with a 15-second recovery timeout.
- Check: exercise actual GLB success and a 404 response in desktop Chromium and mobile WebKit; enable controls only after load.

## Public layout leaked into authenticated operations

- Trigger: admin/dealer pages inherited oversized public headings, no horizontal page gutter, and shopping navigation/footer.
- Impact: dense records were hard to scan and unrelated purchase links distracted from work.
- Correction: dedicated shared workspace header, locally bundled font families, compact type scale, paper canvas, white panels and consistent mobile gutters.
- Check: inspect signed-in admin at desktop and 390px; horizontal overflow belongs only to tables and tabs.

## One failed endpoint discarded otherwise usable data

- Trigger: Promise.all prevented every admin/dealer section from updating when one request failed; optional FAQ failures were silently shown as empty data.
- Correction: settle each section independently, retain previous values, name failed sections and expose retry. Refresh without unmounting drafts.
- Check: simulate one failing endpoint while orders or showrooms still render. Distinguish a submitted ticket from a subsequent refresh failure to prevent duplicate submissions.

## Section state and records lacked context

- Trigger: shared search terms hid unrelated sections, ticket bodies were omitted, and account/record references were absent.
- Correction: reset search on section changes, preserve catalog/ticket drafts, include account/reference context and expandable details, and export the complete filtered set as escaped CSV.
- Check: section-switch, draft-retention, showroom-edit and spreadsheet-formula tests. Do not claim catalog counts before that catalog has loaded.

## Local API test settings broke signed-in workflows

- Trigger: the long-running API used APPLICATIONS_STORE=memory and disabled portal authentication on restart.
- Correction: restore the local app server to the existing configured environment; keep automated writes in isolated tests.
- Check: signed-in read-only refresh succeeds before handoff. Never leave the user's working portal pointed at a test server.

## Light-surface colours leaked onto dark surfaces

- Trigger: calculator-page footer metadata rendered at roughly 2.86:1; the chatbot presence label reused dark accent green on graphite.
- Impact: small supporting text was difficult to read.
- Cause: semantic text tokens did not distinguish the surrounding surface.
- Correction: use --text-on-dark for dark-surface secondary text and electric green for the chatbot header status; preserve visible focus on dark controls.
- Check: inspect computed foreground/background pairs and rendered hover/focus states. Do not use steel or light-surface accent text for small text on dark panels.

## Calculator graphics and controls obscured precise comparisons

- Trigger: chart code imposed an 8% minimum even for zero values; sliders lacked exact entry; arrow keys changed tabs without moving focus.
- Impact: small costs were exaggerated and keyboard/precise-entry workflows were cumbersome.
- Correction: zero-baseline proportional bars, labelled numeric alternatives with bounded commits, native model selection and synchronized tab focus including Home/End.
- Check: regression tests cover proportional small bars, typed/blank/out-of-range values and tab focus; inspect monthly and five-year figures at mobile width. Label periods and amounts rather than relying on colour.

## EV comparisons must not inherit petrol assumptions

- Trigger: adding an unnamed EV alternative to the petrol comparison.
- Impact: petrol mileage or service defaults could create a misleading advantage if reused for the other EV.
- Correction: independent electric consumption calculation, equal shared usage and initial service assumptions, blank required other-EV specifications, separate battery allowances and explicit negative/equal outcomes.
- Check: equal scooters yield zero difference; both battery allowances enter the total; invalid inputs suppress results; comparison-mode switches retain drafts.

## Product studio only exposed the hero photo

- Trigger: nine approved NIRA stills existed in public assets but Photos rendered only model.image.
- Impact: visitors could not browse other angles in Explore.
- Correction: connect the ordered NIRA gallery to the shared studio with thumbnails, labelled previous/next controls, a live counter, keyboard navigation and selection retention across modes.
- Check: ScooterStage tests cover first/last wrapping, thumbnail selection, arrow keys and returning from 3D. Keep originals in NIRA and served copies in public/products/amptron-nira.

## Homepage film and detailed exploration

- Changed invariant: the homepage introduces the featured model with its supplied film and a direct Explore link. Keep interactive 3D and the full photo gallery on the model detail page.
- Check: film controls remain available, reduced motion prevents automatic playback, and a failed film falls back to a still. HeroFilm tests cover these behaviors.
