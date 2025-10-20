import { config } from './env.js';

class Logger {
  info(message, meta = {}) {
    console.log(`[INFO] ${message}`, meta);
  }

  error(message, meta = {}) {
    console.error(`[ERROR] ${message}`, meta);
  }

  warn(message, meta = {}) {
    console.warn(`[WARN] ${message}`, meta);
  }

  debug(message, meta = {}) {
    if (config.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, meta);
    }
  }
}

export const logger = new Logger();
export default logger;
