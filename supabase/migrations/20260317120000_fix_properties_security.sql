-- Fix security issue: Users Can Self-Verify Properties
-- Issue: UPDATE policy on properties table has no WITH CHECK, allowing users to change status to verified

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can update own properties" ON public.properties;

-- Create restrictive user policy: users can only update their own properties
-- (status changes are enforced at trigger level below)
CREATE POLICY "Users can update own properties" ON public.properties FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add admin policy: admins can update all properties without restrictions
CREATE POLICY "Admins can update all properties" ON public.properties FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add inspector policy: inspectors can update status
CREATE POLICY "Inspectors can update all properties" ON public.properties FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'inspector'))
  WITH CHECK (public.has_role(auth.uid(), 'inspector'));

-- Create BEFORE UPDATE trigger to enforce business logic
-- Users cannot change property status; only admins and inspectors can
CREATE OR REPLACE FUNCTION public.enforce_property_status_restrictions()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if status is being changed
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Only allow admins and inspectors to change status
    IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'inspector')) THEN
      RAISE EXCEPTION 'Permission denied: only admins and inspectors can change property status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_property_status_restrictions_trigger ON public.properties;
CREATE TRIGGER enforce_property_status_restrictions_trigger
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_property_status_restrictions();
