-- Create email_logs table to track sent emails
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_type TEXT NOT NULL,
  variables JSONB,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed
  error_message TEXT
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email logs"
  ON public.email_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all email logs"
  ON public.email_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to send email via Supabase mail
CREATE OR REPLACE FUNCTION public.send_email_notification(
  p_user_id UUID,
  p_recipient_email TEXT,
  p_subject TEXT,
  p_template_type TEXT,
  p_variables JSONB
)
RETURNS VOID AS $$
BEGIN
  -- Log the email
  INSERT INTO public.email_logs (user_id, recipient_email, subject, template_type, variables, status)
  VALUES (p_user_id, p_recipient_email, p_subject, p_template_type, p_variables, 'sent');
END;
$$ LANGUAGE plpgsql;

-- Trigger to send email when property is submitted
CREATE OR REPLACE FUNCTION public.on_property_submitted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'submitted' AND OLD.status != 'submitted' THEN
    -- Get user email
    SELECT email INTO NEW.user_id FROM auth.users WHERE id = NEW.user_id;
    
    -- Send email to user
    PERFORM public.send_email_notification(
      NEW.user_id,
      (SELECT email FROM auth.users WHERE id = NEW.user_id),
      'Property Submitted Successfully',
      'property_submitted',
      jsonb_build_object('property_title', NEW.title, 'property_id', NEW.id)
    );
    
    -- Create notification
    INSERT INTO public.notifications (user_id, type, title, message, property_id)
    VALUES (
      NEW.user_id,
      'property_submitted',
      'Property Submitted',
      'Your property "' || NEW.title || '" has been submitted for inspection.',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER property_submitted_trigger
AFTER UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.on_property_submitted();

-- Trigger to send email when inspection is assigned
CREATE OR REPLACE FUNCTION public.on_inspection_assigned()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.inspector_id IS NOT NULL AND OLD.inspector_id IS NULL THEN
    -- Get property details
    DECLARE
      v_property_title TEXT;
      v_user_id UUID;
      v_inspector_email TEXT;
      v_user_email TEXT;
    BEGIN
      SELECT title, user_id INTO v_property_title, v_user_id FROM public.properties WHERE id = NEW.property_id;
      SELECT email INTO v_inspector_email FROM auth.users WHERE id = NEW.inspector_id;
      SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
      
      -- Email to inspector
      PERFORM public.send_email_notification(
        NEW.inspector_id,
        v_inspector_email,
        'New Inspection Assigned',
        'inspection_assigned',
        jsonb_build_object('property_title', v_property_title, 'inspection_id', NEW.id)
      );
      
      -- Notification to inspector
      INSERT INTO public.notifications (user_id, type, title, message, property_id)
      VALUES (
        NEW.inspector_id,
        'inspection_assigned',
        'Inspection Assigned',
        'You have been assigned to inspect "' || v_property_title || '".',
        NEW.property_id
      );
      
      -- Email to property owner
      PERFORM public.send_email_notification(
        v_user_id,
        v_user_email,
        'Inspector Assigned to Your Property',
        'inspector_assigned',
        jsonb_build_object('property_title', v_property_title, 'inspection_id', NEW.id)
      );
      
      -- Notification to property owner
      INSERT INTO public.notifications (user_id, type, title, message, property_id)
      VALUES (
        v_user_id,
        'inspector_assigned',
        'Inspector Assigned',
        'An inspector has been assigned to "' || v_property_title || '".',
        NEW.property_id
      );
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inspection_assigned_trigger
AFTER UPDATE ON public.inspections
FOR EACH ROW
EXECUTE FUNCTION public.on_inspection_assigned();

-- Trigger to send email when inspection is scored
CREATE OR REPLACE FUNCTION public.on_inspection_scored()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'scored' AND OLD.status != 'scored' THEN
    DECLARE
      v_property_title TEXT;
      v_user_id UUID;
      v_user_email TEXT;
    BEGIN
      SELECT title, user_id INTO v_property_title, v_user_id FROM public.properties WHERE id = NEW.property_id;
      SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
      
      -- Email to user
      PERFORM public.send_email_notification(
        v_user_id,
        v_user_email,
        'Your Inspection Report is Ready',
        'inspection_scored',
        jsonb_build_object(
          'property_title', v_property_title,
          'inspection_id', NEW.id,
          'score', NEW.overall_score
        )
      );
      
      -- Notification to user
      INSERT INTO public.notifications (user_id, type, title, message, property_id)
      VALUES (
        v_user_id,
        'inspection_scored',
        'Inspection Complete',
        'Your inspection report for "' || v_property_title || '" is ready. Score: ' || ROUND(NEW.overall_score::numeric, 1) || '/10',
        NEW.property_id
      );
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inspection_scored_trigger
AFTER UPDATE ON public.inspections
FOR EACH ROW
EXECUTE FUNCTION public.on_inspection_scored();
