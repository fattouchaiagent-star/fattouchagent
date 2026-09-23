-- Public, non-sensitive listing images can be served by stable public URLs.
-- Keep payment-proofs and user-files private.
update storage.buckets
set public = true
where id = 'listing-images';

-- Public read is limited to listing-images. Upload/update/delete remain owner-scoped
-- by the policies created in 001_initial_schema.sql.
drop policy if exists listing_images_public_read on storage.objects;
create policy listing_images_public_read
on storage.objects for select
using (bucket_id = 'listing-images');
