/**
 * RPGStack Battle System - Art Nouveau Vintage Demo
 * Inspirado na estética de Reverse 1999
 * Versão: 2.0.0 (Vintage Edition)
 */

class VintageBattleDemo {
    constructor() {
        this.currentTurn = 1;
        this.swapsUsedThisTurn = 0; // Contador local para trocas
        this.lastSwapTime = 0; // Timestamp da última troca para debounce
        
        // Sistema de memória temporária para personagens da batalha
        this.battleCharactersCache = {
            playerTeam: [], // Armazena dados completos dos personagens do jogador
            enemyTeam: [],  // Armazena dados completos dos personagens inimigos
            initialized: false
        };
        
        this.playerData = {
            name: "Herói Ancestral",
            level: 1,
            hp: 100,
            maxHP: 100,
            mp: 50,
            maxMP: 50,
            skills: []
        };
        
        // Inicializar carregador de skills
        this.skillLoader = new SkillLoader();
        
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
        await this.skillLoader.loadAllSkills();
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
                    'Oráculo', 'Artífice', 'Naturalista', // Classes originais CHRONOS
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
                        id: char.id, // Usar ID original do banco (hex)
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
        // Floating buttons functionality
        this.initScrollToTopButton();

        // Action buttons
        // ✅ REFATORAÇÃO v4.9.5: Removido performAttack() duplicado - usar apenas sistema seguro
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
                // ✅ REFATORAÇÃO v4.9.5: Usar sistema seguro unificado
                this.declareAction('attack');
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
                const characterId = option.dataset.characterId; // Manter como string (hex ID)
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
        // Update floating start battle button
        if (this.updateFloatingStartBattleButton) {
            this.updateFloatingStartBattleButton();
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
        // Nota: populateSkills() será chamado após a inicialização do sistema de batalha
        
        // Inicializar sistema de turnos
        this.initializeTurnSystem();
        this.setupActionButtons();
        
        // GARANTIR que o cache seja inicializado se estivermos usando sistema seguro
        if (this.secureBattleClient && this.secureBattleClient.isBattleActive() && !this.battleCharactersCache?.initialized) {
            console.log('🗂️ Garantindo inicialização do cache na transição para batalha...');
            setTimeout(async () => {
                await this.initializeBattleCharactersCache();
            }, 1000); // Dar tempo para o sistema seguro se estabilizar
        }
        
        // IMPORTANTE: Sincronizar dados após inicialização completa
        setTimeout(async () => {
            // Verificar se estamos usando o sistema seguro ou legacy
            if (this.secureBattleClient && this.secureBattleClient.isBattleActive()) {
                console.log('🔄 Sincronizando dados com sistema seguro...');
                await this.syncPlayerDataWithActiveCharacter();
                this.updatePlayerCard(); // Atualizar interface com dados corretos
                this.updateActiveBattleCharacter(); // Atualizar personagem ativo da batalha
                this.updateCharacterSlots(); // Atualizar slots dos personagens
                console.log('✅ Sincronização segura concluída');
            } else if (this.battleMechanics && this.battleMechanics.battleState && this.battleMechanics.battleState.teams) {
                console.log('🔄 Sincronizando dados com sistema legacy...');
                await this.syncPlayerDataWithActiveCharacter();
                this.updatePlayerCard(); // Atualizar interface com dados corretos
                this.updateActiveBattleCharacter(); // Atualizar personagem ativo da batalha
                this.updateCharacterSlots(); // Atualizar slots dos personagens
                console.log('✅ Sincronização legacy concluída');
            } else {
                console.warn('⚠️ Nenhum sistema de batalha disponível para sincronização');
            }
        }, 100); // Pequeno delay para garantir inicialização
        
        // Add initial log entry
        const firstPlayerName = this.playerTeam.characters[0]?.name || this.playerTeam.characters[0]?.id || 'Jogador Desconhecido';
        this.addBattleLogEntry('system', `${firstPlayerName} entra na arena ancestral...`);
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
        
        // Atualizar Ânima
        const animaEl = document.getElementById(`${prefix}Anima`);
        const maxAnimaEl = document.getElementById(`${prefix}MaxAnima`);
        if (animaEl) animaEl.textContent = character.currentAnima || character.anima || 50;
        if (maxAnimaEl) maxAnimaEl.textContent = character.maxAnima || character.anima || 50;
        
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
        
        // Atualizar Ânima  
        const animaEl = document.getElementById(`${prefix}Anima${slotIndex}`);
        const maxAnimaEl = document.getElementById(`${prefix}MaxAnima${slotIndex}`);
        if (animaEl) animaEl.textContent = character.currentAnima || character.anima || 50;
        if (maxAnimaEl) maxAnimaEl.textContent = character.maxAnima || character.anima || 50;
        
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
            
            // CORREÇÃO v4.9.6: Adicionar animação suave às barras de HP/Ânima
            bar.style.transition = 'width 0.8s ease-out, background-color 0.3s ease';
            bar.style.width = `${percentage}%`;
            
            // Efeito visual extra para perda de HP (piscar vermelho)
            if (barId.includes('HP') && percentage < 50) {
                bar.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.5)';
                setTimeout(() => {
                    bar.style.boxShadow = 'none';
                }, 300);
            }
        }
    }

    updatePlayerCard() {
        // Adicionar verificações de null para evitar erros
        const playerName = document.getElementById('playerName');
        if (playerName) playerName.textContent = this.playerData.name;
        
        const playerLevel = document.getElementById('playerLevel');
        if (playerLevel) playerLevel.textContent = this.playerData.level;
        
        const playerHP = document.getElementById('playerHP');
        if (playerHP) playerHP.textContent = this.playerData.hp;
        
        const playerMaxHP = document.getElementById('playerMaxHP');
        if (playerMaxHP) playerMaxHP.textContent = this.playerData.maxHP;
        
        const playerMP = document.getElementById('playerMP');
        if (playerMP) playerMP.textContent = this.playerData.mp;
        
        const playerMaxMP = document.getElementById('playerMaxMP');
        if (playerMaxMP) playerMaxMP.textContent = this.playerData.maxMP;
        
        const playerImage = document.getElementById('playerImage');
        if (playerImage) {
            playerImage.src = this.playerData.image || playerImage.src;
        }

        // Update health and mana bars
        this.updateHealthBar('player', this.playerData.hp, this.playerData.maxHP);
        this.updateAnimaBar('player', this.playerData.anima, this.playerData.maxAnima);
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
        this.updateAnimaBar('enemy', this.enemyData.anima, this.enemyData.maxAnima);
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

    updateAnimaBar(target, current, max) {
        const animaBar = document.getElementById(`${target}AnimaBar`);
        if (animaBar) {
            const percentage = (current / max) * 100;
            animaBar.style.width = `${percentage}%`;
            
            // Ensure anima bar always has the emerald color
            animaBar.style.background = 'linear-gradient(90deg, var(--emerald), var(--emerald-light))';
        }
    }

    async populateSkills() {
        const skillsList = document.getElementById('skillsList');
        if (!skillsList) return;

        // Verificar se sistemas de batalha estão disponíveis antes de carregar
        const hasSystemsReady = (this.battleMechanics && this.battleMechanics.battleState && this.battleMechanics.battleState.teams) ||
                                (this.secureBattleClient && this.secureBattleClient.isBattleActive());

        // Se playerData.skills está vazio, tentar carregar as skills do personagem ativo
        if (this.playerData.skills.length === 0 && hasSystemsReady) {
            await this.loadPlayerSkills();
        }

        if (this.playerData.skills.length === 0) {
            skillsList.innerHTML = '<div class="no-skills-message">Nenhuma habilidade disponível</div>';
            return;
        }

        skillsList.innerHTML = this.playerData.skills.map((skill, index) => `
            <div class="skill-item" data-skill-index="${index}">
                <div class="skill-icon">✦</div>
                <div class="skill-info">
                    <div class="skill-name">${skill.name || skill.skillName}</div>
                    <div class="skill-cost">Custo: ${skill.anima_cost || skill.cost || 0} ✦</div>
                    <div class="skill-description">${skill.description || 'Habilidade especial'}</div>
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

    async loadPlayerSkills() {
        try {
            // Debug completo do estado
            console.log('🔍 [DEBUG] Iniciando loadPlayerSkills()');
            console.log('🔍 [DEBUG] this.battleMechanics:', !!this.battleMechanics);
            console.log('🔍 [DEBUG] this.secureBattleClient:', !!this.secureBattleClient);
            
            // Buscar personagem ativo
            let activeCharacter = null;
            
            if (this.battleMechanics && this.battleMechanics.battleState && this.battleMechanics.battleState.teams) {
                console.log('🔍 [DEBUG] Usando battleMechanics');
                const playerTeam = this.battleMechanics.battleState.teams.player;
                console.log('🔍 [DEBUG] playerTeam:', playerTeam);
                console.log('🔍 [DEBUG] activeIndex:', playerTeam.activeIndex);
                console.log('🔍 [DEBUG] characters:', playerTeam.characters);
                activeCharacter = playerTeam.characters[playerTeam.activeIndex];
                console.log('🔍 [DEBUG] activeCharacter from battleMechanics:', activeCharacter);
            } else if (this.secureBattleClient && this.secureBattleClient.isBattleActive()) {
                console.log('🔍 [DEBUG] Usando secureBattleClient');
                // Usar estado já carregado em memória
                activeCharacter = this.secureBattleClient.getActiveCharacter('player');
                console.log('🔍 [DEBUG] activeCharacter from secure:', activeCharacter);
                
                if (!activeCharacter && this.secureBattleClient.battleState) {
                    // Fallback: acessar diretamente battleState
                    const battleState = this.secureBattleClient.battleState;
                    console.log('🔍 [DEBUG] battleState from secure (fallback):', battleState);
                    if (battleState && battleState.playerTeam && battleState.playerTeam.characters) {
                        activeCharacter = battleState.playerTeam.characters[battleState.playerTeam.activeIndex];
                        console.log('🔍 [DEBUG] activeCharacter from secure (fallback):', activeCharacter);
                    }
                }
            } else {
                console.log('🔍 [DEBUG] Nenhum sistema de batalha disponível');
                console.log('🔍 [DEBUG] battleMechanics exists:', !!this.battleMechanics);
                if (this.battleMechanics) {
                    console.log('🔍 [DEBUG] battleMechanics.battleState:', !!this.battleMechanics.battleState);
                    if (this.battleMechanics.battleState) {
                        console.log('🔍 [DEBUG] battleMechanics.battleState.teams:', !!this.battleMechanics.battleState.teams);
                    }
                }
            }

            if (!activeCharacter) {
                console.warn('⚠️ Nenhum personagem ativo encontrado');
                return;
            }

            console.log('🔍 Carregando skills do personagem:', activeCharacter.name || activeCharacter.id);
            console.log('📋 Skills do personagem:', activeCharacter.skills);
            console.log('🔍 [DEBUG] activeCharacter completo:', activeCharacter);
            console.log('🔍 [DEBUG] activeCharacter.keys:', Object.keys(activeCharacter));
            console.log('🔍 [DEBUG] activeCharacter properties:');
            Object.keys(activeCharacter).forEach(key => {
                console.log(`  ${key}:`, activeCharacter[key]);
            });

            const playerSkills = [];
            
            // Se o personagem já tem skills completas (carregadas pelo backend)
            if (activeCharacter.skills && Array.isArray(activeCharacter.skills)) {
                for (const skill of activeCharacter.skills) {
                    // Skills já vem completas do backend através do BattleMechanics
                    if (skill.name && skill.skillId) {
                        playerSkills.push({
                            name: skill.name,
                            cost: skill.anima_cost || 25,
                            damage: [skill.damage || 20, (skill.damage || 20) + 10],
                            description: skill.description || 'Habilidade especial',
                            anima_cost: skill.anima_cost || 25,
                            originalSkill: skill
                        });
                        console.log('✅ Skill carregada do backend:', skill.name);
                    } else {
                        // Fallback para skills que só têm ID
                        let skillId = skill.skillId || skill.id || skill;
                        let skillDetails = this.skillLoader.skills.get(skillId);
                        
                        if (skillDetails) {
                            playerSkills.push({
                                name: skillDetails.name,
                                cost: skillDetails.anima_cost || 25,
                                damage: [skillDetails.damage || 20, (skillDetails.damage || 20) + 10],
                                description: skillDetails.description || 'Habilidade especial',
                                anima_cost: skillDetails.anima_cost || 25,
                                originalSkill: skillDetails
                            });
                            console.log('✅ Skill carregada do loader:', skillDetails.name);
                        } else {
                            console.warn('⚠️ Skill não encontrada:', skillId);
                        }
                    }
                }
            }

            this.playerData.skills = playerSkills;
            console.log(`🎯 ${playerSkills.length} skills carregadas para ${activeCharacter.name || activeCharacter.id}`);
            
        } catch (error) {
            console.error('❌ Erro ao carregar skills do jogador:', error);
        }
    }

    // ✅ REFATORAÇÃO v4.9.5: performAttack() REMOVIDA
    // Função legacy insegura eliminada - usar apenas declareAction('attack')

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

    async toggleSkills() {
        const skillsPanel = document.getElementById('skillsPanel');
        if (!skillsPanel) return;

        this.skillsVisible = !this.skillsVisible;
        
        if (this.skillsVisible) {
            // Tentar recarregar skills se não temos nenhuma
            if (this.playerData.skills.length === 0) {
                await this.populateSkills();
            }
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
        
        // Reset contador de trocas para o novo turno
        this.swapsUsedThisTurn = 0;
        console.log('Novo turno iniciado. Contador de trocas resetado.');
        
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

        // CORREÇÃO v4.9.6: Position based on target usando estrutura atual
        let targetElement = null;
        if (target === 'enemy') {
            targetElement = document.getElementById('enemyActiveBattleImage') || document.getElementById('enemyActiveBattleName');
        } else if (target === 'player') {
            targetElement = document.getElementById('playerActiveBattleImage') || document.getElementById('playerActiveBattleName');
        }
        
        if (targetElement) {
            const rect = targetElement.getBoundingClientRect();
            damageEl.style.position = 'fixed';
            damageEl.style.left = `${rect.left + rect.width/2 + Math.random() * 60 - 30}px`;
            damageEl.style.top = `${rect.top + rect.height/2 + Math.random() * 40 - 20}px`;
            damageEl.style.zIndex = '1000';
        } else {
            // Fallback: center of screen
            damageEl.style.position = 'fixed';
            damageEl.style.left = '50%';
            damageEl.style.top = '30%';
            damageEl.style.transform = 'translateX(-50%)';
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
        this.swapsUsedThisTurn = 0; // Reset contador de trocas
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

    initScrollToTopButton() {
        this.initFloatingButtons();
    }

    initFloatingButtons() {
        const floatingContainer = document.querySelector('.floating-buttons-container');
        const scrollToTopBtn = document.getElementById('scrollToTop');
        const floatingClearTeam = document.getElementById('floatingClearTeam');
        const floatingStartBattle = document.getElementById('floatingStartBattle');
        
        console.log('🔍 DEBUG: Floating buttons elements:', {
            container: floatingContainer,
            scrollToTop: scrollToTopBtn,
            clearTeam: floatingClearTeam,
            startBattle: floatingStartBattle
        });
        
        if (!floatingContainer) {
            console.error('❌ Container de botões flutuantes não encontrado!');
            return;
        }

        // Show/hide floating buttons based on modal scroll position
        const checkModalScroll = () => {
            const modalContent = document.querySelector('.modal-content.team-selection');
            if (modalContent && modalContent.scrollTop > 200) {
                floatingContainer.classList.add('show');
            } else {
                floatingContainer.classList.remove('show');
            }
        };

        // Monitor modal scroll
        const modalContent = document.querySelector('.modal-content.team-selection');
        if (modalContent) {
            modalContent.addEventListener('scroll', checkModalScroll);
        }

        // Also check on window scroll as fallback
        window.addEventListener('scroll', checkModalScroll);

        // Scroll to top functionality
        if (scrollToTopBtn) {
            scrollToTopBtn.addEventListener('click', () => {
                console.log('🔝 Clique no botão scroll to top');
                const modalContent = document.querySelector('.modal-content.team-selection');
                if (modalContent) {
                    modalContent.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                    console.log('📜 Scroll para o topo do modal');
                }
            });
        }

        // Clear team functionality
        if (floatingClearTeam) {
            floatingClearTeam.addEventListener('click', () => {
                console.log('🧹 Clique no botão limpar seleção flutuante');
                this.clearTeamSelection();
            });
        }

        // Start battle functionality
        if (floatingStartBattle) {
            floatingStartBattle.addEventListener('click', () => {
                console.log('⚔️ Clique no botão iniciar duelo flutuante');
                if (!floatingStartBattle.disabled) {
                    this.startBattle();
                }
            });
        }

        // Update floating start battle button state based on team selection
        this.updateFloatingStartBattleButton = () => {
            if (floatingStartBattle) {
                floatingStartBattle.disabled = this.selectedTeam.length !== this.maxTeamSize;
            }
        };
        
        console.log('✅ Botões flutuantes inicializados');
    }

    /**
     * Inicializar sistema de batalha simplificado (fallback)
     */
    initializeSimpleBattle() {
        const playerCharacter = {
            id: "player_test",
            name: this.playerTeam?.characters?.[0]?.name || "Herói",
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
        
        // Inicializar batalha simples no BattleMechanics
        this.battleMechanics.initializeBattle(playerCharacter, enemyCharacter);
        this.battleState = 'simple-battle';
        this.addBattleLogEntry('system', '🎮 Sistema simplificado inicializado');
    }

    /**
     * Sistema de Turnos Integrado
     */

    initializeTurnSystem() {
        // Inicializar cliente de batalha seguro
        if (typeof SecureBattleClient !== 'undefined') {
            this.secureBattleClient = new SecureBattleClient();
            
            // Verificar se existe sistema 3v3 configurado
            if (this.playerTeam && this.enemyTeam && 
                this.playerTeam.characters && this.enemyTeam.characters &&
                this.playerTeam.characters.length === 3 && this.enemyTeam.characters.length === 3) {
                
                try {
                    // Debug: verificar estrutura das equipes
                    console.log('🔍 [DEBUG] playerTeam.characters:', this.playerTeam.characters);
                    console.log('🔍 [DEBUG] enemyTeam.characters:', this.enemyTeam.characters);
                    
                    // Converter nomes de personagens para formato esperado pelo backend
                    const convertTeamForBackend = (teamCharacters) => {
                        return teamCharacters.map(char => {
                            // Se já é objeto com id e name, retornar como está
                            if (typeof char === 'object' && char.id && char.name) {
                                return { id: char.id, name: char.name };
                            }
                            
                            // Se é string (nome do personagem), encontrar o personagem completo
                            if (typeof char === 'string') {
                                const fullCharacter = this.characters.find(c => c.name === char);
                                if (fullCharacter) {
                                    return { id: fullCharacter.id, name: fullCharacter.name };
                                } else {
                                    console.error('❌ Personagem não encontrado:', char);
                                    return null;
                                }
                            }
                            
                            console.error('❌ Formato de personagem inválido:', char);
                            return null;
                        }).filter(char => char !== null);
                    };
                    
                    const playerTeamFormatted = convertTeamForBackend(this.playerTeam.characters);
                    const enemyTeamFormatted = convertTeamForBackend(this.enemyTeam.characters);
                    
                    console.log('🔄 [DEBUG] playerTeam formatado:', playerTeamFormatted);
                    console.log('🔄 [DEBUG] enemyTeam formatado:', enemyTeamFormatted);
                    
                    // Inicializar batalha segura no backend
                    this.secureBattleClient.startSecureBattle(
                        playerTeamFormatted, 
                        enemyTeamFormatted, 
                        '3v3'
                    ).then(async result => {
                        this.addBattleLogEntry('system', '🔐 Sistema 3v3 seguro inicializado!');
                        
                        // Configurar modo 3v3 explicitamente
                        this.battleState = '3v3-secure-battle';
                        
                        // Inicializar cache de personagens com dados completos
                        console.log('🗂️ Inicializando cache após sucesso da batalha segura...');
                        await this.initializeBattleCharactersCache();
                        
                        // Log das equipes
                        this.addBattleLogEntry('system', 
                            `👥 Equipe Jogador: ${this.playerTeam.characters.map(c => c.name).join(', ')}`
                        );
                        this.addBattleLogEntry('system', 
                            `👥 Equipe Inimigo: ${this.enemyTeam.characters.map(c => c.name).join(', ')}`
                        );
                        
                        this.addBattleLogEntry('system', `🆔 Battle ID: ${result.battleId}`);
                    }).catch(error => {
                        console.error('❌ Erro ao inicializar batalha segura:', error);
                        this.addBattleLogEntry('error', `❌ Falha na inicialização segura: ${error.message}`);
                    });
                    
                } catch (validationError) {
                    console.error('Erro na validação das equipes 3v3:', validationError);
                    this.addBattleLogEntry('error', `❌ Erro na configuração 3v3: ${validationError.message}`);
                    
                    // Fallback para sistema simplificado
                    this.initializeSimpleBattle();
                }
                
            } else {
                this.initializeSimpleBattle();
            }
            
            // Verificar se o sistema seguro está disponível
            if (this.secureBattleClient) {
                console.log('🔐 Usando sistema de batalha seguro');
                // Sistema seguro não precisa de callbacks de timeout local
            } else if (this.battleMechanics && this.battleMechanics.setTimeoutCallbacks) {
                console.log('⚠️ Usando sistema de batalha legacy (inseguro)');
                // Configurar callbacks para sistema legacy
                this.battleMechanics.setTimeoutCallbacks(
                (timeoutData) => {
                    // Callback de timeout
                    this.updateTurnIndicator(
                        timeoutData.player === 'player' ? 'Jogador' : 'Inimigo', 
                        `Tempo Esgotado! Executando ${timeoutData.action}`
                    );
                    this.addBattleLogEntry('timeout', 
                        `⏰ ${timeoutData.player === 'player' ? 'Você' : 'Inimigo'} demorou demais! Ação automática: ${timeoutData.action}`
                    );
                    
                    // Auto-processar o turno após timeout
                    setTimeout(() => {
                        this.processTurn();
                    }, 1500);
                },
                (warningData) => {
                    // Callback de aviso
                    this.showTimeWarning();
                    this.addBattleLogEntry('system', 
                        `⚠️ Aviso: ${Math.ceil(warningData.timeRemaining / 1000)}s restantes!`
                    );
                }
                );
                
                this.battleMechanics.onTurnStartCallback = (player) => {
                    this.showTurnUI();
                    this.enableActionButtons();
                    this.updateTurnIndicator(player === 'player' ? 'Jogador' : 'Inimigo', 'Selecionando Ação...');
                };
            }
            
            if (this.battleMechanics && this.battleMechanics.onTurnEndCallback) {
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
            }
        } else {
            console.warn('⚠️ SecureBattleClient não encontrado, usando sistema simplificado INSEGURO');
            this.addBattleLogEntry('warning', '⚠️ Sistema de batalha não seguro - recomendado usar APIs backend');
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
        if (this.secureBattleClient && this.secureBattleClient.isBattleActive()) {
            // Sistema seguro - implementar timer básico
            console.log('🔐 Iniciando turno do jogador no sistema seguro');
            this.addBattleLogEntry('system', '🎮 Seu turno! Selecione uma ação (20s)');
            
            // Mostrar UI do turno
            this.showTurnUI();
            this.enableActionButtons();
            this.updateTurnIndicator('Jogador', 'Selecionando Ação...');
            
            // Iniciar timer simplificado para sistema seguro
            this.startSecureTimerDisplay();
        } else if (this.battleMechanics) {
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
            this.addBattleLogEntry('system', '🎮 Seu turno! Selecione uma ação');
        }
    }

    startSecureTimerDisplay() {
        // Timer visual para sistema seguro (independente do backend)
        
        // Limpar timer existente antes de criar novo
        this.clearTimerDisplay();
        
        let timeRemaining = 20000; // 20 segundos
        const startTime = Date.now();
        
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            timeRemaining = Math.max(0, 20000 - elapsed);
            this.updateTimerDisplay(timeRemaining);
            
            if (timeRemaining <= 0) {
                this.clearTimerDisplay();
                this.addBattleLogEntry('system', '⏰ Tempo esgotado! Processando ação padrão...');
                this.handleSecureTimeout();
            }
        }, 100);
    }

    startTimerDisplay() {
        // Timer visual que sincroniza com o BattleMechanics
        if (!this.battleMechanics) return;
        
        // Limpar timer existente antes de criar novo
        this.clearTimerDisplay();
        
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

    handleSecureTimeout() {
        // Ação padrão quando tempo esgota no sistema seguro
        if (this.secureBattleClient && this.secureBattleClient.isBattleActive()) {
            this.disableActionButtons();
            this.hideTurnUI();
            
            // Executar ataque básico como ação padrão
            const activeChar = this.secureBattleClient.getActiveCharacter('player');
            const enemyChar = this.secureBattleClient.getActiveCharacter('enemy');
            
            if (activeChar && enemyChar) {
                console.log('🔐 Executando ação padrão do timeout no sistema seguro');
                
                // CORREÇÃO: Usar fallback para nomes undefined
                const playerName = activeChar.name || activeChar.id || 'Jogador Desconhecido';
                
                this.secureBattleClient.executeSecureAttack(activeChar.id, enemyChar.id)
                    .then(result => {
                        if (result.success) {
                            this.addBattleLogEntry('attack', `${playerName} executa ataque básico por tempo esgotado`);
                        } else {
                            this.addBattleLogEntry('error', 'Falha na ação de timeout');
                        }
                        // Continuar para próximo turno
                        setTimeout(() => this.processEnemyTurn(), 2000);
                    })
                    .catch(error => {
                        console.error('Erro na ação de timeout:', error);
                        setTimeout(() => this.processEnemyTurn(), 2000);
                    });
            } else {
                setTimeout(() => this.processEnemyTurn(), 2000);
            }
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
        console.log('🔍 [DEBUG] declareAction called:', actionType, actionData);
        console.log('🔍 [DEBUG] secureBattleClient exists:', !!this.secureBattleClient);
        console.log('🔍 [DEBUG] isBattleActive:', this.secureBattleClient?.isBattleActive());
        
        if (this.secureBattleClient && this.secureBattleClient.isBattleActive()) {
            // Sistema seguro - executar ação diretamente
            console.log('🔐 Executando ação no sistema seguro:', actionType);
            this.updateTurnIndicator('Jogador', 'Processando...');
            this.disableActionButtons();
            this.clearTimerDisplay();
            
            this.executeSecureAction(actionType, actionData);
        } else if (this.battleMechanics) {
            // Sistema legacy
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
        } else {
            this.addBattleLogEntry('error', 'Sistema de turnos não inicializado');
        }
    }

    executeSecureAction(actionType, actionData = {}) {
        // ✅ DEBUG v4.9.5: Adicionar logs detalhados para debug
        console.log('🔍 [DEBUG] executeSecureAction called:', actionType, actionData);
        console.log('🔍 [DEBUG] secureBattleClient exists:', !!this.secureBattleClient);
        console.log('🔍 [DEBUG] isBattleActive:', this.secureBattleClient?.isBattleActive());
        
        // Executar ação no sistema seguro
        const playerChar = this.secureBattleClient.getActiveCharacter('player');
        const enemyChar = this.secureBattleClient.getActiveCharacter('enemy');
        
        console.log('🔍 [DEBUG] playerChar:', playerChar);
        console.log('🔍 [DEBUG] enemyChar:', enemyChar);
        
        if (!playerChar || !enemyChar) {
            console.error('❌ [DEBUG] Personagens não encontrados - playerChar:', !!playerChar, 'enemyChar:', !!enemyChar);
            this.addBattleLogEntry('error', 'Personagens não encontrados');
            return;
        }
        
        switch (actionType) {
            case 'attack':
                // Executar ataque básico
                console.log('🔍 [DEBUG] Calling executeSecureAttack with:', playerChar.id, enemyChar.id);
                this.secureBattleClient.executeSecureAttack(playerChar.id, enemyChar.id)
                    .then((result) => {
                        console.log('🔍 [DEBUG] executeSecureAttack result:', result);
                        if (result.success) {
                            // CORREÇÃO v4.9.6: Resolver nomes usando cache de personagens
                            // CORREÇÃO v4.9.6-hotfix: Resolver nomes diretamente sem função this
                            const playerName = playerChar.name || playerChar.id || 'Jogador';
                            const enemyName = enemyChar.name || enemyChar.id || 'Inimigo';
                            
                            // ✅ CORREÇÃO v4.9.6: Extrair dano numérico corretamente
                            let damage = result.action?.damage || result.damage || 0;
                            if (typeof damage === 'object' && damage.damage !== undefined) {
                                damage = damage.damage; // DamageCalculationSystem retorna {damage: número}
                            }
                            const isCritical = result.isCritical || false;
                            this.showDamageNumber(damage, isCritical, 'enemy');
                            
                            this.addBattleLogEntry('attack', `${playerName} ataca ${enemyName}! Dano: ${damage}`);
                            if (isCritical) {
                                this.addBattleLogEntry('critical', '💥 Acerto crítico!');
                            }
                            
                            // CORREÇÃO v4.9.6: Atualizar HP do inimigo após ataque
                            if (result.action && result.action.targetHP !== undefined) {
                                const enemyHPElement = document.getElementById('enemyActiveBattleHP');
                                const enemyHPBar = document.getElementById('enemyActiveBattleHPBar');
                                const enemyMaxHPElement = document.getElementById('enemyActiveBattleMaxHP');
                                
                                if (enemyHPElement && enemyHPBar && enemyMaxHPElement) {
                                    const newHP = result.action.targetHP;
                                    const maxHP = parseInt(enemyMaxHPElement.textContent) || 100;
                                    
                                    // Atualizar texto do HP
                                    enemyHPElement.textContent = newHP;
                                    
                                    // Atualizar barra com animação
                                    this.updateMiniBar('enemyActiveBattleHPBar', newHP, maxHP);
                                }
                            }
                        } else {
                            this.addBattleLogEntry('error', `Falha no ataque: ${result.error}`);
                        }
                        this.processSecureTurnEnd();
                    })
                    .catch(error => {
                        console.error('❌ [DEBUG] Erro no ataque detalhado:', error);
                        console.error('❌ [DEBUG] Error message:', error.message);
                        console.error('❌ [DEBUG] Error stack:', error.stack);
                        this.addBattleLogEntry('error', `Erro no ataque: ${error.message}`);
                        this.processSecureTurnEnd();
                    });
                break;
                
            case 'defend':
                // CORREÇÃO v4.9.6: Resolver nome usando cache de personagens
                const playerNameDefend = playerChar.name || playerChar.id || 'Jogador';
                this.addBattleLogEntry('buff', `${playerNameDefend} assume posição defensiva!`);
                // No sistema seguro, defender pode ser implementado mais tarde
                this.processSecureTurnEnd();
                break;
                
            case 'meditate':
                // CORREÇÃO v4.9.6: Resolver nome usando cache de personagens
                const playerNameMeditate = playerChar.name || playerChar.id || 'Jogador';
                this.addBattleLogEntry('buff', `${playerNameMeditate} medita e recupera energia!`);
                // No sistema seguro, meditar pode ser implementado mais tarde
                this.processSecureTurnEnd();
                break;
                
            default:
                this.addBattleLogEntry('error', `Ação desconhecida: ${actionType}`);
                this.processSecureTurnEnd();
        }
    }

    processSecureTurnEnd() {
        // Finalizar turno no sistema seguro
        setTimeout(() => {
            this.hideTurnUI();
            this.addBattleLogEntry('system', '🤖 Turno do inimigo...');
            
            // Simular turno inimigo (básico por enquanto)
            setTimeout(() => {
                this.processSecureEnemyTurn();
            }, 2000);
        }, 1000);
    }

    processSecureEnemyTurn() {
        // Turno inimigo simplificado no sistema seguro
        const playerChar = this.secureBattleClient.getActiveCharacter('player');
        const enemyChar = this.secureBattleClient.getActiveCharacter('enemy');
        
        console.log('🔍 [DEBUG DATA BINDING] processSecureEnemyTurn:');
        console.log('📊 playerChar:', playerChar);
        console.log('📊 enemyChar:', enemyChar);
        
        if (playerChar && enemyChar) {
            // CORREÇÃO v4.9.6: Resolver nomes usando cache de personagens
            const playerName = playerChar.name || playerChar.id || 'Jogador';
            const enemyName = enemyChar.name || enemyChar.id || 'Inimigo';
            
            // Inimigo sempre ataca por enquanto (IA básica)
            this.addBattleLogEntry('enemy', `${enemyName} prepara um ataque...`);
            
            setTimeout(() => {
                // ✅ CORREÇÃO v4.9.5: Adicionar animações de dano do inimigo
                const enemyDamage = this.calculateDamage(15, 25); // Dano básico do inimigo
                const isEnemyCritical = Math.random() < 0.1; // 10% chance crítico
                const finalEnemyDamage = isEnemyCritical ? Math.floor(enemyDamage * 1.5) : enemyDamage;
                
                // Mostrar animação de dano no jogador
                this.showDamageNumber(finalEnemyDamage, isEnemyCritical, 'player');
                
                // CORREÇÃO v4.9.6: Atualizar HP do jogador após ataque inimigo
                const playerHPElement = document.getElementById('playerActiveBattleHP');
                const playerHPBar = document.getElementById('playerActiveBattleHPBar');
                const playerMaxHPElement = document.getElementById('playerActiveBattleMaxHP');
                
                if (playerHPElement && playerHPBar && playerMaxHPElement) {
                    const currentHP = parseInt(playerHPElement.textContent) || 100;
                    const maxHP = parseInt(playerMaxHPElement.textContent) || 100;
                    const newHP = Math.max(0, currentHP - finalEnemyDamage);
                    
                    // Atualizar texto do HP
                    playerHPElement.textContent = newHP;
                    
                    // Atualizar barra com animação
                    this.updateMiniBar('playerActiveBattleHPBar', newHP, maxHP);
                }
                
                this.addBattleLogEntry('enemy', `${enemyName} ataca ${playerName}! Dano: ${finalEnemyDamage}`);
                if (isEnemyCritical) {
                    this.addBattleLogEntry('critical', '💥 Inimigo causou crítico!');
                }
                
                // Iniciar próximo turno do jogador
                setTimeout(() => {
                    this.startPlayerTurn();
                }, 2000);
            }, 1500);
        } else {
            console.warn('⚠️ [DEBUG DATA BINDING] playerChar ou enemyChar são null/undefined');
            // Fallback - iniciar próximo turno
            setTimeout(() => {
                this.startPlayerTurn();
            }, 2000);
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

    executeSwap(fromCharacterIndex, toCharacterIndex) {
        if (this.secureBattleClient && this.secureBattleClient.isBattleActive()) {
            // Sistema seguro - usar API de troca
            console.log('🔐 Executando troca no sistema seguro:', fromCharacterIndex, '→', toCharacterIndex);
            
            return this.secureBattleClient.executeSecureSwap(fromCharacterIndex, toCharacterIndex)
                .then(result => {
                    if (result.success) {
                        // Usar dados do personagem ativo retornado pela API
                        const newActiveChar = result.newActiveCharacter;
                        const charName = newActiveChar?.name || `Personagem ${toCharacterIndex + 1}`;
                        this.addBattleLogEntry('swap', `🔄 Novo personagem ativo: ${charName}! (Trocas restantes: ${result.swapsRemaining})`);
                        
                        // IMPORTANTE: Atualizar índices IMEDIATAMENTE após a troca bem-sucedida
                        console.log('🔄 Atualizando índices locais imediatamente após a troca');
                        const battleState = this.secureBattleClient.battleState;
                        if (battleState && battleState.playerTeam) {
                            // Atualizar índice ativo local para corresponder ao servidor
                            this.playerTeam.active = battleState.playerTeam.activeIndex;
                            this.playerTeam.reserve = [0, 1, 2].filter(i => i !== battleState.playerTeam.activeIndex);
                            console.log('✅ Índice ativo local atualizado para:', this.playerTeam.active);
                        }
                        
                        // Atualizar dados locais das equipes e interface
                        this.updateLocalTeamData();
                        
                        return { success: true, result };
                    } else {
                        this.addBattleLogEntry('error', `🚫 Falha na troca: ${result.error}`);
                        return { success: false };
                    }
                })
                .catch(error => {
                    console.error('Erro na troca segura:', error);
                    this.addBattleLogEntry('error', `🚫 Erro na troca: ${error.message}`);
                    return { success: false };
                });
        } else if (this.battleMechanics) {
            // Sistema legacy
            try {
                const result = this.battleMechanics.executeSwap(fromCharacterIndex, toCharacterIndex);
                
                if (result.success && this.battleMechanics.battleState.mode === '3v3') {
                    // Atualizar interface 3v3
                    this.handleSwapResult3v3(result);
                }
                
                this.addBattleLogEntry('swap', `🔄 ${result.fromCharacter.name || 'Personagem'} sai, ${result.toCharacter.name || 'Personagem'} entra! (${result.swapsUsed}/${result.swapsUsed + result.swapsRemaining})`);
                return Promise.resolve({ success: true });
            } catch (error) {
                this.addBattleLogEntry('error', `🚫 ${error.message}`);
                return Promise.resolve({ success: false });
            }
        } else {
            this.addBattleLogEntry('error', 'Sistema de turnos não inicializado');
            return Promise.resolve({ success: false });
        }
    }

    updateLocalTeamData() {
        // Sincronizar dados locais com estado do servidor seguro
        if (this.secureBattleClient && this.secureBattleClient.isBattleActive()) {
            const battleState = this.secureBattleClient.battleState;
            if (battleState) {
                console.log('🔄 Atualizando dados locais do sistema seguro');
                console.log('📊 Estado antes da sincronização - playerTeam.active:', this.playerTeam.active);
                console.log('📊 Estado do servidor - activeIndex:', battleState.playerTeam.activeIndex);
                
                // IMPORTANTE: Sincronizar índices ativos com o estado do servidor
                if (battleState.playerTeam) {
                    this.playerTeam.active = battleState.playerTeam.activeIndex;
                    this.playerTeam.reserve = [0, 1, 2].filter(i => i !== battleState.playerTeam.activeIndex);
                    console.log('✅ playerTeam.active atualizado para:', this.playerTeam.active);
                }
                
                if (battleState.enemyTeam) {
                    this.enemyTeam.active = battleState.enemyTeam.activeIndex;
                    this.enemyTeam.reserve = [0, 1, 2].filter(i => i !== battleState.enemyTeam.activeIndex);
                    console.log('✅ enemyTeam.active atualizado para:', this.enemyTeam.active);
                }
                
                // Agora atualizar a interface com os índices corretos
                this.update3v3BattleField();
            }
        }
    }

    async updateSecureTeamDisplay() {
        // Atualizar display baseado no estado do cliente seguro
        if (this.secureBattleClient && this.secureBattleClient.isBattleActive()) {
            const battleState = this.secureBattleClient.battleState;
            const playerChar = this.secureBattleClient.getActiveCharacter('player');
            const enemyChar = this.secureBattleClient.getActiveCharacter('enemy');
            
            if (playerChar && battleState) {
                console.log('🔐 Personagem ativo atualizado:', playerChar.name || playerChar.id);
                
                // Garantir que o cache está inicializado
                if (!this.battleCharactersCache.initialized) {
                    await this.initializeBattleCharactersCache();
                } else {
                    // Atualizar dados do cache com estado atual da batalha
                    this.updateCacheWithCurrentBattleState(battleState);
                }
                
                // Buscar dados do personagem ativo do cache
                const activeIndex = battleState.playerTeam.activeIndex;
                const fullPlayerData = this.getCharacterFromCache('player', activeIndex);
                
                if (fullPlayerData) {
                    // Atualizar dados do jogador com dados do cache
                    this.playerData.name = fullPlayerData.name;
                    this.playerData.hp = fullPlayerData.currentHP;
                    this.playerData.maxHP = fullPlayerData.maxHP;
                    this.playerData.mp = fullPlayerData.currentMP || 0;
                    this.playerData.maxMP = fullPlayerData.maxMP || 100;
                    this.playerData.level = fullPlayerData.level || 1;
                    this.playerData.cultura = fullPlayerData.cultura;
                    this.playerData.classe = fullPlayerData.classe;
                    
                    // Atualizar também o personagem ativo na interface
                    if (this.activePlayerCharacter) {
                        this.activePlayerCharacter.name = fullPlayerData.name;
                        this.activePlayerCharacter.currentHP = fullPlayerData.currentHP;
                        this.activePlayerCharacter.maxHP = fullPlayerData.maxHP;
                        this.activePlayerCharacter.currentMP = fullPlayerData.currentMP || 0;
                        this.activePlayerCharacter.maxMP = fullPlayerData.maxMP || 100;
                        this.activePlayerCharacter.level = fullPlayerData.level || 1;
                        this.activePlayerCharacter.sprite = fullPlayerData.sprite;
                    }
                    
                    console.log('✅ Dados do personagem ativo atualizados do cache:', fullPlayerData.name);
                } else {
                    console.warn('⚠️ Personagem ativo não encontrado no cache:', activeIndex);
                }
                
                // Atualizar todos os slots com dados do cache
                await this.updateAllCharacterSlotsFromCache();
            }
            
            // Atualizar displays visuais
            this.updateSecure3v3BattleField();
            this.updatePlayerCard(); // Atualizar card principal
            this.updateActiveBattleCharacter(); // Atualizar personagem ativo da batalha
        }
    }

    updateCacheWithCurrentBattleState(battleState) {
        // Atualizar o cache com dados atuais de HP/Ânima do estado da batalha
        if (this.battleCharactersCache.initialized) {
            // Atualizar equipe do jogador
            battleState.playerTeam.characters.forEach((char, index) => {
                if (this.battleCharactersCache.playerTeam[index]) {
                    this.battleCharactersCache.playerTeam[index].currentHP = char.currentHP;
                    this.battleCharactersCache.playerTeam[index].maxHP = char.maxHP;
                    this.battleCharactersCache.playerTeam[index].currentMP = char.currentMP;
                    this.battleCharactersCache.playerTeam[index].maxMP = char.maxMP;
                }
            });
            
            // Atualizar equipe inimiga
            battleState.enemyTeam.characters.forEach((char, index) => {
                if (this.battleCharactersCache.enemyTeam[index]) {
                    this.battleCharactersCache.enemyTeam[index].currentHP = char.currentHP;
                    this.battleCharactersCache.enemyTeam[index].maxHP = char.maxHP;
                    this.battleCharactersCache.enemyTeam[index].currentMP = char.currentMP;
                    this.battleCharactersCache.enemyTeam[index].maxMP = char.maxMP;
                }
            });
            
            console.log('🔄 Cache atualizado com estado atual da batalha');
        }
    }

    async syncSecureTeamData(battleState) {
        // Carregar dados completos dos personagens do backend
        if (!this.charactersData) {
            await this.loadCharactersData();
        }

        // Sincronizar dados das equipes locais com o estado do sistema seguro
        if (battleState.playerTeam) {
            this.playerTeam.active = battleState.playerTeam.activeIndex;
            this.playerTeam.characters = battleState.playerTeam.characters.map(char => {
                // Buscar dados completos do personagem no backend
                const fullCharData = this.charactersData[char.id];
                
                if (fullCharData) {
                    return {
                        ...char,
                        name: fullCharData.name,
                        level: fullCharData.level || 1,
                        hp: char.currentHP,
                        maxHP: char.maxHP,
                        mp: char.currentMP || 0,
                        maxMP: char.maxMP || 100,
                        sprite: fullCharData.sprite || `/assets/sprites/${fullCharData.name.toLowerCase().replace(/\s+/g, '_')}.webp`,
                        cultura: fullCharData.cultura,
                        classe: fullCharData.classe,
                        description: fullCharData.description
                    };
                } else {
                    console.warn('⚠️ Dados do personagem não encontrados:', char.id);
                    return {
                        ...char,
                        name: char.name || `Personagem ${char.id}`,
                        level: 1,
                        hp: char.currentHP,
                        maxHP: char.maxHP,
                        mp: char.currentMP || 0,
                        maxMP: char.maxMP || 100,
                        sprite: `/assets/sprites/character.webp` // sprite padrão
                    };
                }
            });
            this.playerTeam.reserve = [0, 1, 2].filter(i => i !== battleState.playerTeam.activeIndex);
        }
        
        if (battleState.enemyTeam) {
            this.enemyTeam.active = battleState.enemyTeam.activeIndex;
            this.enemyTeam.characters = battleState.enemyTeam.characters.map(char => {
                const fullCharData = this.charactersData[char.id];
                
                if (fullCharData) {
                    return {
                        ...char,
                        name: fullCharData.name,
                        level: fullCharData.level || 1,
                        hp: char.currentHP,
                        maxHP: char.maxHP,
                        mp: char.currentMP || 0,
                        maxMP: char.maxMP || 100,
                        sprite: fullCharData.sprite || `/assets/sprites/${fullCharData.name.toLowerCase().replace(/\s+/g, '_')}.webp`,
                        cultura: fullCharData.cultura,
                        classe: fullCharData.classe,
                        description: fullCharData.description
                    };
                } else {
                    return {
                        ...char,
                        name: char.name || `Inimigo ${char.id}`,
                        level: 1,
                        hp: char.currentHP,
                        maxHP: char.maxHP,
                        mp: char.currentMP || 0,
                        maxMP: char.maxMP || 100,
                        sprite: `/assets/sprites/character.webp`
                    };
                }
            });
            this.enemyTeam.reserve = [0, 1, 2].filter(i => i !== battleState.enemyTeam.activeIndex);
        }
        
        console.log('🔄 Dados locais sincronizados com backend:', {
            playerActive: this.playerTeam.active,
            enemyActive: this.enemyTeam.active,
            playerChars: this.playerTeam.characters.map(c => c.name),
            enemyChars: this.enemyTeam.characters.map(c => c.name)
        });
    }

    async loadCharactersData() {
        try {
            console.log('📋 Carregando dados de personagens do backend...');
            const response = await fetch('/api/characters');
            const data = await response.json();
            this.charactersData = data.characters;
            console.log('✅ Dados de personagens carregados:', Object.keys(this.charactersData).length, 'personagens');
        } catch (error) {
            console.error('❌ Erro ao carregar dados dos personagens:', error);
            this.charactersData = {};
        }
    }

    async initializeBattleCharactersCache() {
        console.log('🗂️ [CACHE-INIT] Iniciando inicialização do cache...');
        console.log('🗂️ [CACHE-INIT] SecureBattleClient ativo:', !!this.secureBattleClient?.isBattleActive());
        console.log('🗂️ [CACHE-INIT] CharactersData carregado:', !!this.charactersData && Object.keys(this.charactersData).length);
        
        // Garantir que temos os dados do backend
        if (!this.charactersData) {
            console.log('📋 [CACHE-INIT] Carregando dados do backend...');
            await this.loadCharactersData();
        }
        
        // Se estamos usando sistema seguro, inicializar com dados do estado da batalha
        if (this.secureBattleClient && this.secureBattleClient.isBattleActive()) {
            const battleState = this.secureBattleClient.battleState;
            console.log('⚔️ [CACHE-INIT] BattleState obtido:', !!battleState);
            
            if (battleState && battleState.playerTeam && battleState.playerTeam.characters) {
                console.log('👥 [CACHE-INIT] Characters encontrados no player team:', battleState.playerTeam.characters.length);
                console.log('👥 [CACHE-INIT] IDs dos personagens:', battleState.playerTeam.characters.map(c => c.id));
                
                // Cache para equipe do jogador
                this.battleCharactersCache.playerTeam = battleState.playerTeam.characters.map((char, index) => {
                    const fullData = this.charactersData[char.id];
                    console.log(`📋 [CACHE-INIT] Player ${index} (${char.id}):`, fullData ? fullData.name : 'DADOS NÃO ENCONTRADOS');
                    
                    const cachedChar = {
                        ...char,
                        name: fullData?.name || `Personagem ${char.id}`,
                        level: fullData?.level || 1,
                        sprite: fullData?.sprite || 'assets/sprites/character.webp',
                        cultura: fullData?.cultura || 'Desconhecida',
                        classe: fullData?.classe || 'Guerreiro',
                        description: fullData?.description || 'Personagem misterioso'
                    };
                    
                    console.log(`✅ [CACHE-INIT] Cache player ${index}:`, cachedChar.name, cachedChar.sprite);
                    return cachedChar;
                });
                
                // Cache para equipe inimiga
                this.battleCharactersCache.enemyTeam = battleState.enemyTeam.characters.map((char, index) => {
                    const fullData = this.charactersData[char.id];
                    console.log(`📋 [CACHE-INIT] Enemy ${index} (${char.id}):`, fullData ? fullData.name : 'DADOS NÃO ENCONTRADOS');
                    
                    return {
                        ...char,
                        name: fullData?.name || `Inimigo ${char.id}`,
                        level: fullData?.level || 1,
                        sprite: fullData?.sprite || 'assets/sprites/character.webp',
                        cultura: fullData?.cultura || 'Desconhecida',
                        classe: fullData?.classe || 'Guerreiro',
                        description: fullData?.description || 'Inimigo misterioso'
                    };
                });
                
                this.battleCharactersCache.initialized = true;
                
                console.log('✅ [CACHE-INIT] Cache inicializado com sucesso!');
                console.log('👥 [CACHE-INIT] Player team:', this.battleCharactersCache.playerTeam.map(c => `${c.name} (${c.sprite})`));
                console.log('👹 [CACHE-INIT] Enemy team:', this.battleCharactersCache.enemyTeam.map(c => `${c.name} (${c.sprite})`));
                
                // Atualizar interface imediatamente
                console.log('🔄 [CACHE-INIT] Atualizando interface...');
                await this.updateAllCharacterSlotsFromCache();
                
            } else {
                console.error('❌ [CACHE-INIT] BattleState inválido ou sem personagens!');
                console.log('❌ [CACHE-INIT] BattleState atual:', battleState);
            }
        } else {
            console.warn('⚠️ [CACHE-INIT] Sistema seguro não disponível para inicializar cache');
            console.log('⚠️ [CACHE-INIT] SecureBattleClient:', !!this.secureBattleClient);
            console.log('⚠️ [CACHE-INIT] isBattleActive:', this.secureBattleClient?.isBattleActive());
        }
    }

    async updateAllCharacterSlotsFromCache() {
        if (!this.battleCharactersCache.initialized) {
            console.warn('⚠️ Cache não inicializado, inicializando agora...');
            await this.initializeBattleCharactersCache();
            return;
        }
        
        console.log('🔄 Atualizando todos os slots com dados do cache...');
        
        // Atualizar slots dos personagens do jogador
        for (let i = 0; i < 3; i++) {
            const character = this.battleCharactersCache.playerTeam[i];
            if (character) {
                this.updateSecureCharacterStats(i, character);
                console.log(`✅ Slot ${i} atualizado:`, character.name);
            }
        }
        
        // Atualizar classes de active/reserve
        const battleState = this.secureBattleClient?.battleState;
        if (battleState) {
            const activeIndex = battleState.playerTeam.activeIndex;
            
            for (let i = 0; i < 3; i++) {
                const slot = document.getElementById(`player-slot-${i}`);
                if (slot) {
                    slot.classList.remove('active', 'reserve', 'fainted');
                    
                    if (i === activeIndex) {
                        slot.classList.add('active');
                    } else {
                        slot.classList.add('reserve');
                    }
                    
                    // Atualizar indicadores
                    const activeIndicator = slot.querySelector('.active-indicator');
                    const reserveIndicator = slot.querySelector('.reserve-indicator');
                    if (activeIndicator) activeIndicator.style.display = i === activeIndex ? 'block' : 'none';
                    if (reserveIndicator) reserveIndicator.style.display = i !== activeIndex ? 'block' : 'none';
                }
            }
        }
        
        console.log('✅ Todos os slots atualizados com dados do cache');
    }

    getCharacterFromCache(team, index) {
        if (!this.battleCharactersCache.initialized) {
            console.warn('⚠️ Cache não inicializado');
            return null;
        }
        
        const teamCache = team === 'player' ? this.battleCharactersCache.playerTeam : this.battleCharactersCache.enemyTeam;
        return teamCache[index] || null;
    }

    updateSecure3v3BattleField() {
        // Versão específica para sistema seguro
        if (!this.secureBattleClient || !this.secureBattleClient.isBattleActive()) return;
        
        const battleState = this.secureBattleClient.battleState;
        if (!battleState) return;
        
        console.log('🔐 Atualizando interface 3v3 segura com estado do servidor');
        console.log('📊 Estado do servidor - playerTeam activeIndex:', battleState.playerTeam.activeIndex);
        console.log('📊 Estado do servidor - enemyTeam activeIndex:', battleState.enemyTeam.activeIndex);
        
        // Usar diretamente os índices do estado seguro (não os locais)
        const playerActiveIndex = battleState.playerTeam.activeIndex;
        const enemyActiveIndex = battleState.enemyTeam.activeIndex;
        
        // Atualizar personagens ativos no battle field usando índices do servidor
        this.updateActiveBattleSlot('player', this.playerTeam.characters[playerActiveIndex]);
        this.updateActiveBattleSlot('enemy', this.enemyTeam.characters[enemyActiveIndex]);
        
        // Criar arrays de reserva baseados no estado do servidor
        const playerReserveIndices = [0, 1, 2].filter(i => i !== playerActiveIndex);
        const enemyReserveIndices = [0, 1, 2].filter(i => i !== enemyActiveIndex);
        
        // Atualizar personagens na reserva
        this.updateReserveSlots('player', { 
            active: playerActiveIndex, 
            reserve: playerReserveIndices,
            characters: this.playerTeam.characters 
        });
        this.updateReserveSlots('enemy', { 
            active: enemyActiveIndex, 
            reserve: enemyReserveIndices,
            characters: this.enemyTeam.characters 
        });
        
        // Atualizar slots dos personagens (visual das trocas)
        this.updateSecureCharacterSlots();
        
        console.log('🔐 Interface 3v3 segura atualizada com índices do servidor');
    }

    updateSecureCharacterSlots() {
        // Versão específica para sistema seguro
        if (!this.secureBattleClient || !this.secureBattleClient.isBattleActive()) return;
        
        const battleState = this.secureBattleClient.battleState;
        const playerTeam = battleState.playerTeam;
        
        console.log('=== DEBUG updateSecureCharacterSlots ===');
        console.log('playerTeam:', playerTeam);
        console.log('activeIndex:', playerTeam.activeIndex);
        console.log('characters:', playerTeam.characters);
        
        // Atualizar slots visuais
        for (let i = 0; i < 3; i++) {
            const slot = document.getElementById(`player-slot-${i}`);
            const character = playerTeam.characters[i];
            
            console.log(`Slot ${i}:`, character);
            
            if (slot && character) {
                // Remover classes antigas
                slot.classList.remove('active', 'reserve', 'fainted');
                
                // Adicionar classe baseada no status
                if (character.currentHP <= 0) {
                    slot.classList.add('fainted');
                } else if (i === playerTeam.activeIndex) {
                    slot.classList.add('active');
                } else {
                    slot.classList.add('reserve');
                }

                // Atualizar indicadores
                const activeIndicator = slot.querySelector('.active-indicator');
                const reserveIndicator = slot.querySelector('.reserve-indicator');
                const swapHint = slot.querySelector('.swap-hint');

                if (activeIndicator) activeIndicator.style.display = i === playerTeam.activeIndex ? 'block' : 'none';
                if (reserveIndicator) reserveIndicator.style.display = i !== playerTeam.activeIndex && character.currentHP > 0 ? 'block' : 'none';
                if (swapHint) swapHint.style.display = i !== playerTeam.activeIndex && character.currentHP > 0 ? 'block' : 'none';

                // Atualizar HP/Ânima
                this.updateSecureCharacterStats(i, character);
                
                console.log(`🔄 Slot ${i} atualizado - Ativo: ${i === playerTeam.activeIndex}`);
            }
        }
    }

    updateSecureCharacterStats(index, character) {
        console.log(`=== updateSecureCharacterStats slot ${index} ===`);
        console.log('Character data recebido:', character);
        
        // PRIORIDADE 1: Usar dados do cache se disponível
        let finalCharacter = character;
        if (this.battleCharactersCache && this.battleCharactersCache.initialized && this.battleCharactersCache.playerTeam[index]) {
            finalCharacter = this.battleCharactersCache.playerTeam[index];
            console.log(`📋 Usando dados do cache para slot ${index}:`, finalCharacter.name);
        } else {
            console.log(`⚠️ Cache não disponível, usando dados recebidos para slot ${index}`);
        }
        
        // Atualizar nome
        const nameEl = document.getElementById(`playerName${index}`);
        if (nameEl) {
            const characterName = finalCharacter.name || `Personagem ${index + 1}`;
            nameEl.textContent = characterName;
            console.log(`✅ Nome atualizado para slot ${index}:`, characterName);
        } else {
            console.warn(`❌ Elemento playerName${index} não encontrado!`);
        }
        
        // Atualizar nível
        const levelEl = document.getElementById(`playerLevel${index}`);
        if (levelEl) {
            const level = finalCharacter.level || 1;
            levelEl.textContent = level;
            console.log(`✅ Nível atualizado para slot ${index}:`, level);
        } else {
            console.warn(`❌ Elemento playerLevel${index} não encontrado!`);
        }
        
        // Atualizar imagem (priorizar sprite do cache)
        const imgEl = document.getElementById(`playerImage${index}`);
        if (imgEl) {
            let spritePath;
            
            // PRIORIDADE 1: Usar sprite do cache/backend
            if (finalCharacter.sprite) {
                if (finalCharacter.sprite.startsWith('assets/')) {
                    spritePath = `/${finalCharacter.sprite}`;
                } else if (finalCharacter.sprite.startsWith('/assets/')) {
                    spritePath = finalCharacter.sprite;
                } else {
                    spritePath = `/assets/sprites/${finalCharacter.sprite}`;
                }
            } else if (finalCharacter.name && finalCharacter.name !== `Personagem ${index + 1}`) {
                // PRIORIDADE 2: Gerar path baseado no nome real
                spritePath = `/assets/sprites/${finalCharacter.name.toLowerCase().replace(/\s+/g, '_')}.webp`;
            } else {
                // PRIORIDADE 3: Fallback para sprite padrão
                spritePath = '/assets/sprites/character.webp';
            }
            
            imgEl.src = spritePath;
            imgEl.alt = finalCharacter.name || `Personagem ${index + 1}`;
            
            // Adicionar tratamento de erro da imagem
            imgEl.onerror = () => {
                console.warn(`⚠️ Sprite não encontrada: ${spritePath}, tentando fallback`);
                if (spritePath !== '/assets/sprites/character.webp') {
                    imgEl.src = '/assets/sprites/character.webp';
                    console.log(`🔄 Usando sprite fallback para ${finalCharacter.name}`);
                }
            };
            
            console.log(`✅ Sprite atualizada para slot ${index} (${finalCharacter.name}):`, spritePath);
        } else {
            console.warn(`❌ Elemento playerImage${index} não encontrado!`);
        }
        
        // Atualizar HP (usar dados atuais de batalha, não cache estático)
        const hpEl = document.getElementById(`playerHP${index}`);
        const maxHpEl = document.getElementById(`playerMaxHP${index}`);
        const currentHP = character.currentHP || character.hp || finalCharacter.currentHP || 100;
        const maxHP = character.maxHP || character.hp || finalCharacter.maxHP || 100;
        
        if (hpEl) hpEl.textContent = currentHP;
        if (maxHpEl) maxHpEl.textContent = maxHP;
        
        // Atualizar Ânima (usar dados atuais de batalha, não cache estático)
        const animaEl = document.getElementById(`playerAnima${index}`);
        const maxAnimaEl = document.getElementById(`playerMaxAnima${index}`);
        const currentAnima = character.currentAnima || character.anima || finalCharacter.currentAnima || 0;
        const maxAnima = character.maxAnima || character.anima || finalCharacter.maxAnima || 100;
        
        if (animaEl) animaEl.textContent = currentAnima;
        if (maxAnimaEl) maxAnimaEl.textContent = maxAnima;
        
        // Atualizar barras de HP e Ânima
        const hpBar = document.getElementById(`playerHPBar${index}`);
        const animaBar = document.getElementById(`playerAnimaBar${index}`);
        
        if (hpBar) {
            const hpPercent = Math.max(0, (currentHP / maxHP) * 100);
            hpBar.style.width = `${hpPercent}%`;
            console.log(`✅ HP Bar atualizada para slot ${index}:`, `${currentHP}/${maxHP} (${hpPercent.toFixed(1)}%)`);
        }
        
        if (animaBar) {
            const animaPercent = Math.max(0, (currentAnima / maxAnima) * 100);
            animaBar.style.width = `${animaPercent}%`;
            console.log(`✅ Ânima Bar atualizada para slot ${index}:`, `${currentAnima}/${maxAnima} (${animaPercent.toFixed(1)}%)`);
        }
        
        console.log(`✅ Stats FINAIS atualizados para slot ${index}: ${finalCharacter.name} [Cache: ${this.battleCharactersCache?.initialized ? 'SIM' : 'NÃO'}]`);
    }

    handleSwapResult3v3(swapResult) {
        const { team, newActiveIndex } = swapResult;
        
        if (team === 'player') {
            // Atualizar índice ativo da equipe
            this.playerTeam.active = newActiveIndex;
            this.playerTeam.reserve = [0, 1, 2].filter(i => i !== newActiveIndex);
            
            // Atualizar personagem ativo no BattleMechanics para compatibilidade
            this.battleMechanics.battleState.player = {
                ...this.battleMechanics.battleState.teams.player.characters[newActiveIndex],
                swapsUsed: this.battleMechanics.battleState.player.swapsUsed
            };
            
            // Atualizar interface visual
            this.update3v3BattleField();
            this.updateCharacterStatusVisuals();
            
        } else if (team === 'enemy') {
            // Atualizar equipe inimiga
            this.enemyTeam.active = newActiveIndex;
            this.enemyTeam.reserve = [0, 1, 2].filter(i => i !== newActiveIndex);
            
            this.battleMechanics.battleState.enemy = {
                ...this.battleMechanics.battleState.teams.enemy.characters[newActiveIndex],
                swapsUsed: this.battleMechanics.battleState.enemy.swapsUsed
            };
            
            this.update3v3BattleField();
        }
    }

    // Método para permitir troca via clique nos personagens da reserva
    enableSwapMode() {
        if (!this.battleMechanics || this.battleMechanics.battleState.turnPhase !== 'action_select') {
            return;
        }
        
        // Destacar personagens da reserva como clicáveis
        this.playerTeam.reserve.forEach(index => {
            const slotId = `player-reserve-${index}`;
            const slot = document.getElementById(slotId);
            if (slot && this.playerTeam.characters[index].hp > 0) {
                slot.classList.add('swap-available');
                slot.style.cursor = 'pointer';
                
                // Adicionar listener de clique
                slot.onclick = () => {
                    this.executeSwap(this.playerTeam.active, index);
                    this.disableSwapMode();
                };
            }
        });
        
        this.addBattleLogEntry('system', '👆 Clique em um personagem da reserva para trocar');
    }
    
    disableSwapMode() {
        // Remover highligh e listeners
        [0, 1, 2].forEach(index => {
            const slot = document.getElementById(`player-reserve-${index}`);
            if (slot) {
                slot.classList.remove('swap-available');
                slot.style.cursor = 'default';
                slot.onclick = null;
            }
        });
    }

    updateCharacterStatusVisuals() {
        // Atualizar indicadores visuais de ativo/reserva
        [0, 1, 2].forEach(index => {
            const char = this.playerTeam.characters[index];
            const isActive = this.playerTeam.active === index;
            
            // Atualizar classe CSS
            const slot = document.getElementById(`player-slot-${index}`);
            if (slot) {
                slot.classList.toggle('active', isActive);
                slot.classList.toggle('reserve', !isActive);
            }
        });
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

    /**
     * Interface de Troca de Personagens
     */
    showSwapOptions(characterIndex) {
        console.log('showSwapOptions chamado com characterIndex:', characterIndex);
        console.log('battleState atual:', this.battleState);
        console.log('battleMechanics existe:', !!this.battleMechanics);
        
        // Verificar se estamos em batalha 3v3 ou se temos equipes selecionadas
        if (!this.battleMechanics && (!this.playerTeam || !this.enemyTeam)) {
            console.warn('Selecione sua equipe primeiro para ativar o sistema de trocas');
            this.showMessage('Selecione sua equipe primeiro para ativar o sistema de trocas');
            return;
        }
        
        if (this.battleState !== '3v3-battle' && (!this.playerTeam || this.playerTeam.characters.length !== 3)) {
            console.warn('Sistema de troca disponível após seleção completa da equipe 3v3');
            this.showMessage('Sistema de troca disponível após seleção completa da equipe 3v3');
            return;
        }

        // Verificar sistema de batalha (seguro ou legacy)
        let playerTeam, character;
        
        if (this.secureBattleClient && this.secureBattleClient.isBattleActive()) {
            // Sistema seguro - usar dados locais das equipes
            playerTeam = this.playerTeam;
            character = playerTeam.characters[characterIndex];
        } else if (this.battleMechanics && this.battleMechanics.battleState && this.battleMechanics.battleState.teams) {
            // Sistema legacy
            playerTeam = this.battleMechanics.battleState.teams.player;
            character = playerTeam.characters[characterIndex];
        } else {
            console.error('Nenhum sistema de batalha ativo');
            this.showMessage('Sistema de batalha não inicializado');
            return;
        }

        // Verificar se o personagem está vivo
        if (character.hp <= 0) {
            const characterNameFainted = character.name || character.id || 'Personagem Desconhecido';
            console.error(`${characterNameFainted} está desmaiado e não pode entrar em batalha`);
            this.showMessage(`${characterNameFainted} está desmaiado e não pode entrar em batalha`);
            return;
        }

        // Verificar se já é o personagem ativo
        if (characterIndex === playerTeam.activeIndex) {
            console.info(`${character.name} já está ativo`);
            const characterNameActive = character.name || character.id || 'Personagem Desconhecido';
            this.showMessage(`${characterNameActive} já está ativo`);
            return;
        }

        // Verificar limite de trocas (compatível com sistema seguro e legacy)
        let mechanicsSwapsUsed = 0;
        let maxSwapsPerTurn = 2; // Default
        
        if (this.secureBattleClient && this.secureBattleClient.isBattleActive()) {
            // Sistema seguro - usar dados do secure client
            const battleStats = this.secureBattleClient.getBattleStats();
            mechanicsSwapsUsed = battleStats ? (battleStats.playerTeam?.maxSwaps - battleStats.playerSwapsRemaining || 0) : 0;
            console.log('Sistema seguro - trocas usadas:', mechanicsSwapsUsed);
        } else if (this.battleMechanics && this.battleMechanics.battleState) {
            // Sistema legacy
            console.log('battleMechanics.battleState:', this.battleMechanics.battleState);
            console.log('battleState.player existe:', !!this.battleMechanics.battleState.player);
            mechanicsSwapsUsed = this.battleMechanics.battleState.player?.swapsUsed || 0;
            maxSwapsPerTurn = this.battleMechanics.COMBAT_CONSTANTS?.MAX_SWAPS_PER_TURN || 2;
        }
        
        const localSwapsUsed = this.swapsUsedThisTurn || 0;
        const swapsUsed = Math.max(mechanicsSwapsUsed, localSwapsUsed); // Usar o maior dos dois
        
        console.log('swapsUsed (sistema):', mechanicsSwapsUsed);
        console.log('swapsUsed (contador local):', localSwapsUsed);
        console.log('swapsUsed (máximo):', swapsUsed);
        console.log('MAX_SWAPS_PER_TURN:', maxSwapsPerTurn);
        
        // Verificar debounce (evitar cliques muito rápidos)
        const now = Date.now();
        if (now - this.lastSwapTime < 1000) { // Mínimo 1 segundo entre trocas
            console.warn('Aguarde 1 segundo entre trocas');
            this.showMessage('Aguarde um momento antes da próxima troca');
            return;
        }
        
        if (swapsUsed >= maxSwapsPerTurn) {
            console.warn('Limite de trocas por turno atingido');
            this.showMessage(`Limite de trocas por turno atingido! (${swapsUsed}/${maxSwapsPerTurn})`);
            return;
        }
        
        console.log('Troca permitida. Trocas usadas:', swapsUsed, '/ Limite:', maxSwapsPerTurn);

        // Executar troca diretamente (sem confirmação) - compatível com sistema seguro
        let activeCharacter;
        let activeIndex = 0; // Default
        
        if (this.secureBattleClient && this.secureBattleClient.isBattleActive()) {
            // Sistema seguro - obter personagem ativo via API
            activeCharacter = this.secureBattleClient.getActiveCharacter('player');
        } else if (playerTeam && playerTeam.activeIndex !== undefined) {
            // Sistema legacy - usar índice ativo
            activeCharacter = playerTeam.characters[playerTeam.activeIndex];
            activeIndex = playerTeam.activeIndex;
        }
        
        if (activeCharacter && character) {
            console.log(`Executando troca: ${activeCharacter.name} (Ativo) → ${character.name} (Reserva)`);
            console.log(`Trocas restantes: ${maxSwapsPerTurn - swapsUsed - 1}`);
            
            // Incrementar contador local antes da troca
            this.swapsUsedThisTurn++;
            this.lastSwapTime = Date.now();
            console.log('Contador local incrementado para:', this.swapsUsedThisTurn);
            console.log('Timestamp da troca atualizado:', this.lastSwapTime);
            
            this.executePlayerSwap(activeIndex, characterIndex);
        } else {
            console.error('❌ Erro: Personagens não encontrados para troca');
            this.addBattleLogEntry('error', 'Erro ao executar troca - personagens não encontrados');
        }
    }

    async executePlayerSwap(fromIndex, toIndex) {
        try {
            const result = await this.executeSwap(fromIndex, toIndex);
            
            if (result.success) {
                // Obter nomes dos personagens para a mensagem
                let swappedOutName = 'Personagem anterior';
                let swappedInName = 'Novo personagem';
                
                // Sincronizar playerData com o novo personagem ativo (compatível com sistema seguro)
                if (this.secureBattleClient && this.secureBattleClient.isBattleActive()) {
                    console.log('🔐 Troca executada com sucesso no sistema seguro');
                    // Sistema seguro - obter nomes através do cliente seguro
                    const battleState = this.secureBattleClient.battleState;
                    if (battleState && battleState.playerTeam) {
                        const oldChar = battleState.playerTeam.characters[fromIndex];
                        const newChar = battleState.playerTeam.characters[toIndex];
                        swappedOutName = oldChar?.name || `Personagem ${fromIndex + 1}`;
                        swappedInName = newChar?.name || `Personagem ${toIndex + 1}`;
                    }
                    await this.updateSecureTeamDisplay();
                } else {
                    // Sistema legacy
                    swappedOutName = result.swappedOut || `Personagem ${fromIndex + 1}`;
                    swappedInName = result.swappedIn || `Personagem ${toIndex + 1}`;
                    await this.syncPlayerDataWithActiveCharacter();
                }
                
                // Atualizar displays visuais
                this.updateCharacterSlots();
                this.updatePlayerCard(); // Atualizar card principal
                this.updateActiveBattleCharacter(); // Atualizar personagem ativo da batalha
                this.addBattleLogEntry('swap', 
                    `🔄 ${swappedOutName} sai, ${swappedInName} entra em campo!`
                );
                
                // Feedback visual
                this.highlightActiveCharacter();
                
                console.log('Troca executada com sucesso:', result);
            }
        } catch (error) {
            this.addBattleLogEntry('error', `Erro na troca: ${error.message}`);
            console.error('Erro na troca:', error);
        }
    }

    async syncPlayerDataWithActiveCharacter() {
        if (!this.battleMechanics || !this.battleMechanics.battleState.teams) return;
        
        const playerTeam = this.battleMechanics.battleState.teams.player;
        const activeCharacter = playerTeam.characters[playerTeam.activeIndex];
        
        console.log('=== DEBUG syncPlayerDataWithActiveCharacter DETALHADO ===');
        console.log('playerTeam completo:', playerTeam);
        console.log('activeIndex:', playerTeam.activeIndex);
        console.log('characters array:', playerTeam.characters);
        console.log('activeCharacter completo:', activeCharacter);
        console.log('Propriedades do activeCharacter:');
        if (activeCharacter) {
            Object.keys(activeCharacter).forEach(key => {
                console.log(`  ${key}:`, activeCharacter[key]);
            });
        }
        
        if (activeCharacter) {
            console.log('Antigo playerData antes da sync:', JSON.stringify(this.playerData, null, 2));
            
            // Sincronizar dados principais - usar as propriedades exatas que existem
            this.playerData.name = activeCharacter.name || 'Player 1';
            this.playerData.level = activeCharacter.level || this.playerData.level || 1;
            this.playerData.hp = activeCharacter.hp || activeCharacter.currentHP || 100;
            this.playerData.maxHP = activeCharacter.maxHP || activeCharacter.maxHp || activeCharacter.hp || 100;
            this.playerData.mp = activeCharacter.mp || activeCharacter.anima || 50;
            this.playerData.maxMP = activeCharacter.maxMP || activeCharacter.maxMp || activeCharacter.maxAnima || 50;
            
            // Para imagem, usar múltiplas fontes possíveis
            const possibleImages = [
                activeCharacter.image,
                activeCharacter.sprite,  
                activeCharacter.avatar,
                this.generateCharacterImage(activeCharacter.name)
            ];
            this.playerData.image = possibleImages.find(img => img) || this.playerData.image;
            
            // Sincronizar estatísticas se disponíveis
            if (activeCharacter.stats) {
                this.playerData.attack = activeCharacter.stats.attack || this.playerData.attack;
                this.playerData.defense = activeCharacter.stats.defense || this.playerData.defense;
                this.playerData.magic = activeCharacter.stats.magic || this.playerData.magic;
                this.playerData.speed = activeCharacter.stats.speed || this.playerData.speed;
            } else if (activeCharacter.attack !== undefined) {
                // Estatísticas diretas no personagem
                this.playerData.attack = activeCharacter.attack || this.playerData.attack;
                this.playerData.defense = activeCharacter.defense || this.playerData.defense;
                this.playerData.magic = activeCharacter.magic || this.playerData.magic;
                this.playerData.speed = activeCharacter.speed || this.playerData.speed;
            }
            
            console.log('Novo playerData após sync:', JSON.stringify(this.playerData, null, 2));
            
            // Carregar skills do personagem ativo
            this.playerData.skills = []; // Limpar skills antigas
            await this.loadPlayerSkills();
            await this.populateSkills(); // Atualizar interface de skills
            
        } else {
            console.error('activeCharacter é null/undefined!');
        }
    }

    updateCharacterSlots() {
        if (!this.battleMechanics || !this.battleMechanics.battleState.teams) return;

        const playerTeam = this.battleMechanics.battleState.teams.player;
        
        console.log('=== DEBUG updateCharacterSlots ===');
        console.log('playerTeam:', playerTeam);
        console.log('activeIndex:', playerTeam.activeIndex);
        console.log('characters:', playerTeam.characters);
        
        // Atualizar slots visuais
        for (let i = 0; i < 3; i++) {
            const slot = document.getElementById(`player-slot-${i}`);
            const character = playerTeam.characters[i];
            
            console.log(`Slot ${i}:`, character);
            
            if (slot && character) {
                // Remover classes antigas
                slot.classList.remove('active', 'reserve', 'fainted');
                
                // Adicionar classe baseada no status
                if (character.hp <= 0) {
                    slot.classList.add('fainted');
                } else if (i === playerTeam.activeIndex) {
                    slot.classList.add('active');
                } else {
                    slot.classList.add('reserve');
                }

                // Atualizar indicadores
                const activeIndicator = slot.querySelector('.active-indicator');
                const reserveIndicator = slot.querySelector('.reserve-indicator');
                const swapHint = slot.querySelector('.swap-hint');

                if (activeIndicator) activeIndicator.style.display = i === playerTeam.activeIndex ? 'block' : 'none';
                if (reserveIndicator) reserveIndicator.style.display = i !== playerTeam.activeIndex && character.hp > 0 ? 'block' : 'none';
                if (swapHint) swapHint.style.display = i !== playerTeam.activeIndex && character.hp > 0 ? 'block' : 'none';

                // Atualizar HP/Ânima
                this.updateCharacterStats(i, character);
            }
        }
    }

    updateCharacterStats(index, character) {
        console.log(`=== updateCharacterStats slot ${index} ===`);
        console.log('Character data:', character);
        
        // Atualizar nome e imagem do personagem
        const nameElement = document.getElementById(`playerName${index}`);
        const imageElement = document.getElementById(`playerImage${index}`);
        const levelElement = document.getElementById(`playerLevel${index}`);
        
        if (nameElement && character.name) {
            nameElement.textContent = character.name;
        }
        
        if (imageElement && character.image) {
            imageElement.src = character.image;
        } else if (imageElement && character.sprite) {
            imageElement.src = character.sprite;
        } else if (imageElement && character.name) {
            imageElement.src = this.generateCharacterImage(character.name);
        }
        
        if (levelElement && character.level) {
            levelElement.textContent = character.level;
        }
        
        const hpElement = document.getElementById(`playerHP${index}`);
        const maxHpElement = document.getElementById(`playerMaxHP${index}`);
        const mpElement = document.getElementById(`playerMP${index}`);
        const maxMpElement = document.getElementById(`playerMaxMP${index}`);
        const hpBar = document.getElementById(`playerHPBar${index}`);
        const mpBar = document.getElementById(`playerMPBar${index}`);

        if (hpElement) hpElement.textContent = character.hp;
        if (maxHpElement) maxHpElement.textContent = character.maxHp || character.hp;
        if (mpElement) mpElement.textContent = character.anima || character.mp || 50;
        if (maxMpElement) maxMpElement.textContent = character.maxAnima || character.maxMp || 50;

        // Atualizar barras
        if (hpBar) {
            const hpPercentage = (character.hp / (character.maxHp || character.hp)) * 100;
            hpBar.style.width = `${hpPercentage}%`;
        }

        if (mpBar) {
            const mp = character.anima || character.mp || 50;
            const maxMp = character.maxAnima || character.maxMp || 50;
            const mpPercentage = (mp / maxMp) * 100;
            mpBar.style.width = `${mpPercentage}%`;
        }
    }

    updateActiveBattleCharacter() {
        if (!this.battleMechanics || !this.battleMechanics.battleState.teams) return;
        
        const playerTeam = this.battleMechanics.battleState.teams.player;
        const activeCharacter = playerTeam.characters[playerTeam.activeIndex];
        
        if (activeCharacter) {
            console.log('=== updateActiveBattleCharacter ===');
            console.log('Atualizando personagem ativo da batalha:', activeCharacter.name);
            
            // Atualizar elementos do personagem ativo na batalha
            const activeName = document.getElementById('playerActiveBattleName');
            const activeImage = document.getElementById('playerActiveBattleImage');
            const activeLevel = document.getElementById('playerActiveBattleLevel');
            const activeHP = document.getElementById('playerActiveBattleHP');
            const activeMaxHP = document.getElementById('playerActiveBattleMaxHP');
            const activeMP = document.getElementById('playerActiveBattleMP');
            const activeMaxMP = document.getElementById('playerActiveBattleMaxMP');
            const activeHPBar = document.getElementById('playerActiveBattleHPBar');
            const activeMPBar = document.getElementById('playerActiveBattleMPBar');
            
            if (activeName) activeName.textContent = activeCharacter.name;
            if (activeLevel) activeLevel.textContent = activeCharacter.level || 1;
            if (activeHP) activeHP.textContent = activeCharacter.hp;
            if (activeMaxHP) activeMaxHP.textContent = activeCharacter.maxHp || activeCharacter.hp;
            if (activeMP) activeMP.textContent = activeCharacter.anima || activeCharacter.mp || 50;
            if (activeMaxMP) activeMaxMP.textContent = activeCharacter.maxAnima || activeCharacter.maxMp || 50;
            
            // Atualizar imagem
            if (activeImage) {
                if (activeCharacter.image) {
                    activeImage.src = activeCharacter.image;
                } else if (activeCharacter.sprite) {
                    activeImage.src = activeCharacter.sprite;
                } else if (activeCharacter.name) {
                    activeImage.src = this.generateCharacterImage(activeCharacter.name);
                }
            }
            
            // Atualizar barras
            if (activeHPBar) {
                const hpPercentage = (activeCharacter.hp / (activeCharacter.maxHp || activeCharacter.hp)) * 100;
                activeHPBar.style.width = `${hpPercentage}%`;
            }
            
            if (activeMPBar) {
                const mp = activeCharacter.anima || activeCharacter.mp || 50;
                const maxMp = activeCharacter.maxAnima || activeCharacter.maxMp || 50;
                const mpPercentage = (mp / maxMp) * 100;
                activeMPBar.style.width = `${mpPercentage}%`;
            }
        }
    }

    highlightActiveCharacter() {
        // Adicionar efeito visual no personagem ativo
        const activeSlot = document.querySelector('.character-slot.active');
        if (activeSlot) {
            activeSlot.style.transform = 'scale(1.05)';
            activeSlot.style.transition = 'transform 0.3s ease';
            
            setTimeout(() => {
                activeSlot.style.transform = 'scale(1)';
            }, 500);
        }
    }

    /**
     * Mostrar interface de trocas disponíveis
     */
    showSwapInterface() {
        if (!this.battleMechanics || !this.battleMechanics.battleState.teams) {
            this.addBattleLogEntry('error', 'Sistema 3v3 não disponível');
            return;
        }

        const playerTeam = this.battleMechanics.battleState.teams.player;
        const validation = this.battleMechanics.validateTeamForSwap(playerTeam);

        if (!validation.valid) {
            this.addBattleLogEntry('warning', validation.error);
            return;
        }

        // Criar interface de seleção
        const swapMenu = document.createElement('div');
        swapMenu.id = 'swap-menu';
        swapMenu.innerHTML = `
            <div class="swap-overlay">
                <div class="swap-panel">
                    <h3>🔄 Trocar Personagem</h3>
                    <p>Selecione um personagem da reserva:</p>
                    <div class="swap-options">
                        ${validation.availableForSwap.map((char, index) => `
                            <button class="swap-option" onclick="this.executePlayerSwap(${playerTeam.activeIndex}, ${playerTeam.characters.indexOf(char)})">
                                ${char.name} (HP: ${char.hp}/${char.maxHp || char.hp})
                            </button>
                        `).join('')}
                    </div>
                    <button class="cancel-swap" onclick="document.getElementById('swap-menu').remove()">Cancelar</button>
                </div>
            </div>
        `;

        document.body.appendChild(swapMenu);
    }

    setupActionButtons() {
        // Conectar botões de ação com sistema de turnos
        const attackBtn = document.querySelector('[data-action="basicattack"]');
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
    console.log('DOM carregado, inicializando sistema de batalha...');
    
    try {
        const battleDemo = new VintageBattleDemo();
        battleDemo.init();
        
        // Make battle instance globally available
        window.currentBattle = battleDemo;
        
        console.log('Sistema de batalha inicializado com sucesso');
        console.log('window.currentBattle:', window.currentBattle);
        console.log('showSwapOptions disponível:', typeof battleDemo.showSwapOptions === 'function');
        
        // Adicionar listener para debug de cliques
        document.addEventListener('click', function(event) {
            if (event.target.getAttribute('onclick') && event.target.getAttribute('onclick').includes('showSwapOptions')) {
                console.log('Clique detectado em elemento com showSwapOptions');
                console.log('Elemento:', event.target);
                console.log('window.currentBattle no momento do clique:', window.currentBattle);
            }
        });
        
    } catch (error) {
        console.error('Erro ao inicializar sistema de batalha:', error);
        console.error('Stack trace:', error.stack);
    }
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

// Global function to expose showSwapOptions for HTML onclick
function showSwapOptions(characterIndex) {
    console.log('showSwapOptions chamada com characterIndex:', characterIndex);
    console.log('window.currentBattle:', window.currentBattle);
    
    if (window.currentBattle && typeof window.currentBattle.showSwapOptions === 'function') {
        console.log('Chamando showSwapOptions da instância da batalha');
        window.currentBattle.showSwapOptions(characterIndex);
    } else {
        console.error('Sistema de batalha não inicializado ou função showSwapOptions não disponível');
        console.log('window.currentBattle existe:', !!window.currentBattle);
        console.log('showSwapOptions é função:', window.currentBattle ? typeof window.currentBattle.showSwapOptions === 'function' : 'N/A');
        
        // Fallback: tentar inicializar se não estiver
        if (!window.currentBattle) {
            console.log('Tentando inicializar sistema de batalha...');
            try {
                const battleDemo = new VintageBattleDemo();
                battleDemo.init();
                window.currentBattle = battleDemo;
                
                if (typeof battleDemo.showSwapOptions === 'function') {
                    console.log('Sistema inicializado, tentando novamente...');
                    battleDemo.showSwapOptions(characterIndex);
                }
            } catch (error) {
                console.error('Erro ao inicializar sistema de batalha:', error);
            }
        }
    }
}

/**
 * Sistema de Animações de Dano e HP
 * Gerencia todas as animações visuais de combate
 */
class BattleAnimationManager {
    constructor() {
        this.animationQueue = [];
        this.isAnimating = false;
    }

    /**
     * Animar dano recebido
     */
    animateDamage(targetElement, damage, isCritical = false) {
        if (!targetElement) return;

        // Adicionar classe de animação de dano
        targetElement.classList.add('damage-animation');
        
        // Se for crítico, adicionar efeito especial
        if (isCritical) {
            targetElement.classList.add('critical-hit');
        }

        // Criar texto flutuante de dano
        this.createFloatingText(targetElement, `-${damage}`, 'floating-damage');

        // Remover classes após animação
        setTimeout(() => {
            targetElement.classList.remove('damage-animation', 'critical-hit');
        }, 700);

        // Atualizar barra de HP com animação
        this.updateHpBar(targetElement, damage, 'damage');
    }

    /**
     * Animar cura recebida
     */
    animateHealing(targetElement, healAmount) {
        if (!targetElement) return;

        targetElement.classList.add('healing-animation');
        this.createFloatingText(targetElement, `+${healAmount}`, 'floating-heal');

        setTimeout(() => {
            targetElement.classList.remove('healing-animation');
        }, 800);

        this.updateHpBar(targetElement, healAmount, 'heal');
    }

    /**
     * Animar miss/esquiva
     */
    animateMiss(targetElement) {
        if (!targetElement) return;

        targetElement.classList.add('miss-animation');

        setTimeout(() => {
            targetElement.classList.remove('miss-animation');
        }, 600);
    }

    /**
     * Animar morte/KO
     */
    animateKO(targetElement) {
        if (!targetElement) return;

        targetElement.classList.add('ko-animation');
        
        // KO não é removido automaticamente (efeito permanente até revive)
    }

    /**
     * Criar texto flutuante
     */
    createFloatingText(parentElement, text, className) {
        const floatingText = document.createElement('div');
        floatingText.className = className;
        floatingText.textContent = text;

        // Posicionar relativamente ao elemento pai
        const rect = parentElement.getBoundingClientRect();
        floatingText.style.position = 'fixed';
        floatingText.style.left = (rect.left + rect.width / 2) + 'px';
        floatingText.style.top = (rect.top + rect.height / 2) + 'px';
        floatingText.style.transform = 'translate(-50%, -50%)';

        document.body.appendChild(floatingText);

        // Remover após animação
        setTimeout(() => {
            if (floatingText.parentNode) {
                floatingText.parentNode.removeChild(floatingText);
            }
        }, 1500);
    }

    /**
     * Atualizar barra de HP com animação
     */
    updateHpBar(targetElement, amount, type) {
        const hpBar = targetElement.querySelector('.mini-bar-fill') || targetElement.querySelector('.hp-bar');
        if (!hpBar) return;

        const currentHpElement = targetElement.querySelector('[id*="HP"]');
        if (!currentHpElement) return;

        let currentHp = parseInt(currentHpElement.textContent) || 0;
        const maxHpElement = targetElement.querySelector('[id*="MaxHP"]');
        const maxHp = maxHpElement ? parseInt(maxHpElement.textContent) : 100;

        // Calcular novo HP
        if (type === 'damage') {
            currentHp = Math.max(0, currentHp - amount);
        } else if (type === 'heal') {
            currentHp = Math.min(maxHp, currentHp + amount);
        }

        // Atualizar texto
        currentHpElement.textContent = currentHp;

        // Calcular porcentagem
        const hpPercentage = (currentHp / maxHp) * 100;
        
        // Animar barra
        hpBar.style.width = hpPercentage + '%';

        // Aplicar estilos baseados em HP
        if (hpPercentage <= 25) {
            hpBar.classList.add('critical');
            targetElement.classList.add('low-hp-animation');
        } else {
            hpBar.classList.remove('critical');
            targetElement.classList.remove('low-hp-animation');
        }

        // Verificar KO
        if (currentHp <= 0) {
            setTimeout(() => {
                this.animateKO(targetElement);
            }, 500);
        }
    }

    /**
     * Animar ataque sendo executado
     */
    animateAttack(attackerElement, skillName = 'Ataque') {
        if (!attackerElement) return;

        // Flash de ataque
        attackerElement.style.filter = 'brightness(1.3) saturate(1.5)';
        
        setTimeout(() => {
            attackerElement.style.filter = '';
        }, 200);

        // Mostrar nome da skill
        this.createFloatingText(attackerElement, skillName, 'floating-skill');
    }

    /**
     * Sequência de animação completa de combate
     */
    async animateCombatSequence(attacker, target, damage, skillName, isCritical = false, isMiss = false) {
        // 1. Animação de ataque
        this.animateAttack(attacker, skillName);
        
        await this.wait(300);

        // 2. Resultado do ataque
        if (isMiss) {
            this.animateMiss(target);
        } else {
            this.animateDamage(target, damage, isCritical);
        }

        return new Promise(resolve => {
            setTimeout(resolve, 800);
        });
    }

    /**
     * Resetar todas as animações
     */
    resetAllAnimations() {
        const animationClasses = [
            'damage-animation', 'healing-animation', 'miss-animation', 
            'ko-animation', 'critical-hit', 'low-hp-animation'
        ];

        animationClasses.forEach(className => {
            document.querySelectorAll(`.${className}`).forEach(element => {
                element.classList.remove(className);
            });
        });

        // Remover textos flutuantes
        document.querySelectorAll('.floating-damage, .floating-heal, .floating-skill').forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
    }

    /**
     * Utilitário para aguardar
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * CORREÇÃO v4.9.6: Busca nome do personagem do cache por ID
     * @param {string} characterId - ID do personagem
     * @param {string} teamType - 'player' ou 'enemy'
     * @returns {string|null} Nome do personagem ou null se não encontrado
     */
    getCharacterNameFromCache(characterId, teamType) {
        if (this.battleCharactersCache && this.battleCharactersCache.initialized) {
            const team = teamType === 'player' ? this.battleCharactersCache.playerTeam : this.battleCharactersCache.enemyTeam;
            const cachedCharacter = team.find(c => c.id === characterId);
            
            if (cachedCharacter && cachedCharacter.name) {
                return cachedCharacter.name;
            }
        }
        return null;
    }

    /**
     * CORREÇÃO v4.9.6: Resolver nome de personagem usando cache
     * @param {Object} character - Personagem do battleState (só tem ID)
     * @param {string} teamType - 'player' ou 'enemy'
     * @returns {string} Nome resolvido ou fallback
     */
    resolveCharacterName(character, teamType) {
        // Primeiro: tentar usar o nome já presente (se houver)
        if (character.name) {
            return character.name;
        }
        
        // Segundo: tentar resolver via cache de personagens
        if (this.battleCharactersCache && this.battleCharactersCache.initialized) {
            const team = teamType === 'player' ? this.battleCharactersCache.playerTeam : this.battleCharactersCache.enemyTeam;
            const cachedCharacter = team.find(c => c.id === character.id);
            
            if (cachedCharacter && cachedCharacter.name) {
                console.log(`✅ [NAME-RESOLVE] ${character.id} → ${cachedCharacter.name} (via cache)`);
                return cachedCharacter.name;
            }
        }
        
        // Terceiro: tentar resolver via charactersData global
        if (this.charactersData && this.charactersData[character.id]) {
            const name = this.charactersData[character.id].name;
            console.log(`✅ [NAME-RESOLVE] ${character.id} → ${name} (via global data)`);
            return name;
        }
        
        // Fallback: usar ID como nome
        console.warn(`⚠️ [NAME-RESOLVE] Não foi possível resolver nome para ${character.id}, usando ID`);
        return character.id;
    }
}

// Initialize particle system and animation manager
document.addEventListener('DOMContentLoaded', () => {
    const particleSystem = new AtmosphericParticleSystem();
    const animationManager = new BattleAnimationManager();
    
    particleSystem.init();
    
    // Make both globally available
    window.particleSystem = particleSystem;
    window.battleAnimations = animationManager;
    
    console.log('✅ Animation systems initialized successfully');
});
