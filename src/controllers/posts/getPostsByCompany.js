import dayjs from 'dayjs';
import { ObjectId } from 'mongodb';
import container from '../../container.js';
import {
  createUserAvatarUsingName,
  getFormattedDate,
  isEmpty,
  skipUndefined,
} from '../../services/helper.js';
import { toObjectId } from '../../utils/mongoHelpers.js';

export default async function getPostsByCompany(req, res, next) {
  const logger = container.make('logger');
  const post = container.make('models/post');
  const user = container.make('models/user');
  const company = container.make('models/company');
  const personality = container.make('models/personality');
  const comment = container.make('models/comment');
  const postLikes = container.make('models/postlikes');
  
  try {
    const filters = skipUndefined({
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    });
    const offset = req.query.page * req.query.pageSize;
    const limit = req.query.pageSize;
    
    const companyId = toObjectId(req.query.id);
    if (!companyId) {
      return res.status(400).send({
        message: 'Invalid company ID',
        generatedAt: getFormattedDate(),
      });
    }
    
    const currentUserId = toObjectId(req.token.sub);
    if (!currentUserId) {
      return res.status(400).send({
        message: 'Invalid user ID',
        generatedAt: getFormattedDate(),
      });
    }
    
    // Build query
    const query = { companyId: companyId };
    if (!isEmpty(filters)) {
      query.createdTime = {
        $gte: new Date(dayjs(filters.startDate).toISOString()),
        $lte: new Date(dayjs(filters.endDate).toISOString()),
      };
    }
    
    // Get posts
    const posts = await post.findMany(
      query,
      {
        _id: 1,
        title: 1,
        description: 1,
        video: 1,
        thumbnail: 1,
        userId: 1,
        companyId: 1,
        likes: 1,
        views: 1,
        postType: 1,
        category: 1,
        industryType: 1,
        location: 1,
        functionalArea: 1,
        activeHiring: 1,
        positionType: 1,
        employmentType: 1,
        positionTitle: 1,
        experience: 1,
        compensation: 1,
        requiredSkills: 1,
        optionalSkills: 1,
        personalityPreferenceKey: 1,
        createdTime: 1,
        matchCount: 1,
        images: 1,
      },
      limit,
      offset,
      'createdTime',
      'desc'
    );
    
    if (!posts || posts.length === 0) {
      return res.send({
        data: [],
        details: {
          body: req.query,
        },
        generatedAt: getFormattedDate(),
      });
    }
    
    // Collect unique IDs for batch loading
    const userIds = [];
    const companyIds = [];
    const postIds = [];
    const personalityKeys = new Set();
    
    posts.forEach(p => {
      if (p.userId) userIds.push(p.userId);
      if (p.companyId) companyIds.push(p.companyId);
      postIds.push(p._id);
      if (p.personalityPreferenceKey) personalityKeys.add(p.personalityPreferenceKey);
    });
    
    // Batch load all related data
    const [users, companies, personalities, comments, likes] = await Promise.all([
      user.findMany(
        { _id: { $in: userIds } },
        { _id: 1, name: 1, photo: 1 }
      ),
      company.findMany(
        { _id: { $in: companyIds } },
        { _id: 1, name: 1, logo: 1 }
      ),
      personalityKeys.size > 0
        ? personality.findMany(
            { key: { $in: Array.from(personalityKeys) } },
            { _id: 1, key: 1, title: 1, detail: 1 }
          )
        : [],
      comment.findMany(
        {
          postId: { $in: postIds },
          deletedTime: null,
        },
        { _id: 1, postId: 1, comment: 1, userId: 1, createdTime: 1 },
        -1,
        0,
        'createdTime',
        'desc'
      ),
      postLikes.findMany(
        {
          postId: { $in: postIds },
          userId: currentUserId,
        },
        { _id: 1, postId: 1 }
      ),
    ]);
    
    // Create lookup maps
    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    const companyMap = new Map(companies.map(c => [c._id.toString(), c]));
    const personalityMap = new Map(personalities.map(p => [p.key, p]));
    
    // Group comments by postId
    const commentsByPost = new Map();
    comments.forEach(c => {
      const postIdStr = c.postId.toString();
      if (!commentsByPost.has(postIdStr)) {
        commentsByPost.set(postIdStr, []);
      }
      commentsByPost.get(postIdStr).push(c);
    });
    
    // Sort and limit to 10 most recent per post
    commentsByPost.forEach((postComments, postId) => {
      // Sort by createdTime desc (most recent first)
      postComments.sort((a, b) => {
        const timeA = a.createdTime ? new Date(a.createdTime).getTime() : 0;
        const timeB = b.createdTime ? new Date(b.createdTime).getTime() : 0;
        return timeB - timeA;
      });
      // Keep only 10 most recent
      if (postComments.length > 10) {
        commentsByPost.set(postId, postComments.slice(0, 10));
      }
    });
    
    // Group likes by postId
    const likesByPost = new Set(likes.map(l => l.postId.toString()));
    
    // Get comment user IDs for batch loading
    const commentUserIds = [...new Set(comments.map(c => c.userId))];
    const commentUsers = commentUserIds.length > 0
      ? await user.findMany(
          { _id: { $in: commentUserIds } },
          { _id: 1, name: 1, photo: 1 }
        )
      : [];
    const commentUserMap = new Map(commentUsers.map(u => [u._id.toString(), u]));
    
    // Format results
    const results = posts.map(p => {
      const postUser = p.userId ? userMap.get(p.userId.toString()) : null;
      const postCompany = p.companyId ? companyMap.get(p.companyId.toString()) : null;
      const personalityData = p.personalityPreferenceKey ? personalityMap.get(p.personalityPreferenceKey) : null;
      const postComments = commentsByPost.get(p._id.toString()) || [];
      const didLike = likesByPost.has(p._id.toString());
      
      return {
        id: p._id.toString(),
        title: p.title,
        description: p.description,
        video: p.video?.streamUrl || null,
        thumbnail: p.thumbnail?.streamUrl || null,
        canEdit: postUser ? postUser._id.toString() === currentUserId.toString() : false,
        likes: p.likes || 0,
        views: p.views || 0,
        postType: p.postType,
        category: p.category,
        industryType: p.industryType,
        company: postCompany ? {
          id: postCompany._id.toString(),
          name: postCompany.name,
          logo: postCompany.logo?.streamUrl || null,
        } : null,
        location: p.location,
        functionalArea: p.functionalArea,
        activeHiring: p.activeHiring,
        positionType: p.positionType,
        employmentType: p.employmentType,
        positionTitle: p.positionTitle,
        experience: p.experience,
        compensation: p.compensation,
        requiredSkills: p.requiredSkills || [],
        optionalSkills: p.optionalSkills || [],
        personalityPreference: personalityData ? {
          title: personalityData.title,
          detail: personalityData.detail,
        } : null,
        comments: postComments.map(c => {
          const commentUser = c.userId ? commentUserMap.get(c.userId.toString()) : null;
          return {
            comment: c.comment,
            user: commentUser ? {
              name: commentUser.name,
              photo: commentUser.photo?.streamUrl || createUserAvatarUsingName(commentUser.name).streamUrl,
            } : {
              name: 'Unknown',
              photo: createUserAvatarUsingName('Unknown').streamUrl,
            },
          };
        }),
        didLike,
        images: p.images ? p.images.map(img => img.streamUrl) : null,
        createdTime: p.createdTime,
        matchCount: p.matchCount || 0,
      };
    });
    
    // send results
    return res.send({
      data: results,
      details: {
        body: req.query,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (error) {
    logger.error('Error occurred fetching posts by company ID. Reason:');
    logger.error(error.stack);
    next(error);
  }
}
