// ⚔️ Battle System JavaScript - RPGStack
class BattleSystem {
    constructor() {
        this.currentBattle = null;
        this.playerCharacter = null;
        this.enemyCharacter = null;
        this.battleState = 'setup'; // setup, player_turn, enemy_turn, ended
        this.battleLog = [];
        this.characters = [];
        
        // Inicializar mecânicas de batalha
        this.battleMechanics = new BattleMechanics();
        
        // Inicializar sistema de buff/debuff
        this.buffSystem = new BuffDebuffSystem(this.battleMechanics);
        
        this.initializeUI();
        this.loadCharacters();
    }

    initializeUI() {
        // Modal elements
        this.setupModal = document.getElementById('setup-modal');
        this.resultModal = document.getElementById('result-modal');
        this.loadingOverlay = document.getElementById('loading-overlay');
        
        // Battle elements
        this.playerSprite = document.getElementById('player-sprite');
        this.enemySprite = document.getElementById('enemy-sprite');
        this.playerName = document.getElementById('player-name');
        this.enemyName = document.getElementById('enemy-name');
        this.playerHP = document.getElementById('player-hp');
        this.playerMaxHP = document.getElementById('player-max-hp');
        this.playerAnima = document.getElementById('player-anima');
        this.playerMaxAnima = document.getElementById('player-max-anima');
        this.enemyHP = document.getElementById('enemy-hp');
        this.enemyMaxHP = document.getElementById('enemy-max-hp');
        this.playerLevel = document.getElementById('player-level');
        this.enemyLevel = document.getElementById('enemy-level');
        this.playerHealthBar = document.getElementById('player-health-bar');
        this.playerAnimaBar = document.getElementById('player-anima-bar');
        this.enemyHealthBar = document.getElementById('enemy-health-bar');
        this.battleLogEl = document.getElementById('battle-log');
        this.turnIndicator = document.getElementById('turn-indicator');
        this.newMessagesIndicator = document.getElementById('new-messages-indicator');
        
        // Action buttons
        this.actionMenu = document.getElementById('action-menu');
        this.attackBtn = document.getElementById('attack-btn');
        this.defendBtn = document.getElementById('defend-btn');
        this.meditateBtn = document.getElementById('meditate-btn');
        this.skillsSection = document.getElementById('skills-section');
        
        // Modal buttons
        this.startBattleBtn = document.getElementById('start-battle-btn');
        this.backBtn = document.getElementById('back-btn');
        this.continueBtn = document.getElementById('continue-btn');
        this.newBattleBtn = document.getElementById('new-battle-btn');
        
        // Character select
        this.characterSelect = document.getElementById('character-select');
        
        // Buff indicators
        this.playerBuffs = document.getElementById('player-buffs');
        
        this.bindEvents();
    }

    bindEvents() {
        // Action buttons
        this.attackBtn.addEventListener('click', () => this.playerAttack());
        this.defendBtn.addEventListener('click', () => this.playerDefend());
        this.meditateBtn.addEventListener('click', () => this.playerMeditate());
        
        // Modal buttons
        this.startBattleBtn.addEventListener('click', () => this.startBattle());
        this.backBtn.addEventListener('click', () => this.goBack());
        this.continueBtn.addEventListener('click', () => this.continueBattle());
        this.newBattleBtn.addEventListener('click', () => this.newBattle());
        
        // New messages indicator click
        this.newMessagesIndicator.addEventListener('click', () => {
            this.scrollToBottom();
            this.hideNewMessagesIndicator();
        });
        
        // Track scroll position to show/hide new messages indicator
        this.battleLogEl.addEventListener('scroll', () => {
            if (this.isScrolledToBottom()) {
                this.hideNewMessagesIndicator();
            }
        });
    }

    async loadCharacters() {
        try {
            this.showLoading(true);
            const response = await fetch('/api/characters');
            const data = await response.json();
            this.characters = Object.values(data.characters || {});
            this.renderCharacterSelect();
            this.showLoading(false);
        } catch (error) {
            console.error('Error loading characters:', error);
            this.addBattleLog('Erro ao carregar personagens!', 'error');
            this.showLoading(false);
        }
    }

    renderCharacterSelect() {
        this.characterSelect.innerHTML = '';
        
        this.characters.forEach(character => {
            const card = document.createElement('div');
            card.className = 'character-card';
            card.dataset.characterId = character.id;
            
            card.innerHTML = `
                <img src="${character.sprite}" alt="${character.name}" 
                     onerror="this.src='assets/sprites/default.png'">
                <h4>${character.name}</h4>
                <div class="character-stats">
                    <div>Nível: ${character.level}</div>
                    <div>HP: ${character.hp}/${character.maxHP}</div>
                    <div>ATK: ${character.attack} | DEF: ${character.defense}</div>
                </div>
            `;
            
            card.addEventListener('click', () => this.selectCharacter(character));
            this.characterSelect.appendChild(card);
        });
    }

    selectCharacter(character) {
        // Remove previous selection
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Select current character
        const selectedCard = document.querySelector(`[data-character-id="${character.id}"]`);
        selectedCard.classList.add('selected');
        
        this.playerCharacter = { ...character };
        this.startBattleBtn.disabled = false;
    }

    async startBattle() {
        if (!this.playerCharacter) return;
        
        try {
            this.showLoading(true);
            this.setupModal.style.display = 'none';
            
            // Select random enemy (boss character)
            this.enemyCharacter = this.selectBossEnemy();
            
            // Initialize battle
            this.currentBattle = {
                id: this.generateBattleId(),
                player: { ...this.playerCharacter, currentHP: this.playerCharacter.hp, currentAnima: this.playerCharacter.anima || 50 },
                enemy: { ...this.enemyCharacter, currentHP: this.enemyCharacter.hp },
                turn: 'player',
                round: 1
            };
            
            // Registrar container de buffs do jogador
            this.buffSystem.registerBuffContainer(this.playerCharacter.id, this.playerBuffs);
            
            this.updateBattleUI();
            this.updateBuffIcons();
            this.loadCharacterSkills();
            this.battleState = 'player_turn';
            this.addBattleLog(`Batalha contra ${this.enemyCharacter.name} começou!`);
            this.addBattleLog('Sua vez de atacar!');
            
            this.showLoading(false);
            this.updateTurnIndicator();
            
            // Ensure log is scrolled to bottom on battle start and hide indicator
            setTimeout(() => {
                this.scrollLogToBottom();
                this.hideNewMessagesIndicator();
            }, 200);
            
        } catch (error) {
            console.error('Error starting battle:', error);
            this.addBattleLog('Erro ao iniciar batalha!', 'error');
            this.showLoading(false);
        }
    }

    selectBossEnemy() {
        // Select boss characters (higher level characters)
        const bossCharacters = this.characters.filter(char => 
            char.id !== this.playerCharacter.id && char.level >= this.playerCharacter.level
        );
        
        if (bossCharacters.length === 0) {
            // If no boss available, select any character except player
            const otherCharacters = this.characters.filter(char => char.id !== this.playerCharacter.id);
            return otherCharacters[Math.floor(Math.random() * otherCharacters.length)];
        }
        
        // Select random boss
        const selectedBoss = bossCharacters[Math.floor(Math.random() * bossCharacters.length)];
        
        // Boss enhancement - increase stats slightly
        return {
            ...selectedBoss,
            hp: Math.floor(selectedBoss.hp * 1.2),
            maxHP: Math.floor(selectedBoss.hp * 1.2),
            attack: Math.floor(selectedBoss.attack * 1.1),
            defense: Math.floor(selectedBoss.defense * 1.1)
        };
    }

    updateBattleUI() {
        const { player, enemy } = this.currentBattle;
        
        // Update player info
        this.playerName.textContent = player.name;
        this.playerHP.textContent = player.currentHP;
        this.playerMaxHP.textContent = player.maxHP;
        this.playerAnima.textContent = player.currentAnima;
        this.playerMaxAnima.textContent = player.anima || 50;
        this.playerLevel.textContent = player.level;
        this.playerSprite.src = player.sprite;
        
        // Update enemy info
        this.enemyName.textContent = enemy.name;
        this.enemyHP.textContent = enemy.currentHP;
        this.enemyMaxHP.textContent = enemy.maxHP;
        this.enemyLevel.textContent = enemy.level;
        this.enemySprite.src = enemy.sprite;
        
        // Update health bars
        const playerHealthPercent = (player.currentHP / player.maxHP) * 100;
        const playerAnimaPercent = (player.currentAnima / (player.anima || 50)) * 100;
        const enemyHealthPercent = (enemy.currentHP / enemy.maxHP) * 100;
        
        this.playerHealthBar.style.width = `${playerHealthPercent}%`;
        this.playerAnimaBar.style.width = `${playerAnimaPercent}%`;
        this.enemyHealthBar.style.width = `${enemyHealthPercent}%`;
        
        // Update health bar colors based on percentage
        this.updateHealthBarColor(this.playerHealthBar, playerHealthPercent);
        this.updateHealthBarColor(this.enemyHealthBar, enemyHealthPercent);
        
        // Ensure battle log is scrolled to bottom after UI update
        this.scrollLogToBottom();
    }
    
    scrollLogToBottom() {
        if (this.battleLogEl) {
            this.scrollToBottom();
        }
    }

    updateHealthBarColor(healthBar, percentage) {
        if (percentage > 50) {
            healthBar.style.background = 'linear-gradient(to right, #27ae60, #2ecc71)';
        } else if (percentage > 25) {
            healthBar.style.background = 'linear-gradient(to right, #f39c12, #e67e22)';
        } else {
            healthBar.style.background = 'linear-gradient(to right, #e74c3c, #c0392b)';
        }
    }

    updateTurnIndicator() {
        const turnText = this.battleState === 'player_turn' ? 'Sua vez!' : 'Turno do inimigo!';
        this.turnIndicator.querySelector('.turn-text').textContent = turnText;
        
        // Enable/disable action buttons
        const buttonsDisabled = this.battleState !== 'player_turn';
        this.attackBtn.disabled = buttonsDisabled;
        this.defendBtn.disabled = buttonsDisabled;
        this.meditateBtn.disabled = buttonsDisabled;
        
        // Also disable skill buttons
        const skillButtons = this.skillsSection.querySelectorAll('.skill-action-btn');
        skillButtons.forEach(btn => btn.disabled = buttonsDisabled);
        
        // Ensure log stays scrolled to bottom when turn changes
        setTimeout(() => this.scrollToBottom(), 100);
    }

    // Player Actions
    playerAttack() {
        if (this.battleState !== 'player_turn') return;
        
        // Calcular dano usando as novas mecânicas
        let damage = this.battleMechanics.calculateBasicAttackDamage(
            this.currentBattle.player,
            this.currentBattle.enemy
        );
        
        // Aplicar Cadência do Dragão se jogador é Lutador
        if (this.currentBattle.player.classe === 'Lutador') {
            const cadenceResult = this.battleMechanics.processDragonCadence(this.currentBattle.player.id);
            
            // Aplicar o buff que estava ativo no ataque atual
            if (cadenceResult.appliedBuff > 0) {
                const buffMultiplier = 1 + (cadenceResult.appliedBuff / 100);
                damage = Math.round(damage * buffMultiplier);
            }
            
            this.addBattleLog(cadenceResult.message, 'skill');
            
            // Adicionar efeito visual de buff se mudou
            if (cadenceResult.appliedBuff !== cadenceResult.currentBuff) {
                this.buffSystem.addTemporaryEffect(this.currentBattle.player.id, 'buff');
            }
        }
        
        // Aplicar Arsenal Adaptativo se jogador é Armamentista
        if (this.currentBattle.player.classe === 'Armamentista') {
            const arsenalResult = this.battleMechanics.processArsenalAdaptativo(this.currentBattle.player.id, 'attack');
            if (arsenalResult.appliedBuff > 0) {
                const buffMultiplier = 1 + (arsenalResult.appliedBuff / 100);
                damage = Math.round(damage * buffMultiplier);
            }
            this.addBattleLog(arsenalResult.message, 'skill');
        }
        
        // Aplicar defesa
        damage = this.battleMechanics.applyDefense(damage, this.currentBattle.enemy.id);
        
        // Mostrar vantagem de classe
        const advantageInfo = this.battleMechanics.getClassAdvantageInfo(
            this.currentBattle.player.classe, 
            this.currentBattle.enemy.classe
        );
        if (advantageInfo.attackerHasAdvantage || advantageInfo.defenderHasAdvantage) {
            this.addBattleLog(advantageInfo.advantageText, 'skill');
        }
        
        this.currentBattle.enemy.currentHP = Math.max(0, this.currentBattle.enemy.currentHP - damage);
        
        this.addBattleLog(`${this.currentBattle.player.name} atacou ${this.currentBattle.enemy.name}!`, 'damage');
        this.addBattleLog(`${this.currentBattle.enemy.name} recebeu ${damage} de dano!`, 'damage');
        
        this.animateDamage('enemy');
        this.updateBattleUI();
        this.updateBuffIcons();
        
        if (this.checkBattleEnd()) return;
        
        this.endPlayerTurn();
    }

    playerDefend() {
        if (this.battleState !== 'player_turn') return;
        
        // Usar mecânicas de defesa
        this.battleMechanics.setDefending(this.currentBattle.player.id, true);
        
        // Quebrar mecânicas especiais
        if (this.currentBattle.player.classe === 'Lutador') {
            const cadenceResult = this.battleMechanics.breakDragonCadence(this.currentBattle.player.id);
            if (cadenceResult.broken) {
                this.addBattleLog(cadenceResult.message, 'skill');
            }
        }
        
        if (this.currentBattle.player.classe === 'Armamentista') {
            const arsenalResult = this.battleMechanics.processArsenalAdaptativo(this.currentBattle.player.id, 'defense');
            this.addBattleLog(arsenalResult.message, 'skill');
        }
        
        this.addBattleLog(`${this.currentBattle.player.name} está se defendendo! (Imune a dano não-crítico)`);
        this.updateBuffIcons();
        
        this.endPlayerTurn();
    }

    playerSkill() {
        if (this.battleState !== 'player_turn') return;
        
        const animaCost = 10;
        if (this.currentBattle.player.currentAnima < animaCost) {
            this.addBattleLog('Ânima insuficiente para usar habilidade!', 'error');
            return;
        }
        
        this.currentBattle.player.currentAnima -= animaCost;
        
        const damage = this.calculateDamage(
            this.currentBattle.player,
            this.currentBattle.enemy,
            'skill'
        );
        
        this.currentBattle.enemy.currentHP = Math.max(0, this.currentBattle.enemy.currentHP - damage);
        
        this.addBattleLog(`${this.currentBattle.player.name} usou uma habilidade especial!`, 'skill');
        this.addBattleLog(`${this.currentBattle.enemy.name} recebeu ${damage} de dano mágico!`, 'damage');
        
        this.animateDamage('enemy');
        this.updateBattleUI();
        
        if (this.checkBattleEnd()) return;
        
        this.endPlayerTurn();
    }

    playerItem() {
        if (this.battleState !== 'player_turn') return;
        
        const healAmount = Math.floor(this.currentBattle.player.maxHP * 0.3);
        const oldHP = this.currentBattle.player.currentHP;
        this.currentBattle.player.currentHP = Math.min(
            this.currentBattle.player.maxHP,
            this.currentBattle.player.currentHP + healAmount
        );
        
        const actualHeal = this.currentBattle.player.currentHP - oldHP;
        
        this.addBattleLog(`${this.currentBattle.player.name} usou uma poção!`, 'heal');
        this.addBattleLog(`${this.currentBattle.player.name} recuperou ${actualHeal} HP!`, 'heal');
        
        this.animateHeal('player');
        this.updateBattleUI();
        
        this.endPlayerTurn();
    }

    endPlayerTurn() {
        this.battleState = 'enemy_turn';
        this.updateTurnIndicator();
        
        setTimeout(() => {
            this.enemyTurn();
        }, 1500);
    }

    enemyTurn() {
        if (this.battleState !== 'enemy_turn') return;
        
        // Simple AI: 70% attack, 20% skill, 10% defend
        const action = Math.random();
        
        if (action < 0.7) {
            this.enemyAttack();
        } else if (action < 0.9) {
            this.enemySkill();
        } else {
            this.enemyDefend();
        }
        
        setTimeout(() => {
            if (this.battleState === 'enemy_turn') {
                this.endEnemyTurn();
            }
        }, 1500);
    }

    enemyAttack() {
        // Calcular dano usando as novas mecânicas
        let damage = this.battleMechanics.calculateBasicAttackDamage(
            this.currentBattle.enemy,
            this.currentBattle.player
        );
        
        // Aplicar defesa usando as mecânicas
        damage = this.battleMechanics.applyDefense(damage, this.currentBattle.player.id);
        
        if (damage === 0 && this.battleMechanics.isDefending(this.currentBattle.player.id)) {
            this.addBattleLog(`${this.currentBattle.player.name} defendeu completamente o ataque!`);
        }
        
        // Mostrar vantagem de classe
        const advantageInfo = this.battleMechanics.getClassAdvantageInfo(
            this.currentBattle.enemy.classe, 
            this.currentBattle.player.classe
        );
        if (advantageInfo.attackerHasAdvantage || advantageInfo.defenderHasAdvantage) {
            this.addBattleLog(advantageInfo.advantageText, 'skill');
        }
        
        this.currentBattle.player.currentHP = Math.max(0, this.currentBattle.player.currentHP - damage);
        
        this.addBattleLog(`${this.currentBattle.enemy.name} atacou ${this.currentBattle.player.name}!`, 'damage');
        this.addBattleLog(`${this.currentBattle.player.name} recebeu ${damage} de dano!`, 'damage');
        
        this.animateDamage('player');
        this.updateBattleUI();
    }

    enemySkill() {
        // Skill básica do inimigo
        const basicSkill = { damage: 20, anima_cost: 10 };
        
        let damage = this.battleMechanics.calculateSkillDamage(
            this.currentBattle.enemy,
            this.currentBattle.player,
            basicSkill
        );
        
        // Aplicar defesa
        damage = this.battleMechanics.applyDefense(damage, this.currentBattle.player.id);
        
        // Mostrar vantagem de classe
        const advantageInfo = this.battleMechanics.getClassAdvantageInfo(
            this.currentBattle.enemy.classe, 
            this.currentBattle.player.classe
        );
        if (advantageInfo.attackerHasAdvantage || advantageInfo.defenderHasAdvantage) {
            this.addBattleLog(advantageInfo.advantageText, 'skill');
        }
        
        this.currentBattle.player.currentHP = Math.max(0, this.currentBattle.player.currentHP - damage);
        
        this.addBattleLog(`${this.currentBattle.enemy.name} usou uma habilidade especial!`, 'skill');
        this.addBattleLog(`${this.currentBattle.player.name} recebeu ${damage} de dano mágico!`, 'damage');
        
        this.animateDamage('player');
        this.updateBattleUI();
    }

    enemyDefend() {
        this.battleMechanics.setDefending(this.currentBattle.enemy.id, true);
        this.addBattleLog(`${this.currentBattle.enemy.name} está se defendendo! (Imune a dano não-crítico)`);
    }

    endEnemyTurn() {
        // Reset estados de defesa usando as mecânicas
        this.battleMechanics.resetTurnStates();
        
        if (this.checkBattleEnd()) return;
        
        this.currentBattle.round++;
        this.battleState = 'player_turn';
        this.updateTurnIndicator();
    }

    async loadCharacterSkills() {
        if (!this.playerCharacter) return;
        
        try {
            // Clear existing skills
            this.skillsSection.innerHTML = '';
            
            // Fetch all available skills from API
            const response = await fetch('/api/skills');
            const result = await response.json();
            
            if (result.success && result.data.skills && result.data.skills.length > 0) {
                // Filter skills by character class
                const playerClass = this.playerCharacter.classe || 'Lutador';
                const classSkills = result.data.skills.filter(skill => skill.classe === playerClass);
                
                if (classSkills.length > 0) {
                    classSkills.forEach(skill => this.createSkillButton(skill));
                    this.addBattleLog(`${classSkills.length} skill(s) de ${playerClass} carregada(s).`);
                } else {
                    this.addDefaultSkillsForClass(playerClass);
                    this.addBattleLog(`Skills padrão de ${playerClass} carregadas.`);
                }
            } else {
                // Add some default skills for testing
                this.addDefaultSkillsForClass(this.playerCharacter.classe || 'Lutador');
            }
        } catch (error) {
            console.error('Error loading character skills:', error);
            this.addDefaultSkillsForClass(this.playerCharacter.classe || 'Lutador');
        }
    }

    async getCharacterSkills(characterId) {
        try {
            // For now, we'll use a mock implementation
            // In a real implementation, this would fetch from the API
            const response = await fetch('/api/skills');
            const result = await response.json();
            
            if (result.success) {
                // Filter skills or return a subset for this character
                return result.data.skills.slice(0, 3); // Return first 3 skills for demo
            }
            return [];
        } catch (error) {
            console.error('Error fetching skills:', error);
            return [];
        }
    }

    addDefaultSkillsForClass(playerClass) {
        // Add default skills based on character class
        let defaultSkills = [];
        
        switch (playerClass) {
            case 'Lutador':
                defaultSkills = [
                    { id: 'default_combat_strike', name: 'Golpe Poderoso', damage: 30, anima_cost: 10, type: 'combat', classe: 'Lutador' },
                    { id: 'default_rage', name: 'Fúria', damage: 35, anima_cost: 15, type: 'buff', classe: 'Lutador' }
                ];
                break;
            case 'Armamentista':
                defaultSkills = [
                    { id: 'default_precise_shot', name: 'Tiro Certeiro', damage: 25, anima_cost: 12, type: 'combat', classe: 'Armamentista' },
                    { id: 'default_armor_pierce', name: 'Perfurar Armadura', damage: 28, anima_cost: 18, type: 'debuff', classe: 'Armamentista' }
                ];
                break;
            case 'Arcano':
                defaultSkills = [
                    { id: 'default_heal', name: 'Cura Menor', damage: 0, anima_cost: 15, type: 'healing', classe: 'Arcano' },
                    { id: 'default_fireball', name: 'Bola de Fogo', damage: 25, anima_cost: 20, type: 'magic', classe: 'Arcano' }
                ];
                break;
            default:
                defaultSkills = [
                    { id: 'default_basic_attack', name: 'Ataque Básico', damage: 20, anima_cost: 5, type: 'combat', classe: 'Lutador' }
                ];
        }
        
        defaultSkills.forEach(skill => this.createSkillButton(skill));
    }

    createSkillButton(skill) {
        const skillButton = document.createElement('button');
        skillButton.className = 'skill-action-btn';
        skillButton.dataset.skillId = skill.id;
        
        const canAfford = this.currentBattle.player.currentAnima >= (skill.anima_cost || 0);
        if (!canAfford) {
            skillButton.classList.add('insufficient-anima');
            skillButton.disabled = true;
        }
        
        skillButton.innerHTML = `
            <div class="skill-info">
                <span>${this.getSkillIcon(skill.type)} ${skill.name}</span>
                ${skill.damage > 0 ? `<span class="skill-damage">${skill.damage} dano</span>` : ''}
            </div>
            <div class="skill-cost">${skill.anima_cost || 0} Ânima</div>
        `;
        
        skillButton.addEventListener('click', () => this.playerUseSkill(skill));
        this.skillsSection.appendChild(skillButton);
    }

    getSkillIcon(type) {
        const icons = {
            healing: '💚',
            magic: '✨',
            combat: '⚔️',
            passive: '🛡️',
            utility: '🔧',
            buff: '↗️',
            debuff: '↘️'
        };
        return icons[type] || '✨';
    }

    playerMeditate() {
        if (this.battleState !== 'player_turn') return;
        
        // Usar mecânicas de meditação
        const meditationResult = this.battleMechanics.meditate(this.currentBattle.player);
        
        // Aplicar resultados
        this.currentBattle.player.currentAnima = meditationResult.newAnima;
        this.currentBattle.player.currentHP = meditationResult.newHp;
        
        // Quebrar mecânicas especiais
        if (this.currentBattle.player.classe === 'Lutador') {
            const cadenceResult = this.battleMechanics.breakDragonCadence(this.currentBattle.player.id);
            if (cadenceResult.broken) {
                this.addBattleLog(cadenceResult.message, 'skill');
            }
        }
        
        if (this.currentBattle.player.classe === 'Armamentista') {
            const arsenalResult = this.battleMechanics.processArsenalAdaptativo(this.currentBattle.player.id, 'meditation');
            this.addBattleLog(arsenalResult.message, 'skill');
        }
        
        this.addBattleLog(meditationResult.message);
        this.updateBattleUI();
        this.updateBuffIcons();
        this.loadCharacterSkills(); // Refresh skill buttons with updated ânima
        
        setTimeout(() => this.endPlayerTurn(), 1000);
    }

    playerUseSkill(skill) {
        if (this.battleState !== 'player_turn') return;
        
        const baseCost = skill.anima_cost || 0;
        
        // Calcular custo efetivo usando Convergência Ânima para Arcanos
        let effectiveCost = baseCost;
        if (this.currentBattle.player.classe === 'Arcano' && baseCost > 0) {
            const convergenciaResult = this.battleMechanics.processConvergenciaAnima(this.currentBattle.player.id, baseCost);
            effectiveCost = convergenciaResult.effectiveCost;
            this.addBattleLog(convergenciaResult.message, 'skill');
        }
        
        // Verificar se tem ânima suficiente
        if (this.currentBattle.player.currentAnima < effectiveCost) {
            this.addBattleLog(`Não há ânima suficiente para usar ${skill.name}! (Precisa ${effectiveCost}, tem ${this.currentBattle.player.currentAnima})`);
            return;
        }
        
        // Consumir ânima
        this.currentBattle.player.currentAnima -= effectiveCost;
        
        // Quebrar Cadência do Dragão se for Lutador
        if (this.currentBattle.player.classe === 'Lutador') {
            const cadenceResult = this.battleMechanics.breakDragonCadence(this.currentBattle.player.id);
            if (cadenceResult.broken) {
                this.addBattleLog(cadenceResult.message, 'skill');
            }
        }
        
        // Processar Arsenal Adaptativo se for Armamentista
        if (this.currentBattle.player.classe === 'Armamentista') {
            const arsenalResult = this.battleMechanics.processArsenalAdaptativo(this.currentBattle.player.id, 'support');
            this.addBattleLog(arsenalResult.message, 'skill');
        }
        
        if (skill.type === 'healing') {
            // Healing skill
            const healAmount = 30; // Base heal amount
            const oldHP = this.currentBattle.player.currentHP;
            const maxHP = this.currentBattle.player.maxHP;
            
            this.currentBattle.player.currentHP = Math.min(maxHP, oldHP + healAmount);
            const actualHeal = this.currentBattle.player.currentHP - oldHP;
            
            this.addBattleLog(`${this.playerCharacter.name} usa ${skill.name} e recupera ${actualHeal} HP!`);
        } else {
            // Damage skill - usar novas mecânicas
            let damage = this.battleMechanics.calculateSkillDamage(
                this.currentBattle.player, 
                this.currentBattle.enemy, 
                skill
            );
            
            // Aplicar defesa
            damage = this.battleMechanics.applyDefense(damage, this.currentBattle.enemy.id);
            
            // Mostrar vantagem de classe
            const advantageInfo = this.battleMechanics.getClassAdvantageInfo(
                this.currentBattle.player.classe, 
                this.currentBattle.enemy.classe
            );
            if (advantageInfo.attackerHasAdvantage || advantageInfo.defenderHasAdvantage) {
                this.addBattleLog(advantageInfo.advantageText, 'skill');
            }
            
            this.currentBattle.enemy.currentHP = Math.max(0, this.currentBattle.enemy.currentHP - damage);
            
            this.addBattleLog(`${this.playerCharacter.name} usa ${skill.name} e causa ${damage} de dano!`);
        }
        
        this.updateBattleUI();
        this.updateBuffIcons();
        this.loadCharacterSkills(); // Refresh skill buttons with updated ânima
        
        setTimeout(() => this.endPlayerTurn(), 1000);
    }

    // Funções de cálculo antigas removidas - agora usando BattleMechanics
    
    /**
     * Atualizar ícones de buff na interface
     */
    updateBuffIcons() {
        if (!this.currentBattle || !this.playerBuffs) return;
        
        const playerId = this.currentBattle.player.id;
        const playerClass = this.currentBattle.player.classe;
        
        // Usar o novo sistema de buff/debuff
        this.buffSystem.updateBuffsForCharacter(playerId, playerClass);
    }

    checkBattleEnd() {
        if (this.currentBattle.player.currentHP <= 0) {
            this.endBattle('defeat');
            return true;
        } else if (this.currentBattle.enemy.currentHP <= 0) {
            this.endBattle('victory');
            return true;
        }
        return false;
    }

    endBattle(result) {
        this.battleState = 'ended';
        this.updateTurnIndicator();
        
        setTimeout(() => {
            this.showBattleResult(result);
        }, 1500);
    }

    showBattleResult(result) {
        const resultTitle = document.getElementById('result-title');
        const resultContent = document.getElementById('result-content');
        const expGained = document.getElementById('exp-gained');
        const levelUp = document.getElementById('level-up');
        const newLevel = document.getElementById('new-level');
        
        if (result === 'victory') {
            resultTitle.textContent = '🏆 Vitória!';
            const exp = Math.floor(this.currentBattle.enemy.level * 10 + Math.random() * 20);
            expGained.textContent = exp;
            
            // Check level up (simplified)
            if (Math.random() < 0.3) {
                levelUp.style.display = 'block';
                newLevel.textContent = this.currentBattle.player.level + 1;
            }
        } else {
            resultTitle.textContent = '💀 Derrota!';
            expGained.textContent = '0';
            levelUp.style.display = 'none';
        }
        
        this.resultModal.style.display = 'flex';
    }

    // Animation methods
    animateDamage(target) {
        const sprite = target === 'player' ? this.playerSprite : this.enemySprite;
        sprite.classList.add('damage-effect');
        setTimeout(() => {
            sprite.classList.remove('damage-effect');
        }, 600);
    }

    animateHeal(target) {
        const sprite = target === 'player' ? this.playerSprite : this.enemySprite;
        sprite.classList.add('heal-effect');
        setTimeout(() => {
            sprite.classList.remove('heal-effect');
        }, 800);
    }

    addBattleLog(message, type = 'normal') {
        // Check if user is scrolled to bottom before adding message
        const logContainer = this.battleLogEl;
        const wasAtBottom = this.isScrolledToBottom();
        
        const logMessage = document.createElement('div');
        logMessage.className = `log-message ${type}`;
        logMessage.textContent = message;
        
        // Add message with fade-in effect
        logMessage.style.opacity = '0';
        logMessage.style.transform = 'translateY(10px)';
        
        logContainer.appendChild(logMessage);
        
        // Animate message in
        requestAnimationFrame(() => {
            logMessage.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            logMessage.style.opacity = '1';
            logMessage.style.transform = 'translateY(0)';
        });
        
        // Always auto-scroll to show new messages (this is what user wants)
        // Use multiple timeouts to ensure scroll works
        setTimeout(() => {
            this.scrollToBottom();
        }, 10);
        
        setTimeout(() => {
            this.scrollToBottom();
            this.hideNewMessagesIndicator();
        }, 100);
        
        // Remove old messages to prevent excessive growth (keep last 30 messages)
        const messages = logContainer.querySelectorAll('.log-message');
        if (messages.length > 30) {
            const messageToRemove = messages[0];
            messageToRemove.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            messageToRemove.style.opacity = '0';
            messageToRemove.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                if (messageToRemove.parentNode) {
                    messageToRemove.remove();
                }
            }, 200);
        }
        
        this.battleLog.push({ message, type, timestamp: Date.now() });
        
        // Keep log array limited too
        if (this.battleLog.length > 30) {
            this.battleLog.shift();
        }
    }
    
    isScrolledToBottom() {
        const logContainer = this.battleLogEl;
        const threshold = 10; // 10px threshold for "close to bottom"
        return logContainer.scrollHeight - logContainer.clientHeight <= logContainer.scrollTop + threshold;
    }
    
    scrollToBottom() {
        const logContainer = this.battleLogEl;
        if (!logContainer) return;
        
        // Force immediate scroll first
        logContainer.scrollTop = logContainer.scrollHeight;
        
        // Then add smooth scroll for visual effect
        requestAnimationFrame(() => {
            logContainer.scrollTo({
                top: logContainer.scrollHeight,
                behavior: 'smooth'
            });
        });
    }
    
    showNewMessagesIndicator() {
        if (this.newMessagesIndicator) {
            this.newMessagesIndicator.style.display = 'block';
        }
    }
    
    hideNewMessagesIndicator() {
        if (this.newMessagesIndicator) {
            this.newMessagesIndicator.style.display = 'none';
        }
    }

    showLoading(show) {
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    generateBattleId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // Modal actions
    goBack() {
        window.location.href = '/';
    }

    continueBattle() {
        this.resultModal.style.display = 'none';
        window.location.href = '/';
    }

    newBattle() {
        this.resultModal.style.display = 'none';
        this.resetBattle();
        this.setupModal.style.display = 'flex';
    }

    resetBattle() {
        // Limpar estados das mecânicas de batalha
        this.battleMechanics.clearBattleStates();
        this.battleMechanics.clearSkillStates();
        
        // Limpar sistema de buff/debuff
        this.buffSystem.reset();
        
        this.currentBattle = null;
        this.playerCharacter = null;
        this.enemyCharacter = null;
        this.battleState = 'setup';
        this.battleLog = [];
        this.battleLogEl.innerHTML = '<div class="log-message">Batalha iniciada!</div>';
        this.startBattleBtn.disabled = true;
    }
}

// Initialize battle system when page loads
document.addEventListener('DOMContentLoaded', () => {
    const battleSystem = new BattleSystem();
});

// Export for potential external use
window.BattleSystem = BattleSystem;