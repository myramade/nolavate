import container from '../../container.js';
import { getFormattedDate } from '../../services/helper.js';

export default async function getCompany(req, res, next) {
  const logger = container.make('logger');
  const company = container.make('models/company');

  try {
    const result = await company.findById(req.query.id, {
      id: true,
      name: true,
      logo: {
        select: {
          streamUrl: true,
        },
      },
      website: true,
      industry: true,
      description: true,
      culture: true,
      techStacks: true,
      location: true,
      dateFounded: true,
      numOfEmployees: true,
      numOfJobPosts: true,
      profileOwner: {
        select: {
          id: true,
        },
      },
    });
    if (result) {
      result.logo = result.logo.streamUrl;
      result.isOwner = result.profileOwner
        ? result.profileOwner.id === req.token.sub
        : false;
    }
    // send response
    res.send({
      data: result,
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
