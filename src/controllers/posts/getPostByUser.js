import container from '../../container.js';
import {
  createUserAvatarUsingName,
  getFormattedDate,
} from '../../services/helper.js';

export default async function getPostsByUserId(req, res, next) {
  const logger = container.make('logger');
  const post = container.make('models/post');
  try {
    // Check if database is connected
    if (!post) {
      return res.status(503).send({
        error: 'Database offline',
        message: 'Unable to retrieve job posts. The database is currently offline. Please try again later.',
      });
    }
    
    // Pagination
    const offset = req.query.page * req.query.pageSize;
    const limit = req.query.pageSize;
    
    // Use current user's ID from token if userId not provided
    const userId = req.query.userId || req.token.sub;
    
    const query = {
      userId: userId,
    };
    if (req.query.postType) {
      query.postType = req.query.postType.toUpperCase();
    }
    
    let results = [];
    try {
      results = await post.findMany(
        query,
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
    } catch (dbError) {
      logger.error('Post query failed:', dbError.message);
      return res.status(503).send({
        error: 'Database offline',
        message: 'Unable to retrieve job posts. The database is currently experiencing issues. Please try again later.',
      });
    }
    
    // Format results
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
    logger.error('Error occurred fetching posts. Reason:');
    logger.error(error.stack);
    next(error);
  }
}
