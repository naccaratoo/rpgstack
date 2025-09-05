/**
 * PassiveAbilityId Value Object
 * 
 * Immutable value object representing a unique passive ability identifier.
 * Ensures type safety and validation for passive ability IDs throughout the system.
 * 
 * Business Rules:
 * - Must be a non-empty string
 * - Must be exactly 10 characters long
 * - Must contain only alphanumeric characters (uppercase)
 * - Must be immutable once created
 * - Provides equality comparison
 */

export class PassiveAbilityId {
  static VALID_LENGTH = 10;
  static VALID_PATTERN = /^[A-Z0-9]{10}$/;

  constructor(value) {
    this.validateInput(value);
    this._value = value;
    Object.freeze(this);
  }

  validateInput(value) {
    if (!value) {
      throw new Error('PassiveAbilityId cannot be empty or null');
    }

    if (typeof value !== 'string') {
      throw new Error('PassiveAbilityId must be a string');
    }

    if (value.length !== PassiveAbilityId.VALID_LENGTH) {
      throw new Error(`PassiveAbilityId must be exactly ${PassiveAbilityId.VALID_LENGTH} characters long`);
    }

    if (!PassiveAbilityId.VALID_PATTERN.test(value)) {
      throw new Error('PassiveAbilityId must contain only uppercase alphanumeric characters');
    }
  }

  get value() {
    return this._value;
  }

  equals(other) {
    return other instanceof PassiveAbilityId && this._value === other._value;
  }

  toString() {
    return this._value;
  }

  toJSON() {
    return this._value;
  }

  static generate() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < PassiveAbilityId.VALID_LENGTH; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return new PassiveAbilityId(result);
  }

  static isValid(value) {
    try {
      new PassiveAbilityId(value);
      return true;
    } catch {
      return false;
    }
  }
}