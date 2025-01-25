import { Router } from 'express';
import { getProfile } from '../controllers/profilesController';

const router = Router();

router.post('/', getProfile); // POST for fetching profiles

export default router;
