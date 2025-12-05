import express from 'express';
import jwt from 'jsonwebtoken';
import { BookingService } from '../services/BookingService';
import { EmailService } from '../services/EmailService';
import { LoyaltyPointsService } from '../services/LoyaltyPointsService';

const router = express.Router();
const bookingService = new BookingService();
const emailService = new EmailService();
const loyaltyService = new LoyaltyPointsService();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const verifyToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  console.log('🔐 verifyToken middleware - Authorization header:', authHeader);
  console.log('🔐 verifyToken middleware - Token extracted:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log('✅ Token verified, decoded:', { id: decoded.id, email: decoded.email });
    (req as any).userId = decoded.id;
    next();
  } catch (err) {
    console.log('❌ Token verification failed:', err instanceof Error ? err.message : err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// POST /api/booking - Create a new booking
router.post('/booking', async (req, res) => {
  console.log('📝 Booking request received');
  console.log('Authorization header:', req.headers.authorization);
  
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  let userId: number | null = null;

  // Try to verify token if provided
  if (token) {
    try {
      console.log('🔐 Token found, attempting verification...');
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      userId = decoded.id;
      console.log('✅ Token verified, userId:', userId);
    } catch (err) {
      console.log('⚠️  Token verification failed:', err instanceof Error ? err.message : err);
      // Token invalid, but booking can still proceed without user
    }
  } else {
    console.log('⚠️  No token provided in authorization header');
  }

  const { name, email, phone, service, date, time, location, address, notes, totalPrice, servicePricing, mehendiHours, paymentMethod, paymentStatus, useLoyaltyDiscount } = req.body;

  console.log('💰 Payment details received:', { paymentMethod, paymentStatus, useLoyaltyDiscount });

  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }

  if (!date || !time) {
    return res.status(400).json({ message: 'Date and time are required' });
  }

  try {
    // Validate time slot
    const validation = await bookingService.validateTimeSlot(date, time, service, mehendiHours);
    if (!validation.isAvailable) {
      return res.status(409).json({
        message: 'This time slot is already booked. Please select a different date or time.',
        conflictingService: validation.conflictingService,
        conflictingHour: validation.conflictingHour,
        conflictingDate: date,
      });
    }

    const finalPaymentStatus = paymentStatus || 'unpaid';
    console.log('💾 Creating booking with payment status:', finalPaymentStatus);

    // Handle loyalty discount if requested
    let finalPrice = totalPrice;
    let discountApplied = null;
    let discountReason = null;
    let originalPrice = null;

    if (useLoyaltyDiscount && userId) {
      try {
        const userPoints = await loyaltyService.getUserPoints(userId);
        if (userPoints.canRedeem) {
          // Apply discount
          const discountResult = loyaltyService.applyDiscount(totalPrice, 10);
          finalPrice = discountResult.discountedPrice;
          discountApplied = 10; // 10%
          discountReason = 'loyalty_reward';
          originalPrice = totalPrice;
          
          console.log(`🎁 Loyalty discount applied: ${discountResult.discountAmount} SEK off (10%)`);
        }
      } catch (loyaltyErr) {
        console.error('⚠️ Failed to apply loyalty discount:', loyaltyErr);
        // Continue without discount if there's an error
      }
    }

    // Create booking with optional user_id and payment method
    const { cancelToken, bookingId } = await bookingService.createBooking({
      name,
      email,
      phone,
      service,
      date,
      time,
      location,
      address,
      notes,
      totalPrice: finalPrice,
      servicePricing,
      mehendiHours,
      paymentMethod,
      paymentStatus: finalPaymentStatus, // Use provided status or default to unpaid
      userId,
      discountApplied,
      discountReason,
      originalPrice,
    });

    console.log('✅ Booking saved to database with userId:', userId, 'bookingId:', bookingId);

    // Redeem loyalty points if discount was applied
    if (useLoyaltyDiscount && userId && discountApplied && bookingId) {
      try {
        await loyaltyService.redeemPoints(userId, bookingId);
        console.log(`✅ Successfully redeemed 100 loyalty points for user ${userId}`);
      } catch (redeemErr) {
        console.error('⚠️ Failed to redeem loyalty points:', redeemErr);
        // Don't fail the booking if point redemption fails
      }
    }

    // Send response immediately
    res.status(200).json({
      message: 'Booking saved successfully. Confirmation email will be sent shortly.',
      cancelToken,
      discountApplied: discountApplied || 0,
      finalPrice: finalPrice,
    });

    // Send emails asynchronously
    emailService.sendBookingConfirmation({
      name,
      email,
      phone,
      service,
      date,
      time,
      location,
      address,
      notes,
      totalPrice,
      servicePricing,
      mehendiHours,
      cancelToken,
    });
  } catch (err) {
    console.error('❌ Error processing booking:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      message: 'Error processing booking',
      details: errorMessage,
    });
  }
});

// GET /api/booking/my-bookings - Get user's bookings (requires authentication)
router.get('/booking/my-bookings', verifyToken, async (req, res) => {
  const userId = (req as any).userId;
  console.log('🔍 GET /my-bookings request, userId from token:', userId);

  try {
    const bookings = await bookingService.getBookingsByUserId(userId);

    res.status(200).json({
      message: 'Bookings retrieved successfully',
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

// POST /api/booking/cancel/:bookingId - Cancel a booking (requires authentication)
router.post('/booking/cancel/:bookingId', verifyToken, async (req, res) => {
  const userId = (req as any).userId;
  const bookingId = req.params.bookingId || '';

  if (!bookingId) {
    return res.status(400).json({ message: 'Booking ID is required' });
  }

  try {
    const booking = await bookingService.cancelBookingByUserAndId(bookingId, userId);

    res.status(200).json({
      message: 'Booking cancelled successfully',
      booking: {
        name: booking.name,
        email: booking.email,
        service: booking.service,
        date: booking.date,
      },
    });

    // Send cancellation emails asynchronously
    emailService.sendCancellationEmails(booking);
  } catch (err) {
    console.error('Error cancelling booking:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';

    if (errorMessage.includes('not found')) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (errorMessage.includes('Not authorized')) {
      return res.status(403).json({ message: errorMessage });
    }

    res.status(500).json({
      message: 'Error cancelling booking',
      details: errorMessage,
    });
  }
});

// POST /api/unbook - Cancel a booking via token (for unauthenticated users)
router.post('/unbook', async (req, res) => {
  const { token } = req.body || req.query || {};

  if (!token) {
    return res.status(400).json({ message: 'Cancel token is required' });
  }

  try {
    // Get booking
    const booking = await bookingService.getBookingByToken(token);

    // Cancel booking
    await bookingService.cancelBooking(booking.id);

    // Send response immediately
    res.status(200).json({
      message: 'Booking cancelled successfully',
      booking: {
        name: booking.name,
        email: booking.email,
        service: booking.service,
        date: booking.date,
      },
    });

    // Send cancellation emails asynchronously
    emailService.sendCancellationEmails(booking);
  } catch (err) {
    console.error('Error processing cancellation:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    if (errorMessage.includes('not found')) {
      return res.status(404).json({ message: 'Booking not found or already cancelled' });
    }

    res.status(500).json({
      message: 'Error processing cancellation',
      details: errorMessage,
    });
  }
});

// GET /api/available-times - Get available time slots
router.get('/available-times', async (req, res) => {
  const { date, services, mehendiHours } = req.query;

  if (!date || !services) {
    return res.status(400).json({ message: 'Date and services are required' });
  }

  try {
    const servicesArray: string[] = typeof services === 'string'
      ? services.split(',').map(s => s.trim())
      : Array.isArray(services) ? (services as string[]) : [];

    const mehendiHoursNum = mehendiHours ? parseInt(mehendiHours as string, 10) : 0;

    const { availableHours, unavailableHours } = await bookingService.getAvailableTimes(
      date as string,
      servicesArray,
      mehendiHoursNum
    );

    res.status(200).json({
      date,
      availableHours,
      unavailableHours,
    });
  } catch (err) {
    console.error('Error fetching available times:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      message: 'Error fetching available times',
      details: errorMessage,
    });
  }
});

export default router;
