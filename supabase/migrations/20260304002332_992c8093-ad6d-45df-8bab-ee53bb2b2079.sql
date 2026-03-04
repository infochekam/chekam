
-- Create property status enum
CREATE TYPE public.property_status AS ENUM ('draft', 'submitted', 'under_review', 'verified', 'rejected');

-- Create submission method enum
CREATE TYPE public.submission_method AS ENUM ('document_upload', 'property_link', 'manual_entry');

-- Create properties table
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  property_type TEXT,
  submission_method submission_method NOT NULL,
  property_link TEXT,
  status property_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own properties" ON public.properties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own properties" ON public.properties FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own properties" ON public.properties FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own draft properties" ON public.properties FOR DELETE USING (auth.uid() = user_id AND status = 'draft');
CREATE POLICY "Admins can view all properties" ON public.properties FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Inspectors can view assigned properties" ON public.properties FOR SELECT USING (public.has_role(auth.uid(), 'inspector'));

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create property_documents table
CREATE TABLE public.property_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  document_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents" ON public.property_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON public.property_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON public.property_documents FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all documents" ON public.property_documents FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for property documents
INSERT INTO storage.buckets (id, name, public) VALUES ('property-documents', 'property-documents', false);

CREATE POLICY "Users can upload own property docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'property-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own property docs" ON storage.objects FOR SELECT USING (bucket_id = 'property-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own property docs" ON storage.objects FOR DELETE USING (bucket_id = 'property-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins can view all property docs" ON storage.objects FOR SELECT USING (bucket_id = 'property-documents' AND public.has_role(auth.uid(), 'admin'));
