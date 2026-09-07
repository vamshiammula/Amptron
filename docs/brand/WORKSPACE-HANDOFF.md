# Final brand and workspace system

Typography is now bundled locally: Outfit Variable for page/display titles, Geist Variable for body text, controls and data. The finalized colour roles and sizes are in `AMPTRON-BRAND-GUIDELINES.md`. The approved supplied wordmark and favicon symbol remain unchanged.

Admin and dealer routes use a shared workspace header, paper canvas, compact white panels, consistent status badges and form controls. Public shopping navigation stays on public pages. Mobile tabs keep the selected section in view; wide tables scroll within their panels. The header provides website access and sign-out with recoverable errors.

## Admin workflows

- Overview provides section shortcuts. Section tabs support keyboard arrows, Home and End.
- Applications include contact details and expandable showroom experience when supplied.
- Accounts create role-gated logins. A blank optional territory no longer fails validation.
- Dealers manage public showroom listings separately from account logins. Existing showroom details can be edited without creating duplicates.
- Orders and tickets support readable status filters and searches by account, subject/model or reference. Tickets include expandable submitted details.
- CSV exports include the complete filtered record set and escape spreadsheet formulas. Large record lists paginate at 50 rows.
- FAQs and support queries now expose their search control. Catalog drafts remain mounted across section switches.
- Refresh preserves existing data and drafts. A failed section is identified rather than silently presented as an empty successful result.

## Dealer workflows

The dealer account has overview shortcuts, searchable model catalog, orders, resources, updates and tickets. Orders/tickets use status filters, CSV export and 25-row pagination. Empty views explain what happened. Ticket drafts survive section changes; a successful submission followed by a failed refresh remains a confirmed submission, preventing accidental retry duplicates. Role checks continue to redirect administrators to the admin workspace.

## Validation and boundaries

237 unit/API tests and 32 desktop/mobile browser tests passed; the final client suite includes 99 passing tests after adding catalog setup detection. Added tests cover partial endpoint failures, showroom updates, draft preservation, keyboard navigation, ticket submission versus refresh failure, and CSV escaping. Signed-in admin account, showroom and support views were inspected read-only at desktop and 390px. Dealer flows were tested with mocked dealer sessions; no live business records or account permissions were changed.

The local app API uses the existing configured Supabase environment. Automated tests use an isolated in-memory API. A read-only schema check confirmed that the new catalog fields are absent. The existing CLI identified the correct project, but its dry run could not authenticate to Postgres without the database password. No migration or auth configuration was applied. The catalog's additive SQL migration still requires application to the connected database before new model fields can save; see `CATALOG-STUDIO.md`. Live password recovery also requires the deployed/local callback origin in Supabase's redirect allowlist. Do not push the temporary CLI configuration: it differs from the project's existing auth settings.
