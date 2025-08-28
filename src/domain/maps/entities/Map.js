import { MapId } from '../value-objects/MapId.js';
import { MapDimensions } from '../value-objects/MapDimensions.js';
import { BossData } from '../value-objects/BossData.js';
import { UnlockRequirement } from '../value-objects/UnlockRequirement.js';
import { MapRewards } from '../value-objects/MapRewards.js';
import { MapAssets } from '../value-objects/MapAssets.js';

/**
 * Map Domain Entity
 * 
 * Represents a game map with all its associated data including dimensions,
 * boss encounters, unlock requirements, rewards, and assets. Immutable with
 * business logic for map operations and validation.
 */
export class Map {
  /**
   * Creates a new Map entity
   * @param {Object} params - Map parameters
   * @param {string|MapId} params.id - Unique map identifier
   * @param {string} params.name - Map display name (3-50 chars)
   * @param {string} params.description - Map description (optional, max 500 chars)
   * @param {number} params.difficulty - Map difficulty level (1-10)
   * @param {Object|MapDimensions} params.dimensions - Map size and layout
   * @param {Object|BossData} params.boss - Boss configuration
   * @param {Object|UnlockRequirement} params.unlockRequirement - Unlock conditions
   * @param {Object|MapRewards} params.rewards - Completion rewards
   * @param {Object|MapAssets} params.assets - Map asset references
   * @param {Object} params.metadata - System metadata
   * @throws {Error} If map data is invalid
   */
  constructor({
    id,
    name,
    description = null,
    difficulty,
    dimensions,
    boss,
    unlockRequirement,
    rewards,
    assets,
    metadata = {}
  }) {
    // Validate all input data
    this.validate({
      id, name, description, difficulty, dimensions, boss, 
      unlockRequirement, rewards, assets, metadata
    });

    // Convert parameters to proper value objects/entities
    this.id = id instanceof MapId ? id : new MapId(id);
    this.name = name.trim();
    this.description = description?.trim() || null;
    this.difficulty = difficulty;
    
    this.dimensions = dimensions instanceof MapDimensions 
      ? dimensions 
      : new MapDimensions(dimensions);
    
    this.boss = boss instanceof BossData 
      ? boss 
      : new BossData(boss);
    
    this.unlockRequirement = unlockRequirement instanceof UnlockRequirement 
      ? unlockRequirement 
      : new UnlockRequirement(unlockRequirement);
    
    this.rewards = rewards instanceof MapRewards 
      ? rewards 
      : new MapRewards(rewards);
    
    this.assets = assets instanceof MapAssets 
      ? assets 
      : new MapAssets(assets);

    // Metadata with defaults
    this.metadata = {
      createdAt: metadata.createdAt || new Date().toISOString(),
      updatedAt: metadata.updatedAt || new Date().toISOString(),
      version: metadata.version || '2.0.0',
      ...metadata
    };

    // Additional business rule validation
    this.validateBusinessRules();
    
    Object.freeze(this.metadata);
    Object.freeze(this);
  }

  /**
   * Validates basic map data
   * @param {Object} data - Data to validate
   * @throws {Error} If data is invalid
   */
  validate({
    id, name, description, difficulty, dimensions, boss, 
    unlockRequirement, rewards, assets, metadata
  }) {
    // ID validation (will be handled by MapId constructor)
    if (!id) {
      throw new Error('Map ID is required');
    }

    // Name validation
    if (!name || typeof name !== 'string') {
      throw new Error('Map name is required and must be a string');
    }
    
    const trimmedName = name.trim();
    if (trimmedName.length < 3) {
      throw new Error('Map name must be at least 3 characters long');
    }
    if (trimmedName.length > 50) {
      throw new Error('Map name cannot exceed 50 characters');
    }

    // Description validation (optional)
    if (description !== null && description !== undefined) {
      if (typeof description !== 'string') {
        throw new Error('Map description must be a string');
      }
      if (description.trim().length > 500) {
        throw new Error('Map description cannot exceed 500 characters');
      }
    }

    // Difficulty validation
    if (!Number.isInteger(difficulty)) {
      throw new Error('Map difficulty must be an integer');
    }
    if (difficulty < 1 || difficulty > 10) {
      throw new Error('Map difficulty must be between 1 and 10');
    }

    // Required object parameters
    const requiredObjects = {
      dimensions: 'Map dimensions are required',
      boss: 'Map boss data is required',
      unlockRequirement: 'Map unlock requirement is required',
      rewards: 'Map rewards are required',
      assets: 'Map assets are required'
    };

    for (const [param, errorMessage] of Object.entries(requiredObjects)) {
      if (!eval(param)) {
        throw new Error(errorMessage);
      }
    }

    // Metadata validation
    if (metadata && typeof metadata !== 'object') {
      throw new Error('Map metadata must be an object');
    }
  }

  /**
   * Validates business rules across value objects
   * @throws {Error} If business rules are violated
   */
  validateBusinessRules() {
    // Boss spawn point must be within map bounds
    if (!this.boss.isSpawnPointValid(this.dimensions)) {
      throw new Error('Boss spawn point is outside map boundaries');
    }

    // Difficulty scaling validation
    const mapDifficulty = this.difficulty;
    const bossDifficulty = this.boss.difficulty;
    
    // Boss should generally match or slightly exceed map difficulty
    if (bossDifficulty < mapDifficulty * 0.5) {
      console.warn(`Boss difficulty (${bossDifficulty}) seems too low for map difficulty (${mapDifficulty})`);
    }
    if (bossDifficulty > mapDifficulty * 2.0) {
      console.warn(`Boss difficulty (${bossDifficulty}) seems too high for map difficulty (${mapDifficulty})`);
    }

    // Rewards should scale with difficulty
    const rewardValue = this.rewards.getTotalValue();
    const expectedMinValue = mapDifficulty * 50; // Rough scaling
    
    if (rewardValue < expectedMinValue * 0.5) {
      console.warn(`Map rewards seem low for difficulty ${mapDifficulty}`);
    }

    // Large maps should have proportionally higher rewards
    const tileCount = this.dimensions.getTileCount();
    if (tileCount > 2000 && rewardValue < 500) {
      console.warn('Large maps should typically have substantial rewards');
    }
  }

  /**
   * Gets map complexity score based on various factors
   * @returns {number} Complexity score (1-100)
   */
  getComplexityScore() {
    let score = 0;
    
    // Base difficulty contribution
    score += this.difficulty * 5;
    
    // Size contribution
    const sizeCategory = this.dimensions.getSizeCategory();
    const sizeScores = { small: 5, medium: 10, large: 20, huge: 30 };
    score += sizeScores[sizeCategory] || 0;
    
    // Boss difficulty contribution
    score += this.boss.difficulty * 10;
    
    // Asset complexity contribution
    score += this.assets.getAssetCount() * 2;
    
    // Unlock requirement complexity
    const unlockDifficulty = this.unlockRequirement.getDifficulty();
    const unlockScores = { none: 0, very_easy: 2, easy: 5, medium: 10, hard: 15, very_hard: 20 };
    score += unlockScores[unlockDifficulty] || 0;
    
    return Math.min(Math.round(score), 100);
  }

  /**
   * Gets map category based on characteristics
   * @returns {string} Map category
   */
  getCategory() {
    const unlockType = this.unlockRequirement.type;
    
    if (unlockType === 'always') return 'starter';
    if (this.difficulty <= 2) return 'beginner';
    if (this.difficulty <= 4) return 'intermediate';
    if (this.difficulty <= 7) return 'advanced';
    return 'expert';
  }

  /**
   * Checks if map is unlocked for a given player state
   * @param {Object} playerState - Player's current state
   * @param {Array<string>} playerState.defeatedBosses - List of defeated boss IDs
   * @param {Array<string>} playerState.achievements - List of earned achievements
   * @param {number} playerState.level - Player's current level
   * @param {Array<string>} playerState.completedMaps - List of completed map IDs
   * @returns {boolean} True if map is unlocked
   */
  isUnlockedFor(playerState) {
    const req = this.unlockRequirement;
    
    switch (req.type) {
      case 'always':
        return true;
        
      case 'level':
        return playerState.level >= req.playerLevel;
        
      case 'achievement':
        return playerState.achievements.includes(req.achievement);
        
      case 'boss_defeat':
        if (req.targetBossId) {
          return playerState.defeatedBosses.includes(req.targetBossId.toString());
        }
        if (req.targetMapId) {
          return playerState.completedMaps.includes(req.targetMapId.toString());
        }
        return false;
        
      default:
        return false;
    }
  }

  /**
   * Gets estimated play time in minutes
   * @returns {number} Estimated minutes to complete
   */
  getEstimatedPlayTime() {
    const baseTime = this.dimensions.getTileCount() / 100; // Base on exploration time
    const difficultyMultiplier = 1 + (this.difficulty - 1) * 0.3;
    const bossTime = this.boss.difficulty * 5; // Boss fight time
    
    return Math.round((baseTime * difficultyMultiplier + bossTime));
  }

  /**
   * Checks if map has been completed (boss defeated)
   * @returns {boolean} True if boss is defeated
   */
  isCompleted() {
    return this.boss.isDefeated;
  }

  /**
   * Creates new Map with updated name
   * @param {string} newName - New map name
   * @returns {Map} New map instance with updated name
   */
  withName(newName) {
    return new Map({
      id: this.id,
      name: newName,
      description: this.description,
      difficulty: this.difficulty,
      dimensions: this.dimensions,
      boss: this.boss,
      unlockRequirement: this.unlockRequirement,
      rewards: this.rewards,
      assets: this.assets,
      metadata: { ...this.metadata, updatedAt: new Date().toISOString() }
    });
  }

  /**
   * Creates new Map with updated description
   * @param {string} newDescription - New description
   * @returns {Map} New map instance with updated description
   */
  withDescription(newDescription) {
    return new Map({
      id: this.id,
      name: this.name,
      description: newDescription,
      difficulty: this.difficulty,
      dimensions: this.dimensions,
      boss: this.boss,
      unlockRequirement: this.unlockRequirement,
      rewards: this.rewards,
      assets: this.assets,
      metadata: { ...this.metadata, updatedAt: new Date().toISOString() }
    });
  }

  /**
   * Creates new Map with updated difficulty
   * @param {number} newDifficulty - New difficulty level
   * @returns {Map} New map instance with updated difficulty
   */
  withDifficulty(newDifficulty) {
    return new Map({
      id: this.id,
      name: this.name,
      description: this.description,
      difficulty: newDifficulty,
      dimensions: this.dimensions,
      boss: this.boss,
      unlockRequirement: this.unlockRequirement,
      rewards: this.rewards,
      assets: this.assets,
      metadata: { ...this.metadata, updatedAt: new Date().toISOString() }
    });
  }

  /**
   * Creates new Map with defeated boss
   * @returns {Map} New map instance with boss defeated
   */
  defeatBoss() {
    return new Map({
      id: this.id,
      name: this.name,
      description: this.description,
      difficulty: this.difficulty,
      dimensions: this.dimensions,
      boss: this.boss.markDefeated(),
      unlockRequirement: this.unlockRequirement,
      rewards: this.rewards,
      assets: this.assets,
      metadata: { ...this.metadata, updatedAt: new Date().toISOString() }
    });
  }

  /**
   * Creates new Map with reset boss
   * @returns {Map} New map instance with boss reset
   */
  resetBoss() {
    return new Map({
      id: this.id,
      name: this.name,
      description: this.description,
      difficulty: this.difficulty,
      dimensions: this.dimensions,
      boss: this.boss.reset(),
      unlockRequirement: this.unlockRequirement,
      rewards: this.rewards,
      assets: this.assets,
      metadata: { ...this.metadata, updatedAt: new Date().toISOString() }
    });
  }

  /**
   * Creates new Map with updated dimensions
   * @param {MapDimensions} newDimensions - New dimensions
   * @returns {Map} New map instance with updated dimensions
   */
  withDimensions(newDimensions) {
    return new Map({
      id: this.id,
      name: this.name,
      description: this.description,
      difficulty: this.difficulty,
      dimensions: newDimensions,
      boss: this.boss,
      unlockRequirement: this.unlockRequirement,
      rewards: this.rewards,
      assets: this.assets,
      metadata: { ...this.metadata, updatedAt: new Date().toISOString() }
    });
  }

  /**
   * Creates new Map with updated assets
   * @param {MapAssets} newAssets - New assets
   * @returns {Map} New map instance with updated assets
   */
  withAssets(newAssets) {
    return new Map({
      id: this.id,
      name: this.name,
      description: this.description,
      difficulty: this.difficulty,
      dimensions: this.dimensions,
      boss: this.boss,
      unlockRequirement: this.unlockRequirement,
      rewards: this.rewards,
      assets: newAssets,
      metadata: { ...this.metadata, updatedAt: new Date().toISOString() }
    });
  }

  /**
   * Equality comparison
   * @param {Map} other - Other map to compare
   * @returns {boolean} True if maps are equal
   */
  equals(other) {
    return other instanceof Map &&
           this.id.equals(other.id) &&
           this.name === other.name &&
           this.description === other.description &&
           this.difficulty === other.difficulty &&
           this.dimensions.equals(other.dimensions) &&
           this.boss.equals(other.boss) &&
           this.unlockRequirement.equals(other.unlockRequirement) &&
           this.rewards.equals(other.rewards) &&
           this.assets.equals(other.assets);
  }

  /**
   * String representation
   * @returns {string} Map description
   */
  toString() {
    const status = this.isCompleted() ? 'COMPLETED' : 'ACTIVE';
    return `Map "${this.name}" (${this.id.toString()}) - Difficulty ${this.difficulty} - ${status}`;
  }

  /**
   * JSON serialization
   * @returns {Object} Plain object for JSON storage
   */
  toJSON() {
    return {
      id: this.id.toJSON(),
      name: this.name,
      description: this.description,
      difficulty: this.difficulty,
      dimensions: this.dimensions.toJSON(),
      boss: this.boss.toJSON(),
      unlockRequirement: this.unlockRequirement.toJSON(),
      rewards: this.rewards.toJSON(),
      assets: this.assets.toJSON(),
      metadata: this.metadata
    };
  }

  /**
   * Creates Map from plain object (JSON deserialization)
   * @param {Object} data - Plain object data
   * @returns {Map} New Map instance
   */
  static fromJSON(data) {
    return new Map(data);
  }

  /**
   * Creates a simple tutorial map
   * @param {string} characterId - Character to use as boss
   * @returns {Map} Tutorial map instance
   */
  static createTutorial(characterId) {
    return new Map({
      id: MapId.generate(),
      name: 'Tutorial Forest',
      description: 'A peaceful forest where new adventurers learn the basics',
      difficulty: 1,
      dimensions: { width: 15, height: 10 },
      boss: {
        characterId: characterId,
        spawnPoint: { x: 12, y: 5 },
        difficulty: 0.8,
        drops: ['wooden_sword', 'health_potion'],
        isDefeated: false
      },
      unlockRequirement: {
        type: 'always',
        description: 'Starting area - always available'
      },
      rewards: {
        experience: 50,
        goldRange: [10, 25],
        items: ['tutorial_completion_badge'],
        unlocks: []
      },
      assets: {
        background: 'tutorial_forest.jpg',
        tileset: 'grass_tiles.png',
        music: 'peaceful_forest.mp3'
      }
    });
  }
}