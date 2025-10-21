import express from 'express';
const router = express.Router();
import container from '../../container.js';
import jwtAuth from '../../middleware/jwtAuth.js';
import validateRequest from '../../middleware/validateRequest.js';
import getBaseQuestions from './getBaseQuestions.js';
import getResults from './getResults.js';
import submitAssessment from './submitAssessment.js';

router.get(
  '/questions',
  jwtAuth(container.make('roles').user),
  getBaseQuestions,
);
router.get('/results', jwtAuth(container.make('roles').user), getResults);
router.post(
  '/submit',
  [jwtAuth(container.make('roles').user), validateRequest],
  submitAssessment,
);

export default router;
