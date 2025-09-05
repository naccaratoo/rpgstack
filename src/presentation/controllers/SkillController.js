/**
 * Skill REST Controller
 * 
 * HTTP REST API controller for skill operations. Handles all HTTP requests
 * related to skills and coordinates with the application service layer.
 * 
 * Features:
 * - RESTful endpoints for CRUD operations
 * - Input validation and sanitization
 * - Error handling and HTTP status codes
 * - Request/response transformation
 * - Query parameter processing
 */

import { SkillService } from '../../application/services/SkillService.js';
import { JsonSkillRepository } from '../../infrastructure/repositories/JsonSkillRepository.js';
import { SkillId } from '../../domain/value-objects/SkillId.js';

export class SkillController {
  constructor() {
    // Initialize repository and service
    this.skillRepository = new JsonSkillRepository();
    this.skillService = new SkillService(this.skillRepository);
    
    // Initialize repository
    this.skillRepository.initialize().catch(error => {
      console.error('Failed to initialize SkillRepository:', error);
    });

    // Bind methods to preserve 'this' context
    this.getAllSkills = this.getAllSkills.bind(this);
    this.getSkill = this.getSkill.bind(this);
    this.createSkill = this.createSkill.bind(this);
    this.updateSkill = this.updateSkill.bind(this);
    this.deleteSkill = this.deleteSkill.bind(this);
    this.searchSkills = this.searchSkills.bind(this);
    this.getSkillsByType = this.getSkillsByType.bind(this);
    this.getSkillsByClasse = this.getSkillsByClasse.bind(this);
    this.getBasicSkills = this.getBasicSkills.bind(this);
    this.getCombatSkills = this.getCombatSkills.bind(this);
    this.createSkillsBatch = this.createSkillsBatch.bind(this);
    this.getSkillStatistics = this.getSkillStatistics.bind(this);
    this.generateSkillId = this.generateSkillId.bind(this);
    this.validateSkillCategory = this.validateSkillCategory.bind(this);
    this.getValidSkillCategories = this.getValidSkillCategories.bind(this);
    this.getSkillsByCategory = this.getSkillsByCategory.bind(this);
  }

  /**
   * GET /api/skills
   * Get all skills with optional filtering
   */
  async getAllSkills(req, res) {
    try {
      const filters = this._extractFilters(req.query);
      const options = this._extractOptions(req.query);

      const result = await this.skillService.getAllSkills(filters, options);

      res.status(200).json({
        success: true,
        data: {
          skills: result.skills.map(skill => skill.toJSON()),
          totalCount: result.skills.length,
          filters: filters,
          options: options,
        },
        metadata: result.metadata,
      });
    } catch (error) {
      this._handleError(res, error, 'getAllSkills');
    }
  }

  /**
   * GET /api/skills/:id
   * Get skill by ID
   */
  async getSkill(req, res) {
    try {
      const skillId = req.params.id;
      
      if (!skillId) {
        return res.status(400).json({
          success: false,
          error: 'Skill ID is required',
          code: 'MISSING_SKILL_ID',
        });
      }

      const result = await this.skillService.getSkill(skillId);

      res.status(200).json({
        success: true,
        data: {
          skill: result.skill.toJSON(),
        },
        metadata: result.metadata,
      });
    } catch (error) {
      this._handleError(res, error, 'getSkill');
    }
  }

  /**
   * POST /api/skills
   * Create new skill
   */
  async createSkill(req, res) {
    try {
      const skillData = req.body;

      if (!skillData || typeof skillData !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Skill data is required',
          code: 'INVALID_SKILL_DATA',
        });
      }

      const result = await this.skillService.createSkill(skillData);

      res.status(201).json({
        success: true,
        data: {
          skill: result.skill.toJSON(),
        },
        metadata: result.metadata,
        message: `Skill '${result.skill.name}' created successfully`,
      });
    } catch (error) {
      this._handleError(res, error, 'createSkill');
    }
  }

  /**
   * PUT /api/skills/:id
   * Update existing skill
   */
  async updateSkill(req, res) {
    try {
      const skillId = req.params.id;
      const updateData = req.body;

      if (!skillId) {
        return res.status(400).json({
          success: false,
          error: 'Skill ID is required',
          code: 'MISSING_SKILL_ID',
        });
      }

      if (!updateData || typeof updateData !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Update data is required',
          code: 'INVALID_UPDATE_DATA',
        });
      }

      const result = await this.skillService.updateSkill(skillId, updateData);

      res.status(200).json({
        success: true,
        data: {
          skill: result.skill.toJSON(),
        },
        metadata: result.metadata,
        message: `Skill '${result.skill.name}' updated successfully`,
      });
    } catch (error) {
      this._handleError(res, error, 'updateSkill');
    }
  }

  /**
   * DELETE /api/skills/:id
   * Delete skill by ID
   */
  async deleteSkill(req, res) {
    try {
      const skillId = req.params.id;
      const force = req.query.force === 'true';

      if (!skillId) {
        return res.status(400).json({
          success: false,
          error: 'Skill ID is required',
          code: 'MISSING_SKILL_ID',
        });
      }

      const result = await this.skillService.deleteSkill(skillId, { force });

      if (!result.deleted) {
        return res.status(404).json({
          success: false,
          error: 'Skill not found',
          code: 'SKILL_NOT_FOUND',
        });
      }

      res.status(200).json({
        success: true,
        data: {
          deleted: result.deleted,
          skill: result.skill.toJSON(),
        },
        metadata: result.metadata,
        message: `Skill '${result.skill.name}' deleted successfully`,
      });
    } catch (error) {
      this._handleError(res, error, 'deleteSkill');
    }
  }

  /**
   * GET /api/skills/search
   * Search skills by name
   */
  async searchSkills(req, res) {
    try {
      const { q: query } = req.query;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Search query must be at least 2 characters long',
          code: 'INVALID_SEARCH_QUERY',
        });
      }

      const result = await this.skillService.searchSkillsByName(query);

      res.status(200).json({
        success: true,
        data: {
          skills: result.skills.map(skill => skill.toJSON()),
          searchQuery: query,
          resultCount: result.skills.length,
        },
        metadata: result.metadata,
      });
    } catch (error) {
      this._handleError(res, error, 'searchSkills');
    }
  }

  /**
   * GET /api/skills/type/:type
   * Get skills by type
   */
  async getSkillsByType(req, res) {
    try {
      const { type } = req.params;

      if (!type) {
        return res.status(400).json({
          success: false,
          error: 'Skill type is required',
          code: 'MISSING_SKILL_TYPE',
        });
      }

      const result = await this.skillService.getSkillsByType(type);

      res.status(200).json({
        success: true,
        data: {
          skills: result.skills.map(skill => skill.toJSON()),
          type: type,
          resultCount: result.skills.length,
        },
        metadata: result.metadata,
      });
    } catch (error) {
      this._handleError(res, error, 'getSkillsByType');
    }
  }

  /**
   * GET /api/skills/classe/:classe
   * Get skills by classe
   */
  async getSkillsByClasse(req, res) {
    try {
      const { classe } = req.params;

      if (!classe) {
        return res.status(400).json({
          success: false,
          error: 'Skill classe is required',
          code: 'MISSING_SKILL_CLASSE',
        });
      }

      const result = await this.skillService.getSkillsByClasse(classe);

      res.status(200).json({
        success: true,
        data: {
          skills: result.skills.map(skill => skill.toJSON()),
          classe: classe,
          resultCount: result.skills.length,
        },
        metadata: result.metadata,
      });
    } catch (error) {
      this._handleError(res, error, 'getSkillsByClasse');
    }
  }

  /**
   * GET /api/skills/basic
   * Get basic skills (without prerequisites)
   */
  async getBasicSkills(req, res) {
    try {
      const result = await this.skillService.getBasicSkills();

      res.status(200).json({
        success: true,
        data: {
          skills: result.skills.map(skill => skill.toJSON()),
          resultCount: result.skills.length,
        },
        metadata: result.metadata,
        message: 'Basic skills retrieved successfully',
      });
    } catch (error) {
      this._handleError(res, error, 'getBasicSkills');
    }
  }

  /**
   * GET /api/skills/combat
   * Get combat skills
   */
  async getCombatSkills(req, res) {
    try {
      const result = await this.skillService.getCombatSkills();

      res.status(200).json({
        success: true,
        data: {
          skills: result.skills.map(skill => skill.toJSON()),
          resultCount: result.skills.length,
        },
        metadata: result.metadata,
        message: 'Combat skills retrieved successfully',
      });
    } catch (error) {
      this._handleError(res, error, 'getCombatSkills');
    }
  }

  /**
   * POST /api/skills/batch
   * Create multiple skills in batch
   */
  async createSkillsBatch(req, res) {
    try {
      const { skills: skillsData } = req.body;

      if (!Array.isArray(skillsData) || skillsData.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Skills array is required and must not be empty',
          code: 'INVALID_SKILLS_ARRAY',
        });
      }

      const result = await this.skillService.createSkillsBatch(skillsData);

      res.status(201).json({
        success: true,
        data: {
          skills: result.skills.map(skill => skill.toJSON()),
          results: result.results,
          totalRequested: result.metadata.totalRequested,
          successful: result.metadata.successful,
          failed: result.metadata.failed,
        },
        metadata: result.metadata,
        message: `Batch operation completed: ${result.metadata.successful} created, ${result.metadata.failed} failed`,
      });
    } catch (error) {
      this._handleError(res, error, 'createSkillsBatch');
    }
  }

  /**
   * GET /api/skills/statistics
   * Get skill statistics
   */
  async getSkillStatistics(req, res) {
    try {
      const statistics = await this.skillService.getSkillStatistics();

      res.status(200).json({
        success: true,
        data: statistics,
        message: 'Skill statistics retrieved successfully',
      });
    } catch (error) {
      this._handleError(res, error, 'getSkillStatistics');
    }
  }

  /**
   * GET /api/skills/generate-id
   * Generate a new unique skill ID
   */
  async generateSkillId(req, res) {
    try {
      const skillId = SkillId.generate();

      res.status(200).json({
        success: true,
        data: {
          id: skillId.toString(),
        },
        message: 'Skill ID generated successfully',
      });
    } catch (error) {
      this._handleError(res, error, 'generateSkillId');
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  _extractFilters(query) {
    const filters = {};
    
    if (query.type) filters.type = query.type;
    if (query.element) filters.element = query.element;
    if (query.minLevel) filters.minLevel = parseInt(query.minLevel);
    if (query.maxLevel) filters.maxLevel = parseInt(query.maxLevel);
    if (query.minDamage) filters.minDamage = parseInt(query.minDamage);
    if (query.maxDamage) filters.maxDamage = parseInt(query.maxDamage);
    if (query.minManaCost) filters.minManaCost = parseInt(query.minManaCost);
    if (query.maxManaCost) filters.maxManaCost = parseInt(query.maxManaCost);
    if (query.hasPrerequisites !== undefined) {
      filters.hasPrerequisites = query.hasPrerequisites === 'true';
    }
    
    return filters;
  }

  _extractOptions(query) {
    const options = {};
    
    if (query.sortBy) options.sortBy = query.sortBy;
    if (query.sortOrder) options.sortOrder = query.sortOrder;
    if (query.page) options.page = parseInt(query.page);
    if (query.limit) options.limit = parseInt(query.limit);
    
    return options;
  }

  _handleError(res, error, operation) {
    console.error(`SkillController.${operation} error:`, error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: 'VALIDATION_ERROR',
        operation: operation,
      });
    }

    // Handle not found errors
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        success: false,
        error: error.message,
        code: 'NOT_FOUND',
        operation: operation,
      });
    }

    // Handle business rule errors
    if (error.name === 'BusinessRuleError') {
      return res.status(409).json({
        success: false,
        error: error.message,
        code: 'BUSINESS_RULE_VIOLATION',
        operation: operation,
      });
    }

    // Handle domain errors (invalid IDs, etc.)
    if (error.message.includes('SkillId') || error.message.includes('must be')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: 'DOMAIN_ERROR',
        operation: operation,
      });
    }

    // Handle generic application errors
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      operation: operation,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }

  /**
   * Upload sprite for skill
   */
  uploadSkillSprite = async (req, res) => {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No sprite file provided',
          code: 'NO_FILE'
        });
      }

      // Debug log
      console.log('Uploading sprite for skill:', id);
      console.log('File info:', {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

      const result = await this.skillService.uploadSkillSprite(
        id,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      return res.status(200).json({
        success: true,
        message: `Sprite uploaded successfully for skill '${result.skill.name}'`,
        data: {
          skill: result.skill,
          sprite: {
            path: result.spritePath,
            fileName: result.fileName,
            originalName: result.originalName,
            size: result.size
          }
        },
        metadata: {
          operation: 'uploadSprite',
          timestamp: new Date().toISOString(),
          skillId: id
        }
      });

    } catch (error) {
      console.error('Upload sprite error:', error.message);
      return res.status(500).json({
        success: false,
        error: error.message || 'Upload failed',
        code: 'UPLOAD_ERROR'
      });
    }
  }

  /**
   * Remove sprite from skill
   */
  removeSkillSprite = async (req, res) => {
    try {
      const { id } = req.params;

      const updatedSkill = await this.skillService.removeSkillSprite(id);

      return res.status(200).json({
        success: true,
        message: `Sprite removed successfully from skill '${updatedSkill.name}'`,
        data: {
          skill: updatedSkill
        },
        metadata: {
          operation: 'removeSprite',
          timestamp: new Date().toISOString(),
          skillId: id
        }
      });

    } catch (error) {
      return this._handleError(error, res, 'removeSprite');
    }
  }

  /**
   * POST /api/skills/validate/category
   * Validate skill category
   */
  async validateSkillCategory(req, res) {
    try {
      const { category } = req.body;

      if (!category) {
        return res.status(400).json({
          success: false,
          error: 'Category is required',
          code: 'MISSING_CATEGORY',
        });
      }

      const { Skill } = await import('../../domain/entities/Skill.js');
      const isValid = Skill.VALID_SKILL_CATEGORIES.includes(category);

      res.status(200).json({
        success: true,
        data: {
          category: category,
          valid: isValid,
          validCategories: Skill.VALID_SKILL_CATEGORIES,
        },
        message: isValid 
          ? `Category '${category}' is valid` 
          : `Category '${category}' is invalid. Must be one of: ${Skill.VALID_SKILL_CATEGORIES.join(', ')}`,
      });
    } catch (error) {
      this._handleError(res, error, 'validateSkillCategory');
    }
  }

  /**
   * GET /api/skills/categories
   * Get all valid skill categories
   */
  async getValidSkillCategories(req, res) {
    try {
      const { Skill } = await import('../../domain/entities/Skill.js');

      res.status(200).json({
        success: true,
        data: {
          categories: Skill.VALID_SKILL_CATEGORIES,
          descriptions: {
            'Damage': 'Skills focadas em causar dano aos inimigos',
            'Utility': 'Skills de suporte, cura, buffs e utilidades',
            'Damage&Utility': 'Skills híbridas que combinam dano com efeitos utilitários'
          }
        },
        message: 'Valid skill categories retrieved successfully',
      });
    } catch (error) {
      this._handleError(res, error, 'getValidSkillCategories');
    }
  }

  /**
   * GET /api/skills/category/:category
   * Get skills by category
   */
  async getSkillsByCategory(req, res) {
    try {
      const { category } = req.params;

      if (!category) {
        return res.status(400).json({
          success: false,
          error: 'Skill category is required',
          code: 'MISSING_SKILL_CATEGORY',
        });
      }

      const { Skill } = await import('../../domain/entities/Skill.js');
      
      if (!Skill.VALID_SKILL_CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          error: `Invalid skill category: ${category}. Must be one of: ${Skill.VALID_SKILL_CATEGORIES.join(', ')}`,
          code: 'INVALID_SKILL_CATEGORY',
        });
      }

      const result = await this.skillService.getSkillsByCategory(category);

      res.status(200).json({
        success: true,
        data: {
          skills: result.skills.map(skill => skill.toJSON()),
          category: category,
          resultCount: result.skills.length,
        },
        metadata: result.metadata,
      });
    } catch (error) {
      this._handleError(res, error, 'getSkillsByCategory');
    }
  }
}