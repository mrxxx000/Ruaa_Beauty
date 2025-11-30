import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

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
      .select('id, name, email, role');

    if (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }

    return data || [];
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
      .select('id, name, email, phone_number, role')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new Error('User not found');
    }

    return data;
  }
}
