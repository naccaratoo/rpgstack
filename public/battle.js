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
        
        this.characters = [];
        this.characterData = null;
        
        this.selectedCharacter = null;
        this.selectedTeam = [];      // Array para 3 personagens selecionados
        this.maxTeamSize = 3;        // Sistema 3v3
        this.battleState = 'character-selection';
        this.skillsVisible = false;
        this.logVisible = true;
        
        // Pagination for character selection
        this.currentPage = 0;
        this.charactersPerPage = 15; // Mostrar todos os personagens de uma vez
        
        // Sistema de Turnos Integrado
        this.battleMechanics = null;
        
        // UI Elements para timer
        this.timerDisplay = null;
        this.turnIndicator = null;
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
    }

    async loadCharacters() {
        console.log('🚀 Iniciando carregamento de personagens...');
        try {
            // Load from main characters database API
            const response = await fetch('/api/characters?t=' + Date.now());
            console.log('📡 Response status:', response.status, response.statusText);
            console.log('📡 Response URL:', response.url);
            
            if (response.ok) {
                console.log('✅ Response OK, parsing JSON...');
                const mainData = await response.json();
                console.log('📊 Raw data structure:', Object.keys(mainData));
                this.characterData = mainData;
                console.log(`📊 Encontrados ${Object.keys(mainData.characters).length} personagens no arquivo`);
                console.log('🔍 Debug - personagens no JSON:', Object.keys(mainData.characters));
                console.log('🔍 Debug - dados completos:', mainData.characters);
                const rawCharacters = Object.values(mainData.characters);
                console.log('🔍 Debug - personagens antes do filtro:', rawCharacters.length);
                
                // Aceitar todas as classes originais do sistema CHRONOS
                const validClasses = [
                    'Lutador', 'Armamentista', 'Arcano',           // Classes base
                    'Oráculo', 'Artífice', 'Guardião da Natureza', // Classes originais CHRONOS
                    'Mercador-Diplomata', 'Curandeiro Ritualista'  // Classes culturais
                ];
                const filteredCharacters = rawCharacters.filter(char => 
                    validClasses.includes(char.classe)
                );
                
                console.log('🔍 Debug - personagens após filtro:', filteredCharacters.length);
                console.log('📋 Classes válidas encontradas:', filteredCharacters.map(c => `${c.name} (${c.classe})`));
                
                this.characters = filteredCharacters.map((char, index) => {
                    console.log(`🔍 Processando personagem ${index + 1}: ${char.name}`);
                    return {
                        id: index + 1,
                        name: char.name,
                        level: char.level || 1,
                        hp: char.hp,
                        maxHP: char.maxHP,
                        mp: char.anima || 50,
                        maxMP: char.anima || 50,
                        class: char.classe,
                        description: char.description && char.description.trim() !== "" ? char.description : `${char.classe} experiente com poderes únicos`,
                        attack: char.attack || 25,
                        defense: char.defense || 10,
                        critical: char.critico || 15,
                        skills: char.skills || [],
                        sprite: char.sprite || "assets/sprites/default.webp",
                        image: this.generateCharacterImage(char.name)
                    };
                });
                console.log(`✨ ${this.characters.length} personagens carregados de characters.json`);
                console.log('📋 Personagens carregados:', this.characters.map(c => c.name));
                return;
            }
            
            throw new Error(`Arquivo characters.json não encontrado - Status: ${response.status} ${response.statusText}`);
            
        } catch (error) {
            console.error('❌ Erro ao carregar personagens:', error);
            console.error('🌐 URL tentada:', '/api/characters?t=' + Date.now());
            console.error('🔍 Status da response:', error.response?.status || 'N/A');
            console.error('🔍 Error message:', error.message);
            console.log('⚠️ Carregando personagens de fallback...');
            this.loadFallbackCharacters();
        }
    }

    loadFallbackCharacters() {
        this.characters = [
            {
                id: 1,
                name: "Alquimista Místico",
                level: 1,
                hp: 90,
                maxHP: 90,
                mp: 60,
                maxMP: 60,
                class: "Arcano",
                image: this.generateCharacterImage("Alquimista Místico")
            },
            {
                id: 2,
                name: "Cavaleiro Eterno",
                level: 1,
                hp: 120,
                maxHP: 120,
                mp: 40,
                maxMP: 40,
                class: "Lutador",
                image: this.generateCharacterImage("Cavaleiro Eterno")
            },
            {
                id: 3,
                name: "Feiticeira Antiga",
                level: 1,
                hp: 85,
                maxHP: 85,
                mp: 70,
                maxMP: 70,
                class: "Armamentista",
                image: this.generateCharacterImage("Feiticeira Antiga")
            }
        ];
        console.log("⚠️ Usando personagens de fallback");
    }

    generateCharacterImage(name) {
        const colors = {
            "Alquimista Místico": "#D4AF37",
            "Cavaleiro Eterno": "#722F37", 
            "Feiticeira Antiga": "#355E3B",
            "Sesshoumaru": "#DC2626",
            "Loki ": "#0EA5E9", // Note: Loki tem espaço no final no JSON
            "Loki": "#0EA5E9",
            "Merlin": "#059669",
            "Coco": "#8B5A3C"
        };
        
        const color = colors[name] || "#666666";
        // Remover caracteres especiais e criar iniciais seguras
        const shortName = name.split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 3); // Limitar a 3 caracteres máximo
        
        const svg = `<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="${color}" rx="8"/>
            <text x="50" y="55" text-anchor="middle" fill="#FDF5E6" font-size="12" font-family="serif">${shortName}</text>
        </svg>`;
        
        // Usar encodeURIComponent ao invés de btoa para suportar Unicode
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }

    setupEventListeners() {
        // Character selection
        document.getElementById('startBattle')?.addEventListener('click', () => this.startBattle());
        document.getElementById('backToMenu')?.addEventListener('click', () => this.backToMenu());
        
        // Botão Limpar Seleção (3v3)
        document.getElementById('clearTeam')?.addEventListener('click', () => {
            this.clearTeamSelection();
        });

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

        // Calculate pagination
        const totalPages = Math.ceil(this.characters.length / this.charactersPerPage);
        const startIndex = this.currentPage * this.charactersPerPage;
        const endIndex = startIndex + this.charactersPerPage;
        const currentCharacters = this.characters.slice(startIndex, endIndex);

        // Create character grid
        grid.innerHTML = `
            <div class="characters-container" id="charactersContainer">
                ${currentCharacters.map(char => `
                    <div class="character-option" data-character-id="${char.id}">
                        <div class="character-portrait">
                            <img src="${char.sprite || char.image}" alt="${char.name}">
                        </div>
                        <div class="character-info">
                            <h4>${char.name}</h4>
                            <div class="character-level">Nível ${char.level}</div>
                            <div class="character-class">${char.class || 'Classe Desconhecida'}</div>
                            <div class="character-stats">
                                <div class="stat">❤ ${char.hp}</div>
                                <div class="stat">✦ ${char.mp}</div>
                            </div>
                            ${char.description ? `<div class="character-description">${char.description}</div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Add scroll wheel handler to the grid
        grid.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            const totalPages = Math.ceil(this.characters.length / this.charactersPerPage);
            
            // Add visual feedback
            grid.classList.add('scrolling');
            
            setTimeout(() => {
                grid.classList.remove('scrolling');
            }, 300);
            
            if (e.deltaY > 0) {
                // Scroll down - next page
                if (this.currentPage < totalPages - 1) {
                    this.currentPage++;
                    setTimeout(() => this.populateCharacterGrid(), 150);
                    console.log(`📜 Scroll para baixo - Página ${this.currentPage + 1}/${totalPages}`);
                } else {
                    console.log(`📜 Última página alcançada (${totalPages})`);
                }
            } else {
                // Scroll up - previous page
                if (this.currentPage > 0) {
                    this.currentPage--;
                    setTimeout(() => this.populateCharacterGrid(), 150);
                    console.log(`📜 Scroll para cima - Página ${this.currentPage + 1}/${totalPages}`);
                } else {
                    console.log(`📜 Primeira página alcançada`);
                }
            }
        });

        // Add click handlers to character options (Sistema 3v3)
        grid.querySelectorAll('.character-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const characterId = parseInt(option.dataset.characterId);
                const character = this.characters.find(char => char.id === characterId);
                
                if (!character) return;
                
                // Verificar se já está selecionado
                const isAlreadySelected = this.selectedTeam.some(c => c.id === characterId);
                
                if (isAlreadySelected) {
                    // Remover da equipe
                    this.selectedTeam = this.selectedTeam.filter(c => c.id !== characterId);
                    option.classList.remove('selected');
                    this.removeFromTeamSlot(characterId);
                } else if (this.selectedTeam.length < this.maxTeamSize) {
                    // Adicionar à equipe
                    this.selectedTeam.push(character);
                    option.classList.add('selected');
                    this.addToTeamSlot(character);
                } else {
                    // Equipe cheia
                    this.showMessage('Equipe completa! Remova um personagem para adicionar outro.', 'warning');
                }
                
                this.updateTeamCounter();
                this.updateStartButton();
                
                console.log('🎯 Equipe selecionada:', this.selectedTeam.map(c => c.name));
            });
        });
    }

    showCharacterModal() {
        const modal = document.getElementById('characterModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    // Funções para gerenciar slots da equipe
    addToTeamSlot(character) {
        const slotIndex = this.selectedTeam.length - 1;
        const teamSlot = document.getElementById(`teamSlot${slotIndex}`);
        
        if (teamSlot) {
            teamSlot.classList.remove('empty');
            teamSlot.classList.add('filled');
            teamSlot.innerHTML = `
                <div class="slot-number">${slotIndex + 1}</div>
                <div class="slot-label">${slotIndex === 0 ? 'Líder' : 'Reserva'}</div>
                <img src="${character.sprite || character.image || '/assets/sprites/default.png'}" alt="${character.name}" style="width: 60px; height: 60px; border-radius: 6px;">
                <div class="char-name-small">${character.name}</div>
            `;
        }
    }
    
    removeFromTeamSlot(characterId) {
        // Reorganizar slots após remoção
        this.selectedTeam.forEach((char, index) => {
            const teamSlot = document.getElementById(`teamSlot${index}`);
            if (teamSlot) {
                teamSlot.classList.remove('empty');
                teamSlot.classList.add('filled');
                teamSlot.innerHTML = `
                    <div class="slot-number">${index + 1}</div>
                    <div class="slot-label">${index === 0 ? 'Líder' : 'Reserva'}</div>
                    <img src="${char.sprite || char.image || '/assets/sprites/default.png'}" alt="${char.name}" style="width: 60px; height: 60px; border-radius: 6px;">
                    <div class="char-name-small">${char.name}</div>
                `;
            }
        });
        
        // Limpar slot vazio
        const emptySlotIndex = this.selectedTeam.length;
        if (emptySlotIndex < this.maxTeamSize) {
            const emptySlot = document.getElementById(`teamSlot${emptySlotIndex}`);
            if (emptySlot) {
                emptySlot.classList.add('empty');
                emptySlot.classList.remove('filled');
                emptySlot.innerHTML = `
                    <div class="slot-number">${emptySlotIndex + 1}</div>
                    <div class="slot-label">${emptySlotIndex === 0 ? 'Líder' : 'Reserva'}</div>
                    <div class="empty-indicator">+</div>
                `;
            }
        }
    }
    
    updateTeamCounter() {
        const counterElement = document.getElementById('selectedCount');
        if (counterElement) {
            counterElement.textContent = this.selectedTeam.length;
        }
    }
    
    updateStartButton() {
        const startButton = document.getElementById('startBattle');
        if (startButton) {
            if (this.selectedTeam.length === this.maxTeamSize) {
                startButton.disabled = false;
                startButton.textContent = '⚔ Iniciar Duelo Ancestral 3v3';
            } else {
                startButton.disabled = true;
                startButton.textContent = `Selecione ${this.maxTeamSize - this.selectedTeam.length} personagem(ns)`;
            }
        }
    }
    
    showMessage(message, type = 'info') {
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
        
        // Criar toast message temporário
        const toast = document.createElement('div');
        toast.className = `message-toast ${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--parchment);
            border: 2px solid var(--gold-primary);
            border-radius: var(--radius-vintage);
            padding: var(--space-md);
            font-family: var(--font-ornate);
            color: var(--burgundy);
            z-index: 10000;
            max-width: 300px;
            box-shadow: var(--shadow-ornate);
            animation: slideIn 0.3s ease-out;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    clearTeamSelection() {
        // Limpar array da equipe
        this.selectedTeam = [];
        
        // Remover seleção visual dos personagens
        document.querySelectorAll('.character-option.selected').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Resetar slots da equipe
        for (let i = 0; i < this.maxTeamSize; i++) {
            const teamSlot = document.getElementById(`teamSlot${i}`);
            if (teamSlot) {
                teamSlot.classList.add('empty');
                teamSlot.classList.remove('filled');
                teamSlot.innerHTML = `
                    <div class="slot-number">${i + 1}</div>
                    <div class="slot-label">${i === 0 ? 'Líder' : 'Reserva'}</div>
                    <div class="empty-indicator">+</div>
                `;
            }
        }
        
        // Atualizar contador e botão
        this.updateTeamCounter();
        this.updateStartButton();
        
        this.showMessage('Seleção de equipe limpa!', 'info');
        console.log('🧹 Equipe limpa');
    }

    startBattle() {
        if (this.selectedTeam.length !== this.maxTeamSize) return;

        // Configurar equipes 3v3
        this.playerTeam = {
            active: 0,
            reserve: [1, 2],
            characters: [...this.selectedTeam] // Clonar array da equipe selecionada
        };
        
        // Gerar equipe inimiga aleatória
        this.generateEnemyTeam();
        
        // Hide character modal
        const modal = document.getElementById('characterModal');
        if (modal) {
            modal.style.display = 'none';
        }

        // Update battle state
        this.battleState = 'battle';
        
        // Atualizar interface 3v3 completa
        this.update3v3BattleField();
        this.populateSkills();
        
        // Inicializar sistema de turnos
        this.initializeTurnSystem();
        this.setupActionButtons();
        
        // Add initial log entry
        this.addBattleLogEntry('system', `${this.playerTeam.characters[0].name} entra na arena ancestral...`);
        this.addBattleLogEntry('system', `Equipe inimiga se posiciona para a batalha!`);
        
        // Iniciar primeiro turno após delay
        setTimeout(() => {
            this.startPlayerTurn();
        }, 2000);
    }

    generateEnemyTeam() {
        // Selecionar 3 personagens aleatórios diferentes da equipe do jogador
        const availableEnemies = this.characters.filter(char => 
            !this.selectedTeam.some(selected => selected.id === char.id)
        );
        
        // Embaralhar e pegar os primeiros 3
        const shuffled = availableEnemies.sort(() => 0.5 - Math.random());
        const enemyCharacters = shuffled.slice(0, 3);
        
        this.enemyTeam = {
            active: 0,
            reserve: [1, 2],
            characters: enemyCharacters
        };
        
        console.log('🤖 Equipe inimiga gerada:', this.enemyTeam.characters.map(c => c.name));
    }

    update3v3BattleField() {
        // Atualizar personagens ativos no battle field
        this.updateActiveBattleSlot('player', this.playerTeam.characters[this.playerTeam.active]);
        this.updateActiveBattleSlot('enemy', this.enemyTeam.characters[this.enemyTeam.active]);
        
        // Atualizar personagens na reserva
        this.updateReserveSlots('player', this.playerTeam);
        this.updateReserveSlots('enemy', this.enemyTeam);
    }

    updateActiveBattleSlot(teamType, character) {
        const prefix = `${teamType}ActiveBattle`;
        
        // Atualizar imagem
        const img = document.getElementById(`${prefix}Image`);
        if (img) {
            img.src = character.sprite || character.image || `/assets/sprites/${character.name.toLowerCase().replace(/\s+/g, '_')}.png`;
        }
        
        // Atualizar nome e nível
        const nameEl = document.getElementById(`${prefix}Name`);
        if (nameEl) nameEl.textContent = character.name;
        
        const levelEl = document.getElementById(`${prefix}Level`);
        if (levelEl) levelEl.textContent = character.nivel || character.level || 1;
        
        // Atualizar HP
        const hpEl = document.getElementById(`${prefix}HP`);
        const maxHpEl = document.getElementById(`${prefix}MaxHP`);
        if (hpEl) hpEl.textContent = character.currentHP || character.hp || 100;
        if (maxHpEl) maxHpEl.textContent = character.maxHP || character.hp || 100;
        
        // Atualizar MP
        const mpEl = document.getElementById(`${prefix}MP`);
        const maxMpEl = document.getElementById(`${prefix}MaxMP`);
        if (mpEl) mpEl.textContent = character.currentMP || character.mp || 50;
        if (maxMpEl) maxMpEl.textContent = character.maxMP || character.mp || 50;
        
        // Atualizar barras
        this.updateMiniBar(`${prefix}HPBar`, 
            character.currentHP || character.hp || 100, 
            character.maxHP || character.hp || 100
        );
        this.updateMiniBar(`${prefix}MPBar`, 
            character.currentMP || character.mp || 50, 
            character.maxMP || character.mp || 50
        );
        
        console.log(`⚔️ ${teamType} ativo atualizado:`, character.name);
    }

    updateReserveSlots(teamType, team) {
        team.reserve.forEach((reserveIndex, slotIndex) => {
            const character = team.characters[reserveIndex];
            const actualSlotIndex = slotIndex + 1; // Slots 1 e 2 (slot 0 está ativo)
            
            this.updateCharacterSlot(teamType, actualSlotIndex, character, 'reserve');
        });
    }

    updateCharacterSlot(teamType, slotIndex, character, status) {
        const prefix = `${teamType}`;
        
        // Atualizar imagem
        const img = document.getElementById(`${prefix}Image${slotIndex}`);
        if (img) {
            img.src = character.sprite || character.image || `/assets/sprites/${character.name.toLowerCase().replace(/\s+/g, '_')}.png`;
        }
        
        // Atualizar nome e nível
        const nameEl = document.getElementById(`${prefix}Name${slotIndex}`);
        if (nameEl) nameEl.textContent = character.name;
        
        const levelEl = document.getElementById(`${prefix}Level${slotIndex}`);
        if (levelEl) levelEl.textContent = character.nivel || character.level || 1;
        
        // Atualizar HP
        const hpEl = document.getElementById(`${prefix}HP${slotIndex}`);
        const maxHpEl = document.getElementById(`${prefix}MaxHP${slotIndex}`);
        if (hpEl) hpEl.textContent = character.currentHP || character.hp || 100;
        if (maxHpEl) maxHpEl.textContent = character.maxHP || character.hp || 100;
        
        // Atualizar MP  
        const mpEl = document.getElementById(`${prefix}MP${slotIndex}`);
        const maxMpEl = document.getElementById(`${prefix}MaxMP${slotIndex}`);
        if (mpEl) mpEl.textContent = character.currentMP || character.mp || 50;
        if (maxMpEl) maxMpEl.textContent = character.maxMP || character.mp || 50;
        
        // Atualizar barras
        this.updateMiniBar(`${prefix}HPBar${slotIndex}`, 
            character.currentHP || character.hp || 100, 
            character.maxHP || character.hp || 100
        );
        this.updateMiniBar(`${prefix}MPBar${slotIndex}`, 
            character.currentMP || character.mp || 50, 
            character.maxMP || character.mp || 50
        );
        
        // Atualizar estado visual do slot
        const slot = document.getElementById(`${teamType}-slot-${slotIndex}`);
        if (slot) {
            slot.className = `character-slot ${status}`;
            if (status === 'reserve' && teamType === 'player') {
                slot.classList.add('selectable');
            }
        }
    }

    updateMiniBar(barId, current, max) {
        const bar = document.getElementById(barId);
        if (bar) {
            const percentage = Math.max(0, Math.min(100, (current / max) * 100));
            bar.style.width = `${percentage}%`;
        }
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
            
            // Color based on health percentage using Art Nouveau palette
            if (percentage <= 25) {
                healthBar.style.background = 'linear-gradient(90deg, #8B2635, #A53E4A)'; // Burgundy dark for danger
            } else if (percentage <= 50) {
                healthBar.style.background = 'linear-gradient(90deg, #D4AF37, #F7E98E)'; // Gold for warning
            } else {
                healthBar.style.background = 'linear-gradient(90deg, var(--burgundy), var(--burgundy-light))'; // Normal burgundy
            }
        }
    }

    updateManaBar(target, current, max) {
        const manaBar = document.getElementById(`${target}ManaBar`);
        if (manaBar) {
            const percentage = (current / max) * 100;
            manaBar.style.width = `${percentage}%`;
            
            // Ensure mana bar always has the emerald color
            manaBar.style.background = 'linear-gradient(90deg, var(--emerald), var(--emerald-light))';
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

    /**
     * Sistema de Turnos Integrado
     */

    initializeTurnSystem() {
        // Inicializar BattleMechanics se disponível
        if (typeof BattleMechanics !== 'undefined') {
            this.battleMechanics = new BattleMechanics();
            
            // Configurar personagens de teste para o sistema
            const playerCharacter = {
                id: "player_test",
                name: this.playerTeam.characters[0].name || "Herói",
                hp: 100, maxHP: 100,
                anima: 50, maxAnima: 50,
                velocidade: 80,
                swapsUsed: 0
            };
            
            const enemyCharacter = {
                id: "enemy_test", 
                name: "Inimigo",
                hp: 80, maxHP: 80,
                anima: 30, maxAnima: 30,
                velocidade: 60,
                swapsUsed: 0
            };
            
            // Inicializar batalha no BattleMechanics
            this.battleMechanics.initializeBattle(playerCharacter, enemyCharacter);
            
            // Configurar callbacks para UI
            this.battleMechanics.onTimeWarningCallback = () => {
                this.showTimeWarning();
            };
            
            this.battleMechanics.onTimeoutCallback = () => {
                this.updateTurnIndicator('Jogador', 'Tempo Esgotado...');
            };
            
            this.battleMechanics.onTurnStartCallback = (player) => {
                this.showTurnUI();
                this.enableActionButtons();
                this.updateTurnIndicator(player === 'player' ? 'Jogador' : 'Inimigo', 'Selecionando Ação...');
            };
            
            this.battleMechanics.onTurnEndCallback = (nextPlayer) => {
                this.hideTurnUI();
                this.disableActionButtons();
                if (nextPlayer === 'player') {
                    setTimeout(() => this.startPlayerTurn(), 1000);
                } else {
                    setTimeout(() => this.processEnemyTurn(), 1000);
                }
            };
            
            this.battleMechanics.initializeTurnSystem();
            this.addBattleLogEntry('system', '🎯 Sistema de turnos inicializado');
        } else {
            console.warn('BattleMechanics não encontrado, usando sistema simplificado');
        }

        // Inicializar elementos UI
        this.initializeTurnUI();
    }

    initializeTurnUI() {
        // Criar display do timer se não existir
        if (!document.getElementById('turnTimer')) {
            const timerHTML = `
                <div id="turnTimer" class="turn-timer" style="display: none;">
                    <div class="timer-content">
                        <div class="timer-circle">
                            <div class="timer-text">
                                <span id="timerSeconds">20</span>s
                            </div>
                        </div>
                        <div class="timer-label">Tempo Restante</div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', timerHTML);
        }

        // Criar indicador de turno
        if (!document.getElementById('turnIndicator')) {
            const indicatorHTML = `
                <div id="turnIndicator" class="turn-indicator" style="display: none;">
                    <div class="indicator-content">
                        <span id="currentPlayerName">Jogador</span>
                        <div class="turn-phase" id="turnPhase">Selecionando Ação...</div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', indicatorHTML);
        }

        this.timerDisplay = document.getElementById('turnTimer');
        this.turnIndicator = document.getElementById('turnIndicator');
    }

    startPlayerTurn() {
        if (this.battleMechanics) {
            // Usar BattleMechanics para iniciar turno
            const turnInfo = this.battleMechanics.startPlayerTurn();
            this.addBattleLogEntry('system', '🎮 Seu turno! Selecione uma ação (20s)');
            
            // Mostrar UI do turno
            this.showTurnUI();
            this.enableActionButtons();
            this.updateTurnIndicator('Jogador', 'Selecionando Ação...');
            
            // Iniciar o timer visual na UI
            this.startTimerDisplay();
        } else {
            // Fallback para sistema simplificado
            this.showTurnUI();
            this.enableActionButtons();
            this.updateTurnIndicator('Jogador', 'Selecionando Ação...');
        }
    }

    startTimerDisplay() {
        // Timer visual que sincroniza com o BattleMechanics
        if (!this.battleMechanics) return;
        
        this.timerInterval = setInterval(() => {
            const status = this.battleMechanics.getTurnStatus();
            this.updateTimerDisplay(status.timeRemaining);
        }, 1000);
    }

    updateTimerDisplay(timeRemaining) {
        const seconds = Math.max(0, Math.ceil(timeRemaining / 1000));
        const timerText = document.getElementById('timerSeconds');
        if (timerText) {
            timerText.textContent = seconds;
            
            // Mudar cor conforme o tempo
            const timerCircle = document.querySelector('.timer-circle');
            if (timerCircle) {
                if (seconds <= 5) {
                    timerCircle.classList.add('warning');
                } else {
                    timerCircle.classList.remove('warning');
                }
            }
        }
    }

    clearTimerDisplay() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    showTimeWarning() {
        const timerDisplay = this.timerDisplay;
        if (timerDisplay) {
            timerDisplay.classList.add('warning-pulse');
            setTimeout(() => {
                timerDisplay.classList.remove('warning-pulse');
            }, 1000);
        }
    }

    declareAction(actionType, actionData = {}) {
        if (!this.battleMechanics) {
            this.addBattleLogEntry('error', 'Sistema de turnos não inicializado');
            return;
        }

        // Usar BattleMechanics para declarar ação
        const result = this.battleMechanics.declareAction(actionType, actionData);
        
        if (result.success) {
            this.updateTurnIndicator('Jogador', 'Processando...');
            this.disableActionButtons();
            this.clearTimerDisplay();
            
            // Processar ação após breve delay
            setTimeout(() => {
                this.processPlayerAction();
            }, 1000);
        } else {
            this.addBattleLogEntry('error', `Erro: ${result.reason}`);
        }
    }

    processPlayerAction() {
        if (!this.battleMechanics) {
            this.addBattleLogEntry('error', 'Sistema de turnos não inicializado');
            return;
        }

        // Usar BattleMechanics para processar ação
        const processResult = this.battleMechanics.processTurn();
        
        if (processResult.success) {
            this.addBattleLogEntry('system', '✅ Ação processada com sucesso');
        } else {
            this.addBattleLogEntry('error', `Erro no processamento: ${processResult.error}`);
        }
        
        // Finalizar turno após processamento
        setTimeout(() => {
            this.endPlayerTurn();
        }, 2000);
    }

    executeSwap(fromCharacter, toCharacter) {
        if (!this.battleMechanics) {
            this.addBattleLogEntry('error', 'Sistema de turnos não inicializado');
            return false;
        }

        try {
            const result = this.battleMechanics.executeSwap(fromCharacter, toCharacter);
            this.addBattleLogEntry('swap', `🔄 Troca executada (${result.swapsUsed}/${result.swapsUsed + result.swapsRemaining})`);
            return true;
        } catch (error) {
            this.addBattleLogEntry('error', `🚫 ${error.message}`);
            return false;
        }
    }

    endPlayerTurn() {
        if (this.battleMechanics) {
            this.battleMechanics.endTurn();
        }
        this.clearTimerDisplay();
        this.hideTurnUI();
    }

    processEnemyTurn() {
        this.updateTurnIndicator('Inimigo', 'Pensando...');
        
        // Simular "pensamento" da IA
        const thinkingTime = 1000 + Math.random() * 2000;
        
        setTimeout(() => {
            // IA escolhe ação aleatória
            const actions = ['attack', 'defend', 'meditate'];
            const randomAction = actions[Math.floor(Math.random() * actions.length)];
            
            this.addBattleLogEntry('action', `🤖 Inimigo usa: ${randomAction}`);
            this.updateTurnIndicator('Inimigo', 'Executando...');
            
            // Processar ação do inimigo
            setTimeout(() => {
                this.processEnemyAction(randomAction);
            }, 1000);
        }, thinkingTime);
    }

    processEnemyAction(actionType) {
        // Processar ação do inimigo
        switch (actionType) {
            case 'attack':
                this.enemyAttack();
                break;
            case 'defend':
                this.addBattleLogEntry('defend', '🛡️ Inimigo se defende!');
                break;
            case 'meditate':
                this.addBattleLogEntry('meditate', '🧘 Inimigo medita e recupera energia!');
                break;
        }
        
        // Finalizar turno do inimigo
        setTimeout(() => {
            this.endEnemyTurn();
        }, 2000);
    }

    endEnemyTurn() {
        // Verificar fim de batalha
        if (this.playerData.hp <= 0 || this.enemyData.hp <= 0) {
            this.endBattle();
            return;
        }
        
        // Iniciar próximo turno do jogador
        setTimeout(() => {
            this.startPlayerTurn();
        }, 1000);
    }

    showTurnUI() {
        if (this.timerDisplay) {
            this.timerDisplay.style.display = 'flex';
        }
        if (this.turnIndicator) {
            this.turnIndicator.style.display = 'flex';
        }
    }

    hideTurnUI() {
        if (this.timerDisplay) {
            this.timerDisplay.style.display = 'none';
        }
    }

    updateTurnIndicator(player, phase) {
        const playerNameEl = document.getElementById('currentPlayerName');
        const turnPhaseEl = document.getElementById('turnPhase');
        
        if (playerNameEl) playerNameEl.textContent = player;
        if (turnPhaseEl) turnPhaseEl.textContent = phase;
    }

    enableActionButtons() {
        const buttons = document.querySelectorAll('.action-btn');
        buttons.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('disabled');
        });
    }

    disableActionButtons() {
        const buttons = document.querySelectorAll('.action-btn');
        buttons.forEach(btn => {
            btn.disabled = true;
            btn.classList.add('disabled');
        });
    }

    canExecuteAction(actionType, actionData = {}) {
        if (!this.battleMechanics) {
            return { canExecute: false, reason: 'Sistema de turnos não inicializado' };
        }

        return this.battleMechanics.canExecuteAction(actionType, actionData);
    }

    setupActionButtons() {
        // Conectar botões de ação com sistema de turnos
        const attackBtn = document.querySelector('[data-action="attack"]');
        if (attackBtn) {
            attackBtn.addEventListener('click', () => {
                this.declareAction('attack');
            });
        }

        const defendBtn = document.querySelector('[data-action="defend"]');
        if (defendBtn) {
            defendBtn.addEventListener('click', () => {
                this.declareAction('defend');
            });
        }

        const meditateBtn = document.querySelector('[data-action="meditate"]');
        if (meditateBtn) {
            meditateBtn.addEventListener('click', () => {
                this.declareAction('meditate');
            });
        }

        // Conectar botões de skill
        document.querySelectorAll('.skill-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cost = parseInt(btn.dataset.cost || 0);
                this.declareAction('skill', { cost });
            });
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const battleDemo = new VintageBattleDemo();
    battleDemo.init();
});

// ========== THEMATIC SOUND SYSTEM ========== //

class VintageAudioSystem {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.isMuted = false;
        this.volume = 0.3;
        
        this.initAudio();
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createVintageSounds();
        } catch (e) {
            console.log('🔇 Audio Context não suportado');
        }
    }
    
    createVintageSounds() {
        // Create vintage-style audio using Web Audio API
        this.sounds = {
            attack: () => this.createTone(200, 0.1, 'sawtooth'),
            defend: () => this.createTone(400, 0.15, 'square'),
            meditate: () => this.createChord([262, 330, 392], 0.5, 'sine'), // C major chord
            critical: () => this.createSparkle(),
            victory: () => this.createFanfare(),
            defeat: () => this.createSombre(),
            hover: () => this.createTone(800, 0.05, 'triangle'),
            click: () => this.createTone(1200, 0.05, 'square'),
            pageFlip: () => this.createPageTurn(),
            mystical: () => this.createMysticalAmbience()
        };
    }
    
    createTone(frequency, duration, waveType = 'sine') {
        if (!this.audioContext || this.isMuted) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = waveType;
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    createChord(frequencies, duration, waveType = 'sine') {
        if (!this.audioContext || this.isMuted) return;
        
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.createTone(freq, duration, waveType);
            }, index * 50);
        });
    }
    
    createSparkle() {
        if (!this.audioContext || this.isMuted) return;
        
        // Create a sparkly sound with multiple tones
        const frequencies = [800, 1000, 1200, 1500];
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.createTone(freq, 0.1, 'triangle');
            }, index * 30);
        });
    }
    
    createFanfare() {
        if (!this.audioContext || this.isMuted) return;
        
        // Victory fanfare
        const melody = [262, 330, 392, 523]; // C, E, G, C (octave)
        melody.forEach((freq, index) => {
            setTimeout(() => {
                this.createTone(freq, 0.3, 'triangle');
            }, index * 150);
        });
    }
    
    createSombre() {
        if (!this.audioContext || this.isMuted) return;
        
        // Defeat sound
        const melody = [392, 330, 262, 196]; // G, E, C, G (low)
        melody.forEach((freq, index) => {
            setTimeout(() => {
                this.createTone(freq, 0.4, 'sine');
            }, index * 200);
        });
    }
    
    createPageTurn() {
        if (!this.audioContext || this.isMuted) return;
        
        // Simulate page turning with noise
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(2000, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.1);
        oscillator.type = 'sawtooth';
        
        gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    
    createMysticalAmbience() {
        if (!this.audioContext || this.isMuted) return;
        
        // Create mystical background ambience
        const frequencies = [110, 146.83, 220]; // A, D, A (octave)
        frequencies.forEach((freq) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.1, this.audioContext.currentTime + 2);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 8);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 8);
        });
    }
    
    play(soundType) {
        if (this.sounds[soundType]) {
            this.sounds[soundType]();
        }
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
}

// Initialize vintage audio system
const vintageAudio = new VintageAudioSystem();

// Enhanced sound function
function playSound(soundType) {
    vintageAudio.play(soundType);
    console.log(`🔊 Tocando som vintage: ${soundType}`);
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

// ========== ATMOSPHERIC PARTICLES SYSTEM ========== //

class AtmosphericParticleSystem {
    constructor() {
        this.particleField = document.getElementById('particleField');
        this.particles = [];
        this.isActive = true;
        this.maxParticles = 25;
    }

    init() {
        if (!this.particleField) return;
        
        this.startParticleSystem();
        
        // Create initial particles
        for (let i = 0; i < 15; i++) {
            setTimeout(() => this.createParticle(), i * 300);
        }
    }

    startParticleSystem() {
        if (!this.isActive) return;
        
        // Create regular particles
        setInterval(() => {
            if (this.particles.length < this.maxParticles) {
                this.createParticle();
            }
        }, 2000);
        
        // Create special orbs occasionally
        setInterval(() => {
            if (this.particles.length < this.maxParticles) {
                this.createOrb();
            }
        }, 5000);
        
        // Create dust particles
        setInterval(() => {
            if (this.particles.length < this.maxParticles) {
                this.createDust();
            }
        }, 1500);
    }

    createParticle() {
        if (!this.particleField) return;
        
        const particle = document.createElement('div');
        const size = ['small', 'medium', 'large'][Math.floor(Math.random() * 3)];
        const sparkle = Math.random() < 0.3 ? 'sparkle' : '';
        
        particle.className = `particle ${size} ${sparkle}`;
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 2 + 's';
        particle.style.animationDuration = (6 + Math.random() * 4) + 's';
        
        this.particleField.appendChild(particle);
        this.particles.push(particle);
        
        // Remove particle after animation
        setTimeout(() => {
            this.removeParticle(particle);
        }, 8000);
    }

    createOrb() {
        if (!this.particleField) return;
        
        const orb = document.createElement('div');
        orb.className = 'particle orb';
        orb.style.left = (20 + Math.random() * 60) + '%';
        orb.style.animationDelay = Math.random() * 3 + 's';
        orb.style.animationDuration = (12 + Math.random() * 6) + 's';
        
        this.particleField.appendChild(orb);
        this.particles.push(orb);
        
        // Remove orb after animation
        setTimeout(() => {
            this.removeParticle(orb);
        }, 18000);
    }

    createDust() {
        if (!this.particleField) return;
        
        const dust = document.createElement('div');
        dust.className = 'particle dust';
        dust.style.left = Math.random() * 100 + '%';
        dust.style.width = (2 + Math.random() * 3) + 'px';
        dust.style.height = (2 + Math.random() * 3) + 'px';
        dust.style.animationDelay = Math.random() * 2 + 's';
        dust.style.animationDuration = (10 + Math.random() * 4) + 's';
        
        this.particleField.appendChild(dust);
        this.particles.push(dust);
        
        // Remove dust after animation
        setTimeout(() => {
            this.removeParticle(dust);
        }, 14000);
    }

    createCriticalSparkle(x, y) {
        if (!this.particleField) return;
        
        const sparkleCount = 8 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < sparkleCount; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'critical-sparkle';
            sparkle.style.left = x + (Math.random() * 60 - 30) + 'px';
            sparkle.style.top = y + (Math.random() * 60 - 30) + 'px';
            sparkle.style.animationDelay = (Math.random() * 0.3) + 's';
            
            this.particleField.appendChild(sparkle);
            
            // Remove sparkle after animation
            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.parentNode.removeChild(sparkle);
                }
            }, 1500);
        }
    }

    removeParticle(particle) {
        if (particle && particle.parentNode) {
            particle.parentNode.removeChild(particle);
            const index = this.particles.indexOf(particle);
            if (index > -1) {
                this.particles.splice(index, 1);
            }
        }
    }

    pauseParticles() {
        this.isActive = false;
        this.particles.forEach(particle => {
            particle.style.animationPlayState = 'paused';
        });
    }

    resumeParticles() {
        this.isActive = true;
        this.particles.forEach(particle => {
            particle.style.animationPlayState = 'running';
        });
    }

    clearAllParticles() {
        this.particles.forEach(particle => {
            this.removeParticle(particle);
        });
        this.particles = [];
    }
}

// Initialize particle system
document.addEventListener('DOMContentLoaded', () => {
    const particleSystem = new AtmosphericParticleSystem();
    particleSystem.init();
    
    // Make it globally available for critical hit effects
    window.particleSystem = particleSystem;
});
