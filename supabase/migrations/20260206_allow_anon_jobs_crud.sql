-- POLICY: Allow ANONYMOUS users to manage jobs
-- Since the application uses a custom admin_auth system and NOT Supabase Auth,
-- the Supabase client makes requests as 'anon'. Therefore, we must allow 'anon'
-- to perform CRUD operations on the jobs table for the admin dashboard to work.

-- Drop existing policies that might conflict or be too restrictive
DROP POLICY IF EXISTS "Authenticated users can create jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated users can update jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated users can delete jobs" ON public.jobs;
DROP POLICY IF EXISTS "Public users can view jobs" ON public.jobs;

-- Create comprehensive policies for 'anon' role
CREATE POLICY "Anon users can view jobs"
ON public.jobs FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anon users can create jobs"
ON public.jobs FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anon users can update jobs"
ON public.jobs FOR UPDATE
TO anon, authenticated
USING (true);

CREATE POLICY "Anon users can delete jobs"
ON public.jobs FOR DELETE
TO anon, authenticated
USING (true);
