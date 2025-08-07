import dayjs from 'dayjs';
import container from '../../container.js';
import { getFormattedDate } from '../../services/helper.js';

export default async function deletePost(req, res, next) {
  const logger = container.make('logger');
  const post = container.make('models/post');
  const supabase = container.make('supabase');
  const token = req.token;
  try {
    const result = await post.delete(
      {
        id: req.body.id,
        userId: token.sub,
      },
      { id: true, video: true, thumbnail: true },
    );
    // send results
    res.send({
      data: {
        id: result.id,
        deletedTime: dayjs().toISOString(),
        message: 'Post has been deleted.',
      },
      details: {
        body: req.body,
      },
      generatedAt: getFormattedDate(),
    });
    // Delete items in storage bucket
    await Promise.all([
      supabase.storage.from('posts').remove([result.video.storagePath]),
      supabase.storage
        .from('thumbnails')
        .remove([result.thumbnail.storagePath]),
    ]);
    logger.debug(`Successfully delete uploads for post ${result.id}`);
  } catch (error) {
    logger.error(
      `Error occurred deleting post for user: ${token.sub} and post: ${req.body.id}. Reason:`,
    );
    logger.error(error.stack);
    next(
      new Error(
        'Unable to delete post. Post not found or user cannot delete post.',
      ),
    );
  }
}
