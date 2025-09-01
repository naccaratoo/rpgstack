/**
 * Battle Mechanics Domain Service
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
 */

export class BattleMechanics {
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
    // Fórmula: ((ATK * (skill.power / 10)) - (DEF * 0.5)) * critico
    const skillPower = skill.damage || 0; // Usando damage da skill como power
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
   * Verifica se um ataque é crítico (por simplicidade, sempre false por enquanto)
   * Pode ser expandido futuramente para incluir chances de crítico
   * @returns {boolean} True se é crítico
   */
  isCriticalHit() {
    // Por enquanto, nenhum ataque é considerado crítico
    // Esta função pode ser expandida futuramente
    return false;
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
   * @returns {Object} Resultado da meditação com valores recuperados
   */
  meditate(character) {
    // Calcular recuperação de Ânima (10% do máximo)
    const maxAnima = character.anima || 100; // Assumindo que anima atual = anima máximo por enquanto
    const animaRecovered = Math.round(maxAnima * BattleMechanics.MEDITATION_ANIMA_RECOVERY);
    
    // Calcular recuperação de HP (5% do máximo)
    const hpRecovered = Math.round(character.maxHP * BattleMechanics.MEDITATION_HP_RECOVERY);
    
    // Aplicar limites máximos
    const newAnima = Math.min(character.anima + animaRecovered, maxAnima);
    const newHp = Math.min(character.hp + hpRecovered, character.maxHP);
    
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
   * @param {string} characterId - ID do personagem (opcional, se não fornecido, reseta todos)
   */
  resetTurnStates(characterId = null) {
    if (characterId) {
      // Reset apenas um personagem
      if (this.battleStates.has(characterId)) {
        this.battleStates.get(characterId).defending = false;
      }
    } else {
      // Reset todos os personagens
      for (const [id, state] of this.battleStates) {
        state.defending = false;
      }
    }
  }

  /**
   * Limpa todos os estados de batalha
   */
  clearBattleStates() {
    this.battleStates.clear();
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

  /**
   * Validar se uma classe é válida
   * @param {string} classe - Classe para validar
   * @returns {boolean} True se é válida
   */
  static isValidClass(classe) {
    return Object.keys(BattleMechanics.CLASS_ADVANTAGES).includes(classe);
  }

  /**
   * Obter todas as classes válidas
   * @returns {string[]} Array com todas as classes
   */
  static getValidClasses() {
    return Object.keys(BattleMechanics.CLASS_ADVANTAGES);
  }

  /**
   * CADÊNCIA DO DRAGÃO - Mecânica Específica
   * Implementa o sistema de ataques básicos consecutivos
   */
  
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
    
    // Incrementar contador de ataques básicos consecutivos
    skillState.consecutiveBasicAttacks++;
    
    // Calcular novo bônus: X = (Nº de Ataques Básicos Consecutivos) + 1
    const newCalculation = skillState.consecutiveBasicAttacks + 1;
    
    // Se a sequência foi quebrada e está sendo retomada
    if (skillState.sequenceBroken && skillState.consecutiveBasicAttacks === 1) {
      // Comparar novo valor com o último cálculo e somar
      skillState.currentBuff = newCalculation + skillState.lastCalculation;
      skillState.sequenceBroken = false;
    } else {
      // Novo bônus substitui o anterior
      skillState.currentBuff = newCalculation;
    }
    
    // Armazenar cálculo atual para possível uso futuro
    skillState.lastCalculation = newCalculation;
    
    return {
      consecutiveAttacks: skillState.consecutiveBasicAttacks,
      currentBuff: skillState.currentBuff,
      newCalculation: newCalculation,
      message: `Cadência do Dragão: +${skillState.currentBuff}% de ataque (${skillState.consecutiveBasicAttacks} ataques consecutivos)`
    };
  }

  /**
   * Quebrar sequência da Cadência do Dragão (ao usar skill, defender ou meditar)
   * @param {string} characterId - ID do personagem
   * @returns {Object} Estado após quebra
   */
  breakDragonCadence(characterId) {
    if (!this.skillStates.has(characterId)) {
      return { broken: false, currentBuff: 0 };
    }

    const skillState = this.skillStates.get(characterId).dragonCadence;
    const previousBuff = skillState.currentBuff;
    
    // Marcar que a sequência foi quebrada e zerar contador
    skillState.consecutiveBasicAttacks = 0;
    skillState.sequenceBroken = true;
    // O buff permanece inalterado até próximo ataque básico
    
    return {
      broken: true,
      currentBuff: skillState.currentBuff,
      message: `Cadência interrompida! Buff atual mantido: +${previousBuff}% de ataque`
    };
  }

  /**
   * Obter estado atual da Cadência do Dragão
   * @param {string} characterId - ID do personagem
   * @returns {Object} Estado atual
   */
  getDragonCadenceState(characterId) {
    if (!this.skillStates.has(characterId)) {
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

  /**
   * Aplicar buff da Cadência do Dragão no dano de ataque básico
   * @param {number} baseDamage - Dano base do ataque
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
   * Reset completo da Cadência do Dragão
   * @param {string} characterId - ID do personagem
   */
  resetDragonCadence(characterId) {
    if (this.skillStates.has(characterId)) {
      this.skillStates.get(characterId).dragonCadence = {
        consecutiveBasicAttacks: 0,
        currentBuff: 0,
        lastCalculation: 0,
        sequenceBroken: false,
        isActive: true
      };
    }
  }

  /**
   * Limpar todos os estados de skills
   */
  clearSkillStates() {
    this.skillStates.clear();
  }

  /**
   * ARSENAL ADAPTATIVO - Mecânica Específica (Armamentista)
   * Implementa o sistema de alternância de tipos de ação
   */

  /**
   * Processar ação para Arsenal Adaptativo
   * @param {string} characterId - ID do personagem
   * @param {string} actionType - Tipo da ação (attack, support, defense, meditation)
   * @returns {Object} Estado atual do arsenal adaptativo
   */
  processArsenalAdaptativo(characterId, actionType) {
    const validActions = ['attack', 'support', 'defense', 'meditation'];
    if (!validActions.includes(actionType)) {
      throw new Error(`Invalid action type: ${actionType}. Must be one of: ${validActions.join(', ')}`);
    }

    if (!this.skillStates.has(characterId)) {
      this.skillStates.set(characterId, {
        arsenalAdaptativo: {
          lastActionType: null,
          consecutiveAlternations: 0,
          currentBuff: 0,
          isActive: true
        }
      });
    }

    const skillState = this.skillStates.get(characterId).arsenalAdaptativo || {
      lastActionType: null,
      consecutiveAlternations: 0,
      currentBuff: 0,
      isActive: true
    };

    // Se não há ação anterior, esta é a primeira
    if (skillState.lastActionType === null) {
      skillState.lastActionType = actionType;
      skillState.consecutiveAlternations = 0;
      skillState.currentBuff = 0;
      this.skillStates.get(characterId).arsenalAdaptativo = skillState;
      return {
        actionType,
        isAlternation: false,
        consecutiveAlternations: skillState.consecutiveAlternations,
        currentBuff: skillState.currentBuff,
        nextBuff: 0,
        message: `Arsenal Adaptativo: Primeira ação (${actionType}). Sem bônus ainda.`
      };
    }

    // Verificar se é uma alternância
    const isAlternation = skillState.lastActionType !== actionType;
    
    if (isAlternation) {
      // Aplicar buff da alternação anterior (se houver)
      const appliedBuff = actionType === 'defense' ? 0 : skillState.currentBuff;
      
      // Incrementar contador de alternâncias
      skillState.consecutiveAlternations++;
      
      // Calcular novo bônus para a próxima ação: Z = (Nº de alternâncias consecutivas) × 3%
      const nextBuff = skillState.consecutiveAlternations * 3;
      
      // Atualizar estado - o buff atual vira o próximo buff
      skillState.lastActionType = actionType;
      skillState.currentBuff = nextBuff;
      
      return {
        actionType,
        isAlternation: true,
        consecutiveAlternations: skillState.consecutiveAlternations,
        currentBuff: nextBuff,
        nextBuff: nextBuff,
        appliedBuff: appliedBuff,
        message: `Arsenal Adaptativo: Alternância ${skillState.consecutiveAlternations}! ${actionType === 'defense' ? 'Defesa não ganha bônus.' : `Ação ganha +${appliedBuff}% de efetividade.`} Próxima ação não-defensiva: +${nextBuff}%`
      };
    } else {
      // Mesma ação, resetar contador
      skillState.consecutiveAlternations = 0;
      skillState.currentBuff = 0;
      skillState.lastActionType = actionType;
      
      return {
        actionType,
        isAlternation: false,
        consecutiveAlternations: skillState.consecutiveAlternations,
        currentBuff: skillState.currentBuff,
        nextBuff: 0,
        appliedBuff: 0,
        message: `Arsenal Adaptativo: Mesma ação repetida (${actionType}). Contador zerado e bônus perdido.`
      };
    }
  }

  /**
   * Aplicar buff do Arsenal Adaptativo na ação
   * @param {number} baseValue - Valor base da ação
   * @param {string} characterId - ID do personagem
   * @param {string} actionType - Tipo da ação
   * @returns {number} Valor modificado
   */
  applyArsenalAdaptativoBuff(baseValue, characterId, actionType) {
    if (actionType === 'defense') {
      return baseValue; // Defesa nunca ganha bônus
    }

    const arsenalState = this.getArsenalAdaptativoState(characterId);
    if (!arsenalState.isActive || arsenalState.currentBuff === 0) {
      return baseValue;
    }

    const buffMultiplier = 1 + (arsenalState.currentBuff / 100);
    return Math.round(baseValue * buffMultiplier);
  }

  /**
   * Obter estado atual do Arsenal Adaptativo
   * @param {string} characterId - ID do personagem
   * @returns {Object} Estado atual
   */
  getArsenalAdaptativoState(characterId) {
    if (!this.skillStates.has(characterId)) {
      return { isActive: false, currentBuff: 0, consecutiveAlternations: 0, lastActionType: null };
    }

    const skillState = this.skillStates.get(characterId).arsenalAdaptativo;
    if (!skillState) {
      return { isActive: false, currentBuff: 0, consecutiveAlternations: 0, lastActionType: null };
    }

    return {
      isActive: skillState.isActive,
      currentBuff: skillState.currentBuff,
      consecutiveAlternations: skillState.consecutiveAlternations,
      lastActionType: skillState.lastActionType
    };
  }

  /**
   * Reset completo do Arsenal Adaptativo
   * @param {string} characterId - ID do personagem
   */
  resetArsenalAdaptativo(characterId) {
    if (this.skillStates.has(characterId)) {
      this.skillStates.get(characterId).arsenalAdaptativo = {
        lastActionType: null,
        consecutiveAlternations: 0,
        currentBuff: 0,
        isActive: true
      };
    }
  }

  /**
   * CONVERGÊNCIA ÂNIMA - Mecânica Específica (Arcano)
   * Implementa o sistema de redução de custo de ânima para skills consecutivas
   */

  /**
   * Processar skill com consumo de ânima para Convergência Ânima
   * @param {string} characterId - ID do personagem
   * @param {number} animaCost - Custo de ânima da skill
   * @returns {Object} Estado atual da convergência ânima
   */
  processConvergenciaAnima(characterId, animaCost = 0) {
    if (!this.skillStates.has(characterId)) {
      this.skillStates.set(characterId, {
        convergenciaAnima: {
          consecutiveAnimaSkills: 0,
          currentReduction: 0,
          isActive: true
        }
      });
    }

    const skillState = this.skillStates.get(characterId).convergenciaAnima || {
      consecutiveAnimaSkills: 0,
      currentReduction: 0,
      isActive: true
    };

    // Só processa se a skill consome ânima
    if (animaCost > 0) {
      // Incrementar contador de skills com ânima consecutivas
      skillState.consecutiveAnimaSkills++;
      
      // Calcular nova redução: Y = (Nº de Skills com Ânima consecutivas) × 2%
      const newReduction = skillState.consecutiveAnimaSkills * 2;
      
      // Aplicar redução atual na skill sendo usada
      const appliedReduction = skillState.currentReduction;
      const reductionMultiplier = 1 - (appliedReduction / 100);
      const effectiveCost = Math.max(0, Math.round(animaCost * reductionMultiplier));
      
      // A nova redução substitui a anterior
      skillState.currentReduction = newReduction;
      
      this.skillStates.get(characterId).convergenciaAnima = skillState;
      
      return {
        consecutiveAnimaSkills: skillState.consecutiveAnimaSkills,
        currentReduction: skillState.currentReduction,
        newReduction: newReduction,
        originalCost: animaCost,
        effectiveCost: effectiveCost,
        savedAnima: animaCost - effectiveCost,
        message: `Convergência Ânima: ${skillState.consecutiveAnimaSkills} skills consecutivas. Redução: ${skillState.currentReduction}%. Custo: ${animaCost} → ${effectiveCost} ânima (economizou ${animaCost - effectiveCost})`
      };
    }

    return {
      consecutiveAnimaSkills: skillState.consecutiveAnimaSkills,
      currentReduction: skillState.currentReduction,
      newReduction: 0,
      originalCost: animaCost,
      effectiveCost: animaCost,
      savedAnima: 0,
      message: `Skill não consome ânima. Convergência inalterada: ${skillState.currentReduction}% de redução`
    };
  }

  /**
   * Quebrar sequência da Convergência Ânima (ao usar ação que não consome ânima)
   * @param {string} characterId - ID do personagem
   * @returns {Object} Estado após quebra
   */
  breakConvergenciaAnima(characterId) {
    if (!this.skillStates.has(characterId)) {
      return { broken: false, currentReduction: 0 };
    }

    const skillState = this.skillStates.get(characterId).convergenciaAnima;
    if (!skillState) {
      return { broken: false, currentReduction: 0 };
    }

    const previousReduction = skillState.currentReduction;
    
    // Zerar contador, mas manter redução atual (conforme especificação)
    skillState.consecutiveAnimaSkills = 0;
    // A redução permanece inalterada até próxima skill com ânima
    
    return {
      broken: true,
      currentReduction: skillState.currentReduction,
      message: `Convergência interrompida! Redução mantida: ${previousReduction}% até próxima skill com ânima`
    };
  }

  /**
   * Calcular custo efetivo de ânima aplicando Convergência Ânima
   * @param {number} baseCost - Custo base de ânima
   * @param {string} characterId - ID do personagem
   * @returns {number} Custo efetivo após redução
   */
  calculateEffectiveAnimaCost(baseCost, characterId) {
    if (baseCost === 0) {
      return 0; // Não há redução para skills que não consomem ânima
    }

    const convergenciaState = this.getConvergenciaAnimaState(characterId);
    if (!convergenciaState.isActive || convergenciaState.currentReduction === 0) {
      return baseCost;
    }

    const reductionMultiplier = 1 - (convergenciaState.currentReduction / 100);
    return Math.max(0, Math.round(baseCost * reductionMultiplier));
  }

  /**
   * Obter estado atual da Convergência Ânima
   * @param {string} characterId - ID do personagem
   * @returns {Object} Estado atual
   */
  getConvergenciaAnimaState(characterId) {
    if (!this.skillStates.has(characterId)) {
      return { isActive: false, currentReduction: 0, consecutiveAnimaSkills: 0 };
    }

    const skillState = this.skillStates.get(characterId).convergenciaAnima;
    if (!skillState) {
      return { isActive: false, currentReduction: 0, consecutiveAnimaSkills: 0 };
    }

    return {
      isActive: skillState.isActive,
      currentReduction: skillState.currentReduction,
      consecutiveAnimaSkills: skillState.consecutiveAnimaSkills
    };
  }

  /**
   * Reset completo da Convergência Ânima
   * @param {string} characterId - ID do personagem
   */
  resetConvergenciaAnima(characterId) {
    if (this.skillStates.has(characterId)) {
      this.skillStates.get(characterId).convergenciaAnima = {
        consecutiveAnimaSkills: 0,
        currentReduction: 0,
        isActive: true
      };
    }
  }

  /**
   * Obter estatísticas do sistema de batalha
   * @returns {Object} Estatísticas do sistema
   */
  getBattleStats() {
    return {
      activeCharacters: this.battleStates.size,
      defendingCharacters: Array.from(this.battleStates.values())
        .filter(state => state.defending).length,
      skillStates: this.skillStates.size,
      classAdvantages: { ...BattleMechanics.CLASS_ADVANTAGES },
      modifiers: {
        damageBonus: BattleMechanics.ADVANTAGE_DAMAGE_BONUS,
        damageReduction: BattleMechanics.ADVANTAGE_DAMAGE_REDUCTION,
        meditationAnimaRecovery: BattleMechanics.MEDITATION_ANIMA_RECOVERY,
        meditationHpRecovery: BattleMechanics.MEDITATION_HP_RECOVERY
      }
    };
  }
}