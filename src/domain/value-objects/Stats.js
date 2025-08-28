/**
 * Stats Value Object
 * 
 * Represents character statistics with domain validation rules.
 * Ensures stat consistency and enforces business constraints.
 * 
 * Domain Rules:
 * - HP cannot exceed maxHP
 * - All stats must be non-negative integers
 * - MaxHP must be greater than 0
 * - Attack and defense have reasonable bounds
 * - Immutable once created
 */

export class Stats {
  constructor({ hp, maxHP, attack, defense }) {
    this.validateInput({ hp, maxHP, attack, defense });
    
    this._hp = parseInt(hp, 10);
    this._maxHP = parseInt(maxHP, 10);
    this._attack = parseInt(attack, 10);
    this._defense = parseInt(defense, 10);
    
    this.validateBusinessRules();
    Object.freeze(this);
  }

  /**
   * Create Stats from plain object
   * @param {Object} data - Stats data
   * @returns {Stats} Stats instance
   */
  static create(data) {
    return new Stats(data);
  }

  /**
   * Create Stats with full HP
   * @param {number} maxHP - Maximum HP value
   * @param {number} attack - Attack value
   * @param {number} defense - Defense value
   * @returns {Stats} Stats instance with HP = maxHP
   */
  static createWithFullHP(maxHP, attack, defense) {
    return new Stats({
      hp: maxHP,
      maxHP,
      attack,
      defense,
    });
  }

  /**
   * Validate input types and presence
   * @private
   */
  validateInput({ hp, maxHP, attack, defense }) {
    if (typeof hp === 'undefined' || hp === null || hp === '') {
      throw new Error('HP is required');
    }
    if (typeof maxHP === 'undefined' || maxHP === null || maxHP === '') {
      throw new Error('Max HP is required');
    }
    if (typeof attack === 'undefined' || attack === null || attack === '') {
      throw new Error('Attack is required');
    }
    if (typeof defense === 'undefined' || defense === null || defense === '') {
      throw new Error('Defense is required');
    }

    // Check if values can be converted to integers
    if (isNaN(parseInt(hp, 10))) {
      throw new Error('HP must be a valid number');
    }
    if (isNaN(parseInt(maxHP, 10))) {
      throw new Error('Max HP must be a valid number');
    }
    if (isNaN(parseInt(attack, 10))) {
      throw new Error('Attack must be a valid number');
    }
    if (isNaN(parseInt(defense, 10))) {
      throw new Error('Defense must be a valid number');
    }
  }

  /**
   * Validate business rules
   * @private
   */
  validateBusinessRules() {
    if (this._maxHP <= 0) {
      throw new Error('Max HP must be greater than 0');
    }
    
    if (this._hp < 0) {
      throw new Error('HP cannot be negative');
    }
    
    if (this._hp > this._maxHP) {
      throw new Error('HP cannot exceed Max HP');
    }
    
    if (this._attack < 0) {
      throw new Error('Attack cannot be negative');
    }
    
    if (this._defense < 0) {
      throw new Error('Defense cannot be negative');
    }

    // Reasonable upper bounds for game balance
    if (this._maxHP > 999999) {
      throw new Error('Max HP cannot exceed 999,999');
    }
    
    if (this._attack > 999999) {
      throw new Error('Attack cannot exceed 999,999');
    }
    
    if (this._defense > 999999) {
      throw new Error('Defense cannot exceed 999,999');
    }
  }

  // Getters
  get hp() {
    return this._hp;
  }

  get maxHP() {
    return this._maxHP;
  }

  get attack() {
    return this._attack;
  }

  get defense() {
    return this._defense;
  }

  /**
   * Check if character is at full health
   * @returns {boolean} True if HP equals maxHP
   */
  isFullHealth() {
    return this._hp === this._maxHP;
  }

  /**
   * Check if character is defeated (HP = 0)
   * @returns {boolean} True if HP is 0
   */
  isDefeated() {
    return this._hp === 0;
  }

  /**
   * Get health percentage (0-100)
   * @returns {number} Health percentage
   */
  getHealthPercentage() {
    return Math.round((this._hp / this._maxHP) * 100);
  }

  /**
   * Create new Stats with updated HP (for healing/damage)
   * @param {number} newHP - New HP value
   * @returns {Stats} New Stats instance
   */
  withHP(newHP) {
    return new Stats({
      hp: newHP,
      maxHP: this._maxHP,
      attack: this._attack,
      defense: this._defense,
    });
  }

  /**
   * Create new Stats with modified values
   * @param {Object} changes - Changes to apply
   * @returns {Stats} New Stats instance
   */
  withChanges(changes) {
    return new Stats({
      hp: changes.hp !== undefined ? changes.hp : this._hp,
      maxHP: changes.maxHP !== undefined ? changes.maxHP : this._maxHP,
      attack: changes.attack !== undefined ? changes.attack : this._attack,
      defense: changes.defense !== undefined ? changes.defense : this._defense,
    });
  }

  /**
   * Convert to plain object for serialization
   * @returns {Object} Plain object representation
   */
  toObject() {
    return {
      hp: this._hp,
      maxHP: this._maxHP,
      attack: this._attack,
      defense: this._defense,
    };
  }

  /**
   * JSON serialization
   * @returns {Object} Object for JSON
   */
  toJSON() {
    return this.toObject();
  }

  /**
   * Check equality with another Stats instance
   * @param {Stats} other - Other stats
   * @returns {boolean} True if all values are equal
   */
  equals(other) {
    if (!(other instanceof Stats)) {
      return false;
    }
    
    return (
      this._hp === other._hp &&
      this._maxHP === other._maxHP &&
      this._attack === other._attack &&
      this._defense === other._defense
    );
  }

  /**
   * String representation
   * @returns {string} Formatted stats string
   */
  toString() {
    return `Stats(HP: ${this._hp}/${this._maxHP}, ATK: ${this._attack}, DEF: ${this._defense})`;
  }
}