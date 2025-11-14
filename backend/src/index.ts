import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 5000;

app.use(cors());

app.get('/', (_req, res) => {
  res.send('Hello from backend');
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${port}`);
});
