import container from '../../container.js';
import { getFormattedDate } from '../../services/helper.js';

export default async function getOnboardingMedia(req, res, next) {
  const logger = container.make('logger');
  const userModel = container.make('models/user');
  try {
    const userId = req.token.sub;
    const userData = await userModel.findById(userId, {
      matchMedia: true,
      transcriptions: {
        where: {
          user: {
            is: {
              id: req.token.sub,
            },
          },
        },
        select: {
          mediaId: true,
          text: true,
          summary: true,
        },
      },
    });
    if (!userData.matchMedia) {
      return res.status(204).send();
    }
    const result = {};

    userData.matchMedia.forEach((media) => {
      const match = userData.transcriptions.filter(
        (t) => t.mediaId === media.id,
      );
      const data = {
        id: media.id,
        url: media.streamUrl,
        title: `${media.category} #${media.count}`,
        category: media.category,
        transcript: match.length > 0 ? match[0].text : null,
        summary: match.length > 0 ? match[0].summary : null,
      };
      if (result[media.category]) {
        result[media.category].push(data);
      } else {
        result[media.category] = [data];
      }
    });
    res.send({
      data: result,
      details: {
        body: null,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (error) {
    logger.error('Error occurred fetching onboarding media. Reason:');
    logger.error(error.stack);
    next(error);
  }
}
