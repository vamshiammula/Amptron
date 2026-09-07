# Project recovery status

Recovered on 2026-09-07. The working project is `/Users/vamshiammula/Developer/Amptron`, outside iCloud. The former `Documents/Amptron` path links here.

All 46 missing source files were recovered from the signed-in iCloud Drive web interface and matched against the original Git blob hashes in `missing-files.json`. Eight additional unchanged local files and eight downloaded originals repaired missing Git records. The reconstructed commit tree exactly matches the saved HEAD (`7c90bcabd8cfa631de25847f47d65f20aae3c2de`). Git connectivity verification passes.

Existing performance and startup changes are retained. The older GitHub recovery copy is preserved at `/Users/vamshiammula/Developer/Amptron-github-recovery-backup`; its only additional working change was a dependency lockfile regeneration. No source edits from that copy were discarded. Original media remains in Supabase and the existing archives.

Fresh validation passed: formatting, lint, type checking, 251 application tests, 36 desktop/mobile browser tests, and the production build. Normal development startup, a controlled API watcher restart, duplicate-start protection, and interactive shell completion were verified. The signed-in admin overview and orders were checked read-only; no live records were changed. See `docs/performance` for the performance changes and `docs/LOCAL-DEVELOPMENT.md` for startup instructions.

## Deployment dependency correction

Vercel's first deployment exposed an outdated lockfile that the existing local dependency directory had masked. The lockfile was regenerated to include the fonts and model viewer, without changing existing resolved package versions. Node 22 now governs CI and Vercel, and standard verification includes a non-mutating clean-install dry run. Validation passed in a fresh source copy under Node 22: real `npm ci`, formatting, lint, type checking, 251 application tests, 8 desktop/mobile product-viewer tests, and the production build. The new lockfile guard rejects the old lockfile and accepts the corrected one without changing installed dependencies.
