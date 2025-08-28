/**
 * CharacterId Value Object
 * 
 * Represents a unique, immutable character identifier using 
 * cryptographically secure 10-character hexadecimal strings.
 * 
 * Domain Rules:
 * - Must be exactly 10 characters long
 * - Must contain only uppercase hexadecimal characters (A-F, 0-9)
 * - Immutable once created
 * - Generated using crypto.randomBytes() for security
 * - Used as primary key in all character references
 */

import crypto from 'crypto';

export class CharacterId {
  constructor(value) {
    if (typeof value !== 'string') {
      throw new Error('Character ID must be a string');
    }
    
    const upperValue = value.toUpperCase();
    
    if (!this.isValid(upperValue)) {
      throw new Error(
        `Invalid character ID format: "${value}". ` +
        'Must be exactly 10 hexadecimal characters.',
      );
    }
    
    this._value = upperValue;
    Object.freeze(this);
  }

  /**
   * Generate a new cryptographically secure Character ID
   * @returns {CharacterId} New unique character ID
   */
  static generate() {
    const hexValue = crypto.randomBytes(5).toString('hex').toUpperCase();
    return new CharacterId(hexValue);
  }

  /**
   * Create CharacterId from existing string (for loading from storage)
   * @param {string} value - Existing hex ID string
   * @returns {CharacterId} Character ID instance
   */
  static fromString(value) {
    return new CharacterId(value);
  }

  /**
   * Validate hex ID format
   * @param {string} value - Value to validate
   * @returns {boolean} True if valid format
   */
  isValid(value) {
    // Must be exactly 10 characters of uppercase hex
    const hexPattern = /^[A-F0-9]{10}$/;
    return hexPattern.test(value);
  }

  /**
   * Get the string value of this ID
   * @returns {string} Hex ID string
   */
  getValue() {
    return this._value;
  }

  /**
   * Convert to string (for JSON serialization)
   * @returns {string} Hex ID string
   */
  toString() {
    return this._value;
  }

  /**
   * JSON serialization
   * @returns {string} Hex ID string for JSON
   */
  toJSON() {
    return this._value;
  }

  /**
   * Check equality with another CharacterId
   * @param {CharacterId} other - Other character ID
   * @returns {boolean} True if equal
   */
  equals(other) {
    if (!(other instanceof CharacterId)) {
      return false;
    }
    return this._value === other._value;
  }

  /**
   * Hash code for use in collections
   * @returns {string} Hash representation
   */
  hashCode() {
    return this._value;
  }

  /**
   * Create a copy of this ID (returns same instance due to immutability)
   * @returns {CharacterId} Same instance (immutable)
   */
  clone() {
    return this;
  }
}