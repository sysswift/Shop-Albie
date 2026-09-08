-- ─────────────────────────────────────────────────────────────────────────────
-- Shop Albie — RLS Hardening
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Safe to re-run.
--
-- Architecture note:
--   The app reads/writes EVERY table through server functions that use the
--   service_role key, which BYPASSES RLS. The browser only uses the public
--   anon key for auth (login) and to build image URLs — never to read or write
--   tables directly. So we lock the public anon key out of all sensitive data.
-- ─────────────────────────────────────────────────────────────────────────────

-- Ensure RLS is ON for every table (deny-by-default once policies are scoped).
alter table categories   enable row level security;
alter table products     enable row level security;
alter table orders       enable row level security;
alter table order_items  enable row level security;

-- ── PRODUCTS & CATEGORIES ─────────────────────────────────────────────────────
-- Public catalog data — safe for anyone to READ (same as what the site shows).
-- All WRITES go through the server (service_role), so no anon/authenticated write.
drop policy if exists "Public can read categories" on categories;
create policy "Public can read categories"
  on categories for select using (true);

drop policy if exists "Public can read products" on products;
create policy "Public can read products"
  on products for select using (true);

-- Remove broad authenticated write policies — writes happen via service_role only.
drop policy if exists "Admin full access to categories" on categories;
drop policy if exists "Admin full access to products" on products;

-- ── ORDERS & ORDER ITEMS (customer personal data) ─────────────────────────────
-- These hold names, phone numbers, and locations. Lock them down completely:
-- no public read, no public insert. The server (service_role) handles everything.

-- Close the previous spam vector: anyone with the public anon key could insert.
drop policy if exists "Public can create orders" on orders;
drop policy if exists "Public can insert order items" on order_items;

-- Remove authenticated-only read policies (server uses service_role, which bypasses RLS).
drop policy if exists "Admin can read orders" on orders;
drop policy if exists "Admin can update order status" on orders;
drop policy if exists "Admin can read order items" on order_items;

-- With RLS enabled and NO policies, the anon + authenticated roles get ZERO access
-- to orders/order_items. Only the service_role (server) can touch them. This is
-- exactly what we want for a WhatsApp-first, server-mediated shop.

-- ── STORAGE: product images ───────────────────────────────────────────────────
-- Images must be publicly viewable so the storefront can display them.
-- Uploads/deletes go through the server (service_role).
drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
  on storage.objects for select using (bucket_id = 'product-images');

drop policy if exists "Admin can upload product images" on storage.objects;
drop policy if exists "Admin can delete product images" on storage.objects;

-- ── VERIFY ────────────────────────────────────────────────────────────────────
-- After running, check Dashboard → Authentication → Policies:
--   products, categories : SELECT = public; no anon writes
--   orders, order_items  : no policies (service_role only)
--   storage.objects      : SELECT public for product-images only
