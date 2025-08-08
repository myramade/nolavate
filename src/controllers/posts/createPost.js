import { spawn } from 'node:child_process';
import fs from 'node:fs';
import ObjectID from 'bson-objectid';
import container from '../../container.js';
import {
  createUserAvatarUsingName,
  deleteData,
  getFormattedDate,
  isHexId,
  skipUndefined,
  toTitleCase,
} from '../../services/helper.js';

const handleSkills = async (req) => {
  let requiredSkills = [];
  let optionalSkills = [];
  // New skills to be created - these should be strings in title case
  let requiredNonHexIds = [];
  let optionalNonHexIds = [];
  let nonHexIds = [];
  let allSkills = [];
  if (req.body.requiredSkills) {
    requiredSkills = req.body.requiredSkills.split(',');
    if (requiredSkills.length > 4) {
      return {
        skills: null,
        sError: 'Required skills cannot exceed 4.',
      };
    }
    allSkills = allSkills.concat(
      requiredSkills.filter((skill) => isHexId(skill)),
    );
    requiredNonHexIds = requiredNonHexIds.concat(
      requiredSkills.filter((skill) => !isHexId(skill)),
    );
  }
  if (req.body.optionalSkills) {
    optionalSkills = req.body.optionalSkills.split(',');
    if (optionalSkills.length > 4) {
      return {
        skills: null,
        sError: 'Optional skills cannot exceed 4.',
      };
    }
    allSkills = allSkills.concat(
      optionalSkills.filter((skill) => isHexId(skill)),
    );
    optionalNonHexIds = optionalNonHexIds.concat(
      optionalSkills.filter((skill) => !isHexId(skill)),
    );
  }
  if (requiredSkills.length > 0 || optionalSkills.length > 0) {
    allSkills = Array.from(new Set(allSkills));
    nonHexIds = Array.from(
      new Set(requiredNonHexIds.concat(optionalNonHexIds)),
    );
    const jobSkillIdsToNames = await container
      .make('models/jobskill')
      .findManyOr(
        allSkills
          .map((skillId) => {
            return {
              id: skillId,
            };
          })
          .concat(
            nonHexIds.map((nonHexId) => {
              return {
                name: nonHexId,
              };
            }),
          ),
        { id: true, name: true },
      );
    if (jobSkillIdsToNames.length === 0 && nonHexIds.length === 0) {
      return {
        skills: null,
        sError: 'Job skill IDs provided are not valid.',
      };
    }
    // Create new skills
    if (
      nonHexIds.length > 0 &&
      jobSkillIdsToNames.length === allSkills.length
    ) {
      const newRecords = [];
      const mostRecentExistingJobSkill = await container
        .make('models/jobskill')
        .findFirst({}, { order: true }, null, 'order', 'desc', 1);
      let existingJobSkillsCount = mostRecentExistingJobSkill.order + 1;
      for (const nonHexId of nonHexIds) {
        newRecords.push({
          order: existingJobSkillsCount,
          name: toTitleCase(nonHexId),
          original: false,
          createdBy: req.token.sub,
        });
        existingJobSkillsCount += 1;
      }
      await container.make('models/jobskill').createMany(newRecords);
      // Append newly created Job Skills
      // requiredSkills = requiredSkills.concat(requiredNonHexIds)
      // optionalSkills = optionalSkills.concat(optionalNonHexIds)
    }
    // Sort required and optional skills
    for (const jobSkill of jobSkillIdsToNames) {
      if (requiredSkills.includes(jobSkill.id)) {
        requiredSkills.splice(
          requiredSkills.indexOf(jobSkill.id),
          1,
          jobSkill.name,
        );
      }
      if (optionalSkills.includes(jobSkill.id)) {
        optionalSkills.splice(
          optionalSkills.indexOf(jobSkill.id),
          1,
          jobSkill.name,
        );
      }
    }
  }
  return {
    skills: {
      requiredSkills,
      optionalSkills,
    },
    sError: null,
  };
};

const handlePersonalities = async (req, postType) => {
  if (postType !== 'JOB') {
    return {
      personalities: [],
      pError:
        'Personality Types can only be set for JOB posts. This is a SOCIAL post.',
    };
  }
  if (
    !req.body.personalityPreference ||
    req.body.personalityPreference.length === 0
  ) {
    return {
      personalities: [],
      pError: null,
    };
  }
  // Convert Personality Type IDs to Titles
  const personalityTypeIdsToNames = await container
    .make('models/personality')
    .findManyOr(
      req.body.personalityPreference.map((personaltyId) => {
        return {
          id: personaltyId,
        };
      }),
      { id: true, title: true },
    );
  if (personalityTypeIdsToNames.length === 0) {
    return {
      personalities: [],
      pError: 'Personality Type IDs provided are not valid.',
    };
  }
  return {
    personalities: personalityTypeIdsToNames,
    pError: null,
  };
};

export default async function createPost(req, res, next) {
  const logger = container.make('logger');
  const post = container.make('models/post');
  const user = container.make('models/user');
  const supabaseUploadComplete = container.make('supabase/uploadFilesComplete');
  try {
    const postType = req.body.postType.toUpperCase();
    if (!req.file) {
      throw new Error('Post must have one video.');
    }
    const userVideo = req.file;
    // Get user document
    const userDocument = await user.findById(req.token.sub, {
      id: true,
      name: true,
      employer: {
        select: {
          id: true,
          name: true,
        },
      },
      photo: {
        select: {
          streamUrl: true,
        },
      },
    });
    // Ensure only recruiters can create JOB posts
    if (!userDocument.employer && req.token.roleSubtype === 'RECRUITER') {
      return res.status(400).send({
        message:
          "Only recruiters can create JOB posts. If you're a recruiter ensure your account is associated with a company.",
      });
    }
    const videoData = {};
    // Upload media to Supabase storage
    videoData.id = ObjectID().toHexString();
    const storagePath = `${req.token.sub}/${userVideo.filename}`;
    const file = userVideo.path;
    const mimeType = userVideo.mimetype;
    const mediaType = userVideo.extension;
    const { streamUrls, downloadUrls } = await supabaseUploadComplete(
      [file],
      [storagePath],
      'posts',
      mimeType,
      [userVideo.originalname],
    );
    videoData.storagePath = storagePath;
    videoData.mediaType = mediaType;
    videoData.streamUrl = streamUrls[0];
    videoData.downloadUrl = downloadUrls[0];
    videoData.category = 'POST';
    // Handle required and optional skills
    const { skills, sError } = await handleSkills(req);
    if (sError) {
      return res.status(400).send(sError);
    }
    // Handle personality types
    const { personalities, pError } = await handlePersonalities(req, postType);
    if (pError) {
      return res.status(400).send(pError);
    }

    // Create post document
    // Thumbnail of the post (default this will be the avatar of the user creating post)
    const temporaryThumbnail = userDocument.photo
      ? userDocument.photo.streamUrl
      : createUserAvatarUsingName(userDocument.name).streamUrl;
    const result = await post.create(
      skipUndefined(
        {
          title: req.body.title,
          description: req.body.description,
          user: {
            connect: {
              id: req.token.sub,
            },
          },
          postType,
          company: userDocument.employer
            ? {
                connect: {
                  id: userDocument.employer.id,
                },
              }
            : undefined,
          personalityPreference: {
            connect: personalities.map((personality) => {
              return {
                id: personality.id,
              };
            }),
          },
          category: req.body.category,
          industryType: req.body.industryType,
          functionalArea: req.body.functionalArea,
          activeHiring: true && req.body.activeHiring !== 'false',
          location: req.body.location,
          positionType: req.body.positionType
            ? req.body.positionType.toUpperCase()
            : null,
          positionTitle: req.body.positionTitle,
          experience: req.body.experience,
          employmentType: req.body.employmentType
            ? req.body.employmentType.toUpperCase()
            : undefined,
          compensation: req.body.compensation,
          requiredSkills: skills.requiredSkills,
          optionalSkills: skills.optionalSkills,
          video: Object.keys(videoData).length > 0 ? videoData : undefined,
          thumbnail: {
            id: ObjectID().toHexString(),
            storagePath: temporaryThumbnail,
            streamUrl: temporaryThumbnail,
            downloadUrl: temporaryThumbnail,
            mediaType: 'JPEG',
            category: 'THUMBNAIL',
            count: 1,
          },
        },
        true,
      ),
      {
        id: true,
        title: true,
        description: true,
        postType: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        personalityPreference: {
          select: {
            title: true,
            detail: true,
          },
        },
        category: true,
        industryType: true,
        functionalArea: true,
        activeHiring: true,
        location: true,
        positionType: true,
        positionTitle: true,
        experience: true,
        employmentType: true,
        compensation: true,
        requiredSkills: true,
        optionalSkills: true,
        video: {
          select: {
            streamUrl: true,
          },
        },
        thumbnail: {
          select: {
            streamUrl: true,
          },
        },
        createdTime: true,
      },
    );
    // Set video field as url instead of nesting url
    result.video = result.video ? result.video.streamUrl : null;
    // send results
    res.send({
      data: skipUndefined(result, true),
      details: {
        body: req.body,
      },
      generatedAt: getFormattedDate(),
    });
    // Generate personalites for JOB posts
    if (postType === 'JOB' && personalities.length === 0) {
      container
        .make('perplexity-personality-job')(req.body.description)
        .then(async (response) => {
          const personalityTypeNamesToIds = await container
            .make('models/personality')
            .findManyOr(
              response.personalities.map((personalityName) => {
                return {
                  title: personalityName,
                };
              }),
              { id: true, title: true },
            );
          // Update JOB post
          await post.updateById(
            result.id,
            {
              personalityPreference: {
                connect: personalityTypeNamesToIds.map((p) => {
                  return {
                    id: p.id,
                  };
                }),
              },
            },
            { id: true },
          );
        })
        .catch((err) => {
          logger.error(
            'Error occurred attempting to get personality types based on job description. Reason:',
          );
          logger.error(err);
        });
    }
    // Create thumbnail
    // Create thumbnail from video
    const thumbnailFilePath = userVideo.path.replace(
      userVideo.originalname,
      `thumbnail_${userVideo.originalname}.jpg`,
    );
    // ffmpeg -i input.mp4 -vf "thumbnail=500,scale=640:-1:flags=lanczos" -q:v 2 -frames:v 1 -an best_frame_highres.jpg
    logger.info(
      `Creating video thumbnail. Saving to path: ${thumbnailFilePath}...`,
    );
    const ffmpegArgs = [
      '-i',
      userVideo.path,
      '-vf',
      'thumbnail=300,select=eq(n\\,0)',
      '-frames:v',
      '1',
      '-an',
      thumbnailFilePath,
    ];
    logger.info(`Running ffmpeg command: ffmpeg ${ffmpegArgs.join(' ')}`);
    const ffmpegVideoToPng = spawn('ffmpeg', ffmpegArgs);
    // Catch any errors - the ffmpeg library throws non-zero codes when its extracting audio
    // which may appear as errors, but are not
    ffmpegVideoToPng.on('error', (err) => {
      logger.error(`ffmpeg error: ${err}`);
    });
    ffmpegVideoToPng.on('close', async (code) => {
      // Upload thumbnail to Supabase storage
      const storagePath = `${req.token.sub}/thumbnail_${userVideo.originalname}.jpg`;
      const { streamUrls, downloadUrls } = await supabaseUploadComplete(
        [thumbnailFilePath],
        [storagePath],
        'thumbnails',
        'image/jpeg',
        [userVideo.originalname],
      );
      await post.updateById(
        result.id,
        {
          thumbnail: {
            id: ObjectID().toHexString(),
            storagePath,
            streamUrl: streamUrls[0],
            downloadUrl: downloadUrls[0],
            mediaType: 'image/jpeg',
            category: 'THUMBNAIL',
            count: 1,
          },
        },
        { id: true },
      );
      logger.info('Thumbnail created and saved to database.');
      // Add file to delete photos job queue
      deleteData(container, userVideo, req.token.sub);
      fs.unlinkSync(thumbnailFilePath);
    });
  } catch (error) {
    logger.error('Error occurred creating post. Reason:');
    logger.error(error.stack);
    next(error);
    // Add file to delete photos job queue
    deleteData(container, req.file, req.token.sub);
  }
}