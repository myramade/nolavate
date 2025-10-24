import { ObjectId } from 'mongodb';
import container from '../../container.js';
import { getFormattedDate } from '../../services/helper.js';
import { toObjectId, serializeDocument } from '../../utils/mongoHelpers.js';

export default async function getMatchById(req, res, next) {
  const logger = container.make('logger');
  const match = container.make('models/match');
  const user = container.make('models/user');
  const post = container.make('models/post');
  const company = container.make('models/company');
  const personality = container.make('models/personality');
  const matchMedia = container.make('models/matchmedia');

  try {
    // Convert ID to ObjectId - check if query.id is actually the _id or if it's passed differently
    const matchId = toObjectId(req.query.id);
    
    if (!matchId) {
      return res.status(400).send({
        message: 'Invalid match ID',
        generatedAt: getFormattedDate(),
      });
    }
    
    // Get match document (MongoDB native query)
    const result = await match.findOne({
      _id: matchId,
      accepted: true,
    });
    
    if (!result) {
      return res.status(404).send({
        message: 'Match not found',
        generatedAt: getFormattedDate(),
      });
    }
    
    // Batch load all related data in parallel
    const [candidate, recruiter, postData] = await Promise.all([
      result.candidateId ? user.findById(result.candidateId, { _id: 1, name: 1, photo: 1, personalityKey: 1 }) : null,
      result.recruiterId ? user.findById(result.recruiterId, { _id: 1, name: 1, photo: 1 }) : null,
      result.postId ? post.findById(result.postId, { _id: 1, title: 1, description: 1, video: 1, thumbnail: 1, positionTitle: 1, positionType: 1, employmentType: 1, compensation: 1, companyId: 1 }) : null,
    ]);
    
    // Load nested data (matchMedia, personality, company) in parallel
    const [matchMediaItems, personalityData, companyData] = await Promise.all([
      candidate ? matchMedia.findMany({ userId: candidate._id }, { _id: 1, streamUrl: 1, category: 1 }) : [],
      candidate && candidate.personalityKey ? personality.findOne({ key: candidate.personalityKey }, { _id: 1, key: 1, title: 1, detail: 1 }) : null,
      postData && postData.companyId ? company.findById(postData.companyId, { _id: 1, name: 1, logo: 1 }) : null,
    ]);
    
    // Build formatted response
    const formattedResult = {
      id: result._id.toString(),
      accepted: result.accepted,
      candidate: candidate ? {
        id: candidate._id.toString(),
        name: candidate.name,
        photo: candidate.photo?.streamUrl || null,
        personality: personalityData ? {
          title: personalityData.title,
          detail: personalityData.detail,
        } : null,
      } : null,
      recruiter: recruiter ? {
        id: recruiter._id.toString(),
        name: recruiter.name,
        photo: recruiter.photo?.streamUrl || null,
      } : null,
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
      media: matchMediaItems.map(media => ({
        id: media._id.toString(),
        url: media.streamUrl,
        category: media.category,
      })),
      thumbnail: postData?.thumbnail?.streamUrl || null,
    };
    
    // send response
    return res.send({
      data: formattedResult,
      details: {
        body: req.query,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (err) {
    logger.error('Error occurred fetching match by ID. Reason:');
    logger.error(err.stack);
    next(new Error('Unable to complete request.'));
  }
}
