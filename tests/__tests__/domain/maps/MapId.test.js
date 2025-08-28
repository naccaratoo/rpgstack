import { MapId } from '../../../../src/domain/maps/value-objects/MapId.js';

describe('MapId', () => {
  describe('Construction', () => {
    test('should create MapId with valid hex string', () => {
      const mapId = new MapId('A1B2C3D4E5');
      expect(mapId.value).toBe('A1B2C3D4E5');
    });

    test('should normalize lowercase to uppercase', () => {
      const mapId = new MapId('a1b2c3d4e5');
      expect(mapId.value).toBe('A1B2C3D4E5');
    });

    test('should trim whitespace', () => {
      const mapId = new MapId(' A1B2C3D4E5 ');
      expect(mapId.value).toBe('A1B2C3D4E5');
    });

    test('should throw error for null/undefined', () => {
      expect(() => new MapId(null)).toThrow('MapId value is required and must be a string');
      expect(() => new MapId(undefined)).toThrow('MapId value is required and must be a string');
    });

    test('should throw error for non-string', () => {
      expect(() => new MapId(123)).toThrow('MapId value is required and must be a string');
      expect(() => new MapId({})).toThrow('MapId value is required and must be a string');
    });

    test('should throw error for invalid format', () => {
      expect(() => new MapId('INVALID')).toThrow('Invalid MapId format');
      expect(() => new MapId('123')).toThrow('Invalid MapId format');
      expect(() => new MapId('ABCDEFGHIJK')).toThrow('Invalid MapId format'); // Too long
      expect(() => new MapId('ABCDEFGHI')).toThrow('Invalid MapId format'); // Too short
    });

    test('should throw error for non-hex characters', () => {
      expect(() => new MapId('A1B2C3D4GZ')).toThrow('Invalid MapId format');
      expect(() => new MapId('A1B2C3D4E@')).toThrow('Invalid MapId format');
    });

    test('should be immutable', () => {
      const mapId = new MapId('A1B2C3D4E5');
      expect(() => { mapId.value = 'DIFFERENT'; }).toThrow();
      expect(Object.isFrozen(mapId)).toBe(true);
    });
  });

  describe('Static Methods', () => {
    test('generate() should create valid random MapId', () => {
      const mapId = MapId.generate();
      expect(mapId).toBeInstanceOf(MapId);
      expect(mapId.value).toMatch(/^[A-F0-9]{10}$/);
    });

    test('generate() should create unique IDs', () => {
      const id1 = MapId.generate();
      const id2 = MapId.generate();
      expect(id1.value).not.toBe(id2.value);
    });

    test('fromString() should work same as constructor', () => {
      const mapId1 = new MapId('A1B2C3D4E5');
      const mapId2 = MapId.fromString('A1B2C3D4E5');
      expect(mapId1.equals(mapId2)).toBe(true);
    });

    test('fromString() should validate input', () => {
      expect(() => MapId.fromString('INVALID')).toThrow('Invalid MapId format');
    });
  });

  describe('Validation', () => {
    test('isValid() should return true for valid hex strings', () => {
      const mapId = new MapId('A1B2C3D4E5');
      expect(mapId.isValid('A1B2C3D4E5')).toBe(true);
      expect(mapId.isValid('0123456789')).toBe(true);
      expect(mapId.isValid('ABCDEFABCD')).toBe(true);
    });

    test('isValid() should return false for invalid strings', () => {
      const mapId = new MapId('A1B2C3D4E5');
      expect(mapId.isValid('INVALID')).toBe(false);
      expect(mapId.isValid('A1B2C3D4E')).toBe(false); // Too short
      expect(mapId.isValid('A1B2C3D4E5F')).toBe(false); // Too long
      expect(mapId.isValid('A1B2C3D4GZ')).toBe(false); // Invalid chars
    });
  });

  describe('Equality and Comparison', () => {
    test('equals() should return true for same values', () => {
      const mapId1 = new MapId('A1B2C3D4E5');
      const mapId2 = new MapId('A1B2C3D4E5');
      expect(mapId1.equals(mapId2)).toBe(true);
    });

    test('equals() should return false for different values', () => {
      const mapId1 = new MapId('A1B2C3D4E5');
      const mapId2 = new MapId('F6E7D8C9B0');
      expect(mapId1.equals(mapId2)).toBe(false);
    });

    test('equals() should return false for non-MapId objects', () => {
      const mapId = new MapId('A1B2C3D4E5');
      expect(mapId.equals('A1B2C3D4E5')).toBe(false);
      expect(mapId.equals(null)).toBe(false);
      expect(mapId.equals({})).toBe(false);
    });

    test('equals() should handle case normalization', () => {
      const mapId1 = new MapId('a1b2c3d4e5');
      const mapId2 = new MapId('A1B2C3D4E5');
      expect(mapId1.equals(mapId2)).toBe(true);
    });

    test('hashCode() should return consistent values', () => {
      const mapId1 = new MapId('A1B2C3D4E5');
      const mapId2 = new MapId('A1B2C3D4E5');
      expect(mapId1.hashCode()).toBe(mapId2.hashCode());
      expect(mapId1.hashCode()).toBe('A1B2C3D4E5');
    });

    test('hashCode() should return different values for different IDs', () => {
      const mapId1 = new MapId('A1B2C3D4E5');
      const mapId2 = new MapId('F6E7D8C9B0');
      expect(mapId1.hashCode()).not.toBe(mapId2.hashCode());
    });
  });

  describe('Serialization', () => {
    test('toString() should return hex value', () => {
      const mapId = new MapId('A1B2C3D4E5');
      expect(mapId.toString()).toBe('A1B2C3D4E5');
    });

    test('toJSON() should return hex value', () => {
      const mapId = new MapId('A1B2C3D4E5');
      expect(mapId.toJSON()).toBe('A1B2C3D4E5');
    });

    test('JSON.stringify() should work correctly', () => {
      const mapId = new MapId('A1B2C3D4E5');
      const json = JSON.stringify(mapId);
      expect(json).toBe('"A1B2C3D4E5"');
    });

    test('should survive JSON round-trip', () => {
      const original = MapId.generate();
      const json = JSON.stringify(original);
      const parsed = JSON.parse(json);
      const reconstructed = new MapId(parsed);
      expect(original.equals(reconstructed)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle mixed case input consistently', () => {
      const mapId1 = new MapId('AbC123DeF0');
      const mapId2 = new MapId('ABC123DEF0');
      expect(mapId1.equals(mapId2)).toBe(true);
    });

    test('should handle whitespace edge cases', () => {
      const mapId1 = new MapId('  A1B2C3D4E5  ');
      const mapId2 = new MapId('A1B2C3D4E5');
      expect(mapId1.equals(mapId2)).toBe(true);
    });

    test('should throw for empty string after trim', () => {
      expect(() => new MapId('   ')).toThrow('Invalid MapId format: empty string');
      expect(() => new MapId('')).toThrow('Invalid MapId format: empty string');
    });
  });

  describe('Consistency with CharacterId', () => {
    test('should use same format as CharacterId', () => {
      const mapId = MapId.generate();
      expect(mapId.value).toMatch(/^[A-F0-9]{10}$/);
      expect(mapId.value.length).toBe(10);
    });

    test('should be distinguishable from CharacterId by context only', () => {
      // Both should have same format - distinction is contextual
      const mapId = new MapId('A1B2C3D4E5');
      expect(mapId.value).toBe('A1B2C3D4E5');
    });
  });
});