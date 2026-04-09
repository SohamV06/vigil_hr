import { supabase } from "@/integrations/supabase/client";

interface AdminLoginResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    permissions?: string[];
  };
}

// ... (existing code)

/**
 * Create a new admin user
 * Requires current admin credentials for authorization
 */
export const createAdmin = async (
  currentEmail: string,
  currentPassword: string, // We only need password to verify, email we theoretically have from context but better pass explicitly
  newEmail: string,
  newPassword: string,
  newPermissions: string[]
): Promise<{ success: boolean; message: string }> => {
  try {
    const { data, error } = await supabase.rpc('create_new_admin' as any, {
      current_email: currentEmail,
      current_password: currentPassword,
      new_email: newEmail,
      new_password: newPassword,
      new_permissions: newPermissions
    });

    if (error) return { success: false, message: error.message };
    return data as unknown as { success: boolean; message: string };
  } catch (err: any) {
    return { success: false, message: err.message || "An error occurred" };
  }
};

/**
 * Admin Authentication Service
 * 
 * Handles login via secure Supabase RPC call.
 * 
 * Logic implemented on server-side (postgres function verify_admin_password):
 * 1. Fetch admin by email
 * 2. Compare password hash (using pgcrypto)
 * 3. Update failed_attempts (increment on fail, reset on success)
 * 4. Return result
 */
export const adminLogin = async (email: string, password: string): Promise<AdminLoginResponse> => {
  try {
    console.log("Attempting admin login for:", email);

    // Call the PostgreSQL RPC function 'verify_admin_password'
    const { data, error } = await supabase.rpc('verify_admin_password', {
      input_email: email,
      input_password: password
    });

    if (error) {
      console.error("RPC Error during admin login:", error);
      return { success: false, message: error.message };
    }

    // Cast data to expected response type (Supabase RPC returns JSON)
    const result = data as unknown as AdminLoginResponse;

    return result;

  } catch (err: any) {
    console.error("Unexpected error during admin login:", err);
    return { success: false, message: err.message || "An unexpected error occurred" };
  }
};

/**
 * Fetch security question for an email
 */
export const getSecurityQuestion = async (email: string): Promise<{ success: boolean; question?: string; message?: string }> => {
  try {
    const { data, error } = await supabase.rpc('get_admin_security_question', {
      input_email: email
    });

    if (error) return { success: false, message: error.message };
    return data as unknown as { success: boolean; question?: string; message?: string };
  } catch (err: any) {
    return { success: false, message: err.message || "An error occurred" };
  }
};

/**
 * Verify security answer via Supabase RPC
 */
export const verifySecurityAnswer = async (email: string, answer: string): Promise<{ success: boolean; message: string }> => {
  try {
    const { data, error } = await supabase.rpc('verify_security_answer', {
      input_email: email,
      input_answer: answer
    });

    if (error) return { success: false, message: error.message };
    return data as unknown as { success: boolean; message: string };
  } catch (err: any) {
    return { success: false, message: err.message || "An error occurred" };
  }
};

/**
 * Reset password via Supabase RPC
 */
export const resetPassword = async (email: string, answer: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  try {
    const { data, error } = await supabase.rpc('reset_admin_password', {
      input_email: email,
      input_answer: answer,
      new_password: newPassword
    });

    if (error) return { success: false, message: error.message };
    return data as unknown as { success: boolean; message: string };
  } catch (err: any) {
    return { success: false, message: err.message || "An error occurred" };
  }
};

/**
 * Update security question and answer
 */
export const updateAdminSecurity = async (adminId: string, question: string, answer: string): Promise<{ success: boolean; message: string }> => {
  try {
    const { data, error } = await supabase.rpc('update_admin_security', {
      admin_id_val: adminId,
      new_question: question,
      new_answer: answer
    });

    if (error) return { success: false, message: error.message };
    return data as unknown as { success: boolean; message: string };
  } catch (err: any) {
    return { success: false, message: err.message || "An error occurred" };
  }
};

/**
 * Get list of admin users
 */
export const getAdminUsers = async (currentEmail: string): Promise<{ success: boolean; users?: any[]; message?: string }> => {
  try {
    const { data, error } = await supabase.rpc('get_admin_users' as any, {
      current_email: currentEmail
    });

    if (error) return { success: false, message: error.message };
    return data as unknown as { success: boolean; users?: any[]; message?: string };
  } catch (err: any) {
    return { success: false, message: err.message || "An error occurred" };
  }
};

/**
 * Delete an admin user
 */
export const deleteAdminUser = async (currentEmail: string, targetEmail: string): Promise<{ success: boolean; message: string }> => {
  try {
    const { data, error } = await supabase.rpc('delete_admin_user' as any, {
      current_email: currentEmail,
      target_email: targetEmail
    });

    if (error) return { success: false, message: error.message };

    // Parse response
    const result = data as unknown as { success: boolean; message: string; };
    return result;
  } catch (err: any) {
    return { success: false, message: err.message || "An error occurred" };
  }
};


