-- RPC function to create a new admin
-- Requires valid credentials of an existing admin to authorize the creation.
CREATE OR REPLACE FUNCTION public.create_new_admin(
    current_email TEXT,
    current_password TEXT,
    new_email TEXT,
    new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    auth_result JSONB;
    new_admin_id UUID;
    is_success BOOLEAN;
BEGIN
    -- 1. Verify the current admin's credentials
    auth_result := public.verify_admin_password(current_email, current_password);
    
    -- Extract success boolean safely
    SELECT (auth_result->>'success')::boolean INTO is_success;

    IF is_success IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'message', 'Authorization failed: Invalid current admin credentials');
    END IF;

    -- 2. Check if new email already exists
    IF EXISTS (SELECT 1 FROM public.admin_auth WHERE LOWER(email) = LOWER(new_email)) THEN
        RETURN jsonb_build_object('success', false, 'message', 'User with this email already exists');
    END IF;

    -- 3. Insert new admin_auth
    INSERT INTO public.admin_auth (email, password_hash)
    VALUES (
        new_email,
        crypt(new_password, gen_salt('bf'))
    )
    RETURNING id INTO new_admin_id;

    -- 4. Do NOT insert into admin_security. The new user must set this up later (e.g. via profile update if implemented, or they have no recovery option yet).
    -- This matches the requirement to remove security question option during creation.

    RETURN jsonb_build_object('success', true, 'message', 'New admin user created successfully');

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
