# ROAMA Kids — The Great Signal Quest

An adult-organized, one-time ROAMA Kids campaign built with Next.js, TypeScript, PostgreSQL, and Prisma. The browser never changes the global total directly: an adult email verification creates at most one unique star inside a database transaction, and the server returns the authoritative verified-claim count.

## Architecture

- Next.js App Router renders the public campaign and challenge pages.
- Prisma is the PostgreSQL access layer; versioned SQL lives in `prisma/migrations/`.
- Admin passwords are bcrypt hashes. Verification uses PostgreSQL `pgcrypto` so bcrypt work does not consume Workers Free request CPU. The database must permit this extension (Neon supports it); migrations enable it. Admin sessions are signed, eight-hour, HttpOnly cookies (`Secure` in production, `SameSite=Strict`). All admin API handlers re-check that the account still exists.
- Adult email verification uses Resend's HTTPS API. A cryptographically random, one-use token is sent only after a published challenge is selected; PostgreSQL stores only its SHA-256 hash, a keyed adult-email digest, the optional pseudonym, and a 20-minute expiry. Token consumption, one-star-per-digest enforcement, permanent number allocation, and the verified counter are transaction-safe. Email addresses are sent transiently to Resend and are not stored in the campaign database or used for marketing.
- PostgreSQL-backed request buckets throttle email requests (5 per network key and 3 per email digest per hour), token redemption (10 per network key per hour), public star lookup (120 per network key per hour), admin login (8 per 15 minutes), and analytics (80 per hour). Network addresses are HMACed with `ABUSE_HASH_SECRET`; no raw address is stored. Cloudflare schedules cleanup of abuse hashes after 30 days, expired rate buckets after 24 hours, and expired email tokens after 24 hours.
- First-party analytics store event, optional published challenge, UTM source/medium/campaign, and app-store target only. No child identity is collected.
- The founder dashboard at `/admin` manages challenges and campaign content, targets, milestones, store URLs, and aggregate reports. CSV export contains aggregate challenge totals.

The ROAMA Kids fox logo was supplied directly by the owner. The shared brand component uses an optimized local WebP, with separate PNG browser and Apple touch icons derived from the same artwork. It replaces the temporary favicon taken from [roama.tech](https://roama.tech). The iOS App Store destination was verified against that official site; the default is `https://apps.apple.com/app/roama-kids/id6815158079`. The UI also retains its original constellation art. No founder challenge tasks or participation data are seeded.

## Million-star sky and public names

- `/stars` is a separate, zoomable/pannable map with exactly **1,000 × 1,000** stable star positions. An initial 2,000 × 2,000 pixel texture contains exactly one million distinct star pixels; the browser does not create a million DOM elements. An overview shows regional density and recent discoveries, with enlarged glints from actual unlit positions to keep the sky legible below pixel resolution. Zooming in draws individual stars rather than enlarged square pixels and loads the visible regions. Buttons, keyboard panning, and star-number lookup are available alongside pointer navigation. Camera bounds keep the sky in view, including near the first and last stars.
- Only an accepted, adult-confirmed challenge completion lights a star. Empty positions are not fabricated participation. Each new completion receives a unique permanent number from a transactional counter; retries and conflicts roll back that reservation. The sky accepts at most **1,000,000** stars. Existing completions receive stable numbers in migration order.
- A fictional star name is optional (40 characters maximum). Named submissions require explicit public-name acknowledgement as well as adult completion confirmation. URLs, email addresses, markup, and long numeric identifiers are rejected. Input checks cannot identify every real name or inappropriate word: the interface prohibits personal details, but names appear immediately without pre-publication moderation at the owner's request.
- The challenge detail page collects an adult email, an optional fictional public pseudonym, and adult completion confirmation. After email verification, the reveal view offers a downloadable PNG, native share where available, a public star link, and the official App Store CTA. New and existing verified emails use the same generic request response; a verified existing email recovers its original star.
- Public `/api/stars` returns at most 400 regional counts and 500 recent stars. Individual 50 × 50 regions return at most 2,500 public `{starNumber, starName}` records. The browser fetches at most four regions concurrently and retains at most 32 regions, not every completion. Star data refreshes approximately every 30 seconds.
- Authenticated `/admin` → **Star names** lists named stars in pages of 50 and can remove a public name without deleting the completion or changing its number/count. The owner still needs a published removal/contact procedure and final privacy review before promotion.

## Requirements

- Node.js 22 (Prisma 7 requires Node.js 20.19 or later; Node 22 is the recommended LTS line)
- Docker Compose for local PostgreSQL
- A standard PostgreSQL database for production (`DATABASE_URL`)

## Run locally

```sh
cp .env.example .env
```

Set `SESSION_SECRET`, `ABUSE_HASH_SECRET`, and `ADULT_EMAIL_HASH_SECRET` to different random values of at least 32 characters. For example, generate each with `openssl rand -base64 48` and store them only in your ignored local `.env` file. Keep `ADULT_EMAIL_HASH_SECRET` stable: rotating it prevents existing verified addresses from recovering their stars. The example database URL matches the included local Docker database.

```sh
docker compose up -d postgres
npm install
npm run db:generate
npm run db:deploy
npm run db:seed
npm run db:check
npm run dev
```

The campaign opens at `http://localhost:3000`. No challenges are seeded: create real founder-approved challenge content in the admin after the first admin is initialized.

Email claims remain unavailable until the required Resend configuration is present. Only use a sender address whose domain is currently verified in the Resend account. Do not put API keys in the repository or frontend configuration.

## Initialize the first admin

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` privately in `.env`; use a unique strong password with at least 14 characters. Then run:

```sh
npm run admin:create
```

This command creates or rotates that account with a bcrypt password hash. There is no public admin registration endpoint. Remove `ADMIN_PASSWORD` from the environment after initialization. To rotate credentials later, set a new password and run the same trusted local command.

Sign in at `/admin`. Admin actions require the signed session cookie and a same-origin request. Configure `NEXT_PUBLIC_SITE_URL` to the exact public origin, including scheme, so the origin check matches.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Standard PostgreSQL connection string. Use a dedicated test database for tests. |
| `NEXT_PUBLIC_SITE_URL` | Canonical HTTPS site origin; used for metadata and same-origin mutation checks. |
| `SESSION_SECRET` | HMAC signing secret for admin sessions (32+ chars). |
| `ABUSE_HASH_SECRET` | Separate secret used to HMAC network keys for throttling (32+ chars). |
| `ADULT_EMAIL_HASH_SECRET` | Separate, stable HMAC key for one-way adult-email digests (32+ chars). |
| `RESEND_API_KEY` | Private server-side Resend API key used only for transactional verification messages. |
| `RESEND_FROM_EMAIL` | Sender name and address on a domain verified in the Resend account. |
| `RESEND_SENDER_DOMAIN_VERIFIED` | Set to `true` only after confirming the sender domain is currently verified in Resend; the provider remains authoritative and rejects unverified senders. |
| `ADMIN_EMAIL` | Initial admin account email used by `npm run admin:create`. |
| `ADMIN_PASSWORD` | Temporary initial/admin reset password; never commit or retain in deployment config longer than needed. |

Store URLs are editable in the authenticated Campaign tab. Only enter the actual ROAMA Kids listings. The service does not invent a store destination.

For Cloudflare, store `RESEND_API_KEY`, `ADULT_EMAIL_HASH_SECRET`, `ABUSE_HASH_SECRET`, and `SESSION_SECRET` as Worker secrets (for example with `wrangler secret put NAME`); set `RESEND_FROM_EMAIL`, `RESEND_SENDER_DOMAIN_VERIFIED=true`, and `NEXT_PUBLIC_SITE_URL` as Worker variables. Never paste secret values into chat or commit them. Set the verification flag only after confirming the sender domain remains verified in Resend, and supply the owner's approved challenge text and safety guidance before enabling participation.

## Database changes and maintenance

Create a development migration after changing `prisma/schema.prisma`:

```sh
npm run db:migrate
npm run db:generate
```

Apply committed migrations in a deployment:

```sh
npm run db:deploy
```

Run privacy cleanup daily from a trusted scheduled job:

```sh
npm run db:maintenance
```

It removes HMAC abuse hashes older than 30 days, rate-limit buckets older than 24 hours, and email-verification tokens more than 24 hours past expiry. Cloudflare deployments schedule equivalent SQL daily at 03:00 UTC through the Worker cron trigger; verify successful executions in Workers Logs. Other hosting providers still require an external schedule. Back up PostgreSQL on the provider’s supported schedule, encrypt backups, and periodically test restore into a separate database. Never point integration tests at production.

## Checks and tests

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

The database integration suite only runs when `TEST_DATABASE_URL` points to a dedicated database whose name contains `test`; otherwise those tests are skipped. For local integration tests, create the database once and apply migrations specifically to it:

```sh
docker compose exec -T postgres psql -U roama -d postgres -c 'CREATE DATABASE roama_test;'
DATABASE_URL='postgresql://roama:roama_local_dev@localhost:5432/roama_test?schema=public' npm run db:deploy
TEST_DATABASE_URL='postgresql://roama:roama_local_dev@localhost:5432/roama_test?schema=public' npm test
```

The suite checks accepted registration increments, sequential and simultaneous retry idempotency, concurrent distinct registrations, unique permanent star numbers, the million-star cap, name consent/validation, bounded public API responses, authenticated same-origin name removal, draft rejection, and database-backed rate limits. The bitmap and tile-partition tests verify exactly one million distinct positions, not a sampled or decorative approximation. Tests create and remove only their own uniquely named fixture records. Session signing, cookie flags, tamper rejection, and origin validation run without a database.

## Cloudflare Workers Free + Neon Free

The app includes an OpenNext Cloudflare build and a daily privacy-cleanup trigger. The configuration provisions no R2, Images, or paid domain. A free `workers.dev` hostname is sufficient. **The current deployment is a preview, not a verified fit for Workers Free CPU limits.**

1. Create a **Neon Free** project. Save its pooled PostgreSQL URL in an ignored local `.env` as `DATABASE_URL`. Do not paste credentials into chat, commit them, or put them in `wrangler.jsonc`.
2. Generate separate random `SESSION_SECRET` and `ABUSE_HASH_SECRET` values (32+ characters each). Set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` (14+ characters) locally.
3. Initialize the database with `npm run db:deploy`, `npm run db:seed`, `npm run admin:create`, and `npm run db:check`. No challenge activities or participation counts are fabricated.
4. Run `npx wrangler login`. The Worker name in `wrangler.jsonc` and its `WORKER_SELF_REFERENCE` service must match.
5. Upload `DATABASE_URL`, `SESSION_SECRET`, and `ABUSE_HASH_SECRET` with `npx wrangler secret put VARIABLE_NAME` (interactive secret input). Do not upload `ADMIN_PASSWORD`; it is only used locally for account initialization.
6. Set `NEXT_PUBLIC_SITE_URL` locally to the final HTTPS `workers.dev` origin **before building**, and upload the same value with `wrangler secret put NEXT_PUBLIC_SITE_URL`. This controls canonical metadata and same-origin checks.
7. Run `npm run cf:deploy`. For local Workers-runtime testing use `npm run cf:preview`; supply local runtime secrets through an ignored `.dev.vars` file. Plain `next dev` and the existing Node hosting path remain available.
8. Verify `/`, `/api/campaign`, `/privacy`, `/admin`, an authenticated admin request, and a real approved challenge's completion flow. Check Workers CPU usage, logs, and the daily cleanup trigger. Remove the temporary `ADMIN_PASSWORD` from local configuration after storing it in a password manager.

Workers Free currently allows **100,000 requests/day** and **10 ms CPU per request**. Neon Free has its own compute/storage limits and may suspend inactive compute. Database wait time does not consume Worker CPU, but Next.js SSR, Prisma, and cold requests still must be measured on the deployed Worker. Moving bcrypt to PostgreSQL removes one known CPU hotspot; a successful build or local preview alone does **not** establish that all requests fit the free quota. Do not upgrade plans automatically; quota exhaustion can interrupt availability. Consult the current [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) and Neon dashboard before launch.

In Workers, rate limiting uses Cloudflare's `CF-Connecting-IP` header and database pools do not retain used sockets between requests (`maxUses: 1`). Standard Node deployments preserve their existing pooling/proxy behavior. Never cache `/api/*` or `/admin` using a custom CDN cache-everything rule.

The schema generates separate Node and Cloudflare clients. The `@roama/prisma-client` alias defaults to Node for scripts, tests, and ordinary Next.js builds. `cf:build` selects the Cloudflare client with a Webpack module replacement, leaving its `.wasm?module` import for OpenNext/Wrangler to bundle statically. Workers prohibit the Node client's dynamic `WebAssembly.Module` compilation. The Cloudflare build uses Webpack to avoid Turbopack's overly broad WASM file tracing; ordinary Node builds retain their existing compiler.

Scoped npm overrides keep the adapter's `glob` dependency and the local preview runtime's `undici` dependency on patched releases within their existing major versions. Do not use `npm audit fix --force` to downgrade the deployment toolchain.

### Preview verification (2026-10-25)

- Deployed at [roama-signal-quest.keremeyubogluu.workers.dev](https://roama-signal-quest.keremeyubogluu.workers.dev).
- The public campaign API, real admin login, and authenticated reports/config/challenge APIs returned HTTP 200. Repeated and five concurrent public reads returned the real count of zero.
- Mobile width 390 px had no horizontal overflow; the canonical origin was correct.
- Twenty-seven automated tests passed using a separate `roama_test` database. A local Workers-runtime probe verified completion insertion, retry idempotency, cross-origin rejection, and scheduled cleanup without adding fake activity or completions to production.
- Browser checks covered named-star submission, the direct star receipt, unnamed completion from the challenge-detail page, admin name removal without deleting the star, zoom/pan, keyboard navigation, first/last star lookup, and modal Escape/focus restoration/reset. Layouts at 390, 666, and 1,440 px had no horizontal overflow. A responsive rule that hid the final odd-numbered challenge card on tablets was removed.
- The compiled Workers runtime also passed named completion, retry idempotency, consent/origin rejection, region reads, admin login, and name removal while preserving the accepted completion. Production `/stars`, public region reads, secure admin login, and the star-management API were verified; production participation remains zero.
- **CPU remains a launch blocker for a guaranteed free setup:** sampled live campaign API requests used approximately 22-252 ms CPU; one successful login used 470 ms and a reports request used 751 ms. These samples returned successfully but exceed the documented 10 ms Free request limit. The account's active subscription tier was not independently confirmed; no subscription was changed. Do not interpret successful requests as proof of Free-plan reliability.
- The owner chose to retain this deployment as a preview. Final challenge content, legal identity/contact, privacy review, and a public name-removal contact procedure remain outstanding. The official iOS App Store link is now connected; no Android listing has been invented. No paid plan was enabled by this setup.

## Alternative free hosting path

The least disruptive free-hosting target is **Netlify Free + Neon Free**. The existing app stays on the standard Next.js Node runtime, and Netlify's maintained OpenNext adapter supports the App Router, SSR, route handlers, and current stable Next.js releases. `netlify.toml` pins Node 22 and leaves framework adapter selection to Netlify's automatic detection.

1. Create a Neon project on the **Free** plan. Use its pooled PostgreSQL connection string (the `-pooler` host) as `DATABASE_URL`.
2. From a trusted local machine, set that Neon URL in the ignored `.env`, then run `npm run db:deploy`, `npm run db:seed`, and `npm run admin:create` to prepare the database and first admin. Never run tests against this database.
3. Connect the GitHub repository to a **Netlify Free** site. Keep the generated `*.netlify.app` address; no custom domain is needed.
4. Add `DATABASE_URL`, `SESSION_SECRET`, `ABUSE_HASH_SECRET`, and `NEXT_PUBLIC_SITE_URL` as private Netlify build/runtime variables. Set the site URL to the generated HTTPS `netlify.app` origin. Keep `ADMIN_EMAIL` and `ADMIN_PASSWORD` only in the trusted local environment used for `npm run admin:create`; remove `ADMIN_PASSWORD` after initialization. They are not needed by the deployed app.
5. Keep Netlify on Free with auto-recharge disabled, and keep Neon on Free. Netlify Free currently has a 300-credit monthly hard limit and pauses sites when it is reached. Neon Free currently includes 100 compute-hours and 1 GB storage per project, and suspends compute after inactivity. These ceilings prevent overage billing but can interrupt availability. Recheck plan terms before launch.

Netlify's Node function runtime avoids the Workers-specific 10 ms CPU constraint. Cloudflare deployment is now separately configured above; use measured Workers-runtime results to decide which free platform can reliably host this application.

Cloudflare and Neon are connected for the preview described above; the Netlify alternative has not been deployed. Do not select paid plans, add usage packs, enable auto-recharge, or attach a payment method for this $0 target. If a free quota is exceeded, accept interrupted availability rather than upgrading automatically.

## Privacy and launch review

The `/privacy` page is an explicit draft of this implementation, not a claim of legal compliance. Before international launch, the owner must add its legal identity and contact, review the rules for each market, decide on analytics disclosure/consent, document data-subject requests, configure and verify cleanup scheduling, and assess database/backup retention. Adult confirmation is a report of completion, not independent verification or universal legal parental consent.

Rate limits reduce automated bursts; they cannot prove that an activity occurred. Trust only proxy-supplied client address headers and configure the hosting proxy to strip untrusted incoming copies. Review aggregate suspicious-key counts as signals, not proof. No CAPTCHA is configured. There are no child accounts, uploads, comments, profile pages, or precise-location fields.

## Current limitations

- Docker is optional when using Neon. Database integration tests still require a separate database whose name contains `test`; never use the live campaign database for tests.
- Founder-approved challenge content, a currently Resend-verified sender domain, private Resend/secret configuration, campaign legal identity/contact, and final privacy review are still required. No actual Resend delivery has been verified from this workspace. Official branding and the iOS App Store link are connected; no Android store URL has been verified.
- Analytics source attribution is stored, but reports currently show aggregate event totals rather than detailed campaign-source breakdowns.
- Abuse-rate limits are database-backed and Cloudflare client addresses are supported, but CAPTCHA and live abuse/load validation remain deployment tasks.
