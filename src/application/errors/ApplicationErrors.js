/**
 * Application Layer Error Handling System
 * 
 * Provides a comprehensive hierarchy of error types for the application layer,
 * enabling proper error handling, logging, and user feedback across different
 * use cases and scenarios.
 * 
 * Features:
 * - Structured error hierarchy with inheritance
 * - Context preservation and error chaining
 * - HTTP status code mapping for REST APIs
 * - Detailed error information for debugging
 * - User-friendly error messages
 * - Error severity classification
 */

/**
 * Base Application Error
 * Root class for all application-specific errors
 */
export class ApplicationError extends Error {
  /**
   * Create ApplicationError instance
   * @param {string} message - Human-readable error message
   * @param {Error} cause - Original error that caused this error
   * @param {Object} context - Additional context information
   */
  constructor(message, cause = null, context = {}) {
    super(message);
    
    this.name = this.constructor.name;
    this.cause = cause;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.severity = 'error';
    this.httpStatusCode = 500; // Internal Server Error
    
    // Preserve stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    
    // Chain original error stack if available
    if (cause && cause.stack) {
      this.stack += `\nCaused by: ${cause.stack}`;
    }
  }

  /**
   * Convert error to JSON for logging/API responses
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      severity: this.severity,
      httpStatusCode: this.httpStatusCode,
      timestamp: this.timestamp,
      context: this.context,
      cause: this.cause?.message,
    };
  }

  /**
   * Get user-friendly error message (overrideable)
   */
  getUserMessage() {
    return 'An internal error occurred. Please try again later.';
  }

  /**
   * Check if error is of a specific type or inherits from it
   */
  isType(errorClass) {
    return this instanceof errorClass;
  }
}

/**
 * Validation Error
 * For input validation failures and constraint violations
 */
export class ValidationError extends ApplicationError {
  constructor(message, cause = null, context = {}) {
    super(message, cause, context);
    this.severity = 'warning';
    this.httpStatusCode = 400; // Bad Request
    this.validationErrors = context.validationErrors || [];
  }

  getUserMessage() {
    return `Invalid input: ${this.message}`;
  }

  /**
   * Add individual field validation error
   */
  addFieldError(field, message) {
    this.validationErrors.push({ field, message });
    return this;
  }

  /**
   * Get all validation errors grouped by field
   */
  getFieldErrors() {
    return this.validationErrors.reduce((acc, error) => {
      if (!acc[error.field]) {
        acc[error.field] = [];
      }
      acc[error.field].push(error.message);
      return acc;
    }, {});
  }

  toJSON() {
    return {
      ...super.toJSON(),
      validationErrors: this.validationErrors,
      fieldErrors: this.getFieldErrors(),
    };
  }
}

/**
 * Not Found Error
 * For resources that cannot be located
 */
export class NotFoundError extends ApplicationError {
  constructor(message, cause = null, context = {}) {
    super(message, cause, context);
    this.severity = 'info';
    this.httpStatusCode = 404; // Not Found
    this.resourceType = context.resourceType || 'Resource';
    this.resourceId = context.resourceId;
  }

  getUserMessage() {
    return `${this.resourceType} not found${this.resourceId ? ` (ID: ${this.resourceId})` : ''}`;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      resourceType: this.resourceType,
      resourceId: this.resourceId,
    };
  }
}

/**
 * Business Rule Error
 * For violations of domain business rules
 */
export class BusinessRuleError extends ApplicationError {
  constructor(message, cause = null, context = {}) {
    super(message, cause, context);
    this.severity = 'warning';
    this.httpStatusCode = 422; // Unprocessable Entity
    this.businessRule = context.businessRule || 'Unknown Rule';
    this.violatedConstraints = context.violatedConstraints || [];
  }

  getUserMessage() {
    return `Business rule violation: ${this.message}`;
  }

  /**
   * Add violated constraint
   */
  addConstraint(constraint, details = '') {
    this.violatedConstraints.push({ constraint, details });
    return this;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      businessRule: this.businessRule,
      violatedConstraints: this.violatedConstraints,
    };
  }
}

/**
 * Authorization Error
 * For authentication and permission issues
 */
export class AuthorizationError extends ApplicationError {
  constructor(message, cause = null, context = {}) {
    super(message, cause, context);
    this.severity = 'warning';
    this.httpStatusCode = 403; // Forbidden
    this.requiredPermission = context.requiredPermission;
    this.userId = context.userId;
    this.action = context.action;
  }

  getUserMessage() {
    return 'You do not have permission to perform this action.';
  }

  toJSON() {
    return {
      ...super.toJSON(),
      requiredPermission: this.requiredPermission,
      userId: this.userId,
      action: this.action,
    };
  }
}

/**
 * Authentication Error
 * For authentication failures
 */
export class AuthenticationError extends ApplicationError {
  constructor(message, cause = null, context = {}) {
    super(message, cause, context);
    this.severity = 'warning';
    this.httpStatusCode = 401; // Unauthorized
    this.authMethod = context.authMethod;
  }

  getUserMessage() {
    return 'Authentication required. Please log in to continue.';
  }

  toJSON() {
    return {
      ...super.toJSON(),
      authMethod: this.authMethod,
    };
  }
}

/**
 * Conflict Error
 * For resource conflicts and race conditions
 */
export class ConflictError extends ApplicationError {
  constructor(message, cause = null, context = {}) {
    super(message, cause, context);
    this.severity = 'warning';
    this.httpStatusCode = 409; // Conflict
    this.conflictType = context.conflictType || 'Resource Conflict';
    this.conflictingResource = context.conflictingResource;
  }

  getUserMessage() {
    return `Conflict detected: ${this.message}`;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      conflictType: this.conflictType,
      conflictingResource: this.conflictingResource,
    };
  }
}

/**
 * Rate Limit Error
 * For rate limiting violations
 */
export class RateLimitError extends ApplicationError {
  constructor(message, cause = null, context = {}) {
    super(message, cause, context);
    this.severity = 'warning';
    this.httpStatusCode = 429; // Too Many Requests
    this.retryAfter = context.retryAfter;
    this.limit = context.limit;
    this.windowSize = context.windowSize;
  }

  getUserMessage() {
    return `Too many requests. Please try again${this.retryAfter ? ` after ${this.retryAfter} seconds` : ' later'}.`;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
      limit: this.limit,
      windowSize: this.windowSize,
    };
  }
}

/**
 * External Service Error
 * For failures in external service communication
 */
export class ExternalServiceError extends ApplicationError {
  constructor(message, cause = null, context = {}) {
    super(message, cause, context);
    this.severity = 'error';
    this.httpStatusCode = 502; // Bad Gateway
    this.serviceName = context.serviceName || 'External Service';
    this.serviceUrl = context.serviceUrl;
    this.requestId = context.requestId;
    this.responseStatus = context.responseStatus;
  }

  getUserMessage() {
    return `${this.serviceName} is currently unavailable. Please try again later.`;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      serviceName: this.serviceName,
      serviceUrl: this.serviceUrl,
      requestId: this.requestId,
      responseStatus: this.responseStatus,
    };
  }
}

/**
 * Database Error
 * For database-related failures
 */
export class DatabaseError extends ApplicationError {
  constructor(message, cause = null, context = {}) {
    super(message, cause, context);
    this.severity = 'error';
    this.httpStatusCode = 500; // Internal Server Error
    this.operation = context.operation;
    this.table = context.table;
    this.query = context.query;
    this.connectionInfo = context.connectionInfo;
  }

  getUserMessage() {
    return 'A database error occurred. Please try again later.';
  }

  toJSON() {
    return {
      ...super.toJSON(),
      operation: this.operation,
      table: this.table,
      // Don't include full query in production for security
      query: process.env.NODE_ENV === 'development' ? this.query : undefined,
      connectionInfo: this.connectionInfo,
    };
  }
}

/**
 * File System Error
 * For file operation failures
 */
export class FileSystemError extends ApplicationError {
  constructor(message, cause = null, context = {}) {
    super(message, cause, context);
    this.severity = 'error';
    this.httpStatusCode = 500; // Internal Server Error
    this.operation = context.operation;
    this.filePath = context.filePath;
    this.permissions = context.permissions;
  }

  getUserMessage() {
    return 'A file system error occurred. Please try again later.';
  }

  toJSON() {
    return {
      ...super.toJSON(),
      operation: this.operation,
      filePath: this.filePath,
      permissions: this.permissions,
    };
  }
}

/**
 * Configuration Error
 * For configuration and environment issues
 */
export class ConfigurationError extends ApplicationError {
  constructor(message, cause = null, context = {}) {
    super(message, cause, context);
    this.severity = 'critical';
    this.httpStatusCode = 500; // Internal Server Error
    this.configKey = context.configKey;
    this.expectedType = context.expectedType;
    this.actualValue = context.actualValue;
  }

  getUserMessage() {
    return 'Application configuration error. Please contact support.';
  }

  toJSON() {
    return {
      ...super.toJSON(),
      configKey: this.configKey,
      expectedType: this.expectedType,
      // Don't expose sensitive config values
      actualValue: this.configKey?.toLowerCase().includes('password') || 
                   this.configKey?.toLowerCase().includes('secret') || 
                   this.configKey?.toLowerCase().includes('key') 
                   ? '[REDACTED]' : this.actualValue,
    };
  }
}

/**
 * Timeout Error
 * For operation timeouts
 */
export class TimeoutError extends ApplicationError {
  constructor(message, cause = null, context = {}) {
    super(message, cause, context);
    this.severity = 'warning';
    this.httpStatusCode = 408; // Request Timeout
    this.timeoutMs = context.timeoutMs;
    this.operation = context.operation;
  }

  getUserMessage() {
    return `Operation timed out. Please try again.`;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      timeoutMs: this.timeoutMs,
      operation: this.operation,
    };
  }
}

// ===== ERROR HANDLING UTILITIES =====

/**
 * Error Handler Utility Class
 * Provides common error handling patterns and utilities
 */
export class ErrorHandler {
  /**
   * Create error from unknown input
   * @param {any} error - Unknown error input
   * @param {string} defaultMessage - Default message if error is not recognizable
   * @returns {ApplicationError} Properly typed application error
   */
  static fromUnknown(error, defaultMessage = 'Unknown error occurred') {
    if (error instanceof ApplicationError) {
      return error;
    }

    if (error instanceof Error) {
      // Try to categorize common error types
      if (error.name === 'ValidationError') {
        return new ValidationError(error.message, error);
      }
      
      if (error.message.includes('not found') || error.message.includes('ENOENT')) {
        return new NotFoundError(error.message, error);
      }
      
      if (error.message.includes('timeout') || error.name === 'TimeoutError') {
        return new TimeoutError(error.message, error);
      }
      
      if (error.message.includes('permission') || error.message.includes('EACCES')) {
        return new AuthorizationError(error.message, error);
      }
      
      return new ApplicationError(error.message, error);
    }

    // Handle string errors
    if (typeof error === 'string') {
      return new ApplicationError(error);
    }

    // Handle unknown error types
    return new ApplicationError(defaultMessage, null, { originalError: error });
  }

  /**
   * Get appropriate HTTP status code for error
   * @param {Error} error - Error to get status code for
   * @returns {number} HTTP status code
   */
  static getHttpStatusCode(error) {
    if (error instanceof ApplicationError) {
      return error.httpStatusCode;
    }
    return 500; // Internal Server Error for unknown errors
  }

  /**
   * Check if error should be logged (not for client errors)
   * @param {Error} error - Error to check
   * @returns {boolean} Whether error should be logged
   */
  static shouldLog(error) {
    if (error instanceof ApplicationError) {
      return !['info', 'warning'].includes(error.severity) || 
             error.httpStatusCode >= 500;
    }
    return true; // Log unknown errors
  }

  /**
   * Get safe error response for API
   * @param {Error} error - Error to convert
   * @param {boolean} includeStack - Whether to include stack trace (development mode)
   * @returns {Object} Safe error response object
   */
  static toApiResponse(error, includeStack = false) {
    const applicationError = ErrorHandler.fromUnknown(error);
    
    const response = {
      error: true,
      message: applicationError.getUserMessage(),
      code: applicationError.name,
      timestamp: applicationError.timestamp,
      httpStatusCode: applicationError.httpStatusCode,
    };

    // Include additional details for development
    if (includeStack || process.env.NODE_ENV === 'development') {
      response.details = {
        originalMessage: applicationError.message,
        context: applicationError.context,
        stack: applicationError.stack,
      };
      
      if (applicationError instanceof ValidationError) {
        response.validationErrors = applicationError.validationErrors;
        response.fieldErrors = applicationError.getFieldErrors();
      }
    }

    return response;
  }

  /**
   * Wrap async function with error handling
   * @param {Function} fn - Async function to wrap
   * @param {string} defaultMessage - Default error message
   * @returns {Function} Wrapped function that catches and converts errors
   */
  static wrapAsync(fn, defaultMessage = 'Operation failed') {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        throw ErrorHandler.fromUnknown(error, defaultMessage);
      }
    };
  }

  /**
   * Create error logger middleware
   * @param {Object} logger - Logger instance
   * @returns {Function} Error logging middleware
   */
  static createLogger(logger = console) {
    return (error, context = {}) => {
      if (ErrorHandler.shouldLog(error)) {
        const applicationError = ErrorHandler.fromUnknown(error);
        
        logger.error('Application Error', {
          ...applicationError.toJSON(),
          context,
        });
      }
    };
  }
}

/**
 * Error Factory for common error patterns
 */
export class ErrorFactory {
  /**
   * Create validation error with field errors
   */
  static validation(message, fieldErrors = {}) {
    const error = new ValidationError(message);
    
    Object.entries(fieldErrors).forEach(([field, messages]) => {
      if (Array.isArray(messages)) {
        messages.forEach(msg => error.addFieldError(field, msg));
      } else {
        error.addFieldError(field, messages);
      }
    });
    
    return error;
  }

  /**
   * Create not found error for specific resource
   */
  static notFound(resourceType, resourceId = null) {
    return new NotFoundError(
      `${resourceType} not found${resourceId ? ` with ID: ${resourceId}` : ''}`,
      null,
      { resourceType, resourceId }
    );
  }

  /**
   * Create business rule error with constraints
   */
  static businessRule(message, ruleName, constraints = []) {
    const error = new BusinessRuleError(message, null, { businessRule: ruleName });
    constraints.forEach(constraint => {
      error.addConstraint(constraint.name || constraint, constraint.details || '');
    });
    return error;
  }

  /**
   * Create external service error
   */
  static externalService(serviceName, message, statusCode = null, requestId = null) {
    return new ExternalServiceError(message, null, {
      serviceName,
      responseStatus: statusCode,
      requestId,
    });
  }

  /**
   * Create database error
   */
  static database(operation, table = null, originalError = null) {
    return new DatabaseError(
      `Database ${operation} operation failed${table ? ` on table '${table}'` : ''}`,
      originalError,
      { operation, table }
    );
  }
}