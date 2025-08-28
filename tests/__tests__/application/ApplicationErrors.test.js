/**
 * Application Errors System Tests
 * 
 * Comprehensive test suite for the application error handling system,
 * covering error hierarchy, context preservation, HTTP status mapping,
 * error utilities, and factory methods.
 */

import {
  ApplicationError,
  ValidationError,
  NotFoundError,
  BusinessRuleError,
  AuthorizationError,
  AuthenticationError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  DatabaseError,
  FileSystemError,
  ConfigurationError,
  TimeoutError,
  ErrorHandler,
  ErrorFactory,
} from '../../../src/application/errors/ApplicationErrors.js';

describe('Application Error System', () => {
  describe('ApplicationError Base Class', () => {
    test('should create basic application error', () => {
      const error = new ApplicationError('Test error message');

      expect(error.message).toBe('Test error message');
      expect(error.name).toBe('ApplicationError');
      expect(error.severity).toBe('error');
      expect(error.httpStatusCode).toBe(500);
      expect(error.timestamp).toBeDefined();
      expect(error.context).toEqual({});
      expect(error.cause).toBeNull();
    });

    test('should create error with cause and context', () => {
      const originalError = new Error('Original error');
      const context = { userId: '123', operation: 'test' };
      
      const error = new ApplicationError('Wrapped error', originalError, context);

      expect(error.cause).toBe(originalError);
      expect(error.context).toBe(context);
      expect(error.stack).toContain('Caused by: Error: Original error');
    });

    test('should convert to JSON correctly', () => {
      const originalError = new Error('Original error');
      const context = { field: 'value' };
      const error = new ApplicationError('Test error', originalError, context);

      const json = error.toJSON();

      expect(json.name).toBe('ApplicationError');
      expect(json.message).toBe('Test error');
      expect(json.severity).toBe('error');
      expect(json.httpStatusCode).toBe(500);
      expect(json.context).toBe(context);
      expect(json.cause).toBe('Original error');
      expect(json.timestamp).toBeDefined();
    });

    test('should provide user-friendly message', () => {
      const error = new ApplicationError('Technical error message');
      
      expect(error.getUserMessage()).toBe('An internal error occurred. Please try again later.');
    });

    test('should check error type correctly', () => {
      const error = new ApplicationError('Test');
      
      expect(error.isType(ApplicationError)).toBe(true);
      expect(error.isType(ValidationError)).toBe(false);
      expect(error.isType(Error)).toBe(true);
    });
  });

  describe('ValidationError', () => {
    test('should create validation error with correct defaults', () => {
      const error = new ValidationError('Invalid input');

      expect(error.name).toBe('ValidationError');
      expect(error.severity).toBe('warning');
      expect(error.httpStatusCode).toBe(400);
      expect(error.validationErrors).toEqual([]);
    });

    test('should add field errors', () => {
      const error = new ValidationError('Validation failed');
      
      error.addFieldError('name', 'Name is required');
      error.addFieldError('email', 'Invalid email format');
      error.addFieldError('name', 'Name too short');

      expect(error.validationErrors).toHaveLength(3);
      expect(error.validationErrors[0]).toEqual({ field: 'name', message: 'Name is required' });
      expect(error.validationErrors[2]).toEqual({ field: 'name', message: 'Name too short' });
    });

    test('should group field errors correctly', () => {
      const error = new ValidationError('Multiple validation errors');
      
      error.addFieldError('name', 'Name is required')
           .addFieldError('email', 'Invalid email')
           .addFieldError('name', 'Name too short');

      const fieldErrors = error.getFieldErrors();

      expect(fieldErrors.name).toEqual(['Name is required', 'Name too short']);
      expect(fieldErrors.email).toEqual(['Invalid email']);
    });

    test('should include field errors in JSON', () => {
      const error = new ValidationError('Validation failed');
      error.addFieldError('field1', 'Error 1');
      error.addFieldError('field2', 'Error 2');

      const json = error.toJSON();

      expect(json.validationErrors).toHaveLength(2);
      expect(json.fieldErrors.field1).toEqual(['Error 1']);
      expect(json.fieldErrors.field2).toEqual(['Error 2']);
    });

    test('should provide user-friendly validation message', () => {
      const error = new ValidationError('Technical validation error');
      
      expect(error.getUserMessage()).toBe('Invalid input: Technical validation error');
    });
  });

  describe('NotFoundError', () => {
    test('should create not found error with defaults', () => {
      const error = new NotFoundError('Item not found');

      expect(error.name).toBe('NotFoundError');
      expect(error.severity).toBe('info');
      expect(error.httpStatusCode).toBe(404);
      expect(error.resourceType).toBe('Resource');
      expect(error.resourceId).toBeUndefined();
    });

    test('should create error with resource context', () => {
      const context = { resourceType: 'Character', resourceId: 'char123' };
      const error = new NotFoundError('Character not found', null, context);

      expect(error.resourceType).toBe('Character');
      expect(error.resourceId).toBe('char123');
    });

    test('should provide contextual user message', () => {
      const error = new NotFoundError('Not found', null, {
        resourceType: 'User',
        resourceId: '123',
      });

      expect(error.getUserMessage()).toBe('User not found (ID: 123)');
    });

    test('should handle missing resource ID in user message', () => {
      const error = new NotFoundError('Not found', null, { resourceType: 'Document' });

      expect(error.getUserMessage()).toBe('Document not found');
    });
  });

  describe('BusinessRuleError', () => {
    test('should create business rule error', () => {
      const error = new BusinessRuleError('Rule violation');

      expect(error.name).toBe('BusinessRuleError');
      expect(error.severity).toBe('warning');
      expect(error.httpStatusCode).toBe(422);
      expect(error.businessRule).toBe('Unknown Rule');
      expect(error.violatedConstraints).toEqual([]);
    });

    test('should add constraint violations', () => {
      const error = new BusinessRuleError('Multiple violations');
      
      error.addConstraint('max_level', 'Level cannot exceed 100')
           .addConstraint('required_stats', 'Attack and Defense required');

      expect(error.violatedConstraints).toHaveLength(2);
      expect(error.violatedConstraints[0]).toEqual({
        constraint: 'max_level',
        details: 'Level cannot exceed 100',
      });
    });

    test('should create error with rule context', () => {
      const context = { businessRule: 'Character Creation Rules' };
      const error = new BusinessRuleError('Invalid character', null, context);

      expect(error.businessRule).toBe('Character Creation Rules');
    });
  });

  describe('AuthorizationError', () => {
    test('should create authorization error', () => {
      const error = new AuthorizationError('Access denied');

      expect(error.name).toBe('AuthorizationError');
      expect(error.httpStatusCode).toBe(403);
      expect(error.getUserMessage()).toBe('You do not have permission to perform this action.');
    });

    test('should include authorization context', () => {
      const context = {
        requiredPermission: 'admin',
        userId: 'user123',
        action: 'delete_character',
      };
      const error = new AuthorizationError('Insufficient permissions', null, context);

      expect(error.requiredPermission).toBe('admin');
      expect(error.userId).toBe('user123');
      expect(error.action).toBe('delete_character');
    });
  });

  describe('AuthenticationError', () => {
    test('should create authentication error', () => {
      const error = new AuthenticationError('Invalid credentials');

      expect(error.name).toBe('AuthenticationError');
      expect(error.httpStatusCode).toBe(401);
      expect(error.getUserMessage()).toBe('Authentication required. Please log in to continue.');
    });
  });

  describe('ConflictError', () => {
    test('should create conflict error', () => {
      const error = new ConflictError('Resource conflict');

      expect(error.name).toBe('ConflictError');
      expect(error.httpStatusCode).toBe(409);
      expect(error.conflictType).toBe('Resource Conflict');
    });
  });

  describe('RateLimitError', () => {
    test('should create rate limit error', () => {
      const context = { retryAfter: 60, limit: 100, windowSize: '1h' };
      const error = new RateLimitError('Too many requests', null, context);

      expect(error.name).toBe('RateLimitError');
      expect(error.httpStatusCode).toBe(429);
      expect(error.retryAfter).toBe(60);
      expect(error.getUserMessage()).toBe('Too many requests. Please try again after 60 seconds.');
    });
  });

  describe('ExternalServiceError', () => {
    test('should create external service error', () => {
      const context = {
        serviceName: 'Payment API',
        serviceUrl: 'https://api.payment.com',
        responseStatus: 503,
      };
      const error = new ExternalServiceError('Service unavailable', null, context);

      expect(error.name).toBe('ExternalServiceError');
      expect(error.httpStatusCode).toBe(502);
      expect(error.serviceName).toBe('Payment API');
      expect(error.getUserMessage()).toBe('Payment API is currently unavailable. Please try again later.');
    });
  });

  describe('DatabaseError', () => {
    test('should create database error', () => {
      const context = { operation: 'SELECT', table: 'characters', query: 'SELECT * FROM characters' };
      const error = new DatabaseError('Query failed', null, context);

      expect(error.name).toBe('DatabaseError');
      expect(error.httpStatusCode).toBe(500);
      expect(error.operation).toBe('SELECT');
      expect(error.table).toBe('characters');
      expect(error.getUserMessage()).toBe('A database error occurred. Please try again later.');
    });

    test('should not expose query in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const context = { query: 'SELECT * FROM sensitive_table' };
      const error = new DatabaseError('Query failed', null, context);
      
      const json = error.toJSON();
      expect(json.query).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });

    test('should expose query in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const context = { query: 'SELECT * FROM test_table' };
      const error = new DatabaseError('Query failed', null, context);
      
      const json = error.toJSON();
      expect(json.query).toBe('SELECT * FROM test_table');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('ConfigurationError', () => {
    test('should create configuration error', () => {
      const error = new ConfigurationError('Missing config');

      expect(error.name).toBe('ConfigurationError');
      expect(error.severity).toBe('critical');
      expect(error.httpStatusCode).toBe(500);
    });

    test('should redact sensitive configuration values', () => {
      const context = { configKey: 'database_password', actualValue: 'secret123' };
      const error = new ConfigurationError('Invalid config', null, context);
      
      const json = error.toJSON();
      expect(json.actualValue).toBe('[REDACTED]');
    });

    test('should not redact non-sensitive configuration values', () => {
      const context = { configKey: 'app_port', actualValue: '3000' };
      const error = new ConfigurationError('Invalid config', null, context);
      
      const json = error.toJSON();
      expect(json.actualValue).toBe('3000');
    });
  });

  describe('TimeoutError', () => {
    test('should create timeout error', () => {
      const context = { timeoutMs: 5000, operation: 'database_query' };
      const error = new TimeoutError('Operation timed out', null, context);

      expect(error.name).toBe('TimeoutError');
      expect(error.httpStatusCode).toBe(408);
      expect(error.timeoutMs).toBe(5000);
      expect(error.operation).toBe('database_query');
    });
  });

  describe('ErrorHandler Utility', () => {
    test('should convert unknown error to ApplicationError', () => {
      const unknownError = new Error('Unknown error');
      const appError = ErrorHandler.fromUnknown(unknownError);

      expect(appError).toBeInstanceOf(ApplicationError);
      expect(appError.message).toBe('Unknown error');
      expect(appError.cause).toBe(unknownError);
    });

    test('should pass through ApplicationError unchanged', () => {
      const appError = new ValidationError('Validation failed');
      const result = ErrorHandler.fromUnknown(appError);

      expect(result).toBe(appError);
    });

    test('should categorize known error types', () => {
      const validationError = new Error('ValidationError: Invalid input');
      validationError.name = 'ValidationError';
      
      const result = ErrorHandler.fromUnknown(validationError);

      expect(result).toBeInstanceOf(ValidationError);
    });

    test('should handle string errors', () => {
      const result = ErrorHandler.fromUnknown('String error message');

      expect(result).toBeInstanceOf(ApplicationError);
      expect(result.message).toBe('String error message');
    });

    test('should handle completely unknown error types', () => {
      const weirdError = { someProperty: 'value' };
      const result = ErrorHandler.fromUnknown(weirdError, 'Fallback message');

      expect(result).toBeInstanceOf(ApplicationError);
      expect(result.message).toBe('Fallback message');
      expect(result.context.originalError).toBe(weirdError);
    });

    test('should get correct HTTP status codes', () => {
      expect(ErrorHandler.getHttpStatusCode(new ValidationError('test'))).toBe(400);
      expect(ErrorHandler.getHttpStatusCode(new NotFoundError('test'))).toBe(404);
      expect(ErrorHandler.getHttpStatusCode(new Error('test'))).toBe(500);
    });

    test('should determine if error should be logged', () => {
      expect(ErrorHandler.shouldLog(new ValidationError('test'))).toBe(false);
      expect(ErrorHandler.shouldLog(new NotFoundError('test'))).toBe(false);
      expect(ErrorHandler.shouldLog(new ApplicationError('test'))).toBe(true);
      expect(ErrorHandler.shouldLog(new Error('test'))).toBe(true);
    });

    test('should create safe API response', () => {
      const error = new ValidationError('Technical validation error');
      error.addFieldError('email', 'Invalid format');
      
      const response = ErrorHandler.toApiResponse(error, false);

      expect(response.error).toBe(true);
      expect(response.message).toBe('Invalid input: Technical validation error');
      expect(response.code).toBe('ValidationError');
      expect(response.httpStatusCode).toBe(400);
      expect(response.timestamp).toBeDefined();
      expect(response.details).toBeUndefined(); // Not in production mode
    });

    test('should include details in development mode', () => {
      const error = new ValidationError('Validation failed');
      error.addFieldError('name', 'Required');
      
      const response = ErrorHandler.toApiResponse(error, true);

      expect(response.details).toBeDefined();
      expect(response.details.originalMessage).toBe('Validation failed');
      expect(response.validationErrors).toBeDefined();
      expect(response.fieldErrors).toBeDefined();
    });

    test('should wrap async functions with error handling', async () => {
      const throwingFunction = async (shouldThrow) => {
        if (shouldThrow) {
          throw new Error('Something went wrong');
        }
        return 'success';
      };

      const wrappedFunction = ErrorHandler.wrapAsync(throwingFunction, 'Operation failed');

      const successResult = await wrappedFunction(false);
      expect(successResult).toBe('success');

      await expect(wrappedFunction(true)).rejects.toThrow(ApplicationError);
    });

    test('should create error logger', () => {
      const mockLogger = {
        error: jest.fn(),
      };

      const logError = ErrorHandler.createLogger(mockLogger);
      const error = new ApplicationError('Test error');
      
      logError(error, { userId: '123' });

      expect(mockLogger.error).toHaveBeenCalledWith('Application Error', expect.objectContaining({
        name: 'ApplicationError',
        message: 'Test error',
        context: { userId: '123' },
      }));
    });
  });

  describe('ErrorFactory', () => {
    test('should create validation error with field errors', () => {
      const error = ErrorFactory.validation('Multiple validation errors', {
        name: ['Required', 'Too short'],
        email: 'Invalid format',
      });

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.validationErrors).toHaveLength(3);
      
      const fieldErrors = error.getFieldErrors();
      expect(fieldErrors.name).toEqual(['Required', 'Too short']);
      expect(fieldErrors.email).toEqual(['Invalid format']);
    });

    test('should create not found error for resource', () => {
      const error = ErrorFactory.notFound('Character', 'char123');

      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('Character not found with ID: char123');
      expect(error.resourceType).toBe('Character');
      expect(error.resourceId).toBe('char123');
    });

    test('should create business rule error with constraints', () => {
      const constraints = [
        { name: 'max_level', details: 'Cannot exceed level 100' },
        { name: 'required_stats', details: 'Attack and defense required' },
      ];
      
      const error = ErrorFactory.businessRule('Character validation failed', 'Character Rules', constraints);

      expect(error).toBeInstanceOf(BusinessRuleError);
      expect(error.businessRule).toBe('Character Rules');
      expect(error.violatedConstraints).toHaveLength(2);
    });

    test('should create external service error', () => {
      const error = ErrorFactory.externalService('Payment API', 'Service unavailable', 503, 'req123');

      expect(error).toBeInstanceOf(ExternalServiceError);
      expect(error.serviceName).toBe('Payment API');
      expect(error.responseStatus).toBe(503);
      expect(error.requestId).toBe('req123');
    });

    test('should create database error', () => {
      const originalError = new Error('Connection failed');
      const error = ErrorFactory.database('SELECT', 'users', originalError);

      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.operation).toBe('SELECT');
      expect(error.table).toBe('users');
      expect(error.cause).toBe(originalError);
    });
  });

  describe('Error Inheritance and Polymorphism', () => {
    test('should maintain proper inheritance chain', () => {
      const validation = new ValidationError('test');
      const notFound = new NotFoundError('test');
      const business = new BusinessRuleError('test');

      expect(validation).toBeInstanceOf(ApplicationError);
      expect(validation).toBeInstanceOf(Error);
      expect(notFound).toBeInstanceOf(ApplicationError);
      expect(business).toBeInstanceOf(ApplicationError);
    });

    test('should allow polymorphic error handling', () => {
      const errors = [
        new ValidationError('Validation failed'),
        new NotFoundError('Not found'),
        new BusinessRuleError('Rule violated'),
        new ApplicationError('General error'),
      ];

      errors.forEach(error => {
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error).toBeInstanceOf(Error);
        expect(typeof error.toJSON).toBe('function');
        expect(typeof error.getUserMessage).toBe('function');
        expect(typeof error.httpStatusCode).toBe('number');
      });
    });
  });
});