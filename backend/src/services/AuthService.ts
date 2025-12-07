import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Singleton pattern for Supabase connection - reuse across requests
let supabaseInstance: any = null;

function getSupabase() {
  if (!supabaseInstance) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE;
    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE environment variables are required');
    }
    supabaseInstance = createClient(url, key);
  }
  return supabaseInstance;
}

export class AuthService {
  private getSupabase() {
    return getSupabase();
  }

  async registerUser(name: string, email: string, password: string, phone_number?: string) {
    if (!name || !email || !password) {
      throw new Error('Name, email, and password are required');
    }

    if (name.length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw new Error('Please enter a valid email address');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Hash password - use rounds 10 for balance between security and speed
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          phone_number: phone_number || null,
          role: 'user',
        },
      ])
      .select('id, name, email, role')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Email already exists');
      }
      throw new Error(`Registration error: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
    };
  }

  async loginUser(email: string, password: string) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Fetch user - select only needed columns for faster query
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, password, role')
      .eq('email', email)
      .single();

    if (error || !data) {
      throw new Error('Invalid email or password');
    }

    // Verify password - this is intentionally slow for security
    const isPasswordValid = await bcrypt.compare(password, data.password);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
    };
  }

  async getUserById(id: number) {
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new Error('User not found');
    }

    return data;
  }

  async getAllUsers() {
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }

    console.log('📞 Raw data from Supabase:', JSON.stringify(data?.[0], null, 2));
    console.log('📞 All user phone numbers:', data?.map((u: any) => ({ id: u.id, name: u.name, phone_number: u.phone_number })));
    
    // Return only the necessary fields
    const mappedUsers = data?.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone_number: u.phone_number,
      role: u.role
    })) || [];
    
    console.log('📞 Mapped users being returned:', JSON.stringify(mappedUsers[0], null, 2));
    return mappedUsers;
  }

  async isAdmin(userId: number) {
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw new Error('User not found');
    }

    return data.role === 'admin';
  }

  async updateUserProfile(userId: number, name: string, phone_number?: string) {
    if (!name || name.length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }

    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('users')
      .update({
        name,
        phone_number: phone_number || null,
      })
      .eq('id', userId)
      .select('id, name, email, phone_number, role')
      .single();

    if (error) {
      throw new Error(`Error updating profile: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone_number: data.phone_number,
      role: data.role,
    };
  }

  async getUserWithPhone(id: number) {
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone_number, role, loyalty_points')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new Error('User not found');
    }

    return data;
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    if (!oldPassword || !newPassword) {
      throw new Error('Old password and new password are required');
    }

    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long');
    }

    if (oldPassword === newPassword) {
      throw new Error('New password must be different from old password');
    }

    const supabase = this.getSupabase();

    // Get current user with password
    const { data, error } = await supabase
      .from('users')
      .select('id, password')
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw new Error('User not found');
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, data.password);

    if (!isPasswordValid) {
      throw new Error('Old password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const { data: updatedData, error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', userId)
      .select('id, name, email')
      .single();

    if (updateError) {
      throw new Error(`Error updating password: ${updateError.message}`);
    }

    return {
      message: 'Password changed successfully',
      user: updatedData,
    };
  }

  async requestPasswordReset(email: string) {
    if (!email) {
      throw new Error('Email is required');
    }

    const supabase = this.getSupabase();

    // Check if user exists
    const { data, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (error || !data) {
      // Don't reveal if email exists for security
      return {
        message: 'If this email exists, a reset link has been sent',
      };
    }

    // Generate reset token (expires in 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store reset token in database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        reset_token: resetTokenHash,
        reset_token_expires_at: expiresAt.toISOString(),
      })
      .eq('id', data.id);

    if (updateError) {
      throw new Error(`Error generating reset token: ${updateError.message}`);
    }

    // Return token to be used in email
    return {
      userId: data.id,
      email: data.email,
      resetToken,
      message: 'If this email exists, a reset link has been sent',
    };
  }

  async resetPassword(resetToken: string, newPassword: string) {
    if (!resetToken || !newPassword) {
      throw new Error('Reset token and new password are required');
    }

    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Hash the reset token to compare
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    const supabase = this.getSupabase();

    // Find user with matching reset token and check expiration
    const { data, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('reset_token', resetTokenHash)
      .gt('reset_token_expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    const { data: updatedData, error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expires_at: null,
      })
      .eq('id', data.id)
      .select('id, name, email')
      .single();

    if (updateError) {
      throw new Error(`Error resetting password: ${updateError.message}`);
    }

    return {
      message: 'Password reset successfully',
      user: updatedData,
    };
  }}
