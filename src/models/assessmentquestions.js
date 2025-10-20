import BaseModel from './base.js';

export default class AssessmentQuestionsModel extends BaseModel {
  constructor(database) {
    super(database, 'assessmentquestions');
  }
}
