import container from '../../container.js';
import { getFormattedDate } from '../../services/helper.js';
import { ObjectId } from 'mongodb';

export default async function updateJobOffer(req, res, next) {
  const logger = container.make('logger');
  const jobOffer = container.make('models/joboffer');
  const notifications = container.make('models/notification');

  try {
    const result = await jobOffer[
      req.body.status === 'ACCEPTED' ? 'accept' : 'decline'
    ](req.body.id, req.token.sub);
    
    // Helper to safely extract ID and convert to ObjectId
    const toObjectId = (value) => {
      if (!value) return null;
      // If already ObjectId, return it
      if (value instanceof ObjectId) return value;
      // If it's an object with _id or id, extract and convert
      if (typeof value === 'object') {
        const idValue = value._id || value.id;
        return idValue ? (idValue instanceof ObjectId ? idValue : new ObjectId(String(idValue))) : null;
      }
      // If it's a string, convert to ObjectId
      return new ObjectId(String(value));
    };
    
    // Send user a notification - convert to MongoDB syntax with safe ID extraction
    if (result && result.recruiter && result.candidate) {
      const recruiterId = toObjectId(result.recruiter);
      const candidateId = toObjectId(result.candidate);
      const jobOfferId = toObjectId(result._id || result.id);
      
      if (recruiterId && candidateId && jobOfferId) {
        await notifications.create({
          forUserId: recruiterId,
          fromUserId: candidateId,
          type: 'JOBOFFER',
          jobOfferId: jobOfferId,
          message:
            result.status === 'ACCEPTED'
              ? `${result.candidate.name || 'Candidate'} has accepted your offer to ${result.company?.name || 'your company'}!`
              : `${result.candidate.name || 'Candidate'} has declined your offer to ${result.company?.name || 'your company'}.`,
          createdTime: new Date(),
        });
      }
    }
    
    // Helper to serialize ObjectIds in response
    const serializeResponse = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      const serialized = {};
      for (const key in obj) {
        const value = obj[key];
        if (value instanceof ObjectId) {
          serialized[key] = value.toString();
        } else if (Array.isArray(value)) {
          serialized[key] = value.map(item => serializeResponse(item));
        } else if (value && typeof value === 'object' && !(value instanceof Date)) {
          serialized[key] = serializeResponse(value);
        } else {
          serialized[key] = value;
        }
      }
      return serialized;
    };

    // Send response with serialized ObjectIds
    res.send({
      data: serializeResponse(result),
      details: {
        body: req.body,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (err) {
    logger.error('Unable to respond to job offer. Reason:');
    logger.error(err.stack);
    next(new Error('Unable to complete request.'));
  }
}
