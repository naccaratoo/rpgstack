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
  
  // ARCANO IMMORTALITY SYSTEM - Convergência Ânima v2.2.0 BALANCED
  static ARCANO_MEDITATION_HP_RECOVERY = 0.50; // 50% HP para Arcanos com Convergência Ânima
  static ARCANO_MEDITATION_ANIMA_RECOVERY = 0.25; // 25% Ânima para Arcanos com Convergência Ânima

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
    const maxAnima = character.anima || 100;
    let animaRecovered, hpRecovered, newAnima, newHp, message;
    
    // ARCANO IMMORTALITY SYSTEM - Convergência Ânima v2.2.0
    if (character.classe === 'Arcano') {
      // Verificar se tem Convergência Ânima ativa
      const hasConvergencia = character.skills && character.skills.some(skill => 
        skill.skillId === '9BC8DEF6G1' || skill.skillName?.includes('Convergência Ânima')
      );
      
      if (hasConvergencia) {
        // BALANCED RESTORATION para Arcanos com Convergência Ânima
        animaRecovered = Math.round(maxAnima * BattleMechanics.ARCANO_MEDITATION_ANIMA_RECOVERY);
        hpRecovered = Math.round(character.maxHP * BattleMechanics.ARCANO_MEDITATION_HP_RECOVERY);
        newAnima = Math.min(character.currentAnima + animaRecovered, maxAnima);
        newHp = Math.min(character.currentHP + hpRecovered, character.maxHP);
        
        // Marcar como meditando para proteção contra instant kill
        character.isMeditating = true;
        character.meditationActive = true;
        
        message = `🛡️ CONVERGÊNCIA ÂNIMA: Meditação balanceada! Restaurou ${hpRecovered} HP (50%) e ${animaRecovered} Ânima (25%). PROTEGIDO contra instant kill crítico!`;
      } else {
        // Arcano sem Convergência Ânima - meditação normal
        animaRecovered = Math.round(maxAnima * BattleMechanics.MEDITATION_ANIMA_RECOVERY);
        hpRecovered = Math.round(character.maxHP * BattleMechanics.MEDITATION_HP_RECOVERY);
        newAnima = Math.min(character.currentAnima + animaRecovered, maxAnima);
        newHp = Math.min(character.currentHP + hpRecovered, character.maxHP);
        message = `Meditação concluída! Recuperou ${hpRecovered} HP e ${animaRecovered} Ânima.`;
      }
    } else {
      // Outras classes - meditação normal
      animaRecovered = Math.round(maxAnima * BattleMechanics.MEDITATION_ANIMA_RECOVERY);
      hpRecovered = Math.round(character.maxHP * BattleMechanics.MEDITATION_HP_RECOVERY);
      newAnima = Math.min(character.currentAnima + animaRecovered, maxAnima);
      newHp = Math.min(character.currentHP + hpRecovered, character.maxHP);
      message = `Meditação concluída! Recuperou ${hpRecovered} HP e ${animaRecovered} Ânima.`;
    }
    
    // MEDITATION COUNTER para Arcanos
    let meditationCounterState = null;
    let convergenciaInstantKill = false;
    
    if (character.classe === 'Arcano') {
      // Verificar se era a 5ª meditação ANTES de processar
      const previousState = this.getMeditationCounterState(character.id);
      const isConvergenciaInstantKill = previousState.sessionMeditations === 5;
      
      meditationCounterState = this.processMeditationCounter(character.id);
      
      // Se era a 6ª meditação (após 5), ativar instant kill
      if (isConvergenciaInstantKill) {
        convergenciaInstantKill = true;
        message += ' 💀 CONVERGÊNCIA ÂNIMA: INSTANT KILL ATIVADO!';
      }
    }

    return {
      animaRecovered,
      hpRecovered,
      newAnima,
      newHp,
      success: true,
      message,
      isArcanoImmortal: character.classe === 'Arcano' && character.isMeditating,
      meditationCounter: meditationCounterState,
      convergenciaInstantKill: convergenciaInstantKill
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
  processDragonCadence(characterId, baseAttack = 50) {
    if (!this.skillStates.has(characterId)) {
      this.skillStates.set(characterId, {
        dragonCadence: {
          consecutiveBasicAttacks: 0,
          currentBuff: 0,
          totalAttackBonus: 0,
          isActive: false,
          skillActivated: false,
          baseAttack: baseAttack
        }
      });
    }

    const skillState = this.skillStates.get(characterId).dragonCadence;
    
    // Atualizar base attack se fornecido
    if (baseAttack && baseAttack !== skillState.baseAttack) {
      skillState.baseAttack = baseAttack;
    }
    
    // Só processa se a skill foi ativada
    if (!skillState.skillActivated) {
      return {
        consecutiveAttacks: 0,
        currentBuff: 0,
        appliedBuff: 0,
        attackBonus: 0,
        message: `🐉 Cadência do Dragão está inativa. Use a skill para ativar o estado aprimorado!`
      };
    }
    
    // NOVO ALGORITMO v6.0.0: +10% do attack base por ataque consecutivo
    skillState.consecutiveBasicAttacks++;
    const attackBonus = Math.round(skillState.baseAttack * 0.10 * skillState.consecutiveBasicAttacks);
    skillState.totalAttackBonus = attackBonus;
    skillState.currentBuff = skillState.consecutiveBasicAttacks * 10; // Para UI (percentual)
    
    console.log('🐉 REWORK v6.0.0 DEBUG:', {
      characterId,
      baseAttack: skillState.baseAttack,
      consecutiveAttacks: skillState.consecutiveBasicAttacks,
      attackBonus,
      percentualBuff: skillState.currentBuff
    });
    
    return {
      consecutiveAttacks: skillState.consecutiveBasicAttacks,
      currentBuff: skillState.currentBuff,
      appliedBuff: skillState.currentBuff,
      attackBonus: attackBonus,
      totalAttack: skillState.baseAttack + attackBonus,
      message: `🐉 REWORK v6.0.0! Attack: ${skillState.baseAttack} → ${skillState.baseAttack + attackBonus} (+${attackBonus} pontos)`
    };
  }

  /**
   * Ativar a Cadência do Dragão (usar a skill para entrar em estado aprimorado)
   * @param {string} characterId - ID do personagem
   * @returns {Object} Estado após ativação
   */
  activateDragonCadence(characterId) {
    console.log('🔧 BattleMechanics.activateDragonCadence chamado para:', characterId);
    
    if (!this.skillStates.has(characterId)) {
      console.log('🔧 Criando novo skillState para:', characterId);
      this.skillStates.set(characterId, {
        dragonCadence: {
          consecutiveBasicAttacks: 0,
          currentBuff: 0,
          isActive: false,
          skillActivated: false
        }
      });
    }

    const skillState = this.skillStates.get(characterId).dragonCadence;
    console.log('🔧 Estado antes da ativação:', skillState);
    
    // Ativar o estado aprimorado
    skillState.skillActivated = true;
    skillState.isActive = true;
    skillState.consecutiveBasicAttacks = 0;
    skillState.currentBuff = 0;
    
    console.log('🔧 Estado após ativação:', skillState);
    
    const result = {
      activated: true,
      message: `🐉 CADÊNCIA DO DRAGÃO v6.0.0 ATIVADA! Personagem entrou em estado aprimorado. Cada ataque básico aumentará o poder de attack!`
    };
    
    console.log('🔧 Retornando resultado:', result);
    return result;
  }

  /**
   * Quebrar sequência da Cadência do Dragão
   * @param {string} characterId - ID do personagem
   * @returns {Object} Estado após quebra
   */
  breakDragonCadence(characterId) {
    console.log('🔧 BattleMechanics.breakDragonCadence chamado para:', characterId);
    
    if (!this.skillStates.has(characterId)) {
      console.log('🔧 Nenhum skillState encontrado para:', characterId);
      return { broken: false, currentBuff: 0 };
    }

    const skillState = this.skillStates.get(characterId).dragonCadence;
    console.log('🔧 Estado antes do break:', skillState);
    
    // Resetar contador mas manter skill ativa (não quebra mais o estado aprimorado)
    skillState.consecutiveBasicAttacks = 0;
    skillState.currentBuff = 0;
    
    console.log('🔧 Estado após break (mantém isActive):', skillState);
    
    return {
      broken: true,
      currentBuff: 0,
      message: `🐉 Sequência de ataques resetada! Estado aprimorado continua ativo. Próximo ataque básico começará do +10% novamente.`
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
    // DEBUG: Log do estado interno do skill
    console.log('🔍 BattleMechanics DEBUG - getDragonCadenceState:', {
      characterId,
      hasSkillStates: this.skillStates.has(characterId),
      skillStatesSize: this.skillStates.size,
      allCharacterIds: Array.from(this.skillStates.keys())
    });
    
    if (!this.skillStates.has(characterId) || !this.skillStates.get(characterId).dragonCadence) {
      console.log('🐉 Nenhum estado de Cadência encontrado para:', characterId);
      return { isActive: false, currentBuff: 0, consecutiveAttacks: 0 };
    }

    const skillState = this.skillStates.get(characterId).dragonCadence;
    const result = {
      isActive: skillState.isActive,
      currentBuff: skillState.currentBuff,
      consecutiveAttacks: skillState.consecutiveBasicAttacks,
      lastCalculation: skillState.lastCalculation,
      sequenceBroken: skillState.sequenceBroken
    };
    
    console.log('🐉 Estado da Cadência encontrado:', result);
    return result;
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

  // ============= MEDITATION COUNTER SYSTEM (Arcano) =============

  /**
   * Processar meditação para Arcanos com contador
   * @param {string} characterId - ID do personagem
   * @returns {Object} Estado atual do contador de meditação
   */
  processMeditationCounter(characterId) {
    if (!this.skillStates.has(characterId)) {
      this.skillStates.set(characterId, {});
    }
    
    if (!this.skillStates.get(characterId).meditationCounter) {
      this.skillStates.get(characterId).meditationCounter = {
        totalMeditations: 0,
        sessionMeditations: 0,
        consecutiveMeditations: 0,
        lastMeditationTurn: 0,
        isActive: true
      };
    }

    const meditationState = this.skillStates.get(characterId).meditationCounter;
    
    // Incrementar contadores
    meditationState.totalMeditations++;
    meditationState.sessionMeditations++;
    meditationState.consecutiveMeditations++;
    meditationState.lastMeditationTurn = Date.now();

    console.log('🧘 MeditationCounter - Processed:', {
      characterId,
      totalMeditations: meditationState.totalMeditations,
      sessionMeditations: meditationState.sessionMeditations,
      consecutiveMeditations: meditationState.consecutiveMeditations
    });

    // Verificar se próxima meditação (6ª) causará instant kill
    const willCauseInstantKill = meditationState.sessionMeditations === 5;
    const hasArmamentistaCounter = meditationState.sessionMeditations >= 5;
    
    return {
      totalMeditations: meditationState.totalMeditations,
      sessionMeditations: meditationState.sessionMeditations,
      consecutiveMeditations: meditationState.consecutiveMeditations,
      isActive: meditationState.isActive,
      hasArmamentistaCounter: hasArmamentistaCounter,
      willCauseInstantKill: willCauseInstantKill,
      message: `🧘 Meditações: ${meditationState.totalMeditations} total, ${meditationState.sessionMeditations} nesta batalha${willCauseInstantKill ? ' 💀 PRÓXIMA MEDITAÇÃO = INSTANT KILL!' : hasArmamentistaCounter ? ' ⚔️ CONVERGÊNCIA ATIVA!' : ''}`
    };
  }

  /**
   * Reset contador de meditações consecutivas
   * @param {string} characterId - ID do personagem
   */
  resetConsecutiveMeditations(characterId) {
    if (this.skillStates.has(characterId) && this.skillStates.get(characterId).meditationCounter) {
      this.skillStates.get(characterId).meditationCounter.consecutiveMeditations = 0;
      console.log('🧘 MeditationCounter - Reset consecutive meditations for:', characterId);
    }
  }

  /**
   * Obter estado atual do contador de meditação
   * @param {string} characterId - ID do personagem
   * @returns {Object} Estado atual
   */
  getMeditationCounterState(characterId) {
    console.log('🧘 getMeditationCounterState DEBUG:', {
      characterId,
      hasSkillStates: this.skillStates.has(characterId),
      skillStatesKeys: Array.from(this.skillStates.keys())
    });

    if (!this.skillStates.has(characterId) || !this.skillStates.get(characterId).meditationCounter) {
      console.log('🧘 No meditation state found, returning default');
      return {
        totalMeditations: 0,
        sessionMeditations: 0,
        consecutiveMeditations: 0,
        isActive: false
      };
    }

    const meditationState = this.skillStates.get(characterId).meditationCounter;
    console.log('🧘 Found meditation state:', meditationState);
    
    return {
      totalMeditations: meditationState.totalMeditations,
      sessionMeditations: meditationState.sessionMeditations,
      consecutiveMeditations: meditationState.consecutiveMeditations,
      isActive: meditationState.isActive
    };
  }

  /**
   * Reset contador de sessão (para nova batalha)
   * @param {string} characterId - ID do personagem
   */
  resetSessionMeditations(characterId) {
    if (this.skillStates.has(characterId) && this.skillStates.get(characterId).meditationCounter) {
      this.skillStates.get(characterId).meditationCounter.sessionMeditations = 0;
      this.skillStates.get(characterId).meditationCounter.consecutiveMeditations = 0;
      console.log('🧘 MeditationCounter - Reset session for:', characterId);
    }
  }

  /**
   * Verificar se Arcano pode dar instant kill em Armamentista (5+ meditações)
   * @param {string} arcanoId - ID do Arcano atacante
   * @param {Object} target - Alvo do ataque
   * @returns {Object} Resultado da verificação
   */
  checkArcanoArmamentistaCounter(arcanoId, target) {
    const meditationState = this.getMeditationCounterState(arcanoId);
    const canInstantKill = meditationState.sessionMeditations >= 5 && target.classe === 'Armamentista';
    
    console.log('⚔️ ArcanoCounter - DEBUG COMPLETO:', {
      arcanoId,
      targetClass: target.classe,
      targetName: target.name,
      sessionMeditations: meditationState.sessionMeditations,
      meditationState: meditationState,
      canInstantKill,
      isTargetArmamentista: target.classe === 'Armamentista',
      hasEnoughMeditations: meditationState.sessionMeditations >= 5
    });

    return {
      canInstantKill,
      meditationCount: meditationState.sessionMeditations,
      targetClass: target.classe,
      message: canInstantKill 
        ? `⚔️ COUNTER ATIVO: Arcano (${meditationState.sessionMeditations} meditações) vs Armamentista = INSTANT KILL GARANTIDO!`
        : meditationState.sessionMeditations >= 5 
          ? `⚔️ Counter ativo mas alvo não é Armamentista (${target.classe})`
          : `🧘 Meditações insuficientes: ${meditationState.sessionMeditations}/5 para counter`
    };
  }
}

// Tornar disponível globalmente
window.BattleMechanics = BattleMechanics;