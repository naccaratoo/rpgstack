/**
 * Combat Value Object Tests
 * 
 * Comprehensive test suite for the Combat value object covering:
 * - Construction and validation
 * - Combat calculations and mechanics
 * - Damage calculation algorithms
 * - Builder pattern methods
 * - Static factory methods
 * - Edge cases and error conditions
 */

import { Combat } from '../../../src/domain/value-objects/Combat.js';

describe('Combat Value Object', () => {
  
  describe('Construction', () => {
    test('should create Combat with valid basic stats', () => {
      const combat = new Combat({
        attack: 50,
        defense: 30,
      });

      expect(combat.attack).toBe(50);
      expect(combat.defense).toBe(30);
      expect(combat.accuracy).toBe(85); // default
      expect(combat.evasion).toBe(5); // default
      expect(combat.criticalRate).toBe(5); // default
      expect(combat.criticalDamage).toBe(1.5); // default
    });

    test('should create Combat with all custom stats', () => {
      const combat = new Combat({
        attack: 100,
        defense: 80,
        accuracy: 90,
        evasion: 15,
        criticalRate: 20,
        criticalDamage: 2.0,
      });

      expect(combat.attack).toBe(100);
      expect(combat.defense).toBe(80);
      expect(combat.accuracy).toBe(90);
      expect(combat.evasion).toBe(15);
      expect(combat.criticalRate).toBe(20);
      expect(combat.criticalDamage).toBe(2.0);
    });

    test('should calculate derived statistics correctly', () => {
      const combat = new Combat({
        attack: 50,
        defense: 30,
        accuracy: 85,
        evasion: 5,
        criticalRate: 10,
        criticalDamage: 1.8,
      });

      expect(combat.combatPower).toBeGreaterThan(0);
      expect(combat.combatRating).toBeDefined();
      expect(['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS']).toContain(combat.combatRating);
    });

    test('should round numeric values to integers where appropriate', () => {
      const combat = new Combat({
        attack: 50.7,
        defense: 30.3,
        accuracy: 85.9,
        evasion: 5.1,
        criticalRate: 10.8,
        criticalDamage: 1.75,
      });

      expect(combat.attack).toBe(50);
      expect(combat.defense).toBe(30);
      expect(combat.accuracy).toBe(85);
      expect(combat.evasion).toBe(5);
      expect(combat.criticalRate).toBe(10);
      expect(combat.criticalDamage).toBe(1.75); // preserved for damage multiplier
    });
  });

  describe('Validation', () => {
    test('should throw error for invalid attack values', () => {
      expect(() => new Combat({ attack: 0, defense: 30 }))
        .toThrow('Attack must be a number between 1 and 999');
      
      expect(() => new Combat({ attack: 1000, defense: 30 }))
        .toThrow('Attack must be a number between 1 and 999');
      
      expect(() => new Combat({ attack: 'invalid', defense: 30 }))
        .toThrow('Attack must be a number between 1 and 999');
    });

    test('should throw error for invalid defense values', () => {
      expect(() => new Combat({ attack: 50, defense: 0 }))
        .toThrow('Defense must be a number between 1 and 999');
      
      expect(() => new Combat({ attack: 50, defense: 1000 }))
        .toThrow('Defense must be a number between 1 and 999');
      
      expect(() => new Combat({ attack: 50, defense: null }))
        .toThrow('Defense must be a number between 1 and 999');
    });

    test('should throw error for invalid accuracy values', () => {
      expect(() => new Combat({ attack: 50, defense: 30, accuracy: -1 }))
        .toThrow('Accuracy must be a number between 0 and 100');
      
      expect(() => new Combat({ attack: 50, defense: 30, accuracy: 101 }))
        .toThrow('Accuracy must be a number between 0 and 100');
    });

    test('should throw error for invalid evasion values', () => {
      expect(() => new Combat({ attack: 50, defense: 30, evasion: -5 }))
        .toThrow('Evasion must be a number between 0 and 100');
      
      expect(() => new Combat({ attack: 50, defense: 30, evasion: 105 }))
        .toThrow('Evasion must be a number between 0 and 100');
    });

    test('should throw error for invalid critical rate values', () => {
      expect(() => new Combat({ attack: 50, defense: 30, criticalRate: -1 }))
        .toThrow('Critical rate must be a number between 0 and 100');
      
      expect(() => new Combat({ attack: 50, defense: 30, criticalRate: 101 }))
        .toThrow('Critical rate must be a number between 0 and 100');
    });

    test('should throw error for invalid critical damage values', () => {
      expect(() => new Combat({ attack: 50, defense: 30, criticalDamage: 0.5 }))
        .toThrow('Critical damage must be a number between 1.0 and 5.0');
      
      expect(() => new Combat({ attack: 50, defense: 30, criticalDamage: 6.0 }))
        .toThrow('Critical damage must be a number between 1.0 and 5.0');
    });

    test('should throw error for excessive accuracy + evasion combination', () => {
      expect(() => new Combat({ 
        attack: 50, 
        defense: 30, 
        accuracy: 100, 
        evasion: 60 
      })).toThrow('Combined accuracy and evasion cannot exceed 150%');
    });

    test('should throw error for overpowered critical combinations', () => {
      expect(() => new Combat({ 
        attack: 50, 
        defense: 30, 
        criticalRate: 60, 
        criticalDamage: 4.0 
      })).toThrow('High critical rate (>50%) cannot combine with high critical damage (>3.0x)');
    });
  });

  describe('Combat Calculations', () => {
    let attacker, defender;

    beforeEach(() => {
      attacker = new Combat({
        attack: 100,
        defense: 50,
        accuracy: 90,
        evasion: 10,
        criticalRate: 15,
        criticalDamage: 2.0,
      });

      defender = new Combat({
        attack: 60,
        defense: 80,
        accuracy: 75,
        evasion: 20,
        criticalRate: 5,
        criticalDamage: 1.5,
      });
    });

    test('should calculate damage with level consideration', () => {
      const damageResult = attacker.calculateDamage(defender, 10, 10);
      
      expect(damageResult).toHaveProperty('damage');
      expect(damageResult).toHaveProperty('hitChance');
      expect(damageResult).toHaveProperty('isCritical');
      expect(damageResult).toHaveProperty('canHit');
      
      expect(damageResult.damage).toBeGreaterThan(0);
      expect(damageResult.hitChance).toBeGreaterThanOrEqual(10);
      expect(damageResult.hitChance).toBeLessThanOrEqual(95);
      expect(typeof damageResult.isCritical).toBe('boolean');
      expect(typeof damageResult.canHit).toBe('boolean');
    });

    test('should handle level differences in damage calculation', () => {
      const highLevelResult = attacker.calculateDamage(defender, 20, 10);
      const lowLevelResult = attacker.calculateDamage(defender, 5, 10);
      
      // Higher level attacker should generally deal more damage
      // Note: Due to randomness, we'll check the average over multiple calculations
      let highTotal = 0, lowTotal = 0;
      for (let i = 0; i < 100; i++) {
        highTotal += attacker.calculateDamage(defender, 20, 10).damage;
        lowTotal += attacker.calculateDamage(defender, 5, 10).damage;
      }
      
      expect(highTotal / 100).toBeGreaterThan(lowTotal / 100);
    });

    test('should calculate combat effectiveness', () => {
      const effectiveness = attacker.calculateEffectiveness(defender);
      
      expect(effectiveness).toBeGreaterThanOrEqual(0);
      expect(effectiveness).toBeLessThanOrEqual(100);
      expect(typeof effectiveness).toBe('number');
    });

    test('should throw error for non-Combat parameter in calculateDamage', () => {
      expect(() => attacker.calculateDamage({ attack: 50, defense: 30 }))
        .toThrow('Target combat stats must be a Combat instance');
    });

    test('should throw error for non-Combat parameter in calculateEffectiveness', () => {
      expect(() => attacker.calculateEffectiveness('invalid'))
        .toThrow('Target combat stats must be a Combat instance');
    });
  });

  describe('Combat Power and Rating', () => {
    test('should calculate combat power correctly', () => {
      const combat = new Combat({
        attack: 100,
        defense: 80,
        accuracy: 90,
        evasion: 15,
        criticalRate: 20,
        criticalDamage: 2.5,
      });

      const expectedPower = Math.floor(
        (100 * 1.2) + 
        (80 * 0.8) + 
        (90 * 0.3) + 
        (20 * 2.5 * 0.5)
      );

      expect(combat.combatPower).toBe(expectedPower);
    });

    test('should assign correct combat ratings', () => {
      const ratings = [
        { stats: { attack: 10, defense: 10 }, expectedRating: 'F' },
        { stats: { attack: 50, defense: 30 }, expectedRating: 'E' },
        { stats: { attack: 100, defense: 50 }, expectedRating: 'D' },
        { stats: { attack: 150, defense: 100 }, expectedRating: 'C' },
        { stats: { attack: 250, defense: 150 }, expectedRating: 'B' },
        { stats: { attack: 350, defense: 200 }, expectedRating: 'A' },
        { stats: { attack: 500, defense: 300 }, expectedRating: 'S' },
        { stats: { attack: 600, defense: 400 }, expectedRating: 'SS' },
      ];

      ratings.forEach(({ stats, expectedRating }) => {
        const combat = new Combat(stats);
        expect(combat.combatRating).toBe(expectedRating);
      });
    });
  });

  describe('Builder Pattern Methods', () => {
    let baseCombat;

    beforeEach(() => {
      baseCombat = new Combat({
        attack: 100,
        defense: 80,
        accuracy: 90,
        evasion: 15,
        criticalRate: 20,
        criticalDamage: 2.0,
      });
    });

    test('should create new instance with modified attack', () => {
      const newCombat = baseCombat.withAttack(150);
      
      expect(newCombat.attack).toBe(150);
      expect(newCombat.defense).toBe(80);
      expect(baseCombat.attack).toBe(100); // original unchanged
      expect(newCombat).not.toBe(baseCombat); // different instance
    });

    test('should create new instance with modified defense', () => {
      const newCombat = baseCombat.withDefense(120);
      
      expect(newCombat.defense).toBe(120);
      expect(newCombat.attack).toBe(100);
      expect(baseCombat.defense).toBe(80); // original unchanged
    });

    test('should create new instance with multiple changes', () => {
      const newCombat = baseCombat.withChanges({
        attack: 200,
        defense: 150,
        criticalRate: 25,
      });
      
      expect(newCombat.attack).toBe(200);
      expect(newCombat.defense).toBe(150);
      expect(newCombat.criticalRate).toBe(25);
      expect(newCombat.accuracy).toBe(90); // unchanged
      expect(newCombat.evasion).toBe(15); // unchanged
    });
  });

  describe('Equality and Comparison', () => {
    test('should be equal for same stat values', () => {
      const combat1 = new Combat({
        attack: 100,
        defense: 80,
        accuracy: 90,
        evasion: 15,
        criticalRate: 20,
        criticalDamage: 2.0,
      });

      const combat2 = new Combat({
        attack: 100,
        defense: 80,
        accuracy: 90,
        evasion: 15,
        criticalRate: 20,
        criticalDamage: 2.0,
      });

      expect(combat1.equals(combat2)).toBe(true);
    });

    test('should not be equal for different stat values', () => {
      const combat1 = new Combat({ attack: 100, defense: 80 });
      const combat2 = new Combat({ attack: 101, defense: 80 });

      expect(combat1.equals(combat2)).toBe(false);
    });

    test('should not be equal to non-Combat objects', () => {
      const combat = new Combat({ attack: 100, defense: 80 });

      expect(combat.equals({ attack: 100, defense: 80 })).toBe(false);
      expect(combat.equals(null)).toBe(false);
      expect(combat.equals('combat')).toBe(false);
    });
  });

  describe('Serialization', () => {
    let combat;

    beforeEach(() => {
      combat = new Combat({
        attack: 100,
        defense: 80,
        accuracy: 90,
        evasion: 15,
        criticalRate: 20,
        criticalDamage: 2.0,
      });
    });

    test('should convert to object', () => {
      const obj = combat.toObject();

      expect(obj).toEqual({
        attack: 100,
        defense: 80,
        accuracy: 90,
        evasion: 15,
        criticalRate: 20,
        criticalDamage: 2.0,
        combatPower: combat.combatPower,
        combatRating: combat.combatRating,
      });
    });

    test('should convert to JSON string', () => {
      const json = combat.toJSON();
      const parsed = JSON.parse(json);

      expect(parsed.attack).toBe(100);
      expect(parsed.defense).toBe(80);
      expect(parsed.combatPower).toBeDefined();
      expect(parsed.combatRating).toBeDefined();
    });

    test('should convert to descriptive string', () => {
      const str = combat.toString();

      expect(str).toContain('Combat(');
      expect(str).toContain('ATK:100');
      expect(str).toContain('DEF:80');
      expect(str).toContain('ACC:90%');
      expect(str).toContain('EVA:15%');
      expect(str).toContain('CR:20%');
      expect(str).toContain('CD:2x');
      expect(str).toContain('Power:');
      expect(str).toContain('Rating:');
    });
  });

  describe('Immutability', () => {
    test('should be frozen after creation', () => {
      const combat = new Combat({ attack: 100, defense: 80 });

      expect(Object.isFrozen(combat)).toBe(true);
    });

    test('should not allow property modification', () => {
      const combat = new Combat({ attack: 100, defense: 80 });

      expect(() => {
        combat._attack = 200;
      }).toThrow();
    });

    test('should return same instance on clone (immutable)', () => {
      const combat = new Combat({ attack: 100, defense: 80 });
      const cloned = Object.assign({}, combat);

      // Combat is immutable, so shallow clone should preserve private properties
      expect(cloned._attack).toBe(combat._attack);
      expect(cloned._defense).toBe(combat._defense);
    });
  });

  describe('Static Factory Methods', () => {
    test('should create from legacy format', () => {
      const legacyData = {
        att: 100,
        def: 80,
        acc: 95,
        eva: 20,
        crit: 15,
        critDmg: 1.8,
      };

      const combat = Combat.fromLegacyFormat(legacyData);

      expect(combat.attack).toBe(100);
      expect(combat.defense).toBe(80);
      expect(combat.accuracy).toBe(95);
      expect(combat.evasion).toBe(20);
      expect(combat.criticalRate).toBe(15);
      expect(combat.criticalDamage).toBe(1.8);
    });

    test('should create from legacy format with defaults', () => {
      const legacyData = {
        attack: 50,
        defense: 30,
      };

      const combat = Combat.fromLegacyFormat(legacyData);

      expect(combat.attack).toBe(50);
      expect(combat.defense).toBe(30);
      expect(combat.accuracy).toBe(85); // default
      expect(combat.evasion).toBe(5); // default
    });

    test('should create balanced stats for different levels', () => {
      const level1Combat = Combat.createForLevel(1, 'warrior');
      const level50Combat = Combat.createForLevel(50, 'warrior');

      expect(level50Combat.attack).toBeGreaterThan(level1Combat.attack);
      expect(level50Combat.defense).toBeGreaterThan(level1Combat.defense);
    });

    test('should create different archetypes correctly', () => {
      const warrior = Combat.createForLevel(20, 'warrior');
      const rogue = Combat.createForLevel(20, 'rogue');
      const mage = Combat.createForLevel(20, 'mage');
      const tank = Combat.createForLevel(20, 'tank');

      // Warriors should have balanced attack/defense
      expect(warrior.attack).toBeGreaterThanOrEqual(warrior.defense);

      // Rogues should have higher critical stats and evasion
      expect(rogue.criticalRate).toBeGreaterThan(warrior.criticalRate);
      expect(rogue.evasion).toBeGreaterThan(warrior.evasion);

      // Mages should have highest attack but lower defense
      expect(mage.attack).toBeGreaterThan(warrior.attack);
      expect(mage.defense).toBeLessThan(warrior.defense);

      // Tanks should have highest defense
      expect(tank.defense).toBeGreaterThan(warrior.defense);
    });

    test('should handle invalid archetype with warrior default', () => {
      const combat = Combat.createForLevel(10, 'invalid');
      const warrior = Combat.createForLevel(10, 'warrior');

      expect(combat.attack).toBe(warrior.attack);
      expect(combat.defense).toBe(warrior.defense);
    });
  });

  describe('Edge Cases', () => {
    test('should handle minimum level in createForLevel', () => {
      const combat = Combat.createForLevel(0, 'warrior');
      
      expect(combat.attack).toBeGreaterThan(0);
      expect(combat.defense).toBeGreaterThan(0);
    });

    test('should handle maximum combat power calculation', () => {
      const maxCombat = new Combat({
        attack: 999,
        defense: 999,
        accuracy: 100,
        evasion: 50, // Limited by combined accuracy+evasion rule
        criticalRate: 50,
        criticalDamage: 3.0, // Limited by critical combination rule
      });

      expect(maxCombat.combatPower).toBeGreaterThan(0);
      expect(maxCombat.combatRating).toBe('SS');
    });

    test('should handle minimum damage calculation', () => {
      const weakAttacker = new Combat({ attack: 1, defense: 1 });
      const strongDefender = new Combat({ attack: 999, defense: 999 });

      const damageResult = weakAttacker.calculateDamage(strongDefender);
      
      // Should always deal at least 1 damage
      expect(damageResult.damage).toBeGreaterThanOrEqual(1);
    });

    test('should handle boundary hit chances', () => {
      const lowAccuracy = new Combat({ attack: 50, defense: 30, accuracy: 0 });
      const highEvasion = new Combat({ attack: 50, defense: 30, evasion: 50 }); // Reduced to avoid validation error

      const damageResult = lowAccuracy.calculateDamage(highEvasion);
      
      // Hit chance should be clamped between 10% and 95%
      expect(damageResult.hitChance).toBeGreaterThanOrEqual(10);
      expect(damageResult.hitChance).toBeLessThanOrEqual(95);
    });
  });
});