import BaseModel from './base.js';

export default class CommentModel extends BaseModel {
  constructor(database) {
    super(database, 'comments');
  }
}
