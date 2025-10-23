import { ObjectId } from 'mongodb';
import container from '../../container.js';
import { getFormattedDate } from '../../services/helper.js';
import { toObjectId, serializeDocument } from '../../utils/mongoHelpers.js';

export default async function updateViewCount(req, res, next) {
  const logger = container.make('logger');
  const post = container.make('models/post');
  const postViews = container.make('models/postviews');
  const userId = req.token.sub;
  
  try {
    // Convert IDs to ObjectId for queries
    const userObjectId = toObjectId(userId);
    const postObjectId = toObjectId(req.body.id);
    
    if (!userObjectId || !postObjectId) {
      return res.status(400).send({
        message: 'Invalid user ID or post ID'
      });
    }
    
    // Check if user already viewed this post  
    // MongoDB query - direct field comparison
    const existingPostView = await postViews.findFirst(
      {
        userId: userObjectId,
        postId: postObjectId
      },
      {
        _id: 1
      }
    );
    
    // The client should invoke this endpoint after a user
    // passed a view length threshold. If the user already
    // viewed a post just return 204 instead of an error.
    // We don't want the client to treat already viewed as
    // an error
    if (existingPostView) {
      return res.status(204).send();
    }
    
    // Update view count and create post view record
    // MongoDB: Direct field assignment, no "connect"
    const results = await Promise.all([
      postViews.create({
        userId: userObjectId,
        postId: postObjectId,
        createdTime: new Date()
      }),
      post.increment({ _id: postObjectId }, 'views', 1)
    ]);
    
    // Serialize response - convert ObjectIds to strings
    const updatedPost = serializeDocument(results[1]);
    
    // send response
    return res.send({
      data: updatedPost,
      details: {
        body: req.body,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (err) {
    logger.error(
      'Error occurred attempting to update post view count. Reason:',
    );
    logger.error(err.stack);
    next(new Error('Unable to update view count'));
  }
}
