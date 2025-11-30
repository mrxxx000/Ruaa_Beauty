import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bookingRoutes from './routes/bookingRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 10000;

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Hello from backend');
});

// Use booking routes
app.use('/api', bookingRoutes);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${port}`);
});
