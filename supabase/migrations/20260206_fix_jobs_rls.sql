-- POLICY: Allow authenticated users to INSERT into jobs
-- This fixes "new row violates row-level security policy for table Jobs" when creating a job
DROP POLICY IF EXISTS "Authenticated users can create jobs" ON public.jobs;

CREATE POLICY "Authenticated users can create jobs"
ON public.jobs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Ensure other policies are also correct
DROP POLICY IF EXISTS "Authenticated users can view jobs" ON public.jobs;
CREATE POLICY "Authenticated users can view jobs"
ON public.jobs FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can update jobs" ON public.jobs;
CREATE POLICY "Authenticated users can update jobs"
ON public.jobs FOR UPDATE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete jobs" ON public.jobs;
CREATE POLICY "Authenticated users can delete jobs"
ON public.jobs FOR DELETE
TO authenticated
USING (true);

-- Also add a policy for service role just in case (optional but helpful for dashboard actions)
DROP POLICY IF EXISTS "Service role full access jobs" ON public.jobs;
CREATE POLICY "Service role full access jobs"
ON public.jobs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
