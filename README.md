# ROAMA Kids — The Great Signal Quest

An adult-organized global challenge platform built with Next.js, TypeScript, PostgreSQL, and Prisma. The browser never changes the global total directly: a completed adult confirmation creates one unique completion row inside a database transaction, and the server returns the accepted-row count.

## Architecture

- Next.js App Router renders the public campaign and challenge pages.
- Prisma is the PostgreSQL access layer; versioned SQL lives in `prisma/migrations/`.
- Admin passwords are bcrypt hashes. Admin sessions are signed, eight-hour, HttpOnly cookies (`Secure` in production, `SameSite=Strict`). All admin API handlers re-check that the account still exists.
- Registrations are idempotent via a client-generated random UUID retained for retry, with unique database constraint, challenge publication validation, server-side adult confirmation, transaction-safe completion + analytics insert, and authoritative count query.
- PostgreSQL-backed request buckets throttle registration (30 per network key per hour), admin login (8 per 15 minutes), and analytics (80 per hour). Network addresses are HMACed with `ABUSE_HASH_SECRET`; no raw address is stored. A scheduled cleanup should clear abuse hashes after 30 days and expired rate buckets after 24 hours.
- First-party analytics store event, optional published challenge, UTM source/medium/campaign, and app-store target only. No child identity is collected.
- The founder dashboard at `/admin` manages challenges and campaign content, targets, milestones, store URLs, and aggregate reports. CSV export contains aggregate challenge totals.

There were no official ROAMA image assets or verified store listings in the supplied workspace. The UI uses original CSS/SVG constellation art and shows no app-store button until an administrator configures real listing URLs. No founder challenge tasks or participation data are seeded.

## Requirements

- Node.js 22 (Prisma 7 requires Node.js 20.19 or later; Node 22 is the recommended LTS line)
- Docker Compose for local PostgreSQL
- A standard PostgreSQL database for production (`DATABASE_URL`)

## Run locally

```sh
cp .env.example .env
```

Set `SESSION_SECRET` and `ABUSE_HASH_SECRET` to different random values of at least 32 characters. For example, generate each with `openssl rand -base64 48` and store them only in your ignored local `.env` file. The example database URL matches the included local Docker database.

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
| `ADMIN_EMAIL` | Initial admin account email used by `npm run admin:create`. |
| `ADMIN_PASSWORD` | Temporary initial/admin reset password; never commit or retain in deployment config longer than needed. |

Store URLs are editable in the authenticated Campaign tab. Only enter the actual ROAMA Kids listings. The service does not invent a store destination.

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

It removes HMAC abuse hashes older than 30 days and rate-limit bucket keys older than 24 hours. The operator must schedule it; the app does not schedule background jobs itself. Back up PostgreSQL on the provider’s supported schedule, encrypt backups, and periodically test restore into a separate database. Never point integration tests at production.

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

The suite checks accepted registration increments, sequential and simultaneous retry idempotency, concurrent distinct registrations, draft rejection, and database-backed rate limits. Tests create and remove only their own uniquely named fixture records. Session signing, cookie flags, tamper rejection, and origin validation run without a database.

## Free hosting path (strict $0/month)

The least disruptive free-hosting target is **Netlify Free + Neon Free**. The existing app stays on the standard Next.js Node runtime, and Netlify's maintained OpenNext adapter supports the App Router, SSR, route handlers, and current stable Next.js releases. `netlify.toml` pins Node 22 and leaves framework adapter selection to Netlify's automatic detection.

1. Create a Neon project on the **Free** plan. Use its pooled PostgreSQL connection string (the `-pooler` host) as `DATABASE_URL`.
2. From a trusted local machine, set that Neon URL in the ignored `.env`, then run `npm run db:deploy`, `npm run db:seed`, and `npm run admin:create` to prepare the database and first admin. Never run tests against this database.
3. Connect the GitHub repository to a **Netlify Free** site. Keep the generated `*.netlify.app` address; no custom domain is needed.
4. Add `DATABASE_URL`, `SESSION_SECRET`, `ABUSE_HASH_SECRET`, and `NEXT_PUBLIC_SITE_URL` as private Netlify build/runtime variables. Set the site URL to the generated HTTPS `netlify.app` origin. Keep `ADMIN_EMAIL` and `ADMIN_PASSWORD` only in the trusted local environment used for `npm run admin:create`; remove `ADMIN_PASSWORD` after initialization. They are not needed by the deployed app.
5. Keep Netlify on Free with auto-recharge disabled, and keep Neon on Free. Netlify Free currently has a 300-credit monthly hard limit and pauses sites when it is reached. Neon Free currently includes 100 compute-hours and 1 GB storage per project, and suspends compute after inactivity. These ceilings prevent overage billing but can interrupt availability. Recheck plan terms before launch.

Cloudflare Workers can host Next.js via its OpenNext adapter, and Prisma documents `pg` support with Node compatibility. However, Workers Free has a 10 ms CPU limit per request. This application uses bcrypt password verification and database-backed dynamic SSR, so a free Worker may terminate real requests; proving otherwise requires an end-to-end Workers-runtime test. I have not migrated it to Cloudflare or deployed it. Netlify's Node function runtime avoids that specific runtime mismatch while preserving the existing application.

No hosting or database account has been connected, and deployment has not been attempted or verified. Do not select paid plans, add usage packs, enable auto-recharge, or attach a payment method for this $0 setup. If either free quota is exceeded, expect requests/builds/database compute to pause rather than upgrading.

## Privacy and launch review

The `/privacy` page is an explicit draft of this implementation, not a claim of legal compliance. Before international launch, the owner must add its legal identity and contact, review the rules for each market, decide on analytics disclosure/consent, document data-subject requests, configure and verify cleanup scheduling, and assess database/backup retention. Adult confirmation is a report of completion, not independent verification or universal legal parental consent.

Rate limits reduce automated bursts; they cannot prove that an activity occurred. Trust only proxy-supplied client address headers and configure the hosting proxy to strip untrusted incoming copies. Review aggregate suspicious-key counts as signals, not proof. No CAPTCHA is configured. There are no child accounts, uploads, comments, profile pages, or precise-location fields.

## Current limitations

- Docker Desktop is not installed in the current workspace, so PostgreSQL migrations and database-backed integration/API behavior have not been executed here. Install and start Docker Desktop, then run the local database commands above and the dedicated test-database commands below.
- No official app-store URLs, challenge content, campaign legal identity/contact, or final privacy review were supplied.
- Analytics source attribution is stored, but reports currently show aggregate event totals rather than detailed campaign-source breakdowns.
- Abuse-rate limits are database-backed, but CAPTCHA and a production proxy-specific rate-limit validation remain deployment tasks.
- The local Git repository is initialized on `main`; no commit or push has been made.
