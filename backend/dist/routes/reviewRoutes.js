"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ReviewService_1 = require("../services/ReviewService");
const router = express_1.default.Router();
const reviewService = new ReviewService_1.ReviewService();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
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
// POST /api/reviews - Create a new review (requires authentication)
router.post('/reviews', verifyToken, async (req, res) => {
    const userId = req.userId;
    const { bookingId, rating, comment } = req.body;
    if (!bookingId || !rating || !comment) {
        return res.status(400).json({ message: 'Booking ID, rating and comment are required' });
    }
    try {
        const review = await reviewService.createReview(userId, bookingId, rating, comment);
        res.status(201).json({
            message: 'Review created successfully',
            review,
        });
    }
    catch (err) {
        console.error('Error creating review:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        res.status(400).json({
            message: 'Error creating review',
            details: errorMessage,
        });
    }
});
// GET /api/reviews - Get all reviews (public)
router.get('/reviews', async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    try {
        console.log(`📊 GET /api/reviews - limit: ${limit}, offset: ${offset}`);
        const result = await reviewService.getAllReviews(limit, offset);
        console.log(`✅ Successfully returned ${result.reviews.length} reviews`);
        res.status(200).json(result);
    }
    catch (err) {
        console.error('❌ Error in GET /api/reviews:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        const errorStack = err instanceof Error ? err.stack : '';
        res.status(500).json({
            message: 'Error fetching reviews',
            details: errorMessage,
            stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
        });
    }
});
// GET /api/reviews/stats - Get review statistics (public)
router.get('/reviews/stats', async (req, res) => {
    try {
        const stats = await reviewService.getReviewStats();
        res.status(200).json(stats);
    }
    catch (err) {
        console.error('Error fetching stats:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({
            message: 'Error fetching statistics',
            details: errorMessage,
        });
    }
});
// GET /api/reviews/user/my-reviews - Get my reviews (requires authentication)
router.get('/reviews/user/my-reviews', verifyToken, async (req, res) => {
    const userId = req.userId;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    try {
        const result = await reviewService.getReviewsByUserId(userId, limit, offset);
        res.status(200).json(result);
    }
    catch (err) {
        console.error('Error fetching user reviews:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({
            message: 'Error fetching reviews',
            details: errorMessage,
        });
    }
});
// GET /api/reviews/:reviewId - Get review with replies (public)
router.get('/reviews/:reviewId', async (req, res) => {
    const { reviewId } = req.params;
    if (!reviewId) {
        return res.status(400).json({ message: 'Review ID is required' });
    }
    try {
        const review = await reviewService.getReviewWithReplies(parseInt(reviewId));
        res.status(200).json(review);
    }
    catch (err) {
        console.error('Error fetching review:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        if (errorMessage.includes('not found')) {
            return res.status(404).json({ message: 'Review not found' });
        }
        res.status(500).json({
            message: 'Error fetching review',
            details: errorMessage,
        });
    }
});
// POST /api/reviews/:reviewId/reply - Add reply to review (requires authentication)
router.post('/reviews/:reviewId/reply', verifyToken, async (req, res) => {
    const userId = req.userId;
    const { reviewId } = req.params;
    const { replyText } = req.body;
    if (!reviewId || !replyText) {
        return res.status(400).json({ message: 'Review ID and reply text are required' });
    }
    try {
        const replyData = await reviewService.addReplyToReview(parseInt(reviewId), userId, replyText);
        res.status(201).json({
            message: 'Reply added successfully',
            reply: replyData,
        });
    }
    catch (err) {
        console.error('Error adding reply:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        res.status(400).json({
            message: 'Error adding reply',
            details: errorMessage,
        });
    }
});
// DELETE /api/reviews/:reviewId/reply/:replyId - Delete reply (requires authentication, only author or admin)
router.delete('/reviews/:reviewId/reply/:replyId', verifyToken, async (req, res) => {
    const userId = req.userId;
    const { reviewId, replyId } = req.params;
    if (!reviewId || !replyId) {
        return res.status(400).json({ message: 'Review ID and Reply ID are required' });
    }
    try {
        await reviewService.deleteReply(parseInt(reviewId), parseInt(replyId), userId);
        res.status(200).json({
            message: 'Reply deleted successfully',
        });
    }
    catch (err) {
        console.error('Error deleting reply:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        if (errorMessage.includes('Not authorized')) {
            return res.status(403).json({ message: errorMessage });
        }
        if (errorMessage.includes('not found')) {
            return res.status(404).json({ message: 'Reply not found' });
        }
        res.status(400).json({
            message: 'Error deleting reply',
            details: errorMessage,
        });
    }
});
// PUT /api/reviews/:reviewId - Update review (requires authentication, only author)
router.put('/reviews/:reviewId', verifyToken, async (req, res) => {
    const userId = req.userId;
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    if (!reviewId || !rating || !comment) {
        return res.status(400).json({ message: 'Rating and comment are required' });
    }
    try {
        const review = await reviewService.updateReview(parseInt(reviewId), userId, rating, comment);
        res.status(200).json({
            message: 'Review updated successfully',
            review,
        });
    }
    catch (err) {
        console.error('Error updating review:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        if (errorMessage.includes('Not authorized')) {
            return res.status(403).json({ message: errorMessage });
        }
        res.status(400).json({
            message: 'Error updating review',
            details: errorMessage,
        });
    }
});
// DELETE /api/reviews/:reviewId - Delete review (requires authentication, only author)
router.delete('/reviews/:reviewId', verifyToken, async (req, res) => {
    const userId = req.userId;
    const { reviewId } = req.params;
    if (!reviewId) {
        return res.status(400).json({ message: 'Review ID is required' });
    }
    try {
        await reviewService.deleteReview(parseInt(reviewId), userId);
        res.status(200).json({
            message: 'Review deleted successfully',
        });
    }
    catch (err) {
        console.error('Error deleting review:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        if (errorMessage.includes('Not authorized')) {
            return res.status(403).json({ message: errorMessage });
        }
        if (errorMessage.includes('not found')) {
            return res.status(404).json({ message: 'Review not found' });
        }
        res.status(400).json({
            message: 'Error deleting review',
            details: errorMessage,
        });
    }
});
exports.default = router;
//# sourceMappingURL=reviewRoutes.js.map