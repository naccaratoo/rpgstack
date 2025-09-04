/**
 * RPGStack Battle System - Art Nouveau Vintage Demo
 * Inspirado na estética de Reverse 1999
 * Versão: 2.0.0 (Vintage Edition)
 */

class VintageBattleDemo {
    constructor() {
        this.currentTurn = 1;
        this.playerData = {
            name: "Herói Ancestral",
            level: 1,
            hp: 100,
            maxHP: 100,
            mp: 50,
            maxMP: 50,
            skills: [
                { name: "Lâmina Etérea", cost: 15, damage: [25, 35], description: "Ataque espiritual que atravessa defesas" },
                { name: "Escudo Arcano", cost: 20, healing: [0, 0], description: "Proteção mística contra danos" },
                { name: "Chama Interior", cost: 25, damage: [35, 50], description: "Invoca fogo espiritual devastador" }
            ]
        };
        
        this.enemyData = {
            name: "Sombra do Passado",
            level: 2,
            hp: 80,
            maxHP: 80,
            mp: 30,
            maxMP: 30
        };
        
        this.characters = [
            {
                id: 1,
                name: "Alquimista Místico",
                level: 1,
                hp: 90,
                maxHP: 90,
                mp: 60,
                maxMP: 60,
                image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRDRBRjM3IiByeD0iOCIvPgo8dGV4dCB4PSI1MCIgeT0iNTUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiMzNjQ1NEYiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtZmFtaWx5PSJzZXJpZiI+QUxRVUlNSVNUQTwvdGV4dD4KPC9zdmc+Cg=="
            },
            {
                id: 2,
                name: "Cavaleiro Eterno",
                level: 1,
                hp: 120,
                maxHP: 120,
                mp: 40,
                maxMP: 40,
                image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjNzIyRjM3IiByeD0iOCIvPgo8dGV4dCB4PSI1MCIgeT0iNTUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNGREY1RTYiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtZmFtaWx5PSJzZXJpZiI+Q0FWQUxFSVJPPC90ZXh0Pgo8L3N2Zz4K"
            },
            {
                id: 3,
                name: "Feiticeira Antiga",
                level: 1,
                hp: 85,
                maxHP: 85,
                mp: 70,
                maxMP: 70,
                image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMzU1RTNCIiByeD0iOCIvPgo8dGV4dCB4PSI1MCIgeT0iNTUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNGREY1RTYiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtZmFtaWx5PSJzZXJpZiI+RkVJVElDRUlSQTwvdGV4dD4KPC9zdmc+Cg=="
            }
        ];
        
        this.selectedCharacter = null;
        this.battleState = 'character-selection';
        this.skillsVisible = false;
        this.logVisible = true;
    }

    init() {
        this.showLoadingScreen();
        setTimeout(() => {
            this.hideLoadingScreen();
            this.showCharacterModal();
            this.setupEventListeners();
            this.populateCharacterGrid();
        }, 2000);
    }

    setupEventListeners() {
        // Character selection
        document.getElementById('startBattle')?.addEventListener('click', () => this.startBattle());
        document.getElementById('backToMenu')?.addEventListener('click', () => this.backToMenu());

        // Action buttons
        document.querySelector('[data-action="attack"]')?.addEventListener('click', () => this.performAttack());
        document.querySelector('[data-action="defend"]')?.addEventListener('click', () => this.performDefend());
        document.querySelector('[data-action="meditate"]')?.addEventListener('click', () => this.performMeditate());
        document.querySelector('[data-action="skills"]')?.addEventListener('click', () => this.toggleSkills());

        // Result modal
        document.getElementById('continueGame')?.addEventListener('click', () => this.continueGame());
        document.getElementById('newBattle')?.addEventListener('click', () => this.newBattle());

        // Battle log toggle
        document.getElementById('logToggle')?.addEventListener('click', () => this.toggleBattleLog());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    handleKeyboard(e) {
        if (this.battleState !== 'battle') return;

        switch(e.key) {
            case '1':
                this.performAttack();
                break;
            case '2':
                this.performDefend();
                break;
            case '3':
                this.performMeditate();
                break;
            case '4':
                this.toggleSkills();
                break;
            case 'Escape':
                if (this.skillsVisible) this.toggleSkills();
                break;
        }
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const loadingBar = document.getElementById('loadingBar');
        
        if (loadingScreen && loadingBar) {
            loadingScreen.style.display = 'flex';
            let progress = 0;
            const interval = setInterval(() => {
                progress += 2;
                loadingBar.style.width = `${progress}%`;
                if (progress >= 100) {
                    clearInterval(interval);
                }
            }, 40);
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    populateCharacterGrid() {
        const grid = document.getElementById('characterGrid');
        if (!grid) return;

        grid.innerHTML = this.characters.map(char => `
            <div class="character-option" data-character-id="${char.id}">
                <div class="character-portrait">
                    <img src="${char.image}" alt="${char.name}">
                </div>
                <div class="character-info">
                    <h4>${char.name}</h4>
                    <div class="character-level">Nível ${char.level}</div>
                    <div class="character-stats">
                        <div class="stat">❤ ${char.hp}</div>
                        <div class="stat">✦ ${char.mp}</div>
                    </div>
                </div>
            </div>
        `).join('');

        // Add click handlers to character options
        grid.querySelectorAll('.character-option').forEach(option => {
            option.addEventListener('click', (e) => {
                grid.querySelectorAll('.character-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                
                const characterId = parseInt(option.dataset.characterId);
                this.selectedCharacter = this.characters.find(char => char.id === characterId);
                
                const startButton = document.getElementById('startBattle');
                if (startButton) {
                    startButton.disabled = false;
                    startButton.textContent = 'Começar Duelo';
                }
            });
        });
    }

    showCharacterModal() {
        const modal = document.getElementById('characterModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    startBattle() {
        if (!this.selectedCharacter) return;

        // Update player data with selected character
        this.playerData = {...this.selectedCharacter};
        
        // Hide character modal
        const modal = document.getElementById('characterModal');
        if (modal) {
            modal.style.display = 'none';
        }

        // Update battle state
        this.battleState = 'battle';
        
        // Update UI with character data
        this.updatePlayerCard();
        this.updateEnemyCard();
        this.populateSkills();
        
        // Add initial log entry
        this.addBattleLogEntry('system', `${this.playerData.name} entra na arena ancestral...`);
        this.addBattleLogEntry('system', `${this.enemyData.name} emerge das sombras!`);
    }

    updatePlayerCard() {
        document.getElementById('playerName').textContent = this.playerData.name;
        document.getElementById('playerLevel').textContent = this.playerData.level;
        document.getElementById('playerHP').textContent = this.playerData.hp;
        document.getElementById('playerMaxHP').textContent = this.playerData.maxHP;
        document.getElementById('playerMP').textContent = this.playerData.mp;
        document.getElementById('playerMaxMP').textContent = this.playerData.maxMP;
        
        const playerImage = document.getElementById('playerImage');
        if (playerImage) {
            playerImage.src = this.playerData.image || playerImage.src;
        }

        // Update health and mana bars
        this.updateHealthBar('player', this.playerData.hp, this.playerData.maxHP);
        this.updateManaBar('player', this.playerData.mp, this.playerData.maxMP);
    }

    updateEnemyCard() {
        document.getElementById('enemyName').textContent = this.enemyData.name;
        document.getElementById('enemyLevel').textContent = this.enemyData.level;
        document.getElementById('enemyHP').textContent = this.enemyData.hp;
        document.getElementById('enemyMaxHP').textContent = this.enemyData.maxHP;
        document.getElementById('enemyMP').textContent = this.enemyData.mp;
        document.getElementById('enemyMaxMP').textContent = this.enemyData.maxMP;

        // Update health and mana bars
        this.updateHealthBar('enemy', this.enemyData.hp, this.enemyData.maxHP);
        this.updateManaBar('enemy', this.enemyData.mp, this.enemyData.maxMP);
    }

    updateHealthBar(target, current, max) {
        const healthBar = document.getElementById(`${target}HealthBar`);
        if (healthBar) {
            const percentage = (current / max) * 100;
            healthBar.style.width = `${percentage}%`;
            
            // Color based on health percentage
            if (percentage <= 25) {
                healthBar.style.background = 'var(--danger-color)';
            } else if (percentage <= 50) {
                healthBar.style.background = 'var(--warning-color)';
            } else {
                healthBar.style.background = 'var(--success-color)';
            }
        }
    }

    updateManaBar(target, current, max) {
        const manaBar = document.getElementById(`${target}ManaBar`);
        if (manaBar) {
            const percentage = (current / max) * 100;
            manaBar.style.width = `${percentage}%`;
        }
    }

    populateSkills() {
        const skillsList = document.getElementById('skillsList');
        if (!skillsList) return;

        skillsList.innerHTML = this.playerData.skills.map((skill, index) => `
            <div class="skill-item" data-skill-index="${index}">
                <div class="skill-icon">✦</div>
                <div class="skill-info">
                    <div class="skill-name">${skill.name}</div>
                    <div class="skill-cost">Custo: ${skill.cost} ✦</div>
                    <div class="skill-description">${skill.description}</div>
                </div>
            </div>
        `).join('');

        // Add click handlers to skills
        skillsList.querySelectorAll('.skill-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const skillIndex = parseInt(item.dataset.skillIndex);
                this.useSkill(skillIndex);
            });
        });
    }

    performAttack() {
        if (this.battleState !== 'battle') return;

        const damage = this.calculateDamage(20, 30);
        const isCritical = Math.random() < 0.15;
        const finalDamage = isCritical ? Math.floor(damage * 1.5) : damage;

        this.enemyData.hp = Math.max(0, this.enemyData.hp - finalDamage);
        
        this.showDamageNumber(finalDamage, isCritical, 'enemy');
        this.addBattleLogEntry(isCritical ? 'critical' : 'damage', 
            `${this.playerData.name} ${isCritical ? 'desfere um golpe crítico' : 'ataca'} causando ${finalDamage} de dano!`);
        
        this.updateEnemyCard();
        
        if (this.enemyData.hp <= 0) {
            this.endBattle('victory');
            return;
        }

        setTimeout(() => this.enemyTurn(), 1500);
    }

    performDefend() {
        if (this.battleState !== 'battle') return;

        this.addBattleLogEntry('buff', `${this.playerData.name} assume posição defensiva!`);
        
        // Restore some mana while defending
        const manaRestore = this.calculateDamage(5, 10);
        this.playerData.mp = Math.min(this.playerData.maxMP, this.playerData.mp + manaRestore);
        this.updatePlayerCard();

        setTimeout(() => this.enemyTurn(), 1500);
    }

    performMeditate() {
        if (this.battleState !== 'battle') return;

        const manaRestore = this.calculateDamage(15, 25);
        const healthRestore = this.calculateDamage(10, 15);
        
        this.playerData.mp = Math.min(this.playerData.maxMP, this.playerData.mp + manaRestore);
        this.playerData.hp = Math.min(this.playerData.maxHP, this.playerData.hp + healthRestore);
        
        this.showDamageNumber(healthRestore, false, 'player', 'heal');
        this.addBattleLogEntry('heal', `${this.playerData.name} medita profundamente, restaurando ${healthRestore} de vida e ${manaRestore} de ânima!`);
        
        this.updatePlayerCard();
        setTimeout(() => this.enemyTurn(), 1500);
    }

    toggleSkills() {
        const skillsPanel = document.getElementById('skillsPanel');
        if (!skillsPanel) return;

        this.skillsVisible = !this.skillsVisible;
        
        if (this.skillsVisible) {
            skillsPanel.style.display = 'block';
            setTimeout(() => skillsPanel.classList.add('visible'), 10);
        } else {
            skillsPanel.classList.remove('visible');
            setTimeout(() => skillsPanel.style.display = 'none', 300);
        }
    }

    useSkill(skillIndex) {
        if (this.battleState !== 'battle') return;

        const skill = this.playerData.skills[skillIndex];
        if (!skill || this.playerData.mp < skill.cost) {
            this.addBattleLogEntry('system', 'Ânima insuficiente para usar esta habilidade!');
            return;
        }

        this.playerData.mp -= skill.cost;
        
        const damage = this.calculateDamage(...skill.damage);
        const isCritical = Math.random() < 0.2;
        const finalDamage = isCritical ? Math.floor(damage * 1.8) : damage;

        this.enemyData.hp = Math.max(0, this.enemyData.hp - finalDamage);
        
        this.showDamageNumber(finalDamage, isCritical, 'enemy');
        this.addBattleLogEntry(isCritical ? 'critical' : 'damage', 
            `${this.playerData.name} usa ${skill.name}${isCritical ? ' criticamente' : ''}, causando ${finalDamage} de dano!`);
        
        this.updatePlayerCard();
        this.updateEnemyCard();
        this.toggleSkills();
        
        if (this.enemyData.hp <= 0) {
            this.endBattle('victory');
            return;
        }

        setTimeout(() => this.enemyTurn(), 1500);
    }

    enemyTurn() {
        if (this.battleState !== 'battle') return;

        this.nextTurn();
        
        const actions = ['attack', 'attack', 'defend'];
        const action = actions[Math.floor(Math.random() * actions.length)];
        
        if (action === 'attack') {
            const damage = this.calculateDamage(15, 25);
            const isCritical = Math.random() < 0.1;
            const finalDamage = isCritical ? Math.floor(damage * 1.5) : damage;

            this.playerData.hp = Math.max(0, this.playerData.hp - finalDamage);
            
            this.showDamageNumber(finalDamage, isCritical, 'player');
            this.addBattleLogEntry(isCritical ? 'critical' : 'damage', 
                `${this.enemyData.name} ${isCritical ? 'ataca criticamente' : 'ataca'}, causando ${finalDamage} de dano!`);
            
            this.updatePlayerCard();
            
            if (this.playerData.hp <= 0) {
                this.endBattle('defeat');
                return;
            }
        } else {
            this.addBattleLogEntry('buff', `${this.enemyData.name} se prepara para o próximo ataque...`);
        }

        setTimeout(() => this.nextTurn(), 1500);
    }

    nextTurn() {
        this.currentTurn++;
        const turnDisplay = document.getElementById('currentTurn');
        if (turnDisplay) {
            turnDisplay.textContent = this.toRoman(this.currentTurn);
        }
    }

    toRoman(num) {
        const values = [10, 9, 5, 4, 1];
        const symbols = ['X', 'IX', 'V', 'IV', 'I'];
        let result = '';
        
        for (let i = 0; i < values.length; i++) {
            while (num >= values[i]) {
                result += symbols[i];
                num -= values[i];
            }
        }
        return result || 'I';
    }

    calculateDamage(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    showDamageNumber(amount, isCritical, target, type = 'damage') {
        const damageOverlay = document.getElementById('damageOverlay');
        if (!damageOverlay) return;

        const damageEl = document.createElement('div');
        damageEl.className = `damage-number ${type} ${isCritical ? 'critical' : ''}`;
        
        let displayText = '';
        if (type === 'heal') {
            displayText = `+${amount}`;
        } else if (isCritical) {
            displayText = `CRÍTICO! ${amount}`;
        } else {
            displayText = amount.toString();
        }
        
        damageEl.textContent = displayText;

        // Position based on target
        const targetCard = document.querySelector(`.${target}-card`);
        if (targetCard) {
            const rect = targetCard.getBoundingClientRect();
            damageEl.style.left = `${rect.left + Math.random() * 100}px`;
            damageEl.style.top = `${rect.top + Math.random() * 50}px`;
        }

        damageOverlay.appendChild(damageEl);

        // Animate and remove
        setTimeout(() => {
            damageEl.style.opacity = '0';
            damageEl.style.transform = 'translateY(-50px) scale(0.5)';
        }, 100);

        setTimeout(() => {
            damageOverlay.removeChild(damageEl);
        }, 1100);
    }

    addBattleLogEntry(type, message) {
        const logContent = document.getElementById('logContent');
        if (!logContent) return;

        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerHTML = `
            <span class="entry-marker">◊</span>
            <span class="entry-text">${message}</span>
        `;

        logContent.appendChild(entry);
        logContent.scrollTop = logContent.scrollHeight;

        // Add entrance animation
        setTimeout(() => {
            entry.classList.add('visible');
        }, 10);
    }

    toggleBattleLog() {
        const logContent = document.getElementById('logContent');
        const logToggle = document.getElementById('logToggle');
        
        if (!logContent || !logToggle) return;

        this.logVisible = !this.logVisible;
        
        if (this.logVisible) {
            logContent.style.display = 'block';
            logToggle.textContent = '▼';
        } else {
            logContent.style.display = 'none';
            logToggle.textContent = '▶';
        }
    }

    endBattle(result) {
        this.battleState = 'ended';
        
        const resultModal = document.getElementById('resultModal');
        const resultTitle = document.getElementById('resultTitle');
        
        if (resultModal && resultTitle) {
            resultTitle.textContent = result === 'victory' ? '✧ Vitória Ancestral ✧' : '✧ Derrota Honorável ✧';
            resultTitle.className = result;
            
            // Calculate experience
            const expGained = result === 'victory' ? this.calculateDamage(50, 100) : this.calculateDamage(10, 30);
            const expDisplay = document.getElementById('expGained');
            if (expDisplay) {
                expDisplay.textContent = expGained;
            }
            
            resultModal.style.display = 'flex';
            
            this.addBattleLogEntry('system', result === 'victory' 
                ? `${this.playerData.name} emerge vitorioso do duelo ancestral!` 
                : `${this.enemyData.name} prova ser um adversário formidável...`);
        }
    }

    continueGame() {
        const resultModal = document.getElementById('resultModal');
        if (resultModal) {
            resultModal.style.display = 'none';
        }
        
        // Reset for potential new battle
        this.resetBattle();
    }

    newBattle() {
        this.continueGame();
        this.showCharacterModal();
    }

    resetBattle() {
        this.currentTurn = 1;
        this.skillsVisible = false;
        this.battleState = 'character-selection';
        
        // Reset enemy
        this.enemyData.hp = this.enemyData.maxHP;
        this.enemyData.mp = this.enemyData.maxMP;
        
        // Clear log
        const logContent = document.getElementById('logContent');
        if (logContent) {
            logContent.innerHTML = `
                <div class="log-entry">
                    <span class="entry-marker">◊</span>
                    <span class="entry-text">A arena aguarda um novo duelo...</span>
                </div>
            `;
        }
        
        // Reset turn display
        const turnDisplay = document.getElementById('currentTurn');
        if (turnDisplay) {
            turnDisplay.textContent = 'I';
        }
    }

    backToMenu() {
        // This would typically navigate back to main menu
        console.log('Voltando ao menu principal...');
        this.resetBattle();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const battleDemo = new VintageBattleDemo();
    battleDemo.init();
});

// Add some utility functions for enhanced experience
function playSound(soundType) {
    // Placeholder for sound system
    console.log(`🔊 Tocando som: ${soundType}`);
}

function addScreenShake() {
    document.body.classList.add('screen-shake');
    setTimeout(() => {
        document.body.classList.remove('screen-shake');
    }, 500);
}

// Add screen shake CSS if not present
const shakeCSS = `
    .screen-shake {
        animation: shake 0.5s ease-in-out;
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;

const style = document.createElement('style');
style.textContent = shakeCSS;
document.head.appendChild(style);