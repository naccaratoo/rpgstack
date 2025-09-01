/**
 * JsonCharacterRepository Implementation
 * 
 * Concrete implementation of CharacterRepository interface that persists
 * character data in JSON format. Provides full CRUD operations with
 * file-based storage, backup functionality, and transaction support.
 * 
 * Features:
 * - JSON file-based persistence
 * - Atomic operations with file locking
 * - Automatic backup creation
 * - Query optimization for large datasets
 * - Transaction support for bulk operations
 * - Data integrity validation
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { CharacterRepository } from '../../domain/repositories/CharacterRepository.js';
import { Character } from '../../domain/entities/Character.js';
import { CharacterId } from '../../domain/value-objects/CharacterId.js';
import { Stats } from '../../domain/value-objects/Stats.js';

export class JsonCharacterRepository extends CharacterRepository {
  constructor(config = {}) {
    super();
    
    this.dataPath = config.dataPath || path.join(process.cwd(), 'data', 'characters.json');
    this.backupPath = config.backupPath || path.join(process.cwd(), 'backups');
    this.enableBackups = config.enableBackups !== false;
    this.maxBackups = config.maxBackups || 10;
    
    // In-memory cache for performance
    this._cache = new Map();
    this._cacheValid = false;
    
    // File lock mechanism
    this._lockFile = `${this.dataPath}.lock`;
    this._isLocked = false;
  }

  /**
   * Initialize repository and ensure data file exists
   */
  async initialize() {
    try {
      // Ensure data directory exists
      await fs.mkdir(path.dirname(this.dataPath), { recursive: true });
      
      // Ensure backup directory exists if backups enabled
      if (this.enableBackups) {
        await fs.mkdir(this.backupPath, { recursive: true });
      }
      
      // Create empty data file if it doesn't exist
      try {
        await fs.access(this.dataPath);
      } catch (error) {
        await this._writeDataFile({ characters: {} });
      }
      
      // Load initial cache
      await this._loadCache();
      
    } catch (error) {
      throw new Error(`Failed to initialize JsonCharacterRepository: ${error.message}`);
    }
  }

  /**
   * Find character by ID
   * @param {CharacterId} id - Character ID to find
   * @returns {Promise<Character|null>} Character or null if not found
   */
  async findById(id) {
    if (!(id instanceof CharacterId)) {
      throw new Error('ID must be a CharacterId instance');
    }
    
    await this._ensureCacheLoaded();
    const character = this._cache.get(id.toString());
    return character || null;
  }

  /**
   * Find all characters
   * @returns {Promise<Character[]>} Array of all characters
   */
  async findAll() {
    await this._ensureCacheLoaded();
    return Array.from(this._cache.values());
  }

  /**
   * Find characters matching criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Character[]>} Matching characters
   */
  async findByCriteria(criteria) {
    const characters = await this.findAll();
    
    return characters.filter(character => {
      return Object.entries(criteria).every(([key, value]) => {
        const characterValue = this._getNestedValue(character, key);
        
        if (Array.isArray(value)) {
          return value.includes(characterValue);
        }
        
        if (typeof value === 'object' && value !== null) {
          // Range queries: { min: 1, max: 10 }
          if (value.min !== undefined && characterValue < value.min) return false;
          if (value.max !== undefined && characterValue > value.max) return false;
          // Pattern matching: { pattern: 'Rob*' }
          if (value.pattern && !this._matchPattern(characterValue, value.pattern)) return false;
          return true;
        }
        
        return characterValue === value;
      });
    });
  }

  /**
   * Save character (create or update)
   * @param {Character} character - Character to save
   * @returns {Promise<Character>} Saved character
   */
  async save(character) {
    if (!(character instanceof Character)) {
      throw new Error('Must provide Character instance');
    }
    
    // Check if we're already in a transaction (lock is held)
    if (this._isLocked) {
      // Direct save without locking (already locked)
      await this._saveWithoutLock(character);
    } else {
      await this._withLock(async () => {
        await this._saveWithoutLock(character);
      });
    }
    
    return character;
  }

  /**
   * Save character without acquiring lock
   * @private
   */
  async _saveWithoutLock(character) {
    // Create backup before modifying
    if (this.enableBackups) {
      await this._createBackup();
    }
    
    // Update cache
    this._cache.set(character.id.toString(), character);
    this._cacheValid = true;
    
    // Persist to file
    await this._persistCache();
  }

  /**
   * Delete character by ID
   * @param {CharacterId} id - Character ID to delete
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    if (!(id instanceof CharacterId)) {
      throw new Error('ID must be a CharacterId instance');
    }
    
    const existed = await this._withLock(async () => {
      const hadCharacter = this._cache.has(id.toString());
      
      if (hadCharacter) {
        // Create backup before deleting
        if (this.enableBackups) {
          await this._createBackup();
        }
        
        this._cache.delete(id.toString());
        await this._persistCache();
      }
      
      return hadCharacter;
    });
    
    return existed;
  }

  /**
   * Check if character exists by ID
   * @param {CharacterId} id - Character ID to check
   * @returns {Promise<boolean>} True if exists
   */
  async exists(id) {
    if (!(id instanceof CharacterId)) {
      throw new Error('ID must be a CharacterId instance');
    }
    
    await this._ensureCacheLoaded();
    return this._cache.has(id.toString());
  }

  /**
   * Count total characters
   * @returns {Promise<number>} Total character count
   */
  async count() {
    await this._ensureCacheLoaded();
    return this._cache.size;
  }

  /**
   * Find characters by level range
   * @param {number} minLevel - Minimum level
   * @param {number} maxLevel - Maximum level
   * @returns {Promise<Character[]>} Characters in level range
   */
  async findByLevelRange(minLevel, maxLevel) {
    return await this.findByCriteria({
      level: { min: minLevel, max: maxLevel },
    });
  }

  /**
   * Find characters by AI type
   * @param {string} aiType - AI type to search for
   * @returns {Promise<Character[]>} Characters with specified AI type
   */
  async findByAIType(aiType) {
    return await this.findByCriteria({ aiType });
  }

  /**
   * Find characters by name (partial match, case insensitive)
   * @param {string} namePattern - Name pattern to search
   * @returns {Promise<Character[]>} Characters matching name pattern
   */
  async findByName(namePattern) {
    return await this.findByCriteria({
      name: { pattern: `*${namePattern}*` },
    });
  }

  /**
   * Get repository statistics
   * @returns {Promise<Object>} Repository statistics
   */
  async getStatistics() {
    const characters = await this.findAll();
    
    const stats = {
      totalCharacters: characters.length,
      levels: {
        min: Math.min(...characters.map(c => c.level)),
        max: Math.max(...characters.map(c => c.level)),
        average: characters.reduce((sum, c) => sum + c.level, 0) / characters.length,
      },
      aiTypes: {},
      dataSize: 0,
    };
    
    // Count AI types
    characters.forEach(character => {
      stats.aiTypes[character.aiType] = (stats.aiTypes[character.aiType] || 0) + 1;
    });
    
    // Calculate data size
    try {
      const fileStats = await fs.stat(this.dataPath);
      stats.dataSize = fileStats.size;
    } catch (error) {
      stats.dataSize = 0;
    }
    
    return stats;
  }

  /**
   * Bulk save operation
   * @param {Character[]} characters - Characters to save
   * @returns {Promise<Character[]>} Saved characters
   */
  async bulkSave(characters) {
    if (!Array.isArray(characters)) {
      throw new Error('Characters must be an array');
    }
    
    characters.forEach(character => {
      if (!(character instanceof Character)) {
        throw new Error('All items must be Character instances');
      }
    });
    
    return await this._withLock(async () => {
      // Create backup before bulk operation
      if (this.enableBackups) {
        await this._createBackup();
      }
      
      // Update cache with all characters
      characters.forEach(character => {
        this._cache.set(character.id.toString(), character);
      });
      
      this._cacheValid = true;
      await this._persistCache();
      
      return characters;
    });
  }

  /**
   * Bulk delete operation
   * @param {CharacterId[]} ids - Character IDs to delete
   * @returns {Promise<number>} Number of deleted characters
   */
  async bulkDelete(ids) {
    if (!Array.isArray(ids)) {
      throw new Error('IDs must be an array');
    }
    
    ids.forEach(id => {
      if (!(id instanceof CharacterId)) {
        throw new Error('All IDs must be CharacterId instances');
      }
    });
    
    return await this._withLock(async () => {
      // Create backup before bulk operation
      if (this.enableBackups) {
        await this._createBackup();
      }
      
      let deletedCount = 0;
      ids.forEach(id => {
        if (this._cache.delete(id.toString())) {
          deletedCount++;
        }
      });
      
      if (deletedCount > 0) {
        await this._persistCache();
      }
      
      return deletedCount;
    });
  }

  /**
   * Transaction support for multiple operations
   * @param {Function} operations - Function containing operations
   * @returns {Promise<any>} Result of operations
   */
  async transaction(operations) {
    return await this._withLock(async () => {
      // Create backup before transaction
      if (this.enableBackups) {
        await this._createBackup();
      }
      
      const originalCache = new Map(this._cache);
      
      try {
        const result = await operations(this);
        await this._persistCache();
        return result;
      } catch (error) {
        // Rollback cache on error
        this._cache = originalCache;
        throw error;
      }
    });
  }

  /**
   * Create backup of all character data
   * @returns {Promise<string>} Backup identifier
   */
  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `backup_${timestamp}`;
    
    const result = await this._createBackup(backupId);
    return result || backupId;
  }

  /**
   * Restore from backup
   * @param {string} backupId - Backup identifier
   * @returns {Promise<void>} Completion promise
   */
  async restoreFromBackup(backupId) {
    const backupFile = path.join(this.backupPath, `${backupId}.json`);
    
    try {
      const backupData = await fs.readFile(backupFile, 'utf8');
      await this._writeDataFile(JSON.parse(backupData));
      
      // Invalidate cache to force reload
      this._cache.clear();
      this._cacheValid = false;
      
    } catch (error) {
      throw new Error(`Failed to restore from backup ${backupId}: ${error.message}`);
    }
  }

  // Private helper methods

  /**
   * Ensure cache is loaded
   * @private
   */
  async _ensureCacheLoaded() {
    if (!this._cacheValid) {
      await this._loadCache();
    }
  }

  /**
   * Load data from file into cache
   * @private
   */
  async _loadCache() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      const parsed = JSON.parse(data);
      
      this._cache.clear();
      
      Object.values(parsed.characters || {}).forEach(characterData => {
        try {
          const character = this._deserializeCharacter(characterData);
          this._cache.set(character.id.toString(), character);
        } catch (error) {
          console.warn(`Failed to load character ${characterData.id}: ${error.message}`);
        }
      });
      
      this._cacheValid = true;
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, start with empty cache
        this._cache.clear();
        this._cacheValid = true;
      } else {
        throw new Error(`Failed to load character data: ${error.message}`);
      }
    }
  }

  /**
   * Persist cache to file
   * @private
   */
  async _persistCache() {
    const data = {
      characters: {},
      metadata: {
        lastUpdated: new Date().toISOString(),
        version: '2.0.0',
        totalCharacters: this._cache.size,
      },
    };
    
    this._cache.forEach((character, id) => {
      data.characters[id] = this._serializeCharacter(character);
    });
    
    await this._writeDataFile(data);
  }

  /**
   * Write data to file atomically
   * @private
   */
  async _writeDataFile(data) {
    // Use unique temp file to avoid concurrency issues
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const tempPath = `${this.dataPath}.tmp.${timestamp}.${random}`;
    
    try {
      await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
      await fs.rename(tempPath, this.dataPath);
    } catch (error) {
      // Cleanup temp file on error
      try {
        await fs.unlink(tempPath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  /**
   * Create backup file
   * @private
   */
  async _createBackup(backupId) {
    if (!this.enableBackups) return null;
    
    const timestamp = backupId || new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = backupId ? `${backupId}.json` : `backup_${timestamp}.json`;
    const backupFile = path.join(this.backupPath, fileName);
    
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      await fs.writeFile(backupFile, data, 'utf8');
      
      // Cleanup old backups
      await this._cleanupOldBackups();
      
      return fileName.replace('.json', '');
      
    } catch (error) {
      console.warn(`Failed to create backup: ${error.message}`);
      return null;
    }
  }

  /**
   * Cleanup old backup files
   * @private
   */
  async _cleanupOldBackups() {
    try {
      const files = await fs.readdir(this.backupPath);
      const backupFiles = files
        .filter(file => file.startsWith('backup_') && file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(this.backupPath, file),
        }));
      
      if (backupFiles.length > this.maxBackups) {
        // Sort by name (timestamp) and remove oldest
        backupFiles.sort((a, b) => a.name.localeCompare(b.name));
        const filesToDelete = backupFiles.slice(0, backupFiles.length - this.maxBackups);
        
        await Promise.all(
          filesToDelete.map(file => fs.unlink(file.path).catch(() => {}))
        );
      }
    } catch (error) {
      console.warn(`Failed to cleanup old backups: ${error.message}`);
    }
  }

  /**
   * File locking mechanism
   * @private
   */
  async _withLock(operation) {
    // Simplified locking mechanism for single-process usage
    // In production, consider using proper file locking libraries
    
    const maxWaitTime = 5000; // 5 seconds
    const checkInterval = 50; // 50ms
    let waitTime = 0;
    
    // Wait for lock to be available
    while (this._isLocked && waitTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waitTime += checkInterval;
    }
    
    if (this._isLocked) {
      throw new Error('Repository operation timeout - could not acquire lock');
    }
    
    // Acquire lock
    this._isLocked = true;
    
    try {
      const result = await operation();
      return result;
    } finally {
      // Release lock
      this._isLocked = false;
    }
  }

  /**
   * Serialize Character entity to JSON format
   * @private
   */
  _serializeCharacter(character) {
    return character.toLegacyFormat();
  }

  /**
   * Deserialize JSON data to Character entity
   * @private
   */
  _deserializeCharacter(data) {
    // Convert legacy format to new format if needed
    const characterData = {
      id: data.id,
      name: data.name,
      level: data.level,
      stats: {
        hp: data.hp,
        maxHP: data.max_hp || data.maxHP,
        attack: data.attack,
        defense: data.defense,
      },
      ai_type: data.ai_type,
      sprite: data.sprite || '',
      gold: data.gold || 0,
      experience: data.experience || 0,
      skill_points: data.skill_points || 0,
      classe: data.classe || 'Lutador',
      anima: data.anima || 100,
      critico: data.critico || 1.0,
      metadata: {
        createdAt: data.created_at || data.createdAt || new Date().toISOString(),
        updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
        version: data.version || '1.0.0',
        legacy: data.legacy === true,
      },
    };
    
    return Character.fromData(characterData);
  }

  /**
   * Get nested object value by key path
   * @private
   */
  _getNestedValue(obj, keyPath) {
    return keyPath.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Match string against pattern with wildcards
   * @private
   */
  _matchPattern(value, pattern) {
    if (typeof value !== 'string') return false;
    
    const regex = new RegExp(
      pattern.replace(/\*/g, '.*').replace(/\?/g, '.'),
      'i'
    );
    
    return regex.test(value);
  }
}