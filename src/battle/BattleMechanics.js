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
        
        // Carregar skills completas do sistema de skills
        const skillsWithDetails = [];
        console.log(`🔍 [SKILL DEBUG] Carregando skills para ${characterId}:`, character.name);
        console.log(`🔍 [SKILL DEBUG] Skills do personagem:`, character.skills);
        
        if (character.skills && Array.isArray(character.skills)) {
            for (const skillRef of character.skills) {
                const skillId = skillRef.skillId || skillRef.id || skillRef;
                console.log(`🔍 [SKILL DEBUG] Tentando carregar skill ${skillId}`);
                try {
                    const skill = await this.getSkillFromServer(skillId);
                    if (skill) {
                        console.log(`✅ [SKILL DEBUG] Skill carregada:`, skill.name);
                        skillsWithDetails.push({
                            skillId: skill.id,
                            name: skill.name,
                            description: skill.description,
                            damage: skill.damage,
                            anima_cost: skill.anima_cost,
                            cooldown: skill.cooldown,
                            type: skill.type,
                            effects: skill.effects || [],
                            source: skillRef.source || 'skills_module'
                        });
                    } else {
                        console.warn(`⚠️ [SKILL DEBUG] Skill ${skillId} não encontrada no servidor`);
                    }
                } catch (error) {
                    console.warn(`⚠️ Erro ao carregar skill ${skillId} para ${characterId}:`, error.message);
                }
            }
        } else {
            console.warn(`⚠️ [SKILL DEBUG] Personagem ${characterId} não tem skills ou skills não é um array:`, character.skills);
        }
        
        console.log(`🎯 [SKILL DEBUG] Total de ${skillsWithDetails.length} skills carregadas para ${characterId}`);
        
        return {
            id: characterId,
            name: character.name || `Character ${characterId}`,
            currentHP: character.hp || character.maxHP || 100,
            maxHP: character.hp || character.maxHP || 100,
            currentMP: character.mp || character.maxMP || character.anima || 50,
            maxMP: character.mp || character.maxMP || character.anima || 50,
            status: 'active',
            buffs: [],
            debuffs: [],
            skills: skillsWithDetails,
            classe: character.classe,
            cultura: character.cultura,
            sprite: character.sprite
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
     * Sistema de Efeitos com Coeficientes Dinâmicos
     */
    async processSkillEffects(skill, attacker, target, battleId) {
        const results = {
            damage: 0,
            healing: 0,
            statusEffects: [],
            buffs: [],
            specialActions: [],
            battlefieldEffects: []
        };

        if (!skill.effects || skill.effects.length === 0) {
            return results;
        }

        for (const effectType of skill.effects) {
            switch (effectType) {
                case 'multi_hit':
                    if (skill.multi_hit) {
                        const multiHitResult = await this.processMultiHitEffect(skill.multi_hit, attacker, target);
                        results.damage += multiHitResult.totalDamage;
                        results.specialActions.push(`Multi-Hit: ${multiHitResult.hits} ataques por ${multiHitResult.damagePerHit} cada`);
                    }
                    break;

                case 'critical_boost':
                    if (skill.buffs && skill.buffs.critical_rate) {
                        const buff = skill.buffs.critical_rate;
                        results.buffs.push({
                            type: 'critical_rate',
                            target: 'attacker',
                            bonus: buff.bonus,
                            duration: buff.duration,
                            description: buff.description
                        });
                    }
                    break;

                case 'physical_reduction':
                    if (skill.buffs && skill.buffs.physical_reduction) {
                        const buff = skill.buffs.physical_reduction;
                        results.buffs.push({
                            type: 'physical_reduction',
                            target: 'attacker',
                            reduction: buff.reduction_percentage,
                            duration: buff.duration,
                            description: buff.description
                        });
                    }
                    break;

                case 'critical_immunity':
                    if (skill.buffs && skill.buffs.critical_immunity) {
                        const buff = skill.buffs.critical_immunity;
                        results.buffs.push({
                            type: 'critical_immunity',
                            target: 'attacker',
                            immunity: true,
                            duration: buff.duration,
                            description: buff.description
                        });
                    }
                    break;

                case 'healing':
                    const healAmount = skill.damage || 50; // Skills de cura usam campo damage como heal amount
                    results.healing += healAmount;
                    results.specialActions.push(`Cura: +${healAmount} HP`);
                    break;

                case 'intangibility':
                    results.buffs.push({
                        type: 'intangibility',
                        target: 'attacker',
                        immunity: true,
                        duration: skill.duration || 2,
                        description: 'Intangível a ataques físicos'
                    });
                    break;

                case 'spiritual_stun':
                    results.statusEffects.push({
                        type: 'spiritual_stun',
                        target: 'enemy',
                        duration: skill.duration || 1,
                        description: 'Atordoamento espiritual - perde próximo turno'
                    });
                    break;

                case 'commercial_immunity':
                    if (skill.buffs && skill.buffs.commercial_immunity) {
                        const buff = skill.buffs.commercial_immunity;
                        results.buffs.push({
                            type: 'commercial_immunity',
                            target: 'attacker',
                            affinity_immunity: buff.affinity_immunity,
                            duration: buff.duration,
                            description: buff.description
                        });
                    }
                    break;

                case 'battlefield_commercial_restriction':
                    if (skill.battlefield_effects && skill.battlefield_effects.commercial_restriction) {
                        const effect = skill.battlefield_effects.commercial_restriction;
                        results.battlefieldEffects = results.battlefieldEffects || [];
                        results.battlefieldEffects.push({
                            type: 'commercial_restriction',
                            target: effect.target,
                            restriction_type: effect.restriction_type,
                            restricted_affinity: effect.restricted_affinity,
                            duration: effect.duration,
                            description: effect.description
                        });
                    }
                    break;

                default:
                    // Efeitos genéricos que não requerem processamento especial
                    console.log(`ℹ️  Efeito genérico aplicado: ${effectType}`);
                    results.specialActions.push(`Efeito: ${effectType}`);
                    break;
            }
        }

        return results;
    }

    async processMultiHitEffect(multiHitData, attacker, target) {
        const { hits, damage_per_hit, independent_crits } = multiHitData;
        let totalDamage = 0;
        const hitResults = [];

        for (let i = 0; i < hits; i++) {
            let hitDamage = damage_per_hit;
            
            // Aplicar chance crítica independente para cada hit se configurado
            if (independent_crits) {
                const critChance = 0.15; // 15% base critical chance
                if (Math.random() < critChance) {
                    hitDamage = Math.floor(hitDamage * 1.5);
                    hitResults.push({ hit: i + 1, damage: hitDamage, critical: true });
                } else {
                    hitResults.push({ hit: i + 1, damage: hitDamage, critical: false });
                }
            } else {
                hitResults.push({ hit: i + 1, damage: hitDamage, critical: false });
            }
            
            totalDamage += hitDamage;
        }

        return {
            totalDamage,
            hits,
            damagePerHit: damage_per_hit,
            hitResults
        };
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
                    name: char.name,
                    currentHP: char.currentHP,
                    maxHP: char.maxHP,
                    currentMP: char.currentMP,
                    maxMP: char.maxMP,
                    position: char.position,
                    status: char.status,
                    skills: char.skills, // ✅ Incluir skills do jogador
                    classe: char.classe,
                    cultura: char.cultura,
                    sprite: char.sprite
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
                    // Note: Ânima e stats de ataque/defesa são ocultados
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
        // console.log('🔍 [DEBUG] ===== executeAttack START =====');
        // console.log('🔍 [DEBUG] executeAttack called:', { battleId, attackerId, targetId, skillId });
        
        const battle = this.activeBattles.get(battleId);
        // console.log('🔍 [DEBUG] Battle found:', !!battle);
        
        if (!battle) {
            throw new Error('Batalha não encontrada');
        }

        // console.log('🔍 [DEBUG] Battle status:', battle.status);
        if (battle.status !== 'active') {
            throw new Error('Batalha não está ativa');
        }

        // console.log('🔍 [DEBUG] Current turn:', battle.currentTurn);
        // Validar se é o turno correto
        if (battle.currentTurn !== 'player') {
            throw new Error('Não é seu turno');
        }

        // Validar se o atacante é válido
        const activePlayerChar = battle.playerTeam.characters[battle.playerTeam.activeIndex];
        // console.log('🔍 [DEBUG] Active player char:', activePlayerChar?.id, 'Expected:', attackerId);
        if (!activePlayerChar || activePlayerChar.id !== attackerId) {
            throw new Error('Personagem atacante inválido');
        }

        // Buscar skill se fornecida, null para ataque básico
        let skill = null;
        if (skillId) {
            skill = await this.getSkillFromServer(skillId);
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

            // Compatibilidade com sistema antigo de Ânima
            if (activePlayerChar.currentAnima !== undefined && skill.cost && activePlayerChar.currentAnima < skill.cost) {
                throw new Error('Ânima insuficiente (sistema legado)');
            }
        }

        // Executar ataque
        const target = battle.enemyTeam.characters.find(char => char.id === targetId);
        if (!target) {
            throw new Error('Alvo não encontrado');
        }

        // Para ataques básicos (sem skill), usar cálculo simples
        let baseDamage;
        let effectsResult = { damage: 0, effects: [], buffs: [], statusEffects: [] };
        
        // console.log('🔍 [DEBUG] About to process skill/effects, skill:', skill);
        
        if (skill) {
            // Processar efeitos da skill com coeficientes dinâmicos
            try {
                effectsResult = await this.processSkillEffects(skill, activePlayerChar, target, battleId);
                // console.log('🔍 [DEBUG] processSkillEffects completed:', effectsResult);
            } catch (error) {
                console.error('❌ [DEBUG] Error in processSkillEffects:', error);
                throw error;
            }
            
            // Calcular dano base da skill
            if (skill.type === 'physical') {
                baseDamage = await this.calculatePhysicalDamage(
                    { id: attackerId },
                    { id: targetId },
                    skill
                );
            } else {
                baseDamage = await this.calculateMagicalDamage(
                    { id: attackerId },
                    { id: targetId },
                    skill
                );
            }
        } else {
            // Ataque básico sem skill
            baseDamage = await this.calculatePhysicalDamage(
                { id: attackerId },
                { id: targetId },
                null
            );
        }

        // Combinar dano base com dano dos efeitos
        // console.log('🔍 [DEBUG] baseDamage:', baseDamage, 'effectsResult.damage:', effectsResult.damage);
        const baseDamageValue = typeof baseDamage === 'object' ? (baseDamage.damage || baseDamage) : baseDamage;
        const totalDamage = baseDamageValue + effectsResult.damage;
        // console.log('🔍 [DEBUG] totalDamage calculated:', totalDamage);

        // Usar skill no sistema de Ânima/Cooldown (apenas se skill existir)
        let animaResult = null;
        if (this.animaCooldownSystem && skill) {
            try {
                animaResult = this.animaCooldownSystem.useSkill(battleId, attackerId, skill);
                console.log(`⚡ [Ânima] ${attackerId} usou ${skill.name}: -${animaResult.animaCost} Ânima`);
            } catch (error) {
                console.warn(`⚠️ [Ânima] Erro ao processar skill: ${error.message}`);
            }
        }

        // Usar o dano já calculado
        const finalDamage = totalDamage;
        // console.log('🔍 [DEBUG] finalDamage set to:', finalDamage);

        // Aplicar dano
        // console.log('🔍 [DEBUG] About to apply finalDamage:', finalDamage);
        if (finalDamage > 0) {
            target.currentHP = Math.max(0, target.currentHP - finalDamage);
        }
        // console.log('🔍 [DEBUG] Damage applied successfully');

        // Aplicar cura no atacante se houver
        if (effectsResult.healing > 0) {
            activePlayerChar.currentHP = Math.min(
                activePlayerChar.maxHP, 
                activePlayerChar.currentHP + effectsResult.healing
            );
        }

        // Aplicar buffs no atacante
        for (const buff of effectsResult.buffs) {
            if (buff.target === 'attacker') {
                this.applyStatusEffect(activePlayerChar, buff.type, buff.duration);
            }
        }

        // Aplicar status effects no alvo
        for (const statusEffect of effectsResult.statusEffects) {
            if (statusEffect.target === 'enemy') {
                this.applyStatusEffect(target, statusEffect.type, statusEffect.duration);
            }
        }
        
        // Compatibilidade com sistema antigo de Ânima
        if (activePlayerChar.currentAnima !== undefined && skill && skill.cost) {
            activePlayerChar.currentAnima -= skill.cost;
        }

        // Registrar no log com detalhes dos efeitos
        battle.battleLog.push({
            type: 'attack',
            attacker: attackerId,
            target: targetId,
            skill: skill ? skill.name : 'Ataque Básico',
            damage: finalDamage,
            healing: effectsResult.healing,
            effects: effectsResult.specialActions,
            buffs: effectsResult.buffs.map(b => b.type),
            statusEffects: effectsResult.statusEffects.map(s => s.type),
            animaCost: animaResult ? animaResult.animaCost : (skill ? skill.animaCost || 0 : 0),
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
        
        // console.log('🔍 [DEBUG] Returning attack result with finalDamage:', finalDamage);
        
        return {
            success: true,
            battle: this.getSafeBattleState(battle),
            action: {
                damage: finalDamage,
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
        if (!newChar || newChar.currentHP <= 0) {
            throw new Error('Personagem não está disponível para troca');
        }

        if (newActiveIndex === battle.playerTeam.activeIndex) {
            throw new Error('Personagem já está ativo');
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
        
        // Inimigo ataca sem skill específica
        const damageResult = await this.calculatePhysicalDamage(
            { id: activeEnemy.id },
            { id: target.id },
            null
        );

        // Extrair valor do dano
        const damage = typeof damageResult === 'object' ? damageResult.damage : damageResult;

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
     * Buscar skill do sistema de skills integrado
     */
    async getSkillFromServer(skillId) {
        try {
            // Tentar carregar do banco de dados de skills
            const skillsPath = path.join(process.cwd(), 'data/skills.json');
            const skillsData = JSON.parse(await fs.readFile(skillsPath, 'utf8'));
            
            const skill = skillsData.skills[skillId];
            if (skill) {
                return skill;
            }
            
        } catch (error) {
            console.warn(`⚠️ Erro ao carregar skill ${skillId}:`, error.message);
        }
        
        // Skills hardcoded disponíveis
        const hardcodedSkills = {
            'fire_spell': {
                id: 'fire_spell',
                name: 'Bola de Fogo',
                type: 'magic',
                damage: 25,
                anima_cost: 15,
                cooldown: 1,
                duration: 0,
                effects: []
            },
            'heal': {
                id: 'heal',
                name: 'Cura',
                type: 'healing',
                damage: 30, // Healing skills use damage field for heal amount
                anima_cost: 10,
                cooldown: 0,
                duration: 0,
                effects: ['healing']
            }
        };

        // Retornar skill hardcoded se existir
        if (hardcodedSkills[skillId]) {
            return hardcodedSkills[skillId];
        }

        // Skill não encontrada
        console.warn(`Skill '${skillId}' não encontrada`);
        return null;
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