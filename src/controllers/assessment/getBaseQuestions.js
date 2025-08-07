import container from '../../container.js';
import { getFormattedDate } from '../../services/helper.js';

export default async function getBaseQuestions(req, res, next) {
  const logger = container.make('logger');
  const assessmentQuestions = container.make('models/assessmentquestions');
  try {
    const results = await assessmentQuestions.findMany(
      {},
      {
        id: true,
        question: true,
        answers: {
          select: {
            id: true,
            text: true,
          },
        },
      },
      -1,
      0,
      'order',
      'desc',
    );
    // send results
    return res.send({
      data: results,
      details: {
        query: req.query,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (error) {
    logger.error('Error occurred fetching assessment. Reason:');
    logger.error(error.stack);
    next(error);
  }
}
