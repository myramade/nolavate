import BaseModel from './base.js';

export default class AssessmentModel extends BaseModel {
  constructor(database) {
    super(database, 'assessments');
  }
}
