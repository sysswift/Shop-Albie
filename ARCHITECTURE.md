# Shop Albie — Architecture & Product Spec

This document describes the full architecture, data model, and product requirements for Shop Albie.

---

## Business Overview

Shop Albie is a **multi-category handmade fashion store** operating in Ghana. Products are handmade in small batches and sold directly via an e-commerce storefront. Orders are fulfilled through WhatsApp. All prices are in **GHS (₵)**.

### Product Categories (v1)

| Category | Size required | Colour typical |
|----------|:---:|:---:|
| Female Dresses | ✓ | ✓ |
| Hair Bonnets | — | ✓ |
| Waist Beads | — | ✓ |
| Scrunchies | — | ✓ |
| Headbands | — | ✓ |

> Size and colour selectors are shown on the product page **only when the product has those fields populated**. Neither is mandatory in the data model.

---

## Architecture

| Concern | Choice |
|---------|--------|
| Framework | TanStack Start (React 19, SSR) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (admin only) |
| Storage | Supabase Storage (`product-images` bucket) |
| Cart | Zustand + localStorage (guest, no login) |
| Orders | WhatsApp deep-link (no payment gateway in v1) |
| PWA | `public/manifest.json` + service worker |
| Currency | GHS (₵) — `numeric(10,2)` |

---

## Storefront Routes

| Route | Purpose |
|-------|---------|
| `/` | Homepage — hero, all categories, featured products, new arrivals |
| `/shop` | Full catalogue — filterable by category |
| `/product/[slug]` | Product detail — gallery, size/colour selectors (conditional), add to bag, share |
| `/checkout` | Guest checkout form |
| `/order-confirmed` | Post-order confirmation + WhatsApp fallback button |

---

## Admin Routes

| Route | Purpose |
|-------|---------|
| `/admin/login` | Supabase Auth sign-in |
| `/admin` | Dashboard — summary stats |
| `/admin/products` | List all products (all categories); inline Edit + Delete |
| `/admin/products/new` | Add any product type |
| `/admin/products/[id]/edit` | Edit any product |
| `/admin/categories` | Manage categories |
| `/admin/orders` | View and update order status |

---

## Data Model

### `categories`
```sql
id          uuid PK
name        text NOT NULL          -- e.g. "Hair Bonnets"
slug        text NOT NULL UNIQUE   -- e.g. "hair-bonnets"
image_url   text
sort_order  integer DEFAULT 0
created_at  timestamptz
```

### `products`
```sql
id           uuid PK
name         text NOT NULL
slug         text NOT NULL UNIQUE
sku          text NOT NULL UNIQUE  -- auto-generated (ALB-XXXXXXX)
price        numeric(10,2) NOT NULL
category_id  uuid → categories(id) ON DELETE SET NULL
description  text
sizes        text[]    DEFAULT '{}'  -- empty = no size selector shown
colors       jsonb     DEFAULT '[]'  -- empty = no colour selector shown
inventory    integer   DEFAULT 0
featured     boolean   DEFAULT false
is_new       boolean   DEFAULT false
image_url    text
gallery_urls text[]    DEFAULT '{}'
created_at   timestamptz
```

> `sizes` and `colors` are **optional**. The storefront hides these selectors when the arrays are empty, which is correct for products like waist beads that have no size.

### `orders`
```sql
id                uuid PK
customer_name     text NOT NULL
customer_phone    text NOT NULL
customer_location text NOT NULL
special_request   text
total             numeric(10,2) NOT NULL
status            order_status DEFAULT 'pending'
created_at        timestamptz
```

### `order_items`
```sql
id            uuid PK
order_id      uuid → orders(id) ON DELETE CASCADE
product_id    uuid → products(id) ON DELETE RESTRICT
product_name  text NOT NULL
product_sku   text NOT NULL
size          text NOT NULL  -- empty string "" if product has no sizes
color         text NOT NULL  -- empty string "" if product has no colours
qty           integer NOT NULL DEFAULT 1
unit_price    numeric(10,2) NOT NULL
```

---

## Product Form — Admin

The **Add / Edit product** form applies to all categories equally:

| Field | Input type | Required |
|-------|-----------|----------|
| Product Name | text | ✓ |
| Price (₵) | number | ✓ |
| Category | dropdown | — |
| Inventory | number | — |
| Description | textarea | — |
| Sizes | toggle buttons (XS S M L XL XXL Free Size) | — |
| Colours | colour picker + name | — |
| Images | multi-file upload | — |
| Featured | checkbox | — |
| New Arrival | checkbox | — |

SKU is **auto-generated** server-side (`ALB-` + base-36 timestamp). It is not shown in the admin UI.

---

## Homepage Layout

1. **Hero** — full-bleed photo with headline CTA → `/shop`
2. **Promo banner** — free delivery threshold + WhatsApp note
3. **Featured products** — up to 4 products marked `featured = true` (any category)
4. **Categories grid** — all active categories with image and name
5. **New Arrivals** — up to 3 products marked `is_new = true` (any category)
6. **Footer** — links, WhatsApp contact

---

## Product Detail Page

1. Photo gallery (primary image + thumbnails if multiple)
2. Product name + Share button
3. Price
4. Colour selector — **shown only if `colors.length > 0`**
5. Size selector — **shown only if `sizes.length > 0`**
6. Quantity selector
7. Add to Bag button
8. Order via WhatsApp (single-item quick order)
9. Description
10. Shipping / returns info

---

## Cart & Checkout

- Cart is stored in **localStorage** (Zustand + `persist`)
- No login required
- Checkout collects: Full Name, Phone, Location, Special Request
- On submit → WhatsApp opens with pre-filled message (see `whatsapp-order-flow.md`)
- Bag clears after submission

---

## Share Feature

Every product card and product detail page includes a **Share** button:

- **Mobile:** uses the native Web Share API → opens the phone's share sheet
- **Desktop:** copies the product URL to clipboard; shows "Link copied!" confirmation
- URL format: `{origin}/product/{slug}`

---

## Image Storage

- Bucket: `product-images` (Supabase Storage, public)
- Path pattern: `products/{timestamp}-{filename}`
- Upload flow: server function returns a **signed upload URL** → client PUTs directly to Supabase Storage (avoids proxying large files through the app server)
- Public URL stored in `products.image_url` (primary) and `products.gallery_urls[]` (all images)

---

## Owner WhatsApp Configuration

```ts
// src/lib/contact.ts
export const WHATSAPP_NUMBER = "233598916433";
export const WHATSAPP_DEFAULT_MESSAGE = "Hi Shop Albie — I'd like to ask about an item.";
```

Change `WHATSAPP_NUMBER` here to update every WhatsApp touchpoint in the app.

---

## PWA

- `public/manifest.json` — app name, icons, theme colour
- Icons required: `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `favicon.ico`
- See `public/icons/README.md` for icon generation instructions
