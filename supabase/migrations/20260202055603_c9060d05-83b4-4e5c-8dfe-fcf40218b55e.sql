-- Create jobs table
CREATE TABLE public.jobs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Full-time',
    description TEXT,
    responsibilities TEXT[] DEFAULT '{}',
    requirements TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job_applications table
CREATE TABLE public.job_applications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    resume_url TEXT,
    cover_letter TEXT,
    status TEXT NOT NULL DEFAULT 'New',
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- RLS policies for jobs (authenticated users can CRUD)
CREATE POLICY "Authenticated users can view jobs"
ON public.jobs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create jobs"
ON public.jobs FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update jobs"
ON public.jobs FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete jobs"
ON public.jobs FOR DELETE
TO authenticated
USING (true);

-- RLS policies for job_applications (authenticated users can CRUD)
CREATE POLICY "Authenticated users can view applications"
ON public.job_applications FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create applications"
ON public.job_applications FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update applications"
ON public.job_applications FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete applications"
ON public.job_applications FOR DELETE
TO authenticated
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();