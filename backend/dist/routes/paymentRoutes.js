"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const PaymentService_1 = require("../services/PaymentService");
const router = express_1.default.Router();
const paymentService = new PaymentService_1.PaymentService();
// POST /api/payment/create-order - Create a PayPal order
router.post('/payment/create-order', async (req, res) => {
    const { totalPrice, name, email, phone, service, bookingId } = req.body;
    if (!totalPrice || !name || !email || !phone || !service) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    try {
        console.log('📝 Creating PayPal order for booking:', { name, service, totalPrice });
        const orderId = await paymentService.createOrder({
            totalPrice,
            name,
            email,
            phone,
            service,
            bookingId,
        });
        res.status(200).json({
            message: 'PayPal order created successfully',
            orderId,
        });
    }
    catch (err) {
        console.error('❌ Error creating PayPal order:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({
            message: 'Error creating PayPal order',
            details: errorMessage,
        });
    }
});
// POST /api/payment/capture-order - Capture a PayPal order
router.post('/payment/capture-order', async (req, res) => {
    const { orderId } = req.body;
    if (!orderId) {
        return res.status(400).json({ message: 'Order ID is required' });
    }
    try {
        console.log('💳 Capturing PayPal order:', orderId);
        const result = await paymentService.captureOrder(orderId);
        res.status(200).json({
            message: 'PayPal order captured successfully',
            payment: result,
        });
    }
    catch (err) {
        console.error('❌ Error capturing PayPal order:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({
            message: 'Error capturing PayPal order',
            details: errorMessage,
        });
    }
});
// GET /api/payment/order-details/:orderId - Get PayPal order details
router.get('/payment/order-details/:orderId', async (req, res) => {
    const { orderId } = req.params;
    if (!orderId) {
        return res.status(400).json({ message: 'Order ID is required' });
    }
    try {
        console.log('🔍 Fetching PayPal order details:', orderId);
        const orderDetails = await paymentService.getOrderDetails(orderId);
        res.status(200).json({
            message: 'PayPal order details retrieved successfully',
            order: orderDetails,
        });
    }
    catch (err) {
        console.error('❌ Error fetching PayPal order details:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({
            message: 'Error fetching PayPal order details',
            details: errorMessage,
        });
    }
});
exports.default = router;
//# sourceMappingURL=paymentRoutes.js.map