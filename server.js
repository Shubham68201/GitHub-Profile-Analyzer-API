import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { testConnection } from './config/db.js';
import profileRoutes from './routes/profileRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'test' ? 'tiny' : 'dev'));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'GitHub Profile Analyzer API is running',
    endpoints: {
      analyze: 'POST /api/profiles/:username/analyze',
      listAll: 'GET /api/profiles',
      getOne: 'GET /api/profiles/:username',
      remove: 'DELETE /api/profiles/:username'
    }
  });
});

app.use('/api/profiles', profileRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  start();
}

export default app;
