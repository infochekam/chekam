
-- Create inspection status enum
CREATE TYPE public.inspection_status AS ENUM ('pending', 'in_progress', 'completed', 'scored');

-- Create inspections table
CREATE TABLE public.inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  inspector_id UUID,
  status inspection_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  overall_score NUMERIC(3,1),
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Property owners can view their inspections" ON public.inspections FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid()));
CREATE POLICY "Admins can manage all inspections" ON public.inspections FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Inspectors can view assigned inspections" ON public.inspections FOR SELECT
  USING (inspector_id = auth.uid());
CREATE POLICY "Inspectors can update assigned inspections" ON public.inspections FOR UPDATE
  USING (inspector_id = auth.uid());

CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON public.inspections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create inspection_media table
CREATE TABLE public.inspection_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  media_type TEXT NOT NULL DEFAULT 'image',
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inspection_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view media for their inspections" ON public.inspection_media FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.inspections i
    JOIN public.properties p ON p.id = i.property_id
    WHERE i.id = inspection_id AND (p.user_id = auth.uid() OR i.inspector_id = auth.uid())
  ));
CREATE POLICY "Admins can manage all media" ON public.inspection_media FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Inspectors can upload media" ON public.inspection_media FOR INSERT
  WITH CHECK (uploaded_by = auth.uid() AND (public.has_role(auth.uid(), 'inspector') OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Uploaders can delete their media" ON public.inspection_media FOR DELETE
  USING (uploaded_by = auth.uid());

-- Create inspection_scores table for per-category AI scores
CREATE TABLE public.inspection_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  score NUMERIC(3,1) NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inspection_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view scores for their inspections" ON public.inspection_scores FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.inspections i
    JOIN public.properties p ON p.id = i.property_id
    WHERE i.id = inspection_id AND (p.user_id = auth.uid() OR i.inspector_id = auth.uid())
  ));
CREATE POLICY "Admins can manage all scores" ON public.inspection_scores FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for inspection media
INSERT INTO storage.buckets (id, name, public) VALUES ('inspection-media', 'inspection-media', false);

CREATE POLICY "Inspectors and admins can upload inspection media" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'inspection-media' AND (public.has_role(auth.uid(), 'inspector') OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Authenticated users can view inspection media" ON storage.objects FOR SELECT
  USING (bucket_id = 'inspection-media' AND auth.role() = 'authenticated');
CREATE POLICY "Uploaders can delete inspection media" ON storage.objects FOR DELETE
  USING (bucket_id = 'inspection-media' AND auth.uid()::text = (storage.foldername(name))[1]);
