/**
 * Sistema de Prioridade para TurnSystem
 * Extensão que adiciona lógica de prioridade baseada em velocidade,
 * iniciativa e modificadores especiais
 */

export class PrioritySystem {
    constructor() {
        this.config = {
            baseSpeedWeight: 1.0,           // Peso da velocidade base
            initiativeWeight: 0.8,          // Peso da iniciativa
            randomFactor: 0.2,              // Fator aleatório (0-20%)
            statusEffectModifiers: {
                haste: 0.5,                 // +50% prioridade
                slow: -0.3,                 // -30% prioridade
                paralysis: -0.8,            // -80% prioridade
                agility: 0.3,               // +30% prioridade
                lethargy: -0.5              // -50% prioridade
            },
            skillPriorityModifiers: {
                interrupt: 3.0,             // Skills de interrupção
                counter: 2.5,               // Contra-ataques
                quick: 1.5,                 // Skills rápidas
                charge: -1.0,               // Skills de carga
                ritual: -2.0                // Skills rituais
            },
            culturalModifiers: {
                'Japonesa': 0.15,           // Bushido - disciplina
                'Chinesa': 0.10,            // Harmonia - fluxo
                'Romana': 0.05,             // Disciplina militar
                'Grega': 0.08,              // Sabedoria clássica
                'Viking': -0.05,            // Fúria descontrolada
                'Eslava': 0.03              // Resistência
            },
            debugMode: true
        };

        this.priorityQueue = [];
        this.turnOrder = [];
        this.currentTurnIndex = 0;
    }

    /**
     * Calcular prioridade de um jogador
     */
    calculatePlayerPriority(player, context = {}) {
        const baseStats = player.stats || {};
        const speed = baseStats.speed || baseStats.agility || 100;
        const initiative = baseStats.initiative || Math.floor(speed * 0.7);

        // 1. Cálculo base
        let priority = (speed * this.config.baseSpeedWeight) + 
                      (initiative * this.config.initiativeWeight);

        // 2. Modificadores de status
        const statusModifier = this._calculateStatusModifier(player);
        priority += priority * statusModifier;

        // 3. Modificadores culturais
        const culturalModifier = this.config.culturalModifiers[player.culture] || 0;
        priority += priority * culturalModifier;

        // 4. Modificadores de contexto (skill sendo usada)
        if (context.skill) {
            const skillModifier = this._calculateSkillModifier(context.skill);
            priority += priority * skillModifier;
        }

        // 5. Fator aleatório
        const randomModifier = (Math.random() - 0.5) * 2 * this.config.randomFactor;
        priority += priority * randomModifier;

        // 6. Modificadores especiais
        if (context.isCounterAttack) priority *= 2.0;
        if (context.isInterrupt) priority *= 3.0;
        if (player.resources.health < player.resources.maxHealth * 0.25) {
            priority *= 1.2; // Desespero aumenta prioridade
        }

        return Math.max(1, Math.floor(priority));
    }

    /**
     * Calcular modificadores de status effects
     */
    _calculateStatusModifier(player) {
        let modifier = 0;
        
        if (player.statusEffects) {
            player.statusEffects.forEach(effect => {
                const effectModifier = this.config.statusEffectModifiers[effect.type];
                if (effectModifier) {
                    modifier += effectModifier * (effect.intensity || 1);
                }
            });
        }

        return modifier;
    }

    /**
     * Calcular modificadores de skill
     */
    _calculateSkillModifier(skill) {
        if (!skill.tags) return 0;

        let modifier = 0;
        skill.tags.forEach(tag => {
            const tagModifier = this.config.skillPriorityModifiers[tag];
            if (tagModifier) {
                modifier += tagModifier;
            }
        });

        return modifier;
    }

    /**
     * Determinar ordem de turnos para uma rodada
     */
    determineTurnOrder(players, context = {}) {
        this.turnOrder = [];
        
        // Calcular prioridade para cada jogador
        const playersWithPriority = players.map(player => ({
            player,
            priority: this.calculatePlayerPriority(player, context),
            originalIndex: players.indexOf(player)
        }));

        // Ordenar por prioridade (maior primeiro)
        playersWithPriority.sort((a, b) => b.priority - a.priority);

        // Criar ordem de turnos
        this.turnOrder = playersWithPriority.map(item => ({
            playerId: item.player.id,
            playerName: item.player.name,
            priority: item.priority,
            originalIndex: item.originalIndex
        }));

        if (this.config.debugMode) {
            console.log('🎯 Ordem de turnos determinada:');
            this.turnOrder.forEach((turn, index) => {
                console.log(`  ${index + 1}. ${turn.playerName} (Prioridade: ${turn.priority})`);
            });
        }

        this.currentTurnIndex = 0;
        return this.turnOrder;
    }

    /**
     * Obter próximo jogador na ordem de prioridade
     */
    getNextPlayer(players) {
        if (this.turnOrder.length === 0) {
            this.determineTurnOrder(players);
        }

        const currentTurn = this.turnOrder[this.currentTurnIndex];
        if (!currentTurn) {
            // Reiniciar rodada
            this.currentTurnIndex = 0;
            return this.getNextPlayer(players);
        }

        // Encontrar jogador correspondente
        const player = players.find(p => p.id === currentTurn.playerId);
        
        // Avançar índice
        this.currentTurnIndex++;
        
        if (this.config.debugMode && player) {
            console.log(`👤 Próximo jogador: ${player.name} (Prioridade: ${currentTurn.priority})`);
        }

        return player;
    }

    /**
     * Verificar se jogador pode agir fora de turno (interrupção)
     */
    canInterrupt(player, currentPlayer, context = {}) {
        if (player.id === currentPlayer.id) return false;

        const playerPriority = this.calculatePlayerPriority(player, {
            ...context,
            isInterrupt: true
        });

        const currentPlayerPriority = this.calculatePlayerPriority(currentPlayer, context);

        // Interrupção requer prioridade 50% maior
        const interruptThreshold = currentPlayerPriority * 1.5;
        
        const canInterrupt = playerPriority >= interruptThreshold;

        if (this.config.debugMode && canInterrupt) {
            console.log(`⚡ ${player.name} pode interromper ${currentPlayer.name}!`);
            console.log(`  Prioridade requerida: ${interruptThreshold}, obtida: ${playerPriority}`);
        }

        return canInterrupt;
    }

    /**
     * Processar mudança de prioridade durante combate
     */
    updatePriority(playerId, reason, modifier) {
        const turnIndex = this.turnOrder.findIndex(turn => turn.playerId === playerId);
        
        if (turnIndex !== -1) {
            const oldPriority = this.turnOrder[turnIndex].priority;
            this.turnOrder[turnIndex].priority += modifier;
            
            if (this.config.debugMode) {
                console.log(`🔄 Prioridade de ${this.turnOrder[turnIndex].playerName} alterada:`);
                console.log(`  Razão: ${reason}`);
                console.log(`  ${oldPriority} → ${this.turnOrder[turnIndex].priority} (${modifier > 0 ? '+' : ''}${modifier})`);
            }

            // Reordenar se necessário
            this._reorderTurns();
        }
    }

    /**
     * Reordenar turnos baseado nas prioridades atualizadas
     */
    _reorderTurns() {
        // Salvar posição atual
        const currentTurn = this.turnOrder[this.currentTurnIndex - 1];
        
        // Reordenar apenas turnos restantes
        const remainingTurns = this.turnOrder.slice(this.currentTurnIndex);
        remainingTurns.sort((a, b) => b.priority - a.priority);
        
        // Reconstruir ordem
        const completedTurns = this.turnOrder.slice(0, this.currentTurnIndex);
        this.turnOrder = [...completedTurns, ...remainingTurns];

        if (this.config.debugMode) {
            console.log('🔄 Ordem de turnos reordenada');
        }
    }

    /**
     * Obter estatísticas de prioridade
     */
    getPriorityStats() {
        const stats = {
            turnOrder: this.turnOrder,
            currentIndex: this.currentTurnIndex,
            averagePriority: 0,
            priorityRange: { min: Infinity, max: 0 },
            culturalDistribution: {},
            statusEffectImpacts: []
        };

        if (this.turnOrder.length > 0) {
            const priorities = this.turnOrder.map(t => t.priority);
            stats.averagePriority = priorities.reduce((sum, p) => sum + p, 0) / priorities.length;
            stats.priorityRange.min = Math.min(...priorities);
            stats.priorityRange.max = Math.max(...priorities);
        }

        return stats;
    }

    /**
     * Simular múltiplas rodadas para teste de balanceamento
     */
    simulatePriorityDistribution(players, rounds = 100) {
        const simulation = {
            totalRounds: rounds,
            playerFirstCounts: {},
            averagePriorities: {},
            priorityVariance: {}
        };

        // Inicializar contadores
        players.forEach(player => {
            simulation.playerFirstCounts[player.name] = 0;
            simulation.averagePriorities[player.name] = [];
        });

        // Simular rodadas
        for (let i = 0; i < rounds; i++) {
            const order = this.determineTurnOrder(players);
            
            // Contar quem foi primeiro
            if (order.length > 0) {
                simulation.playerFirstCounts[order[0].playerName]++;
            }

            // Coletar prioridades
            order.forEach(turn => {
                simulation.averagePriorities[turn.playerName].push(turn.priority);
            });
        }

        // Calcular médias e variância
        Object.keys(simulation.averagePriorities).forEach(playerName => {
            const priorities = simulation.averagePriorities[playerName];
            const avg = priorities.reduce((sum, p) => sum + p, 0) / priorities.length;
            const variance = priorities.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / priorities.length;
            
            simulation.averagePriorities[playerName] = avg;
            simulation.priorityVariance[playerName] = Math.sqrt(variance);
        });

        return simulation;
    }

    /**
     * Configurar sistema
     */
    setConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        if (this.config.debugMode) {
            console.log('⚙️ PrioritySystem configurado:', this.config);
        }
    }

    /**
     * Resetar sistema
     */
    reset() {
        this.priorityQueue = [];
        this.turnOrder = [];
        this.currentTurnIndex = 0;
        
        if (this.config.debugMode) {
            console.log('🔄 PrioritySystem resetado');
        }
    }

    /**
     * Integrar com TurnSystem
     */
    integrateWithTurnSystem(turnSystem) {
        // Sobrescrever método de determinação de próximo jogador
        const originalNextPlayer = turnSystem._getNextPlayer?.bind(turnSystem);
        
        turnSystem._getNextPlayer = () => {
            return this.getNextPlayer(turnSystem.players);
        };

        // Adicionar verificação de interrupção
        turnSystem.canPlayerInterrupt = (playerId, context) => {
            const player = turnSystem.players.find(p => p.id === playerId);
            const currentPlayer = turnSystem.getCurrentPlayer();
            return this.canInterrupt(player, currentPlayer, context);
        };

        // Adicionar atualização de prioridade
        turnSystem.updatePlayerPriority = (playerId, reason, modifier) => {
            this.updatePriority(playerId, reason, modifier);
        };

        if (this.config.debugMode) {
            console.log('🔗 PrioritySystem integrado com TurnSystem');
        }
    }
}