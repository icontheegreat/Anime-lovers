import {Router} from 'express'; import {upload} from '../middleware/upload'; import {requireAuth} from '../middleware/auth'; import {register,loginHandler,logout,me} from '../controllers/auth';
const r=Router();r.post('/register',upload.single('profileImage'),register);r.post('/login',loginHandler);r.post('/logout',logout);r.get('/me',requireAuth,me);export default r;
