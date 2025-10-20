import BaseModel from './base.js';

export default class PostLikesModel extends BaseModel {
  constructor(database) {
    super(database, 'postlikes');
  }
}
