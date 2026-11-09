# hanslistenia-store

Online store for **Hanslistenia**, a calisthenics training center in Costa Rica.
The coach sells made-to-order clothing. Payments are manual via SINPE Móvil:
the buyer pays, uploads a screenshot, and the coach verifies it in his bank app.

The global rules in `~/.claude/CLAUDE.md` apply. This file only adds what is
specific to this project.

## Scope — what this app is NOT

- No inventory / stock tracking (everything is made to order).
- No payment gateway, no card payments. SINPE only, verified by a human.
- No shipping integration or tracking. After payment is confirmed the coach
  coordinates delivery directly with the buyer (usually WhatsApp).
- No buyer accounts. Guest checkout only.
- No WhatsApp API. WhatsApp is only plain `https://wa.me/<number>` links.
- Spanish only (`es-CR`). No i18n framework.

## Stack

- **Next.js (App Router) + TypeScript (strict)**, hosted on **Vercel Pro**.
- **MongoDB Atlas (free tier, M0)** — cache a single `MongoClient` per server
  instance; never open a connection per request (M0 has a connection cap).
- **AWS S3** — two separate locations:
  - `receipts` — **private**. SINPE screenshots. Upload and view only through
    short-lived presigned URLs. Never public, never in logs.
  - `products` — public-read product images.
- **Resend** for transactional email.
- Tests: **Vitest** (unit/domain), **Playwright** (E2E happy path).
- Next.js 16 differs from older versions; see `AGENTS.md` and read the bundled
  docs in `node_modules/next/dist/docs/` before using an unfamiliar API.

## Commands (npm, Node ≥ 24)

```
npm run dev           # local dev server (needs .env.local, see .env.example)
npm test              # Vitest unit tests (src/**/*.test.ts)
npm run test:e2e      # Playwright; builds and starts the app with placeholder env
npm run lint          # ESLint, including layer-boundary rules
npm run typecheck     # next typegen + tsc
npm run format        # Prettier (format:check in CI)
```

Run `test`, `lint`, `typecheck` and `format:check` before considering work done.

## Architecture (layers)

```
src/app/        presentation: pages, route handlers, server actions
src/domain/     business rules: orders, products, payments, status transitions
src/storage/    data access: Mongo repositories, S3 file storage, email sender
src/composition/ composition root: builds domain services with storage impls
src/config/     validated env (getEnv) and the configured logger (getLogger)
src/shared/     dependency-free utilities usable by any layer (logger core,
                globalSingleton)
```

- `app/` uses domain services obtained from `@/composition`; it never imports
  `storage/` or Mongo/AWS/Resend.
- `shared/` imports nothing from other layers or vendors.
- Per-instance clients (Mongo, S3, …) use `globalSingleton` from
  `@/shared/global-singleton` so dev hot reloads don't leak connection pools.

- `domain/ports/` defines interfaces (`OrderRepository`, `ProductRepository`,
  `ReceiptStorage`, `ImageStorage`, `EmailSender`); `storage/` implements them.
- `domain/` never imports Mongo, AWS, Resend, Next.js/React, `app/`,
  `storage/` or `config/` — it receives dependencies via ports.
- `storage/` may import only `@/domain/ports/*` from the domain, never `app/`.
- These boundaries are enforced by ESLint (`eslint.config.mjs`) and covered by
  `src/architecture/boundaries.test.ts`. Never disable them.
- Env is read only through `getEnv()`; the server refuses to start on invalid
  config (`src/instrumentation.ts`). Add new vars to the schema in
  `src/config/env.ts` **and** to `.env.example` and `playwright.config.ts`.
- Log via `getLogger()` with structured fields. The logger redacts PII-like keys,
  but don't rely on it: log order codes/ids, not personal data.
- Validate all input at the boundary (`app/`) with a schema library (Zod).

## Domain

### Order statuses

```
pendiente_pago → comprobante_enviado → pago_confirmado → completado
                        ↓      ↑
                  pago_rechazado (reason required; buyer can re-upload)
cancelado  — allowed from any state before pago_confirmado
```

Transitions live in one place in `domain/` and are unit-tested exhaustively.
Invalid transitions are rejected with a typed error.

### Order identity

- `code`: human-readable, sequential (`HC-1042`). Used in the SINPE description
  and in emails. **Not** sufficient to view an order.
- `trackingToken`: random ≥128-bit token. The buyer's tracking page is
  `/pedido/<trackingToken>`. Store only a hash of it if feasible.

### Order data

- Buyer: full name, cédula, phone, email.
- Address: provincia → cantón → distrito (cascading selects), postal code
  derived from the distrito (never typed by the user), otras señas, optional note.
- Items: **snapshot** of product name, unit price, selected options, quantity at
  purchase time. Later product edits never change existing orders.
- Payment: receipt screenshot key (S3), SINPE reference number (comprobante),
  rejection reason, timestamps for each status change.
- Shipping cost is **not** calculated. Checkout shows a notice that shipping may
  cost extra and links to the coach's WhatsApp.

### Products (generic — the coach defines everything)

- name, slug (auto from name, unique), description, base price in CRC
  (integer colones), images (ordered), active flag, optional production-time note.
- Option groups defined per product (e.g. `Talla: S, M, L`), each value with an
  optional price delta.
- Money is always integer colones. Never floats.

## Admin (single user)

- Credentials come from env vars: `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`
  (argon2id hash — never the plain password), `ADMIN_TOTP_SECRET`.
- Login requires password **and** TOTP code.
- Failed attempts are rate-limited and locked out per IP/username (state in Mongo
  with a TTL index).
- Session: signed cookie, `httpOnly`, `Secure`, `SameSite=Strict`, short expiry.
- Every admin route handler and server action re-checks the session server-side.
  Middleware alone is not enough.
- `/admin/**` is `noindex` and excluded from the sitemap.

## Emails

| To    | Trigger           | Content                                       |
| ----- | ----------------- | --------------------------------------------- |
| Buyer | order created     | summary, SINPE instructions, tracking link    |
| Buyer | payment confirmed | confirmation, coach will contact for delivery |
| Buyer | payment rejected  | reason, link to re-upload                     |
| Coach | receipt uploaded  | order summary, link to review in admin        |

Email failures must not fail the order operation; log and continue.

## SEO

- Product and catalog pages statically generated, revalidated on admin edits.
- `generateMetadata` per page, canonical URLs, Open Graph images.
- JSON-LD: `Product` + `Offer` (`priceCurrency: "CRC"`), `Organization`.
- `sitemap.ts` and `robots.ts`. Order and admin pages are `noindex`.
- `next/image` for all images; `lang="es-CR"`.

## Privacy (Ley 8968)

- Cédula, address, phone, email and receipts are personal data. Never log them;
  log order code / order id instead.
- Privacy notice page linked from checkout.
- Retention: receipts and order personal data are kept for **6 months**, then
  purged by a scheduled job (Vercel Cron). The clock starts at the order's
  last status change (`completado` / `cancelado`, or creation for orders left
  in `pendiente_pago`), so an open order never loses its data. The privacy
  notice states this period.

## Conventions

- Code, identifiers, comments: English. User-facing copy: Spanish (Costa Rican),
  always "usted" — never "vos".
- Status values stay in Spanish as listed above (they appear in the UI and DB).
- Roadmap and progress: `docs/ROADMAP.md`.
