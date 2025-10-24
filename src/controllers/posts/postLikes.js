import { ObjectId } from 'mongodb';
import container from '../../container.js';
import {
  createMessage,
  createNotification,
  getFormattedDate,
} from '../../services/helper.js';
import { toObjectId } from '../../utils/mongoHelpers.js';

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
    const userId = toObjectId(req.token.sub);
    const postId = toObjectId(req.body.postId);
    
    // Check if user profile is complete, a user without a complete profile cannot like post
    const queries = await Promise.all([
      user.findById(userId, {
        _id: 1,
        roleSubtype: 1,
        assessmentId: 1,
        matchMedia: 1,
      }),
      post.findOne(
        {
          _id: postId,
          postType: 'JOB',
        },
        {
          _id: 1,
          userId: 1,
          likes: 1,
        },
      ),
      postLikes.findFirst(
        {
          userId: userId,
          postId: postId,
        },
        {
          _id: 1,
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
    if (!existingUserProfile.assessmentId) {
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

    // Check if match already exists
    const existingMatch = await match.findFirst(
      {
        candidateId: userId,
        recruiterId: existingPost.userId,
        postId: postId,
      },
      {
        _id: 1,
        accepted: 1,
        postId: 1,
        recruiterId: 1,
        candidateId: 1,
      },
    );

    // Load recruiter and candidate names if we have a match (for notifications)
    let recruiterData = null;
    let candidateData = null;
    if (existingMatch) {
      [recruiterData, candidateData] = await Promise.all([
        user.findById(existingMatch.recruiterId, { _id: 1, name: 1 }),
        user.findById(existingMatch.candidateId, { _id: 1, name: 1 }),
      ]);
    }
    
    // Also load post likes count
    let postLikesCount = existingPost.likes;

    // candidate and recruiter have already matched - toggle back to unmatched
    if (existingLike && existingMatch && existingMatch.accepted) {
      // Unlike flow for accepted match: delete like, update match to not accepted, decrement counts
      await Promise.all([
        postLikes.delete({
          userId_postId: {
            userId: userId.toString(),
            postId: postId.toString(),
          },
        }),
        match.updateById(existingMatch._id, { accepted: false }),
        post.decrement({ _id: postId }, 'likes', 1),
        post.decrement({ _id: postId }, 'matchCount', 1),
      ]);
      postLikesCount = postLikesCount - 1;
      return sendResponse(req, res, false, true, false, postLikesCount);
    }

    // candidate and recruiter have never matched and candidate has never liked job (post)
    if (!existingMatch && !existingLike) {
      // Like flow, with create
      await Promise.all([
        match.create({
          recruiterId: existingPost.userId,
          candidateId: userId,
          postId: postId,
          accepted: false,
          createdTime: new Date(),
        }),
        postLikes.create({
          userId: userId,
          postId: postId,
          createdTime: new Date(),
        }),
        post.increment({ _id: postId }, 'likes', 1),
      ]);
      postLikesCount = postLikesCount + 1;
      return sendResponse(req, res, isAMatch, false, false, postLikesCount);
    }

    // Edge case that should never happen
    // but we have to solution for it
    if (!existingMatch && existingLike) {
      await match.create({
        recruiterId: existingPost.userId,
        candidateId: userId,
        postId: postId,
        accepted: false,
        createdTime: new Date(),
      });
      return sendResponse(req, res, isAMatch, false, false, postLikesCount);
    }

    // candidate has liked the job (post) previously, but no longer
    // likes the job (post) and the recruiter has not liked the candidate (match not accepted)
    if (!existingMatch.accepted && existingLike) {
      // Unlike flow, with delete (only decrement likes, not matchCount since match wasn't accepted)
      await Promise.all([
        postLikes.delete({
          userId_postId: {
            userId: userId.toString(),
            postId: postId.toString(),
          },
        }),
        match.deleteById(existingMatch._id),
        post.decrement({ _id: postId }, 'likes', 1),
        // Note: matchCount is NOT decremented because this match was never accepted
      ]);
      postLikesCount = postLikesCount - 1;
      return sendResponse(req, res, isAMatch, true, false, postLikesCount);
    }

    // candidate like job (post) after recruiter has liked the candidate
    if (!existingMatch.accepted && !existingLike) {
      await Promise.all([
        match.updateById(
          existingMatch._id,
          {
            accepted: true,
            postId: postId,
          },
        ),
        postLikes.create({
          userId: userId,
          postId: postId,
          createdTime: new Date(),
        }),
        post.increment({ _id: postId }, 'likes', 1),
        post.increment({ _id: postId }, 'matchCount', 1),
      ]);
      isAMatch = true;
      postLikesCount = postLikesCount + 1;
    }
    
    // send response
    sendResponse(req, res, isAMatch, false, false, postLikesCount);

    // Create message and push notification
    if (isAMatch && recruiterData && candidateData) {
      await Promise.all([
        createNotification(
          container,
          req.token.sub,
          candidateData._id.toString(),
          'MATCH',
          `You recieved a match from ${req.token.name}!`,
        ),
        createNotification(
          container,
          candidateData._id.toString(),
          req.token.sub,
          'MATCH',
          `You and ${candidateData.name} have matched!`,
        ),
        createMessage(
          container,
          req,
          [recruiterData._id.toString()],
          `Hi ${recruiterData.name}, we've matched!`,
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
