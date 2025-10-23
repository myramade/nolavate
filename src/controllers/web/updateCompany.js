import { ObjectId } from 'mongodb';
import container from '../../container.js';
import {
  getFormattedDate,
  isEmpty,
  skipUndefined,
} from '../../services/helper.js';
import { toObjectId, serializeDocument } from '../../utils/mongoHelpers.js';

export default async function updateCompany(req, res, next) {
  const logger = container.make('logger');
  const company = container.make('models/company');
  const user = container.make('models/user');
  const supabaseUploadComplete = container.make('supabase/uploadFilesComplete');
  try {
    let logo;
    if (req.file) {
      logger.debug('Updating company logo...');
      const storagePath = `${req.token.sub}/${req.file.filename}`;
      const file = req.file.path;
      const mimeType = req.file.mimetype;
      const mediaType = req.file.extension;
      const { streamUrls, downloadUrls } = await supabaseUploadComplete(
        [file],
        [storagePath],
        'companies',
        mimeType,
        [req.file.originalname],
      );
      logo = {
        storagePath,
        streamUrl: streamUrls[0],
        downloadUrl: downloadUrls[0],
        mediaType,
        category: 'LOGO',
        count: 1,
      };
    }
    // Find existing company by ID - MongoDB query
    const companyObjectId = toObjectId(req.body.companyId);
    const userObjectId = toObjectId(req.token.sub);
    
    if (!companyObjectId) {
      return res.status(400).send({
        message: 'Invalid company ID',
      });
    }
    
    const existingCompany = await company.findOne({
      _id: companyObjectId,
      profileOwnerId: userObjectId
    });
    
    if (!existingCompany) {
      return res.status(400).send({
        message: 'No company found or you cannot update this company.',
      });
    }
    const updateBody = skipUndefined(
      {
        name: req.body.name,
        logo,
        website: req.body.website,
        industry: req.body.industry,
        description: req.body.description,
        techStacks: req.body.techStacks
          ? req.body.techStacks.split(',')
          : undefined,
        location: req.body.location ? req.body.location.split('-') : undefined,
        dateFounded: req.body.dateFounded,
        numOfEmployees: Number.parseInt(req.body.numberOfEmployees || '0'),
        culture: req.body.culture,
      },
      true,
    );
    if (isEmpty(updateBody)) {
      throw new Error('No data was provided for update.');
    }
    // Update company - MongoDB update by ID
    const result = await company.update(existingCompany._id, updateBody);
    
    // Associate company to recruiter who created it
    await user.updateById(req.token.sub, {
      employerId: result._id
    });
    
    // Serialize and transform response
    const serialized = serializeDocument(result);
    if (serialized.logo && serialized.logo.streamUrl) {
      serialized.logo = serialized.logo.streamUrl;
    }
    
    // send response
    res.send({
      data: serialized,
      details: {
        body: req.body,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (err) {
    logger.error('Unable to update company. Reason:');
    logger.error(err.stack);
    next(new Error('Unable to complete request.'));
  }
}
