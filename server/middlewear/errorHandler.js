import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || res.statusCode || 500;
  res.status(statusCode);


  let validationErrors = null;

  const extractFieldName = (e) => {
    if (!e) return null;

    if (e.param) return e.param;
   
    if (e.path) return e.path;
    if (e.field) return e.field;
    if (e.propertyPath) return e.propertyPath;
   
    if (e.properties && (e.properties.path || e.properties.param)) return e.properties.path || e.properties.param;
   
    return null;
  };

  
  if (err.name === 'ValidationError' && err.errors && typeof err.errors === 'object') {
    validationErrors = Object.values(err.errors).map((e) => ({
      field: extractFieldName(e) || null,
      message: e.message || (e.properties && e.properties.message) || 'Invalid value',
      original: process.env.NODE_ENV === 'production' ? undefined : e,
    }));
  }


  else if (err.errors && Array.isArray(err.errors)) {
    validationErrors = err.errors.map((e) => ({
      field: extractFieldName(e) || null,
      message: e.msg || e.message || 'Invalid value',
      original: process.env.NODE_ENV === 'production' ? undefined : e,
    }));
  }

  if (err.name === 'MulterError') {

    const multerMessage = err.message || 'File upload error';
    logger.error({ multer: true, code: err.code, message: multerMessage, path: req.originalUrl });
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      message: multerMessage,
      name: err.name,
      errors: null,
    });
  }

  logger.error({
    message: err.message,
    name: err.name,
    stack: err.stack,
    statusCode,
    path: req.originalUrl,
    method: req.method,
    validationErrors,
  });

 
  res.json({
    timestamp: new Date().toISOString(),
    message: err.message || 'Internal Server Error',
    name: err.name || 'Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    errors: validationErrors,
  });
};
