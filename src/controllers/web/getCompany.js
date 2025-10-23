import { ObjectId } from 'mongodb';
import container from '../../container.js';
import { getFormattedDate } from '../../services/helper.js';
import { serializeDocument } from '../../utils/mongoHelpers.js';

export default async function getCompany(req, res, next) {
  const logger = container.make('logger');
  const company = container.make('models/company');

  try {
    // MongoDB query - simple projection
    const result = await company.findById(req.query.id, {
      _id: 1,
      name: 1,
      logo: 1,
      website: 1,
      industry: 1,
      description: 1,
      culture: 1,
      techStacks: 1,
      location: 1,
      dateFounded: 1,
      numOfEmployees: 1,
      numOfJobPosts: 1,
      profileOwnerId: 1
    });
    
    if (!result) {
      return res.status(404).send({
        message: 'Company not found'
      });
    }
    
    // Serialize and transform data
    const serialized = serializeDocument(result);
    
    // Transform nested logo object to URL string
    if (serialized.logo && serialized.logo.streamUrl) {
      serialized.logo = serialized.logo.streamUrl;
    } else {
      serialized.logo = null;
    }
    
    // Check ownership by comparing profileOwnerId with current user
    serialized.isOwner = serialized.profileOwnerId === req.token.sub;
    
    // Remove profileOwnerId from response (internal field)
    delete serialized.profileOwnerId;
    
    // send response
    res.send({
      data: serialized,
      details: {
        body: req.body,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (err) {
    logger.error('Unable to fetch company. Reason:');
    logger.error(err.stack);
    next(new Error('Unable to complete request.'));
  }
}
