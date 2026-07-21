# Candy Hon Store — Architecture & Patterns Analysis

An analysis of the `candy-hon-store` Next.js project, written so that its architecture and conventions can be reused as a reference for a new, different project. This is documentation only; no source files were modified.

Candy Hon is a bilingual (Arabic / English, RTL-first) online candy/sweets store for the Jordanian market. It is a single Next.js App Router application backed entirely by Supabase (Postgres + Auth + Storage + Realtime), with no separate backend service. Orders are placed by logged-in customers, fulfilled manually by the shop owner through an admin dashboard, and new-order notifications are pushed to the owner over Telegram. There is no online payment processor — payment is cash-on-delivery or manual Cliq transfer.

---

## 1. Tech Stack & Key Dependencies

The stack is deliberately lean — a frontend framework plus Supabase-as-backend, with a handful of focused libraries.

- **Framework:** Next.js `^16.2.7` (App Router) on React `19.1`. Note this is a very recent/bleeding-edge Next version — one consequence visible in the code is that middleware has been renamed to "proxy" (see `proxy.ts`).
- **Language / tooling:** TypeScript `^5`, ESLint `^9` with `eslint-config-next`.
- **Backend:** Supabase — `@supabase/supabase-js ^2.104` and `@supabase/ssr ^0.6` (the SSR-aware cookie-based client helper). Supabase provides Postgres, Auth (Google OAuth), Storage (product images), and Realtime.
- **State management:** Zustand `^5` with the `persist` middleware for the cart and language stores; a third non-persisted Zustand store manages the product cache and realtime subscription.
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/postcss`), driven heavily by CSS custom properties (e.g. `--cream`, `--gold`, `--pink`, `--dark`) defined in `app/globals.css`. Google fonts `Fredoka` (Latin display) and `Tajawal` (Arabic) are loaded through `next/font`.
- **Animation:** `framer-motion ^12` — used pervasively for page transitions, card reveals, cart/modal slide-ins, and the admin's swipe-to-advance order cards.
- **Notifications / UX:** `sonner` for toasts (RTL-configured in the root layout).
- **Image handling:** `browser-image-compression` (client-side compression before upload). No server image optimization — `next.config.ts` sets `images.unoptimized: true` and instead all remote images are proxied/resized through the free `images.weserv.nl` CDN.
- **Notifications integration:** Telegram Bot API (`app/api/telegram/route.ts`), triggered on new orders. Env vars `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.
- **Analytics:** `@vercel/analytics`, plus a homegrown page-view counter (see below).
- **Scraping/import tooling (dev-only, not runtime):** `puppeteer` and `cheerio` — used by one-off scripts in `scripts/` to scrape the shop's previous Vatrin storefront. These should not ship to a new project.

Required environment variables (`.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_OWNER_EMAIL` (the master admin), and the two Telegram vars.

---

## 2. Overall Architecture

### App Router structure

Routing uses the App Router under `app/`. The root `app/layout.tsx` is a Server Component that sets `<html lang="ar" dir="rtl">`, loads fonts, wires up the global chrome (`Navbar`, `FloatingCart`, `Footer`, `Toaster`, `PageTracker`, `RealtimeSync`, Vercel `Analytics`), and adds preconnect/dns-prefetch hints for the Supabase and weserv CDN hosts. Notably it declares `export const dynamic = 'force-dynamic'` to prevent build-time prerendering (because pages depend on Supabase env/data).

Routes:
- `/` (`app/page.tsx`) — marketing hero + product catalog.
- `/(auth)/login` — Google OAuth login (route group keeps the URL clean).
- `/checkout`, `/success`, `/orders` — the customer purchase flow.
- `/admin` — the owner dashboard (tabbed).
- `app/api/*` — four route handlers: `auth/callback`, `telegram`, `track`, `migrate-images`.
- Standard App Router convention files: `error.tsx`, `loading.tsx`, `not-found.tsx`.

### Client vs Server components

The split is pragmatic rather than doctrinaire. **Almost every page and component is a Client Component (`'use client'`).** Data fetching happens client-side directly against Supabase using the browser client and the user's auth cookie, with Postgres Row Level Security enforcing access. Server Components / server-side data fetching are used only where required: the API route handlers, and the `lib/supabase/server.ts` cookie-aware client (used by `/api/track`). This "thick client + RLS" model means the app leans on the database for authorization rather than a server/API tier.

### Data fetching & the product cache

The catalog is served through a dedicated Zustand store, `store/productStore.ts`, which is the most architecturally interesting piece:
- It caches products in memory with a **stale-while-revalidate** policy (5-minute TTL). If cached data exists it is shown instantly and refreshed silently in the background; only a cold load shows skeletons.
- **Pagination** is cursor-less: it fetches `PAGE_SIZE + 1` (25) rows and infers `hasMore` from whether the extra row came back, avoiding a separate `count` query. `ProductGallery` drives infinite scroll via an `IntersectionObserver` sentinel.
- It owns a **Realtime subscription** to the `products` table and patches its in-memory list on INSERT/UPDATE/DELETE so stock/availability stay live across the whole app.
- `invalidate()` lets the admin bust the cache after edits.

### Realtime approach

Realtime is used in three places, all via `supabase.channel(...).on('postgres_changes', ...)`:
1. **Global product sync** — mounted once through the invisible `RealtimeSync` component in the layout, which just calls `subscribeRealtime()` / `unsubscribeRealtime()` on the product store.
2. **Customer order tracking** — `/orders` and `/success` subscribe (filtered by `user_id` / order `id`) to reflect status changes live.
3. **Admin dashboard** — subscribes to all `orders` and `products` changes and refetches.

### Session management

`proxy.ts` at the project root is Next 16's renamed middleware. It runs on nearly every request, creates an SSR Supabase client from request cookies, calls `supabase.auth.getUser()` to refresh the session, and re-writes cookies with a 400-day max-age so sessions survive browser restarts. The browser client in `lib/supabase/client.ts` also forces `cache: 'no-store'` on all fetches to avoid stale reads.

---

## 3. Data Model

The schema lives in `supabase-schema.sql`; `types.ts` mirrors the core tables as TypeScript interfaces. Important caveat: **the checked-in schema is not the full picture** — the code references tables and RPCs (`offers`, `promo_codes`, and RPCs `get_active_offers`, `validate_promo_code`, `use_promo_code`, `admin_delete_order`) plus columns (`orders.promo_code`, `orders.discount_amount`) that were added later and are not in `supabase-schema.sql`. Treat the SQL file as a starting snapshot, not the source of truth.

### Tables

- **`products`** — `id (uuid)`, `name` (legacy/primary, mirrors Arabic name), `name_ar`, `name_en`, `description`, `price`, `original_price` (for sale strikethrough), `image_url` (main) + `images text[]` (gallery, up to 5), `is_available`, `category (text)`, `stock`, `allow_preorder`, `restock_date`, `created_at`.
- **`orders`** — `id`, `user_id` → `auth.users`, customer fields (`customer_name`, `customer_phone`, `delivery_address`, `delivery_city`, `delivery_fee`), `total_amount`, `status` (`confirmed` | `processing` | `completed`), `notes`, `created_at`. (Plus later-added `promo_code`, `discount_amount`.)
- **`order_items`** — `id`, `order_id` → `orders` (ON DELETE CASCADE), `product_id` → `products`, `quantity`, `price` (price snapshot at purchase), `note`, `is_preorder`.
- **`admins`** — single-column PK on `email`; seeded with the owner email.
- **`store_settings`** — a singleton row (`id = 1`) holding the `categories text[]` and bilingual announcement-bar text.
- **`page_views`** — `date (PK)` + `views` counter for the homegrown analytics.

### RPCs (Postgres functions)

Business logic that must be atomic or must bypass RLS lives in `SECURITY DEFINER` functions:
- `handle_checkout_inventory(jsonb)` — atomically decrements stock, raising an exception if insufficient.
- `increment_page_views(date)` — upsert-increment the daily counter.
- `is_admin()` — checks the caller's JWT email against `admins`; used everywhere for authorization and to avoid RLS recursion.
- `get_admins_list()` — returns admins bypassing RLS.
- (Later additions referenced in code: `get_active_offers`, `validate_promo_code`, `use_promo_code`, `admin_delete_order`.)

### RLS

Every table has RLS enabled. Products/settings/admins are world-readable; writes are gated by `is_admin()`. Orders and order_items are scoped so a customer sees only their own (`auth.uid() = user_id`), while admins can manage all. The `admins` table is deliberately world-readable for SELECT to prevent an infinite-recursion problem when policies reference the same table.

### types.ts mirroring

`types.ts` defines `Product`, `Order`, `OrderItem`, `OrderStatus`, `CartItem`, `Admin`, `StoreSettings`, plus the Zustand store shapes (`CartStore`, `LanguageStore`) and form/editing helper types (`ProductFormData`, `EditingOrderItem`). It closely tracks the base schema but, like the SQL, predates the offers/promo features — much of the newer code passes `any` instead.

---

## 4. Core Domain Flows

**Catalog / browsing.** The homepage renders a Framer-Motion hero then `ProductGallery`, fed by the product store. The gallery handles category filter tabs (from `store_settings.categories`), a debounced (300ms) client-side search across name/description, and infinite scroll. Each `ProductCard` shows sale badges, pre-order badges, or an unavailable overlay, prefetches the full-res image on hover, and opens a lazy-loaded `ProductModal`. `ImageCarousel` is a custom pointer/swipe carousel (no library) used at both card and full sizes.

**Cart.** `store/cartStore.ts` (Zustand + `persist` to `localStorage`) holds items keyed by a generated `cartItemId` so the same product with different notes can coexist. `FloatingCart` is a global slide-in drawer. A `_hasHydrated` flag guards against SSR/localStorage hydration mismatches — components return `null` until both mount and hydration complete (a pattern repeated across the app).

**Checkout.** `/checkout` requires a session (redirects to login otherwise). It computes subtotal, applies a promo code (`validate_promo_code` RPC), auto-applies active offers (`get_active_offers` — percentage sales and free-item thresholds), and computes delivery fee from `lib/deliveryAreas.ts`. On submit it: validates a Jordanian phone regex and a 5 JOD minimum; calls `handle_checkout_inventory` for non-pre-order items only; increments promo usage; inserts the `orders` row then the `order_items`; clears the cart; and routes to `/success`. Payment is COD or manual Cliq transfer (a static account number is displayed) — there is no payment gateway.

**Order flow / fulfillment.** `/success` shows the confirmation (with a pre-order notice if applicable) and live status. `/orders` lists the customer's past orders with live status updates. The shop owner works orders from the admin Orders tab. Telegram notification of new orders is sent via `POST /api/telegram` (designed to accept either a direct call or a Supabase DB webhook payload).

**Admin panel** (`app/admin/page.tsx`) gates on `is_admin()`, keeps the active tab in the URL query string, and renders a desktop tab bar / mobile bottom-nav. Tabs:
- **Orders** — desktop table + mobile swipe cards (swipe to advance/reverse status). Edit an order's line items (which reconciles product stock), change status, delete via `admin_delete_order` RPC (restores stock), WhatsApp-contact the customer with a prefilled message.
- **Products** — full CRUD form with up to 5 images (client-compressed to WebP, uploaded to the `product-images` Storage bucket), pre-order toggle with restock date, availability toggle, and search. Delete gracefully detects a foreign-key error (product referenced by orders) and advises disabling instead.
- **Stats** — computes today/month/all-time orders + revenue from already-loaded orders, a text-bar 30-day sales chart, top-5 products (aggregated client-side from `order_items`), status breakdown, and visitor charts from `page_views`.
- **Settings** — manage the category list and the bilingual announcement bar (persisted to the `store_settings` singleton).
- **Promo** — CRUD promo codes (percentage, duration→expiry, min order).
- **Offers** — CRUD automatic offers: `sale_percent` (time-boxed % off) and `free_item` (free items above a min-order threshold).
- **Admins** — owner-only: add/revoke co-admins by email; the master owner (`NEXT_PUBLIC_OWNER_EMAIL`) can't be revoked and you can't remove yourself.

**Auth.** Google OAuth only. `/login` calls `signInWithOAuth` redirecting to `/api/auth/callback`, which exchanges the code for a session, checks `is_admin()` / owner email, and redirects admins to `/admin` and customers to their destination. `Navbar` reflects auth state via `onAuthStateChange`.

**i18n / language.** No i18n library. A persisted Zustand `languageStore` holds `'ar' | 'en'`; every component defines a local `t` object with inline ternaries and flips `dir`/layout accordingly. The document defaults to Arabic RTL.

**Delivery areas.** `lib/deliveryAreas.ts` is a hardcoded two-zone (3 JOD / 5 JOD) list of Jordanian cities with bilingual names and fee lookup helpers. An `__other__` option surfaces a "contact us on WhatsApp" path for uncovered areas. (Two exported helpers — `getEffectiveDeliveryFee` and `hasDeliveryDiscount` — are vestigial: they ignore the subtotal argument and always defer/return false.)

**Pre-orders.** `lib/preorderUtils.ts` computes days-until-restock and formats bilingual "ships in ~N days" messages. Pre-order items skip inventory decrement at checkout and are flagged through the cart, checkout, success page, and admin views.

**Image pipeline.** Upload path: client picks image → `lib/compressImage.ts` compresses to ~0.4 MB WebP via `browser-image-compression` → uploaded to Supabase Storage. Display path: `lib/optimizeImage.ts` rewrites Supabase/Vatrin image URLs through `images.weserv.nl` (free CDN) with per-context width/quality presets (`optimizeCardImage`, `optimizeFullImage`, `optimizeThumbnail`), offloading bandwidth and format conversion from Supabase.

**Visitor tracking.** A two-layer unique-visitor counter: `PageTracker` (client) uses `sessionStorage` as a fast-path and skips bots; `POST /api/track` (server) uses an httpOnly day-scoped cookie plus an admin check before calling `increment_page_views`.

---

## 5. Notable Patterns Worth Reusing

- **Supabase client/server split.** `lib/supabase/client.ts` (browser, `createBrowserClient`) vs `lib/supabase/server.ts` (`createServerClient` with Next `cookies()`), plus the `proxy.ts` session-refresh middleware. This is the standard, correct `@supabase/ssr` setup and directly reusable.
- **Business logic as SECURITY DEFINER RPCs.** Pushing atomic/privileged operations (stock decrement, order deletion with stock restore, admin checks) into Postgres functions keeps the thick client safe and race-free. The `is_admin()`-based RLS with a world-readable `admins` table to dodge recursion is a clean, portable authorization pattern.
- **Stale-while-revalidate cache store.** The product store's SWR + `PAGE_SIZE + 1` pagination + realtime-patching + `invalidate()` is a tidy, framework-agnostic pattern for a live-updating catalog.
- **Invisible mount-once components.** `RealtimeSync` and `PageTracker` render `null` and exist purely to run an effect at the layout level — a clean way to attach global side effects.
- **Hydration guards.** The `_hasHydrated` flag on persisted Zustand stores (plus a `mounted` state) reliably prevents localStorage hydration mismatches; reused consistently.
- **Admin CRUD tab convention.** Each admin tab is a self-contained component with the same shape: a left "add/edit form" column + a right "list" column, local `t` translation object, optimistic-ish refetch after mutations. Very easy to clone for a new entity.
- **Responsive dual rendering.** The Orders tab renders a desktop table and mobile swipeable cards from the same data, with a reusable `BottomSheet` for mobile confirmations — a good mobile-first admin pattern.
- **CDN image proxy indirection.** Centralizing all image URLs through helper functions that rewrite them to a resizing CDN makes it trivial to swap providers and controls bandwidth cost.
- **URL-as-state.** Active category (catalog) and active tab (admin) live in the query string via `router.replace(..., { scroll: false })`, giving shareable/back-button-friendly state for free.

---

## 6. Cruft, One-Offs, and Things NOT to Carry Over Blindly

- **`scripts/` is one-time migration tooling, not app code.** `vatrin-scraper.js`, `test-scraper.js`, `parse-html.js`, `create-seed-sql.js`, `create-smart-sql.js`, `import_products.sql`, `import_missing_products.sql`, `recompress-images.mjs`, plus the `vatrin_products*.json` data dumps — all exist to migrate the shop off its old Vatrin storefront. They drag in `puppeteer` and `cheerio` as dependencies. A new project should drop the entire folder and those two deps.
- **Hardcoded credentials in `scripts/export-audit.js`.** It contains a fallback hardcoded Supabase project URL **and a publishable anon key**. This is a security/hygiene problem — do not copy this file, and the key should be rotated. Also note the real Supabase project ref is hardcoded into `app/layout.tsx` preconnect hints.
- **Stray root files.** `debug.html` (a saved copy of the old Vatrin site's HTML, used by the scraper), `products_audit.csv` (an exported product audit), and `LinkedIn_Profile_Blueprint.md` (a personal marketing document entirely unrelated to the app) are all cruft that should not exist in the repo.
- **Schema drift.** `supabase-schema.sql` and `types.ts` are out of date relative to the running app (missing `offers`, `promo_codes`, several RPCs, and the promo columns on `orders`). If reused as a template, regenerate the schema from the live database first, and prefer generating TypeScript types from Supabase rather than hand-maintaining them — the codebase's heavy reliance on `any` for products/orders is a smell to avoid.
- **Vestigial delivery helpers.** `getEffectiveDeliveryFee(cityId, subtotal)` ignores `subtotal`, and `hasDeliveryDiscount()` always returns `false`. These are leftovers from a free-delivery-threshold feature that was removed; don't assume they do anything.
- **No real payment integration.** "Cliq" is just a displayed bank number with a manual-transfer instruction, and orders are marked `confirmed` optimistically. Any project needing actual online payment must add a real gateway; there is nothing here to reuse for that.
- **Hyper-local, hardcoded business rules.** The Jordanian phone regex, JOD currency, the two delivery zones and city list, WhatsApp numbers, and the 5 JOD minimum are all inlined throughout the UI. Extract these into config before reusing.
- **Manual bilingual `t` objects everywhere.** The inline `lang === 'ar' ? ... : ...` translation pattern is duplicated in nearly every component. It works but scales poorly; a new project with more locales or copy should adopt a real i18n solution instead of copying this approach.
- **Bleeding-edge Next 16.** The `proxy.ts` (renamed middleware) convention and `force-dynamic` everywhere are tied to a very new Next release. Verify version-specific conventions before porting to a different Next version.
