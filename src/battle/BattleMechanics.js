/**
 * RPGStack Battle Mechanics - Backend Anti-Cheat System
 * Implementa fórmulas de dano baseadas em rpg-damage-formula.md
 * Sistema seguro no servidor para evitar cheats
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { PassiveTriggerSystem } from './PassiveTriggerSystem.js';
import { PassiveAbilityService } from '../application/services/PassiveAbilityService.js';
import { JsonPassiveAbilityRepository } from '../infrastructure/repositories/JsonPassiveAbilityRepository.js';
import { TurnSystem } from './TurnSystem.js';
import { DamageCalculationSystem } from './DamageCalculationSystem.js';
import { AnimaCooldownSystem } from './AnimaCooldownSystem.js';
import { AutoBalanceSystem } from './AutoBalanceSystem.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SecureBattleMechanics {
    constructor(databasePath = null) {
        this.activeBattles = new Map();
        this.battleResults = new Map();
        this.databasePath = databasePath || path.join(__dirname, '../../data/characters.json');
        this.characterCache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutos
        
        // Inicializar sistema de passivas
        this._initializePassiveSystem();
    }

    async _initializePassiveSystem() {
        try {
            const passiveRepository = new JsonPassiveAbilityRepository();
            await passiveRepository.initialize();
            const passiveService = new PassiveAbilityService(passiveRepository);
            this.passiveTriggerSystem = new PassiveTriggerSystem(passiveService);
            
            // Inicializar TurnSystem com integração de passivas
            this.turnSystem = new TurnSystem(passiveService);
            this.turnSystem.setConfig({
                debugMode: true,
                validateMoves: true,
                autoAdvance: false
            });
            
            // Inicializar DamageCalculationSystem
            this.damageCalculationSystem = new DamageCalculationSystem();
            
            // Inicializar AnimaCooldownSystem
            this.animaCooldownSystem = new AnimaCooldownSystem();
            
            // Inicializar AutoBalanceSystem
            this.autoBalanceSystem = new AutoBalanceSystem();
            
            console.log('✅ Sistema de Passivas integrado ao Battle System');
            console.log('✅ TurnSystem TCG integrado com validação anti-cheat');
            console.log('✅ DamageCalculationSystem inicializado');
            console.log('✅ AnimaCooldownSystem inicializado');
            console.log('✅ AutoBalanceSystem inicializado');
        } catch (error) {
            console.error('❌ Erro ao inicializar sistema de passivas:', error);
        }
    }

    /**
     * Carrega dados de personagem diretamente do banco de dados (anti-cheat)
     */
    async loadCharacterFromDatabase(characterId) {
        try {
            // Verificar cache primeiro
            const cached = this.characterCache.get(characterId);
            if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
                return cached.data;
            }

            // Carregar do banco de dados
            const data = await fs.readFile(this.databasePath, 'utf8');
            const database = JSON.parse(data);
            
            const character = database.characters[characterId];
            if (!character) {
                throw new Error(`Personagem ${characterId} não encontrado no banco de dados`);
            }

            // Cachear resultado
            this.characterCache.set(characterId, {
                data: character,
                timestamp: Date.now()
            });

            return character;
        } catch (error) {
            console.error(`❌ Erro ao carregar personagem ${characterId}:`, error);
            throw new Error(`Falha ao carregar dados do personagem ${characterId}`);
        }
    }

    /**
     * Calcula dano físico usando DamageCalculationSystem integrado
     */
    async calculatePhysicalDamage(attacker, defender, skill) {
        const attackerData = await this.loadCharacterFromDatabase(attacker.id);
        const defenderData = await this.loadCharacterFromDatabase(defender.id);
        
        return this.damageCalculationSystem.calculatePhysicalDamage(
            attackerData,
            defenderData, 
            skill,
            this.passiveTriggerSystem
        );
    }

    /**
     * Calcula dano mágico usando DamageCalculationSystem integrado
     */
    async calculateMagicalDamage(attacker, defender, skill) {
        const attackerData = await this.loadCharacterFromDatabase(attacker.id);
        const defenderData = await this.loadCharacterFromDatabase(defender.id);
        
        return this.damageCalculationSystem.calculateMagicalDamage(
            attackerData,
            defenderData,
            skill,
            this.passiveTriggerSystem
        );
    }

    /**
     * Calcula dano de área (AoE) usando DamageCalculationSystem integrado
     */
    async calculateAoEDamage(attacker, targets, skill) {
        const attackerData = await this.loadCharacterFromDatabase(attacker.id);
        const targetData = [];
        
        for (const target of targets) {
            const data = await this.loadCharacterFromDatabase(target.id);
            targetData.push(data);
        }
        
        return this.damageCalculationSystem.calculateAoEDamage(
            attackerData,
            targetData,
            skill,
            this.passiveTriggerSystem
        );
    }

    /**
     * Inicializar estado de batalha com stats reais do banco de dados
     */
    async initializeCharacterState(characterId) {
        const character = await this.loadCharacterFromDatabase(characterId);
        
        return {
            id: characterId,
            currentHP: character.hp || character.maxHP || 100,
            maxHP: character.hp || character.maxHP || 100,
            currentMP: character.mp || character.maxMP || character.anima || 50,
            maxMP: character.mp || character.maxMP || character.anima || 50,
            status: 'active',
            buffs: [],
            debuffs: []
        };
    }

    /**
     * Criar nova batalha segura
     */
    async createSecureBattle(playerTeam, enemyTeam, battleType = '3v3') {
        console.log('🔍 [DEBUG BACKEND] Dados recebidos:');
        console.log('🔍 [DEBUG BACKEND] playerTeam:', JSON.stringify(playerTeam, null, 2));
        console.log('🔍 [DEBUG BACKEND] enemyTeam:', JSON.stringify(enemyTeam, null, 2));
        
        const battleId = crypto.randomBytes(16).toString('hex');
        
        const battle = {
            id: battleId,
            type: battleType,
            status: 'active',
            currentTurn: 'player',
            round: 1,
            playerTeam: {
                characters: await Promise.all(playerTeam.map(async (char) => {
                    const charState = await this.initializeCharacterState(char.id);
                    return {
                        ...charState,
                        position: char.position || 0
                    };
                })),
                activeIndex: 0,
                swapsUsed: 0,
                maxSwaps: 1
            },
            enemyTeam: {
                characters: await Promise.all(enemyTeam.map(async (char) => {
                    const charState = await this.initializeCharacterState(char.id);
                    return {
                        ...charState,
                        position: char.position || 0
                    };
                })),
                activeIndex: 0,
                swapsUsed: 0,
                maxSwaps: 1
            },
            battleLog: [],
            createdAt: Date.now(),
            lastAction: Date.now()
        };
        
        this.activeBattles.set(battleId, battle);
        
        // Registrar batalla no sistema de passivas
        if (this.passiveTriggerSystem) {
            const allPlayers = [
                ...battle.playerTeam.characters,
                ...battle.enemyTeam.characters
            ];
            this.passiveTriggerSystem.registerBattle(battleId, allPlayers);
            
            console.log(`🎭 [PassiveIntegration] Batalha ${battleId} registrada no sistema de passivas`);
        }

        // Inicializar TurnSystem para esta batalha específica
        if (this.turnSystem) {
            const turnPlayers = [
                ...battle.playerTeam.characters,
                ...battle.enemyTeam.characters
            ];
            
            // Adicionar jogadores ao sistema de turnos
            turnPlayers.forEach(player => {
                this.turnSystem.addPlayer({
                    name: player.name,
                    culture: player.cultura || player.culture,
                    resources: {
                        health: player.currentHP,
                        maxHealth: player.maxHP,
                        Ânima: player.currentÂnima || player.currentAnima || 5,
                        maxÂnima: player.maxÂnima || player.maxAnima || 10
                    }
                });
            });
            
            // Iniciar sistema de turnos
            await this.turnSystem.startTurnSystem(battleId);
            
            console.log(`🎮 [TurnSystem] Sistema de turnos TCG iniciado para batalha ${battleId}`);
        }
        
        // Inicializar AnimaCooldownSystem para esta batalha
        if (this.animaCooldownSystem) {
            const allPlayers = [
                ...battle.playerTeam.characters,
                ...battle.enemyTeam.characters
            ];
            
            this.animaCooldownSystem.initializeBattle(battleId, allPlayers);
            console.log(`⚡ [AnimaSystem] Sistema de Ânima inicializado para batalha ${battleId}`);
        }
        
        return {
            battleId,
            battle: this.getSafeBattleState(battle)
        };
    }

    /**
     * Sistema de Validação de Equipes (migrado do frontend)
     */
    validateTeamSelection(team, teamType = 'equipe') {
        if (!Array.isArray(team)) {
            throw new Error(`${teamType} deve ser um array de personagens`);
        }
        
        if (team.length !== 3) {
            throw new Error(`${teamType} deve ter exatamente 3 personagens (atual: ${team.length})`);
        }
        
        team.forEach((char, index) => {
            if (!char || typeof char !== 'object') {
                throw new Error(`${teamType} posição ${index + 1}: Personagem inválido`);
            }
            
            const requiredFields = ['id', 'name'];
            requiredFields.forEach(field => {
                if (!char[field]) {
                    throw new Error(`${teamType} posição ${index + 1}: Campo '${field}' é obrigatório`);
                }
            });
        });
        
        return true;
    }

    /**
     * Sistema de Turnos e IA (migrado do frontend)
     */
    selectAIAction(enemyData, playerData) {
        const enemyHPPercent = enemyData.currentHP / enemyData.maxHP;
        const playerHPPercent = playerData.currentHP / playerData.maxHP;
        
        // IA defensiva quando com pouca vida
        if (enemyHPPercent < 0.3) {
            return Math.random() < 0.6 ? 'defend' : 'meditate';
        }
        
        // IA agressiva quando jogador tem pouca vida
        if (playerHPPercent < 0.4) {
            return Math.random() < 0.8 ? 'attack' : 'skill';
        }
        
        // Comportamento padrão
        const rand = Math.random();
        if (rand < 0.5) return 'attack';
        if (rand < 0.3) return 'skill';
        if (rand < 0.15) return 'defend';
        return 'meditate';
    }

    /**
     * Sistema de Status Effects (migrado do frontend)
     */
    applyStatusEffect(characterState, effectType, duration = 3) {
        if (!characterState.statusEffects) {
            characterState.statusEffects = [];
        }
        
        characterState.statusEffects.push({
            type: effectType,
            duration: duration,
            appliedAt: Date.now()
        });
    }
    
    processStatusEffects(characterState) {
        if (!characterState.statusEffects) return 0;
        
        let totalDamage = 0;
        
        characterState.statusEffects = characterState.statusEffects.filter(effect => {
            switch (effect.type) {
                case 'poison':
                    const poisonDamage = Math.floor(characterState.maxHP * 0.1);
                    characterState.currentHP = Math.max(0, characterState.currentHP - poisonDamage);
                    totalDamage += poisonDamage;
                    break;
                case 'burn':
                    const burnDamage = Math.floor(characterState.maxHP * 0.08);
                    characterState.currentHP = Math.max(0, characterState.currentHP - burnDamage);
                    totalDamage += burnDamage;
                    break;
            }
            
            effect.duration--;
            return effect.duration > 0;
        });
        
        return totalDamage;
    }

    /**
     * Sistema de Swaps (migrado do frontend)
     */
    executeSecureSwap(battleId, fromIndex, toIndex) {
        const battle = this.activeBattles.get(battleId);
        if (!battle) {
            throw new Error('Batalha não encontrada');
        }
        
        const currentPlayer = battle.currentTurn;
        const team = battle[`${currentPlayer}Team`];
        
        if (!team.characters[toIndex] || team.characters[toIndex].currentHP <= 0) {
            throw new Error('Não é possível trocar para personagem desmaiado');
        }
        
        if (team.activeIndex === toIndex) {
            throw new Error('Personagem já está ativo');
        }
        
        if (team.swapsUsed >= team.maxSwaps) {
            throw new Error('Máximo de trocas por turno atingido');
        }
        
        const oldActiveChar = team.characters[team.activeIndex];
        team.activeIndex = toIndex;
        team.swapsUsed++;
        
        // Log da troca
        battle.battleLog.push({
            type: 'swap',
            player: currentPlayer,
            fromCharacter: oldActiveChar.id,
            toCharacter: team.characters[toIndex].id,
            timestamp: Date.now()
        });
        
        return {
            success: true,
            newActiveCharacter: team.characters[toIndex],
            swapsRemaining: team.maxSwaps - team.swapsUsed,
            battle: this.getSafeBattleState(battle)
        };
    }

    /**
     * Sistema de timeout e cleanup
     */
    cleanupOldBattles() {
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        
        for (const [battleId, battle] of this.activeBattles.entries()) {
            if (battle.createdAt < oneHourAgo || battle.lastAction < oneHourAgo) {
                this.activeBattles.delete(battleId);
                console.log(`🧹 Batalha ${battleId} removida (timeout)`);
            }
        }
    }

    /**
     * Estado seguro da batalha (sem stats reais)
     */
    getSafeBattleState(battle) {
        return {
            id: battle.id,
            type: battle.type,
            status: battle.status,
            currentTurn: battle.currentTurn,
            round: battle.round,
            playerTeam: {
                activeIndex: battle.playerTeam.activeIndex,
                swapsUsed: battle.playerTeam.swapsUsed,
                maxSwaps: battle.playerTeam.maxSwaps,
                characters: battle.playerTeam.characters.map(char => {
                    const baseChar = {
                        id: char.id,
                        currentHP: char.currentHP,
                        maxHP: char.maxHP,
                        currentMP: char.currentMP,
                        maxMP: char.maxMP,
                        status: char.status
                    };
                    
                    // Adicionar dados de Ânima se disponível
                    if (this.animaCooldownSystem) {
                        const animaState = this.animaCooldownSystem.getPlayerState(battle.id, char.id);
                        if (animaState) {
                            baseChar.currentAnima = animaState.currentAnima;
                            baseChar.maxAnima = animaState.maxAnima;
                            baseChar.animaPercentage = animaState.animaPercentage;
                            baseChar.activeCooldowns = animaState.activeCooldowns;
                        }
                    }
                    
                    return baseChar;
                })
            },
            enemyTeam: {
                activeIndex: battle.enemyTeam.activeIndex,
                swapsUsed: battle.enemyTeam.swapsUsed,
                maxSwaps: battle.enemyTeam.maxSwaps,
                characters: battle.enemyTeam.characters.map(char => ({
                    id: char.id,
                    currentHP: char.currentHP,
                    maxHP: char.maxHP,
                    currentMP: char.currentMP,
                    maxMP: char.maxMP,
                    status: char.status
                }))
            },
            log: battle.battleLog.slice(-10) // Últimas 10 ações apenas
        };
    }

    /**
     * Retorna apenas informações seguras da batalha (sem revelar stats do inimigo)
     */
    getSafeBattleState(battle) {
        return {
            id: battle.id,
            type: battle.type,
            status: battle.status,
            currentTurn: battle.currentTurn,
            round: battle.round,
            playerTeam: {
                activeIndex: battle.playerTeam.activeIndex,
                characters: battle.playerTeam.characters.map(char => ({
                    id: char.id,
                    currentHP: char.currentHP,
                    maxHP: char.maxHP,
                    currentMP: char.currentMP,
                    maxMP: char.maxMP,
                    position: char.position,
                    status: char.status
                })),
                swapsUsed: battle.playerTeam.swapsUsed,
                maxSwaps: battle.playerTeam.maxSwaps
            },
            enemyTeam: {
                activeIndex: battle.enemyTeam.activeIndex,
                characters: battle.enemyTeam.characters.map(char => ({
                    id: char.id,
                    currentHP: char.currentHP,
                    maxHP: char.maxHP,
                    position: char.position,
                    status: char.status
                    // Note: MP e stats de ataque/defesa são ocultados
                })),
                swapsUsed: battle.enemyTeam.swapsUsed
            },
            lastActions: battle.battleLog.slice(-5) // Últimas 5 ações apenas
        };
    }

    /**
     * Executar ação de ataque com validação anti-cheat
     */
    async executeAttack(battleId, attackerId, targetId, skillId) {
        const battle = this.activeBattles.get(battleId);
        
        if (!battle) {
            throw new Error('Batalha não encontrada');
        }

        if (battle.status !== 'active') {
            throw new Error('Batalha não está ativa');
        }

        // Validar se é o turno correto
        if (battle.currentTurn !== 'player') {
            throw new Error('Não é seu turno');
        }

        // Validar se o atacante é válido
        const activePlayerChar = battle.playerTeam.characters[battle.playerTeam.activeIndex];
        if (!activePlayerChar || activePlayerChar.id !== attackerId) {
            throw new Error('Personagem atacante inválido');
        }

        // Validar skill e custos de Ânima (buscar do servidor)
        const skill = this.getSkillFromServer(skillId);
        if (!skill) {
            throw new Error('Skill não encontrada');
        }

        // Verificar se jogador pode usar skill (Ânima + Cooldown)
        if (this.animaCooldownSystem) {
            const canUseSkill = this.animaCooldownSystem.canUseSkill(battleId, attackerId, skill);
            
            if (!canUseSkill.canUse) {
                if (!canUseSkill.hasAnima) {
                    throw new Error(`Ânima insuficiente: ${canUseSkill.currentAnima}/${canUseSkill.skillCost} necessários`);
                }
                if (canUseSkill.cooldownRemaining > 0) {
                    throw new Error(`Skill em cooldown: ${canUseSkill.cooldownRemaining} turnos restantes`);
                }
            }
        }

        // Compatibilidade com sistema antigo de MP
        if (activePlayerChar.currentMP !== undefined && skill.cost && activePlayerChar.currentMP < skill.cost) {
            throw new Error('MP insuficiente (sistema legado)');
        }

        // Executar ataque
        const target = battle.enemyTeam.characters.find(char => char.id === targetId);
        if (!target) {
            throw new Error('Alvo não encontrado');
        }

        let damage;
        if (skill.type === 'physical') {
            damage = await this.calculatePhysicalDamage(
                { id: attackerId },
                { id: targetId },
                skill
            );
        } else {
            damage = await this.calculateMagicalDamage(
                { id: attackerId },
                { id: targetId },
                skill
            );
        }

        // Usar skill no sistema de Ânima/Cooldown
        let animaResult = null;
        if (this.animaCooldownSystem) {
            try {
                animaResult = this.animaCooldownSystem.useSkill(battleId, attackerId, skill);
                console.log(`⚡ [Ânima] ${attackerId} usou ${skill.name}: -${animaResult.animaCost} Ânima`);
            } catch (error) {
                console.warn(`⚠️ [Ânima] Erro ao processar skill: ${error.message}`);
            }
        }

        // Extrair valor numérico do dano se necessário
        const finalDamage = typeof damage === 'object' ? (damage.damage || damage) : damage;

        // Aplicar dano
        target.currentHP = Math.max(0, target.currentHP - finalDamage);
        
        // Compatibilidade com sistema antigo de MP
        if (activePlayerChar.currentMP !== undefined && skill.cost) {
            activePlayerChar.currentMP -= skill.cost;
        }

        // Registrar no log
        battle.battleLog.push({
            type: 'attack',
            attacker: attackerId,
            target: targetId,
            skill: skill.name,
            damage: finalDamage,
            animaCost: animaResult ? animaResult.animaCost : (skill.animaCost || 0),
            cooldownApplied: animaResult ? animaResult.cooldownApplied : 0,
            timestamp: Date.now()
        });

        // Verificar se inimigo foi derrotado
        if (target.currentHP === 0) {
            target.status = 'defeated';
            battle.battleLog.push({
                type: 'defeat',
                character: targetId,
                timestamp: Date.now()
            });
        }

        // Verificar condições de vitória/derrota
        this.checkBattleEnd(battle);

        // Passar turno para o inimigo se batalha ainda ativa
        if (battle.status === 'active') {
            battle.currentTurn = 'enemy';
            
            // Processar regeneração de Ânima (fim do turno do jogador)
            if (this.animaCooldownSystem) {
                this.animaCooldownSystem.processAnimaRegeneration(battleId);
                console.log('💙 [Turnos] Regeneração de Ânima processada');
            }
            
            // Agendar ação do inimigo (async)
            setTimeout(async () => await this.executeEnemyTurn(battleId), 1000);
        }

        battle.lastAction = Date.now();
        
        return {
            success: true,
            battle: this.getSafeBattleState(battle),
            action: {
                damage: damage,
                targetHP: target.currentHP,
                attackerMP: activePlayerChar.currentMP
            }
        };
    }

    /**
     * Sistema de troca com validação anti-cheat
     */
    executeSwap(battleId, newActiveIndex) {
        const battle = this.activeBattles.get(battleId);
        
        if (!battle) {
            throw new Error('Batalha não encontrada');
        }

        if (battle.currentTurn !== 'player') {
            throw new Error('Não é seu turno');
        }

        if (battle.playerTeam.swapsUsed >= battle.playerTeam.maxSwaps) {
            throw new Error('Limite de trocas excedido');
        }

        if (newActiveIndex < 0 || newActiveIndex >= battle.playerTeam.characters.length) {
            throw new Error('Índice de personagem inválido');
        }

        const newChar = battle.playerTeam.characters[newActiveIndex];
        if (newChar.status !== 'active') {
            throw new Error('Personagem não está disponível');
        }

        // Executar troca
        battle.playerTeam.activeIndex = newActiveIndex;
        battle.playerTeam.swapsUsed++;

        battle.battleLog.push({
            type: 'swap',
            newActive: newChar.id,
            swapsRemaining: battle.playerTeam.maxSwaps - battle.playerTeam.swapsUsed,
            timestamp: Date.now()
        });

        battle.lastAction = Date.now();

        return {
            success: true,
            battle: this.getSafeBattleState(battle),
            swapsRemaining: battle.playerTeam.maxSwaps - battle.playerTeam.swapsUsed,
            newActiveCharacter: {
                id: newChar.id,
                name: newChar.name,
                currentHP: newChar.currentHP,
                maxHP: newChar.maxHP,
                status: newChar.status
            }
        };
    }

    /**
     * Turno automático do inimigo (IA)
     */
    async executeEnemyTurn(battleId) {
        const battle = this.activeBattles.get(battleId);
        
        if (!battle || battle.status !== 'active' || battle.currentTurn !== 'enemy') {
            return;
        }

        const activeEnemy = battle.enemyTeam.characters[battle.enemyTeam.activeIndex];
        const playerTargets = battle.playerTeam.characters.filter(char => char.status === 'active');
        
        if (playerTargets.length === 0) {
            return;
        }

        // IA simples: atacar alvo aleatório
        const target = playerTargets[Math.floor(Math.random() * playerTargets.length)];
        
        // Skill básica do inimigo
        const enemySkill = {
            id: 'basic_attack',
            name: 'Ataque Básico',
            type: 'physical',
            multiplier: 1.0,
            baseDamage: 15,
            cost: 0
        };

        const damage = await this.calculatePhysicalDamage(
            { id: activeEnemy.id },
            { id: target.id },
            enemySkill
        );

        // Aplicar dano
        target.currentHP = Math.max(0, target.currentHP - damage);

        battle.battleLog.push({
            type: 'enemy_attack',
            attacker: activeEnemy.id,
            target: target.id,
            damage: damage,
            timestamp: Date.now()
        });

        // Verificar se jogador foi derrotado
        if (target.currentHP === 0) {
            target.status = 'defeated';
        }

        // Verificar condições de batalha
        this.checkBattleEnd(battle);

        // Passar turno de volta para jogador se batalha ativa
        if (battle.status === 'active') {
            battle.currentTurn = 'player';
            battle.round++;
            
            // Processar regeneração de Ânima (fim do turno do inimigo)
            if (this.animaCooldownSystem) {
                this.animaCooldownSystem.processAnimaRegeneration(battleId);
                console.log('💙 [Turnos] Regeneração de Ânima processada (inimigo)');
            }
            
            // Reset swaps para novo turno
            battle.playerTeam.swapsUsed = 0;
            battle.enemyTeam.swapsUsed = 0;
        }

        battle.lastAction = Date.now();
    }

    /**
     * Verificar condições de fim de batalha
     */
    checkBattleEnd(battle) {
        const playerAlive = battle.playerTeam.characters.filter(char => char.status === 'active' && char.currentHP > 0);
        const enemyAlive = battle.enemyTeam.characters.filter(char => char.status === 'active' && char.currentHP > 0);

        if (playerAlive.length === 0) {
            battle.status = 'defeat';
            battle.endTime = Date.now();
            battle.battleLog.push({
                type: 'battle_end',
                result: 'defeat',
                timestamp: Date.now()
            });
            
            // Registrar resultado no sistema de balanceamento
            this._registerBattleForBalance(battle, 'enemy');
            
        } else if (enemyAlive.length === 0) {
            battle.status = 'victory';
            battle.endTime = Date.now();
            battle.battleLog.push({
                type: 'battle_end',
                result: 'victory',
                timestamp: Date.now()
            });
            
            // Registrar resultado no sistema de balanceamento
            this._registerBattleForBalance(battle, 'player');
        }
    }

    /**
     * Registrar batalha no sistema de balanceamento automático
     */
    _registerBattleForBalance(battle, winner) {
        if (!this.autoBalanceSystem) return;
        
        try {
            // Calcular estatísticas da batalha
            const duration = battle.endTime - battle.createdAt;
            
            // Extrair dados de dano dos logs
            let totalDamageDealt = 0;
            let totalDamageReceived = 0;
            const skillsUsed = [];
            
            battle.battleLog.forEach(entry => {
                if (entry.type === 'attack') {
                    totalDamageDealt += entry.damage || 0;
                    
                    if (entry.animaCost || entry.cooldownApplied) {
                        skillsUsed.push({
                            id: entry.skill,
                            damage: entry.damage || 0,
                            animaCost: entry.animaCost || 0,
                            cooldown: entry.cooldownApplied || 0
                        });
                    }
                } else if (entry.type === 'enemy_attack') {
                    totalDamageReceived += entry.damage || 0;
                }
            });
            
            // Preparar dados para análise
            const battleResult = {
                battleId: battle.id,
                duration: duration,
                winner: winner,
                playerTeam: battle.playerTeam.characters.map(char => ({
                    id: char.id,
                    finalHP: char.currentHP,
                    damageDealt: 0 // Será calculado pelos logs se necessário
                })),
                enemyTeam: battle.enemyTeam.characters.map(char => ({
                    id: char.id,
                    finalHP: char.currentHP,
                    damageDealt: 0
                })),
                totalDamageDealt,
                totalDamageReceived,
                skillsUsed
            };
            
            // Registrar no sistema de balanceamento
            this.autoBalanceSystem.registerBattleResult(battleResult);
            
        } catch (error) {
            console.warn('⚠️ [Balance] Erro ao registrar batalha:', error.message);
        }
    }

    /**
     * Placeholder para buscar skill do servidor
     */
    getSkillFromServer(skillId) {
        // TODO: Implementar busca real do banco de skills
        const placeholderSkills = {
            'basic_attack': {
                id: 'basic_attack',
                name: 'Ataque Básico',
                type: 'physical',
                multiplier: 1.0,
                baseDamage: 10,
                cost: 0
            },
            'fire_spell': {
                id: 'fire_spell',
                name: 'Bola de Fogo',
                type: 'magical',
                multiplier: 1.5,
                baseDamage: 25,
                cost: 15
            },
            'heal': {
                id: 'heal',
                name: 'Cura',
                type: 'heal',
                multiplier: 0.3,
                baseDamage: 30,
                cost: 10
            }
        };

        return placeholderSkills[skillId];
    }

    /**
     * Limpar batalhas antigas (manutenção)
     */
    cleanupOldBattles() {
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30 minutos

        for (const [battleId, battle] of this.activeBattles.entries()) {
            if (now - battle.lastAction > maxAge) {
                this.activeBattles.delete(battleId);
                console.log(`⚔️ Batalha expirada removida: ${battleId}`);
            }
        }
    }

    /**
     * Obter estado de batalha seguro
     */
    getBattle(battleId) {
        const battle = this.activeBattles.get(battleId);
        if (!battle) {
            return null;
        }

        return this.getSafeBattleState(battle);
    }
}