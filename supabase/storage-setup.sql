-- Run this ONLY if tables already exist and you just need product image uploads.
-- Safe to run more than once.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

-- Images must be publicly viewable so the storefront can display them.
-- Uploads/deletes go through the server (service_role key), which bypasses RLS.
drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
  on storage.objects for select using (bucket_id = 'product-images');

drop policy if exists "Admin can upload product images" on storage.objects;
drop policy if exists "Admin can delete product images" on storage.objects;
