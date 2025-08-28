/**
 * Combat Value Object
 * 
 * Represents combat-related statistics and calculations for characters.
 * This value object encapsulates combat mechanics, damage calculations,
 * and battle-related business rules.
 * 
 * Features:
 * - Immutable combat statistics
 * - Damage calculation methods
 * - Critical hit probability
 * - Accuracy and evasion mechanics
 * - Combat effectiveness calculations
 */

export class Combat {
  /**
   * Create a Combat value object
   * @param {Object} data - Combat data
   * @param {number} data.attack - Base attack power (1-999)
   * @param {number} data.defense - Defense rating (1-999)
   * @param {number} data.accuracy - Hit chance percentage (0-100)
   * @param {number} data.evasion - Dodge chance percentage (0-100)
   * @param {number} data.criticalRate - Critical hit chance percentage (0-100)
   * @param {number} data.criticalDamage - Critical hit damage multiplier (1.0-5.0)
   */
  constructor({ attack, defense, accuracy = 85, evasion = 5, criticalRate = 5, criticalDamage = 1.5 }) {
    this.validateInput({ attack, defense, accuracy, evasion, criticalRate, criticalDamage });
    
    this._attack = Math.floor(attack);
    this._defense = Math.floor(defense);
    this._accuracy = Math.floor(accuracy);
    this._evasion = Math.floor(evasion);
    this._criticalRate = Math.floor(criticalRate);
    this._criticalDamage = parseFloat(criticalDamage);
    
    // Calculate derived statistics
    this._combatPower = this.calculateCombatPower();
    this._combatRating = this.calculateCombatRating();
    
    Object.freeze(this);
  }

  // Getters for combat statistics
  get attack() { return this._attack; }
  get defense() { return this._defense; }
  get accuracy() { return this._accuracy; }
  get evasion() { return this._evasion; }
  get criticalRate() { return this._criticalRate; }
  get criticalDamage() { return this._criticalDamage; }
  get combatPower() { return this._combatPower; }
  get combatRating() { return this._combatRating; }

  /**
   * Calculate damage dealt to a target
   * @param {Combat} targetCombat - Target's combat stats
   * @param {number} attackerLevel - Attacker's level (1-100)
   * @param {number} targetLevel - Target's level (1-100)
   * @returns {Object} Damage calculation result
   */
  calculateDamage(targetCombat, attackerLevel = 1, targetLevel = 1) {
    if (!(targetCombat instanceof Combat)) {
      throw new Error('Target combat stats must be a Combat instance');
    }

    // Base damage calculation
    const levelModifier = Math.max(0.5, attackerLevel / targetLevel);
    const baseDamage = Math.max(1, (this._attack - targetCombat._defense * 0.7) * levelModifier);
    
    // Hit chance calculation
    const hitChance = Math.max(10, Math.min(95, this._accuracy - targetCombat._evasion));
    
    // Critical hit calculation
    const isCritical = Math.random() * 100 < this._criticalRate;
    const finalDamage = Math.floor(baseDamage * (isCritical ? this._criticalDamage : 1.0));
    
    return {
      damage: finalDamage,
      hitChance,
      isCritical,
      canHit: Math.random() * 100 < hitChance,
    };
  }

  /**
   * Calculate combat effectiveness against a target
   * @param {Combat} targetCombat - Target's combat stats
   * @returns {number} Effectiveness rating (0-100)
   */
  calculateEffectiveness(targetCombat) {
    if (!(targetCombat instanceof Combat)) {
      throw new Error('Target combat stats must be a Combat instance');
    }

    const attackAdvantage = Math.max(0, (this._attack - targetCombat._defense) / this._attack);
    const accuracyAdvantage = Math.max(0, (this._accuracy - targetCombat._evasion) / 100);
    const criticalAdvantage = this._criticalRate * this._criticalDamage / 100;
    
    return Math.min(100, Math.floor((attackAdvantage + accuracyAdvantage + criticalAdvantage) * 100));
  }

  /**
   * Get combat power rating (simplified overall combat strength)
   * @returns {number} Combat power rating
   */
  calculateCombatPower() {
    return Math.floor(
      (this._attack * 1.2) + 
      (this._defense * 0.8) + 
      (this._accuracy * 0.3) + 
      (this._criticalRate * this._criticalDamage * 0.5)
    );
  }

  /**
   * Get combat rating classification
   * @returns {string} Combat rating (F, E, D, C, B, A, S, SS)
   */
  calculateCombatRating() {
    const power = this._combatPower;
    
    if (power >= 1000) return 'SS';
    if (power >= 800) return 'S';
    if (power >= 600) return 'A';
    if (power >= 400) return 'B';
    if (power >= 250) return 'C';
    if (power >= 150) return 'D';
    if (power >= 75) return 'E';
    return 'F';
  }

  /**
   * Create new Combat instance with modified attack
   * @param {number} attack - New attack value
   * @returns {Combat} New Combat instance
   */
  withAttack(attack) {
    return new Combat({
      attack,
      defense: this._defense,
      accuracy: this._accuracy,
      evasion: this._evasion,
      criticalRate: this._criticalRate,
      criticalDamage: this._criticalDamage,
    });
  }

  /**
   * Create new Combat instance with modified defense
   * @param {number} defense - New defense value
   * @returns {Combat} New Combat instance
   */
  withDefense(defense) {
    return new Combat({
      attack: this._attack,
      defense,
      accuracy: this._accuracy,
      evasion: this._evasion,
      criticalRate: this._criticalRate,
      criticalDamage: this._criticalDamage,
    });
  }

  /**
   * Create new Combat instance with multiple changes
   * @param {Object} changes - Changes to apply
   * @returns {Combat} New Combat instance
   */
  withChanges(changes) {
    return new Combat({
      attack: changes.attack !== undefined ? changes.attack : this._attack,
      defense: changes.defense !== undefined ? changes.defense : this._defense,
      accuracy: changes.accuracy !== undefined ? changes.accuracy : this._accuracy,
      evasion: changes.evasion !== undefined ? changes.evasion : this._evasion,
      criticalRate: changes.criticalRate !== undefined ? changes.criticalRate : this._criticalRate,
      criticalDamage: changes.criticalDamage !== undefined ? changes.criticalDamage : this._criticalDamage,
    });
  }

  /**
   * Check if two Combat instances are equal
   * @param {Combat} other - Other Combat instance
   * @returns {boolean} True if equal
   */
  equals(other) {
    if (!(other instanceof Combat)) return false;
    
    return (
      this._attack === other._attack &&
      this._defense === other._defense &&
      this._accuracy === other._accuracy &&
      this._evasion === other._evasion &&
      this._criticalRate === other._criticalRate &&
      this._criticalDamage === other._criticalDamage
    );
  }

  /**
   * Convert to plain object
   * @returns {Object} Plain object representation
   */
  toObject() {
    return {
      attack: this._attack,
      defense: this._defense,
      accuracy: this._accuracy,
      evasion: this._evasion,
      criticalRate: this._criticalRate,
      criticalDamage: this._criticalDamage,
      combatPower: this._combatPower,
      combatRating: this._combatRating,
    };
  }

  /**
   * Convert to JSON representation
   * @returns {string} JSON string
   */
  toJSON() {
    return JSON.stringify(this.toObject());
  }

  /**
   * Convert to string representation
   * @returns {string} String representation
   */
  toString() {
    return `Combat(ATK:${this._attack}, DEF:${this._defense}, ACC:${this._accuracy}%, EVA:${this._evasion}%, CR:${this._criticalRate}%, CD:${this._criticalDamage}x, Power:${this._combatPower}, Rating:${this._combatRating})`;
  }

  /**
   * Validate input data
   * @private
   * @param {Object} data - Input data to validate
   */
  validateInput({ attack, defense, accuracy, evasion, criticalRate, criticalDamage }) {
    // Validate required fields
    if (typeof attack !== 'number' || attack < 1 || attack > 999) {
      throw new Error('Attack must be a number between 1 and 999');
    }

    if (typeof defense !== 'number' || defense < 1 || defense > 999) {
      throw new Error('Defense must be a number between 1 and 999');
    }

    // Validate optional fields
    if (typeof accuracy !== 'number' || accuracy < 0 || accuracy > 100) {
      throw new Error('Accuracy must be a number between 0 and 100');
    }

    if (typeof evasion !== 'number' || evasion < 0 || evasion > 100) {
      throw new Error('Evasion must be a number between 0 and 100');
    }

    if (typeof criticalRate !== 'number' || criticalRate < 0 || criticalRate > 100) {
      throw new Error('Critical rate must be a number between 0 and 100');
    }

    if (typeof criticalDamage !== 'number' || criticalDamage < 1.0 || criticalDamage > 5.0) {
      throw new Error('Critical damage must be a number between 1.0 and 5.0');
    }

    // Business rule validations
    if (accuracy + evasion > 150) {
      throw new Error('Combined accuracy and evasion cannot exceed 150%');
    }

    if (criticalRate > 50 && criticalDamage > 3.0) {
      throw new Error('High critical rate (>50%) cannot combine with high critical damage (>3.0x)');
    }
  }

  /**
   * Create Combat instance from legacy format
   * @static
   * @param {Object} legacyData - Legacy combat data
   * @returns {Combat} Combat instance
   */
  static fromLegacyFormat(legacyData) {
    return new Combat({
      attack: legacyData.attack || legacyData.att || 1,
      defense: legacyData.defense || legacyData.def || 1,
      accuracy: legacyData.accuracy || legacyData.acc || 85,
      evasion: legacyData.evasion || legacyData.eva || 5,
      criticalRate: legacyData.criticalRate || legacyData.crit || 5,
      criticalDamage: legacyData.criticalDamage || legacyData.critDmg || 1.5,
    });
  }

  /**
   * Create balanced Combat stats for a given level
   * @static
   * @param {number} level - Character level (1-100)
   * @param {string} archetype - Combat archetype ('warrior', 'rogue', 'mage', 'tank')
   * @returns {Combat} Balanced Combat instance
   */
  static createForLevel(level, archetype = 'warrior') {
    const baseStats = {
      warrior: { attack: 1.2, defense: 1.0, accuracy: 0.9, evasion: 0.7, criticalRate: 0.8, criticalDamage: 1.3 },
      rogue: { attack: 1.0, defense: 0.7, accuracy: 1.2, evasion: 1.3, criticalRate: 1.5, criticalDamage: 1.8 },
      mage: { attack: 1.4, defense: 0.6, accuracy: 1.1, evasion: 0.8, criticalRate: 1.0, criticalDamage: 2.0 },
      tank: { attack: 0.8, defense: 1.5, accuracy: 0.8, evasion: 0.5, criticalRate: 0.3, criticalDamage: 1.1 },
    };

    const stats = baseStats[archetype] || baseStats.warrior;
    const levelMultiplier = Math.max(1, level);

    return new Combat({
      attack: Math.floor(levelMultiplier * 5 * stats.attack),
      defense: Math.floor(levelMultiplier * 3 * stats.defense),
      accuracy: Math.min(100, Math.floor(75 + levelMultiplier * 0.2 * stats.accuracy)),
      evasion: Math.min(100, Math.floor(levelMultiplier * 0.1 * stats.evasion)),
      criticalRate: Math.min(100, Math.floor(levelMultiplier * 0.1 * stats.criticalRate)),
      criticalDamage: Math.min(5.0, 1.0 + (levelMultiplier * 0.01 * stats.criticalDamage)),
    });
  }
}