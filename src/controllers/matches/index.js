import express from 'express';
const router = express.Router();
import container from '../../container.js';
import jwtAuth from '../../middleware/jwtAuth.js';
import validateRequest from '../../middleware/validateRequest.js';
import getMatchById from './getMatchById.js';
import getMatchesByPostId from './getMatchesByPostId.js';
import getMyMatches from './getMyMatches.js';

const middleware = [jwtAuth(container.make('roles').user), validateRequest];

// Matches endpoints
router.get('/', middleware, getMatchById);
router.get('/post', middleware, getMatchesByPostId);
router.get('/me', middleware, getMyMatches);

export default router;
