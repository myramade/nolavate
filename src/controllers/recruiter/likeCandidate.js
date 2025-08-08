import container from '../../container.js';
import {
  createMessage,
  createNotification,
  getFormattedDate,
} from '../../services/helper.js';

const sendResponse = (req, res, isAMatch) => {
  res.send({
    data: {
      message: isAMatch ? "It's a match!" : 'Record created.',
      isAMatch,
    },
    details: req.body,
    generatedAt: getFormattedDate(),
  });
};

export default async function likeCandidate(req, res, next) {
  const logger = container.make('logger');
  const post = container.make('models/post');
  const match = container.make('models/match');
  try {
    let isAMatch = false;
    // Check if recruiter has posts, recruiter must have posts to like a candidate
    const recruiterExistingJobPost = await post.findFirst(
      {
        user: {
          is: {
            id: req.token.sub,
          },
        },
        postType: 'JOB',
      },
      {
        id: true,
      },
    );
    if (!recruiterExistingJobPost) {
      return res.status(403).send({
        message: 'You must create a job to like a candidate.',
      });
    }
    // Find existing match
    const existingMatch = await match.findFirst(
      {
        AND: {
          candidate: {
            is: {
              id: req.body.candidateId,
            },
          },
          recruiter: {
            is: {
              id: req.token.sub,
            },
          },
          accepted: false,
        },
      },
      {
        id: true,
        accepted: true,
        post: {
          select: {
            id: true,
          },
        },
        recruiter: {
          select: {
            id: true,
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
    // Create Prospect, if existing match does not exist
    if (!existingMatch) {
      await match.create(
        {
          recruiter: {
            connect: {
              id: req.token.sub,
            },
          },
          candidate: {
            connect: {
              id: req.body.candidateId,
            },
          },
          accepted: false,
        },
        { id: true },
      );
      return sendResponse(req, res, isAMatch);
    }
    // If recruiter liked candidate and candidate liked recruiter, but now recruiter dislikes candidate, change accepted to false
    if (existingMatch.accepted) {
      await match.updateById(
        existingMatch.id,
        {
          accepted: false,
        },
        {
          id: true,
        },
      );
      await post.decrement({ id: existingMatch.post.id }, 'matchCount', 1);
      return sendResponse(req, res, isAMatch);
    }
    // If only the recruiter liked candidate, and now unlikes candidate
    if (!existingMatch.accepted && !existingMatch.candidate.id) {
      await match.deleteById(existingMatch.id);
      await post.decrement({ id: existingMatch.post.id }, 'matchCount', 1);
      return sendResponse(req, res, isAMatch);
    }
    // Recruiter and candidated have liked each other, but match not created yet
    if (!existingMatch.accepted && existingMatch.candidate.id) {
      await match.updateById(
        existingMatch.id,
        {
          accepted: true,
          recruiter: {
            connect: {
              id: req.token.sub,
            },
          },
        },
        {
          id: true,
        },
      );
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
          `You recieved a match from ${existingMatch.candidate.name}!`,
        ),
        createMessage(
          container,
          req,
          [existingMatch.candidate.id],
          `Hi ${existingMatch.candidate.name}, we've matched!`,
        ),
        post.increment({ id: existingMatch.post.id }, 'matchCount', 1),
      ]);
      isAMatch = true;
    }
    sendResponse(req, res, isAMatch);
  } catch (err) {
    logger.error(
      `Error occurred liking candidate, recruiter ID: ${req.token.sub}. Reason:`,
    );
    logger.error(err.stack);
    if (err.message.startsWith('Unique constraint failed')) {
      return res
        .status(208)
        .send({ message: 'Match already created between users.' });
    }
    next(new Error('Unable to complete request.'));
  }
}
