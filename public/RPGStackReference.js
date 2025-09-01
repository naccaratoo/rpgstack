/**
 * RPGStackReference.js - Arquivo de referência para scripts futuros
 * Version: 4.0.0
 * 
 * Este arquivo serve como documentação viva e referência para desenvolvimento
 * futuro no RPGStack. Contém exemplos, padrões e guias de uso.
 */

import { GameEngine } from './GameEngineCore.js';

/**
 * =================================================================
 * GUIA DE REFERÊNCIA RPGSTACK v4.0.0
 * =================================================================
 */

/**
 * 1. INICIALIZAÇÃO DO GAME ENGINE
 */
async function initializeGameEngine() {
    try {
        await GameEngine.initialize();
        console.log('Game Engine inicializado com sucesso');
        return true;
    } catch (error) {
        console.error('Erro na inicialização:', error);
        return false;
    }
}

/**
 * 2. GERENCIAMENTO DE PERSONAGENS
 */
const CharacterExamples = {
    // Criar personagem
    async createCharacter() {
        const characterData = {
            name: 'Exemplo Hero',
            level: 1,
            stats: {
                hp: 100,
                maxHP: 100,
                attack: 20,
                defense: 15
            },
            classe: 'Lutador',
            anima: 100,
            critico: 1.0
        };

        try {
            const character = await GameEngine.character.create(characterData);
            console.log('Personagem criado:', character);
            return character;
        } catch (error) {
            console.error('Erro ao criar personagem:', error);
            throw error;
        }
    },

    // Listar personagens
    listCharacters() {
        const characters = GameEngine.character.getAll();
        console.log(`Total de personagens: ${characters.length}`);
        characters.forEach(char => {
            console.log(`- ${char.name} (${char.classe})`);
        });
        return characters;
    },

    // Ativar personagem
    setActiveCharacter(characterId) {
        try {
            const character = GameEngine.character.setActive(characterId);
            console.log(`Personagem ativo: ${character.name}`);
            return character;
        } catch (error) {
            console.error('Erro ao ativar personagem:', error);
        }
    }
};

/**
 * 3. SISTEMA DE CLASSES
 */
const ClassExamples = {
    // Listar classes disponíveis
    listAvailableClasses() {
        const classes = GameEngine.classes.getAll();
        console.log('Classes disponíveis:');
        classes.forEach(cls => {
            console.log(`- ${cls.name} (${cls.rarity})`);
            console.log(`  Attack: ${cls.stats.attack}, Defense: ${cls.stats.defense}`);
            console.log(`  Ânima: ${cls.stats.anima}, Speed: ${cls.stats.speed}`);
        });
        return classes;
    },

    // Gerar classe aleatória
    generateRandomClass() {
        const types = ['balanced', 'attack', 'defense', 'magic', 'speed'];
        const rarities = ['Common', 'Rare', 'Epic', 'Legendary'];
        
        const randomType = types[Math.floor(Math.random() * types.length)];
        const randomRarity = rarities[Math.floor(Math.random() * rarities.length)];
        
        const newClass = GameEngine.classes.generate(randomType, randomRarity);
        console.log('Classe gerada:', newClass);
        return newClass;
    },

    // Criar classe personalizada
    createCustomClass() {
        const classData = {
            name: 'Exemplo Mágico',
            description: 'Uma classe de exemplo especializada em magia',
            rarity: 'Rare',
            stats: {
                attack: 0.8,
                defense: 0.7,
                anima: 1.8,
                speed: 1.3
            },
            advantages: ['Lutador'],
            disadvantages: ['Armamentista'],
            baseHP: 85,
            baseAnima: 140,
            criticalMultiplier: 1.2
        };

        const newClass = GameEngine.classes.create(classData);
        console.log('Classe personalizada criada:', newClass);
        return newClass;
    }
};

/**
 * 4. SISTEMA DE BATALHA
 */
const BattleExamples = {
    // Simular batalha completa
    async simulateBattle() {
        const characters = GameEngine.character.getAll();
        if (characters.length < 2) {
            console.error('Necessário pelo menos 2 personagens para batalha');
            return;
        }

        const attacker = characters[0];
        const defender = characters[1];

        console.log(`Iniciando batalha: ${attacker.name} vs ${defender.name}`);
        
        // Iniciar batalha
        const battle = GameEngine.battle.start(attacker, defender);
        
        // Simular ataques
        for (let turn = 1; turn <= 3; turn++) {
            console.log(`\n--- Turno ${turn} ---`);
            
            // Atacante ataca
            const damage = GameEngine.battle.calculateDamage(attacker, defender);
            console.log(`${attacker.name} causa ${damage} de dano a ${defender.name}`);
            
            // Aplicar buff no atacante
            if (turn === 2) {
                GameEngine.battle.applyBuff(attacker.id, 'attack_boost', 2);
                console.log(`${attacker.name} recebeu buff de ataque`);
            }
            
            // Defensor se defende
            if (turn === 3) {
                GameEngine.battle.defend(defender.id);
                console.log(`${defender.name} está se defendendo`);
            }
            
            // Finalizar turno
            GameEngine.battle.endTurn(attacker.id);
            GameEngine.battle.endTurn(defender.id);
        }
        
        console.log('Batalha finalizada');
        return battle;
    },

    // Exemplo de meditação
    performMeditation() {
        const characters = GameEngine.character.getAll();
        if (characters.length === 0) {
            console.error('Nenhum personagem disponível');
            return;
        }

        const character = characters[0];
        const result = GameEngine.battle.meditate(character);
        console.log(`Meditação de ${character.name}:`, result.message);
        return result;
    }
};

/**
 * 5. SISTEMA DE EVENTOS
 */
const EventExamples = {
    // Configurar listeners de eventos
    setupEventListeners() {
        // Evento de criação de personagem
        GameEngine.on('character:created', (character) => {
            console.log(`Novo personagem criado: ${character.name}`);
            // Implementar lógica personalizada aqui
        });

        // Evento de início de batalha
        GameEngine.on('battle:started', (battleData) => {
            console.log('Batalha iniciada:', battleData);
            // Implementar lógica de interface de batalha
        });

        // Evento de mudança de modo de jogo
        GameEngine.on('game:mode_changed', (modeData) => {
            console.log(`Modo alterado: ${modeData.previous} → ${modeData.current}`);
            // Implementar lógica de interface baseada no modo
        });

        console.log('Event listeners configurados');
    },

    // Exemplo de emissão de evento personalizado
    emitCustomEvent() {
        GameEngine.emit('custom:example', {
            message: 'Este é um evento personalizado',
            timestamp: Date.now()
        });
    }
};

/**
 * 6. GERENCIAMENTO DE ESTADO DE JOGO
 */
const GameStateExamples = {
    // Salvar jogo
    saveGame() {
        const saveData = GameEngine.game.save();
        console.log('Jogo salvo:', saveData);
        return saveData;
    },

    // Carregar jogo
    loadGame() {
        const saveData = GameEngine.game.load();
        if (saveData) {
            console.log('Jogo carregado:', saveData);
        } else {
            console.log('Nenhum save encontrado');
        }
        return saveData;
    },

    // Alterar modo de jogo
    changeGameMode(newMode) {
        GameEngine.game.setMode(newMode);
        console.log(`Modo alterado para: ${newMode}`);
    },

    // Resetar jogo
    resetGame() {
        GameEngine.game.reset();
        console.log('Jogo resetado');
    }
};

/**
 * 7. UTILITÁRIOS E HELPERS
 */
const UtilityExamples = {
    // Gerar IDs únicos
    generateUniqueIds() {
        const ids = [];
        for (let i = 0; i < 5; i++) {
            ids.push(GameEngine.utils.generateId());
        }
        console.log('IDs gerados:', ids);
        return ids;
    },

    // Calcular level baseado em experiência
    calculateLevels() {
        const experiences = [100, 500, 1000, 2500, 5000];
        experiences.forEach(exp => {
            const level = GameEngine.utils.calculateLevel(exp);
            console.log(`Experiência ${exp} = Level ${level}`);
        });
    },

    // Exemplo de debounce
    setupDebouncedFunction() {
        const debouncedLog = GameEngine.utils.debounce((message) => {
            console.log('Debounced:', message);
        }, 1000);

        // Chamadas rápidas - apenas a última será executada
        debouncedLog('Primeira chamada');
        debouncedLog('Segunda chamada');
        debouncedLog('Terceira chamada');
    }
};

/**
 * 8. INTEGRAÇÃO COM APIs
 */
const APIExamples = {
    // Exemplo de requisições GET
    async fetchData() {
        try {
            const characters = await GameEngine.api.get('/api/characters');
            console.log('Characters from API:', characters);
            
            const skills = await GameEngine.api.get('/api/skills');
            console.log('Skills from API:', skills);
            
            return { characters, skills };
        } catch (error) {
            console.error('API Error:', error);
        }
    },

    // Exemplo de criação via API
    async createViaAPI() {
        const newCharacter = {
            name: 'API Character',
            level: 1,
            stats: { hp: 100, maxHP: 100, attack: 20, defense: 15 },
            classe: 'Arcano',
            anima: 120,
            critico: 1.1
        };

        try {
            const result = await GameEngine.api.post('/api/characters', newCharacter);
            console.log('Character created via API:', result);
            return result;
        } catch (error) {
            console.error('API Creation Error:', error);
        }
    }
};

/**
 * 9. DEBUG E DIAGNÓSTICO
 */
const DebugExamples = {
    // Mostrar status completo do engine
    showEngineStatus() {
        const status = GameEngine.getStatus();
        console.log('=== RPGSTACK ENGINE STATUS ===');
        console.log('Version:', status.version);
        console.log('Initialized:', status.initialized);
        console.log('Game Mode:', status.gameMode);
        console.log('Active Character:', status.activeCharacter);
        console.log('Cache Sizes:', status.cacheSize);
        console.log('Event Listeners:', status.eventListeners);
        return status;
    },

    // Mostrar informações de debug completas
    showDebugInfo() {
        const debug = GameEngine.debug();
        console.log('=== RPGSTACK DEBUG INFO ===');
        console.log(debug);
        return debug;
    },

    // Testar funcionalidades principais
    async runSystemTest() {
        console.log('🧪 Iniciando teste completo do sistema...');
        
        try {
            // 1. Inicializar engine
            await GameEngine.initialize();
            console.log('✅ Engine inicializado');
            
            // 2. Gerar classe
            const newClass = GameEngine.classes.generate('magic', 'Rare');
            console.log('✅ Classe gerada:', newClass.name);
            
            // 3. Criar personagem
            const character = await GameEngine.character.create({
                name: 'Teste Character',
                level: 1,
                stats: { hp: 100, maxHP: 100, attack: 20, defense: 15 },
                classe: newClass.name,
                anima: 100,
                critico: 1.0
            });
            console.log('✅ Personagem criado:', character.name);
            
            // 4. Ativar personagem
            GameEngine.character.setActive(character.id);
            console.log('✅ Personagem ativado');
            
            // 5. Salvar estado
            GameEngine.game.save();
            console.log('✅ Estado salvo');
            
            console.log('🎉 Teste completo finalizado com sucesso!');
            return true;
            
        } catch (error) {
            console.error('❌ Erro no teste:', error);
            return false;
        }
    }
};

/**
 * =================================================================
 * PADRÕES DE DESENVOLVIMENTO
 * =================================================================
 */

/**
 * PADRÃO 1: Inicialização de Módulo
 */
const ModuleInitializationPattern = {
    async init() {
        // 1. Verificar dependências
        if (!GameEngine.initialized) {
            await GameEngine.initialize();
        }
        
        // 2. Configurar eventos específicos do módulo
        GameEngine.on('module:event', this.handleModuleEvent.bind(this));
        
        // 3. Carregar dados específicos
        await this.loadModuleData();
        
        // 4. Configurar interface
        this.setupUI();
    },

    handleModuleEvent(data) {
        console.log('Module event handled:', data);
    },

    async loadModuleData() {
        // Implementar carregamento de dados
    },

    setupUI() {
        // Implementar configuração de interface
    }
};

/**
 * PADRÃO 2: Sistema de Estados
 */
const StateManagementPattern = {
    state: {
        currentScreen: 'menu',
        loading: false,
        error: null
    },

    setState(newState) {
        const previousState = { ...this.state };
        this.state = { ...this.state, ...newState };
        
        // Emitir evento de mudança de estado
        GameEngine.emit('state:changed', {
            previous: previousState,
            current: this.state
        });
    },

    getState() {
        return { ...this.state };
    }
};

/**
 * PADRÃO 3: Gerenciamento de Erros
 */
const ErrorHandlingPattern = {
    async safeExecute(operation, fallback = null) {
        try {
            return await operation();
        } catch (error) {
            console.error('Operation failed:', error);
            
            // Emitir evento de erro
            GameEngine.emit('error:occurred', {
                error,
                operation: operation.name,
                timestamp: Date.now()
            });
            
            // Executar fallback se disponível
            if (fallback) {
                return fallback();
            }
            
            throw error;
        }
    }
};

/**
 * =================================================================
 * EXPORT DE REFERÊNCIAS
 * =================================================================
 */

// Export de exemplos para uso em outros módulos
export const RPGStackReference = {
    // Exemplos de funcionalidades
    CharacterExamples,
    ClassExamples,
    BattleExamples,
    EventExamples,
    GameStateExamples,
    UtilityExamples,
    APIExamples,
    DebugExamples,
    
    // Padrões de desenvolvimento
    ModuleInitializationPattern,
    StateManagementPattern,
    ErrorHandlingPattern,
    
    // Função de inicialização rápida
    quickInit: initializeGameEngine,
    
    // Versão
    version: '4.0.0'
};

// Export default
export default RPGStackReference;

/**
 * =================================================================
 * CONSOLE HELPERS (Disponível no navegador)
 * =================================================================
 */
if (typeof window !== 'undefined') {
    // Adicionar helpers ao console global
    window.RPGStackRef = RPGStackReference;
    window.testRPGStack = DebugExamples.runSystemTest;
    window.rpgStatus = DebugExamples.showEngineStatus;
    window.rpgDebug = DebugExamples.showDebugInfo;
    
    console.log('🎮 RPGStack Reference loaded! Try: testRPGStack(), rpgStatus(), rpgDebug()');
}