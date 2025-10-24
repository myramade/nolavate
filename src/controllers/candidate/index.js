import express from 'express';
const router = express.Router();
import container from '../../container.js';
import jwtAuth from '../../middleware/jwtAuth.js';
import validateRequest from '../../middleware/validateRequest.js';
import { validateFileUpload } from '../../middleware/fileUploadValidation.js';
import getOnboardingMedia from './getOnboardingMedia.js';
import respondToJobOffer from './respondToJobOffer.js';
import uploadOnboardingMedia from './uploadOnboardingMedia.js';
import uploadResume from './uploadResume.js';

// Multer upload resume
const resumeUploader = container.make('upload')('docs');
const matchMediaUploader = container.make('upload')('images,videos');
// Auth and upload wrapper
const uploadResumeWrapper = [
  jwtAuth(container.make('roles').user),
  resumeUploader.single('resume'),
  validateFileUpload('resume'),
];
const uploadMatchMediaWrapper = [
  jwtAuth(
    container.make('roles').user,
    false,
    container.make('roles').candidate,
  ),
  matchMediaUploader.single('media'),
  validateFileUpload('media'),
  validateRequest,
];
const baseMiddleware = [
  jwtAuth(
    container.make('roles').user,
    false,
    container.make('roles').candidate,
  ),
];
const jobOfferMiddleware = [
  jwtAuth(
    container.make('roles').user,
    false,
    container.make('roles').candidate,
  ),
  validateRequest,
];

// Candidate endpoints
router.post('/upload/resume', uploadResumeWrapper, uploadResume);
router.post(
  '/upload/onboarding',
  uploadMatchMediaWrapper,
  uploadOnboardingMedia,
);
router.get('/onboarding', baseMiddleware, getOnboardingMedia);
router.put('/joboffer', jobOfferMiddleware, respondToJobOffer);

export default router;
