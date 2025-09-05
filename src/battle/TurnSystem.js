/**
 * Sistema de Turnos para RPG - Inspirado em TCGs
 * 
 * Implementa sistema de fases cíclico baseado em Trading Card Games como
 * Yu-Gi-Oh! e Magic: The Gathering. Cada turno possui 3 fases principais:
 * CHECK PHASE → PLAYER PHASE → END PHASE → próximo jogador
 * 
 * Integrado com sistema anti-cheat e habilidades passivas culturais.
 */

import { PassiveTriggerSystem } from './PassiveTriggerSystem.js';

export class TurnSystem {
  constructor(passiveAbilityService = null) {
    // Estado básico do sistema
    this.currentPlayer = 0;           // Índice do jogador atual
    this.players = [];                // Array de jogadores
    this.currentPhase = 'CHECK';      // Fase atual
    this.turnNumber = 1;              // Número do turno global
    this.phaseOrder = ['CHECK', 'PLAYER', 'END'];
    this.currentPhaseIndex = 0;       // Índice da fase atual
    
    // Sistema de efeitos por fase
    this.effects = {
      checkPhase: [],     // Efeitos da fase de verificação
      playerPhase: [],    // Efeitos da fase do jogador
      endPhase: [],       // Efeitos da fase final
      turnStart: [],      // Efeitos de início de turno
      turnEnd: []         // Efeitos de fim de turno
    };
    
    // Estado global do jogo
    this.gameState = {
      activeEffects: [],      // Efeitos ativos no campo
      conditions: new Map(),  // Condições especiais
      eventQueue: []          // Fila de eventos pendentes
    };

    // Integração com sistema de passivas
    if (passiveAbilityService) {
      this.passiveTriggerSystem = new PassiveTriggerSystem(passiveAbilityService);
    }

    // Configurações do sistema
    this.config = {
      maxTurns: 100,           // Máximo de turnos por jogo
      autoAdvance: false,      // Auto-avançar fases (para IA)
      debugMode: true,         // Logs detalhados
      validateMoves: true      // Validar todas as ações
    };

    console.log('✅ TurnSystem inicializado - Modo TCG ativo');
  }

  /**
   * Adiciona jogador ao sistema
   */
  addPlayer(playerData) {
    const player = {
      id: this.players.length,
      name: playerData.name || `Jogador ${this.players.length + 1}`,
      data: { ...playerData },
      
      // Recursos básicos
      resources: {
        health: playerData.resources?.health || 100,
        maxHealth: playerData.resources?.maxHealth || 100,
        Ânima: playerData.resources?.Ânima || 5,
        maxÂnima: playerData.resources?.maxÂnima || 10,
        ...playerData.resources
      },
      
      // Estados temporários
      statusEffects: [],
      buffs: [],
      debuffs: [],
      
      // Metadados
      turnsPassed: 0,
      actionsThisTurn: 0,
      isActive: true,
      
      // Cultura para passivas
      culture: playerData.culture || null,
      
      // Log de ações
      actionHistory: []
    };

    this.players.push(player);
    
    if (this.config.debugMode) {
      console.log(`👤 Jogador adicionado: ${player.name} (${player.culture || 'sem cultura'})`);
    }

    return player.id;
  }

  /**
   * Inicia o sistema de turnos
   */
  async startTurnSystem(battleId = null) {
    if (this.players.length === 0) {
      throw new Error('Nenhum jogador adicionado ao sistema');
    }

    // Registrar batalla no sistema de passivas se disponível
    if (this.passiveTriggerSystem && battleId) {
      this.passiveTriggerSystem.registerBattle(battleId, this.players);
    }

    // Resetar estado inicial
    this.currentPlayer = 0;
    this.currentPhase = 'CHECK';
    this.currentPhaseIndex = 0;
    this.turnNumber = 1;

    // Executar eventos de início de jogo
    await this._triggerGameStart(battleId);

    if (this.config.debugMode) {
      console.log('🎮 Sistema de Turnos iniciado');
      console.log(`👥 ${this.players.length} jogadores registrados`);
      console.log(`🎯 Primeiro turno: ${this.getCurrentPlayer().name}`);
    }

    return this.getGameStatus();
  }

  /**
   * Avança uma fase do sistema
   */
  async nextStep(battleId = null, actionData = {}) {
    const currentPlayer = this.getCurrentPlayer();
    const phaseName = this.currentPhase;

    if (this.config.debugMode) {
      console.log(`\n=== ${phaseName} PHASE - Player ${currentPlayer.name} ===`);
    }

    // Executar lógica da fase atual
    await this._executeCurrentPhase(battleId, actionData);

    // Avançar para próxima fase ou próximo jogador
    this._advancePhase(battleId);

    return this.getGameStatus();
  }

  /**
   * Executa a lógica da fase atual
   */
  async _executeCurrentPhase(battleId, actionData) {
    const currentPlayer = this.getCurrentPlayer();
    const phase = this.currentPhase;

    switch (phase) {
      case 'CHECK':
        await this._executeCheckPhase(battleId, currentPlayer, actionData);
        break;
      case 'PLAYER':
        await this._executePlayerPhase(battleId, currentPlayer, actionData);
        break;
      case 'END':
        await this._executeEndPhase(battleId, currentPlayer, actionData);
        break;
      default:
        console.warn(`⚠️ Fase desconhecida: ${phase}`);
    }

    // Processar efeitos registrados para esta fase
    await this._processPhaseEffects(phase, battleId);
  }

  /**
   * CHECK PHASE - Verificações automáticas
   */
  async _executeCheckPhase(battleId, player, actionData) {
    // 1. Verificar condições de vitória/derrota
    this._checkWinConditions();

    // 2. Regenerar recursos
    this._regenerateResources(player);

    // 3. Processar status effects
    this._processStatusEffects(player);

    // 4. Executar efeitos de início de turno
    await this._executeTurnStartEffects(battleId, player);

    // 5. Triggerar passivas de início de turno
    if (this.passiveTriggerSystem && battleId) {
      const triggeredPassives = this.passiveTriggerSystem.onBattleEvent(
        battleId, 
        'per_turn', 
        { player, phase: 'turn_start', turnNumber: this.turnNumber }
      );

      this._logTriggeredPassives(triggeredPassives);
    }

    if (this.config.debugMode) {
      console.log(`Check Phase: ${player.name} - Health: ${player.resources.health}, Ânima: ${player.resources.Ânima}`);
    }
  }

  /**
   * PLAYER PHASE - Fase ativa do jogador
   */
  async _executePlayerPhase(battleId, player, actionData) {
    // Resetar contador de ações do turno
    player.actionsThisTurn = 0;

    // Executar efeitos de fase do jogador
    await this._executePlayerPhaseEffects(battleId, player);

    if (this.config.debugMode) {
      console.log(`${player.name} pode realizar suas ações agora.`);
    }

    // Se modo automático estiver ativo, simular ação
    if (this.config.autoAdvance && !actionData.playerAction) {
      await this._executeAutoPlayerAction(battleId, player);
    }
  }

  /**
   * END PHASE - Limpeza e finalização
   */
  async _executeEndPhase(battleId, player, actionData) {
    // 1. Executar efeitos de fim de turno
    await this._executeTurnEndEffects(battleId, player);

    // 2. Limpeza de efeitos temporários
    this._cleanupTemporaryEffects(player);

    // 3. Processar dano contínuo
    this._processContinuousDamage(player);

    // 4. Incrementar contador de turnos do jogador
    player.turnsPassed++;

    if (this.config.debugMode) {
      console.log(`End Phase: Finalizando turno de ${player.name}`);
    }
  }

  /**
   * Avança para próxima fase ou próximo jogador
   */
  _advancePhase(battleId) {
    // Avançar índice da fase
    this.currentPhaseIndex++;

    // Se chegou ao final das fases, passar para próximo jogador
    if (this.currentPhaseIndex >= this.phaseOrder.length) {
      this._nextPlayer(battleId);
    } else {
      // Atualizar fase atual
      this.currentPhase = this.phaseOrder[this.currentPhaseIndex];
    }
  }

  /**
   * Passa para o próximo jogador
   */
  _nextPlayer(battleId) {
    const currentPlayer = this.getCurrentPlayer();
    
    if (this.config.debugMode) {
      console.log(`--- FIM DO TURNO de ${currentPlayer.name} ---`);
    }

    // Passar para próximo jogador
    this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
    
    // Se voltou ao primeiro jogador, incrementar número do turno
    if (this.currentPlayer === 0) {
      this.turnNumber++;
    }

    // Resetar fase para CHECK
    this.currentPhaseIndex = 0;
    this.currentPhase = this.phaseOrder[0];

    const nextPlayer = this.getCurrentPlayer();
    
    if (this.config.debugMode) {
      console.log(`\n>>> Passando para ${nextPlayer.name} <<<`);
    }
  }

  /**
   * Regenera recursos automáticos
   */
  _regenerateResources(player) {
    // Regeneração de Ânima (+1 por turno, máximo 10)
    if (player.resources.Ânima < player.resources.maxÂnima) {
      player.resources.Ânima = Math.min(
        player.resources.maxÂnima, 
        player.resources.Ânima + 1
      );
    }

    // Regeneração de HP (se houver efeitos de regeneração)
    const regenEffects = player.statusEffects.filter(effect => effect.type === 'regeneration');
    regenEffects.forEach(effect => {
      const healAmount = effect.value || 2;
      player.resources.health = Math.min(
        player.resources.maxHealth,
        player.resources.health + healAmount
      );
      
      if (this.config.debugMode) {
        console.log(`💚 ${player.name} regenerou ${healAmount} HP`);
      }
    });
  }

  /**
   * Verifica condições de vitória
   */
  _checkWinConditions() {
    this.players.forEach(player => {
      if (player.resources.health <= 0 && player.isActive) {
        player.isActive = false;
        
        if (this.config.debugMode) {
          console.log(`💀 ${player.name} foi derrotado!`);
        }

        // Adicionar evento à fila
        this.gameState.eventQueue.push({
          type: 'player_defeated',
          player: player,
          timestamp: Date.now()
        });
      }
    });

    // Verificar se jogo terminou
    const activePlayers = this.players.filter(p => p.isActive);
    if (activePlayers.length <= 1) {
      this.gameState.conditions.set('game_ended', true);
      
      if (this.config.debugMode) {
        console.log('🏆 Jogo terminou!');
      }
    }
  }

  /**
   * Processa efeitos de status
   */
  _processStatusEffects(player) {
    player.statusEffects = player.statusEffects.filter(effect => {
      // Aplicar efeito
      this._applyStatusEffect(player, effect);
      
      // Decrementar duração
      if (effect.duration > 0) {
        effect.duration--;
      }
      
      // Manter apenas efeitos que ainda têm duração
      return effect.duration > 0 || effect.duration === -1; // -1 = permanente
    });
  }

  /**
   * Aplica um efeito de status
   */
  _applyStatusEffect(player, effect) {
    switch (effect.type) {
      case 'poison':
        const poisonDamage = effect.value || 5;
        player.resources.health -= poisonDamage;
        if (this.config.debugMode) {
          console.log(`☠️ ${player.name} sofreu ${poisonDamage} de dano por veneno`);
        }
        break;
        
      case 'blessing':
        const blessingHeal = effect.value || 3;
        player.resources.health = Math.min(
          player.resources.maxHealth,
          player.resources.health + blessingHeal
        );
        if (this.config.debugMode) {
          console.log(`✨ ${player.name} foi curado em ${blessingHeal} por bênção`);
        }
        break;
        
      // Adicionar mais efeitos conforme necessário
    }
  }

  /**
   * Limpeza de efeitos temporários
   */
  _cleanupTemporaryEffects(player) {
    // Remove efeitos marcados como temporários
    player.statusEffects = player.statusEffects.filter(effect => !effect.temporary);
    
    // Remove buffs/debuffs expirados
    player.buffs = player.buffs.filter(buff => buff.duration > 0);
    player.debuffs = player.debuffs.filter(debuff => debuff.duration > 0);
  }

  /**
   * Processa dano contínuo
   */
  _processContinuousDamage(player) {
    const continuousDamageEffects = player.statusEffects.filter(
      effect => effect.type === 'continuous_damage'
    );
    
    continuousDamageEffects.forEach(effect => {
      const damage = effect.value || Math.floor(player.resources.maxHealth * 0.1);
      player.resources.health -= damage;
      
      if (this.config.debugMode) {
        console.log(`🔥 ${player.name} sofreu ${damage} de dano contínuo`);
      }
    });
  }

  /**
   * Executa efeitos registrados para uma fase
   */
  async _processPhaseEffects(phase, battleId) {
    const effects = this.effects[`${phase.toLowerCase()}Phase`] || [];
    
    for (const effect of effects) {
      try {
        if (effect.condition && !effect.condition(this.gameState, this.getCurrentPlayer())) {
          continue;
        }
        
        const result = await effect.execute(this.gameState, this.getCurrentPlayer());
        
        if (result && this.config.debugMode) {
          console.log(`⚡ Efeito aplicado: ${result}`);
        }
        
        // Decrementar duração se aplicável
        if (effect.duration && effect.duration > 0) {
          effect.duration--;
        }
        
      } catch (error) {
        console.error(`❌ Erro ao executar efeito de fase:`, error);
      }
    }
    
    // Remover efeitos expirados
    this.effects[`${phase.toLowerCase()}Phase`] = effects.filter(
      effect => !effect.duration || effect.duration > 0
    );
  }

  /**
   * Registra efeito para uma fase específica
   */
  registerEffect(phase, effectData) {
    const validPhases = ['checkPhase', 'playerPhase', 'endPhase', 'turnStart', 'turnEnd'];
    
    if (!validPhases.includes(phase)) {
      throw new Error(`Fase inválida: ${phase}. Deve ser uma de: ${validPhases.join(', ')}`);
    }

    const effect = {
      id: effectData.id || `effect_${Date.now()}`,
      name: effectData.name || 'Efeito Sem Nome',
      execute: effectData.execute,
      condition: effectData.condition || null,
      duration: effectData.duration || null,
      metadata: effectData.metadata || {}
    };

    this.effects[phase].push(effect);
    
    if (this.config.debugMode) {
      console.log(`📌 Efeito registrado para ${phase}: ${effect.name}`);
    }

    return effect.id;
  }

  /**
   * Triggerar eventos de início de jogo
   */
  async _triggerGameStart(battleId) {
    if (this.passiveTriggerSystem && battleId) {
      const triggeredPassives = this.passiveTriggerSystem.onBattleEvent(
        battleId, 
        'battle_start', 
        { players: this.players, turnNumber: this.turnNumber }
      );

      this._logTriggeredPassives(triggeredPassives);
    }
  }

  /**
   * Log de passivas ativadas
   */
  _logTriggeredPassives(triggeredPassives) {
    if (triggeredPassives.length > 0 && this.config.debugMode) {
      console.log(`🎭 ${triggeredPassives.length} passiva(s) cultural(is) ativada(s):`);
      triggeredPassives.forEach(passive => {
        console.log(`  ✨ ${passive.passiveName} (${passive.culture}) - ${passive.effectType}: +${passive.value}`);
      });
    }
  }

  /**
   * Executa turno completo de um jogador (3 fases)
   */
  async executePlayerTurn(battleId = null, actionData = {}) {
    const results = [];
    
    // Executar 3 fases do turno
    for (let i = 0; i < 3; i++) {
      const result = await this.nextStep(battleId, actionData);
      results.push(result);
    }

    return {
      turnNumber: this.turnNumber,
      playerId: this.currentPlayer,
      playerName: this.getCurrentPlayer().name,
      phases: results,
      gameEnded: this.gameState.conditions.get('game_ended') || false
    };
  }

  /**
   * Pula para uma fase específica
   */
  skipToPhase(targetPhase) {
    const phaseIndex = this.phaseOrder.indexOf(targetPhase);
    
    if (phaseIndex === -1) {
      throw new Error(`Fase inválida: ${targetPhase}`);
    }

    this.currentPhaseIndex = phaseIndex;
    this.currentPhase = targetPhase;

    if (this.config.debugMode) {
      console.log(`⏭️ Pulando para fase: ${targetPhase}`);
    }

    return this.getGameStatus();
  }

  /**
   * Obtém jogador atual
   */
  getCurrentPlayer() {
    return this.players[this.currentPlayer];
  }

  /**
   * Obtém status completo do jogo
   */
  getGameStatus() {
    return {
      currentPlayer: { ...this.getCurrentPlayer() },
      currentPhase: this.currentPhase,
      turnNumber: this.turnNumber,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        health: p.resources.health,
        maxHealth: p.resources.maxHealth,
        Ânima: p.resources.Ânima,
        maxÂnima: p.resources.maxÂnima,
        isActive: p.isActive,
        statusEffects: p.statusEffects.length,
        culture: p.culture
      })),
      activeEffects: this.gameState.activeEffects.length,
      gameEnded: this.gameState.conditions.get('game_ended') || false,
      turnsPassed: Math.floor((this.turnNumber - 1) * this.players.length) + this.currentPlayer
    };
  }

  /**
   * Executar efeitos de início de turno
   */
  async _executeTurnStartEffects(battleId, player) {
    const effects = this.effects.turnStart;
    
    for (const effect of effects) {
      try {
        if (effect.condition && !effect.condition(this.gameState, player)) {
          continue;
        }
        
        await effect.execute(this.gameState, player);
        
      } catch (error) {
        console.error(`❌ Erro em efeito de início de turno:`, error);
      }
    }
  }

  /**
   * Executar efeitos de fim de turno
   */
  async _executeTurnEndEffects(battleId, player) {
    const effects = this.effects.turnEnd;
    
    for (const effect of effects) {
      try {
        if (effect.condition && !effect.condition(this.gameState, player)) {
          continue;
        }
        
        await effect.execute(this.gameState, player);
        
      } catch (error) {
        console.error(`❌ Erro em efeito de fim de turno:`, error);
      }
    }
  }

  /**
   * Executar efeitos da fase do jogador
   */
  async _executePlayerPhaseEffects(battleId, player) {
    // Implementar lógica específica da fase do jogador
    // Como permitir ações, validar jogadas, etc.
  }

  /**
   * Ação automática do jogador (para modo IA)
   */
  async _executeAutoPlayerAction(battleId, player) {
    // Implementar ação automática simples para testes
    if (this.config.debugMode) {
      console.log(`🤖 ${player.name} executou ação automática`);
    }
  }

  /**
   * Configurar sistema
   */
  setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.debugMode) {
      console.log('⚙️ Configuração atualizada:', this.config);
    }
  }
}