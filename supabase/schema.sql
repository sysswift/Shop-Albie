-- ─────────────────────────────────────────────────────────────────────────────
-- Shop Albie — Supabase PostgreSQL Schema
-- Safe to re-run: skips objects that already exist.
-- If tables already exist, you only need: supabase/storage-setup.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- Enum for order status
do $$ begin
  create type order_status as enum (
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'fulfilled',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

-- ─── categories ───────────────────────────────────────────────────────────────
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  image_url   text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ─── products ─────────────────────────────────────────────────────────────────
create table if not exists products (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  sku          text not null unique,
  price        numeric(10, 2) not null,
  category_id  uuid references categories(id) on delete set null,
  description  text,
  sizes        text[]   not null default '{}',
  colors       jsonb    not null default '[]',
  inventory    integer  not null default 0,
  featured     boolean  not null default false,
  is_new       boolean  not null default false,
  image_url    text,
  gallery_urls text[]   not null default '{}',
  created_at   timestamptz not null default now()
);

-- ─── orders ───────────────────────────────────────────────────────────────────
create table if not exists orders (
  id                uuid primary key default gen_random_uuid(),
  customer_name     text not null,
  customer_phone    text not null,
  customer_location text not null,
  special_request   text,
  total             numeric(10, 2) not null,
  status            order_status not null default 'pending',
  created_at        timestamptz not null default now()
);

-- ─── order_items ──────────────────────────────────────────────────────────────
create table if not exists order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  product_id    uuid not null references products(id) on delete restrict,
  product_name  text not null,
  product_sku   text not null,
  size          text not null,
  color         text not null,
  qty           integer not null default 1,
  unit_price    numeric(10, 2) not null
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table categories   enable row level security;
alter table products     enable row level security;
alter table orders       enable row level security;
alter table order_items  enable row level security;

-- Public catalog data — safe for anyone to READ. All writes go through the
-- server (service_role key), which bypasses RLS, so no anon/authenticated writes.
drop policy if exists "Public can read categories" on categories;
create policy "Public can read categories"
  on categories for select using (true);

drop policy if exists "Public can read products" on products;
create policy "Public can read products"
  on products for select using (true);

-- orders & order_items hold customer personal data (name, phone, location).
-- They are fully server-mediated: the app reads/writes them ONLY via the
-- service_role key (which bypasses RLS). With RLS enabled and NO policies,
-- the public anon key and authenticated users get ZERO access — exactly what
-- we want. (Do NOT add a public insert policy; it would allow direct spam.)

-- Legacy policies removed during hardening (kept here as drops for safe re-runs):
drop policy if exists "Public can create orders" on orders;
drop policy if exists "Public can insert order items" on order_items;
drop policy if exists "Admin full access to categories" on categories;
drop policy if exists "Admin full access to products" on products;
drop policy if exists "Admin can read orders" on orders;
drop policy if exists "Admin can update order status" on orders;
drop policy if exists "Admin can read order items" on order_items;

-- ─── Storage bucket for product images ───────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

-- Images must be publicly viewable so the storefront can display them.
-- Uploads/deletes go through the server (service_role), so no anon/authenticated write.
drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
  on storage.objects for select using (bucket_id = 'product-images');

drop policy if exists "Admin can upload product images" on storage.objects;
drop policy if exists "Admin can delete product images" on storage.objects;
