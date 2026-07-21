# Handoff: Candy Hon Storefront Rebrand

## Overview
Full visual rebrand of the Candy Hon (كاندي هون) bilingual (AR-RTL primary / EN-LTR) e-commerce storefront in Jordan. The brand name and logo are unchanged; this replaces the current glassmorphism/pastel-wash visual system with a "boutique candy shop, grown up" system. Two directions were designed — **1a "Airy boutique pastel"** and **1b "Sticker & scrapbook"** — on one shared token backbone. Ask the user which direction won before implementing; if unanswered, implement 1a (the base `:root` tokens) since 1b is expressed purely as token overrides.

## About the Design Files
The files in this bundle are **design references created in HTML** — they show intended look and behavior, not production code to copy. The task is to **recreate these designs in the existing Next.js (App Router) + Tailwind 4 + Zustand codebase** (`candy-hon-store`), using its established patterns: `useLanguageStore` for lang/dir, `useCartStore`, `sonner` for toasts, existing component files. Do not port the design-file markup; restyle the existing components.

- `Candy Hon Rebrand.dc.html` — design canvas with every screen in both directions (open in a browser; sections labeled 1a/1b, each frame labeled e.g. "1a Home mobile AR").
- `tokens.css` — the deliverable token sheet, written to drop into the codebase (see below).

## Fidelity
**High-fidelity.** Colors, type sizes, radii, shadows, spacing and copy are final. Recreate pixel-perfectly with Tailwind utilities bound to the CSS variables.

## How to wire into this codebase

1. **Replace the token layer in `app/globals.css`.** Delete the current glassmorphism variables/utilities (`--glass-*`, backdrop-filter rules, gradient washes) and paste in `tokens.css`. Expose the variables to Tailwind 4 via `@theme` mapping, e.g.:
   ```css
   @theme {
     --color-pink-600: var(--pink-600);
     --color-ink-900: var(--ink-900);
     /* …one line per token… */
   }
   ```
   Direction 1b = add `data-theme="scrapbook"` on `<html>`; its overrides are already in `tokens.css`.
2. **Fonts (`app/layout.tsx`):** keep `next/font` Google fonts. Direction 1a: Fredoka (EN display) + Tajawal 400/500/700/800 (AR everything). Direction 1b: add Baloo Bhaijaan 2 500–800 as the display face for BOTH scripts; Tajawal stays body. Arabic is primary — never let AR render in a fallback font.
3. **Restyle components in place:** `AnnouncementBar.tsx`, `Navbar.tsx`, `HomeClient.tsx` (hero + search + chips), `ProductCard.tsx`, `ProductGallery.tsx`, `ProductModal.tsx`, `FloatingCart.tsx` (+ cart drawer), `app/checkout/page.tsx`. Screen-by-screen specs below.
4. **Remove everywhere:** `backdrop-filter`/blur, infinite/looping animations, grayscale+overlay out-of-stock treatment, `#B0BEC5` and any pastel-on-pastel text.

## Design Tokens (summary — authoritative values in tokens.css)

- **Primary pink scale** 50→900; anchor `--pink-600 #C22B65` (CTAs, prices, sale badges; 5.9:1 on white), hover/press `--pink-700 #A21E52`.
- **Sky blue** (pre-order/info): text `--blue-700 #1B6899`, bg `--blue-100 #E4F3FC`.
- **Mint** (success accents): `--mint-700 #147259`, `--mint-100 #E2F4EE`.
- **Warm plum neutrals**: text `--ink-900 #3A2A33`, body `--ink-700 #5D4A55`, muted `--ink-500 #7D6873` (4.9:1 — the replacement for `#B0BEC5`; `--ink-300 #B9A8B1` is decorative-only, never text). Border `#F1E3EA`, page bg `#FFF9F5` (1b: `#FDF3EB`).
- **Semantic**: success `#1E7A4A`/`#E4F5EB`, warning `#8F5400`/`#FFF3DE`, error `#BE2F44`/`#FCE9EC`.
- **Radii**: sm 8 / md 12 (inputs, buttons) / lg 16 (cards) / xl 24 (sheets) / pill 999. 1b: lg 20 / xl 28.
- **Shadows** (no heavy blur): card `0 1px 2px rgba(58,42,51,.05), 0 4px 12px rgba(58,42,51,.06)`; hover `0 2px 4px …, 0 10px 24px rgba(58,42,51,.10)`; FAB `0 6px 16px rgba(194,43,101,.32)`. 1b uses hard offset sticker shadows: card `0 3px 0 #EDD6DE`, hover `0 5px 0 #E7C9D6`, primary buttons `0 3–4px 0 #7E1740`.
- **Spacing**: 4px base — 4/8/12/16/20/24/32/40/48/64.
- **Type scale (mobile → desktop, px)**: display 28→40 (800), h1 24→32 (800), h2 20→26 (700), h3/product-name 17→20 (700), body 15→16 (500, lh 1.6), small 13→14, caption 12 (700). AR line-height ≥1.5.

## Screens / Views (both directions follow the same layout; 1b deltas noted)

### Announcement bar
1a: `--pink-50` bg, dashed `--pink-200` bottom border, 12px 700 text in `--pink-800`, centered, single line. 1b: solid `--pink-600` bg, white text, 🎀 prefix. Copy: "توصيل مجاني للطلبات فوق 25 JOD — لجميع محافظات الأردن" / "Free delivery on orders over 25 JOD — all of Jordan". Numbers always wrapped in `dir="ltr"`.

### Navbar
White (1a) / cream (1b) bar: round logo 42–52px, wordmark ("Candy Hon" Fredoka 600 over "كاندي هون" Tajawal 700 caption — 1b flips: AR display on top), 44px round lang toggle (shows "EN" in AR mode, "ع" in EN mode), 44px cart button with pink count badge. Desktop adds centered pill search (max 460px) and a "طلباتي" (My orders) pill. 1a separates header from content with a **scallop divider** (repeating radial-gradient, see design file). 1b buttons all carry `0 2px 0 #EDD6DE` sticker shadow.

### Home / hero
**Compact — products visible in first mobile viewport.** Mobile: h2 24px/800 two-line promise + one 13px muted subline + 48px search input + one row of 40px category chips, then the grid. No image, no animation, renders instantly. Desktop 1a: pink-50 band (36px padding) with h1 38px, sub, two 52px buttons (solid pink "تسوّق الآن", outline "العروض"), logo 170px at the end, scalloped bottom edge. 1b: hero is a white sticker card with an inset 2px-dotted pink frame and offset shadow.

### Category chips
40px (mobile) / 44px (desktop) pills. Active: solid `--pink-600`, white text. Inactive: white bg, 1px `--border` (1b: 1.5px `#EAD3DD` + 2px offset shadow), `--ink-700` text, 700 weight. Horizontal scroll on mobile.

### Product card (grid 2-col mobile / 4-col desktop, gap 12/20)
White card, radius-lg, shadow-card. Square image area top (1b: image inset 8px in its own 14px-radius frame). Body: AR name 13–15px/700 ink-900 (1 line clamp), EN name 10–11px muted aligned end, then price row: price LTR in Fredoka/Baloo 600–700 `--pink-600` with small "JOD", strikethrough old price in muted above/beside it; trailing action.
**States (readable without reading):**
- **Available**: 44px round solid-pink "+" button.
- **SALE**: pink-600 badge top-start — 1a pill "عرض"/"SALE"; 1b ribbon (clip-path notch). Strikethrough old price shown.
- **Pre-order**: blue badge (1a: blue-100 bg / blue-700 text pill with clock icon; 1b: solid blue-700 ribbon) + outlined blue 44px "اطلب مسبقاً"/"Pre-order" button. Image stays full-color.
- **Out of stock**: image at `grayscale(30%) opacity(.55)` (NOT full grayscale + overlay), centered dark-plum pill "نفذت الكمية"/"OUT OF STOCK" (1b: rotated −4°), price in muted (not pink), outlined "أعلمني"/"Notify me" button.

### Product modal
Mobile: bottom sheet (radius-xl top, grab handle, flat scrim `rgba(58,42,51,.4)` — **no blur**). Square carousel with pill dots (active = 18px-wide pink pill), discount badge, 44px close. Then: AR title h3 + EN subtitle, price row (old strikethrough + big pink price, LTR), 13px description, quantity stepper (48px tall, +/− 46px wide, count between), note field label "ملاحظات إضافية (اختياري)", full-width 52px add-to-cart with price chip inside. Desktop: centered dialog 880px, image column 400px with 64px thumbnail row (active thumb = 2px pink border), content column right.

### Floating cart + drawer
FAB: pill (not circle) bottom-start — cart icon + "السلة · 3" + LTR price chip; pink-600 with shadow-fab (1b: `0 4px 0 #7E1740`). Drawer: header with count + 44px close, **free-shipping progress card** ("أضف 5.00 JOD لتحصل على توصيل مجاني 🎀" + pink progress bar), item rows (56px thumb, name + pre-order ribbon/eta where relevant, compact stepper, LTR line total, quiet ✕ remove), footer: subtotal, "رسوم التوصيل تُحسب عند إتمام الطلب", 52px checkout CTA with total chip.

### Checkout (single scrolling page + sticky confirm bar)
Order: back header → **green trust strip** (success-bg; "الدفع عند الاستلام" + "توصيل 24–48 ساعة" with check icons) → collapsed order summary (stacked 36px thumbs, "3 منتجات · 20.00 JOD", chevron to expand) → form card (name, phone `dir="ltr"` placeholder "07X XXX XXXX", area dropdown showing fee inline "عمّان — 3 JOD" from `lib/deliveryAreas.ts`, address textarea, notes) → payment card (radio cards: COD selected = 2px pink border + pink-50 bg + thick radio; Cliq with blue "CliQ" chip) → promo row (dashed pink-300 input, `letter-spacing:.12em`, dark-plum "تطبيق" button) → totals card (items / delivery / total — total 800 with pink LTR amount). **Sticky bottom bar**: total (label + LTR amount) + flex-1 52px "تأكيد الطلب". Desktop: 2-col grid `1fr 420px`, sticky summary card right holding items + promo + totals + CTA + microcopy "الحد الأدنى للطلب 5 JOD · بالضغط أنت توافق على شروط الاستخدام". All inputs 48px, radius-md, bg `--bg`, border `--border`; labels 12px/700 ink-700.

## Interactions & Behavior (perf budget: opacity/transform only, no loops, no blur)
- Card hover (desktop): `translateY(-2px)` + shadow-hover, 150ms ease-out. Press (mobile): `scale(.98)` 120ms. 1b press: `translateY(2px)` + shadow 3px→1px. No image zoom.
- Add-to-cart: button icon + → ✓ for 800ms (120ms crossfade), bg stays pink-600; FAB counter scale 1→1.2→1 over 200ms. No flying-item animation.
- Toast (sonner, styled): dark plum `#3A2A33` pill, mint check circle, AR text + LTR price; bottom-center above FAB; enter translateY(12px)+fade 200ms, auto-dismiss 2.5s, exit fade 150ms, one at a time (replace, don't stack).
- Sheets/drawer: slide 240ms ease-out + scrim fade 200ms (flat rgba). Grid entrance: fade + 8px rise 240ms, stagger 40ms **capped at 120ms total**; hero has zero animation.
- Input focus: border pink-400 + 2px pink-100 ring, 120ms. Button press `scale(.97)`.
- Easing `cubic-bezier(.22,1,.36,1)`; durations 120/200/240ms (max 300ms).

## Hard Constraints (do not violate)
- RTL-first: use logical properties (`inset-inline-start`, `padding-inline`, `ps-/pe-` Tailwind utilities) everywhere; EN is the mirror.
- Currency JOD; **every number/price/phone wrapped in `dir="ltr"`**, rendered in the display font (Fredoka / Baloo Bhaijaan 2).
- No `backdrop-filter`, no infinite animations, hero renders instantly.
- Touch targets ≥ 44px; pinch-zoom must remain enabled (no `user-scalable=no`).
- All text AA: muted text is `--ink-500 #7D6873` minimum; never `--ink-300` or pastel-on-pastel.

## State Management
No new state. Reuse `useLanguageStore` (lang + dir), `useCartStore` (items, totals, free-shipping threshold 25 JOD, minimum order 5 JOD), delivery fees from `lib/deliveryAreas.ts`. Add-to-cart ✓ state is 800ms local component state.

## Assets
- `public/logo.png` / `public/logo.webp` — unchanged, already in the codebase.
- Product photos in the design file are Unsplash placeholders — use real product images from the store DB.
- Icons: inline stroke SVGs (2–2.5px stroke, round caps) matching lucide style; use the codebase's existing icon approach.

## Files
- `Candy Hon Rebrand.dc.html` — all screens, both directions (1a/1b badges, labeled frames).
- `tokens.css` — token sheet to merge into `app/globals.css`.
