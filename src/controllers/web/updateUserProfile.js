import container from '../../container.js';
import { ObjectId } from 'mongodb';
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
    let video;
    
    // Handle file uploads (photo and/or video)
    if (req.files) {
      // Handle profile photo upload
      if (req.files.image && req.files.image[0]) {
        logger.debug('Uploading user profile photo...');
        const imageFile = req.files.image[0];
        const storagePath = `${req.token.sub}/profile/${imageFile.filename}`;
        const file = imageFile.path;
        const mimeType = imageFile.mimetype;
        const mediaType = imageFile.extension;
        
        const { streamUrls, downloadUrls } = await supabaseUploadComplete(
          [file],
          [storagePath],
          'users',
          mimeType,
          [imageFile.originalname],
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

      // Handle profile video upload
      if (req.files.video && req.files.video[0]) {
        logger.debug('Uploading user profile video...');
        const videoFile = req.files.video[0];
        const storagePath = `${req.token.sub}/profile/${videoFile.filename}`;
        const file = videoFile.path;
        const mimeType = videoFile.mimetype;
        const mediaType = videoFile.extension;
        
        const { streamUrls, downloadUrls } = await supabaseUploadComplete(
          [file],
          [storagePath],
          'users',
          mimeType,
          [videoFile.originalname],
        );
        
        video = {
          storagePath,
          streamUrl: streamUrls[0],
          downloadUrl: downloadUrls[0],
          mediaType,
          category: 'PROFILE_VIDEO',
          count: 1,
        };
      }
    }

    // Build update body
    const updateBody = skipUndefined(
      {
        photo,
        video,
        name: req.body.name,
      },
      true,
    );

    if (isEmpty(updateBody)) {
      return res.status(400).send({
        message: 'No data was provided for update.',
      });
    }

    // Update user profile - BaseModel now handles ObjectId conversion
    const result = await user.updateById(
      req.token.sub,
      updateBody
    );

    // Helper to convert ObjectId to string
    const serializeId = (value) => {
      if (!value) return null;
      if (value instanceof ObjectId) return value.toString();
      if (typeof value === 'object' && (value._id || value.id)) {
        const id = value._id || value.id;
        return id instanceof ObjectId ? id.toString() : String(id);
      }
      return String(value);
    };

    // Format response with simplified structure for MongoDB - convert ObjectIds to strings
    const responseData = {
      id: serializeId(result._id),
      name: result.name,
      email: result.email,
      photo: result.photo || null,
      video: result.video || null,
      role: result.role,
      updatedTime: result.updatedTime || new Date(),
    };

    // send response
    res.send({
      data: responseData,
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
