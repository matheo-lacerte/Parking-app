import express from 'express';
import cors from 'cors';

import healthRouter from './routes/health.js';
import Auth from './routes/auth.js';
const app = express();

// CORS (allow dev frontend by default)
app.use(cors({
  origin: process.env.ORIGIN || '*',
}));

// Common middleware
app.use(express.json());

// Routes
app.use('/health', healthRouter);
app.use('/auth', Auth);
// Fallback root
app.get('/', (req, res) => {
  res.json({ name: 'parking-app-server', version: '0.1.0' });
});

export default app;
