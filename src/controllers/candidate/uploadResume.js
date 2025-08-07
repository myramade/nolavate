import fs from 'node:fs';
import ObjectID from 'bson-objectid';
import { parseOfficeAsync } from 'officeparser';
import container from '../../container.js';
import { getFormattedDate, skipUndefined } from '../../services/helper.js';

async function saveUserResumeData(resumeData, userId) {
  const parsedData = JSON.parse(resumeData);
  const user = container.make('models/user');
  const logger = container.make('logger');
  const saveData = skipUndefined({
    name: parsedData.name,
    phone: parsedData.phone
      ? parsedData.phone.replaceAll(/[()-]/g, '')
      : undefined,
    industry: parsedData.industry,
    resumeData: {
      about: parsedData.aboutMe,
      industry: parsedData.industry,
      title: parsedData.title,
      skills: parsedData.skills,
      experienceLevel: parsedData.experienceLevel,
      yearsOfExperience: parsedData.yearsOfExperience
        ? Number.parseInt(parsedData.yearsOfExperience)
        : undefined,
      formerEmployers: parsedData.formerEmployers,
      currentEmployer: parsedData.currentEmployer,
      education: parsedData.education,
    },
  });
  await user.updateById(userId, saveData, { id: true });
  logger.info('Updated user document with resume data.');
}

export default async function uploadResume(req, res, next) {
  const logger = container.make('logger');
  const supabaseUploadComplete = container.make('supabase/uploadFilesComplete');
  const user = container.make('models/user');
  const jobQueue = container.make('jobQueue')('post-resume-upload');
  const userId = req.token.sub;
  try {
    const candidateResume = req.file;
    if (!candidateResume) {
      return res.status(400).send({
        message: 'Data not found in stream.',
      });
    }
    // Upload resume to Supabase storage
    const storagePath = `${req.token.sub}/${candidateResume.filename}`;
    const file = candidateResume.path;
    const mimeType = candidateResume.mimetype;
    const mediaType = candidateResume.extension;
    const { downloadUrls } = await supabaseUploadComplete(
      [file],
      [storagePath],
      'resumes',
      mimeType,
      [candidateResume.originalname],
    );
    // Save resume url to user document
    const result = await user.updateById(
      req.token.sub,
      skipUndefined({
        resume: {
          id: ObjectID().toHexString(),
          category: 'RESUME',
          storagePath,
          streamUrl: downloadUrls[0],
          downloadUrl: downloadUrls[0],
          mediaType,
        },
      }),
      { email: true, resume: true },
    );
    // Send response
    res.send({
      data: {
        email: result.email,
        resourceUrl: result.resume.downloadUrl,
        resourceId: result.id,
        message: 'Successfully uploaded resume',
      },
      details: {
        body: null,
      },
      generatedAt: getFormattedDate(),
    });
    // Parse the resume and grab useful information from it
    jobQueue.addJob(
      (filepath, userId, _logger, _fs, resumeParser) => {
        try {
          _logger.info(`Parsing resume for user: ${userId}`);
          parseOfficeAsync(filepath, {
            ignoreNotes: true,
          })
            .then(async (data) => {
              const resumeData = await resumeParser(data);
              return resumeData;
            })
            .then((resumeData) => saveUserResumeData(resumeData, userId))
            .catch((err) => {
              _logger.error(
                `Unable to parse resume for user: ${userId}. Reason:`,
              );
              logger.error(err.stack);
            })
            .then(() => {
              _fs.unlinkSync(filepath);
              logger.info(`File has been deleted: ${filepath}`);
            });
        } catch (err) {
          logger.error(`Unable to complete resume parse job for user: ${user}`);
        }
      },
      [
        candidateResume.path,
        userId,
        logger,
        fs,
        container.make('openai-parse-resume'),
      ],
      candidateResume.filename,
    );
  } catch (err) {
    logger.error(
      'Error occurred attempting to upload candidate resume. Reason:',
    );
    logger.error(err.stack);
    next(err);
    // Add files to delete photos job queue
    deleteData(container, req.file, userId);
  }
}
