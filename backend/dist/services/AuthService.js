"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const bcrypt_1 = __importDefault(require("bcrypt"));
class AuthService {
    supabaseInstance = null;
    getSupabase() {
        if (!this.supabaseInstance) {
            const url = process.env.SUPABASE_URL;
            const key = process.env.SUPABASE_SERVICE_ROLE;
            if (!url || !key) {
                throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE environment variables are required');
            }
            this.supabaseInstance = (0, supabase_js_1.createClient)(url, key);
        }
        return this.supabaseInstance;
    }
    async registerUser(name, email, password, phone_number) {
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
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
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
    async loginUser(email, password) {
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
        const isPasswordValid = await bcrypt_1.default.compare(password, data.password);
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
    async getUserById(id) {
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
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map