/**
 * Exemplo Completo de Uso - TurnSystem TCG
 * Demonstra como usar o sistema de turnos em uma batalha real
 */

import { TurnSystem } from './TurnSystem.js';
import { PassiveTriggerSystem } from './PassiveTriggerSystem.js';

export class TurnSystemExample {
    constructor() {
        // Inicializar sistema de turnos
        this.turnSystem = new TurnSystem();
        
        // Configurar para exemplo
        this.turnSystem.setConfig({
            maxTurns: 10,
            autoAdvance: false,
            debugMode: true,
            validateMoves: true
        });

        this.setupExampleBattle();
    }

    /**
     * Configurar batalha de exemplo com 2 jogadores
     */
    setupExampleBattle() {
        const players = [
            {
                id: 'player1',
                name: 'Aurelius Ignisvox',
                culture: 'Romana',
                resources: {
                    health: 100,
                    maxHealth: 100,
                    anima: 20,
                    maxAnima: 30
                },
                stats: {
                    attack: 180,
                    defense: 60,
                    specialAttack: 150,
                    spirit: 80
                },
                statusEffects: [],
                buffs: [],
                debuffs: [],
                skills: [
                    { id: 'roman_discipline', name: 'Disciplina Romana', animaCost: 15 },
                    { id: 'gladius_strike', name: 'Golpe de Gládio', animaCost: 10 }
                ],
                isActive: true,
                passiveAbilities: ['disciplina_militar_romana']
            },
            {
                id: 'player2', 
                name: 'Shi Wuxing',
                culture: 'Chinesa',
                resources: {
                    health: 90,
                    maxHealth: 90,
                    anima: 25,
                    maxAnima: 35
                },
                stats: {
                    attack: 160,
                    defense: 70,
                    specialAttack: 220,
                    spirit: 140
                },
                statusEffects: [],
                buffs: [],
                debuffs: [],
                skills: [
                    { id: 'elemental_harmony', name: 'Harmonia dos Elementos', animaCost: 20 },
                    { id: 'qi_blast', name: 'Rajada de Qi', animaCost: 12 }
                ],
                isActive: true,
                passiveAbilities: ['harmonia_dos_elementos']
            }
        ];

        // Inicializar jogadores no sistema
        this.turnSystem.initializePlayers(players, 'battle_example_001');

        console.log('🎮 Batalha de Exemplo Inicializada!');
        console.log(`👥 Jogadores: ${players.map(p => p.name).join(' vs ')}`);
        console.log('📋 Sistema pronto para começar');
    }

    /**
     * Executar exemplo de batalha completa
     */
    async runCompleteBattleExample() {
        console.log('\n🚀 === INICIANDO BATALHA DE EXEMPLO ===\n');

        // Registrar alguns efeitos de exemplo
        this.registerExampleEffects();

        let battleEnded = false;
        let maxTurns = 6; // Limitar para exemplo
        let turnCount = 0;

        while (!battleEnded && turnCount < maxTurns) {
            console.log(`\n🎯 === TURNO ${turnCount + 1} ===`);
            
            // Executar turno completo do jogador atual
            const turnResult = await this.executeExamplePlayerTurn();
            
            // Verificar condições de fim de jogo
            battleEnded = this.checkBattleEnd(turnResult);
            
            if (battleEnded) {
                console.log('\n🏁 Batalha finalizada!');
                break;
            }

            turnCount++;
        }

        return this.getBattleSummary();
    }

    /**
     * Executar turno de exemplo com ações personalizadas
     */
    async executeExamplePlayerTurn() {
        const currentPlayer = this.turnSystem.getCurrentPlayer();
        
        console.log(`\n👤 Turno do jogador: ${currentPlayer.name} (${currentPlayer.culture})`);
        console.log(`❤️ HP: ${currentPlayer.resources.health}/${currentPlayer.resources.maxHealth}`);
        console.log(`💙 Ânima: ${currentPlayer.resources.anima}/${currentPlayer.resources.maxAnima}`);

        // Simular diferentes ações por fase
        const actionData = {
            checkPhase: {
                action: 'verify_conditions',
                checks: ['health', 'anima', 'status_effects']
            },
            playerPhase: {
                action: 'use_skill',
                skillId: currentPlayer.skills[Math.floor(Math.random() * currentPlayer.skills.length)].id,
                target: 'opponent'
            },
            endPhase: {
                action: 'cleanup',
                regenerateAnima: true
            }
        };

        // Executar turno completo (3 fases)
        const result = await this.turnSystem.executePlayerTurn('battle_example_001', actionData);

        console.log(`✅ Turno de ${result.playerName} concluído`);
        console.log(`📊 Fases executadas: ${result.phases.length}`);

        return result;
    }

    /**
     * Demonstrar controle manual de fases
     */
    async demonstratePhaseControl() {
        console.log('\n🎮 === DEMONSTRAÇÃO DE CONTROLE DE FASES ===\n');

        const currentPlayer = this.turnSystem.getCurrentPlayer();
        console.log(`👤 Jogador atual: ${currentPlayer.name}`);

        // 1. Executar apenas próxima fase
        console.log('\n🔄 Executando próxima fase...');
        let status = await this.turnSystem.nextStep('battle_example_001', {
            action: 'custom_check',
            data: { type: 'manual_control' }
        });
        console.log(`📍 Fase atual: ${status.currentPhase}`);

        // 2. Pular para fase específica
        console.log('\n⏭️ Pulando para END PHASE...');
        status = this.turnSystem.skipToPhase('END');
        console.log(`📍 Nova fase: ${status.currentPhase}`);

        // 3. Executar fase final
        console.log('\n🔄 Executando fase END...');
        status = await this.turnSystem.nextStep('battle_example_001', {
            action: 'end_turn',
            cleanup: true
        });

        console.log(`✅ Demonstração de controle concluída`);
        return status;
    }

    /**
     * Registrar efeitos de exemplo
     */
    registerExampleEffects() {
        // Efeito de regeneração de Ânima na fase CHECK
        this.turnSystem.registerEffect('checkPhase', {
            id: 'anima_regen',
            name: 'Regeneração de Ânima',
            execute: async (gameState, player) => {
                if (player.resources.anima < player.resources.maxAnima) {
                    player.resources.anima = Math.min(
                        player.resources.anima + 5,
                        player.resources.maxAnima
                    );
                    return `${player.name} regenerou 5 pontos de Ânima`;
                }
                return null;
            },
            duration: null // Permanente
        });

        // Efeito de dano contínuo (veneno) na fase END
        this.turnSystem.registerEffect('endPhase', {
            id: 'poison_damage',
            name: 'Dano de Veneno',
            execute: async (gameState, player) => {
                const poisonEffects = player.statusEffects.filter(e => e.type === 'poison');
                if (poisonEffects.length > 0) {
                    const damage = poisonEffects.reduce((total, effect) => total + (effect.damage || 5), 0);
                    player.resources.health -= damage;
                    return `${player.name} sofreu ${damage} de dano por veneno`;
                }
                return null;
            },
            condition: (gameState, player) => {
                return player.statusEffects.some(e => e.type === 'poison');
            }
        });

        // Efeito de buff temporário
        this.turnSystem.registerEffect('playerPhase', {
            id: 'combat_focus',
            name: 'Foco de Combate',
            execute: async (gameState, player) => {
                if (!player.buffs.some(b => b.type === 'combat_focus')) {
                    player.buffs.push({
                        type: 'combat_focus',
                        value: 10,
                        duration: 3,
                        description: '+10 Attack'
                    });
                    return `${player.name} ganhou Foco de Combate (+10 Attack por 3 turnos)`;
                }
                return null;
            },
            duration: 1 // Só executa uma vez
        });

        console.log('⚡ Efeitos de exemplo registrados no sistema');
    }

    /**
     * Verificar condições de fim de batalha
     */
    checkBattleEnd(turnResult) {
        const players = this.turnSystem.players;
        
        // Verificar se algum jogador morreu
        for (const player of players) {
            if (player.resources.health <= 0) {
                console.log(`💀 ${player.name} foi derrotado!`);
                return true;
            }
        }

        // Verificar se atingiu máximo de turnos
        if (turnResult.gameEnded) {
            console.log('⏰ Batalha encerrada por limite de turnos');
            return true;
        }

        return false;
    }

    /**
     * Obter resumo da batalha
     */
    getBattleSummary() {
        const status = this.turnSystem.getGameStatus();
        
        return {
            battleId: 'battle_example_001',
            turnNumber: status.turnNumber,
            totalTurnsPassed: status.turnsPassed,
            players: status.players.map(p => ({
                name: p.name,
                culture: p.culture,
                healthPercentage: Math.floor((p.health / p.maxHealth) * 100),
                animaPercentage: Math.floor((p.anima / p.maxAnima) * 100),
                statusEffects: p.statusEffects,
                isAlive: p.health > 0
            })),
            winner: status.players.find(p => p.health > 0)?.name || 'Empate',
            gameEnded: status.gameEnded,
            activeEffects: status.activeEffects
        };
    }

    /**
     * Demonstrar sistema de eventos personalizados
     */
    async demonstrateCustomEvents() {
        console.log('\n🎭 === DEMONSTRAÇÃO DE EVENTOS PERSONALIZADOS ===\n');

        // Simular evento de skill crítica
        await this.triggerCustomEvent('critical_hit', {
            player: this.turnSystem.getCurrentPlayer(),
            skill: 'gladius_strike',
            damage: 150,
            criticalMultiplier: 1.5
        });

        // Simular evento de morte iminente
        const lowHpPlayer = this.turnSystem.players.find(p => p.resources.health < 30);
        if (lowHpPlayer) {
            await this.triggerCustomEvent('low_health_warning', {
                player: lowHpPlayer,
                threshold: 25,
                triggeredAbilities: ['furia_berserker', 'forca_dos_ancestrais']
            });
        }

        // Simular evento de combo de skills
        await this.triggerCustomEvent('skill_combo', {
            player: this.turnSystem.getCurrentPlayer(),
            skills: ['elemental_harmony', 'qi_blast'],
            comboBonus: 20,
            description: 'Combo dos Elementos'
        });

        console.log('✨ Eventos personalizados demonstrados');
    }

    /**
     * Triggerar evento personalizado
     */
    async triggerCustomEvent(eventType, eventData) {
        console.log(`🎆 Evento: ${eventType}`);
        
        switch (eventType) {
            case 'critical_hit':
                console.log(`💥 ${eventData.player.name} acertou um golpe crítico com ${eventData.skill}!`);
                console.log(`⚔️ Dano: ${eventData.damage} x${eventData.criticalMultiplier} = ${eventData.damage * eventData.criticalMultiplier}`);
                break;
                
            case 'low_health_warning':
                console.log(`⚠️ ${eventData.player.name} está com HP baixo (${eventData.player.resources.health})!`);
                console.log(`🔥 Habilidades ativadas: ${eventData.triggeredAbilities.join(', ')}`);
                break;
                
            case 'skill_combo':
                console.log(`🌟 ${eventData.player.name} executou combo: ${eventData.description}!`);
                console.log(`⭐ Skills: ${eventData.skills.join(' + ')}`);
                console.log(`📈 Bônus de combo: +${eventData.comboBonus}`);
                break;
                
            default:
                console.log(`❓ Evento desconhecido: ${eventType}`);
        }
    }

    /**
     * Executar demonstração completa
     */
    async runFullDemo() {
        console.log('🎮 === DEMONSTRAÇÃO COMPLETA DO TURNSYSTEM ===');
        
        // 1. Batalha automática
        const battleResult = await this.runCompleteBattleExample();
        console.log('\n📊 Resultado da batalha:', battleResult);
        
        // 2. Controle manual de fases
        await this.demonstratePhaseControl();
        
        // 3. Eventos personalizados
        await this.demonstrateCustomEvents();
        
        // 4. Status final
        const finalStatus = this.turnSystem.getGameStatus();
        console.log('\n🏁 Status final:', finalStatus);
        
        console.log('\n✅ Demonstração completa finalizada!');
        return {
            battleResult,
            finalStatus,
            success: true
        };
    }
}

// Exemplo de uso direto
export async function runTurnSystemExample() {
    const example = new TurnSystemExample();
    return await example.runFullDemo();
}

// Para testes
if (import.meta.url === `file://${process.argv[1]}`) {
    runTurnSystemExample()
        .then(result => {
            console.log('\n🎊 Exemplo executado com sucesso!');
            console.log(JSON.stringify(result, null, 2));
        })
        .catch(error => {
            console.error('❌ Erro no exemplo:', error);
        });
}