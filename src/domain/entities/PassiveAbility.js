/**
 * PassiveAbility Domain Entity
 * 
 * Core business entity representing an ancestral passive ability with complete
 * validation, business rules, and domain logic.
 * 
 * Business Rules:
 * - Must have unique immutable PassiveAbilityId
 * - Name must be 3-50 characters long
 * - Must belong to one of the 15 valid cultures
 * - Trigger must be from approved list
 * - Effect must be a valid effect object
 * - Must have cultural metadata and lore
 * - Creation/modification timestamps tracked
 */

import { PassiveAbilityId } from '../value-objects/PassiveAbilityId.js';

export class PassiveAbility {
  static VALID_CULTURES = [
    'Romana',
    'Chinesa',
    'Eslava',
    'Grega',
    'Asteca',
    'Italiana',
    'Japonesa',
    'Lakota',
    'Viking',
    'Abássida',
    'Vitoriana',
    'Iorubá',
    'Russa',
    'Chinesa Imperial',
    'Ashanti'
  ];

  static VALID_TRIGGERS = [
    'battle_start',
    'defend',
    'low_hp',
    'per_turn',
    'on_critical',
    'when_attacked',
    'ally_low_hp',
    'enemy_defeated',
    'spell_cast',
    'passive_always'
  ];

  static VALID_EFFECT_TYPES = [
    'stat_bonus',
    'regeneration',
    'resistance',
    'critical_bonus',
    'speed_bonus',
    'elemental_resistance',
    'mental_resistance',
    'anima_regeneration',
    'damage_bonus',
    'defense_bonus'
  ];

  static MIN_NAME_LENGTH = 3;
  static MAX_NAME_LENGTH = 50;
  static MIN_DESCRIPTION_LENGTH = 10;
  static MAX_DESCRIPTION_LENGTH = 500;

  constructor({
    id,
    name,
    description,
    culture,
    trigger,
    effect,
    cultural_lore = '',
    icon = null,
    rarity = 'common',
    metadata = {},
    created_at = new Date(),
    updated_at = new Date()
  }) {
    // Validate required parameters
    this.validateConstructorInput({
      id, name, description, culture, trigger, effect
    });

    this._id = id instanceof PassiveAbilityId ? id : new PassiveAbilityId(id);
    this._name = name.trim();
    this._description = description.trim();
    this._culture = culture;
    this._trigger = trigger;
    this._effect = effect;
    this._cultural_lore = cultural_lore.trim();
    this._icon = icon;
    this._rarity = rarity;
    this._metadata = { ...metadata };
    this._created_at = new Date(created_at);
    this._updated_at = new Date(updated_at);

    // Validate constructed object
    this.validate();

    // Freeze object to ensure immutability
    Object.freeze(this);
  }

  validateConstructorInput({ id, name, description, culture, trigger, effect }) {
    if (!id) throw new Error('PassiveAbility ID is required');
    if (!name) throw new Error('PassiveAbility name is required');
    if (!description) throw new Error('PassiveAbility description is required');
    if (!culture) throw new Error('PassiveAbility culture is required');
    if (!trigger) throw new Error('PassiveAbility trigger is required');
    if (!effect) throw new Error('PassiveAbility effect is required');
  }

  validate() {
    this.validateName();
    this.validateDescription();
    this.validateCulture();
    this.validateTrigger();
    this.validateEffect();
    this.validateRarity();
  }

  validateName() {
    if (typeof this._name !== 'string') {
      throw new Error('PassiveAbility name must be a string');
    }
    
    if (this._name.length < PassiveAbility.MIN_NAME_LENGTH || this._name.length > PassiveAbility.MAX_NAME_LENGTH) {
      throw new Error(`PassiveAbility name must be between ${PassiveAbility.MIN_NAME_LENGTH} and ${PassiveAbility.MAX_NAME_LENGTH} characters`);
    }
  }

  validateDescription() {
    if (typeof this._description !== 'string') {
      throw new Error('PassiveAbility description must be a string');
    }
    
    if (this._description.length < PassiveAbility.MIN_DESCRIPTION_LENGTH || this._description.length > PassiveAbility.MAX_DESCRIPTION_LENGTH) {
      throw new Error(`PassiveAbility description must be between ${PassiveAbility.MIN_DESCRIPTION_LENGTH} and ${PassiveAbility.MAX_DESCRIPTION_LENGTH} characters`);
    }
  }

  validateCulture() {
    if (!PassiveAbility.VALID_CULTURES.includes(this._culture)) {
      throw new Error(`Invalid culture: ${this._culture}. Must be one of: ${PassiveAbility.VALID_CULTURES.join(', ')}`);
    }
  }

  validateTrigger() {
    if (!PassiveAbility.VALID_TRIGGERS.includes(this._trigger)) {
      throw new Error(`Invalid trigger: ${this._trigger}. Must be one of: ${PassiveAbility.VALID_TRIGGERS.join(', ')}`);
    }
  }

  validateEffect() {
    if (!this._effect || typeof this._effect !== 'object') {
      throw new Error('PassiveAbility effect must be a valid object');
    }

    if (!this._effect.type || !PassiveAbility.VALID_EFFECT_TYPES.includes(this._effect.type)) {
      throw new Error(`Invalid effect type: ${this._effect.type}. Must be one of: ${PassiveAbility.VALID_EFFECT_TYPES.join(', ')}`);
    }

    if (typeof this._effect.value === 'undefined') {
      throw new Error('PassiveAbility effect must have a value');
    }

    if (typeof this._effect.value !== 'number' && typeof this._effect.value !== 'string') {
      throw new Error('PassiveAbility effect value must be a number or string');
    }
  }

  validateRarity() {
    const validRarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    if (!validRarities.includes(this._rarity)) {
      throw new Error(`Invalid rarity: ${this._rarity}. Must be one of: ${validRarities.join(', ')}`);
    }
  }

  // Getters
  get id() { return this._id; }
  get name() { return this._name; }
  get description() { return this._description; }
  get culture() { return this._culture; }
  get trigger() { return this._trigger; }
  get effect() { return { ...this._effect }; }
  get cultural_lore() { return this._cultural_lore; }
  get icon() { return this._icon; }
  get rarity() { return this._rarity; }
  get metadata() { return { ...this._metadata }; }
  get created_at() { return new Date(this._created_at); }
  get updated_at() { return new Date(this._updated_at); }

  // Business methods
  isTriggeredBy(eventType) {
    return this._trigger === eventType || this._trigger === 'passive_always';
  }

  isAlwaysActive() {
    return this._trigger === 'passive_always';
  }

  isBattleTriggered() {
    const battleTriggers = ['battle_start', 'defend', 'low_hp', 'when_attacked', 'on_critical'];
    return battleTriggers.includes(this._trigger);
  }

  getEffectValue() {
    return this._effect.value;
  }

  getEffectType() {
    return this._effect.type;
  }

  hasIcon() {
    return this._icon !== null;
  }

  getCulturalEmoji() {
    const cultureEmojis = {
      'Romana': '🏛️',
      'Chinesa': '🐉',
      'Eslava': '⚔️',
      'Grega': '🏺',
      'Asteca': '🌅',
      'Italiana': '🎨',
      'Japonesa': '⚡',
      'Lakota': '🌪️',
      'Viking': '🐺',
      'Abássida': '✨',
      'Vitoriana': '🍵',
      'Iorubá': '🪙',
      'Russa': '🧪',
      'Chinesa Imperial': '💎',
      'Ashanti': '🥁'
    };
    return cultureEmojis[this._culture] || '📜';
  }

  // Factory methods
  static create({
    name,
    description,
    culture,
    trigger,
    effect,
    cultural_lore = '',
    icon = null,
    rarity = 'common',
    metadata = {}
  }) {
    return new PassiveAbility({
      id: PassiveAbilityId.generate(),
      name,
      description,
      culture,
      trigger,
      effect,
      cultural_lore,
      icon,
      rarity,
      metadata,
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  // Update methods (return new instances for immutability)
  updateDescription(newDescription) {
    return new PassiveAbility({
      id: this._id,
      name: this._name,
      description: newDescription,
      culture: this._culture,
      trigger: this._trigger,
      effect: this._effect,
      cultural_lore: this._cultural_lore,
      icon: this._icon,
      rarity: this._rarity,
      metadata: this._metadata,
      created_at: this._created_at,
      updated_at: new Date()
    });
  }

  updateEffect(newEffect) {
    return new PassiveAbility({
      id: this._id,
      name: this._name,
      description: this._description,
      culture: this._culture,
      trigger: this._trigger,
      effect: newEffect,
      cultural_lore: this._cultural_lore,
      icon: this._icon,
      rarity: this._rarity,
      metadata: this._metadata,
      created_at: this._created_at,
      updated_at: new Date()
    });
  }

  updateIcon(newIcon) {
    return new PassiveAbility({
      id: this._id,
      name: this._name,
      description: this._description,
      culture: this._culture,
      trigger: this._trigger,
      effect: this._effect,
      cultural_lore: this._cultural_lore,
      icon: newIcon,
      rarity: this._rarity,
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
      culture: this._culture,
      trigger: this._trigger,
      effect: this._effect,
      cultural_lore: this._cultural_lore,
      icon: this._icon,
      rarity: this._rarity,
      metadata: this._metadata,
      created_at: this._created_at.toISOString(),
      updated_at: this._updated_at.toISOString()
    };
  }

  toString() {
    return `PassiveAbility(${this._id.value}, ${this._name}, ${this._culture})`;
  }

  equals(other) {
    return other instanceof PassiveAbility && this._id.equals(other._id);
  }
}