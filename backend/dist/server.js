"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const bookingRoutes_1 = __importDefault(require("./routes/bookingRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT ? Number(process.env.PORT) : 10000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
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
        },
    });
});
// Use auth routes
app.use('/api/auth', authRoutes_1.default);
// Use booking routes
app.use('/api', bookingRoutes_1.default);
app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${port}`);
});
//# sourceMappingURL=server.js.map