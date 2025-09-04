/**
 * RPGStack Battle Mechanics - Core Logic System
 * Versão: 4.3.0 (Modular Architecture)
 * 
 * Sistema de mecânicas de batalha separado da interface para melhor
 * organização, manutenibilidade e reutilização de código.
 */

class BattleMechanics {
    constructor() {
        this.battleState = {
            player: null,
            enemy: null,
            turn: 'player',
            round: 1,
            isActive: false,
            battleId: null
        };

        // Combat constants - balanceados para RPGStack v4.3
        this.COMBAT_CONSTANTS = {
            DAMAGE_VARIANCE: 0.4,       // ±20% damage variance
            DEFENSE_EFFICIENCY: 0.7,    // Physical defense reduces 70% of attack
            SKILL_MULTIPLIER: 1.5,      // Skills deal 1.5x attack damage
            SPECIAL_DEFENSE_EFFICIENCY: 0.5,  // Special defense efficiency vs skills
            DEFENDING_REDUCTION: 0.5,   // Defending reduces incoming damage by 50%
            MAX_CRITICAL_CHANCE: 0.3,   // Maximum 30% critical chance
            CRITICAL_BASE_CHANCE: 0.1,  // Base 10% critical multiplier
            MANA_RESTORE_MEDITATE: [15, 25], // Mana restoration range for meditation
            HEALTH_RESTORE_MEDITATE: [10, 15] // Health restoration range for meditation
        };

        // AI behavior weights for different enemy types
        this.AI_BEHAVIORS = {
            aggressive: { attack: 0.7, skill: 0.2, defend: 0.1 },
            passive: { attack: 0.3, skill: 0.3, defend: 0.4 },
            pack: { attack: 0.5, skill: 0.3, defend: 0.2 },
            ambush: { attack: 0.8, skill: 0.15, defend: 0.05 },
            guardian: { attack: 0.4, skill: 0.3, defend: 0.3 },
            caster: { attack: 0.2, skill: 0.6, defend: 0.2 },
            tank: { attack: 0.3, skill: 0.2, defend: 0.5 }
        };
    }

    /**
     * Inicializa uma nova batalha
     * @param {Object} playerCharacter - Personagem do jogador
     * @param {Object} enemyCharacter - Personagem inimigo
     * @returns {Object} Estado inicial da batalha
     */
    initializeBattle(playerCharacter, enemyCharacter) {
        this.battleState = {
            player: {
                ...playerCharacter,
                currentHP: playerCharacter.hp || playerCharacter.maxHP,
                currentMP: playerCharacter.anima || playerCharacter.mp || 50,
                defending: false,
                statusEffects: []
            },
            enemy: {
                ...enemyCharacter,
                currentHP: enemyCharacter.hp || enemyCharacter.maxHP,
                currentMP: enemyCharacter.anima || enemyCharacter.mp || 30,
                defending: false,
                statusEffects: [],
                aiType: enemyCharacter.aiType || 'aggressive'
            },
            turn: 'player',
            round: 1,
            isActive: true,
            battleId: this.generateBattleId(),
            log: [],
            winner: null
        };

        this.addToLog('system', `Batalha iniciada: ${playerCharacter.name} vs ${enemyCharacter.name}!`);
        return this.battleState;
    }

    /**
     * Processa uma ação de ataque
     * @param {string} attacker - 'player' ou 'enemy'
     * @param {string} target - 'player' ou 'enemy'
     * @param {Object} options - Opções adicionais como tipo de ataque
     * @returns {Object} Resultado do ataque
     */
    processAttack(attacker, target, options = {}) {
        if (!this.battleState.isActive) {
            throw new Error('Batalha não está ativa');
        }

        const attackerData = this.battleState[attacker];
        const targetData = this.battleState[target];
        const isSkill = options.type === 'skill';

        // Calcular dano base
        let baseDamage = this.calculateBaseDamage(attackerData, targetData, isSkill);

        // Aplicar variação aleatória
        const variance = this.COMBAT_CONSTANTS.DAMAGE_VARIANCE;
        const randomMultiplier = (1 - variance/2) + (Math.random() * variance);
        baseDamage = Math.floor(baseDamage * randomMultiplier);

        // Verificar crítico
        const criticalResult = this.calculateCritical(attackerData);
        if (criticalResult.isCritical) {
            baseDamage = Math.floor(baseDamage * criticalResult.multiplier);
        }

        // Aplicar modificadores de defesa
        if (targetData.defending) {
            baseDamage = Math.floor(baseDamage * this.COMBAT_CONSTANTS.DEFENDING_REDUCTION);
        }

        // Garantir dano mínimo
        const finalDamage = Math.max(1, baseDamage);

        // Aplicar dano
        targetData.currentHP = Math.max(0, targetData.currentHP - finalDamage);

        // Resetar estado de defesa
        attackerData.defending = false;

        // Log do ataque
        const attackType = isSkill ? 'skill' : 'attack';
        const criticalText = criticalResult.isCritical ? ' CRÍTICO!' : '';
        this.addToLog(attackType, 
            `${attackerData.name} causa ${finalDamage} de dano${criticalText} em ${targetData.name}`);

        // Verificar se o alvo foi derrotado
        if (targetData.currentHP <= 0) {
            this.endBattle(attacker);
        }

        return {
            damage: finalDamage,
            isCritical: criticalResult.isCritical,
            targetDefeated: targetData.currentHP <= 0,
            battleState: this.battleState
        };
    }

    /**
     * Calcula o dano base considerando atributos e tipo de ataque
     * @param {Object} attacker - Dados do atacante
     * @param {Object} target - Dados do alvo
     * @param {boolean} isSkill - Se é um ataque de skill
     * @returns {number} Dano base calculado
     */
    calculateBaseDamage(attacker, target, isSkill = false) {
        let baseDamage;

        if (isSkill) {
            // Skill damage: attack * multiplier - special defense
            baseDamage = Math.floor(attacker.attack * this.COMBAT_CONSTANTS.SKILL_MULTIPLIER) - 
                        Math.floor((target.defesa_especial || target.defense) * this.COMBAT_CONSTANTS.SPECIAL_DEFENSE_EFFICIENCY);
        } else {
            // Physical damage: attack - defense
            baseDamage = attacker.attack - 
                        Math.floor(target.defense * this.COMBAT_CONSTANTS.DEFENSE_EFFICIENCY);
        }

        return Math.max(1, baseDamage);
    }

    /**
     * Calcula se um ataque é crítico
     * @param {Object} attacker - Dados do atacante
     * @returns {Object} Resultado do cálculo crítico
     */
    calculateCritical(attacker) {
        const criticalChance = Math.min(
            this.COMBAT_CONSTANTS.MAX_CRITICAL_CHANCE, 
            (attacker.critico || 2.0) * this.COMBAT_CONSTANTS.CRITICAL_BASE_CHANCE
        );
        
        const isCritical = Math.random() < criticalChance;

        return {
            isCritical,
            multiplier: isCritical ? (attacker.critico || 2.0) : 1.0,
            chance: criticalChance
        };
    }

    /**
     * Processa ação de defesa
     * @param {string} character - 'player' ou 'enemy'
     * @returns {Object} Resultado da defesa
     */
    processDefend(character) {
        if (!this.battleState.isActive) {
            throw new Error('Batalha não está ativa');
        }

        const characterData = this.battleState[character];
        characterData.defending = true;

        this.addToLog('defend', `${characterData.name} assume posição defensiva`);

        return {
            success: true,
            battleState: this.battleState
        };
    }

    /**
     * Processa ação de meditação (recuperação de mana/vida)
     * @param {string} character - 'player' ou 'enemy'
     * @returns {Object} Resultado da meditação
     */
    processMeditate(character) {
        if (!this.battleState.isActive) {
            throw new Error('Batalha não está ativa');
        }

        const characterData = this.battleState[character];
        
        // Restaurar mana
        const manaRestore = this.generateRandomValue(
            this.COMBAT_CONSTANTS.MANA_RESTORE_MEDITATE[0],
            this.COMBAT_CONSTANTS.MANA_RESTORE_MEDITATE[1]
        );
        const maxMP = characterData.maxMP || characterData.anima || 50;
        characterData.currentMP = Math.min(maxMP, characterData.currentMP + manaRestore);

        // Pequena chance de restaurar vida
        let healthRestore = 0;
        if (Math.random() < 0.3) { // 30% chance
            healthRestore = this.generateRandomValue(
                this.COMBAT_CONSTANTS.HEALTH_RESTORE_MEDITATE[0],
                this.COMBAT_CONSTANTS.HEALTH_RESTORE_MEDITATE[1]
            );
            const maxHP = characterData.maxHP || characterData.hp;
            characterData.currentHP = Math.min(maxHP, characterData.currentHP + healthRestore);
        }

        // Resetar defesa
        characterData.defending = false;

        this.addToLog('heal', 
            `${characterData.name} medita e recupera ${manaRestore} de ânima` + 
            (healthRestore > 0 ? ` e ${healthRestore} de vida` : ''));

        return {
            manaRestored: manaRestore,
            healthRestored: healthRestore,
            battleState: this.battleState
        };
    }

    /**
     * Processa uso de skill
     * @param {string} character - 'player' ou 'enemy'
     * @param {Object} skill - Dados da skill
     * @returns {Object} Resultado da skill
     */
    processSkill(character, skill) {
        if (!this.battleState.isActive) {
            throw new Error('Batalha não está ativa');
        }

        const characterData = this.battleState[character];
        const target = character === 'player' ? 'enemy' : 'player';

        // Verificar se tem mana suficiente
        const skillCost = skill.skillMana || skill.cost || 0;
        if (characterData.currentMP < skillCost) {
            throw new Error('Mana insuficiente para usar a skill');
        }

        // Consumir mana
        characterData.currentMP -= skillCost;

        // Processar efeito da skill como ataque especial
        const result = this.processAttack(character, target, { type: 'skill' });

        this.addToLog('skill', 
            `${characterData.name} usa ${skill.skillName || skill.name} (${skillCost} ânima)`);

        return {
            ...result,
            manaCost: skillCost,
            skillName: skill.skillName || skill.name
        };
    }

    /**
     * Processa ação da IA inimiga
     * @returns {Object} Resultado da ação da IA
     */
    processEnemyAction() {
        if (!this.battleState.isActive || this.battleState.turn !== 'enemy') {
            throw new Error('Não é o turno do inimigo');
        }

        const enemy = this.battleState.enemy;
        const player = this.battleState.player;

        // Calcular pesos das ações baseados na IA e situação atual
        const aiType = enemy.aiType || 'aggressive';
        let actionWeights = { ...this.AI_BEHAVIORS[aiType] };

        // Ajustes dinâmicos baseados na situação
        const enemyHPPercentage = enemy.currentHP / (enemy.maxHP || enemy.hp);
        const playerHPPercentage = player.currentHP / (player.maxHP || player.hp);

        // Inimigo com vida baixa fica mais defensivo
        if (enemyHPPercentage < 0.3) {
            actionWeights.defend += 0.2;
            actionWeights.skill += 0.1;
            actionWeights.attack -= 0.3;
        }

        // Jogador com vida baixa deixa inimigo mais agressivo
        if (playerHPPercentage < 0.5) {
            actionWeights.attack += 0.2;
            actionWeights.skill += 0.1;
            actionWeights.defend -= 0.3;
        }

        // Selecionar ação baseada nos pesos
        const selectedAction = this.selectWeightedAction(actionWeights);

        let result;
        switch (selectedAction) {
            case 'attack':
                result = this.processAttack('enemy', 'player');
                break;
            case 'defend':
                result = this.processDefend('enemy');
                break;
            case 'skill':
                // Simular skill inimiga
                const enemySkill = {
                    skillName: 'Ataque Sombrio',
                    skillMana: 10,
                    damage: [15, 25]
                };
                if (enemy.currentMP >= 10) {
                    result = this.processSkill('enemy', enemySkill);
                } else {
                    // Fallback para ataque normal se não tem mana
                    result = this.processAttack('enemy', 'player');
                }
                break;
            default:
                result = this.processAttack('enemy', 'player');
        }

        return result;
    }

    /**
     * Seleciona uma ação baseada em pesos probabilísticos
     * @param {Object} weights - Pesos das ações
     * @returns {string} Ação selecionada
     */
    selectWeightedAction(weights) {
        const random = Math.random();
        let cumulative = 0;

        for (const [action, weight] of Object.entries(weights)) {
            cumulative += weight;
            if (random <= cumulative) {
                return action;
            }
        }

        return 'attack'; // Fallback
    }

    /**
     * Avança o turno da batalha
     * @returns {Object} Novo estado da batalha
     */
    nextTurn() {
        if (!this.battleState.isActive) {
            throw new Error('Batalha não está ativa');
        }

        if (this.battleState.turn === 'player') {
            this.battleState.turn = 'enemy';
        } else {
            this.battleState.turn = 'player';
            this.battleState.round++;
        }

        this.addToLog('system', `Turno ${this.battleState.round} - ${this.battleState.turn === 'player' ? 'Jogador' : 'Inimigo'}`);

        return this.battleState;
    }

    /**
     * Finaliza a batalha
     * @param {string} winner - 'player' ou 'enemy'
     * @returns {Object} Estado final da batalha
     */
    endBattle(winner) {
        this.battleState.isActive = false;
        this.battleState.winner = winner;

        const winnerName = this.battleState[winner].name;
        this.addToLog('system', `${winnerName} venceu a batalha!`);

        return this.battleState;
    }

    /**
     * Adiciona entrada ao log da batalha
     * @param {string} type - Tipo da entrada (attack, heal, system, etc.)
     * @param {string} message - Mensagem do log
     */
    addToLog(type, message) {
        this.battleState.log.push({
            type,
            message,
            timestamp: Date.now(),
            round: this.battleState.round
        });
    }

    /**
     * Gera um valor aleatório entre min e max (inclusivo)
     * @param {number} min - Valor mínimo
     * @param {number} max - Valor máximo
     * @returns {number} Valor gerado
     */
    generateRandomValue(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Gera ID único para a batalha
     * @returns {string} ID da batalha
     */
    generateBattleId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Retorna o estado atual da batalha
     * @returns {Object} Estado da batalha
     */
    getBattleState() {
        return { ...this.battleState };
    }

    /**
     * Verifica se a batalha está ativa
     * @returns {boolean} Se a batalha está ativa
     */
    isBattleActive() {
        return this.battleState.isActive;
    }

    /**
     * Calcula experiência ganha baseada no resultado da batalha
     * @param {string} result - 'victory' ou 'defeat'
     * @returns {number} Experiência ganha
     */
    calculateExperience(result) {
        if (result === 'victory') {
            return this.generateRandomValue(50, 100);
        } else {
            return this.generateRandomValue(10, 30);
        }
    }

    /**
     * Aplica dano de status effects (poison, burn, etc.)
     * @param {string} character - 'player' ou 'enemy'
     * @returns {Object} Resultado dos efeitos de status
     */
    processStatusEffects(character) {
        const characterData = this.battleState[character];
        let totalDamage = 0;
        let effectsRemoved = [];

        characterData.statusEffects.forEach((effect, index) => {
            switch (effect.type) {
                case 'poison':
                    const poisonDamage = Math.floor(characterData.maxHP * 0.1);
                    characterData.currentHP = Math.max(0, characterData.currentHP - poisonDamage);
                    totalDamage += poisonDamage;
                    this.addToLog('damage', `${characterData.name} sofre ${poisonDamage} de dano por envenenamento`);
                    break;
                case 'burn':
                    const burnDamage = Math.floor(characterData.maxHP * 0.08);
                    characterData.currentHP = Math.max(0, characterData.currentHP - burnDamage);
                    totalDamage += burnDamage;
                    this.addToLog('damage', `${characterData.name} sofre ${burnDamage} de dano por queimadura`);
                    break;
            }

            // Reduzir duração do efeito
            effect.duration--;
            if (effect.duration <= 0) {
                effectsRemoved.push(index);
                this.addToLog('system', `${effect.type} em ${characterData.name} terminou`);
            }
        });

        // Remover efeitos expirados
        effectsRemoved.reverse().forEach(index => {
            characterData.statusEffects.splice(index, 1);
        });

        return {
            totalDamage,
            effectsRemoved: effectsRemoved.length,
            characterDefeated: characterData.currentHP <= 0
        };
    }
}

// Export for Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BattleMechanics;
} else {
    window.BattleMechanics = BattleMechanics;
}