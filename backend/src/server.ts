import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bookingRoutes from './routes/bookingRoutes';
import authRoutes from './routes/authRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 10000;

app.use(cors());
app.use(express.json());

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
app.use('/api/auth', authRoutes);

// Use booking routes
app.use('/api', bookingRoutes);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${port}`);
});
