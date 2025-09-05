/**
 * Sistema de Ânima e Cooldown - RPGStack Battle System
 * Implementa custos de Ânima e cooldowns baseados em rpg-damage-formula.md
 * Integrado com TurnSystem e anti-cheat
 */

export class AnimaCooldownSystem {
    constructor() {
        this.config = {
            // Configurações de Ânima
            maxAnima: 100,
            animaRegenPerTurn: 5,
            animaRegenDelay: 1, // Turnos para começar regeneração
            
            // Custos por tipo de skill
            skillCosts: {
                basic: 0,
                single: 15,
                double: 20,
                aoe: 30,
                special: 40
            },
            
            // Cooldowns por tipo de skill  
            skillCooldowns: {
                basic: 0,
                single: 1,
                double: 2,
                aoe: 3,
                special: 5
            },
            
            // Sistema de emergência
            emergencyAnimaRestore: 0.1, // 10% ao atingir 0
            criticalHealthBonus: 0.2    // 20% de regeneração com HP < 30%
        };
        
        // Estado de battles ativas
        this.battleStates = new Map();
        
        console.log('✅ AnimaCooldownSystem inicializado');
    }

    /**
     * Inicializar estado de Ânima para uma batalha
     */
    initializeBattle(battleId, players) {
        const battleState = {
            players: new Map(),
            turn: 0,
            lastAnimaUpdate: new Date()
        };
        
        // Inicializar estado de cada jogador
        players.forEach(player => {
            battleState.players.set(player.id, {
                currentAnima: this.config.maxAnima,
                maxAnima: this.config.maxAnima,
                cooldowns: new Map(), // skillId -> turnsRemaining
                lastAnimaUse: 0,
                animaRegenBlocked: 0, // Turnos bloqueados
                emergencyUsed: false,
                skillsUsedThisTurn: new Set(),
                totalAnimaSpent: 0,
                totalSkillsUsed: 0
            });
        });
        
        this.battleStates.set(battleId, battleState);
        console.log(`🎯 Batalha ${battleId}: Sistema de Ânima inicializado para ${players.length} jogadores`);
        
        return battleState;
    }

    /**
     * Verificar se jogador pode usar skill
     */
    canUseSkill(battleId, playerId, skill) {
        const battleState = this.battleStates.get(battleId);
        if (!battleState) {
            throw new Error(`Batalha ${battleId} não encontrada`);
        }
        
        const playerState = battleState.players.get(playerId);
        if (!playerState) {
            throw new Error(`Jogador ${playerId} não encontrado na batalha`);
        }
        
        const skillCost = this._getSkillCost(skill);
        const cooldownRemaining = this._getSkillCooldown(playerState, skill.id);
        
        const checks = {
            hasAnima: playerState.currentAnima >= skillCost,
            noCooldown: cooldownRemaining === 0,
            skillCost: skillCost,
            currentAnima: playerState.currentAnima,
            cooldownRemaining: cooldownRemaining
        };
        
        const canUse = checks.hasAnima && checks.noCooldown;
        
        if (this.config.debugMode) {
            console.log(`🔍 [Ânima Check] ${playerId} -> ${skill.name}:`);
            console.log(`   💙 Ânima: ${checks.currentAnima}/${this.config.maxAnima} (Custo: ${skillCost})`);
            console.log(`   ⏱️ Cooldown: ${cooldownRemaining} turnos`);
            console.log(`   ✅ Pode usar: ${canUse}`);
        }
        
        return {
            canUse,
            ...checks
        };
    }

    /**
     * Usar skill e aplicar custos/cooldowns
     */
    useSkill(battleId, playerId, skill) {
        const check = this.canUseSkill(battleId, playerId, skill);
        
        if (!check.canUse) {
            throw new Error(`Jogador ${playerId} não pode usar skill ${skill.name}: ${
                !check.hasAnima ? 'Ânima insuficiente' : 'Skill em cooldown'
            }`);
        }
        
        const battleState = this.battleStates.get(battleId);
        const playerState = battleState.players.get(playerId);
        
        const skillCost = this._getSkillCost(skill);
        const cooldownTurns = this._getSkillCooldownBase(skill);
        
        // Aplicar custos
        playerState.currentAnima -= skillCost;
        playerState.totalAnimaSpent += skillCost;
        playerState.totalSkillsUsed += 1;
        
        // Aplicar cooldown
        if (cooldownTurns > 0) {
            playerState.cooldowns.set(skill.id, cooldownTurns);
        }
        
        // Marcar skill usada neste turno
        playerState.skillsUsedThisTurn.add(skill.id);
        playerState.lastAnimaUse = battleState.turn;
        
        console.log(`⚡ [Skill Usada] ${playerId} -> ${skill.name}`);
        console.log(`   💙 Ânima: ${playerState.currentAnima}/${this.config.maxAnima} (-${skillCost})`);
        console.log(`   ⏱️ Cooldown: ${cooldownTurns} turnos aplicados`);
        
        return {
            success: true,
            newAnima: playerState.currentAnima,
            animaCost: skillCost,
            cooldownApplied: cooldownTurns
        };
    }

    /**
     * Processar regeneração de Ânima (executado a cada turno)
     */
    processAnimaRegeneration(battleId) {
        const battleState = this.battleStates.get(battleId);
        if (!battleState) return;
        
        battleState.players.forEach((playerState, playerId) => {
            // Limpar skills usadas no turno anterior
            playerState.skillsUsedThisTurn.clear();
            
            // Decrementar cooldowns
            const expiredCooldowns = [];
            playerState.cooldowns.forEach((turnsRemaining, skillId) => {
                const newTurns = turnsRemaining - 1;
                if (newTurns <= 0) {
                    expiredCooldowns.push(skillId);
                } else {
                    playerState.cooldowns.set(skillId, newTurns);
                }
            });
            
            // Remover cooldowns expirados
            expiredCooldowns.forEach(skillId => {
                playerState.cooldowns.delete(skillId);
                console.log(`🔓 [Cooldown] Skill ${skillId} disponível para ${playerId}`);
            });
            
            // Regenerar Ânima
            this._processPlayerAnimaRegen(battleState, playerId, playerState);
        });
        
        battleState.turn += 1;
    }

    /**
     * Processar regeneração individual de Ânima
     */
    _processPlayerAnimaRegen(battleState, playerId, playerState) {
        // Verificar se regeneração está bloqueada
        if (playerState.animaRegenBlocked > 0) {
            playerState.animaRegenBlocked -= 1;
            console.log(`🚫 [Regeneração] ${playerId} bloqueado por ${playerState.animaRegenBlocked} turnos`);
            return;
        }
        
        // Calcular regeneração base
        let regenAmount = this.config.animaRegenPerTurn;
        
        // Bônus por HP baixo (assumindo que HP será checado externamente)
        // Este será integrado com o sistema de batalha principal
        // if (playerHP < 30% of maxHP) regenAmount *= (1 + this.config.criticalHealthBonus);
        
        // Aplicar regeneração
        const oldAnima = playerState.currentAnima;
        playerState.currentAnima = Math.min(
            playerState.maxAnima, 
            playerState.currentAnima + regenAmount
        );
        
        const actualRegen = playerState.currentAnima - oldAnima;
        
        if (actualRegen > 0) {
            console.log(`💙 [Regeneração] ${playerId}: +${actualRegen} Ânima (${playerState.currentAnima}/${playerState.maxAnima})`);
        }
        
        // Sistema de emergência - restaurar Ânima crítica
        if (playerState.currentAnima === 0 && !playerState.emergencyUsed) {
            const emergencyRestore = Math.floor(this.config.maxAnima * this.config.emergencyAnimaRestore);
            playerState.currentAnima = emergencyRestore;
            playerState.emergencyUsed = true;
            console.log(`🆘 [Emergência] ${playerId}: +${emergencyRestore} Ânima de emergência`);
        }
    }

    /**
     * Obter custo de Ânima de uma skill
     */
    _getSkillCost(skill) {
        // Custo específico da skill tem prioridade
        if (skill.animaCost !== undefined) {
            return skill.animaCost;
        }
        
        // Determinar categoria baseada nos atributos da skill
        if (skill.aoe) {
            return this.config.skillCosts.aoe;
        } else if (skill.targets && skill.targets > 1) {
            return this.config.skillCosts.double;
        } else if (skill.category === 'special' || skill.multiplier > 2.5) {
            return this.config.skillCosts.special;
        } else if (skill.category === 'basic' || skill.multiplier <= 1.2) {
            return this.config.skillCosts.basic;
        } else {
            return this.config.skillCosts.single;
        }
    }

    /**
     * Obter cooldown base de uma skill
     */
    _getSkillCooldownBase(skill) {
        // Cooldown específico da skill tem prioridade
        if (skill.cooldown !== undefined) {
            return skill.cooldown;
        }
        
        // Determinar categoria baseada nos atributos da skill
        if (skill.aoe) {
            return this.config.skillCooldowns.aoe;
        } else if (skill.targets && skill.targets > 1) {
            return this.config.skillCooldowns.double;
        } else if (skill.category === 'special' || skill.multiplier > 2.5) {
            return this.config.skillCooldowns.special;
        } else if (skill.category === 'basic' || skill.multiplier <= 1.2) {
            return this.config.skillCooldowns.basic;
        } else {
            return this.config.skillCooldowns.single;
        }
    }

    /**
     * Obter cooldown restante de uma skill para um jogador
     */
    _getSkillCooldown(playerState, skillId) {
        return playerState.cooldowns.get(skillId) || 0;
    }

    /**
     * Obter estado atual de um jogador
     */
    getPlayerState(battleId, playerId) {
        const battleState = this.battleStates.get(battleId);
        if (!battleState) return null;
        
        const playerState = battleState.players.get(playerId);
        if (!playerState) return null;
        
        const activeCooldowns = {};
        playerState.cooldowns.forEach((turns, skillId) => {
            activeCooldowns[skillId] = turns;
        });
        
        return {
            currentAnima: playerState.currentAnima,
            maxAnima: playerState.maxAnima,
            animaPercentage: Math.round((playerState.currentAnima / playerState.maxAnima) * 100),
            activeCooldowns,
            totalSkillsUsed: playerState.totalSkillsUsed,
            totalAnimaSpent: playerState.totalAnimaSpent,
            emergencyUsed: playerState.emergencyUsed,
            animaRegenBlocked: playerState.animaRegenBlocked
        };
    }

    /**
     * Obter estado completo da batalha
     */
    getBattleState(battleId) {
        const battleState = this.battleStates.get(battleId);
        if (!battleState) return null;
        
        const playersState = {};
        battleState.players.forEach((playerState, playerId) => {
            playersState[playerId] = this.getPlayerState(battleId, playerId);
        });
        
        return {
            turn: battleState.turn,
            players: playersState,
            lastUpdate: battleState.lastAnimaUpdate
        };
    }

    /**
     * Limpar dados de uma batalha finalizada
     */
    cleanupBattle(battleId) {
        const deleted = this.battleStates.delete(battleId);
        if (deleted) {
            console.log(`🧹 Sistema de Ânima: Batalha ${battleId} removida`);
        }
        return deleted;
    }

    /**
     * Configurar sistema
     */
    setConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('⚙️ AnimaCooldownSystem configurado:', newConfig);
    }
}