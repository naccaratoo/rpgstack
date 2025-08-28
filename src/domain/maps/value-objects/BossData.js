import { CharacterId } from '../../value-objects/CharacterId.js';

/**
 * BossData Value Object
 * 
 * Represents boss configuration for a map, including character reference,
 * positioning, difficulty scaling, and defeat tracking.
 */
export class BossData {
  /**
   * Creates new BossData
   * @param {Object} params - Parameters
   * @param {string|CharacterId} params.characterId - Reference to character entity
   * @param {Object} params.spawnPoint - Boss spawn coordinates {x, y}
   * @param {number} params.difficulty - Difficulty multiplier (0.5-5.0)
   * @param {Array<string>} params.drops - Special items dropped on defeat
   * @param {boolean} params.isDefeated - Defeat status (default: false)
   * @throws {Error} If boss data is invalid
   */
  constructor({ 
    characterId, 
    spawnPoint, 
    difficulty = 1.0, 
    drops = [], 
    isDefeated = false 
  }) {
    this.validateBossData({ characterId, spawnPoint, difficulty, drops, isDefeated });
    
    // Ensure characterId is a CharacterId instance
    this.characterId = characterId instanceof CharacterId 
      ? characterId 
      : new CharacterId(characterId);
    
    this.spawnPoint = { ...spawnPoint }; // Defensive copy
    this.difficulty = difficulty;
    this.drops = [...drops]; // Defensive copy
    this.isDefeated = isDefeated;
    
    Object.freeze(this.spawnPoint);
    Object.freeze(this.drops);
    Object.freeze(this);
  }

  /**
   * Validates boss data
   * @param {Object} data - Data to validate
   * @throws {Error} If data is invalid
   */
  validateBossData({ characterId, spawnPoint, difficulty, drops, isDefeated }) {
    // Character ID validation
    if (!characterId) {
      throw new Error('Boss characterId is required');
    }

    // Spawn point validation
    if (!spawnPoint || typeof spawnPoint !== 'object') {
      throw new Error('Boss spawn point is required and must be an object');
    }
    
    if (!Number.isInteger(spawnPoint.x) || spawnPoint.x < 0) {
      throw new Error('Boss spawn point x must be a non-negative integer');
    }
    
    if (!Number.isInteger(spawnPoint.y) || spawnPoint.y < 0) {
      throw new Error('Boss spawn point y must be a non-negative integer');
    }

    // Difficulty validation
    if (!Number.isFinite(difficulty)) {
      throw new Error('Boss difficulty must be a number');
    }
    
    if (difficulty < 0.5) {
      throw new Error('Boss difficulty cannot be less than 0.5 (too easy)');
    }
    
    if (difficulty > 5.0) {
      throw new Error('Boss difficulty cannot exceed 5.0 (too hard)');
    }

    // Drops validation
    if (!Array.isArray(drops)) {
      throw new Error('Boss drops must be an array');
    }
    
    if (drops.length > 10) {
      throw new Error('Boss cannot have more than 10 different drops');
    }
    
    for (const drop of drops) {
      if (typeof drop !== 'string' || drop.trim().length === 0) {
        throw new Error('Boss drop items must be non-empty strings');
      }
    }

    // Defeat status validation
    if (typeof isDefeated !== 'boolean') {
      throw new Error('Boss isDefeated must be a boolean');
    }
  }

  /**
   * Gets difficulty category
   * @returns {string} Difficulty category
   */
  getDifficultyCategory() {
    if (this.difficulty <= 0.7) return 'very_easy';
    if (this.difficulty <= 1.0) return 'normal';
    if (this.difficulty <= 1.5) return 'hard';
    if (this.difficulty <= 2.5) return 'very_hard';
    if (this.difficulty <= 4.0) return 'nightmare';
    return 'impossible';
  }

  /**
   * Checks if boss is positioned within map bounds
   * @param {MapDimensions} mapDimensions - Map dimensions to check against
   * @returns {boolean} True if spawn point is valid
   */
  isSpawnPointValid(mapDimensions) {
    return this.spawnPoint.x < mapDimensions.width &&
           this.spawnPoint.y < mapDimensions.height;
  }

  /**
   * Gets distance from spawn point to given coordinates
   * @param {number} x - Target x coordinate
   * @param {number} y - Target y coordinate  
   * @returns {number} Distance in tiles
   */
  getDistanceFrom(x, y) {
    const dx = this.spawnPoint.x - x;
    const dy = this.spawnPoint.y - y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Creates new BossData with updated spawn point
   * @param {Object} newSpawnPoint - New spawn coordinates {x, y}
   * @returns {BossData} New instance with updated spawn point
   */
  withSpawnPoint(newSpawnPoint) {
    return new BossData({
      characterId: this.characterId,
      spawnPoint: newSpawnPoint,
      difficulty: this.difficulty,
      drops: this.drops,
      isDefeated: this.isDefeated
    });
  }

  /**
   * Creates new BossData with updated difficulty
   * @param {number} newDifficulty - New difficulty multiplier
   * @returns {BossData} New instance with updated difficulty
   */
  withDifficulty(newDifficulty) {
    return new BossData({
      characterId: this.characterId,
      spawnPoint: this.spawnPoint,
      difficulty: newDifficulty,
      drops: this.drops,
      isDefeated: this.isDefeated
    });
  }

  /**
   * Creates new BossData marking boss as defeated
   * @returns {BossData} New instance with boss defeated
   */
  markDefeated() {
    return new BossData({
      characterId: this.characterId,
      spawnPoint: this.spawnPoint,
      difficulty: this.difficulty,
      drops: this.drops,
      isDefeated: true
    });
  }

  /**
   * Creates new BossData resetting defeat status
   * @returns {BossData} New instance with boss not defeated
   */
  reset() {
    return new BossData({
      characterId: this.characterId,
      spawnPoint: this.spawnPoint,
      difficulty: this.difficulty,
      drops: this.drops,
      isDefeated: false
    });
  }

  /**
   * Adds new drop to boss loot table
   * @param {string} item - Item to add to drops
   * @returns {BossData} New instance with added drop
   */
  addDrop(item) {
    if (this.drops.includes(item)) {
      return this; // No change if item already exists
    }
    
    const newDrops = [...this.drops, item];
    return new BossData({
      characterId: this.characterId,
      spawnPoint: this.spawnPoint,
      difficulty: this.difficulty,
      drops: newDrops,
      isDefeated: this.isDefeated
    });
  }

  /**
   * Removes drop from boss loot table
   * @param {string} item - Item to remove from drops
   * @returns {BossData} New instance with removed drop
   */
  removeDrop(item) {
    const newDrops = this.drops.filter(drop => drop !== item);
    if (newDrops.length === this.drops.length) {
      return this; // No change if item wasn't found
    }
    
    return new BossData({
      characterId: this.characterId,
      spawnPoint: this.spawnPoint,
      difficulty: this.difficulty,
      drops: newDrops,
      isDefeated: this.isDefeated
    });
  }

  /**
   * Equality comparison
   * @param {BossData} other - Other BossData to compare
   * @returns {boolean} True if equal
   */
  equals(other) {
    return other instanceof BossData &&
           this.characterId.equals(other.characterId) &&
           this.spawnPoint.x === other.spawnPoint.x &&
           this.spawnPoint.y === other.spawnPoint.y &&
           this.difficulty === other.difficulty &&
           this.isDefeated === other.isDefeated &&
           JSON.stringify(this.drops) === JSON.stringify(other.drops);
  }

  /**
   * String representation
   * @returns {string} Boss description
   */
  toString() {
    const status = this.isDefeated ? 'DEFEATED' : 'ALIVE';
    return `Boss(${this.characterId.toString()}) at (${this.spawnPoint.x},${this.spawnPoint.y}) - ${status}`;
  }

  /**
   * JSON serialization
   * @returns {Object} Plain object for JSON
   */
  toJSON() {
    return {
      characterId: this.characterId.toJSON(),
      spawnPoint: this.spawnPoint,
      difficulty: this.difficulty,
      drops: this.drops,
      isDefeated: this.isDefeated
    };
  }

  /**
   * Creates BossData from plain object
   * @param {Object} data - Plain object
   * @returns {BossData} New instance
   */
  static fromJSON(data) {
    return new BossData(data);
  }
}