-- Phase 1: Auto-create inspection record when property is submitted
-- When a property is inserted with status='submitted', automatically create an inspection record

CREATE OR REPLACE FUNCTION public.create_inspection_on_property_submit()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create inspection if property status is 'submitted' (property was just submitted for review)
  IF NEW.status = 'submitted' THEN
    INSERT INTO public.inspections (property_id, status)
    VALUES (NEW.id, 'pending');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on property INSERT
DROP TRIGGER IF EXISTS create_inspection_on_property_submit_trigger ON public.properties;
CREATE TRIGGER create_inspection_on_property_submit_trigger
  AFTER INSERT ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.create_inspection_on_property_submit();

-- Also handle UPDATE case (user submits a draft property later)
-- If property status changes from non-'submitted' to 'submitted', create inspection
CREATE OR REPLACE FUNCTION public.create_inspection_on_property_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed to 'submitted' and no inspection exists yet
  IF NEW.status = 'submitted' AND OLD.status != 'submitted' THEN
    -- Check if inspection already exists
    IF NOT EXISTS (SELECT 1 FROM public.inspections WHERE property_id = NEW.id) THEN
      INSERT INTO public.inspections (property_id, status)
      VALUES (NEW.id, 'pending');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS create_inspection_on_property_update_trigger ON public.properties;
CREATE TRIGGER create_inspection_on_property_update_trigger
  AFTER UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.create_inspection_on_property_update();
