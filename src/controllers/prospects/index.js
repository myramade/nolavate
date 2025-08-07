import express from 'express';
const router = express.Router();
import container from '../../container.js';
import jwtAuth from '../../middleware/jwtAuth.js';
import validateRequest from '../../middleware/validateRequest.js';
import getProspects from './getProspects.js';

// Auth and upload wrapper
const baseMiddleware = [jwtAuth(container.make('roles').user), validateRequest];

// Posts endpoints
router.get('/', baseMiddleware, getProspects);

export default router;
