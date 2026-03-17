
-- Create storage bucket for incident images
INSERT INTO storage.buckets (id, name, public) VALUES ('incident-images', 'incident-images', true);

-- Allow anyone to view images (public bucket)
CREATE POLICY "Anyone can view incident images"
ON storage.objects FOR SELECT
USING (bucket_id = 'incident-images');

-- Allow anyone to upload images (no auth required since app has no auth)
CREATE POLICY "Anyone can upload incident images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'incident-images');

-- Allow anyone to delete incident images
CREATE POLICY "Anyone can delete incident images"
ON storage.objects FOR DELETE
USING (bucket_id = 'incident-images');
