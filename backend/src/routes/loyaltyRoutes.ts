import express from 'express';
import jwt from 'jsonwebtoken';
import { LoyaltyPointsService } from '../services/LoyaltyPointsService';

const router = express.Router();
const loyaltyService = new LoyaltyPointsService();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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

// GET /api/loyalty/points - Get user's current points
router.get('/loyalty/points', verifyToken, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const result = await loyaltyService.getUserPoints(userId);
    
    res.status(200).json({
      points: result.points,
      canRedeem: result.canRedeem,
      rewardThreshold: 100,
      discountPercent: 10,
    });
  } catch (err) {
    console.error('Error fetching loyalty points:', err);
    res.status(500).json({ message: 'Failed to fetch loyalty points' });
  }
});

// GET /api/loyalty/history - Get user's points transaction history
router.get('/loyalty/history', verifyToken, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const history = await loyaltyService.getPointsHistory(userId, limit);
    
    res.status(200).json({ history });
  } catch (err) {
    console.error('Error fetching points history:', err);
    res.status(500).json({ message: 'Failed to fetch points history' });
  }
});

// POST /api/loyalty/redeem - Redeem points for discount
router.post('/loyalty/redeem', verifyToken, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    const result = await loyaltyService.redeemPoints(userId, bookingId);

    if (!result.success) {
      return res.status(400).json({ 
        message: 'Not enough points to redeem',
        requiredPoints: 100,
      });
    }

    res.status(200).json({
      message: 'Points redeemed successfully',
      discount: result.discount,
    });
  } catch (err) {
    console.error('Error redeeming points:', err);
    res.status(500).json({ message: 'Failed to redeem points' });
  }
});

// POST /api/loyalty/calculate - Calculate points for services (preview)
router.post('/loyalty/calculate', verifyToken, async (req, res) => {
  try {
    const { services } = req.body;

    if (!services || !Array.isArray(services)) {
      return res.status(400).json({ message: 'Services array is required' });
    }

    const calculation = loyaltyService.calculatePoints(services);

    res.status(200).json({
      points: calculation.points,
      category: calculation.category,
    });
  } catch (err) {
    console.error('Error calculating points:', err);
    res.status(500).json({ message: 'Failed to calculate points' });
  }
});

export default router;
