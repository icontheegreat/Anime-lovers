// backend/src/config/env.ts

import dotenv from 'dotenv';
import path from 'path';

/*
 * Load environment variables from the backend .env file
 * when running locally.
 *
 * On Render, environment variables are provided by Render
 * itself, so these values will still be available through
 * process.env.
 */
dotenv.config({
  path: path.resolve(
    __dirname,
    '../../.env'
  ),
});

const required = [
  'MONGODB_URI',
  'JWT_SECRET',
] as const;

for (const key of required) {
  if (!process.env[key]) {
    console.warn(
      `Missing environment variable: ${key}`
    );
  }
}

export const env = {
  /*
   * Environment
   */
  nodeEnv:
    process.env.NODE_ENV ??
    'development',

  /*
   * Server port
   */
  port: Number(
    process.env.PORT ?? 5001
  ),

  /*
   * MongoDB
   */
  mongoUri:
    process.env.MONGODB_URI ?? '',

  /*
   * Authentication
   */
  jwtSecret:
    process.env.JWT_SECRET ?? '',

  jwtExpiresIn:
    process.env.JWT_EXPIRES_IN ??
    '7d',

  /*
   * Frontend URL
   *
   * Local:
   * http://localhost:3000
   *
   * Production:
   * https://anime-lovers-two.vercel.app
   */
  frontendUrl:
    process.env.FRONTEND_URL ??
    'http://localhost:3000',

  /*
   * CORS origin
   *
   * This should be the exact frontend origin.
   */
  corsOrigin:
    process.env.CORS_ORIGIN ??
    'http://localhost:3000',

  /*
   * YouTube
   */
  youtubeApiKey:
    process.env.YOUTUBE_API_KEY ?? '',

  /*
   * Cloudinary
   */
  cloudinary: {
    cloudName:
      process.env.CLOUDINARY_CLOUD_NAME ??
      '',

    apiKey:
      process.env.CLOUDINARY_API_KEY ??
      '',

    apiSecret:
      process.env.CLOUDINARY_API_SECRET ??
      '',
  },
};