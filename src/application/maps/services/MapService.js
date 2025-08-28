import { Map } from '../../../domain/maps/entities/Map.js';
import { MapId } from '../../../domain/maps/value-objects/MapId.js';
import { MapDimensions } from '../../../domain/maps/value-objects/MapDimensions.js';
import { BossData } from '../../../domain/maps/value-objects/BossData.js';
import { UnlockRequirement } from '../../../domain/maps/value-objects/UnlockRequirement.js';
import { MapRewards } from '../../../domain/maps/value-objects/MapRewards.js';
import { MapAssets } from '../../../domain/maps/value-objects/MapAssets.js';
import { ValidationError, NotFoundError, BusinessRuleError } from '../../errors/ApplicationErrors.js';
import { InputValidator } from '../../validation/InputValidator.js';

/**
 * MapService - Application Layer Service
 * 
 * Orchestrates map-related business operations, coordinates between domain
 * entities and repositories, and handles complex workflows involving maps,
 * characters, and player progression.
 */
export class MapService {
  /**
   * Creates new MapService
   * @param {MapRepository} mapRepository - Map data repository
   * @param {CharacterRepository} characterRepository - Character data repository 
   * @param {MapAssetManager} assetManager - Map asset file manager
   * @param {InputValidator} validator - Input validation service
   */
  constructor(mapRepository, characterRepository, assetManager, validator = new InputValidator()) {
    this.mapRepository = mapRepository;
    this.characterRepository = characterRepository;
    this.assetManager = assetManager;
    this.validator = validator;

    // Register validation schemas
    this._registerValidationSchemas();
  }

  /**
   * Registers validation schemas for map operations
   * @private
   */
  _registerValidationSchemas() {
    // Map creation schema
    this.validator.registerSchema('MapCreate', {
      name: {
        type: 'string',
        required: true,
        minLength: 3,
        maxLength: 50,
        transform: (value) => value.trim()
      },
      description: {
        type: 'string',
        required: false,
        maxLength: 500,
        transform: (value) => value?.trim() || null
      },
      difficulty: {
        type: 'number',
        required: true,
        integer: true,
        min: 1,
        max: 10
      },
      dimensions: {
        type: 'object',
        required: true,
        properties: {
          width: { type: 'number', integer: true, min: 10, max: 100 },
          height: { type: 'number', integer: true, min: 10, max: 100 }
        }
      },
      boss: {
        type: 'object',
        required: true,
        properties: {
          characterId: { type: 'string', required: true },
          spawnPoint: { 
            type: 'object', 
            required: true,
            properties: {
              x: { type: 'number', integer: true, min: 0 },
              y: { type: 'number', integer: true, min: 0 }
            }
          },
          difficulty: { type: 'number', min: 0.5, max: 5.0 },
          drops: { type: 'array', maxItems: 10 },
          isDefeated: { type: 'boolean', default: false }
        }
      },
      unlockRequirement: {
        type: 'object',
        required: true
      },
      rewards: {
        type: 'object',
        required: true
      },
      assets: {
        type: 'object',
        required: false,
        default: {}
      }
    });

    // Map update schema  
    this.validator.registerSchema('MapUpdate', {
      name: {
        type: 'string',
        required: false,
        minLength: 3,
        maxLength: 50,
        transform: (value) => value.trim()
      },
      description: {
        type: 'string',
        required: false,
        maxLength: 500,
        transform: (value) => value?.trim() || null
      },
      difficulty: {
        type: 'number',
        required: false,
        integer: true,
        min: 1,
        max: 10
      }
    });

    // Player state schema
    this.validator.registerSchema('PlayerState', {
      defeatedBosses: {
        type: 'array',
        required: true,
        default: []
      },
      achievements: {
        type: 'array', 
        required: true,
        default: []
      },
      level: {
        type: 'number',
        required: true,
        integer: true,
        min: 1,
        max: 100
      },
      completedMaps: {
        type: 'array',
        required: true,
        default: []
      }
    });
  }

  /**
   * Creates a new map with full validation
   * @param {Object} mapData - Map creation data
   * @returns {Promise<Map>} Created map entity
   * @throws {ValidationError} If data is invalid
   * @throws {NotFoundError} If boss character not found
   * @throws {BusinessRuleError} If business rules violated
   */
  async createMap(mapData) {
    console.log(`📋 MapService: Creating new map "${mapData.name}"`);
    
    try {
      // Validate input data
      const validatedData = await this.validator.validate('MapCreate', mapData);
      
      // Verify boss character exists
      const bossCharacter = await this.characterRepository.findById(validatedData.boss.characterId);
      if (!bossCharacter) {
        throw new NotFoundError(`Boss character with ID ${validatedData.boss.characterId} not found`);
      }

      // Generate new map ID
      const mapId = MapId.generate();
      
      // Create map entity with validated data
      const map = new Map({
        id: mapId,
        name: validatedData.name,
        description: validatedData.description,
        difficulty: validatedData.difficulty,
        dimensions: validatedData.dimensions,
        boss: validatedData.boss,
        unlockRequirement: validatedData.unlockRequirement,
        rewards: validatedData.rewards,
        assets: validatedData.assets
      });

      // Additional business rule validations
      await this._validateMapBusinessRules(map);

      // Save to repository
      const savedMap = await this.mapRepository.create(map);
      
      console.log(`✅ MapService: Map "${savedMap.name}" created with ID ${savedMap.id.toString()}`);
      return savedMap;

    } catch (error) {
      console.error(`❌ MapService: Failed to create map "${mapData.name}":`, error.message);
      throw error;
    }
  }

  /**
   * Retrieves a map by ID
   * @param {string|MapId} mapId - Map identifier
   * @returns {Promise<Map>} Map entity
   * @throws {ValidationError} If ID is invalid
   * @throws {NotFoundError} If map not found
   */
  async getMap(mapId) {
    try {
      const mapIdObj = typeof mapId === 'string' ? new MapId(mapId) : mapId;
      
      const map = await this.mapRepository.findById(mapIdObj);
      if (!map) {
        throw new NotFoundError(`Map with ID ${mapIdObj.toString()} not found`);
      }

      return map;
    } catch (error) {
      console.error(`❌ MapService: Failed to get map ${mapId}:`, error.message);
      throw error;
    }
  }

  /**
   * Retrieves all maps with optional filtering
   * @param {Object} filters - Optional filters
   * @param {number} filters.minDifficulty - Minimum difficulty
   * @param {number} filters.maxDifficulty - Maximum difficulty
   * @param {string} filters.unlockType - Unlock requirement type
   * @param {string} filters.sizeCategory - Size category
   * @param {boolean} filters.completed - Filter by completion status
   * @returns {Promise<Array<Map>>} Array of maps
   */
  async getAllMaps(filters = {}) {
    try {
      let maps;

      if (filters.minDifficulty !== undefined || filters.maxDifficulty !== undefined) {
        const min = filters.minDifficulty || 1;
        const max = filters.maxDifficulty || 10;
        maps = await this.mapRepository.findByDifficultyRange(min, max);
      } else if (filters.unlockType) {
        maps = await this.mapRepository.findByUnlockType(filters.unlockType);
      } else if (filters.sizeCategory) {
        maps = await this.mapRepository.findBySize(filters.sizeCategory);
      } else if (filters.completed !== undefined) {
        maps = filters.completed 
          ? await this.mapRepository.findCompleted()
          : await this.mapRepository.findIncomplete();
      } else {
        maps = await this.mapRepository.findAll();
      }

      console.log(`📋 MapService: Retrieved ${maps.length} maps with filters:`, filters);
      return maps;

    } catch (error) {
      console.error('❌ MapService: Failed to get all maps:', error.message);
      throw error;
    }
  }

  /**
   * Updates an existing map
   * @param {string|MapId} mapId - Map identifier
   * @param {Object} updateData - Data to update
   * @returns {Promise<Map>} Updated map entity
   * @throws {ValidationError} If data is invalid
   * @throws {NotFoundError} If map not found
   */
  async updateMap(mapId, updateData) {
    try {
      const mapIdObj = typeof mapId === 'string' ? new MapId(mapId) : mapId;
      
      // Get existing map
      const existingMap = await this.getMap(mapIdObj);
      
      // Validate update data
      const validatedData = await this.validator.validate('MapUpdate', updateData);
      
      // Create updated map
      let updatedMap = existingMap;
      
      if (validatedData.name) {
        updatedMap = updatedMap.withName(validatedData.name);
      }
      
      if (validatedData.description !== undefined) {
        updatedMap = updatedMap.withDescription(validatedData.description);
      }
      
      if (validatedData.difficulty) {
        updatedMap = updatedMap.withDifficulty(validatedData.difficulty);
      }

      // Validate business rules after update
      await this._validateMapBusinessRules(updatedMap);

      // Save updated map
      const savedMap = await this.mapRepository.update(updatedMap);
      
      console.log(`✅ MapService: Map ${mapIdObj.toString()} updated successfully`);
      return savedMap;

    } catch (error) {
      console.error(`❌ MapService: Failed to update map ${mapId}:`, error.message);
      throw error;
    }
  }

  /**
   * Deletes a map
   * @param {string|MapId} mapId - Map identifier
   * @returns {Promise<boolean>} True if deleted
   * @throws {NotFoundError} If map not found
   * @throws {BusinessRuleError} If map cannot be deleted
   */
  async deleteMap(mapId) {
    try {
      const mapIdObj = typeof mapId === 'string' ? new MapId(mapId) : mapId;
      
      // Verify map exists
      await this.getMap(mapIdObj);

      // Check if map can be deleted (business rules)
      await this._validateMapDeletion(mapIdObj);

      // Delete from repository
      const deleted = await this.mapRepository.delete(mapIdObj);
      
      if (deleted) {
        console.log(`✅ MapService: Map ${mapIdObj.toString()} deleted successfully`);
        
        // Clean up associated assets
        try {
          await this.assetManager.cleanupMapAssets(mapIdObj.toString());
        } catch (assetError) {
          console.warn(`⚠️ MapService: Failed to cleanup assets for map ${mapIdObj.toString()}:`, assetError.message);
        }
      }

      return deleted;

    } catch (error) {
      console.error(`❌ MapService: Failed to delete map ${mapId}:`, error.message);
      throw error;
    }
  }

  /**
   * Defeats a boss in a map
   * @param {string|MapId} mapId - Map identifier
   * @param {Object} playerState - Current player state
   * @returns {Promise<Map>} Map with boss defeated
   * @throws {NotFoundError} If map not found
   * @throws {BusinessRuleError} If boss already defeated or map locked
   */
  async defeatBoss(mapId, playerState) {
    try {
      const mapIdObj = typeof mapId === 'string' ? new MapId(mapId) : mapId;
      
      // Get map
      const map = await this.getMap(mapIdObj);
      
      // Validate player state
      const validatedPlayerState = await this.validator.validate('PlayerState', playerState);
      
      // Check if map is unlocked for player
      if (!map.isUnlockedFor(validatedPlayerState)) {
        throw new BusinessRuleError(`Map ${map.name} is not unlocked for this player`);
      }
      
      // Check if boss is already defeated
      if (map.isCompleted()) {
        throw new BusinessRuleError(`Boss in map ${map.name} is already defeated`);
      }
      
      // Defeat the boss
      const updatedMap = map.defeatBoss();
      
      // Save updated map
      const savedMap = await this.mapRepository.update(updatedMap);
      
      console.log(`⚔️ MapService: Boss defeated in map "${map.name}" by player level ${validatedPlayerState.level}`);
      return savedMap;

    } catch (error) {
      console.error(`❌ MapService: Failed to defeat boss in map ${mapId}:`, error.message);
      throw error;
    }
  }

  /**
   * Resets a boss in a map (for testing/admin purposes)
   * @param {string|MapId} mapId - Map identifier
   * @returns {Promise<Map>} Map with boss reset
   */
  async resetBoss(mapId) {
    try {
      const mapIdObj = typeof mapId === 'string' ? new MapId(mapId) : mapId;
      
      const map = await this.getMap(mapIdObj);
      const resetMap = map.resetBoss();
      const savedMap = await this.mapRepository.update(resetMap);
      
      console.log(`🔄 MapService: Boss reset in map "${map.name}"`);
      return savedMap;

    } catch (error) {
      console.error(`❌ MapService: Failed to reset boss in map ${mapId}:`, error.message);
      throw error;
    }
  }

  /**
   * Gets maps unlocked for a specific player
   * @param {Object} playerState - Player's current state
   * @returns {Promise<Array<Map>>} Unlocked maps
   */
  async getUnlockedMapsForPlayer(playerState) {
    try {
      const validatedPlayerState = await this.validator.validate('PlayerState', playerState);
      
      const unlockedMaps = await this.mapRepository.findUnlockedForPlayer(validatedPlayerState);
      
      console.log(`🔓 MapService: Found ${unlockedMaps.length} unlocked maps for player level ${validatedPlayerState.level}`);
      return unlockedMaps;

    } catch (error) {
      console.error('❌ MapService: Failed to get unlocked maps for player:', error.message);
      throw error;
    }
  }

  /**
   * Gets map progression chain showing unlock requirements
   * @returns {Promise<Object>} Progression tree structure
   */
  async getMapProgression() {
    try {
      const allMaps = await this.mapRepository.findAll();
      
      // Build progression tree
      const progression = {
        starter: [],      // Always available maps
        chains: []        // Unlock chains
      };

      // Group maps by unlock type
      for (const map of allMaps) {
        if (map.unlockRequirement.type === 'always') {
          progression.starter.push({
            map: map,
            unlocks: this._findMapsUnlockedBy(allMaps, map.id)
          });
        }
      }

      console.log(`📊 MapService: Built progression tree with ${progression.starter.length} starter maps`);
      return progression;

    } catch (error) {
      console.error('❌ MapService: Failed to build map progression:', error.message);
      throw error;
    }
  }

  /**
   * Uploads and associates assets with a map
   * @param {string|MapId} mapId - Map identifier
   * @param {Object} assetFiles - Asset files to upload
   * @returns {Promise<Map>} Map with updated assets
   */
  async uploadMapAssets(mapId, assetFiles) {
    try {
      const mapIdObj = typeof mapId === 'string' ? new MapId(mapId) : mapId;
      const map = await this.getMap(mapIdObj);

      // Upload assets using asset manager
      const uploadedAssets = await this.assetManager.uploadMapAssets(mapIdObj.toString(), assetFiles);
      
      // Update map with new assets
      const newAssets = new MapAssets(uploadedAssets);
      const updatedMap = map.withAssets(newAssets);
      
      const savedMap = await this.mapRepository.update(updatedMap);
      
      console.log(`📁 MapService: Uploaded ${Object.keys(assetFiles).length} assets for map "${map.name}"`);
      return savedMap;

    } catch (error) {
      console.error(`❌ MapService: Failed to upload assets for map ${mapId}:`, error.message);
      throw error;
    }
  }

  /**
   * Gets repository statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics() {
    try {
      const stats = await this.mapRepository.getStatistics();
      
      // Add computed statistics
      const allMaps = await this.mapRepository.findAll();
      
      stats.computed = {
        averageDifficulty: this._calculateAverageDifficulty(allMaps),
        difficultyDistribution: this._getDifficultyDistribution(allMaps),
        sizeDistribution: this._getSizeDistribution(allMaps),
        unlockTypeDistribution: this._getUnlockTypeDistribution(allMaps),
        completionRate: this._getCompletionRate(allMaps)
      };

      return stats;
    } catch (error) {
      console.error('❌ MapService: Failed to get statistics:', error.message);
      throw error;
    }
  }

  /**
   * Validates map business rules
   * @param {Map} map - Map to validate
   * @throws {BusinessRuleError} If validation fails
   * @private
   */
  async _validateMapBusinessRules(map) {
    // Check for duplicate names
    const existingMaps = await this.mapRepository.findByName(map.name);
    const duplicates = existingMaps.filter(existing => !existing.id.equals(map.id));
    
    if (duplicates.length > 0) {
      throw new BusinessRuleError(`Map with name "${map.name}" already exists`);
    }

    // Validate boss character relationship
    const bossCharacter = await this.characterRepository.findById(map.boss.characterId);
    if (!bossCharacter) {
      throw new BusinessRuleError(`Boss character ${map.boss.characterId.toString()} not found`);
    }

    // Additional business validations can be added here
  }

  /**
   * Validates if a map can be deleted
   * @param {MapId} mapId - Map ID to check
   * @throws {BusinessRuleError} If map cannot be deleted
   * @private
   */
  async _validateMapDeletion(mapId) {
    // Check if other maps depend on this one for unlocking
    const allMaps = await this.mapRepository.findAll();
    
    for (const map of allMaps) {
      if (map.unlockRequirement.type === 'boss_defeat' && 
          map.unlockRequirement.targetMapId?.equals(mapId)) {
        throw new BusinessRuleError(`Cannot delete map: required by "${map.name}" for unlocking`);
      }
    }
  }

  /**
   * Finds maps unlocked by completing a given map
   * @param {Array<Map>} allMaps - All maps to search
   * @param {MapId} mapId - Map that unlocks others
   * @returns {Array<Map>} Maps unlocked by this map
   * @private
   */
  _findMapsUnlockedBy(allMaps, mapId) {
    return allMaps.filter(map => 
      map.unlockRequirement.type === 'boss_defeat' && 
      map.unlockRequirement.targetMapId?.equals(mapId)
    );
  }

  /**
   * Calculates average difficulty across all maps
   * @param {Array<Map>} maps - All maps
   * @returns {number} Average difficulty
   * @private
   */
  _calculateAverageDifficulty(maps) {
    if (maps.length === 0) return 0;
    const total = maps.reduce((sum, map) => sum + map.difficulty, 0);
    return Math.round((total / maps.length) * 100) / 100;
  }

  /**
   * Gets difficulty distribution
   * @param {Array<Map>} maps - All maps
   * @returns {Object} Difficulty distribution
   * @private
   */
  _getDifficultyDistribution(maps) {
    const distribution = {};
    for (let i = 1; i <= 10; i++) {
      distribution[i] = maps.filter(map => map.difficulty === i).length;
    }
    return distribution;
  }

  /**
   * Gets size distribution
   * @param {Array<Map>} maps - All maps
   * @returns {Object} Size distribution
   * @private
   */
  _getSizeDistribution(maps) {
    const distribution = { small: 0, medium: 0, large: 0, huge: 0 };
    maps.forEach(map => {
      const category = map.dimensions.getSizeCategory();
      distribution[category]++;
    });
    return distribution;
  }

  /**
   * Gets unlock type distribution
   * @param {Array<Map>} maps - All maps
   * @returns {Object} Unlock type distribution
   * @private
   */
  _getUnlockTypeDistribution(maps) {
    const distribution = {};
    maps.forEach(map => {
      const type = map.unlockRequirement.type;
      distribution[type] = (distribution[type] || 0) + 1;
    });
    return distribution;
  }

  /**
   * Gets completion rate
   * @param {Array<Map>} maps - All maps
   * @returns {number} Completion rate (0-1)
   * @private
   */
  _getCompletionRate(maps) {
    if (maps.length === 0) return 0;
    const completed = maps.filter(map => map.isCompleted()).length;
    return Math.round((completed / maps.length) * 10000) / 10000;
  }
}