# WhatsApp Order Flow — Shop Albie

This document defines the complete specification for the WhatsApp-based order system used by Shop Albie.

---

## Overview

Shop Albie is a **multi-category handmade fashion store**. Current product categories:

- Hair Bonnets
- Waist Beads
- Scrunchies
- Headbands
- Female Dresses

Shop Albie uses a **guest-only checkout** model. No customer accounts are required. When a customer places an order:

1. Their details and cart are saved in **Supabase** (PostgreSQL).
2. A **pre-filled WhatsApp message** is generated and opened on the customer's device.
3. The customer taps **Send** in WhatsApp — the message lands in the owner's WhatsApp inbox.
4. The admin can also view and manage the saved order in the **admin dashboard**.

---

## Customer Data Collection Flow

### Step 1 — Browse & add to bag
- Customer browses products at `/shop` (all categories shown)
- Customer opens a product at `/product/[slug]`
- Customer selects **size** (if applicable), **color** (if applicable), and **quantity**
- Customer taps **Add to Bag** → item saved to `localStorage` via Zustand cart store

> **Note on size and color:** These fields are optional per product. Hair bonnets and waist beads may not have sizes. The UI shows size/colour selectors only when the product has them defined.

### Step 2 — Bag review
- Customer taps **BAG (n)** in the header → bag drawer opens
- Customer can adjust quantities or remove items
- Customer taps **Proceed to Checkout**

### Step 3 — Checkout form (`/checkout`)
The customer fills in the following fields:

| Field              | Required | Validation                              |
|--------------------|----------|-----------------------------------------|
| Full Name          | Yes      | Minimum 2 characters                    |
| Phone Number       | Yes      | Minimum 7 characters (WhatsApp number)  |
| Location           | Yes      | Minimum 2 characters                    |
| Special Request    | No       | Free text (custom sizing, note, etc.)   |

### Step 4 — Order submission
- Customer taps **Place Order via WhatsApp**
- The app builds the WhatsApp message from the cart items and form data
- WhatsApp opens automatically with the pre-filled message
- The bag is cleared

---

## WhatsApp Message Generation

### Template

```
✨ SHOP ALBIE — NEW ORDER ✨

━━━━━━━━━━━━━━

👤 CUSTOMER DETAILS

📛 Name: [Customer Full Name]
📞 Phone: [Customer Phone Number]
📍 Location: [Customer Location]

━━━━━━━━━━━━━━

🛍️ ORDER ITEMS

🔹 Item [N]
🏷️ Product: [Product Name]
📏 Size: [Selected Size]          ← omitted if product has no sizes
🎨 Colour: [Selected Colour]      ← omitted if product has no colours
🔢 Qty: [Quantity]
💵 Unit Price: ₵[Unit Price]

(Repeated for each item in the cart)

━━━━━━━━━━━━━━

💰 TOTAL: ₵[Sum of all items]

━━━━━━━━━━━━━━

📝 SPECIAL REQUEST
[Special Request or "None"]

━━━━━━━━━━━━━━

🌐 Sent from Shop Albie website
🙏 Thank you for your order!
```

### Omission rules

| Field  | Included when |
|--------|--------------|
| Size   | Product has at least one size defined |
| Colour | Product has at least one colour defined |

### Multi-item example

If the customer has 2 items in the bag, the ORDER ITEMS block contains one `🔹 Item N` entry per product, separated by a blank line.

---

## WhatsApp URL Format

```
https://wa.me/{OWNER_NUMBER}?text={URL_ENCODED_MESSAGE}
```

- `OWNER_NUMBER` = `233598916433` (defined in `src/lib/contact.ts`)
- `URL_ENCODED_MESSAGE` = the template above, passed through `encodeURIComponent()`

The URL is opened via `window.open(url, "_blank", "noopener,noreferrer")`.

---

## Validation Rules

| Rule | Detail |
|------|--------|
| Cart must not be empty | Checkout button disabled / redirects if bag is empty |
| Full Name | `z.string().min(2)` — "Please enter your full name" |
| Phone Number | `z.string().min(7)` — "Please enter a valid phone number" |
| Location | `z.string().min(2)` — "Please enter your delivery location" |
| Special Request | Optional, no validation |
| Price | Positive number, stored as `numeric(10,2)` in GHS (₵) |
| Quantity | Integer ≥ 1 per item |
| Size | Optional per product — empty string stored as `""` |
| Colour | Optional per product — empty string stored as `""` |

---

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| WhatsApp doesn't open automatically | `/order-confirmed` page shows a manual "Open WhatsApp" button |
| Product not found in DB | `notFound()` thrown in loader → 404 page shown |
| Network error mid-submit | `try/catch` in `checkout.tsx` catches and displays error message |

---

## Owner WhatsApp Configuration

The owner's WhatsApp number is defined in one place:

```ts
// src/lib/contact.ts
export const WHATSAPP_NUMBER = "233598916433";
```

To change the number, update only this file. All order messages, the WhatsApp FAB, and the single-product order button use this constant.

---

## Admin Order Management

Once an order is received:

1. Owner sees order in the **Admin → Orders** table
2. Admin can expand any row to see full order items and special request
3. Admin can change the **status** inline:
   - `pending` → `confirmed` → `processing` → `shipped` → `fulfilled`
   - Or `cancelled`
4. Status updates are saved immediately to Supabase

---

## Currency

All prices are stored and displayed in **GHS (Ghana Cedis)** using the `₵` symbol.

- Example: `₵580.00`
- Database column type: `numeric(10, 2)`
- No multi-currency support in v1

---

## Files Involved

| File | Role |
|------|------|
| `src/lib/contact.ts` | Owner WhatsApp number constant |
| `src/lib/cart.ts` | Zustand cart store with localStorage persistence |
| `src/routes/checkout.tsx` | Checkout form + `buildWhatsAppMessage()` function |
| `src/routes/order-confirmed.tsx` | Thank-you page + manual WhatsApp button |
| `src/routes/product.$slug.tsx` | Single-item quick-order WhatsApp button |
| `supabase/schema.sql` | `orders` and `order_items` table definitions |
