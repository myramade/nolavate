import container from '../../container.js';
import { getFormattedDate, skipUndefined } from '../../services/helper.js';

export default async function createCompanyV2(req, res, next) {
  const logger = container.make('logger');
  const company = container.make('models/company');
  const user = container.make('models/user');
  try {
    const existingCompanyProfileOwnedBy = await company.findFirst(
      {
        profileOwner: {
          is: {
            id: req.token.sub,
          },
        },
      },
      { id: true, name: true },
    );
    if (existingCompanyProfileOwnedBy) {
      return res
        .status(400)
        .send(
          `The company named ${existingCompanyProfileOwnedBy.name} is already owned by you. Transfer ownership to create new company.`,
        );
    }
    // Use perplexity to grab company information
    let errorMessage;
    let createCompanyResult;
    container
      .make('perplexity-company-details')(req.body.company)
      .then(async (response) => {
        const result = await company.create(
          skipUndefined({
            profileOwner: {
              connect: {
                id: req.token.sub,
              },
            },
            name: response.companyName,
            logo: {
              storagePath: response.logoUrl,
              streamUrl: response.logoUrl,
              downloadUrl: response.logoUrl,
              mediaType: 'PERPLEXITYAI',
              category: 'LOGO',
              count: 1,
            },
            website: response.website,
            industry: response.industry,
            description: response.about,
            location: [`${response.location.city}, ${response.location.state}`],
            techStacks: Array.isArray(response.techStacks)
              ? response.techStacks
              : [],
            dateFounded: `${response.dateFounded}`,
            numOfEmployees: Number.parseInt(response.numberOfEmployees || '0'),
            culture: response.companyCulture,
          }),
          {
            id: true,
            name: true,
            website: true,
            logo: {
              select: {
                streamUrl: true,
              },
            },
            location: true,
            culture: true,
          },
        );
        // Associate company to recruiter who created it
        await user.updateById(
          req.token.sub,
          {
            employer: {
              connect: {
                id: result.id,
              },
            },
          },
          { id: true },
        );
        // Send this to finally() block
        createCompanyResult = result;
      })
      .catch((err) => {
        logger.error(
          'Error occurred fetching company details via Perplexity AI. Reason:',
        );
        logger.error(err);
        errorMessage = 'Unable to find company information.';
      })
      .finally(() => {
        if (errorMessage) {
          return res.status(400).send(errorMessage);
        }
        // send response
        res.send({
          data: createCompanyResult || {
            message: 'Successfully fetched company information.',
          },
          details: {
            body: req.body,
          },
          generatedAt: getFormattedDate(),
        });
      });
  } catch (err) {
    logger.error('Unable to create company. Reason:');
    logger.error(err.stack);
    next(new Error('Unable to complete request.'));
  }
}
