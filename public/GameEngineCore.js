/**
 * GameEngineCore.js - Biblioteca centralizada para RPGStack Game Engine
 * Version: 4.0.0
 * 
 * Centraliza todas as funcionalidades core do RPGStack para uso em scripts futuros
 * Integra: Characters, Classes, Skills, Maps, Battle Mechanics, Game Logic
 */

// Import all existing modules
import { BattleMechanics } from './BattleMechanics.js';
import { BuffDebuffSystem } from './BuffDebuffSystem.js';
import { ClassManager } from './ClassManager.js';
import { ClassGenerator } from './ClassGenerator.js';
import { ClassIntegration } from './ClassIntegration.js';

/**
 * Main Game Engine Core - Singleton pattern
 */
class GameEngineCore {
    constructor() {
        if (GameEngineCore.instance) {
            return GameEngineCore.instance;
        }

        // Initialize core systems
        this.version = '4.0.0';
        this.initialized = false;
        
        // Core modules
        this.battleMechanics = null;
        this.buffSystem = null;
        this.classManager = null;
        this.classGenerator = null;
        this.classIntegration = null;
        
        // Game state
        this.gameState = {
            currentPlayer: null,
            activeCharacter: null,
            gameMode: 'menu', // menu, battle, exploration, inventory
            settings: {
                difficulty: 'normal',
                autoSave: true,
                soundEnabled: true,
                animationsEnabled: true
            }
        };

        // Event system
        this.events = new Map();
        
        // Cache systems
        this.cache = {
            characters: new Map(),
            skills: new Map(),
            classes: new Map(),
            maps: new Map(),
            items: new Map()
        };

        GameEngineCore.instance = this;
    }

    /**
     * Initialize the game engine with all modules
     */
    async initialize() {
        if (this.initialized) {
            console.warn('Game Engine already initialized');
            return;
        }

        console.log('🎮 Initializing RPGStack Game Engine v4.0.0...');

        try {
            // Initialize core systems
            this.battleMechanics = new BattleMechanics();
            this.buffSystem = new BuffDebuffSystem();
            this.classManager = new ClassManager();
            this.classGenerator = new ClassGenerator();
            this.classIntegration = new ClassIntegration();

            // Initialize integrations
            await this.classIntegration.initializeBattleMechanics();

            // Load initial data
            await this.loadInitialData();

            // Setup event listeners
            this.setupEventListeners();

            this.initialized = true;
            console.log('✅ Game Engine initialized successfully');
            
            this.emit('engine:initialized', { version: this.version });
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Game Engine:', error);
            throw new Error(`Game Engine initialization failed: ${error.message}`);
        }
    }

    /**
     * Load initial game data from APIs
     */
    async loadInitialData() {
        try {
            // Load characters
            const charactersData = await this.api.get('/api/characters');
            if (charactersData.success && charactersData.characters) {
                Object.values(charactersData.characters).forEach(character => {
                    this.cache.characters.set(character.id, character);
                });
            }

            // Load skills
            const skillsData = await this.api.get('/api/skills');
            if (Array.isArray(skillsData)) {
                skillsData.forEach(skill => {
                    this.cache.skills.set(skill.id, skill);
                });
            }

            // Load classes
            const classes = this.classManager.getAllClasses();
            classes.forEach(cls => {
                this.cache.classes.set(cls.id, cls);
            });

            console.log(`📊 Loaded initial data:`, {
                characters: this.cache.characters.size,
                skills: this.cache.skills.size,
                classes: this.cache.classes.size
            });

        } catch (error) {
            console.warn('Warning: Some initial data could not be loaded:', error.message);
        }
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeyPress(e);
        });

        // Window events
        window.addEventListener('beforeunload', () => {
            this.handleGameExit();
        });

        // Visibility changes (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handleGamePause();
            } else {
                this.handleGameResume();
            }
        });
    }

    /**
     * Event system - Subscribe to events
     */
    on(eventName, callback) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }
        this.events.get(eventName).push(callback);
    }

    /**
     * Event system - Emit events
     */
    emit(eventName, data = {}) {
        const callbacks = this.events.get(eventName);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Event callback error for ${eventName}:`, error);
                }
            });
        }
    }

    /**
     * Character Management Integration
     */
    character = {
        create: async (characterData) => {
            try {
                const response = await this.api.post('/api/characters', characterData);
                if (response.success) {
                    this.cache.characters.set(response.character.id, response.character);
                    this.emit('character:created', response.character);
                    return response.character;
                }
                throw new Error('Character creation failed');
            } catch (error) {
                console.error('Character creation error:', error);
                throw error;
            }
        },

        get: (characterId) => {
            return this.cache.characters.get(characterId);
        },

        getAll: () => {
            return Array.from(this.cache.characters.values());
        },

        update: async (characterId, updates) => {
            try {
                const response = await this.api.put(`/api/characters/${characterId}`, updates);
                if (response.success) {
                    this.cache.characters.set(characterId, response.character);
                    this.emit('character:updated', response.character);
                    return response.character;
                }
                throw new Error('Character update failed');
            } catch (error) {
                console.error('Character update error:', error);
                throw error;
            }
        },

        delete: async (characterId) => {
            try {
                const response = await this.api.delete(`/api/characters/${characterId}`);
                if (response.success) {
                    this.cache.characters.delete(characterId);
                    this.emit('character:deleted', { id: characterId });
                    return true;
                }
                throw new Error('Character deletion failed');
            } catch (error) {
                console.error('Character deletion error:', error);
                throw error;
            }
        },

        setActive: (characterId) => {
            const character = this.cache.characters.get(characterId);
            if (character) {
                this.gameState.activeCharacter = character;
                this.emit('character:activated', character);
                return character;
            }
            throw new Error(`Character ${characterId} not found`);
        }
    };

    /**
     * Class Management Integration
     */
    classes = {
        create: (classData) => {
            const newClass = this.classManager.createClass(classData);
            this.cache.classes.set(newClass.id, newClass);
            this.emit('class:created', newClass);
            return newClass;
        },

        generate: (type = 'balanced', rarity = 'Common') => {
            const generatedClass = this.classGenerator.generateFocusedClass(type, rarity);
            const newClass = this.classManager.createClass(generatedClass);
            this.cache.classes.set(newClass.id, newClass);
            this.emit('class:generated', newClass);
            return newClass;
        },

        getAll: () => {
            return Array.from(this.cache.classes.values());
        },

        getByName: (name) => {
            return this.classManager.getClassByName(name);
        },

        validate: (classData) => {
            return this.classManager.validateClass(classData);
        }
    };

    /**
     * Battle System Integration
     */
    battle = {
        start: (attacker, defender) => {
            if (!attacker || !defender) {
                throw new Error('Both attacker and defender are required');
            }

            const battleData = {
                attacker,
                defender,
                startTime: Date.now(),
                turn: 1,
                actions: []
            };

            this.gameState.gameMode = 'battle';
            this.emit('battle:started', battleData);
            return battleData;
        },

        calculateDamage: (attacker, defender, skillData = null) => {
            if (skillData) {
                // Skill-based attack
                return this.battleMechanics.calculateSkillDamage(attacker, defender, skillData);
            } else {
                // Basic attack
                return this.battleMechanics.calculateBasicAttackDamage(attacker, defender);
            }
        },

        applyBuff: (characterId, buffType, duration = 3) => {
            this.buffSystem.addBuff(characterId, buffType, duration);
            this.emit('battle:buff_applied', { characterId, buffType, duration });
        },

        meditate: (character) => {
            const result = this.battleMechanics.meditate(character);
            this.emit('battle:meditation', result);
            return result;
        },

        defend: (characterId) => {
            this.battleMechanics.setDefending(characterId, true);
            this.emit('battle:defending', { characterId });
        },

        endTurn: (characterId) => {
            this.battleMechanics.resetTurnStates(characterId);
            this.buffSystem.processTurn(characterId);
            this.emit('battle:turn_ended', { characterId });
        }
    };

    /**
     * Game State Management
     */
    game = {
        save: () => {
            const saveData = {
                version: this.version,
                timestamp: Date.now(),
                gameState: this.gameState,
                characters: Array.from(this.cache.characters.values()),
                classes: Array.from(this.cache.classes.values()),
                settings: this.gameState.settings
            };

            localStorage.setItem('rpgstack_save', JSON.stringify(saveData));
            this.emit('game:saved', saveData);
            return saveData;
        },

        load: () => {
            try {
                const saveData = JSON.parse(localStorage.getItem('rpgstack_save'));
                if (saveData && saveData.version) {
                    // Restore game state
                    this.gameState = saveData.gameState;
                    
                    // Restore cached data
                    if (saveData.characters) {
                        saveData.characters.forEach(char => {
                            this.cache.characters.set(char.id, char);
                        });
                    }

                    this.emit('game:loaded', saveData);
                    return saveData;
                }
                return null;
            } catch (error) {
                console.error('Failed to load save data:', error);
                return null;
            }
        },

        reset: () => {
            localStorage.removeItem('rpgstack_save');
            this.cache.characters.clear();
            this.cache.skills.clear();
            this.cache.classes.clear();
            this.gameState.activeCharacter = null;
            this.gameState.gameMode = 'menu';
            this.emit('game:reset');
        },

        setMode: (mode) => {
            const previousMode = this.gameState.gameMode;
            this.gameState.gameMode = mode;
            this.emit('game:mode_changed', { previous: previousMode, current: mode });
        }
    };

    /**
     * Utility Functions
     */
    utils = {
        generateId: () => {
            return Math.random().toString(16).substring(2, 12).toUpperCase();
        },

        formatNumber: (number, decimals = 0) => {
            return Number(number).toFixed(decimals);
        },

        calculateLevel: (experience) => {
            return Math.floor(Math.sqrt(experience / 100)) + 1;
        },

        calculateExperience: (level) => {
            return Math.pow(level - 1, 2) * 100;
        },

        validateEmail: (email) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },

        debounce: (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        throttle: (func, limit) => {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }
    };

    /**
     * API Helper
     */
    api = {
        get: async (url) => {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`API GET failed: ${response.statusText}`);
            }
            return await response.json();
        },

        post: async (url, data) => {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error(`API POST failed: ${response.statusText}`);
            }
            return await response.json();
        },

        put: async (url, data) => {
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error(`API PUT failed: ${response.statusText}`);
            }
            return await response.json();
        },

        delete: async (url) => {
            const response = await fetch(url, { method: 'DELETE' });
            if (!response.ok) {
                throw new Error(`API DELETE failed: ${response.statusText}`);
            }
            return await response.json();
        }
    };

    /**
     * Global keyboard event handler
     */
    handleGlobalKeyPress(event) {
        // Escape key - always available
        if (event.key === 'Escape') {
            this.emit('input:escape');
            return;
        }

        // Game-specific shortcuts
        if (this.gameState.gameMode === 'battle') {
            switch (event.key) {
                case '1':
                    this.emit('battle:action', { type: 'attack' });
                    break;
                case '2':
                    this.emit('battle:action', { type: 'skill' });
                    break;
                case '3':
                    this.emit('battle:action', { type: 'defend' });
                    break;
                case '4':
                    this.emit('battle:action', { type: 'meditate' });
                    break;
            }
        }
    }

    /**
     * Handle game pause
     */
    handleGamePause() {
        if (this.gameState.settings.autoSave) {
            this.game.save();
        }
        this.emit('game:paused');
    }

    /**
     * Handle game resume
     */
    handleGameResume() {
        this.emit('game:resumed');
    }

    /**
     * Handle game exit
     */
    handleGameExit() {
        if (this.gameState.settings.autoSave) {
            this.game.save();
        }
        this.emit('game:exit');
    }

    /**
     * Get engine status
     */
    getStatus() {
        return {
            version: this.version,
            initialized: this.initialized,
            gameMode: this.gameState.gameMode,
            activeCharacter: this.gameState.activeCharacter?.name || null,
            cacheSize: {
                characters: this.cache.characters.size,
                skills: this.cache.skills.size,
                classes: this.cache.classes.size,
                maps: this.cache.maps.size
            },
            eventListeners: this.events.size
        };
    }

    /**
     * Debug information
     */
    debug() {
        return {
            status: this.getStatus(),
            gameState: this.gameState,
            cache: {
                characters: Array.from(this.cache.characters.keys()),
                skills: Array.from(this.cache.skills.keys()),
                classes: Array.from(this.cache.classes.keys())
            },
            events: Array.from(this.events.keys())
        };
    }
}

// Export singleton instance
export const GameEngine = new GameEngineCore();
export default GameEngine;

// Global access for console debugging
if (typeof window !== 'undefined') {
    window.GameEngine = GameEngine;
    window.RPGStack = GameEngine; // Alias
}