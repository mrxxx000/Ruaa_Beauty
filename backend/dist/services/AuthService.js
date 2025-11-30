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
    async registerUser(username, password) {
        if (!username || !password) {
            throw new Error('Username and password are required');
        }
        if (username.length < 3) {
            throw new Error('Username must be at least 3 characters long');
        }
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }
        // Hash password
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // Insert user
        const supabase = this.getSupabase();
        const { data, error } = await supabase
            .from('users')
            .insert([
            {
                username,
                password: hashedPassword,
                role: 'user',
            },
        ])
            .select()
            .single();
        if (error) {
            if (error.code === '23505') {
                throw new Error('Username already exists');
            }
            throw new Error(`Registration error: ${error.message}`);
        }
        return {
            id: data.id,
            username: data.username,
            role: data.role,
        };
    }
    async loginUser(username, password) {
        if (!username || !password) {
            throw new Error('Username and password are required');
        }
        // Fetch user
        const supabase = this.getSupabase();
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();
        if (error || !data) {
            throw new Error('Invalid username or password');
        }
        // Verify password
        const isPasswordValid = await bcrypt_1.default.compare(password, data.password);
        if (!isPasswordValid) {
            throw new Error('Invalid username or password');
        }
        return {
            id: data.id,
            username: data.username,
            role: data.role,
        };
    }
    async getUserById(id) {
        const supabase = this.getSupabase();
        const { data, error } = await supabase
            .from('users')
            .select('id, username, role')
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
            .select('id, username, role');
        if (error) {
            throw new Error(`Error fetching users: ${error.message}`);
        }
        return data || [];
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map