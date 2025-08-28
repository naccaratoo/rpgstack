/**
 * Character Application Service
 * 
 * Orchestrates character-related use cases by coordinating domain entities,
 * domain services, and infrastructure concerns. This service layer acts as
 * the facade for the application's business operations while maintaining
 * clean architecture principles.
 * 
 * Features:
 * - Complete CRUD operations with business logic validation
 * - Character progression and leveling systems
 * - Combat simulation and analysis
 * - Bulk operations with transaction support
 * - Advanced search and filtering capabilities
 * - Error handling and input validation
 */

import { Character } from '../../domain/entities/Character.js';
import { CharacterId } from '../../domain/value-objects/CharacterId.js';
import { Stats } from '../../domain/value-objects/Stats.js';
import { Combat } from '../../domain/value-objects/Combat.js';
import { CharacterDomainService } from '../../domain/services/CharacterDomainService.js';
import { ApplicationError, ValidationError, NotFoundError, BusinessRuleError } from '../errors/ApplicationErrors.js';

export class CharacterService {
  /**
   * Create CharacterService instance
   * @param {CharacterRepository} characterRepository - Repository for character persistence
   * @param {Object} fileManager - File management service for sprites
   * @param {Object} logger - Logging service
   */
  constructor(characterRepository, fileManager = null, logger = console) {
    this.characterRepository = characterRepository;
    this.fileManager = fileManager;
    this.logger = logger;
    this.domainService = new CharacterDomainService();
    
    // Performance tracking
    this.performanceMetrics = {
      operationsCount: 0,
      lastOperationTime: null,
      averageResponseTime: 0,
    };
  }

  // ===== CHARACTER CRUD OPERATIONS =====

  /**
   * Create a new character with business validation
   * @param {Object} characterData - Character creation data
   * @param {Object} options - Creation options (sprite file, validation level)
   * @returns {Promise<Object>} Created character with metadata
   */
  async createCharacter(characterData, options = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Creating new character', { name: characterData.name });
      
      // Input validation and sanitization
      const sanitizedData = await this._validateAndSanitizeCreateData(characterData);
      
      // Handle sprite upload if provided
      let spriteFileName = '';
      if (options.spriteFile && this.fileManager) {
        spriteFileName = await this.fileManager.saveSprite(
          options.spriteFile, 
          sanitizedData.name
        );
        this.logger.info('Sprite uploaded', { filename: spriteFileName });
      }

      // Create character entity with domain validation
      const character = Character.create({
        ...sanitizedData,
        sprite: spriteFileName,
      });

      // Validate character meets business rules
      await this._validateCharacterBusinessRules(character);

      // Persist character
      const savedCharacter = await this.characterRepository.save(character);
      
      // Update performance metrics
      this._updatePerformanceMetrics(startTime);
      
      this.logger.info('Character created successfully', { 
        id: savedCharacter.id.toString(),
        name: savedCharacter.name 
      });

      return {
        character: savedCharacter,
        metadata: {
          operation: 'create',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          validation: 'passed',
        },
      };

    } catch (error) {
      this.logger.error('Character creation failed', { 
        error: error.message,
        data: characterData 
      });
      throw this._wrapError(error, 'Failed to create character');
    }
  }

  /**
   * Retrieve character by ID with enhanced data
   * @param {string} characterId - Character ID
   * @param {Object} options - Retrieval options (include analysis, combat stats)
   * @returns {Promise<Object>} Character with optional enhancements
   */
  async getCharacter(characterId, options = {}) {
    const startTime = Date.now();
    
    try {
      const id = CharacterId.fromString(characterId);
      const character = await this.characterRepository.findById(id);
      
      if (!character) {
        throw new NotFoundError(`Character with ID ${characterId} not found`);
      }

      let result = { character };

      // Add character analysis if requested
      if (options.includeAnalysis) {
        const analysis = this.domainService._analyzeCharacterStrengths(character);
        result.analysis = analysis;
      }

      // Add combat stats if requested
      if (options.includeCombatStats) {
        const combat = this.domainService._deriveBasicCombatStats(character);
        result.combatStats = combat.toObject();
      }

      // Add progression suggestions if requested
      if (options.includeProgression) {
        const progression = this.domainService.validateCharacterProgression(character);
        result.progression = progression;
      }

      this._updatePerformanceMetrics(startTime);
      
      return result;

    } catch (error) {
      this.logger.error('Character retrieval failed', { 
        characterId,
        error: error.message 
      });
      throw this._wrapError(error, 'Failed to retrieve character');
    }
  }

  /**
   * Update existing character with business validation
   * @param {string} characterId - Character ID
   * @param {Object} updateData - Data to update
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated character with metadata
   */
  async updateCharacter(characterId, updateData, options = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Updating character', { id: characterId });
      
      const id = CharacterId.fromString(characterId);
      const existingCharacter = await this.characterRepository.findById(id);
      
      if (!existingCharacter) {
        throw new NotFoundError(`Character with ID ${characterId} not found`);
      }

      // Validate and sanitize update data
      const sanitizedData = await this._validateAndSanitizeUpdateData(updateData);
      
      // Handle sprite update if provided
      if (options.spriteFile && this.fileManager) {
        const spriteFileName = await this.fileManager.saveSprite(
          options.spriteFile,
          sanitizedData.name || existingCharacter.name
        );
        sanitizedData.sprite = spriteFileName;
      }

      // Apply updates with domain validation
      const updatedCharacter = existingCharacter.update(sanitizedData);
      
      // Validate updated character meets business rules
      await this._validateCharacterBusinessRules(updatedCharacter);

      // Persist changes
      const savedCharacter = await this.characterRepository.save(updatedCharacter);
      
      this._updatePerformanceMetrics(startTime);
      
      this.logger.info('Character updated successfully', { 
        id: savedCharacter.id.toString() 
      });

      return {
        character: savedCharacter,
        metadata: {
          operation: 'update',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          changesApplied: Object.keys(sanitizedData),
        },
      };

    } catch (error) {
      this.logger.error('Character update failed', { 
        characterId,
        error: error.message 
      });
      throw this._wrapError(error, 'Failed to update character');
    }
  }

  /**
   * Delete character with cleanup
   * @param {string} characterId - Character ID
   * @param {Object} options - Deletion options
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteCharacter(characterId, options = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Deleting character', { id: characterId });
      
      const id = CharacterId.fromString(characterId);
      const character = await this.characterRepository.findById(id);
      
      if (!character) {
        throw new NotFoundError(`Character with ID ${characterId} not found`);
      }

      // Clean up associated sprite if exists and cleanup requested
      if (character.sprite && this.fileManager && options.cleanupSprite !== false) {
        try {
          await this.fileManager.deleteSprite(character.sprite);
          this.logger.info('Character sprite deleted', { sprite: character.sprite });
        } catch (spriteError) {
          this.logger.warn('Failed to delete character sprite', { 
            sprite: character.sprite,
            error: spriteError.message 
          });
        }
      }

      // Delete character from repository
      const deleted = await this.characterRepository.delete(id);
      
      if (!deleted) {
        throw new ApplicationError('Character deletion failed - no rows affected');
      }
      
      this._updatePerformanceMetrics(startTime);
      
      this.logger.info('Character deleted successfully', { id: characterId });

      return {
        deleted: true,
        characterId,
        metadata: {
          operation: 'delete',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          spriteCleanup: character.sprite && options.cleanupSprite !== false,
        },
      };

    } catch (error) {
      this.logger.error('Character deletion failed', { 
        characterId,
        error: error.message 
      });
      throw this._wrapError(error, 'Failed to delete character');
    }
  }

  // ===== CHARACTER LISTING AND SEARCH =====

  /**
   * Get all characters with filtering and pagination
   * @param {Object} filters - Search filters
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Characters list with metadata
   */
  async listCharacters(filters = {}, pagination = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Listing characters', { filters, pagination });
      
      const {
        page = 1,
        limit = 50,
        sortBy = 'name',
        sortOrder = 'asc'
      } = pagination;

      // Get characters based on filters
      let characters;
      
      if (filters.levelRange) {
        const { min = 1, max = 100 } = filters.levelRange;
        characters = await this.characterRepository.findByLevelRange(min, max);
      } else if (filters.aiType) {
        characters = await this.characterRepository.findByAIType(filters.aiType);
      } else if (filters.namePattern) {
        characters = await this.characterRepository.findByName(filters.namePattern);
      } else if (filters.criteria) {
        characters = await this.characterRepository.findByCriteria(filters.criteria);
      } else {
        characters = await this.characterRepository.findAll();
      }

      // Apply client-side filtering if needed
      let filteredCharacters = characters;
      
      if (filters.minGold) {
        filteredCharacters = filteredCharacters.filter(char => char.gold >= filters.minGold);
      }
      
      if (filters.maxLevel) {
        filteredCharacters = filteredCharacters.filter(char => char.level <= filters.maxLevel);
      }

      // Sort characters
      filteredCharacters.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        
        // Handle nested properties
        if (sortBy.includes('.')) {
          const keys = sortBy.split('.');
          aValue = keys.reduce((obj, key) => obj?.[key], a);
          bValue = keys.reduce((obj, key) => obj?.[key], b);
        }

        if (sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1;
        }
        return aValue > bValue ? 1 : -1;
      });

      // Apply pagination
      const totalCount = filteredCharacters.length;
      const startIndex = (page - 1) * limit;
      const paginatedCharacters = filteredCharacters.slice(startIndex, startIndex + limit);
      
      this._updatePerformanceMetrics(startTime);

      return {
        characters: paginatedCharacters,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: startIndex + limit < totalCount,
          hasPrevious: page > 1,
        },
        filters: filters,
        metadata: {
          operation: 'list',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          resultsCount: paginatedCharacters.length,
        },
      };

    } catch (error) {
      this.logger.error('Character listing failed', { 
        filters,
        pagination,
        error: error.message 
      });
      throw this._wrapError(error, 'Failed to list characters');
    }
  }

  // ===== CHARACTER PROGRESSION =====

  /**
   * Level up character with stat calculations
   * @param {string} characterId - Character ID
   * @param {Object} options - Level up options
   * @returns {Promise<Object>} Updated character with level up details
   */
  async levelUpCharacter(characterId, options = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Leveling up character', { id: characterId });
      
      const id = CharacterId.fromString(characterId);
      const character = await this.characterRepository.findById(id);
      
      if (!character) {
        throw new NotFoundError(`Character with ID ${characterId} not found`);
      }

      if (character.level >= Character.MAX_LEVEL) {
        throw new BusinessRuleError('Character is already at maximum level');
      }

      // Calculate level up stats using domain service
      const levelUpStats = this.domainService.calculateLevelUpStats(character, options);
      
      // Apply level up
      const leveledUpCharacter = character.levelUp(levelUpStats.stats);
      
      // Save updated character
      const savedCharacter = await this.characterRepository.save(leveledUpCharacter);
      
      this._updatePerformanceMetrics(startTime);
      
      this.logger.info('Character leveled up successfully', { 
        id: characterId,
        newLevel: savedCharacter.level 
      });

      return {
        character: savedCharacter,
        levelUpDetails: {
          previousLevel: character.level,
          newLevel: savedCharacter.level,
          statIncreases: levelUpStats.stats,
          skillPointsGained: levelUpStats.skill_points,
          estimatedPower: levelUpStats.estimatedPower,
        },
        metadata: {
          operation: 'levelup',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        },
      };

    } catch (error) {
      this.logger.error('Character level up failed', { 
        characterId,
        error: error.message 
      });
      throw this._wrapError(error, 'Failed to level up character');
    }
  }

  /**
   * Analyze character progression and provide recommendations
   * @param {string} characterId - Character ID
   * @returns {Promise<Object>} Analysis with recommendations
   */
  async analyzeCharacterProgression(characterId) {
    const startTime = Date.now();
    
    try {
      const id = CharacterId.fromString(characterId);
      const character = await this.characterRepository.findById(id);
      
      if (!character) {
        throw new NotFoundError(`Character with ID ${characterId} not found`);
      }

      // Get progression validation
      const validation = this.domainService.validateCharacterProgression(character);
      
      // Get character analysis
      const analysis = this.domainService._analyzeCharacterStrengths(character);
      
      // Get equipment recommendations
      const equipmentRecs = this.domainService.generateEquipmentRecommendations(character);
      
      // Get stat optimization suggestions
      const optimization = this.domainService.optimizeStatDistribution(character);
      
      this._updatePerformanceMetrics(startTime);

      return {
        character,
        validation,
        analysis,
        equipmentRecommendations: equipmentRecs,
        statOptimization: optimization,
        metadata: {
          operation: 'progression_analysis',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        },
      };

    } catch (error) {
      this.logger.error('Character progression analysis failed', { 
        characterId,
        error: error.message 
      });
      throw this._wrapError(error, 'Failed to analyze character progression');
    }
  }

  // ===== COMBAT AND SIMULATION =====

  /**
   * Simulate combat between two characters
   * @param {string} attackerId - Attacker character ID
   * @param {string} defenderId - Defender character ID
   * @param {Object} options - Simulation options
   * @returns {Promise<Object>} Combat simulation results
   */
  async simulateCombat(attackerId, defenderId, options = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Simulating combat', { attackerId, defenderId });
      
      const [attacker, defender] = await Promise.all([
        this.characterRepository.findById(CharacterId.fromString(attackerId)),
        this.characterRepository.findById(CharacterId.fromString(defenderId)),
      ]);

      if (!attacker) {
        throw new NotFoundError(`Attacker character with ID ${attackerId} not found`);
      }
      
      if (!defender) {
        throw new NotFoundError(`Defender character with ID ${defenderId} not found`);
      }

      // Simulate combat using domain service
      const combatResults = this.domainService.simulateCombat(attacker, defender, options);
      
      this._updatePerformanceMetrics(startTime);
      
      this.logger.info('Combat simulation completed', { 
        winner: combatResults.attacker.wins > combatResults.defender.wins ? 'attacker' : 'defender',
        rounds: options.rounds || 10 
      });

      return {
        ...combatResults,
        metadata: {
          operation: 'combat_simulation',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          rounds: options.rounds || 10,
        },
      };

    } catch (error) {
      this.logger.error('Combat simulation failed', { 
        attackerId,
        defenderId,
        error: error.message 
      });
      throw this._wrapError(error, 'Failed to simulate combat');
    }
  }

  // ===== BULK OPERATIONS =====

  /**
   * Bulk create multiple characters with transaction support
   * @param {Array} charactersData - Array of character data
   * @param {Object} options - Bulk creation options
   * @returns {Promise<Object>} Bulk operation results
   */
  async bulkCreateCharacters(charactersData, options = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Bulk creating characters', { count: charactersData.length });
      
      if (!Array.isArray(charactersData) || charactersData.length === 0) {
        throw new ValidationError('Characters data must be a non-empty array');
      }

      const results = {
        created: [],
        failed: [],
        summary: {
          total: charactersData.length,
          successful: 0,
          failed: 0,
        },
      };

      // Use transaction for bulk operations
      await this.characterRepository.transaction(async () => {
        for (let i = 0; i < charactersData.length; i++) {
          try {
            const characterData = charactersData[i];
            const sanitizedData = await this._validateAndSanitizeCreateData(characterData);
            
            const character = Character.create(sanitizedData);
            await this._validateCharacterBusinessRules(character);
            
            const savedCharacter = await this.characterRepository.save(character);
            
            results.created.push({
              index: i,
              character: savedCharacter,
              originalData: characterData,
            });
            results.summary.successful++;
            
          } catch (error) {
            results.failed.push({
              index: i,
              error: error.message,
              originalData: charactersData[i],
            });
            results.summary.failed++;
            
            if (!options.continueOnError) {
              throw error; // This will cause transaction rollback
            }
          }
        }
      });
      
      this._updatePerformanceMetrics(startTime);
      
      this.logger.info('Bulk character creation completed', { 
        successful: results.summary.successful,
        failed: results.summary.failed 
      });

      return {
        ...results,
        metadata: {
          operation: 'bulk_create',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        },
      };

    } catch (error) {
      this.logger.error('Bulk character creation failed', { 
        count: charactersData.length,
        error: error.message 
      });
      throw this._wrapError(error, 'Failed to bulk create characters');
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Get service performance metrics
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      uptime: Date.now() - (this.performanceMetrics.serviceStartTime || Date.now()),
    };
  }

  /**
   * Validate character creation data
   * @private
   */
  async _validateAndSanitizeCreateData(data) {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Character data must be an object');
    }

    // Required fields validation
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 3) {
      throw new ValidationError('Character name is required and must be at least 3 characters');
    }

    if (typeof data.level !== 'number' || data.level < 1 || data.level > 100) {
      throw new ValidationError('Character level must be between 1 and 100');
    }

    // Sanitize and validate stats
    const stats = data.stats || {};
    const sanitizedStats = {
      hp: Math.max(1, parseInt(stats.hp || data.hp || 10, 10)),
      maxHP: Math.max(1, parseInt(stats.maxHP || data.maxHP || stats.max_hp || data.max_hp || 10, 10)),
      attack: Math.max(1, parseInt(stats.attack || data.attack || 1, 10)),
      defense: Math.max(1, parseInt(stats.defense || data.defense || 1, 10)),
    };

    // Validate AI type
    const validAITypes = ['aggressive', 'passive', 'guardian', 'ambush', 'caster', 'pack', 'tank'];
    if (data.ai_type && !validAITypes.includes(data.ai_type)) {
      throw new ValidationError(`AI type must be one of: ${validAITypes.join(', ')}`);
    }

    return {
      name: data.name.trim(),
      level: data.level,
      stats: sanitizedStats,
      ai_type: data.ai_type || 'passive',
      gold: Math.max(0, parseInt(data.gold || 0, 10)),
      experience: Math.max(0, parseInt(data.experience || 0, 10)),
      skill_points: Math.max(0, parseInt(data.skill_points || 0, 10)),
      sprite: data.sprite || '',
    };
  }

  /**
   * Validate character update data
   * @private
   */
  async _validateAndSanitizeUpdateData(data) {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Update data must be an object');
    }

    const sanitizedData = {};

    // Only validate and sanitize fields that are being updated
    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || data.name.trim().length < 3) {
        throw new ValidationError('Character name must be at least 3 characters');
      }
      sanitizedData.name = data.name.trim();
    }

    if (data.level !== undefined) {
      if (typeof data.level !== 'number' || data.level < 1 || data.level > 100) {
        throw new ValidationError('Character level must be between 1 and 100');
      }
      sanitizedData.level = data.level;
    }

    // Handle stats updates
    if (data.stats || data.hp !== undefined || data.maxHP !== undefined || 
        data.attack !== undefined || data.defense !== undefined) {
      
      const stats = data.stats || {};
      sanitizedData.stats = {};
      
      if (data.hp !== undefined || stats.hp !== undefined) {
        sanitizedData.stats.hp = Math.max(1, parseInt(data.hp || stats.hp, 10));
      }
      
      if (data.maxHP !== undefined || data.max_hp !== undefined || stats.maxHP !== undefined) {
        sanitizedData.stats.maxHP = Math.max(1, parseInt(data.maxHP || data.max_hp || stats.maxHP, 10));
      }
      
      if (data.attack !== undefined || stats.attack !== undefined) {
        sanitizedData.stats.attack = Math.max(1, parseInt(data.attack || stats.attack, 10));
      }
      
      if (data.defense !== undefined || stats.defense !== undefined) {
        sanitizedData.stats.defense = Math.max(1, parseInt(data.defense || stats.defense, 10));
      }
    }

    // Validate AI type if provided
    if (data.ai_type !== undefined) {
      const validAITypes = ['aggressive', 'passive', 'guardian', 'ambush', 'caster', 'pack', 'tank'];
      if (!validAITypes.includes(data.ai_type)) {
        throw new ValidationError(`AI type must be one of: ${validAITypes.join(', ')}`);
      }
      sanitizedData.ai_type = data.ai_type;
    }

    // Handle other optional fields
    if (data.gold !== undefined) {
      sanitizedData.gold = Math.max(0, parseInt(data.gold, 10));
    }

    if (data.experience !== undefined) {
      sanitizedData.experience = Math.max(0, parseInt(data.experience, 10));
    }

    if (data.skill_points !== undefined) {
      sanitizedData.skill_points = Math.max(0, parseInt(data.skill_points, 10));
    }

    if (data.sprite !== undefined) {
      sanitizedData.sprite = data.sprite;
    }

    return sanitizedData;
  }

  /**
   * Validate character against business rules
   * @private
   */
  async _validateCharacterBusinessRules(character) {
    // Check for duplicate names (if business rule requires unique names)
    if (this.options?.requireUniqueNames) {
      const existingCharacters = await this.characterRepository.findByName(character.name);
      const duplicates = existingCharacters.filter(c => !c.id.equals(character.id));
      
      if (duplicates.length > 0) {
        throw new BusinessRuleError(`Character name '${character.name}' already exists`);
      }
    }

    // Validate character progression makes sense
    const progression = this.domainService.validateCharacterProgression(character);
    if (!progression.isValid && progression.issues.length > 0) {
      const criticalIssues = progression.issues.filter(issue => 
        issue.includes('required') || issue.includes('invalid')
      );
      
      if (criticalIssues.length > 0) {
        throw new BusinessRuleError(`Character validation failed: ${criticalIssues.join(', ')}`);
      }
    }
  }

  /**
   * Wrap errors with appropriate application error types
   * @private
   */
  _wrapError(error, message) {
    if (error instanceof ApplicationError) {
      return error; // Already an application error
    }

    if (error.message.includes('not found') || error.message.includes('Not found')) {
      return new NotFoundError(message, error);
    }

    if (error.message.includes('validation') || error.message.includes('required') ||
        error.message.includes('invalid') || error.message.includes('must be')) {
      return new ValidationError(message, error);
    }

    if (error.message.includes('business rule') || error.message.includes('constraint') ||
        error.message.includes('cannot exceed') || error.message.includes('already exists')) {
      return new BusinessRuleError(message, error);
    }

    return new ApplicationError(message, error);
  }

  /**
   * Update performance metrics
   * @private
   */
  _updatePerformanceMetrics(startTime) {
    const processingTime = Date.now() - startTime;
    this.performanceMetrics.operationsCount++;
    this.performanceMetrics.lastOperationTime = processingTime;
    
    // Calculate rolling average
    const currentAverage = this.performanceMetrics.averageResponseTime || 0;
    const count = this.performanceMetrics.operationsCount;
    this.performanceMetrics.averageResponseTime = 
      (currentAverage * (count - 1) + processingTime) / count;
  }

  /**
   * Set service options
   * @param {Object} options - Service configuration options
   */
  setOptions(options) {
    this.options = { ...this.options, ...options };
  }
}