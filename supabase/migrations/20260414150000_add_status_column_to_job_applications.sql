-- Ensure status exists for dashboard metrics and application workflow updates.
ALTER TABLE public.job_applications
ADD COLUMN IF NOT EXISTS status TEXT;

ALTER TABLE public.job_applications
ALTER COLUMN status SET DEFAULT 'New';

UPDATE public.job_applications
SET status = 'New'
WHERE status IS NULL OR btrim(status) = '';

ALTER TABLE public.job_applications
ALTER COLUMN status SET NOT NULL;

NOTIFY pgrst, 'reload schema';
