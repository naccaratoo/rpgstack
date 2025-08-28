/**
 * Database Configuration and Connection Manager
 * 
 * Centralized configuration and factory for database connections.
 * Provides dependency injection setup and configuration management
 * for different database implementations.
 */

import path from 'path';
import { JsonCharacterRepository } from '../repositories/JsonCharacterRepository.js';

export class DatabaseConfig {
  constructor(config = {}) {
    this.config = {
      // Default configuration
      type: config.type || 'json',
      dataPath: config.dataPath || path.join(process.cwd(), 'data'),
      backupPath: config.backupPath || path.join(process.cwd(), 'backups'),
      enableBackups: config.enableBackups !== false,
      maxBackups: config.maxBackups || 10,
      
      // Performance settings
      cacheSize: config.cacheSize || 1000,
      autoFlush: config.autoFlush !== false,
      flushInterval: config.flushInterval || 30000, // 30 seconds
      
      // Error handling
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      
      // Environment-specific overrides
      ...config,
    };
  }

  /**
   * Get character repository configuration
   */
  getCharacterRepositoryConfig() {
    return {
      dataPath: path.join(this.config.dataPath, 'characters.json'),
      backupPath: this.config.backupPath,
      enableBackups: this.config.enableBackups,
      maxBackups: this.config.maxBackups,
    };
  }

  /**
   * Get database type
   */
  getType() {
    return this.config.type;
  }

  /**
   * Check if backups are enabled
   */
  isBackupEnabled() {
    return this.config.enableBackups;
  }

  /**
   * Get performance settings
   */
  getPerformanceConfig() {
    return {
      cacheSize: this.config.cacheSize,
      autoFlush: this.config.autoFlush,
      flushInterval: this.config.flushInterval,
    };
  }

  /**
   * Get error handling configuration
   */
  getErrorConfig() {
    return {
      retryAttempts: this.config.retryAttempts,
      retryDelay: this.config.retryDelay,
    };
  }

  /**
   * Create configuration for different environments
   */
  static createForEnvironment(env = 'development') {
    const configs = {
      development: {
        type: 'json',
        dataPath: path.join(process.cwd(), 'data'),
        backupPath: path.join(process.cwd(), 'backups'),
        enableBackups: true,
        maxBackups: 10,
        cacheSize: 100,
        retryAttempts: 3,
      },
      
      test: {
        type: 'json',
        dataPath: path.join(process.cwd(), 'test-data'),
        backupPath: path.join(process.cwd(), 'test-data', 'backups'),
        enableBackups: false,
        maxBackups: 5,
        cacheSize: 50,
        retryAttempts: 1,
      },
      
      production: {
        type: 'json',
        dataPath: path.join(process.cwd(), 'data'),
        backupPath: path.join(process.cwd(), 'backups'),
        enableBackups: true,
        maxBackups: 20,
        cacheSize: 1000,
        autoFlush: true,
        flushInterval: 15000, // 15 seconds in production
        retryAttempts: 5,
        retryDelay: 2000,
      },
    };

    return new DatabaseConfig(configs[env] || configs.development);
  }

  /**
   * Validate configuration
   */
  validate() {
    const errors = [];

    if (!this.config.dataPath) {
      errors.push('Data path is required');
    }

    if (this.config.enableBackups && !this.config.backupPath) {
      errors.push('Backup path is required when backups are enabled');
    }

    if (this.config.maxBackups < 1) {
      errors.push('Max backups must be at least 1');
    }

    if (this.config.cacheSize < 1) {
      errors.push('Cache size must be at least 1');
    }

    if (this.config.retryAttempts < 0) {
      errors.push('Retry attempts cannot be negative');
    }

    if (this.config.retryDelay < 0) {
      errors.push('Retry delay cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}