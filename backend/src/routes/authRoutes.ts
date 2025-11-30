import express from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/AuthService';

const router = express.Router();
const authService = new AuthService();

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

export default router;
