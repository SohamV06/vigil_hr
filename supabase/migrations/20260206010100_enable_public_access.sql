-- Enable public read access to jobs (for candidates to see listings)
CREATE POLICY "Public users can view jobs"
ON public.jobs FOR SELECT
TO anon
USING (true);

-- Enable public insert access to job_applications (for candidates to apply)
CREATE POLICY "Public users can create applications"
ON public.job_applications FOR INSERT
TO anon
WITH CHECK (true);
