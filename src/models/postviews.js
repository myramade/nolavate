import BaseModel from './base.js';

export default class PostViewsModel extends BaseModel {
  constructor(database) {
    super(database, 'postviews');
  }
}
