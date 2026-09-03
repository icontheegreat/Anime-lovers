import { Router } from 'express';

import { requireAuth } from '../middleware/auth';
import { upload } from '../middleware/upload';

import {
  getProfile,
  updateProfile,
} from '../controllers/profiles';

const r = Router();

r.get('/:authorId', getProfile);

r.put(
  '/me',
  requireAuth,
  upload.single('profileImage'),
  updateProfile
);

export default r;