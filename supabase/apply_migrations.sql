-- Combined migrations for Chekam project
-- Run this in Supabase SQL editor (Project > SQL Editor > New Query)

-- 20260302100011_d5edad30: Create profiles, user_roles, triggers
/*
Contents from 20260302100011_d5edad30-a156-4fa0-a3fa-35974294cc80.sql
*/
CREATE TYPE IF NOT EXISTS public.app_role AS ENUM ('admin', 'inspector', 'user');

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY IF NOT EXISTS "Anyone authenticated can view profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Anyone authenticated can view roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "Admins can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "Admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER IF NOT EXISTS on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER IF NOT EXISTS update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- 20260304002332_992c8093: properties, property_documents, policies
/*
Contents from 20260304002332_992c8093-ad6d-45df-8bab-ee53bb2b2079.sql
*/
CREATE TYPE IF NOT EXISTS public.property_status AS ENUM ('draft', 'submitted', 'under_review', 'verified', 'rejected');
CREATE TYPE IF NOT EXISTS public.submission_method AS ENUM ('document_upload', 'property_link', 'manual_entry');

CREATE TABLE IF NOT EXISTS public.properties (
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

CREATE POLICY IF NOT EXISTS "Users can view own properties" ON public.properties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own properties" ON public.properties FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own properties" ON public.properties FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete own draft properties" ON public.properties FOR DELETE USING (auth.uid() = user_id AND status = 'draft');
CREATE POLICY IF NOT EXISTS "Admins can view all properties" ON public.properties FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY IF NOT EXISTS "Inspectors can view assigned properties" ON public.properties FOR SELECT USING (public.has_role(auth.uid(), 'inspector'));

CREATE TRIGGER IF NOT EXISTS update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.property_documents (
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

CREATE POLICY IF NOT EXISTS "Users can view own documents" ON public.property_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own documents" ON public.property_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete own documents" ON public.property_documents FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Admins can view all documents" ON public.property_documents FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for property documents (may fail if storage extension not available via SQL editor)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('property-documents', 'property-documents', false);


-- 20260304002938_33a5c912: inspections, inspection_media, scores
/*
Contents from 20260304002938_33a5c912-0432-46bf-b005-33a7c70ea65b.sql
*/
CREATE TYPE IF NOT EXISTS public.inspection_status AS ENUM ('pending', 'in_progress', 'completed', 'scored');

CREATE TABLE IF NOT EXISTS public.inspections (
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

CREATE POLICY IF NOT EXISTS "Property owners can view their inspections" ON public.inspections FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Admins can manage all inspections" ON public.inspections FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY IF NOT EXISTS "Inspectors can view assigned inspections" ON public.inspections FOR SELECT
  USING (inspector_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Inspectors can update assigned inspections" ON public.inspections FOR UPDATE
  USING (inspector_id = auth.uid());

CREATE TRIGGER IF NOT EXISTS update_inspections_updated_at BEFORE UPDATE ON public.inspections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.inspection_media (
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

CREATE POLICY IF NOT EXISTS "Users can view media for their inspections" ON public.inspection_media FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.inspections i
    JOIN public.properties p ON p.id = i.property_id
    WHERE i.id = inspection_id AND (p.user_id = auth.uid() OR i.inspector_id = auth.uid())
  ));
CREATE POLICY IF NOT EXISTS "Admins can manage all media" ON public.inspection_media FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY IF NOT EXISTS "Inspectors can upload media" ON public.inspection_media FOR INSERT
  WITH CHECK (uploaded_by = auth.uid() AND (public.has_role(auth.uid(), 'inspector') OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY IF NOT EXISTS "Uploaders can delete their media" ON public.inspection_media FOR DELETE
  USING (uploaded_by = auth.uid());

CREATE TABLE IF NOT EXISTS public.inspection_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  score NUMERIC(3,1) NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inspection_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view scores for their inspections" ON public.inspection_scores FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.inspections i
    JOIN public.properties p ON p.id = i.property_id
    WHERE i.id = inspection_id AND (p.user_id = auth.uid() OR i.inspector_id = auth.uid())
  ));
CREATE POLICY IF NOT EXISTS "Admins can manage all scores" ON public.inspection_scores FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));


-- 20260305030646: alter property_documents
/*
Contents from 20260305030646_f809458e-6dec-444b-b1f9-8707b1c3a804.sql
*/
ALTER TABLE IF EXISTS public.property_documents
ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS verification_result jsonb,
ADD COLUMN IF NOT EXISTS verified_at timestamptz;


-- 20260306075224: RLS fixes for profiles and user_roles
/*
Contents from 20260306075224_4eef420f-85cc-4491-9943-ac3932572512.sql
*/
DROP POLICY IF EXISTS "Anyone authenticated can view profiles" ON public.profiles;

CREATE POLICY IF NOT EXISTS "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone authenticated can view roles" ON public.user_roles;

CREATE POLICY IF NOT EXISTS "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));


-- 20260306091803: notifications table
/*
Contents from 20260306091803_cc9b101c-0c53-40f2-a700-522504b20396.sql
*/
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Admins can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Publication for realtime (may require supabase CLI to enable)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;


-- 20260308110724: (storage policy tweak)
/*
Contents from 20260308110724_6b2e37f0-f16a-473c-9667-dd15e021a09e.sql
*/
DROP POLICY IF EXISTS "Authenticated users can view inspection media" ON storage.objects;

CREATE POLICY IF NOT EXISTS "Owners and inspectors can view inspection media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'inspection-media' AND (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR
    auth.uid()::text = (storage.foldername(name))[1]
  )
);


-- 20260308204552: payments
/*
Contents from 20260308204552_0e56105a-4c2a-457f-84fd-3deff95aa3a8.sql
*/
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  plan_type text NOT NULL DEFAULT 'basic',
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'NGN',
  paystack_reference text UNIQUE NOT NULL,
  paystack_access_code text,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamp with time zone,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own payments" ON public.payments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can insert own payments" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Admins can view all payments" ON public.payments
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "Users can update own payments" ON public.payments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());


-- 20260308222520: notification_preferences and handle_new_user update
/*
Contents from 20260308222520_166c3096-a61a-4f4e-b9cc-f4c29fe3b3fa.sql
*/
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  payment_success boolean NOT NULL DEFAULT true,
  status_under_review boolean NOT NULL DEFAULT true,
  status_verified boolean NOT NULL DEFAULT true,
  status_rejected boolean NOT NULL DEFAULT true,
  document_verified boolean NOT NULL DEFAULT true,
  inspection_scored boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own preferences"
  ON public.notification_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can insert own preferences"
  ON public.notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can update own preferences"
  ON public.notification_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Update handle_new_user trigger to also insert notification_preferences
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  INSERT INTO public.notification_preferences (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$function$;

-- 20260308232819: storage policy for inspection media
/*
Contents from 20260308232819_7cfafc19-903a-46da-afe6-da6c15d7416c.sql
*/
DROP POLICY IF EXISTS "Authenticated users can view inspection media" ON storage.objects;

CREATE POLICY IF NOT EXISTS "Owners and inspectors can view inspection media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'inspection-media' AND (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR
    auth.uid()::text = (storage.foldername(name))[1]
  )
);

-- End of combined migrations
