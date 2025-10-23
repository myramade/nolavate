import container from '../../container.js';
import {
  createUserAvatarUsingName,
  getFormattedDate,
} from '../../services/helper.js';
import { ObjectId } from 'mongodb';

export default async function getPostsByUserId(req, res, next) {
  const logger = container.make('logger');
  const post = container.make('models/post');
  try {
    // Check if database is connected
    if (!post) {
      return res.status(503).send({
        error: 'Database offline',
        message: 'Unable to retrieve job posts. The database is currently offline. Please try again later.',
      });
    }
    
    // Pagination
    const page = parseInt(req.query.page) || 0;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = page * pageSize;
    const limit = pageSize;
    
    // Use current user's ID from token if userId not provided - convert to ObjectId
    const userId = req.query.userId || req.token.sub;
    
    const query = {
      userId: new ObjectId(userId),
    };
    if (req.query.postType) {
      query.postType = req.query.postType.toUpperCase();
    }
    
    let results = [];
    try {
      // Simplified MongoDB query without nested Prisma syntax
      results = await post.findMany(
        query,
        {}, // No complex projection for now
        limit,
        offset,
        'createdTime',
        'desc'
      );
    } catch (dbError) {
      logger.error('Post query failed:', dbError.message);
      return res.status(503).send({
        error: 'Database query failed',
        message: 'Unable to retrieve job posts. Please try again later.',
      });
    }
    
    // Send results with basic formatting
    return res.send({
      data: results,
      details: {
        page,
        pageSize,
        query: req.query,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (error) {
    logger.error('Error occurred fetching posts. Reason:');
    logger.error(error.stack);
    next(error);
  }
}
