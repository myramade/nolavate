import BaseModel from './base.js';

export default class CompanyModel extends BaseModel {
  constructor(database) {
    super(database, 'companies');
  }
}
