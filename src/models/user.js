import BaseModel from './base.js';

export default class UserModel extends BaseModel {
  constructor(database) {
    super(database, 'users');
  }
}
