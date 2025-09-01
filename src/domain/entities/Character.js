/**
 * Character Domain Entity
 * 
 * Core business entity representing an RPG character with complete
 * validation, business rules, and domain logic.
 * 
 * Business Rules:
 * - Must have unique immutable CharacterId
 * - Name must be 3-50 characters long
 * - Level must be between 1-100
 * - Must have valid Stats configuration
 * - AI type must be from approved list
 * - Sprite path follows naming conventions
 * - Creation/modification timestamps tracked
 */

import { CharacterId } from '../value-objects/CharacterId.js';
import { Stats } from '../value-objects/Stats.js';

export class Character {
  static VALID_AI_TYPES = [
    'aggressive',
    'passive', 
    'pack',
    'ambush',
    'guardian',
    'caster',
    'tank',
  ];

  static MIN_NAME_LENGTH = 3;
  static MAX_NAME_LENGTH = 50;
  static MIN_LEVEL = 1;
  static MAX_LEVEL = 100;

  constructor({
    id,
    name,
    level,
    stats,
    ai_type,
    sprite,
    gold = 0,
    experience = 0,
    skill_points = 0,
    classe = 'Lutador',
    anima = 100,
    critico = 1.0,
    metadata = {},
  }) {
    // Validate required parameters
    this.validateConstructorInput({
      id, name, level, stats, ai_type,
    });

    // Set core properties
    this._id = id instanceof CharacterId ? id : new CharacterId(id);
    this._name = name.trim();
    this._level = parseInt(level, 10);
    this._stats = stats instanceof Stats ? stats : new Stats(stats);
    this._aiType = ai_type;
    this._sprite = sprite || '';
    
    // Set optional properties
    this._gold = parseInt(gold, 10) || 0;
    this._experience = parseInt(experience, 10) || 0;
    this._skillPoints = parseInt(skill_points, 10) || 0;
    this._classe = classe || 'Lutador';
    this._anima = parseInt(anima, 10) || 100;
    this._critico = parseFloat(critico) || 1.0;
    
    // Set metadata with defaults
    this._metadata = {
      createdAt: metadata.createdAt || new Date().toISOString(),
      updatedAt: metadata.updatedAt || new Date().toISOString(),
      version: metadata.version || '2.0.0',
      legacy: metadata.legacy || false,
      ...metadata,
    };

    // Validate business rules
    this.validateBusinessRules();
    
    // Make immutable
    Object.freeze(this);
  }

  /**
   * Create new Character with generated ID
   * @param {Object} data - Character data without ID
   * @returns {Character} New character instance
   */
  static create(data) {
    return new Character({
      id: CharacterId.generate(),
      ...data,
    });
  }

  /**
   * Create Character from existing data (e.g., database load)
   * @param {Object} data - Complete character data with ID
   * @returns {Character} Character instance
   */
  static fromData(data) {
    return new Character(data);
  }

  /**
   * Validate constructor input
   * @private
   */
  validateConstructorInput({ id, name, level, stats, ai_type }) {
    if (!id) {
      throw new Error('Character ID is required');
    }
    
    if (!name || typeof name !== 'string') {
      throw new Error('Character name is required and must be a string');
    }
    
    if (typeof level === 'undefined' || level === null || level === '') {
      throw new Error('Character level is required');
    }
    
    if (!stats) {
      throw new Error('Character stats are required');
    }
    
    if (!ai_type || typeof ai_type !== 'string') {
      throw new Error('Character AI type is required and must be a string');
    }
  }

  /**
   * Validate business rules
   * @private
   */
  validateBusinessRules() {
    // Name validation
    if (this._name.length < Character.MIN_NAME_LENGTH) {
      throw new Error(
        `Character name must be at least ${Character.MIN_NAME_LENGTH} characters long`,
      );
    }
    
    if (this._name.length > Character.MAX_NAME_LENGTH) {
      throw new Error(
        `Character name cannot exceed ${Character.MAX_NAME_LENGTH} characters`,
      );
    }
    
    // Level validation
    if (this._level < Character.MIN_LEVEL || this._level > Character.MAX_LEVEL) {
      throw new Error(
        `Character level must be between ${Character.MIN_LEVEL} and ${Character.MAX_LEVEL}`,
      );
    }
    
    // AI type validation
    if (!Character.VALID_AI_TYPES.includes(this._aiType)) {
      throw new Error(
        `Invalid AI type: "${this._aiType}". ` +
        `Valid types: ${Character.VALID_AI_TYPES.join(', ')}`,
      );
    }
    
    // Numeric field validation
    if (this._gold < 0) {
      throw new Error('Gold cannot be negative');
    }
    
    if (this._experience < 0) {
      throw new Error('Experience cannot be negative');
    }
    
    if (this._skillPoints < 0) {
      throw new Error('Skill points cannot be negative');
    }
    
    // Classe validation
    const validClasses = ['Lutador', 'Armamentista', 'Arcano'];
    if (!validClasses.includes(this._classe)) {
      throw new Error(`Invalid classe: "${this._classe}". Valid classes: ${validClasses.join(', ')}`);
    }
    
    // Anima validation
    if (this._anima < 0) {
      throw new Error('Anima cannot be negative');
    }
    
    // Critico validation
    if (this._critico < 0) {
      throw new Error('Critico cannot be negative');
    }
  }

  // Getters
  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }

  get level() {
    return this._level;
  }

  get stats() {
    return this._stats;
  }

  get aiType() {
    return this._aiType;
  }

  get sprite() {
    return this._sprite;
  }

  get gold() {
    return this._gold;
  }

  get experience() {
    return this._experience;
  }

  get skillPoints() {
    return this._skillPoints;
  }
  
  get classe() {
    return this._classe;
  }
  
  get anima() {
    return this._anima;
  }
  
  get critico() {
    return this._critico;
  }

  get metadata() {
    return { ...this._metadata };
  }

  get createdAt() {
    return this._metadata.createdAt;
  }

  get updatedAt() {
    return this._metadata.updatedAt;
  }

  get version() {
    return this._metadata.version;
  }

  get isLegacy() {
    return this._metadata.legacy === true;
  }

  /**
   * Create updated version of character
   * @param {Object} changes - Changes to apply
   * @returns {Character} New character instance with changes
   */
  update(changes) {
    // Handle partial stats updates by merging with existing stats
    let updatedStats = this._stats.toObject();
    if (changes.stats !== undefined) {
      updatedStats = {
        ...updatedStats,
        ...changes.stats,
      };
    }

    const updatedData = {
      id: this._id,
      name: changes.name !== undefined ? changes.name : this._name,
      level: changes.level !== undefined ? changes.level : this._level,
      stats: updatedStats,
      ai_type: changes.ai_type !== undefined ? changes.ai_type : this._aiType,
      sprite: changes.sprite !== undefined ? changes.sprite : this._sprite,
      gold: changes.gold !== undefined ? changes.gold : this._gold,
      experience: changes.experience !== undefined ? changes.experience : this._experience,
      skill_points: changes.skill_points !== undefined ? changes.skill_points : this._skillPoints,
      classe: changes.classe !== undefined ? changes.classe : this._classe,
      anima: changes.anima !== undefined ? changes.anima : this._anima,
      critico: changes.critico !== undefined ? changes.critico : this._critico,
      metadata: {
        ...this._metadata,
        updatedAt: new Date().toISOString(),
        ...changes.metadata,
      },
    };

    return new Character(updatedData);
  }

  /**
   * Level up the character
   * @param {Object} statIncreases - Stat increases for level up
   * @returns {Character} New character instance with increased level
   */
  levelUp(statIncreases = {}) {
    if (this._level >= Character.MAX_LEVEL) {
      throw new Error('Character is already at maximum level');
    }

    const newStats = this._stats.withChanges({
      maxHP: (statIncreases.maxHP || 0) + this._stats.maxHP,
      attack: (statIncreases.attack || 0) + this._stats.attack,
      defense: (statIncreases.defense || 0) + this._stats.defense,
      hp: this._stats.hp, // HP doesn't automatically increase
    });

    return this.update({
      level: this._level + 1,
      stats: newStats.toObject(),
      skill_points: this._skillPoints + (statIncreases.skillPoints || 1),
    });
  }

  /**
   * Heal the character
   * @param {number} amount - Amount to heal
   * @returns {Character} New character instance with healed HP
   */
  heal(amount) {
    const newHP = Math.min(this._stats.hp + amount, this._stats.maxHP);
    const newStats = this._stats.withHP(newHP);
    
    return this.update({
      stats: newStats.toObject(),
    });
  }

  /**
   * Take damage
   * @param {number} amount - Damage amount
   * @returns {Character} New character instance with reduced HP
   */
  takeDamage(amount) {
    const newHP = Math.max(this._stats.hp - amount, 0);
    const newStats = this._stats.withHP(newHP);
    
    return this.update({
      stats: newStats.toObject(),
    });
  }

  /**
   * Add gold
   * @param {number} amount - Gold to add
   * @returns {Character} New character instance with updated gold
   */
  addGold(amount) {
    if (amount < 0) {
      throw new Error('Cannot add negative gold amount');
    }
    
    return this.update({
      gold: this._gold + amount,
    });
  }

  /**
   * Spend gold
   * @param {number} amount - Gold to spend
   * @returns {Character} New character instance with reduced gold
   */
  spendGold(amount) {
    if (amount < 0) {
      throw new Error('Cannot spend negative gold amount');
    }
    
    if (this._gold < amount) {
      throw new Error('Insufficient gold');
    }
    
    return this.update({
      gold: this._gold - amount,
    });
  }

  /**
   * Add experience
   * @param {number} amount - Experience to add
   * @returns {Character} New character instance with updated experience
   */
  addExperience(amount) {
    if (amount < 0) {
      throw new Error('Cannot add negative experience');
    }
    
    return this.update({
      experience: this._experience + amount,
    });
  }

  /**
   * Check if character is alive
   * @returns {boolean} True if HP > 0
   */
  isAlive() {
    return this._stats.hp > 0;
  }

  /**
   * Check if character is at full health
   * @returns {boolean} True if HP equals maxHP
   */
  isFullHealth() {
    return this._stats.isFullHealth();
  }

  /**
   * Get character's health percentage
   * @returns {number} Health percentage (0-100)
   */
  getHealthPercentage() {
    return this._stats.getHealthPercentage();
  }

  /**
   * Convert to plain object for serialization
   * @returns {Object} Plain object representation
   */
  toObject() {
    return {
      id: this._id.toString(),
      name: this._name,
      level: this._level,
      hp: this._stats.hp,
      maxHP: this._stats.maxHP,
      attack: this._stats.attack,
      defense: this._stats.defense,
      ai_type: this._aiType,
      sprite: this._sprite,
      gold: this._gold,
      experience: this._experience,
      skill_points: this._skillPoints,
      classe: this._classe,
      anima: this._anima,
      critico: this._critico,
      ...this._metadata,
    };
  }

  /**
   * Convert to legacy format for backward compatibility
   * @returns {Object} Legacy format object
   */
  toLegacyFormat() {
    const obj = this.toObject();
    
    // Legacy format uses different field names
    return {
      id: obj.id,
      name: obj.name,
      level: obj.level,
      hp: obj.hp,
      max_hp: obj.maxHP, // Legacy uses snake_case
      attack: obj.attack,
      defense: obj.defense,
      ai_type: obj.ai_type,
      sprite: obj.sprite,
      gold: obj.gold,
      experience: obj.experience,
      skill_points: obj.skill_points,
      classe: obj.classe,
      anima: obj.anima,
      critico: obj.critico,
      created_at: obj.createdAt,
      updated_at: obj.updatedAt,
      version: obj.version,
      legacy: obj.legacy,
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
   * Check equality with another Character
   * @param {Character} other - Other character
   * @returns {boolean} True if same ID
   */
  equals(other) {
    if (!(other instanceof Character)) {
      return false;
    }
    return this._id.equals(other._id);
  }

  /**
   * String representation
   * @returns {string} Character description
   */
  toString() {
    return `Character(${this._id.toString()}, "${this._name}", Level ${this._level})`;
  }
}