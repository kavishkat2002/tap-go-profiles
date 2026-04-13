-- Create the profile_requests table for managing profile creation orders
CREATE TABLE IF NOT EXISTS public.profile_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_type TEXT NOT NULL CHECK (profile_type IN ('personal', 'business', 'restaurant')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  package TEXT NOT NULL CHECK (package IN ('basic', 'pro', 'premium')),
  payment_slip_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profile_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own requests
CREATE POLICY "Users can view own requests" ON public.profile_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own requests
CREATE POLICY "Users can create own requests" ON public.profile_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Allow all authenticated users to read all requests (for admin)
CREATE POLICY "Admins can view all requests" ON public.profile_requests
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Allow all authenticated users to update requests (admin will use this)
CREATE POLICY "Admins can update requests" ON public.profile_requests
  FOR UPDATE
  USING (auth.role() = 'authenticated');
