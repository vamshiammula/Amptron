# Local development

Use Node.js 22 (`.nvmrc`). With nvm, run `nvm install` once, then `nvm use` in this project. CI reads the same file and `package.json` pins Vercel to `22.x`.

Use a fully downloaded checkout outside cloud-synced Documents/Desktop folders, for example `~/Developer/Amptron`. Keep the original checkout until the local copy has been verified. The app's approved media remains in Supabase; do not duplicate media masters just to run the website.

Run `npm run dev` from the local checkout. It checks source availability and ports, then starts Vite on `http://127.0.0.1:5173` and the Express API on its configured port (3001 by default). The frontend proxies `/api` to Express. Stop the complete session with Control-C before starting another. If either service exits, the other stops too. Vite does not silently move to a different port.

React, Express, Supabase, and shared validation contracts remain unchanged. Development hot reload is retained. Production uses `npm run build` and the deployment's existing server/static configuration; do not use the development server to measure production latency.

## Repeated restarts or slow source loading

macOS can replace synced files with cloud-only placeholders. Reading them blocks until download completes, and materialization can trigger file watchers. A watcher restart alone does not prove that code changed. Keep the development checkout outside the synced folder, with dependencies installed locally. Do not disable authentication, switch the working API to a memory test store, or delete original assets to work around this.

## Verification

Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`. Automated submissions use the suite's memory fixtures. Production data must not be used for write tests. Confirm the API starts, the homepage responds, and gallery navigation works before declaring the local setup healthy.

## Preview the built application

`npm run preview:app` serves the existing production frontend and Express API together on `http://127.0.0.1:5173`, bound to this Mac only. It retains the configured Supabase authentication and data store. It requires both build outputs and does not watch cloud files. Run `npm run build` after source changes; this preview intentionally serves the last built version. Stop any development session before starting it.

## Dependency changes and deployment

Commit `package.json` and `package-lock.json` together after changing dependencies. `npm run verify` starts with `npm run check:lockfile`, which uses npm's dry-run clean-install validation without changing installed packages. For dependency or recovery changes, also run a real `npm ci` and `npm run build` in a fresh checkout before pushing; an existing `node_modules` directory can hide a stale lockfile.

Vercel retains `npm ci` as its install command. See [npm clean-install behavior](https://docs.npmjs.com/cli/v11/commands/npm-ci/) and [Vercel Node version selection](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
