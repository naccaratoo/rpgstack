/**
 * CharacterId Value Object Tests
 * 
 * Tests for the CharacterId value object including:
 * - ID generation and validation
 * - Immutability constraints
 * - Format validation
 * - Equality and serialization
 */

import { CharacterId } from '../../../src/domain/value-objects/CharacterId.js';

describe('CharacterId Value Object', () => {
  describe('Construction', () => {
    test('should create valid CharacterId with uppercase hex string', () => {
      const id = new CharacterId('ABC123DEF0');
      expect(id.getValue()).toBe('ABC123DEF0');
    });

    test('should convert lowercase hex to uppercase', () => {
      const id = new CharacterId('abc123def0');
      expect(id.getValue()).toBe('ABC123DEF0');
    });

    test('should throw error for invalid format', () => {
      expect(() => new CharacterId('invalid')).toThrow('Invalid character ID format');
      expect(() => new CharacterId('ABC123')).toThrow('Invalid character ID format');
      expect(() => new CharacterId('ABC123DEF01')).toThrow('Invalid character ID format');
      expect(() => new CharacterId('GHI123DEF0')).toThrow('Invalid character ID format');
    });

    test('should throw error for non-string input', () => {
      expect(() => new CharacterId(123)).toThrow('Character ID must be a string');
      expect(() => new CharacterId(null)).toThrow('Character ID must be a string');
      expect(() => new CharacterId(undefined)).toThrow('Character ID must be a string');
    });
  });

  describe('Static Methods', () => {
    test('should generate valid random ID', () => {
      const id = CharacterId.generate();
      expect(id).toBeInstanceOf(CharacterId);
      expect(id.getValue()).toMatch(/^[A-F0-9]{10}$/);
    });

    test('should generate unique IDs', () => {
      const id1 = CharacterId.generate();
      const id2 = CharacterId.generate();
      expect(id1.getValue()).not.toBe(id2.getValue());
    });

    test('should create from string', () => {
      const id = CharacterId.fromString('ABC123DEF0');
      expect(id.getValue()).toBe('ABC123DEF0');
    });
  });

  describe('Validation', () => {
    test('should validate correct hex format', () => {
      const id = new CharacterId('ABC123DEF0');
      expect(id.isValid('ABC123DEF0')).toBe(true);
      expect(id.isValid('0123456789')).toBe(true);
      expect(id.isValid('ABCDEF0123')).toBe(true);
    });

    test('should reject invalid formats', () => {
      const id = new CharacterId('ABC123DEF0');
      expect(id.isValid('GHI123DEF0')).toBe(false); // Invalid hex chars
      expect(id.isValid('ABC123')).toBe(false); // Too short
      expect(id.isValid('ABC123DEF01')).toBe(false); // Too long
      expect(id.isValid('abc123def0')).toBe(false); // Lowercase not allowed in validation
    });
  });

  describe('Equality and Comparison', () => {
    test('should be equal for same ID values', () => {
      const id1 = new CharacterId('ABC123DEF0');
      const id2 = new CharacterId('ABC123DEF0');
      expect(id1.equals(id2)).toBe(true);
    });

    test('should not be equal for different ID values', () => {
      const id1 = new CharacterId('ABC123DEF0');
      const id2 = new CharacterId('DEF456ABC1');
      expect(id1.equals(id2)).toBe(false);
    });

    test('should not be equal to non-CharacterId objects', () => {
      const id = new CharacterId('ABC123DEF0');
      expect(id.equals('ABC123DEF0')).toBe(false);
      expect(id.equals({ value: 'ABC123DEF0' })).toBe(false);
    });

    test('should provide consistent hash codes', () => {
      const id1 = new CharacterId('ABC123DEF0');
      const id2 = new CharacterId('ABC123DEF0');
      expect(id1.hashCode()).toBe(id2.hashCode());
    });
  });

  describe('Serialization', () => {
    test('should convert to string', () => {
      const id = new CharacterId('ABC123DEF0');
      expect(id.toString()).toBe('ABC123DEF0');
    });

    test('should serialize to JSON', () => {
      const id = new CharacterId('ABC123DEF0');
      expect(id.toJSON()).toBe('ABC123DEF0');
      expect(JSON.stringify({ id })).toBe('{"id":"ABC123DEF0"}');
    });
  });

  describe('Immutability', () => {
    test('should be immutable after creation', () => {
      const id = new CharacterId('ABC123DEF0');
      expect(() => {
        id._value = 'DEF456ABC1';
      }).toThrow();
    });

    test('should return same instance on clone (immutable)', () => {
      const id = new CharacterId('ABC123DEF0');
      const cloned = id.clone();
      expect(cloned).toBe(id); // Same reference due to immutability
    });
  });

  describe('Edge Cases', () => {
    test('should handle boundary hex values', () => {
      expect(() => new CharacterId('0000000000')).not.toThrow();
      expect(() => new CharacterId('FFFFFFFFFF')).not.toThrow();
    });

    test('should handle mixed case input consistently', () => {
      const id1 = new CharacterId('AbC123dEf0');
      const id2 = new CharacterId('ABC123DEF0');
      expect(id1.equals(id2)).toBe(true);
    });
  });
});