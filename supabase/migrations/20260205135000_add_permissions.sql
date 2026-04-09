-- 1. Add permissions column to admin_auth
ALTER TABLE public.admin_auth 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '["dashboard", "jobs", "applications", "settings"]',
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.admin_auth(id);

-- 2. Update verify_admin_password
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
            'user', jsonb_build_object(
                'id', admin_record.id, 
                'email', admin_record.email,
                'permissions', admin_record.permissions
            )
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

-- 3. Update create_new_admin
CREATE OR REPLACE FUNCTION public.create_new_admin(
    current_email TEXT,
    current_password TEXT,
    new_email TEXT,
    new_password TEXT,
    new_permissions JSONB DEFAULT '["dashboard", "jobs", "applications", "settings"]'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    auth_result JSONB;
    current_admin_id UUID;
    new_admin_id UUID;
    is_success BOOLEAN;
    caller_permissions JSONB;
BEGIN
    -- Verify credentials
    auth_result := public.verify_admin_password(current_email, current_password);
    SELECT (auth_result->>'success')::boolean INTO is_success;

    IF is_success IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'message', 'Authorization failed: Invalid current admin credentials');
    END IF;
    
    -- Verify caller has 'settings' permission
    SELECT COALESCE(auth_result->'user'->'permissions', '[]'::jsonb) INTO caller_permissions;
    IF NOT (caller_permissions @> '["settings"]') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: You do not have permission to add users');
    END IF;

    -- Extract current_admin_id
    SELECT (auth_result->'user'->>'id')::UUID INTO current_admin_id;

    -- Check duplicate
    IF EXISTS (SELECT 1 FROM public.admin_auth WHERE LOWER(email) = LOWER(new_email)) THEN
        RETURN jsonb_build_object('success', false, 'message', 'User with this email already exists');
    END IF;

    -- Insert new admin
    INSERT INTO public.admin_auth (email, password_hash, permissions, created_by)
    VALUES (
        new_email,
        crypt(new_password, gen_salt('bf')),
        new_permissions,
        current_admin_id
    )
    RETURNING id INTO new_admin_id;

    RETURN jsonb_build_object('success', true, 'message', 'New admin user created successfully');

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 4. Get Admin Users List Function
CREATE OR REPLACE FUNCTION public.get_admin_users(current_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_record RECORD;
    users_list JSONB;
BEGIN
    SELECT * INTO admin_record FROM public.admin_auth WHERE LOWER(email) = LOWER(current_email);

    IF admin_record IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Unauthorized');
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', a.id,
            'email', a.email,
            'permissions', a.permissions,
            'created_at', a.created_at,
            'created_by', a.created_by
        ) ORDER BY a.created_at DESC
    ) INTO users_list
    FROM public.admin_auth a;

    RETURN jsonb_build_object('success', true, 'users', COALESCE(users_list, '[]'::jsonb));
END;
$$;

-- 5. Delete Admin User Function (Protected)
CREATE OR REPLACE FUNCTION public.delete_admin_user(
    current_email TEXT,
    target_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    caller_record RECORD;
    target_record RECORD;
BEGIN
    -- Verify Caller
    SELECT * INTO caller_record FROM public.admin_auth WHERE LOWER(email) = LOWER(current_email);
    IF caller_record IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Unauthorized');
    END IF;

    -- Verify Caller Permissions
    IF NOT (COALESCE(caller_record.permissions, '[]'::jsonb) @> '["settings"]') THEN
         RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: Missing permissions');
    END IF;

    -- Find Target
    SELECT * INTO target_record FROM public.admin_auth WHERE LOWER(email) = LOWER(target_email);
    IF target_record IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'User not found');
    END IF;

    -- Block deleting the Super Admin
    IF LOWER(target_record.email) = 'pratikshaangadi98@gmail.com' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Cannot delete the Main Admin account');
    END IF;

    -- Prevent self-deletion (Safety check)
    IF caller_record.id = target_record.id THEN
        RETURN jsonb_build_object('success', false, 'message', 'You cannot delete yourself');
    END IF;

    DELETE FROM public.admin_auth WHERE id = target_record.id;
    
    RETURN jsonb_build_object('success', true, 'message', 'User deleted successfully');
END;
$$;
