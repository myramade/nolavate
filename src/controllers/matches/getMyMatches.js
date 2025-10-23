import container from '../../container.js';
import { getFormattedDate } from '../../services/helper.js';
import { ObjectId } from 'mongodb';

export default async function getMyMatches(req, res, next) {
  const logger = container.make('logger');
  const match = container.make('models/match');
  
  try {
    // Pagination
    const page = parseInt(req.query.page) || 0;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = page * pageSize;
    const limit = pageSize;
    
    // Build query based on user role
    const query = {
      accepted: true,
      postId: { $ne: null }
    };

    // Set the appropriate ID field based on role - convert to ObjectId
    if (req.token.roleSubtype === 'CANDIDATE') {
      query.candidateId = new ObjectId(req.token.sub);
    } else if (req.token.roleSubtype === 'RECRUITER') {
      query.recruiterId = new ObjectId(req.token.sub);
    }

    // Get documents with pagination
    const results = await match.findMany(query, {}, limit, offset, 'createdTime', 'desc');
    
    // Format results - simplified without complex nested relations
    const formattedResults = results.map(result => ({
      id: result._id,
      candidateId: result.candidateId,
      recruiterId: result.recruiterId,
      postId: result.postId,
      accepted: result.accepted,
      createdTime: result.createdTime,
      media: result.media || []
    }));

    // Send response
    return res.send({
      data: formattedResults,
      details: {
        page,
        pageSize,
        query: req.query,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (err) {
    logger.error('Error occurred fetching user matches. Reason:');
    logger.error(err.stack);
    next(new Error('Unable to complete request.'));
  }
}
