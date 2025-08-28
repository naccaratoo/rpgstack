import { MapId } from './MapId.js';

/**
 * MapRewards Value Object
 * 
 * Represents rewards given when completing a map, including experience,
 * gold, items, and map unlocks. Immutable with validation.
 */
export class MapRewards {
  /**
   * Creates new MapRewards
   * @param {Object} params - Parameters
   * @param {number} params.experience - Base experience reward (0-10000)
   * @param {Array<number>} params.goldRange - [min, max] gold reward range
   * @param {Array<string>} params.items - Array of item names dropped
   * @param {Array<string|MapId>} params.unlocks - Array of map IDs this unlocks
   * @throws {Error} If rewards data is invalid
   */
  constructor({ 
    experience = 0, 
    goldRange = [0, 0], 
    items = [], 
    unlocks = [] 
  }) {
    this.validateRewards({ experience, goldRange, items, unlocks });
    
    this.experience = experience;
    this.goldRange = [...goldRange]; // Defensive copy
    this.items = [...items]; // Defensive copy
    
    // Convert string IDs to MapId instances
    this.unlocks = unlocks.map(unlock => 
      unlock instanceof MapId ? unlock : new MapId(unlock)
    );
    
    Object.freeze(this.goldRange);
    Object.freeze(this.items);
    Object.freeze(this.unlocks);
    Object.freeze(this);
  }

  /**
   * Validates rewards data
   * @param {Object} data - Data to validate
   * @throws {Error} If data is invalid
   */
  validateRewards({ experience, goldRange, items, unlocks }) {
    // Experience validation
    if (!Number.isInteger(experience) || experience < 0) {
      throw new Error('Experience must be a non-negative integer');
    }
    if (experience > 10000) {
      throw new Error('Experience reward cannot exceed 10,000');
    }

    // Gold range validation
    if (!Array.isArray(goldRange) || goldRange.length !== 2) {
      throw new Error('Gold range must be an array with exactly 2 elements [min, max]');
    }
    
    const [minGold, maxGold] = goldRange;
    if (!Number.isInteger(minGold) || !Number.isInteger(maxGold)) {
      throw new Error('Gold range values must be integers');
    }
    if (minGold < 0 || maxGold < 0) {
      throw new Error('Gold range values cannot be negative');
    }
    if (minGold > maxGold) {
      throw new Error('Gold range minimum cannot exceed maximum');
    }
    if (maxGold > 100000) {
      throw new Error('Maximum gold reward cannot exceed 100,000');
    }

    // Items validation
    if (!Array.isArray(items)) {
      throw new Error('Items must be an array');
    }
    if (items.length > 20) {
      throw new Error('Cannot have more than 20 different item drops');
    }
    
    for (const item of items) {
      if (typeof item !== 'string' || item.trim().length === 0) {
        throw new Error('Item names must be non-empty strings');
      }
      if (item.length > 100) {
        throw new Error('Item names cannot exceed 100 characters');
      }
    }

    // Check for duplicate items
    const uniqueItems = new Set(items);
    if (uniqueItems.size !== items.length) {
      throw new Error('Item list cannot contain duplicates');
    }

    // Unlocks validation
    if (!Array.isArray(unlocks)) {
      throw new Error('Unlocks must be an array');
    }
    if (unlocks.length > 10) {
      throw new Error('Cannot unlock more than 10 maps at once');
    }
  }

  /**
   * Gets total reward value estimate
   * @returns {number} Estimated total value
   */
  getTotalValue() {
    const avgGold = (this.goldRange[0] + this.goldRange[1]) / 2;
    const itemValue = this.items.length * 50; // Estimate 50 gold per item
    const unlockValue = this.unlocks.length * 100; // Estimate 100 value per unlock
    
    return this.experience + avgGold + itemValue + unlockValue;
  }

  /**
   * Gets reward tier based on total value
   * @returns {string} Reward tier
   */
  getRewardTier() {
    const value = this.getTotalValue();
    if (value === 0) return 'none';
    if (value <= 100) return 'poor';
    if (value <= 300) return 'common';
    if (value <= 600) return 'uncommon';
    if (value <= 1000) return 'rare';
    if (value <= 2000) return 'epic';
    return 'legendary';
  }

  /**
   * Checks if rewards include items
   * @returns {boolean} True if has item drops
   */
  hasItems() {
    return this.items.length > 0;
  }

  /**
   * Checks if rewards unlock new maps
   * @returns {boolean} True if unlocks maps
   */
  hasUnlocks() {
    return this.unlocks.length > 0;
  }

  /**
   * Checks if rewards give experience
   * @returns {boolean} True if gives experience
   */
  hasExperience() {
    return this.experience > 0;
  }

  /**
   * Checks if rewards give gold
   * @returns {boolean} True if gives gold
   */
  hasGold() {
    return this.goldRange[1] > 0;
  }

  /**
   * Gets random gold amount within range
   * @returns {number} Random gold amount
   */
  rollGold() {
    const [min, max] = this.goldRange;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Creates new rewards with updated experience
   * @param {number} newExperience - New experience amount
   * @returns {MapRewards} New instance with updated experience
   */
  withExperience(newExperience) {
    return new MapRewards({
      experience: newExperience,
      goldRange: this.goldRange,
      items: this.items,
      unlocks: this.unlocks
    });
  }

  /**
   * Creates new rewards with updated gold range
   * @param {Array<number>} newGoldRange - New gold range [min, max]
   * @returns {MapRewards} New instance with updated gold range
   */
  withGoldRange(newGoldRange) {
    return new MapRewards({
      experience: this.experience,
      goldRange: newGoldRange,
      items: this.items,
      unlocks: this.unlocks
    });
  }

  /**
   * Adds item to reward list
   * @param {string} item - Item name to add
   * @returns {MapRewards} New instance with added item
   */
  addItem(item) {
    if (this.items.includes(item)) {
      return this; // No change if item already exists
    }
    
    const newItems = [...this.items, item];
    return new MapRewards({
      experience: this.experience,
      goldRange: this.goldRange,
      items: newItems,
      unlocks: this.unlocks
    });
  }

  /**
   * Removes item from reward list
   * @param {string} item - Item name to remove
   * @returns {MapRewards} New instance with removed item
   */
  removeItem(item) {
    const newItems = this.items.filter(i => i !== item);
    if (newItems.length === this.items.length) {
      return this; // No change if item wasn't found
    }
    
    return new MapRewards({
      experience: this.experience,
      goldRange: this.goldRange,
      items: newItems,
      unlocks: this.unlocks
    });
  }

  /**
   * Adds map unlock to reward list
   * @param {string|MapId} mapId - Map ID to unlock
   * @returns {MapRewards} New instance with added unlock
   */
  addUnlock(mapId) {
    const mapIdObj = mapId instanceof MapId ? mapId : new MapId(mapId);
    
    // Check if unlock already exists
    if (this.unlocks.some(unlock => unlock.equals(mapIdObj))) {
      return this; // No change if unlock already exists
    }
    
    const newUnlocks = [...this.unlocks, mapIdObj];
    return new MapRewards({
      experience: this.experience,
      goldRange: this.goldRange,
      items: this.items,
      unlocks: newUnlocks
    });
  }

  /**
   * Removes map unlock from reward list
   * @param {string|MapId} mapId - Map ID to remove from unlocks
   * @returns {MapRewards} New instance with removed unlock
   */
  removeUnlock(mapId) {
    const mapIdObj = mapId instanceof MapId ? mapId : new MapId(mapId);
    
    const newUnlocks = this.unlocks.filter(unlock => !unlock.equals(mapIdObj));
    if (newUnlocks.length === this.unlocks.length) {
      return this; // No change if unlock wasn't found
    }
    
    return new MapRewards({
      experience: this.experience,
      goldRange: this.goldRange,
      items: this.items,
      unlocks: newUnlocks
    });
  }

  /**
   * Scales all numeric rewards by a factor
   * @param {number} factor - Scale factor (e.g., 1.5 for 50% increase)
   * @returns {MapRewards} New instance with scaled rewards
   */
  scale(factor) {
    if (!Number.isFinite(factor) || factor < 0) {
      throw new Error('Scale factor must be a non-negative number');
    }
    
    const newExperience = Math.round(this.experience * factor);
    const newGoldRange = [
      Math.round(this.goldRange[0] * factor),
      Math.round(this.goldRange[1] * factor)
    ];
    
    return new MapRewards({
      experience: newExperience,
      goldRange: newGoldRange,
      items: this.items, // Items don't scale
      unlocks: this.unlocks // Unlocks don't scale
    });
  }

  /**
   * Equality comparison
   * @param {MapRewards} other - Other rewards to compare
   * @returns {boolean} True if equal
   */
  equals(other) {
    if (!(other instanceof MapRewards)) return false;
    
    return this.experience === other.experience &&
           this.goldRange[0] === other.goldRange[0] &&
           this.goldRange[1] === other.goldRange[1] &&
           JSON.stringify(this.items.sort()) === JSON.stringify(other.items.sort()) &&
           this.unlocks.length === other.unlocks.length &&
           this.unlocks.every(unlock => 
             other.unlocks.some(otherUnlock => unlock.equals(otherUnlock))
           );
  }

  /**
   * String representation
   * @returns {string} Rewards summary
   */
  toString() {
    const parts = [];
    
    if (this.hasExperience()) {
      parts.push(`${this.experience} XP`);
    }
    
    if (this.hasGold()) {
      parts.push(`${this.goldRange[0]}-${this.goldRange[1]} gold`);
    }
    
    if (this.hasItems()) {
      parts.push(`${this.items.length} items`);
    }
    
    if (this.hasUnlocks()) {
      parts.push(`unlocks ${this.unlocks.length} maps`);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'No rewards';
  }

  /**
   * JSON serialization
   * @returns {Object} Plain object for JSON
   */
  toJSON() {
    return {
      experience: this.experience,
      goldRange: this.goldRange,
      items: this.items,
      unlocks: this.unlocks.map(unlock => unlock.toJSON())
    };
  }

  /**
   * Creates MapRewards from plain object
   * @param {Object} data - Plain object
   * @returns {MapRewards} New instance
   */
  static fromJSON(data) {
    return new MapRewards(data);
  }

  /**
   * Predefined common reward sets
   */
  static get COMMON_REWARDS() {
    return {
      NONE: new MapRewards({
        experience: 0,
        goldRange: [0, 0],
        items: [],
        unlocks: []
      }),
      
      TUTORIAL: new MapRewards({
        experience: 50,
        goldRange: [10, 25],
        items: ['wooden_sword', 'health_potion'],
        unlocks: []
      }),
      
      EASY_BOSS: new MapRewards({
        experience: 100,
        goldRange: [25, 50],
        items: ['health_potion', 'mana_potion'],
        unlocks: []
      }),
      
      HARD_BOSS: new MapRewards({
        experience: 500,
        goldRange: [100, 200],
        items: ['rare_weapon', 'armor_piece', 'special_item'],
        unlocks: []
      })
    };
  }
}