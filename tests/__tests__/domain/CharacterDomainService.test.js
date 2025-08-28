/**
 * Character Domain Service Tests
 * 
 * Test suite for the CharacterDomainService covering business logic
 * operations involving multiple domain objects and complex calculations.
 */

import { CharacterDomainService } from '../../../src/domain/services/CharacterDomainService.js';
import { Character } from '../../../src/domain/entities/Character.js';
import { CharacterId } from '../../../src/domain/value-objects/CharacterId.js';
import { Stats } from '../../../src/domain/value-objects/Stats.js';

describe('CharacterDomainService', () => {
  let domainService;
  let testCharacter;

  beforeEach(() => {
    domainService = new CharacterDomainService();
    
    testCharacter = new Character({
      id: CharacterId.generate(),
      name: 'Test Hero',
      level: 10,
      stats: {
        hp: 80,
        maxHP: 100,
        attack: 25,
        defense: 20,
      },
      ai_type: 'aggressive',
      gold: 500,
      experience: 1000,
      skill_points: 2,
    });
  });

  describe('Level Up Calculations', () => {
    test('should calculate stat increases for level up', () => {
      const levelUpStats = domainService.calculateLevelUpStats(testCharacter);

      expect(levelUpStats).toHaveProperty('stats');
      expect(levelUpStats).toHaveProperty('skill_points');
      expect(levelUpStats).toHaveProperty('estimatedPower');
      expect(levelUpStats.stats.attack).toBeGreaterThanOrEqual(0);
      expect(levelUpStats.stats.defense).toBeGreaterThanOrEqual(0);
      expect(levelUpStats.stats.maxHP).toBeGreaterThanOrEqual(0);
    });

    test('should apply growth patterns correctly', () => {
      const balancedGrowth = domainService.calculateLevelUpStats(testCharacter, { growthPattern: 'balanced' });
      const offensiveGrowth = domainService.calculateLevelUpStats(testCharacter, { growthPattern: 'offensive' });
      const defensiveGrowth = domainService.calculateLevelUpStats(testCharacter, { growthPattern: 'defensive' });

      // Offensive should prioritize attack
      expect(offensiveGrowth.stats.attack).toBeGreaterThanOrEqual(balancedGrowth.stats.attack);
      
      // Defensive should prioritize defense and HP
      expect(defensiveGrowth.stats.defense).toBeGreaterThanOrEqual(balancedGrowth.stats.defense);
    });

    test('should throw error for max level character', () => {
      const maxLevelCharacter = testCharacter.update({ level: Character.MAX_LEVEL });

      expect(() => domainService.calculateLevelUpStats(maxLevelCharacter))
        .toThrow('Character is already at maximum level');
    });

    test('should throw error for non-Character parameter', () => {
      expect(() => domainService.calculateLevelUpStats({ level: 10 }))
        .toThrow('Must provide a Character instance');
    });

    test('should apply AI type modifiers correctly', () => {
      const aggressiveChar = testCharacter.update({ ai_type: 'aggressive' });
      const guardianChar = testCharacter.update({ ai_type: 'guardian' });
      const casterChar = testCharacter.update({ ai_type: 'caster' });

      const aggressiveGrowth = domainService.calculateLevelUpStats(aggressiveChar);
      const guardianGrowth = domainService.calculateLevelUpStats(guardianChar);
      const casterGrowth = domainService.calculateLevelUpStats(casterChar);

      // Aggressive should have higher attack growth
      expect(aggressiveGrowth.stats.attack).toBeGreaterThan(guardianGrowth.stats.attack);
      
      // Guardian should have higher defense growth
      expect(guardianGrowth.stats.defense).toBeGreaterThan(aggressiveGrowth.stats.defense);
      
      // Caster should have high attack but low defense
      expect(casterGrowth.stats.attack).toBeGreaterThanOrEqual(aggressiveGrowth.stats.attack);
    });
  });

  describe('Combat Simulation', () => {
    let strongCharacter, weakCharacter;

    beforeEach(() => {
      strongCharacter = new Character({
        id: CharacterId.generate(),
        name: 'Strong Hero',
        level: 20,
        stats: { hp: 200, maxHP: 200, attack: 50, defense: 40 },
        ai_type: 'aggressive',
      });

      weakCharacter = new Character({
        id: CharacterId.generate(),
        name: 'Weak Hero',
        level: 5,
        stats: { hp: 50, maxHP: 50, attack: 15, defense: 10 },
        ai_type: 'passive',
      });
    });

    test('should simulate combat between characters', () => {
      const result = domainService.simulateCombat(strongCharacter, weakCharacter);

      expect(result).toHaveProperty('attacker');
      expect(result).toHaveProperty('defender');
      expect(result).toHaveProperty('balance');
      
      expect(result.attacker.wins + result.defender.wins).toBe(10); // default rounds
      expect(result.attacker.winRate).toBeGreaterThanOrEqual(0);
      expect(result.attacker.winRate).toBeLessThanOrEqual(1);
      expect(result.defender.winRate).toBeGreaterThanOrEqual(0);
      expect(result.defender.winRate).toBeLessThanOrEqual(1);
    });

    test('should provide detailed combat log when requested', () => {
      const result = domainService.simulateCombat(strongCharacter, weakCharacter, { 
        rounds: 5, 
        detailed: true 
      });

      expect(result.combatLog).toHaveLength(5);
      expect(result.combatLog[0]).toHaveProperty('winner');
      expect(result.combatLog[0]).toHaveProperty('turns');
    });

    test('should provide balance rating and suggestions', () => {
      const result = domainService.simulateCombat(strongCharacter, weakCharacter);

      expect(result.balance).toHaveProperty('rating');
      expect(result.balance).toHaveProperty('isBalanced');
      expect(result.balance).toHaveProperty('suggestion');
      expect(typeof result.balance.rating).toBe('number');
      expect(typeof result.balance.isBalanced).toBe('boolean');
    });

    test('should throw error for non-Character parameters', () => {
      expect(() => domainService.simulateCombat('invalid', weakCharacter))
        .toThrow('Both attacker and defender must be Character instances');
      
      expect(() => domainService.simulateCombat(strongCharacter, null))
        .toThrow('Both attacker and defender must be Character instances');
    });
  });

  describe('Character Ranking', () => {
    let characters;

    beforeEach(() => {
      characters = [
        new Character({
          id: CharacterId.generate(),
          name: 'High Level',
          level: 50,
          stats: { hp: 400, maxHP: 400, attack: 100, defense: 80 },
          ai_type: 'aggressive',
          gold: 2000,
        }),
        new Character({
          id: CharacterId.generate(),
          name: 'High Attack',
          level: 20,
          stats: { hp: 150, maxHP: 150, attack: 80, defense: 30 },
          ai_type: 'caster',
          gold: 800,
        }),
        new Character({
          id: CharacterId.generate(),
          name: 'Balanced',
          level: 30,
          stats: { hp: 250, maxHP: 250, attack: 60, defense: 60 },
          ai_type: 'guardian',
          gold: 1200,
        }),
      ];
    });

    test('should rank characters by overall score', () => {
      const ranking = domainService.rankCharacters(characters, 'overall');

      expect(ranking).toHaveProperty('criteria', 'overall');
      expect(ranking).toHaveProperty('rankings');
      expect(ranking).toHaveProperty('summary');
      
      expect(ranking.rankings).toHaveLength(3);
      expect(ranking.rankings[0].rank).toBe(1);
      expect(ranking.rankings[1].rank).toBe(2);
      expect(ranking.rankings[2].rank).toBe(3);

      // Rankings should be sorted by score (highest first)
      expect(ranking.rankings[0].score).toBeGreaterThanOrEqual(ranking.rankings[1].score);
      expect(ranking.rankings[1].score).toBeGreaterThanOrEqual(ranking.rankings[2].score);
    });

    test('should rank characters by combat effectiveness', () => {
      const ranking = domainService.rankCharacters(characters, 'combat');

      expect(ranking.criteria).toBe('combat');
      
      // High Level character should likely rank high in combat
      const highLevelRank = ranking.rankings.find(r => r.character.name === 'High Level').rank;
      expect(highLevelRank).toBeLessThanOrEqual(2); // Should be in top 2
    });

    test('should rank characters by level', () => {
      const ranking = domainService.rankCharacters(characters, 'level');

      expect(ranking.criteria).toBe('level');
      expect(ranking.rankings[0].character.name).toBe('High Level'); // Level 50 should be first
    });

    test('should provide character analysis for each ranking', () => {
      const ranking = domainService.rankCharacters(characters, 'overall');

      ranking.rankings.forEach(entry => {
        expect(entry).toHaveProperty('analysis');
        expect(entry.analysis).toHaveProperty('strengths');
        expect(entry.analysis).toHaveProperty('weaknesses');
        expect(entry.analysis).toHaveProperty('archetype');
        expect(entry.analysis).toHaveProperty('powerRating');
      });
    });

    test('should throw error for empty character array', () => {
      expect(() => domainService.rankCharacters([]))
        .toThrow('Must provide at least one valid Character instance');
    });

    test('should throw error for non-array parameter', () => {
      expect(() => domainService.rankCharacters('invalid'))
        .toThrow('Characters must be an array');
    });

    test('should filter out non-Character instances', () => {
      const mixedArray = [characters[0], 'invalid', characters[1], null];
      const ranking = domainService.rankCharacters(mixedArray, 'overall');

      expect(ranking.rankings).toHaveLength(2);
      expect(ranking.summary.totalCharacters).toBe(2);
    });
  });

  describe('Character Progression Validation', () => {
    test('should validate normal character progression', () => {
      const normalChar = new Character({
        id: CharacterId.generate(),
        name: 'Normal Hero',
        level: 20,
        stats: { hp: 180, maxHP: 200, attack: 60, defense: 40 },
        ai_type: 'aggressive',
        gold: 1000,
        skill_points: 3,
      });

      const validation = domainService.validateCharacterProgression(normalChar);

      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('issues');
      expect(validation).toHaveProperty('warnings');
      expect(validation).toHaveProperty('suggestions');
      expect(validation).toHaveProperty('overallRating');
      
      expect(Array.isArray(validation.issues)).toBe(true);
      expect(Array.isArray(validation.warnings)).toBe(true);
      expect(Array.isArray(validation.suggestions)).toBe(true);
    });

    test('should identify stat imbalances', () => {
      const glassCannonChar = new Character({
        id: CharacterId.generate(),
        name: 'Glass Cannon',
        level: 20,
        stats: { hp: 150, maxHP: 150, attack: 150, defense: 20 }, // Very high attack/defense ratio
        ai_type: 'caster',
        gold: 1000,
      });

      const validation = domainService.validateCharacterProgression(glassCannonChar);

      expect(validation.warnings.some(w => w.includes('glass cannon'))).toBe(true);
    });

    test('should identify low stats for level', () => {
      const understatChar = new Character({
        id: CharacterId.generate(),
        name: 'Weak Hero',
        level: 50,
        stats: { hp: 100, maxHP: 100, attack: 20, defense: 15 }, // Very low stats for level 50
        ai_type: 'passive',
        gold: 100,
      });

      const validation = domainService.validateCharacterProgression(understatChar);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });

    test('should provide suggestions for improvement', () => {
      const richChar = new Character({
        id: CharacterId.generate(),
        name: 'Rich Hero',
        level: 10,
        stats: { hp: 80, maxHP: 100, attack: 30, defense: 25 },
        ai_type: 'aggressive',
        gold: 5000, // Unusually high gold for level
        skill_points: 15, // Many unspent skill points
      });

      const validation = domainService.validateCharacterProgression(richChar);

      expect(validation.warnings.some(w => w.includes('unusually high gold'))).toBe(true);
      expect(validation.suggestions.some(s => s.includes('skill points'))).toBe(true);
    });

    test('should throw error for non-Character parameter', () => {
      expect(() => domainService.validateCharacterProgression({ level: 10 }))
        .toThrow('Must provide a Character instance');
    });
  });

  describe('Equipment Recommendations', () => {
    test('should generate recommendations for tank role', () => {
      const tankChar = new Character({
        id: CharacterId.generate(),
        name: 'Tank Hero',
        level: 30,
        stats: { hp: 400, maxHP: 400, attack: 40, defense: 100 },
        ai_type: 'guardian',
      });

      const recommendations = domainService.generateEquipmentRecommendations(tankChar, 'tank');

      expect(recommendations).toHaveProperty('role', 'tank');
      expect(recommendations).toHaveProperty('primary');
      expect(recommendations).toHaveProperty('secondary');
      expect(recommendations).toHaveProperty('reasoning');
      
      expect(recommendations.primary.some(item => item.includes('Armor') || item.includes('Shield'))).toBe(true);
    });

    test('should generate recommendations for damage role', () => {
      const damageChar = new Character({
        id: CharacterId.generate(),
        name: 'Damage Hero',
        level: 25,
        stats: { hp: 150, maxHP: 150, attack: 80, defense: 30 },
        ai_type: 'aggressive',
      });

      const recommendations = domainService.generateEquipmentRecommendations(damageChar, 'damage');

      expect(recommendations.role).toBe('damage');
      expect(recommendations.primary.some(item => item.includes('damage') || item.includes('weapon'))).toBe(true);
    });

    test('should provide level-appropriate recommendations', () => {
      const lowLevelChar = testCharacter.update({ level: 5 });
      const highLevelChar = testCharacter.update({ level: 80 });

      const lowRec = domainService.generateEquipmentRecommendations(lowLevelChar);
      const highRec = domainService.generateEquipmentRecommendations(highLevelChar);

      expect(lowRec.reasoning.some(r => r.includes('low levels'))).toBe(true);
      expect(highRec.reasoning.some(r => r.includes('high-level') || r.includes('advanced'))).toBe(true);
    });

    test('should throw error for non-Character parameter', () => {
      expect(() => domainService.generateEquipmentRecommendations({ level: 10 }))
        .toThrow('Must provide a Character instance');
    });
  });

  describe('Stat Distribution Optimization', () => {
    test('should optimize stat distribution for character build', () => {
      const optimization = domainService.optimizeStatDistribution(testCharacter, {
        targetRole: 'damage',
        targetLevel: 20,
      });

      expect(optimization).toHaveProperty('levels');
      expect(optimization).toHaveProperty('totalPoints');
      expect(optimization).toHaveProperty('allocation');
      expect(optimization).toHaveProperty('projectedStats');
      expect(optimization).toHaveProperty('efficiency');
      
      expect(optimization.levels).toBe(10); // 20 - 10
      expect(optimization.totalPoints).toBeGreaterThan(0);
    });

    test('should respect build constraints', () => {
      const optimization = domainService.optimizeStatDistribution(testCharacter, {
        targetRole: 'tank',
        targetLevel: 15,
        constraints: { maxAttackIncrease: 5 },
      });

      expect(optimization.allocation.attack).toBeLessThanOrEqual(5);
    });

    test('should calculate efficiency ratings', () => {
      const optimization = domainService.optimizeStatDistribution(testCharacter);

      Object.keys(optimization.efficiency).forEach(stat => {
        expect(typeof optimization.efficiency[stat]).toBe('number');
        expect(optimization.efficiency[stat]).toBeGreaterThanOrEqual(0);
      });
    });

    test('should throw error for non-Character parameter', () => {
      expect(() => domainService.optimizeStatDistribution({ level: 10 }))
        .toThrow('Must provide a Character instance');
    });
  });

  describe('Stat Points Calculation', () => {
    test('should calculate base stat points per level', () => {
      const basePoints = domainService.getStatPointsForLevel(5);
      expect(basePoints).toBeGreaterThanOrEqual(3); // Base 3 points
    });

    test('should provide bonus points at milestone levels', () => {
      const level10Points = domainService.getStatPointsForLevel(10);
      const level25Points = domainService.getStatPointsForLevel(25);
      const level50Points = domainService.getStatPointsForLevel(50);

      expect(level10Points).toBeGreaterThan(3); // Should have milestone bonus
      expect(level25Points).toBeGreaterThan(level10Points); // Should have larger bonus
      expect(level50Points).toBeGreaterThan(level10Points); // Should have bonus
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle characters with extreme stats', () => {
      const extremeChar = new Character({
        id: CharacterId.generate(),
        name: 'Extreme Hero',
        level: 100,
        stats: { hp: 1, maxHP: 1, attack: 999, defense: 1 },
        ai_type: 'caster',
        gold: 999999,
        skill_points: 100,
      });

      // Should not throw errors
      expect(() => domainService.validateCharacterProgression(extremeChar)).not.toThrow();
      expect(() => domainService.generateEquipmentRecommendations(extremeChar)).not.toThrow();
      expect(() => domainService.rankCharacters([extremeChar])).not.toThrow();
    });

    test('should handle combat simulation edge cases', () => {
      const invincibleChar = new Character({
        id: CharacterId.generate(),
        name: 'Invincible',
        level: 100,
        stats: { hp: 9999, maxHP: 9999, attack: 999, defense: 999 },
        ai_type: 'tank',
      });

      const weakChar = new Character({
        id: CharacterId.generate(),
        name: 'Weak',
        level: 1,
        stats: { hp: 1, maxHP: 1, attack: 1, defense: 1 },
        ai_type: 'passive',
      });

      // Should complete without infinite loops
      const result = domainService.simulateCombat(invincibleChar, weakChar, { rounds: 3 });
      expect(result.attacker.wins + result.defender.wins).toBe(3);
    });
  });
});