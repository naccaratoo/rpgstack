/**
 * Database Factory
 * 
 * Factory pattern implementation for creating database connections
 * and repository instances. Provides dependency injection container
 * and manages repository lifecycle.
 */

import { DatabaseConfig } from './Database.js';
import { JsonCharacterRepository } from '../repositories/JsonCharacterRepository.js';

export class DatabaseFactory {
  constructor() {
    this._repositories = new Map();
    this._config = null;
    this._initialized = false;
  }

  /**
   * Initialize the factory with configuration
   * @param {DatabaseConfig|Object} config - Database configuration
   */
  async initialize(config) {
    if (config instanceof DatabaseConfig) {
      this._config = config;
    } else {
      this._config = new DatabaseConfig(config);
    }

    // Validate configuration
    const validation = this._config.validate();
    if (!validation.isValid) {
      throw new Error(`Database configuration invalid: ${validation.errors.join(', ')}`);
    }

    this._initialized = true;
  }

  /**
   * Get character repository instance (singleton)
   * @returns {Promise<CharacterRepository>} Character repository
   */
  async getCharacterRepository() {
    this._ensureInitialized();

    if (!this._repositories.has('character')) {
      const repository = await this._createCharacterRepository();
      await repository.initialize();
      this._repositories.set('character', repository);
    }

    return this._repositories.get('character');
  }

  /**
   * Create new character repository instance
   * @returns {Promise<CharacterRepository>} New character repository
   */
  async createCharacterRepository() {
    this._ensureInitialized();
    const repository = await this._createCharacterRepository();
    await repository.initialize();
    return repository;
  }

  /**
   * Get database configuration
   * @returns {DatabaseConfig} Database configuration
   */
  getConfig() {
    return this._config;
  }

  /**
   * Check if factory is initialized
   * @returns {boolean} True if initialized
   */
  isInitialized() {
    return this._initialized;
  }

  /**
   * Close all connections and cleanup resources
   */
  async close() {
    // In JSON implementation, there's no persistent connection to close
    // But this provides interface for future database implementations
    this._repositories.clear();
    this._initialized = false;
  }

  /**
   * Reset factory state (useful for testing)
   */
  async reset() {
    await this.close();
    this._config = null;
  }

  /**
   * Get repository statistics
   * @returns {Promise<Object>} Statistics for all repositories
   */
  async getStatistics() {
    this._ensureInitialized();

    const stats = {
      repositories: {},
      totalConnections: this._repositories.size,
      initialized: this._initialized,
      config: {
        type: this._config.getType(),
        backupsEnabled: this._config.isBackupEnabled(),
      },
    };

    // Get character repository stats if available
    if (this._repositories.has('character')) {
      const characterRepo = this._repositories.get('character');
      stats.repositories.character = await characterRepo.getStatistics();
    }

    return stats;
  }

  /**
   * Health check for all repositories
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      repositories: {},
      timestamp: new Date().toISOString(),
    };

    try {
      this._ensureInitialized();

      // Check character repository health
      if (this._repositories.has('character')) {
        const characterRepo = this._repositories.get('character');
        try {
          const count = await characterRepo.count();
          health.repositories.character = {
            status: 'healthy',
            characterCount: count,
          };
        } catch (error) {
          health.repositories.character = {
            status: 'unhealthy',
            error: error.message,
          };
          health.status = 'degraded';
        }
      } else {
        health.repositories.character = {
          status: 'not_initialized',
        };
      }

    } catch (error) {
      health.status = 'unhealthy';
      health.error = error.message;
    }

    return health;
  }

  /**
   * Create character repository based on configuration
   * @private
   */
  async _createCharacterRepository() {
    const type = this._config.getType();

    switch (type) {
      case 'json':
        return new JsonCharacterRepository(
          this._config.getCharacterRepositoryConfig()
        );

      case 'memory':
        // Future implementation for in-memory repository
        throw new Error('Memory repository not yet implemented');

      case 'mongodb':
        // Future implementation for MongoDB repository
        throw new Error('MongoDB repository not yet implemented');

      case 'postgresql':
        // Future implementation for PostgreSQL repository
        throw new Error('PostgreSQL repository not yet implemented');

      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
  }

  /**
   * Ensure factory is initialized
   * @private
   */
  _ensureInitialized() {
    if (!this._initialized) {
      throw new Error('DatabaseFactory must be initialized before use');
    }
  }

  // Static factory methods

  /**
   * Create factory for development environment
   * @returns {Promise<DatabaseFactory>} Configured factory
   */
  static async createForDevelopment() {
    const factory = new DatabaseFactory();
    await factory.initialize(DatabaseConfig.createForEnvironment('development'));
    return factory;
  }

  /**
   * Create factory for test environment
   * @returns {Promise<DatabaseFactory>} Configured factory
   */
  static async createForTest() {
    const factory = new DatabaseFactory();
    await factory.initialize(DatabaseConfig.createForEnvironment('test'));
    return factory;
  }

  /**
   * Create factory for production environment
   * @returns {Promise<DatabaseFactory>} Configured factory
   */
  static async createForProduction() {
    const factory = new DatabaseFactory();
    await factory.initialize(DatabaseConfig.createForEnvironment('production'));
    return factory;
  }

  /**
   * Create factory with custom configuration
   * @param {Object} config - Custom configuration
   * @returns {Promise<DatabaseFactory>} Configured factory
   */
  static async createWithConfig(config) {
    const factory = new DatabaseFactory();
    await factory.initialize(config);
    return factory;
  }
}