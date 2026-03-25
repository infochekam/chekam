-- Add foreign key relationship for inspector_id to profiles.user_id
ALTER TABLE public.inspections
ADD CONSTRAINT fk_inspections_inspector_id 
FOREIGN KEY (inspector_id) 
REFERENCES public.profiles(user_id) 
ON DELETE SET NULL;
