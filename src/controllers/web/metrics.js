import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat.js';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js';
import isToday from 'dayjs/plugin/isToday.js';
import container from '../../container.js';
import { getFormattedDate } from '../../services/helper.js';
dayjs.extend(isToday);
dayjs.extend(advancedFormat);
dayjs.extend(isSameOrBefore);

const getDateRangesIfNoDataFound = (startDate, endDate) => {
  const dates = {};
  let currentDay = dayjs(startDate);
  while (currentDay.isSameOrBefore(dayjs(endDate), 'day')) {
    dates[currentDay.format('dddd, MMMM Do')] = {
      totalViews: 0,
      totalMatches: 0,
    };
    currentDay = currentDay.add(1, 'day');
  }
  return dates;
};

const addMissingDates = (startDate, endDate, databaseDates) => {
  const dates = getDateRangesIfNoDataFound(startDate, endDate);
  for (const date of Object.keys(dates)) {
    if (!databaseDates[date]) {
      databaseDates[date] = dates[date];
    }
  }
  return databaseDates;
};

export default async function getMetrics(req, res, next) {
  const logger = container.make('logger');
  const post = container.make('models/post');
  try {
    if (req.query.startDate && req.query.endDate && req.query.overview) {
      return res.status(400).send({
        message: 'Must provide startDate and endDate or overview, not both.',
      });
    }
    if (
      (req.query.startDate && !req.query.endDate) ||
      (!req.query.startDate && req.query.endDate)
    ) {
      return res.status(400).send({
        message: 'Must provide startDate and endDate together.',
      });
    }
    const overviewEnum = {
      TODAY: [1, 'day'],
      WEEK: [1, 'week'],
      MONTH: [1, 'month'],
    };
    const overviewMetric = req.query.overview
      ? req.query.overview.toUpperCase()
      : 'RANGE';
    const dateRanges =
      req.query.startDate && req.query.endDate
        ? {
            gte: dayjs(req.query.startDate).toISOString(),
            lte: dayjs(req.query.endDate).toISOString(),
          }
        : {
            gte: dayjs()
              .subtract(...overviewEnum[overviewMetric])
              .toISOString(),
            lte: dayjs().toISOString(),
          };
    // Matches
    const results = await Promise.all([
      post.findMany(
        {
          user: {
            is: {
              id: req.token.sub,
            },
          },
          createdTime: dateRanges,
        },
        {
          createdTime: true,
          views: true,
          activeHiring: true,
          _count: {
            select: {
              matches: true,
            },
          },
          user: {
            select: {
              recruiterMatches: {
                where: {
                  recruiterId: req.token.sub,
                },
                skip: 0,
                take: -1,
                select: {
                  id: true,
                  accepted: true,
                },
              },
            },
          },
        },
        -1,
        0,
      ),
      post.count('id'),
    ]);
    let recruiterPosts = results[0];
    if (overviewMetric === 'TODAY') {
      recruiterPosts = recruiterPosts.filter((post) => {
        return dayjs(post.createdTime).isToday();
      });
    }
    if (overviewMetric === 'WEEK') {
      recruiterPosts = recruiterPosts.map((post) => {
        return {
          ...post,
          dateFormat: dayjs(post.createdTime).format('dddd'),
        };
      });
    }
    if (overviewMetric === 'MONTH') {
      recruiterPosts = recruiterPosts.map((post) => {
        return {
          ...post,
          dateFormat: dayjs(post.createdTime).format('dddd, MMMM Do'),
        };
      });
    }
    if (overviewMetric === 'RANGE') {
      recruiterPosts = recruiterPosts.map((post) => {
        return {
          ...post,
          dateFormat: dayjs(post.createdTime).format('dddd, MMMM Do'),
        };
      });
    }
    let totalViews = 0;
    let totalMatches = 0;
    let totalNeedsReview = 0;
    let totalCandidateMatches = 0;
    const seenIds = new Set();
    const dateBreakdown = {};
    recruiterPosts.forEach((post) => {
      totalViews += post.views;
      totalMatches += post._count.matches;
      // Break metrics down by the date
      if (dateBreakdown[post.dateFormat]) {
        dateBreakdown[post.dateFormat].totalViews += post.views;
        dateBreakdown[post.dateFormat].totalMatches += post._count.matches;
      } else {
        dateBreakdown[post.dateFormat] = {
          totalViews: post.views,
          totalMatches: post._count.matches,
        };
      }
      // Not performant at all, but I'm at work coding when i shouldn't be so this is the result
      post.user.recruiterMatches.forEach((match) => {
        if (!seenIds.has(match.id)) {
          totalCandidateMatches += match.accepted ? 1 : 0;
          totalNeedsReview += !match.accepted ? 1 : 0;
          seenIds.add(match.id);
        }
      });
    });
    const totalActiveJobs = recruiterPosts.filter(
      (post) => post.activeHiring === true,
    ).length;
    res.send({
      data: {
        [overviewMetric.toLowerCase()]: {
          totalViews,
          totalMatches,
        },
        dates:
          Object.keys(dateBreakdown).length === 0
            ? getDateRangesIfNoDataFound(dateRanges.gte, dateRanges.lte)
            : addMissingDates(dateRanges.gte, dateRanges.lte, dateBreakdown),
        totalNeedsReview,
        totalCandidateMatches,
        totalJobs: results[1]._count ? results[1]._count.id : 0,
        totalActiveJobs,
      },
      details: {
        body: req.query,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (err) {
    logger.error('Error occurred fetching metrics. Reason:');
    logger.error(err.stack);
    next(err);
  }
}
