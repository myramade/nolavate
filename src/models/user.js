
export default class UserModel {
  constructor(database) {
    this.db = database;
    this.collection = 'users';
  }

  async create(userData) {
    const result = await this.db.collection(this.collection).insertOne(userData);
    return { ...userData, _id: result.insertedId };
  }

  async findOne(query) {
    return await this.db.collection(this.collection).findOne(query);
  }

  async findById(id, select = {}) {
    return await this.db.collection(this.collection).findOne({ _id: id }, { projection: select });
  }

  async updateById(id, updateData) {
    const result = await this.db.collection(this.collection).updateOne(
      { _id: id },
      { $set: updateData }
    );
    return result.modifiedCount > 0;
  }

  async deleteById(id) {
    const result = await this.db.collection(this.collection).deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}
