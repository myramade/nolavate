import container from '../../container.js';
import { getFormattedDate, skipUndefined, deleteData } from '../../services/helper.js';
import { ObjectId } from 'mongodb';

export default async function createCompany(req, res, next) {
  const logger = container.make('logger');
  const company = container.make('models/company');
  const user = container.make('models/user');
  const supabaseUploadComplete = container.make('supabase/uploadFilesComplete');
  let isBadUpload = false;
  
  try {
    if (!req.file) {
      isBadUpload = true;
      throw new Error('Image not found in stream.');
    }
    
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

    // Create company with MongoDB syntax
    const companyData = skipUndefined({
      profileOwnerId: new ObjectId(req.token.sub),
      name: req.body.name,
      logo: {
        storagePath,
        streamUrl: streamUrls[0],
        downloadUrl: downloadUrls[0],
        mediaType,
        category: 'LOGO',
        count: 1,
      },
      website: req.body.website,
      industry: req.body.industry,
      description: req.body.description,
      techStacks: req.body.techStacks
        ? req.body.techStacks.split(',')
        : undefined,
      location: req.body.location ? req.body.location.split('-') : undefined,
      dateFounded: req.body.dateFounded,
      numOfEmployees: Number.parseInt(req.body.numberOfEmployees) || 0,
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
    
    // Send response
    res.send({
      data: {
        id: result._id,
        name: result.name,
        logo: result.logo?.streamUrl || null,
      },
      details: {
        body: req.body,
      },
      generatedAt: getFormattedDate(),
    });
  } catch (err) {
    logger.error('Unable to create company. Reason:');
    logger.error(err.stack);
    next(
      new Error(
        isBadUpload ? err.message : 'Failed to create company. Please try again.',
      ),
    );
  }
  
  // Add files to delete photos job queue
  if (!isBadUpload) {
    deleteData(container, req.file, req.token.sub);
  }
}
