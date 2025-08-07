import container from '../../container.js';
import { getFormattedDate } from '../../services/helper.js';

export default async function getMatchById(req, res, next) {
  const logger = container.make('logger');
  const match = container.make('models/match');

  try {
    // Get document
    const result = await match.findOne(
      {
        id: req.query.id,
        accepted: true,
      },
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
            personality: {
              select: {
                title: true,
                detail: true,
              },
            },
            matchMedia: {
              select: {
                id: true,
                streamUrl: true,
                category: true,
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
        accepted: true,
        post: {
          select: {
            id: true,
            title: true,
            description: true,
            video: {
              select: {
                streamUrl: true,
              },
            },
            thumbnail: {
              select: {
                streamUrl: true,
              },
            },
            positionTitle: true,
            positionType: true,
            employmentType: true,
            compensation: true,
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
          },
        },
      },
    );
    // Format results
    if (result) {
      result.media = result.candidate.matchMedia.map((media) => {
        return {
          id: media.id,
          url: media.streamUrl,
          category: media.category,
        };
      });
      if (result.candidate) {
        result.candidate.matchMedia = undefined;
        result.candidate.photo = result.candidate.photo
          ? result.candidate.photo.streamUrl
          : null;
      }
      if (result.recruiter) {
        result.recruiter.photo = result.recruiter.photo
          ? result.recruiter.photo.streamUrl
          : null;
      }
      if (result.post?.company) {
        result.company = result.post.company;
        result.company.logo = result.company
          ? result.company.logo.streamUrl
          : null;
        result.post.company = undefined;
      }
      result.thumbnail = result.post.thumbnail.streamUrl;
    }
    // send response
    return res.send({
      data: result,
      details: {
        body: req.query,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (err) {
    logger.error('Error occrred fetching match by ID. Reason:');
    logger.error(err.stack);
    next(new Error('Unable to complete request.'));
  }
}
