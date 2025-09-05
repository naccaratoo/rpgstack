/**
 * RPGStack Priority System - Exemplo de Uso
 * Demonstra como usar o novo sistema de prioridade no battlemechanics.js
 * Versão: 4.4.0
 */

// Exemplo de uso do sistema de prioridade
function demonstratePrioritySystem() {
    // Inicializar battle mechanics
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
    console.log("=== INICIANDO BATALHA COM SISTEMA DE PRIORIDADE ===");
    battle.initializeBattle(player, enemy);
    
    // === EXEMPLO 1: Ações Básicas com Diferentes Prioridades ===
    console.log("\n--- Exemplo 1: Ações Básicas ---");
    
    // Player usa ataque normal (Prioridade 0)
    battle.queueAttack('player', { type: 'normal' });
    
    // Enemy usa defesa (Prioridade +1) - vai primeiro!
    battle.queueDefend('enemy');
    
    // Player usa ataque rápido (Prioridade +1)
    battle.queueQuickAttack('player', { damage: 50 });
    
    // Mostrar ordem de execução
    console.log("Ordem de execução prevista:");
    const preview1 = battle.getExecutionOrderPreview();
    preview1.forEach((action, index) => {
        console.log(`${index + 1}. ${action.actor} - ${action.actionType} (Prioridade: ${action.priority})`);
    });
    
    // Processar ações
    battle.processPriorityQueue();
    
    // === EXEMPLO 2: Skills com Prioridades Personalizadas ===
    console.log("\n--- Exemplo 2: Skills Especiais ---");
    battle.clearPriorityQueue();
    
    // Skill de emergência do player (Prioridade +2)
    battle.queueEmergencyHeal('player', { amount: 40 });
    
    // Skill normal do enemy (Prioridade 0)
    battle.queueSkill('enemy', {
        name: "Golpe Brutal",
        damage: 60,
        animaCost: 20
    });
    
    // Meditação do player (Prioridade -1) - vai por último
    battle.queueMeditate('player');
    
    console.log("Ordem de execução com skills:");
    const preview2 = battle.getExecutionOrderPreview();
    preview2.forEach((action, index) => {
        console.log(`${index + 1}. ${action.actor} - ${action.actionType} (Prioridade: ${action.priority})`);
    });
    
    // === EXEMPLO 3: Modificadores de Prioridade ===
    console.log("\n--- Exemplo 3: Modificadores ---");
    battle.clearPriorityQueue();
    
    // Adicionar modificador que aumenta prioridade de ataques
    battle.addPriorityModifier('player', {
        name: "Reflexos Apurados",
        value: +1,
        appliesToAction: ['attack'],
        duration: 3
    });
    
    // Ataque normal do player agora tem prioridade +1
    battle.queueAttack('player', { type: 'enhanced' });
    
    // Ataque normal do enemy continua com prioridade 0
    battle.queueAttack('enemy', { type: 'normal' });
    
    console.log("Com modificador de prioridade:");
    const preview3 = battle.getExecutionOrderPreview();
    preview3.forEach((action, index) => {
        console.log(`${index + 1}. ${action.actor} - ${action.actionType} (Prioridade: ${action.priority})`);
    });
    
    // === EXEMPLO 4: Velocidade como Desempate ===
    console.log("\n--- Exemplo 4: Desempate por Velocidade ---");
    battle.clearPriorityQueue();
    
    // Ambos usam ataques normais (mesma prioridade)
    battle.queueAttack('player', { type: 'normal' }); // Velocidade 80
    battle.queueAttack('enemy', { type: 'normal' });  // Velocidade 60
    
    console.log("Desempate por velocidade (Player tem velocidade 80, Enemy tem 60):");
    const preview4 = battle.getExecutionOrderPreview();
    preview4.forEach((action, index) => {
        console.log(`${index + 1}. ${action.actor} - ${action.actionType} (Velocidade: ${action.speed})`);
    });
    
    // === EXEMPLO 5: Informações do Sistema ===
    console.log("\n--- Exemplo 5: Informações do Sistema ---");
    
    // Obter informações sobre prioridades
    const attackInfo = battle.getActionPriorityInfo('attack');
    const defendInfo = battle.getActionPriorityInfo('defend');
    const emergencyInfo = battle.getActionPriorityInfo('emergency_heal');
    
    console.log(`Ataque: ${attackInfo.name} (${attackInfo.value}) - ${attackInfo.description}`);
    console.log(`Defesa: ${defendInfo.name} (${defendInfo.value}) - ${defendInfo.description}`);
    console.log(`Cura Emergência: ${emergencyInfo.name} (${emergencyInfo.value}) - ${emergencyInfo.description}`);
    
    // Contagem de ações na queue
    battle.queueAttack('player');
    battle.queueDefend('player');
    battle.queueAttack('enemy');
    
    console.log(`\nAções de ataque na queue: ${battle.countActionsInQueue('attack')}`);
    console.log(`Ações de defesa na queue: ${battle.countActionsInQueue('defend')}`);
    console.log(`Total de ações na queue: ${battle.battleState.priorityQueue.length}`);
    
    console.log("\n=== DEMONSTRAÇÃO CONCLUÍDA ===");
}

// Exemplo de integração com sistema de habilidades culturais
function demonstrateCulturalSkillPriorities() {
    console.log("\n=== SKILLS CULTURAIS COM PRIORIDADE ===");
    
    const battle = new BattleMechanics();
    
    // Exemplos de skills culturais com diferentes prioridades
    const culturalSkills = {
        // Cultura Japonesa - Técnicas rápidas
        "iai_draw": {
            name: "🗾 Iai - Corte Instantâneo",
            priority: 2,  // Prioridade muito alta
            description: "Técnica de katana que corta antes do oponente reagir"
        },
        
        // Cultura Romana - Formação defensiva
        "testudo_formation": {
            name: "🛡️ Formação Testudo",
            priority: 1,  // Prioridade alta
            description: "Formação romana defensiva com escudos"
        },
        
        // Cultura Chinesa - Meditação Wu Wei
        "wu_wei_meditation": {
            name: "☯️ Meditação Wu Wei",
            priority: -1, // Prioridade baixa
            description: "Meditação taoísta que requer concentração"
        },
        
        // Cultura Asteca - Ritual de campo
        "teotl_field_blessing": {
            name: "🌟 Bênção do Campo de Teotl",
            priority: -2, // Prioridade muito baixa
            description: "Ritual que abençoa todo o campo de batalha"
        }
    };
    
    // Simular uso dessas skills em sequência
    Object.entries(culturalSkills).forEach(([skillId, skillData]) => {
        battle.queueSkill('player', {
            id: skillId,
            name: skillData.name,
            culturalDescription: skillData.description
        }, skillData.priority);
    });
    
    console.log("Skills culturais ordenadas por prioridade:");
    const culturalPreview = battle.getExecutionOrderPreview();
    culturalPreview.forEach((action, index) => {
        const skillName = culturalSkills[Object.keys(culturalSkills)[
            culturalPreview.length - index - 1
        ]]?.name || "Skill Desconhecida";
        
        console.log(`${index + 1}. ${skillName} (Prioridade: ${action.priority})`);
    });
}

// Executar exemplos quando o arquivo for carregado
if (typeof window !== 'undefined') {
    // Browser environment
    document.addEventListener('DOMContentLoaded', () => {
        console.log("RPGStack Priority System Examples carregado!");
        console.log("Execute 'demonstratePrioritySystem()' no console para ver os exemplos.");
        console.log("Execute 'demonstrateCulturalSkillPriorities()' para ver skills culturais.");
        
        // Tornar funções globais para teste
        window.demonstratePrioritySystem = demonstratePrioritySystem;
        window.demonstrateCulturalSkillPriorities = demonstrateCulturalSkillPriorities;
    });
} else {
    // Node.js environment
    if (require.main === module) {
        demonstratePrioritySystem();
        demonstrateCulturalSkillPriorities();
    }
}

// Export para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        demonstratePrioritySystem,
        demonstrateCulturalSkillPriorities
    };
}