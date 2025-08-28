/**
 * Input Validation System Tests
 * 
 * Comprehensive test suite for the input validation and sanitization system,
 * covering schema validation, data sanitization, custom rules, and built-in
 * validation patterns.
 */

import {
  InputValidator,
  CharacterCreateSchema,
  CharacterUpdateSchema,
} from '../../../src/application/validation/InputValidator.js';
import { ValidationError } from '../../../src/application/errors/ApplicationErrors.js';

describe('Input Validation System', () => {
  let validator;

  beforeEach(() => {
    validator = new InputValidator();
  });

  describe('Schema Registration and Management', () => {
    test('should register and retrieve schemas', () => {
      const schema = {
        name: { type: 'string', required: true },
        age: { type: 'number', min: 0 },
      };

      validator.registerSchema('test', schema);
      const retrievedSchema = validator.getSchema('test');

      expect(retrievedSchema).toBeDefined();
      expect(retrievedSchema.getField('name')).toBeDefined();
      expect(retrievedSchema.getField('age')).toBeDefined();
    });

    test('should return null for non-existent schema', () => {
      const schema = validator.getSchema('nonexistent');
      expect(schema).toBeNull();
    });

    test('should create validator with pre-configured schemas', () => {
      const schemas = {
        user: {
          name: { type: 'string', required: true },
          email: { type: 'string', email: true },
        },
        product: {
          title: { type: 'string', minLength: 3 },
          price: { type: 'number', positive: true },
        },
      };

      const configuredValidator = InputValidator.create(schemas);
      
      expect(configuredValidator.getSchema('user')).toBeDefined();
      expect(configuredValidator.getSchema('product')).toBeDefined();
    });
  });

  describe('Basic Type Validation', () => {
    beforeEach(() => {
      validator.registerSchema('types', {
        stringField: { type: 'string' },
        numberField: { type: 'number' },
        integerField: { type: 'integer' },
        booleanField: { type: 'boolean' },
        arrayField: { type: 'array' },
        objectField: { type: 'object' },
        dateField: { type: 'date' },
      });
    });

    test('should validate string types', async () => {
      const validData = { stringField: 'hello world' };
      const invalidData = { stringField: 123 };

      const validResult = await validator.validate(validData, 'types');
      const invalidResult = await validator.validate(invalidData, 'types');

      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.fieldErrors.stringField[0]).toContain('must be of type string');
    });

    test('should validate number types', async () => {
      const validData = { numberField: 42.5 };
      const invalidData = { numberField: 'not a number' };

      const validResult = await validator.validate(validData, 'types');
      const invalidResult = await validator.validate(invalidData, 'types');

      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
    });

    test('should validate integer types', async () => {
      const validData = { integerField: 42 };
      const invalidData = { integerField: 42.5 };

      const validResult = await validator.validate(validData, 'types');
      const invalidResult = await validator.validate(invalidData, 'types');

      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
    });

    test('should validate boolean types', async () => {
      const validData = { booleanField: true };
      const invalidData = { booleanField: 'true' };

      const validResult = await validator.validate(validData, 'types');
      const invalidResult = await validator.validate(invalidData, 'types');

      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
    });

    test('should validate array types', async () => {
      const validData = { arrayField: [1, 2, 3] };
      const invalidData = { arrayField: 'not an array' };

      const validResult = await validator.validate(validData, 'types');
      const invalidResult = await validator.validate(invalidData, 'types');

      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
    });

    test('should validate object types', async () => {
      const validData = { objectField: { key: 'value' } };
      const invalidData = { objectField: ['not', 'an', 'object'] };

      const validResult = await validator.validate(validData, 'types');
      const invalidResult = await validator.validate(invalidData, 'types');

      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
    });

    test('should validate date types', async () => {
      const validData1 = { dateField: new Date() };
      const validData2 = { dateField: '2023-12-25' };
      const invalidData = { dateField: 'not a date' };

      const validResult1 = await validator.validate(validData1, 'types');
      const validResult2 = await validator.validate(validData2, 'types');
      const invalidResult = await validator.validate(invalidData, 'types');

      expect(validResult1.valid).toBe(true);
      expect(validResult2.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
    });
  });

  describe('String Validation Rules', () => {
    beforeEach(() => {
      validator.registerSchema('strings', {
        shortString: { type: 'string', minLength: 3, maxLength: 10 },
        emailField: { type: 'string', email: true },
        patternField: { type: 'string', pattern: /^[A-Z][a-z]+$/ },
        alphanumericField: { type: 'string', alphanumeric: true },
      });
    });

    test('should validate string length constraints', async () => {
      const validData = { shortString: 'hello' };
      const tooShort = { shortString: 'hi' };
      const tooLong = { shortString: 'this is way too long' };

      const validResult = await validator.validate(validData, 'strings');
      const shortResult = await validator.validate(tooShort, 'strings');
      const longResult = await validator.validate(tooLong, 'strings');

      expect(validResult.valid).toBe(true);
      expect(shortResult.valid).toBe(false);
      expect(longResult.valid).toBe(false);
      expect(shortResult.fieldErrors.shortString[0]).toContain('at least 3 characters');
      expect(longResult.fieldErrors.shortString[0]).toContain('no more than 10 characters');
    });

    test('should validate email format', async () => {
      const validEmails = ['test@example.com', 'user.name@domain.co.uk'];
      const invalidEmails = ['not-an-email', 'missing@domain', '@domain.com'];

      for (const email of validEmails) {
        const result = await validator.validate({ emailField: email }, 'strings');
        expect(result.valid).toBe(true);
      }

      for (const email of invalidEmails) {
        const result = await validator.validate({ emailField: email }, 'strings');
        expect(result.valid).toBe(false);
        expect(result.fieldErrors.emailField[0]).toContain('valid email address');
      }
    });

    test('should validate regex patterns', async () => {
      const validData = { patternField: 'Hello' };
      const invalidData = { patternField: 'hello' }; // Doesn't start with uppercase

      const validResult = await validator.validate(validData, 'strings');
      const invalidResult = await validator.validate(invalidData, 'strings');

      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
    });

    test('should validate alphanumeric strings', async () => {
      const validData = { alphanumericField: 'Hello123' };
      const invalidData = { alphanumericField: 'Hello-123' };

      const validResult = await validator.validate(validData, 'strings');
      const invalidResult = await validator.validate(invalidData, 'strings');

      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
    });
  });

  describe('Number Validation Rules', () => {
    beforeEach(() => {
      validator.registerSchema('numbers', {
        rangeNumber: { type: 'number', min: 0, max: 100 },
        positiveNumber: { type: 'number', positive: true },
        integerField: { type: 'integer', min: 1, max: 10 },
      });
    });

    test('should validate number ranges', async () => {
      const validData = { rangeNumber: 50 };
      const tooLow = { rangeNumber: -5 };
      const tooHigh = { rangeNumber: 150 };

      const validResult = await validator.validate(validData, 'numbers');
      const lowResult = await validator.validate(tooLow, 'numbers');
      const highResult = await validator.validate(tooHigh, 'numbers');

      expect(validResult.valid).toBe(true);
      expect(lowResult.valid).toBe(false);
      expect(highResult.valid).toBe(false);
    });

    test('should validate positive numbers', async () => {
      const validData = { positiveNumber: 42 };
      const invalidData = { positiveNumber: -5 };

      const validResult = await validator.validate(validData, 'numbers');
      const invalidResult = await validator.validate(invalidData, 'numbers');

      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
    });

    test('should validate integer constraints', async () => {
      const validData = { integerField: 5 };
      const invalidData = { integerField: 15 };

      const validResult = await validator.validate(validData, 'numbers');
      const invalidResult = await validator.validate(invalidData, 'numbers');

      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
    });
  });

  describe('Array Validation Rules', () => {
    beforeEach(() => {
      validator.registerSchema('arrays', {
        limitedArray: { type: 'array', minItems: 1, maxItems: 3 },
        tags: { type: 'array', minItems: 0, maxItems: 5 },
      });
    });

    test('should validate array size constraints', async () => {
      const validData = { limitedArray: [1, 2] };
      const tooSmall = { limitedArray: [] };
      const tooLarge = { limitedArray: [1, 2, 3, 4] };

      const validResult = await validator.validate(validData, 'arrays');
      const smallResult = await validator.validate(tooSmall, 'arrays');
      const largeResult = await validator.validate(tooLarge, 'arrays');

      expect(validResult.valid).toBe(true);
      expect(smallResult.valid).toBe(false);
      expect(largeResult.valid).toBe(false);
    });
  });

  describe('Enum Validation', () => {
    beforeEach(() => {
      validator.registerSchema('enums', {
        status: { type: 'string', enum: ['active', 'inactive', 'pending'] },
        priority: { type: 'number', enum: [1, 2, 3, 4, 5] },
      });
    });

    test('should validate enum values', async () => {
      const validData = { status: 'active', priority: 3 };
      const invalidStatus = { status: 'unknown' };
      const invalidPriority = { priority: 10 };

      const validResult = await validator.validate(validData, 'enums');
      const statusResult = await validator.validate(invalidStatus, 'enums');
      const priorityResult = await validator.validate(invalidPriority, 'enums');

      expect(validResult.valid).toBe(true);
      expect(statusResult.valid).toBe(false);
      expect(priorityResult.valid).toBe(false);
      expect(statusResult.fieldErrors.status[0]).toContain('must be one of: active, inactive, pending');
    });
  });

  describe('Required Field Validation', () => {
    beforeEach(() => {
      validator.registerSchema('required', {
        mandatoryField: { type: 'string', required: true },
        optionalField: { type: 'string', required: false },
      });
    });

    test('should validate required fields', async () => {
      const validData = { mandatoryField: 'present' };
      const missingRequired = {};
      const nullRequired = { mandatoryField: null };
      const emptyRequired = { mandatoryField: '' };

      const validResult = await validator.validate(validData, 'required');
      const missingResult = await validator.validate(missingRequired, 'required');
      const nullResult = await validator.validate(nullRequired, 'required');
      const emptyResult = await validator.validate(emptyRequired, 'required');

      expect(validResult.valid).toBe(true);
      expect(missingResult.valid).toBe(false);
      expect(nullResult.valid).toBe(false);
      expect(emptyResult.valid).toBe(false);
      expect(missingResult.fieldErrors.mandatoryField[0]).toContain('is required');
    });

    test('should allow missing optional fields', async () => {
      const data = { mandatoryField: 'present' };
      const result = await validator.validate(data, 'required');

      expect(result.valid).toBe(true);
      expect(result.sanitizedData.optionalField).toBeUndefined();
    });
  });

  describe('Data Sanitization', () => {
    beforeEach(() => {
      validator.registerSchema('sanitization', {
        name: {
          type: 'string',
          sanitizers: ['string'],
          transform: (value) => value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : value,
        },
        age: {
          type: 'integer',
          sanitizers: ['integer'],
        },
        score: {
          type: 'number',
          sanitizers: ['number'],
        },
        tags: {
          type: 'array',
          sanitizers: ['array'],
        },
      });
    });

    test('should sanitize string data', async () => {
      const messyData = { name: '  JOHN DOE  ' };
      const result = await validator.validate(messyData, 'sanitization');

      expect(result.valid).toBe(true);
      expect(result.sanitizedData.name).toBe('John doe'); // Trimmed and transformed
    });

    test('should sanitize number data', async () => {
      const messyData = { 
        age: '25',
        score: '87.5',
      };
      const result = await validator.validate(messyData, 'sanitization');

      expect(result.valid).toBe(true);
      expect(result.sanitizedData.age).toBe(25);
      expect(result.sanitizedData.score).toBe(87.5);
    });

    test('should sanitize array data', async () => {
      const messyData = { tags: 'single-value' };
      const result = await validator.validate(messyData, 'sanitization');

      expect(result.valid).toBe(true);
      expect(result.sanitizedData.tags).toEqual(['single-value']); // Converted to array
    });
  });

  describe('Default Values', () => {
    beforeEach(() => {
      validator.registerSchema('defaults', {
        status: {
          type: 'string',
          default: 'active',
        },
        counter: {
          type: 'number',
          default: 0,
        },
        timestamp: {
          type: 'string',
          default: () => new Date().toISOString(),
        },
      });
    });

    test('should apply static default values', async () => {
      const data = {};
      const result = await validator.validate(data, 'defaults');

      expect(result.valid).toBe(true);
      expect(result.sanitizedData.status).toBe('active');
      expect(result.sanitizedData.counter).toBe(0);
    });

    test('should apply function default values', async () => {
      const data = {};
      const result = await validator.validate(data, 'defaults');

      expect(result.valid).toBe(true);
      expect(result.sanitizedData.timestamp).toBeDefined();
      expect(new Date(result.sanitizedData.timestamp)).toBeInstanceOf(Date);
    });

    test('should not override provided values with defaults', async () => {
      const data = { status: 'inactive', counter: 5 };
      const result = await validator.validate(data, 'defaults');

      expect(result.valid).toBe(true);
      expect(result.sanitizedData.status).toBe('inactive');
      expect(result.sanitizedData.counter).toBe(5);
    });
  });

  describe('Custom Validation Rules', () => {
    beforeEach(() => {
      validator.registerSchema('custom', {
        password: {
          type: 'string',
          custom: async (value) => {
            if (!value || value.length < 8) {
              return 'Password must be at least 8 characters';
            }
            if (!/[A-Z]/.test(value)) {
              return 'Password must contain uppercase letter';
            }
            if (!/[0-9]/.test(value)) {
              return 'Password must contain number';
            }
            return true;
          },
        },
        confirmPassword: {
          type: 'string',
          custom: async (value, context) => {
            if (value !== context.data.password) {
              return 'Passwords must match';
            }
            return true;
          },
        },
      });
    });

    test('should execute custom validation rules', async () => {
      const validData = {
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
      };
      const invalidData = {
        password: 'weak',
        confirmPassword: 'different',
      };

      const validResult = await validator.validate(validData, 'custom');
      const invalidResult = await validator.validate(invalidData, 'custom');

      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.fieldErrors.password).toContain('Password must be at least 8 characters');
      expect(invalidResult.fieldErrors.confirmPassword).toContain('Passwords must match');
    });

    test('should handle custom validation errors gracefully', async () => {
      validator.registerSchema('error-custom', {
        field: {
          type: 'string',
          custom: async () => {
            throw new Error('Custom validation error');
          },
        },
      });

      const result = await validator.validate({ field: 'value' }, 'error-custom');

      expect(result.valid).toBe(false);
      expect(result.fieldErrors.field[0]).toContain('validation error');
    });
  });

  describe('Global Validation Rules', () => {
    test('should apply global rules to all validations', async () => {
      validator.addGlobalRule({
        name: 'global-test',
        validator: (data) => Object.keys(data).length > 0,
        getErrorMessage: () => 'Data cannot be empty',
      });

      validator.registerSchema('simple', {
        name: { type: 'string' },
      });

      const emptyData = {};
      const validData = { name: 'test' };

      const emptyResult = await validator.validate(emptyData, 'simple');
      const validResult = await validator.validate(validData, 'simple');

      expect(emptyResult.valid).toBe(false);
      expect(emptyResult.errors).toContain('Data cannot be empty');
      expect(validResult.valid).toBe(true);
    });
  });

  describe('Error Handling and Reporting', () => {
    beforeEach(() => {
      validator.registerSchema('errors', {
        name: { type: 'string', required: true, minLength: 3 },
        age: { type: 'number', min: 0, max: 150 },
        email: { type: 'string', email: true },
      });
    });

    test('should collect multiple field errors', async () => {
      const invalidData = {
        name: 'X',
        age: -5,
        email: 'not-email',
      };

      const result = await validator.validate(invalidData, 'errors');

      expect(result.valid).toBe(false);
      expect(Object.keys(result.fieldErrors)).toHaveLength(3);
      expect(result.fieldErrors.name).toContain('name must be at least 3 characters long');
      expect(result.fieldErrors.age).toContain('age must be at least 0');
      expect(result.fieldErrors.email).toContain('email must be a valid email address');
    });

    test('should provide validation metadata', async () => {
      const data = { name: 'John', age: 30, email: 'john@example.com' };
      const result = await validator.validate(data, 'errors');

      expect(result.metadata).toBeDefined();
      expect(result.metadata.timestamp).toBeDefined();
      expect(result.metadata.fieldsValidated).toEqual(['name', 'age', 'email']);
      expect(result.metadata.rulesExecuted).toBeGreaterThan(0);
    });

    test('should throw on validation failure when requested', async () => {
      const invalidData = { name: 'X' };

      await expect(validator.validate(invalidData, 'errors', { throwOnError: true }))
        .rejects.toThrow(ValidationError);
    });

    test('should provide shorthand validation with throwing', async () => {
      const validData = { name: 'John', age: 30, email: 'john@example.com' };
      const invalidData = { name: 'X' };

      const sanitizedData = await validator.validateAndThrow(validData, 'errors');
      expect(sanitizedData.name).toBe('John');

      await expect(validator.validateAndThrow(invalidData, 'errors'))
        .rejects.toThrow(ValidationError);
    });

    test('should throw error for unknown schema', async () => {
      await expect(validator.validate({}, 'unknown-schema'))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('Character Schema Validation', () => {
    test('should validate character creation data', async () => {
      const validCharacterData = {
        name: 'test warrior',
        level: 5,
        hp: 100,
        maxHP: 100,
        attack: 15,
        defense: 10,
        ai_type: 'aggressive',
        gold: 50,
        experience: 1000,
        skill_points: 5,
        sprite: 'warrior.png',
      };

      const result = await validator.validate(validCharacterData, CharacterCreateSchema);

      expect(result.valid).toBe(true);
      expect(result.sanitizedData.name).toBe('Test warrior'); // Capitalized
      expect(result.sanitizedData.level).toBe(5);
      expect(result.sanitizedData.ai_type).toBe('aggressive');
    });

    test('should apply character creation defaults', async () => {
      const minimalData = {
        name: 'minimal character',
        level: 1,
      };

      const result = await validator.validate(minimalData, CharacterCreateSchema);

      expect(result.valid).toBe(true);
      expect(result.sanitizedData.hp).toBe(10);
      expect(result.sanitizedData.maxHP).toBe(10);
      expect(result.sanitizedData.attack).toBe(1);
      expect(result.sanitizedData.defense).toBe(1);
      expect(result.sanitizedData.ai_type).toBe('passive');
      expect(result.sanitizedData.gold).toBe(0);
      expect(result.sanitizedData.experience).toBe(0);
      expect(result.sanitizedData.skill_points).toBe(0);
      expect(result.sanitizedData.sprite).toBe('');
    });

    test('should validate character creation constraints', async () => {
      const invalidData = {
        name: 'X', // Too short
        level: 150, // Too high
        attack: -5, // Too low
        ai_type: 'invalid', // Not in enum
      };

      const result = await validator.validate(invalidData, CharacterCreateSchema);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors.name).toBeDefined();
      expect(result.fieldErrors.level).toBeDefined();
      expect(result.fieldErrors.attack).toBeDefined();
      expect(result.fieldErrors.ai_type).toBeDefined();
    });

    test('should validate character update data', async () => {
      const updateData = {
        name: 'updated name',
        level: 10,
        attack: 25,
      };

      const result = await validator.validate(updateData, CharacterUpdateSchema);

      expect(result.valid).toBe(true);
      expect(result.sanitizedData.name).toBe('Updated name'); // Transformed
      expect(result.sanitizedData.level).toBe(10);
      expect(result.sanitizedData.attack).toBe(25);
      expect(result.sanitizedData.hp).toBeUndefined(); // Not provided, no default
    });

    test('should handle partial character updates', async () => {
      const partialUpdate = {
        gold: 100,
      };

      const result = await validator.validate(partialUpdate, CharacterUpdateSchema);

      expect(result.valid).toBe(true);
      expect(result.sanitizedData.gold).toBe(100);
      expect(Object.keys(result.sanitizedData)).toHaveLength(1);
    });
  });

  describe('Built-in Validator Instance', () => {
    test('should have character schemas pre-registered', () => {
      // Import default validator instance
      const defaultValidator = require('../../../src/application/validation/InputValidator.js').default;

      expect(defaultValidator.getSchema('character.create')).toBeDefined();
      expect(defaultValidator.getSchema('character.update')).toBeDefined();
    });
  });
});