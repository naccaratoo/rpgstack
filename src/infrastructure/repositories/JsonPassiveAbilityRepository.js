/**
 * JsonPassiveAbilityRepository Implementation
 * 
 * Concrete implementation of PassiveAbilityRepository interface that persists
 * passive ability data in JSON format. Provides full CRUD operations with
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
import { PassiveAbilityRepository } from '../../domain/repositories/PassiveAbilityRepository.js';
import { PassiveAbility } from '../../domain/entities/PassiveAbility.js';
import { PassiveAbilityId } from '../../domain/value-objects/PassiveAbilityId.js';

export class JsonPassiveAbilityRepository extends PassiveAbilityRepository {
  constructor(config = {}) {
    super();
    
    this.dataPath = config.dataPath || path.join(process.cwd(), 'data', 'passive-abilities.json');
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
        await this._writeDataFile({ passiveAbilities: {} });
      }
      
      // Load initial cache
      await this._loadCache();
      
    } catch (error) {
      throw new Error(`Failed to initialize JsonPassiveAbilityRepository: ${error.message}`);
    }
  }

  /**
   * Find passive ability by ID
   * @param {PassiveAbilityId} id - PassiveAbility ID to find
   * @returns {Promise<PassiveAbility|null>} PassiveAbility or null if not found
   */
  async findById(id) {
    if (!(id instanceof PassiveAbilityId)) {
      throw new Error('ID must be a PassiveAbilityId instance');
    }
    
    await this._ensureCacheLoaded();
    const passiveAbility = this._cache.get(id.toString());
    return passiveAbility || null;
  }

  /**
   * Find all passive abilities
   * @returns {Promise<PassiveAbility[]>} Array of all passive abilities
   */
  async findAll() {
    await this._ensureCacheLoaded();
    return Array.from(this._cache.values());
  }

  /**
   * Find passive abilities matching criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<PassiveAbility[]>} Matching passive abilities
   */
  async findByCriteria(criteria) {
    const passiveAbilities = await this.findAll();
    
    return passiveAbilities.filter(passiveAbility => {
      // Culture filter
      if (criteria.culture && passiveAbility.culture !== criteria.culture) return false;
      
      // Trigger filter
      if (criteria.trigger && passiveAbility.trigger !== criteria.trigger) return false;
      
      // Effect type filter
      if (criteria.effectType && passiveAbility.effect.type !== criteria.effectType) return false;
      
      // Rarity filter
      if (criteria.rarity && passiveAbility.rarity !== criteria.rarity) return false;
      
      // Always active filter
      if (criteria.alwaysActive !== undefined) {
        if (criteria.alwaysActive && !passiveAbility.isAlwaysActive()) return false;
        if (!criteria.alwaysActive && passiveAbility.isAlwaysActive()) return false;
      }
      
      // Battle triggered filter
      if (criteria.battleTriggered !== undefined) {
        if (criteria.battleTriggered && !passiveAbility.isBattleTriggered()) return false;
        if (!criteria.battleTriggered && passiveAbility.isBattleTriggered()) return false;
      }
      
      return true;
    });
  }

  /**
   * Save passive ability (create or update)
   * @param {PassiveAbility} passiveAbility - PassiveAbility to save
   * @returns {Promise<PassiveAbility>} Saved passive ability
   */
  async save(passiveAbility) {
    if (!(passiveAbility instanceof PassiveAbility)) {
      throw new Error('Entity must be a PassiveAbility instance');
    }
    
    await this._acquireLock();
    
    try {
      // Create backup before making changes
      if (this.enableBackups) {
        await this.createBackup();
      }
      
      // Update cache
      this._cache.set(passiveAbility.id.toString(), passiveAbility);
      
      // Persist to file
      const data = await this._readDataFile();
      data.passiveAbilities[passiveAbility.id.toString()] = passiveAbility.toJSON();
      await this._writeDataFile(data);
      
      return passiveAbility;
    } finally {
      await this._releaseLock();
    }
  }

  /**
   * Delete passive ability by ID
   * @param {PassiveAbilityId} id - PassiveAbility ID to delete
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    if (!(id instanceof PassiveAbilityId)) {
      throw new Error('ID must be a PassiveAbilityId instance');
    }
    
    await this._acquireLock();
    
    try {
      const passiveAbilityExists = this._cache.has(id.toString());
      if (!passiveAbilityExists) return false;
      
      // Create backup before making changes
      if (this.enableBackups) {
        await this.createBackup();
      }
      
      // Update cache
      this._cache.delete(id.toString());
      
      // Persist to file
      const data = await this._readDataFile();
      delete data.passiveAbilities[id.toString()];
      await this._writeDataFile(data);
      
      return true;
    } finally {
      await this._releaseLock();
    }
  }

  /**
   * Check if passive ability exists by ID
   * @param {PassiveAbilityId} id - PassiveAbility ID to check
   * @returns {Promise<boolean>} True if exists
   */
  async exists(id) {
    if (!(id instanceof PassiveAbilityId)) {
      throw new Error('ID must be a PassiveAbilityId instance');
    }
    
    await this._ensureCacheLoaded();
    return this._cache.has(id.toString());
  }

  /**
   * Count total passive abilities
   * @returns {Promise<number>} Total passive ability count
   */
  async count() {
    await this._ensureCacheLoaded();
    return this._cache.size;
  }

  /**
   * Find passive abilities by culture
   * @param {string} culture - Culture to search for
   * @returns {Promise<PassiveAbility[]>} PassiveAbilities with specified culture
   */
  async findByCulture(culture) {
    const passiveAbilities = await this.findAll();
    return passiveAbilities.filter(passiveAbility => passiveAbility.culture === culture);
  }

  /**
   * Find passive abilities by trigger
   * @param {string} trigger - Trigger to search for
   * @returns {Promise<PassiveAbility[]>} PassiveAbilities with specified trigger
   */
  async findByTrigger(trigger) {
    const passiveAbilities = await this.findAll();
    return passiveAbilities.filter(passiveAbility => passiveAbility.trigger === trigger);
  }

  /**
   * Find passive abilities by effect type
   * @param {string} effectType - Effect type to search for
   * @returns {Promise<PassiveAbility[]>} PassiveAbilities with specified effect type
   */
  async findByEffectType(effectType) {
    const passiveAbilities = await this.findAll();
    return passiveAbilities.filter(passiveAbility => passiveAbility.effect.type === effectType);
  }

  /**
   * Find passive abilities by rarity
   * @param {string} rarity - Rarity to search for
   * @returns {Promise<PassiveAbility[]>} PassiveAbilities with specified rarity
   */
  async findByRarity(rarity) {
    const passiveAbilities = await this.findAll();
    return passiveAbilities.filter(passiveAbility => passiveAbility.rarity === rarity);
  }

  /**
   * Find passive abilities by name (partial match, case insensitive)
   * @param {string} namePattern - Name pattern to search
   * @returns {Promise<PassiveAbility[]>} PassiveAbilities matching name pattern
   */
  async findByName(namePattern) {
    const passiveAbilities = await this.findAll();
    const pattern = namePattern.toLowerCase();
    return passiveAbilities.filter(passiveAbility => 
      passiveAbility.name.toLowerCase().includes(pattern)
    );
  }

  /**
   * Find always active passive abilities
   * @returns {Promise<PassiveAbility[]>} All always active passive abilities
   */
  async findAlwaysActive() {
    const passiveAbilities = await this.findAll();
    return passiveAbilities.filter(passiveAbility => passiveAbility.isAlwaysActive());
  }

  /**
   * Find battle-triggered passive abilities
   * @returns {Promise<PassiveAbility[]>} All battle-triggered passive abilities
   */
  async findBattleTriggered() {
    const passiveAbilities = await this.findAll();
    return passiveAbilities.filter(passiveAbility => passiveAbility.isBattleTriggered());
  }

  /**
   * Find passive abilities by multiple cultures
   * @param {string[]} cultures - Array of cultures to search for
   * @returns {Promise<PassiveAbility[]>} PassiveAbilities from specified cultures
   */
  async findByCultures(cultures) {
    const passiveAbilities = await this.findAll();
    return passiveAbilities.filter(passiveAbility => cultures.includes(passiveAbility.culture));
  }

  /**
   * Get repository statistics
   * @returns {Promise<Object>} Repository statistics
   */
  async getStatistics() {
    const passiveAbilities = await this.findAll();
    
    const stats = {
      total: passiveAbilities.length,
      byCulture: {},
      byTrigger: {},
      byEffectType: {},
      byRarity: {},
      alwaysActive: 0,
      battleTriggered: 0,
    };
    
    passiveAbilities.forEach(passiveAbility => {
      // Culture distribution
      stats.byCulture[passiveAbility.culture] = (stats.byCulture[passiveAbility.culture] || 0) + 1;
      
      // Trigger distribution
      stats.byTrigger[passiveAbility.trigger] = (stats.byTrigger[passiveAbility.trigger] || 0) + 1;
      
      // Effect type distribution
      stats.byEffectType[passiveAbility.effect.type] = (stats.byEffectType[passiveAbility.effect.type] || 0) + 1;
      
      // Rarity distribution
      stats.byRarity[passiveAbility.rarity] = (stats.byRarity[passiveAbility.rarity] || 0) + 1;
      
      // Special counts
      if (passiveAbility.isAlwaysActive()) stats.alwaysActive++;
      if (passiveAbility.isBattleTriggered()) stats.battleTriggered++;
    });
    
    return stats;
  }

  /**
   * Bulk save operation
   * @param {PassiveAbility[]} passiveAbilities - PassiveAbilities to save
   * @returns {Promise<PassiveAbility[]>} Saved passive abilities
   */
  async bulkSave(passiveAbilities) {
    if (!Array.isArray(passiveAbilities) || passiveAbilities.length === 0) {
      throw new Error('PassiveAbilities must be a non-empty array');
    }
    
    for (const passiveAbility of passiveAbilities) {
      if (!(passiveAbility instanceof PassiveAbility)) {
        throw new Error('All entities must be PassiveAbility instances');
      }
    }
    
    await this._acquireLock();
    
    try {
      // Create backup before making changes
      if (this.enableBackups) {
        await this.createBackup();
      }
      
      // Update cache
      passiveAbilities.forEach(passiveAbility => {
        this._cache.set(passiveAbility.id.toString(), passiveAbility);
      });
      
      // Persist to file
      const data = await this._readDataFile();
      passiveAbilities.forEach(passiveAbility => {
        data.passiveAbilities[passiveAbility.id.toString()] = passiveAbility.toJSON();
      });
      await this._writeDataFile(data);
      
      return passiveAbilities;
    } finally {
      await this._releaseLock();
    }
  }

  /**
   * Bulk delete operation
   * @param {PassiveAbilityId[]} ids - PassiveAbility IDs to delete
   * @returns {Promise<number>} Number of deleted passive abilities
   */
  async bulkDelete(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('IDs must be a non-empty array');
    }
    
    for (const id of ids) {
      if (!(id instanceof PassiveAbilityId)) {
        throw new Error('All IDs must be PassiveAbilityId instances');
      }
    }
    
    await this._acquireLock();
    
    try {
      // Create backup before making changes
      if (this.enableBackups) {
        await this.createBackup();
      }
      
      let deletedCount = 0;
      
      // Update cache and count deletions
      ids.forEach(id => {
        const idString = id.toString();
        if (this._cache.has(idString)) {
          this._cache.delete(idString);
          deletedCount++;
        }
      });
      
      // Persist to file
      const data = await this._readDataFile();
      ids.forEach(id => {
        delete data.passiveAbilities[id.toString()];
      });
      await this._writeDataFile(data);
      
      return deletedCount;
    } finally {
      await this._releaseLock();
    }
  }

  /**
   * Transaction support for multiple operations
   * @param {Function} operations - Function containing operations
   * @returns {Promise<any>} Result of operations
   */
  async transaction(operations) {
    await this._acquireLock();
    
    try {
      // Create backup before transaction
      if (this.enableBackups) {
        await this.createBackup();
      }
      
      // Execute operations
      return await operations();
    } finally {
      await this._releaseLock();
    }
  }

  /**
   * Create backup of all passive ability data
   * @returns {Promise<string>} Backup identifier or path
   */
  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `passive_abilities_backup_${timestamp}.json`;
      const backupFullPath = path.join(this.backupPath, backupFilename);
      
      const data = await this._readDataFile();
      await fs.writeFile(backupFullPath, JSON.stringify(data, null, 2));
      
      // Clean up old backups
      await this._cleanupOldBackups();
      
      return backupFullPath;
    } catch (error) {
      throw new Error(`Failed to create backup: ${error.message}`);
    }
  }

  /**
   * Restore from backup
   * @param {string} backupId - Backup identifier
   * @returns {Promise<void>} Completion promise
   */
  async restoreFromBackup(backupId) {
    await this._acquireLock();
    
    try {
      const backupPath = path.isAbsolute(backupId) 
        ? backupId 
        : path.join(this.backupPath, backupId);
      
      const data = JSON.parse(await fs.readFile(backupPath, 'utf8'));
      
      // Validate backup data structure
      if (!data.passiveAbilities || typeof data.passiveAbilities !== 'object') {
        throw new Error('Invalid backup file format');
      }
      
      // Write restored data
      await this._writeDataFile(data);
      
      // Reload cache
      this._cacheValid = false;
      await this._loadCache();
      
    } catch (error) {
      throw new Error(`Failed to restore from backup: ${error.message}`);
    } finally {
      await this._releaseLock();
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  async _ensureCacheLoaded() {
    if (!this._cacheValid) {
      await this._loadCache();
    }
  }

  async _loadCache() {
    try {
      const data = await this._readDataFile();
      this._cache.clear();
      
      for (const [id, passiveAbilityData] of Object.entries(data.passiveAbilities)) {
        try {
          const passiveAbility = new PassiveAbility({
            ...passiveAbilityData,
            id: new PassiveAbilityId(passiveAbilityData.id),
            created_at: new Date(passiveAbilityData.created_at),
            updated_at: new Date(passiveAbilityData.updated_at),
          });
          this._cache.set(id, passiveAbility);
        } catch (error) {
          console.error(`Failed to load passive ability ${id}:`, error.message);
          // Continue loading other passive abilities despite individual failures
        }
      }
      
      this._cacheValid = true;
    } catch (error) {
      throw new Error(`Failed to load cache: ${error.message}`);
    }
  }

  async _readDataFile() {
    try {
      const fileContent = await fs.readFile(this.dataPath, 'utf8');
      return JSON.parse(fileContent);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, return empty structure
        return { passiveAbilities: {} };
      }
      throw error;
    }
  }

  async _writeDataFile(data) {
    const tempPath = `${this.dataPath}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
    await fs.rename(tempPath, this.dataPath);
  }

  async _acquireLock() {
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
      try {
        await fs.writeFile(this._lockFile, process.pid.toString(), { flag: 'wx' });
        this._isLocked = true;
        return;
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        
        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
    }
    
    throw new Error('Could not acquire file lock after maximum attempts');
  }

  async _releaseLock() {
    if (this._isLocked) {
      try {
        await fs.unlink(this._lockFile);
        this._isLocked = false;
      } catch (error) {
        // Lock file might already be removed, ignore error
      }
    }
  }

  async _cleanupOldBackups() {
    try {
      const files = await fs.readdir(this.backupPath);
      const passiveAbilityBackups = files
        .filter(file => file.startsWith('passive_abilities_backup_') && file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(this.backupPath, file),
          stat: null
        }));
      
      // Get file stats for sorting by creation time
      for (const backup of passiveAbilityBackups) {
        backup.stat = await fs.stat(backup.path);
      }
      
      // Sort by creation time (newest first)
      passiveAbilityBackups.sort((a, b) => b.stat.mtime - a.stat.mtime);
      
      // Remove old backups
      if (passiveAbilityBackups.length > this.maxBackups) {
        const toDelete = passiveAbilityBackups.slice(this.maxBackups);
        for (const backup of toDelete) {
          await fs.unlink(backup.path);
        }
      }
    } catch (error) {
      // Don't fail the operation if cleanup fails
      console.warn('Failed to cleanup old backups:', error.message);
    }
  }
}