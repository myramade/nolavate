import container from '../../container.js';
import { getFormattedDate } from '../../services/helper.js';

export default async function getMyCompany(req, res, next) {
  const logger = container.make('logger');
  const company = container.make('models/company');

  try {
    if (!company.db) {
      return res.send({
        data: null,
        details: {
          userId: req.token.sub,
          message: 'Database not connected',
        },
        generatedAt: getFormattedDate(),
      });
    }

    const result = await company.findOne({ profileOwnerId: req.token.sub });

    if (result && result.logo && typeof result.logo === 'object') {
      result.logo = result.logo.streamUrl || result.logo;
    }

    res.send({
      data: result,
      details: {
        userId: req.token.sub,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (err) {
    logger.error('Unable to fetch my company. Reason:');
    logger.error(err.stack);
    next(new Error('Unable to complete request.'));
  }
}
