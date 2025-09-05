/**
 * RPGStack Turn System - Demonstração Completa
 * Sistema de turnos com timer de 20s, prioridades e trocas
 * Versão: 4.4.1
 */

// Demonstração do sistema de turnos completo
function demonstrateTurnSystem() {
    console.log("=== DEMONSTRAÇÃO DO SISTEMA DE TURNOS RPGSTACK ===");
    
    const battle = new BattleMechanics();
    
    // Personagens de exemplo
    const player = {
        id: "player1",
        name: "Herói Aventureiro",
        hp: 100,
        maxHP: 100,
        anima: 50,
        maxAnima: 50,
        ataque: 75,
        defesa: 60,
        velocidade: 80,
        classe: "Guerreiro"
    };
    
    const enemy = {
        id: "enemy1", 
        name: "Orc Bárbaro",
        hp: 120,
        maxHP: 120,
        anima: 30,
        maxAnima: 30,
        ataque: 85,
        defesa: 45,
        velocidade: 60,
        classe: "Bárbaro",
        aiType: "aggressive"
    };
    
    // Inicializar batalha
    console.log("🎮 Inicializando batalha...");
    battle.initializeBattle(player, enemy);
    
    // === DEMONSTRAÇÃO 1: Fluxo de Turno Básico ===
    console.log("\n--- Demonstração 1: Fluxo de Turno Básico ---");
    
    // Iniciar turno do jogador
    const turnInfo1 = battle.startTurn('player');
    console.log(`🎯 Turno iniciado: ${turnInfo1.currentPlayer}`);
    console.log(`⏰ Tempo limite: ${turnInfo1.timeLimit/1000}s`);
    console.log(`🔄 Trocas restantes: ${turnInfo1.swapsRemaining}`);
    
    // Jogador declara ação de ataque
    setTimeout(() => {
        const actionResult = battle.declareAction('attack', { type: 'normal' });
        console.log(`⚔️ Ação declarada: ${actionResult.actionType} em ${actionResult.timeTaken}ms`);
        
        // Processar turno
        const processResult = battle.processTurn();
        console.log(`✅ Turno processado com sucesso`);
        
        // Finalizar turno
        battle.endTurn();
        console.log(`🔄 Turno finalizado, próximo: ${battle.battleState.turn}`);
    }, 2000);
    
    // === DEMONSTRAÇÃO 2: Sistema de Troca ===
    setTimeout(() => {
        console.log("\n--- Demonstração 2: Sistema de Troca ---");
        
        // Executar troca (não consome ação)
        try {
            const swapResult = battle.executeSwap('player1', 'player2');
            console.log(`🔄 Troca executada: ${swapResult.fromCharacter} → ${swapResult.toCharacter}`);
            console.log(`📊 Trocas restantes: ${swapResult.swapsRemaining}`);
        } catch (error) {
            console.log(`⚠️ Erro na troca: ${error.message}`);
        }
        
        // Tentar segunda troca (deve falhar)
        try {
            battle.executeSwap('player2', 'player3');
        } catch (error) {
            console.log(`🚫 Segunda troca bloqueada: ${error.message}`);
        }
    }, 5000);
    
    // === DEMONSTRAÇÃO 3: Verificação de Ações ===
    setTimeout(() => {
        console.log("\n--- Demonstração 3: Verificação de Ações ---");
        
        const actionChecks = [
            { type: 'attack', data: {} },
            { type: 'defend', data: {} },
            { type: 'meditate', data: {} },
            { type: 'skill', data: { skillId: 'fireball', animaCost: 25 } },
            { type: 'skill', data: { skillId: 'meteor', animaCost: 100 } }, // Deve falhar
        ];
        
        actionChecks.forEach(action => {
            const check = battle.canExecuteAction(action.type, action.data);
            const status = check.canExecute ? '✅' : '❌';
            const reason = check.reason ? ` (${check.reason})` : '';
            console.log(`${status} ${action.type}${reason}`);
        });
    }, 7000);
    
    // === DEMONSTRAÇÃO 4: Informações do Turno ===
    setTimeout(() => {
        console.log("\n--- Demonstração 4: Informações do Turno ---");
        
        const turnInfo = battle.getCurrentTurnInfo();
        console.log(`👤 Jogador atual: ${turnInfo.playerName}`);
        console.log(`⏱️ Fase: ${turnInfo.phase}`);
        console.log(`🕐 Tempo decorrido: ${Math.floor(turnInfo.timeElapsed/1000)}s`);
        console.log(`⏰ Tempo restante: ${Math.floor(turnInfo.timeRemaining/1000)}s`);
        console.log(`🔄 Trocas usadas: ${turnInfo.swapsUsed}/${battle.COMBAT_CONSTANTS.MAX_SWAPS_PER_TURN}`);
        console.log(`🎮 Ações disponíveis: ${turnInfo.availableActions.join(', ')}`);
    }, 9000);
    
    // === DEMONSTRAÇÃO 5: Timeout Simulado ===
    setTimeout(() => {
        console.log("\n--- Demonstração 5: Timeout Simulado ---");
        
        // Simular timeout forçado
        battle.onTurnTimeout();
        console.log(`⏰ Timeout simulado - ação padrão executada`);
    }, 12000);
}

// Demonstração de prioridades com turnos
function demonstrateTurnPriorities() {
    console.log("\n=== DEMONSTRAÇÃO DE PRIORIDADES COM TURNOS ===");
    
    const battle = new BattleMechanics();
    
    const player = {
        name: "Samurai Rápido",
        hp: 90, maxHP: 90,
        anima: 60, maxAnima: 60,
        velocidade: 95,
        classe: "Guerreiro"
    };
    
    const enemy = {
        name: "Guerreiro Pesado", 
        hp: 150, maxHP: 150,
        anima: 40, maxAnima: 40,
        velocidade: 40,
        classe: "Tanque"
    };
    
    battle.initializeBattle(player, enemy);
    
    // Cenário: Ambos declaram ações simultaneamente
    console.log("🎯 Cenário: Ações simultâneas com prioridades diferentes");
    
    // Player usa ataque normal (prioridade 0)
    battle.startTurn('player');
    battle.declareAction('attack', { type: 'normal' });
    console.log("⚔️ Player declara: Ataque Normal (Prioridade 0)");
    
    // Enemy usa defesa (prioridade +1)
    battle.startTurn('enemy');
    battle.declareAction('defend', {});
    console.log("🛡️ Enemy declara: Defesa (Prioridade +1)");
    
    // Simular processamento conjunto
    setTimeout(() => {
        console.log("\n📊 Ordem de execução baseada em prioridade:");
        const preview = battle.getExecutionOrderPreview();
        preview.forEach((action, index) => {
            console.log(`${index + 1}. ${action.actor} - ${action.actionType} (Prioridade: ${action.priority})`);
        });
        
        // Processar queue
        battle.processPriorityQueue();
        console.log("✅ Ações processadas por ordem de prioridade!");
    }, 2000);
}

// Demonstração de skills culturais com prioridades e turnos
function demonstrateCulturalTurnSkills() {
    console.log("\n=== SKILLS CULTURAIS COM SISTEMA DE TURNOS ===");
    
    const battle = new BattleMechanics();
    
    // Personagem japonês
    const samurai = {
        name: "Takeshi Yamamoto",
        cultura: "Japonesa",
        hp: 85, maxHP: 85,
        anima: 70, maxAnima: 70,
        velocidade: 90,
        classe: "Guerreiro",
        skills: ["iai_draw", "bushido_honor", "zen_meditation"]
    };
    
    // Personagem romano
    const legionnaire = {
        name: "Marcus Aurelius",
        cultura: "Romana",
        hp: 120, maxHP: 120,
        anima: 50, maxAnima: 50,
        velocidade: 65,
        classe: "Tanque",
        skills: ["testudo_formation", "gladius_strike", "legion_command"]
    };
    
    battle.initializeBattle(samurai, legionnaire);
    
    // Demonstrar skills com prioridades culturais específicas
    const culturalSkills = [
        {
            character: 'player',
            skill: {
                id: 'iai_draw',
                name: '🗾 Iai - Corte Instantâneo',
                priority: 2,
                animaCost: 30,
                description: 'Técnica samurai ultra-rápida'
            }
        },
        {
            character: 'enemy',
            skill: {
                id: 'testudo_formation',
                name: '🛡️ Formação Testudo',
                priority: 1,
                animaCost: 25,
                description: 'Defesa coordenada romana'
            }
        }
    ];
    
    console.log("⚔️ Batalha cultural: Samurai vs Legionário Romano");
    
    culturalSkills.forEach((entry, index) => {
        setTimeout(() => {
            battle.startTurn(entry.character);
            console.log(`\n🎯 Turno ${index + 1}: ${battle.battleState[entry.character].name}`);
            
            battle.declareAction('skill', {
                skillId: entry.skill.id,
                name: entry.skill.name,
                animaCost: entry.skill.animaCost,
                culturalDescription: entry.skill.description
            });
            
            // Adicionar skill com prioridade específica
            battle.queueSkill(entry.character, entry.skill, entry.skill.priority);
            
            console.log(`🌸 Skill declarada: ${entry.skill.name} (Prioridade: ${entry.skill.priority})`);
            console.log(`📜 "${entry.skill.description}"`);
            
        }, (index + 1) * 3000);
    });
    
    // Processar skills culturais
    setTimeout(() => {
        console.log("\n🏛️ Processando confronto cultural:");
        const preview = battle.getExecutionOrderPreview();
        preview.forEach((action, index) => {
            console.log(`${index + 1}. ${action.actor} - ${action.actionType} (Prioridade: ${action.priority})`);
        });
        
        battle.processPriorityQueue();
        console.log("🎌 Honra e disciplina se encontram no campo de batalha!");
    }, 8000);
}

// Sistema de timer em tempo real (para demonstração visual)
function demonstrateRealTimeTimer() {
    console.log("\n=== TIMER EM TEMPO REAL ===");
    
    const battle = new BattleMechanics();
    
    const player = { name: "Jogador Teste", hp: 100, maxHP: 100, anima: 50, maxAnima: 50, velocidade: 70 };
    const enemy = { name: "Inimigo Teste", hp: 100, maxHP: 100, anima: 30, maxAnima: 30, velocidade: 50 };
    
    battle.initializeBattle(player, enemy);
    
    // Callback para avisos de tempo
    battle.onTimeWarningCallback = () => {
        console.log("⚠️ AVISO: 5 segundos restantes!");
    };
    
    console.log("⏰ Iniciando turno com timer real de 20 segundos...");
    console.log("💡 Aguarde ou declare uma ação antes do timeout!");
    
    battle.startTurn('player');
    
    // Mostrar countdown
    const startTime = Date.now();
    const countdownInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, battle.COMBAT_CONSTANTS.TURN_TIME_LIMIT - elapsed);
        const seconds = Math.ceil(remaining / 1000);
        
        if (seconds > 0) {
            process.stdout.write(`\r⏰ Tempo restante: ${seconds}s `);
        } else {
            console.log("\n🔔 Tempo esgotado!");
            clearInterval(countdownInterval);
        }
    }, 1000);
    
    // Simular ação do jogador aos 8 segundos
    setTimeout(() => {
        if (battle.battleState.turnPhase === 'action_select') {
            clearInterval(countdownInterval);
            console.log("\n⚔️ Jogador declara ataque!");
            battle.declareAction('attack', { type: 'quick' });
            battle.processTurn();
        }
    }, 8000);
}

// Executar demonstrações quando o arquivo for carregado
if (typeof window !== 'undefined') {
    // Browser environment
    document.addEventListener('DOMContentLoaded', () => {
        console.log("🎮 RPGStack Turn System Demo carregado!");
        console.log("Funções disponíveis:");
        console.log("- demonstrateTurnSystem()");
        console.log("- demonstrateTurnPriorities()"); 
        console.log("- demonstrateCulturalTurnSkills()");
        console.log("- demonstrateRealTimeTimer()");
        
        // Tornar funções globais
        window.demonstrateTurnSystem = demonstrateTurnSystem;
        window.demonstrateTurnPriorities = demonstrateTurnPriorities;
        window.demonstrateCulturalTurnSkills = demonstrateCulturalTurnSkills;
        window.demonstrateRealTimeTimer = demonstrateRealTimeTimer;
    });
} else {
    // Node.js environment
    if (require.main === module) {
        // Executar demonstrações sequencialmente
        demonstrateTurnSystem();
        
        setTimeout(() => {
            demonstrateTurnPriorities();
        }, 15000);
        
        setTimeout(() => {
            demonstrateCulturalTurnSkills();
        }, 20000);
        
        // Timer real por último
        setTimeout(() => {
            demonstrateRealTimeTimer();
        }, 35000);
    }
}

// Export para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        demonstrateTurnSystem,
        demonstrateTurnPriorities,
        demonstrateCulturalTurnSkills,
        demonstrateRealTimeTimer
    };
}