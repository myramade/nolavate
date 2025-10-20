import { prisma } from '../services/database.js';

export class PersonalityRepository {
  async create(personalityData) {
    return await prisma.personality.create({
      data: personalityData
    });
  }

  async findById(id) {
    return await prisma.personality.findUnique({
      where: { id }
    });
  }

  async findByKey(key) {
    return await prisma.personality.findUnique({
      where: { key }
    });
  }

  async findAll() {
    return await prisma.personality.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async update(id, updateData) {
    return await prisma.personality.update({
      where: { id },
      data: updateData
    });
  }

  async delete(id) {
    return await prisma.personality.delete({
      where: { id }
    });
  }
}

export const personalityRepository = new PersonalityRepository();
export default personalityRepository;
