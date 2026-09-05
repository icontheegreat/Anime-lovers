import { Router } from 'express';
import { upload } from '../middleware/upload';
import { requireAuth } from '../middleware/auth';
import { downloadVideo } from '../controllers/videoDownload';
import {
  createPost,
  listPosts,
  getPost,
  updatePost,
  deletePost,
  myPosts
} from '../controllers/posts';


const r = Router();

r.get('/', listPosts);

r.get('/mine', requireAuth, myPosts);

r.get(
  '/:id/download',
  downloadVideo
);


r.get('/:slug', getPost);


r.post(
  '/',
  requireAuth,
  upload.fields([
    { name: 'media', maxCount: 1 },
    { name: 'threadMedia0', maxCount: 1 },
    { name: 'threadMedia1', maxCount: 1 },
    { name: 'threadMedia2', maxCount: 1 },
    { name: 'threadMedia3', maxCount: 1 },
    { name: 'threadMedia4', maxCount: 1 }
  ]),
  createPost
);

r.put(
  '/:id',
  requireAuth,
  upload.fields([
    { name: 'media', maxCount: 1 },
    { name: 'threadMedia0', maxCount: 1 },
    { name: 'threadMedia1', maxCount: 1 },
    { name: 'threadMedia2', maxCount: 1 },
    { name: 'threadMedia3', maxCount: 1 },
    { name: 'threadMedia4', maxCount: 1 }
  ]),
  updatePost
);

r.delete(
  '/:id',
  requireAuth,
  deletePost
);

export default r;