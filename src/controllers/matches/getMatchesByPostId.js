import { ObjectId } from 'mongodb';
import container from '../../container.js';
import { getFormattedDate } from '../../services/helper.js';
import { toObjectId } from '../../utils/mongoHelpers.js';

export default async function getMatchByPostId(req, res, next) {
  const logger = container.make('logger');
  const match = container.make('models/match');
  const user = container.make('models/user');
  const post = container.make('models/post');
  const company = container.make('models/company');
  const personality = container.make('models/personality');
  const matchMedia = container.make('models/matchmedia');

  try {
    // Convert post ID to ObjectId
    const postId = toObjectId(req.query.id);
    
    if (!postId) {
      return res.status(400).send({
        message: 'Invalid post ID',
        generatedAt: getFormattedDate(),
      });
    }
    
    // MongoDB query: Find all accepted matches for this post
    const matches = await match.findMany(
      {
        postId: postId,
        accepted: true,
      },
      {},
      -1,
      0,
      'createdTime',
      'desc'
    );
    
    if (!matches || matches.length === 0) {
      return res.send({
        data: [],
        details: {
          body: req.query,
        },
        generatedAt: getFormattedDate(),
      });
    }
    
    // Collect unique IDs for batch loading (keep as ObjectIds)
    const candidateIds = [];
    const recruiterIds = [];
    const postIds = [];
    
    matches.forEach(m => {
      if (m.candidateId) candidateIds.push(m.candidateId);
      if (m.recruiterId) recruiterIds.push(m.recruiterId);
      if (m.postId) postIds.push(m.postId);
    });
    
    // Batch load users (candidates and recruiters)
    const [users, posts] = await Promise.all([
      user.findMany(
        { _id: { $in: [...candidateIds, ...recruiterIds] } },
        { _id: 1, name: 1, photo: 1, personalityKey: 1, employmentTitle: 1, skills: 1 }
      ),
      post.findMany(
        { _id: { $in: postIds } },
        { _id: 1, title: 1, description: 1, video: 1, thumbnail: 1, positionTitle: 1, positionType: 1, employmentType: 1, compensation: 1, companyId: 1 }
      ),
    ]);
    
    // Create user and post lookup maps
    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    const postMap = new Map(posts.map(p => [p._id.toString(), p]));
    
    // Collect personality keys and company IDs for second batch
    const personalityKeys = new Set();
    const companyIds = [];
    users.forEach(u => { if (u.personalityKey) personalityKeys.add(u.personalityKey); });
    posts.forEach(p => { if (p.companyId) companyIds.push(p.companyId); });
    
    // Batch load personalities, companies, and match media
    const [personalities, companies, allMatchMedia] = await Promise.all([
      personalityKeys.size > 0 
        ? personality.findMany({ key: { $in: Array.from(personalityKeys) } }, { _id: 1, key: 1, title: 1, detail: 1 })
        : [],
      companyIds.length > 0
        ? company.findMany({ _id: { $in: companyIds } }, { _id: 1, name: 1, logo: 1 })
        : [],
      candidateIds.length > 0
        ? matchMedia.findMany({ userId: { $in: candidateIds } }, { _id: 1, userId: 1, streamUrl: 1, category: 1 })
        : [],
    ]);
    
    // Create lookup maps
    const personalityMap = new Map(personalities.map(p => [p.key, p]));
    const companyMap = new Map(companies.map(c => [c._id.toString(), c]));
    
    // Group matchMedia by userId
    const mediaByUser = new Map();
    allMatchMedia.forEach(media => {
      const userId = media.userId.toString();
      if (!mediaByUser.has(userId)) {
        mediaByUser.set(userId, []);
      }
      mediaByUser.get(userId).push(media);
    });
    
    // Build formatted results with filtering
    const formattedResults = [];
    
    for (const matchDoc of matches) {
      const candidate = matchDoc.candidateId ? userMap.get(matchDoc.candidateId.toString()) : null;
      const recruiter = matchDoc.recruiterId ? userMap.get(matchDoc.recruiterId.toString()) : null;
      const postData = matchDoc.postId ? postMap.get(matchDoc.postId.toString()) : null;
      
      // Skip if missing candidate or recruiter
      if (!candidate || !recruiter) {
        continue;
      }
      
      // Get candidate's match media
      const candidateMedia = mediaByUser.get(candidate._id.toString()) || [];
      
      // Filter: Candidate must have at least one INFO category media (intro video)
      const hasIntroMedia = candidateMedia.some(media => media.category === 'INFO');
      if (!hasIntroMedia) {
        continue;
      }
      
      // Load personality and company data
      const personalityData = candidate.personalityKey ? personalityMap.get(candidate.personalityKey) : null;
      const companyData = postData && postData.companyId ? companyMap.get(postData.companyId.toString()) : null;
      
      // Format the result
      formattedResults.push({
        id: matchDoc._id.toString(),
        accepted: matchDoc.accepted,
        candidate: {
          id: candidate._id.toString(),
          name: candidate.name,
          photo: candidate.photo?.streamUrl || null,
          personality: personalityData ? {
            title: personalityData.title,
            detail: personalityData.detail,
          } : null,
          employmentTitle: candidate.employmentTitle,
          skills: candidate.skills || [],
        },
        recruiter: {
          id: recruiter._id.toString(),
          name: recruiter.name,
          photo: recruiter.photo?.streamUrl || null,
        },
        post: postData ? {
          id: postData._id.toString(),
          title: postData.title,
          description: postData.description,
          video: postData.video?.streamUrl || null,
          thumbnail: postData.thumbnail?.streamUrl || null,
          positionTitle: postData.positionTitle,
          positionType: postData.positionType,
          employmentType: postData.employmentType,
          compensation: postData.compensation,
        } : null,
        company: companyData ? {
          id: companyData._id.toString(),
          name: companyData.name,
          logo: companyData.logo?.streamUrl || null,
        } : null,
        media: candidateMedia.map(media => ({
          id: media._id.toString(),
          url: media.streamUrl,
          category: media.category,
        })),
        thumbnail: postData?.thumbnail?.streamUrl || null,
      });
    }
    
    // send response
    return res.send({
      data: formattedResults,
      details: {
        body: req.query,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (err) {
    logger.error('Error occurred fetching matches by post ID. Reason:');
    logger.error(err.stack);
    next(new Error('Unable to complete request.'));
  }
}
