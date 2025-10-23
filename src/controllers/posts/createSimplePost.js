import ObjectID from 'bson-objectid';
import container from '../../container.js';
import { ObjectId } from 'mongodb';
import {
  getFormattedDate,
  skipUndefined,
} from '../../services/helper.js';

export default async function createSimplePost(req, res, next) {
  const logger = container.make('logger');
  const post = container.make('models/post');
  const user = container.make('models/user');

  try {
    if (!user.db) {
      return res.status(503).send({
        message: 'Database not connected. Job creation requires database connection.',
        details: {
          note: 'This feature works with MongoDB connection. Please connect to the production database.',
        },
      });
    }

    if (!req.body.positionTitle || !req.body.description) {
      return res.status(400).send({
        message: 'Position title and description are required.',
      });
    }

    // Get user document with company info
    const userDocument = await user.findById(new ObjectId(req.token.sub));

    if (!userDocument) {
      return res.status(404).send({
        message: 'User not found.',
      });
    }

    if (!userDocument.employerId && req.token.roleSubtype === 'RECRUITER') {
      return res.status(400).send({
        message: 'Only recruiters with a company can create job posts. Please create your company profile first.',
      });
    }

    const requiredSkills = req.body.requiredSkills 
      ? req.body.requiredSkills.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    
    const optionalSkills = req.body.optionalSkills 
      ? req.body.optionalSkills.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const parseValidNumber = (value) => {
      if (value === undefined || value === null || value === '') return undefined;
      
      if (typeof value === 'number') {
        return Number.isFinite(value) && value >= 0 ? value : undefined;
      }
      
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '' || !/^\d+$/.test(trimmed)) return undefined;
        const parsed = parseInt(trimmed, 10);
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
      }
      
      return undefined;
    };

    const minSalary = parseValidNumber(req.body.minSalary);
    const maxSalary = parseValidNumber(req.body.maxSalary);
    const compensationData = (minSalary !== undefined || maxSalary !== undefined) ? {
      min: minSalary,
      max: maxSalary,
      currency: req.body.currency || 'USD',
    } : undefined;

    // Create post with MongoDB syntax
    const postData = skipUndefined({
      title: req.body.positionTitle,
      positionTitle: req.body.positionTitle,
      description: req.body.description,
      postType: 'JOB',
      userId: new ObjectId(req.token.sub),
      companyId: userDocument.employerId ? new ObjectId(userDocument.employerId) : undefined,
      location: req.body.location ? [req.body.location] : undefined,
      employmentType: req.body.employmentType || undefined,
      compensation: compensationData,
      requiredSkills: requiredSkills.length > 0 ? requiredSkills : undefined,
      optionalSkills: optionalSkills.length > 0 ? optionalSkills : undefined,
      experienceLevel: req.body.experienceLevel || undefined,
      educationLevel: req.body.educationLevel || undefined,
      benefits: req.body.benefits ? req.body.benefits.split(',').map(b => b.trim()).filter(Boolean) : undefined,
      applicationUrl: req.body.applicationUrl || undefined,
      views: 0,
      likes: 0,
      activeHiring: true,
      createdTime: new Date(),
    });

    const result = await post.create(postData);

    res.send({
      data: {
        id: result._id,
        title: result.title,
        positionTitle: result.positionTitle,
        description: result.description,
        location: result.location,
        employmentType: result.employmentType,
        compensation: result.compensation,
        createdTime: result.createdTime,
      },
      message: 'Job post created successfully!',
      details: {
        userId: req.token.sub,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (error) {
    logger.error('Error occurred creating simple post. Reason:');
    logger.error(error.stack);
    next(new Error('Unable to create job post. Please try again.'));
  }
}
