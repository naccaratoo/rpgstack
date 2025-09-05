/**
 * PassiveAbility REST Controller
 * 
 * HTTP REST API controller for passive ability operations. Handles all HTTP requests
 * related to passive abilities and coordinates with the application service layer.
 * 
 * Features:
 * - RESTful endpoints for CRUD operations
 * - Input validation and sanitization
 * - Error handling and HTTP status codes
 * - Request/response transformation
 * - Query parameter processing
 * - Cultural passive abilities management
 */

import { PassiveAbilityService } from '../../application/services/PassiveAbilityService.js';
import { JsonPassiveAbilityRepository } from '../../infrastructure/repositories/JsonPassiveAbilityRepository.js';
import { PassiveAbilityId } from '../../domain/value-objects/PassiveAbilityId.js';
import { PassiveAbility } from '../../domain/entities/PassiveAbility.js';

export class PassiveAbilityController {
  constructor() {
    // Initialize repository and service
    this.passiveAbilityRepository = new JsonPassiveAbilityRepository();
    this.passiveAbilityService = new PassiveAbilityService(this.passiveAbilityRepository);
    
    // Initialize repository
    this.passiveAbilityRepository.initialize().catch(error => {
      console.error('Failed to initialize PassiveAbilityRepository:', error);
    });

    // Bind methods to preserve 'this' context
    this.getAllPassiveAbilities = this.getAllPassiveAbilities.bind(this);
    this.getPassiveAbility = this.getPassiveAbility.bind(this);
    this.createPassiveAbility = this.createPassiveAbility.bind(this);
    this.updatePassiveAbility = this.updatePassiveAbility.bind(this);
    this.deletePassiveAbility = this.deletePassiveAbility.bind(this);
    this.searchPassiveAbilities = this.searchPassiveAbilities.bind(this);
    this.getPassiveAbilitiesByCulture = this.getPassiveAbilitiesByCulture.bind(this);
    this.getPassiveAbilitiesByTrigger = this.getPassiveAbilitiesByTrigger.bind(this);
    this.getAlwaysActivePassiveAbilities = this.getAlwaysActivePassiveAbilities.bind(this);
    this.getBattleTriggeredPassiveAbilities = this.getBattleTriggeredPassiveAbilities.bind(this);
    this.createPassiveAbilitiesBatch = this.createPassiveAbilitiesBatch.bind(this);
    this.getPassiveAbilityStatistics = this.getPassiveAbilityStatistics.bind(this);
    this.generatePassiveAbilityId = this.generatePassiveAbilityId.bind(this);
    this.getValidCultures = this.getValidCultures.bind(this);
    this.getValidTriggers = this.getValidTriggers.bind(this);
    this.getValidEffectTypes = this.getValidEffectTypes.bind(this);
  }

  /**
   * GET /api/passive-abilities
   * Get all passive abilities with optional filtering
   */
  async getAllPassiveAbilities(req, res) {
    try {
      const filters = this._extractFilters(req.query);
      const options = this._extractOptions(req.query);

      const result = await this.passiveAbilityService.getAllPassiveAbilities(filters, options);

      res.status(200).json({
        success: true,
        data: {
          passiveAbilities: result.passiveAbilities.map(ability => ability.toJSON()),
          totalCount: result.passiveAbilities.length,
          filters: filters,
          options: options,
        },
        metadata: result.metadata,
      });
    } catch (error) {
      this._handleError(res, error, 'getAllPassiveAbilities');
    }
  }

  /**
   * GET /api/passive-abilities/:id
   * Get passive ability by ID
   */
  async getPassiveAbility(req, res) {
    try {
      const passiveAbilityId = req.params.id;
      
      if (!passiveAbilityId) {
        return res.status(400).json({
          success: false,
          error: 'PassiveAbility ID is required',
          code: 'MISSING_PASSIVE_ABILITY_ID',
        });
      }

      const result = await this.passiveAbilityService.getPassiveAbility(passiveAbilityId);

      res.status(200).json({
        success: true,
        data: {
          passiveAbility: result.passiveAbility.toJSON(),
        },
        metadata: result.metadata,
      });
    } catch (error) {
      this._handleError(res, error, 'getPassiveAbility');
    }
  }

  /**
   * POST /api/passive-abilities
   * Create new passive ability
   */
  async createPassiveAbility(req, res) {
    try {
      const passiveAbilityData = req.body;

      if (!passiveAbilityData || typeof passiveAbilityData !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'PassiveAbility data is required',
          code: 'MISSING_PASSIVE_ABILITY_DATA',
        });
      }

      const result = await this.passiveAbilityService.createPassiveAbility(passiveAbilityData);

      res.status(201).json({
        success: true,
        data: {
          passiveAbility: result.passiveAbility.toJSON(),
        },
        metadata: result.metadata,
      });
    } catch (error) {
      this._handleError(res, error, 'createPassiveAbility');
    }
  }

  /**
   * PUT /api/passive-abilities/:id
   * Update existing passive ability
   */
  async updatePassiveAbility(req, res) {
    try {
      const passiveAbilityId = req.params.id;
      const updateData = req.body;

      if (!passiveAbilityId) {
        return res.status(400).json({
          success: false,
          error: 'PassiveAbility ID is required',
          code: 'MISSING_PASSIVE_ABILITY_ID',
        });
      }

      if (!updateData || typeof updateData !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Update data is required',
          code: 'MISSING_UPDATE_DATA',
        });
      }

      const result = await this.passiveAbilityService.updatePassiveAbility(passiveAbilityId, updateData);

      res.status(200).json({
        success: true,
        data: {
          passiveAbility: result.passiveAbility.toJSON(),
        },
        metadata: result.metadata,
      });
    } catch (error) {
      this._handleError(res, error, 'updatePassiveAbility');
    }
  }

  /**
   * DELETE /api/passive-abilities/:id
   * Delete passive ability by ID
   */
  async deletePassiveAbility(req, res) {
    try {
      const passiveAbilityId = req.params.id;

      if (!passiveAbilityId) {
        return res.status(400).json({
          success: false,
          error: 'PassiveAbility ID is required',
          code: 'MISSING_PASSIVE_ABILITY_ID',
        });
      }

      const result = await this.passiveAbilityService.deletePassiveAbility(passiveAbilityId);

      res.status(200).json({
        success: true,
        data: {
          deleted: result.deleted,
          passiveAbility: result.passiveAbility.toJSON(),
        },
        metadata: result.metadata,
      });
    } catch (error) {
      this._handleError(res, error, 'deletePassiveAbility');
    }
  }

  /**
   * GET /api/passive-abilities/search
   * Search passive abilities by name
   */
  async searchPassiveAbilities(req, res) {
    try {
      const { name } = req.query;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Search name parameter is required',
          code: 'MISSING_SEARCH_NAME',
        });
      }

      const result = await this.passiveAbilityService.searchPassiveAbilitiesByName(name);

      res.status(200).json({
        success: true,
        data: {
          passiveAbilities: result.passiveAbilities.map(ability => ability.toJSON()),
          searchPattern: name,
          resultCount: result.passiveAbilities.length,
        },
        metadata: result.metadata,
      });
    } catch (error) {
      this._handleError(res, error, 'searchPassiveAbilities');
    }
  }

  /**
   * GET /api/passive-abilities/culture/:culture
   * Get passive abilities by culture
   */
  async getPassiveAbilitiesByCulture(req, res) {
    try {
      const culture = req.params.culture;

      if (!culture) {
        return res.status(400).json({
          success: false,
          error: 'Culture parameter is required',
          code: 'MISSING_CULTURE',
        });
      }

      const result = await this.passiveAbilityService.getPassiveAbilitiesByCulture(culture);

      res.status(200).json({
        success: true,
        data: {
          passiveAbilities: result.passiveAbilities.map(ability => ability.toJSON()),
          culture: culture,
          resultCount: result.passiveAbilities.length,
        },
        metadata: result.metadata,
      });
    } catch (error) {
      this._handleError(res, error, 'getPassiveAbilitiesByCulture');
    }
  }

  /**
   * GET /api/passive-abilities/trigger/:trigger
   * Get passive abilities by trigger
   */
  async getPassiveAbilitiesByTrigger(req, res) {
    try {
      const trigger = req.params.trigger;

      if (!trigger) {
        return res.status(400).json({
          success: false,
          error: 'Trigger parameter is required',
          code: 'MISSING_TRIGGER',
        });
      }

      const result = await this.passiveAbilityService.getPassiveAbilitiesByTrigger(trigger);

      res.status(200).json({
        success: true,
        data: {
          passiveAbilities: result.passiveAbilities.map(ability => ability.toJSON()),
          trigger: trigger,
          resultCount: result.passiveAbilities.length,
        },
        metadata: result.metadata,
      });
    } catch (error) {
      this._handleError(res, error, 'getPassiveAbilitiesByTrigger');
    }
  }

  /**
   * GET /api/passive-abilities/always-active
   * Get always active passive abilities
   */
  async getAlwaysActivePassiveAbilities(req, res) {
    try {
      const result = await this.passiveAbilityService.getAlwaysActivePassiveAbilities();

      res.status(200).json({
        success: true,
        data: {
          passiveAbilities: result.passiveAbilities.map(ability => ability.toJSON()),
          resultCount: result.passiveAbilities.length,
        },
        metadata: result.metadata,
      });
    } catch (error) {
      this._handleError(res, error, 'getAlwaysActivePassiveAbilities');
    }
  }

  /**
   * GET /api/passive-abilities/battle-triggered
   * Get battle-triggered passive abilities
   */
  async getBattleTriggeredPassiveAbilities(req, res) {
    try {
      const result = await this.passiveAbilityService.getBattleTriggeredPassiveAbilities();

      res.status(200).json({
        success: true,
        data: {
          passiveAbilities: result.passiveAbilities.map(ability => ability.toJSON()),
          resultCount: result.passiveAbilities.length,
        },
        metadata: result.metadata,
      });
    } catch (error) {
      this._handleError(res, error, 'getBattleTriggeredPassiveAbilities');
    }
  }

  /**
   * POST /api/passive-abilities/batch
   * Create multiple passive abilities
   */
  async createPassiveAbilitiesBatch(req, res) {
    try {
      const passiveAbilitiesData = req.body.passiveAbilities || req.body;

      if (!Array.isArray(passiveAbilitiesData)) {
        return res.status(400).json({
          success: false,
          error: 'PassiveAbilities data must be an array',
          code: 'INVALID_BATCH_DATA',
        });
      }

      const result = await this.passiveAbilityService.createPassiveAbilitiesBatch(passiveAbilitiesData);

      res.status(201).json({
        success: true,
        data: {
          passiveAbilities: result.passiveAbilities.map(ability => ability.toJSON()),
          results: result.results,
        },
        metadata: result.metadata,
      });
    } catch (error) {
      this._handleError(res, error, 'createPassiveAbilitiesBatch');
    }
  }

  /**
   * GET /api/passive-abilities/statistics
   * Get passive ability statistics
   */
  async getPassiveAbilityStatistics(req, res) {
    try {
      const result = await this.passiveAbilityService.getPassiveAbilityStatistics();

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this._handleError(res, error, 'getPassiveAbilityStatistics');
    }
  }

  /**
   * GET /api/passive-abilities/generate-id
   * Generate new passive ability ID
   */
  async generatePassiveAbilityId(req, res) {
    try {
      const id = PassiveAbilityId.generate();

      res.status(200).json({
        success: true,
        data: {
          id: id.toString(),
        },
      });
    } catch (error) {
      this._handleError(res, error, 'generatePassiveAbilityId');
    }
  }

  /**
   * GET /api/passive-abilities/valid-cultures
   * Get list of valid cultures
   */
  async getValidCultures(req, res) {
    try {
      res.status(200).json({
        success: true,
        data: {
          cultures: PassiveAbility.VALID_CULTURES,
          count: PassiveAbility.VALID_CULTURES.length,
        },
      });
    } catch (error) {
      this._handleError(res, error, 'getValidCultures');
    }
  }

  /**
   * GET /api/passive-abilities/valid-triggers
   * Get list of valid triggers
   */
  async getValidTriggers(req, res) {
    try {
      res.status(200).json({
        success: true,
        data: {
          triggers: PassiveAbility.VALID_TRIGGERS,
          count: PassiveAbility.VALID_TRIGGERS.length,
        },
      });
    } catch (error) {
      this._handleError(res, error, 'getValidTriggers');
    }
  }

  /**
   * GET /api/passive-abilities/valid-effect-types
   * Get list of valid effect types
   */
  async getValidEffectTypes(req, res) {
    try {
      res.status(200).json({
        success: true,
        data: {
          effectTypes: PassiveAbility.VALID_EFFECT_TYPES,
          count: PassiveAbility.VALID_EFFECT_TYPES.length,
        },
      });
    } catch (error) {
      this._handleError(res, error, 'getValidEffectTypes');
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  _extractFilters(query) {
    const filters = {};

    if (query.culture) filters.culture = query.culture;
    if (query.trigger) filters.trigger = query.trigger;
    if (query.effectType) filters.effectType = query.effectType;
    if (query.rarity) filters.rarity = query.rarity;
    if (query.alwaysActive !== undefined) {
      filters.alwaysActive = query.alwaysActive === 'true';
    }
    if (query.battleTriggered !== undefined) {
      filters.battleTriggered = query.battleTriggered === 'true';
    }

    return filters;
  }

  _extractOptions(query) {
    const options = {};

    if (query.sortBy) options.sortBy = query.sortBy;
    if (query.sortOrder) options.sortOrder = query.sortOrder;
    if (query.page && !isNaN(parseInt(query.page))) {
      options.page = parseInt(query.page);
    }
    if (query.limit && !isNaN(parseInt(query.limit))) {
      options.limit = parseInt(query.limit);
    }

    return options;
  }

  _handleError(res, error, operation) {
    console.error(`PassiveAbilityController.${operation} error:`, error);

    // Determine HTTP status code based on error type
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';

    if (error.message.includes('not found') || error.name === 'NotFoundError') {
      statusCode = 404;
      errorCode = 'NOT_FOUND';
    } else if (error.message.includes('validation') || 
               error.message.includes('Invalid') || 
               error.message.includes('required') ||
               error.name === 'ValidationError') {
      statusCode = 400;
      errorCode = 'VALIDATION_ERROR';
    } else if (error.message.includes('already exists') || 
               error.name === 'BusinessRuleError') {
      statusCode = 409;
      errorCode = 'CONFLICT';
    }

    res.status(statusCode).json({
      success: false,
      error: error.message,
      code: errorCode,
      operation: operation,
      timestamp: new Date().toISOString(),
    });
  }
}