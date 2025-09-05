/**
 * Sistema de Triggers para Habilidades Passivas Culturais
 * 
 * Responsável por monitorar eventos de combate e ativar automaticamente
 * as habilidades passivas apropriadas para cada personagem baseado em
 * sua cultura e nas condições do combate.
 */

export class PassiveTriggerSystem {
  constructor(passiveAbilityService) {
    this.passiveAbilityService = passiveAbilityService;
    this.activePassives = new Map(); // battleId -> passives[]
    this.triggerHandlers = this._initializeTriggerHandlers();
  }

  /**
   * Registra uma nova batalha no sistema de triggers
   */
  registerBattle(battleId, players) {
    this.activePassives.set(battleId, new Map());
    
    // Carregar passivas de todos os personagens da batalha
    players.forEach(async (player, playerIndex) => {
      await this._loadPlayerPassives(battleId, playerIndex, player);
    });
  }

  /**
   * Carrega todas as passivas de um jogador baseado na cultura do personagem
   */
  async _loadPlayerPassives(battleId, playerIndex, player) {
    if (!player.culture) return;
    
    try {
      // Buscar passivas da cultura do personagem
      const result = await this.passiveAbilityService.getPassiveAbilitiesByCulture(player.culture);
      const passives = result.passiveAbilities;
      
      if (!this.activePassives.get(battleId)) {
        this.activePassives.set(battleId, new Map());
      }
      
      this.activePassives.get(battleId).set(playerIndex, passives);
      
      console.log(`🎭 [PassiveTrigger] Carregadas ${passives.length} passivas culturais para ${player.name} (${player.culture})`);
      
      // Aplicar passivas que começam automaticamente
      this._triggerPassivesForEvent(battleId, playerIndex, 'battle_start', { player });
      
    } catch (error) {
      console.error(`❌ [PassiveTrigger] Erro ao carregar passivas para ${player.name}:`, error);
    }
  }

  /**
   * Processa evento de combat e ativa passivas apropriadas
   */
  onBattleEvent(battleId, eventType, eventData = {}) {
    if (!this.activePassives.has(battleId)) {
      console.warn(`⚠️ [PassiveTrigger] Batalha ${battleId} não registrada`);
      return [];
    }

    const battlePassives = this.activePassives.get(battleId);
    const triggeredEffects = [];

    // Verificar passivas de todos os players
    battlePassives.forEach((playerPassives, playerIndex) => {
      const effects = this._triggerPassivesForEvent(battleId, playerIndex, eventType, eventData);
      triggeredEffects.push(...effects);
    });

    return triggeredEffects;
  }

  /**
   * Ativa passivas específicas para um evento
   */
  _triggerPassivesForEvent(battleId, playerIndex, eventType, eventData) {
    const battlePassives = this.activePassives.get(battleId);
    if (!battlePassives || !battlePassives.has(playerIndex)) return [];

    const playerPassives = battlePassives.get(playerIndex);
    const triggeredEffects = [];

    playerPassives.forEach(passive => {
      if (this._shouldTriggerPassive(passive, eventType, eventData)) {
        const effect = this._executePassive(battleId, playerIndex, passive, eventData);
        if (effect) {
          triggeredEffects.push(effect);
        }
      }
    });

    return triggeredEffects;
  }

  /**
   * Verifica se uma passiva deve ser ativada
   */
  _shouldTriggerPassive(passive, eventType, eventData) {
    // Passivas que sempre estão ativas
    if (passive.trigger === 'passive_always') return true;
    
    // Verificar se o trigger corresponde ao evento
    if (passive.trigger !== eventType) return false;

    // Verificar condições específicas da passiva
    return this._checkPassiveConditions(passive, eventData);
  }

  /**
   * Verifica condições específicas da passiva
   */
  _checkPassiveConditions(passive, eventData) {
    const condition = passive.effect.condition;
    if (!condition) return true;

    // Implementar lógica de condições baseada no tipo
    switch (condition) {
      case 'allies_within_range >= 1':
        return eventData.alliesCount >= 1;
        
      case 'hp_below_30_percent':
        return eventData.player && (eventData.player.currentHP / eventData.player.maxHP) < 0.3;
        
      case 'using_magic_skills':
        return eventData.skillType === 'magic' || eventData.skillType === 'spell';
        
      case 'using_precision_skills':
        return eventData.skillType === 'precision' || eventData.skillType === 'technical';
        
      case 'debuff_effects':
        return eventData.hasDebuffs || eventData.effectType === 'debuff';
        
      case 'turn_start':
        return eventData.phase === 'turn_start';
        
      case 'night_time_or_outdoor':
        return eventData.environment === 'night' || eventData.environment === 'outdoor';
        
      default:
        return true;
    }
  }

  /**
   * Executa o efeito de uma passiva
   */
  _executePassive(battleId, playerIndex, passive, eventData) {
    const effect = passive.effect;
    
    console.log(`✨ [PassiveTrigger] Ativando passiva "${passive.name}" (${effect.type}: +${effect.value})`);

    return {
      battleId,
      playerIndex,
      passiveId: passive.id,
      passiveName: passive.name,
      culture: passive.culture,
      effectType: effect.type,
      value: effect.value,
      condition: effect.condition,
      trigger: passive.trigger,
      rarity: passive.rarity,
      culturalLore: passive.cultural_lore,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Inicializa handlers específicos para cada tipo de trigger
   */
  _initializeTriggerHandlers() {
    return {
      battle_start: (battleId, eventData) => {
        return this.onBattleEvent(battleId, 'battle_start', eventData);
      },
      
      per_turn: (battleId, eventData) => {
        return this.onBattleEvent(battleId, 'per_turn', { 
          ...eventData, 
          phase: 'turn_start' 
        });
      },
      
      low_hp: (battleId, playerIndex, player) => {
        if ((player.currentHP / player.maxHP) < 0.3) {
          return this.onBattleEvent(battleId, 'low_hp', { player, playerIndex });
        }
        return [];
      },
      
      spell_cast: (battleId, eventData) => {
        return this.onBattleEvent(battleId, 'spell_cast', eventData);
      },
      
      when_attacked: (battleId, eventData) => {
        return this.onBattleEvent(battleId, 'when_attacked', eventData);
      },
      
      on_critical: (battleId, eventData) => {
        return this.onBattleEvent(battleId, 'on_critical', eventData);
      },
      
      defend: (battleId, eventData) => {
        return this.onBattleEvent(battleId, 'defend', eventData);
      },
      
      ally_low_hp: (battleId, eventData) => {
        return this.onBattleEvent(battleId, 'ally_low_hp', eventData);
      },
      
      enemy_defeated: (battleId, eventData) => {
        return this.onBattleEvent(battleId, 'enemy_defeated', eventData);
      }
    };
  }

  /**
   * Remove batalha do sistema quando termina
   */
  unregisterBattle(battleId) {
    if (this.activePassives.has(battleId)) {
      const passivesCount = this.activePassives.get(battleId).size;
      this.activePassives.delete(battleId);
      console.log(`🗑️ [PassiveTrigger] Batalha ${battleId} removida (${passivesCount} players)`);
    }
  }

  /**
   * Obtém estatísticas do sistema
   */
  getSystemStats() {
    const activeBattles = this.activePassives.size;
    let totalActivePassives = 0;
    
    this.activePassives.forEach(battlePassives => {
      battlePassives.forEach(playerPassives => {
        totalActivePassives += playerPassives.length;
      });
    });

    return {
      activeBattles,
      totalActivePassives,
      triggerTypes: Object.keys(this.triggerHandlers),
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Helper para integração com sistema anti-cheat
   */
  validatePassiveActivation(battleId, playerIndex, passiveId, eventData) {
    const battlePassives = this.activePassives.get(battleId);
    if (!battlePassives || !battlePassives.has(playerIndex)) {
      return { valid: false, reason: 'Player not found in battle' };
    }

    const playerPassives = battlePassives.get(playerIndex);
    const passive = playerPassives.find(p => p.id === passiveId);
    
    if (!passive) {
      return { valid: false, reason: 'Passive not found for player' };
    }

    const shouldTrigger = this._shouldTriggerPassive(passive, eventData.eventType, eventData);
    
    return {
      valid: shouldTrigger,
      passive: passive,
      reason: shouldTrigger ? 'Valid activation' : 'Conditions not met'
    };
  }
}