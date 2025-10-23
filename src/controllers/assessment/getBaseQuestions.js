import container from '../../container.js';
import { getFormattedDate } from '../../services/helper.js';

// Mock assessment questions for when database is not available
const MOCK_QUESTIONS = [
  { id: 1, question: "I enjoy meeting new people and making connections", answers: [
    { id: 1, text: "Strongly Disagree" }, { id: 2, text: "Disagree" }, { id: 3, text: "Neutral" }, { id: 4, text: "Agree" }, { id: 5, text: "Strongly Agree" }
  ]},
  { id: 2, question: "I prefer working on detailed tasks rather than big picture thinking", answers: [
    { id: 1, text: "Strongly Disagree" }, { id: 2, text: "Disagree" }, { id: 3, text: "Neutral" }, { id: 4, text: "Agree" }, { id: 5, text: "Strongly Agree" }
  ]},
  { id: 3, question: "I feel energized when working in a team", answers: [
    { id: 1, text: "Strongly Disagree" }, { id: 2, text: "Disagree" }, { id: 3, text: "Neutral" }, { id: 4, text: "Agree" }, { id: 5, text: "Strongly Agree" }
  ]},
  { id: 4, question: "I prefer to plan ahead rather than be spontaneous", answers: [
    { id: 1, text: "Strongly Disagree" }, { id: 2, text: "Disagree" }, { id: 3, text: "Neutral" }, { id: 4, text: "Agree" }, { id: 5, text: "Strongly Agree" }
  ]},
  { id: 5, question: "I enjoy taking on leadership roles", answers: [
    { id: 1, text: "Strongly Disagree" }, { id: 2, text: "Disagree" }, { id: 3, text: "Neutral" }, { id: 4, text: "Agree" }, { id: 5, text: "Strongly Agree" }
  ]},
  { id: 6, question: "I like to analyze problems logically", answers: [
    { id: 1, text: "Strongly Disagree" }, { id: 2, text: "Disagree" }, { id: 3, text: "Neutral" }, { id: 4, text: "Agree" }, { id: 5, text: "Strongly Agree" }
  ]},
  { id: 7, question: "I'm comfortable with ambiguity and change", answers: [
    { id: 1, text: "Strongly Disagree" }, { id: 2, text: "Disagree" }, { id: 3, text: "Neutral" }, { id: 4, text: "Agree" }, { id: 5, text: "Strongly Agree" }
  ]},
  { id: 8, question: "I prefer working independently", answers: [
    { id: 1, text: "Strongly Disagree" }, { id: 2, text: "Disagree" }, { id: 3, text: "Neutral" }, { id: 4, text: "Agree" }, { id: 5, text: "Strongly Agree" }
  ]},
  { id: 9, question: "I enjoy creative and artistic activities", answers: [
    { id: 1, text: "Strongly Disagree" }, { id: 2, text: "Disagree" }, { id: 3, text: "Neutral" }, { id: 4, text: "Agree" }, { id: 5, text: "Strongly Agree" }
  ]},
  { id: 10, question: "I prefer routine and structure in my work", answers: [
    { id: 1, text: "Strongly Disagree" }, { id: 2, text: "Disagree" }, { id: 3, text: "Neutral" }, { id: 4, text: "Agree" }, { id: 5, text: "Strongly Agree" }
  ]},
  { id: 11, question: "I enjoy helping and supporting others", answers: [
    { id: 1, text: "Strongly Disagree" }, { id: 2, text: "Disagree" }, { id: 3, text: "Neutral" }, { id: 4, text: "Agree" }, { id: 5, text: "Strongly Agree" }
  ]},
  { id: 12, question: "I like working with data and numbers", answers: [
    { id: 1, text: "Strongly Disagree" }, { id: 2, text: "Disagree" }, { id: 3, text: "Neutral" }, { id: 4, text: "Agree" }, { id: 5, text: "Strongly Agree" }
  ]},
  { id: 13, question: "I'm good at persuading others", answers: [
    { id: 1, text: "Strongly Disagree" }, { id: 2, text: "Disagree" }, { id: 3, text: "Neutral" }, { id: 4, text: "Agree" }, { id: 5, text: "Strongly Agree" }
  ]},
  { id: 14, question: "I prefer learning by doing rather than studying theory", answers: [
    { id: 1, text: "Strongly Disagree" }, { id: 2, text: "Disagree" }, { id: 3, text: "Neutral" }, { id: 4, text: "Agree" }, { id: 5, text: "Strongly Agree" }
  ]},
  { id: 15, question: "I enjoy organizing and coordinating activities", answers: [
    { id: 1, text: "Strongly Disagree" }, { id: 2, text: "Disagree" }, { id: 3, text: "Neutral" }, { id: 4, text: "Agree" }, { id: 5, text: "Strongly Agree" }
  ]},
  { id: 16, question: "I'm comfortable with public speaking", answers: [
    { id: 1, text: "Strongly Disagree" }, { id: 2, text: "Disagree" }, { id: 3, text: "Neutral" }, { id: 4, text: "Agree" }, { id: 5, text: "Strongly Agree" }
  ]},
  { id: 17, question: "I like to explore new ideas and concepts", answers: [
    { id: 1, text: "Strongly Disagree" }, { id: 2, text: "Disagree" }, { id: 3, text: "Neutral" }, { id: 4, text: "Agree" }, { id: 5, text: "Strongly Agree" }
  ]},
  { id: 18, question: "I prefer clear instructions over figuring things out myself", answers: [
    { id: 1, text: "Strongly Disagree" }, { id: 2, text: "Disagree" }, { id: 3, text: "Neutral" }, { id: 4, text: "Agree" }, { id: 5, text: "Strongly Agree" }
  ]},
  { id: 19, question: "I enjoy competing to win", answers: [
    { id: 1, text: "Strongly Disagree" }, { id: 2, text: "Disagree" }, { id: 3, text: "Neutral" }, { id: 4, text: "Agree" }, { id: 5, text: "Strongly Agree" }
  ]},
  { id: 20, question: "I value work-life balance over career advancement", answers: [
    { id: 1, text: "Strongly Disagree" }, { id: 2, text: "Disagree" }, { id: 3, text: "Neutral" }, { id: 4, text: "Agree" }, { id: 5, text: "Strongly Agree" }
  ]}
];

export default async function getBaseQuestions(req, res, next) {
  const logger = container.make('logger');
  const assessmentQuestions = container.make('models/assessmentquestions');
  try {
    const results = await assessmentQuestions.findMany(
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
    
    // Use mock data if database returns empty results
    const questionsData = results && results.length > 0 ? results : MOCK_QUESTIONS;
    
    // send results
    return res.send({
      data: questionsData,
      details: {
        query: req.query,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (error) {
    logger.error('Error occurred fetching assessment. Reason:');
    logger.error(error.stack);
    next(error);
  }
}
