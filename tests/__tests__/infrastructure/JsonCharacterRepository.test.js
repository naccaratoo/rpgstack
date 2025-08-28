/**
 * JsonCharacterRepository Tests
 * 
 * Comprehensive test suite for JSON-based character repository implementation
 * covering CRUD operations, caching, transactions, backups, and error handling.
 */

import fs from 'fs/promises';
import path from 'path';
import { JsonCharacterRepository } from '../../../src/infrastructure/repositories/JsonCharacterRepository.js';
import { Character } from '../../../src/domain/entities/Character.js';
import { CharacterId } from '../../../src/domain/value-objects/CharacterId.js';
import { Stats } from '../../../src/domain/value-objects/Stats.js';

// Test configuration
const TEST_DATA_DIR = path.join(process.cwd(), 'test-data');
const TEST_DATA_FILE = path.join(TEST_DATA_DIR, 'test-characters.json');
const TEST_BACKUP_DIR = path.join(TEST_DATA_DIR, 'backups');

describe('JsonCharacterRepository', () => {
  let repository;
  let testCharacter;
  
  beforeEach(async () => {
    // Clean up test directories
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist
    }
    
    // Create repository with test configuration
    repository = new JsonCharacterRepository({
      dataPath: TEST_DATA_FILE,
      backupPath: TEST_BACKUP_DIR,
      enableBackups: true,
      maxBackups: 5,
    });
    
    await repository.initialize();
    
    // Create test character
    testCharacter = Character.create({
      name: 'Test Hero',
      level: 5,
      stats: {
        hp: 50,
        maxHP: 50,
        attack: 10,
        defense: 8,
      },
      ai_type: 'aggressive',
    });
  });
  
  afterEach(async () => {
    // Clean up test directories
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Initialization', () => {
    test('should create data directory and file on initialization', async () => {
      const stats = await fs.stat(TEST_DATA_FILE);
      expect(stats.isFile()).toBe(true);
    });

    test('should create backup directory when enabled', async () => {
      const stats = await fs.stat(TEST_BACKUP_DIR);
      expect(stats.isDirectory()).toBe(true);
    });

    test('should start with empty repository', async () => {
      const count = await repository.count();
      expect(count).toBe(0);
    });
  });

  describe('Basic CRUD Operations', () => {
    test('should save and retrieve character by ID', async () => {
      await repository.save(testCharacter);
      
      const retrieved = await repository.findById(testCharacter.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved.name).toBe('Test Hero');
      expect(retrieved.level).toBe(5);
      expect(retrieved.stats.hp).toBe(50);
    });

    test('should return null for non-existent character', async () => {
      const nonExistentId = CharacterId.generate();
      const result = await repository.findById(nonExistentId);
      expect(result).toBeNull();
    });

    test('should update existing character', async () => {
      await repository.save(testCharacter);
      
      const updatedCharacter = testCharacter.update({
        name: 'Updated Hero',
        level: 10,
      });
      
      await repository.save(updatedCharacter);
      
      const retrieved = await repository.findById(testCharacter.id);
      expect(retrieved.name).toBe('Updated Hero');
      expect(retrieved.level).toBe(10);
    });

    test('should delete character by ID', async () => {
      await repository.save(testCharacter);
      expect(await repository.exists(testCharacter.id)).toBe(true);
      
      const deleted = await repository.delete(testCharacter.id);
      expect(deleted).toBe(true);
      expect(await repository.exists(testCharacter.id)).toBe(false);
    });

    test('should return false when deleting non-existent character', async () => {
      const nonExistentId = CharacterId.generate();
      const deleted = await repository.delete(nonExistentId);
      expect(deleted).toBe(false);
    });
  });

  describe('Find Operations', () => {
    beforeEach(async () => {
      // Create multiple test characters
      const characters = [
        Character.create({
          name: 'Warrior',
          level: 10,
          stats: { hp: 100, maxHP: 100, attack: 15, defense: 12 },
          ai_type: 'aggressive',
        }),
        Character.create({
          name: 'Mage',
          level: 8,
          stats: { hp: 60, maxHP: 60, attack: 20, defense: 5 },
          ai_type: 'caster',
        }),
        Character.create({
          name: 'Rogue',
          level: 12,
          stats: { hp: 80, maxHP: 80, attack: 18, defense: 8 },
          ai_type: 'ambush',
        }),
      ];
      
      await repository.bulkSave(characters);
    });

    test('should find all characters', async () => {
      const characters = await repository.findAll();
      expect(characters).toHaveLength(3);
    });

    test('should find characters by level range', async () => {
      const characters = await repository.findByLevelRange(8, 10);
      expect(characters).toHaveLength(2);
      expect(characters.every(c => c.level >= 8 && c.level <= 10)).toBe(true);
    });

    test('should find characters by AI type', async () => {
      const casters = await repository.findByAIType('caster');
      expect(casters).toHaveLength(1);
      expect(casters[0].name).toBe('Mage');
    });

    test('should find characters by name pattern', async () => {
      const rogues = await repository.findByName('Rog');
      expect(rogues).toHaveLength(1);
      expect(rogues[0].name).toBe('Rogue');
    });

    test('should find characters by complex criteria', async () => {
      const results = await repository.findByCriteria({
        level: { min: 10 },
        aiType: ['aggressive', 'ambush'],
      });
      
      expect(results).toHaveLength(2);
      expect(results.every(c => c.level >= 10)).toBe(true);
      expect(results.every(c => ['aggressive', 'ambush'].includes(c.aiType))).toBe(true);
    });

    test('should count characters correctly', async () => {
      const count = await repository.count();
      expect(count).toBe(3);
    });
  });

  describe('Bulk Operations', () => {
    test('should bulk save multiple characters', async () => {
      const characters = [
        Character.create({
          name: 'Bulk1',
          level: 1,
          stats: { hp: 10, maxHP: 10, attack: 1, defense: 1 },
          ai_type: 'passive',
        }),
        Character.create({
          name: 'Bulk2',
          level: 2,
          stats: { hp: 20, maxHP: 20, attack: 2, defense: 2 },
          ai_type: 'aggressive',
        }),
      ];
      
      const saved = await repository.bulkSave(characters);
      expect(saved).toHaveLength(2);
      
      const count = await repository.count();
      expect(count).toBe(2);
    });

    test('should bulk delete multiple characters', async () => {
      // Save characters first
      const characters = [
        Character.create({
          name: 'Delete1',
          level: 1,
          stats: { hp: 10, maxHP: 10, attack: 1, defense: 1 },
          ai_type: 'passive',
        }),
        Character.create({
          name: 'Delete2',
          level: 2,
          stats: { hp: 20, maxHP: 20, attack: 2, defense: 2 },
          ai_type: 'aggressive',
        }),
      ];
      
      await repository.bulkSave(characters);
      expect(await repository.count()).toBe(2);
      
      const ids = characters.map(c => c.id);
      const deletedCount = await repository.bulkDelete(ids);
      
      expect(deletedCount).toBe(2);
      expect(await repository.count()).toBe(0);
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      const characters = [
        Character.create({
          name: 'Low Level',
          level: 1,
          stats: { hp: 10, maxHP: 10, attack: 1, defense: 1 },
          ai_type: 'passive',
        }),
        Character.create({
          name: 'High Level',
          level: 50,
          stats: { hp: 500, maxHP: 500, attack: 50, defense: 50 },
          ai_type: 'aggressive',
        }),
      ];
      
      await repository.bulkSave(characters);
    });

    test('should provide repository statistics', async () => {
      const stats = await repository.getStatistics();
      
      expect(stats.totalCharacters).toBe(2);
      expect(stats.levels.min).toBe(1);
      expect(stats.levels.max).toBe(50);
      expect(stats.levels.average).toBe(25.5);
      expect(stats.aiTypes.passive).toBe(1);
      expect(stats.aiTypes.aggressive).toBe(1);
      expect(stats.dataSize).toBeGreaterThan(0);
    });
  });

  describe('Transactions', () => {
    test('should rollback changes on transaction failure', async () => {
      await repository.save(testCharacter);
      expect(await repository.count()).toBe(1);
      
      try {
        await repository.transaction(async (repo) => {
          // Add a character
          const newCharacter = Character.create({
            name: 'Transaction Test',
            level: 1,
            stats: { hp: 10, maxHP: 10, attack: 1, defense: 1 },
            ai_type: 'passive',
          });
          await repo.save(newCharacter);
          
          // Force an error
          throw new Error('Transaction failed');
        });
      } catch (error) {
        expect(error.message).toBe('Transaction failed');
      }
      
      // Should still have only the original character
      expect(await repository.count()).toBe(1);
    });

    test('should commit changes on successful transaction', async () => {
      await repository.transaction(async (repo) => {
        await repo.save(testCharacter);
        
        const newCharacter = Character.create({
          name: 'Transaction Success',
          level: 1,
          stats: { hp: 10, maxHP: 10, attack: 1, defense: 1 },
          ai_type: 'passive',
        });
        await repo.save(newCharacter);
      });
      
      expect(await repository.count()).toBe(2);
    });
  });

  describe('Backup and Restore', () => {
    test('should create and restore from backup', async () => {
      // Save initial data
      await repository.save(testCharacter);
      
      // Create backup
      const backupId = await repository.createBackup();
      expect(typeof backupId).toBe('string');
      
      // Modify data
      const newCharacter = Character.create({
        name: 'New Character',
        level: 1,
        stats: { hp: 10, maxHP: 10, attack: 1, defense: 1 },
        ai_type: 'passive',
      });
      await repository.save(newCharacter);
      expect(await repository.count()).toBe(2);
      
      // Restore from backup
      await repository.restoreFromBackup(backupId);
      expect(await repository.count()).toBe(1);
      
      const restored = await repository.findById(testCharacter.id);
      expect(restored).not.toBeNull();
      expect(restored.name).toBe('Test Hero');
    });

    test('should limit number of backup files', async () => {
      // Create more backups than the limit
      for (let i = 0; i < 7; i++) {
        await repository.createBackup();
      }
      
      // Check that only maxBackups (5) files exist
      const files = await fs.readdir(TEST_BACKUP_DIR);
      const backupFiles = files.filter(f => f.startsWith('backup_') && f.endsWith('.json'));
      expect(backupFiles.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Error Handling', () => {
    test('should throw error for invalid character ID type', async () => {
      await expect(repository.findById('invalid-id')).rejects.toThrow('ID must be a CharacterId instance');
    });

    test('should throw error when saving non-Character instance', async () => {
      await expect(repository.save({ name: 'Not a character' })).rejects.toThrow('Must provide Character instance');
    });

    test('should throw error for invalid bulk save data', async () => {
      await expect(repository.bulkSave([{ invalid: 'data' }])).rejects.toThrow('All items must be Character instances');
    });

    test('should handle corrupted data file gracefully', async () => {
      // Write invalid JSON to data file
      await fs.writeFile(TEST_DATA_FILE, 'invalid json', 'utf8');
      
      // Create new repository instance
      const corruptedRepo = new JsonCharacterRepository({
        dataPath: TEST_DATA_FILE,
        backupPath: TEST_BACKUP_DIR,
      });
      
      await expect(corruptedRepo.initialize()).rejects.toThrow('Failed to initialize JsonCharacterRepository');
    });
  });

  describe('Caching', () => {
    test('should cache loaded characters for performance', async () => {
      await repository.save(testCharacter);
      
      // First access should load from file
      const first = await repository.findById(testCharacter.id);
      expect(first).not.toBeNull();
      
      // Modify file directly (bypass repository)
      const data = JSON.parse(await fs.readFile(TEST_DATA_FILE, 'utf8'));
      data.characters[testCharacter.id.toString()].name = 'Modified Outside';
      await fs.writeFile(TEST_DATA_FILE, JSON.stringify(data), 'utf8');
      
      // Second access should use cache (original name)
      const second = await repository.findById(testCharacter.id);
      expect(second.name).toBe('Test Hero'); // Original cached value
      
      // Create new repository instance to test fresh load
      const newRepo = new JsonCharacterRepository({
        dataPath: TEST_DATA_FILE,
        backupPath: TEST_BACKUP_DIR,
      });
      await newRepo.initialize();
      
      const fresh = await newRepo.findById(testCharacter.id);
      expect(fresh.name).toBe('Modified Outside'); // Fresh load from file
    });
  });

  describe('Data Format Compatibility', () => {
    test('should handle legacy data format', async () => {
      // Write legacy format data
      const legacyData = {
        characters: {
          'ABC123DEF0': {
            id: 'ABC123DEF0',
            name: 'Legacy Character',
            level: 10,
            hp: 100,
            max_hp: 100, // Legacy snake_case
            attack: 15,
            defense: 10,
            ai_type: 'aggressive',
            sprite: 'legacy.png',
            gold: 500,
            experience: 1000,
            skill_points: 5,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
            version: '1.0.0',
            legacy: true,
          },
        },
      };
      
      await fs.writeFile(TEST_DATA_FILE, JSON.stringify(legacyData), 'utf8');
      
      // Create new repository and load
      const legacyRepo = new JsonCharacterRepository({
        dataPath: TEST_DATA_FILE,
        backupPath: TEST_BACKUP_DIR,
      });
      await legacyRepo.initialize();
      
      const character = await legacyRepo.findById(CharacterId.fromString('ABC123DEF0'));
      expect(character).not.toBeNull();
      expect(character.name).toBe('Legacy Character');
      expect(character.stats.maxHP).toBe(100); // Converted from max_hp
      expect(character.isLegacy).toBe(true);
    });
  });
});