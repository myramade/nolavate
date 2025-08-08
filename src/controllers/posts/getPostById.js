import container from '../../container.js';
import {
  createUserAvatarUsingName,
  getFormattedDate,
} from '../../services/helper.js';

export default async function getPostById(req, res, next) {
  const logger = container.make('logger');
  const post = container.make('models/post');
  try {
    const result = await post.findById(req.query.id, {
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
    });
    if (!result) {
      throw new Error('Post not found by ID.');
    }
    // Set user photo as thumbnail
    result.thumbnail = result.thumbnail.streamUrl;
    result.user = undefined;
    // Set video field as url instead of nesting url
    result.video = result.video ? result.video.streamUrl : null;
    // Set images as array of URLs
    result.images = result.images
      ? result.images.map((image) => image.streamUrl)
      : null;
    // Modify comments structure
    result.comments = result.comments.map((comment) => {
      comment.user.photo = comment.user.photo
        ? comment.user.photo.streamUrl
        : createUserAvatarUsingName(comment.user.name).streamUrl;
      return comment;
    });
    // Company stucture
    if (result.company) {
      result.company.logo = result.company.logo.streamUrl || null;
    }
    // Check if user liked Post
    if (result.postLikes.length > 0) {
      result.didLike = true;
    } else {
      result.didLike = false;
    }
    result.postLikes = undefined;
    // send results
    return res.send({
      data: result,
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