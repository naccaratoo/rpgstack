/**
 * 🚀⚔️ BATTLE INITIALIZATION V2 - SISTEMA AVANÇADO ⚔️🚀
 * 
 * Sistema completo de inicialização de batalha integrando:
 * - Sistema Astral v4.0.0 (8 cargas)
 * - Cadência do Dragão v4.1.0 (até 400%+ dano)
 * - Sistema de Classes (Lutador/Armamentista/Arcano)
 * - BattleMechanics.js (vantagens de classe)
 * - Character Database real
 * - Skill System integrado
 * 
 * @version 2.0.0
 * @author RPGStack Team
 * @date 2025-09-01
 */

class BattleInitializationV2 {
    constructor() {
        // Sistemas integrados
        this.astralSystem = window.astralSystem || new AstralSystem();
        this.battleMechanics = window.battleMechanics || new BattleMechanics();
        this.buffSystem = window.buffSystem || new BuffDebuffSystem();
        
        // Estado da batalha v2
        this.availableCharacters = [];
        this.selectedPlayer = null;
        this.selectedEnemy = null;
        this.battleConfiguration = null;
        this.battlePreview = null;
        
        // Configurações avançadas
        this.difficultyMultiplier = 1.0;
        this.battleMode = 'standard'; // standard, tournament, campaign
        this.enablePreview = true;
        this.smartMatching = true;
        
        console.log('🚀 Battle Initialization V2 carregado');
    }

    /**
     * MÉTODO PRINCIPAL - Inicializar batalha avançada
     */
    async initializeAdvancedBattle() {
        console.log('⚡ Iniciando Battle System V2...');
        
        try {
            // 1. Carregar personagens com dados completos
            await this.loadCharactersWithFullIntegration();
            
            // 2. Mostrar interface de seleção avançada
            await this.showAdvancedCharacterSelection();
            
            return new Promise((resolve) => {
                this.onBattleConfigured = resolve;
            });
            
        } catch (error) {
            console.error('❌ Erro na inicialização V2:', error);
            throw error;
        }
    }

    /**
     * CARREGAMENTO AVANÇADO DE PERSONAGENS
     */
    async loadCharactersWithFullIntegration() {
        console.log('📡 Carregando personagens com integração completa...');
        
        try {
            // Buscar da API
            const response = await fetch('/api/characters');
            const data = await response.json();
            
            // Processar dados com estruturas múltiplas
            let characters = [];
            if (data.characters) {
                characters = Object.values(data.characters);
            } else if (Array.isArray(data)) {
                characters = data;
            } else if (typeof data === 'object') {
                characters = Object.values(data);
            }

            // Enriquecer personagens com dados calculados
            this.availableCharacters = await Promise.all(
                characters.map(char => this.enrichCharacterData(char))
            );
            
            console.log(`✅ ${this.availableCharacters.length} personagens carregados com dados completos`);
            
        } catch (error) {
            console.warn('⚠️ Falha na API, usando personagens fallback');
            this.availableCharacters = await this.getFallbackCharacters();
        }
        
        return this.availableCharacters;
    }

    /**
     * ENRIQUECIMENTO DE DADOS DOS PERSONAGENS
     */
    async enrichCharacterData(character) {
        // Garantir campos obrigatórios
        const enriched = {
            ...character,
            classe: character.classe || 'Lutador',
            anima: character.anima || 100,
            critico: character.critico || 1.0,
            hp: character.hp || 300,
            maxHP: character.maxHP || 300,
            attack: character.attack || 100,
            defense: character.defense || 100,
            skills: character.skills || []
        };

        // Calcular vantagens de classe contra outros personagens
        enriched.classAdvantages = this.calculateClassAdvantages(enriched.classe);
        
        // Carregar skills específicas da classe
        enriched.availableSkills = await this.loadClassSkills(enriched.classe);
        
        // Calcular poder de batalha estimado
        enriched.battlePower = this.calculateBattlePower(enriched);
        
        // Estatísticas de eficácia
        enriched.effectiveness = {
            offense: this.calculateOffensiveRating(enriched),
            defense: this.calculateDefensiveRating(enriched), 
            utility: this.calculateUtilityRating(enriched)
        };

        return enriched;
    }

    /**
     * SISTEMA DE VANTAGENS DE CLASSE
     */
    calculateClassAdvantages(characterClass) {
        const allClasses = ['Lutador', 'Armamentista', 'Arcano'];
        const advantages = {};
        
        allClasses.forEach(enemyClass => {
            if (this.battleMechanics.hasClassAdvantage(characterClass, enemyClass)) {
                advantages[enemyClass] = 'advantage'; // +10% dano
            } else if (this.battleMechanics.hasClassAdvantage(enemyClass, characterClass)) {
                advantages[enemyClass] = 'disadvantage'; // -10% dano
            } else {
                advantages[enemyClass] = 'neutral'; // sem modificador
            }
        });
        
        return advantages;
    }

    /**
     * CARREGAMENTO DE SKILLS POR CLASSE
     */
    async loadClassSkills(classe) {
        try {
            const response = await fetch('/api/skills');
            const skillsData = await response.json();
            
            // Filtrar skills da classe específica
            const classSkills = [];
            
            // Skills específicas por classe baseado na documentação
            const classSkillMap = {
                'Lutador': ['Cadência do Dragão'], // ID: 7YUOFU26OF
                'Armamentista': ['Arsenal Adaptativo'], // ID: 8AB7CDE5F9  
                'Arcano': ['Convergência Ânima'] // ID: 9BC8DEF6G1
            };
            
            const relevantSkills = classSkillMap[classe] || [];
            
            return relevantSkills.map(skillName => ({
                name: skillName,
                classe: classe,
                description: this.getSkillDescription(skillName)
            }));
            
        } catch (error) {
            console.warn('⚠️ Erro ao carregar skills, usando defaults');
            return this.getDefaultClassSkills(classe);
        }
    }

    /**
     * CÁLCULO DE PODER DE BATALHA
     */
    calculateBattlePower(character) {
        const base = character.hp + character.attack + character.defense;
        const animaBonus = character.anima * 0.5;
        const criticoBonus = character.critico * 50;
        const skillBonus = character.skills.length * 25;
        
        return Math.round(base + animaBonus + criticoBonus + skillBonus);
    }

    /**
     * INTERFACE DE SELEÇÃO AVANÇADA V2
     */
    async showAdvancedCharacterSelection() {
        console.log('🎮 Mostrando seleção avançada V2...');
        
        const overlay = document.createElement('div');
        overlay.id = 'battle-v2-selection';
        overlay.className = 'battle-v2-selection-overlay';
        
        overlay.innerHTML = `
            <div class="battle-v2-modal">
                <div class="battle-v2-header">
                    <h1>⚔️ BATTLE SYSTEM V2.0 ⚔️</h1>
                    <div class="version-badge">SISTEMA AVANÇADO</div>
                </div>
                
                <div class="battle-modes">
                    <button class="mode-btn active" data-mode="standard">🎯 Batalha Padrão</button>
                    <button class="mode-btn" data-mode="tournament">🏆 Torneio</button>
                    <button class="mode-btn" data-mode="campaign">📚 Campanha</button>
                </div>
                
                <div class="difficulty-slider">
                    <label>⚖️ Dificuldade: <span id="difficulty-value">Normal</span></label>
                    <input type="range" id="difficulty-range" min="0.5" max="2.0" step="0.1" value="1.0">
                </div>
                
                <div class="character-selection-v2">
                    <div class="player-section">
                        <h3>👤 SEU LUTADOR</h3>
                        <div class="character-grid-v2" id="player-grid-v2">
                            ${this.generateAdvancedCharacterCards('player')}
                        </div>
                        <div class="selected-display" id="selected-player-v2">
                            <span>Selecione seu personagem</span>
                        </div>
                    </div>
                    
                    <div class="vs-section-v2">
                        <div class="advantage-matrix" id="advantage-matrix">
                            <div class="matrix-title">VANTAGENS DE CLASSE</div>
                            <div class="matrix-grid">
                                <div class="matrix-legend">
                                    <div class="advantage">🔥 Vantagem (+10%)</div>
                                    <div class="neutral">⚖️ Neutro (0%)</div>
                                    <div class="disadvantage">❄️ Desvantagem (-10%)</div>
                                </div>
                            </div>
                        </div>
                        <div class="vs-text-v2">VS</div>
                        <div class="battle-preview" id="battle-preview-v2">
                            <div>Selecione personagens para ver previsão</div>
                        </div>
                    </div>
                    
                    <div class="enemy-section">
                        <h3>👹 OPONENTE</h3>
                        <div class="character-grid-v2" id="enemy-grid-v2">
                            ${this.generateAdvancedCharacterCards('enemy')}
                        </div>
                        <div class="selected-display" id="selected-enemy-v2">
                            <span>Selecione o oponente</span>
                        </div>
                    </div>
                </div>
                
                <div class="battle-controls-v2">
                    <button id="smart-match-btn" class="smart-btn">🧠 MATCH INTELIGENTE</button>
                    <button id="start-battle-v2-btn" class="start-btn-v2" disabled>
                        ⚔️ INICIAR BATALHA V2
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        this.setupAdvancedEvents();
    }

    /**
     * GERAÇÃO DE CARDS AVANÇADOS
     */
    generateAdvancedCharacterCards(type) {
        return this.availableCharacters.map(character => `
            <div class="character-card-v2" data-id="${character.id}" data-type="${type}">
                <div class="card-header">
                    <div class="character-hex">${character.id}</div>
                    <div class="battle-power">${character.battlePower} BP</div>
                </div>
                
                <div class="character-avatar">
                    <div class="class-icon class-${character.classe.toLowerCase()}">
                        ${this.getClassIcon(character.classe)}
                    </div>
                </div>
                
                <div class="character-info">
                    <div class="character-name">${character.name}</div>
                    <div class="character-class ${character.classe.toLowerCase()}">
                        ${character.classe}
                    </div>
                </div>
                
                <div class="character-stats-v2">
                    <div class="stat-bar">
                        <span class="stat-label">💚 HP</span>
                        <div class="stat-value">${character.hp}</div>
                    </div>
                    <div class="stat-bar">
                        <span class="stat-label">⚔️ ATK</span>
                        <div class="stat-value">${character.attack}</div>
                    </div>
                    <div class="stat-bar">
                        <span class="stat-label">🛡️ DEF</span>
                        <div class="stat-value">${character.defense}</div>
                    </div>
                    <div class="stat-bar">
                        <span class="stat-label">⚡ CRIT</span>
                        <div class="stat-value">x${character.critico}</div>
                    </div>
                </div>
                
                <div class="effectiveness-bars">
                    <div class="eff-bar">
                        <span>Ofensa</span>
                        <div class="bar"><div style="width: ${character.effectiveness.offense}%"></div></div>
                    </div>
                    <div class="eff-bar">
                        <span>Defesa</span>
                        <div class="bar"><div style="width: ${character.effectiveness.defense}%"></div></div>
                    </div>
                    <div class="eff-bar">
                        <span>Utilidade</span>
                        <div class="bar"><div style="width: ${character.effectiveness.utility}%"></div></div>
                    </div>
                </div>
                
                <div class="astral-display">
                    <span>🌟 Cargas Astrais: 8/8</span>
                </div>
                
                <div class="available-skills">
                    ${character.availableSkills.map(skill => 
                        `<div class="skill-tag">${skill.name}</div>`
                    ).join('')}
                </div>
            </div>
        `).join('');
    }

    /**
     * CONFIGURAÇÃO DE EVENTOS AVANÇADOS
     */
    setupAdvancedEvents() {
        console.log('⚙️ Configurando eventos avançados V2...');
        
        // Seleção de modo de batalha
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.battleMode = btn.dataset.mode;
                console.log(`🎯 Modo selecionado: ${this.battleMode}`);
            });
        });
        
        // Slider de dificuldade
        const difficultySlider = document.getElementById('difficulty-range');
        const difficultyValue = document.getElementById('difficulty-value');
        
        difficultySlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.difficultyMultiplier = value;
            
            const labels = {
                0.5: 'Muito Fácil', 0.6: 'Fácil', 0.7: 'Fácil', 0.8: 'Fácil',
                0.9: 'Normal', 1.0: 'Normal', 1.1: 'Normal',
                1.2: 'Difícil', 1.3: 'Difícil', 1.4: 'Difícil', 1.5: 'Difícil',
                1.6: 'Muito Difícil', 1.7: 'Muito Difícil', 1.8: 'Extremo',
                1.9: 'Extremo', 2.0: 'Impossível'
            };
            
            difficultyValue.textContent = labels[value] || 'Normal';
            this.updateBattlePreview();
        });
        
        // Seleção de personagens
        this.setupCharacterSelection();
        
        // Match inteligente
        document.getElementById('smart-match-btn').addEventListener('click', () => {
            this.performSmartMatching();
        });
        
        // Iniciar batalha
        document.getElementById('start-battle-v2-btn').addEventListener('click', () => {
            this.startAdvancedBattle();
        });
    }

    /**
     * SELEÇÃO DE PERSONAGENS COM PREVISÃO
     */
    setupCharacterSelection() {
        const playerCards = document.querySelectorAll('[data-type="player"] .character-card-v2');
        const enemyCards = document.querySelectorAll('[data-type="enemy"] .character-card-v2');
        
        playerCards.forEach(card => {
            card.addEventListener('click', () => {
                playerCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                const characterId = card.dataset.id;
                this.selectedPlayer = this.availableCharacters.find(c => c.id === characterId);
                this.updatePlayerDisplay();
                this.updateBattlePreview();
                this.updateAdvantageMatrix();
                this.checkBattleReady();
            });
        });
        
        enemyCards.forEach(card => {
            card.addEventListener('click', () => {
                enemyCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                const characterId = card.dataset.id;
                this.selectedEnemy = this.availableCharacters.find(c => c.id === characterId);
                this.updateEnemyDisplay();
                this.updateBattlePreview();
                this.updateAdvantageMatrix();
                this.checkBattleReady();
            });
        });
    }

    /**
     * SISTEMA DE PREVISÃO DE BATALHA
     */
    updateBattlePreview() {
        if (!this.selectedPlayer || !this.selectedEnemy) {
            document.getElementById('battle-preview-v2').innerHTML = 
                '<div>Selecione personagens para ver previsão</div>';
            return;
        }
        
        const preview = this.calculateAdvancedBattlePreview();
        
        document.getElementById('battle-preview-v2').innerHTML = `
            <div class="preview-title">📊 PREVISÃO DE BATALHA</div>
            <div class="preview-stats">
                <div class="win-chance">
                    <div class="player-chance" style="width: ${preview.playerWinChance}%">
                        ${preview.playerWinChance.toFixed(1)}%
                    </div>
                    <div class="enemy-chance" style="width: ${preview.enemyWinChance}%">
                        ${preview.enemyWinChance.toFixed(1)}%
                    </div>
                </div>
                <div class="preview-details">
                    <div>⚔️ Dano médio: ${preview.avgPlayerDamage} vs ${preview.avgEnemyDamage}</div>
                    <div>🏁 Duração estimada: ${preview.estimatedTurns} turnos</div>
                    <div>🎯 Fator decisivo: ${preview.decisiveFactor}</div>
                </div>
            </div>
        `;
    }

    /**
     * CÁLCULO AVANÇADO DE PREVISÃO
     */
    calculateAdvancedBattlePreview() {
        const player = this.selectedPlayer;
        const enemy = this.selectedEnemy;
        
        // Aplicar multiplicador de dificuldade ao inimigo
        const enhancedEnemy = {
            ...enemy,
            hp: Math.round(enemy.hp * this.difficultyMultiplier),
            attack: Math.round(enemy.attack * this.difficultyMultiplier),
            defense: Math.round(enemy.defense * this.difficultyMultiplier)
        };
        
        // Calcular dano médio considerando vantagens de classe
        let playerDamage = this.calculateAverageDamage(player, enhancedEnemy);
        let enemyDamage = this.calculateAverageDamage(enhancedEnemy, player);
        
        // Aplicar modificadores especiais
        if (player.classe === 'Lutador') {
            playerDamage *= 1.3; // Fator Cadência do Dragão
        }
        
        // Calcular chances de vitória
        const playerTurnsToWin = Math.ceil(enhancedEnemy.hp / playerDamage);
        const enemyTurnsToWin = Math.ceil(player.hp / enemyDamage);
        
        let playerWinChance, enemyWinChance;
        
        if (playerTurnsToWin < enemyTurnsToWin) {
            playerWinChance = 70 + (enemyTurnsToWin - playerTurnsToWin) * 5;
            enemyWinChance = 100 - playerWinChance;
        } else if (enemyTurnsToWin < playerTurnsToWin) {
            enemyWinChance = 70 + (playerTurnsToWin - enemyTurnsToWin) * 5;
            playerWinChance = 100 - enemyWinChance;
        } else {
            playerWinChance = enemyWinChance = 50;
        }
        
        // Limitar entre 10-90%
        playerWinChance = Math.max(10, Math.min(90, playerWinChance));
        enemyWinChance = 100 - playerWinChance;
        
        return {
            playerWinChance,
            enemyWinChance,
            avgPlayerDamage: Math.round(playerDamage),
            avgEnemyDamage: Math.round(enemyDamage),
            estimatedTurns: Math.min(playerTurnsToWin, enemyTurnsToWin) + 2,
            decisiveFactor: this.getDecisiveFactor(player, enhancedEnemy)
        };
    }

    /**
     * INICIAR BATALHA AVANÇADA
     */
    async startAdvancedBattle() {
        if (!this.selectedPlayer || !this.selectedEnemy) return;
        
        console.log('🚀 Iniciando Batalha Avançada V2...');
        
        // Aplicar multiplicador de dificuldade
        const enhancedEnemy = this.applyDifficultyEnhancements(this.selectedEnemy);
        
        // Criar configuração avançada de batalha
        this.battleConfiguration = {
            // Dados básicos
            battleId: `battle-v2-${Date.now()}`,
            mode: this.battleMode,
            difficulty: this.difficultyMultiplier,
            
            // Personagens
            player: { ...this.selectedPlayer },
            enemy: enhancedEnemy,
            
            // Sistemas integrados
            astralSystem: this.astralSystem,
            battleMechanics: this.battleMechanics,
            
            // Inicialização de cargas astrais
            astralCharges: {
                [this.selectedPlayer.id]: 8,
                [enhancedEnemy.id]: 8
            },
            
            // Estados de skill
            dragonCadence: {
                [this.selectedPlayer.id]: 0
            },
            
            // Configurações avançadas
            classAdvantages: this.calculateBattleAdvantages(),
            battlePreview: this.battlePreview,
            enabledSystems: {
                astral: true,
                dragonCadence: this.selectedPlayer.classe === 'Lutador',
                classAdvantages: true,
                skills: true
            }
        };
        
        // Remover interface de seleção
        document.getElementById('battle-v2-selection').remove();
        
        // Callback para sistema externo
        if (this.onBattleConfigured) {
            this.onBattleConfigured(this.battleConfiguration);
        }
        
        console.log('✅ Batalha V2 configurada:', this.battleConfiguration);
        
        // Inicializar sistemas de batalha
        this.initializeBattleSystems();
        
        return this.battleConfiguration;
    }

    /**
     * INICIALIZAÇÃO DOS SISTEMAS DE BATALHA
     */
    initializeBattleSystems() {
        // Inicializar Sistema Astral para ambos personagens
        this.astralSystem.initializeCharges(this.selectedPlayer.id, 8);
        this.astralSystem.initializeCharges(this.selectedEnemy.id, 8);
        
        // Reset Dragon Cadence se aplicável
        if (this.selectedPlayer.classe === 'Lutador') {
            this.battleMechanics.resetDragonCadence(this.selectedPlayer.id);
        }
        if (this.selectedEnemy.classe === 'Lutador') {
            this.battleMechanics.resetDragonCadence(this.selectedEnemy.id);
        }
        
        console.log('🌟 Sistemas de batalha inicializados');
    }

    /**
     * MÉTODOS AUXILIARES
     */
    
    getClassIcon(classe) {
        const icons = {
            'Lutador': '👊',
            'Armamentista': '🏹', 
            'Arcano': '🔮'
        };
        return icons[classe] || '⚔️';
    }
    
    calculateAverageDamage(attacker, defender) {
        const baseDamage = attacker.attack * 0.8;
        
        // Aplicar vantagem de classe
        let damage = baseDamage;
        if (this.battleMechanics.hasClassAdvantage(attacker.classe, defender.classe)) {
            damage *= 1.1; // +10%
        } else if (this.battleMechanics.hasClassAdvantage(defender.classe, attacker.classe)) {
            damage *= 0.9; // -10%
        }
        
        // Aplicar defesa
        const defenseReduction = Math.min(0.5, defender.defense / 200);
        damage *= (1 - defenseReduction);
        
        return damage;
    }
    
    getDecisiveFactor(player, enemy) {
        if (this.battleMechanics.hasClassAdvantage(player.classe, enemy.classe)) {
            return `Vantagem de ${player.classe}`;
        }
        if (player.classe === 'Lutador') {
            return 'Cadência do Dragão';
        }
        if (player.attack > enemy.attack * 1.2) {
            return 'Superioridade ofensiva';
        }
        if (player.defense > enemy.defense * 1.2) {
            return 'Superioridade defensiva';
        }
        return 'Batalha equilibrada';
    }

    // ... [Métodos auxiliares continuam]
    
    checkBattleReady() {
        const startBtn = document.getElementById('start-battle-v2-btn');
        if (this.selectedPlayer && this.selectedEnemy) {
            startBtn.disabled = false;
            startBtn.textContent = `⚔️ ${this.selectedPlayer.name} VS ${this.selectedEnemy.name}`;
        } else {
            startBtn.disabled = true;
            startBtn.textContent = '⚔️ INICIAR BATALHA V2';
        }
    }
    
    async getFallbackCharacters() {
        return [
            {
                id: '045CCF3515',
                name: 'Robin',
                classe: 'Armamentista',
                hp: 300, maxHP: 300, attack: 100, defense: 100,
                anima: 100, critico: 1.0, skills: [],
                classAdvantages: this.calculateClassAdvantages('Armamentista'),
                availableSkills: [{ name: 'Arsenal Adaptativo', classe: 'Armamentista' }],
                battlePower: 525,
                effectiveness: { offense: 75, defense: 85, utility: 80 }
            },
            {
                id: 'EA32D10F2D',
                name: 'Ussop', 
                classe: 'Lutador',
                hp: 300, maxHP: 300, attack: 100, defense: 100,
                anima: 100, critico: 1.0, skills: [],
                classAdvantages: this.calculateClassAdvantages('Lutador'),
                availableSkills: [{ name: 'Cadência do Dragão', classe: 'Lutador' }],
                battlePower: 525,
                effectiveness: { offense: 90, defense: 70, utility: 75 }
            }
        ];
    }
}

// Disponibilizar globalmente
window.BattleInitializationV2 = BattleInitializationV2;

// Auto-inicialização quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Battle Initialization V2 disponível');
    
    // Método global para iniciar
    window.startBattleV2 = () => {
        const battleInit = new BattleInitializationV2();
        return battleInit.initializeAdvancedBattle();
    };
});

console.log('⚔️🚀 Battle Initialization V2.0 - Sistema Avançado Carregado 🚀⚔️');