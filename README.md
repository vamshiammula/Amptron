# Amptron

Marketing site and dealer-application funnel for Amptron, an EV scooter manufacturer.
A React single-page app talks to an Express API that stores B2B dealer applications in
Supabase Postgres.

## Stack

| Layer    | Choice                                                       |
| -------- | ------------------------------------------------------------ |
| Client   | React 19, TypeScript, Vite 8, hand-written CSS               |
| API      | Express 5, TypeScript, Zod validation, Helmet, rate limiting |
| Database | Supabase Postgres with row level security                    |
| Tests    | Vitest, React Testing Library, Supertest, Playwright         |
| Tooling  | Prettier, oxlint, sharp image pipeline, GitHub Actions       |

## Getting started

```bash
npm install
cp .env.example .env   # then fill in the Supabase values
npm run dev
```

`npm run dev` starts Vite on <http://localhost:5173> and the API on port 3001. Vite
proxies `/api` to the API, so the browser only ever sees one origin and no CORS
configuration is needed.

To run without any Supabase credentials, set `APPLICATIONS_STORE=memory`. Applications
are then kept in process memory and discarded on restart, which is what the E2E suite
uses.

## Environment

Every variable is documented in [`.env.example`](.env.example). The ones that matter
most:

- `SUPABASE_URL` — project URL from the Supabase dashboard.
- `SUPABASE_SERVICE_ROLE_KEY` — preferred key. Bypasses RLS, so it can also read
  applications back for the admin endpoint. Server-side only.
- `SUPABASE_PUBLISHABLE_KEY` — fallback. RLS grants it `INSERT` and nothing else, so
  the API can accept applications but cannot read them.
- `ADMIN_API_KEY` — enables `GET /api/applications`. Unset, that route returns 404.
- `IP_HASH_SALT` — when set, each row stores a salted SHA-256 hash of the submitter IP
  instead of the IP itself. Unset, no IP is recorded.
- `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` — Workers AI embeddings for
  cross-language FAQ matching. Stay on the Cloudflare Workers Free plan so overage
  fails instead of billing. Greetings never call this API.

## FAQ assistant

The site assistant matches visitor questions to English FAQ pairs and returns the
stored answer unchanged. Greetings and thanks are handled locally. If no FAQ matches,
or the daily Workers AI allocation is used up, the visitor can leave contact details
for the admin **Support queries** queue. Load the test FAQ set from **Admin → FAQs**.

## Database

The `dealer_applications` table is created by the `dealer_applications` migration. Its
design notes:

- `CHECK` constraints mirror the Zod schema, so malformed rows cannot be written even
  if they bypass the API.
- A unique index on `lower(email)` enforces one application per business email; the API
  turns the resulting `23505` into a `409`.
- RLS is enabled with a single `INSERT` policy for `anon` and `authenticated`, and
  `SELECT`, `UPDATE` and `DELETE` are revoked from both. Reading requires the
  service-role key.

To lock this down further once a service-role key is deployed, drop the public insert
policy so only the service role can write:

```sql
drop policy "dealer_applications_insert_public" on public.dealer_applications;
revoke insert on public.dealer_applications from anon, authenticated;
```

## API

| Method | Route                  | Purpose                                               |
| ------ | ---------------------- | ----------------------------------------------------- |
| `POST` | `/api/applications`    | Submit a dealer application. Rate limited per IP.     |
| `GET`  | `/api/applications`    | List applications. Requires the `x-admin-key` header. |
| `GET`  | `/api/health`          | Liveness. No database access.                         |
| `GET`  | `/api/health/ready`    | Readiness, including Supabase reachability.           |
| `POST` | `/api/faq/match`       | Match a visitor question to a published FAQ.          |
| `GET`  | `/api/faq/suggestions` | Suggested questions for the site assistant.           |
| `POST` | `/api/support-queries` | Store unmatched or quota follow-up contact details.   |

`POST /api/applications` responds with `201` and `{ id, receivedAt, message }`. Failures
use a consistent shape:

```json
{
  "error": "validation_failed",
  "message": "Please correct the highlighted fields and try again.",
  "fieldErrors": { "email": "Enter a valid business email address." }
}
```

Status codes: `422` invalid fields, `409` duplicate email, `413` body too large, `429`
rate limited, `400` malformed JSON, `500` unexpected failure. The client renders
`fieldErrors` inline and `message` as a banner.

## Validation

[`shared/applicationSchema.ts`](shared/applicationSchema.ts) is the single source of
truth. The browser imports it for instant feedback, the API imports it to reject
anything that reaches the endpoint directly, and the Postgres `CHECK` constraints
restate the same limits at the storage layer.

## Images

Design exports live in `src/assets/raw`. `npm run images` resizes them to roughly twice
their largest CSS display size, converts them to WebP, and regenerates the favicon set
in `public/` from the logomark. This takes the shipped image payload from 8.0 MB to
425 KB. Commit both the raw sources and the generated output.

## Scripts

| Script                  | Purpose                                                 |
| ----------------------- | ------------------------------------------------------- |
| `npm run dev`           | Vite dev server and API with reload, in parallel        |
| `npm run build`         | Build the client to `dist` and the API to `dist-server` |
| `npm start`             | Run the built API, serving `dist` as static files       |
| `npm run images`        | Regenerate optimized images and favicons                |
| `npm test`              | Unit and integration tests                              |
| `npm run test:coverage` | The same, with a coverage report                        |
| `npm run test:e2e`      | Playwright suite against a production build             |
| `npm run typecheck`     | Typecheck client, server, tests and tooling             |
| `npm run lint`          | oxlint                                                  |
| `npm run format`        | Prettier, in place                                      |
| `npm run verify`        | Format check, lint, typecheck and tests                 |

## Testing

- **Unit and integration** (`npm test`) — the schema, the API through Supertest against
  an in-memory repository, the Supabase repository against a stubbed PostgREST client,
  and the React components through Testing Library. No network access required.
- **End to end** (`npm run test:e2e`) — Playwright builds the real bundle, serves it
  from Express with the in-memory store, and drives the full submit flow in Chromium
  and mobile WebKit.

## Deployment

```bash
npm ci
npm run build
NODE_ENV=production npm start
```

The API serves `dist` in production, so one process handles both the site and the API
and no CORS configuration is needed. Behind a reverse proxy, keep `trust proxy` at one
hop (the default) so rate limiting sees real client IPs. Once the site is HTTPS-only,
set `CSP_UPGRADE_INSECURE_REQUESTS=true`.

Hosting the client separately is also supported: set `CORS_ORIGINS` on the API and
`VITE_API_BASE_URL` at client build time.
