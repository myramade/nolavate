import container from '../../container.js';
import { getFormattedDate } from '../../services/helper.js';

export default async function deleteCompany(req, res, next) {
  const company = container.make('models/company');
  const logger = container.make('logger');
  try {
    const foundCompany = await company.findById(req.body.id, { id: true });
    if (!foundCompany) {
      return res.status(400).send({
        message: 'Company was not found.',
      });
    }
    const existingCompany = await company.findOne(
      {
        id: foundCompany.id,
        AND: {
          profileOwner: {
            is: {
              id: req.token.sub,
            },
          },
        },
      },
      {
        id: true,
      },
    );
    if (!existingCompany) {
      return res.status(400).send({
        message: 'You cannot delete this company.',
      });
    }
    await company.delete({
      id: foundCompany.id,
      AND: {
        profileOwner: {
          is: {
            id: req.token.sub,
          },
        },
      },
    });
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
