import express from 'express';
import jwt from 'jsonwebtoken';
import { BookingService } from '../services/BookingService';
import { AuthService } from '../services/AuthService';

const router = express.Router();
const bookingService = new BookingService();
const authService = new AuthService();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token and check admin role
const verifyAdminToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  console.log('🔐 verifyAdminToken middleware - Authorization header:', authHeader);

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log('✅ Token verified, decoded:', { id: decoded.id, email: decoded.email, role: decoded.role });
    
    // Check if user is admin
    const isAdmin = await authService.isAdmin(decoded.id);
    if (!isAdmin) {
      console.log('❌ User is not admin');
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    (req as any).userId = decoded.id;
    (req as any).userRole = decoded.role;
    next();
  } catch (err) {
    console.log('❌ Token verification failed:', err instanceof Error ? err.message : err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// GET /api/admin/bookings - Get all bookings (admin only)
router.get('/bookings', verifyAdminToken, async (req, res) => {
  console.log('📋 GET /admin/bookings request');
  
  try {
    const bookings = await bookingService.getAllBookings();
    
    res.status(200).json({
      message: 'All bookings retrieved successfully',
      bookings,
    });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      message: 'Error fetching bookings',
      details: errorMessage,
    });
  }
});

// GET /api/admin/users - Get all users (admin only)
router.get('/users', verifyAdminToken, async (req, res) => {
  console.log('👥 GET /admin/users request');
  
  try {
    const users = await authService.getAllUsers();
    
    res.status(200).json({
      message: 'All users retrieved successfully',
      users,
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      message: 'Error fetching users',
      details: errorMessage,
    });
  }
});

// PUT /api/admin/bookings/:bookingId/status - Update booking status (admin only)
router.put('/bookings/:bookingId/status', verifyAdminToken, async (req, res) => {
  const bookingId = req.params.bookingId;
  const { status } = req.body;

  if (!bookingId) {
    return res.status(400).json({ message: 'Booking ID is required' });
  }

  if (!status || !['pending', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Valid status is required: pending, completed, or cancelled' });
  }

  console.log(`📝 Updating booking ${bookingId} status to ${status}`);

  try {
    const booking = await bookingService.updateBookingStatus(bookingId, status);
    
    res.status(200).json({
      message: 'Booking status updated successfully',
      booking,
    });
  } catch (err) {
    console.error('Error updating booking status:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      message: 'Error updating booking status',
      details: errorMessage,
    });
  }
});

// DELETE /api/admin/bookings/:bookingId - Cancel a booking (admin only)
router.delete('/bookings/:bookingId', verifyAdminToken, async (req, res) => {
  const bookingId = req.params.bookingId;

  if (!bookingId) {
    return res.status(400).json({ message: 'Booking ID is required' });
  }

  console.log(`🗑️ Cancelling booking ${bookingId}`);

  try {
    await bookingService.cancelBookingAdmin(bookingId);
    
    res.status(200).json({
      message: 'Booking cancelled successfully',
    });
  } catch (err) {
    console.error('Error cancelling booking:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      message: 'Error cancelling booking',
      details: errorMessage,
    });
  }
});

export default router;
