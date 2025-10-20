import BaseModel from './base.js';

export default class JobOfferModel extends BaseModel {
  constructor(database) {
    super(database, 'joboffers');
  }
}
