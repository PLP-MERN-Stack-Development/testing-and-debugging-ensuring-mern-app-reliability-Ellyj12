import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, '../logs');

// Ensure logs directory exists to avoid startup failures when File transport tries to write
try {
  fs.mkdirSync(logsDir, { recursive: true });
} catch (err) {
  // If mkdir fails, log to console; winston transport may fail later but we avoid crashing here
  // eslint-disable-next-line no-console
  console.warn('Could not create logs directory:', err.message);
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }), 
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(), 
    new winston.transports.File({ 
      filename: path.join(logsDir, 'errors.log'), 
      level: 'error',
      maxsize: 5242880, 
      maxFiles: 5,
    }) 
  ],
});

export default logger;
