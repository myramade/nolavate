import container from '../../container.js';
import {
  createUserAvatarUsingName,
  getFormattedDate,
  shuffleArray,
  skipUndefined,
} from '../../services/helper.js';

// For candidates
export default async function getPosts(req, res, next) {
  const logger = container.make('logger');
  const post = container.make('models/post');
  // const user = container.make('models/user')
  const jobSkill = container.make('models/jobskill');
  try {
    // Pagination
    const offset = req.query.page * req.query.pageSize;
    const limit = req.query.pageSize;
    // Get user personality traits
    // const userData = await user.findById(req.token.sub, { personality: true })
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
      postType: 'JOB',
      archive: false,
      // personalityPreference: {
      //   has: userData.personality
      // },
      matches: {
        none: {
          AND: [
            {
              candidateId: {
                equals: req.token.sub,
              },
            },
            {
              accepted: true,
            },
          ],
        },
      },
      OR: [
        req.body.skills
          ? {
              requiredSkills: {
                hasSome: jobSkillIdsToNames,
              },
            }
          : undefined,
        req.body.skills
          ? {
              optionalSkills: {
                hasSome: jobSkillIdsToNames,
              },
            }
          : undefined,
      ],
    });
    prismaQuery.OR = prismaQuery.OR.filter((or) => or !== undefined);
    if (prismaQuery.OR.length === 0) {
      prismaQuery.OR = undefined;
    }
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
    // Get results
    const results = await post.findMany(
      prismaQuery,
      {
        id: true,
        title: true,
        description: true,
        video: {
          select: {
            streamUrl: true,
          },
        },
        likes: true,
        views: true,
        postType: true,
        category: true,
        company: {
          select: {
            id: true,
            name: true,
            logo: {
              select: {
                streamUrl: true,
              },
            },
          },
        },
        location: true,
        industryType: true,
        functionalArea: true,
        activeHiring: true,
        positionType: true,
        employmentType: true,
        positionTitle: true,
        experience: true,
        compensation: true,
        requiredSkills: true,
        optionalSkills: true,
        comments: {
          where: {
            deletedTime: {
              isSet: false,
            },
          },
          select: {
            comment: true,
            user: {
              select: {
                name: true,
                photo: {
                  select: {
                    streamUrl: true,
                  },
                },
              },
            },
          },
          skip: 0,
          take: 10,
        },
        personalityPreference: {
          select: {
            title: true,
            detail: true,
          },
        },
        thumbnail: {
          select: {
            streamUrl: true,
          },
        },
        createdTime: true,
        user: {
          select: {
            id: true,
            name: true,
            photo: {
              select: {
                streamUrl: true,
              },
            },
          },
        },
        postLikes: {
          where: {
            user: {
              is: {
                id: req.token.sub,
              },
            },
          },
          select: {
            id: true,
          },
        },
        matchCount: true,
      },
      limit,
      offset,
    );
    // Return results by postType
    const finalResult = {
      JOB: [],
      SKILLS: jobSkills,
    };
    for (let i = 0; i < results.length; i++) {
      // Set user photo as thumbnail
      results[i].thumbnail = results[i].thumbnail.streamUrl;
      results[i].user = undefined;
      // Set video field as url instead of nesting url
      results[i].video = results[i].video ? results[i].video.streamUrl : null;
      // Set images as array of URLs
      results[i].images = results[i].images
        ? results[i].images.map((image) => image.streamUrl)
        : null;
      // Modify comments structure
      results[i].comments = results[i].comments.map((comment) => {
        comment.user.photo = comment.user.photo
          ? comment.user.photo.streamUrl
          : createUserAvatarUsingName(comment.user.name).streamUrl;
        return comment;
      });
      // Company stucture
      if (results[i].company) {
        results[i].company.logo = results[i].company.logo.streamUrl || null;
      }
      // Check if user liked Post
      if (results[i].postLikes.length > 0) {
        results[i].didLike = true;
      } else {
        results[i].didLike = false;
      }
      results[i].postLikes = undefined;
      // Create final result
      finalResult[results[i].postType].push(results[i]);
    }
    // Shuffle contents in array in place
    shuffleArray(finalResult.JOB);
    // send results
    res.send({
      data: finalResult,
      details: {
        ...req.query,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (error) {
    logger.error('Error occurred fetching posts. Reason:');
    logger.error(error.stack);
    next(error);
  }
}
