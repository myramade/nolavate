import { ObjectId } from 'mongodb';
import container from '../../container.js';
import {
  getFormattedDate,
  isHexId,
  skipUndefined,
  toTitleCase,
} from '../../services/helper.js';
import { serializeDocument } from '../../utils/mongoHelpers.js';

const handleSkills = async (req) => {
  let requiredSkills = [];
  let optionalSkills = [];
  // New skills to be created - these should be strings in title case
  let requiredNonHexIds = [];
  let optionalNonHexIds = [];
  let nonHexIds = [];
  let allSkills = [];
  if (req.body.requiredSkills) {
    requiredSkills = req.body.requiredSkills;
    if (requiredSkills.length > 4) {
      return {
        skills: null,
        sError: 'Required skills cannot exceed 4.',
      };
    }
    allSkills = allSkills.concat(
      requiredSkills.filter((skill) => isHexId(skill)),
    );
    requiredNonHexIds = requiredNonHexIds.concat(
      requiredSkills.filter((skill) => !isHexId(skill)),
    );
  }
  if (req.body.optionalSkills) {
    optionalSkills = req.body.optionalSkills;
    if (requiredSkills.length > 4) {
      return {
        skills: null,
        sError: 'Optional skills cannot exceed 4.',
      };
    }
    allSkills = allSkills.concat(
      optionalSkills.filter((skill) => isHexId(skill)),
    );
    optionalNonHexIds = optionalNonHexIds.concat(
      optionalSkills.filter((skill) => !isHexId(skill)),
    );
  }
  if (requiredSkills.length > 0 || optionalSkills.length > 0) {
    allSkills = Array.from(new Set(allSkills));
    nonHexIds = Array.from(
      new Set(requiredNonHexIds.concat(optionalNonHexIds)),
    );
    const jobSkillIdsToNames = await container
      .make('models/jobskill')
      .findManyOr(
        allSkills
          .map((skillId) => {
            return {
              id: skillId,
            };
          })
          .concat(
            nonHexIds.map((nonHexId) => {
              return {
                name: nonHexId,
              };
            }),
          ),
        { id: true, name: true },
      );
    if (jobSkillIdsToNames.length === 0 && nonHexIds.length === 0) {
      return {
        skills: null,
        sError: 'Job skill IDs provided are not valid.',
      };
    }
    // Create new skills
    if (
      nonHexIds.length > 0 &&
      jobSkillIdsToNames.length === allSkills.length
    ) {
      const newRecords = [];
      const mostRecentExistingJobSkill = await container
        .make('models/jobskill')
        .findFirst({}, { order: true }, null, 'order', 'desc', 1);
      let existingJobSkillsCount = mostRecentExistingJobSkill.order + 1;
      for (const nonHexId of nonHexIds) {
        newRecords.push({
          order: existingJobSkillsCount,
          name: toTitleCase(nonHexId),
          createdBy: req.token.sub,
          original: false,
        });
        existingJobSkillsCount += 1;
      }
      await container.make('models/jobskill').createMany(newRecords);
      // Append newly created Job Skills
      // requiredSkills = requiredSkills.concat(requiredNonHexIds)
      // optionalSkills = optionalSkills.concat(optionalNonHexIds)
    }
    // Sort required and optional skills
    for (const jobSkill of jobSkillIdsToNames) {
      if (requiredSkills.includes(jobSkill.id)) {
        requiredSkills.splice(
          requiredSkills.indexOf(jobSkill.id),
          1,
          jobSkill.name,
        );
      }
      if (optionalSkills.includes(jobSkill.id)) {
        optionalSkills.splice(
          optionalSkills.indexOf(jobSkill.id),
          1,
          jobSkill.name,
        );
      }
    }
  }
  return {
    skills: {
      requiredSkills,
      optionalSkills,
    },
    sError: null,
  };
};

export default async function updatePost(req, res, next) {
  const logger = container.make('logger');
  const post = container.make('models/post');
  try {
    // Get Post - MongoDB query
    const existingPost = await post.findById(req.body.id, {
      _id: 1,
      userId: 1
    });
    if (!existingPost) {
      return res.status(400).send({
        message: 'Post not found.',
      });
    }
    // Check ownership - compare ObjectIds as strings
    if (existingPost.userId && existingPost.userId.toString() !== req.token.sub) {
      return res.status(403).send({
        message: 'You do not have permission to update this post.',
      });
    }
    // Handle required and optional skills
    const { skills, sError } = await handleSkills(req);
    if (sError) {
      return res.status(400).send(sError);
    }
    const updateBody = skipUndefined(
      {
        title: req.body.data.title,
        description: req.body.data.description,
        category: req.body.data.category,
        industryType: req.body.data.industryType,
        functionalArea: req.body.data.functionalArea,
        activeHiring: true && req.body.activeHiring !== 'false',
        archive: req.body.data.archive,
        location: req.body.data.location,
        positionType: req.body.data.positionType
          ? req.body.data.positionType.toUpperCase()
          : null,
        positionTitle: req.body.data.positionTitle,
        experience: req.body.data.experience,
        employmentType: req.body.data.employmentType
          ? req.body.data.employmentType.toUpperCase()
          : undefined,
        compensation: req.body.data.compensation,
        requiredSkills: skills.requiredSkills,
        optionalSkills: skills.optionalSkills,
      },
      true,
    );
    // Update post - MongoDB update by ID
    const results = await post.update(
      req.body.id,
      updateBody
    );
    // Serialize and send results
    res.send({
      data: serializeDocument(results),
      details: {
        body: req.body,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (err) {
    logger.error('Error occurred attempting to update post. Reason:');
    logger.error(err.stack);
    next(new Error('Unable to update post'));
  }
}
