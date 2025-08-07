import container from '../../container.js';
import {
  createUserAvatarUsingName,
  getFormattedDate,
  shuffleArray,
  skipUndefined,
} from '../../services/helper.js';

const createProfileSummary = (resumeData) => {
  if (!resumeData) {
    return null;
  }
  if (resumeData.summary) {
    return resumeData.summary;
  }
  return Object.values(resumeData).join(' ');
};

// For recruiters
export default async function getPostsForRecruiters(req, res, next) {
  const logger = container.make('logger');
  const user = container.make('models/user');
  const transcription = container.make('models/transcriptions');
  const jobSkill = container.make('models/jobskill');
  try {
    // Pagination
    const offset = req.query.page * req.query.pageSize;
    const limit = req.query.pageSize;
    // Get user personality traits
    // const userData = await user.findById(req.token.sub, { id: true, personality: true })
    let jobSkillIdsToNames;
    if (req.body.skills) {
      jobSkillIdsToNames = await container.make('models/jobskill').findManyOr(
        req.body.skills.map((skillId) => {
          return {
            id: skillId,
          };
        }),
        { name: true },
      );
      if (!jobSkillIdsToNames && jobSkillIdsToNames.length === 0) {
        return res.status(400).send({
          message: 'Job skill IDs provided are not valid.',
        });
      }
      jobSkillIdsToNames = jobSkillIdsToNames.map((skill) => skill.name);
    }
    // Build prisma queries
    const prismaQuery = skipUndefined({
      // personality: {
      //   equals: userData.personality
      // },
      recruiterMatches: {
        none: {
          recruiterId: {
            equals: req.token.sub,
          },
          accepted: false,
        },
      },
      skills: req.body.skills
        ? {
            hasSome: jobSkillIdsToNames,
          }
        : undefined,
      matchMedia: {
        isEmpty: false,
      },
    });
    // Get results
    const results = await user.findMany(
      prismaQuery,
      {
        id: true,
        email: true,
        phone: true,
        phoneCountryCode: true,
        name: true,
        photo: {
          select: {
            streamUrl: true,
          },
        },
        matchMedia: {
          select: {
            id: true,
            streamUrl: true,
            category: true,
          },
        },
        roleSubtype: true,
        employmentStatus: true,
        employmentTitle: true,
        personality: {
          select: {
            title: true,
            detail: true,
          },
        },
        resumeData: true,
        industry: true,
        skills: true,
      },
      limit,
      offset,
      'createdTime',
      'desc',
      null,
      null,
      {
        id: {
          not: req.token.sub,
        },
        roleSubtype: {
          not: 'RECRUITER',
        },
        role: {
          not: 'TESTER',
        },
      },
    );
    // Get list of job skill
    const jobSkills = await jobSkill.findMany(
      {
        useCount: {
          gt: 0,
        },
      },
      {
        id: true,
        name: true,
        order: true,
        useCount: true,
      },
      limit,
      offset,
      'useCount',
      'desc',
    );
    // Get match media transcriptions
    const transcripts = await transcription.findManyOr(
      results.map((user) => {
        return {
          user: {
            is: {
              id: user.id,
            },
          },
        };
      }),
      {
        user: {
          select: {
            id: true,
          },
        },
        text: true,
        mediaId: true,
      },
    );
    // Return results by postType
    // JOB will never be populated for this response, but we
    // need to make its compatible with the getPosts (for candidates) endpoint
    const finalResult = {
      SOCIAL: [],
      jobSkills,
    };
    for (let i = 0; i < results.length; i++) {
      // Set user photo as thumbnail
      results[i].thumbnail = results[i].photo
        ? results[i].photo.streamUrl
        : createUserAvatarUsingName(results[i].name).streamUrl;
      if (results[i].photo) {
        results[i].photo = results[i].photo.streamUrl;
      }
      // Format phone number
      user.phone = `${user.phoneCountryCode || ''}${user.phone}`;
      user.phoneCountryCode = undefined;
      // Get match media transcripts - this is really expensive
      results[i].matchMedia.forEach((media) => {
        for (let j = 0; j < transcripts.length; j++) {
          if (transcripts[j].user.id === results[i].id) {
            if (media.id === transcripts[j].mediaId) {
              media.text = transcripts[j].text;
            }
          }
        }
      });
      // Update resume data object
      results[i].profileSummary = createProfileSummary(results[i].resumeData);
      results[i].resumeData = undefined;
      // Show recruiter the candidates first name if they are not a match
      results[i].name = results[i].name.split(' ')[0];
      // Create final result
      finalResult.SOCIAL.push(results[i]);
    }
    // Shuffle array in place
    if (req.query.shuffle) {
      shuffleArray(finalResult.SOCIAL);
    }
    // send results
    res.send({
      data: finalResult,
      details: {
        ...req.query,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (error) {
    logger.error(
      'Error occurred fetching posts (users) for recruiters. Reason:',
    );
    logger.error(error.stack);
    next(error);
  }
}
