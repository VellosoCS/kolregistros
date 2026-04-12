-- Remove duplicate INSERT policy on storage.objects
DROP POLICY IF EXISTS "Authenticated users can upload incident images" ON storage.objects;

-- Remove duplicate DELETE policy on storage.objects
DROP POLICY IF EXISTS "Authenticated users can delete incident images" ON storage.objects;