import container from '../../container.js';
import { getFormattedDate } from '../../services/helper.js';
import { ObjectId } from 'mongodb';

export default async function getProspects(req, res, next) {
  const logger = container.make('logger');
  const match = container.make('models/match');

  try {
    // Build MongoDB query based on user role
    const query = {
      accepted: false
    };

    if (req.token.roleSubtype === 'CANDIDATE') {
      query.candidateId = new ObjectId(req.token.sub);
      query.postId = { $ne: null };
    }
    
    if (req.token.roleSubtype === 'RECRUITER') {
      query.recruiterId = new ObjectId(req.token.sub);
      
      // Check for postId filter in query params (not body)
      if (req.query.postId) {
        query.postId = new ObjectId(req.query.postId);
      } else {
        query.postId = { $ne: null };
      }
    }

    // Fetch matches with simple query
    const results = await match.findMany(query, {}, -1, 0, 'createdTime', 'desc');
    
    // Format results - simplified without complex nested data
    const formattedResults = results.map(result => ({
      id: result._id,
      candidateId: result.candidateId,
      recruiterId: result.recruiterId,
      postId: result.postId,
      accepted: result.accepted,
      createdTime: result.createdTime,
      media: result.media || []
    }));

    res.send({
      data: formattedResults,
      details: {
        query: req.query,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (err) {
    logger.error('Error occurred fetching prospects. Reason:');
    logger.error(err.stack);
    next(err);
  }
}
