-- Add requirements and responsibilities columns if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'requirements') THEN
        ALTER TABLE public.jobs ADD COLUMN requirements TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'responsibilities') THEN
        ALTER TABLE public.jobs ADD COLUMN responsibilities TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Refresh Supabase cache by notifying pgrst (optional, but good practice when schema changes)
NOTIFY pgrst, 'reload schema';
