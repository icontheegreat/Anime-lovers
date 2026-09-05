import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import { connectDb } from './config/db';

import authRoutes from './routes/auth';
import postRoutes from './routes/posts';
import profileRoutes from './routes/profiles';
import discoverRoutes from './routes/discover';

const app = express();

app.set('trust proxy', 1);

/*
 * SECURITY
 */
app.use(helmet());

/*
 * CORS
 */
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin
      if (!origin) {
        return callback(null, true);
      }

      // Allow localhost during development
      if (/^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }

      // Allow the configured frontend in production
      if (origin === env.corsOrigin) {
        return callback(null, true);
      }

      // Allow all origins in development
      if (env.nodeEnv === 'development') {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },

    credentials: true,

    methods: [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'OPTIONS',
      'PATCH',
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
    ],
  })
);

/*
 * BODY PARSERS
 */
app.use(
  express.json({
    limit: '1mb',
  })
);

app.use(cookieParser());


/*
 * RATE LIMITING
 *
 * Disabled during development.
 */
if (process.env.NODE_ENV === 'production') {
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );
}

/*
 * HEALTH CHECK
 */
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
  });
});

/*
 * API ROUTES
 *
 * IMPORTANT:
 *
 * /api/auth
 * /api/posts
 * /api/profiles
 */
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/discover', discoverRoutes);

/*
 * 404 HANDLER
 *
 * This makes it much easier to see which endpoint
 * was actually not found.
 */
app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/*
 * ERROR HANDLER
 */
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);

    res.status(400).json({
      message:
        err?.message ??
        'Request failed.',
    });
  }
);

/*
 * START SERVER
 */
connectDb()
  .then(() => {
    app.listen(
      env.port,
      '0.0.0.0',
      () => {
        console.log(
          `✅ API listening on ${env.port}`
        );

        console.log(
          `✅ Profiles API: http://localhost:${env.port}/api/profiles`
        );
      }
    );
  })
  .catch((e) => {
    console.error(
      '❌ Failed to connect to MongoDB:',
      e
    );

    process.exit(1);
  });