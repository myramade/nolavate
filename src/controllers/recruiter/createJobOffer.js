import dayjs from 'dayjs';
import container from '../../container.js';
import { getFormattedDate, skipUndefined } from '../../services/helper.js';

export default async function createJobOffer(req, res, next) {
  const logger = container.make('logger');
  const jobOffer = container.make('models/joboffers');
  const notifications = container.make('models/notifications');
  const post = container.make('models/post');

  try {
    const getPostResult = await post.findById(req.body.postId, {
      companyId: true,
    });
    if (!getPostResult) {
      return res.status(400).send({
        message: 'Post not found with postId provided.',
      });
    }
    const result = await jobOffer.create(
      skipUndefined({
        post: {
          connect: {
            id: req.body.postId,
          },
        },
        candidate: {
          connect: {
            id: req.body.candidateId,
          },
        },
        recruiter: {
          connect: {
            id: req.token.sub,
          },
        },
        company: {
          connect: {
            id: getPostResult.companyId,
          },
        },
        salary: req.body.salary,
        currency: req.body.currency,
        employmentType: req.body.employmentType,
        location: req.body.location,
        startDate: dayjs(req.body.startDate).toISOString(),
      }),
      {
        id: true,
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
        status: true,
        startDate: true,
      },
    );
    // Send user a notification
    await notifications.create(
      {
        forUser: {
          connect: {
            id: req.body.candidateId,
          },
        },
        fromUser: {
          connect: {
            id: req.token.sub,
          },
        },
        type: 'JOBOFFER',
        jobOffer: {
          connect: {
            id: result.id,
          },
        },
        message: `${result.recruiter.name} has offered you a job at ${result.company.name}!`,
      },
      { id: true },
    );
    // Transform response
    result.recruiter.photo = result.recruiter.photo.streamUrl;
    result.candidate.photo = result.candidate.photo.streamUrl;
    result.company.logo = result.company.logo.streamUrl;
    // send response
    res.send({
      data: result,
      details: {
        body: req.body,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (err) {
    logger.error('Unable to create job offer. Reason:');
    logger.error(err.stack);
    next(new Error('Unable to complete request.'));
  }
}
