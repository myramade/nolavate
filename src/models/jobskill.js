import BaseModel from './base.js';

export default class JobSkillModel extends BaseModel {
  constructor(database) {
    super(database, 'jobskills');
  }
}
