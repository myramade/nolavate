import dayjs from 'dayjs';
import { ObjectId } from 'mongodb';
import container from '../../container.js';
import { getFormattedDate, skipUndefined } from '../../services/helper.js';
import { toObjectId, serializeDocument } from '../../utils/mongoHelpers.js';

export default async function createJobOffer(req, res, next) {
  const logger = container.make('logger');
  const jobOffer = container.make('models/joboffer');
  const notifications = container.make('models/notification');
  const post = container.make('models/post');
  const user = container.make('models/user');
  const company = container.make('models/company');

  try {
    // Verify post exists and get company ID
    const getPostResult = await post.findById(req.body.postId);
    if (!getPostResult) {
      return res.status(400).send({
        message: 'Post not found with postId provided.',
      });
    }
    
    // Convert IDs to ObjectId
    const postId = toObjectId(req.body.postId);
    const candidateId = toObjectId(req.body.candidateId);
    const recruiterId = toObjectId(req.token.sub);
    const companyId = toObjectId(getPostResult.companyId);
    
    // Create job offer with direct ObjectId fields (MongoDB native syntax)
    const result = await jobOffer.create(
      skipUndefined({
        postId: postId,
        candidateId: candidateId,
        recruiterId: recruiterId,
        companyId: companyId,
        salary: req.body.salary,
        currency: req.body.currency,
        employmentType: req.body.employmentType,
        location: req.body.location,
        startDate: dayjs(req.body.startDate).toISOString(),
        status: 'OFFERED',
        createdTime: new Date(),
      })
    );
    
    // Load related data separately
    const [candidate, recruiter, companyData] = await Promise.all([
      user.findById(candidateId, { _id: 1, name: 1, photo: 1 }),
      user.findById(recruiterId, { _id: 1, name: 1, photo: 1 }),
      company.findById(companyId, { _id: 1, name: 1, logo: 1 })
    ]);
    
    // Send notification to candidate
    await notifications.create({
      forUserId: candidateId,
      fromUserId: recruiterId,
      type: 'JOBOFFER',
      jobOfferId: result._id,
      message: `${recruiter?.name || 'A recruiter'} has offered you a job at ${companyData?.name || 'a company'}!`,
      createdTime: new Date(),
    });
    
    // Build response with loaded relations
    const response = {
      id: result._id.toString(),
      candidate: {
        id: candidate._id.toString(),
        name: candidate.name,
        photo: candidate.photo?.streamUrl || null,
      },
      recruiter: {
        id: recruiter._id.toString(),
        name: recruiter.name,
        photo: recruiter.photo?.streamUrl || null,
      },
      company: {
        id: companyData._id.toString(),
        name: companyData.name,
        logo: companyData.logo?.streamUrl || null,
      },
      status: result.status,
      startDate: result.startDate,
      salary: result.salary,
      currency: result.currency,
      employmentType: result.employmentType,
      location: result.location,
    };
    
    // send response
    res.send({
      data: response,
      details: {
        body: req.body,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (err) {
    logger.error('Unable to create job offer. Reason:');
    logger.error(err.stack);
    next(new Error('Unable to complete request.'));
  }
}
