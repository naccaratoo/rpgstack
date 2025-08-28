/**
 * Character Service Integration Tests
 * 
 * Comprehensive test suite for the CharacterService application layer,
 * covering all CRUD operations, business logic coordination, error handling,
 * and integration with domain services and repositories.
 * 
 * Test Coverage:
 * - Character CRUD operations
 * - Input validation and sanitization
 * - Business rule validation
 * - Character progression and leveling
 * - Combat simulation integration
 * - Bulk operations with transactions
 * - Error handling and logging
 * - Performance metrics tracking
 */

import { CharacterService } from '../../../src/application/services/CharacterService.js';
import { Character } from '../../../src/domain/entities/Character.js';
import { CharacterId } from '../../../src/domain/value-objects/CharacterId.js';
import { Stats } from '../../../src/domain/value-objects/Stats.js';
import { ApplicationError, ValidationError, NotFoundError, BusinessRuleError } from '../../../src/application/errors/ApplicationErrors.js';

// Mock repository and dependencies
class MockCharacterRepository {
  constructor() {
    this.characters = new Map();
    this.transactionCallback = null;
  }

  async save(character) {
    this.characters.set(character.id.getValue(), character);
    return character;
  }

  async findById(id) {
    return this.characters.get(id.getValue()) || null;
  }

  async findAll() {
    return Array.from(this.characters.values());
  }

  async findByName(name) {
    return Array.from(this.characters.values()).filter(char => 
      char.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  async findByLevelRange(min, max) {
    return Array.from(this.characters.values()).filter(char => 
      char.level >= min && char.level <= max
    );
  }

  async findByAIType(aiType) {
    return Array.from(this.characters.values()).filter(char => 
      char.aiType === aiType
    );
  }

  async findByCriteria(criteria) {
    let results = Array.from(this.characters.values());
    
    if (criteria.level) {
      results = results.filter(char => char.level === criteria.level);
    }
    if (criteria.minGold) {
      results = results.filter(char => char.gold >= criteria.minGold);
    }
    
    return results;
  }

  async delete(id) {
    const existed = this.characters.has(id.getValue());
    this.characters.delete(id.getValue());
    return existed;
  }

  async transaction(callback) {
    this.transactionCallback = callback;
    return await callback();
  }

  clear() {
    this.characters.clear();
  }

  getCount() {
    return this.characters.size;
  }
}

class MockFileManager {
  constructor() {
    this.sprites = new Map();
  }

  async saveSprite(file, characterName) {
    const filename = `${characterName.toLowerCase().replace(/\s+/g, '_')}_sprite.png`;
    this.sprites.set(filename, file);
    return filename;
  }

  async deleteSprite(filename) {
    const existed = this.sprites.has(filename);
    this.sprites.delete(filename);
    if (!existed) {
      throw new Error('Sprite not found');
    }
  }

  hasSprite(filename) {
    return this.sprites.has(filename);
  }
}

class MockLogger {
  constructor() {
    this.logs = [];
  }

  info(message, context = {}) {
    this.logs.push({ level: 'info', message, context, timestamp: new Date() });
  }

  warn(message, context = {}) {
    this.logs.push({ level: 'warn', message, context, timestamp: new Date() });
  }

  error(message, context = {}) {
    this.logs.push({ level: 'error', message, context, timestamp: new Date() });
  }

  getLogs(level = null) {
    return level ? this.logs.filter(log => log.level === level) : this.logs;
  }

  clear() {
    this.logs = [];
  }
}

describe('CharacterService Integration Tests', () => {
  let characterService;
  let mockRepository;
  let mockFileManager;
  let mockLogger;

  beforeEach(() => {
    mockRepository = new MockCharacterRepository();
    mockFileManager = new MockFileManager();
    mockLogger = new MockLogger();
    
    characterService = new CharacterService(mockRepository, mockFileManager, mockLogger);
  });

  afterEach(() => {
    mockRepository.clear();
    mockLogger.clear();
  });

  describe('Character Creation', () => {
    test('should create character with valid data', async () => {
      const characterData = {
        name: 'Test Warrior',
        level: 5,
        hp: 100,
        maxHP: 100,
        attack: 15,
        defense: 10,
        ai_type: 'aggressive',
        gold: 50,
        experience: 1000,
        skill_points: 5,
      };

      const result = await characterService.createCharacter(characterData);

      expect(result.character).toBeInstanceOf(Character);
      expect(result.character.name).toBe('Test Warrior');
      expect(result.character.level).toBe(5);
      expect(result.character.stats.attack).toBe(15);
      expect(result.character.aiType).toBe('aggressive');
      expect(result.metadata.operation).toBe('create');
      expect(result.metadata.validation).toBe('passed');
      expect(typeof result.metadata.processingTime).toBe('number');
    });

    test('should create character with sprite file', async () => {
      const characterData = {
        name: 'Sprite Warrior',
        level: 1,
        hp: 10,
        maxHP: 10,
        attack: 5,
        defense: 3,
      };

      const options = {
        spriteFile: 'mock_sprite_data',
      };

      const result = await characterService.createCharacter(characterData, options);

      expect(result.character.sprite).toBe('sprite_warrior_sprite.png');
      expect(mockFileManager.hasSprite('sprite_warrior_sprite.png')).toBe(true);
      
      const infoLogs = mockLogger.getLogs('info');
      expect(infoLogs.some(log => log.message === 'Sprite uploaded')).toBe(true);
    });

    test('should apply default values for missing fields', async () => {
      const characterData = {
        name: 'Minimal Character',
        level: 1,
      };

      const result = await characterService.createCharacter(characterData);

      expect(result.character.stats.hp).toBe(10);
      expect(result.character.stats.maxHP).toBe(10);
      expect(result.character.stats.attack).toBe(1);
      expect(result.character.stats.defense).toBe(1);
      expect(result.character.aiType).toBe('passive');
      expect(result.character.gold).toBe(0);
      expect(result.character.experience).toBe(0);
      expect(result.character.skillPoints).toBe(0);
    });

    test('should validate required fields', async () => {
      const invalidData = {
        level: 5,
        // Missing name
      };

      await expect(characterService.createCharacter(invalidData))
        .rejects.toThrow(ValidationError);
    });

    test('should validate field constraints', async () => {
      const invalidData = {
        name: 'Te', // Too short
        level: 150, // Too high
        attack: -5, // Too low
      };

      await expect(characterService.createCharacter(invalidData))
        .rejects.toThrow(ValidationError);
    });

    test('should validate AI type enum', async () => {
      const invalidData = {
        name: 'Test Character',
        level: 1,
        ai_type: 'invalid_type',
      };

      await expect(characterService.createCharacter(invalidData))
        .rejects.toThrow(ValidationError);
    });

    test('should sanitize and transform input data', async () => {
      const messyData = {
        name: '  test character  ', // Extra whitespace
        level: '5', // String number
        hp: '100.7', // Float for integer field
        attack: ' 15 ',
        defense: '10.9',
        gold: '50.0',
      };

      const result = await characterService.createCharacter(messyData);

      expect(result.character.name).toBe('Test character'); // Trimmed and capitalized
      expect(result.character.level).toBe(5); // Converted to number
      expect(result.character.stats.hp).toBe(100); // Converted to integer
      expect(result.character.stats.attack).toBe(15);
      expect(result.character.stats.defense).toBe(10);
      expect(result.character.gold).toBe(50);
    });

    test('should update performance metrics', async () => {
      const characterData = {
        name: 'Performance Test',
        level: 1,
      };

      const initialMetrics = characterService.getPerformanceMetrics();
      await characterService.createCharacter(characterData);
      const updatedMetrics = characterService.getPerformanceMetrics();

      expect(updatedMetrics.operationsCount).toBe(initialMetrics.operationsCount + 1);
      expect(updatedMetrics.lastOperationTime).toBeGreaterThan(0);
      expect(updatedMetrics.averageResponseTime).toBeGreaterThan(0);
    });

    test('should log creation process', async () => {
      const characterData = {
        name: 'Logged Character',
        level: 1,
      };

      await characterService.createCharacter(characterData);

      const logs = mockLogger.getLogs();
      expect(logs.some(log => log.message === 'Creating new character')).toBe(true);
      expect(logs.some(log => log.message === 'Character created successfully')).toBe(true);
    });
  });

  describe('Character Retrieval', () => {
    let testCharacter;

    beforeEach(async () => {
      const characterData = {
        name: 'Retrieval Test',
        level: 10,
        hp: 200,
        maxHP: 200,
        attack: 25,
        defense: 20,
        ai_type: 'guardian',
        gold: 100,
        experience: 5000,
        skill_points: 10,
      };

      const result = await characterService.createCharacter(characterData);
      testCharacter = result.character;
    });

    test('should retrieve character by ID', async () => {
      const result = await characterService.getCharacter(testCharacter.id.toString());

      expect(result.character).toBeInstanceOf(Character);
      expect(result.character.id.equals(testCharacter.id)).toBe(true);
      expect(result.character.name).toBe('Retrieval Test');
    });

    test('should throw NotFoundError for non-existent character', async () => {
      const nonExistentId = CharacterId.generate().toString();

      await expect(characterService.getCharacter(nonExistentId))
        .rejects.toThrow(NotFoundError);
    });

    test('should include analysis when requested', async () => {
      const result = await characterService.getCharacter(
        testCharacter.id.toString(),
        { includeAnalysis: true }
      );

      expect(result.analysis).toBeDefined();
      expect(typeof result.analysis.primaryStrength).toBe('string');
      expect(typeof result.analysis.combatEffectiveness).toBe('string');
      expect(Array.isArray(result.analysis.recommendations)).toBe(true);
    });

    test('should include combat stats when requested', async () => {
      const result = await characterService.getCharacter(
        testCharacter.id.toString(),
        { includeCombatStats: true }
      );

      expect(result.combatStats).toBeDefined();
      expect(typeof result.combatStats.attack).toBe('number');
      expect(typeof result.combatStats.defense).toBe('number');
      expect(typeof result.combatStats.accuracy).toBe('number');
    });

    test('should include progression analysis when requested', async () => {
      const result = await characterService.getCharacter(
        testCharacter.id.toString(),
        { includeProgression: true }
      );

      expect(result.progression).toBeDefined();
      expect(typeof result.progression.isValid).toBe('boolean');
      expect(Array.isArray(result.progression.issues)).toBe(true);
      expect(Array.isArray(result.progression.recommendations)).toBe(true);
    });

    test('should include all enhancements when requested', async () => {
      const result = await characterService.getCharacter(
        testCharacter.id.toString(),
        { 
          includeAnalysis: true,
          includeCombatStats: true,
          includeProgression: true,
        }
      );

      expect(result.analysis).toBeDefined();
      expect(result.combatStats).toBeDefined();
      expect(result.progression).toBeDefined();
    });
  });

  describe('Character Updates', () => {
    let testCharacter;

    beforeEach(async () => {
      const characterData = {
        name: 'Update Test',
        level: 5,
        hp: 100,
        maxHP: 100,
        attack: 15,
        defense: 10,
      };

      const result = await characterService.createCharacter(characterData);
      testCharacter = result.character;
    });

    test('should update character fields', async () => {
      const updateData = {
        name: 'Updated Name',
        level: 6,
        attack: 20,
        gold: 150,
      };

      const result = await characterService.updateCharacter(
        testCharacter.id.toString(),
        updateData
      );

      expect(result.character.name).toBe('Updated Name');
      expect(result.character.level).toBe(6);
      expect(result.character.stats.attack).toBe(20);
      expect(result.character.gold).toBe(150);
      expect(result.character.stats.defense).toBe(10); // Unchanged
      expect(result.metadata.operation).toBe('update');
      expect(result.metadata.changesApplied).toContain('name');
      expect(result.metadata.changesApplied).toContain('level');
    });

    test('should update character with sprite', async () => {
      const updateData = {
        name: 'Sprite Updated',
      };

      const options = {
        spriteFile: 'new_sprite_data',
      };

      const result = await characterService.updateCharacter(
        testCharacter.id.toString(),
        updateData,
        options
      );

      expect(result.character.sprite).toBe('sprite_updated_sprite.png');
      expect(mockFileManager.hasSprite('sprite_updated_sprite.png')).toBe(true);
    });

    test('should throw NotFoundError for non-existent character', async () => {
      const nonExistentId = CharacterId.generate().toString();
      const updateData = { name: 'New Name' };

      await expect(characterService.updateCharacter(nonExistentId, updateData))
        .rejects.toThrow(NotFoundError);
    });

    test('should validate update data', async () => {
      const invalidUpdateData = {
        name: 'X', // Too short
        level: 150, // Too high
      };

      await expect(characterService.updateCharacter(
        testCharacter.id.toString(),
        invalidUpdateData
      )).rejects.toThrow(ValidationError);
    });

    test('should sanitize update data', async () => {
      const messyUpdateData = {
        name: '  updated name  ',
        level: '7',
        attack: '25.9',
      };

      const result = await characterService.updateCharacter(
        testCharacter.id.toString(),
        messyUpdateData
      );

      expect(result.character.name).toBe('Updated name');
      expect(result.character.level).toBe(7);
      expect(result.character.stats.attack).toBe(25);
    });

    test('should only update provided fields', async () => {
      const partialUpdate = {
        attack: 30,
      };

      const result = await characterService.updateCharacter(
        testCharacter.id.toString(),
        partialUpdate
      );

      expect(result.character.name).toBe('Update Test'); // Unchanged
      expect(result.character.level).toBe(5); // Unchanged
      expect(result.character.stats.attack).toBe(30); // Updated
      expect(result.character.stats.defense).toBe(10); // Unchanged
    });
  });

  describe('Character Deletion', () => {
    let testCharacter;

    beforeEach(async () => {
      const characterData = {
        name: 'Delete Test',
        level: 1,
        sprite: 'test_sprite.png',
      };

      // Manually add sprite to file manager
      mockFileManager.sprites.set('test_sprite.png', 'sprite_data');

      const result = await characterService.createCharacter(characterData);
      testCharacter = result.character;
    });

    test('should delete character', async () => {
      const result = await characterService.deleteCharacter(testCharacter.id.toString());

      expect(result.deleted).toBe(true);
      expect(result.characterId).toBe(testCharacter.id.toString());
      expect(result.metadata.operation).toBe('delete');
      expect(typeof result.metadata.processingTime).toBe('number');

      // Verify character is gone
      await expect(characterService.getCharacter(testCharacter.id.toString()))
        .rejects.toThrow(NotFoundError);
    });

    test('should clean up sprite by default', async () => {
      const result = await characterService.deleteCharacter(testCharacter.id.toString());

      expect(result.metadata.spriteCleanup).toBe(true);
      expect(mockFileManager.hasSprite('test_sprite.png')).toBe(false);

      const logs = mockLogger.getLogs();
      expect(logs.some(log => log.message === 'Character sprite deleted')).toBe(true);
    });

    test('should skip sprite cleanup when requested', async () => {
      const result = await characterService.deleteCharacter(
        testCharacter.id.toString(),
        { cleanupSprite: false }
      );

      expect(result.metadata.spriteCleanup).toBe(false);
      expect(mockFileManager.hasSprite('test_sprite.png')).toBe(true);
    });

    test('should handle sprite cleanup failure gracefully', async () => {
      // Remove sprite manually to cause cleanup failure
      mockFileManager.sprites.delete('test_sprite.png');

      const result = await characterService.deleteCharacter(testCharacter.id.toString());

      expect(result.deleted).toBe(true); // Character still deleted
      
      const logs = mockLogger.getLogs('warn');
      expect(logs.some(log => log.message === 'Failed to delete character sprite')).toBe(true);
    });

    test('should throw NotFoundError for non-existent character', async () => {
      const nonExistentId = CharacterId.generate().toString();

      await expect(characterService.deleteCharacter(nonExistentId))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('Character Listing and Search', () => {
    beforeEach(async () => {
      // Create test characters
      const characters = [
        { name: 'Warrior One', level: 5, ai_type: 'aggressive', gold: 100 },
        { name: 'Mage Two', level: 8, ai_type: 'caster', gold: 50 },
        { name: 'Guardian Three', level: 12, ai_type: 'guardian', gold: 200 },
        { name: 'Scout Four', level: 3, ai_type: 'passive', gold: 75 },
        { name: 'Berserker Five', level: 15, ai_type: 'aggressive', gold: 300 },
      ];

      for (const data of characters) {
        await characterService.createCharacter(data);
      }
    });

    test('should list all characters', async () => {
      const result = await characterService.listCharacters();

      expect(result.characters).toHaveLength(5);
      expect(result.pagination.totalCount).toBe(5);
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrevious).toBe(false);
      expect(result.metadata.operation).toBe('list');
      expect(result.metadata.resultsCount).toBe(5);
    });

    test('should paginate results', async () => {
      const result = await characterService.listCharacters({}, { page: 1, limit: 2 });

      expect(result.characters).toHaveLength(2);
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrevious).toBe(false);
    });

    test('should filter by level range', async () => {
      const result = await characterService.listCharacters({
        levelRange: { min: 5, max: 10 },
      });

      expect(result.characters).toHaveLength(2); // Warrior(5), Mage(8)
      expect(result.characters.every(c => c.level >= 5 && c.level <= 10)).toBe(true);
    });

    test('should filter by AI type', async () => {
      const result = await characterService.listCharacters({
        aiType: 'aggressive',
      });

      expect(result.characters).toHaveLength(2); // Warrior, Berserker
      expect(result.characters.every(c => c.aiType === 'aggressive')).toBe(true);
    });

    test('should filter by name pattern', async () => {
      const result = await characterService.listCharacters({
        namePattern: 'War',
      });

      expect(result.characters).toHaveLength(1); // Warrior One
      expect(result.characters[0].name).toBe('Warrior One');
    });

    test('should filter by minimum gold', async () => {
      const result = await characterService.listCharacters({
        minGold: 150,
      });

      expect(result.characters).toHaveLength(2); // Guardian(200), Berserker(300)
      expect(result.characters.every(c => c.gold >= 150)).toBe(true);
    });

    test('should filter by maximum level', async () => {
      const result = await characterService.listCharacters({
        maxLevel: 10,
      });

      expect(result.characters).toHaveLength(3); // Warrior(5), Mage(8), Scout(3)
      expect(result.characters.every(c => c.level <= 10)).toBe(true);
    });

    test('should sort characters', async () => {
      const result = await characterService.listCharacters({}, {
        sortBy: 'level',
        sortOrder: 'desc',
      });

      const levels = result.characters.map(c => c.level);
      expect(levels).toEqual([15, 12, 8, 5, 3]); // Descending order
    });

    test('should combine filtering and sorting', async () => {
      const result = await characterService.listCharacters({
        levelRange: { min: 5, max: 15 },
      }, {
        sortBy: 'gold',
        sortOrder: 'asc',
      });

      expect(result.characters).toHaveLength(4);
      const goldValues = result.characters.map(c => c.gold);
      expect(goldValues).toEqual([50, 100, 200, 300]); // Ascending gold order
    });
  });

  describe('Character Progression', () => {
    let testCharacter;

    beforeEach(async () => {
      const characterData = {
        name: 'Progression Test',
        level: 5,
        hp: 100,
        maxHP: 100,
        attack: 15,
        defense: 10,
        experience: 2000,
        skill_points: 5,
      };

      const result = await characterService.createCharacter(characterData);
      testCharacter = result.character;
    });

    test('should level up character', async () => {
      const result = await characterService.levelUpCharacter(testCharacter.id.toString());

      expect(result.character.level).toBe(6);
      expect(result.levelUpDetails.previousLevel).toBe(5);
      expect(result.levelUpDetails.newLevel).toBe(6);
      expect(result.levelUpDetails.statIncreases).toBeDefined();
      expect(typeof result.levelUpDetails.skillPointsGained).toBe('number');
      expect(result.metadata.operation).toBe('levelup');
    });

    test('should not level up character at max level', async () => {
      // Create max level character
      const maxLevelData = {
        name: 'Max Level',
        level: 100,
      };

      const maxResult = await characterService.createCharacter(maxLevelData);
      
      await expect(characterService.levelUpCharacter(maxResult.character.id.toString()))
        .rejects.toThrow(BusinessRuleError);
    });

    test('should analyze character progression', async () => {
      const result = await characterService.analyzeCharacterProgression(testCharacter.id.toString());

      expect(result.character).toBeDefined();
      expect(result.validation).toBeDefined();
      expect(result.analysis).toBeDefined();
      expect(result.equipmentRecommendations).toBeDefined();
      expect(result.statOptimization).toBeDefined();
      expect(result.metadata.operation).toBe('progression_analysis');
    });

    test('should throw NotFoundError for progression analysis of non-existent character', async () => {
      const nonExistentId = CharacterId.generate().toString();

      await expect(characterService.analyzeCharacterProgression(nonExistentId))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('Combat Simulation', () => {
    let attacker, defender;

    beforeEach(async () => {
      const attackerData = {
        name: 'Attacker',
        level: 10,
        attack: 25,
        defense: 10,
        hp: 200,
        maxHP: 200,
      };

      const defenderData = {
        name: 'Defender',
        level: 8,
        attack: 15,
        defense: 20,
        hp: 180,
        maxHP: 180,
      };

      const [attackerResult, defenderResult] = await Promise.all([
        characterService.createCharacter(attackerData),
        characterService.createCharacter(defenderData),
      ]);

      attacker = attackerResult.character;
      defender = defenderResult.character;
    });

    test('should simulate combat between characters', async () => {
      const result = await characterService.simulateCombat(
        attacker.id.toString(),
        defender.id.toString(),
        { rounds: 5 }
      );

      expect(result.attacker).toBeDefined();
      expect(result.defender).toBeDefined();
      expect(result.attacker.wins).toBeGreaterThanOrEqual(0);
      expect(result.defender.wins).toBeGreaterThanOrEqual(0);
      expect(result.attacker.wins + result.defender.wins).toBe(5);
      expect(result.metadata.operation).toBe('combat_simulation');
      expect(result.metadata.rounds).toBe(5);
    });

    test('should throw NotFoundError for invalid attacker', async () => {
      const invalidId = CharacterId.generate().toString();

      await expect(characterService.simulateCombat(invalidId, defender.id.toString()))
        .rejects.toThrow(NotFoundError);
    });

    test('should throw NotFoundError for invalid defender', async () => {
      const invalidId = CharacterId.generate().toString();

      await expect(characterService.simulateCombat(attacker.id.toString(), invalidId))
        .rejects.toThrow(NotFoundError);
    });

    test('should use default rounds when not specified', async () => {
      const result = await characterService.simulateCombat(
        attacker.id.toString(),
        defender.id.toString()
      );

      expect(result.attacker.wins + result.defender.wins).toBe(10); // Default rounds
      expect(result.metadata.rounds).toBe(10);
    });
  });

  describe('Bulk Operations', () => {
    test('should bulk create characters successfully', async () => {
      const charactersData = [
        { name: 'Bulk One', level: 1 },
        { name: 'Bulk Two', level: 2 },
        { name: 'Bulk Three', level: 3 },
      ];

      const result = await characterService.bulkCreateCharacters(charactersData);

      expect(result.summary.total).toBe(3);
      expect(result.summary.successful).toBe(3);
      expect(result.summary.failed).toBe(0);
      expect(result.created).toHaveLength(3);
      expect(result.failed).toHaveLength(0);
      expect(result.metadata.operation).toBe('bulk_create');
    });

    test('should handle partial failures with continueOnError', async () => {
      const charactersData = [
        { name: 'Valid One', level: 1 },
        { name: 'X', level: 1 }, // Invalid name (too short)
        { name: 'Valid Two', level: 2 },
      ];

      const result = await characterService.bulkCreateCharacters(charactersData, {
        continueOnError: true,
      });

      expect(result.summary.total).toBe(3);
      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(1);
      expect(result.created).toHaveLength(2);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].index).toBe(1);
      expect(result.failed[0].error).toContain('validation');
    });

    test('should rollback transaction on error without continueOnError', async () => {
      const charactersData = [
        { name: 'Valid One', level: 1 },
        { name: 'X', level: 1 }, // Invalid name
      ];

      await expect(characterService.bulkCreateCharacters(charactersData, {
        continueOnError: false,
      })).rejects.toThrow(ValidationError);

      // Verify no characters were created
      expect(mockRepository.getCount()).toBe(0);
    });

    test('should validate input array', async () => {
      await expect(characterService.bulkCreateCharacters(null))
        .rejects.toThrow(ValidationError);

      await expect(characterService.bulkCreateCharacters([]))
        .rejects.toThrow(ValidationError);

      await expect(characterService.bulkCreateCharacters('not an array'))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('Error Handling', () => {
    test('should wrap repository errors appropriately', async () => {
      // Mock repository to throw error
      mockRepository.findById = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const characterId = CharacterId.generate().toString();

      await expect(characterService.getCharacter(characterId))
        .rejects.toThrow(ApplicationError);
    });

    test('should log errors appropriately', async () => {
      const invalidData = { name: 'X' }; // Too short

      try {
        await characterService.createCharacter(invalidData);
      } catch (error) {
        // Expected to throw
      }

      const errorLogs = mockLogger.getLogs('error');
      expect(errorLogs.some(log => log.message === 'Character creation failed')).toBe(true);
    });

    test('should preserve error context in wrapped errors', async () => {
      mockRepository.save = jest.fn().mockRejectedValue(new Error('Constraint violation'));

      const characterData = { name: 'Test', level: 1 };

      try {
        await characterService.createCharacter(characterData);
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.cause).toBeDefined();
        expect(error.cause.message).toBe('Constraint violation');
      }
    });
  });

  describe('Performance Metrics', () => {
    test('should track operation count', async () => {
      const initialMetrics = characterService.getPerformanceMetrics();
      
      await characterService.createCharacter({ name: 'Test1', level: 1 });
      await characterService.createCharacter({ name: 'Test2', level: 1 });

      const finalMetrics = characterService.getPerformanceMetrics();
      
      expect(finalMetrics.operationsCount).toBe(initialMetrics.operationsCount + 2);
    });

    test('should track response times', async () => {
      await characterService.createCharacter({ name: 'Performance Test', level: 1 });

      const metrics = characterService.getPerformanceMetrics();
      
      expect(metrics.lastOperationTime).toBeGreaterThan(0);
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
    });

    test('should calculate rolling average response time', async () => {
      // Create multiple characters to test average calculation
      for (let i = 0; i < 3; i++) {
        await characterService.createCharacter({ name: `Test${i}`, level: 1 });
      }

      const metrics = characterService.getPerformanceMetrics();
      
      expect(metrics.operationsCount).toBe(3);
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
      expect(metrics.lastOperationTime).toBeGreaterThan(0);
    });
  });

  describe('Service Configuration', () => {
    test('should allow setting service options', () => {
      characterService.setOptions({ requireUniqueNames: true });

      expect(characterService.options.requireUniqueNames).toBe(true);
    });

    test('should merge options with existing options', () => {
      characterService.setOptions({ option1: 'value1' });
      characterService.setOptions({ option2: 'value2' });

      expect(characterService.options.option1).toBe('value1');
      expect(characterService.options.option2).toBe('value2');
    });
  });
});