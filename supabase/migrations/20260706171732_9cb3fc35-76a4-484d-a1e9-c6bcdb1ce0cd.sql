
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS inspo_urls text[] NOT NULL DEFAULT '{}';

-- Allow anon to upload inspo images (Phase 1: unauthenticated bookings)
CREATE POLICY "anon can upload inspo"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'inspo');

CREATE POLICY "anon can read inspo"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'inspo');

CREATE POLICY "authenticated can read inspo"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'inspo');
