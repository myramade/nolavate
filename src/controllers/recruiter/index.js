import express from 'express';
const router = express.Router();
import container from '../../container.js';
import jwtAuth from '../../middleware/jwtAuth.js';
import validateRequest from '../../middleware/validateRequest.js';
import createJobOffer from './createJobOffer.js';
import deleteOffer from './deleteOffer.js';
import likeCandidate from './likeCandidate.js';

// Auth and upload wrapper
const baseMiddleware = [
  jwtAuth(
    container.make('roles').user,
    false,
    container.make('roles').recruiter,
  ),
  validateRequest,
];

// Posts endpoints
router.post('/joboffer', baseMiddleware, createJobOffer);
router.delete('/joboffer', baseMiddleware, deleteOffer);
router.post('/like/candidate', baseMiddleware, likeCandidate);

export default router;
