-- 1. Archive instead of delete: order history remains intact
alter table public.products add column archived_at timestamptz;

-- 2. Hard-deleting a product that has associated orders is now an error, rather than a silent deletion of `order_items`.
alter table public.order_items
  drop constraint order_items_product_id_fkey,
  add constraint order_items_product_id_fkey foreign key (product_id)
    references public.products(id) on update cascade on delete restrict;

-- 3. The admin can delete photos (this will be needed in 6b-2 when replacing a photo)
create policy "Admins can delete product images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
