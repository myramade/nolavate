import express from 'express';
const router = express.Router();
import container from '../../container.js';
import jwtAuth from '../../middleware/jwtAuth.js';
import validateRequest from '../../middleware/validateRequest.js';
import getMyJobOffers from './getMyJobOffers.js';

// Auth and upload wrapper
const baseMiddleware = [jwtAuth(container.make('roles').user), validateRequest];

// Job Offer endpoints
router.get('/', baseMiddleware, getMyJobOffers);

export default router;
