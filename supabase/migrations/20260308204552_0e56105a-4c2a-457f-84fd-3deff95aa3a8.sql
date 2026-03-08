
-- Payments table for Paystack transactions
CREATE TABLE public.payments (
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

-- Users can view own payments
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can insert own payments
CREATE POLICY "Users can insert own payments" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can view all payments
CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role updates (via edge function) - allow update for own payments
CREATE POLICY "Users can update own payments" ON public.payments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
