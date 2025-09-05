/**
 * Sistema Avançado de Cálculo de Dano - RPGStack
 * 
 * Implementa as fórmulas de dano baseadas em rpg-damage-formula.md
 * Sistema completo com dano físico, mágico, AoE e modificadores.
 * Integrado com sistema anti-cheat para validação segura.
 */

export class DamageCalculationSystem {
  constructor(characterDatabase = null) {
    this.characterDatabase = characterDatabase;
    
    // Configurações do sistema
    this.config = {
      // Caps de dano
      minDamage: 1,
      maxDamage: 9999,
      
      // Variação aleatória
      randomVariationMin: 0.9,   // -10%
      randomVariationMax: 1.1,   // +10%
      
      // Críticos
      baseCriticalChance: 0.05,  // 5%
      baseCriticalMultiplier: 1.5,
      
      // AoE
      aoeFixedReducer: 0.6,
      aoeFocusMain: 1.0,
      aoeFocusSecondary: 0.4,
      aoeDecrescentCenter: 1.0,
      aoeDecrescentAdjacent: 0.7,
      aoeDecrescentBorder: 0.4,
      
      // Debug
      debugMode: true,
      logCalculations: true
    };

    // Tipos de skills e multiplicadores
    this.skillMultipliers = {
      'basic': 1.0,
      'intermediate': 1.75,
      'advanced': 2.5,
      'special': 3.0,
      'support': 0.75
    };

    // Dano base por categoria
    this.baseDamageRanges = {
      'basic': { min: 10, max: 50 },
      'intermediate': { min: 30, max: 80 },
      'advanced': { min: 60, max: 120 },
      'special': { min: 100, max: 200 }
    };

    console.log('✅ DamageCalculationSystem inicializado');
  }

  /**
   * Cálculo principal de dano físico
   * Fórmula: (Ataque × Multiplicador + Dano_Base) × (100 ÷ (100 + Defesa)) × Modificadores
   */
  calculatePhysicalDamage(attacker, defender, skill, options = {}) {
    const stats = this._getValidatedStats(attacker, defender);
    const skillData = this._getSkillData(skill);
    
    // Componentes básicos
    const attackPower = stats.attacker.attack || 1;
    const defense = stats.defender.defense || 0;
    const multiplier = skillData.multiplier || this.skillMultipliers[skillData.category] || 1.0;
    const baseDamage = skillData.baseDamage || this._getBaseDamageForCategory(skillData.category);

    // Cálculo base
    let damage = (attackPower * multiplier + baseDamage) * (100 / (100 + defense));

    // Aplicar modificadores
    const modifiers = this._calculateModifiers(attacker, defender, skill, 'physical', options);
    damage = this._applyModifiers(damage, modifiers);

    // Aplicar caps e arredondamento
    damage = this._applyCapsAndRounding(damage);

    // Log do cálculo
    if (this.config.logCalculations) {
      this._logDamageCalculation('Físico', {
        attackPower,
        multiplier,
        baseDamage,
        defense,
        rawDamage: (attackPower * multiplier + baseDamage),
        defenseReduction: (100 / (100 + defense)),
        modifiers,
        finalDamage: damage
      });
    }

    return {
      damage: Math.floor(damage),
      type: 'physical',
      isCritical: modifiers.critical.applied,
      modifiers: modifiers,
      calculation: {
        attackPower,
        defense,
        multiplier,
        baseDamage,
        defenseReduction: (100 / (100 + defense))
      }
    };
  }

  /**
   * Cálculo principal de dano mágico
   * Fórmula: (Ataque_Especial × Multiplicador + Dano_Base) × (100 ÷ (100 + Espírito)) × Modificadores
   */
  calculateMagicalDamage(attacker, defender, skill, options = {}) {
    const stats = this._getValidatedStats(attacker, defender);
    const skillData = this._getSkillData(skill);
    
    // Componentes básicos
    const specialAttack = stats.attacker.special_attack || stats.attacker.ataque_especial || stats.attacker.attack || 1;
    const spirit = stats.defender.spirit || stats.defender.defesa_especial || stats.defender.defense || 0;
    const multiplier = skillData.multiplier || this.skillMultipliers[skillData.category] || 1.5;
    const baseDamage = skillData.baseDamage || this._getBaseDamageForCategory(skillData.category);

    // Cálculo base
    let damage = (specialAttack * multiplier + baseDamage) * (100 / (100 + spirit));

    // Aplicar modificadores
    const modifiers = this._calculateModifiers(attacker, defender, skill, 'magical', options);
    damage = this._applyModifiers(damage, modifiers);

    // Aplicar caps e arredondamento
    damage = this._applyCapsAndRounding(damage);

    // Log do cálculo
    if (this.config.logCalculations) {
      this._logDamageCalculation('Mágico', {
        specialAttack,
        multiplier,
        baseDamage,
        spirit,
        rawDamage: (specialAttack * multiplier + baseDamage),
        spiritReduction: (100 / (100 + spirit)),
        modifiers,
        finalDamage: damage
      });
    }

    return {
      damage: Math.floor(damage),
      type: 'magical',
      isCritical: modifiers.critical.applied,
      modifiers: modifiers,
      calculation: {
        specialAttack,
        spirit,
        multiplier,
        baseDamage,
        spiritReduction: (100 / (100 + spirit))
      }
    };
  }

  /**
   * Sistema de Área (AoE) - 3 tipos diferentes
   */
  calculateAoEDamage(attacker, targets, skill, aoeType = 'fixed', options = {}) {
    const results = [];
    const baseSkillData = this._getSkillData(skill);
    
    // Calcular dano base (single target)
    let baseDamageResult;
    if (skill.damageType === 'magical') {
      baseDamageResult = this.calculateMagicalDamage(attacker, targets[0], skill, { skipModifiers: true });
    } else {
      baseDamageResult = this.calculatePhysicalDamage(attacker, targets[0], skill, { skipModifiers: true });
    }
    
    const baseDamage = baseDamageResult.damage;

    // Aplicar redutores específicos do tipo de AoE
    targets.forEach((target, index) => {
      let aoeReducer = 1.0;
      let position = 'main';

      switch (aoeType) {
        case 'fixed':
          aoeReducer = this.config.aoeFixedReducer; // 0.6x para todos
          position = 'area';
          break;

        case 'focus':
          if (index === 0) {
            aoeReducer = this.config.aoeFocusMain; // 1.0x para o primeiro (alvo principal)
            position = 'main';
          } else {
            aoeReducer = this.config.aoeFocusSecondary; // 0.4x para os demais
            position = 'secondary';
          }
          break;

        case 'decreasing':
          if (index === 0) {
            aoeReducer = this.config.aoeDecrescentCenter; // 1.0x centro
            position = 'center';
          } else if (index <= 2) {
            aoeReducer = this.config.aoeDecrescentAdjacent; // 0.7x adjacentes
            position = 'adjacent';
          } else {
            aoeReducer = this.config.aoeDecrescentBorder; // 0.4x bordas
            position = 'border';
          }
          break;
      }

      // Calcular dano individual com redutor AoE
      let individualDamage = baseDamage * aoeReducer;

      // Aplicar modificadores individuais
      const individualModifiers = this._calculateModifiers(attacker, target, skill, skill.damageType || 'physical', options);
      individualDamage = this._applyModifiers(individualDamage, individualModifiers, { skipCritical: index > 0 && aoeType === 'focus' });

      // Aplicar caps
      individualDamage = this._applyCapsAndRounding(individualDamage);

      results.push({
        target: target,
        damage: Math.floor(individualDamage),
        aoeType: aoeType,
        position: position,
        reducer: aoeReducer,
        isCritical: individualModifiers.critical.applied,
        modifiers: individualModifiers
      });
    });

    // Calcular eficiência total
    const totalDamage = results.reduce((sum, result) => sum + result.damage, 0);
    const singleTargetEquivalent = baseDamage * targets.length;
    const efficiency = totalDamage / singleTargetEquivalent;

    if (this.config.logCalculations) {
      console.log(`📊 [AoE] Tipo: ${aoeType}, Alvos: ${targets.length}, Eficiência: ${(efficiency * 100).toFixed(1)}%`);
    }

    return {
      results: results,
      totalDamage: totalDamage,
      baseDamage: baseDamage,
      aoeType: aoeType,
      efficiency: efficiency,
      targetCount: targets.length
    };
  }

  /**
   * Calcula todos os modificadores aplicáveis
   */
  _calculateModifiers(attacker, defender, skill, damageType, options = {}) {
    const modifiers = {
      // Crítico
      critical: this._calculateCritical(attacker, skill, options),
      
      // Variação aleatória
      random: this._calculateRandomVariation(),
      
      // Bônus de tipo
      typeBonus: this._calculateTypeBonus(attacker, skill, damageType),
      
      // Buffs e debuffs
      buffs: this._calculateBuffs(attacker),
      debuffs: this._calculateDebuffs(defender),
      
      // Passivas culturais (se disponível)
      passives: this._calculatePassiveModifiers(attacker, defender, skill, options),
      
      // Modificadores específicos da skill
      skillSpecific: this._calculateSkillSpecificModifiers(skill),
      
      // Condições especiais
      conditions: this._calculateConditionalModifiers(attacker, defender, skill, options)
    };

    return modifiers;
  }

  /**
   * Aplica todos os modificadores ao dano base
   */
  _applyModifiers(damage, modifiers, applyOptions = {}) {
    let finalDamage = damage;

    // Aplicar modificadores multiplicativos primeiro
    if (!applyOptions.skipCritical && modifiers.critical.applied) {
      finalDamage *= modifiers.critical.multiplier;
    }

    // Aplicar bônus de tipo
    finalDamage *= modifiers.typeBonus.multiplier;

    // Aplicar buffs
    finalDamage *= modifiers.buffs.multiplier;

    // Aplicar debuffs (reduzem dano)
    finalDamage *= modifiers.debuffs.multiplier;

    // Aplicar passivas
    if (modifiers.passives.multiplier !== 1.0) {
      finalDamage *= modifiers.passives.multiplier;
    }

    // Aplicar modificadores aditivos
    finalDamage += modifiers.skillSpecific.flatBonus;
    finalDamage += modifiers.conditions.flatBonus;

    // Aplicar variação aleatória por último
    finalDamage *= modifiers.random.multiplier;

    return finalDamage;
  }

  /**
   * Calcula chance e modificador de crítico
   */
  _calculateCritical(attacker, skill, options = {}) {
    if (options.forceCritical) {
      return {
        applied: true,
        chance: 1.0,
        multiplier: options.criticalMultiplier || this.config.baseCriticalMultiplier
      };
    }

    let criticalChance = this.config.baseCriticalChance;
    
    // Bônus de crítico do personagem
    if (attacker.criticalChance) {
      criticalChance += attacker.criticalChance;
    }
    
    // Bônus de crítico da skill
    if (skill.criticalBonus) {
      criticalChance += skill.criticalBonus;
    }

    const applied = Math.random() < criticalChance;
    
    return {
      applied: applied,
      chance: criticalChance,
      multiplier: applied ? (skill.criticalMultiplier || this.config.baseCriticalMultiplier) : 1.0
    };
  }

  /**
   * Calcula variação aleatória
   */
  _calculateRandomVariation() {
    const variation = this.config.randomVariationMin + 
      (Math.random() * (this.config.randomVariationMax - this.config.randomVariationMin));
    
    return {
      multiplier: variation,
      percentage: (variation - 1.0) * 100
    };
  }

  /**
   * Calcula bônus de tipo elemental/físico
   */
  _calculateTypeBonus(attacker, skill, damageType) {
    let multiplier = 1.0;
    
    // Bônus por afinidade elemental (implementar conforme necessário)
    if (attacker.elementalAffinity && skill.element) {
      if (attacker.elementalAffinity === skill.element) {
        multiplier += 0.2; // +20% se elemento compatível
      }
    }

    return {
      multiplier: multiplier,
      source: attacker.elementalAffinity || 'none'
    };
  }

  /**
   * Calcula bônus de buffs do atacante
   */
  _calculateBuffs(attacker) {
    let multiplier = 1.0;
    const activeBufss = [];

    if (attacker.statusEffects) {
      attacker.statusEffects.forEach(effect => {
        if (effect.type === 'damage_buff') {
          multiplier += (effect.value || 0.1);
          activeBufss.push(effect.name);
        }
      });
    }

    return {
      multiplier: multiplier,
      activeBuffs: activeBufss
    };
  }

  /**
   * Calcula redução por debuffs do defensor
   */
  _calculateDebuffs(defender) {
    let multiplier = 1.0;
    const activeDebuffs = [];

    if (defender.statusEffects) {
      defender.statusEffects.forEach(effect => {
        if (effect.type === 'damage_vulnerability') {
          multiplier += (effect.value || 0.1);
          activeDebuffs.push(effect.name);
        }
      });
    }

    return {
      multiplier: multiplier,
      activeDebuffs: activeDebuffs
    };
  }

  /**
   * Calcula modificadores de passivas culturais
   */
  _calculatePassiveModifiers(attacker, defender, skill, options) {
    let multiplier = 1.0;
    const activePassives = [];

    // Integração com sistema de passivas (se disponível)
    if (options.triggeredPassives) {
      options.triggeredPassives.forEach(passive => {
        if (passive.effectType === 'damage_bonus') {
          multiplier += (passive.value / 100);
          activePassives.push(passive.passiveName);
        }
      });
    }

    return {
      multiplier: multiplier,
      activePassives: activePassives
    };
  }

  /**
   * Modificadores específicos da skill
   */
  _calculateSkillSpecificModifiers(skill) {
    return {
      flatBonus: skill.flatDamageBonus || 0,
      description: skill.specialEffect || null
    };
  }

  /**
   * Modificadores condicionais
   */
  _calculateConditionalModifiers(attacker, defender, skill, options) {
    let flatBonus = 0;
    const conditions = [];

    // Exemplo: bônus se defensor tem HP baixo
    if (defender.currentHP && defender.maxHP) {
      const hpPercentage = defender.currentHP / defender.maxHP;
      if (hpPercentage < 0.25) {
        flatBonus += 20; // +20 dano se alvo tem menos de 25% HP
        conditions.push('low_hp_bonus');
      }
    }

    return {
      flatBonus: flatBonus,
      conditions: conditions
    };
  }

  /**
   * Valida e obtém stats dos personagens
   */
  _getValidatedStats(attacker, defender) {
    return {
      attacker: {
        attack: attacker.attack || attacker.ataque || 1,
        special_attack: attacker.special_attack || attacker.ataque_especial || attacker.attack || 1,
        criticalChance: attacker.criticalChance || attacker.critico || 0
      },
      defender: {
        defense: defender.defense || defender.defesa || 0,
        spirit: defender.spirit || defender.defesa_especial || defender.defense || 0
      }
    };
  }

  /**
   * Processa dados da skill
   */
  _getSkillData(skill) {
    return {
      multiplier: skill.multiplier || null,
      baseDamage: skill.baseDamage || skill.damage || null,
      category: skill.category || 'basic',
      criticalBonus: skill.criticalBonus || 0,
      criticalMultiplier: skill.criticalMultiplier || this.config.baseCriticalMultiplier,
      element: skill.element || null,
      specialEffect: skill.specialEffect || null,
      flatDamageBonus: skill.flatDamageBonus || 0
    };
  }

  /**
   * Obtém dano base para categoria da skill
   */
  _getBaseDamageForCategory(category) {
    const range = this.baseDamageRanges[category] || this.baseDamageRanges['basic'];
    return Math.floor(range.min + Math.random() * (range.max - range.min));
  }

  /**
   * Aplica caps de dano mínimo e máximo
   */
  _applyCapsAndRounding(damage) {
    return Math.max(this.config.minDamage, Math.min(this.config.maxDamage, damage));
  }

  /**
   * Log detalhado do cálculo
   */
  _logDamageCalculation(type, data) {
    if (!this.config.debugMode) return;

    console.log(`\n🎯 [Dano ${type}] Cálculo Detalhado:`);
    console.log(`📊 Poder de Ataque: ${data.attackPower || data.specialAttack}`);
    console.log(`⚡ Multiplicador: ${data.multiplier}x`);
    console.log(`🔢 Dano Base: ${data.baseDamage}`);
    console.log(`🛡️ Defesa: ${data.defense || data.spirit}`);
    console.log(`📉 Redução: ${((data.defenseReduction || data.spiritReduction) * 100).toFixed(1)}%`);
    console.log(`🎲 Dano Final: ${data.finalDamage}`);
    
    if (data.modifiers.critical.applied) {
      console.log(`💥 Crítico aplicado! (${data.modifiers.critical.multiplier}x)`);
    }
  }

  /**
   * Obtém estatísticas do sistema
   */
  getSystemStats() {
    return {
      config: this.config,
      skillMultipliers: this.skillMultipliers,
      baseDamageRanges: this.baseDamageRanges,
      lastCalculation: this.lastCalculation || null
    };
  }

  /**
   * Atualiza configurações
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.debugMode) {
      console.log('⚙️ DamageCalculationSystem configuração atualizada');
    }
  }
}