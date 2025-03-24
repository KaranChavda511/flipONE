// src/services/Validation.js
import Joi from 'joi';
import logger from './logger.js';

const validationLogger = logger.child({ label: '/services/Validation.js' });

// Base error messages for reusability
const baseMessages = {
  'any.required': '{#label} is required',
  'string.base': '{#label} must be text',
  'number.base': '{#label} must be a number',
  'array.base': '{#label} must be an array'
};

const logValidationError = (error, schemaName) => {
  const errorDetails = error.details 
    ? error.details.map(d => ({
        message: d.message,
        path: d.path.join('.'),
        type: d.type,
        context: d.context
      }))
    : [{
        message: error.message,
        path: 'unknown',
        type: 'unexpected_error'
      }];
  
  validationLogger.error(`Validation failed for schema: ${schemaName}`, {
    errorDetails,
    schema: schemaName,
    originalError: error.message,
    inputData: error._original
  });
};

const createSchema = (schemaDef, schemaName) => {
  return Joi.object(schemaDef).error(error => {
    logValidationError(error, schemaName);
    return error;
  });
};

// Common validation rules with improved messages
const commonRules = {
  name: Joi.string().min(3).required().messages({
    ...baseMessages,
    'string.empty': 'Name cannot be empty',
    'string.min': 'Name must be at least {#limit} characters'
  }),
 email: Joi.string()
    .custom((value, helpers) => {
      if (/[A-Z]/.test(value)) {
        return helpers.error('string.lowercase');
      }
      return value;
    })
    .lowercase() // Convert to lowercase after validation
    .email()
    .required()
    .messages({
      'string.lowercase': 'Email must be in lowercase letters',
      'string.email': 'Invalid email format',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .required()
    .messages({
      ...baseMessages,
      'string.empty': 'Password cannot be empty',
      'string.min': 'Password must be at least {#limit} characters',
      'string.pattern.base': 'Must contain uppercase, lowercase, number, and special character'
    }),

  mobile: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      ...baseMessages,
      'string.pattern.base': 'Invalid mobile format (10 digits required)'
    }),

  address: Joi.string().messages({
    ...baseMessages
  })
};

// Product validation with enhanced rules
const productCommon = {
  name: Joi.string()
    .min(3)
    .trim()
    .required()
    .messages({
      ...baseMessages,
      'string.empty': 'Product name is required',
      'string.min': 'Product name must be at least {#limit} characters'
    }),

  description: Joi.string()
    .min(10)
    .max(2000)
    .trim()
    .required()
    .messages({
      ...baseMessages,
      'string.empty': 'Product description is required',
      'string.min': 'Description must be at least {#limit} characters',
      'string.max': 'Description cannot exceed {#limit} characters'
    }),

  price: Joi.number()
    .min(0)
    .precision(2)
    .required()
    .messages({
      ...baseMessages,
      'number.min': 'Price cannot be negative',
      'number.precision': 'Maximum 2 decimal places allowed'
    }),

  stock: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      ...baseMessages,
      'number.min': 'Stock cannot be negative',
      'number.integer': 'Stock must be a whole number'
    }),

  category: Joi.string()
    .trim()
    .required()
    .messages({
      ...baseMessages,
      'string.empty': 'Product category is required'
    }),

    subcategories: Joi.alternatives()
  .try(
    Joi.array()
      .items(Joi.string().trim().lowercase()
        .messages({ 'string.base': 'Subcategory must be text' }))
      .min(1)
      .max(5)
      .messages({
        'array.min': 'At least 1 subcategory required',
        'array.max': 'Maximum 5 subcategories allowed'
      }),
    Joi.string()
      .pattern(/,/)
      .custom((value, helpers) => {
        const array = value.split(',')
          .map(s => s.trim().toLowerCase())
          .filter(s => s.length > 0)
        
        if (array.length < 1) {
          return helpers.error('array.min')
        }
        if (array.length > 5) {
          return helpers.error('array.max')
        }
        return array
      })
  )
  .required()
  .messages({
    'alternatives.types': 'Must be array or comma-separated text',
    'alternatives.match': 'Need 1-5 valid subcategories',
    'any.required': 'Subcategories are required'
  }),

  images: Joi.array()
    .items(
      Joi.string().uri()
        .pattern(/^\/uploads\/[a-zA-Z0-9-]+\.(png|jpg|jpeg|webp)$/i)
        .messages({
          'string.pattern.base': 'Invalid image path format',
          'string.uri': 'Image path must be a valid URI'
        })
    )
    .max(5)
    .messages({
      'array.max': 'Maximum 5 images allowed'
    })
};

// Schemas
export const userSchemas = {
  signup: createSchema({
    name: commonRules.name,
    email: commonRules.email,
    password: commonRules.password,
    mobile: commonRules.mobile,
    address: commonRules.address
  }, 'userSignup'),

  login: createSchema({
    email: commonRules.email,
    password: commonRules.password
  }, 'userLogin'),

  updateProfile: createSchema({
    name: commonRules.name.optional(),
    mobile: commonRules.mobile.optional(),
    address: commonRules.address.optional()
  }, 'userUpdateProfile')
};

export const adminSchemas = {
  signup: createSchema({
    name: commonRules.name,
    email: commonRules.email,
    password: commonRules.password
  }, 'adminSignup'),

  login: createSchema({
    email: commonRules.email,
    password: commonRules.password
  }, 'adminLogin')
};

export const sellerSchemas = {
  signup: createSchema({
    name: commonRules.name,
    email: commonRules.email,
    password: commonRules.password
  }, 'sellerSignup'),

  login: createSchema({
    email: commonRules.email,
    password: commonRules.password
  }, 'sellerLogin')
};

export const productSchemas = {
  create: createSchema({
    ...productCommon,
    subcategories: productCommon.subcategories
  }, 'productCreate'),

  update: createSchema({
    name: productCommon.name.optional(),
    description: productCommon.description.optional(),
    price: productCommon.price.optional(),
    stock: productCommon.stock.optional(),
    category: productCommon.category.optional(),
    subcategories: productCommon.subcategories.optional(),
    images: productCommon.images.optional()
  }, 'productUpdate')
};

export const categorySchemas = {
  create: createSchema({
    name: commonRules.name,
    subcategories: Joi.array()
      .items(Joi.string().trim())
      .messages({
        ...baseMessages,
        'string.empty': 'Subcategory name cannot be empty'
      })
  }, 'categoryCreate'),

  update: createSchema({
    name: Joi.string().min(3).optional().messages({
      ...baseMessages,
      'string.min': 'Name must be at least {#limit} characters'
    }),
    subcategories: Joi.array()
      .items(Joi.string().trim())
      .optional()
  }, 'categoryUpdate')
};

export const cartSchemas = {
  addItem: createSchema({
    product: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        ...baseMessages,
        'string.pattern.base': 'Invalid product ID format'
      }),
    quantity: Joi.number()
      .integer()
      .min(1)
      .required()
      .messages({
        ...baseMessages,
        'number.min': 'Quantity must be at least 1',
        'number.integer': 'Quantity must be whole number'
      })
  }, 'cartAddItem'),

  updateItem: createSchema({
    quantity: Joi.number()
      .integer()
      .min(1)
      .messages({
        ...baseMessages,
        'number.min': 'Quantity must be at least 1',
        'number.integer': 'Quantity must be whole number'
      })
  }, 'cartUpdateItem')
};

// Update orderSchemas section
export const orderSchemas = {
  create: createSchema({
    shippingAddress: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      postalCode: Joi.string().pattern(/^\d{6}$/).required()
    }).required()
  }, 'orderCreate'),

  updateStatus: createSchema({
    status: Joi.string()
      .valid('pending', 'cancelled') // Add other statuses as needed
      .required()
  }, 'orderUpdateStatus')
};