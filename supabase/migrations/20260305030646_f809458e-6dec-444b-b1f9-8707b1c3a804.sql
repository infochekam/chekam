
ALTER TABLE public.property_documents
ADD COLUMN verification_status text NOT NULL DEFAULT 'pending',
ADD COLUMN verification_result jsonb,
ADD COLUMN verified_at timestamptz;
