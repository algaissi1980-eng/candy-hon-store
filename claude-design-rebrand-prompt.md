# Claude Design Prompt — Candy Hon Storefront Rebrand

> Copy everything below this line into Claude Design.

---

You are rebranding the **storefront UI** of **Candy Hon (كاندي هون)** — a live bilingual (Arabic-first RTL / English LTR) e-commerce store for unique & fun novelty products in Jordan, with 230+ products. The brand name and logo stay the same; you are redesigning the visual system and UI components only.

## 1. Brand Anchor — the Logo

The existing logo is a round pastel sticker: three cotton-candy clouds (pink, sky blue, mint) inside a scalloped doily frame, dotted circular borders, and a white ribbon banner. It feels handmade, sweet, and friendly.

**Design DNA to extract from it:**
- Palette: cotton-candy pink, sky blue, mint, warm white/cream.
- Motifs: scalloped edges, dotted borders, ribbon banners, soft cloud shapes.
- Personality: playful and sweet — but the new UI must execute this with **restraint and craft**, not childishness.

## 2. Creative Direction

"**Boutique candy shop, grown up.**" Keep the pastel cotton-candy soul, but elevate it:
- Generous whitespace on a warm off-white base; pastels used as **accents**, not full-bleed washes.
- One strong saturated anchor color derived from the logo pink (for CTAs and prices) so the UI has contrast and hierarchy — the current site drowns in low-contrast pastel.
- Use the scallop/dot/ribbon motifs sparingly and intentionally (section dividers, badges, sale ribbons) instead of gradient glassmorphism everywhere.
- Photography-first product cards: clean white image area, the product is the hero, chrome recedes.

Produce **2 variations** of the direction (e.g., "airy & minimal pastel" vs "warmer sticker/scrapbook character") for the key screens so we can pick.

## 3. What to Deliver

1. **Design tokens** as CSS custom properties (this maps 1:1 to our Tailwind 4 theme): full color scale (primary pink scale, blue, mint, neutrals, semantic success/warning/error), radii, shadows, spacing rhythm. Text colors MUST pass WCAG AA — our current muted text (#B0BEC5 on white) and pastel-on-pastel text fail badly.
2. **Typography system**: currently Fredoka (EN display) + Tajawal (AR). Keep or propose one alternative pair; Arabic is the primary script — the AR type must look as designed as the EN, not like a fallback. Define scale (h1→caption) for mobile and desktop.
3. **Redesigned key screens** (mobile-first, 380px, plus desktop):
   - **Home**: compact hero (NOT full-viewport — products must be visible within the first scroll on mobile), announcement bar, category chips, search, product grid (2-col mobile / 4-col desktop).
   - **Product card**: image, bilingual name, price in JOD (with strikethrough sale price), states: available / SALE / pre-order / out-of-stock (currently grayscale+overlay — make states instantly readable).
   - **Product modal/detail**: image carousel with dots, quantity, note field, add-to-cart.
   - **Floating cart + cart drawer**.
   - **Checkout**: form (name, phone, area dropdown, address, notes), payment choice (Cash on Delivery / Cliq), promo code field, order summary. This is the money screen — optimize for trust and completion on mobile.
4. **Micro-interaction guidance**: hover/press states, add-to-cart feedback, toast style.

## 4. Hard Constraints (production system — do not violate)

- **RTL-first**: every screen must be designed in Arabic RTL as the primary; EN LTR is the mirror.
- **Performance budget** (we serve low-end Android devices on 4G in Jordan; heavy effects previously caused GPU crashes):
  - NO `backdrop-filter` / glassmorphism blur.
  - NO infinite/looping animations on repeated elements (cards, prices).
  - Entrance animations ≤ 300ms, opacity/transform only, no staggered delays longer than 150ms total.
  - Hero must render meaningful content instantly — no multi-second staged reveal.
- Currency is **JOD**, numbers always LTR.
- Theming is via CSS variables consumed by Tailwind utility classes — deliver tokens accordingly.
- Buttons/touch targets ≥ 44px on mobile. Allow pinch-zoom (do not design assuming zoom is locked).

## 5. Success Criteria

- A first-time visitor on a mid-range phone sees products and can start browsing within the first screen and first second.
- The brand still reads "Candy Hon" at a glance (pink + cotton-candy soul), but feels like a polished boutique, not a template.
- Every text passes AA contrast; sale/pre-order/out-of-stock states are understood without reading.
