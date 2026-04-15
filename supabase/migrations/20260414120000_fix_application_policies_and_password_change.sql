-- Align RLS for custom admin auth flow (anon role) and add in-session password change RPC.

-- job_applications policies: allow anon/authenticated to read and update status from dashboard.
DROP POLICY IF EXISTS "Authenticated users can view applications" ON public.job_applications;
DROP POLICY IF EXISTS "Authenticated users can create applications" ON public.job_applications;
DROP POLICY IF EXISTS "Authenticated users can update applications" ON public.job_applications;
DROP POLICY IF EXISTS "Authenticated users can delete applications" ON public.job_applications;
DROP POLICY IF EXISTS "Public users can create applications" ON public.job_applications;

CREATE POLICY "Anon users can view applications"
ON public.job_applications FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anon users can create applications"
ON public.job_applications FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anon users can update applications"
ON public.job_applications FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Anon users can delete applications"
ON public.job_applications FOR DELETE
TO anon, authenticated
USING (true);

-- Allow logged-in admins (custom auth) to change password with current password verification.
CREATE OR REPLACE FUNCTION public.change_admin_password(
    input_email TEXT,
    input_current_password TEXT,
    input_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    auth_result JSONB;
    is_valid BOOLEAN;
    admin_id UUID;
BEGIN
    auth_result := public.verify_admin_password(input_email, input_current_password);
    SELECT (auth_result->>'success')::boolean INTO is_valid;

    IF is_valid IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'message', 'Current password is incorrect');
    END IF;

    SELECT (auth_result->'user'->>'id')::UUID INTO admin_id;

    UPDATE public.admin_auth
    SET password_hash = crypt(input_new_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = admin_id;

    RETURN jsonb_build_object('success', true, 'message', 'Password updated successfully');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
