const ALLOWED_MIME_TYPES = {
  resume: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ],
  video: [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo'
  ],
  image: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ],
  media: [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
};

const ALLOWED_EXTENSIONS = {
  resume: ['.pdf', '.doc', '.docx', '.txt'],
  video: ['.mp4', '.webm', '.mov', '.avi'],
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  media: ['.mp4', '.webm', '.mov', '.avi', '.jpg', '.jpeg', '.png', '.gif', '.webp']
};

const MAX_FILE_SIZES = {
  resume: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
  image: 5 * 1024 * 1024, // 5MB
  media: 100 * 1024 * 1024 // 100MB (for videos and images combined)
};

const MEDIA_CATEGORIES = ['INFO', 'EDUCATION', 'EXPERIENCE', 'INTERESTS'];

export function validateFileUpload(fileType) {
  return (req, res, next) => {
    try {
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ 
          message: 'No file uploaded' 
        });
      }

      // Validate MIME type
      const allowedMimeTypes = ALLOWED_MIME_TYPES[fileType];
      if (!allowedMimeTypes || !allowedMimeTypes.includes(file.mimetype)) {
        return res.status(400).json({ 
          message: `Invalid file type. Allowed types: ${allowedMimeTypes?.join(', ') || 'none'}` 
        });
      }

      // Validate file extension
      const allowedExtensions = ALLOWED_EXTENSIONS[fileType];
      const fileExtension = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0];
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        return res.status(400).json({ 
          message: `Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}` 
        });
      }

      // Validate file size
      const maxSize = MAX_FILE_SIZES[fileType];
      if (file.size > maxSize) {
        return res.status(400).json({ 
          message: `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB` 
        });
      }

      // Additional validation for media category if present
      if (req.body.category) {
        const category = req.body.category.toUpperCase();
        if (!MEDIA_CATEGORIES.includes(category)) {
          return res.status(400).json({ 
            message: `Invalid category. Allowed categories: ${MEDIA_CATEGORIES.join(', ')}` 
          });
        }
      }

      next();
    } catch (error) {
      console.error('File validation error:', error);
      res.status(500).json({ message: 'Error validating file upload' });
    }
  };
}

export { ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS, MAX_FILE_SIZES, MEDIA_CATEGORIES };
