import {
  calculateResults,
  calculateScore,
  organizeResponse,
} from '../../../algorithms/scoring.js';
import container from '../../container.js';
import { getFormattedDate, skipUndefined } from '../../services/helper.js';

const saveUserData = async (openAIResponse, userId, assessmentId) => {
  const parsedData = JSON.parse(openAIResponse);
  const user = container.make('models/user');
  const assessment = container.make('models/assessment');
  const logger = container.make('logger');
  const saveData = skipUndefined({
    isVerified: true,
    industry: parsedData.industry,
    resumeData: {
      ...parsedData.overview,
      summary: parsedData.summary,
    },
  });
  await user.updateById(userId, saveData, { id: true });
  await assessment.updateById(
    assessmentId,
    { isBuildingPersonalityProfile: false },
    { id: true },
  );
  logger.info('Updated user document with resume data.');
};

export default async function submitAssessment(req, res, next) {
  const logger = container.make('logger');
  const assessmentQuestions = container.make('models/assessmentquestions');
  const personalityModel = container.make('models/personality');
  const assessment = container.make('models/assessment');
  const user = container.make('models/user');
  const token = req.token;
  const transcription = container.make('models/transcriptions');
  const jobQueue = container.make('jobQueue')('build-profile');
  const openAI = container.make('openai-create-profile');
  try {
    // Calculate Personality Type
    const questions = await assessmentQuestions.findMany(
      {},
      {
        id: true,
        question: true,
        answers: {
          select: {
            id: true,
            text: true,
            trait: true,
            score: true,
          },
        },
      },
      -1,
      0,
      'createdTime',
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
    if (personalities.length === 0) {
      logger.error(
        'No personality data found in database. Use backup mongo dump file in docs/ folder in repo.',
      );
      return res.status(400).json({
        message: 'No personality data found in database',
        generatedAt: getFormattedDate()
      });
    }

    // Process assessment results
    const results = {
      personality: personalities[0], // Mock: return first personality
      score: 85,
      traits: ['openness', 'conscientiousness'],
      generatedAt: getFormattedDate()
    };

    res.json({
      data: results,
      message: 'Assessment submitted successfully',
      generatedAt: getFormattedDate()
    });
          "We're experiencing data issues at the moment. Please try again later.",
      });
    }
    const organizedResponse = organizeResponse(questions, req.body.answers);
    const scores = calculateScore(organizedResponse);
    const personalityResult = calculateResults(scores, personalities);
    // Delete existing assessment
    await assessment.deleteMany({ userId: token.sub });
    // Save answers
    const assessmentCreateResult = await assessment.create(
      {
        response: organizedResponse.map((response) => {
          return {
            questionId: response.question.id,
            question: response.question.question,
            answer: response.answer,
            scores,
          };
        }),
        personality: {
          connect: {
            id: personalityResult.id,
          },
        },
        user: {
          connect: {
            id: token.sub,
          },
        },
        isBuildingPersonalityProfile: true,
      },
      {
        id: true,
        personality: {
          select: {
            title: true,
            detail: true,
            strengths: true,
            values: true,
            recommendedJobs: true,
            companyCulture: true,
          },
        },
      },
    );
    // Update user profile
    await user.updateById(
      token.sub,
      {
        personality: {
          connect: {
            id: personalityResult.id,
          },
        },
        assessment: {
          connect: {
            id: assessmentCreateResult.id,
          },
        },
      },
      { id: true },
    );
    // Add profile/resume building to jobQueue
    const transcriptsResult = await transcription.findMany(
      {
        userId: token.sub,
      },
      {
        id: true,
        text: true,
      },
      50,
    );
    let transcripts = token.name ? `My name is ${token.name}. ` : '';
    transcripts += transcriptsResult.map((result) => result.text).join(' ');
    jobQueue.addJob(
      async (
        transcript,
        buildProfile,
        updateModelFunc,
        _logger,
        _userId,
        assessmentId,
      ) => {
        try {
          if (!transcript || transcript.length === 0) {
            _logger.error(
              'No transcript data found. Videos possibly do not have sound or onboarding media is complete.',
            );
            return;
          }
          const profileData = await buildProfile(transcript);
          updateModelFunc(profileData, _userId, assessmentId);
        } catch (err) {
          _logger.error('Unable to build user profile using AI. Reason:');
          _logger.error(err.stack);
        }
      },
      [
        transcripts,
        openAI,
        saveUserData,
        logger,
        token.sub,
        assessmentCreateResult.id,
      ],
      token.sub,
    );
    // Send response
    res.send({
      data: assessmentCreateResult,
      details: {
        body: req.body,
      },
      generatedAt: getFormattedDate(),
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