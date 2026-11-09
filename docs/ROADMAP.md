# Roadmap

Each phase is shippable on its own. Implement one phase at a time (e.g. with
`/ship "Phase N: ..."`), test-first for behavior, and check the boxes here
when done. Design decisions live in `/CLAUDE.md`.

## Open questions

- [x] Domain name: `hanslistenia.com` (bought).
- [x] Logo as SVG: `public/hanslistenia_logo.svg` (wide 2:1 trace — a square
      mark is still needed for the favicon).
- [x] Coach contact: SINPE Móvil and WhatsApp are both `7255-4101`; SINPE
      account name: Hans Barrantes Gomez; email: `barstilldeath@gmail.com`.
- [ ] Shipping cost policy — open; keep the notice + "ask first" via WhatsApp.
- [x] Retention period: 6 months for receipts and buyer personal data.
- [x] Copy tone: "usted".

## Phase 1 — Foundation

- [x] Next.js (App Router, TS strict), ESLint, Prettier, Vitest, Playwright.
- [x] `src/app`, `src/domain`, `src/storage` layout; lint rule forbidding
      `domain/` from importing storage/framework code.
- [x] Env var validation at startup (Zod) with a documented `.env.example`.
- [x] Mongo client singleton; S3 client; structured logger (JSON, no PII).
- [x] S3 buckets (private receipts, public product images) with
      least-privilege IAM user — Terraform in `infra/`, AWS account
      `hanslistenia` (695646786339).
- [ ] Vercel project + preview deploys (then add its URL to
      `upload_origins` in `infra/variables.tf`); Atlas cluster.
- [x] Document `dev`/`test`/`lint`/`typecheck` commands in `CLAUDE.md`.

## Phase 2 — Admin auth

- [x] Login with username + password (argon2id hash from env). No TOTP.
- [x] Script to generate a strong password, its hash and the session secret.
- [x] Rate limiting + lockout (Mongo, TTL index).
- [x] Signed session cookie; server-side session check helper used by every
      admin action/route.
- [x] Logout; `noindex` on admin.

## Phase 3 — Products & catalog

- [x] Product domain model (option groups, price deltas, integer CRC) + tests.
- [x] Admin CRUD: create/edit/hide products, upload/reorder images.
- [x] Public catalog and product pages (static + revalidate on edit).
- [x] Option selection and computed price on the product page.
- [ ] TODO: E2E for product photos (upload/reorder/remove) against an s3mock
      container — steps in the TODO at the top of `e2e/catalog.spec.ts`.

## Phase 4 — Checkout & SINPE payment

- [ ] Cart (client-side) → checkout form with CR address cascading selects
      and postal code derivation (provincia/cantón/distrito dataset).
- [ ] Create order: snapshot items, generate `code` + `trackingToken`.
- [ ] Shipping-cost notice + WhatsApp link.
- [ ] Tracking page `/pedido/<token>`: status, SINPE instructions with order
      code, receipt upload (presigned S3), reference number, rejection reason,
      re-upload.
- [ ] Order status state machine with exhaustive tests.
- [ ] Admin orders list/filter by status; order detail with receipt viewer
      (presigned GET), confirm / reject with reason / cancel / complete;
      "Contactar por WhatsApp" link to buyer.
- [ ] Privacy notice page; 6-month retention/purge job (Vercel Cron).
- [ ] Same cron: delete product photos in S3 that no product references and
      are older than a day (uploaded but never saved, e.g. form cancelled).

## Phase 5 — Emails

- [ ] `EmailSender` interface + Resend implementation; templates in Spanish.
- [ ] Buyer: order created, payment confirmed, payment rejected.
- [ ] Coach: receipt uploaded.
- [ ] Email failure is logged, never fails the operation.
- [ ] Admin second factor: 6-digit login code emailed to the coach.

## Phase 6 — SEO & launch polish

- [ ] Metadata, canonical URLs, OG images, JSON-LD (`Product`, `Offer`,
      `Organization`).
- [ ] `sitemap.ts`, `robots.ts`; Lighthouse pass (performance, a11y, SEO).
- [ ] Home + "Sobre el coach" page with real content.
- [ ] Custom domain, Google Search Console, Resend domain verification.
- [ ] E2E happy path: browse → order → upload receipt → admin confirms →
      buyer sees confirmed status.
