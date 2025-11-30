import express from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/AuthService';

const router = express.Router();
const authService = new AuthService();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = '7d';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const user = await authService.registerUser(username, password);

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
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
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const user = await authService.loginUser(username, password);

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
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

export default router;
