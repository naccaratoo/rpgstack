/**
 * Skill Application Service
 * 
 * Orchestrates skill-related use cases by coordinating domain entities,
 * domain services, and infrastructure concerns. This service layer acts as
 * the facade for the application's skill operations while maintaining
 * clean architecture principles.
 * 
 * Features:
 * - Complete CRUD operations with business logic validation
 * - Skill filtering and search capabilities
 * - Skill tree validation and prerequisite checking
 * - Bulk operations with transaction support
 * - Advanced search and filtering capabilities
 * - Error handling and input validation
 */

import { Skill } from '../../domain/entities/Skill.js';
import { SkillId } from '../../domain/value-objects/SkillId.js';
import { ApplicationError, ValidationError, NotFoundError, BusinessRuleError } from '../errors/ApplicationErrors.js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export class SkillService {
  /**
   * Create SkillService instance
   * @param {SkillRepository} skillRepository - Repository for skill persistence
   * @param {Object} logger - Logging service
   */
  constructor(skillRepository, logger = console) {
    this.skillRepository = skillRepository;
    this.logger = logger;
    
    // Performance tracking
    this.performanceMetrics = {
      operationsCount: 0,
      lastOperationTime: null,
      averageResponseTime: 0,
    };
  }

  // ===== SKILL CRUD OPERATIONS =====

  /**
   * Create a new skill with business validation
   * @param {Object} skillData - Skill creation data
   * @param {Object} options - Creation options
   * @returns {Promise<Object>} Created skill with metadata
   */
  async createSkill(skillData, options = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Creating new skill', { name: skillData.name });
      
      // Input validation and sanitization
      const sanitizedData = await this._validateAndSanitizeCreateData(skillData);
      
      // Create skill entity with domain validation
      const skill = Skill.create(sanitizedData);

      // Validate skill meets business rules
      await this._validateSkillBusinessRules(skill);

      // Persist skill
      const savedSkill = await this.skillRepository.save(skill);
      
      // Update performance metrics
      this._updatePerformanceMetrics(startTime);
      
      this.logger.info('Skill created successfully', { 
        id: savedSkill.id.toString(),
        name: savedSkill.name 
      });

      return {
        skill: savedSkill,
        metadata: {
          operation: 'create',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          validation: 'passed',
        },
      };
    } catch (error) {
      this._updatePerformanceMetrics(startTime);
      this.logger.error('Skill creation failed', { error: error.message, skillData });
      throw this._handleServiceError(error, 'createSkill');
    }
  }

  /**
   * Get skill by ID with enhanced error handling
   * @param {string|SkillId} skillId - Skill ID
   * @param {Object} options - Retrieval options
   * @returns {Promise<Object>} Skill with metadata
   */
  async getSkill(skillId, options = {}) {
    const startTime = Date.now();
    
    try {
      const id = skillId instanceof SkillId ? skillId : new SkillId(skillId);
      
      this.logger.info('Retrieving skill', { id: id.toString() });
      
      const skill = await this.skillRepository.findById(id);
      
      if (!skill) {
        throw new NotFoundError(`Skill with ID ${id.toString()} not found`);
      }
      
      this._updatePerformanceMetrics(startTime);
      
      return {
        skill,
        metadata: {
          operation: 'get',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      this._updatePerformanceMetrics(startTime);
      this.logger.error('Skill retrieval failed', { error: error.message, skillId });
      throw this._handleServiceError(error, 'getSkill');
    }
  }

  /**
   * Update existing skill with validation
   * @param {string|SkillId} skillId - Skill ID
   * @param {Object} updateData - Update data
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated skill with metadata
   */
  async updateSkill(skillId, updateData, options = {}) {
    const startTime = Date.now();
    
    try {
      const id = skillId instanceof SkillId ? skillId : new SkillId(skillId);
      
      this.logger.info('Updating skill', { id: id.toString(), updates: Object.keys(updateData) });
      
      // Get existing skill
      const existingSkill = await this.skillRepository.findById(id);
      if (!existingSkill) {
        throw new NotFoundError(`Skill with ID ${id.toString()} not found`);
      }
      
      // Validate and sanitize update data
      const sanitizedData = await this._validateAndSanitizeUpdateData(updateData, existingSkill);
      
      // Create updated skill entity
      const updatedSkill = new Skill({
        id: existingSkill.id,
        name: sanitizedData.name ?? existingSkill.name,
        description: sanitizedData.description ?? existingSkill.description,
        type: sanitizedData.type ?? existingSkill.type,
        classe: sanitizedData.classe ?? existingSkill.classe,
        damage: sanitizedData.damage ?? existingSkill.damage,
        sprite: sanitizedData.sprite ?? existingSkill.sprite,
        anima_cost: sanitizedData.anima_cost ?? existingSkill.anima_cost,
        cooldown: sanitizedData.cooldown ?? existingSkill.cooldown,
        duration: sanitizedData.duration ?? existingSkill.duration,
        prerequisites: sanitizedData.prerequisites ?? existingSkill.prerequisites,
        effects: sanitizedData.effects ?? existingSkill.effects,
        metadata: { ...existingSkill.metadata, ...sanitizedData.metadata },
        // SISTEMA DE COEFICIENTES DINÂMICOS - Preservar campos críticos
        multi_hit: sanitizedData.multi_hit ?? existingSkill.multi_hit,
        buffs: sanitizedData.buffs ?? existingSkill.buffs,
        battlefield_effects: sanitizedData.battlefield_effects ?? existingSkill.battlefield_effects,
        cultural_authenticity: sanitizedData.cultural_authenticity ?? existingSkill.cultural_authenticity,
        affinity: sanitizedData.affinity ?? existingSkill.affinity,
        created_at: existingSkill.created_at,
        updated_at: new Date()
      });
      
      // Validate updated skill meets business rules
      await this._validateSkillBusinessRules(updatedSkill);
      
      // Persist changes
      const savedSkill = await this.skillRepository.save(updatedSkill);
      
      this._updatePerformanceMetrics(startTime);
      
      this.logger.info('Skill updated successfully', { 
        id: savedSkill.id.toString(),
        name: savedSkill.name 
      });

      return {
        skill: savedSkill,
        metadata: {
          operation: 'update',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          validation: 'passed',
        },
      };
    } catch (error) {
      this._updatePerformanceMetrics(startTime);
      this.logger.error('Skill update failed', { error: error.message, skillId, updateData });
      throw this._handleServiceError(error, 'updateSkill');
    }
  }

  /**
   * Delete skill by ID with cascade validation
   * @param {string|SkillId} skillId - Skill ID
   * @param {Object} options - Delete options
   * @returns {Promise<Object>} Deletion result with metadata
   */
  async deleteSkill(skillId, options = {}) {
    const startTime = Date.now();
    
    try {
      const id = skillId instanceof SkillId ? skillId : new SkillId(skillId);
      
      this.logger.info('Deleting skill', { id: id.toString() });
      
      // Check if skill exists
      const existingSkill = await this.skillRepository.findById(id);
      if (!existingSkill) {
        throw new NotFoundError(`Skill with ID ${id.toString()} not found`);
      }
      
      // Check for dependencies (other skills that have this as prerequisite)
      if (!options.force) {
        await this._validateSkillDeletion(existingSkill);
      }
      
      // Perform deletion
      const deleted = await this.skillRepository.delete(id);
      
      this._updatePerformanceMetrics(startTime);
      
      this.logger.info('Skill deleted successfully', { 
        id: id.toString(),
        name: existingSkill.name 
      });

      return {
        deleted,
        skill: existingSkill,
        metadata: {
          operation: 'delete',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      this._updatePerformanceMetrics(startTime);
      this.logger.error('Skill deletion failed', { error: error.message, skillId });
      throw this._handleServiceError(error, 'deleteSkill');
    }
  }

  // ===== SKILL QUERY OPERATIONS =====

  /**
   * Get all skills with optional filtering
   * @param {Object} filters - Filtering options
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Skills list with metadata
   */
  async getAllSkills(filters = {}, options = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Retrieving all skills', { filters });
      
      let skills;
      if (Object.keys(filters).length === 0) {
        skills = await this.skillRepository.findAll();
      } else {
        const sanitizedFilters = this._sanitizeFilters(filters);
        skills = await this.skillRepository.findByCriteria(sanitizedFilters);
      }
      
      // Apply sorting if requested
      if (options.sortBy) {
        skills = this._sortSkills(skills, options.sortBy, options.sortOrder || 'asc');
      }
      
      // Apply pagination if requested
      if (options.page && options.limit) {
        const paginatedResult = this._paginateResults(skills, options.page, options.limit);
        skills = paginatedResult.data;
      }
      
      this._updatePerformanceMetrics(startTime);
      
      return {
        skills,
        metadata: {
          operation: 'getAll',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          totalCount: skills.length,
          filters: filters,
        },
      };
    } catch (error) {
      this._updatePerformanceMetrics(startTime);
      this.logger.error('Skills retrieval failed', { error: error.message, filters });
      throw this._handleServiceError(error, 'getAllSkills');
    }
  }

  /**
   * Search skills by name pattern
   * @param {string} namePattern - Name pattern to search
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Matching skills with metadata
   */
  async searchSkillsByName(namePattern, options = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Searching skills by name', { namePattern });
      
      if (!namePattern || namePattern.trim().length < 2) {
        throw new ValidationError('Search pattern must be at least 2 characters long');
      }
      
      const skills = await this.skillRepository.findByName(namePattern.trim());
      
      this._updatePerformanceMetrics(startTime);
      
      return {
        skills,
        metadata: {
          operation: 'searchByName',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          searchPattern: namePattern,
          resultCount: skills.length,
        },
      };
    } catch (error) {
      this._updatePerformanceMetrics(startTime);
      this.logger.error('Skill name search failed', { error: error.message, namePattern });
      throw this._handleServiceError(error, 'searchSkillsByName');
    }
  }

  /**
   * Get skills by type
   * @param {string} type - Skill type
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Skills of specified type
   */
  async getSkillsByType(type, options = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Getting skills by type', { type });
      
      if (!Skill.VALID_TYPES.includes(type)) {
        throw new ValidationError(`Invalid skill type: ${type}`);
      }
      
      const skills = await this.skillRepository.findByType(type);
      
      this._updatePerformanceMetrics(startTime);
      
      return {
        skills,
        metadata: {
          operation: 'getByType',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          type: type,
          resultCount: skills.length,
        },
      };
    } catch (error) {
      this._updatePerformanceMetrics(startTime);
      this.logger.error('Skills by type retrieval failed', { error: error.message, type });
      throw this._handleServiceError(error, 'getSkillsByType');
    }
  }

  /**
   * Get skills by classe
   * @param {string} classe - Skill classe
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Skills of specified classe
   */
  async getSkillsByClasse(classe, options = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Getting skills by classe', { classe });
      
      if (!Skill.VALID_CHARACTER_CLASSES.includes(classe)) {
        throw new ValidationError(`Invalid skill classe: ${classe}`);
      }
      
      const skills = await this.skillRepository.findByClasse(classe);
      
      this._updatePerformanceMetrics(startTime);
      
      return {
        skills,
        metadata: {
          operation: 'getByClasse',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          classe: classe,
          resultCount: skills.length,
        },
      };
    } catch (error) {
      this._updatePerformanceMetrics(startTime);
      this.logger.error('Skills by classe retrieval failed', { error: error.message, classe });
      throw this._handleServiceError(error, 'getSkillsByClasse');
    }
  }

  // ===== BUSINESS LOGIC METHODS =====

  /**
   * Get basic skills (without prerequisites)
   * @returns {Promise<Object>} Basic skills list
   */
  async getBasicSkills() {
    const startTime = Date.now();
    
    try {
      this.logger.info('Getting basic skills');
      
      const skills = await this.skillRepository.findBasicSkills();
      
      this._updatePerformanceMetrics(startTime);
      
      return {
        skills,
        metadata: {
          operation: 'getBasicSkills',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          resultCount: skills.length,
        },
      };
    } catch (error) {
      this._updatePerformanceMetrics(startTime);
      this.logger.error('Basic skills retrieval failed', { error: error.message });
      throw this._handleServiceError(error, 'getBasicSkills');
    }
  }

  /**
   * Get combat skills (combat and magic types)
   * @returns {Promise<Object>} Combat skills list
   */
  async getCombatSkills() {
    const startTime = Date.now();
    
    try {
      this.logger.info('Getting combat skills');
      
      const skills = await this.skillRepository.findCombatSkills();
      
      this._updatePerformanceMetrics(startTime);
      
      return {
        skills,
        metadata: {
          operation: 'getCombatSkills',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          resultCount: skills.length,
        },
      };
    } catch (error) {
      this._updatePerformanceMetrics(startTime);
      this.logger.error('Combat skills retrieval failed', { error: error.message });
      throw this._handleServiceError(error, 'getCombatSkills');
    }
  }

  // ===== BULK OPERATIONS =====

  /**
   * Create multiple skills in batch
   * @param {Array} skillsData - Array of skill data
   * @param {Object} options - Bulk creation options
   * @returns {Promise<Object>} Bulk creation results
   */
  async createSkillsBatch(skillsData, options = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Creating skills batch', { count: skillsData.length });
      
      if (!Array.isArray(skillsData) || skillsData.length === 0) {
        throw new ValidationError('Skills data must be a non-empty array');
      }
      
      const results = {
        success: [],
        errors: [],
        created: [],
      };
      
      // Process each skill
      for (let i = 0; i < skillsData.length; i++) {
        try {
          const sanitizedData = await this._validateAndSanitizeCreateData(skillsData[i]);
          const skill = Skill.create(sanitizedData);
          await this._validateSkillBusinessRules(skill);
          results.created.push(skill);
          results.success.push(i);
        } catch (error) {
          results.errors.push({
            index: i,
            error: error.message,
            data: skillsData[i],
          });
        }
      }
      
      // Bulk save successful skills
      let savedSkills = [];
      if (results.created.length > 0) {
        savedSkills = await this.skillRepository.bulkSave(results.created);
      }
      
      this._updatePerformanceMetrics(startTime);
      
      this.logger.info('Skills batch creation completed', {
        successful: results.success.length,
        failed: results.errors.length,
        total: skillsData.length,
      });
      
      return {
        skills: savedSkills,
        results,
        metadata: {
          operation: 'createBatch',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          totalRequested: skillsData.length,
          successful: results.success.length,
          failed: results.errors.length,
        },
      };
    } catch (error) {
      this._updatePerformanceMetrics(startTime);
      this.logger.error('Skills batch creation failed', { error: error.message });
      throw this._handleServiceError(error, 'createSkillsBatch');
    }
  }

  // ===== STATISTICS AND ANALYTICS =====

  /**
   * Get comprehensive skill statistics
   * @returns {Promise<Object>} Skills statistics
   */
  async getSkillStatistics() {
    const startTime = Date.now();
    
    try {
      this.logger.info('Generating skill statistics');
      
      const [
        totalCount,
        repositoryStats,
        combatSkills,
        passiveSkills,
        basicSkills
      ] = await Promise.all([
        this.skillRepository.count(),
        this.skillRepository.getStatistics(),
        this.skillRepository.findCombatSkills(),
        this.skillRepository.findPassiveSkills(),
        this.skillRepository.findBasicSkills(),
      ]);
      
      const typeDistribution = {};
      const classeDistribution = {};
      
      // Calculate distributions
      const allSkills = await this.skillRepository.findAll();
      allSkills.forEach(skill => {
        typeDistribution[skill.type] = (typeDistribution[skill.type] || 0) + 1;
        classeDistribution[skill.classe] = (classeDistribution[skill.classe] || 0) + 1;
      });
      
      this._updatePerformanceMetrics(startTime);
      
      const stats = {
        total: totalCount,
        combatSkills: combatSkills.length,
        passiveSkills: passiveSkills.length,
        basicSkills: basicSkills.length,
        skillsWithPrerequisites: totalCount - basicSkills.length,
        typeDistribution,
        classeDistribution,
        repository: repositoryStats,
        performance: { ...this.performanceMetrics },
        metadata: {
          operation: 'getStatistics',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        },
      };
      
      this.logger.info('Skill statistics generated', { totalSkills: totalCount });
      
      return stats;
    } catch (error) {
      this._updatePerformanceMetrics(startTime);
      this.logger.error('Skill statistics generation failed', { error: error.message });
      throw this._handleServiceError(error, 'getSkillStatistics');
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  async _validateAndSanitizeCreateData(skillData) {
    if (!skillData || typeof skillData !== 'object') {
      throw new ValidationError('Skill data must be a valid object');
    }

    const required = ['name', 'type'];
    for (const field of required) {
      if (!skillData[field]) {
        throw new ValidationError(`Missing required field: ${field}`);
      }
    }

    // Validar skill_class (novas classes)
    const validSkillClasses = ['Damage', 'Utility', 'Damage&utility'];
    if (skillData.skill_class && !validSkillClasses.includes(skillData.skill_class)) {
      throw new ValidationError(`Invalid skill_class. Must be one of: ${validSkillClasses.join(', ')}`);
    }

    // Validar damage_type (novo campo)
    const validDamageTypes = ['ataque', 'ataque_especial'];
    if (skillData.damage_type && !validDamageTypes.includes(skillData.damage_type)) {
      throw new ValidationError(`Invalid damage_type. Must be one of: ${validDamageTypes.join(', ')}`);
    }

    return {
      name: this._sanitizeString(skillData.name),
      description: this._sanitizeString(skillData.description || ''),
      skill_class: skillData.skill_class || 'Damage', // NOVO CAMPO
      damage_type: skillData.damage_type || null, // NOVO CAMPO
      type: skillData.type,
      classe: skillData.classe || 'Lutador',
      damage: skillData.damage || 0,
      sprite: skillData.sprite || null,
      anima_cost: skillData.anima_cost || 0,
      cooldown: skillData.cooldown || 0,
      duration: skillData.duration || 0,
      prerequisites: skillData.prerequisites || [],
      effects: skillData.effects || [],
      cultural_authenticity: skillData.cultural_authenticity || '', // NOVO CAMPO
      character_id: skillData.character_id || null, // NOVO CAMPO
      metadata: skillData.metadata || {},
    };
  }

  async _validateAndSanitizeUpdateData(updateData, existingSkill) {
    if (!updateData || typeof updateData !== 'object') {
      throw new ValidationError('Update data must be a valid object');
    }

    const sanitized = {};
    
    // Validar skill_class se fornecido
    if (updateData.skill_class !== undefined) {
      const validSkillClasses = ['Damage', 'Utility', 'Damage&utility'];
      if (updateData.skill_class && !validSkillClasses.includes(updateData.skill_class)) {
        throw new ValidationError(`Invalid skill_class. Must be one of: ${validSkillClasses.join(', ')}`);
      }
      sanitized.skill_class = updateData.skill_class;
    }

    // Validar damage_type se fornecido
    if (updateData.damage_type !== undefined) {
      const validDamageTypes = ['ataque', 'ataque_especial'];
      if (updateData.damage_type && !validDamageTypes.includes(updateData.damage_type)) {
        throw new ValidationError(`Invalid damage_type. Must be one of: ${validDamageTypes.join(', ')}`);
      }
      sanitized.damage_type = updateData.damage_type;
    }
    
    // Only include fields that are actually being updated
    if (updateData.name !== undefined) {
      sanitized.name = this._sanitizeString(updateData.name);
    }
    if (updateData.description !== undefined) {
      sanitized.description = this._sanitizeString(updateData.description);
    }
    if (updateData.type !== undefined) {
      sanitized.type = updateData.type;
    }
    if (updateData.classe !== undefined) {
      sanitized.classe = updateData.classe;
    }
    if (updateData.damage !== undefined) {
      sanitized.damage = updateData.damage;
    }
    if (updateData.sprite !== undefined) {
      sanitized.sprite = updateData.sprite;
    }
    if (updateData.anima_cost !== undefined) {
      sanitized.anima_cost = updateData.anima_cost;
    }
    if (updateData.cooldown !== undefined) {
      sanitized.cooldown = updateData.cooldown;
    }
    if (updateData.duration !== undefined) {
      sanitized.duration = updateData.duration;
    }
    if (updateData.prerequisites !== undefined) {
      sanitized.prerequisites = updateData.prerequisites;
    }
    if (updateData.effects !== undefined) {
      sanitized.effects = updateData.effects;
    }
    if (updateData.metadata !== undefined) {
      sanitized.metadata = updateData.metadata;
    }
    // SISTEMA DE COEFICIENTES DINÂMICOS - Preservar multi_hit, buffs e battlefield_effects
    if (updateData.multi_hit !== undefined) {
      sanitized.multi_hit = updateData.multi_hit;
    }
    if (updateData.buffs !== undefined) {
      sanitized.buffs = updateData.buffs;
    }
    if (updateData.battlefield_effects !== undefined) {
      sanitized.battlefield_effects = updateData.battlefield_effects;
    }
    if (updateData.cultural_authenticity !== undefined) {
      sanitized.cultural_authenticity = updateData.cultural_authenticity;
    }
    if (updateData.affinity !== undefined) {
      sanitized.affinity = updateData.affinity;
    }

    return sanitized;
  }

  async _validateSkillBusinessRules(skill) {
    // Additional business rule validations beyond domain entity validation
    
    // Check for duplicate names
    const existingSkills = await this.skillRepository.findByName(skill.name);
    const duplicates = existingSkills.filter(existing => !existing.id.equals(skill.id));
    if (duplicates.length > 0) {
      throw new BusinessRuleError(`Skill with name "${skill.name}" already exists`);
    }
  }

  async _validateSkillDeletion(skill) {
    // Check if any other skills depend on this skill as prerequisite
    const allSkills = await this.skillRepository.findAll();
    const dependentSkills = allSkills.filter(otherSkill => 
      otherSkill.prerequisites.includes(skill.id.toString())
    );
    
    if (dependentSkills.length > 0) {
      const dependentNames = dependentSkills.map(s => s.name).join(', ');
      throw new BusinessRuleError(
        `Cannot delete skill "${skill.name}". It is a prerequisite for: ${dependentNames}`
      );
    }
  }

  _sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/[<>]/g, '');
  }

  _sanitizeFilters(filters) {
    const sanitized = {};
    
    if (filters.type) sanitized.type = filters.type;
    if (filters.classe) sanitized.classe = filters.classe;
    if (filters.minDamage) sanitized.minDamage = Number(filters.minDamage);
    if (filters.maxDamage) sanitized.maxDamage = Number(filters.maxDamage);
    if (filters.minAnimaCost) sanitized.minAnimaCost = Number(filters.minAnimaCost);
    if (filters.maxAnimaCost) sanitized.maxAnimaCost = Number(filters.maxAnimaCost);
    
    return sanitized;
  }

  _sortSkills(skills, sortBy, sortOrder) {
    return skills.sort((a, b) => {
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

  /**
   * Upload and associate sprite to skill
   * @param {string} skillId - Skill ID
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - Original filename
   * @param {string} mimeType - File MIME type
   * @returns {Promise<Object>} Upload result with sprite path
   */
  async uploadSkillSprite(skillId, fileBuffer, fileName, mimeType) {
    const startTime = Date.now();
    
    try {
      // Validate skill exists
      const skill = await this.getSkill(skillId);
      if (!skill) {
        throw new NotFoundError(`Skill with ID ${skillId} not found`);
      }

      // Validate file type
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimeTypes.includes(mimeType)) {
        throw new ValidationError(`Invalid file type. Allowed: ${allowedMimeTypes.join(', ')}`);
      }

      // Validate file size (max 2MB)
      const maxSize = 2 * 1024 * 1024;
      if (fileBuffer.length > maxSize) {
        throw new ValidationError('File size too large. Maximum 2MB allowed');
      }

      // Create sprites directory if not exists
      const spritesDir = path.join(process.cwd(), 'assets', 'skills');
      await fs.mkdir(spritesDir, { recursive: true });

      // Generate unique filename
      const fileExtension = path.extname(fileName) || this._getExtensionFromMimeType(mimeType);
      const timestamp = Date.now();
      const hash = crypto.createHash('md5').update(fileBuffer).digest('hex').substring(0, 8);
      const newFileName = `skill_${skillId}_${timestamp}_${hash}${fileExtension}`;
      const filePath = path.join(spritesDir, newFileName);

      // Save file
      await fs.writeFile(filePath, fileBuffer);

      // Update skill with sprite path
      const relativeSpritePath = `assets/skills/${newFileName}`;
      const updatedSkill = await this.updateSkill(skillId, { sprite: relativeSpritePath });

      this._updatePerformanceMetrics(startTime);

      return {
        success: true,
        skill: updatedSkill,
        spritePath: relativeSpritePath,
        fileName: newFileName,
        originalName: fileName,
        size: fileBuffer.length
      };

    } catch (error) {
      throw this._handleServiceError(error, 'Sprite upload');
    }
  }

  /**
   * Remove sprite from skill
   * @param {string} skillId - Skill ID
   * @returns {Promise<Object>} Updated skill
   */
  async removeSkillSprite(skillId) {
    const startTime = Date.now();
    
    try {
      const skill = await this.getSkill(skillId);
      if (!skill) {
        throw new NotFoundError(`Skill with ID ${skillId} not found`);
      }

      // Remove file if exists
      if (skill.sprite) {
        const filePath = path.join(process.cwd(), skill.sprite);
        try {
          await fs.unlink(filePath);
        } catch (error) {
          // File might not exist, log but continue
          console.warn(`Could not remove sprite file: ${filePath}`, error.message);
        }
      }

      // Update skill to remove sprite
      const updatedSkill = await this.updateSkill(skillId, { sprite: null });

      this._updatePerformanceMetrics(startTime);

      return updatedSkill;

    } catch (error) {
      throw this._handleServiceError(error, 'Sprite removal');
    }
  }

  /**
   * Get file extension from MIME type
   * @private
   */
  _getExtensionFromMimeType(mimeType) {
    const mimeToExt = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp'
    };
    return mimeToExt[mimeType] || '.jpg';
  }
}