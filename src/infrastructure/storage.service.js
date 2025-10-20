import { logger } from '../config/logger.js';

export class StorageService {
  async delete(filePath) {
    try {
      logger.info(`Deleting file at ${filePath}`);
      return Promise.resolve({ success: true, path: filePath });
    } catch (error) {
      logger.error(`Error deleting file: ${error.message}`);
      throw error;
    }
  }

  async upload(file) {
    try {
      logger.info(`Uploading file: ${file.originalname}`);
      return Promise.resolve({
        success: true,
        filename: file.filename,
        path: file.path
      });
    } catch (error) {
      logger.error(`Error uploading file: ${error.message}`);
      throw error;
    }
  }
}

export const storageService = new StorageService();
export default storageService;
