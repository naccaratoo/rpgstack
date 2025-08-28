import fs from 'fs/promises';
import path from 'path';
import { Map } from '../../../domain/maps/entities/Map.js';
import { MapId } from '../../../domain/maps/value-objects/MapId.js';
import { MapRepository } from '../../../domain/maps/repositories/MapRepository.js';
import { CharacterId } from '../../../domain/value-objects/CharacterId.js';
import { DatabaseError, NotFoundError } from '../../../application/errors/ApplicationErrors.js';

/**
 * JsonMapRepository - Infrastructure Layer
 * 
 * JSON file-based implementation of MapRepository interface.
 * Provides persistent storage for maps using JSON files with
 * atomic operations, backup support, and comprehensive querying.
 */
export class JsonMapRepository extends MapRepository {
  /**
   * Creates new JsonMapRepository
   * @param {string} dataPath - Path to JSON data file
   * @param {string} backupPath - Path for backup files
   */
  constructor(dataPath = 'data/maps.json', backupPath = 'backups/') {
    super();
    this.dataPath = path.resolve(dataPath);
    this.backupPath = path.resolve(backupPath);
    this.data = null; // Cached data
    this.lastModified = null; // File modification tracking
  }

  /**
   * Initializes repository and ensures data directory exists
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dataPath);
      await fs.mkdir(dataDir, { recursive: true });
      
      // Ensure backup directory exists
      await fs.mkdir(this.backupPath, { recursive: true });
      
      // Load initial data
      await this._loadData();
      
      console.log(`✅ JsonMapRepository: Initialized with data file ${this.dataPath}`);
    } catch (error) {
      console.error('❌ JsonMapRepository: Failed to initialize:', error.message);
      throw new DatabaseError('Failed to initialize map repository', error);
    }
  }

  /**
   * Creates a new map in the repository
   * @param {Map} map - Map entity to create
   * @returns {Promise<Map>} Created map
   * @throws {DatabaseError} If map already exists or save fails
   */
  async create(map) {
    try {
      await this._loadData();
      
      // Check if map already exists
      const existingMap = this.data.maps.find(m => m.id === map.id.toString());
      if (existingMap) {
        throw new DatabaseError(`Map with ID ${map.id.toString()} already exists`);
      }
      
      // Add map to data
      this.data.maps.push(map.toJSON());
      
      // Update metadata
      this.data.metadata.lastUpdated = new Date().toISOString();
      this.data.metadata.mapCount = this.data.maps.length;
      
      // Save data
      await this._saveData();
      
      console.log(`✅ JsonMapRepository: Created map "${map.name}" (${map.id.toString()})`);
      return map;

    } catch (error) {
      console.error(`❌ JsonMapRepository: Failed to create map:`, error.message);
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to create map', error);
    }
  }

  /**
   * Retrieves a map by its ID
   * @param {MapId} mapId - Unique map identifier
   * @returns {Promise<Map|null>} Map entity if found, null otherwise
   */
  async findById(mapId) {
    try {
      await this._loadData();
      
      const mapData = this.data.maps.find(m => m.id === mapId.toString());
      return mapData ? Map.fromJSON(mapData) : null;

    } catch (error) {
      console.error(`❌ JsonMapRepository: Failed to find map ${mapId.toString()}:`, error.message);
      throw new DatabaseError('Failed to retrieve map', error);
    }
  }

  /**
   * Retrieves all maps in the repository
   * @returns {Promise<Array<Map>>} Array of all map entities
   */
  async findAll() {
    try {
      await this._loadData();
      
      return this.data.maps.map(mapData => Map.fromJSON(mapData));

    } catch (error) {
      console.error('❌ JsonMapRepository: Failed to find all maps:', error.message);
      throw new DatabaseError('Failed to retrieve all maps', error);
    }
  }

  /**
   * Updates an existing map
   * @param {Map} map - Updated map entity
   * @returns {Promise<Map>} Updated map entity
   * @throws {NotFoundError} If map not found
   * @throws {DatabaseError} If update fails
   */
  async update(map) {
    try {
      await this._loadData();
      
      const index = this.data.maps.findIndex(m => m.id === map.id.toString());
      if (index === -1) {
        throw new NotFoundError(`Map with ID ${map.id.toString()} not found`);
      }
      
      // Update map data
      this.data.maps[index] = map.toJSON();
      
      // Update metadata
      this.data.metadata.lastUpdated = new Date().toISOString();
      
      // Save data
      await this._saveData();
      
      console.log(`✅ JsonMapRepository: Updated map "${map.name}" (${map.id.toString()})`);
      return map;

    } catch (error) {
      console.error(`❌ JsonMapRepository: Failed to update map:`, error.message);
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to update map', error);
    }
  }

  /**
   * Deletes a map from the repository
   * @param {MapId} mapId - ID of map to delete
   * @returns {Promise<boolean>} True if deleted, false if not found
   * @throws {DatabaseError} If deletion fails
   */
  async delete(mapId) {
    try {
      await this._loadData();
      
      const index = this.data.maps.findIndex(m => m.id === mapId.toString());
      if (index === -1) {
        return false; // Map not found
      }
      
      // Remove map
      const deletedMap = this.data.maps.splice(index, 1)[0];
      
      // Update metadata
      this.data.metadata.lastUpdated = new Date().toISOString();
      this.data.metadata.mapCount = this.data.maps.length;
      
      // Save data
      await this._saveData();
      
      console.log(`✅ JsonMapRepository: Deleted map "${deletedMap.name}" (${mapId.toString()})`);
      return true;

    } catch (error) {
      console.error(`❌ JsonMapRepository: Failed to delete map ${mapId.toString()}:`, error.message);
      throw new DatabaseError('Failed to delete map', error);
    }
  }

  /**
   * Finds maps by difficulty range
   * @param {number} minDifficulty - Minimum difficulty (inclusive)
   * @param {number} maxDifficulty - Maximum difficulty (inclusive)
   * @returns {Promise<Array<Map>>} Maps within difficulty range
   */
  async findByDifficultyRange(minDifficulty, maxDifficulty) {
    try {
      await this._loadData();
      
      const filteredMaps = this.data.maps.filter(mapData => 
        mapData.difficulty >= minDifficulty && mapData.difficulty <= maxDifficulty
      );
      
      return filteredMaps.map(mapData => Map.fromJSON(mapData));

    } catch (error) {
      console.error('❌ JsonMapRepository: Failed to find maps by difficulty range:', error.message);
      throw new DatabaseError('Failed to query maps by difficulty', error);
    }
  }

  /**
   * Finds maps by unlock requirement type
   * @param {string} unlockType - Type of unlock requirement
   * @returns {Promise<Array<Map>>} Maps with specified unlock type
   */
  async findByUnlockType(unlockType) {
    try {
      await this._loadData();
      
      const filteredMaps = this.data.maps.filter(mapData => 
        mapData.unlockRequirement && mapData.unlockRequirement.type === unlockType
      );
      
      return filteredMaps.map(mapData => Map.fromJSON(mapData));

    } catch (error) {
      console.error('❌ JsonMapRepository: Failed to find maps by unlock type:', error.message);
      throw new DatabaseError('Failed to query maps by unlock type', error);
    }
  }

  /**
   * Finds maps that are unlocked for a specific player state
   * @param {Object} playerState - Player's current state
   * @returns {Promise<Array<Map>>} Unlocked maps for player
   */
  async findUnlockedForPlayer(playerState) {
    try {
      const allMaps = await this.findAll();
      
      return allMaps.filter(map => map.isUnlockedFor(playerState));

    } catch (error) {
      console.error('❌ JsonMapRepository: Failed to find unlocked maps for player:', error.message);
      throw new DatabaseError('Failed to query unlocked maps', error);
    }
  }

  /**
   * Finds maps by name (case-insensitive partial match)
   * @param {string} namePattern - Name pattern to search for
   * @returns {Promise<Array<Map>>} Maps matching name pattern
   */
  async findByName(namePattern) {
    try {
      await this._loadData();
      
      const pattern = namePattern.toLowerCase();
      const filteredMaps = this.data.maps.filter(mapData => 
        mapData.name.toLowerCase().includes(pattern)
      );
      
      return filteredMaps.map(mapData => Map.fromJSON(mapData));

    } catch (error) {
      console.error('❌ JsonMapRepository: Failed to find maps by name:', error.message);
      throw new DatabaseError('Failed to query maps by name', error);
    }
  }

  /**
   * Finds maps that use a specific character as boss
   * @param {CharacterId} characterId - Character ID used as boss
   * @returns {Promise<Array<Map>>} Maps using the character as boss
   */
  async findByBossCharacter(characterId) {
    try {
      await this._loadData();
      
      const filteredMaps = this.data.maps.filter(mapData => 
        mapData.boss && mapData.boss.characterId === characterId.toString()
      );
      
      return filteredMaps.map(mapData => Map.fromJSON(mapData));

    } catch (error) {
      console.error('❌ JsonMapRepository: Failed to find maps by boss character:', error.message);
      throw new DatabaseError('Failed to query maps by boss character', error);
    }
  }

  /**
   * Finds maps by size category
   * @param {string} sizeCategory - Size category ('small', 'medium', 'large', 'huge')
   * @returns {Promise<Array<Map>>} Maps in specified size category
   */
  async findBySize(sizeCategory) {
    try {
      const allMaps = await this.findAll();
      
      return allMaps.filter(map => map.dimensions.getSizeCategory() === sizeCategory);

    } catch (error) {
      console.error('❌ JsonMapRepository: Failed to find maps by size:', error.message);
      throw new DatabaseError('Failed to query maps by size', error);
    }
  }

  /**
   * Finds completed maps (boss defeated)
   * @returns {Promise<Array<Map>>} Maps with defeated bosses
   */
  async findCompleted() {
    try {
      const allMaps = await this.findAll();
      
      return allMaps.filter(map => map.isCompleted());

    } catch (error) {
      console.error('❌ JsonMapRepository: Failed to find completed maps:', error.message);
      throw new DatabaseError('Failed to query completed maps', error);
    }
  }

  /**
   * Finds incomplete maps (boss alive)
   * @returns {Promise<Array<Map>>} Maps with active bosses
   */
  async findIncomplete() {
    try {
      const allMaps = await this.findAll();
      
      return allMaps.filter(map => !map.isCompleted());

    } catch (error) {
      console.error('❌ JsonMapRepository: Failed to find incomplete maps:', error.message);
      throw new DatabaseError('Failed to query incomplete maps', error);
    }
  }

  /**
   * Gets total count of maps in repository
   * @returns {Promise<number>} Total map count
   */
  async count() {
    try {
      await this._loadData();
      
      return this.data.maps.length;

    } catch (error) {
      console.error('❌ JsonMapRepository: Failed to count maps:', error.message);
      throw new DatabaseError('Failed to count maps', error);
    }
  }

  /**
   * Performs bulk save operations
   * @param {Array<Map>} maps - Array of maps to save
   * @returns {Promise<Array<Map>>} Array of saved maps
   */
  async bulkSave(maps) {
    try {
      await this._loadData();
      
      const results = [];
      
      for (const map of maps) {
        const existingIndex = this.data.maps.findIndex(m => m.id === map.id.toString());
        
        if (existingIndex >= 0) {
          // Update existing
          this.data.maps[existingIndex] = map.toJSON();
        } else {
          // Create new
          this.data.maps.push(map.toJSON());
        }
        
        results.push(map);
      }
      
      // Update metadata
      this.data.metadata.lastUpdated = new Date().toISOString();
      this.data.metadata.mapCount = this.data.maps.length;
      
      // Save data
      await this._saveData();
      
      console.log(`✅ JsonMapRepository: Bulk saved ${maps.length} maps`);
      return results;

    } catch (error) {
      console.error('❌ JsonMapRepository: Failed to bulk save maps:', error.message);
      throw new DatabaseError('Failed to bulk save maps', error);
    }
  }

  /**
   * Performs bulk delete operations
   * @param {Array<MapId>} mapIds - Array of map IDs to delete
   * @returns {Promise<number>} Number of maps actually deleted
   */
  async bulkDelete(mapIds) {
    try {
      await this._loadData();
      
      let deletedCount = 0;
      const idsToDelete = mapIds.map(id => id.toString());
      
      this.data.maps = this.data.maps.filter(map => {
        if (idsToDelete.includes(map.id)) {
          deletedCount++;
          return false;
        }
        return true;
      });
      
      // Update metadata
      this.data.metadata.lastUpdated = new Date().toISOString();
      this.data.metadata.mapCount = this.data.maps.length;
      
      // Save data
      await this._saveData();
      
      console.log(`✅ JsonMapRepository: Bulk deleted ${deletedCount} maps`);
      return deletedCount;

    } catch (error) {
      console.error('❌ JsonMapRepository: Failed to bulk delete maps:', error.message);
      throw new DatabaseError('Failed to bulk delete maps', error);
    }
  }

  /**
   * Creates a backup of all map data
   * @param {string} backupPath - Path to store backup (optional)
   * @returns {Promise<string>} Path to created backup file
   */
  async backup(backupPath = null) {
    try {
      await this._loadData();
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `maps_backup_${timestamp}.json`;
      const finalPath = backupPath || path.join(this.backupPath, filename);
      
      await fs.writeFile(finalPath, JSON.stringify(this.data, null, 2), 'utf-8');
      
      console.log(`✅ JsonMapRepository: Created backup at ${finalPath}`);
      return finalPath;

    } catch (error) {
      console.error('❌ JsonMapRepository: Failed to create backup:', error.message);
      throw new DatabaseError('Failed to create backup', error);
    }
  }

  /**
   * Restores map data from backup
   * @param {string} backupPath - Path to backup file
   * @param {Object} options - Restore options
   * @param {boolean} options.merge - If true, merge with existing data
   * @param {boolean} options.overwrite - If true, overwrite existing maps
   * @returns {Promise<number>} Number of maps restored
   */
  async restore(backupPath, options = {}) {
    try {
      const { merge = false, overwrite = false } = options;
      
      // Read backup data
      const backupContent = await fs.readFile(backupPath, 'utf-8');
      const backupData = JSON.parse(backupContent);
      
      if (!merge) {
        // Complete replacement
        this.data = backupData;
        await this._saveData();
        console.log(`✅ JsonMapRepository: Restored ${this.data.maps.length} maps from backup`);
        return this.data.maps.length;
      } else {
        // Merge mode
        await this._loadData();
        let restoredCount = 0;
        
        for (const mapData of backupData.maps) {
          const existingIndex = this.data.maps.findIndex(m => m.id === mapData.id);
          
          if (existingIndex >= 0 && !overwrite) {
            continue; // Skip existing maps unless overwrite is true
          }
          
          if (existingIndex >= 0) {
            this.data.maps[existingIndex] = mapData; // Overwrite
          } else {
            this.data.maps.push(mapData); // Add new
          }
          
          restoredCount++;
        }
        
        // Update metadata
        this.data.metadata.lastUpdated = new Date().toISOString();
        this.data.metadata.mapCount = this.data.maps.length;
        
        await this._saveData();
        console.log(`✅ JsonMapRepository: Merged ${restoredCount} maps from backup`);
        return restoredCount;
      }

    } catch (error) {
      console.error('❌ JsonMapRepository: Failed to restore from backup:', error.message);
      throw new DatabaseError('Failed to restore from backup', error);
    }
  }

  /**
   * Validates repository data integrity
   * @returns {Promise<Object>} Validation results
   */
  async validateIntegrity() {
    try {
      await this._loadData();
      
      const validation = {
        isValid: true,
        errors: [],
        warnings: [],
        mapCount: this.data.maps.length,
        duplicateIds: [],
        invalidMaps: []
      };

      const seenIds = new Set();
      
      // Validate each map
      for (let i = 0; i < this.data.maps.length; i++) {
        const mapData = this.data.maps[i];
        
        try {
          // Check for duplicate IDs
          if (seenIds.has(mapData.id)) {
            validation.duplicateIds.push(mapData.id);
            validation.isValid = false;
          } else {
            seenIds.add(mapData.id);
          }
          
          // Try to create Map entity (validates structure)
          Map.fromJSON(mapData);
          
        } catch (error) {
          validation.invalidMaps.push({ index: i, id: mapData.id, error: error.message });
          validation.isValid = false;
        }
      }
      
      if (validation.duplicateIds.length > 0) {
        validation.errors.push(`Found ${validation.duplicateIds.length} duplicate map IDs`);
      }
      
      if (validation.invalidMaps.length > 0) {
        validation.errors.push(`Found ${validation.invalidMaps.length} invalid maps`);
      }

      return validation;

    } catch (error) {
      console.error('❌ JsonMapRepository: Failed to validate integrity:', error.message);
      throw new DatabaseError('Failed to validate repository integrity', error);
    }
  }

  /**
   * Optimizes repository storage
   * @returns {Promise<Object>} Optimization results
   */
  async optimize() {
    try {
      await this._loadData();
      
      const beforeSize = JSON.stringify(this.data).length;
      
      // Sort maps by ID for consistent ordering
      this.data.maps.sort((a, b) => a.id.localeCompare(b.id));
      
      // Update metadata
      this.data.metadata.lastUpdated = new Date().toISOString();
      this.data.metadata.optimized = true;
      
      // Save optimized data
      await this._saveData();
      
      const afterSize = JSON.stringify(this.data).length;
      
      const results = {
        beforeSize: beforeSize,
        afterSize: afterSize,
        sizeDifference: beforeSize - afterSize,
        mapCount: this.data.maps.length,
        optimized: true
      };

      console.log(`✅ JsonMapRepository: Optimized repository - ${results.sizeDifference} bytes saved`);
      return results;

    } catch (error) {
      console.error('❌ JsonMapRepository: Failed to optimize:', error.message);
      throw new DatabaseError('Failed to optimize repository', error);
    }
  }

  /**
   * Gets repository statistics
   * @returns {Promise<Object>} Repository statistics
   */
  async getStatistics() {
    try {
      await this._loadData();
      
      const stats = {
        mapCount: this.data.maps.length,
        fileSize: JSON.stringify(this.data).length,
        lastUpdated: this.data.metadata.lastUpdated,
        version: this.data.metadata.version,
        difficultyBreakdown: {},
        sizeBreakdown: {},
        unlockTypeBreakdown: {},
        completionStatus: {
          completed: 0,
          incomplete: 0
        }
      };

      // Analyze maps
      for (const mapData of this.data.maps) {
        try {
          const map = Map.fromJSON(mapData);
          
          // Difficulty breakdown
          stats.difficultyBreakdown[map.difficulty] = (stats.difficultyBreakdown[map.difficulty] || 0) + 1;
          
          // Size breakdown
          const sizeCategory = map.dimensions.getSizeCategory();
          stats.sizeBreakdown[sizeCategory] = (stats.sizeBreakdown[sizeCategory] || 0) + 1;
          
          // Unlock type breakdown
          const unlockType = map.unlockRequirement.type;
          stats.unlockTypeBreakdown[unlockType] = (stats.unlockTypeBreakdown[unlockType] || 0) + 1;
          
          // Completion status
          if (map.isCompleted()) {
            stats.completionStatus.completed++;
          } else {
            stats.completionStatus.incomplete++;
          }
          
        } catch (error) {
          console.warn(`⚠️ JsonMapRepository: Invalid map data for ID ${mapData.id}:`, error.message);
        }
      }

      return stats;

    } catch (error) {
      console.error('❌ JsonMapRepository: Failed to get statistics:', error.message);
      throw new DatabaseError('Failed to get repository statistics', error);
    }
  }

  /**
   * Finds maps with specific asset requirements
   * @param {Object} assetCriteria - Asset search criteria
   * @returns {Promise<Array<Map>>} Maps matching asset criteria
   */
  async findByAssetCriteria(assetCriteria) {
    try {
      const allMaps = await this.findAll();
      
      return allMaps.filter(map => {
        const assets = map.assets;
        
        if (assetCriteria.hasBackground && !assets.hasBackground()) return false;
        if (assetCriteria.hasMusic && !assets.hasMusic()) return false;
        if (assetCriteria.hasSounds && !assets.hasSounds()) return false;
        
        return true;
      });

    } catch (error) {
      console.error('❌ JsonMapRepository: Failed to find maps by asset criteria:', error.message);
      throw new DatabaseError('Failed to query maps by assets', error);
    }
  }

  /**
   * Loads data from JSON file
   * @private
   */
  async _loadData() {
    try {
      const stats = await fs.stat(this.dataPath);
      
      // Check if we need to reload
      if (!this.data || !this.lastModified || stats.mtime > this.lastModified) {
        const content = await fs.readFile(this.dataPath, 'utf-8');
        this.data = JSON.parse(content);
        this.lastModified = stats.mtime;
      }
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, create initial structure
        this.data = {
          maps: [],
          metadata: {
            version: '2.0.0',
            created: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            mapCount: 0
          }
        };
        await this._saveData();
      } else {
        throw error;
      }
    }
  }

  /**
   * Saves data to JSON file atomically
   * @private
   */
  async _saveData() {
    try {
      const tempPath = this.dataPath + '.tmp';
      
      // Write to temporary file first
      await fs.writeFile(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      
      // Atomic rename
      await fs.rename(tempPath, this.dataPath);
      
      // Update modification time
      this.lastModified = new Date();
      
    } catch (error) {
      // Cleanup temp file if it exists
      try {
        await fs.unlink(this.dataPath + '.tmp');
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      throw error;
    }
  }
}