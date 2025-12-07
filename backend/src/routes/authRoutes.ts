import express from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/AuthService';
import { EmailService } from '../services/EmailService';

const router = express.Router();
const authService = new AuthService();
const emailService = new EmailService();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = '7d';

// Middleware to verify JWT token
const verifyToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).userId = decoded.id;
    next();
  } catch (err) {
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
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    res.status(201).json({
      message: 'Registration successful',
      user,
      token,
    });
  } catch (err) {
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
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    res.status(200).json({
      message: 'Login successful',
      user,
      token,
    });
  } catch (err) {
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
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await authService.getUserById(decoded.id);

    res.status(200).json({
      message: 'Token is valid',
      user,
    });
  } catch (err) {
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
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error fetching users';
    res.status(500).json({ message: errorMessage });
  }
});

// GET /api/auth/profile - Get current user profile with phone number
router.get('/profile', verifyToken, async (req, res) => {
  const userId = (req as any).userId;

  try {
    const user = await authService.getUserWithPhone(userId);

    res.status(200).json({
      message: 'Profile retrieved successfully',
      user,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error fetching profile';
    res.status(500).json({ message: errorMessage });
  }
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  const userId = (req as any).userId;
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
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error updating profile';
    res.status(500).json({ message: errorMessage });
  }
});

// POST /api/auth/change-password - Change password (authenticated)
router.post('/change-password', verifyToken, async (req, res) => {
  const userId = (req as any).userId;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Old password and new password are required' });
  }

  try {
    const result = await authService.changePassword(userId, oldPassword, newPassword);

    // Send confirmation email
    try {
      await emailService.sendPasswordChangedConfirmation(result.user.email, result.user.name);
    } catch (emailErr) {
      console.warn('⚠️ Failed to send confirmation email, but password changed successfully');
    }

    res.status(200).json({
      message: 'Password changed successfully',
      user: result.user,
    });
  } catch (err) {
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

    // If user exists, send reset email asynchronously (don't wait for it)
    if (result.resetToken) {
      // Send email in the background without awaiting
      emailService.sendPasswordResetEmail(result.email, result.resetToken).catch((emailErr: any) => {
        console.error('❌ Failed to send reset email:', emailErr);
        console.error('📍 Error details:', {
          message: emailErr.message,
          statusCode: emailErr.statusCode,
          response: emailErr.response,
        });
        console.warn('⚠️ Email failed - user may not receive reset link');
      });
    }

    // Immediately return response (email sending happens in background)
    res.status(200).json({
      message: 'If this email exists, a password reset link has been sent to your inbox',
    });
  } catch (err) {
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
    } catch (emailErr) {
      console.warn('⚠️ Failed to send confirmation email, but password reset successfully');
    }

    res.status(200).json({
      message: 'Password reset successfully',
      user: result.user,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error resetting password';
    res.status(400).json({ message: errorMessage });
  }
});

export default router;
