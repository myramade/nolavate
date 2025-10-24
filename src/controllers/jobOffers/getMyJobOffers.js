import { ObjectId } from 'mongodb';
import container from '../../container.js';
import { getFormattedDate } from '../../services/helper.js';
import { toObjectId } from '../../utils/mongoHelpers.js';

export default async function getMyJobOffers(req, res, next) {
  const logger = container.make('logger');
  const jobOffer = container.make('models/joboffer');
  const user = container.make('models/user');
  const post = container.make('models/post');
  const company = container.make('models/company');
  
  // Determine which field to filter by based on user role
  const fieldName = req.token.roleSubtype === 'CANDIDATE' ? 'candidateId' : 'recruiterId';
  const userId = toObjectId(req.token.sub);
  
  // Pagination
  const offset = req.query.page * req.query.pageSize;
  const limit = req.query.pageSize;
  
  try {
    // MongoDB query with direct field comparison
    const results = await jobOffer.findMany(
      {
        [fieldName]: userId
      },
      {
        _id: 1,
        postId: 1,
        candidateId: 1,
        recruiterId: 1,
        companyId: 1,
        salary: 1,
        currency: 1,
        employmentType: 1,
        location: 1,
        status: 1,
        startDate: 1,
        createdTime: 1,
      },
      limit,
      offset,
    );
    
    if (!results || results.length === 0) {
      return res.send({
        data: [],
        details: {
          body: req.query,
        },
        generatedAt: getFormattedDate(),
      });
    }
    
    // Collect unique IDs for batch loading
    const userIds = new Set();
    const postIds = new Set();
    const companyIds = new Set();
    
    results.forEach(offer => {
      if (offer.candidateId) userIds.add(offer.candidateId.toString());
      if (offer.recruiterId) userIds.add(offer.recruiterId.toString());
      if (offer.postId) postIds.add(offer.postId.toString());
      if (offer.companyId) companyIds.add(offer.companyId.toString());
    });
    
    // Load all related data in parallel
    const [users, posts, companies] = await Promise.all([
      user.findMany({ 
        _id: { $in: Array.from(userIds).map(id => new ObjectId(id)) }
      }, { _id: 1, name: 1, photo: 1 }),
      post.findMany({ 
        _id: { $in: Array.from(postIds).map(id => new ObjectId(id)) }
      }, { _id: 1, title: 1 }),
      company.findMany({ 
        _id: { $in: Array.from(companyIds).map(id => new ObjectId(id)) }
      }, { _id: 1, name: 1, logo: 1 })
    ]);
    
    // Create lookup maps
    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    const postMap = new Map(posts.map(p => [p._id.toString(), p]));
    const companyMap = new Map(companies.map(c => [c._id.toString(), c]));
    
    // Build response with loaded relations
    const response = results.map(offer => {
      const candidate = offer.candidateId ? userMap.get(offer.candidateId.toString()) : null;
      const recruiter = offer.recruiterId ? userMap.get(offer.recruiterId.toString()) : null;
      const postData = offer.postId ? postMap.get(offer.postId.toString()) : null;
      const companyData = offer.companyId ? companyMap.get(offer.companyId.toString()) : null;
      
      return {
        id: offer._id.toString(),
        post: postData ? {
          id: postData._id.toString(),
          title: postData.title,
        } : null,
        candidate: candidate ? {
          id: candidate._id.toString(),
          name: candidate.name,
          photo: candidate.photo?.streamUrl || null,
        } : null,
        recruiter: recruiter ? {
          id: recruiter._id.toString(),
          name: recruiter.name,
          photo: recruiter.photo?.streamUrl || null,
        } : null,
        company: companyData ? {
          id: companyData._id.toString(),
          name: companyData.name,
          logo: companyData.logo?.streamUrl || null,
        } : null,
        salary: offer.salary,
        currency: offer.currency,
        employmentType: offer.employmentType,
        location: offer.location,
        status: offer.status,
        startDate: offer.startDate,
        createdTime: offer.createdTime,
      };
    });
    
    // send response
    res.send({
      data: response,
      details: {
        body: req.query,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (err) {
    logger.error('Unable to get job offers. Reason:');
    logger.error(err.stack);
    next(new Error('Unable to complete request.'));
  }
}
