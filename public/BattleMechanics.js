/**
 * Battle Mechanics Domain Service - Browser Version
 * 
 * Implementa todas as mecânicas de combate do RPGStack v3.3.0
 * incluindo sistema de vantagens de classes, defesa, meditação
 * e cálculo de dano com atributo crítico.
 * 
 * Features:
 * - Sistema de vantagens de classes (pedra-papel-tesoura)
 * - Mecânica de defesa (imunidade a dano não-crítico)
 * - Sistema de meditação (recuperação HP/Ânima)
 * - Cálculo de dano com atributo crítico
 * - Estados de batalha por turno
 * - Cadência do Dragão (Lutador)
 * - Arsenal Adaptativo (Armamentista)
 * - Convergência Ânima (Arcano)
 */

class BattleMechanics {
  /**
   * Tabela de vantagens de classes
   * Lutador > Armamentista > Arcano > Lutador
   */
  static CLASS_ADVANTAGES = {
    'Lutador': 'Armamentista',
    'Armamentista': 'Arcano',
    'Arcano': 'Lutador'
  };

  /**
   * Modificadores de vantagem
   */
  static ADVANTAGE_DAMAGE_BONUS = 1.10; // +10% de dano
  static ADVANTAGE_DAMAGE_REDUCTION = 0.90; // -10% de dano recebido

  /**
   * Valores de recuperação da meditação
   */
  static MEDITATION_ANIMA_RECOVERY = 0.10; // 10% do Ânima máximo
  static MEDITATION_HP_RECOVERY = 0.05; // 5% da vida máxima

  /**
   * Estados de batalha
   */
  constructor() {
    this.battleStates = new Map(); // Armazena estados por ID do personagem
    this.skillStates = new Map(); // Armazena estados específicos de skills
  }

  /**
   * Verifica se atacante tem vantagem de classe sobre o defensor
   * @param {string} attackerClass - Classe do atacante
   * @param {string} defenderClass - Classe do defensor
   * @returns {boolean} True se tem vantagem
   */
  hasAdvantage(attackerClass, defenderClass) {
    return BattleMechanics.CLASS_ADVANTAGES[attackerClass] === defenderClass;
  }

  /**
   * Aplica modificadores de vantagem de classe no dano
   * @param {number} damage - Dano base
   * @param {string} attackerClass - Classe do atacante
   * @param {string} defenderClass - Classe do defensor
   * @returns {number} Dano modificado
   */
  applyClassModifiers(damage, attackerClass, defenderClass) {
    let modifiedDamage = damage;

    // Aplicar bônus de dano se atacante tem vantagem
    if (this.hasAdvantage(attackerClass, defenderClass)) {
      modifiedDamage *= BattleMechanics.ADVANTAGE_DAMAGE_BONUS;
    }

    // Aplicar redução de dano se defensor tem vantagem
    if (this.hasAdvantage(defenderClass, attackerClass)) {
      modifiedDamage *= BattleMechanics.ADVANTAGE_DAMAGE_REDUCTION;
    }

    return Math.round(modifiedDamage);
  }

  /**
   * Calcula dano de ataque básico
   * @param {Object} attacker - Personagem atacante
   * @param {Object} defender - Personagem defensor
   * @returns {number} Dano calculado
   */
  calculateBasicAttackDamage(attacker, defender) {
    // Fórmula: (ATK - (DEF * 0.7)) * critico
    let damage = attacker.attack - (defender.defense * 0.7);
    
    // Aplicar modificador crítico
    damage *= (attacker.critico || 1.0);
    
    // Aplicar modificadores de classe
    damage = this.applyClassModifiers(damage, attacker.classe, defender.classe);
    
    return Math.max(0, Math.round(damage));
  }

  /**
   * Calcula dano de habilidade
   * @param {Object} attacker - Personagem atacante
   * @param {Object} defender - Personagem defensor
   * @param {Object} skill - Habilidade usada
   * @returns {number} Dano calculado
   */
  calculateSkillDamage(attacker, defender, skill) {
    // Fórmula: ((ATK * (skill.damage / 10)) - (DEF * 0.5)) * critico
    const skillPower = skill.damage || 0;
    let damage = (attacker.attack * (skillPower / 10)) - (defender.defense * 0.5);
    
    // Aplicar modificador crítico
    damage *= (attacker.critico || 1.0);
    
    // Aplicar modificadores de classe
    damage = this.applyClassModifiers(damage, attacker.classe, defender.classe);
    
    return Math.max(0, Math.round(damage));
  }

  /**
   * Define estado de defesa para um personagem
   * @param {string} characterId - ID do personagem
   * @param {boolean} defending - Se está defendendo
   */
  setDefending(characterId, defending) {
    if (!this.battleStates.has(characterId)) {
      this.battleStates.set(characterId, {});
    }
    this.battleStates.get(characterId).defending = defending;
  }

  /**
   * Verifica se personagem está defendendo
   * @param {string} characterId - ID do personagem
   * @returns {boolean} True se está defendendo
   */
  isDefending(characterId) {
    const state = this.battleStates.get(characterId);
    return state ? state.defending || false : false;
  }

  /**
   * Verifica se um ataque é crítico
   * @returns {boolean} True se é crítico
   */
  isCriticalHit() {
    return false; // Por enquanto sempre false
  }

  /**
   * Aplica mecânica de defesa no dano
   * @param {number} damage - Dano original
   * @param {string} defenderId - ID do defensor
   * @returns {number} Dano final após defesa
   */
  applyDefense(damage, defenderId) {
    if (this.isDefending(defenderId) && !this.isCriticalHit()) {
      return 0; // Imune a dano não-crítico
    }
    return damage;
  }

  /**
   * Executa meditação para um personagem
   * @param {Object} character - Personagem que irá meditar
   * @returns {Object} Resultado da meditação
   */
  meditate(character) {
    // Calcular recuperação de Ânima (10% do máximo)
    const maxAnima = character.anima || 100;
    const animaRecovered = Math.round(maxAnima * BattleMechanics.MEDITATION_ANIMA_RECOVERY);
    
    // Calcular recuperação de HP (5% do máximo)
    const hpRecovered = Math.round(character.maxHP * BattleMechanics.MEDITATION_HP_RECOVERY);
    
    // Aplicar limites máximos
    const newAnima = Math.min(character.currentAnima + animaRecovered, maxAnima);
    const newHp = Math.min(character.currentHP + hpRecovered, character.maxHP);
    
    return {
      animaRecovered,
      hpRecovered,
      newAnima,
      newHp,
      success: true,
      message: `Meditação concluída! Recuperou ${hpRecovered} HP e ${animaRecovered} Ânima.`
    };
  }

  /**
   * Reset estados de batalha para um novo turno
   * @param {string} characterId - ID do personagem (opcional)
   */
  resetTurnStates(characterId = null) {
    if (characterId) {
      if (this.battleStates.has(characterId)) {
        this.battleStates.get(characterId).defending = false;
      }
    } else {
      for (const [id, state] of this.battleStates) {
        state.defending = false;
      }
    }
  }

  /**
   * Obter informações sobre vantagens de classe
   * @param {string} attackerClass - Classe do atacante
   * @param {string} defenderClass - Classe do defensor
   * @returns {Object} Informações sobre vantagens
   */
  getClassAdvantageInfo(attackerClass, defenderClass) {
    const attackerHasAdvantage = this.hasAdvantage(attackerClass, defenderClass);
    const defenderHasAdvantage = this.hasAdvantage(defenderClass, attackerClass);
    
    return {
      attackerHasAdvantage,
      defenderHasAdvantage,
      attackerModifier: attackerHasAdvantage ? BattleMechanics.ADVANTAGE_DAMAGE_BONUS : 1.0,
      defenderModifier: defenderHasAdvantage ? BattleMechanics.ADVANTAGE_DAMAGE_REDUCTION : 1.0,
      advantageText: attackerHasAdvantage 
        ? `${attackerClass} tem vantagem sobre ${defenderClass}!`
        : defenderHasAdvantage 
        ? `${defenderClass} tem vantagem sobre ${attackerClass}!`
        : 'Nenhuma vantagem de classe.'
    };
  }

  // ============= CADÊNCIA DO DRAGÃO (Lutador) =============
  
  /**
   * Processar ataque básico para Cadência do Dragão
   * @param {string} characterId - ID do personagem
   * @returns {Object} Estado atual da cadência
   */
  processDragonCadence(characterId) {
    if (!this.skillStates.has(characterId)) {
      this.skillStates.set(characterId, {
        dragonCadence: {
          consecutiveBasicAttacks: 0,
          currentBuff: 0,
          lastCalculation: 0,
          sequenceBroken: false,
          isActive: true
        }
      });
    }

    const skillState = this.skillStates.get(characterId).dragonCadence;
    
    // Aplicar buff atual no dano ANTES de incrementar
    const currentBuffToApply = skillState.currentBuff;
    
    // Incrementar contador
    skillState.consecutiveBasicAttacks++;
    const newCalculation = skillState.consecutiveBasicAttacks + 1;
    
    if (skillState.sequenceBroken && skillState.consecutiveBasicAttacks === 1) {
      skillState.currentBuff = newCalculation + skillState.lastCalculation;
      skillState.sequenceBroken = false;
    } else {
      skillState.currentBuff = newCalculation;
    }
    
    skillState.lastCalculation = newCalculation;
    
    return {
      consecutiveAttacks: skillState.consecutiveBasicAttacks,
      currentBuff: skillState.currentBuff,
      appliedBuff: currentBuffToApply,
      newCalculation: newCalculation,
      message: `Cadência do Dragão: Buff aplicado +${currentBuffToApply}%. Próximo ataque: +${skillState.currentBuff}% (${skillState.consecutiveBasicAttacks} ataques consecutivos)`
    };
  }

  /**
   * Quebrar sequência da Cadência do Dragão
   * @param {string} characterId - ID do personagem
   * @returns {Object} Estado após quebra
   */
  breakDragonCadence(characterId) {
    if (!this.skillStates.has(characterId)) {
      return { broken: false, currentBuff: 0 };
    }

    const skillState = this.skillStates.get(characterId).dragonCadence;
    const previousBuff = skillState.currentBuff;
    
    skillState.consecutiveBasicAttacks = 0;
    skillState.sequenceBroken = true;
    
    return {
      broken: true,
      currentBuff: skillState.currentBuff,
      message: `Cadência interrompida! Buff atual mantido: +${previousBuff}% de ataque`
    };
  }

  /**
   * Aplicar buff da Cadência do Dragão no dano
   * @param {number} baseDamage - Dano base
   * @param {string} characterId - ID do personagem
   * @returns {number} Dano modificado
   */
  applyDragonCadenceBuff(baseDamage, characterId) {
    const cadenceState = this.getDragonCadenceState(characterId);
    if (!cadenceState.isActive || cadenceState.currentBuff === 0) {
      return baseDamage;
    }

    const buffMultiplier = 1 + (cadenceState.currentBuff / 100);
    return Math.round(baseDamage * buffMultiplier);
  }

  /**
   * Obter estado atual da Cadência do Dragão
   * @param {string} characterId - ID do personagem
   * @returns {Object} Estado atual
   */
  getDragonCadenceState(characterId) {
    if (!this.skillStates.has(characterId) || !this.skillStates.get(characterId).dragonCadence) {
      return { isActive: false, currentBuff: 0, consecutiveAttacks: 0 };
    }

    const skillState = this.skillStates.get(characterId).dragonCadence;
    return {
      isActive: skillState.isActive,
      currentBuff: skillState.currentBuff,
      consecutiveAttacks: skillState.consecutiveBasicAttacks,
      lastCalculation: skillState.lastCalculation,
      sequenceBroken: skillState.sequenceBroken
    };
  }

  // ============= ARSENAL ADAPTATIVO (Armamentista) =============

  /**
   * Processar ação para Arsenal Adaptativo
   * @param {string} characterId - ID do personagem
   * @param {string} actionType - Tipo da ação
   * @returns {Object} Estado atual
   */
  processArsenalAdaptativo(characterId, actionType) {
    if (!this.skillStates.has(characterId)) {
      this.skillStates.set(characterId, {});
    }
    
    if (!this.skillStates.get(characterId).arsenalAdaptativo) {
      this.skillStates.get(characterId).arsenalAdaptativo = {
        lastActionType: null,
        consecutiveAlternations: 0,
        currentBuff: 0,
        isActive: true
      };
    }

    const skillState = this.skillStates.get(characterId).arsenalAdaptativo;

    if (skillState.lastActionType === null) {
      skillState.lastActionType = actionType;
      return {
        actionType,
        isAlternation: false,
        consecutiveAlternations: 0,
        currentBuff: 0,
        message: `Arsenal Adaptativo: Primeira ação (${actionType}).`
      };
    }

    const isAlternation = skillState.lastActionType !== actionType;
    
    if (isAlternation) {
      const appliedBuff = actionType === 'defense' ? 0 : skillState.currentBuff;
      skillState.consecutiveAlternations++;
      const nextBuff = skillState.consecutiveAlternations * 3;
      skillState.lastActionType = actionType;
      skillState.currentBuff = nextBuff;
      
      return {
        actionType,
        isAlternation: true,
        consecutiveAlternations: skillState.consecutiveAlternations,
        currentBuff: nextBuff,
        appliedBuff: appliedBuff,
        message: `Arsenal Adaptativo: Alternância ${skillState.consecutiveAlternations}! ${actionType === 'defense' ? 'Defesa não ganha bônus.' : `Ação ganha +${appliedBuff}% de efetividade.`}`
      };
    } else {
      skillState.consecutiveAlternations = 0;
      skillState.currentBuff = 0;
      skillState.lastActionType = actionType;
      
      return {
        actionType,
        isAlternation: false,
        consecutiveAlternations: 0,
        currentBuff: 0,
        message: `Arsenal Adaptativo: Mesma ação repetida. Contador zerado.`
      };
    }
  }

  // ============= CONVERGÊNCIA ÂNIMA (Arcano) =============

  /**
   * Processar skill com ânima para Convergência Ânima
   * @param {string} characterId - ID do personagem
   * @param {number} animaCost - Custo de ânima
   * @returns {Object} Estado atual
   */
  processConvergenciaAnima(characterId, animaCost = 0) {
    if (!this.skillStates.has(characterId)) {
      this.skillStates.set(characterId, {});
    }
    
    if (!this.skillStates.get(characterId).convergenciaAnima) {
      this.skillStates.get(characterId).convergenciaAnima = {
        consecutiveAnimaSkills: 0,
        currentReduction: 0,
        isActive: true
      };
    }

    const skillState = this.skillStates.get(characterId).convergenciaAnima;

    if (animaCost > 0) {
      skillState.consecutiveAnimaSkills++;
      const newReduction = skillState.consecutiveAnimaSkills * 2;
      const appliedReduction = skillState.currentReduction;
      const reductionMultiplier = 1 - (appliedReduction / 100);
      const effectiveCost = Math.max(0, Math.round(animaCost * reductionMultiplier));
      
      skillState.currentReduction = newReduction;
      
      return {
        consecutiveAnimaSkills: skillState.consecutiveAnimaSkills,
        currentReduction: skillState.currentReduction,
        originalCost: animaCost,
        effectiveCost: effectiveCost,
        savedAnima: animaCost - effectiveCost,
        message: `Convergência Ânima: ${skillState.consecutiveAnimaSkills} skills consecutivas. Redução: ${appliedReduction}%. Custo: ${animaCost} → ${effectiveCost} ânima`
      };
    }

    return {
      consecutiveAnimaSkills: skillState.consecutiveAnimaSkills,
      currentReduction: skillState.currentReduction,
      originalCost: animaCost,
      effectiveCost: animaCost,
      savedAnima: 0,
      message: `Skill não consome ânima.`
    };
  }

  /**
   * Calcular custo efetivo de ânima
   * @param {number} baseCost - Custo base
   * @param {string} characterId - ID do personagem
   * @returns {number} Custo efetivo
   */
  calculateEffectiveAnimaCost(baseCost, characterId) {
    if (baseCost === 0) return 0;

    const convergenciaState = this.getConvergenciaAnimaState(characterId);
    if (!convergenciaState.isActive || convergenciaState.currentReduction === 0) {
      return baseCost;
    }

    const reductionMultiplier = 1 - (convergenciaState.currentReduction / 100);
    return Math.max(0, Math.round(baseCost * reductionMultiplier));
  }

  /**
   * Obter estado da Convergência Ânima
   * @param {string} characterId - ID do personagem
   * @returns {Object} Estado atual
   */
  getConvergenciaAnimaState(characterId) {
    if (!this.skillStates.has(characterId) || !this.skillStates.get(characterId).convergenciaAnima) {
      return { isActive: false, currentReduction: 0, consecutiveAnimaSkills: 0 };
    }

    const skillState = this.skillStates.get(characterId).convergenciaAnima;
    return {
      isActive: skillState.isActive,
      currentReduction: skillState.currentReduction,
      consecutiveAnimaSkills: skillState.consecutiveAnimaSkills
    };
  }
}

// Tornar disponível globalmente
window.BattleMechanics = BattleMechanics;