import { Router } from 'express';

import { discover } from '../controllers/discover';

const r = Router();

r.get('/', discover);

export default r;