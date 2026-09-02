// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { connectDb } from './config/db';
import authRoutes from './routes/auth';
import postRoutes from './routes/posts';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());

// CORS Configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.match(/^http:\/\/localhost:\d+$/)) {
      return callback(null, true);
    }
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// DISABLE RATE LIMITING FOR DEVELOPMENT
if (process.env.NODE_ENV === 'production') {
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false
  }));
}
// In development, no rate limiting

// Routes
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// Error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(400).json({ message: err?.message ?? 'Request failed.' });
});

// Start server
connectDb()
  .then(() => {
    app.listen(env.port, '0.0.0.0', () => {
      console.log(`✅ API listening on ${env.port}`);
    });
  })
  .catch(e => {
    console.error('❌ Failed to connect to MongoDB:', e);
    process.exit(1);
  });