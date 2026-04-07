-- Create auth_users table for email/password authentication
CREATE TABLE IF NOT EXISTS public.auth_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON public.auth_users(email);

-- Enable RLS
ALTER TABLE public.auth_users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own record
CREATE POLICY "Users can view their own auth record" ON public.auth_users
  FOR SELECT
  USING (auth.uid() = id);

-- RLS Policy: Users can update their own record (for profile info, not password)
CREATE POLICY "Users can update own profile info" ON public.auth_users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
