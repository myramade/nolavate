import container from '../../container.js';
import { getFormattedDate } from '../../services/helper.js';

export default async function updateJobOffer(req, res, next) {
  const logger = container.make('logger');
  const jobOffer = container.make('models/joboffers');
  const notifications = container.make('models/notifications');

  try {
    const result = await jobOffer[
      req.body.status === 'ACCEPTED' ? 'accept' : 'decline'
    ](req.body.id, req.token.sub);
    // Send user a notification
    await notifications.create(
      {
        forUser: {
          connect: {
            id: result.recruiter.id,
          },
        },
        fromUser: {
          connect: {
            id: result.candidate.id,
          },
        },
        type: 'JOBOFFER',
        jobOffer: {
          connect: {
            id: result.id,
          },
        },
        message:
          result.status === 'ACCEPTED'
            ? `${result.candidate.name} has accepted your offer to ${result.company.name}!`
            : `${result.candidate.name} has declined your offer to ${result.company.name}.`,
      },
      { id: true },
    );
    // Send response
    res.send({
      data: result,
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
