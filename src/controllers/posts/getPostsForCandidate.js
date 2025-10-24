import { ObjectId } from 'mongodb';
import container from '../../container.js';
import {
  createUserAvatarUsingName,
  getFormattedDate,
  shuffleArray,
  skipUndefined,
} from '../../services/helper.js';
import { toObjectId } from '../../utils/mongoHelpers.js';

// For candidates
export default async function getPosts(req, res, next) {
  const logger = container.make('logger');
  const post = container.make('models/post');
  const jobSkill = container.make('models/jobskill');
  const match = container.make('models/match');
  const company = container.make('models/company');
  const user = container.make('models/user');
  const personality = container.make('models/personality');
  const comment = container.make('models/comment');
  const postLike = container.make('models/postlike');
  
  try {
    // Pagination
    const offset = req.query.page * req.query.pageSize;
    const limit = req.query.pageSize;
    
    let jobSkillIdsToNames;
    if (req.body.skills) {
      jobSkillIdsToNames = await jobSkill.findManyOr(
        req.body.skills.map((skillId) => {
          return {
            _id: toObjectId(skillId),
          };
        }),
        { _id: 1, name: 1 },
      );
      if (!jobSkillIdsToNames || jobSkillIdsToNames.length === 0) {
        return res.status(400).send({
          message: 'Job skill IDs provided are not valid.',
        });
      }
      jobSkillIdsToNames = jobSkillIdsToNames.map((skill) => skill.name);
    }
    
    // Get accepted matches for this candidate (to exclude from results)
    const acceptedMatches = await match.findMany(
      {
        candidateId: toObjectId(req.token.sub),
        accepted: true,
      },
      { postId: 1 }
    );
    const acceptedPostIds = acceptedMatches.map(m => m.postId);
    
    // Build MongoDB query
    const mongoQuery = {
      postType: 'JOB',
      archive: false,
    };
    
    // Exclude posts that the candidate has already accepted matches for
    if (acceptedPostIds.length > 0) {
      mongoQuery._id = { $nin: acceptedPostIds };
    }
    
    // Filter by skills if provided
    if (req.body.skills && jobSkillIdsToNames && jobSkillIdsToNames.length > 0) {
      mongoQuery.$or = [
        { requiredSkills: { $in: jobSkillIdsToNames } },
        { optionalSkills: { $in: jobSkillIdsToNames } },
      ];
    }
    
    // Get list of job skills
    const jobSkills = await jobSkill.findMany(
      {
        useCount: { $gt: 0 },
      },
      {
        _id: 1,
        name: 1,
        order: 1,
        useCount: 1,
      },
      limit,
      offset,
      'useCount',
      'desc',
    );
    
    // Get results (posts without nested data)
    const results = await post.findMany(
      mongoQuery,
      {
        _id: 1,
        title: 1,
        description: 1,
        video: 1,
        likes: 1,
        views: 1,
        postType: 1,
        category: 1,
        companyId: 1,
        location: 1,
        industryType: 1,
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
        userId: 1,
        matchCount: 1,
      },
      limit,
      offset,
    );
    
    if (!results || results.length === 0) {
      return res.send({
        data: {
          JOB: [],
          SKILLS: jobSkills.map(s => ({
            id: s._id.toString(),
            name: s.name,
            order: s.order,
            useCount: s.useCount,
          })),
        },
        details: {
          ...req.query,
        },
        generatedAt: getFormattedDate(),
      });
    }
    
    // Collect unique IDs for batch loading
    const companyIds = new Set();
    const userIds = new Set();
    const personalityIds = new Set();
    const postIds = results.map(r => r._id);
    
    results.forEach(result => {
      if (result.companyId) companyIds.add(result.companyId.toString());
      if (result.userId) userIds.add(result.userId.toString());
      if (result.personalityPreferenceIds) {
        result.personalityPreferenceIds.forEach(id => personalityIds.add(id.toString()));
      }
    });
    
    // Load all related data in parallel
    const [companies, users, personalities, comments, postLikes] = await Promise.all([
      companyIds.size > 0 ? company.findMany(
        { _id: { $in: Array.from(companyIds).map(id => new ObjectId(id)) } },
        { _id: 1, name: 1, logo: 1 }
      ) : Promise.resolve([]),
      userIds.size > 0 ? user.findMany(
        { _id: { $in: Array.from(userIds).map(id => new ObjectId(id)) } },
        { _id: 1, name: 1, photo: 1 }
      ) : Promise.resolve([]),
      personalityIds.size > 0 ? personality.findMany(
        { _id: { $in: Array.from(personalityIds).map(id => new ObjectId(id)) } },
        { _id: 1, title: 1, detail: 1 }
      ) : Promise.resolve([]),
      comment.findMany(
        { 
          postId: { $in: postIds },
          deletedTime: { $exists: false }
        },
        { _id: 1, postId: 1, comment: 1, userId: 1 },
        10,
        0
      ),
      postLike.findMany(
        { 
          postId: { $in: postIds },
          userId: toObjectId(req.token.sub)
        },
        { _id: 1, postId: 1 }
      ),
    ]);
    
    // Create lookup maps
    const companyMap = new Map(companies.map(c => [c._id.toString(), c]));
    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    const personalityMap = new Map(personalities.map(p => [p._id.toString(), p]));
    
    // Group comments by postId
    const commentsByPost = {};
    for (const c of comments) {
      const postIdStr = c.postId.toString();
      if (!commentsByPost[postIdStr]) {
        commentsByPost[postIdStr] = [];
      }
      if (commentsByPost[postIdStr].length < 10) {
        const commentUser = userMap.get(c.userId.toString());
        commentsByPost[postIdStr].push({
          comment: c.comment,
          user: {
            name: commentUser?.name || 'Unknown',
            photo: commentUser?.photo?.streamUrl || createUserAvatarUsingName(commentUser?.name || 'Unknown').streamUrl,
          },
        });
      }
    }
    
    // Group post likes by postId
    const likesByPost = new Set(postLikes.map(l => l.postId.toString()));
    
    // Build final results
    const finalResult = {
      JOB: [],
      SKILLS: jobSkills.map(s => ({
        id: s._id.toString(),
        name: s.name,
        order: s.order,
        useCount: s.useCount,
      })),
    };
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const postIdStr = result._id.toString();
      const companyData = result.companyId ? companyMap.get(result.companyId.toString()) : null;
      const userData = result.userId ? userMap.get(result.userId.toString()) : null;
      
      // Get personality preferences
      const personalityPrefs = [];
      if (result.personalityPreferenceIds) {
        for (const pId of result.personalityPreferenceIds) {
          const p = personalityMap.get(pId.toString());
          if (p) {
            personalityPrefs.push({
              title: p.title,
              detail: p.detail,
            });
          }
        }
      }
      
      const formattedResult = {
        id: postIdStr,
        title: result.title,
        description: result.description,
        video: result.video ? result.video.streamUrl : null,
        likes: result.likes,
        views: result.views,
        postType: result.postType,
        category: result.category,
        company: companyData ? {
          id: companyData._id.toString(),
          name: companyData.name,
          logo: companyData.logo?.streamUrl || null,
        } : null,
        location: result.location,
        industryType: result.industryType,
        functionalArea: result.functionalArea,
        activeHiring: result.activeHiring,
        positionType: result.positionType,
        employmentType: result.employmentType,
        positionTitle: result.positionTitle,
        experience: result.experience,
        compensation: result.compensation,
        requiredSkills: result.requiredSkills,
        optionalSkills: result.optionalSkills,
        comments: commentsByPost[postIdStr] || [],
        personalityPreference: personalityPrefs,
        thumbnail: result.thumbnail?.streamUrl || null,
        createdTime: result.createdTime,
        user: undefined,
        didLike: likesByPost.has(postIdStr),
        matchCount: result.matchCount,
      };
      
      finalResult.JOB.push(formattedResult);
    }
    
    // Shuffle contents in array in place
    shuffleArray(finalResult.JOB);
    
    // send results
    res.send({
      data: finalResult,
      details: {
        ...req.query,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (error) {
    logger.error('Error occurred fetching posts. Reason:');
    logger.error(error.stack);
    next(error);
  }
}
