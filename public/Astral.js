/**
 * Astral.js - Sistema de Cargas Astrais RPGStack v4.0.0
 * Sistema de energia astral que consome cargas ao meditar e defender
 * 
 * @version 4.0.0
 * @author RPGStack Team
 * @date 2025-09-01
 */

class AstralSystem {
  /**
   * Configurações do sistema astral
   */
  static MAX_ASTRAL_CHARGES = 8;
  static DEFAULT_CHARGES = 8;
  static CHARGE_CONSUMPTION = {
    meditate: 1,    // Meditar consome 1 carga astral
    defend: 1       // Defender consome 1 carga astral
  };

  constructor() {
    // Armazena cargas astrais por ID do personagem
    this.astralCharges = new Map();
    // Histórico de uso de cargas
    this.chargeHistory = new Map();
    
    console.log('🌟 Sistema Astral inicializado - 8 cargas por personagem');
  }

  /**
   * Inicializa cargas astrais para um personagem
   * @param {string} characterId - ID do personagem
   * @param {number} initialCharges - Cargas iniciais (padrão: 8)
   */
  initializeCharges(characterId, initialCharges = AstralSystem.DEFAULT_CHARGES) {
    this.astralCharges.set(characterId, initialCharges);
    this.chargeHistory.set(characterId, []);
    
    console.log(`✨ Personagem ${characterId} iniciado com ${initialCharges} cargas astrais`);
    
    return {
      characterId,
      charges: initialCharges,
      maxCharges: AstralSystem.MAX_ASTRAL_CHARGES,
      initialized: true
    };
  }

  /**
   * Consome cargas astrais para uma ação
   * @param {string} characterId - ID do personagem
   * @param {string} action - Ação (meditate, defend)
   * @param {number} customCost - Custo customizado (opcional)
   * @returns {Object} Resultado do consumo
   */
  consumeCharge(characterId, action, customCost = null) {
    // Verificar se personagem está inicializado
    if (!this.astralCharges.has(characterId)) {
      this.initializeCharges(characterId);
    }

    const currentCharges = this.astralCharges.get(characterId);
    const cost = customCost || AstralSystem.CHARGE_CONSUMPTION[action] || 1;

    // Verificar se tem cargas suficientes
    if (currentCharges < cost) {
      return {
        success: false,
        characterId,
        action,
        cost,
        currentCharges,
        remainingCharges: currentCharges,
        message: `❌ Cargas astrais insuficientes! Necessário: ${cost}, Disponível: ${currentCharges}`,
        canPerformAction: false
      };
    }

    // Consumir cargas
    const newCharges = currentCharges - cost;
    this.astralCharges.set(characterId, newCharges);

    // Registrar no histórico
    const historyEntry = {
      timestamp: Date.now(),
      action,
      cost,
      chargesBefore: currentCharges,
      chargesAfter: newCharges
    };
    
    const history = this.chargeHistory.get(characterId) || [];
    history.push(historyEntry);
    this.chargeHistory.set(characterId, history);

    console.log(`⚡ ${characterId} consumiu ${cost} carga(s) astral(ais) para ${action}`);

    return {
      success: true,
      characterId,
      action,
      cost,
      currentCharges,
      remainingCharges: newCharges,
      maxCharges: AstralSystem.MAX_ASTRAL_CHARGES,
      message: `✨ ${this.getActionMessage(action)} (-${cost} carga astral) | Restante: ${newCharges}/${AstralSystem.MAX_ASTRAL_CHARGES}`,
      canPerformAction: true,
      percentageRemaining: Math.round((newCharges / AstralSystem.MAX_ASTRAL_CHARGES) * 100)
    };
  }

  /**
   * Verifica se o personagem pode realizar uma ação
   * @param {string} characterId - ID do personagem
   * @param {string} action - Ação a ser verificada
   * @param {number} customCost - Custo customizado (opcional)
   * @returns {boolean} Se pode realizar a ação
   */
  canPerformAction(characterId, action, customCost = null) {
    if (!this.astralCharges.has(characterId)) {
      this.initializeCharges(characterId);
    }

    const currentCharges = this.astralCharges.get(characterId);
    const cost = customCost || AstralSystem.CHARGE_CONSUMPTION[action] || 1;
    
    return currentCharges >= cost;
  }

  /**
   * Obtém as cargas astrais atuais de um personagem
   * @param {string} characterId - ID do personagem
   * @returns {Object} Estado das cargas astrais
   */
  getCharges(characterId) {
    if (!this.astralCharges.has(characterId)) {
      this.initializeCharges(characterId);
    }

    const charges = this.astralCharges.get(characterId);
    const percentage = Math.round((charges / AstralSystem.MAX_ASTRAL_CHARGES) * 100);
    const history = this.chargeHistory.get(characterId) || [];

    return {
      characterId,
      currentCharges: charges,
      maxCharges: AstralSystem.MAX_ASTRAL_CHARGES,
      percentage,
      isEmpty: charges === 0,
      isFull: charges === AstralSystem.MAX_ASTRAL_CHARGES,
      history: history.slice(-5), // Últimas 5 ações
      canMeditate: this.canPerformAction(characterId, 'meditate'),
      canDefend: this.canPerformAction(characterId, 'defend')
    };
  }

  /**
   * Restaura cargas astrais (para casos especiais)
   * @param {string} characterId - ID do personagem
   * @param {number} amount - Quantidade a restaurar
   * @returns {Object} Resultado da restauração
   */
  restoreCharges(characterId, amount) {
    if (!this.astralCharges.has(characterId)) {
      this.initializeCharges(characterId);
    }

    const currentCharges = this.astralCharges.get(characterId);
    const newCharges = Math.min(currentCharges + amount, AstralSystem.MAX_ASTRAL_CHARGES);
    const actualRestored = newCharges - currentCharges;
    
    this.astralCharges.set(characterId, newCharges);

    // Registrar no histórico
    const historyEntry = {
      timestamp: Date.now(),
      action: 'restore',
      cost: -actualRestored, // Negativo para indicar ganho
      chargesBefore: currentCharges,
      chargesAfter: newCharges
    };
    
    const history = this.chargeHistory.get(characterId) || [];
    history.push(historyEntry);
    this.chargeHistory.set(characterId, history);

    console.log(`🌟 ${characterId} restaurou ${actualRestored} carga(s) astral(ais)`);

    return {
      characterId,
      chargesRestored: actualRestored,
      currentCharges: newCharges,
      maxCharges: AstralSystem.MAX_ASTRAL_CHARGES,
      message: `🌟 Cargas astrais restauradas! (+${actualRestored}) | Total: ${newCharges}/${AstralSystem.MAX_ASTRAL_CHARGES}`
    };
  }

  /**
   * Redefine cargas astrais para o máximo (início de batalha/descanso)
   * @param {string} characterId - ID do personagem
   * @returns {Object} Resultado da redefinição
   */
  resetCharges(characterId) {
    const previousCharges = this.astralCharges.get(characterId) || 0;
    this.astralCharges.set(characterId, AstralSystem.MAX_ASTRAL_CHARGES);
    
    // Limpar histórico na redefinição
    this.chargeHistory.set(characterId, [{
      timestamp: Date.now(),
      action: 'reset',
      cost: 0,
      chargesBefore: previousCharges,
      chargesAfter: AstralSystem.MAX_ASTRAL_CHARGES
    }]);

    console.log(`🔄 ${characterId} - cargas astrais redefinidas para ${AstralSystem.MAX_ASTRAL_CHARGES}`);

    return {
      characterId,
      previousCharges,
      currentCharges: AstralSystem.MAX_ASTRAL_CHARGES,
      maxCharges: AstralSystem.MAX_ASTRAL_CHARGES,
      message: `🔄 Cargas astrais redefinidas! ${AstralSystem.MAX_ASTRAL_CHARGES}/${AstralSystem.MAX_ASTRAL_CHARGES}`
    };
  }

  /**
   * Obtém todos os personagens e seus estados astrais
   * @returns {Array} Lista de estados astrais
   */
  getAllChargesStates() {
    const states = [];
    
    for (const [characterId] of this.astralCharges) {
      states.push(this.getCharges(characterId));
    }

    return states;
  }

  /**
   * Mensagens personalizadas para ações
   * @param {string} action - Ação realizada
   * @returns {string} Mensagem da ação
   */
  getActionMessage(action) {
    const messages = {
      meditate: 'Energia astral canalizada para meditação',
      defend: 'Barreira astral ativada para defesa',
      restore: 'Cargas astrais restauradas',
      reset: 'Campo astral redefinido'
    };

    return messages[action] || 'Ação astral realizada';
  }

  /**
   * Obtém estatísticas do sistema astral
   * @returns {Object} Estatísticas gerais
   */
  getSystemStats() {
    const totalCharacters = this.astralCharges.size;
    let totalChargesUsed = 0;
    let totalActions = 0;

    for (const [characterId, history] of this.chargeHistory) {
      const characterHistory = history || [];
      totalActions += characterHistory.length;
      
      for (const entry of characterHistory) {
        if (entry.cost > 0) {
          totalChargesUsed += entry.cost;
        }
      }
    }

    return {
      totalCharacters,
      maxChargesPerCharacter: AstralSystem.MAX_ASTRAL_CHARGES,
      totalChargesUsed,
      totalActions,
      averageActionsPerCharacter: totalCharacters > 0 ? Math.round(totalActions / totalCharacters) : 0,
      systemVersion: '4.0.0'
    };
  }

  /**
   * Integração com BattleMechanics para verificar cargas antes de ações
   * @param {string} characterId - ID do personagem
   * @param {string} action - Ação a ser realizada (meditate/defend)
   * @returns {Object} Resultado da verificação e consumo
   */
  handleBattleAction(characterId, action) {
    // Verificar se pode realizar a ação
    if (!this.canPerformAction(characterId, action)) {
      return {
        success: false,
        blocked: true,
        message: `❌ Sem cargas astrais para ${action === 'meditate' ? 'meditar' : 'defender'}!`,
        currentCharges: this.getCharges(characterId).currentCharges
      };
    }

    // Consumir carga
    return this.consumeCharge(characterId, action);
  }
}

// Instância global do sistema astral
const astralSystem = new AstralSystem();

// Integração com Game Engine se disponível
if (typeof window !== 'undefined' && window.GameEngine) {
  window.GameEngine.astral = astralSystem;
  console.log('🌟 Sistema Astral integrado ao Game Engine');
}

// Exportação para Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AstralSystem, astralSystem };
}

// Disponibilizar globalmente
if (typeof window !== 'undefined') {
  window.AstralSystem = AstralSystem;
  window.astralSystem = astralSystem;
}

console.log('🌟 Astral.js v4.0.0 carregado - Sistema de 8 cargas astrais ativo');