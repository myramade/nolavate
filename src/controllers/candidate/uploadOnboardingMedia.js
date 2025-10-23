import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import ObjectID from 'bson-objectid';
import { ObjectId } from 'mongodb';
import container from '../../container.js';
import { getFormattedDate, skipUndefined } from '../../services/helper.js';

export default async function uploadMatchMedia(req, res, next) {
  const logger = container.make('logger');
  const supabaseUpload = container.make('supabase/upload');
  const supabasePublicUrl = container.make('supabase/publicurl');
  const user = container.make('models/user');
  const userId = req.token.sub;
  const transcribeAudioJobQueue =
    container.make('jobQueue')('transcribe-audio');

  try {
    const candidateFile = req.file;
    const candidateFileCategory = req.body.category;
    if (!candidateFile) {
      return res.status(400).send({
        message: 'Data not found in stream.',
      });
    }

    // Upload media to Supabase storage
    const uploadContent = async () => {
      const storagePath = `${userId}/${candidateFile.filename}`;
      const file = candidateFile.path;
      const mimeType = candidateFile.mimetype;
      await supabaseUpload(file, storagePath, 'onboarding', mimeType);
      const streamUrl = await supabasePublicUrl(storagePath, 'onboarding');
      const mediaType = candidateFile.extension;
      const downloadUrl = `${streamUrl}?download=${candidateFile.originalname}`;

      return {
        storagePath,
        streamUrl,
        downloadUrl,
        mediaType,
      };
    };
    
    // Get user data - BaseModel now handles ObjectId conversion
    const existingUserMatchMedia = await user.findById(userId);
    
    // Category should only be INFO', 'EDUCATION', 'EXPERIENCE', or 'INTERESTS'
    let existingMedia = [];
    let existingMediaCount = 0;
    if (existingUserMatchMedia?.matchMedia) {
      existingMedia = existingUserMatchMedia.matchMedia;
      existingMediaCount = existingMedia.filter(
        (media) => media.category === candidateFileCategory.toUpperCase(),
      ).length;
    }
    if (existingMediaCount === 3) {
      deleteData(container, candidateFile, userId);
      return res.status(400).send({
        message: `You can have at most 3 ${candidateFileCategory} videos.`,
      });
    }
    const uploadedContent = await uploadContent();
    const MEDIA_ID = ObjectID().toHexString();
    existingMedia.push(
      skipUndefined({
        id: MEDIA_ID,
        count: existingMediaCount + 1,
        category: candidateFileCategory.toUpperCase(),
        ...uploadedContent,
      }),
    );
    
    // Save storage data to user document - BaseModel handles ObjectId conversion
    const result = await user.updateById(
      userId,
      {
        matchMedia: existingMedia,
      }
    );
    
    // Helper to serialize ObjectId to string
    const serializeId = (value) => {
      if (!value) return null;
      if (value instanceof ObjectId) return value.toString();
      if (typeof value === 'object' && (value._id || value.id)) {
        const id = value._id || value.id;
        return id instanceof ObjectId ? id.toString() : String(id);
      }
      return String(value);
    };

    // Send response with serialized IDs
    res.send({
      data: {
        email: result.email,
        resourceUrl: uploadedContent.streamUrl,
        resourceId: serializeId(result._id || result.id),
        message: 'Successfully uploaded file.',
      },
      details: {
        body: req.body,
      },
      generatedAt: getFormattedDate(),
    });
    
    // Add transcribe job to queue
    transcribeAudioJobQueue.addJob(
      (
        filepath,
        userId,
        _logger,
        _fs,
        transcriptionModel,
        transcriptionData,
      ) => {
        try {
          _logger.info(`Transcribing audio for user: ${userId}`);
          const pythonPath =
            process.env.NODE_ENV === 'production'
              ? '/usr/bin/python3.10'
              : 'python3';
          const pythonProcess = spawn(pythonPath, [
            path.resolve(process.cwd(), 'scripts/python/transcribe.py'),
            userId,
            filepath,
          ]);
          // Use an array in the event the transcription data comes in chunks, rather than whole
          const transcriptionTexts = [];
          // Recieve transcribed text and save it to array
          pythonProcess.stdout.on('data', (data) => {
            // SAVE TRANSCRIPT TO DATABASE
            transcriptionTexts.push(data.toString('utf-8').trim());
            _logger.info(`Python Script Output: ${data}`);
          });
          // Catch any errors - the ffmpeg library throws non-zero codes when its extracting audio
          // which may appear as errors, but are not
          pythonProcess.stderr.on('data', (data) => {
            _logger.error(`Error from Python Script: ${data}`);
          });
          // Delete files on python exit (if pythong script hasn't already)
          // We have a deleteData helper function, but we want to delete the file
          // synchronously rather than added it to a queue within this queue
          pythonProcess.on('close', (code) => {
            if (_fs.existsSync(filepath)) {
              _fs.unlinkSync(filepath);
              logger.info(`File has been deleted: ${filepath}`);
            }
            // Save transcript
            try {
              if (transcriptionTexts.length > 0) {
                // Join the transcribed text array into one string
                // Update existing record, or create new record
                const transciptionArrayToText = transcriptionTexts.join(' ');
                // Send transcript to AI for summarization
                container.make('openai-summarize-transcript')(
                  transciptionArrayToText,
                  async (summarizedText) => {
                    // Create or update transcript record
                    await transcriptionModel.updateOrCreate(
                      {
                        mediaId: transcriptionData.mediaId,
                      },
                      {
                        text: transciptionArrayToText,
                        summary: summarizedText,
                        sourceSubtype: candidateFileCategory.toUpperCase(),
                      },
                      {
                        ...transcriptionData,
                        text: transciptionArrayToText,
                        summary: summarizedText,
                      },
                      {
                        id: true,
                      },
                    );
                  },
                );
              } else {
                _logger.warn('No transcription data was found.');
              }
            } catch (err) {
              _logger.error('Unable to save transcript. Reason:');
              _logger.error(err.stack);
            }
          });
          pythonProcess.on('error', (err) => {
            _logger.error(`Error attempting to run Python script: ${err}`);
          });
        } catch (err) {
          _logger.error(
            `Unable to complete transcribe job for user: ${userId}. Reason:`,
          );
          _logger.error(err);
          // deleteData(container, candidateFile, userId)
        }
      },
      [
        candidateFile.path,
        userId,
        logger,
        fs,
        container.make('models/transcription'),
        {
          userId: new ObjectId(userId),
          name: existingUserMatchMedia.name || req.token.name,
          sourceUrl: uploadedContent.streamUrl,
          sourceType: 'MATCHMEDIA',
          sourceSubtype: candidateFileCategory.toUpperCase(),
          mediaId: MEDIA_ID,
        },
      ],
      candidateFile.filename,
    );
  } catch (err) {
    logger.error(
      'Error occurred attempting to upload candidate onboarding media. Reason:',
    );
    logger.error(err.stack);
    next(err);
  }
}
