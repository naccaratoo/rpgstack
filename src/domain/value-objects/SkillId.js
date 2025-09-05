/**
 * SkillId Value Object
 * 
 * Immutable value object representing a unique skill identifier.
 * Ensures type safety and validation for skill IDs throughout the system.
 * 
 * Business Rules:
 * - Must be a non-empty string
 * - Must be exactly 10 characters long
 * - Must contain only alphanumeric characters (uppercase)
 * - Must be immutable once created
 * - Provides equality comparison
 */

export class SkillId {
  static VALID_LENGTH = 10;
  static VALID_PATTERN = /^[A-Z0-9]{10}$/;

  constructor(value) {
    this.validateInput(value);
    this._value = value;
    Object.freeze(this);
  }

  validateInput(value) {
    if (!value) {
      throw new Error('SkillId cannot be empty or null');
    }

    if (typeof value !== 'string') {
      throw new Error('SkillId must be a string');
    }

    if (value.length !== SkillId.VALID_LENGTH) {
      throw new Error(`SkillId must be exactly ${SkillId.VALID_LENGTH} characters long`);
    }

    if (!SkillId.VALID_PATTERN.test(value)) {
      throw new Error('SkillId must contain only uppercase alphanumeric characters');
    }
  }

  get value() {
    return this._value;
  }

  equals(other) {
    return other instanceof SkillId && this._value === other._value;
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
    for (let i = 0; i < SkillId.VALID_LENGTH; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return new SkillId(result);
  }

  static isValid(value) {
    try {
      new SkillId(value);
      return true;
    } catch {
      return false;
    }
  }
}