import container from '../../container.js';
import { getFormattedDate } from '../../services/helper.js';

export default async function getMyJobOffers(req, res, next) {
  const logger = container.make('logger');
  const jobOffer = container.make('models/joboffer');
  const field =
    req.token.roleSubtype === 'CANDIDATE' ? 'candidate' : 'recruiter';
  // Pagination
  const offset = req.query.page * req.query.pageSize;
  const limit = req.query.pageSize;
  try {
    const results = await jobOffer.findMany(
      {
        [field]: {
          is: {
            id: req.token.sub,
          },
        },
      },
      {
        id: true,
        post: {
          select: {
            id: true,
            title: true,
          },
        },
        candidate: {
          select: {
            id: true,
            name: true,
            photo: {
              select: {
                streamUrl: true,
              },
            },
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            logo: {
              select: {
                streamUrl: true,
              },
            },
          },
        },
        recruiter: {
          select: {
            id: true,
            name: true,
            photo: {
              select: {
                streamUrl: true,
              },
            },
          },
        },
        salary: true,
        currency: true,
        employmentType: true,
        location: true,
        status: true,
        startDate: true,
        createdTime: true,
      },
      limit,
      offset,
    );
    // send response
    res.send({
      data: results,
      details: {
        body: req.query,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (err) {
    logger.error('Unable to delete job offer. Reason:');
    logger.error(err.stack);
    next(new Error('Unable to complete request.'));
  }
}
