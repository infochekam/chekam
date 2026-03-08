
DROP POLICY IF EXISTS "Authenticated users can view inspection media" ON storage.objects;

CREATE POLICY "Owners and inspectors can view inspection media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'inspection-media' AND (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR
    auth.uid()::text = (storage.foldername(name))[1]
  )
);
