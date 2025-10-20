import BaseModel from './base.js';

export default class PostModel extends BaseModel {
  constructor(database) {
    super(database, 'posts');
  }
}
