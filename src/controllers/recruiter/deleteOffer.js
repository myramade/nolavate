import container from '../../container.js';
import { getFormattedDate } from '../../services/helper.js';

export default async function createJobOffer(req, res, next) {
  const logger = container.make('logger');
  const jobOffer = container.make('models/joboffers');

  try {
    const result = await jobOffer.softDelete(
      req.body.id,
      {
        status: 'OFFERED',
      },
      {
        deletedTime: true,
      },
    );

    // send response
    res.send({
      data: {
        message: 'Job offer has been deleted.',
        ...result,
      },
      details: {
        body: req.body,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (err) {
    logger.error('Unable to delete job offer. Reason:');
    logger.error(err.stack);
    next(new Error('Unable to complete request.'));
  }
}
