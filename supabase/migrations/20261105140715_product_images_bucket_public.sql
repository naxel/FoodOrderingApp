-- The bucket was created by hand (Studio) during the course: public locally, private in the cloud.
-- Describe it in a migration so both match. Menu photos are public content anyway.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5 * 1024 * 1024,
        array['image/png', 'image/jpeg', 'image/webp'])
  on conflict (id) do update set public = true;
