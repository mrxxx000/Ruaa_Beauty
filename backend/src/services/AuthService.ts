import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

export class AuthService {
  private supabaseInstance: any = null;

  private getSupabase() {
    if (!this.supabaseInstance) {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE;
      if (!url || !key) {
        throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE environment variables are required');
      }
      this.supabaseInstance = createClient(url, key);
    }
    return this.supabaseInstance;
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

    // Hash password
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
      .select()
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

    // Fetch user
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      throw new Error('Invalid email or password');
    }

    // Verify password
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
}
