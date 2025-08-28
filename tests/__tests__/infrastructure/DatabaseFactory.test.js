/**
 * DatabaseFactory Tests
 * 
 * Test suite for database factory, configuration management,
 * and dependency injection container.
 */

import fs from 'fs/promises';
import path from 'path';
import { DatabaseFactory } from '../../../src/infrastructure/config/DatabaseFactory.js';
import { DatabaseConfig } from '../../../src/infrastructure/config/Database.js';
import { JsonCharacterRepository } from '../../../src/infrastructure/repositories/JsonCharacterRepository.js';
import { Character } from '../../../src/domain/entities/Character.js';

const TEST_DATA_DIR = path.join(process.cwd(), 'test-factory-data');

describe('DatabaseFactory', () => {
  let factory;

  beforeEach(() => {
    factory = new DatabaseFactory();
  });

  afterEach(async () => {
    if (factory.isInitialized()) {
      await factory.close();
    }
    
    // Clean up test data
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Initialization', () => {
    test('should initialize with DatabaseConfig instance', async () => {
      const config = new DatabaseConfig({
        type: 'json',
        dataPath: TEST_DATA_DIR,
        backupPath: path.join(TEST_DATA_DIR, 'backups'),
      });

      await factory.initialize(config);
      
      expect(factory.isInitialized()).toBe(true);
      expect(factory.getConfig()).toBe(config);
    });

    test('should initialize with plain configuration object', async () => {
      const config = {
        type: 'json',
        dataPath: TEST_DATA_DIR,
        backupPath: path.join(TEST_DATA_DIR, 'backups'),
      };

      await factory.initialize(config);
      
      expect(factory.isInitialized()).toBe(true);
      expect(factory.getConfig()).toBeInstanceOf(DatabaseConfig);
    });

    test('should throw error for invalid configuration', async () => {
      const invalidConfig = {
        type: 'json',
        // Missing required dataPath
        maxBackups: -1, // Invalid value
      };

      await expect(factory.initialize(invalidConfig)).rejects.toThrow('Database configuration invalid');
    });

    test('should not allow operations before initialization', async () => {
      await expect(factory.getCharacterRepository()).rejects.toThrow('DatabaseFactory must be initialized before use');
    });
  });

  describe('Repository Creation', () => {
    beforeEach(async () => {
      await factory.initialize({
        type: 'json',
        dataPath: TEST_DATA_DIR,
        backupPath: path.join(TEST_DATA_DIR, 'backups'),
        enableBackups: false, // Disable for test speed
      });
    });

    test('should create character repository singleton', async () => {
      const repo1 = await factory.getCharacterRepository();
      const repo2 = await factory.getCharacterRepository();
      
      expect(repo1).toBeInstanceOf(JsonCharacterRepository);
      expect(repo1).toBe(repo2); // Should be same instance (singleton)
    });

    test('should create new character repository instances', async () => {
      const repo1 = await factory.createCharacterRepository();
      const repo2 = await factory.createCharacterRepository();
      
      expect(repo1).toBeInstanceOf(JsonCharacterRepository);
      expect(repo2).toBeInstanceOf(JsonCharacterRepository);
      expect(repo1).not.toBe(repo2); // Should be different instances
    });

    test('should initialize repositories before returning', async () => {
      const repo = await factory.getCharacterRepository();
      
      // Repository should be functional immediately
      const count = await repo.count();
      expect(typeof count).toBe('number');
    });

    test('should throw error for unsupported database types', async () => {
      await factory.initialize({
        type: 'unsupported',
        dataPath: TEST_DATA_DIR,
      });

      await expect(factory.getCharacterRepository()).rejects.toThrow('Unsupported database type: unsupported');
    });
  });

  describe('Environment-Specific Factories', () => {
    afterEach(async () => {
      // Close environment factories
      if (factory && factory.isInitialized()) {
        await factory.close();
      }
    });

    test('should create development environment factory', async () => {
      factory = await DatabaseFactory.createForDevelopment();
      
      expect(factory.isInitialized()).toBe(true);
      expect(factory.getConfig().getType()).toBe('json');
      expect(factory.getConfig().isBackupEnabled()).toBe(true);
    });

    test('should create test environment factory', async () => {
      factory = await DatabaseFactory.createForTest();
      
      expect(factory.isInitialized()).toBe(true);
      expect(factory.getConfig().isBackupEnabled()).toBe(false);
    });

    test('should create production environment factory', async () => {
      factory = await DatabaseFactory.createForProduction();
      
      expect(factory.isInitialized()).toBe(true);
      expect(factory.getConfig().isBackupEnabled()).toBe(true);
    });

    test('should create factory with custom configuration', async () => {
      const customConfig = {
        type: 'json',
        dataPath: TEST_DATA_DIR,
        enableBackups: false,
        maxBackups: 3,
      };

      factory = await DatabaseFactory.createWithConfig(customConfig);
      
      expect(factory.isInitialized()).toBe(true);
      expect(factory.getConfig().getCharacterRepositoryConfig().maxBackups).toBe(3);
    });
  });

  describe('Statistics and Health', () => {
    beforeEach(async () => {
      await factory.initialize({
        type: 'json',
        dataPath: TEST_DATA_DIR,
        backupPath: path.join(TEST_DATA_DIR, 'backups'),
        enableBackups: false,
      });
    });

    test('should provide factory statistics', async () => {
      // Get repository to initialize it
      await factory.getCharacterRepository();
      
      const stats = await factory.getStatistics();
      
      expect(stats).toEqual({
        repositories: {
          character: expect.objectContaining({
            totalCharacters: expect.any(Number),
            dataSize: expect.any(Number),
          }),
        },
        totalConnections: 1,
        initialized: true,
        config: {
          type: 'json',
          backupsEnabled: false,
        },
      });
    });

    test('should provide health check', async () => {
      const health = await factory.healthCheck();
      
      expect(health).toEqual({
        status: 'healthy',
        repositories: {
          character: {
            status: 'not_initialized',
          },
        },
        timestamp: expect.any(String),
      });
    });

    test('should report repository health after initialization', async () => {
      const repo = await factory.getCharacterRepository();
      
      // Add test data
      const character = Character.create({
        name: 'Health Test',
        level: 1,
        stats: { hp: 10, maxHP: 10, attack: 1, defense: 1 },
        ai_type: 'passive',
      });
      await repo.save(character);
      
      const health = await factory.healthCheck();
      
      expect(health).toEqual({
        status: 'healthy',
        repositories: {
          character: {
            status: 'healthy',
            characterCount: 1,
          },
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe('Lifecycle Management', () => {
    beforeEach(async () => {
      await factory.initialize({
        type: 'json',
        dataPath: TEST_DATA_DIR,
        backupPath: path.join(TEST_DATA_DIR, 'backups'),
      });
    });

    test('should close all connections', async () => {
      // Initialize repository
      await factory.getCharacterRepository();
      expect(factory.isInitialized()).toBe(true);
      
      await factory.close();
      expect(factory.isInitialized()).toBe(false);
    });

    test('should reset factory state', async () => {
      // Initialize and create repository
      const repo = await factory.getCharacterRepository();
      expect(repo).toBeInstanceOf(JsonCharacterRepository);
      
      await factory.reset();
      
      expect(factory.isInitialized()).toBe(false);
      expect(factory.getConfig()).toBeNull();
    });

    test('should allow reinitialization after reset', async () => {
      await factory.getCharacterRepository();
      await factory.reset();
      
      await factory.initialize({
        type: 'json',
        dataPath: TEST_DATA_DIR,
        backupPath: path.join(TEST_DATA_DIR, 'backups'),
      });
      
      const newRepo = await factory.getCharacterRepository();
      expect(newRepo).toBeInstanceOf(JsonCharacterRepository);
    });
  });

  describe('Error Handling', () => {
    test('should handle repository initialization errors', async () => {
      // Initialize with invalid path (read-only directory or similar)
      await factory.initialize({
        type: 'json',
        dataPath: '/invalid/readonly/path',
        enableBackups: false,
      });

      // Repository creation should handle initialization errors gracefully
      // The exact error will depend on the system, but it should propagate
      await expect(factory.getCharacterRepository()).rejects.toThrow();
    });

    test('should handle health check errors gracefully', async () => {
      await factory.initialize({
        type: 'json',
        dataPath: '/invalid/path',
        enableBackups: false,
      });

      // Force repository creation to get it in cache, but it may fail
      try {
        await factory.getCharacterRepository();
      } catch (error) {
        // Expected to fail with invalid path
      }

      const health = await factory.healthCheck();
      // Health check should either be healthy (if repo initialized) 
      // or show degraded/unhealthy status if repository has errors
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
    });
  });

  describe('Configuration Validation', () => {
    test('should validate DatabaseConfig', () => {
      const validConfig = new DatabaseConfig({
        type: 'json',
        dataPath: TEST_DATA_DIR,
        backupPath: path.join(TEST_DATA_DIR, 'backups'),
      });

      const validation = validConfig.validate();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should catch configuration errors', () => {
      const invalidConfig = new DatabaseConfig({
        type: 'json',
        dataPath: '', // Invalid - empty path
        maxBackups: -1, // Invalid - negative
        cacheSize: 0, // Invalid - zero
        retryAttempts: -1, // Invalid - negative
      });

      const validation = invalidConfig.validate();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    test('should provide environment-specific configurations', () => {
      const devConfig = DatabaseConfig.createForEnvironment('development');
      const testConfig = DatabaseConfig.createForEnvironment('test');
      const prodConfig = DatabaseConfig.createForEnvironment('production');

      expect(devConfig.isBackupEnabled()).toBe(true);
      expect(testConfig.isBackupEnabled()).toBe(false);
      expect(prodConfig.isBackupEnabled()).toBe(true);
      
      // Production should have more conservative settings
      expect(prodConfig.getPerformanceConfig().flushInterval).toBeLessThan(
        devConfig.getPerformanceConfig().flushInterval
      );
    });
  });
});