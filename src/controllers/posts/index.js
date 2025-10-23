import express from 'express';
const router = express.Router();
import container from '../../container.js';
import jwtAuth from '../../middleware/jwtAuth.js';
import validateRequest from '../../middleware/validateRequest.js';
import createPost from './createPost.js';
import createSimplePost from './createSimplePost.js';
import deletePost from './deletePost.js';
import getPostById from './getPostById.js';
import getPostByUser from './getPostByUser.js';
import getPostsByCompany from './getPostsByCompany.js';
import getPostsForCandidate from './getPostsForCandidate.js';
import getPostsForRecruiters from './getPostsForRecruiters.js';
import importJobFromUrl from './importJobFromUrl.js';
import postLikes from './postLikes.js';
import postViews from './postViews.js';
import updatePost from './updatePost.js';

const baseMiddleware = [jwtAuth(container.make('roles').user), validateRequest];
// Multer upload middleware
const uploadMediaForPost = container.make('upload')('images,videos');
// Auth and upload wrapper
const uploadWrapper = [
  jwtAuth(container.make('roles').user),
  uploadMediaForPost.single('video'),
  validateRequest,
];

// Posts endpoints
router.get('/', baseMiddleware, (req, res, next) => {
  req.token.roleSubtype === 'CANDIDATE'
    ? getPostsForCandidate(req, res, next)
    : getPostsForRecruiters(req, res, next);
});
router.post('/create', uploadWrapper, createPost);
router.post('/create-simple', baseMiddleware, createSimplePost);
router.post('/import', baseMiddleware, importJobFromUrl);
router.get('/id', baseMiddleware, getPostById);
router.get('/user', baseMiddleware, getPostByUser);
router.get('/company', baseMiddleware, getPostsByCompany);
router.delete('/', baseMiddleware, deletePost);
router.put('/views', baseMiddleware, postViews);
router.post(
  '/likes',
  [
    jwtAuth(
      container.make('roles').user,
      false,
      container.make('roles').candidate,
    ),
    validateRequest,
  ],
  postLikes,
);
router.put('/update', baseMiddleware, updatePost);

export default router;
