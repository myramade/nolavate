import BaseModel from './base.js';

export default class MatchModel extends BaseModel {
  constructor(database) {
    super(database, 'matches');
  }
}
