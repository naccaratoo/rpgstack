import crypto from 'crypto';

/**
 * MapId Value Object
 * 
 * Represents an immutable, cryptographically secure map identifier
 * following the same pattern as CharacterId for system consistency.
 */
export class MapId {
  /**
   * Creates a new MapId
   * @param {string} value - 10-character hexadecimal string
   * @throws {Error} If value is invalid
   */
  constructor(value) {
    if (typeof value !== 'string') {
      throw new Error('MapId value is required and must be a string');
    }

    // Normalize to uppercase for consistency
    const normalizedValue = value.toUpperCase().trim();
    
    // Check for empty string after trim
    if (normalizedValue === '') {
      throw new Error('Invalid MapId format: empty string. Expected 10-character hexadecimal string');
    }
    
    if (!this.isValid(normalizedValue)) {
      throw new Error(`Invalid MapId format: ${value}. Expected 10-character hexadecimal string`);
    }

    this.value = normalizedValue;
    Object.freeze(this);
  }

  /**
   * Validates MapId format
   * @param {string} value - Value to validate
   * @returns {boolean} True if valid
   */
  isValid(value) {
    return /^[A-F0-9]{10}$/.test(value);
  }

  /**
   * Generates a new cryptographically secure MapId
   * @returns {MapId} New MapId instance
   */
  static generate() {
    const buffer = crypto.randomBytes(5);
    const hexString = buffer.toString('hex').toUpperCase();
    return new MapId(hexString);
  }

  /**
   * Creates MapId from string with validation
   * @param {string} value - String value
   * @returns {MapId} MapId instance
   */
  static fromString(value) {
    return new MapId(value);
  }

  /**
   * Equality comparison
   * @param {MapId} other - Other MapId to compare
   * @returns {boolean} True if equal
   */
  equals(other) {
    return other instanceof MapId && this.value === other.value;
  }

  /**
   * Hash code for collections
   * @returns {string} Hash code
   */
  hashCode() {
    return this.value;
  }

  /**
   * String representation
   * @returns {string} The hex value
   */
  toString() {
    return this.value;
  }

  /**
   * JSON serialization
   * @returns {string} The hex value for JSON
   */
  toJSON() {
    return this.value;
  }
}