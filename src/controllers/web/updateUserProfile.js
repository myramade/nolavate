import container from '../../container.js';
import {
  getFormattedDate,
  isEmpty,
  skipUndefined,
} from '../../services/helper.js';

export default async function updateUserProfile(req, res, next) {
  const logger = container.make('logger');
  const user = container.make('models/user');
  const supabaseUploadComplete = container.make('supabase/uploadFilesComplete');
  
  try {
    // Check if user model is available
    if (!user) {
      return res.status(503).send({
        error: 'Database offline',
        message: 'Unable to update profile. The database is currently offline. Please try again later.',
      });
    }

    let photo;
    
    // Handle profile photo upload
    if (req.file) {
      logger.debug('Uploading user profile photo...');
      const storagePath = `${req.token.sub}/profile/${req.file.filename}`;
      const file = req.file.path;
      const mimeType = req.file.mimetype;
      const mediaType = req.file.extension;
      
      const { streamUrls, downloadUrls } = await supabaseUploadComplete(
        [file],
        [storagePath],
        'users',
        mimeType,
        [req.file.originalname],
      );
      
      photo = {
        storagePath,
        streamUrl: streamUrls[0],
        downloadUrl: downloadUrls[0],
        mediaType,
        category: 'PROFILE_PHOTO',
        count: 1,
      };
    }

    // Build update body
    const updateBody = skipUndefined(
      {
        photo,
        name: req.body.name,
        // Add other profile fields as needed
      },
      true,
    );

    if (isEmpty(updateBody)) {
      return res.status(400).send({
        message: 'No data was provided for update.',
      });
    }

    // Update user profile
    const result = await user.updateById(
      req.token.sub,
      updateBody,
      {
        id: true,
        name: true,
        email: true,
        photo: {
          select: {
            streamUrl: true,
          },
        },
        role: true,
        updatedTime: true,
      },
    );

    // send response
    res.send({
      data: result,
      details: {
        body: req.body,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (err) {
    logger.error('Unable to update user profile. Reason:');
    logger.error(err.stack);
    next(new Error('Unable to complete request.'));
  }
}
