import BaseModel from './base.js';

export default class TranscriptionModel extends BaseModel {
  constructor(database) {
    super(database, 'transcriptions');
  }
}
