/**
 * JsonSkillRepository Implementation
 * 
 * Concrete implementation of SkillRepository interface that persists
 * skill data in JSON format. Provides full CRUD operations with
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
import { SkillRepository } from '../../domain/repositories/SkillRepository.js';
import { Skill } from '../../domain/entities/Skill.js';
import { SkillId } from '../../domain/value-objects/SkillId.js';

export class JsonSkillRepository extends SkillRepository {
  constructor(config = {}) {
    super();
    
    this.dataPath = config.dataPath || path.join(process.cwd(), 'data', 'skills.json');
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
        await this._writeDataFile({ skills: {} });
      }
      
      // Load initial cache
      await this._loadCache();
      
    } catch (error) {
      throw new Error(`Failed to initialize JsonSkillRepository: ${error.message}`);
    }
  }

  /**
   * Find skill by ID
   * @param {SkillId} id - Skill ID to find
   * @returns {Promise<Skill|null>} Skill or null if not found
   */
  async findById(id) {
    if (!(id instanceof SkillId)) {
      throw new Error('ID must be a SkillId instance');
    }
    
    await this._ensureCacheLoaded();
    const skill = this._cache.get(id.toString());
    return skill || null;
  }

  /**
   * Find all skills
   * @returns {Promise<Skill[]>} Array of all skills
   */
  async findAll() {
    await this._ensureCacheLoaded();
    return Array.from(this._cache.values());
  }

  /**
   * Find skills matching criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Skill[]>} Matching skills
   */
  async findByCriteria(criteria) {
    const skills = await this.findAll();
    
    return skills.filter(skill => {
      // Type filter
      if (criteria.type && skill.type !== criteria.type) return false;
      
      // Classe filter
      if (criteria.classe && skill.classe !== criteria.classe) return false;
      
      // Level range filter
      if (criteria.minLevel && skill.level < criteria.minLevel) return false;
      if (criteria.maxLevel && skill.level > criteria.maxLevel) return false;
      
      // Damage range filter
      if (criteria.minDamage && skill.damage < criteria.minDamage) return false;
      if (criteria.maxDamage && skill.damage > criteria.maxDamage) return false;
      
      // Custo de Ânima range filter
      if (criteria.minAnimaCost && skill.anima_cost < criteria.minAnimaCost) return false;
      if (criteria.maxAnimaCost && skill.anima_cost > criteria.maxAnimaCost) return false;
      
      // Prerequisites filter
      if (criteria.hasPrerequisites !== undefined) {
        if (criteria.hasPrerequisites && skill.prerequisites.length === 0) return false;
        if (!criteria.hasPrerequisites && skill.prerequisites.length > 0) return false;
      }
      
      return true;
    });
  }

  /**
   * Save skill (create or update)
   * @param {Skill} skill - Skill to save
   * @returns {Promise<Skill>} Saved skill
   */
  async save(skill) {
    if (!(skill instanceof Skill)) {
      throw new Error('Entity must be a Skill instance');
    }
    
    await this._acquireLock();
    
    try {
      // Create backup before making changes
      if (this.enableBackups) {
        await this.createBackup();
      }
      
      // Update cache
      this._cache.set(skill.id.toString(), skill);
      
      // Persist to file
      const data = await this._readDataFile();
      data.skills[skill.id.toString()] = skill.toJSON();
      await this._writeDataFile(data);
      
      return skill;
    } finally {
      await this._releaseLock();
    }
  }

  /**
   * Delete skill by ID
   * @param {SkillId} id - Skill ID to delete
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    if (!(id instanceof SkillId)) {
      throw new Error('ID must be a SkillId instance');
    }
    
    await this._acquireLock();
    
    try {
      const skillExists = this._cache.has(id.toString());
      if (!skillExists) return false;
      
      // Create backup before making changes
      if (this.enableBackups) {
        await this.createBackup();
      }
      
      // Update cache
      this._cache.delete(id.toString());
      
      // Persist to file
      const data = await this._readDataFile();
      delete data.skills[id.toString()];
      await this._writeDataFile(data);
      
      return true;
    } finally {
      await this._releaseLock();
    }
  }

  /**
   * Check if skill exists by ID
   * @param {SkillId} id - Skill ID to check
   * @returns {Promise<boolean>} True if exists
   */
  async exists(id) {
    if (!(id instanceof SkillId)) {
      throw new Error('ID must be a SkillId instance');
    }
    
    await this._ensureCacheLoaded();
    return this._cache.has(id.toString());
  }

  /**
   * Count total skills
   * @returns {Promise<number>} Total skill count
   */
  async count() {
    await this._ensureCacheLoaded();
    return this._cache.size;
  }

  /**
   * Find skills by type
   * @param {string} type - Skill type to search for
   * @returns {Promise<Skill[]>} Skills with specified type
   */
  async findByType(type) {
    const skills = await this.findAll();
    return skills.filter(skill => skill.type === type);
  }

  /**
   * Find skills by classe
   * @param {string} classe - Classe to search for
   * @returns {Promise<Skill[]>} Skills with specified classe
   */
  async findByClasse(classe) {
    const skills = await this.findAll();
    return skills.filter(skill => skill.classe === classe);
  }

  /**
   * Find skills by level range
   * @param {number} minLevel - Minimum level
   * @param {number} maxLevel - Maximum level
   * @returns {Promise<Skill[]>} Skills in level range
   */
  async findByLevelRange(minLevel, maxLevel) {
    const skills = await this.findAll();
    return skills.filter(skill => 
      skill.level >= minLevel && skill.level <= maxLevel
    );
  }

  /**
   * Find skills by damage range
   * @param {number} minDamage - Minimum damage
   * @param {number} maxDamage - Maximum damage
   * @returns {Promise<Skill[]>} Skills in damage range
   */
  async findByDamageRange(minDamage, maxDamage) {
    const skills = await this.findAll();
    return skills.filter(skill => 
      skill.damage >= minDamage && skill.damage <= maxDamage
    );
  }

  /**
   * Find skills by custo de ânima range
   * @param {number} minCost - Minimum custo de ânima
   * @param {number} maxCost - Maximum custo de ânima
   * @returns {Promise<Skill[]>} Skills in custo de ânima range
   */
  async findByAnimaCostRange(minCost, maxCost) {
    const skills = await this.findAll();
    return skills.filter(skill => 
      skill.anima_cost >= minCost && skill.anima_cost <= maxCost
    );
  }

  /**
   * Find skills by name (partial match, case insensitive)
   * @param {string} namePattern - Name pattern to search
   * @returns {Promise<Skill[]>} Skills matching name pattern
   */
  async findByName(namePattern) {
    const skills = await this.findAll();
    const pattern = namePattern.toLowerCase();
    return skills.filter(skill => 
      skill.name.toLowerCase().includes(pattern)
    );
  }

  /**
   * Find passive skills
   * @returns {Promise<Skill[]>} All passive skills
   */
  async findPassiveSkills() {
    return await this.findByType('passive');
  }

  /**
   * Find combat skills (combat and magic types)
   * @returns {Promise<Skill[]>} All combat skills
   */
  async findCombatSkills() {
    const skills = await this.findAll();
    return skills.filter(skill => 
      skill.type === 'combat' || skill.type === 'magic'
    );
  }

  /**
   * Find skills with prerequisites
   * @returns {Promise<Skill[]>} Skills that have prerequisites
   */
  async findSkillsWithPrerequisites() {
    const skills = await this.findAll();
    return skills.filter(skill => skill.prerequisites.length > 0);
  }

  /**
   * Find skills without prerequisites (learnable by default)
   * @returns {Promise<Skill[]>} Skills without prerequisites
   */
  async findBasicSkills() {
    const skills = await this.findAll();
    return skills.filter(skill => skill.prerequisites.length === 0);
  }

  /**
   * Get repository statistics
   * @returns {Promise<Object>} Repository statistics
   */
  async getStatistics() {
    const skills = await this.findAll();
    
    const stats = {
      total: skills.length,
      byType: {},
      byClasse: {},
      byLevel: {},
      averageStats: {
        damage: 0,
        manaCost: 0,
        cooldown: 0,
      },
    };
    
    let totalDamage = 0;
    let totalAnimaCost = 0;
    let totalCooldown = 0;
    
    skills.forEach(skill => {
      // Type distribution
      stats.byType[skill.type] = (stats.byType[skill.type] || 0) + 1;
      
      // Classe distribution
      stats.byClasse[skill.classe] = (stats.byClasse[skill.classe] || 0) + 1;
      
      // Level distribution
      stats.byLevel[skill.level] = (stats.byLevel[skill.level] || 0) + 1;
      
      // Average calculations
      totalDamage += skill.calculateAverageDamage();
      totalAnimaCost += skill.anima_cost;
      totalCooldown += skill.cooldown;
    });
    
    if (skills.length > 0) {
      stats.averageStats.damage = totalDamage / skills.length;
      stats.averageStats.manaCost = totalAnimaCost / skills.length;
      stats.averageStats.cooldown = totalCooldown / skills.length;
    }
    
    return stats;
  }

  /**
   * Bulk save operation
   * @param {Skill[]} skills - Skills to save
   * @returns {Promise<Skill[]>} Saved skills
   */
  async bulkSave(skills) {
    if (!Array.isArray(skills) || skills.length === 0) {
      throw new Error('Skills must be a non-empty array');
    }
    
    for (const skill of skills) {
      if (!(skill instanceof Skill)) {
        throw new Error('All entities must be Skill instances');
      }
    }
    
    await this._acquireLock();
    
    try {
      // Create backup before making changes
      if (this.enableBackups) {
        await this.createBackup();
      }
      
      // Update cache
      skills.forEach(skill => {
        this._cache.set(skill.id.toString(), skill);
      });
      
      // Persist to file
      const data = await this._readDataFile();
      skills.forEach(skill => {
        data.skills[skill.id.toString()] = skill.toJSON();
      });
      await this._writeDataFile(data);
      
      return skills;
    } finally {
      await this._releaseLock();
    }
  }

  /**
   * Bulk delete operation
   * @param {SkillId[]} ids - Skill IDs to delete
   * @returns {Promise<number>} Number of deleted skills
   */
  async bulkDelete(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('IDs must be a non-empty array');
    }
    
    for (const id of ids) {
      if (!(id instanceof SkillId)) {
        throw new Error('All IDs must be SkillId instances');
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
        delete data.skills[id.toString()];
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
   * Create backup of all skill data
   * @returns {Promise<string>} Backup identifier or path
   */
  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `skills_backup_${timestamp}.json`;
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
      if (!data.skills || typeof data.skills !== 'object') {
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
      
      for (const [id, skillData] of Object.entries(data.skills)) {
        try {
          const skill = new Skill({
            ...skillData,
            id: new SkillId(skillData.id),
            classe: skillData.classe || skillData.element || 'Lutador',
            created_at: new Date(skillData.created_at),
            updated_at: new Date(skillData.updated_at),
          });
          this._cache.set(id, skill);
        } catch (error) {
          console.error(`Failed to load skill ${id}:`, error.message);
          // Continue loading other skills despite individual failures
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
        return { skills: {} };
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
      const skillBackups = files
        .filter(file => file.startsWith('skills_backup_') && file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(this.backupPath, file),
          stat: null
        }));
      
      // Get file stats for sorting by creation time
      for (const backup of skillBackups) {
        backup.stat = await fs.stat(backup.path);
      }
      
      // Sort by creation time (newest first)
      skillBackups.sort((a, b) => b.stat.mtime - a.stat.mtime);
      
      // Remove old backups
      if (skillBackups.length > this.maxBackups) {
        const toDelete = skillBackups.slice(this.maxBackups);
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