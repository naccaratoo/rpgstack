/**
 * RPGStack Battle System - UI Controller (Refactored)
 * Versão: 4.3.0 (Modular Architecture) 
 * 
 * Interface de usuário para sistema de batalha, agora usando
 * BattleMechanics como engine de lógica separada.
 */

class VintageBattleUI {
    constructor() {
        // Inicializar engine de mecânicas
        this.battleEngine = new BattleMechanics();
        
        // Estado da UI
        this.selectedCharacter = null;
        this.battleState = 'character-selection';
        this.skillsVisible = false;
        this.logVisible = true;
        this.currentSkillIndex = 0;
        
        // Dados de personagens
        this.characters = [];
        this.characterData = null;
        
        // Pagination para seleção de personagens
        this.currentPage = 0;
        this.charactersPerPage = 3;
        
        // Sistema de animações
        this.animationQueue = [];
        this.isAnimating = false;
    }

    async init() {
        this.showLoadingScreen();
        await this.loadCharacters();
        setTimeout(() => {
            this.hideLoadingScreen();
            this.showCharacterModal();
            this.setupEventListeners();
            this.populateCharacterGrid();
        }, 2000);
        
        this.startParticleSystem();
    }

    async loadCharacters() {
        try {
            const response = await fetch('/api/characters?t=' + Date.now());
            
            if (response.ok) {
                const data = await response.json();
                this.characterData = data;
                
                const charactersArray = Object.values(data.characters || {});
                this.characters = charactersArray.map((char, index) => ({
                    id: index + 1,
                    name: char.name,
                    level: char.level || 1,
                    hp: char.hp || char.maxHP || 100,
                    maxHP: char.maxHP || char.hp || 100,
                    mp: char.anima || char.mp || 50,
                    maxMP: char.anima || char.maxMP || 50,
                    attack: char.attack || 25,
                    defense: char.defense || 15,
                    defesa_especial: char.defesa_especial || char.defense || 15,
                    critico: char.critico || 2.0,
                    sprite: char.sprite || 'assets/sprites/default.webp',
                    culture: char.culture || 'Desconhecida',
                    classe: char.classe || 'Guerreiro',
                    skills: char.skills || []
                }));

                console.log(`✅ Carregados ${this.characters.length} personagens`);
            } else {
                console.warn('⚠️ Falha ao carregar personagens, usando dados padrão');
                this.loadDefaultCharacters();
            }
        } catch (error) {
            console.error('❌ Erro ao carregar personagens:', error);
            this.loadDefaultCharacters();
        }
    }

    loadDefaultCharacters() {
        this.characters = [
            {
                id: 1,
                name: "Herói Ancestral",
                level: 5,
                hp: 120, maxHP: 120,
                mp: 60, maxMP: 60,
                attack: 35, defense: 20, defesa_especial: 15,
                critico: 2.2,
                sprite: 'assets/sprites/default.webp',
                culture: 'Ancestral',
                classe: 'Guardião',
                skills: ['lamina_eterea', 'chama_interior']
            },
            {
                id: 2,
                name: "Mago Sombrio",
                level: 4,
                hp: 90, maxHP: 90,
                mp: 80, maxMP: 80,
                attack: 40, defense: 15, defesa_especial: 25,
                critico: 1.8,
                sprite: 'assets/sprites/default.webp',
                culture: 'Sombria',
                classe: 'Arcano',
                skills: ['orbe_sombrio', 'escudo_arcano']
            }
        ];
    }

    setupEventListeners() {
        // Eventos de teclado
        document.addEventListener('keydown', (e) => {
            if (this.battleState === 'battle') {
                switch (e.key) {
                    case '1': this.playerAttack(); break;
                    case '2': this.playerDefend(); break;
                    case '3': this.playerMeditate(); break;
                    case '4': this.toggleSkills(); break;
                    case 'ArrowLeft': 
                        if (this.skillsVisible) this.previousSkill(); 
                        break;
                    case 'ArrowRight': 
                        if (this.skillsVisible) this.nextSkill(); 
                        break;
                    case 'Enter':
                        if (this.skillsVisible) this.useCurrentSkill();
                        break;
                    case 'Escape':
                        this.closeSkills();
                        break;
                }
            }
        });

        // Eventos de ações de batalha
        document.querySelector('[data-action="attack"]')?.addEventListener('click', () => this.playerAttack());
        document.querySelector('[data-action="defend"]')?.addEventListener('click', () => this.playerDefend());
        document.querySelector('[data-action="meditate"]')?.addEventListener('click', () => this.playerMeditate());
        document.querySelector('[data-action="skills"]')?.addEventListener('click', () => this.toggleSkills());

        // Eventos de modais
        document.getElementById('startBattle')?.addEventListener('click', () => this.startBattle());
        document.getElementById('backToMenu')?.addEventListener('click', () => this.backToMenu());
        document.getElementById('continueGame')?.addEventListener('click', () => this.continueGame());
        document.getElementById('newBattle')?.addEventListener('click', () => this.newBattle());

        // Eventos de navegação de páginas
        document.getElementById('prevPage')?.addEventListener('click', () => this.previousPage());
        document.getElementById('nextPage')?.addEventListener('click', () => this.nextPage());
    }

    // ===== GERENCIAMENTO DE BATALHA =====

    startBattle() {
        if (!this.selectedCharacter) return;

        console.log('🎮 Iniciando batalha com:', this.selectedCharacter.name);
        
        // Selecionar inimigo aleatório
        const availableEnemies = this.characters.filter(char => char.id !== this.selectedCharacter.id);
        const enemy = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];

        // Inicializar batalha no engine
        this.battleEngine.initializeBattle(this.selectedCharacter, enemy);

        // Atualizar estado da UI
        this.battleState = 'battle';
        this.hideCharacterModal();
        this.updateBattleUI();
        
        this.addBattleLogEntry('system', `⚔️ Batalha iniciada!`);
    }

    playerAttack() {
        if (this.battleState !== 'battle' || !this.battleEngine.isBattleActive()) return;
        if (this.battleEngine.getBattleState().turn !== 'player') return;

        try {
            const result = this.battleEngine.processAttack('player', 'enemy');
            
            // Mostrar damage number
            this.showDamageNumber(result.damage, result.isCritical, 'enemy');
            
            // Mostrar screen shake se crítico
            if (result.isCritical) {
                this.screenShake();
            }

            // Atualizar UI
            this.updateBattleUI();

            // Verificar se a batalha terminou
            if (result.targetDefeated) {
                this.endBattle('victory');
                return;
            }

            // Próximo turno
            this.battleEngine.nextTurn();
            setTimeout(() => this.enemyTurn(), 1500);

        } catch (error) {
            console.error('Erro no ataque:', error);
        }
    }

    playerDefend() {
        if (this.battleState !== 'battle' || !this.battleEngine.isBattleActive()) return;
        if (this.battleEngine.getBattleState().turn !== 'player') return;

        try {
            this.battleEngine.processDefend('player');
            this.updateBattleUI();
            
            this.battleEngine.nextTurn();
            setTimeout(() => this.enemyTurn(), 1500);
        } catch (error) {
            console.error('Erro na defesa:', error);
        }
    }

    playerMeditate() {
        if (this.battleState !== 'battle' || !this.battleEngine.isBattleActive()) return;
        if (this.battleEngine.getBattleState().turn !== 'player') return;

        try {
            const result = this.battleEngine.processMeditate('player');
            
            // Mostrar healing numbers se houver
            if (result.healthRestored > 0) {
                this.showDamageNumber(result.healthRestored, false, 'player', 'heal');
            }

            this.updateBattleUI();
            
            this.battleEngine.nextTurn();
            setTimeout(() => this.enemyTurn(), 1500);
        } catch (error) {
            console.error('Erro na meditação:', error);
        }
    }

    useCurrentSkill() {
        if (!this.skillsVisible || this.battleState !== 'battle') return;
        
        const battleState = this.battleEngine.getBattleState();
        const playerSkills = battleState.player.skills || [];
        
        if (this.currentSkillIndex >= 0 && this.currentSkillIndex < playerSkills.length) {
            this.useSkill(this.currentSkillIndex);
        }
    }

    useSkill(skillIndex) {
        if (this.battleState !== 'battle' || !this.battleEngine.isBattleActive()) return;
        if (this.battleEngine.getBattleState().turn !== 'player') return;

        try {
            const battleState = this.battleEngine.getBattleState();
            const skills = this.getPlayerSkills();
            
            if (skillIndex >= 0 && skillIndex < skills.length) {
                const skill = skills[skillIndex];
                const result = this.battleEngine.processSkill('player', skill);

                // Mostrar damage number
                this.showDamageNumber(result.damage, result.isCritical, 'enemy', 'skill');
                
                if (result.isCritical) {
                    this.screenShake();
                }

                // Fechar menu de skills
                this.closeSkills();
                
                // Atualizar UI
                this.updateBattleUI();

                // Verificar se a batalha terminou
                if (result.targetDefeated) {
                    this.endBattle('victory');
                    return;
                }

                // Próximo turno
                this.battleEngine.nextTurn();
                setTimeout(() => this.enemyTurn(), 1500);
            }
        } catch (error) {
            console.error('Erro ao usar skill:', error);
            this.addBattleLogEntry('system', `❌ ${error.message}`);
        }
    }

    enemyTurn() {
        if (this.battleState !== 'battle' || !this.battleEngine.isBattleActive()) return;
        if (this.battleEngine.getBattleState().turn !== 'enemy') return;

        try {
            const result = this.battleEngine.processEnemyAction();
            
            // Mostrar efeitos visuais baseados na ação
            if (result.damage) {
                this.showDamageNumber(result.damage, result.isCritical, 'player');
                if (result.isCritical) {
                    this.screenShake();
                }
            }

            this.updateBattleUI();

            // Verificar se a batalha terminou
            if (result.targetDefeated) {
                this.endBattle('defeat');
                return;
            }

            // Próximo turno
            this.battleEngine.nextTurn();
            this.updateBattleUI();

        } catch (error) {
            console.error('Erro no turno do inimigo:', error);
        }
    }

    endBattle(result) {
        this.battleState = 'ended';
        
        const expGained = this.battleEngine.calculateExperience(result);
        
        setTimeout(() => {
            this.showResultModal(result, expGained);
        }, 1000);
    }

    // ===== INTERFACE DE USUÁRIO =====

    updateBattleUI() {
        const battleState = this.battleEngine.getBattleState();
        
        // Atualizar cards de personagem
        this.updatePlayerCard(battleState.player);
        this.updateEnemyCard(battleState.enemy);
        
        // Atualizar barras de vida/mana
        this.updateHealthBar('player', battleState.player.currentHP, battleState.player.maxHP);
        this.updateManaBar('player', battleState.player.currentMP, battleState.player.maxMP || battleState.player.anima || 50);
        this.updateHealthBar('enemy', battleState.enemy.currentHP, battleState.enemy.maxHP);
        this.updateManaBar('enemy', battleState.enemy.currentMP, battleState.enemy.maxMP || battleState.enemy.anima || 30);
        
        // Atualizar turno
        this.updateTurnDisplay(battleState.turn, battleState.round);
        
        // Atualizar log
        this.updateBattleLog(battleState.log);
    }

    updatePlayerCard(player) {
        const nameEl = document.getElementById('playerName');
        const levelEl = document.getElementById('playerLevel');
        const imageEl = document.getElementById('playerImage');
        const hpTextEl = document.getElementById('playerHP');
        const maxHpTextEl = document.getElementById('playerMaxHP');
        const mpTextEl = document.getElementById('playerMP');
        const maxMpTextEl = document.getElementById('playerMaxMP');

        if (nameEl) nameEl.textContent = player.name;
        if (levelEl) levelEl.textContent = player.level;
        if (imageEl && player.sprite) imageEl.src = player.sprite;
        if (hpTextEl) hpTextEl.textContent = player.currentHP;
        if (maxHpTextEl) maxHpTextEl.textContent = player.maxHP;
        if (mpTextEl) mpTextEl.textContent = player.currentMP;
        if (maxMpTextEl) maxMpTextEl.textContent = player.maxMP || player.anima || 50;
    }

    updateEnemyCard(enemy) {
        const nameEl = document.getElementById('enemyName');
        const levelEl = document.getElementById('enemyLevel');
        const imageEl = document.getElementById('enemyImage');
        const hpTextEl = document.getElementById('enemyHP');
        const maxHpTextEl = document.getElementById('enemyMaxHP');
        const mpTextEl = document.getElementById('enemyMP');
        const maxMpTextEl = document.getElementById('enemyMaxMP');

        if (nameEl) nameEl.textContent = enemy.name;
        if (levelEl) levelEl.textContent = enemy.level;
        if (imageEl && enemy.sprite) imageEl.src = enemy.sprite;
        if (hpTextEl) hpTextEl.textContent = enemy.currentHP;
        if (maxHpTextEl) maxHpTextEl.textContent = enemy.maxHP;
        if (mpTextEl) mpTextEl.textContent = enemy.currentMP;
        if (maxMpTextEl) maxMpTextEl.textContent = enemy.maxMP || enemy.anima || 30;
    }

    updateHealthBar(target, current, max) {
        const healthBar = document.getElementById(`${target}HealthBar`);
        if (healthBar) {
            const percentage = (current / max) * 100;
            healthBar.style.width = `${percentage}%`;
            
            // Cores dinâmicas baseadas na porcentagem de vida
            if (percentage <= 25) {
                healthBar.style.background = 'linear-gradient(90deg, #8B2635, #A53E4A)';
            } else if (percentage <= 50) {
                healthBar.style.background = 'linear-gradient(90deg, #D4AF37, #F7E98E)';
            } else {
                healthBar.style.background = 'linear-gradient(90deg, var(--burgundy), var(--burgundy-light))';
            }
        }
    }

    updateManaBar(target, current, max) {
        const manaBar = document.getElementById(`${target}ManaBar`);
        if (manaBar) {
            const percentage = (current / max) * 100;
            manaBar.style.width = `${percentage}%`;
            manaBar.style.background = 'linear-gradient(90deg, var(--emerald), var(--emerald-light))';
        }
    }

    updateTurnDisplay(turn, round) {
        const turnEl = document.getElementById('currentTurn');
        if (turnEl) {
            const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
            turnEl.textContent = romanNumerals[round - 1] || `${round}`;
        }
    }

    updateBattleLog(logEntries) {
        const logContainer = document.getElementById('battleLog');
        if (!logContainer) return;

        // Mostrar apenas as últimas 8 entradas
        const recentEntries = logEntries.slice(-8);
        
        logContainer.innerHTML = recentEntries.map(entry => 
            `<div class="log-entry ${entry.type}">
                <span class="entry-marker">◊</span>
                <span class="entry-text">${entry.message}</span>
            </div>`
        ).join('');

        // Auto-scroll para o final
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    // ===== SISTEMA DE SKILLS =====

    getPlayerSkills() {
        // Retornar skills padrão para demonstração
        return [
            { skillName: 'Lâmina Etérea', skillMana: 15, damage: [25, 35] },
            { skillName: 'Escudo Arcano', skillMana: 20, damage: [0, 0] },
            { skillName: 'Chama Interior', skillMana: 25, damage: [35, 50] }
        ];
    }

    toggleSkills() {
        this.skillsVisible = !this.skillsVisible;
        const skillsMenu = document.getElementById('skillsMenu');
        
        if (skillsMenu) {
            skillsMenu.style.display = this.skillsVisible ? 'block' : 'none';
            
            if (this.skillsVisible) {
                this.populateSkills();
                this.currentSkillIndex = 0;
                this.updateSkillSelection();
            }
        }
    }

    closeSkills() {
        this.skillsVisible = false;
        const skillsMenu = document.getElementById('skillsMenu');
        if (skillsMenu) {
            skillsMenu.style.display = 'none';
        }
    }

    populateSkills() {
        const skillsList = document.getElementById('skillsList');
        if (!skillsList) return;

        const skills = this.getPlayerSkills();
        const battleState = this.battleEngine.getBattleState();
        const currentMP = battleState.player.currentMP;

        skillsList.innerHTML = skills.map((skill, index) => {
            const canUse = currentMP >= skill.skillMana;
            const damageText = skill.damage[0] === skill.damage[1] ? 
                `${skill.damage[0]}` : 
                `${skill.damage[0]}-${skill.damage[1]}`;

            return `
                <div class="skill-item ${canUse ? '' : 'disabled'}" data-skill-index="${index}">
                    <div class="skill-icon">✦</div>
                    <div class="skill-details">
                        <div class="skill-name">${skill.skillName}</div>
                        <div class="skill-stats">
                            <span class="skill-cost">${skill.skillMana} ânima</span>
                            <span class="skill-damage">${damageText} dano</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Adicionar event listeners
        skillsList.querySelectorAll('.skill-item').forEach(item => {
            item.addEventListener('click', () => {
                const skillIndex = parseInt(item.dataset.skillIndex);
                this.useSkill(skillIndex);
            });
        });
    }

    nextSkill() {
        const skills = this.getPlayerSkills();
        this.currentSkillIndex = (this.currentSkillIndex + 1) % skills.length;
        this.updateSkillSelection();
    }

    previousSkill() {
        const skills = this.getPlayerSkills();
        this.currentSkillIndex = (this.currentSkillIndex - 1 + skills.length) % skills.length;
        this.updateSkillSelection();
    }

    updateSkillSelection() {
        const skillItems = document.querySelectorAll('.skill-item');
        skillItems.forEach((item, index) => {
            item.classList.toggle('selected', index === this.currentSkillIndex);
        });
    }

    // ===== EFEITOS VISUAIS =====

    showDamageNumber(amount, isCritical = false, target = 'enemy', type = 'damage') {
        const targetCard = document.querySelector(`.${target}-card`);
        if (!targetCard) return;

        const damageNumber = document.createElement('div');
        damageNumber.style.cssText = `
            position: absolute;
            font-family: var(--font-display);
            font-weight: 900;
            font-size: ${isCritical ? '2rem' : '1.5rem'};
            color: ${type === 'heal' ? 'var(--emerald-light)' : (isCritical ? '#D4AF37' : 'var(--burgundy-light)')};
            text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
            pointer-events: none;
            z-index: 1000;
            animation: damageNumberFloat 2s ease forwards;
        `;

        damageNumber.textContent = type === 'heal' ? `+${amount}` : 
                                  (isCritical ? `${amount} CRIT!` : `${amount}`);

        const rect = targetCard.getBoundingClientRect();
        damageNumber.style.left = `${rect.left + rect.width/2 - 30}px`;
        damageNumber.style.top = `${rect.top + 20}px`;

        document.body.appendChild(damageNumber);

        setTimeout(() => {
            if (damageNumber.parentNode) {
                damageNumber.parentNode.removeChild(damageNumber);
            }
        }, 2000);
    }

    screenShake() {
        const battleContainer = document.querySelector('.battle-stage');
        if (battleContainer) {
            battleContainer.style.animation = 'screenShake 0.5s ease-in-out';
            setTimeout(() => {
                battleContainer.style.animation = '';
            }, 500);
        }
    }

    // ===== GERENCIAMENTO DE PERSONAGENS =====

    populateCharacterGrid() {
        const characterGrid = document.getElementById('characterGrid');
        if (!characterGrid) return;

        const start = this.currentPage * this.charactersPerPage;
        const end = start + this.charactersPerPage;
        const pageCharacters = this.characters.slice(start, end);

        characterGrid.innerHTML = pageCharacters.map(char => `
            <div class="character-option" data-character-id="${char.id}">
                <div class="character-avatar">
                    <img src="${char.sprite}" alt="${char.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjNzIyRjM3IiByeD0iOCIvPgo8dGV4dCB4PSI0MCIgeT0iNDUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNGREY1RTYiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtZmFtaWx5PSJzZXJpZiI+VU5LTk9XTjwvdGV4dD4KPC9zdmc+Cg=='">
                </div>
                <div class="character-info">
                    <h4 class="character-name">${char.name}</h4>
                    <div class="character-details">
                        <span class="character-level">Nv. ${char.level}</span>
                        <span class="character-culture">${char.culture}</span>
                    </div>
                    <div class="character-stats">
                        <span>❤ ${char.hp}</span>
                        <span>✦ ${char.mp}</span>
                        <span>⚔ ${char.attack}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Adicionar event listeners
        characterGrid.querySelectorAll('.character-option').forEach(option => {
            option.addEventListener('click', () => {
                const characterId = parseInt(option.dataset.characterId);
                this.selectCharacter(characterId);
            });
        });

        this.updatePaginationButtons();
    }

    selectCharacter(characterId) {
        this.selectedCharacter = this.characters.find(char => char.id === characterId);
        
        // Atualizar visual de seleção
        document.querySelectorAll('.character-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        const selectedOption = document.querySelector(`[data-character-id="${characterId}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }

        // Habilitar botão de batalha
        const startButton = document.getElementById('startBattle');
        if (startButton) {
            startButton.disabled = false;
        }

        console.log('✅ Personagem selecionado:', this.selectedCharacter.name);
    }

    updatePaginationButtons() {
        const prevButton = document.getElementById('prevPage');
        const nextButton = document.getElementById('nextPage');
        const totalPages = Math.ceil(this.characters.length / this.charactersPerPage);

        if (prevButton) {
            prevButton.disabled = this.currentPage === 0;
        }
        
        if (nextButton) {
            nextButton.disabled = this.currentPage >= totalPages - 1;
        }
    }

    previousPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.populateCharacterGrid();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.characters.length / this.charactersPerPage);
        if (this.currentPage < totalPages - 1) {
            this.currentPage++;
            this.populateCharacterGrid();
        }
    }

    // ===== MODAIS E SCREENS =====

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
            
            // Simular progresso de loading
            const progressBar = document.getElementById('loadingBar');
            if (progressBar) {
                let progress = 0;
                const interval = setInterval(() => {
                    progress += Math.random() * 30;
                    progressBar.style.width = `${Math.min(progress, 100)}%`;
                    
                    if (progress >= 100) {
                        clearInterval(interval);
                    }
                }, 100);
            }
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }

    showCharacterModal() {
        const modal = document.getElementById('characterModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    hideCharacterModal() {
        const modal = document.getElementById('characterModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showResultModal(result, expGained) {
        const modal = document.getElementById('resultModal');
        const title = document.getElementById('resultTitle');
        const expDisplay = document.getElementById('expGained');

        if (modal && title && expDisplay) {
            title.textContent = result === 'victory' ? 'Vitória!' : 'Derrota!';
            expDisplay.textContent = expGained;
            modal.style.display = 'flex';
        }
    }

    backToMenu() {
        window.location.reload();
    }

    continueGame() {
        const modal = document.getElementById('resultModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.showCharacterModal();
        this.battleState = 'character-selection';
    }

    newBattle() {
        this.continueGame();
    }

    addBattleLogEntry(type, message) {
        // O log agora é gerenciado pelo BattleMechanics
        // Esta função existe para compatibilidade, mas não é mais necessária
        console.log(`[${type}] ${message}`);
    }

    // ===== SISTEMA DE PARTÍCULAS =====

    startParticleSystem() {
        const particleField = document.getElementById('particleField');
        if (!particleField) return;

        // Criar partículas iniciais
        for (let i = 0; i < 20; i++) {
            setTimeout(() => this.createParticle(particleField), i * 200);
        }

        // Continuar criando partículas
        setInterval(() => this.createParticle(particleField), 2000);
    }

    createParticle(container) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: var(--gold-primary);
            border-radius: 50%;
            animation: particleFloat 8s linear infinite;
            left: ${Math.random() * 100}%;
            top: 100%;
            box-shadow: 0 0 6px var(--gold-primary);
            opacity: 0.6;
        `;

        container.appendChild(particle);

        // Remover partícula após animação
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 8000);
    }
}

// Adicionar estilos de animação necessários
const style = document.createElement('style');
style.textContent = `
    @keyframes damageNumberFloat {
        0% { opacity: 1; transform: translateY(0) scale(1); }
        50% { opacity: 1; transform: translateY(-30px) scale(1.1); }
        100% { opacity: 0; transform: translateY(-60px) scale(0.8); }
    }

    @keyframes screenShake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }

    @keyframes particleFloat {
        0% { transform: translateY(0) rotate(0deg); opacity: 0.6; }
        50% { opacity: 0.8; }
        100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
    }

    .skill-item.selected {
        background: linear-gradient(135deg, var(--gold-primary), var(--gold-light));
        color: var(--charcoal);
        transform: scale(1.05);
    }

    .character-option.selected {
        border-color: var(--gold-primary);
        box-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
        transform: scale(1.02);
    }
`;
document.head.appendChild(style);

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    const battleUI = new VintageBattleUI();
    battleUI.init();
});