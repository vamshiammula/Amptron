# Amptron application brand guidelines

Revision 6, September 2026. Typography and workspace system finalized. Supersedes v2's visual system following the founder's request to apply the new Amptron brand concept to the application. Historical platform text is preserved in `archive/AMPTRON-BRAND-GUIDELINES-v2.md`; historical claims are not newly verified by this revision.

## Foundation

Amptron sources components, assembles electric scooters, and sells through dealers and directly to riders. Be dependable, precise and approachable. The approved design direction is the engineered A, with the proposed line **Built to move forward.** Keep practical rider needs and dealer workflows clear.

## Brand family

| Name            | Role                               | Status  |
| --------------- | ---------------------------------- | ------- |
| Amptron         | Parent brand and electric scooters | Current |
| Amptron Energy  | Battery manufacturing              | Planned |
| Amptron Parts   | EV components                      | Planned |
| Amptron Service | Maintenance and repair             | Planned |

Existing support enquiries are available separately from the planned dedicated verticals. Do not advertise inventory or launch dates that have not been supplied.

## Visual system

| Token          | Value   | Use                                                   |
| -------------- | ------- | ----------------------------------------------------- |
| Graphite       | #171C1B | Logo, primary text, dark surfaces                     |
| Paper          | #F3F2EC | Warm backgrounds                                      |
| Electric green | #C2F34B | Primary action, accent fills, dark-surface highlights |
| Steel          | #76817B | Supporting surfaces and decoration                    |

`src/index.css` owns the colour and spacing tokens. Existing `--navy` and `--teal` variables remain compatibility aliases for graphite and electric green. They no longer refer to the old palette. Use `--accent-text` for readable accent text on light surfaces; preserve distinct semantic status colours.

Use the exact user-approved wordmark supplied on 6 September 2026, preserved in `reference/approved-brand/amptron-wordmark.svg`. Runtime `logo.svg` and `logo-light.svg` preserve all seven paths with cropped whitespace and graphite/paper fills. The product studio uses its original A path. Favicons and app icons use the separately approved `reference/approved-brand/amptron-symbol.png`, resized with safe whitespace; do not substitute the wordmark A. Do not redraw, distort or apply effects. Leave at least a quarter of the symbol height as clear space. The concept PDF and image board are design references, not finished vector masters. Do not present their product mockups as real Amptron scooters or batteries.

Use locally bundled Outfit Variable for brand/display headings and Geist Variable for body text, controls and data. Font packages are imported in `src/main.tsx`; do not add an external font CDN. These are licensed font families, not a custom commissioned Amptron typeface.

| Role                     | Font / weight   | Size and behaviour                 |
| ------------------------ | --------------- | ---------------------------------- |
| Public hero              | Outfit, 600–700 | Existing responsive display tokens |
| Workspace page title     | Outfit, 600     | 26–36px, line-height 1.15          |
| Workspace section title  | Geist, 600      | 20px, line-height 1.3              |
| Body and table data      | Geist, 400      | 14–16px, line-height 1.5           |
| Form labels and tabs     | Geist, 500      | 13px, sentence case                |
| Buttons                  | Geist, 600      | 14px, minimum 42px control height  |
| Status badges / metadata | Geist, 500      | 12–13px, always legible text       |

Use paper for the workspace canvas, white for panels, graphite for text/selected tabs, and electric green for primary action fills. Supporting text uses slate `#56615C`; steel is decorative. Accent text on light surfaces uses `#456018`. Status colour pairs stay distinct: green `#047857/#D1FAE5`, amber `#B45309/#FEF3C7`, blue `#0369A1/#E0F2FE`, and red text `#B42318` on a pale error surface. Every status includes a written label.

Controls have 6–8px corners and workspace panels 10px corners. Use 16–24px internal spacing, a 20px mobile gutter and a readable content width. Shared implementation is in `src/styles/workspace.css`; do not copy public hero typography into admin tables. Keep horizontal scrolling inside tables/tab navigation, never on the whole page.

## Icons and accent discipline

Use the shared `src/components/ui/Icon.tsx` for monochrome interface icons. It preserves the existing SVG silhouettes as masks and inherits `currentColor`, so embedded legacy asset colours cannot leak into the interface. Use a right arrow for internal navigation and an up-right arrow for external destinations. Do not use emoji-capable Unicode characters as interface icons; phones can render them as coloured emoji tiles. Decorative icons stay hidden from assistive technology, and the adjacent label names the action.

Electric green is intentional on primary actions and selected highlights. Dark olive `--accent-text` is its readable companion for small labels on paper. Supporting navigation, dealer and contact icons use the surrounding graphite or light text colour. Turquoise from the former identity is not a decorative brand accent. Functional success colours and the calculator's forest-green data series retain their separate meanings.

## Voice and interaction

- Use the spelling Amptron consistently.
- Address riders on buy, test-ride and support paths; address dealers on trade and portal paths.
- A request form requests follow-up. It does not reserve a slot or complete a purchase.
- Explain price basis and finance assumptions near the relevant numbers.
- Preserve model specs and pricing from the existing content provider. Verify business claims before publishing them; do not manufacture social proof, certifications or service promises.
- Keep drafts through enquiry-tab switches, make controls keyboard-usable, provide recoverable errors and clear receipt states.
- Keep implementation details out of customer-facing error messages.

## Sources and maintenance

Visual reference: `output/pdf/Amptron-Brand-Guidelines.pdf` and `output/brand/amptron-identity-concept-01.png`.
Implementation: `src/index.css`, shared components, `src/styles/brand.css`.
Reusable project skill: `skills/amptron-product-quality/SKILL.md`.
Update this guide with deliberate brand changes; record demonstrated regressions in the skill's lessons reference.

## Readability and data presentation

Use graphite text on white/paper; supporting text uses slate #56615C. On dark surfaces use paper for primary text and #C6CEC8 for supporting text. Electric green works as a highlight on graphite or as a button fill with graphite text. Never reuse dark accent text on a dark panel. Steel is decoration, not small body text.

Calculator charts use slate #56615C for petrol and forest #376047 for electric costs. Keep the same assignment across monthly, annual and five-year views. Labels, amounts and time periods must explain each mark without requiring colour recognition. Reserve amber/red for warnings/errors, not ordinary competitor data. Chart fills are separate from electric-green action fills.

- Use Geist, tabular numerals and consistent currency formatting for amounts. Show the time period adjacent to every statistic. Do not combine monthly costs and annual savings under one unlabeled heading.
- Start cost bars at zero with a shared scale. Zero values have zero height; never inflate small bars for visual impact. Put exact amounts outside the marks and provide a detailed cost table.
- Keep estimate assumptions, exclusions and negative outcomes visible or readily expandable. Five-year bars include purchase, energy, routine service and the selected battery scenario from the existing estimator.
- Each slider has a labelled numeric field for precise entry. Commit on Enter/blur; clamp to the documented bounds and snap to its step. Blank input restores the prior value. Native ranges support keyboard and pointer input; native selects support platform keyboard behavior.
- Use sentence case for explanatory labels and generous line height. Chat responses use 15px/1.6; typed fields use 16px. Selected tabs must move keyboard focus as well as update content.
- Use at least 4.5:1 contrast for ordinary text and 3:1 for large text and essential control/graphic boundaries. Evaluate the actual rendered surface, including hover/focus states. These rules do not constitute a whole-site accessibility certification.

References: [W3C text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), and [alternatives to dragging](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html).

## Generic EV comparison

Offer a petrol comparison and an unnamed “Other electric scooter” scenario. Never insert competitor names, invented specifications or prefilled figures that create an apparent Amptron advantage. Require the other scooter’s purchase price, battery capacity and range before displaying results. Amptron catalog figures are editable; compare the same price and range basis.

Explain purchase difference, monthly running difference and five-year total separately. Shared usage, tariff and charging allowance apply equally to both EVs. Service and battery allowances are independently editable and start equally. Preserve more-expensive and approximately-equal outcomes. This outright-purchase estimate excludes subscription/rental models; do not imply it covers them. Calculations use unrounded values before formatting.

The two comparison modes retain their own scenario inputs while switching; these are illustrative scenarios rather than saved customer records.
