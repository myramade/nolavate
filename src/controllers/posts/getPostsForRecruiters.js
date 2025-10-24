import { ObjectId } from 'mongodb';
import container from '../../container.js';
import {
  createUserAvatarUsingName,
  getFormattedDate,
  shuffleArray,
  skipUndefined,
} from '../../services/helper.js';
import { toObjectId } from '../../utils/mongoHelpers.js';

const createProfileSummary = (resumeData) => {
  if (!resumeData) {
    return null;
  }
  if (resumeData.summary) {
    return resumeData.summary;
  }
  return Object.values(resumeData).join(' ');
};

// For recruiters
export default async function getPostsForRecruiters(req, res, next) {
  const logger = container.make('logger');
  const user = container.make('models/user');
  const transcription = container.make('models/transcription');
  const jobSkill = container.make('models/jobskill');
  const match = container.make('models/match');
  const personality = container.make('models/personality');
  
  try {
    // Check if database is connected
    if (!user) {
      return res.status(503).send({
        error: 'Database offline',
        message: 'Unable to retrieve candidate prospects. The database is currently offline. Please try again later.',
      });
    }
    
    // Pagination
    const offset = req.query.page * req.query.pageSize;
    const limit = req.query.pageSize;
    
    let jobSkillIdsToNames;
    if (req.body && req.body.skills && jobSkill) {
      try {
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
      } catch (dbError) {
        logger.warn('Job skill lookup failed, continuing without skill filter:', dbError.message);
        jobSkillIdsToNames = null;
      }
    }
    
    // Get ALL recruiter matches (exclude all matched candidates, regardless of accepted status)
    const existingMatches = await match.findMany(
      {
        recruiterId: toObjectId(req.token.sub),
      },
      { candidateId: 1 }
    );
    const matchedCandidateIds = existingMatches.map(m => m.candidateId);
    
    // Build MongoDB query
    const mongoQuery = {
      _id: { 
        $ne: toObjectId(req.token.sub),
        $nin: matchedCandidateIds.length > 0 ? matchedCandidateIds : []
      },
      roleSubtype: { $ne: 'RECRUITER' },
      role: { $ne: 'TESTER' },
      matchMedia: { $exists: true, $ne: [] }, // Not empty
    };
    
    // Filter by skills if provided
    if (req.body && req.body.skills && jobSkillIdsToNames && jobSkillIdsToNames.length > 0) {
      mongoQuery.skills = { $in: jobSkillIdsToNames };
    }
    
    // Get results
    let results = [];
    try {
      results = await user.findMany(
        mongoQuery,
        {
          _id: 1,
          email: 1,
          phone: 1,
          phoneCountryCode: 1,
          name: 1,
          photo: 1,
          matchMedia: 1,
          roleSubtype: 1,
          employmentStatus: 1,
          employmentTitle: 1,
          personalityId: 1,
          resumeData: 1,
          industry: 1,
          skills: 1,
        },
        limit,
        offset,
        'createdTime',
        'desc',
      );
    } catch (dbError) {
      logger.error('User query failed:', dbError.message);
      return res.status(503).send({
        error: 'Database offline',
        message: 'Unable to retrieve candidate prospects. The database is currently experiencing issues. Please try again later.',
      });
    }
    
    // Get list of job skills
    let jobSkills = [];
    if (jobSkill) {
      try {
        jobSkills = await jobSkill.findMany(
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
      } catch (dbError) {
        logger.warn('Job skills lookup failed, continuing with empty list:', dbError.message);
      }
    }
    
    // Collect personality IDs
    const personalityIds = new Set();
    results.forEach(r => {
      if (r.personalityId) {
        personalityIds.add(r.personalityId.toString());
      }
    });
    
    // Load personalities
    let personalities = [];
    if (personalityIds.size > 0 && personality) {
      try {
        personalities = await personality.findMany(
          { _id: { $in: Array.from(personalityIds).map(id => new ObjectId(id)) } },
          { _id: 1, title: 1, detail: 1 }
        );
      } catch (dbError) {
        logger.warn('Personality lookup failed, continuing without personalities:', dbError.message);
      }
    }
    const personalityMap = new Map(personalities.map(p => [p._id.toString(), p]));
    
    // Get match media transcriptions
    let transcripts = [];
    if (transcription && results.length > 0) {
      try {
        const userIds = results.map(u => u._id);
        transcripts = await transcription.findMany(
          { userId: { $in: userIds } },
          { _id: 1, userId: 1, text: 1, mediaId: 1 }
        );
      } catch (dbError) {
        logger.warn('Transcription lookup failed, continuing without transcripts:', dbError.message);
      }
    }
    
    // Group transcripts by user ID and media ID
    const transcriptMap = {};
    transcripts.forEach(t => {
      const key = `${t.userId.toString()}_${t.mediaId}`;
      transcriptMap[key] = t.text;
    });
    
    // Return results by postType
    // JOB will never be populated for this response, but we
    // need to make its compatible with the getPosts (for candidates) endpoint
    const finalResult = {
      SOCIAL: [],
      jobSkills: jobSkills.map(s => ({
        id: s._id.toString(),
        name: s.name,
        order: s.order,
        useCount: s.useCount,
      })),
    };
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      
      // Get personality
      const personalityData = result.personalityId ? personalityMap.get(result.personalityId.toString()) : null;
      
      // Format match media with transcripts
      const matchMedia = (result.matchMedia || []).map(media => {
        const transcriptKey = `${result._id.toString()}_${media.id}`;
        return {
          id: media.id,
          streamUrl: media.streamUrl,
          category: media.category,
          text: transcriptMap[transcriptKey] || undefined,
        };
      });
      
      const formattedResult = {
        id: result._id.toString(),
        email: result.email,
        phone: `${result.phoneCountryCode || ''}${result.phone}`,
        name: result.name.split(' ')[0], // Show first name only for non-matches
        photo: result.photo?.streamUrl || createUserAvatarUsingName(result.name).streamUrl,
        thumbnail: result.photo?.streamUrl || createUserAvatarUsingName(result.name).streamUrl,
        matchMedia: matchMedia,
        roleSubtype: result.roleSubtype,
        employmentStatus: result.employmentStatus,
        employmentTitle: result.employmentTitle,
        personality: personalityData ? {
          title: personalityData.title,
          detail: personalityData.detail,
        } : null,
        profileSummary: createProfileSummary(result.resumeData),
        industry: result.industry,
        skills: result.skills,
      };
      
      finalResult.SOCIAL.push(formattedResult);
    }
    
    // Shuffle array in place
    if (req.query.shuffle) {
      shuffleArray(finalResult.SOCIAL);
    }
    
    // send results
    res.send({
      data: finalResult,
      details: {
        ...req.query,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (error) {
    logger.error(
      'Error occurred fetching posts (users) for recruiters. Reason:',
    );
    logger.error(error.stack);
    next(error);
  }
}
