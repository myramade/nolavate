import BaseModel from './base.js';

export default class NotificationModel extends BaseModel {
  constructor(database) {
    super(database, 'notifications');
  }
}
