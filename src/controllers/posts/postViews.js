import container from '../../container.js';
import { getFormattedDate } from '../../services/helper.js';

export default async function updateViewCount(req, res, next) {
  const logger = container.make('logger');
  const post = container.make('models/post');
  const postViews = container.make('models/postviews');
  const userId = req.token.sub;
  try {
    const existingPostView = await postViews.findFirst(
      {
        user: {
          is: {
            id: userId,
          },
        },
        post: {
          is: {
            id: req.body.id,
          },
        },
      },
      {
        id: true,
      },
    );
    // The client should invoke this endpoint after a user
    // passed a view length threshold. If the user already
    // viewed a post just return 204 instead of an error.
    // We don't want the client to treat already viewed as
    // an error
    if (existingPostView) {
      return res.status(204).send();
    }
    // Update view count and model
    const results = await Promise.all([
      postViews.create(
        {
          user: {
            connect: {
              id: userId,
            },
          },
          post: {
            connect: {
              id: req.body.id,
            },
          },
        },
        { id: true, postId: true },
      ),
      post.increment({ id: req.body.id }, 'views', 1),
    ]);
    // send response
    return res.send({
      data: results[1],
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
