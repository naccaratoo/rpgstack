/**
 * Skill Domain Entity
 * 
 * Core business entity representing an RPG skill with complete
 * validation, business rules, and domain logic.
 * 
 * Business Rules:
 * - Must have unique immutable SkillId
 * - Name must be 3-50 characters long
 * - Type must be from approved list (combat, magic, passive, utility)
 * - Level must be between 1-10
 * - Must have valid damage value
 * - Cooldown must be non-negative
 * - Prerequisites must be valid skill references
 * - Creation/modification timestamps tracked
 */

import { SkillId } from '../value-objects/SkillId.js';

export class Skill {
  static VALID_TYPES = [
    'combat',
    'magic',
    'passive',
    'utility',
    'healing',
    'buff',
    'debuff'
  ];

  // Character Classes (for personagem)
  static VALID_CHARACTER_CLASSES = [
    'Lutador',
    'Armamentista',
    'Arcano',
    'Oráculo',
    'Artífice',
    'Guardião da Natureza',
    'Mercador-Diplomata',
    'Curandeiro Ritualista'
  ];

  // Skill Categories (for skill classification)
  static VALID_SKILL_CATEGORIES = [
    'Damage',
    'Utility', 
    'Damage&Utility'
  ];

  static MIN_NAME_LENGTH = 3;
  static MAX_NAME_LENGTH = 50;
  static MIN_LEVEL = 1;
  static MAX_LEVEL = 10;
  static MIN_COOLDOWN = 0;
  static MAX_COOLDOWN = 100;

  constructor({
    id,
    name,
    description = '',
    type,
    classe = 'Lutador',
    skill_category = 'Damage',
    level = 1,
    damage = 0,
    sprite = null,
    anima_cost = 0,
    cooldown = 0,
    duration = 0,
    prerequisites = [],
    effects = [],
    metadata = {},
    created_at = new Date(),
    updated_at = new Date()
  }) {
    // Validate required parameters
    this.validateConstructorInput({
      id, name, type, classe, skill_category, level, damage,
      anima_cost, cooldown, duration
    });

    this._id = id instanceof SkillId ? id : new SkillId(id);
    this._name = name;
    this._description = description;
    this._type = type;
    this._classe = classe;
    this._skill_category = skill_category;
    this._level = level;
    this._damage = damage;
    this._sprite = sprite;
    this._anima_cost = anima_cost;
    this._cooldown = cooldown;
    this._duration = duration;
    this._prerequisites = [...prerequisites];
    this._effects = [...effects];
    this._metadata = { ...metadata };
    this._created_at = new Date(created_at);
    this._updated_at = new Date(updated_at);

    // Validate constructed object
    this.validate();

    // Freeze object to ensure immutability
    Object.freeze(this);
  }

  validateConstructorInput({ id, name, type, classe, skill_category, level, damage, anima_cost, cooldown, duration }) {
    if (!id) throw new Error('Skill ID is required');
    if (!name) throw new Error('Skill name is required');
    if (!type) throw new Error('Skill type is required');
    if (!skill_category) throw new Error('Skill category is required');
    if (level === undefined || level === null) throw new Error('Skill level is required');
    if (damage === undefined || damage === null) throw new Error('Damage is required');
    if (anima_cost === undefined || anima_cost === null) throw new Error('Custo de Ânima is required');
    if (cooldown === undefined || cooldown === null) throw new Error('Cooldown is required');
    if (duration === undefined || duration === null) throw new Error('Duration is required');
  }

  validate() {
    this.validateName();
    this.validateType();
    this.validateClasse();
    this.validateSkillCategory();
    this.validateLevel();
    this.validateDamage();
    this.validateManaCost();
    this.validateCooldown();
    this.validateDuration();
  }

  validateName() {
    if (typeof this._name !== 'string') {
      throw new Error('Skill name must be a string');
    }
    
    if (this._name.length < Skill.MIN_NAME_LENGTH || this._name.length > Skill.MAX_NAME_LENGTH) {
      throw new Error(`Skill name must be between ${Skill.MIN_NAME_LENGTH} and ${Skill.MAX_NAME_LENGTH} characters`);
    }
  }

  validateType() {
    if (!Skill.VALID_TYPES.includes(this._type)) {
      throw new Error(`Invalid skill type: ${this._type}. Must be one of: ${Skill.VALID_TYPES.join(', ')}`);
    }
  }

  validateClasse() {
    if (!Skill.VALID_CHARACTER_CLASSES.includes(this._classe)) {
      throw new Error(`Invalid character class: ${this._classe}. Must be one of: ${Skill.VALID_CHARACTER_CLASSES.join(', ')}`);
    }
  }

  validateSkillCategory() {
    if (!Skill.VALID_SKILL_CATEGORIES.includes(this._skill_category)) {
      throw new Error(`Invalid skill category: ${this._skill_category}. Must be one of: ${Skill.VALID_SKILL_CATEGORIES.join(', ')}`);
    }
  }

  validateLevel() {
    if (!Number.isInteger(this._level) || this._level < Skill.MIN_LEVEL || this._level > Skill.MAX_LEVEL) {
      throw new Error(`Skill level must be an integer between ${Skill.MIN_LEVEL} and ${Skill.MAX_LEVEL}`);
    }
  }

  validateDamage() {
    if (typeof this._damage !== 'number' || this._damage < 0) {
      throw new Error('Damage must be a non-negative number');
    }
  }

  validateManaCost() {
    if (typeof this._anima_cost !== 'number' || this._anima_cost < 0) {
      throw new Error('Custo de Ânima must be a non-negative number');
    }
  }

  validateCooldown() {
    if (typeof this._cooldown !== 'number' || this._cooldown < Skill.MIN_COOLDOWN || this._cooldown > Skill.MAX_COOLDOWN) {
      throw new Error(`Cooldown must be a number between ${Skill.MIN_COOLDOWN} and ${Skill.MAX_COOLDOWN}`);
    }
  }

  validateDuration() {
    if (typeof this._duration !== 'number' || this._duration < 0) {
      throw new Error('Duration must be a non-negative number');
    }
  }

  // Getters
  get id() { return this._id; }
  get name() { return this._name; }
  get description() { return this._description; }
  get type() { return this._type; }
  get classe() { return this._classe; }
  get skill_category() { return this._skill_category; }
  get level() { return this._level; }
  get damage() { return this._damage; }
  get sprite() { return this._sprite; }
  get anima_cost() { return this._anima_cost; }
  get cooldown() { return this._cooldown; }
  get duration() { return this._duration; }
  get prerequisites() { return [...this._prerequisites]; }
  get effects() { return [...this._effects]; }
  get metadata() { return { ...this._metadata }; }
  get created_at() { return new Date(this._created_at); }
  get updated_at() { return new Date(this._updated_at); }

  // Business methods
  isPassive() {
    return this._type === 'passive';
  }

  isCombatSkill() {
    return this._type === 'combat' || this._type === 'magic';
  }

  isUtilitySkill() {
    return this._type === 'utility';
  }

  // Skill Category methods
  isDamageSkill() {
    return this._skill_category === 'Damage';
  }

  isUtilityCategory() {
    return this._skill_category === 'Utility';
  }

  isDamageAndUtility() {
    return this._skill_category === 'Damage&Utility';
  }

  getSkillCategory() {
    return this._skill_category;
  }

  hasPrerequisites() {
    return this._prerequisites.length > 0;
  }

  hasEffects() {
    return this._effects.length > 0;
  }

  getDamage() {
    return this._damage;
  }

  // Factory methods
  static create({
    name,
    description,
    type,
    classe = 'Lutador',
    skill_category = 'Damage',
    level = 1,
    damage = 0,
    sprite = null,
    anima_cost = 0,
    cooldown = 0,
    duration = 0,
    prerequisites = [],
    effects = [],
    metadata = {}
  }) {
    return new Skill({
      id: SkillId.generate(),
      name,
      description,
      type,
      classe,
      skill_category,
      level,
      damage,
      sprite,
      anima_cost,
      cooldown,
      duration,
      prerequisites,
      effects,
      metadata,
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  // Update methods (return new instances for immutability)
  updateLevel(newLevel) {
    return new Skill({
      id: this._id,
      name: this._name,
      description: this._description,
      type: this._type,
      classe: this._classe,
      level: newLevel,
      damage: this._damage,
      sprite: this._sprite,
      anima_cost: this._anima_cost,
      cooldown: this._cooldown,
      duration: this._duration,
      prerequisites: this._prerequisites,
      effects: this._effects,
      metadata: this._metadata,
      created_at: this._created_at,
      updated_at: new Date()
    });
  }

  updateDescription(newDescription) {
    return new Skill({
      id: this._id,
      name: this._name,
      description: newDescription,
      type: this._type,
      classe: this._classe,
      level: this._level,
      damage: this._damage,
      sprite: this._sprite,
      anima_cost: this._anima_cost,
      cooldown: this._cooldown,
      duration: this._duration,
      prerequisites: this._prerequisites,
      effects: this._effects,
      metadata: this._metadata,
      created_at: this._created_at,
      updated_at: new Date()
    });
  }

  // Serialization
  toJSON() {
    return {
      id: this._id.value,
      name: this._name,
      description: this._description,
      type: this._type,
      classe: this._classe,
      skill_category: this._skill_category,
      level: this._level,
      damage: this._damage,
      sprite: this._sprite,
      anima_cost: this._anima_cost,
      cooldown: this._cooldown,
      duration: this._duration,
      prerequisites: this._prerequisites,
      effects: this._effects,
      metadata: this._metadata,
      created_at: this._created_at.toISOString(),
      updated_at: this._updated_at.toISOString()
    };
  }

  toString() {
    return `Skill(${this._id.value}, ${this._name}, ${this._type})`;
  }

  equals(other) {
    return other instanceof Skill && this._id.equals(other._id);
  }
}