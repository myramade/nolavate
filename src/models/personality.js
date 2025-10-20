import BaseModel from './base.js';

export default class PersonalityModel extends BaseModel {
  constructor(database) {
    super(database, 'personalities');
  }
}
