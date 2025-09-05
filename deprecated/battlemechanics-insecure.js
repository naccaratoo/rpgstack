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
            battleId: null,
            currentPhase: 'action_selection', // action_selection, priority_resolution, turn_end
            pendingActions: [],  // Ações aguardando processamento
            priorityQueue: []    // Queue ordenada por prioridade
        };

        // Combat constants - balanceados para RPGStack v4.4
        this.COMBAT_CONSTANTS = {
            DAMAGE_VARIANCE: 0.4,       // ±20% damage variance
            DEFENSE_EFFICIENCY: 0.7,    // Physical defense reduces 70% of attack
            SKILL_MULTIPLIER: 1.5,      // Skills deal 1.5x attack damage
            SPECIAL_DEFENSE_EFFICIENCY: 0.5,  // Special defense efficiency vs skills
            DEFENDING_REDUCTION: 0.5,   // Defending reduces incoming damage by 50%
            MAX_CRITICAL_CHANCE: 0.3,   // Maximum 30% critical chance
            CRITICAL_BASE_CHANCE: 0.1,  // Base 10% critical multiplier
            MANA_RESTORE_MEDITATE: [15, 25], // Mana restoration range for meditation
            HEALTH_RESTORE_MEDITATE: [10, 15], // Health restoration range for meditation
            TURN_TIME_LIMIT: 20000,     // 20 segundos por turno
            MAX_SWAPS_PER_TURN: 1       // Máximo de 1 troca por turno
        };

        // Tipos de ação permitidos
        this.ACTION_TYPES = {
            ATTACK: 'attack',
            DEFEND: 'defend', 
            MEDITATE: 'meditate',
            SKILL: 'skill',
            SWAP: 'swap'  // Não consome ação, mas limitado por turno
        };

        // Sistema de Prioridade - 5 níveis de -2 a +2
        this.PRIORITY_LEVELS = {
            VERY_HIGH: 2,    // Ações de emergência, intervenções críticas
            HIGH: 1,         // Ataques rápidos, ações de reação, movimentos evasivos
            NORMAL: 0,       // Ações padrão de combate, movimentação normal, habilidades básicas
            LOW: -1,         // Ações de preparação, concentração, requer foco
            VERY_LOW: -2     // Alterações de campo, ações de grande escala
        };

        // Configurações de prioridade por tipo de ação
        this.ACTION_PRIORITIES = {
            attack: this.PRIORITY_LEVELS.NORMAL,
            defend: this.PRIORITY_LEVELS.HIGH,      // Defesa tem prioridade alta
            skill: this.PRIORITY_LEVELS.NORMAL,     // Skills normais têm prioridade normal
            meditate: this.PRIORITY_LEVELS.LOW,     // Meditação tem prioridade baixa
            quick_attack: this.PRIORITY_LEVELS.HIGH, // Ataques rápidos
            emergency_heal: this.PRIORITY_LEVELS.VERY_HIGH, // Cura de emergência
            field_change: this.PRIORITY_LEVELS.VERY_LOW,    // Mudanças de campo
            preparation: this.PRIORITY_LEVELS.LOW           // Ações de preparação
        };

        // Queue de ações para processamento baseado em prioridade
        this.actionQueue = [];

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
                statusEffects: [],
                swapsUsed: 0  // Contador de trocas usadas no turno
            },
            enemy: {
                ...enemyCharacter,
                currentHP: enemyCharacter.hp || enemyCharacter.maxHP,
                currentMP: enemyCharacter.anima || enemyCharacter.mp || 30,
                defending: false,
                statusEffects: [],
                aiType: enemyCharacter.aiType || 'aggressive',
                swapsUsed: 0  // Contador de trocas usadas no turno
            },
            turn: 'player',
            round: 1,
            isActive: true,
            battleId: this.generateBattleId(),
            log: [],
            winner: null,
            // Sistema de Turnos
            turnTimer: null,           // Timer do turno atual
            turnTimeLimit: 20000,      // 20 segundos por turno
            turnStartTime: null,       // Quando o turno começou
            turnPhase: 'action_select', // action_select, action_declared, processing
            actionDeclared: null,      // Ação declarada pelo jogador
            autoActionOnTimeout: 'attack' // Ação padrão se o tempo esgotar
        };

        this.addToLog('system', `Batalha iniciada: ${playerCharacter.name} vs ${enemyCharacter.name}!`);
        return this.battleState;
    }

    /**
     * Valida a seleção de uma equipe para batalhas 3v3
     * @param {Array} team - Array de personagens da equipe
     * @param {string} teamType - Tipo da equipe ('jogador' ou 'inimigo')
     * @throws {Error} Se a equipe não atender aos critérios de validação
     */
    validateTeamSelection(team, teamType = 'equipe') {
        // Validação básica de estrutura
        if (!Array.isArray(team)) {
            throw new Error(`${teamType} deve ser um array de personagens`);
        }
        
        if (team.length !== 3) {
            throw new Error(`${teamType} deve ter exatamente 3 personagens (atual: ${team.length})`);
        }
        
        // Validação de personagens individuais
        team.forEach((char, index) => {
            this.validateCharacterForTeam(char, index, teamType);
        });
        
        // Validações específicas da equipe
        this.validateTeamComposition(team, teamType);
        this.validateTeamBalance(team, teamType);
        
        return true;
    }

    /**
     * Valida um personagem individual para inclusão em equipe
     * @param {Object} character - Dados do personagem
     * @param {number} index - Posição na equipe (0-2)
     * @param {string} teamType - Tipo da equipe
     */
    validateCharacterForTeam(character, index, teamType) {
        if (!character || typeof character !== 'object') {
            throw new Error(`${teamType} posição ${index + 1}: Personagem inválido`);
        }
        
        // Campos obrigatórios
        const requiredFields = ['name', 'hp', 'attack'];
        requiredFields.forEach(field => {
            if (character[field] === undefined || character[field] === null) {
                throw new Error(`${teamType} posição ${index + 1}: Campo '${field}' é obrigatório`);
            }
        });
        
        // Validação de atributos numéricos
        const numericFields = {
            hp: { min: 1, max: 9999, name: 'HP' },
            maxHp: { min: 1, max: 9999, name: 'HP Máximo' },
            attack: { min: 1, max: 999, name: 'Ataque' },
            defense: { min: 0, max: 999, name: 'Defesa' },
            specialAttack: { min: 0, max: 999, name: 'Ataque Especial' },
            spirit: { min: 0, max: 999, name: 'Espírito' },
            anima: { min: 0, max: 999, name: 'Anima' },
            mp: { min: 0, max: 999, name: 'MP' }
        };
        
        Object.entries(numericFields).forEach(([field, limits]) => {
            if (character[field] !== undefined) {
                const value = Number(character[field]);
                if (isNaN(value) || value < limits.min || value > limits.max) {
                    throw new Error(
                        `${teamType} posição ${index + 1}: ${limits.name} deve estar entre ${limits.min} e ${limits.max} (atual: ${character[field]})`
                    );
                }
            }
        });
        
        // Validação de nome
        if (typeof character.name !== 'string' || character.name.trim().length < 2) {
            throw new Error(`${teamType} posição ${index + 1}: Nome deve ter pelo menos 2 caracteres`);
        }
        
        if (character.name.trim().length > 50) {
            throw new Error(`${teamType} posição ${index + 1}: Nome não pode exceder 50 caracteres`);
        }
        
        // Validação de HP atual vs HP máximo
        const currentHp = character.hp || character.maxHp || 100;
        const maxHp = character.maxHp || character.hp || 100;
        if (currentHp > maxHp) {
            throw new Error(`${teamType} posição ${index + 1}: HP atual (${currentHp}) não pode exceder HP máximo (${maxHp})`);
        }
        
        // Personagens desmaiados só são válidos se explicitamente permitido
        if (currentHp <= 0) {
            console.warn(`⚠️ ${teamType} posição ${index + 1}: Personagem ${character.name} está desmaiado`);
        }
    }

    /**
     * Valida a composição geral da equipe
     * @param {Array} team - Equipe a ser validada
     * @param {string} teamType - Tipo da equipe
     */
    validateTeamComposition(team, teamType) {
        // Validação de nomes únicos
        const names = team.map(char => char.name.trim().toLowerCase());
        const uniqueNames = new Set(names);
        if (uniqueNames.size !== names.length) {
            const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
            throw new Error(`${teamType}: Personagens com nomes duplicados não são permitidos: ${[...new Set(duplicates)].join(', ')}`);
        }
        
        // Validação de IDs únicos (se presentes)
        const ids = team.filter(char => char.id).map(char => char.id);
        if (ids.length > 0) {
            const uniqueIds = new Set(ids);
            if (uniqueIds.size !== ids.length) {
                throw new Error(`${teamType}: IDs de personagens duplicados detectados`);
            }
        }
        
        // Verificação de pelo menos um personagem ativo
        const activeCharacters = team.filter(char => (char.hp || char.maxHp || 100) > 0);
        if (activeCharacters.length === 0) {
            throw new Error(`${teamType}: Pelo menos um personagem deve estar ativo (HP > 0)`);
        }
        
        if (activeCharacters.length < 2) {
            console.warn(`⚠️ ${teamType}: Apenas ${activeCharacters.length} personagem(ns) ativo(s). Batalha pode ser muito difícil.`);
        }
    }

    /**
     * Valida o balanceamento da equipe (opcional, apenas avisos)
     * @param {Array} team - Equipe a ser validada
     * @param {string} teamType - Tipo da equipe
     */
    validateTeamBalance(team, teamType) {
        const totalAttack = team.reduce((sum, char) => sum + (char.attack || 0), 0);
        const totalDefense = team.reduce((sum, char) => sum + (char.defense || 0), 0);
        const totalHp = team.reduce((sum, char) => sum + (char.hp || char.maxHp || 100), 0);
        
        // Avisos de balanceamento (não bloqueiam a batalha)
        if (totalAttack < 150) {
            console.warn(`⚠️ ${teamType}: Ataque total baixo (${totalAttack}). Considere personagens mais ofensivos.`);
        }
        
        if (totalDefense < 90) {
            console.warn(`⚠️ ${teamType}: Defesa total baixa (${totalDefense}). Equipe pode ser frágil.`);
        }
        
        if (totalHp < 300) {
            console.warn(`⚠️ ${teamType}: HP total baixo (${totalHp}). Batalha pode ser muito rápida.`);
        }
        
        // Verificar diversidade de classes (se disponível)
        const classes = team.filter(char => char.classe || char.class).map(char => char.classe || char.class);
        if (classes.length > 0) {
            const uniqueClasses = new Set(classes);
            if (uniqueClasses.size === 1) {
                console.warn(`⚠️ ${teamType}: Todas as classes são iguais (${classes[0]}). Considere diversificar.`);
            }
        }
        
        return {
            totalAttack,
            totalDefense,
            totalHp,
            averageAttack: Math.round(totalAttack / 3),
            averageDefense: Math.round(totalDefense / 3),
            averageHp: Math.round(totalHp / 3)
        };
    }

    /**
     * Configura callbacks para eventos de timeout
     * @param {Function} onTimeoutCallback - Função chamada quando o tempo esgotar
     * @param {Function} onWarningCallback - Função chamada quando restarem poucos segundos
     */
    setTimeoutCallbacks(onTimeoutCallback, onWarningCallback = null) {
        this.onTimeoutCallback = onTimeoutCallback;
        this.onTimeoutWarningCallback = onWarningCallback;
        
        if (onWarningCallback && this.battleState.turnTimer) {
            // Configurar aviso de timeout (5 segundos antes)
            const warningTime = this.COMBAT_CONSTANTS.TURN_TIME_LIMIT - 5000;
            setTimeout(() => {
                if (this.onTimeoutWarningCallback && this.battleState.turnPhase === 'action_select') {
                    this.onTimeoutWarningCallback({
                        player: this.battleState.turn,
                        timeRemaining: 5000
                    });
                }
            }, warningTime);
        }
    }

    /**
     * Configura o comportamento de timeout para diferentes tipos de batalha
     * @param {Object} config - Configurações de timeout
     */
    configureTimeout(config = {}) {
        const defaultConfig = {
            timeLimit: this.COMBAT_CONSTANTS.TURN_TIME_LIMIT,
            autoAction: 'attack',
            warningTime: 5000,
            enableWarnings: true
        };
        
        const settings = { ...defaultConfig, ...config };
        
        // Aplicar configurações
        this.COMBAT_CONSTANTS.TURN_TIME_LIMIT = settings.timeLimit;
        this.battleState.autoActionOnTimeout = settings.autoAction;
        this.battleState.timeoutWarningTime = settings.warningTime;
        this.battleState.timeoutWarningsEnabled = settings.enableWarnings;
        
        return settings;
    }

    /**
     * Obtém estatísticas de timeout da batalha atual
     * @returns {Object} Estatísticas de tempo
     */
    getTimeoutStats() {
        return {
            timeLimit: this.COMBAT_CONSTANTS.TURN_TIME_LIMIT,
            currentTimeRemaining: this.battleState.timeRemaining || 0,
            timeElapsed: this.COMBAT_CONSTANTS.TURN_TIME_LIMIT - (this.battleState.timeRemaining || 0),
            currentPlayer: this.battleState.turn,
            autoAction: this.battleState.autoActionOnTimeout || 'attack',
            timeoutCount: this.battleState.timeoutCount || 0,
            averageTurnTime: this.calculateAverageTurnTime()
        };
    }

    /**
     * Calcula o tempo médio de turno
     * @returns {number} Tempo médio em milissegundos
     */
    calculateAverageTurnTime() {
        if (!this.battleState.turnTimes || this.battleState.turnTimes.length === 0) {
            return 0;
        }
        
        const total = this.battleState.turnTimes.reduce((sum, time) => sum + time, 0);
        return Math.round(total / this.battleState.turnTimes.length);
    }

    /**
     * Valida se uma equipe pode ser usada para swaps durante a batalha
     * @param {Array} team - Equipe atual
     * @returns {Object} Status de validação e personagens disponíveis
     */
    validateTeamForSwap(team) {
        if (!team || !Array.isArray(team.characters)) {
            return { valid: false, error: 'Estrutura de equipe inválida' };
        }
        
        const aliveCharacters = team.characters.filter(char => char.hp > 0);
        const activeChar = team.characters[team.activeIndex];
        
        if (aliveCharacters.length <= 1) {
            return { 
                valid: false, 
                error: 'Apenas 1 personagem vivo. Swaps não disponíveis.',
                aliveCount: aliveCharacters.length 
            };
        }
        
        return {
            valid: true,
            aliveCount: aliveCharacters.length,
            activeCharacter: activeChar,
            availableForSwap: team.characters.filter((char, index) => 
                char.hp > 0 && index !== team.activeIndex
            )
        };
    }

    /**
     * Inicializa uma batalha 3v3 com equipes completas
     * @param {Array} playerTeam - Array com 3 personagens do jogador
     * @param {Array} enemyTeam - Array com 3 personagens inimigos
     * @returns {Object} Estado inicial da batalha 3v3
     */
    initialize3v3Battle(playerTeam, enemyTeam) {
        // Validar equipes usando sistema robusto de validação
        this.validateTeamSelection(playerTeam, 'jogador');
        this.validateTeamSelection(enemyTeam, 'inimigo');
        
        // Processar e normalizar personagens
        const normalizeCharacter = (char, index) => ({
            ...char,
            index: index,
            currentHP: char.hp || char.maxHP || 100,
            currentMP: char.anima || char.mp || 50,
            isDefending: false,
            statusEffects: []
        });
        
        // Inicializar estado base
        this.battleState = {
            // Equipes 3v3
            teams: {
                player: {
                    characters: playerTeam.map(normalizeCharacter),
                    activeIndex: 0, // Primeiro personagem ativo
                    reserves: [1, 2] // Índices dos personagens na reserva
                },
                enemy: {
                    characters: enemyTeam.map(normalizeCharacter),
                    activeIndex: 0,
                    reserves: [1, 2]
                }
            },
            
            // Compatibilidade com sistema antigo (personagens ativos)
            player: {
                ...normalizeCharacter(playerTeam[0], 0),
                swapsUsed: 0
            },
            enemy: {
                ...normalizeCharacter(enemyTeam[0], 0),
                swapsUsed: 0,
                aiType: enemyTeam[0].aiType || 'aggressive'
            },
            
            // Estado da batalha
            turn: 'player',
            round: 1,
            isActive: true,
            battleId: this.generateBattleId(),
            log: [],
            winner: null,
            mode: '3v3',
            
            // Sistema de Turnos
            turnTimer: null,
            turnTimeLimit: 20000,
            turnStartTime: null,
            turnPhase: 'action_select',
            actionDeclared: null,
            autoActionOnTimeout: 'attack'
        };

        this.addToLog('system', 
            `🎮 Batalha 3v3 iniciada! ${this.battleState.teams.player.characters[0].name} vs ${this.battleState.teams.enemy.characters[0].name}`
        );
        
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
     * Processa ataque em área (AoE) que pode afetar personagens da reserva
     * @param {string} attacker - Atacante ('player' ou 'enemy')
     * @param {Object} aoeOptions - Configurações do ataque em área
     * @returns {Object} Resultado do ataque em área
     */
    processAreaAttack(attacker, aoeOptions = {}) {
        if (!this.battleState.isActive) {
            throw new Error('Batalha não está ativa');
        }

        // Configurações padrão para área
        const defaultOptions = {
            type: 'area_fixa',        // area_fixa, area_com_foco, area_decrescente
            primaryTarget: 'active',  // Alvo principal
            includeReserves: true,    // Incluir personagens da reserva
            reducer: 0.6,            // Redutor padrão para área fixa
            skillMultiplier: 2.0,     // Multiplicador da skill
            baseDamage: 25,          // Dano base da skill
            isSpecialAttack: false    // Se é ataque especial (mágico)
        };

        const options = { ...defaultOptions, ...aoeOptions };
        const targetTeam = attacker === 'player' ? 'enemy' : 'player';
        const results = [];

        // Sistema 3v3 - atacar toda a equipe adversária
        if (this.battleState.mode === '3v3' && this.battleState.teams) {
            const team = this.battleState.teams[targetTeam];
            const attackerData = this.battleState.teams[attacker].characters[this.battleState.teams[attacker].activeIndex];

            team.characters.forEach((character, index) => {
                if (character.hp <= 0) return; // Pular personagens desmaiados

                const isActive = index === team.activeIndex;
                const damageResult = this.calculateAreaDamage(
                    attackerData, 
                    character, 
                    options, 
                    isActive
                );

                // Aplicar dano
                character.hp = Math.max(0, character.hp - damageResult.damage);
                character.currentHP = character.hp; // Sincronizar

                results.push({
                    target: character.name,
                    targetIndex: index,
                    isActive: isActive,
                    damage: damageResult.damage,
                    isCritical: damageResult.isCritical,
                    reducer: damageResult.reducer,
                    defeated: character.hp <= 0
                });

                // Log do dano
                const positionText = isActive ? '(Ativo)' : '(Reserva)';
                const criticalText = damageResult.isCritical ? ' CRÍTICO!' : '';
                this.addToLog('damage', 
                    `${character.name} ${positionText} recebe ${damageResult.damage} de dano${criticalText}`
                );
            });

        } else {
            // Sistema simples - apenas o personagem ativo
            const targetData = this.battleState[targetTeam];
            const attackerData = this.battleState[attacker];

            const damageResult = this.calculateAreaDamage(attackerData, targetData, options, true);
            
            targetData.currentHP = Math.max(0, targetData.currentHP - damageResult.damage);

            results.push({
                target: targetData.name,
                targetIndex: 0,
                isActive: true,
                damage: damageResult.damage,
                isCritical: damageResult.isCritical,
                reducer: 1.0,
                defeated: targetData.currentHP <= 0
            });

            this.addToLog('damage', 
                `${targetData.name} recebe ${damageResult.damage} de dano de área${damageResult.isCritical ? ' CRÍTICO!' : ''}`
            );
        }

        // Verificar se algum personagem foi derrotado
        const totalDefeated = results.filter(r => r.defeated).length;
        const totalDamage = results.reduce((sum, r) => sum + r.damage, 0);

        this.addToLog('action', 
            `💥 Ataque em área: ${totalDamage} dano total, ${results.length} alvos atingidos, ${totalDefeated} derrotados`
        );

        return {
            totalTargets: results.length,
            totalDamage: totalDamage,
            defeated: totalDefeated,
            results: results,
            battleState: this.battleState
        };
    }

    /**
     * Calcula dano em área baseado nas fórmulas do documento RPG
     * @param {Object} attacker - Dados do atacante
     * @param {Object} target - Dados do alvo
     * @param {Object} options - Opções do ataque em área
     * @param {boolean} isActive - Se é o personagem ativo
     * @returns {Object} Resultado do cálculo
     */
    calculateAreaDamage(attacker, target, options, isActive = true) {
        // Calcular dano base usando a fórmula do documento
        let baseDamage;
        
        if (options.isSpecialAttack) {
            // Dano Mágico: (Ataque_Especial × Multiplicador + Dano_Base) × (100 ÷ (100 + Espírito))
            const specialAttack = attacker.specialAttack || attacker.attack;
            const spirit = target.spirit || target.defense || 0;
            baseDamage = (specialAttack * options.skillMultiplier + options.baseDamage) * (100 / (100 + spirit));
        } else {
            // Dano Físico: (Ataque × Multiplicador + Dano_Base) × (100 ÷ (100 + Defesa))
            const defense = target.defense || 0;
            baseDamage = (attacker.attack * options.skillMultiplier + options.baseDamage) * (100 / (100 + defense));
        }

        // Aplicar redutor de área baseado no tipo
        let areaReducer;
        switch (options.type) {
            case 'area_com_foco':
                // Alvo Principal: 1.0x, Secundários: 0.4x
                areaReducer = isActive ? 1.0 : 0.4;
                break;
            case 'area_decrescente':
                // Centro: 1.0x, Adjacentes: 0.7x, Bordas: 0.4x
                areaReducer = isActive ? 1.0 : (Math.random() > 0.5 ? 0.7 : 0.4);
                break;
            case 'area_fixa':
            default:
                // Todos os alvos: 0.6x
                areaReducer = options.reducer;
                break;
        }

        baseDamage = Math.floor(baseDamage * areaReducer);

        // Aplicar variação aleatória
        const variance = this.COMBAT_CONSTANTS.DAMAGE_VARIANCE;
        const randomMultiplier = (1 - variance/2) + (Math.random() * variance);
        baseDamage = Math.floor(baseDamage * randomMultiplier);

        // Verificar crítico
        const criticalResult = this.calculateCritical(attacker);
        if (criticalResult.isCritical) {
            baseDamage = Math.floor(baseDamage * criticalResult.multiplier);
        }

        // Aplicar modificadores de defesa especiais para reserva
        if (!isActive && options.includeReserves) {
            // Personagens na reserva recebem 20% menos dano (proteção parcial)
            baseDamage = Math.floor(baseDamage * 0.8);
        }

        // Garantir dano mínimo
        const finalDamage = Math.max(1, baseDamage);

        return {
            damage: finalDamage,
            isCritical: criticalResult.isCritical,
            reducer: areaReducer,
            baseDamage: baseDamage,
            appliedModifiers: {
                areaReducer,
                reserveProtection: !isActive && options.includeReserves ? 0.8 : 1.0,
                randomVariance: randomMultiplier,
                critical: criticalResult.multiplier
            }
        };
    }

    /**
     * Cria um ataque em área pré-configurado
     * @param {string} skillType - Tipo de skill ('tempestade_gelo', 'explosao_fogo', etc.)
     * @returns {Object} Configurações do ataque em área
     */
    getAreaSkillConfig(skillType) {
        const configs = {
            'tempestade_gelo': {
                type: 'area_fixa',
                reducer: 0.6,
                skillMultiplier: 2.2,
                baseDamage: 45,
                isSpecialAttack: true,
                includeReserves: true
            },
            'explosao_fogo': {
                type: 'area_com_foco',
                skillMultiplier: 2.5,
                baseDamage: 50,
                isSpecialAttack: true,
                includeReserves: true
            },
            'onda_choque': {
                type: 'area_decrescente',
                skillMultiplier: 2.0,
                baseDamage: 35,
                isSpecialAttack: false,
                includeReserves: true
            },
            'chuva_flechas': {
                type: 'area_fixa',
                reducer: 0.7,
                skillMultiplier: 1.8,
                baseDamage: 30,
                isSpecialAttack: false,
                includeReserves: true
            }
        };

        return configs[skillType] || configs['explosao_fogo'];
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

    /**
     * Sistema de Prioridade - Métodos principais
     */

    /**
     * Adiciona uma ação à queue de prioridade
     * @param {Object} action - Ação a ser adicionada
     * @param {string} action.actor - 'player' ou 'enemy'
     * @param {string} action.type - Tipo da ação (attack, defend, skill, etc.)
     * @param {Object} action.data - Dados específicos da ação
     * @param {number} action.basePriority - Prioridade base da ação
     * @param {Array} action.priorityModifiers - Modificadores de prioridade
     */
    queueAction(action) {
        // Calcular prioridade final
        const finalPriority = this.calculateFinalPriority(action);
        
        // Adicionar à queue com prioridade calculada
        const queuedAction = {
            ...action,
            finalPriority: finalPriority,
            timestamp: Date.now(),
            speed: this.battleState[action.actor].speed || this.battleState[action.actor].velocidade || 50
        };

        this.battleState.priorityQueue.push(queuedAction);
        this.addToLog('system', `Ação ${action.type} de ${this.battleState[action.actor].name} adicionada à queue (Prioridade: ${finalPriority})`);
    }

    /**
     * Calcula a prioridade final de uma ação considerando modificadores
     * @param {Object} action - Ação para calcular prioridade
     * @returns {number} Prioridade final
     */
    calculateFinalPriority(action) {
        let basePriority = action.basePriority !== undefined 
            ? action.basePriority 
            : this.ACTION_PRIORITIES[action.type] || this.PRIORITY_LEVELS.NORMAL;
        
        // Aplicar modificadores de prioridade
        if (action.priorityModifiers) {
            action.priorityModifiers.forEach(modifier => {
                basePriority += modifier.value;
            });
        }

        // Aplicar modificadores de habilidades especiais do personagem
        const actor = this.battleState[action.actor];
        if (actor.priorityModifiers) {
            actor.priorityModifiers.forEach(modifier => {
                if (modifier.appliesToAction && modifier.appliesToAction.includes(action.type)) {
                    basePriority += modifier.value;
                }
            });
        }

        // Limitar prioridade aos valores permitidos (-2 a +2)
        return Math.max(this.PRIORITY_LEVELS.VERY_LOW, Math.min(this.PRIORITY_LEVELS.VERY_HIGH, basePriority));
    }

    /**
     * Ordena a queue de prioridade
     * Prioridade maior primeiro, depois por velocidade em caso de empate
     */
    sortPriorityQueue() {
        this.battleState.priorityQueue.sort((a, b) => {
            // Primeiro critério: prioridade (maior primeiro)
            if (a.finalPriority !== b.finalPriority) {
                return b.finalPriority - a.finalPriority;
            }
            
            // Segundo critério: velocidade (maior primeiro)
            if (a.speed !== b.speed) {
                return b.speed - a.speed;
            }
            
            // Terceiro critério: timestamp (primeiro a ser adicionado)
            return a.timestamp - b.timestamp;
        });
    }

    /**
     * Processa todas as ações na queue de prioridade
     * @returns {Array} Resultados de todas as ações processadas
     */
    processPriorityQueue() {
        this.sortPriorityQueue();
        const results = [];
        
        this.addToLog('system', `Processando ${this.battleState.priorityQueue.length} ações por ordem de prioridade...`);

        while (this.battleState.priorityQueue.length > 0) {
            const action = this.battleState.priorityQueue.shift();
            
            // Verificar se o ator ainda pode agir
            if (!this.canActorPerformAction(action.actor)) {
                this.addToLog('system', `${this.battleState[action.actor].name} não pode mais agir`);
                continue;
            }

            try {
                const result = this.executeAction(action);
                results.push(result);
                
                // Verificar se a batalha terminou após esta ação
                if (this.checkBattleEnd()) {
                    break;
                }
            } catch (error) {
                this.addToLog('error', `Erro ao executar ação: ${error.message}`);
                continue;
            }
        }

        return results;
    }

    /**
     * Executa uma ação específica baseada no seu tipo
     * @param {Object} action - Ação a ser executada
     * @returns {Object} Resultado da ação
     */
    executeAction(action) {
        const actor = action.actor;
        const actorData = this.battleState[actor];
        const target = actor === 'player' ? 'enemy' : 'player';

        this.addToLog('action', `${actorData.name} executa: ${action.type} (Prioridade: ${action.finalPriority})`);

        switch (action.type) {
            case 'attack':
            case 'quick_attack':
                return this.processAttack(actor, target, action.data);
                
            case 'defend':
                return this.processDefend(actor);
                
            case 'meditate':
                return this.processMeditate(actor);
                
            case 'skill':
                return this.processSkill(actor, target, action.data);
                
            case 'emergency_heal':
                return this.processEmergencyHeal(actor, action.data);
                
            default:
                throw new Error(`Tipo de ação desconhecido: ${action.type}`);
        }
    }

    /**
     * Verifica se um ator pode executar ações
     * @param {string} actor - 'player' ou 'enemy'
     * @returns {boolean} Se pode agir
     */
    canActorPerformAction(actor) {
        const actorData = this.battleState[actor];
        return actorData.currentHP > 0 && !actorData.incapacitated;
    }

    /**
     * Processa uma cura de emergência (prioridade muito alta)
     * @param {string} actor - Ator que executa a ação
     * @param {Object} data - Dados da cura
     * @returns {Object} Resultado da cura
     */
    processEmergencyHeal(actor, data = {}) {
        const actorData = this.battleState[actor];
        const healAmount = data.amount || Math.floor(actorData.maxHP * 0.3);
        
        const actualHeal = Math.min(healAmount, actorData.maxHP - actorData.currentHP);
        actorData.currentHP += actualHeal;
        
        this.addToLog('heal', `${actorData.name} usa cura de emergência e recupera ${actualHeal} HP!`);
        
        return {
            type: 'emergency_heal',
            actor: actor,
            healAmount: actualHeal,
            priority: this.PRIORITY_LEVELS.VERY_HIGH,
            success: true
        };
    }

    /**
     * Limpa a queue de prioridade
     */
    clearPriorityQueue() {
        this.battleState.priorityQueue = [];
        this.addToLog('system', 'Queue de prioridade limpa');
    }

    /**
     * Retorna informações sobre a prioridade de uma ação
     * @param {string} actionType - Tipo da ação
     * @returns {Object} Informações de prioridade
     */
    getActionPriorityInfo(actionType) {
        const priority = this.ACTION_PRIORITIES[actionType] || this.PRIORITY_LEVELS.NORMAL;
        const priorityNames = {
            [this.PRIORITY_LEVELS.VERY_HIGH]: 'Muito Alta',
            [this.PRIORITY_LEVELS.HIGH]: 'Alta',
            [this.PRIORITY_LEVELS.NORMAL]: 'Normal',
            [this.PRIORITY_LEVELS.LOW]: 'Baixa',
            [this.PRIORITY_LEVELS.VERY_LOW]: 'Muito Baixa'
        };

        return {
            value: priority,
            name: priorityNames[priority],
            description: this.getPriorityDescription(priority)
        };
    }

    /**
     * Retorna descrição de um nível de prioridade
     * @param {number} priority - Nível de prioridade
     * @returns {string} Descrição
     */
    getPriorityDescription(priority) {
        const descriptions = {
            [this.PRIORITY_LEVELS.VERY_HIGH]: 'Ações de emergência, intervenções críticas',
            [this.PRIORITY_LEVELS.HIGH]: 'Ataques rápidos, ações de reação, movimentos evasivos',
            [this.PRIORITY_LEVELS.NORMAL]: 'Ações padrão de combate, movimentação normal, habilidades básicas',
            [this.PRIORITY_LEVELS.LOW]: 'Ações de preparação, concentração, requer foco',
            [this.PRIORITY_LEVELS.VERY_LOW]: 'Alterações de campo, ações de grande escala'
        };
        
        return descriptions[priority] || 'Prioridade desconhecida';
    }

    /**
     * Método atualizado do nextTurn para usar sistema de prioridade
     * @returns {Object} Estado da batalha
     */
    nextTurnWithPriority() {
        if (!this.battleState.isActive) {
            throw new Error('Batalha não está ativa');
        }

        // Se há ações na queue, processar por prioridade
        if (this.battleState.priorityQueue.length > 0) {
            this.processPriorityQueue();
        }

        // Processar efeitos de status
        this.processStatusEffects('player');
        this.processStatusEffects('enemy');

        // Avançar rodada se necessário
        this.battleState.round++;
        this.addToLog('system', `Rodada ${this.battleState.round} iniciada`);

        return this.battleState;
    }

    /**
     * Métodos utilitários para facilitar o uso do sistema de prioridade
     */

    /**
     * Adiciona uma ação de ataque à queue
     * @param {string} actor - 'player' ou 'enemy' 
     * @param {Object} data - Dados do ataque
     * @param {number} priorityModifier - Modificador de prioridade opcional
     */
    queueAttack(actor, data = {}, priorityModifier = 0) {
        this.queueAction({
            actor: actor,
            type: 'attack',
            data: data,
            basePriority: this.PRIORITY_LEVELS.NORMAL + priorityModifier
        });
    }

    /**
     * Adiciona uma ação de ataque rápido à queue
     * @param {string} actor - 'player' ou 'enemy'
     * @param {Object} data - Dados do ataque
     */
    queueQuickAttack(actor, data = {}) {
        this.queueAction({
            actor: actor,
            type: 'quick_attack',
            data: data,
            basePriority: this.PRIORITY_LEVELS.HIGH
        });
    }

    /**
     * Adiciona uma ação de defesa à queue
     * @param {string} actor - 'player' ou 'enemy'
     */
    queueDefend(actor) {
        this.queueAction({
            actor: actor,
            type: 'defend',
            data: {},
            basePriority: this.PRIORITY_LEVELS.HIGH
        });
    }

    /**
     * Adiciona uma skill à queue
     * @param {string} actor - 'player' ou 'enemy'
     * @param {Object} skillData - Dados da skill
     * @param {number} priorityOverride - Prioridade específica da skill
     */
    queueSkill(actor, skillData, priorityOverride = null) {
        this.queueAction({
            actor: actor,
            type: 'skill',
            data: skillData,
            basePriority: priorityOverride !== null ? priorityOverride : this.PRIORITY_LEVELS.NORMAL
        });
    }

    /**
     * Adiciona meditação à queue
     * @param {string} actor - 'player' ou 'enemy'
     */
    queueMeditate(actor) {
        this.queueAction({
            actor: actor,
            type: 'meditate',
            data: {},
            basePriority: this.PRIORITY_LEVELS.LOW
        });
    }

    /**
     * Adiciona cura de emergência à queue
     * @param {string} actor - 'player' ou 'enemy'
     * @param {Object} data - Dados da cura
     */
    queueEmergencyHeal(actor, data = {}) {
        this.queueAction({
            actor: actor,
            type: 'emergency_heal',
            data: data,
            basePriority: this.PRIORITY_LEVELS.VERY_HIGH
        });
    }

    /**
     * Verifica se alguma ação na queue tem prioridade maior que a especificada
     * @param {number} priorityThreshold - Limite de prioridade
     * @returns {boolean} Se existe ação com prioridade maior
     */
    hasHigherPriorityActions(priorityThreshold) {
        return this.battleState.priorityQueue.some(action => 
            action.finalPriority > priorityThreshold
        );
    }

    /**
     * Conta quantas ações de um tipo específico estão na queue
     * @param {string} actionType - Tipo da ação
     * @returns {number} Quantidade de ações do tipo
     */
    countActionsInQueue(actionType) {
        return this.battleState.priorityQueue.filter(action => 
            action.type === actionType
        ).length;
    }

    /**
     * Remove todas as ações de um ator específico da queue
     * @param {string} actor - 'player' ou 'enemy'
     * @returns {number} Quantidade de ações removidas
     */
    removeActorActionsFromQueue(actor) {
        const initialLength = this.battleState.priorityQueue.length;
        this.battleState.priorityQueue = this.battleState.priorityQueue.filter(action => 
            action.actor !== actor
        );
        const removedCount = initialLength - this.battleState.priorityQueue.length;
        
        if (removedCount > 0) {
            this.addToLog('system', `${removedCount} ações de ${this.battleState[actor].name} removidas da queue`);
        }
        
        return removedCount;
    }

    /**
     * Obtém preview da ordem de execução das ações na queue
     * @returns {Array} Array com preview das ações ordenadas
     */
    getExecutionOrderPreview() {
        const queueCopy = [...this.battleState.priorityQueue];
        queueCopy.sort((a, b) => {
            if (a.finalPriority !== b.finalPriority) {
                return b.finalPriority - a.finalPriority;
            }
            if (a.speed !== b.speed) {
                return b.speed - a.speed;
            }
            return a.timestamp - b.timestamp;
        });

        return queueCopy.map(action => ({
            actor: this.battleState[action.actor].name,
            actionType: action.type,
            priority: action.finalPriority,
            speed: action.speed
        }));
    }

    /**
     * Adiciona modificador de prioridade a um personagem
     * @param {string} actor - 'player' ou 'enemy'
     * @param {Object} modifier - Modificador de prioridade
     */
    addPriorityModifier(actor, modifier) {
        const actorData = this.battleState[actor];
        if (!actorData.priorityModifiers) {
            actorData.priorityModifiers = [];
        }
        
        actorData.priorityModifiers.push(modifier);
        this.addToLog('system', `${actorData.name} recebe modificador de prioridade: ${modifier.name}`);
    }

    /**
     * Remove modificador de prioridade de um personagem
     * @param {string} actor - 'player' ou 'enemy'
     * @param {string} modifierName - Nome do modificador a remover
     */
    removePriorityModifier(actor, modifierName) {
        const actorData = this.battleState[actor];
        if (actorData.priorityModifiers) {
            const initialLength = actorData.priorityModifiers.length;
            actorData.priorityModifiers = actorData.priorityModifiers.filter(mod => 
                mod.name !== modifierName
            );
            
            if (actorData.priorityModifiers.length < initialLength) {
                this.addToLog('system', `${actorData.name} perde modificador de prioridade: ${modifierName}`);
            }
        }
    }

    /**
     * Sistema de Turnos com Timer
     */

    /**
     * Inicia um novo turno com timer
     * @param {string} player - 'player' ou 'enemy'
     * @returns {Object} Estado do turno
     */
    startTurn(player = this.battleState.turn) {
        if (!this.battleState.isActive) {
            throw new Error('Batalha não está ativa');
        }

        // Limpar timer anterior se existir
        this.clearTurnTimer();

        // Resetar contadores de troca
        this.battleState.player.swapsUsed = 0;
        this.battleState.enemy.swapsUsed = 0;

        // Configurar novo turno
        this.battleState.turn = player;
        this.battleState.turnPhase = 'action_select';
        this.battleState.actionDeclared = null;
        this.battleState.turnStartTime = Date.now();

        this.addToLog('system', `Turno de ${this.battleState[player].name} iniciado (${this.COMBAT_CONSTANTS.TURN_TIME_LIMIT / 1000}s)`);

        // Iniciar timer apenas para jogador humano
        if (player === 'player') {
            this.startTurnTimer();
        }

        return {
            currentPlayer: player,
            timeLimit: this.COMBAT_CONSTANTS.TURN_TIME_LIMIT,
            phase: this.battleState.turnPhase,
            swapsRemaining: this.COMBAT_CONSTANTS.MAX_SWAPS_PER_TURN - this.battleState[player].swapsUsed
        };
    }

    /**
     * Inicia o timer do turno
     */
    startTurnTimer() {
        this.battleState.turnTimer = setTimeout(() => {
            this.onTurnTimeout();
        }, this.COMBAT_CONSTANTS.TURN_TIME_LIMIT);

        // Aviso aos 5 segundos restantes
        setTimeout(() => {
            if (this.battleState.turnPhase === 'action_select') {
                this.addToLog('warning', `⏰ 5 segundos restantes!`);
                this.onTurnTimeWarning();
            }
        }, this.COMBAT_CONSTANTS.TURN_TIME_LIMIT - 5000);
    }

    /**
     * Limpa o timer do turno atual
     */
    clearTurnTimer() {
        if (this.battleState.turnTimer) {
            clearTimeout(this.battleState.turnTimer);
            this.battleState.turnTimer = null;
        }
    }

    /**
     * Callback quando o tempo do turno se esgota
     */
    onTurnTimeout() {
        if (this.battleState.turnPhase !== 'action_select') {
            return; // Turno já foi processado
        }

        const currentPlayer = this.battleState.turn;
        this.addToLog('timeout', `⏰ Tempo esgotado! ${this.battleState[currentPlayer].name} executa ação padrão.`);

        // Executar ação padrão (ataque básico)
        this.declareAction(this.battleState.autoActionOnTimeout, {});
    }

    /**
     * Callback para aviso de tempo
     */
    onTurnTimeWarning() {
        // Callback para interface - pode ser sobrescrito
        if (this.onTimeWarningCallback) {
            this.onTimeWarningCallback();
        }
    }

    /**
     * Declara uma ação para o jogador atual
     * @param {string} actionType - Tipo da ação (attack, defend, meditate, skill)
     * @param {Object} actionData - Dados específicos da ação
     * @returns {Object} Resultado da declaração
     */
    declareAction(actionType, actionData = {}) {
        if (!this.battleState.isActive) {
            throw new Error('Batalha não está ativa');
        }

        if (this.battleState.turnPhase !== 'action_select') {
            throw new Error('Não é possível declarar ação nesta fase do turno');
        }

        const currentPlayer = this.battleState.turn;
        
        // Validar tipo de ação
        if (!Object.values(this.ACTION_TYPES).includes(actionType) || actionType === this.ACTION_TYPES.SWAP) {
            throw new Error(`Tipo de ação inválido: ${actionType}`);
        }

        // Limpar timer
        this.clearTurnTimer();

        // Salvar ação declarada
        this.battleState.actionDeclared = {
            type: actionType,
            data: actionData,
            actor: currentPlayer,
            declaredAt: Date.now()
        };

        this.battleState.turnPhase = 'action_declared';
        
        const timeTaken = Date.now() - this.battleState.turnStartTime;
        this.addToLog('action', `${this.battleState[currentPlayer].name} declara: ${actionType} (${Math.floor(timeTaken/1000)}s)`);

        return {
            success: true,
            actionType: actionType,
            actionData: actionData,
            timeTaken: timeTaken
        };
    }

    /**
     * Executa troca de personagem (não consome ação)
     * @param {string} fromCharacterId - ID do personagem atual
     * @param {string} toCharacterId - ID do personagem para trocar
     * @returns {Object} Resultado da troca
     */
    executeSwap(fromCharacterId, toCharacterId) {
        if (!this.battleState.isActive) {
            throw new Error('Batalha não está ativa');
        }

        const currentPlayer = this.battleState.turn;
        const playerData = this.battleState[currentPlayer];

        // Verificar se ainda pode fazer trocas
        if (playerData.swapsUsed >= this.COMBAT_CONSTANTS.MAX_SWAPS_PER_TURN) {
            throw new Error(`Máximo de ${this.COMBAT_CONSTANTS.MAX_SWAPS_PER_TURN} troca(s) por turno já utilizada(s)`);
        }

        // Validar personagens (aqui seria integrado com sistema 3v3)
        if (!fromCharacterId || !toCharacterId || fromCharacterId === toCharacterId) {
            throw new Error('IDs de personagem inválidos para troca');
        }

        // Executar troca
        playerData.swapsUsed++;
        
        this.addToLog('swap', `${playerData.name} troca de personagem (${playerData.swapsUsed}/${this.COMBAT_CONSTANTS.MAX_SWAPS_PER_TURN})`);

        return {
            success: true,
            fromCharacter: fromCharacterId,
            toCharacter: toCharacterId,
            swapsRemaining: this.COMBAT_CONSTANTS.MAX_SWAPS_PER_TURN - playerData.swapsUsed
        };
    }

    /**
     * Processa o turno atual (executa ação declarada)
     * @returns {Object} Resultado do processamento
     */
    processTurn() {
        if (!this.battleState.isActive) {
            throw new Error('Batalha não está ativa');
        }

        if (this.battleState.turnPhase !== 'action_declared') {
            throw new Error('Nenhuma ação foi declarada para processar');
        }

        this.battleState.turnPhase = 'processing';
        const action = this.battleState.actionDeclared;
        
        try {
            // Adicionar ação à queue de prioridade
            this.queueAction({
                actor: action.actor,
                type: action.type,
                data: action.data,
                declaredAt: action.declaredAt
            });

            // Se ambos os jogadores declararam ações, processar queue
            const result = this.processPriorityQueue();

            // Limpar ação declarada
            this.battleState.actionDeclared = null;
            
            return {
                success: true,
                results: result,
                battleState: this.getBattleState()
            };

        } catch (error) {
            this.addToLog('error', `Erro ao processar turno: ${error.message}`);
            throw error;
        }
    }

    /**
     * Finaliza o turno atual e passa para o próximo jogador
     * @returns {Object} Estado do novo turno
     */
    endTurn() {
        if (!this.battleState.isActive) {
            throw new Error('Batalha não está ativa');
        }

        this.clearTurnTimer();
        
        const currentPlayer = this.battleState.turn;
        const nextPlayer = currentPlayer === 'player' ? 'enemy' : 'player';
        
        // Processar efeitos de fim de turno
        this.processEndOfTurnEffects(currentPlayer);
        
        // Verificar se a batalha terminou
        if (this.checkBattleEnd()) {
            return this.battleState;
        }

        // Se for turno do enemy (IA), processar automaticamente
        if (nextPlayer === 'enemy') {
            this.startTurn(nextPlayer);
            this.processAITurn();
        } else {
            this.startTurn(nextPlayer);
        }

        return this.getBattleState();
    }

    /**
     * Processa turno da IA automaticamente
     */
    processAITurn() {
        if (this.battleState.turn !== 'enemy') {
            return;
        }

        // Simular tempo de "pensamento" da IA (1-3 segundos)
        const thinkingTime = 1000 + Math.random() * 2000;
        
        setTimeout(() => {
            if (this.battleState.turn === 'enemy' && this.battleState.turnPhase === 'action_select') {
                const aiAction = this.selectAIAction();
                this.declareAction(aiAction.type, aiAction.data);
                this.processTurn();
                this.endTurn();
            }
        }, thinkingTime);
    }

    /**
     * Processa efeitos de fim de turno
     * @param {string} player - Jogador que está terminando o turno
     */
    processEndOfTurnEffects(player) {
        const playerData = this.battleState[player];
        
        // Resetar defesa
        if (playerData.defending) {
            playerData.defending = false;
            this.addToLog('system', `${playerData.name} para de se defender`);
        }

        // Processar efeitos de status
        this.processStatusEffects(player);
        
        // Avançar round se necessário
        if (player === 'enemy') {
            this.battleState.round++;
        }
    }

    /**
     * Verifica se o jogador pode executar uma ação específica
     * @param {string} actionType - Tipo da ação
     * @param {Object} actionData - Dados da ação
     * @returns {Object} Resultado da verificação
     */
    canExecuteAction(actionType, actionData = {}) {
        if (!this.battleState.isActive) {
            return { canExecute: false, reason: 'Batalha não está ativa' };
        }

        const currentPlayer = this.battleState.turn;
        const playerData = this.battleState[currentPlayer];

        switch (actionType) {
            case this.ACTION_TYPES.ATTACK:
                return { canExecute: true };

            case this.ACTION_TYPES.DEFEND:
                return { canExecute: true };

            case this.ACTION_TYPES.MEDITATE:
                return { canExecute: true };

            case this.ACTION_TYPES.SKILL:
                if (!actionData.skillId) {
                    return { canExecute: false, reason: 'ID da skill não especificado' };
                }
                
                const requiredAnima = actionData.animaCost || 0;
                if (playerData.currentMP < requiredAnima) {
                    return { canExecute: false, reason: 'Ânima insuficiente' };
                }
                
                return { canExecute: true };

            case this.ACTION_TYPES.SWAP:
                if (playerData.swapsUsed >= this.COMBAT_CONSTANTS.MAX_SWAPS_PER_TURN) {
                    return { canExecute: false, reason: 'Máximo de trocas por turno atingido' };
                }
                return { canExecute: true };

            default:
                return { canExecute: false, reason: 'Tipo de ação desconhecido' };
        }
    }

    /**
     * Obtém informações do turno atual
     * @returns {Object} Informações do turno
     */
    getCurrentTurnInfo() {
        const currentPlayer = this.battleState.turn;
        const timeElapsed = this.battleState.turnStartTime ? 
            Date.now() - this.battleState.turnStartTime : 0;
        const timeRemaining = Math.max(0, this.COMBAT_CONSTANTS.TURN_TIME_LIMIT - timeElapsed);

        return {
            currentPlayer: currentPlayer,
            playerName: this.battleState[currentPlayer].name,
            phase: this.battleState.turnPhase,
            timeElapsed: timeElapsed,
            timeRemaining: timeRemaining,
            swapsUsed: this.battleState[currentPlayer].swapsUsed,
            swapsRemaining: this.COMBAT_CONSTANTS.MAX_SWAPS_PER_TURN - this.battleState[currentPlayer].swapsUsed,
            actionDeclared: this.battleState.actionDeclared,
            availableActions: Object.values(this.ACTION_TYPES).filter(action => action !== 'swap')
        };
    }

    /**
     * SISTEMA DE TURNOS - Lógica Principal
     */

    initializeTurnSystem() {
        // Inicializar propriedades específicas do sistema de turnos
        this.battleState.turnTimer = null;
        this.battleState.turnStartTime = null;
        this.battleState.turnPhase = 'selection';
        this.battleState.actionDeclared = null;
        this.battleState.timeRemaining = 0;
        
        // Estatísticas de timeout
        this.battleState.turnTimes = [];
        this.battleState.timeoutCount = 0;
        this.battleState.totalTurns = 0;
        
        // Resetar contadores de troca
        if (this.battleState.player) {
            this.battleState.player.swapsUsed = 0;
        }
        if (this.battleState.enemy) {
            this.battleState.enemy.swapsUsed = 0;
        }
        
        // Callbacks para UI (podem ser definidos externamente)
        this.onTimeWarningCallback = null;
        this.onTimeoutCallback = null;
        this.onTurnStartCallback = null;
        this.onTurnEndCallback = null;
        
        this.addToLog('system', '🎯 Sistema de turnos inicializado');
        return true;
    }

    startPlayerTurn() {
        this.clearTurnTimer();
        
        // Configurar estado do turno
        this.battleState.turn = 'player';
        this.battleState.turnPhase = 'action_select';
        this.battleState.turnStartTime = Date.now();
        this.battleState.timeRemaining = this.COMBAT_CONSTANTS.TURN_TIME_LIMIT;
        this.battleState.actionDeclared = null;
        
        // Resetar trocas para novo turno
        this.battleState.player.swapsUsed = 0;
        this.battleState.enemy.swapsUsed = 0;
        
        this.addToLog('system', '🎮 Seu turno! Selecione uma ação (20s)');
        
        // Iniciar timer
        this.startTurnTimer();
        
        // Callback para UI
        if (this.onTurnStartCallback) {
            this.onTurnStartCallback('player');
        }
        
        return {
            currentPlayer: 'player',
            timeLimit: this.COMBAT_CONSTANTS.TURN_TIME_LIMIT,
            swapsRemaining: this.COMBAT_CONSTANTS.MAX_SWAPS_PER_TURN,
            phase: 'action_select'
        };
    }

    startTurnTimer() {
        this.battleState.turnTimer = setInterval(() => {
            this.battleState.timeRemaining -= 1000;
            
            // Aviso aos 5 segundos
            if (this.battleState.timeRemaining === 5000) {
                this.addToLog('warning', '⚠️ 5 segundos restantes!');
                if (this.onTimeWarningCallback) {
                    this.onTimeWarningCallback();
                }
            }
            
            // Timeout
            if (this.battleState.timeRemaining <= 0) {
                this.onTurnTimeout();
            }
        }, 1000);
    }

    onTurnTimeout() {
        this.clearTurnTimer();
        
        const currentPlayer = this.battleState.turn;
        const playerData = this.battleState[currentPlayer];
        
        // Log específico para 3v3
        if (this.battleState.mode === '3v3' && this.battleState.teams) {
            const activeChar = this.battleState.teams[currentPlayer].characters[this.battleState.teams[currentPlayer].activeIndex];
            this.addToLog('timeout', `⏰ Tempo esgotado! ${activeChar.name} executa ação padrão (Ataque Básico)...`);
        } else {
            this.addToLog('timeout', `⏰ Tempo esgotado! ${playerData?.name || currentPlayer} executa ação padrão...`);
        }
        
        // Callback para UI
        if (this.onTimeoutCallback) {
            this.onTimeoutCallback({
                player: currentPlayer,
                action: this.battleState.autoActionOnTimeout || 'attack',
                timeElapsed: this.COMBAT_CONSTANTS.TURN_TIME_LIMIT
            });
        }
        
        // Contar timeout e registrar estatísticas
        this.battleState.timeoutCount++;
        this.battleState.turnTimes.push(this.COMBAT_CONSTANTS.TURN_TIME_LIMIT);
        this.battleState.totalTurns++;
        
        // Executar ação padrão baseada no tipo de batalha
        const defaultAction = this.battleState.autoActionOnTimeout || 'attack';
        this.declareAction(defaultAction);
    }

    declareAction(actionType, actionData = {}) {
        if (this.battleState.turnPhase !== 'action_select') {
            return { success: false, reason: 'Não é possível declarar ação nesta fase' };
        }

        this.clearTurnTimer();
        this.battleState.turnPhase = 'processing';
        
        this.battleState.actionDeclared = {
            type: actionType,
            data: actionData,
            declaredAt: Date.now()
        };

        const timeTaken = Date.now() - this.battleState.turnStartTime;
        
        // Rastrear estatísticas de tempo
        this.battleState.turnTimes.push(timeTaken);
        this.battleState.totalTurns++;
        
        this.addToLog('action', `⚔️ Ação declarada: ${actionType} (${Math.floor(timeTaken/1000)}s)`);
        
        return {
            success: true,
            actionType: actionType,
            timeTaken: timeTaken,
            actionData: actionData,
            turnNumber: this.battleState.totalTurns
        };
    }

    processTurn() {
        if (!this.battleState.actionDeclared) {
            return { success: false, reason: 'Nenhuma ação declarada' };
        }

        const action = this.battleState.actionDeclared;
        
        try {
            let result;
            switch (action.type) {
                case 'attack':
                    result = this.processAttack('player', 'enemy', action.data);
                    break;
                case 'defend':
                    result = this.processDefend('player');
                    break;
                case 'meditate':
                    result = this.processMeditate('player');
                    break;
                case 'skill':
                    result = this.processSkill('player', 'enemy', action.data);
                    break;
                default:
                    throw new Error(`Tipo de ação desconhecido: ${action.type}`);
            }
            
            return { success: true, result: result };
        } catch (error) {
            this.addToLog('error', `Erro ao processar ação: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    endTurn() {
        this.clearTurnTimer();
        this.battleState.turnPhase = 'turn_end';
        this.battleState.actionDeclared = null;
        
        // Verificar fim de batalha
        if (this.checkBattleEnd()) {
            return;
        }
        
        // Alternar para próximo jogador
        this.battleState.turn = this.battleState.turn === 'player' ? 'enemy' : 'player';
        
        if (this.onTurnEndCallback) {
            this.onTurnEndCallback(this.battleState.turn);
        }
        
        this.addToLog('system', `🔄 Turno finalizado, próximo: ${this.battleState.turn}`);
    }

    executeSwap(fromCharacterIndex, toCharacterIndex) {
        const currentPlayer = this.battleState.turn;
        const playerData = this.battleState[currentPlayer];
        
        if (playerData.swapsUsed >= this.COMBAT_CONSTANTS.MAX_SWAPS_PER_TURN) {
            throw new Error('Máximo de trocas por turno atingido');
        }
        
        // Validar se o sistema de equipes está disponível
        if (!this.battleState.teams || !this.battleState.teams[currentPlayer]) {
            // Fallback para sistema simples
            playerData.swapsUsed++;
            this.addToLog('swap', `🔄 Troca executada (${playerData.swapsUsed}/${this.COMBAT_CONSTANTS.MAX_SWAPS_PER_TURN})`);
            
            return {
                success: true,
                fromCharacter: `character_${fromCharacterIndex}`,
                toCharacter: `character_${toCharacterIndex}`,
                swapsUsed: playerData.swapsUsed,
                swapsRemaining: this.COMBAT_CONSTANTS.MAX_SWAPS_PER_TURN - playerData.swapsUsed
            };
        }
        
        // Sistema 3v3 completo
        const team = this.battleState.teams[currentPlayer];
        const fromChar = team.characters[fromCharacterIndex];
        const toChar = team.characters[toCharacterIndex];
        
        // Validações
        if (!fromChar || !toChar) {
            throw new Error('Personagens inválidos para troca');
        }
        
        if (toChar.hp <= 0) {
            throw new Error('Não é possível trocar para personagem desmaiado');
        }
        
        if (team.activeIndex === toCharacterIndex) {
            throw new Error('Personagem já está ativo');
        }
        
        // Executar troca
        const previousActive = team.activeIndex;
        team.activeIndex = toCharacterIndex;
        
        // Atualizar contadores
        playerData.swapsUsed++;
        
        this.addToLog('swap', 
            `🔄 ${fromChar.name} sai de campo, ${toChar.name} entra! (${playerData.swapsUsed}/${this.COMBAT_CONSTANTS.MAX_SWAPS_PER_TURN})`
        );
        
        return {
            success: true,
            fromCharacter: fromChar,
            toCharacter: toChar,
            previousActiveIndex: previousActive,
            newActiveIndex: toCharacterIndex,
            swapsUsed: playerData.swapsUsed,
            swapsRemaining: this.COMBAT_CONSTANTS.MAX_SWAPS_PER_TURN - playerData.swapsUsed,
            team: currentPlayer
        };
    }

    canExecuteAction(actionType, actionData = {}) {
        if (this.battleState.turnPhase !== 'action_select') {
            return { canExecute: false, reason: 'Não é possível agir nesta fase' };
        }

        if (this.battleState.turn !== 'player') {
            return { canExecute: false, reason: 'Não é seu turno' };
        }

        const player = this.battleState.player;

        switch (actionType) {
            case 'attack':
                return { canExecute: true };
                
            case 'defend':
                return { canExecute: true };
                
            case 'meditate':
                return { canExecute: true };
                
            case 'skill':
                const requiredMP = actionData.cost || actionData.animaCost || 0;
                if (player.anima < requiredMP) {
                    return { canExecute: false, reason: 'Ânima insuficiente' };
                }
                return { canExecute: true };
                
            case 'swap':
                if (player.swapsUsed >= this.COMBAT_CONSTANTS.MAX_SWAPS_PER_TURN) {
                    return { canExecute: false, reason: 'Máximo de trocas atingido' };
                }
                return { canExecute: true };
        }
        
        return { canExecute: false, reason: 'Ação desconhecida' };
    }

    clearTurnTimer() {
        if (this.battleState.turnTimer) {
            clearInterval(this.battleState.turnTimer);
            this.battleState.turnTimer = null;
        }
    }

    getTurnStatus() {
        return {
            currentPhase: this.battleState.turnPhase,
            currentPlayer: this.battleState.turn,
            timeRemaining: this.battleState.timeRemaining,
            swapsUsed: this.battleState[this.battleState.turn]?.swapsUsed || 0,
            actionDeclared: !!this.battleState.actionDeclared,
            isPlayerTurn: this.battleState.turn === 'player'
        };
    }
}

// Export for Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BattleMechanics;
} else {
    window.BattleMechanics = BattleMechanics;
}