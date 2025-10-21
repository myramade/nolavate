import container from '../../container.js';
import { getFormattedDate } from '../../services/helper.js';

export default async function importJobFromUrl(req, res, next) {
  const logger = container.make('logger');

  try {
    if (!req.body.url) {
      return res.status(400).send({
        message: 'Job posting URL is required.',
      });
    }

    const url = req.body.url.trim();
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).send({
        message: 'Please provide a valid URL starting with http:// or https://',
      });
    }

    logger.info(`Attempting to import job from URL: ${url}`);

    const mockJobData = {
      positionTitle: 'Senior Software Engineer',
      description: 'We are looking for an experienced software engineer to join our team. The ideal candidate will have strong problem-solving skills and experience with modern web technologies.',
      location: 'San Francisco, CA',
      employmentType: 'FULL_TIME',
      minSalary: '120000',
      maxSalary: '180000',
      currency: 'USD',
      experienceLevel: 'Senior',
      requiredSkills: 'JavaScript,React,Node.js',
      optionalSkills: 'TypeScript,AWS',
      benefits: 'Health Insurance,401k,Remote Work',
      applicationUrl: url,
    };

    res.send({
      data: mockJobData,
      message: 'Job details extracted successfully! Please review and edit before posting.',
      details: {
        sourceUrl: url,
        note: 'AI-powered job extraction is currently using mock data. Full web scraping will be implemented with proper integration.',
      },
      generatedAt: getFormattedDate(),
    });
  } catch (error) {
    logger.error('Error occurred importing job from URL. Reason:');
    logger.error(error.stack);
    next(new Error('Unable to import job from URL. Please try again or enter details manually.'));
  }
}
