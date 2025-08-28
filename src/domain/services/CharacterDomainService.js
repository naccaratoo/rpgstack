/**
 * Character Domain Service
 * 
 * Domain service that encapsulates business logic that doesn't naturally
 * belong to a single entity or value object. Handles complex business
 * operations involving multiple domain objects.
 * 
 * Features:
 * - Character level progression calculations
 * - Combat simulation and balancing
 * - Character comparison and ranking
 * - Progression validation and constraints
 * - Business rule enforcement across entities
 */

import { Character } from '../entities/Character.js';
import { CharacterId } from '../value-objects/CharacterId.js';
import { Stats } from '../value-objects/Stats.js';
import { Combat } from '../value-objects/Combat.js';

export class CharacterDomainService {
  
  /**
   * Calculate stat increases for character level up
   * @param {Character} character - Character to level up
   * @param {Object} options - Level up options
   * @param {number} options.statPoints - Available stat points to distribute
   * @param {string} options.growthPattern - Growth pattern ('balanced', 'offensive', 'defensive', 'specialized')
   * @param {Object} options.preferences - Stat preferences for distribution
   * @returns {Object} Calculated stat increases
   */
  calculateLevelUpStats(character, options = {}) {
    if (!(character instanceof Character)) {
      throw new Error('Must provide a Character instance');
    }

    if (character.level >= Character.MAX_LEVEL) {
      throw new Error('Character is already at maximum level');
    }

    const {
      statPoints = this.getStatPointsForLevel(character.level + 1),
      growthPattern = 'balanced',
      preferences = {},
    } = options;

    // Calculate base growth based on character's AI type and current stats
    const baseGrowth = this._calculateBaseGrowth(character, growthPattern);
    
    // Apply stat point distribution
    const statIncreases = this._distributeStatPoints(baseGrowth, statPoints, preferences);
    
    // Validate proposed increases don't exceed caps
    this._validateStatIncreases(character, statIncreases);

    return {
      stats: {
        hp: statIncreases.hp || 0,
        maxHP: statIncreases.maxHP || 0,
        attack: statIncreases.attack || 0,
        defense: statIncreases.defense || 0,
      },
      combat: statIncreases.combat || {},
      skill_points: statIncreases.skill_points || 1,
      estimatedPower: this._estimatePowerAfterLevelUp(character, statIncreases),
    };
  }

  /**
   * Simulate combat between two characters
   * @param {Character} attacker - Attacking character
   * @param {Character} defender - Defending character
   * @param {Object} options - Combat simulation options
   * @param {number} options.rounds - Number of combat rounds to simulate
   * @param {boolean} options.detailed - Return detailed combat log
   * @returns {Object} Combat simulation result
   */
  simulateCombat(attacker, defender, options = {}) {
    if (!(attacker instanceof Character) || !(defender instanceof Character)) {
      throw new Error('Both attacker and defender must be Character instances');
    }

    const { rounds = 10, detailed = false } = options;
    const combatLog = [];
    let attackerWins = 0;
    let defenderWins = 0;

    // Get combat stats (for now, derive from base stats)
    const attackerCombat = this._deriveBasicCombatStats(attacker);
    const defenderCombat = this._deriveBasicCombatStats(defender);

    for (let round = 0; round < rounds; round++) {
      const result = this._simulateSingleCombat(
        attacker, defender, 
        attackerCombat, defenderCombat, 
        detailed
      );

      if (result.winner === 'attacker') {
        attackerWins++;
      } else {
        defenderWins++;
      }

      if (detailed) {
        combatLog.push(result);
      }
    }

    const winRate = attackerWins / rounds;
    const balanceRating = this._calculateBalanceRating(winRate);

    return {
      attacker: {
        character: attacker,
        wins: attackerWins,
        winRate: winRate,
        averageDamageDealt: combatLog.reduce((sum, log) => 
          sum + (log.attackerDamage || 0), 0) / rounds,
      },
      defender: {
        character: defender,
        wins: defenderWins,
        winRate: 1 - winRate,
        averageDamageDealt: combatLog.reduce((sum, log) => 
          sum + (log.defenderDamage || 0), 0) / rounds,
      },
      balance: {
        rating: balanceRating,
        isBalanced: balanceRating >= 40 && balanceRating <= 60,
        suggestion: this._getBalanceSuggestion(winRate, attacker, defender),
      },
      combatLog: detailed ? combatLog : [],
    };
  }

  /**
   * Compare and rank multiple characters
   * @param {Character[]} characters - Characters to compare
   * @param {string} criteria - Ranking criteria ('overall', 'combat', 'level', 'potential')
   * @returns {Object} Ranking result
   */
  rankCharacters(characters, criteria = 'overall') {
    if (!Array.isArray(characters)) {
      throw new Error('Characters must be an array');
    }

    const validCharacters = characters.filter(char => char instanceof Character);
    if (validCharacters.length === 0) {
      throw new Error('Must provide at least one valid Character instance');
    }

    const rankedCharacters = validCharacters.map(character => ({
      character,
      score: this._calculateRankingScore(character, criteria),
      analysis: this._analyzeCharacterStrengths(character),
    }));

    // Sort by score (highest first)
    rankedCharacters.sort((a, b) => b.score - a.score);

    return {
      criteria,
      rankings: rankedCharacters.map((item, index) => ({
        rank: index + 1,
        character: item.character,
        score: item.score,
        analysis: item.analysis,
      })),
      summary: {
        totalCharacters: validCharacters.length,
        averageScore: rankedCharacters.reduce((sum, item) => sum + item.score, 0) / validCharacters.length,
        scoreRange: {
          highest: rankedCharacters[0]?.score || 0,
          lowest: rankedCharacters[rankedCharacters.length - 1]?.score || 0,
        },
      },
    };
  }

  /**
   * Validate character progression constraints
   * @param {Character} character - Character to validate
   * @returns {Object} Validation result
   */
  validateCharacterProgression(character) {
    if (!(character instanceof Character)) {
      throw new Error('Must provide a Character instance');
    }

    const issues = [];
    const warnings = [];
    const suggestions = [];

    // Check level-stat consistency
    const expectedStats = this._getExpectedStatsForLevel(character.level);
    if (character.stats.attack < expectedStats.minAttack) {
      issues.push(`Attack (${character.stats.attack}) is below expected minimum (${expectedStats.minAttack}) for level ${character.level}`);
    }

    if (character.stats.defense < expectedStats.minDefense) {
      issues.push(`Defense (${character.stats.defense}) is below expected minimum (${expectedStats.minDefense}) for level ${character.level}`);
    }

    if (character.stats.maxHP < expectedStats.minMaxHP) {
      issues.push(`Max HP (${character.stats.maxHP}) is below expected minimum (${expectedStats.minMaxHP}) for level ${character.level}`);
    }

    // Check for stat imbalances
    const statRatio = character.stats.attack / character.stats.defense;
    if (statRatio > 3.0) {
      warnings.push('Character has very high attack relative to defense (glass cannon)');
      suggestions.push('Consider investing in defense to improve survivability');
    } else if (statRatio < 0.5) {
      warnings.push('Character has very high defense relative to attack (low damage output)');
      suggestions.push('Consider investing in attack to improve damage dealing');
    }

    // Check for unusual gold-to-level ratio
    const expectedGold = character.level * 50;
    if (character.gold > expectedGold * 3) {
      warnings.push('Character has unusually high gold for their level');
    } else if (character.gold < expectedGold * 0.1) {
      warnings.push('Character has very little gold for their level');
    }

    // Check skill point accumulation
    if (character.skillPoints > character.level) {
      suggestions.push('Character has accumulated many skill points - consider spending them');
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      suggestions,
      overallRating: this._calculateProgressionRating(issues, warnings),
    };
  }

  /**
   * Generate recommended equipment loadout for character
   * @param {Character} character - Character to analyze
   * @param {string} role - Intended role ('tank', 'damage', 'balanced')
   * @returns {Object} Equipment recommendations
   */
  generateEquipmentRecommendations(character, role = 'balanced') {
    if (!(character instanceof Character)) {
      throw new Error('Must provide a Character instance');
    }

    const analysis = this._analyzeCharacterStrengths(character);
    const recommendations = {
      role,
      primary: [],
      secondary: [],
      reasoning: [],
    };

    // Analyze current stats and AI type
    if (role === 'tank' || character.aiType === 'guardian' || character.aiType === 'tank') {
      recommendations.primary.push('Heavy Armor (Defense +20-40)');
      recommendations.primary.push('Shield (Defense +15-25, Block Chance +10%)');
      recommendations.secondary.push('Health Accessories (Max HP +50-100)');
      recommendations.reasoning.push('Focus on defense and survivability for tanking role');
      
    } else if (role === 'damage' || character.aiType === 'aggressive' || character.aiType === 'caster') {
      recommendations.primary.push('High-damage weapon (Attack +30-50)');
      if (character.aiType === 'caster') {
        recommendations.primary.push('Magic Focus (Critical Rate +10-20%)');
      } else {
        recommendations.primary.push('Critical Strike Accessory (Critical Damage +0.5x)');
      }
      recommendations.secondary.push('Attack Boost Items (Attack +10-20)');
      recommendations.reasoning.push('Maximize damage output for offensive role');
      
    } else {
      // Balanced approach
      recommendations.primary.push('Balanced Weapon (Attack +20-30)');
      recommendations.primary.push('Medium Armor (Defense +15-25)');
      recommendations.secondary.push('Stat Boost Accessories (All stats +5-10)');
      recommendations.reasoning.push('Well-rounded equipment for versatile gameplay');
    }

    // Add level-appropriate recommendations
    if (character.level < 20) {
      recommendations.reasoning.push('Focus on basic stat improvements at low levels');
    } else if (character.level < 50) {
      recommendations.reasoning.push('Consider specialized equipment for chosen role');
    } else {
      recommendations.reasoning.push('High-level character can use advanced equipment sets');
    }

    return recommendations;
  }

  /**
   * Calculate optimal stat point distribution for character build
   * @param {Character} character - Character to analyze
   * @param {Object} buildGoals - Build goals and preferences
   * @returns {Object} Optimal stat distribution
   */
  optimizeStatDistribution(character, buildGoals = {}) {
    if (!(character instanceof Character)) {
      throw new Error('Must provide a Character instance');
    }

    const {
      targetRole = 'balanced',
      targetLevel = Math.min(100, character.level + 10),
      priorityStats = [],
      constraints = {},
    } = buildGoals;

    const currentStats = character.stats;
    const targetStats = this._calculateOptimalStats(character, targetRole, targetLevel);
    const levelDifference = targetLevel - character.level;
    const availablePoints = levelDifference * this.getStatPointsForLevel(1); // Base points per level

    const distribution = {
      levels: levelDifference,
      totalPoints: availablePoints,
      allocation: {},
      projectedStats: {},
      efficiency: {},
    };

    // Calculate point allocation
    Object.keys(targetStats).forEach(stat => {
      const currentValue = currentStats[stat] || 0;
      const targetValue = targetStats[stat];
      const pointsNeeded = Math.max(0, targetValue - currentValue);
      
      distribution.allocation[stat] = Math.min(pointsNeeded, availablePoints * 0.4); // Max 40% of points in any stat
      distribution.projectedStats[stat] = currentValue + distribution.allocation[stat];
      distribution.efficiency[stat] = distribution.allocation[stat] > 0 ? 
        (targetValue - currentValue) / distribution.allocation[stat] : 0;
    });

    return distribution;
  }

  // Private helper methods

  /**
   * Get stat points awarded for reaching a specific level
   * @private
   * @param {number} level - Character level
   * @returns {number} Stat points
   */
  getStatPointsForLevel(level) {
    // Base 3 points per level, with bonus points at milestone levels
    let points = 3;
    if (level % 10 === 0) points += 2; // Bonus at levels 10, 20, 30, etc.
    if (level % 25 === 0) points += 3; // Extra bonus at levels 25, 50, 75, 100
    return points;
  }

  /**
   * Calculate base growth pattern for character
   * @private
   */
  _calculateBaseGrowth(character, growthPattern) {
    const aiTypeModifiers = {
      aggressive: { attack: 1.3, defense: 0.8, hp: 1.0 },
      guardian: { attack: 0.8, defense: 1.3, hp: 1.2 },
      tank: { attack: 0.7, defense: 1.5, hp: 1.3 },
      caster: { attack: 1.4, defense: 0.6, hp: 0.9 },
      passive: { attack: 0.9, defense: 1.1, hp: 1.1 },
      ambush: { attack: 1.2, defense: 0.9, hp: 0.95 },
      pack: { attack: 1.1, defense: 1.0, hp: 1.05 },
    };

    const patternModifiers = {
      balanced: { attack: 1.0, defense: 1.0, hp: 1.0 },
      offensive: { attack: 1.5, defense: 0.7, hp: 0.8 },
      defensive: { attack: 0.7, defense: 1.5, hp: 1.3 },
      specialized: { attack: 1.2, defense: 1.2, hp: 0.6 },
    };

    const aiMod = aiTypeModifiers[character.aiType] || aiTypeModifiers.passive;
    const patternMod = patternModifiers[growthPattern] || patternModifiers.balanced;

    return {
      attack: Math.floor(3 * aiMod.attack * patternMod.attack),
      defense: Math.floor(2 * aiMod.defense * patternMod.defense),
      maxHP: Math.floor(8 * aiMod.hp * patternMod.hp),
    };
  }

  /**
   * Distribute stat points based on growth and preferences
   * @private
   */
  _distributeStatPoints(baseGrowth, totalPoints, preferences) {
    const distribution = { ...baseGrowth };
    let remainingPoints = totalPoints - (baseGrowth.attack + baseGrowth.defense + baseGrowth.maxHP);

    // Apply preferences
    Object.keys(preferences).forEach(stat => {
      const bonus = Math.min(remainingPoints, preferences[stat]);
      if (distribution[stat] !== undefined) {
        distribution[stat] += bonus;
        remainingPoints -= bonus;
      }
    });

    // Distribute any remaining points evenly
    const stats = Object.keys(distribution);
    while (remainingPoints > 0) {
      stats.forEach(stat => {
        if (remainingPoints > 0) {
          distribution[stat]++;
          remainingPoints--;
        }
      });
    }

    return distribution;
  }

  /**
   * Validate proposed stat increases don't exceed reasonable caps
   * @private
   */
  _validateStatIncreases(character, increases) {
    const maxIncreasePerLevel = 20;
    
    Object.keys(increases).forEach(stat => {
      if (increases[stat] > maxIncreasePerLevel) {
        throw new Error(`Stat increase for ${stat} (${increases[stat]}) exceeds maximum per level (${maxIncreasePerLevel})`);
      }
    });
  }

  /**
   * Estimate character power after level up
   * @private
   */
  _estimatePowerAfterLevelUp(character, increases) {
    const newStats = new Stats({
      hp: character.stats.hp,
      maxHP: character.stats.maxHP + (increases.maxHP || 0),
      attack: character.stats.attack + (increases.attack || 0),
      defense: character.stats.defense + (increases.defense || 0),
    });

    return newStats.attack + newStats.defense + (newStats.maxHP * 0.1) + (character.level + 1) * 2;
  }

  /**
   * Derive basic combat stats from character
   * @private
   */
  _deriveBasicCombatStats(character) {
    return new Combat({
      attack: character.stats.attack,
      defense: character.stats.defense,
      accuracy: 85,
      evasion: 5,
      criticalRate: Math.min(25, character.level),
      criticalDamage: 1.5,
    });
  }

  /**
   * Simulate a single combat encounter
   * @private
   */
  _simulateSingleCombat(attacker, defender, attackerCombat, defenderCombat, detailed) {
    let attackerHP = attacker.stats.hp;
    let defenderHP = defender.stats.hp;
    
    const log = detailed ? [] : null;
    let turn = 0;

    while (attackerHP > 0 && defenderHP > 0 && turn < 100) { // Max 100 turns to prevent infinite loops
      // Attacker's turn
      const attackResult = attackerCombat.calculateDamage(defenderCombat, attacker.level, defender.level);
      if (attackResult.canHit) {
        defenderHP -= attackResult.damage;
        if (detailed) {
          log.push({
            turn: turn + 1,
            attacker: attacker.name,
            damage: attackResult.damage,
            critical: attackResult.isCritical,
            defenderHP: Math.max(0, defenderHP),
          });
        }
      }

      if (defenderHP <= 0) break;

      // Defender's turn
      const counterResult = defenderCombat.calculateDamage(attackerCombat, defender.level, attacker.level);
      if (counterResult.canHit) {
        attackerHP -= counterResult.damage;
        if (detailed) {
          log.push({
            turn: turn + 1,
            attacker: defender.name,
            damage: counterResult.damage,
            critical: counterResult.isCritical,
            defenderHP: Math.max(0, attackerHP),
          });
        }
      }

      turn++;
    }

    return {
      winner: attackerHP > 0 ? 'attacker' : 'defender',
      turns: turn,
      attackerDamage: attacker.stats.hp - attackerHP,
      defenderDamage: defender.stats.hp - defenderHP,
      log,
    };
  }

  /**
   * Calculate balance rating from win rate
   * @private
   */
  _calculateBalanceRating(winRate) {
    // Perfect balance is 50% win rate
    const deviation = Math.abs(winRate - 0.5);
    return Math.max(0, 100 - (deviation * 200));
  }

  /**
   * Get balance suggestion based on combat results
   * @private
   */
  _getBalanceSuggestion(winRate, attacker, defender) {
    if (winRate > 0.7) {
      return `${attacker.name} is significantly stronger. Consider reducing attack or increasing ${defender.name}'s defense.`;
    } else if (winRate < 0.3) {
      return `${defender.name} is significantly stronger. Consider reducing their defense or increasing ${attacker.name}'s attack.`;
    }
    return 'Characters appear well-balanced for combat.';
  }

  /**
   * Calculate ranking score for character based on criteria
   * @private
   */
  _calculateRankingScore(character, criteria) {
    switch (criteria) {
      case 'combat':
        return character.stats.attack + character.stats.defense + (character.stats.maxHP * 0.1);
      
      case 'level':
        return character.level * 100 + character.experience;
      
      case 'potential':
        return (Character.MAX_LEVEL - character.level) * (character.stats.attack + character.stats.defense) * 0.1;
      
      case 'overall':
      default:
        return (
          character.level * 10 +
          character.stats.attack +
          character.stats.defense +
          (character.stats.maxHP * 0.1) +
          (character.gold * 0.01) +
          (character.skillPoints * 5)
        );
    }
  }

  /**
   * Analyze character strengths and weaknesses
   * @private
   */
  _analyzeCharacterStrengths(character) {
    const strengths = [];
    const weaknesses = [];
    const stats = character.stats;

    // Analyze stats relative to level
    const expectedAttack = character.level * 3;
    const expectedDefense = character.level * 2;
    const expectedMaxHP = character.level * 10;

    if (stats.attack > expectedAttack * 1.5) strengths.push('High Attack');
    else if (stats.attack < expectedAttack * 0.7) weaknesses.push('Low Attack');

    if (stats.defense > expectedDefense * 1.5) strengths.push('High Defense');
    else if (stats.defense < expectedDefense * 0.7) weaknesses.push('Low Defense');

    if (stats.maxHP > expectedMaxHP * 1.5) strengths.push('High HP');
    else if (stats.maxHP < expectedMaxHP * 0.7) weaknesses.push('Low HP');

    if (character.level > 75) strengths.push('High Level');
    else if (character.level < 10) weaknesses.push('Low Level');

    return {
      strengths,
      weaknesses,
      archetype: this._determineArchetype(character),
      powerRating: this._calculatePowerRating(character),
    };
  }

  /**
   * Determine character archetype based on stats and AI type
   * @private
   */
  _determineArchetype(character) {
    const stats = character.stats;
    const attackDefenseRatio = stats.attack / stats.defense;

    if (character.aiType === 'guardian' || character.aiType === 'tank') return 'Tank';
    if (character.aiType === 'caster') return 'Mage';
    if (character.aiType === 'ambush' || attackDefenseRatio > 2) return 'Assassin';
    if (attackDefenseRatio > 1.5) return 'Warrior';
    if (attackDefenseRatio < 0.8) return 'Defender';
    return 'Balanced';
  }

  /**
   * Calculate overall power rating for character
   * @private
   */
  _calculatePowerRating(character) {
    const baseRating = character.stats.attack + character.stats.defense + (character.stats.maxHP * 0.1);
    const levelBonus = character.level * 2;
    const goldBonus = Math.min(100, character.gold * 0.01);
    
    return Math.floor(baseRating + levelBonus + goldBonus);
  }

  /**
   * Get expected stats for a given level
   * @private
   */
  _getExpectedStatsForLevel(level) {
    return {
      minAttack: level * 2,
      minDefense: level * 1.5,
      minMaxHP: level * 8,
    };
  }

  /**
   * Calculate progression rating based on issues and warnings
   * @private
   */
  _calculateProgressionRating(issues, warnings) {
    let rating = 100;
    rating -= issues.length * 20; // -20 points per issue
    rating -= warnings.length * 10; // -10 points per warning
    return Math.max(0, rating);
  }

  /**
   * Calculate optimal stats for character role and level
   * @private
   */
  _calculateOptimalStats(character, role, targetLevel) {
    const levelMultiplier = targetLevel / character.level;
    const baseStats = character.stats;

    const roleMultipliers = {
      tank: { attack: 0.8, defense: 1.5, maxHP: 1.3 },
      damage: { attack: 1.5, defense: 0.8, maxHP: 1.0 },
      balanced: { attack: 1.1, defense: 1.1, maxHP: 1.1 },
    };

    const multipliers = roleMultipliers[role] || roleMultipliers.balanced;

    return {
      attack: Math.floor(baseStats.attack * levelMultiplier * multipliers.attack),
      defense: Math.floor(baseStats.defense * levelMultiplier * multipliers.defense),
      maxHP: Math.floor(baseStats.maxHP * levelMultiplier * multipliers.maxHP),
    };
  }
}