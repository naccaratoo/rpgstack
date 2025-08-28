import { MapId } from './MapId.js';
import { CharacterId } from '../../value-objects/CharacterId.js';

/**
 * UnlockRequirement Value Object
 * 
 * Represents the requirements that must be met to unlock a map.
 * Supports various unlock types including boss defeats, achievements, 
 * level requirements, and always-available maps.
 */
export class UnlockRequirement {
  /**
   * Creates new UnlockRequirement
   * @param {Object} params - Parameters
   * @param {string} params.type - Unlock type: 'boss_defeat', 'achievement', 'level', 'always'
   * @param {string|MapId} params.targetMapId - Map that must be completed (for boss_defeat)
   * @param {string|CharacterId} params.targetBossId - Specific boss that must be defeated
   * @param {string} params.achievement - Achievement name required
   * @param {number} params.playerLevel - Minimum player level
   * @param {string} params.description - Human-readable requirement description
   * @throws {Error} If requirement is invalid
   */
  constructor({ 
    type, 
    targetMapId = null, 
    targetBossId = null, 
    achievement = null, 
    playerLevel = null, 
    description = null 
  }) {
    this.validateRequirement({ 
      type, 
      targetMapId, 
      targetBossId, 
      achievement, 
      playerLevel, 
      description 
    });
    
    this.type = type;
    
    // Convert string IDs to proper value objects if provided
    this.targetMapId = targetMapId ? 
      (targetMapId instanceof MapId ? targetMapId : new MapId(targetMapId)) : 
      null;
    
    this.targetBossId = targetBossId ? 
      (targetBossId instanceof CharacterId ? targetBossId : new CharacterId(targetBossId)) : 
      null;
    
    this.achievement = achievement;
    this.playerLevel = playerLevel;
    this.description = description || this.generateDescription();
    
    Object.freeze(this);
  }

  /**
   * Validates unlock requirement
   * @param {Object} data - Data to validate
   * @throws {Error} If requirement is invalid
   */
  validateRequirement({ type, targetMapId, targetBossId, achievement, playerLevel, description }) {
    // Type validation
    const validTypes = ['boss_defeat', 'achievement', 'level', 'always'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid unlock type: ${type}. Must be one of: ${validTypes.join(', ')}`);
    }

    // Type-specific validation
    switch (type) {
      case 'boss_defeat':
        if (!targetMapId && !targetBossId) {
          throw new Error('boss_defeat type requires either targetMapId or targetBossId');
        }
        if (targetMapId && targetBossId) {
          throw new Error('boss_defeat type cannot have both targetMapId and targetBossId');
        }
        break;

      case 'achievement':
        if (!achievement || typeof achievement !== 'string' || achievement.trim().length === 0) {
          throw new Error('achievement type requires a non-empty achievement name');
        }
        if (achievement.length > 100) {
          throw new Error('Achievement name cannot exceed 100 characters');
        }
        break;

      case 'level':
        if (!Number.isInteger(playerLevel) || playerLevel < 1 || playerLevel > 100) {
          throw new Error('level type requires playerLevel between 1 and 100');
        }
        break;

      case 'always':
        // No additional validation needed
        break;
    }

    // Player level validation (if provided for any type)
    if (playerLevel !== null) {
      if (!Number.isInteger(playerLevel) || playerLevel < 1 || playerLevel > 100) {
        throw new Error('Player level must be an integer between 1 and 100');
      }
    }

    // Description validation (if provided)
    if (description !== null) {
      if (typeof description !== 'string' || description.trim().length === 0) {
        throw new Error('Description must be a non-empty string if provided');
      }
      if (description.length > 500) {
        throw new Error('Description cannot exceed 500 characters');
      }
    }
  }

  /**
   * Generates default description based on requirement type
   * @returns {string} Generated description
   */
  generateDescription() {
    switch (this.type) {
      case 'boss_defeat':
        if (this.targetMapId) {
          return `Defeat the boss in map ${this.targetMapId.toString()}`;
        }
        if (this.targetBossId) {
          return `Defeat boss ${this.targetBossId.toString()}`;
        }
        return 'Defeat required boss';

      case 'achievement':
        return `Unlock achievement: ${this.achievement}`;

      case 'level':
        return `Reach player level ${this.playerLevel}`;

      case 'always':
        return 'Always available';

      default:
        return 'Custom unlock requirement';
    }
  }

  /**
   * Gets requirement difficulty level
   * @returns {string} Difficulty category
   */
  getDifficulty() {
    switch (this.type) {
      case 'always':
        return 'none';
      
      case 'level':
        if (this.playerLevel <= 5) return 'very_easy';
        if (this.playerLevel <= 15) return 'easy';
        if (this.playerLevel <= 30) return 'medium';
        if (this.playerLevel <= 50) return 'hard';
        return 'very_hard';
      
      case 'boss_defeat':
        return 'medium'; // Depends on boss difficulty
      
      case 'achievement':
        return 'variable'; // Depends on achievement
      
      default:
        return 'unknown';
    }
  }

  /**
   * Checks if requirement allows multiple unlock paths
   * @returns {boolean} True if multiple paths possible
   */
  hasAlternatives() {
    // Can be extended to support OR conditions between requirements
    return false;
  }

  /**
   * Checks if this requirement conflicts with another
   * @param {UnlockRequirement} other - Other requirement
   * @returns {boolean} True if conflicting
   */
  conflictsWith(other) {
    // Level requirements can conflict if they're different
    if (this.type === 'level' && other.type === 'level') {
      return this.playerLevel !== other.playerLevel;
    }
    
    // Boss defeat requirements conflict if they target different things
    if (this.type === 'boss_defeat' && other.type === 'boss_defeat') {
      const thisTarget = this.targetMapId || this.targetBossId;
      const otherTarget = other.targetMapId || other.targetBossId;
      return !thisTarget.equals(otherTarget);
    }
    
    // Achievement requirements conflict if they're different achievements
    if (this.type === 'achievement' && other.type === 'achievement') {
      return this.achievement !== other.achievement;
    }
    
    return false;
  }

  /**
   * Creates requirement with updated description
   * @param {string} newDescription - New description
   * @returns {UnlockRequirement} New instance with updated description
   */
  withDescription(newDescription) {
    return new UnlockRequirement({
      type: this.type,
      targetMapId: this.targetMapId,
      targetBossId: this.targetBossId,
      achievement: this.achievement,
      playerLevel: this.playerLevel,
      description: newDescription
    });
  }

  /**
   * Creates compound requirement (for future OR/AND logic)
   * @param {UnlockRequirement} other - Other requirement
   * @param {string} operator - 'AND' or 'OR'
   * @returns {UnlockRequirement} Compound requirement (future implementation)
   */
  combine(other, operator = 'AND') {
    // Future implementation for complex requirements
    // For now, return this requirement
    console.warn('Compound requirements not yet implemented');
    return this;
  }

  /**
   * Equality comparison
   * @param {UnlockRequirement} other - Other requirement
   * @returns {boolean} True if equal
   */
  equals(other) {
    if (!(other instanceof UnlockRequirement)) return false;
    
    return this.type === other.type &&
           this.achievement === other.achievement &&
           this.playerLevel === other.playerLevel &&
           this.description === other.description &&
           ((this.targetMapId === null && other.targetMapId === null) ||
            (this.targetMapId && other.targetMapId && this.targetMapId.equals(other.targetMapId))) &&
           ((this.targetBossId === null && other.targetBossId === null) ||
            (this.targetBossId && other.targetBossId && this.targetBossId.equals(other.targetBossId)));
  }

  /**
   * String representation
   * @returns {string} Requirement description
   */
  toString() {
    return this.description;
  }

  /**
   * JSON serialization
   * @returns {Object} Plain object for JSON
   */
  toJSON() {
    return {
      type: this.type,
      targetMapId: this.targetMapId?.toJSON() || null,
      targetBossId: this.targetBossId?.toJSON() || null,
      achievement: this.achievement,
      playerLevel: this.playerLevel,
      description: this.description
    };
  }

  /**
   * Creates UnlockRequirement from plain object
   * @param {Object} data - Plain object
   * @returns {UnlockRequirement} New instance
   */
  static fromJSON(data) {
    return new UnlockRequirement(data);
  }

  /**
   * Predefined common requirements
   */
  static get COMMON_REQUIREMENTS() {
    return {
      ALWAYS_AVAILABLE: new UnlockRequirement({ 
        type: 'always',
        description: 'Starting area - always available'
      }),
      
      TUTORIAL_COMPLETE: new UnlockRequirement({
        type: 'achievement',
        achievement: 'tutorial_complete',
        description: 'Complete the tutorial'
      }),
      
      FIRST_BOSS: new UnlockRequirement({
        type: 'boss_defeat',
        targetBossId: 'TUTORIAL01',
        description: 'Defeat the tutorial boss'
      }),
      
      LEVEL_10: new UnlockRequirement({
        type: 'level',
        playerLevel: 10,
        description: 'Reach level 10'
      })
    };
  }
}