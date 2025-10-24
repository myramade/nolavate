import { ObjectId } from 'mongodb';
import container from '../../container.js';
import {
  createUserAvatarUsingName,
  getFormattedDate,
} from '../../services/helper.js';
import { toObjectId } from '../../utils/mongoHelpers.js';

export default async function getPostById(req, res, next) {
  const logger = container.make('logger');
  const post = container.make('models/post');
  const user = container.make('models/user');
  const company = container.make('models/company');
  const personality = container.make('models/personality');
  const comment = container.make('models/comment');
  const postLike = container.make('models/postlike');
  
  try {
    // Load post with basic fields
    const result = await post.findById(req.query.id, {
      _id: 1,
      title: 1,
      description: 1,
      video: 1,
      userId: 1,
      likes: 1,
      views: 1,
      postType: 1,
      category: 1,
      industryType: 1,
      companyId: 1,
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
      personalityPreferenceIds: 1,
      thumbnail: 1,
      createdTime: 1,
      matchCount: 1,
    });
    
    if (!result) {
      throw new Error('Post not found by ID.');
    }
    
    const postId = result._id;
    
    // Load all related data in parallel
    const [userData, companyData, personalities, comments, postLikes] = await Promise.all([
      result.userId ? user.findById(result.userId, { _id: 1, name: 1, photo: 1 }) : null,
      result.companyId ? company.findById(result.companyId, { _id: 1, name: 1, logo: 1 }) : null,
      result.personalityPreferenceIds && result.personalityPreferenceIds.length > 0
        ? personality.findMany(
            { _id: { $in: result.personalityPreferenceIds } },
            { _id: 1, title: 1, detail: 1 }
          )
        : [],
      comment.findMany(
        { 
          postId: postId,
          deletedTime: { $exists: false }
        },
        { _id: 1, comment: 1, userId: 1 },
        10,
        0
      ),
      postLike.findMany(
        { 
          postId: postId,
          userId: toObjectId(req.token.sub)
        },
        { _id: 1 }
      ),
    ]);
    
    // Load comment users if we have comments
    let commentUsers = [];
    if (comments && comments.length > 0) {
      const commentUserIds = [...new Set(comments.map(c => c.userId))];
      commentUsers = await user.findMany(
        { _id: { $in: commentUserIds } },
        { _id: 1, name: 1, photo: 1 }
      );
    }
    const commentUserMap = new Map(commentUsers.map(u => [u._id.toString(), u]));
    
    // Build response
    const response = {
      id: result._id.toString(),
      title: result.title,
      description: result.description,
      video: result.video ? result.video.streamUrl : null,
      user: undefined,
      likes: result.likes,
      views: result.views,
      postType: result.postType,
      category: result.category,
      industryType: result.industryType,
      company: companyData ? {
        id: companyData._id.toString(),
        name: companyData.name,
        logo: companyData.logo?.streamUrl || null,
      } : null,
      location: result.location,
      functionalArea: result.functionalArea,
      activeHiring: result.activeHiring,
      positionType: result.positionType,
      employmentType: result.employmentType,
      positionTitle: result.positionTitle,
      experience: result.experience,
      compensation: result.compensation,
      requiredSkills: result.requiredSkills,
      optionalSkills: result.optionalSkills,
      personalityPreference: personalities.map(p => ({
        title: p.title,
        detail: p.detail,
      })),
      thumbnail: result.thumbnail?.streamUrl || null,
      comments: comments.map(c => {
        const commentUser = commentUserMap.get(c.userId.toString());
        return {
          comment: c.comment,
          user: {
            name: commentUser?.name || 'Unknown',
            photo: commentUser?.photo?.streamUrl || createUserAvatarUsingName(commentUser?.name || 'Unknown').streamUrl,
          },
        };
      }),
      didLike: postLikes && postLikes.length > 0,
      createdTime: result.createdTime,
      matchCount: result.matchCount,
      images: null,
    };
    
    // send results
    return res.send({
      data: response,
      details: {
        body: req.query,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (error) {
    logger.error('Error occurred fetching posts. Reason:');
    logger.error(error.stack);
    next(error);
  }
}
