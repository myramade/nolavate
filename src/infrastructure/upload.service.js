import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|heif|heic|tiff|bmp|mp4|mov|3gp|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, videos, and documents are allowed.'));
  }
};

export class UploadService {
  createUploader(fileTypes = 'all') {
    const limits = {
      fileSize: 10 * 1024 * 1024
    };

    return multer({
      storage,
      fileFilter,
      limits
    });
  }
}

export const uploadService = new UploadService();

export const createUploadMiddleware = (fileTypes = 'all') => {
  return uploadService.createUploader(fileTypes);
};

export default uploadService;
