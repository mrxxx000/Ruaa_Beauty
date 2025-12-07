"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const bookingRoutes_1 = __importDefault(require("./routes/bookingRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const reviewRoutes_1 = __importDefault(require("./routes/reviewRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const loyaltyRoutes_1 = __importDefault(require("./routes/loyaltyRoutes"));
const mediaRoutes_1 = __importDefault(require("./routes/mediaRoutes"));
const sitemap_1 = __importDefault(require("./sitemap"));
const ReminderService_1 = require("./services/ReminderService");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT ? Number(process.env.PORT) : 10000;
// Enable compression for faster responses
app.use((0, compression_1.default)());
// CORS with specific options for better performance
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        const allowedOrigins = [
            process.env.FRONTEND_URL,
            'https://ruaa-beauty.vercel.app',
            'http://localhost:3000',
            'http://localhost:5000',
            '*'
        ].filter(Boolean);
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    optionsSuccessStatus: 200,
}));
// Parse JSON with size limit
app.use(express_1.default.json({ limit: '10mb' }));
console.log('🚀 STARTING BACKEND SERVER - TIME SLOT SYSTEM v2.0 - UPDATED CODE');
app.get('/', (_req, res) => {
    res.send('Hello from backend - Time Slot System v2.0');
});
// Health check endpoint (prevents Render.com free tier cold starts)
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
// Debug endpoint to check if routes are loaded
app.get('/api/status', (_req, res) => {
    res.json({
        message: 'Backend is running',
        routes: {
            auth: '/api/auth/register, /api/auth/login, /api/auth/verify',
            booking: '/api/booking, /api/unbook, /api/available-times',
            admin: '/api/admin/bookings, /api/admin/users',
        },
    });
});
// Use auth routes
app.use('/api/auth', authRoutes_1.default);
// Use booking routes
app.use('/api', bookingRoutes_1.default);
// Use payment routes
app.use('/api', paymentRoutes_1.default);
// Use review routes
app.use('/api', reviewRoutes_1.default);
// Use loyalty points routes
app.use('/api', loyaltyRoutes_1.default);
// Use admin routes
app.use('/api/admin', adminRoutes_1.default);
// Use media routes
app.use('/api/media', mediaRoutes_1.default);
// Use sitemap routes (for SEO)
app.use('/', sitemap_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
    });
});
const server = app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`✅ Server listening on http://localhost:${port}`);
    console.log(`📅 Time Slot System ACTIVE - Hours: 7:00-20:00 (Overtime Allowed)`);
    // Start 24-hour reminder service
    const reminderService = new ReminderService_1.ReminderService();
    reminderService.start();
    console.log(`🔔 24-hour appointment reminder service started`);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map