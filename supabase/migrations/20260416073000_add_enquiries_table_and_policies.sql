-- Add enquiries table used by the admin dashboard and allow anon/authenticated access
-- because this project uses custom admin auth outside Supabase Auth.

CREATE TABLE IF NOT EXISTS public.enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'New',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon users can view enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Anon users can create enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Anon users can update enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Anon users can delete enquiries" ON public.enquiries;

CREATE POLICY "Anon users can view enquiries"
ON public.enquiries FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anon users can create enquiries"
ON public.enquiries FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anon users can update enquiries"
ON public.enquiries FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Anon users can delete enquiries"
ON public.enquiries FOR DELETE
TO anon, authenticated
USING (true);
