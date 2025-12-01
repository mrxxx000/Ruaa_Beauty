"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
// Singleton pattern for Supabase connection - reuse across requests
let supabaseInstance = null;
function getSupabase() {
    if (!supabaseInstance) {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE;
        if (!url || !key) {
            throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE environment variables are required');
        }
        supabaseInstance = (0, supabase_js_1.createClient)(url, key);
    }
    return supabaseInstance;
}
class AuthService {
    getSupabase() {
        return getSupabase();
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
        // Hash password - use rounds 10 for balance between security and speed
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
    async loginUser(email, password) {
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
    async isAdmin(userId) {
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
    async updateUserProfile(userId, name, phone_number) {
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
    async getUserWithPhone(id) {
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
    async changePassword(userId, oldPassword, newPassword) {
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
        const isPasswordValid = await bcrypt_1.default.compare(oldPassword, data.password);
        if (!isPasswordValid) {
            throw new Error('Old password is incorrect');
        }
        // Hash new password
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
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
    async requestPasswordReset(email) {
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
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const resetTokenHash = crypto_1.default.createHash('sha256').update(resetToken).digest('hex');
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
    async resetPassword(resetToken, newPassword) {
        if (!resetToken || !newPassword) {
            throw new Error('Reset token and new password are required');
        }
        if (newPassword.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }
        // Hash the reset token to compare
        const resetTokenHash = crypto_1.default.createHash('sha256').update(resetToken).digest('hex');
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
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
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
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map