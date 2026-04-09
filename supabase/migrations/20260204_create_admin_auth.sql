-- Enable pgcrypto extension for hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create admin_auth table (Credentials & Login State)
CREATE TABLE IF NOT EXISTS public.admin_auth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    failed_attempts INTEGER DEFAULT 0,
    last_failed_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create admin_security table (Recovery Info)
CREATE TABLE IF NOT EXISTS public.admin_security (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.admin_auth(id) ON DELETE CASCADE UNIQUE,
    security_question TEXT NOT NULL,
    security_answer_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_auth_email ON public.admin_auth(email);
CREATE INDEX IF NOT EXISTS idx_admin_security_admin_id ON public.admin_security(admin_id);

-- 3. Seed initial admin record
DO $$
DECLARE
    new_admin_id UUID;
BEGIN
    -- Insert into admin_auth
    INSERT INTO public.admin_auth (email, password_hash)
    VALUES (
        'pratikshaangadi98@gmail.com',
        crypt('Admin@123', gen_salt('bf'))
    )
    ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
    RETURNING id INTO new_admin_id;

    -- Insert into admin_security
    INSERT INTO public.admin_security (admin_id, security_question, security_answer_hash)
    VALUES (
        new_admin_id,
        'In which year did the company start?',
        crypt('2012', gen_salt('bf'))
    )
    ON CONFLICT (admin_id) DO UPDATE SET 
        security_question = EXCLUDED.security_question,
        security_answer_hash = EXCLUDED.security_answer_hash;
END $$;

-- 4. Login Validation Function (RPC)
CREATE OR REPLACE FUNCTION public.verify_admin_password(
    input_email TEXT,
    input_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_record RECORD;
    is_valid BOOLEAN;
BEGIN
    -- Case-insensitive email lookup
    SELECT * INTO admin_record FROM public.admin_auth WHERE LOWER(email) = LOWER(input_email);

    IF admin_record IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid credentials');
    END IF;

    is_valid := (admin_record.password_hash = crypt(input_password, admin_record.password_hash));

    IF is_valid THEN
        UPDATE public.admin_auth
        SET failed_attempts = 0, 
            last_failed_login = NULL,
            updated_at = now()
        WHERE id = admin_record.id;
        
        RETURN jsonb_build_object(
            'success', true, 
            'message', 'Login successful', 
            'user', jsonb_build_object('id', admin_record.id, 'email', admin_record.email)
        );
    ELSE
        UPDATE public.admin_auth
        SET failed_attempts = failed_attempts + 1,
            last_failed_login = now(),
            updated_at = now()
        WHERE id = admin_record.id;
        
        RETURN jsonb_build_object('success', false, 'message', 'Invalid credentials');
    END IF;
END;
$$;

-- 5. Verify Security Answer Function (RPC)
CREATE OR REPLACE FUNCTION public.verify_security_answer(
    input_email TEXT,
    input_answer TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_record RECORD;
    security_record RECORD;
    is_valid BOOLEAN;
BEGIN
    SELECT id INTO admin_record FROM public.admin_auth WHERE LOWER(email) = LOWER(input_email);

    IF admin_record IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Account not found');
    END IF;

    SELECT * INTO security_record FROM public.admin_security WHERE admin_id = admin_record.id;

    IF security_record IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Security info not set. Please contact system admin.');
    END IF;

    is_valid := (security_record.security_answer_hash = crypt(input_answer, security_record.security_answer_hash));

    IF is_valid THEN
        RETURN jsonb_build_object('success', true, 'message', 'Answer verified');
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Incorrect answer');
    END IF;
END;
$$;

-- 5.5 Get Security Question Function (RPC)
CREATE OR REPLACE FUNCTION public.get_admin_security_question(
    input_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_record RECORD;
    question_text TEXT;
BEGIN
    SELECT id INTO admin_record FROM public.admin_auth WHERE LOWER(email) = LOWER(input_email);

    IF admin_record IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Account not found');
    END IF;

    SELECT security_question INTO question_text FROM public.admin_security WHERE admin_id = admin_record.id;

    IF question_text IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Security question not configured yet');
    END IF;

    RETURN jsonb_build_object('success', true, 'question', question_text);
END;
$$;

-- 6. Reset Password Function (RPC)
CREATE OR REPLACE FUNCTION public.reset_admin_password(
    input_email TEXT,
    input_answer TEXT,
    new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_record RECORD;
    is_valid_answer BOOLEAN;
BEGIN
    -- Verify via verify_security_answer logic
    SELECT success INTO is_valid_answer FROM (SELECT (verify_security_answer(input_email, input_answer))->>'success' as success) t;

    IF is_valid_answer = 'true' THEN
        SELECT id, email INTO admin_record FROM public.admin_auth WHERE LOWER(email) = LOWER(input_email);

        UPDATE public.admin_auth
        SET password_hash = crypt(new_password, gen_salt('bf')),
            updated_at = now()
        WHERE id = admin_record.id;
        
        RETURN jsonb_build_object(
            'success', true, 
            'message', 'Password reset successful',
            'user', jsonb_build_object('id', admin_record.id, 'email', admin_record.email)
        );
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Verification failed');
    END IF;
END;
$$;

-- 7. Update Security Question Function (RPC)
-- Allows an authenticated admin to update their own security info
CREATE OR REPLACE FUNCTION public.update_admin_security(
    admin_id_val UUID,
    new_question TEXT,
    new_answer TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.admin_security (admin_id, security_question, security_answer_hash)
    VALUES (
        admin_id_val,
        new_question,
        crypt(new_answer, gen_salt('bf'))
    )
    ON CONFLICT (admin_id) DO UPDATE SET 
        security_question = EXCLUDED.security_question,
        security_answer_hash = EXCLUDED.security_answer_hash,
        updated_at = now();

    RETURN jsonb_build_object('success', true, 'message', 'Security question updated');
END;
$$;

-- 8. Enable Row Level Security (RLS)
ALTER TABLE public.admin_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_security ENABLE ROW LEVEL SECURITY;

-- 9. Create Policies (Deny all direct public access)
-- Since we use 'SECURITY DEFINER' on our RPC functions, 
-- they will still work perfectly, but direct API access will be blocked.

CREATE POLICY "No public access to admin_auth" 
ON public.admin_auth FOR ALL 
TO anon, authenticated 
USING (false);

CREATE POLICY "No public access to admin_security" 
ON public.admin_security FOR ALL 
TO anon, authenticated 
USING (false);
