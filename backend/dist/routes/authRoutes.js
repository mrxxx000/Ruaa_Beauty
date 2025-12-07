"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AuthService_1 = require("../services/AuthService");
const EmailService_1 = require("../services/EmailService");
const router = express_1.default.Router();
const authService = new AuthService_1.AuthService();
const emailService = new EmailService_1.EmailService();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = '7d';
// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.userId = decoded.id;
        next();
    }
    catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};
// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { name, email, password, phone_number } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email and password are required' });
    }
    try {
        const user = await authService.registerUser(name, email, password, phone_number);
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
        res.status(201).json({
            message: 'Registration successful',
            user,
            token,
        });
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Registration failed';
        if (errorMessage.includes('already exists')) {
            return res.status(409).json({ message: errorMessage });
        }
        res.status(400).json({ message: errorMessage });
    }
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    try {
        const user = await authService.loginUser(email, password);
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
        res.status(200).json({
            message: 'Login successful',
            user,
            token,
        });
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Login failed';
        res.status(401).json({ message: errorMessage });
    }
});
// POST /api/auth/verify
router.post('/verify', async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ message: 'Token is required' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await authService.getUserById(decoded.id);
        res.status(200).json({
            message: 'Token is valid',
            user,
        });
    }
    catch (err) {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
});
// GET /api/auth/users
router.get('/users', async (req, res) => {
    try {
        const users = await authService.getAllUsers();
        res.status(200).json({
            users,
        });
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error fetching users';
        res.status(500).json({ message: errorMessage });
    }
});
// GET /api/auth/profile - Get current user profile with phone number
router.get('/profile', verifyToken, async (req, res) => {
    const userId = req.userId;
    try {
        const user = await authService.getUserWithPhone(userId);
        res.status(200).json({
            message: 'Profile retrieved successfully',
            user,
        });
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error fetching profile';
        res.status(500).json({ message: errorMessage });
    }
});
// PUT /api/auth/profile - Update user profile
router.put('/profile', verifyToken, async (req, res) => {
    const userId = req.userId;
    const { name, phone_number } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Name is required' });
    }
    try {
        const updatedUser = await authService.updateUserProfile(userId, name, phone_number);
        res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedUser,
        });
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error updating profile';
        res.status(500).json({ message: errorMessage });
    }
});
// POST /api/auth/change-password - Change password (authenticated)
router.post('/change-password', verifyToken, async (req, res) => {
    const userId = req.userId;
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Old password and new password are required' });
    }
    try {
        const result = await authService.changePassword(userId, oldPassword, newPassword);
        // Send confirmation email
        try {
            await emailService.sendPasswordChangedConfirmation(result.user.email, result.user.name);
        }
        catch (emailErr) {
            console.warn('⚠️ Failed to send confirmation email, but password changed successfully');
        }
        res.status(200).json({
            message: 'Password changed successfully',
            user: result.user,
        });
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error changing password';
        res.status(400).json({ message: errorMessage });
    }
});
// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    try {
        const result = await authService.requestPasswordReset(email);
        // If user exists, send reset email
        if (result.resetToken) {
            try {
                console.log(`📧 Attempting to send password reset email to: ${result.email}`);
                console.log(`🔑 Reset token: ${result.resetToken.substring(0, 10)}...`);
                await emailService.sendPasswordResetEmail(result.email, result.resetToken);
                console.log(`✅ Password reset email sent to ${result.email}`);
            }
            catch (emailErr) {
                console.error('❌ Failed to send reset email:', emailErr);
                console.error('📍 Error details:', {
                    message: emailErr.message,
                    statusCode: emailErr.statusCode,
                    response: emailErr.response,
                });
                // Don't fail the request - email sending is not critical
                console.warn('⚠️ Email failed but continuing with response');
            }
        }
        // Always return the same message for security
        res.status(200).json({
            message: 'If this email exists, a password reset link has been sent to your inbox',
        });
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error processing reset request';
        console.error('❌ Error in forgot-password endpoint:', errorMessage);
        res.status(500).json({ message: errorMessage });
    }
});
// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', async (req, res) => {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
        return res.status(400).json({ message: 'Reset token and new password are required' });
    }
    try {
        const result = await authService.resetPassword(resetToken, newPassword);
        // Send confirmation email
        try {
            await emailService.sendPasswordChangedConfirmation(result.user.email, result.user.name);
        }
        catch (emailErr) {
            console.warn('⚠️ Failed to send confirmation email, but password reset successfully');
        }
        res.status(200).json({
            message: 'Password reset successfully',
            user: result.user,
        });
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error resetting password';
        res.status(400).json({ message: errorMessage });
    }
});
exports.default = router;
//# sourceMappingURL=authRoutes.js.map