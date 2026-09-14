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
  myPosts,
  searchPosts,
  savePost,
  unsavePost,
  getSavedPosts
} from '../controllers/posts';


const r = Router();

r.get('/', listPosts);

r.get('/mine', requireAuth, myPosts);

r.get('/search', searchPosts);

r.get('/saved', requireAuth, getSavedPosts);

r.post('/:id/save', requireAuth, savePost);

r.delete('/:id/save', requireAuth, unsavePost);

r.get('/:id/download', downloadVideo);

r.get('/:slug', getPost);

r.post(
  '/',
  requireAuth,
  upload.fields([
    {
      name: 'media',
      maxCount: 1
    },
    {
      name: 'threadMedia',
      maxCount: 10
    }
  ]),
  createPost
);

r.put(
  '/:id',
  requireAuth,
  upload.fields([
    {
      name: 'media',
      maxCount: 1
    },
    {
      name: 'threadMedia',
      maxCount: 10
    }
  ]),
  updatePost
);

r.delete(
  '/:id',
  requireAuth,
  deletePost
);

export default r;