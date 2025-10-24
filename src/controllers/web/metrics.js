import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat.js';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js';
import isToday from 'dayjs/plugin/isToday.js';
import { ObjectId } from 'mongodb';
import container from '../../container.js';
import { getFormattedDate } from '../../services/helper.js';
import { toObjectId } from '../../utils/mongoHelpers.js';
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
  const match = container.make('models/match');
  
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
      RANGE: [1, 'month'],
    };
    const overviewMetric = req.query.overview
      ? req.query.overview.toUpperCase()
      : 'MONTH';
    const dateRanges =
      req.query.startDate && req.query.endDate
        ? {
            $gte: new Date(dayjs(req.query.startDate).toISOString()),
            $lte: new Date(dayjs(req.query.endDate).toISOString()),
          }
        : {
            $gte: new Date(dayjs()
              .subtract(...overviewEnum[overviewMetric])
              .toISOString()),
            $lte: new Date(dayjs().toISOString()),
          };
    
    const userId = toObjectId(req.token.sub);
    if (!userId) {
      return res.status(400).send({
        message: 'Invalid user ID',
        generatedAt: getFormattedDate(),
      });
    }
    
    // Get posts and total count in parallel
    const results = await Promise.all([
      post.findMany(
        {
          userId: userId,
          createdTime: dateRanges,
        },
        {
          _id: 1,
          createdTime: 1,
          views: 1,
          activeHiring: 1,
        },
        -1,
        0,
      ),
      post.count({ userId: userId }),
      match.findMany(
        {
          recruiterId: userId,
        },
        {
          _id: 1,
          postId: 1,
          accepted: 1,
        }
      ),
    ]);
    
    let recruiterPosts = results[0];
    const allRecruiterMatches = results[2];
    
    // Count matches per post
    const matchCountByPost = new Map();
    allRecruiterMatches.forEach(m => {
      const postIdStr = m.postId ? m.postId.toString() : null;
      if (postIdStr) {
        matchCountByPost.set(postIdStr, (matchCountByPost.get(postIdStr) || 0) + 1);
      }
    });
    
    // Filter by TODAY if needed
    if (overviewMetric === 'TODAY') {
      recruiterPosts = recruiterPosts.filter((post) => {
        return dayjs(post.createdTime).isToday();
      });
    }
    
    // Add date formatting based on metric
    if (overviewMetric === 'WEEK') {
      recruiterPosts = recruiterPosts.map((post) => {
        return {
          ...post,
          dateFormat: dayjs(post.createdTime).format('dddd'),
          matchCount: matchCountByPost.get(post._id.toString()) || 0,
        };
      });
    } else if (overviewMetric === 'MONTH' || overviewMetric === 'RANGE') {
      recruiterPosts = recruiterPosts.map((post) => {
        return {
          ...post,
          dateFormat: dayjs(post.createdTime).format('dddd, MMMM Do'),
          matchCount: matchCountByPost.get(post._id.toString()) || 0,
        };
      });
    } else {
      recruiterPosts = recruiterPosts.map((post) => {
        return {
          ...post,
          dateFormat: dayjs(post.createdTime).format('dddd, MMMM Do'),
          matchCount: matchCountByPost.get(post._id.toString()) || 0,
        };
      });
    }
    
    // Calculate metrics
    let totalViews = 0;
    let totalMatches = 0;
    let totalNeedsReview = 0;
    let totalCandidateMatches = 0;
    const seenIds = new Set();
    const dateBreakdown = {};
    
    recruiterPosts.forEach((post) => {
      totalViews += post.views || 0;
      totalMatches += post.matchCount || 0;
      
      // Break metrics down by the date
      if (dateBreakdown[post.dateFormat]) {
        dateBreakdown[post.dateFormat].totalViews += post.views || 0;
        dateBreakdown[post.dateFormat].totalMatches += post.matchCount || 0;
      } else {
        dateBreakdown[post.dateFormat] = {
          totalViews: post.views || 0,
          totalMatches: post.matchCount || 0,
        };
      }
    });
    
    // Count accepted and pending matches
    allRecruiterMatches.forEach((match) => {
      const matchIdStr = match._id.toString();
      if (!seenIds.has(matchIdStr)) {
        totalCandidateMatches += match.accepted ? 1 : 0;
        totalNeedsReview += !match.accepted ? 1 : 0;
        seenIds.add(matchIdStr);
      }
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
            ? getDateRangesIfNoDataFound(dateRanges.$gte, dateRanges.$lte)
            : addMissingDates(dateRanges.$gte, dateRanges.$lte, dateBreakdown),
        totalNeedsReview,
        totalCandidateMatches,
        totalJobs: results[1],
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
