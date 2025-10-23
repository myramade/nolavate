import { ObjectId } from 'mongodb';
import container from '../../container.js';
import { getFormattedDate } from '../../services/helper.js';
import { toObjectId } from '../../utils/mongoHelpers.js';

export default async function deleteCompany(req, res, next) {
  const company = container.make('models/company');
  const logger = container.make('logger');
  try {
    const companyId = toObjectId(req.body.id);
    const userId = toObjectId(req.token.sub);
    
    if (!companyId) {
      return res.status(400).send({
        message: 'Invalid company ID.',
      });
    }
    
    // Find company by ID
    const foundCompany = await company.findById(companyId);
    if (!foundCompany) {
      return res.status(400).send({
        message: 'Company was not found.',
      });
    }
    
    // Verify ownership - MongoDB query with profileOwnerId
    const existingCompany = await company.findOne({
      _id: companyId,
      profileOwnerId: userId
    });
    
    if (!existingCompany) {
      return res.status(400).send({
        message: 'You cannot delete this company.',
      });
    }
    
    // Delete company (ownership already verified)
    await company.delete({ _id: companyId });
    
    return res.send({
      data: {
        message: 'Company and all associated data has been been deleted.',
      },
      details: {
        body: req.body.id,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (error) {
    logger.error(
      `Error occurred deleting company with ID: ${req.body.id}. Reason:`,
    );
    logger.error(error.stack);
    next(
      new Error(
        'This company has employees. You cannot delete it. You may transfer ownership and delete your personal account.',
      ),
    );
  }
}
