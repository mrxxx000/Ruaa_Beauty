import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import bookingRoutes from './routes/bookingRoutes';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import reviewRoutes from './routes/reviewRoutes';
import sitemapRouter from './sitemap';

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 10000;

// Enable compression for faster responses
app.use(compression());

// CORS with specific options for better performance
app.use(cors({
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
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  optionsSuccessStatus: 200,
}));

// Parse JSON with size limit
app.use(express.json({ limit: '10mb' }));

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
app.use('/api/auth', authRoutes);

// Use booking routes
app.use('/api', bookingRoutes);

// Use review routes
app.use('/api', reviewRoutes);

// Use admin routes
app.use('/api/admin', adminRoutes);

// Use sitemap routes (for SEO)
app.use('/', sitemapRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
