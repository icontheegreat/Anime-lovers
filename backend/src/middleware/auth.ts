import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import { Author } from '../models/Author';

export interface AuthRequest extends Request {
  authorId?: string;
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Prefer Authorization: Bearer <token>
    let token: string | undefined;

    const authorization =
      req.headers.authorization;

    if (authorization?.startsWith('Bearer ')) {
      token = authorization.slice(7);
    }

    // Keep cookie authentication as a fallback.
    if (!token) {
      token = req.cookies?.token;
    }

    if (!token) {
      return res.status(401).json({
        message: 'Please log in to continue.'
      });
    }

    const payload = jwt.verify(
      token,
      env.jwtSecret
    ) as { authorId: string };

    const author = await Author.findById(
      payload.authorId
    ).select('_id');

    if (!author) {
      return res.status(401).json({
        message: 'Session is no longer valid.'
      });
    }

    req.authorId = author.id;

    next();
  } catch {
    return res.status(401).json({
      message: 'Please log in to continue.'
    });
  }
}