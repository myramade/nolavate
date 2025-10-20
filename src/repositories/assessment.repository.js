import { prisma } from '../services/database.js';

export class AssessmentRepository {
  async create(assessmentData) {
    return await prisma.assessment.create({
      data: assessmentData
    });
  }

  async findById(id) {
    return await prisma.assessment.findUnique({
      where: { id }
    });
  }

  async findByUserId(userId) {
    return await prisma.assessment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async update(id, updateData) {
    return await prisma.assessment.update({
      where: { id },
      data: updateData
    });
  }

  async delete(id) {
    return await prisma.assessment.delete({
      where: { id }
    });
  }
}

export const assessmentRepository = new AssessmentRepository();
export default assessmentRepository;
