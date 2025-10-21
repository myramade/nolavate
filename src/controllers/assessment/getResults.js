import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat.js';
import container from '../../container.js';
import { getFormattedDate, skipUndefined } from '../../services/helper.js';

class HttpError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}
dayjs.extend(advancedFormat);

export default async function getResults(req, res, next) {
  const logger = container.make('logger');
  const assessment = container.make('models/assessment');
  try {
    const result = await assessment.findOne({ userId: req.token.sub });
    
    if (!result) {
      throw new HttpError('User has not taken the assessment.', 404);
    }
    let message = 'Assessment has been scored!';
    if (result.isBuildingPersonalityProfile) {
      message = 'Score is being calculated.';
    }
    if (result.errorWhileCalculating) {
      message = 'Error occurred while calculating score. The team has been notified.';
    }
    
    // Format the response
    const formattedResult = {
      id: result._id || result.id,
      personality: result.personality,
      response: result.response || [],
      isBuildingPersonalityProfile: result.isBuildingPersonalityProfile || false,
      takenAt: result.createdTime ? dayjs(result.createdTime).format('dddd, MMMM Do YYYY') : new Date().toLocaleDateString(),
      createdTime: result.createdTime
    };
    
    // Send response
    res.send({
      data: formattedResult,
      message,
      details: {
        body: req.token.sub,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (error) {
    logger.error('Error occurred fetching assessment results. Reason:');
    logger.error(error.stack);
    next(error);
  }
}