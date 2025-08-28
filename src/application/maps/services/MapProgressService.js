import { MapId } from '../../../domain/maps/value-objects/MapId.js';
import { CharacterId } from '../../../domain/value-objects/CharacterId.js';
import { ValidationError, NotFoundError, BusinessRuleError } from '../../errors/ApplicationErrors.js';
import { InputValidator } from '../../validation/InputValidator.js';

/**
 * MapProgressService - Application Layer Service
 * 
 * Manages player progress tracking across maps, including boss defeats,
 * unlock status, completion tracking, and achievement integration.
 * Provides comprehensive progress analytics and player journey mapping.
 */
export class MapProgressService {
  /**
   * Creates new MapProgressService
   * @param {MapRepository} mapRepository - Map data repository
   * @param {MapProgressRepository} progressRepository - Progress tracking repository
   * @param {CharacterRepository} characterRepository - Character repository
   * @param {InputValidator} validator - Input validation service
   */
  constructor(mapRepository, progressRepository, characterRepository, validator = new InputValidator()) {
    this.mapRepository = mapRepository;
    this.progressRepository = progressRepository;
    this.characterRepository = characterRepository;
    this.validator = validator;

    // Register validation schemas
    this._registerValidationSchemas();
  }

  /**
   * Registers validation schemas for progress operations
   * @private
   */
  _registerValidationSchemas() {
    // Player identification schema
    this.validator.registerSchema('PlayerId', {
      playerId: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 50,
        default: 'default'
      }
    });

    // Progress entry schema
    this.validator.registerSchema('ProgressEntry', {
      mapId: { type: 'string', required: true },
      unlocked: { type: 'boolean', default: true },
      bossDefeated: { type: 'boolean', default: false },
      completionCount: { type: 'number', integer: true, min: 0, default: 0 },
      bestCompletionTime: { type: 'number', min: 0 },
      totalPlayTime: { type: 'number', min: 0, default: 0 },
      firstUnlock: { type: 'string' }, // ISO timestamp
      lastPlayed: { type: 'string' },  // ISO timestamp
      playerLevel: { type: 'number', integer: true, min: 1, max: 100 }
    });

    // Boss defeat event schema
    this.validator.registerSchema('BossDefeatEvent', {
      mapId: { type: 'string', required: true },
      playerId: { type: 'string', required: true, default: 'default' },
      playerLevel: { type: 'number', integer: true, min: 1, max: 100 },
      completionTime: { type: 'number', min: 1 }, // milliseconds
      rewardsEarned: {
        type: 'object',
        properties: {
          experience: { type: 'number', min: 0 },
          gold: { type: 'number', min: 0 },
          items: { type: 'array' },
          unlockedMaps: { type: 'array' }
        }
      }
    });

    // Map unlock event schema
    this.validator.registerSchema('MapUnlockEvent', {
      mapId: { type: 'string', required: true },
      playerId: { type: 'string', required: true, default: 'default' },
      unlockedBy: {
        type: 'string',
        required: true,
        enum: ['boss_defeat', 'achievement', 'level', 'manual']
      },
      sourceMapId: { type: 'string' }, // Map that unlocked this one
      achievement: { type: 'string' },  // Achievement that unlocked this
      playerLevel: { type: 'number', integer: true, min: 1, max: 100 }
    });
  }

  /**
   * Gets player's progress for a specific map
   * @param {string} playerId - Player identifier
   * @param {string|MapId} mapId - Map identifier
   * @returns {Promise<Object|null>} Progress entry or null if not found
   */
  async getMapProgress(playerId, mapId) {
    try {
      const validatedPlayerId = await this.validator.validate('PlayerId', { playerId });
      const mapIdObj = typeof mapId === 'string' ? new MapId(mapId) : mapId;

      const progress = await this.progressRepository.findMapProgress(
        validatedPlayerId.playerId, 
        mapIdObj
      );

      return progress;
    } catch (error) {
      console.error(`❌ MapProgressService: Failed to get progress for map ${mapId}:`, error.message);
      throw error;
    }
  }

  /**
   * Gets all progress for a player
   * @param {string} playerId - Player identifier
   * @returns {Promise<Object>} Complete player progress
   */
  async getPlayerProgress(playerId) {
    try {
      const validatedPlayerId = await this.validator.validate('PlayerId', { playerId });
      
      const progress = await this.progressRepository.findPlayerProgress(validatedPlayerId.playerId);
      
      // Enhance with computed statistics
      if (progress) {
        progress.statistics = await this._computePlayerStatistics(validatedPlayerId.playerId);
      }

      console.log(`📊 MapProgressService: Retrieved progress for player "${validatedPlayerId.playerId}"`);
      return progress;

    } catch (error) {
      console.error(`❌ MapProgressService: Failed to get player progress:`, error.message);
      throw error;
    }
  }

  /**
   * Unlocks a map for a player
   * @param {Object} unlockData - Unlock event data
   * @returns {Promise<Object>} Updated progress entry
   * @throws {ValidationError} If data is invalid
   * @throws {NotFoundError} If map not found
   * @throws {BusinessRuleError} If unlock requirements not met
   */
  async unlockMap(unlockData) {
    try {
      const validatedData = await this.validator.validate('MapUnlockEvent', unlockData);
      
      // Verify map exists
      const map = await this.mapRepository.findById(new MapId(validatedData.mapId));
      if (!map) {
        throw new NotFoundError(`Map with ID ${validatedData.mapId} not found`);
      }

      // Check if already unlocked
      const existingProgress = await this.getMapProgress(validatedData.playerId, validatedData.mapId);
      if (existingProgress?.unlocked) {
        console.log(`📋 MapProgressService: Map "${map.name}" already unlocked for player "${validatedData.playerId}"`);
        return existingProgress;
      }

      // Validate unlock requirements if not manual
      if (validatedData.unlockedBy !== 'manual') {
        await this._validateUnlockRequirements(map, validatedData);
      }

      // Create or update progress entry
      const progressEntry = {
        mapId: validatedData.mapId,
        unlocked: true,
        bossDefeated: false,
        completionCount: 0,
        totalPlayTime: 0,
        firstUnlock: new Date().toISOString(),
        lastPlayed: new Date().toISOString(),
        playerLevel: validatedData.playerLevel || 1
      };

      const updatedProgress = await this.progressRepository.updateMapProgress(
        validatedData.playerId,
        new MapId(validatedData.mapId),
        progressEntry
      );

      console.log(`🔓 MapProgressService: Unlocked map "${map.name}" for player "${validatedData.playerId}" via ${validatedData.unlockedBy}`);
      
      // Check for cascade unlocks
      await this._processUnlockCascade(validatedData.playerId, map, validatedData);

      return updatedProgress;

    } catch (error) {
      console.error('❌ MapProgressService: Failed to unlock map:', error.message);
      throw error;
    }
  }

  /**
   * Records a boss defeat event and processes rewards
   * @param {Object} defeatData - Boss defeat event data
   * @returns {Promise<Object>} Updated progress and rewards
   */
  async recordBossDefeat(defeatData) {
    try {
      const validatedData = await this.validator.validate('BossDefeatEvent', defeatData);
      
      // Get map and verify it exists
      const map = await this.mapRepository.findById(new MapId(validatedData.mapId));
      if (!map) {
        throw new NotFoundError(`Map with ID ${validatedData.mapId} not found`);
      }

      // Check if map is unlocked for player
      const currentProgress = await this.getMapProgress(validatedData.playerId, validatedData.mapId);
      if (!currentProgress?.unlocked) {
        throw new BusinessRuleError(`Map "${map.name}" is not unlocked for player "${validatedData.playerId}"`);
      }

      // Check if boss already defeated
      if (currentProgress.bossDefeated) {
        throw new BusinessRuleError(`Boss in map "${map.name}" already defeated by player "${validatedData.playerId}"`);
      }

      // Update map to mark boss as defeated
      const defeatedMap = map.defeatBoss();
      await this.mapRepository.update(defeatedMap);

      // Calculate rewards
      const rewards = this._calculateRewards(map, validatedData);

      // Update progress
      const updatedProgress = {
        ...currentProgress,
        bossDefeated: true,
        completionCount: (currentProgress.completionCount || 0) + 1,
        lastPlayed: new Date().toISOString(),
        bestCompletionTime: validatedData.completionTime && (!currentProgress.bestCompletionTime || 
          validatedData.completionTime < currentProgress.bestCompletionTime) 
          ? validatedData.completionTime 
          : currentProgress.bestCompletionTime,
        totalPlayTime: (currentProgress.totalPlayTime || 0) + (validatedData.completionTime || 0)
      };

      await this.progressRepository.updateMapProgress(
        validatedData.playerId,
        new MapId(validatedData.mapId),
        updatedProgress
      );

      console.log(`⚔️ MapProgressService: Boss defeated in "${map.name}" by player "${validatedData.playerId}" - Rewards: ${JSON.stringify(rewards)}`);
      
      // Process map unlocks from rewards
      await this._processRewardUnlocks(validatedData.playerId, rewards, validatedData);

      return {
        progress: updatedProgress,
        rewards: rewards,
        map: defeatedMap
      };

    } catch (error) {
      console.error('❌ MapProgressService: Failed to record boss defeat:', error.message);
      throw error;
    }
  }

  /**
   * Gets unlocked maps for a player based on their current progress
   * @param {string} playerId - Player identifier
   * @param {number} playerLevel - Current player level
   * @param {Array<string>} achievements - Player achievements
   * @returns {Promise<Array<Object>>} Unlocked maps with progress info
   */
  async getUnlockedMaps(playerId, playerLevel = 1, achievements = []) {
    try {
      const validatedPlayerId = await this.validator.validate('PlayerId', { playerId });
      
      // Get player progress
      const progress = await this.getPlayerProgress(validatedPlayerId.playerId);
      const playerProgress = progress?.mapProgress || [];
      
      // Get all maps
      const allMaps = await this.mapRepository.findAll();
      
      // Build player state for unlock checking
      const playerState = {
        defeatedBosses: playerProgress
          .filter(p => p.bossDefeated)
          .map(p => p.mapId),
        achievements: achievements,
        level: playerLevel,
        completedMaps: playerProgress
          .filter(p => p.bossDefeated)
          .map(p => p.mapId)
      };

      // Check which maps are unlocked
      const unlockedMaps = [];
      
      for (const map of allMaps) {
        const isUnlocked = map.isUnlockedFor(playerState);
        const progressEntry = playerProgress.find(p => p.mapId === map.id.toString());
        
        if (isUnlocked) {
          unlockedMaps.push({
            map: map,
            progress: progressEntry || {
              unlocked: true,
              bossDefeated: false,
              completionCount: 0,
              totalPlayTime: 0
            }
          });
        }
      }

      console.log(`🔓 MapProgressService: Found ${unlockedMaps.length}/${allMaps.length} unlocked maps for player "${validatedPlayerId.playerId}"`);
      return unlockedMaps;

    } catch (error) {
      console.error('❌ MapProgressService: Failed to get unlocked maps:', error.message);
      throw error;
    }
  }

  /**
   * Gets progression analytics for a player
   * @param {string} playerId - Player identifier
   * @returns {Promise<Object>} Comprehensive progression analytics
   */
  async getProgressionAnalytics(playerId) {
    try {
      const validatedPlayerId = await this.validator.validate('PlayerId', { playerId });
      
      const playerProgress = await this.getPlayerProgress(validatedPlayerId.playerId);
      const allMaps = await this.mapRepository.findAll();
      
      if (!playerProgress) {
        return {
          playerId: validatedPlayerId.playerId,
          totalMaps: allMaps.length,
          unlockedMaps: 0,
          completedMaps: 0,
          progressPercentage: 0,
          averageCompletionTime: 0,
          totalPlayTime: 0,
          difficultyProgression: {},
          achievements: [],
          nextUnlocks: []
        };
      }

      const mapProgress = playerProgress.mapProgress || [];
      
      const analytics = {
        playerId: validatedPlayerId.playerId,
        totalMaps: allMaps.length,
        unlockedMaps: mapProgress.filter(p => p.unlocked).length,
        completedMaps: mapProgress.filter(p => p.bossDefeated).length,
        progressPercentage: Math.round((mapProgress.filter(p => p.bossDefeated).length / allMaps.length) * 100),
        averageCompletionTime: this._calculateAverageCompletionTime(mapProgress),
        totalPlayTime: mapProgress.reduce((total, p) => total + (p.totalPlayTime || 0), 0),
        difficultyProgression: this._analyzeDifficultyProgression(mapProgress, allMaps),
        recentActivity: this._getRecentActivity(mapProgress),
        nextUnlocks: await this._getPotentialUnlocks(validatedPlayerId.playerId, playerProgress)
      };

      console.log(`📊 MapProgressService: Generated analytics for player "${validatedPlayerId.playerId}" - ${analytics.completedMaps}/${analytics.totalMaps} maps completed`);
      return analytics;

    } catch (error) {
      console.error('❌ MapProgressService: Failed to get progression analytics:', error.message);
      throw error;
    }
  }

  /**
   * Resets progress for a specific map (admin function)
   * @param {string} playerId - Player identifier
   * @param {string|MapId} mapId - Map identifier
   * @returns {Promise<boolean>} True if reset successful
   */
  async resetMapProgress(playerId, mapId) {
    try {
      const validatedPlayerId = await this.validator.validate('PlayerId', { playerId });
      const mapIdObj = typeof mapId === 'string' ? new MapId(mapId) : mapId;

      // Reset map boss status
      const map = await this.mapRepository.findById(mapIdObj);
      if (map) {
        const resetMap = map.resetBoss();
        await this.mapRepository.update(resetMap);
      }

      // Remove progress entry
      const success = await this.progressRepository.deleteMapProgress(
        validatedPlayerId.playerId, 
        mapIdObj
      );

      if (success) {
        console.log(`🔄 MapProgressService: Reset progress for map ${mapIdObj.toString()} for player "${validatedPlayerId.playerId}"`);
      }

      return success;

    } catch (error) {
      console.error(`❌ MapProgressService: Failed to reset progress for map ${mapId}:`, error.message);
      throw error;
    }
  }

  /**
   * Validates unlock requirements for a map
   * @param {Map} map - Map to validate
   * @param {Object} unlockData - Unlock event data
   * @throws {BusinessRuleError} If requirements not met
   * @private
   */
  async _validateUnlockRequirements(map, unlockData) {
    const requirement = map.unlockRequirement;
    
    switch (requirement.type) {
      case 'level':
        if (!unlockData.playerLevel || unlockData.playerLevel < requirement.playerLevel) {
          throw new BusinessRuleError(`Player level ${requirement.playerLevel} required to unlock "${map.name}"`);
        }
        break;
        
      case 'boss_defeat':
        if (requirement.targetMapId) {
          const targetProgress = await this.getMapProgress(unlockData.playerId, requirement.targetMapId.toString());
          if (!targetProgress?.bossDefeated) {
            throw new BusinessRuleError(`Must defeat boss in target map to unlock "${map.name}"`);
          }
        }
        break;
        
      case 'achievement':
        // This would need integration with achievement system
        console.warn(`Achievement unlock validation not implemented for "${requirement.achievement}"`);
        break;
    }
  }

  /**
   * Processes unlock cascades when a map is unlocked
   * @param {string} playerId - Player identifier  
   * @param {Map} unlockedMap - Map that was unlocked
   * @param {Object} unlockData - Original unlock data
   * @private
   */
  async _processUnlockCascade(playerId, unlockedMap, unlockData) {
    // Check if unlocking this map should unlock others
    const allMaps = await this.mapRepository.findAll();
    
    for (const map of allMaps) {
      if (map.unlockRequirement.type === 'boss_defeat' &&
          map.unlockRequirement.targetMapId?.equals(unlockedMap.id)) {
        
        // Check if already unlocked
        const existing = await this.getMapProgress(playerId, map.id.toString());
        if (!existing?.unlocked) {
          // Recursively unlock
          await this.unlockMap({
            mapId: map.id.toString(),
            playerId: playerId,
            unlockedBy: 'boss_defeat',
            sourceMapId: unlockedMap.id.toString(),
            playerLevel: unlockData.playerLevel
          });
        }
      }
    }
  }

  /**
   * Calculates rewards for boss defeat
   * @param {Map} map - Completed map
   * @param {Object} defeatData - Defeat event data
   * @returns {Object} Calculated rewards
   * @private
   */
  _calculateRewards(map, defeatData) {
    const baseRewards = map.rewards;
    
    return {
      experience: baseRewards.experience,
      gold: baseRewards.rollGold(), // Random gold within range
      items: [...baseRewards.items],
      unlockedMaps: baseRewards.unlocks.map(unlock => unlock.toString())
    };
  }

  /**
   * Processes map unlocks from rewards
   * @param {string} playerId - Player identifier
   * @param {Object} rewards - Earned rewards
   * @param {Object} originalData - Original defeat data
   * @private
   */
  async _processRewardUnlocks(playerId, rewards, originalData) {
    for (const mapId of rewards.unlockedMaps) {
      try {
        await this.unlockMap({
          mapId: mapId,
          playerId: playerId,
          unlockedBy: 'boss_defeat',
          sourceMapId: originalData.mapId,
          playerLevel: originalData.playerLevel
        });
      } catch (error) {
        console.warn(`⚠️ MapProgressService: Failed to unlock reward map ${mapId}:`, error.message);
      }
    }
  }

  /**
   * Computes detailed player statistics
   * @param {string} playerId - Player identifier
   * @returns {Promise<Object>} Player statistics
   * @private
   */
  async _computePlayerStatistics(playerId) {
    const progress = await this.progressRepository.findPlayerProgress(playerId);
    const mapProgress = progress?.mapProgress || [];
    
    return {
      totalUnlocked: mapProgress.filter(p => p.unlocked).length,
      totalCompleted: mapProgress.filter(p => p.bossDefeated).length,
      totalPlayTime: mapProgress.reduce((sum, p) => sum + (p.totalPlayTime || 0), 0),
      averageCompletionTime: this._calculateAverageCompletionTime(mapProgress),
      bestCompletionTime: Math.min(...mapProgress
        .filter(p => p.bestCompletionTime)
        .map(p => p.bestCompletionTime)),
      lastActivity: Math.max(...mapProgress
        .filter(p => p.lastPlayed)
        .map(p => new Date(p.lastPlayed).getTime()))
    };
  }

  /**
   * Calculates average completion time from progress data
   * @param {Array<Object>} mapProgress - Map progress entries
   * @returns {number} Average completion time in milliseconds
   * @private
   */
  _calculateAverageCompletionTime(mapProgress) {
    const completedMaps = mapProgress.filter(p => p.bossDefeated && p.bestCompletionTime);
    if (completedMaps.length === 0) return 0;
    
    const totalTime = completedMaps.reduce((sum, p) => sum + p.bestCompletionTime, 0);
    return Math.round(totalTime / completedMaps.length);
  }

  /**
   * Analyzes difficulty progression for player
   * @param {Array<Object>} mapProgress - Map progress entries
   * @param {Array<Map>} allMaps - All available maps
   * @returns {Object} Difficulty progression analysis
   * @private
   */
  _analyzeDifficultyProgression(mapProgress, allMaps) {
    const completedMaps = mapProgress.filter(p => p.bossDefeated);
    const progression = {};
    
    for (let difficulty = 1; difficulty <= 10; difficulty++) {
      const mapsAtDifficulty = allMaps.filter(m => m.difficulty === difficulty);
      const completedAtDifficulty = completedMaps.filter(p => {
        const map = allMaps.find(m => m.id.toString() === p.mapId);
        return map && map.difficulty === difficulty;
      });
      
      progression[difficulty] = {
        total: mapsAtDifficulty.length,
        completed: completedAtDifficulty.length,
        percentage: mapsAtDifficulty.length > 0 
          ? Math.round((completedAtDifficulty.length / mapsAtDifficulty.length) * 100)
          : 0
      };
    }
    
    return progression;
  }

  /**
   * Gets recent activity for player
   * @param {Array<Object>} mapProgress - Map progress entries
   * @returns {Array<Object>} Recent activity entries
   * @private
   */
  _getRecentActivity(mapProgress) {
    return mapProgress
      .filter(p => p.lastPlayed)
      .sort((a, b) => new Date(b.lastPlayed) - new Date(a.lastPlayed))
      .slice(0, 10)
      .map(p => ({
        mapId: p.mapId,
        action: p.bossDefeated ? 'completed' : 'played',
        timestamp: p.lastPlayed
      }));
  }

  /**
   * Gets potential unlocks for player based on current progress
   * @param {string} playerId - Player identifier
   * @param {Object} playerProgress - Current player progress
   * @returns {Promise<Array<Object>>} Potential unlocks
   * @private
   */
  async _getPotentialUnlocks(playerId, playerProgress) {
    const allMaps = await this.mapRepository.findAll();
    const currentProgress = playerProgress?.mapProgress || [];
    
    const potentialUnlocks = [];
    
    for (const map of allMaps) {
      const existing = currentProgress.find(p => p.mapId === map.id.toString());
      
      if (!existing?.unlocked) {
        const requirement = map.unlockRequirement;
        let canUnlock = false;
        let description = '';
        
        switch (requirement.type) {
          case 'always':
            canUnlock = true;
            description = 'Available now';
            break;
            
          case 'boss_defeat':
            if (requirement.targetMapId) {
              const targetProgress = currentProgress.find(p => p.mapId === requirement.targetMapId.toString());
              canUnlock = targetProgress?.bossDefeated || false;
              description = canUnlock 
                ? 'Ready to unlock' 
                : `Defeat boss in ${requirement.targetMapId.toString()}`;
            }
            break;
            
          case 'level':
            description = `Requires level ${requirement.playerLevel}`;
            break;
            
          case 'achievement':
            description = `Requires achievement: ${requirement.achievement}`;
            break;
        }
        
        potentialUnlocks.push({
          map: map,
          canUnlock: canUnlock,
          requirement: requirement,
          description: description
        });
      }
    }
    
    return potentialUnlocks.sort((a, b) => {
      if (a.canUnlock && !b.canUnlock) return -1;
      if (!a.canUnlock && b.canUnlock) return 1;
      return a.map.difficulty - b.map.difficulty;
    });
  }
}