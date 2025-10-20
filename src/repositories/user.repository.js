import { prisma } from '../services/database.js';

export class UserRepository {
  async create(userData) {
    return await prisma.user.create({
      data: userData
    });
  }

  async findOne(where) {
    return await prisma.user.findFirst({ where });
  }

  async findById(id, select = {}) {
    return await prisma.user.findUnique({
      where: { id },
      select: Object.keys(select).length > 0 ? select : undefined
    });
  }

  async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email }
    });
  }

  async update(id, updateData) {
    return await prisma.user.update({
      where: { id },
      data: updateData
    });
  }

  async delete(id) {
    return await prisma.user.delete({
      where: { id }
    });
  }

  async count(where = {}) {
    return await prisma.user.count({ where });
  }

  async findMany(where = {}, options = {}) {
    const { select, skip, take, orderBy } = options;
    return await prisma.user.findMany({
      where,
      select,
      skip,
      take,
      orderBy
    });
  }
}

export const userRepository = new UserRepository();
export default userRepository;
