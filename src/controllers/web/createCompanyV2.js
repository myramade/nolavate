import container from '../../container.js';
import { getFormattedDate, skipUndefined } from '../../services/helper.js';
import { ObjectId } from 'mongodb';

export default async function createCompanyV2(req, res, next) {
  const logger = container.make('logger');
  const company = container.make('models/company');
  const user = container.make('models/user');
  
  try {
    // Check if user already owns a company
    const existingCompanyProfileOwnedBy = await company.findOne({
      profileOwnerId: new ObjectId(req.token.sub)
    });
    
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
        // Create company with MongoDB syntax
        const companyData = skipUndefined({
          profileOwnerId: new ObjectId(req.token.sub),
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
          createdTime: new Date(),
        });

        const result = await company.create(companyData);
        
        // Associate company to recruiter who created it
        await user.update(
          new ObjectId(req.token.sub),
          {
            employerId: result._id,
          }
        );
        
        // Send this to finally() block
        createCompanyResult = {
          id: result._id,
          name: result.name,
          website: result.website,
          logo: result.logo?.streamUrl || null,
          location: result.location,
          culture: result.culture,
        };
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
  } catch (error) {
    logger.error('Unable to create company (v2). Reason:');
    logger.error(error.stack);
    next(error);
  }
}
