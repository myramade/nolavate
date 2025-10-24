import BaseModel from './base.js';

export default class SessionModel extends BaseModel {
  constructor(database) {
    super(database, 'sessions');
  }
}
