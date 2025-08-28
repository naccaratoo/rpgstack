/**
 * Input Validation and Sanitization System
 * 
 * Provides comprehensive input validation and sanitization for the application layer,
 * ensuring data integrity, security, and consistency across all user inputs.
 * 
 * Features:
 * - Schema-based validation with configurable rules
 * - Data type validation and coercion
 * - String sanitization (XSS prevention, normalization)
 * - Custom validation rules and extensibility
 * - Comprehensive error reporting
 * - Performance-optimized validation pipeline
 */

import { ValidationError } from '../errors/ApplicationErrors.js';

/**
 * Field Validation Rule
 * Represents a single validation rule for a field
 */
class ValidationRule {
  constructor(name, validator, message, options = {}) {
    this.name = name;
    this.validator = validator;
    this.message = message;
    this.options = options;
    this.async = options.async || false;
  }

  /**
   * Execute validation rule
   * @param {any} value - Value to validate
   * @param {Object} context - Validation context (full object, field path)
   * @returns {Promise<boolean>|boolean} Validation result
   */
  async validate(value, context = {}) {
    try {
      if (this.async) {
        return await this.validator(value, context, this.options);
      }
      return this.validator(value, context, this.options);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get formatted error message
   * @param {string} fieldName - Name of field being validated
   * @param {any} value - Value that failed validation
   * @returns {string} Formatted error message
   */
  getErrorMessage(fieldName, value) {
    return this.message
      .replace('{field}', fieldName)
      .replace('{value}', String(value))
      .replace('{min}', this.options.min)
      .replace('{max}', this.options.max)
      .replace('{length}', this.options.length)
      .replace('{pattern}', this.options.pattern);
  }
}

/**
 * Field Schema Definition
 * Defines validation and sanitization rules for a single field
 */
class FieldSchema {
  constructor(config) {
    this.type = config.type || 'string';
    this.required = config.required || false;
    this.defaultValue = config.default;
    this.rules = [];
    this.sanitizers = config.sanitizers || [];
    this.transform = config.transform;
    this.custom = config.custom;
    
    // Add built-in rules based on type and config
    this._addBuiltInRules(config);
    
    // Add custom rules
    if (config.rules) {
      config.rules.forEach(rule => this.addRule(rule));
    }
  }

  /**
   * Add validation rule
   * @param {ValidationRule|Object} rule - Rule to add
   */
  addRule(rule) {
    if (!(rule instanceof ValidationRule)) {
      rule = new ValidationRule(
        rule.name || 'custom',
        rule.validator,
        rule.message || 'Validation failed',
        rule.options || {}
      );
    }
    this.rules.push(rule);
    return this;
  }

  /**
   * Add built-in rules based on configuration
   * @private
   */
  _addBuiltInRules(config) {
    // Type validation
    if (this.type !== 'any') {
      this.addRule(new ValidationRule(
        'type',
        (value) => this._validateType(value, this.type),
        `{field} must be of type ${this.type}`,
        { type: this.type }
      ));
    }

    // String validations
    if (this.type === 'string') {
      if (config.minLength !== undefined) {
        this.addRule(new ValidationRule(
          'minLength',
          (value) => !value || value.length >= config.minLength,
          '{field} must be at least {min} characters long',
          { min: config.minLength }
        ));
      }

      if (config.maxLength !== undefined) {
        this.addRule(new ValidationRule(
          'maxLength',
          (value) => !value || value.length <= config.maxLength,
          '{field} must be no more than {max} characters long',
          { max: config.maxLength }
        ));
      }

      if (config.pattern) {
        const regex = config.pattern instanceof RegExp ? config.pattern : new RegExp(config.pattern);
        this.addRule(new ValidationRule(
          'pattern',
          (value) => !value || regex.test(value),
          '{field} format is invalid',
          { pattern: config.pattern }
        ));
      }

      if (config.email) {
        this.addRule(new ValidationRule(
          'email',
          (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
          '{field} must be a valid email address'
        ));
      }

      if (config.alphanumeric) {
        this.addRule(new ValidationRule(
          'alphanumeric',
          (value) => !value || /^[a-zA-Z0-9]+$/.test(value),
          '{field} must contain only letters and numbers'
        ));
      }
    }

    // Number validations
    if (this.type === 'number' || this.type === 'integer') {
      if (config.min !== undefined) {
        this.addRule(new ValidationRule(
          'min',
          (value) => value === null || value === undefined || value >= config.min,
          '{field} must be at least {min}',
          { min: config.min }
        ));
      }

      if (config.max !== undefined) {
        this.addRule(new ValidationRule(
          'max',
          (value) => value === null || value === undefined || value <= config.max,
          '{field} must be at most {max}',
          { max: config.max }
        ));
      }

      if (config.positive) {
        this.addRule(new ValidationRule(
          'positive',
          (value) => value === null || value === undefined || value > 0,
          '{field} must be a positive number'
        ));
      }
    }

    // Array validations
    if (this.type === 'array') {
      if (config.minItems !== undefined) {
        this.addRule(new ValidationRule(
          'minItems',
          (value) => !value || value.length >= config.minItems,
          '{field} must have at least {min} items',
          { min: config.minItems }
        ));
      }

      if (config.maxItems !== undefined) {
        this.addRule(new ValidationRule(
          'maxItems',
          (value) => !value || value.length <= config.maxItems,
          '{field} must have at most {max} items',
          { max: config.maxItems }
        ));
      }
    }

    // Enum validation
    if (config.enum) {
      this.addRule(new ValidationRule(
        'enum',
        (value) => !value || config.enum.includes(value),
        `{field} must be one of: ${config.enum.join(', ')}`,
        { enum: config.enum }
      ));
    }
  }

  /**
   * Validate type of value
   * @private
   */
  _validateType(value, expectedType) {
    if (value === null || value === undefined) {
      return true; // Null/undefined checked separately by required rule
    }

    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'integer':
        return Number.isInteger(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && !Array.isArray(value) && value !== null;
      case 'date':
        return value instanceof Date || !isNaN(Date.parse(value));
      default:
        return true;
    }
  }
}

/**
 * Validation Schema
 * Defines validation rules for an entire object
 */
class ValidationSchema {
  constructor(fields = {}) {
    this.fields = {};
    
    Object.entries(fields).forEach(([fieldName, config]) => {
      this.fields[fieldName] = new FieldSchema(config);
    });
  }

  /**
   * Add field schema
   * @param {string} fieldName - Name of the field
   * @param {Object|FieldSchema} config - Field configuration
   */
  addField(fieldName, config) {
    this.fields[fieldName] = config instanceof FieldSchema ? config : new FieldSchema(config);
    return this;
  }

  /**
   * Get field schema
   * @param {string} fieldName - Name of the field
   * @returns {FieldSchema|null} Field schema or null if not found
   */
  getField(fieldName) {
    return this.fields[fieldName] || null;
  }

  /**
   * Get all field names in schema
   * @returns {string[]} Array of field names
   */
  getFieldNames() {
    return Object.keys(this.fields);
  }
}

/**
 * Input Sanitizer
 * Provides data sanitization utilities
 */
class InputSanitizer {
  /**
   * Sanitize string input
   * @param {string} value - Value to sanitize
   * @param {Object} options - Sanitization options
   * @returns {string} Sanitized value
   */
  static sanitizeString(value, options = {}) {
    if (typeof value !== 'string') {
      return value;
    }

    let sanitized = value;

    // Trim whitespace
    if (options.trim !== false) {
      sanitized = sanitized.trim();
    }

    // Remove null bytes
    sanitized = sanitized.replace(/\x00/g, '');

    // HTML escape (XSS prevention)
    if (options.escapeHtml !== false) {
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }

    // Remove or replace special characters
    if (options.removeSpecialChars) {
      sanitized = sanitized.replace(/[^\w\s-._@]/g, '');
    }

    // Normalize case
    if (options.toLowerCase) {
      sanitized = sanitized.toLowerCase();
    } else if (options.toUpperCase) {
      sanitized = sanitized.toUpperCase();
    }

    // Normalize whitespace
    if (options.normalizeWhitespace) {
      sanitized = sanitized.replace(/\s+/g, ' ');
    }

    return sanitized;
  }

  /**
   * Sanitize number input
   * @param {any} value - Value to sanitize
   * @param {Object} options - Sanitization options
   * @returns {number|null} Sanitized number or null if invalid
   */
  static sanitizeNumber(value, options = {}) {
    if (value === null || value === undefined || value === '') {
      return options.allowNull ? null : 0;
    }

    const parsed = options.integer ? parseInt(value, 10) : parseFloat(value);
    
    if (isNaN(parsed)) {
      return options.allowNull ? null : 0;
    }

    // Apply bounds
    let result = parsed;
    if (options.min !== undefined) {
      result = Math.max(result, options.min);
    }
    if (options.max !== undefined) {
      result = Math.min(result, options.max);
    }

    return result;
  }

  /**
   * Sanitize array input
   * @param {any} value - Value to sanitize
   * @param {Object} options - Sanitization options
   * @returns {Array} Sanitized array
   */
  static sanitizeArray(value, options = {}) {
    if (!Array.isArray(value)) {
      if (value === null || value === undefined) {
        return [];
      }
      // Try to convert single value to array
      return [value];
    }

    let sanitized = [...value];

    // Remove null/undefined items
    if (options.removeNullish) {
      sanitized = sanitized.filter(item => item !== null && item !== undefined);
    }

    // Remove duplicates
    if (options.unique) {
      sanitized = [...new Set(sanitized)];
    }

    // Apply length limits
    if (options.maxLength !== undefined) {
      sanitized = sanitized.slice(0, options.maxLength);
    }

    return sanitized;
  }

  /**
   * Deep sanitize object
   * @param {Object} obj - Object to sanitize
   * @param {ValidationSchema} schema - Validation schema
   * @returns {Object} Sanitized object
   */
  static sanitizeObject(obj, schema) {
    if (!obj || typeof obj !== 'object') {
      return {};
    }

    const sanitized = {};

    // Process each field in schema
    schema.getFieldNames().forEach(fieldName => {
      const fieldSchema = schema.getField(fieldName);
      let value = obj[fieldName];

      // Apply default value if missing
      if ((value === undefined || value === null) && fieldSchema.defaultValue !== undefined) {
        value = typeof fieldSchema.defaultValue === 'function' 
          ? fieldSchema.defaultValue() 
          : fieldSchema.defaultValue;
      }

      // Skip if still null/undefined and not required
      if ((value === undefined || value === null) && !fieldSchema.required) {
        return;
      }

      // Apply sanitizers
      fieldSchema.sanitizers.forEach(sanitizer => {
        if (typeof sanitizer === 'function') {
          value = sanitizer(value);
        } else if (typeof sanitizer === 'string') {
          switch (sanitizer) {
            case 'string':
              value = InputSanitizer.sanitizeString(value);
              break;
            case 'number':
              value = InputSanitizer.sanitizeNumber(value);
              break;
            case 'integer':
              value = InputSanitizer.sanitizeNumber(value, { integer: true });
              break;
            case 'array':
              value = InputSanitizer.sanitizeArray(value);
              break;
          }
        }
      });

      // Apply transform function
      if (fieldSchema.transform) {
        value = fieldSchema.transform(value);
      }

      sanitized[fieldName] = value;
    });

    return sanitized;
  }
}

/**
 * Main Input Validator Class
 * Orchestrates validation and sanitization processes
 */
export class InputValidator {
  constructor() {
    this.schemas = new Map();
    this.globalRules = [];
  }

  /**
   * Register validation schema
   * @param {string} name - Schema name
   * @param {Object|ValidationSchema} schema - Schema definition
   */
  registerSchema(name, schema) {
    this.schemas.set(name, schema instanceof ValidationSchema ? schema : new ValidationSchema(schema));
    return this;
  }

  /**
   * Get registered schema
   * @param {string} name - Schema name
   * @returns {ValidationSchema|null} Schema or null if not found
   */
  getSchema(name) {
    return this.schemas.get(name) || null;
  }

  /**
   * Add global validation rule (applied to all schemas)
   * @param {ValidationRule} rule - Global rule
   */
  addGlobalRule(rule) {
    this.globalRules.push(rule);
    return this;
  }

  /**
   * Validate input data against schema
   * @param {Object} data - Data to validate
   * @param {string|ValidationSchema} schema - Schema name or schema object
   * @param {Object} options - Validation options
   * @returns {Promise<Object>} Validation result
   */
  async validate(data, schema, options = {}) {
    const validationSchema = typeof schema === 'string' ? this.getSchema(schema) : schema;
    
    if (!validationSchema) {
      throw new ValidationError(`Validation schema not found: ${schema}`);
    }

    const result = {
      valid: true,
      errors: [],
      fieldErrors: {},
      sanitizedData: {},
      metadata: {
        timestamp: new Date().toISOString(),
        fieldsValidated: [],
        rulesExecuted: 0,
      },
    };

    // Sanitize data first
    const sanitizedData = InputSanitizer.sanitizeObject(data, validationSchema);
    result.sanitizedData = sanitizedData;

    // Validate each field
    for (const fieldName of validationSchema.getFieldNames()) {
      const fieldSchema = validationSchema.getField(fieldName);
      const fieldValue = sanitizedData[fieldName];
      const fieldErrors = [];

      result.metadata.fieldsValidated.push(fieldName);

      // Check required field
      if (fieldSchema.required && (fieldValue === null || fieldValue === undefined || fieldValue === '')) {
        fieldErrors.push(`${fieldName} is required`);
      } else if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '') {
        // Run field validation rules
        for (const rule of fieldSchema.rules) {
          const isValid = await rule.validate(fieldValue, { 
            data: sanitizedData, 
            fieldName,
            schema: validationSchema 
          });
          
          result.metadata.rulesExecuted++;
          
          if (!isValid) {
            fieldErrors.push(rule.getErrorMessage(fieldName, fieldValue));
          }
        }

        // Run custom validation if provided
        if (fieldSchema.custom) {
          try {
            const customResult = await fieldSchema.custom(fieldValue, {
              data: sanitizedData,
              fieldName,
              schema: validationSchema,
            });
            
            if (customResult !== true && customResult !== undefined) {
              fieldErrors.push(typeof customResult === 'string' ? customResult : `${fieldName} failed custom validation`);
            }
          } catch (error) {
            fieldErrors.push(`${fieldName} validation error: ${error.message}`);
          }
        }
      }

      // Store field errors
      if (fieldErrors.length > 0) {
        result.fieldErrors[fieldName] = fieldErrors;
        result.errors.push(...fieldErrors);
        result.valid = false;
      }
    }

    // Run global rules
    for (const rule of this.globalRules) {
      const isValid = await rule.validate(sanitizedData, { schema: validationSchema });
      result.metadata.rulesExecuted++;
      
      if (!isValid) {
        const error = rule.getErrorMessage('data', sanitizedData);
        result.errors.push(error);
        result.valid = false;
      }
    }

    // If validation failed and options specify throwing, throw error
    if (!result.valid && options.throwOnError) {
      const validationError = new ValidationError('Input validation failed');
      Object.entries(result.fieldErrors).forEach(([field, messages]) => {
        messages.forEach(message => validationError.addFieldError(field, message));
      });
      throw validationError;
    }

    return result;
  }

  /**
   * Quick validation shorthand (throws on error)
   * @param {Object} data - Data to validate
   * @param {string|ValidationSchema} schema - Schema name or schema object
   * @returns {Promise<Object>} Sanitized data
   */
  async validateAndThrow(data, schema) {
    const result = await this.validate(data, schema, { throwOnError: true });
    return result.sanitizedData;
  }

  /**
   * Create validator instance with pre-configured schemas
   * @param {Object} schemas - Schema definitions
   * @returns {InputValidator} Configured validator instance
   */
  static create(schemas = {}) {
    const validator = new InputValidator();
    
    Object.entries(schemas).forEach(([name, schema]) => {
      validator.registerSchema(name, schema);
    });
    
    return validator;
  }
}

// ===== BUILT-IN VALIDATION SCHEMAS =====

/**
 * Character Creation Schema
 */
export const CharacterCreateSchema = new ValidationSchema({
  name: {
    type: 'string',
    required: true,
    minLength: 3,
    maxLength: 50,
    sanitizers: ['string'],
    transform: (value) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
  },
  level: {
    type: 'integer',
    required: true,
    min: 1,
    max: 100,
    sanitizers: ['integer'],
  },
  hp: {
    type: 'integer',
    required: false,
    min: 1,
    max: 9999,
    default: 10,
    sanitizers: ['integer'],
  },
  maxHP: {
    type: 'integer',
    required: false,
    min: 1,
    max: 9999,
    default: 10,
    sanitizers: ['integer'],
  },
  attack: {
    type: 'integer',
    required: false,
    min: 1,
    max: 999,
    default: 1,
    sanitizers: ['integer'],
  },
  defense: {
    type: 'integer',
    required: false,
    min: 1,
    max: 999,
    default: 1,
    sanitizers: ['integer'],
  },
  ai_type: {
    type: 'string',
    required: false,
    enum: ['aggressive', 'passive', 'guardian', 'ambush', 'caster', 'pack', 'tank'],
    default: 'passive',
    sanitizers: ['string'],
  },
  gold: {
    type: 'integer',
    required: false,
    min: 0,
    max: 999999,
    default: 0,
    sanitizers: ['integer'],
  },
  experience: {
    type: 'integer',
    required: false,
    min: 0,
    max: 999999,
    default: 0,
    sanitizers: ['integer'],
  },
  skill_points: {
    type: 'integer',
    required: false,
    min: 0,
    max: 999,
    default: 0,
    sanitizers: ['integer'],
  },
  sprite: {
    type: 'string',
    required: false,
    maxLength: 255,
    default: '',
    sanitizers: ['string'],
  },
});

/**
 * Character Update Schema
 */
export const CharacterUpdateSchema = new ValidationSchema({
  name: {
    type: 'string',
    required: false,
    minLength: 3,
    maxLength: 50,
    sanitizers: ['string'],
    transform: (value) => value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : value,
  },
  level: {
    type: 'integer',
    required: false,
    min: 1,
    max: 100,
    sanitizers: ['integer'],
  },
  hp: {
    type: 'integer',
    required: false,
    min: 1,
    max: 9999,
    sanitizers: ['integer'],
  },
  maxHP: {
    type: 'integer',
    required: false,
    min: 1,
    max: 9999,
    sanitizers: ['integer'],
  },
  attack: {
    type: 'integer',
    required: false,
    min: 1,
    max: 999,
    sanitizers: ['integer'],
  },
  defense: {
    type: 'integer',
    required: false,
    min: 1,
    max: 999,
    sanitizers: ['integer'],
  },
  ai_type: {
    type: 'string',
    required: false,
    enum: ['aggressive', 'passive', 'guardian', 'ambush', 'caster', 'pack', 'tank'],
    sanitizers: ['string'],
  },
  gold: {
    type: 'integer',
    required: false,
    min: 0,
    max: 999999,
    sanitizers: ['integer'],
  },
  experience: {
    type: 'integer',
    required: false,
    min: 0,
    max: 999999,
    sanitizers: ['integer'],
  },
  skill_points: {
    type: 'integer',
    required: false,
    min: 0,
    max: 999,
    sanitizers: ['integer'],
  },
  sprite: {
    type: 'string',
    required: false,
    maxLength: 255,
    sanitizers: ['string'],
  },
});

// Export default validator instance with built-in schemas
export default InputValidator.create({
  'character.create': CharacterCreateSchema,
  'character.update': CharacterUpdateSchema,
});