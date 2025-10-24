import container from '../../container.js';
import { getFormattedDate } from '../../services/helper.js';
import { analyzeDISCAssessment } from '../../services/discScoring.js';

export default async function submitAssessment(req, res, next) {
  const logger = container.make('logger');
  const assessmentQuestions = container.make('models/assessmentquestions');
  const personalityModel = container.make('models/personality');
  const assessment = container.make('models/assessment');
  const user = container.make('models/user');
  const token = req.token;
  try {
    // Calculate Personality Type
    const questions = await assessmentQuestions.findMany(
      {},
      {
        id: 1,
        question: 1,
        answers: 1,
        order: 1
      },
      -1,
      0,
      'order',
      'asc',
    );
    const personalities = await personalityModel.findMany(
      {},
      {
        id: true,
        key: true,
        title: true,
        detail: true,
        strengths: true,
        values: true,
        recommendedJobs: true,
        companyCulture: true,
      },
      -1,
      0,
      'createdTime',
      'asc',
    );
    // Get user answers
    const answers = req.body.answers || [];
    
    if (answers.length === 0) {
      return res.status(400).json({
        message: 'No answers provided',
        generatedAt: getFormattedDate()
      });
    }

    // Use DISC scoring algorithm to analyze assessment
    const analysisResult = analyzeDISCAssessment(answers, questions, personalities);
    
    if (!analysisResult.profile) {
      logger.error('No personality profile matched');
      return res.status(500).json({
        message: 'Unable to determine personality type',
        generatedAt: getFormattedDate()
      });
    }

    const personalityType = analysisResult.profile;

    // Save assessment to database
    try {
      // Delete any existing assessments for this user
      await assessment.deleteMany({ userId: token.sub });
      
      // Create new assessment record
      const assessmentRecord = await assessment.create({
        userId: token.sub,
        personalityKey: analysisResult.personalityType,
        personality: personalityType,
        scores: analysisResult.scores,
        response: answers,
        isBuildingPersonalityProfile: false,
        createdTime: new Date()
      });

      // Update user profile with personality
      await user.updateById(token.sub, {
        personalityKey: analysisResult.personalityType,
        personalityScores: analysisResult.scores
      });

      logger.info(`Assessment completed for user ${token.sub}: ${analysisResult.personalityType}`);
    } catch (err) {
      logger.error('Error saving assessment:', err.message);
      // Continue to return results even if save fails
    }

    // Return results with full personality profile and DISC scores
    res.json({
      data: {
        personality: personalityType,
        personalityType: analysisResult.personalityType,
        scores: analysisResult.scores,
        takenAt: new Date().toISOString(),
        createdTime: new Date()
      },
      message: 'Assessment submitted successfully',
      generatedAt: getFormattedDate()
    });
  } catch (error) {
    logger.error('Error occurred submitting assessment. Reason:');
    logger.error(error.stack);
    res.status(500).json({
      message: 'Error submitting assessment',
      error: error.message,
      generatedAt: getFormattedDate()
    });
  }
}