import container from '../../container.js';
import { getFormattedDate } from '../../services/helper.js';

export default async function getProspects(req, res, next) {
  const logger = container.make('logger');
  const match = container.make('models/match');

  try {
    const prismaQueries = [
      {
        accepted: false,
      },
    ];
    if (req.token.roleSubtype === 'CANDIDATE') {
      prismaQueries.push({
        candidate: {
          is: {
            id: req.token.sub,
            matchMedia: {
              isEmpty: false,
            },
          },
        },
      });
      prismaQueries.push({
        postId: {
          not: null,
        },
      });
    }
    if (req.token.roleSubtype === 'RECRUITER') {
      prismaQueries.push({
        recruiter: {
          is: {
            id: req.token.sub,
          },
        },
      });
      prismaQueries.push({
        candidate: {
          matchMedia: {
            isEmpty: false,
          },
        },
      });
      // postId is recruiter-only
      if (req.body.postId) {
        prismaQueries.push({
          post: {
            is: {
              id: req.query.postId,
            },
          },
        });
      } else {
        prismaQueries.push({
          postId: {
            not: null,
          },
        });
      }
    }
    const results = await match.findMany(
      {
        AND: prismaQueries,
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
            location: true,
            positionType: true,
            thumbnail: {
              select: {
                streamUrl: true,
              },
            },
            video: {
              select: {
                streamUrl: true,
              },
            },
            positionTitle: true,
            requiredSkills: true,
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
            postLikes: {
              where: {
                user: {
                  is: {
                    id: req.token.sub,
                  },
                },
              },
              select: {
                id: true,
              },
            },
            matchCount: true,
          },
        },
        media: true,
        createdTime: true,
      },
    );

    // Format results
    if (results.length > 0) {
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
        results[i].company = results[i].post.company;
        results[i].company.logo = results[i].company
          ? results[i].company.logo.streamUrl
          : null;
        results[i].post.company = undefined;
        // Check if user liked post
        if (results[i].post.postLikes.length > 0) {
          results[i].post.didLike = true;
        } else {
          results[i].post.didLike = false;
        }
        // Filter by criteria or paywall
        if (req.token.roleSubtype === 'RECRUITER') {
          // Show recruiter the candidates first name if they are not a match
          results[i].candidate.name = results[i].candidate.name.split(' ')[0];
        }
      }
    }
    res.send({
      data: results,
      details: {
        body: req.query,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (err) {
    logger.error('Error occurred fetching prospects. Reason:');
    logger.error(err.stack);
    next(err);
  }
}
