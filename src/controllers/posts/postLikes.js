import container from '../../container.js';
import {
  createMessage,
  createNotification,
  getFormattedDate,
} from '../../services/helper.js';

const sendResponse = (
  req,
  res,
  isAMatch,
  unliked,
  alreadyReported,
  likeCount,
) => {
  res.status(alreadyReported ? 208 : 200).send({
    data: {
      message: isAMatch
        ? "It's a match!"
        : unliked
          ? 'Unliked job'
          : 'Liked job',
      didLike: !unliked,
      isAMatch,
      likeCount,
    },
    details: req.body,
    generatedAt: getFormattedDate(),
  });
};

export default async function updateLikeCount(req, res, next) {
  const logger = container.make('logger');
  const post = container.make('models/post');
  const user = container.make('models/user');
  const postLikes = container.make('models/postlikes');
  const match = container.make('models/match');
  try {
    let isAMatch = false;
    // Check if user profile is complete, a user without a complete profile cannot like post
    const queries = await Promise.all([
      user.findById(req.token.sub, {
        roleSubtype: true,
        assessment: {
          select: {
            id: true,
          },
        },
        matchMedia: {
          select: {
            id: true,
            category: true,
          },
        },
      }),
      post.findOne(
        {
          id: req.body.postId,
          postType: 'JOB',
        },
        {
          id: true,
          user: {
            select: {
              id: true,
            },
          },
          likes: true,
        },
      ),
      postLikes.findFirst(
        {
          user: {
            id: {
              equals: req.body.sub,
            },
          },
          post: {
            id: {
              equals: req.body.postId,
            },
          },
        },
        {
          id: true,
        },
      ),
    ]);
    const existingUserProfile = queries[0];
    const existingPost = queries[1];
    const existingLike = queries[2];

    if (!existingUserProfile) {
      return res.status(401).send({
        message: 'User account not found.',
      });
    }
    if (!existingUserProfile.assessment) {
      return res.status(403).send({
        message: 'You must complete your assessment before liking jobs.',
      });
    }
    if (
      !existingUserProfile.matchMedia ||
      existingUserProfile.matchMedia.filter(
        (matchMedia) => matchMedia.category === 'INFO',
      ).length === 0
    ) {
      return res.status(403).send({
        message: 'You must have at least 1 intro video uploaded to like jobs.',
      });
    }
    if (!existingPost) {
      return res.status(400).send({
        message: 'Job does not exist or its a candidate.',
      });
    }

    // Still need to keep track if it exists or not
    const existingMatch = await match.findFirst(
      {
        AND: {
          candidate: {
            is: {
              id: req.token.sub,
            },
          },
          recruiter: {
            is: {
              id: existingPost.user.id,
            },
          },
          post: {
            is: {
              id: req.body.postId,
            },
          },
        },
      },
      {
        id: true,
        accepted: true,
        post: {
          select: {
            id: true,
            likes: true,
          },
        },
        recruiter: {
          select: {
            id: true,
            name: true,
          },
        },
        candidate: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    );

    // candidate and recruiter have already matched
    if (existingLike && existingMatch && existingMatch.accepted) {
      isAMatch = true;
      return sendResponse(
        req,
        res,
        isAMatch,
        false,
        true,
        existingMatch.post.like,
      );
    }

    // candidate and recruiter have never matched and candidate has never liked job (post)
    if (!existingMatch && !existingLike) {
      // Like flow, with create
      await Promise.all([
        match.create(
          {
            recruiter: {
              connect: {
                id: existingPost.user.id,
              },
            },
            candidate: {
              connect: {
                id: req.token.sub,
              },
            },
            post: {
              connect: {
                id: existingPost.id,
              },
            },
            accepted: false,
          },
          { id: true },
        ),
        postLikes.create({
          user: {
            connect: {
              id: req.token.sub,
            },
          },
          post: {
            connect: {
              id: existingPost.id,
            },
          },
        }),
        post.increment({ id: existingPost.id }, 'likes', 1),
      ]);
      existingPost.likes = existingPost.likes + 1;
      return sendResponse(req, res, isAMatch, false, false, existingPost.likes);
    }

    // Edge case that should never happen
    // but we have to solution for it
    if (!existingMatch && existingLike) {
      await Promise.all([
        match.create(
          {
            recruiter: {
              connect: {
                id: existingPost.user.id,
              },
            },
            candidate: {
              connect: {
                id: req.token.sub,
              },
            },
            post: {
              connect: {
                id: existingPost.id,
              },
            },
            accepted: false,
          },
          { id: true },
        ),
      ]);
      return sendResponse(req, res, isAMatch, false, false, existingPost.likes);
    }

    // candidate has liked the job (post) previously, but no longer
    // likes the job (post) and the recruiter has not liked the candidate (match)
    if (!existingMatch.accepted && existingLike) {
      // Unlike flow, with update
      await Promise.all([
        postLikes.delete({
          userId_postId: {
            userId: req.token.sub,
            postId: existingMatch.post.id,
          },
        }),
        match.deleteById(existingMatch.id),
        post.decrement({ id: existingMatch.post.id }, 'likes', 1),
        post.decrement({ id: existingMatch.post.id }, 'matchCount', 1),
      ]);
      existingPost.likes = existingPost.likes - 1;
      return sendResponse(req, res, isAMatch, true, false, existingPost.likes);
    }

    // candidate like job (post) after recruiter has liked the candidate
    if (!existingMatch.accepted && !existingLike) {
      await Promise.all([
        match.updateById(
          existingMatch.id,
          {
            accepted: true,
            post: {
              connect: {
                id: existingPost.id,
              },
            },
          },
          {
            id: true,
          },
        ),
        post.increment({ id: existingPost.id }, 'likes', 1),
        post.increment({ id: existingPost.id }, 'matchCount', 1),
      ]);
      isAMatch = true;
      existingPost.likes = existingPost.likes + 1;
    }
    // // send response
    sendResponse(req, res, isAMatch, false, false, existingPost.likes);

    // Create message and push notification
    if (isAMatch) {
      await Promise.all([
        createNotification(
          container,
          req.token.sub,
          existingMatch.candidate.id,
          'MATCH',
          `You recieved a match from ${req.token.name}!`,
        ),
        createNotification(
          container,
          existingMatch.candidate.id,
          req.token.sub,
          'MATCH',
          `You and ${existingMatch.candidate.name} have matched!`,
        ),
        createMessage(
          container,
          req,
          [existingMatch.recruiter.id],
          `Hi ${existingMatch.recruiter.name}, we've matched!`,
        ),
      ]);
    }
  } catch (err) {
    logger.error(
      'Error occurred attempting to update post like count. Reason:',
    );
    logger.error(err.stack);
    next(new Error('Unable to update like count'));
  }
}
