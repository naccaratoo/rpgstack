/**
 * Sistema de Triggers Personalizados para TurnSystem
 * Permite criar e gerenciar eventos específicos que se ativam
 * com base em condições complexas durante o combate
 */

export class CustomTriggerSystem {
    constructor() {
        this.triggers = new Map();
        this.eventListeners = new Map();
        this.triggerHistory = [];
        
        this.config = {
            maxTriggerHistory: 1000,
            enableChaining: true,        // Triggers podem ativar outros triggers
            maxChainDepth: 5,            // Máxima profundidade de chain
            debugMode: true,
            logAllEvents: false,
            preventInfiniteLoops: true
        };

        this.builtInTriggers = this._initializeBuiltInTriggers();
        this._registerBuiltInTriggers();
    }

    /**
     * Registrar novo trigger personalizado
     */
    registerTrigger(triggerId, triggerConfig) {
        const trigger = {
            id: triggerId,
            name: triggerConfig.name || triggerId,
            description: triggerConfig.description || '',
            
            // Condições de ativação
            conditions: triggerConfig.conditions || [],
            
            // Eventos que ativam o trigger
            events: triggerConfig.events || [],
            
            // Ação a ser executada quando ativado
            action: triggerConfig.action,
            
            // Configurações específicas
            priority: triggerConfig.priority || 0,
            cooldown: triggerConfig.cooldown || 0,
            maxActivations: triggerConfig.maxActivations || null,
            
            // Estado do trigger
            activationCount: 0,
            lastActivated: null,
            isActive: true,
            
            // Metadados
            tags: triggerConfig.tags || [],
            metadata: triggerConfig.metadata || {}
        };

        this.triggers.set(triggerId, trigger);

        if (this.config.debugMode) {
            console.log(`🎯 Trigger registrado: ${triggerId} - ${trigger.name}`);
        }

        return triggerId;
    }

    /**
     * Processar evento e verificar triggers
     */
    async processEvent(eventType, eventData, context = {}) {
        if (this.config.logAllEvents && this.config.debugMode) {
            console.log(`📡 Evento recebido: ${eventType}`, eventData);
        }

        const activatedTriggers = [];
        const chainDepth = context.chainDepth || 0;

        if (chainDepth > this.config.maxChainDepth) {
            console.warn(`⚠️ Máxima profundidade de chain atingida: ${chainDepth}`);
            return activatedTriggers;
        }

        // Verificar todos os triggers para este evento
        for (const [triggerId, trigger] of this.triggers.entries()) {
            if (!trigger.isActive) continue;
            if (!this._shouldTriggerActivate(trigger, eventType, eventData, context)) continue;

            try {
                const result = await this._activateTrigger(trigger, eventType, eventData, {
                    ...context,
                    chainDepth: chainDepth + 1
                });
                
                if (result.activated) {
                    activatedTriggers.push(result);
                    
                    // Chain triggers se habilitado
                    if (this.config.enableChaining && result.chainEvents) {
                        for (const chainEvent of result.chainEvents) {
                            const chainResults = await this.processEvent(
                                chainEvent.type,
                                chainEvent.data,
                                { ...context, chainDepth: chainDepth + 1, parentTrigger: triggerId }
                            );
                            activatedTriggers.push(...chainResults);
                        }
                    }
                }
            } catch (error) {
                console.error(`❌ Erro ao ativar trigger ${triggerId}:`, error);
            }
        }

        return activatedTriggers;
    }

    /**
     * Verificar se trigger deve ser ativado
     */
    _shouldTriggerActivate(trigger, eventType, eventData, context) {
        // 1. Verificar se evento está na lista de eventos do trigger
        if (trigger.events.length > 0 && !trigger.events.includes(eventType)) {
            return false;
        }

        // 2. Verificar cooldown
        if (trigger.cooldown > 0 && trigger.lastActivated) {
            const timeSinceActivation = Date.now() - trigger.lastActivated;
            if (timeSinceActivation < trigger.cooldown * 1000) {
                return false;
            }
        }

        // 3. Verificar máximo de ativações
        if (trigger.maxActivations && trigger.activationCount >= trigger.maxActivations) {
            return false;
        }

        // 4. Verificar condições específicas
        for (const condition of trigger.conditions) {
            if (!this._evaluateCondition(condition, eventData, context)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Avaliar condição específica
     */
    _evaluateCondition(condition, eventData, context) {
        switch (condition.type) {
            case 'player_health':
                return this._evaluateHealthCondition(condition, eventData);
                
            case 'player_anima':
                return this._evaluateAnimaCondition(condition, eventData);
                
            case 'turn_number':
                return this._evaluateTurnCondition(condition, context);
                
            case 'status_effect':
                return this._evaluateStatusCondition(condition, eventData);
                
            case 'skill_used':
                return this._evaluateSkillCondition(condition, eventData);
                
            case 'damage_dealt':
                return this._evaluateDamageCondition(condition, eventData);
                
            case 'custom':
                return this._evaluateCustomCondition(condition, eventData, context);
                
            default:
                console.warn(`⚠️ Condição desconhecida: ${condition.type}`);
                return true;
        }
    }

    /**
     * Ativar trigger
     */
    async _activateTrigger(trigger, eventType, eventData, context) {
        trigger.activationCount++;
        trigger.lastActivated = Date.now();

        if (this.config.debugMode) {
            console.log(`🎯 Ativando trigger: ${trigger.name}`);
        }

        let result = {
            triggerId: trigger.id,
            triggerName: trigger.name,
            eventType,
            activated: true,
            chainEvents: [],
            effects: []
        };

        try {
            // Executar ação do trigger
            if (typeof trigger.action === 'function') {
                const actionResult = await trigger.action(eventData, context);
                result = { ...result, ...actionResult };
            }

            // Registrar no histórico
            this._recordTriggerActivation(trigger, eventType, eventData, result);

        } catch (error) {
            console.error(`❌ Erro na execução do trigger ${trigger.id}:`, error);
            result.activated = false;
            result.error = error.message;
        }

        return result;
    }

    /**
     * Registrar ativação no histórico
     */
    _recordTriggerActivation(trigger, eventType, eventData, result) {
        this.triggerHistory.push({
            triggerId: trigger.id,
            triggerName: trigger.name,
            eventType,
            timestamp: Date.now(),
            result,
            activationNumber: trigger.activationCount
        });

        // Limitar tamanho do histórico
        if (this.triggerHistory.length > this.config.maxTriggerHistory) {
            this.triggerHistory = this.triggerHistory.slice(-this.config.maxTriggerHistory);
        }
    }

    /**
     * Inicializar triggers pré-definidos
     */
    _initializeBuiltInTriggers() {
        return {
            // Trigger de HP baixo
            lowHealthAlert: {
                name: 'Alerta de HP Baixo',
                description: 'Ativa quando HP do jogador fica abaixo de 25%',
                events: ['health_changed', 'damage_received'],
                conditions: [
                    {
                        type: 'player_health',
                        operator: 'less_than',
                        value: 0.25,
                        relative: true
                    }
                ],
                action: async (eventData, context) => {
                    const player = eventData.player;
                    return {
                        effects: [`${player.name} está com HP crítico!`],
                        chainEvents: [{
                            type: 'status_effect_applied',
                            data: {
                                player,
                                effect: {
                                    type: 'desperation',
                                    value: 20,
                                    duration: 5,
                                    description: '+20% damage quando HP < 25%'
                                }
                            }
                        }]
                    };
                },
                maxActivations: 1,
                tags: ['health', 'defensive', 'status']
            },

            // Trigger de combo de skills
            skillCombo: {
                name: 'Detector de Combo',
                description: 'Detecta quando jogador usa skills em sequência',
                events: ['skill_used'],
                conditions: [
                    {
                        type: 'custom',
                        evaluate: (eventData, context) => {
                            // Verificar se usou skill nos últimos 2 turnos
                            const recentSkills = context.recentSkills || [];
                            return recentSkills.length >= 2;
                        }
                    }
                ],
                action: async (eventData, context) => {
                    const player = eventData.player;
                    const comboBonus = Math.min(eventData.comboLength * 10, 50);
                    
                    return {
                        effects: [`${player.name} executou combo! +${comboBonus}% de bônus`],
                        chainEvents: [{
                            type: 'combo_activated',
                            data: {
                                player,
                                comboLength: eventData.comboLength,
                                bonus: comboBonus
                            }
                        }]
                    };
                },
                cooldown: 3,
                tags: ['combat', 'skills', 'bonus']
            },

            // Trigger de morte iminente
            lastStand: {
                name: 'Último Suspiro',
                description: 'Ativa quando jogador está prestes a morrer',
                events: ['health_changed'],
                conditions: [
                    {
                        type: 'player_health',
                        operator: 'less_than',
                        value: 10
                    }
                ],
                action: async (eventData, context) => {
                    const player = eventData.player;
                    
                    return {
                        effects: [
                            `${player.name} luta até o fim!`,
                            'Todos os ataques se tornam críticos no próximo turno!'
                        ],
                        chainEvents: [{
                            type: 'last_stand_activated',
                            data: {
                                player,
                                effect: 'guaranteed_critical',
                                duration: 1
                            }
                        }]
                    };
                },
                maxActivations: 1,
                tags: ['dramatic', 'critical', 'survival']
            },

            // Trigger de vitória cultural
            culturalVictory: {
                name: 'Vitória Cultural',
                description: 'Ativa passiva cultural específica em momentos épicos',
                events: ['critical_hit', 'enemy_defeated', 'last_enemy'],
                conditions: [
                    {
                        type: 'custom',
                        evaluate: (eventData, context) => {
                            return eventData.player?.culture && Math.random() < 0.3; // 30% chance
                        }
                    }
                ],
                action: async (eventData, context) => {
                    const player = eventData.player;
                    const culturalBonus = this._getCulturalBonus(player.culture);
                    
                    return {
                        effects: [
                            `Ancestrais de ${player.culture} abençoam ${player.name}!`,
                            culturalBonus.description
                        ],
                        chainEvents: [{
                            type: 'cultural_blessing',
                            data: {
                                player,
                                culture: player.culture,
                                bonus: culturalBonus
                            }
                        }]
                    };
                },
                cooldown: 10,
                tags: ['cultural', 'epic', 'blessing']
            }
        };
    }

    /**
     * Registrar triggers pré-definidos
     */
    _registerBuiltInTriggers() {
        Object.entries(this.builtInTriggers).forEach(([id, config]) => {
            this.registerTrigger(id, config);
        });
    }

    /**
     * Obter bônus cultural específico
     */
    _getCulturalBonus(culture) {
        const bonuses = {
            'Romana': { type: 'defense', value: 25, description: 'Disciplina militar +25 defesa' },
            'Chinesa': { type: 'anima', value: 10, description: 'Harmonia elemental +10 ânima' },
            'Grega': { type: 'critical', value: 20, description: 'Sabedoria clássica +20% crítico' },
            'Japonesa': { type: 'resistance', value: 30, description: 'Bushido +30 resistência mental' },
            'Viking': { type: 'damage', value: 50, description: 'Fúria berserker +50 dano' },
            'Eslava': { type: 'regeneration', value: 15, description: 'Força ancestral +15 HP/turno' }
        };

        return bonuses[culture] || { type: 'generic', value: 10, description: 'Bênção ancestral' };
    }

    // Métodos de avaliação de condições específicas
    _evaluateHealthCondition(condition, eventData) {
        const player = eventData.player;
        if (!player?.resources) return false;

        const currentHealth = player.resources.health;
        const maxHealth = player.resources.maxHealth;
        
        let compareValue = condition.value;
        if (condition.relative) {
            compareValue = maxHealth * condition.value;
        }

        switch (condition.operator) {
            case 'less_than': return currentHealth < compareValue;
            case 'greater_than': return currentHealth > compareValue;
            case 'equal': return currentHealth === compareValue;
            default: return false;
        }
    }

    _evaluateAnimaCondition(condition, eventData) {
        const player = eventData.player;
        if (!player?.resources) return false;

        const currentAnima = player.resources.anima;
        const maxAnima = player.resources.maxAnima;
        
        let compareValue = condition.value;
        if (condition.relative) {
            compareValue = maxAnima * condition.value;
        }

        switch (condition.operator) {
            case 'less_than': return currentAnima < compareValue;
            case 'greater_than': return currentAnima > compareValue;
            case 'equal': return currentAnima === compareValue;
            default: return false;
        }
    }

    _evaluateTurnCondition(condition, context) {
        const turnNumber = context.turnNumber || 0;
        
        switch (condition.operator) {
            case 'greater_than': return turnNumber > condition.value;
            case 'multiple_of': return turnNumber % condition.value === 0;
            case 'equal': return turnNumber === condition.value;
            default: return false;
        }
    }

    _evaluateStatusCondition(condition, eventData) {
        const player = eventData.player;
        if (!player?.statusEffects) return false;

        const hasEffect = player.statusEffects.some(effect => 
            effect.type === condition.statusType
        );

        return condition.shouldHave ? hasEffect : !hasEffect;
    }

    _evaluateSkillCondition(condition, eventData) {
        if (!eventData.skill) return false;
        
        switch (condition.check) {
            case 'skill_id': return eventData.skill.id === condition.value;
            case 'skill_type': return eventData.skill.type === condition.value;
            case 'anima_cost': return eventData.skill.animaCost >= condition.value;
            default: return false;
        }
    }

    _evaluateDamageCondition(condition, eventData) {
        const damage = eventData.damage || 0;
        
        switch (condition.operator) {
            case 'greater_than': return damage > condition.value;
            case 'critical': return eventData.isCritical === true;
            case 'type': return eventData.damageType === condition.value;
            default: return false;
        }
    }

    _evaluateCustomCondition(condition, eventData, context) {
        if (typeof condition.evaluate === 'function') {
            return condition.evaluate(eventData, context);
        }
        return true;
    }

    /**
     * Obter histórico de triggers
     */
    getTriggerHistory(limit = 50) {
        return this.triggerHistory.slice(-limit);
    }

    /**
     * Obter estatísticas de triggers
     */
    getTriggerStats() {
        const stats = {
            totalTriggers: this.triggers.size,
            totalActivations: 0,
            mostActiveTriggerId: null,
            mostActiveCount: 0,
            triggersByTag: {},
            activationsByEvent: {}
        };

        // Calcular estatísticas
        for (const [id, trigger] of this.triggers.entries()) {
            stats.totalActivations += trigger.activationCount;
            
            if (trigger.activationCount > stats.mostActiveCount) {
                stats.mostActiveCount = trigger.activationCount;
                stats.mostActiveTriggerId = id;
            }

            // Contar por tags
            trigger.tags.forEach(tag => {
                stats.triggersByTag[tag] = (stats.triggersByTag[tag] || 0) + 1;
            });
        }

        // Ativações por evento
        this.triggerHistory.forEach(record => {
            stats.activationsByEvent[record.eventType] = 
                (stats.activationsByEvent[record.eventType] || 0) + 1;
        });

        return stats;
    }

    /**
     * Limpar histórico
     */
    clearHistory() {
        this.triggerHistory = [];
        if (this.config.debugMode) {
            console.log('🗑️ Histórico de triggers limpo');
        }
    }

    /**
     * Desabilitar/habilitar trigger
     */
    toggleTrigger(triggerId, isActive = null) {
        const trigger = this.triggers.get(triggerId);
        if (trigger) {
            trigger.isActive = isActive !== null ? isActive : !trigger.isActive;
            if (this.config.debugMode) {
                console.log(`🔄 Trigger ${triggerId}: ${trigger.isActive ? 'ativado' : 'desativado'}`);
            }
        }
    }

    /**
     * Resetar contador de ativações
     */
    resetTrigger(triggerId) {
        const trigger = this.triggers.get(triggerId);
        if (trigger) {
            trigger.activationCount = 0;
            trigger.lastActivated = null;
            if (this.config.debugMode) {
                console.log(`🔄 Trigger ${triggerId} resetado`);
            }
        }
    }

    /**
     * Configurar sistema
     */
    setConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        if (this.config.debugMode) {
            console.log('⚙️ CustomTriggerSystem configurado:', this.config);
        }
    }
}