import express from 'express';
import cors from 'cors';

import healthRouter from './routes/health.js';
import Auth from './routes/auth.js';
import observationsRouter from './routes/observations.js';
const app = express();

// CORS (allow dev frontend by default)
// If using credentials (cookies) you must NOT use '*'. Use a specific origin.
app.use(cors({
  origin: process.env.ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight explicitly (some proxies require this)
app.options('*', cors({
  origin: process.env.ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Common middleware
app.use(express.json());

// Routes
app.use('/health', healthRouter);
app.use('/auth', Auth);

app.use('/observations', observationsRouter);

// Fallback root
app.get('/', (req, res) => {
  res.json({ name: 'parking-app-server', version: '0.1.0' });
});

export default app;
