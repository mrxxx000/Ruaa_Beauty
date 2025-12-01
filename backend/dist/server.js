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
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT ? Number(process.env.PORT) : 10000;
// Enable compression for faster responses
app.use((0, compression_1.default)());
// CORS with specific options for better performance
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    optionsSuccessStatus: 200,
}));
// Parse JSON with size limit
app.use(express_1.default.json({ limit: '10mb' }));
app.get('/', (_req, res) => {
    res.send('Hello from backend');
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
// Use review routes
app.use('/api', reviewRoutes_1.default);
// Use admin routes
app.use('/api/admin', adminRoutes_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
    });
});
const server = app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${port}`);
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