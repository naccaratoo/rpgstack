/**
 * Buff/Debuff Visual System
 * 
 * Sistema responsável por gerenciar a exibição visual de buffs e debuffs
 * incluindo ícones, tooltips, animações e integração com as mecânicas de combate.
 * 
 * Features:
 * - Gerenciamento dinâmico de ícones de buff/debuff
 * - Sistema de tooltips informativos
 * - Animações e efeitos visuais
 * - Integração com BattleMechanics
 * - Suporte a múltiplos tipos de efeitos
 */

class BuffDebuffSystem {
  constructor(battleMechanics) {
    this.battleMechanics = battleMechanics;
    this.buffContainers = new Map(); // Armazena referências dos containers por personagem
    this.activeBuffs = new Map(); // Armazena buffs ativos por personagem
    
    this.buffConfigs = {
      // Configurações dos diferentes tipos de buff
      dragonCadence: {
        icon: '🐉',
        className: 'buff-dragon-cadence',
        name: 'Cadência do Dragão',
        color: '#dc2626',
        type: 'buff'
      },
      arsenalAdaptativo: {
        icon: '⚡',
        className: 'buff-arsenal-adaptativo',
        name: 'Arsenal Adaptativo',
        color: '#059669',
        type: 'buff'
      },
      convergenciaAnima: {
        icon: '🔮',
        className: 'buff-convergencia-anima',
        name: 'Convergência Ânima',
        color: '#7c3aed',
        type: 'buff'
      },
      defending: {
        icon: '🛡️',
        className: 'buff-defending',
        name: 'Defendendo',
        color: '#0369a1',
        type: 'buff'
      }
    };
  }

  /**
   * Registrar container de buffs para um personagem
   * @param {string} characterId - ID do personagem
   * @param {HTMLElement} container - Container onde os ícones serão exibidos
   */
  registerBuffContainer(characterId, container) {
    this.buffContainers.set(characterId, container);
    this.activeBuffs.set(characterId, new Map());
  }

  /**
   * Atualizar todos os buffs visuais para um personagem
   * @param {string} characterId - ID do personagem
   * @param {string} characterClass - Classe do personagem
   */
  updateBuffsForCharacter(characterId, characterClass) {
    const container = this.buffContainers.get(characterId);
    if (!container) return;

    // Limpar buffs existentes
    this.clearBuffs(characterId);

    // Verificar e adicionar buffs baseados na classe
    this.checkClassSpecificBuffs(characterId, characterClass);
    
    // Verificar buffs gerais
    this.checkGeneralBuffs(characterId);

    // Renderizar buffs no container
    this.renderBuffs(characterId);
  }

  /**
   * Verificar buffs específicos da classe
   * @param {string} characterId - ID do personagem
   * @param {string} characterClass - Classe do personagem
   */
  checkClassSpecificBuffs(characterId, characterClass) {
    switch (characterClass) {
      case 'Lutador':
        this.checkDragonCadence(characterId);
        break;
      case 'Armamentista':
        this.checkArsenalAdaptativo(characterId);
        break;
      case 'Arcano':
        this.checkConvergenciaAnima(characterId);
        break;
    }
  }

  /**
   * Verificar buffs gerais (disponíveis para todas as classes)
   * @param {string} characterId - ID do personagem
   */
  checkGeneralBuffs(characterId) {
    // Verificar se está defendendo
    if (this.battleMechanics.isDefending(characterId)) {
      this.addBuff(characterId, 'defending', {
        value: 'Ativo',
        description: 'Imune a dano não-crítico'
      });
    }
  }

  /**
   * Verificar buff Cadência do Dragão
   * @param {string} characterId - ID do personagem
   */
  checkDragonCadence(characterId) {
    const cadenceState = this.battleMechanics.getDragonCadenceState(characterId);
    if (cadenceState.isActive && cadenceState.currentBuff > 0) {
      this.addBuff(characterId, 'dragonCadence', {
        value: `+${cadenceState.currentBuff}%`,
        description: `Ataque aumentado em ${cadenceState.currentBuff}%`,
        stacks: cadenceState.consecutiveAttacks,
        additionalInfo: `${cadenceState.consecutiveAttacks} ataques consecutivos`
      });
    }
  }

  /**
   * Verificar buff Arsenal Adaptativo
   * @param {string} characterId - ID do personagem
   */
  checkArsenalAdaptativo(characterId) {
    const arsenalState = this.battleMechanics.getArsenalAdaptativoState(characterId);
    if (arsenalState.isActive && arsenalState.currentBuff > 0) {
      this.addBuff(characterId, 'arsenalAdaptativo', {
        value: `+${arsenalState.currentBuff}%`,
        description: `Efetividade aumentada em ${arsenalState.currentBuff}%`,
        stacks: arsenalState.consecutiveAlternations,
        additionalInfo: `${arsenalState.consecutiveAlternations} alternâncias consecutivas`
      });
    }
  }

  /**
   * Verificar buff Convergência Ânima
   * @param {string} characterId - ID do personagem
   */
  checkConvergenciaAnima(characterId) {
    const convergenciaState = this.battleMechanics.getConvergenciaAnimaState(characterId);
    if (convergenciaState.isActive && convergenciaState.currentReduction > 0) {
      this.addBuff(characterId, 'convergenciaAnima', {
        value: `-${convergenciaState.currentReduction}%`,
        description: `Custo de ânima reduzido em ${convergenciaState.currentReduction}%`,
        stacks: convergenciaState.consecutiveAnimaSkills,
        additionalInfo: `${convergenciaState.consecutiveAnimaSkills} skills consecutivas`
      });
    }
  }

  /**
   * Adicionar um buff à lista de ativos
   * @param {string} characterId - ID do personagem
   * @param {string} buffType - Tipo do buff
   * @param {Object} buffData - Dados do buff
   */
  addBuff(characterId, buffType, buffData) {
    const buffs = this.activeBuffs.get(characterId);
    if (!buffs) return;

    const config = this.buffConfigs[buffType];
    if (!config) return;

    buffs.set(buffType, {
      ...config,
      ...buffData,
      id: buffType,
      timestamp: Date.now()
    });
  }

  /**
   * Remover um buff específico
   * @param {string} characterId - ID do personagem
   * @param {string} buffType - Tipo do buff
   */
  removeBuff(characterId, buffType) {
    const buffs = this.activeBuffs.get(characterId);
    if (buffs) {
      buffs.delete(buffType);
      this.renderBuffs(characterId);
    }
  }

  /**
   * Limpar todos os buffs de um personagem
   * @param {string} characterId - ID do personagem
   */
  clearBuffs(characterId) {
    const buffs = this.activeBuffs.get(characterId);
    if (buffs) {
      buffs.clear();
    }
  }

  /**
   * Renderizar buffs no container
   * @param {string} characterId - ID do personagem
   */
  renderBuffs(characterId) {
    const container = this.buffContainers.get(characterId);
    const buffs = this.activeBuffs.get(characterId);
    
    if (!container || !buffs) return;

    // Limpar container
    container.innerHTML = '';

    // Criar elementos para cada buff
    buffs.forEach((buff, buffType) => {
      const buffElement = this.createBuffElement(buff);
      container.appendChild(buffElement);
    });
  }

  /**
   * Criar elemento visual do buff
   * @param {Object} buff - Dados do buff
   * @returns {HTMLElement} Elemento do buff
   */
  createBuffElement(buff) {
    const buffElement = document.createElement('div');
    buffElement.className = `buff-icon ${buff.className}`;
    buffElement.innerHTML = buff.icon;
    
    // Criar tooltip
    const tooltipText = this.createTooltipText(buff);
    buffElement.setAttribute('data-tooltip', tooltipText);
    
    // Adicionar stacks se houver
    if (buff.stacks && buff.stacks > 1) {
      const stackCounter = document.createElement('div');
      stackCounter.className = 'buff-stack-counter';
      stackCounter.textContent = buff.stacks;
      buffElement.appendChild(stackCounter);
    }
    
    // Adicionar animação de entrada
    buffElement.style.opacity = '0';
    buffElement.style.transform = 'scale(0.8)';
    
    // Animar entrada
    requestAnimationFrame(() => {
      buffElement.style.transition = 'all 0.3s ease';
      buffElement.style.opacity = '1';
      buffElement.style.transform = 'scale(1)';
    });
    
    return buffElement;
  }

  /**
   * Criar texto do tooltip
   * @param {Object} buff - Dados do buff
   * @returns {string} Texto do tooltip
   */
  createTooltipText(buff) {
    let tooltip = `${buff.name}`;
    
    if (buff.value) {
      tooltip += `: ${buff.value}`;
    }
    
    if (buff.description) {
      tooltip += ` - ${buff.description}`;
    }
    
    if (buff.additionalInfo) {
      tooltip += ` (${buff.additionalInfo})`;
    }
    
    return tooltip;
  }

  /**
   * Adicionar efeito visual temporário
   * @param {string} characterId - ID do personagem
   * @param {string} effectType - Tipo do efeito
   * @param {number} duration - Duração em ms
   */
  addTemporaryEffect(characterId, effectType, duration = 2000) {
    const container = this.buffContainers.get(characterId);
    if (!container) return;

    const effectElement = document.createElement('div');
    effectElement.className = `temp-effect temp-effect-${effectType}`;
    
    switch (effectType) {
      case 'damage':
        effectElement.innerHTML = '⚡';
        effectElement.style.color = '#dc2626';
        break;
      case 'heal':
        effectElement.innerHTML = '💚';
        effectElement.style.color = '#059669';
        break;
      case 'buff':
        effectElement.innerHTML = '✨';
        effectElement.style.color = '#0369a1';
        break;
      case 'debuff':
        effectElement.innerHTML = '💢';
        effectElement.style.color = '#7c2d12';
        break;
    }
    
    effectElement.style.position = 'absolute';
    effectElement.style.fontSize = '20px';
    effectElement.style.animation = 'tempEffectFloat 2s ease-out forwards';
    effectElement.style.pointerEvents = 'none';
    effectElement.style.zIndex = '1000';
    
    container.style.position = 'relative';
    container.appendChild(effectElement);
    
    // Remover após duração
    setTimeout(() => {
      if (effectElement.parentNode) {
        effectElement.remove();
      }
    }, duration);
  }

  /**
   * Animar mudança de buff
   * @param {string} characterId - ID do personagem
   * @param {string} buffType - Tipo do buff
   */
  animateBuffChange(characterId, buffType) {
    const container = this.buffContainers.get(characterId);
    if (!container) return;

    const buffElement = container.querySelector(`.${this.buffConfigs[buffType]?.className}`);
    if (buffElement) {
      buffElement.classList.add('buff-changed');
      setTimeout(() => {
        buffElement.classList.remove('buff-changed');
      }, 600);
    }
  }

  /**
   * Obter estatísticas dos buffs ativos
   * @param {string} characterId - ID do personagem
   * @returns {Object} Estatísticas dos buffs
   */
  getBuffStats(characterId) {
    const buffs = this.activeBuffs.get(characterId);
    if (!buffs) return { total: 0, types: {} };

    const stats = {
      total: buffs.size,
      types: {},
      list: []
    };

    buffs.forEach((buff, buffType) => {
      stats.types[buff.type] = (stats.types[buff.type] || 0) + 1;
      stats.list.push({
        type: buffType,
        name: buff.name,
        value: buff.value,
        stacks: buff.stacks || 1
      });
    });

    return stats;
  }

  /**
   * Verificar se um buff específico está ativo
   * @param {string} characterId - ID do personagem
   * @param {string} buffType - Tipo do buff
   * @returns {boolean} True se o buff está ativo
   */
  hasActiveBuff(characterId, buffType) {
    const buffs = this.activeBuffs.get(characterId);
    return buffs ? buffs.has(buffType) : false;
  }

  /**
   * Limpar todos os dados de um personagem
   * @param {string} characterId - ID do personagem
   */
  cleanup(characterId) {
    this.buffContainers.delete(characterId);
    this.activeBuffs.delete(characterId);
  }

  /**
   * Resetar sistema completamente
   */
  reset() {
    this.buffContainers.clear();
    this.activeBuffs.clear();
  }
}

// Tornar disponível globalmente
window.BuffDebuffSystem = BuffDebuffSystem;