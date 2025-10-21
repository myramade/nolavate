import express from 'express';
const router = express.Router();
import container from '../../container.js';
import jwtAuth from '../../middleware/jwtAuth.js';
import validateRequest from '../../middleware/validateRequest.js';
import createCompany from './createCompany.js';
import createCompanyV2 from './createCompanyV2.js';
import deleteCompany from './deleteCompany.js';
import getCompany from './getCompany.js';
import getMyCompany from './getMyCompany.js';
import metrics from './metrics.js';
import updateCompany from './updateCompany.js';
import updateUserProfile from './updateUserProfile.js';

// Multer upload middleware
const uploadPhotos = container.make('upload')('images');
// Auth and upload wrapper
const profilePhotoWrapper = [
  jwtAuth(
    container.make('roles').user,
    false,
    container.make('roles').recruiter,
  ),
  uploadPhotos.single('image'),
  validateRequest,
];
// Auth and upload wrapper
const baseMiddleware = [
  jwtAuth(
    container.make('roles').user,
    false,
    container.make('roles').recruiter,
  ),
  validateRequest,
];
// Admin middlware
const adminMiddleware = [
  jwtAuth(container.make('roles').admin),
  validateRequest,
];

// Posts endpoints
router.get(
  '/company',
  [jwtAuth(container.make('roles').user), validateRequest],
  getCompany,
);
router.get('/company/me', baseMiddleware, getMyCompany);
router.post('/company', profilePhotoWrapper, createCompany);
router.post('/company/v2', baseMiddleware, createCompanyV2);
router.put('/company', profilePhotoWrapper, updateCompany);
router.delete('/company', adminMiddleware, deleteCompany);
router.get('/metrics', baseMiddleware, metrics);

// User profile endpoints
router.put('/profile', profilePhotoWrapper, updateUserProfile);

export default router;
