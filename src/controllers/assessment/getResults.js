import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat.js';
import container from '../../container.js';
import HttpError from '../../errors/HttpError.js';
import { getFormattedDate, skipUndefined } from '../../services/helper.js';
dayjs.extend(advancedFormat);

export default async function getResults(req, res, next) {
  const logger = container.make('logger');
  const assessment = container.make('models/assessment');
  try {
    const result = await assessment.findFirst(
      {
        user: {
          is: {
            id: req.token.sub,
          },
        },
      },
      {
        id: true,
        isBuildingPersonalityProfile: true,
        user: {
          select: {
            id: true,
            resumeData: true,
          },
        },
        response: {
          select: {
            questionId: true,
            question: true,
            answer: {
              select: {
                id: true,
                text: true,
              },
            },
          },
        },
        personality: {
          select: {
            title: true,
            detail: true,
            strengths: true,
            values: true,
            recommendedJobs: true,
            companyCulture: true,
          },
        },
        createdTime: true,
      },
    );
    if (!result) {
      throw new HttpError('User has not taken the assessment.', 422);
    }
    let message = 'Assessment has been scored!';
    if (result.isBuildingPersonalityProfile) {
      message = 'Score is being calculated.';
    }
    if (result.errorWhileCalculating) {
      message =
        'Error occurred while calculating score. The team has been notified.';
    }
    // Remove null responses from result.response
    result.response = skipUndefined(result.response, true);
    // Human readable creation time
    result.takenAt = dayjs(result.createdTime).format('dddd, MMMM Do YYYY');
    result.createdTime = undefined;
    if (!result.user.resumeData || !result.user.resumeData.summary) {
      result.user.resumeData = {
        ...(result.user.resumeData ? result.user.resumeData : {}),
        summary:
          'Our AI is still learning you. Come back later for finalized results.',
      };
    }
    // Send response
    res.send({
      data: result,
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
