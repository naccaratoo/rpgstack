/**
 * PassiveAbility Application Service
 * 
 * Orchestrates passive ability-related use cases by coordinating domain entities,
 * domain services, and infrastructure concerns. This service layer acts as
 * the facade for the application's passive ability operations while maintaining
 * clean architecture principles.
 * 
 * Features:
 * - Complete CRUD operations with business logic validation
 * - PassiveAbility filtering and search capabilities
 * - Cultural authenticity validation
 * - Bulk operations with transaction support
 * - Advanced search and filtering capabilities
 * - Error handling and input validation
 */

import { PassiveAbility } from '../../domain/entities/PassiveAbility.js';
import { PassiveAbilityId } from '../../domain/value-objects/PassiveAbilityId.js';
import { ApplicationError, ValidationError, NotFoundError, BusinessRuleError } from '../errors/ApplicationErrors.js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export class PassiveAbilityService {
  /**
   * Create PassiveAbilityService instance
   * @param {PassiveAbilityRepository} passiveAbilityRepository - Repository for passive ability persistence
   * @param {Object} logger - Logging service
   */
  constructor(passiveAbilityRepository, logger = console) {
    this.passiveAbilityRepository = passiveAbilityRepository;
    this.logger = logger;
    
    // Performance tracking
    this.performanceMetrics = {
      operationsCount: 0,
      lastOperationTime: null,
      averageResponseTime: 0,
    };
  }

  // ===== PASSIVE ABILITY CRUD OPERATIONS =====

  /**
   * Create a new passive ability with business validation
   * @param {Object} passiveAbilityData - PassiveAbility creation data
   * @param {Object} options - Creation options
   * @returns {Promise<Object>} Created passive ability with metadata
   */
  async createPassiveAbility(passiveAbilityData, options = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Creating new passive ability', { name: passiveAbilityData.name, culture: passiveAbilityData.culture });
      
      // Input validation and sanitization
      const sanitizedData = await this._validateAndSanitizeCreateData(passiveAbilityData);
      
      // Create passive ability entity with domain validation
      const passiveAbility = PassiveAbility.create(sanitizedData);

      // Validate passive ability meets business rules
      await this._validatePassiveAbilityBusinessRules(passiveAbility);

      // Persist passive ability
      const savedPassiveAbility = await this.passiveAbilityRepository.save(passiveAbility);
      
      // Update performance metrics
      this._updatePerformanceMetrics(startTime);
      
      this.logger.info('PassiveAbility created successfully', { 
        id: savedPassiveAbility.id.toString(),
        name: savedPassiveAbility.name,
        culture: savedPassiveAbility.culture
      });

      return {
        passiveAbility: savedPassiveAbility,
        metadata: {
          operation: 'create',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          validation: 'passed',
        },
      };
    } catch (error) {
      this._updatePerformanceMetrics(startTime);
      this.logger.error('PassiveAbility creation failed', { error: error.message, passiveAbilityData });
      throw this._handleServiceError(error, 'createPassiveAbility');
    }
  }

  /**
   * Get passive ability by ID with enhanced error handling
   * @param {string|PassiveAbilityId} passiveAbilityId - PassiveAbility ID
   * @param {Object} options - Retrieval options
   * @returns {Promise<Object>} PassiveAbility with metadata
   */
  async getPassiveAbility(passiveAbilityId, options = {}) {
    const startTime = Date.now();
    
    try {
      const id = passiveAbilityId instanceof PassiveAbilityId ? passiveAbilityId : new PassiveAbilityId(passiveAbilityId);
      
      this.logger.info('Retrieving passive ability', { id: id.toString() });
      
      const passiveAbility = await this.passiveAbilityRepository.findById(id);
      
      if (!passiveAbility) {
        throw new NotFoundError(`PassiveAbility with ID ${id.toString()} not found`);
      }
      
      this._updatePerformanceMetrics(startTime);
      
      return {
        passiveAbility,
        metadata: {
          operation: 'get',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      this._updatePerformanceMetrics(startTime);
      this.logger.error('PassiveAbility retrieval failed', { error: error.message, passiveAbilityId });
      throw this._handleServiceError(error, 'getPassiveAbility');
    }
  }

  /**
   * Update existing passive ability with validation
   * @param {string|PassiveAbilityId} passiveAbilityId - PassiveAbility ID
   * @param {Object} updateData - Update data
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated passive ability with metadata
   */
  async updatePassiveAbility(passiveAbilityId, updateData, options = {}) {
    const startTime = Date.now();
    
    try {
      const id = passiveAbilityId instanceof PassiveAbilityId ? passiveAbilityId : new PassiveAbilityId(passiveAbilityId);
      
      this.logger.info('Updating passive ability', { id: id.toString(), updates: Object.keys(updateData) });
      
      // Get existing passive ability
      const existingPassiveAbility = await this.passiveAbilityRepository.findById(id);
      if (!existingPassiveAbility) {
        throw new NotFoundError(`PassiveAbility with ID ${id.toString()} not found`);
      }
      
      // Validate and sanitize update data
      const sanitizedData = await this._validateAndSanitizeUpdateData(updateData, existingPassiveAbility);
      
      // Create updated passive ability entity
      const updatedPassiveAbility = new PassiveAbility({
        id: existingPassiveAbility.id,
        name: sanitizedData.name ?? existingPassiveAbility.name,
        description: sanitizedData.description ?? existingPassiveAbility.description,
        culture: sanitizedData.culture ?? existingPassiveAbility.culture,
        trigger: sanitizedData.trigger ?? existingPassiveAbility.trigger,
        effect: sanitizedData.effect ?? existingPassiveAbility.effect,
        cultural_lore: sanitizedData.cultural_lore ?? existingPassiveAbility.cultural_lore,
        icon: sanitizedData.icon ?? existingPassiveAbility.icon,
        rarity: sanitizedData.rarity ?? existingPassiveAbility.rarity,
        metadata: { ...existingPassiveAbility.metadata, ...sanitizedData.metadata },
        created_at: existingPassiveAbility.created_at,
        updated_at: new Date()
      });
      
      // Validate updated passive ability meets business rules
      await this._validatePassiveAbilityBusinessRules(updatedPassiveAbility);
      
      // Persist changes
      const savedPassiveAbility = await this.passiveAbilityRepository.save(updatedPassiveAbility);
      
      this._updatePerformanceMetrics(startTime);
      
      this.logger.info('PassiveAbility updated successfully', { 
        id: savedPassiveAbility.id.toString(),
        name: savedPassiveAbility.name 
      });

      return {
        passiveAbility: savedPassiveAbility,
        metadata: {
          operation: 'update',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          validation: 'passed',
        },
      };
    } catch (error) {
      this._updatePerformanceMetrics(startTime);
      this.logger.error('PassiveAbility update failed', { error: error.message, passiveAbilityId, updateData });
      throw this._handleServiceError(error, 'updatePassiveAbility');
    }
  }

  /**
   * Delete passive ability by ID with cascade validation
   * @param {string|PassiveAbilityId} passiveAbilityId - PassiveAbility ID
   * @param {Object} options - Delete options
   * @returns {Promise<Object>} Deletion result with metadata
   */
  async deletePassiveAbility(passiveAbilityId, options = {}) {
    const startTime = Date.now();
    
    try {
      const id = passiveAbilityId instanceof PassiveAbilityId ? passiveAbilityId : new PassiveAbilityId(passiveAbilityId);
      
      this.logger.info('Deleting passive ability', { id: id.toString() });
      
      // Check if passive ability exists
      const existingPassiveAbility = await this.passiveAbilityRepository.findById(id);
      if (!existingPassiveAbility) {
        throw new NotFoundError(`PassiveAbility with ID ${id.toString()} not found`);
      }
      
      // Perform deletion
      const deleted = await this.passiveAbilityRepository.delete(id);
      
      this._updatePerformanceMetrics(startTime);
      
      this.logger.info('PassiveAbility deleted successfully', { 
        id: id.toString(),
        name: existingPassiveAbility.name 
      });

      return {
        deleted,
        passiveAbility: existingPassiveAbility,
        metadata: {
          operation: 'delete',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      this._updatePerformanceMetrics(startTime);
      this.logger.error('PassiveAbility deletion failed', { error: error.message, passiveAbilityId });
      throw this._handleServiceError(error, 'deletePassiveAbility');
    }
  }

  // ===== PASSIVE ABILITY QUERY OPERATIONS =====

  /**
   * Get all passive abilities with optional filtering
   * @param {Object} filters - Filtering options
   * @param {Object} options - Query options
   * @returns {Promise<Object>} PassiveAbilities list with metadata
   */
  async getAllPassiveAbilities(filters = {}, options = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Retrieving all passive abilities', { filters });
      
      let passiveAbilities;
      if (Object.keys(filters).length === 0) {
        passiveAbilities = await this.passiveAbilityRepository.findAll();
      } else {
        const sanitizedFilters = this._sanitizeFilters(filters);
        passiveAbilities = await this.passiveAbilityRepository.findByCriteria(sanitizedFilters);
      }
      
      // Apply sorting if requested
      if (options.sortBy) {
        passiveAbilities = this._sortPassiveAbilities(passiveAbilities, options.sortBy, options.sortOrder || 'asc');
      }
      
      // Apply pagination if requested
      if (options.page && options.limit) {
        const paginatedResult = this._paginateResults(passiveAbilities, options.page, options.limit);
        passiveAbilities = paginatedResult.data;
      }
      
      this._updatePerformanceMetrics(startTime);
      
      return {
        passiveAbilities,
        metadata: {
          operation: 'getAll',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          totalCount: passiveAbilities.length,
          filters: filters,
        },
      };
    } catch (error) {
      this._updatePerformanceMetrics(startTime);
      this.logger.error('PassiveAbilities retrieval failed', { error: error.message, filters });
      throw this._handleServiceError(error, 'getAllPassiveAbilities');
    }
  }

  /**
   * Get passive abilities by culture
   * @param {string} culture - Culture to search for
   * @param {Object} options - Query options
   * @returns {Promise<Object>} PassiveAbilities of specified culture
   */
  async getPassiveAbilitiesByCulture(culture, options = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Getting passive abilities by culture', { culture });
      
      if (!PassiveAbility.VALID_CULTURES.includes(culture)) {
        throw new ValidationError(`Invalid culture: ${culture}`);
      }
      
      const passiveAbilities = await this.passiveAbilityRepository.findByCulture(culture);
      
      this._updatePerformanceMetrics(startTime);
      
      return {
        passiveAbilities,
        metadata: {
          operation: 'getByCulture',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          culture: culture,
          resultCount: passiveAbilities.length,
        },
      };
    } catch (error) {
      this._updatePerformanceMetrics(startTime);
      this.logger.error('PassiveAbilities by culture retrieval failed', { error: error.message, culture });
      throw this._handleServiceError(error, 'getPassiveAbilitiesByCulture');
    }
  }

  /**
   * Get passive abilities by trigger
   * @param {string} trigger - Trigger to search for
   * @param {Object} options - Query options
   * @returns {Promise<Object>} PassiveAbilities with specified trigger
   */
  async getPassiveAbilitiesByTrigger(trigger, options = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Getting passive abilities by trigger', { trigger });
      
      if (!PassiveAbility.VALID_TRIGGERS.includes(trigger)) {
        throw new ValidationError(`Invalid trigger: ${trigger}`);
      }
      
      const passiveAbilities = await this.passiveAbilityRepository.findByTrigger(trigger);
      
      this._updatePerformanceMetrics(startTime);
      
      return {
        passiveAbilities,
        metadata: {
          operation: 'getByTrigger',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          trigger: trigger,
          resultCount: passiveAbilities.length,
        },
      };
    } catch (error) {
      this._updatePerformanceMetrics(startTime);
      this.logger.error('PassiveAbilities by trigger retrieval failed', { error: error.message, trigger });
      throw this._handleServiceError(error, 'getPassiveAbilitiesByTrigger');
    }
  }

  /**
   * Search passive abilities by name pattern
   * @param {string} namePattern - Name pattern to search
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Matching passive abilities with metadata
   */
  async searchPassiveAbilitiesByName(namePattern, options = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Searching passive abilities by name', { namePattern });
      
      if (!namePattern || namePattern.trim().length < 2) {
        throw new ValidationError('Search pattern must be at least 2 characters long');
      }
      
      const passiveAbilities = await this.passiveAbilityRepository.findByName(namePattern.trim());
      
      this._updatePerformanceMetrics(startTime);
      
      return {
        passiveAbilities,
        metadata: {
          operation: 'searchByName',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          searchPattern: namePattern,
          resultCount: passiveAbilities.length,
        },
      };
    } catch (error) {
      this._updatePerformanceMetrics(startTime);
      this.logger.error('PassiveAbility name search failed', { error: error.message, namePattern });
      throw this._handleServiceError(error, 'searchPassiveAbilitiesByName');
    }
  }

  // ===== BUSINESS LOGIC METHODS =====

  /**
   * Get always active passive abilities
   * @returns {Promise<Object>} Always active passive abilities list
   */
  async getAlwaysActivePassiveAbilities() {
    const startTime = Date.now();
    
    try {
      this.logger.info('Getting always active passive abilities');
      
      const passiveAbilities = await this.passiveAbilityRepository.findAlwaysActive();
      
      this._updatePerformanceMetrics(startTime);
      
      return {
        passiveAbilities,
        metadata: {
          operation: 'getAlwaysActive',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          resultCount: passiveAbilities.length,
        },
      };
    } catch (error) {
      this._updatePerformanceMetrics(startTime);
      this.logger.error('Always active passive abilities retrieval failed', { error: error.message });
      throw this._handleServiceError(error, 'getAlwaysActivePassiveAbilities');
    }
  }

  /**
   * Get battle-triggered passive abilities
   * @returns {Promise<Object>} Battle-triggered passive abilities list
   */
  async getBattleTriggeredPassiveAbilities() {
    const startTime = Date.now();
    
    try {
      this.logger.info('Getting battle-triggered passive abilities');
      
      const passiveAbilities = await this.passiveAbilityRepository.findBattleTriggered();
      
      this._updatePerformanceMetrics(startTime);
      
      return {
        passiveAbilities,
        metadata: {
          operation: 'getBattleTriggered',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          resultCount: passiveAbilities.length,
        },
      };
    } catch (error) {
      this._updatePerformanceMetrics(startTime);
      this.logger.error('Battle-triggered passive abilities retrieval failed', { error: error.message });
      throw this._handleServiceError(error, 'getBattleTriggeredPassiveAbilities');
    }
  }

  // ===== BULK OPERATIONS =====

  /**
   * Create multiple passive abilities in batch
   * @param {Array} passiveAbilitiesData - Array of passive ability data
   * @param {Object} options - Bulk creation options
   * @returns {Promise<Object>} Bulk creation results
   */
  async createPassiveAbilitiesBatch(passiveAbilitiesData, options = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Creating passive abilities batch', { count: passiveAbilitiesData.length });
      
      if (!Array.isArray(passiveAbilitiesData) || passiveAbilitiesData.length === 0) {
        throw new ValidationError('PassiveAbilities data must be a non-empty array');
      }
      
      const results = {
        success: [],
        errors: [],
        created: [],
      };
      
      // Process each passive ability
      for (let i = 0; i < passiveAbilitiesData.length; i++) {
        try {
          const sanitizedData = await this._validateAndSanitizeCreateData(passiveAbilitiesData[i]);
          const passiveAbility = PassiveAbility.create(sanitizedData);
          await this._validatePassiveAbilityBusinessRules(passiveAbility);
          results.created.push(passiveAbility);
          results.success.push(i);
        } catch (error) {
          results.errors.push({
            index: i,
            error: error.message,
            data: passiveAbilitiesData[i],
          });
        }
      }
      
      // Bulk save successful passive abilities
      let savedPassiveAbilities = [];
      if (results.created.length > 0) {
        savedPassiveAbilities = await this.passiveAbilityRepository.bulkSave(results.created);
      }
      
      this._updatePerformanceMetrics(startTime);
      
      this.logger.info('PassiveAbilities batch creation completed', {
        successful: results.success.length,
        failed: results.errors.length,
        total: passiveAbilitiesData.length,
      });
      
      return {
        passiveAbilities: savedPassiveAbilities,
        results,
        metadata: {
          operation: 'createBatch',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          totalRequested: passiveAbilitiesData.length,
          successful: results.success.length,
          failed: results.errors.length,
        },
      };
    } catch (error) {
      this._updatePerformanceMetrics(startTime);
      this.logger.error('PassiveAbilities batch creation failed', { error: error.message });
      throw this._handleServiceError(error, 'createPassiveAbilitiesBatch');
    }
  }

  // ===== STATISTICS AND ANALYTICS =====

  /**
   * Get comprehensive passive ability statistics
   * @returns {Promise<Object>} PassiveAbilities statistics
   */
  async getPassiveAbilityStatistics() {
    const startTime = Date.now();
    
    try {
      this.logger.info('Generating passive ability statistics');
      
      const [
        totalCount,
        repositoryStats,
        alwaysActiveAbilities,
        battleTriggeredAbilities
      ] = await Promise.all([
        this.passiveAbilityRepository.count(),
        this.passiveAbilityRepository.getStatistics(),
        this.passiveAbilityRepository.findAlwaysActive(),
        this.passiveAbilityRepository.findBattleTriggered()
      ]);
      
      this._updatePerformanceMetrics(startTime);
      
      const stats = {
        total: totalCount,
        alwaysActive: alwaysActiveAbilities.length,
        battleTriggered: battleTriggeredAbilities.length,
        repository: repositoryStats,
        performance: { ...this.performanceMetrics },
        metadata: {
          operation: 'getStatistics',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        },
      };
      
      this.logger.info('PassiveAbility statistics generated', { totalPassiveAbilities: totalCount });
      
      return stats;
    } catch (error) {
      this._updatePerformanceMetrics(startTime);
      this.logger.error('PassiveAbility statistics generation failed', { error: error.message });
      throw this._handleServiceError(error, 'getPassiveAbilityStatistics');
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  async _validateAndSanitizeCreateData(passiveAbilityData) {
    if (!passiveAbilityData || typeof passiveAbilityData !== 'object') {
      throw new ValidationError('PassiveAbility data must be a valid object');
    }

    const required = ['name', 'description', 'culture', 'trigger', 'effect'];
    for (const field of required) {
      if (!passiveAbilityData[field]) {
        throw new ValidationError(`Missing required field: ${field}`);
      }
    }

    return {
      name: this._sanitizeString(passiveAbilityData.name),
      description: this._sanitizeString(passiveAbilityData.description),
      culture: passiveAbilityData.culture,
      trigger: passiveAbilityData.trigger,
      effect: passiveAbilityData.effect,
      cultural_lore: this._sanitizeString(passiveAbilityData.cultural_lore || ''),
      icon: passiveAbilityData.icon || null,
      rarity: passiveAbilityData.rarity || 'common',
      metadata: passiveAbilityData.metadata || {},
    };
  }

  async _validateAndSanitizeUpdateData(updateData, existingPassiveAbility) {
    if (!updateData || typeof updateData !== 'object') {
      throw new ValidationError('Update data must be a valid object');
    }

    const sanitized = {};
    
    // Only include fields that are actually being updated
    if (updateData.name !== undefined) {
      sanitized.name = this._sanitizeString(updateData.name);
    }
    if (updateData.description !== undefined) {
      sanitized.description = this._sanitizeString(updateData.description);
    }
    if (updateData.culture !== undefined) {
      sanitized.culture = updateData.culture;
    }
    if (updateData.trigger !== undefined) {
      sanitized.trigger = updateData.trigger;
    }
    if (updateData.effect !== undefined) {
      sanitized.effect = updateData.effect;
    }
    if (updateData.cultural_lore !== undefined) {
      sanitized.cultural_lore = this._sanitizeString(updateData.cultural_lore);
    }
    if (updateData.icon !== undefined) {
      sanitized.icon = updateData.icon;
    }
    if (updateData.rarity !== undefined) {
      sanitized.rarity = updateData.rarity;
    }
    if (updateData.metadata !== undefined) {
      sanitized.metadata = updateData.metadata;
    }

    return sanitized;
  }

  async _validatePassiveAbilityBusinessRules(passiveAbility) {
    // Additional business rule validations beyond domain entity validation
    
    // Check for duplicate names within the same culture
    const existingPassiveAbilities = await this.passiveAbilityRepository.findByCulture(passiveAbility.culture);
    const duplicates = existingPassiveAbilities.filter(existing => 
      !existing.id.equals(passiveAbility.id) && existing.name === passiveAbility.name
    );
    if (duplicates.length > 0) {
      throw new BusinessRuleError(`PassiveAbility with name "${passiveAbility.name}" already exists for culture "${passiveAbility.culture}"`);
    }
  }

  _sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/[<>]/g, '');
  }

  _sanitizeFilters(filters) {
    const sanitized = {};
    
    if (filters.culture) sanitized.culture = filters.culture;
    if (filters.trigger) sanitized.trigger = filters.trigger;
    if (filters.effectType) sanitized.effectType = filters.effectType;
    if (filters.rarity) sanitized.rarity = filters.rarity;
    if (filters.alwaysActive !== undefined) sanitized.alwaysActive = Boolean(filters.alwaysActive);
    if (filters.battleTriggered !== undefined) sanitized.battleTriggered = Boolean(filters.battleTriggered);
    
    return sanitized;
  }

  _sortPassiveAbilities(passiveAbilities, sortBy, sortOrder) {
    return passiveAbilities.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortOrder === 'desc') {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      } else {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
    });
  }

  _paginateResults(items, page, limit) {
    const offset = (page - 1) * limit;
    return {
      data: items.slice(offset, offset + limit),
      pagination: {
        page,
        limit,
        total: items.length,
        pages: Math.ceil(items.length / limit),
      },
    };
  }

  _updatePerformanceMetrics(startTime) {
    const processingTime = Date.now() - startTime;
    this.performanceMetrics.operationsCount++;
    this.performanceMetrics.lastOperationTime = processingTime;
    
    // Calculate running average
    const currentAvg = this.performanceMetrics.averageResponseTime;
    const count = this.performanceMetrics.operationsCount;
    this.performanceMetrics.averageResponseTime = 
      (currentAvg * (count - 1) + processingTime) / count;
  }

  _handleServiceError(error, operation) {
    if (error instanceof ValidationError || 
        error instanceof NotFoundError || 
        error instanceof BusinessRuleError) {
      return error;
    }
    
    return new ApplicationError(
      `${operation} failed: ${error.message}`,
      500,
      error
    );
  }
}