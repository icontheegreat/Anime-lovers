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

import { downloadVideo } from './controllers/videoDownload';

const app = express();

app.set('trust proxy', 1);

/*
 * =========================================================
 * SECURITY
 * =========================================================
 */

app.use(helmet());

/*
 * =========================================================
 * CORS
 * =========================================================
 */

const allowedOrigins = new Set([
  env.corsOrigin,
  env.frontendUrl,
  'http://localhost:3000',
]);

app.use(
  cors({
    origin: (
      origin,
      callback
    ) => {
      /*
       * Allow requests with no Origin header.
       *
       * This includes things such as:
       * - Postman
       * - server-to-server requests
       */
      if (!origin) {
        return callback(
          null,
          true
        );
      }

      /*
       * Allow explicitly configured origins.
       */
      if (
        allowedOrigins.has(
          origin
        )
      ) {
        return callback(
          null,
          true
        );
      }

      /*
       * During development, allow localhost.
       */
      if (
        env.nodeEnv ===
        'development' &&
        /^http:\/\/localhost:\d+$/.test(
          origin
        )
      ) {
        return callback(
          null,
          true
        );
      }

      return callback(
        new Error(
          'Not allowed by CORS'
        )
      );
    },

    /*
     * Required for your authentication
     * cookie requests.
     */
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
 * =========================================================
 * BODY PARSERS
 * =========================================================
 */

app.use(
  express.json({
    limit: '1mb',
  })
);

app.use(cookieParser());

/*
 * =========================================================
 * RATE LIMITING
 * =========================================================
 */

if (
  env.nodeEnv ===
  'production'
) {
  app.use(
    rateLimit({
      windowMs:
        15 * 60 * 1000,

      max: 300,

      standardHeaders: true,

      legacyHeaders: false,
    })
  );
}

/*
 * =========================================================
 * HEALTH CHECK
 * =========================================================
 */

app.get(
  '/api/health',
  (_req, res) => {
    return res.json({
      ok: true,
    });
  }
);

/*
 * =========================================================
 * AUTH ROUTES
 * =========================================================
 */

app.use(
  '/api/auth',
  authRoutes
);

/*
 * =========================================================
 * VIDEO DOWNLOAD
 * =========================================================
 *
 * This is registered directly on the Express app so:
 *
 * GET /api/posts/:id/download
 *
 * is guaranteed to reach downloadVideo().
 *
 * It must appear before the generic post route:
 *
 * /api/posts/:slug
 *
 * =========================================================
 */

app.get(
  '/api/posts/:id/download',
  downloadVideo
);

/*
 * =========================================================
 * POST ROUTES
 * =========================================================
 */

app.use(
  '/api/posts',
  postRoutes
);

/*
 * =========================================================
 * PROFILE ROUTES
 * =========================================================
 */

app.use(
  '/api/profiles',
  profileRoutes
);

/*
 * =========================================================
 * DISCOVER ROUTES
 * =========================================================
 */

app.use(
  '/api/discover',
  discoverRoutes
);

/*
 * =========================================================
 * 404 HANDLER
 * =========================================================
 */

app.use(
  (req, res) => {
    return res.status(404).json({
      message:
        `Route not found: ${req.method} ${req.originalUrl}`,
    });
  }
);

/*
 * =========================================================
 * ERROR HANDLER
 * =========================================================
 */

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(
      err
    );

    return res.status(400).json({
      message:
        err?.message ??
        'Request failed.',
    });
  }
);

/*
 * =========================================================
 * START SERVER
 * =========================================================
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

        console.log(
          `✅ Video download API: http://localhost:${env.port}/api/posts/:id/download`
        );

        console.log(
          `✅ CORS origin: ${env.corsOrigin}`
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