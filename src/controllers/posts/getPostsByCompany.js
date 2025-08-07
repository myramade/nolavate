import dayjs from 'dayjs';
import container from '../../container.js';
import {
  createUserAvatarUsingName,
  getFormattedDate,
  isEmpty,
  skipUndefined,
} from '../../services/helper.js';

export default async function getPostsByCompany(req, res, next) {
  const logger = container.make('logger');
  const post = container.make('models/post');
  try {
    const filters = skipUndefined({
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    });
    const offset = req.query.page * req.query.pageSize;
    const limit = req.query.pageSize;
    const results = await post.findMany(
      skipUndefined({
        company: {
          is: {
            id: req.query.id,
          },
        },
        createdTime: !isEmpty(filters)
          ? {
              gte: dayjs(filters.startDate).toISOString(),
              lte: dayjs(filters.endDate).toISOString(),
            }
          : undefined,
      }),
      {
        id: true,
        title: true,
        description: true,
        video: {
          select: {
            streamUrl: true,
          },
        },
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
        likes: true,
        views: true,
        postType: true,
        category: true,
        industryType: true,
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
        functionalArea: true,
        activeHiring: true,
        positionType: true,
        employmentType: true,
        positionTitle: true,
        experience: true,
        compensation: true,
        requiredSkills: true,
        optionalSkills: true,
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
        createdTime: true,
        matchCount: true,
      },
      limit,
      offset,
    );
    for (let i = 0; i < results.length; i++) {
      // metadata
      results[i].canEdit = results[i].user
        ? results[i].user.id === req.token.sub
        : false;
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
    }
    // send results
    return res.send({
      data: results,
      details: {
        body: req.query,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (error) {
    logger.error('Error occurred fetching posts by company ID. Reason:');
    logger.error(error.stack);
    next(error);
  }
}
