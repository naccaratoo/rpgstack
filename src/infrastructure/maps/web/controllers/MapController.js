import { MapService } from '../../../../application/maps/services/MapService.js';
import { MapProgressService } from '../../../../application/maps/services/MapProgressService.js';
import { ValidationError, NotFoundError, BusinessRuleError } from '../../../../application/errors/ApplicationErrors.js';

/**
 * MapController - Infrastructure Layer (Web)
 * 
 * HTTP request handlers for map-related operations.
 * Coordinates between HTTP requests/responses and application services,
 * handles error formatting, and provides REST API endpoints.
 */
export class MapController {
  /**
   * Creates new MapController
   * @param {MapService} mapService - Map application service
   * @param {MapProgressService} progressService - Progress tracking service
   */
  constructor(mapService, progressService) {
    this.mapService = mapService;
    this.progressService = progressService;
  }

  /**
   * GET /api/v2/maps - Lists all maps with optional filtering
   * @param {Request} req - HTTP request
   * @param {Response} res - HTTP response
   */
  async getAllMaps(req, res) {
    try {
      const filters = {
        minDifficulty: req.query.minDifficulty ? parseInt(req.query.minDifficulty) : undefined,
        maxDifficulty: req.query.maxDifficulty ? parseInt(req.query.maxDifficulty) : undefined,
        unlockType: req.query.unlockType,
        sizeCategory: req.query.sizeCategory,
        completed: req.query.completed !== undefined ? req.query.completed === 'true' : undefined
      };

      const maps = await this.mapService.getAllMaps(filters);
      
      // Include progress information if playerId is provided
      const playerId = req.query.playerId || 'default';
      const enhancedMaps = [];
      
      for (const map of maps) {
        const progress = await this.progressService.getMapProgress(playerId, map.id.toString());
        enhancedMaps.push({
          ...map.toJSON(),
          progress: progress || {
            unlocked: false,
            bossDefeated: false,
            completionCount: 0
          }
        });
      }

      res.json({
        success: true,
        data: enhancedMaps,
        count: enhancedMaps.length,
        filters: filters
      });

    } catch (error) {
      this._handleError(res, error, 'Failed to retrieve maps');
    }
  }

  /**
   * GET /api/v2/maps/:id - Gets a specific map by ID
   * @param {Request} req - HTTP request
   * @param {Response} res - HTTP response
   */
  async getMap(req, res) {
    try {
      const mapId = req.params.id;
      const playerId = req.query.playerId || 'default';
      
      const map = await this.mapService.getMap(mapId);
      const progress = await this.progressService.getMapProgress(playerId, mapId);
      
      res.json({
        success: true,
        data: {
          ...map.toJSON(),
          progress: progress || {
            unlocked: false,
            bossDefeated: false,
            completionCount: 0
          }
        }
      });

    } catch (error) {
      this._handleError(res, error, 'Failed to retrieve map');
    }
  }

  /**
   * POST /api/v2/maps - Creates a new map
   * @param {Request} req - HTTP request
   * @param {Response} res - HTTP response
   */
  async createMap(req, res) {
    try {
      const mapData = req.body;
      const createdMap = await this.mapService.createMap(mapData);
      
      res.status(201).json({
        success: true,
        data: createdMap.toJSON(),
        message: `Map "${createdMap.name}" created successfully`
      });

    } catch (error) {
      this._handleError(res, error, 'Failed to create map');
    }
  }

  /**
   * PUT /api/v2/maps/:id - Updates an existing map
   * @param {Request} req - HTTP request
   * @param {Response} res - HTTP response
   */
  async updateMap(req, res) {
    try {
      const mapId = req.params.id;
      const updateData = req.body;
      
      const updatedMap = await this.mapService.updateMap(mapId, updateData);
      
      res.json({
        success: true,
        data: updatedMap.toJSON(),
        message: `Map "${updatedMap.name}" updated successfully`
      });

    } catch (error) {
      this._handleError(res, error, 'Failed to update map');
    }
  }

  /**
   * DELETE /api/v2/maps/:id - Deletes a map
   * @param {Request} req - HTTP request
   * @param {Response} res - HTTP response
   */
  async deleteMap(req, res) {
    try {
      const mapId = req.params.id;
      const deleted = await this.mapService.deleteMap(mapId);
      
      if (deleted) {
        res.json({
          success: true,
          message: `Map ${mapId} deleted successfully`
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Map not found'
        });
      }

    } catch (error) {
      this._handleError(res, error, 'Failed to delete map');
    }
  }

  /**
   * POST /api/v2/maps/:id/defeat-boss - Records boss defeat
   * @param {Request} req - HTTP request
   * @param {Response} res - HTTP response
   */
  async defeatBoss(req, res) {
    try {
      const mapId = req.params.id;
      const { playerId = 'default', playerLevel = 1, completionTime } = req.body;
      
      const defeatData = {
        mapId: mapId,
        playerId: playerId,
        playerLevel: playerLevel,
        completionTime: completionTime
      };
      
      const result = await this.progressService.recordBossDefeat(defeatData);
      
      res.json({
        success: true,
        data: {
          map: result.map.toJSON(),
          progress: result.progress,
          rewards: result.rewards
        },
        message: `Boss defeated in map "${result.map.name}"`
      });

    } catch (error) {
      this._handleError(res, error, 'Failed to record boss defeat');
    }
  }

  /**
   * POST /api/v2/maps/:id/reset-boss - Resets boss (admin)
   * @param {Request} req - HTTP request
   * @param {Response} res - HTTP response
   */
  async resetBoss(req, res) {
    try {
      const mapId = req.params.id;
      const resetMap = await this.mapService.resetBoss(mapId);
      
      res.json({
        success: true,
        data: resetMap.toJSON(),
        message: `Boss reset in map "${resetMap.name}"`
      });

    } catch (error) {
      this._handleError(res, error, 'Failed to reset boss');
    }
  }

  /**
   * GET /api/v2/maps/unlocked - Gets unlocked maps for player
   * @param {Request} req - HTTP request
   * @param {Response} res - HTTP response
   */
  async getUnlockedMaps(req, res) {
    try {
      const playerId = req.query.playerId || 'default';
      const playerLevel = parseInt(req.query.playerLevel) || 1;
      const achievements = req.query.achievements ? req.query.achievements.split(',') : [];
      
      const unlockedMaps = await this.progressService.getUnlockedMaps(playerId, playerLevel, achievements);
      
      res.json({
        success: true,
        data: unlockedMaps,
        count: unlockedMaps.length,
        playerInfo: {
          playerId: playerId,
          level: playerLevel,
          achievements: achievements
        }
      });

    } catch (error) {
      this._handleError(res, error, 'Failed to get unlocked maps');
    }
  }

  /**
   * GET /api/v2/maps/progression - Gets map progression tree
   * @param {Request} req - HTTP request
   * @param {Response} res - HTTP response
   */
  async getMapProgression(req, res) {
    try {
      const progression = await this.mapService.getMapProgression();
      
      res.json({
        success: true,
        data: progression
      });

    } catch (error) {
      this._handleError(res, error, 'Failed to get map progression');
    }
  }

  /**
   * GET /api/v2/maps/player/:playerId/progress - Gets player progress
   * @param {Request} req - HTTP request
   * @param {Response} res - HTTP response
   */
  async getPlayerProgress(req, res) {
    try {
      const playerId = req.params.playerId || 'default';
      const progress = await this.progressService.getPlayerProgress(playerId);
      
      res.json({
        success: true,
        data: progress || {
          playerId: playerId,
          mapProgress: [],
          statistics: {
            totalUnlocked: 0,
            totalCompleted: 0,
            totalPlayTime: 0
          }
        }
      });

    } catch (error) {
      this._handleError(res, error, 'Failed to get player progress');
    }
  }

  /**
   * GET /api/v2/maps/player/:playerId/analytics - Gets progression analytics
   * @param {Request} req - HTTP request
   * @param {Response} res - HTTP response
   */
  async getProgressionAnalytics(req, res) {
    try {
      const playerId = req.params.playerId || 'default';
      const analytics = await this.progressService.getProgressionAnalytics(playerId);
      
      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      this._handleError(res, error, 'Failed to get progression analytics');
    }
  }

  /**
   * POST /api/v2/maps/:id/unlock - Unlocks a map for player
   * @param {Request} req - HTTP request
   * @param {Response} res - HTTP response
   */
  async unlockMap(req, res) {
    try {
      const mapId = req.params.id;
      const { 
        playerId = 'default', 
        unlockedBy = 'manual',
        playerLevel = 1,
        sourceMapId,
        achievement
      } = req.body;
      
      const unlockData = {
        mapId: mapId,
        playerId: playerId,
        unlockedBy: unlockedBy,
        playerLevel: playerLevel,
        sourceMapId: sourceMapId,
        achievement: achievement
      };
      
      const progress = await this.progressService.unlockMap(unlockData);
      
      res.json({
        success: true,
        data: progress,
        message: `Map unlocked for player "${playerId}"`
      });

    } catch (error) {
      this._handleError(res, error, 'Failed to unlock map');
    }
  }

  /**
   * POST /api/v2/maps/:id/assets - Uploads map assets
   * @param {Request} req - HTTP request
   * @param {Response} res - HTTP response
   */
  async uploadAssets(req, res) {
    try {
      const mapId = req.params.id;
      
      // Extract files from multipart form data
      const assetFiles = {};
      
      if (req.files) {
        if (req.files.background) {
          assetFiles.background = req.files.background[0].buffer;
        }
        if (req.files.tileset) {
          assetFiles.tileset = req.files.tileset[0].buffer;
        }
        if (req.files.music) {
          assetFiles.music = req.files.music[0].buffer;
        }
        if (req.files.sounds) {
          assetFiles.sounds = req.files.sounds.map(file => file.buffer);
        }
        if (req.files.overlays) {
          assetFiles.overlays = req.files.overlays.map(file => file.buffer);
        }
      }
      
      if (Object.keys(assetFiles).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No asset files provided'
        });
      }
      
      const updatedMap = await this.mapService.uploadMapAssets(mapId, assetFiles);
      
      res.json({
        success: true,
        data: updatedMap.toJSON(),
        message: `Assets uploaded for map "${updatedMap.name}"`
      });

    } catch (error) {
      this._handleError(res, error, 'Failed to upload map assets');
    }
  }

  /**
   * GET /api/v2/maps/statistics - Gets repository statistics
   * @param {Request} req - HTTP request
   * @param {Response} res - HTTP response
   */
  async getStatistics(req, res) {
    try {
      const stats = await this.mapService.getStatistics();
      
      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      this._handleError(res, error, 'Failed to get statistics');
    }
  }

  /**
   * POST /api/v2/maps/bulk-import - Imports multiple maps from JSON
   * @param {Request} req - HTTP request
   * @param {Response} res - HTTP response
   */
  async bulkImport(req, res) {
    try {
      const { maps, overwrite = false } = req.body;
      
      if (!Array.isArray(maps) || maps.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Maps array is required and must not be empty'
        });
      }
      
      const results = {
        imported: 0,
        skipped: 0,
        errors: []
      };
      
      for (let i = 0; i < maps.length; i++) {
        try {
          const mapData = maps[i];
          
          // Check if map already exists
          let existingMap = null;
          try {
            existingMap = await this.mapService.getMap(mapData.id);
          } catch (error) {
            // Map doesn't exist, which is fine for import
          }
          
          if (existingMap && !overwrite) {
            results.skipped++;
            continue;
          }
          
          if (existingMap && overwrite) {
            await this.mapService.updateMap(mapData.id, mapData);
          } else {
            await this.mapService.createMap(mapData);
          }
          
          results.imported++;
          
        } catch (error) {
          results.errors.push({
            index: i,
            mapId: maps[i]?.id || 'unknown',
            error: error.message
          });
        }
      }
      
      res.json({
        success: true,
        data: results,
        message: `Bulk import completed: ${results.imported} imported, ${results.skipped} skipped, ${results.errors.length} errors`
      });

    } catch (error) {
      this._handleError(res, error, 'Failed to perform bulk import');
    }
  }

  /**
   * GET /api/v2/maps/export - Exports all maps as JSON
   * @param {Request} req - HTTP request
   * @param {Response} res - HTTP response
   */
  async exportMaps(req, res) {
    try {
      const maps = await this.mapService.getAllMaps();
      const exportData = {
        maps: maps.map(map => map.toJSON()),
        metadata: {
          exportDate: new Date().toISOString(),
          version: '2.0.0',
          mapCount: maps.length
        }
      };
      
      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=maps_export.json');
      
      res.json(exportData);

    } catch (error) {
      this._handleError(res, error, 'Failed to export maps');
    }
  }

  /**
   * Handles errors and sends appropriate HTTP responses
   * @param {Response} res - HTTP response
   * @param {Error} error - Error to handle
   * @param {string} defaultMessage - Default error message
   * @private
   */
  _handleError(res, error, defaultMessage) {
    console.error(`❌ MapController: ${defaultMessage}:`, error.message);
    
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let message = defaultMessage;
    
    if (error instanceof ValidationError) {
      statusCode = 400;
      errorCode = 'VALIDATION_ERROR';
      message = error.message;
    } else if (error instanceof NotFoundError) {
      statusCode = 404;
      errorCode = 'NOT_FOUND';
      message = error.message;
    } else if (error instanceof BusinessRuleError) {
      statusCode = 409;
      errorCode = 'BUSINESS_RULE_VIOLATION';
      message = error.message;
    }
    
    res.status(statusCode).json({
      success: false,
      error: message,
      errorCode: errorCode,
      timestamp: new Date().toISOString()
    });
  }
}