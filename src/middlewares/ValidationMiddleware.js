// src/middlewares/ValidationMiddleware.js
import logger from '../services/logger.js';
import * as validation from '../services/Validation.js';

const validationLogger = logger.child({ label: 'middlewares/ValidationMiddleware.js' });

export const validator = (schemaName) => {
  return async (req, res, next) => {
    try {
      const [category, schemaKey] = schemaName.split('.');
      
      if (!validation[category]) {
        validationLogger.error(`Schema category "${category}" not found`);
        return res.status(500).json({
          status: 500,
          message: `Internal server error: Schema category "${category}" not found`,
        });
      }

      const schema = validation[category][schemaKey];
      if (!schema) {
        validationLogger.error(`Schema "${schemaName}" not found`);
        return res.status(500).json({
          status: 500,
          message: `Internal server error: Schema "${schemaName}" not found`,
        });
      }

      // Combine body and files for validation
      const dataToValidate = {
        ...req.body,
        ...(req.files && { files: req.files })
      };

      const validated = await schema.validateAsync(dataToValidate, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });

      req.validatedData = validated;
      next();
    } catch (err) {
      // Handle Joi errors first
      if (err.isJoi) {
        const errors = err.details ? err.details.map((detail) => ({
          field: detail.context.key,
          message: detail.message.replace(/['"]+/g, '')
        })) : [{
          field: 'general',
          message: 'Validation error occurred'
        }];

        validationLogger.warn(`Validation Error: ${JSON.stringify(errors)}`, {
          originalData: err._original
        });

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }

      // Handle other errors
      validationLogger.error(`Unexpected validation error: ${err.message}`, {
        stack: err.stack,
        originalError: err
      });
      
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};