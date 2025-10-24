import { ObjectId } from 'mongodb';
import container from '../../container.js';
import {
  createMessage,
  createNotification,
  getFormattedDate,
} from '../../services/helper.js';
import { toObjectId } from '../../utils/mongoHelpers.js';

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
  const user = container.make('models/user');
  
  try {
    let isAMatch = false;
    const recruiterId = toObjectId(req.token.sub);
    const candidateId = toObjectId(req.body.candidateId);
    
    // Check if recruiter has posts, recruiter must have posts to like a candidate
    const recruiterExistingJobPost = await post.findFirst(
      {
        userId: recruiterId,
        postType: 'JOB',
      },
      {
        _id: 1,
      },
    );
    
    if (!recruiterExistingJobPost) {
      return res.status(403).send({
        message: 'You must create a job to like a candidate.',
      });
    }
    
    // Find existing match (any state - accepted or not)
    const existingMatch = await match.findFirst(
      {
        candidateId: candidateId,
        recruiterId: recruiterId,
      },
      {
        _id: 1,
        accepted: 1,
        postId: 1,
        recruiterId: 1,
        candidateId: 1,
      },
    );
    
    // Create Prospect, if existing match does not exist
    if (!existingMatch) {
      await match.create({
        recruiterId: recruiterId,
        candidateId: candidateId,
        accepted: false,
        createdTime: new Date(),
      });
      return sendResponse(req, res, isAMatch);
    }
    
    // If recruiter liked candidate and candidate liked recruiter (mutual match), but now recruiter dislikes, change accepted to false
    if (existingMatch.accepted) {
      await match.updateById(
        existingMatch._id,
        {
          accepted: false,
        },
      );
      if (existingMatch.postId) {
        await post.decrement({ _id: existingMatch.postId }, 'matchCount', 1);
      }
      return sendResponse(req, res, isAMatch);
    }
    
    // If match exists but not accepted, check who initiated:
    // - If match has postId: candidate initiated (candidate liked job first)
    // - If match has NO postId: recruiter initiated (recruiter liked candidate first)
    
    // Recruiter already liked this candidate before (recruiter-initiated match) - now unlikes
    if (!existingMatch.accepted && !existingMatch.postId) {
      await match.deleteById(existingMatch._id);
      return sendResponse(req, res, isAMatch);
    }
    
    // Candidate liked job first (candidate-initiated match), recruiter now likes back → MATCH!
    if (!existingMatch.accepted && existingMatch.postId) {
      // Load candidate name for notifications (with null guard)
      const candidateData = await user.findById(candidateId, { _id: 1, name: 1 });
      const candidateName = candidateData?.name || 'Candidate';
      const recruiterName = req.token?.name || 'Recruiter';
      
      await match.updateById(
        existingMatch._id,
        {
          accepted: true,
          recruiterId: recruiterId,
        },
      );
      
      const notificationPromises = [
        createNotification(
          container,
          req.token.sub,
          candidateId.toString(),
          'MATCH',
          `You recieved a match from ${recruiterName}!`,
        ),
        createNotification(
          container,
          candidateId.toString(),
          req.token.sub,
          'MATCH',
          `You recieved a match from ${candidateName}!`,
        ),
        createMessage(
          container,
          req,
          [candidateId.toString()],
          `Hi ${candidateName}, we've matched!`,
        ),
      ];
      
      if (existingMatch.postId) {
        notificationPromises.push(
          post.increment({ _id: existingMatch.postId }, 'matchCount', 1)
        );
      }
      
      await Promise.all(notificationPromises);
      isAMatch = true;
    }
    
    sendResponse(req, res, isAMatch);
  } catch (err) {
    logger.error(
      `Error occurred liking candidate, recruiter ID: ${req.token.sub}. Reason:`,
    );
    logger.error(err.stack);
    if (err.message && err.message.startsWith('Unique constraint failed')) {
      return res
        .status(208)
        .send({ message: 'Match already created between users.' });
    }
    next(new Error('Unable to complete request.'));
  }
}
