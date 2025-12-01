import express from 'express';
import cors from 'cors';

import healthRouter from './routes/health.js';
import Auth from './routes/auth.js';
import observationsRouter from './routes/observations.js';
const app = express();

// CORS configuration: accept any origin for simplicity (local + vercel)
// For bearer tokens only, we don't need credentials: keep it false to avoid strict CORS
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without origin (like curl, server-side) and any browser origin
    callback(null, true);
  },
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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
