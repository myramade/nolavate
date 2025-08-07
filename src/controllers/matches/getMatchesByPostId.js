import container from '../../container.js';
import { getFormattedDate } from '../../services/helper.js';

export default async function getMatchByPostId(req, res, next) {
  const logger = container.make('logger');
  const match = container.make('models/match');

  try {
    // Get document
    const results = await match.findManyAnd(
      [
        {
          post: {
            is: {
              id: req.query.id,
            },
          },
        },
        {
          accepted: true,
        },
        {
          candidate: {
            matchMedia: {
              isEmpty: false,
            },
          },
        },
      ],
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
            employmentTitle: true,
            skills: true,
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
    if (results) {
      for (let i = 0; i < results.length; i++) {
        if (!results[i].recruiter || !results[i].candidate) {
          continue;
        }
        // Candidate must have at least the intro video complete
        const atLeastIntroMedia = results[i].candidate.matchMedia.filter(
          (media) => media.category === 'INFO',
        );
        if (atLeastIntroMedia.length === 0) {
          continue;
        }
        results[i].media = results[i].candidate.matchMedia.map((media) => {
          return {
            id: media.id,
            url: media.streamUrl,
            category: media.category,
          };
        });
        results[i].candidate.matchMedia = undefined;
        results[i].recruiter.photo = results[i].recruiter.photo
          ? results[i].recruiter.photo.streamUrl
          : null;
        results[i].candidate.photo = results[i].candidate.photo
          ? results[i].candidate.photo.streamUrl
          : null;
        if (results[i].post?.company) {
          results[i].company = results[i].post.company;
          results[i].company.logo = results[i].company
            ? results[i].company.logo.streamUrl
            : null;
          results[i].post.company = undefined;
        }
        results[i].thumbnail = results[i].post.thumbnail.streamUrl;
      }
    }
    // send response
    return res.send({
      data: results,
      details: {
        body: req.query,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (err) {
    logger.error('Error occrred fetching matches by post ID. Reason:');
    logger.error(err.stack);
    next(new Error('Unable to complete request.'));
  }
}
