-- 1. Завантажувати картинки продуктів можуть тільки адміни
drop policy "Allow authenticated users to read and create 16wiy3a_1" on storage.objects;
create policy "Admins can upload product images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));

-- 2. Шаблонні policies для бакета avatars: не використовуються, відкриті для anon
drop policy if exists "Anyone can upload an avatar." on storage.objects;
drop policy if exists "Avatar images are publicly accessible." on storage.objects;

-- 3. Ліміти бакета: тільки картинки, до 5 MB
update storage.buckets
set file_size_limit = 5 * 1024 * 1024,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
where id = 'product-images';
