/* 🌟💥 BATTLE SYSTEM PREMIUM JAVASCRIPT - DEVASTADOR v4.1.0 💥🌟 */

/**
 * 🚀 PREMIUM BATTLE ENHANCEMENTS
 * - Sistema de Cargas Astrais Visual
 * - Animações Cinematográficas
 * - Efeitos Visuais Devastadores
 * - Integração Cadência do Dragão
 * - PWA Mobile Optimizado
 */

class BattlePremiumEffects {
    constructor() {
        // Integração com Sistema Astral real
        this.astralSystem = window.astralSystem || new AstralSystem();
        this.playerCharacterId = null;
        
        // Integração com BattleMechanics.js para Cadência do Dragão v4.1.0
        this.battleMechanics = window.battleMechanics || new BattleMechanics();
        this.realDragonCadenceActive = false;
        
        // Sistema de personagens reais
        this.availableCharacters = [];
        this.playerCharacter = null;
        this.enemyCharacter = null;
        
        // Stats de batalha
        this.playerHP = 300;
        this.playerMaxHP = 300;
        this.enemyHP = 300;
        this.enemyMaxHP = 300;
        
        this.dragonCadenceCombo = 0;
        this.dragonCadencePower = 0;
        this.currentTurn = 1;
        this.totalDamageDealt = 0;
        this.totalAttacks = 0;
        this.criticalHits = 0;
        this.isAnimating = false;
        
        this.init();
        
        // Debug para testar sistema
        window.testCharacterSelection = () => {
            console.log('🧪 Teste da seleção de personagens');
            
            // Forçar personagens fallback para teste
            this.availableCharacters = [
                {
                    id: '045CCF3515',
                    name: 'Robin',
                    classe: 'Armamentista',
                    hp: 300,
                    maxHP: 300,
                    attack: 100,
                    defense: 100,
                    anima: 100,
                    critico: 1.0,
                    skills: []
                },
                {
                    id: 'EA32D10F2D', 
                    name: 'Ussop',
                    classe: 'Lutador',
                    hp: 300,
                    maxHP: 300,
                    attack: 100,
                    defense: 100,
                    anima: 100,
                    critico: 1.0,
                    skills: []
                }
            ];
            
            this.showCharacterSelection();
        };
        
        // Debug simples para testar modal
        window.testModal = () => {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(255, 0, 0, 0.8);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 2em;
            `;
            overlay.innerHTML = '<div>TESTE MODAL FUNCIONANDO!</div>';
            document.body.appendChild(overlay);
            
            setTimeout(() => overlay.remove(), 3000);
        };
    }

    async init() {
        console.log('🌟 Inicializando Battle Premium Effects v4.1.0...');
        
        this.setupEventListeners();
        await this.initializeAstralCharges();
        this.initializeDragonCadence();
        this.startBackgroundAnimations();
        this.setupMobileOptimizations();
        this.setupPWAFeatures();
        
        console.log('✅ Battle Premium Effects inicializado com SUCESSO!');
    }

    setupEventListeners() {
        // Enhanced attack button with premium effects
        const attackBtn = document.getElementById('attack-btn');
        if (attackBtn) {
            attackBtn.addEventListener('click', (e) => this.handlePremiumAttack(e));
            attackBtn.addEventListener('mouseenter', () => this.showAttackPreview());
            attackBtn.addEventListener('mouseleave', () => this.hideAttackPreview());
        }

        // Sistema Astral integrado com botões reais
        const defendBtn = document.getElementById('defend-btn');
        const meditateBtn = document.getElementById('meditate-btn');
        
        if (defendBtn) {
            defendBtn.addEventListener('click', (e) => this.handleRealAstralDefend(e));
        }
        
        if (meditateBtn) {
            meditateBtn.addEventListener('click', (e) => this.handleRealAstralMeditate(e));
        }

        // Log controls
        const clearLogBtn = document.getElementById('clear-log');
        const scrollToBottomBtn = document.getElementById('scroll-to-bottom');
        
        if (clearLogBtn) {
            clearLogBtn.addEventListener('click', () => this.clearBattleLog());
        }
        
        if (scrollToBottomBtn) {
            scrollToBottomBtn.addEventListener('click', () => this.scrollLogToBottom());
        }

        // Touch events for mobile
        this.setupTouchEvents();
    }

    async initializeAstralCharges() {
        // Buscar personagens reais do character-database
        await this.loadRealCharacters();
        
        // Sempre mostrar seleção de personagens na inicialização
        if (!this.playerCharacter || !this.enemyCharacter) {
            console.log('🎯 Nenhum personagem selecionado, mostrando seleção...');
            
            // Pequeno delay para garantir que o DOM esteja pronto
            setTimeout(() => {
                this.showCharacterSelection();
            }, 500);
            return;
        }
        
        // Inicializar sistema astral com personagem real
        this.playerCharacterId = this.playerCharacter.id;
        this.playerClass = this.playerCharacter.classe;
        this.enemyClass = this.enemyCharacter.classe;
        
        // Inicializar cargas astrais no sistema real
        this.astralSystem.initializeCharges(this.playerCharacterId, 8);
        
        // Atualizar display com cargas reais
        const charges = this.astralSystem.getCharges(this.playerCharacterId);
        this.updateRealAstralDisplay(charges.currentCharges);
        
        // Mostrar vantagem/desvantagem de classe
        this.updateClassAdvantageDisplay();
        
        // Atualizar interface com personagens reais
        this.updateBattleInterface();
        
        console.log(`🌟 Sistema Astral Real inicializado: ${charges.currentCharges}/${charges.maxCharges} cargas`);
        console.log(`⚔️ Classes: ${this.playerClass} vs ${this.enemyClass} - ${this.getClassAdvantageMessage()}`);
        console.log(`👤 Jogador: ${this.playerCharacter.name} (${this.playerCharacter.id})`);
        console.log(`👹 Inimigo: ${this.enemyCharacter.name} (${this.enemyCharacter.id})`);
        
        // Add click events to charges for debugging/admin
        const chargeElements = document.querySelectorAll('.astral-charge');
        chargeElements.forEach((charge, index) => {
            charge.addEventListener('click', () => {
                if (charge.classList.contains('active')) {
                    this.consumeAstralCharge(index + 1);
                }
            });
        });
    }

    initializeDragonCadence() {
        // Check if player is Lutador class
        const playerName = document.getElementById('player-name');
        if (playerName && this.isLutadorClass()) {
            this.showDragonCadence();
        }
    }

    isLutadorClass() {
        // Check if current character is Lutador
        // This would be determined by battle.js character data
        return true; // For demo purposes
    }

    showDragonCadence() {
        const dragonCadence = document.getElementById('dragon-cadence');
        if (dragonCadence) {
            dragonCadence.style.display = 'block';
            this.animateElementIn(dragonCadence);
        }
    }

    updateAstralDisplay() {
        const astralCount = document.getElementById('astral-count');
        const astralWarning = document.getElementById('astral-warning');
        
        if (astralCount) {
            astralCount.textContent = `${this.astralCharges}/${this.maxAstralCharges}`;
        }
        
        // Show warning when charges are low
        if (astralWarning) {
            if (this.astralCharges <= 2) {
                astralWarning.style.display = 'block';
                this.animateElementIn(astralWarning);
            } else {
                astralWarning.style.display = 'none';
            }
        }
        
        // Update individual charge displays
        const charges = document.querySelectorAll('.astral-charge');
        charges.forEach((charge, index) => {
            if (index < this.astralCharges) {
                charge.classList.add('active');
                charge.classList.remove('consumed');
            } else {
                charge.classList.remove('active');
                charge.classList.add('consumed');
            }
        });
    }

    consumeAstralCharge(chargeIndex = null) {
        if (this.astralCharges <= 0) {
            this.showToast('❌ Sem cargas astrais!', 'error');
            this.shakeElement(document.querySelector('.astral-charges-container'));
            return false;
        }

        // Find the highest active charge to consume
        const charges = document.querySelectorAll('.astral-charge.active');
        if (charges.length > 0) {
            const chargeToConsume = charges[charges.length - 1];
            
            // Animate consumption
            chargeToConsume.classList.add('consuming');
            
            setTimeout(() => {
                chargeToConsume.classList.remove('active', 'consuming');
                chargeToConsume.classList.add('consumed');
                this.astralCharges--;
                this.updateAstralDisplay();
                
                // Create particles effect
                this.createAstralParticles(chargeToConsume);
            }, 400);
        }
        
        return true;
    }

    createAstralParticles(element) {
        const rect = element.getBoundingClientRect();
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'astral-particle';
            particle.style.cssText = `
                position: fixed;
                left: ${rect.left + rect.width/2}px;
                top: ${rect.top + rect.height/2}px;
                width: 4px;
                height: 4px;
                background: #41eadc;
                border-radius: 50%;
                pointer-events: none;
                z-index: 10000;
                box-shadow: 0 0 8px #41eadc;
            `;
            
            document.body.appendChild(particle);
            
            // Animate particle
            const angle = (Math.PI * 2 * i) / 8;
            const distance = 50 + Math.random() * 30;
            const targetX = rect.left + rect.width/2 + Math.cos(angle) * distance;
            const targetY = rect.top + rect.height/2 + Math.sin(angle) * distance;
            
            particle.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${targetX - rect.left - rect.width/2}px, ${targetY - rect.top - rect.height/2}px) scale(0)`, opacity: 0 }
            ], {
                duration: 800,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }).onfinish = () => {
                document.body.removeChild(particle);
            };
        }
    }

    handlePremiumAttack(event) {
        event.preventDefault();
        
        if (this.isAnimating) return;
        if (!this.playerCharacter || !this.enemyCharacter) return;
        
        this.isAnimating = true;
        
        // Update dragon cadence for Lutador
        if (this.playerClass === 'Lutador') {
            this.updateDragonCadence();
        }
        
        // Premium attack animation
        this.playAttackAnimation();
        
        // Calcular dano real usando stats dos personagens
        const damage = this.calculatePremiumDamage();
        
        setTimeout(() => {
            // Aplicar dano ao inimigo
            this.applyDamageToEnemy(damage);
            this.showDamageEffect(damage);
            this.updateBattleStats(damage);
            
            const cadenceInfo = this.dragonCadencePower > 0 ? ` (+${this.dragonCadencePower}% Dragão)` : '';
            this.logPremiumMessage(`🗡️ ${this.playerCharacter.name} atacou! ${damage} de dano${cadenceInfo}`, 'attack');
            
            // Inimigo contra-ataca se ainda estiver vivo
            setTimeout(() => {
                if (this.enemyHP > 0) {
                    this.enemyCounterAttack();
                }
                this.isAnimating = false;
            }, 800);
        }, 1200);
    }

    enemyCounterAttack() {
        if (this.playerHP <= 0 || this.enemyHP <= 0) return;
        
        // Calcular dano do inimigo
        const enemyDamage = this.calculateEnemyDamage();
        
        // Aplicar dano ao jogador
        this.applyDamageToPlayer(enemyDamage);
        
        this.logPremiumMessage(`👹 ${this.enemyCharacter.name} contra-atacou! ${enemyDamage} de dano recebido!`, 'enemy');
        
        // Animação visual do contra-ataque
        this.showPlayerDamageEffect();
    }

    showPlayerDamageEffect() {
        const playerSprite = document.querySelector('.player-sprite');
        if (playerSprite) {
            playerSprite.style.filter = 'brightness(0.6) hue-rotate(0deg)';
            playerSprite.style.transform = 'translateX(-10px)';
            
            setTimeout(() => {
                playerSprite.style.filter = '';
                playerSprite.style.transform = '';
            }, 400);
        }
    }

    handleAstralDefend(event) {
        event.preventDefault();
        
        if (this.isAnimating) return;
        if (!this.consumeAstralCharge()) return;
        
        this.isAnimating = true;
        
        // Reset dragon cadence
        this.resetDragonCadence();
        
        this.playDefendAnimation();
        this.logPremiumMessage(`🛡️ Defesa astral ativada! (-1 carga astral)`, 'astral');
        
        setTimeout(() => {
            this.isAnimating = false;
        }, 1000);
    }

    handleAstralMeditate(event) {
        event.preventDefault();
        
        if (this.isAnimating) return;
        if (!this.consumeAstralCharge()) return;
        
        this.isAnimating = true;
        
        // Reset dragon cadence
        this.resetDragonCadence();
        
        this.playMeditateAnimation();
        this.healPlayer(50); // 50% HP
        this.restoreAnima(10); // 10% Anima
        this.logPremiumMessage(`🧘 Meditação astral! +50% HP, +10% Ânima (-1 carga astral)`, 'restoration');
        
        setTimeout(() => {
            this.isAnimating = false;
        }, 1500);
    }

    // Métodos reais integrados com Sistema Astral v4.0.0
    handleRealAstralDefend(event) {
        event.preventDefault();
        
        if (this.isAnimating) return;
        
        // Verificar se tem cargas astrais disponíveis usando sistema real
        if (!this.astralSystem.canPerformAction(this.playerCharacterId, 'defend')) {
            this.logPremiumMessage(`❌ Sem cargas astrais para defender!`, 'error');
            this.showCriticalEffect();
            return;
        }
        
        this.isAnimating = true;
        
        // Consumir carga astral real
        const result = this.astralSystem.handleBattleAction(this.playerCharacterId, 'defend');
        
        if (result.success) {
            // Reset dragon cadence
            this.resetDragonCadence();
            
            this.playDefendAnimation();
            this.logPremiumMessage(result.message, 'astral');
            
            // Atualizar interface visual das cargas
            this.updateRealAstralDisplay(result.remainingCharges);
        } else {
            this.logPremiumMessage(result.message, 'error');
        }
        
        setTimeout(() => {
            this.isAnimating = false;
        }, 1000);
    }

    handleRealAstralMeditate(event) {
        event.preventDefault();
        
        if (this.isAnimating) return;
        
        // Verificar se tem cargas astrais disponíveis usando sistema real
        if (!this.astralSystem.canPerformAction(this.playerCharacterId, 'meditate')) {
            this.logPremiumMessage(`❌ Sem cargas astrais para meditar!`, 'error');
            this.showCriticalEffect();
            return;
        }
        
        this.isAnimating = true;
        
        // Consumir carga astral real
        const result = this.astralSystem.handleBattleAction(this.playerCharacterId, 'meditate');
        
        if (result.success) {
            // Reset dragon cadence
            this.resetDragonCadence();
            
            this.playMeditateAnimation();
            this.healPlayer(50); // 50% HP conforme BattleMechanics.js
            this.restoreAnima(10); // 10% Anima
            this.logPremiumMessage(result.message, 'restoration');
            
            // Atualizar interface visual das cargas
            this.updateRealAstralDisplay(result.remainingCharges);
        } else {
            this.logPremiumMessage(result.message, 'error');
        }
        
        setTimeout(() => {
            this.isAnimating = false;
        }, 1500);
    }

    // Atualizar display visual das cargas astrais reais
    updateRealAstralDisplay(remainingCharges) {
        const astralDisplay = document.querySelector('.astral-charges');
        const astralBars = document.querySelectorAll('.astral-bar');
        
        if (astralDisplay) {
            astralDisplay.textContent = `⚡ ${remainingCharges}/8`;
        }
        
        // Atualizar barras visuais
        astralBars.forEach((bar, index) => {
            if (index < remainingCharges) {
                bar.style.opacity = '1';
                bar.style.backgroundColor = remainingCharges > 4 ? '#667eea' : remainingCharges > 2 ? '#f59e0b' : '#ef4444';
            } else {
                bar.style.opacity = '0.3';
                bar.style.backgroundColor = '#374151';
            }
        });
        
        // Efeito visual de redução
        const usedBar = astralBars[remainingCharges];
        if (usedBar) {
            usedBar.style.transform = 'scale(1.2)';
            setTimeout(() => {
                usedBar.style.transform = '';
            }, 300);
        }
    }

    updateDragonCadence() {
        // Usar algoritmo real da Cadência do Dragão v4.1.0 do BattleMechanics.js
        const cadenceResult = this.battleMechanics.processDragonCadence(this.playerCharacterId);
        
        // Atualizar variáveis locais com dados reais
        this.dragonCadenceCombo = cadenceResult.consecutiveAttacks;
        this.dragonCadencePower = cadenceResult.currentBuff;
        this.realDragonCadenceActive = true;
        
        const comboElement = document.getElementById('cadence-combo');
        const powerElement = document.getElementById('cadence-power');
        
        if (comboElement) {
            comboElement.textContent = `Combo: ${this.dragonCadenceCombo}`;
            this.pulseElement(comboElement);
        }
        
        if (powerElement) {
            powerElement.textContent = `+${this.dragonCadencePower}% Damage`;
            this.pulseElement(powerElement);
        }
        
        // Show dragon aura for high combos
        const dragonAura = document.getElementById('dragon-aura');
        if (dragonAura && this.dragonCadenceCombo >= 4) {
            dragonAura.style.display = 'block';
            this.animateElementIn(dragonAura);
        }
        
        // Usar mensagem real do BattleMechanics.js v4.1.0
        if (cadenceResult.message) {
            this.logPremiumMessage(cadenceResult.message, 'dragon');
        }
    }

    resetDragonCadence() {
        if (this.realDragonCadenceActive) {
            // Usar método real do BattleMechanics.js para quebrar cadência
            const breakResult = this.battleMechanics.breakDragonCadence(this.playerCharacterId);
            
            // Atualizar variáveis locais
            this.dragonCadenceCombo = 0;
            this.dragonCadencePower = breakResult.currentBuff;
            
            this.updateDragonCadenceDisplay();
            
            const dragonAura = document.getElementById('dragon-aura');
            if (dragonAura) {
                dragonAura.style.display = 'none';
            }
            
            if (breakResult.broken && breakResult.message) {
                this.logPremiumMessage(`💔 ${breakResult.message}`, 'system');
            }
        }
    }

    updateDragonCadenceDisplay() {
        const comboElement = document.getElementById('cadence-combo');
        const powerElement = document.getElementById('cadence-power');
        
        if (comboElement) {
            comboElement.textContent = `Combo: ${this.dragonCadenceCombo}`;
        }
        
        if (powerElement) {
            powerElement.textContent = `+${this.dragonCadencePower}% Damage`;
        }
    }

    calculatePremiumDamage() {
        // Usar ataque real do personagem como base
        const playerAttack = this.playerCharacter?.attack || 100;
        let baseDamage = playerAttack * (0.8 + Math.random() * 0.4); // 80-120% do ataque
        
        // Usar método real do BattleMechanics.js para aplicar buff da Cadência do Dragão
        if (this.realDragonCadenceActive && this.dragonCadencePower > 0) {
            baseDamage = this.battleMechanics.applyDragonCadenceBuff(baseDamage, this.playerCharacterId);
        }
        
        // Aplicar modificadores de vantagem de classe
        baseDamage = this.applyClassDamageModifier(baseDamage);
        
        // Critical hit usando valor real do personagem
        const criticalChance = (this.playerCharacter?.critico || 1.0) * 0.1; // Base 10% * multiplicador
        if (Math.random() < criticalChance) {
            baseDamage = Math.round(baseDamage * (this.playerCharacter?.critico || 2.0));
            this.criticalHits++;
            this.showCriticalEffect();
        }
        
        return Math.round(baseDamage);
    }

    calculateEnemyDamage() {
        // Usar ataque real do inimigo como base
        const enemyAttack = this.enemyCharacter?.attack || 100;
        let baseDamage = enemyAttack * (0.7 + Math.random() * 0.3); // 70-100% do ataque (inimigo mais fraco)
        
        // Aplicar defesa do jogador
        const playerDefense = this.playerCharacter?.defense || 100;
        const defenseReduction = Math.min(0.5, playerDefense / 200); // Máximo 50% de redução
        baseDamage = baseDamage * (1 - defenseReduction);
        
        // Aplicar modificadores de classe defensivas
        baseDamage = this.applyClassDefenseModifier(baseDamage);
        
        // Critical hit do inimigo
        const criticalChance = (this.enemyCharacter?.critico || 1.0) * 0.08; // Base 8% para inimigo
        if (Math.random() < criticalChance) {
            baseDamage = Math.round(baseDamage * (this.enemyCharacter?.critico || 1.8));
        }
        
        return Math.round(Math.max(1, baseDamage)); // Mínimo 1 de dano
    }

    applyDamageToEnemy(damage) {
        this.enemyHP = Math.max(0, this.enemyHP - damage);
        this.updateHealthBars();
        
        // Verificar se inimigo morreu
        if (this.enemyHP <= 0) {
            this.endBattle(true); // Jogador venceu
        }
    }

    applyDamageToPlayer(damage) {
        this.playerHP = Math.max(0, this.playerHP - damage);
        this.updateHealthBars();
        
        // Verificar se jogador morreu
        if (this.playerHP <= 0) {
            this.endBattle(false); // Inimigo venceu
        }
    }

    healPlayer(percentageHeal) {
        const healAmount = Math.round(this.playerMaxHP * (percentageHeal / 100));
        this.playerHP = Math.min(this.playerMaxHP, this.playerHP + healAmount);
        this.updateHealthBars();
        
        this.logPremiumMessage(`💚 Cura: +${healAmount} HP (${percentageHeal}%)`, 'healing');
    }

    endBattle(playerWon) {
        const message = playerWon 
            ? `🏆 VITÓRIA! ${this.playerCharacter.name} derrotou ${this.enemyCharacter.name}!`
            : `💀 DERROTA! ${this.enemyCharacter.name} derrotou ${this.playerCharacter.name}!`;
            
        this.logPremiumMessage(message, playerWon ? 'victory' : 'defeat');
        
        // Mostrar botão de nova batalha
        setTimeout(() => {
            this.showNewBattleButton();
        }, 2000);
    }

    showNewBattleButton() {
        const newBattleBtn = document.createElement('button');
        newBattleBtn.className = 'new-battle-btn';
        newBattleBtn.textContent = '🔄 NOVA BATALHA';
        newBattleBtn.onclick = () => {
            location.reload(); // Recarregar para nova seleção
        };
        
        // Adicionar ao container de ações
        const actionContainer = document.querySelector('.battle-actions');
        if (actionContainer) {
            actionContainer.appendChild(newBattleBtn);
        }
    }

    // Sistema de Classes e Vantagens RPGStack v3.3.0
    getRandomEnemyClass() {
        const classes = ['Lutador', 'Armamentista', 'Arcano'];
        return classes[Math.floor(Math.random() * classes.length)];
    }

    getClassAdvantageMessage() {
        const hasAdvantage = this.battleMechanics.hasClassAdvantage(this.playerClass, this.enemyClass);
        if (hasAdvantage) {
            return `🔥 VANTAGEM! ${this.playerClass} > ${this.enemyClass}`;
        } else {
            const enemyHasAdvantage = this.battleMechanics.hasClassAdvantage(this.enemyClass, this.playerClass);
            if (enemyHasAdvantage) {
                return `❄️ DESVANTAGEM! ${this.enemyClass} > ${this.playerClass}`;
            } else {
                return `⚖️ EQUILIBRIO! ${this.playerClass} = ${this.enemyClass}`;
            }
        }
    }

    updateClassAdvantageDisplay() {
        const advantageElement = document.getElementById('class-advantage') || 
                               this.createClassAdvantageElement();
        
        const message = this.getClassAdvantageMessage();
        advantageElement.innerHTML = `
            <div class="class-info">
                <span class="player-class">👤 ${this.playerClass}</span>
                <span class="vs">vs</span>
                <span class="enemy-class">👹 ${this.enemyClass}</span>
            </div>
            <div class="advantage-status">${message}</div>
        `;

        const hasAdvantage = this.battleMechanics.hasClassAdvantage(this.playerClass, this.enemyClass);
        const enemyHasAdvantage = this.battleMechanics.hasClassAdvantage(this.enemyClass, this.playerClass);

        if (hasAdvantage) {
            advantageElement.className = 'class-advantage advantage';
        } else if (enemyHasAdvantage) {
            advantageElement.className = 'class-advantage disadvantage';
        } else {
            advantageElement.className = 'class-advantage neutral';
        }
    }

    createClassAdvantageElement() {
        const element = document.createElement('div');
        element.id = 'class-advantage';
        
        // Inserir antes do dragon-cadence se existir, senão no final da área de battle-info
        const battleInfo = document.querySelector('.battle-info') || document.querySelector('.battle-content');
        const dragonCadence = document.getElementById('dragon-cadence');
        
        if (battleInfo && dragonCadence) {
            battleInfo.insertBefore(element, dragonCadence);
        } else if (battleInfo) {
            battleInfo.appendChild(element);
        }
        
        return element;
    }

    applyClassDamageModifier(damage) {
        // Aplicar modificadores de vantagem de classe no dano
        const hasAdvantage = this.battleMechanics.hasClassAdvantage(this.playerClass, this.enemyClass);
        
        if (hasAdvantage) {
            const modifiedDamage = Math.round(damage * BattleMechanics.ADVANTAGE_DAMAGE_BONUS);
            this.logPremiumMessage(`🔥 Vantagem de Classe! +10% dano (${damage} → ${modifiedDamage})`, 'advantage');
            return modifiedDamage;
        }
        
        return damage;
    }

    applyClassDefenseModifier(incomingDamage) {
        // Aplicar modificadores de vantagem de classe na defesa
        const hasAdvantage = this.battleMechanics.hasClassAdvantage(this.playerClass, this.enemyClass);
        
        if (hasAdvantage) {
            const modifiedDamage = Math.round(incomingDamage * BattleMechanics.ADVANTAGE_DAMAGE_REDUCTION);
            this.logPremiumMessage(`🛡️ Vantagem Defensiva! -10% dano recebido (${incomingDamage} → ${modifiedDamage})`, 'defense');
            return modifiedDamage;
        }
        
        return incomingDamage;
    }

    // Sistema de Personagens Reais - Character Database Integration
    async loadRealCharacters() {
        try {
            console.log('📡 Buscando personagens do Character Database...');
            const response = await fetch('/api/characters');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📦 Dados recebidos da API:', data);
            
            // Tentar múltiplas estruturas de dados
            let characters = [];
            if (data.characters) {
                characters = Object.values(data.characters);
            } else if (Array.isArray(data)) {
                characters = data;
            } else if (typeof data === 'object') {
                characters = Object.values(data);
            }
            
            if (characters.length === 0) {
                throw new Error('Nenhum personagem encontrado na API');
            }
            
            this.availableCharacters = characters;
            console.log(`✅ ${this.availableCharacters.length} personagens carregados:`, 
                       this.availableCharacters.map(c => `${c.name} (${c.id}) - ${c.classe}`));
            
            return this.availableCharacters;
        } catch (error) {
            console.error('❌ Erro ao carregar personagens:', error);
            
            // Fallback com personagens mock se API falhar
            this.availableCharacters = [
                {
                    id: '045CCF3515',
                    name: 'Robin',
                    classe: 'Armamentista',
                    hp: 300,
                    maxHP: 300,
                    attack: 100,
                    defense: 100,
                    anima: 100,
                    critico: 1.0,
                    skills: []
                },
                {
                    id: 'EA32D10F2D', 
                    name: 'Ussop',
                    classe: 'Lutador',
                    hp: 300,
                    maxHP: 300,
                    attack: 100,
                    defense: 100,
                    anima: 100,
                    critico: 1.0,
                    skills: []
                }
            ];
            console.log('🔄 Usando personagens fallback:', this.availableCharacters);
            return this.availableCharacters;
        }
    }

    showCharacterSelection() {
        console.log('🎮 Mostrando seleção de personagens...');
        console.log('📋 Personagens disponíveis:', this.availableCharacters);
        
        // Criar overlay de seleção
        const overlay = document.createElement('div');
        overlay.id = 'character-selection-overlay';
        overlay.className = 'character-selection-overlay';
        
        overlay.innerHTML = `
            <div class="character-selection-modal">
                <h2>⚔️ BATALHA 1v1 - SELEÇÃO DE PERSONAGENS</h2>
                <div class="selection-container">
                    <div class="player-selection">
                        <h3>👤 SEU PERSONAGEM</h3>
                        <div class="character-grid" id="player-grid">
                            ${this.generateCharacterCards('player')}
                        </div>
                        <div class="selected-character" id="selected-player">
                            <span>Selecione seu personagem</span>
                        </div>
                    </div>
                    <div class="vs-separator">
                        <div class="vs-text">VS</div>
                    </div>
                    <div class="enemy-selection">
                        <h3>👹 OPONENTE</h3>
                        <div class="character-grid" id="enemy-grid">
                            ${this.generateCharacterCards('enemy')}
                        </div>
                        <div class="selected-character" id="selected-enemy">
                            <span>Selecione o oponente</span>
                        </div>
                    </div>
                </div>
                <button id="start-battle-btn" class="start-battle-btn" disabled>
                    🚀 INICIAR BATALHA
                </button>
            </div>
        `;
        
        console.log('📱 Adicionando overlay ao DOM...');
        document.body.appendChild(overlay);
        console.log('✅ Overlay adicionado! HTML:', overlay.outerHTML.substring(0, 200) + '...');
        
        // Garantir que o overlay está visível
        overlay.style.zIndex = '10000';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.display = 'flex';
        
        this.setupCharacterSelectionEvents();
    }

    generateCharacterCards(type) {
        console.log(`🃏 Gerando cards para ${type}...`);
        
        if (!this.availableCharacters || this.availableCharacters.length === 0) {
            console.error('❌ Nenhum personagem disponível para gerar cards');
            return '<div class="no-characters">Nenhum personagem disponível</div>';
        }
        
        return this.availableCharacters.map(character => {
            console.log(`🎭 Gerando card para ${character.name} (${character.id})`);
            
            return `
                <div class="character-card" data-id="${character.id}" data-type="${type}">
                    <div class="character-hex-id">${character.id}</div>
                    <div class="character-name">${character.name}</div>
                    <div class="character-class ${(character.classe || 'lutador').toLowerCase()}">${character.classe || 'Lutador'}</div>
                    <div class="character-stats">
                        <span>💚 ${character.hp || 300}</span>
                        <span>⚔️ ${character.attack || 100}</span>
                        <span>🛡️ ${character.defense || 100}</span>
                    </div>
                    <div class="character-skills">
                        ${character.skills?.length ? `🎯 ${character.skills.length} skills` : '⚡ Sem skills'}
                    </div>
                </div>
            `;
        }).join('');
    }

    setupCharacterSelectionEvents() {
        console.log('⚙️ Configurando eventos da seleção...');
        
        const playerCards = document.querySelectorAll('[data-type="player"] .character-card');
        const enemyCards = document.querySelectorAll('[data-type="enemy"] .character-card');
        const startButton = document.getElementById('start-battle-btn');
        
        console.log(`🎯 Cards do jogador encontrados: ${playerCards.length}`);
        console.log(`🎯 Cards do inimigo encontrados: ${enemyCards.length}`);
        console.log(`🚀 Botão de início encontrado:`, !!startButton);
        
        let selectedPlayer = null;
        let selectedEnemy = null;
        
        // Seleção do jogador
        playerCards.forEach(card => {
            card.addEventListener('click', () => {
                playerCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                const characterId = card.dataset.id;
                selectedPlayer = this.availableCharacters.find(c => c.id === characterId);
                
                document.getElementById('selected-player').innerHTML = `
                    <div class="selected-info">
                        <strong>${selectedPlayer.name}</strong>
                        <span class="class-badge ${selectedPlayer.classe.toLowerCase()}">${selectedPlayer.classe}</span>
                        <span class="hex-id">${selectedPlayer.id}</span>
                    </div>
                `;
                
                this.checkStartBattle(selectedPlayer, selectedEnemy, startButton);
            });
        });
        
        // Seleção do inimigo
        enemyCards.forEach(card => {
            card.addEventListener('click', () => {
                enemyCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                const characterId = card.dataset.id;
                selectedEnemy = this.availableCharacters.find(c => c.id === characterId);
                
                document.getElementById('selected-enemy').innerHTML = `
                    <div class="selected-info">
                        <strong>${selectedEnemy.name}</strong>
                        <span class="class-badge ${selectedEnemy.classe.toLowerCase()}">${selectedEnemy.classe}</span>
                        <span class="hex-id">${selectedEnemy.id}</span>
                    </div>
                `;
                
                this.checkStartBattle(selectedPlayer, selectedEnemy, startButton);
            });
        });
        
        // Botão iniciar batalha
        startButton.addEventListener('click', () => {
            this.playerCharacter = selectedPlayer;
            this.enemyCharacter = selectedEnemy;
            
            // Remover overlay
            document.getElementById('character-selection-overlay').remove();
            
            // Reinicializar sistema com personagens selecionados
            this.initializeAstralCharges();
        });
    }

    checkStartBattle(player, enemy, button) {
        if (player && enemy) {
            button.disabled = false;
            button.textContent = `🚀 ${player.name} VS ${enemy.name}`;
        }
    }

    updateBattleInterface() {
        // Atualizar nomes dos personagens
        const playerName = document.getElementById('player-name');
        const enemyName = document.querySelector('.enemy-name') || document.querySelector('[data-enemy-name]');
        
        if (playerName) {
            playerName.textContent = `${this.playerCharacter.name} (${this.playerCharacter.classe})`;
        }
        
        if (enemyName) {
            enemyName.textContent = `${this.enemyCharacter.name} (${this.enemyCharacter.classe})`;
        }
        
        // Atualizar HP real
        this.playerHP = this.playerCharacter.hp;
        this.playerMaxHP = this.playerCharacter.maxHP;
        this.enemyHP = this.enemyCharacter.hp;
        this.enemyMaxHP = this.enemyCharacter.maxHP;
        
        // Atualizar barras de HP
        this.updateHealthBars();
    }

    updateHealthBars() {
        const playerHPBar = document.querySelector('.player-hp-bar');
        const enemyHPBar = document.querySelector('.enemy-hp-bar');
        const playerHPText = document.querySelector('.player-hp-text');
        const enemyHPText = document.querySelector('.enemy-hp-text');
        
        if (playerHPBar) {
            const playerHPPercent = (this.playerHP / this.playerMaxHP) * 100;
            playerHPBar.style.width = `${playerHPPercent}%`;
        }
        
        if (enemyHPBar) {
            const enemyHPPercent = (this.enemyHP / this.enemyMaxHP) * 100;
            enemyHPBar.style.width = `${enemyHPPercent}%`;
        }
        
        if (playerHPText) {
            playerHPText.textContent = `${this.playerHP}/${this.playerMaxHP}`;
        }
        
        if (enemyHPText) {
            enemyHPText.textContent = `${this.enemyHP}/${this.enemyMaxHP}`;
        }
    }

    showCriticalEffect() {
        const playerSprite = document.querySelector('.player-sprite');
        if (playerSprite) {
            const criticalText = document.createElement('div');
            criticalText.className = 'critical-hit';
            criticalText.textContent = 'CRÍTICO!';
            criticalText.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 1000;
                pointer-events: none;
            `;
            
            playerSprite.appendChild(criticalText);
            
            setTimeout(() => {
                if (playerSprite.contains(criticalText)) {
                    playerSprite.removeChild(criticalText);
                }
            }, 2000);
        }
    }

    showDamageEffect(damage) {
        const enemySprite = document.querySelector('.enemy-sprite');
        if (enemySprite) {
            const damageText = document.createElement('div');
            damageText.className = 'damage-number';
            damageText.textContent = `-${damage}`;
            damageText.style.cssText = `
                position: absolute;
                top: 30%;
                left: 50%;
                transform: translateX(-50%);
                z-index: 1000;
                pointer-events: none;
            `;
            
            enemySprite.appendChild(damageText);
            
            setTimeout(() => {
                if (enemySprite.contains(damageText)) {
                    enemySprite.removeChild(damageText);
                }
            }, 1500);
        }
        
        // Screen shake effect
        this.shakeScreen();
    }

    playAttackAnimation() {
        const attackBtn = document.getElementById('attack-btn');
        const playerSprite = document.querySelector('.player-sprite');
        const particles = document.getElementById('attack-particles');
        
        if (attackBtn) {
            attackBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                attackBtn.style.transform = '';
            }, 200);
        }
        
        if (playerSprite) {
            playerSprite.style.transform = 'translateX(20px) scale(1.1)';
            setTimeout(() => {
                playerSprite.style.transform = '';
            }, 600);
        }
        
        if (particles) {
            particles.style.opacity = '1';
            setTimeout(() => {
                particles.style.opacity = '0';
            }, 1000);
        }
    }

    playDefendAnimation() {
        const defendBtn = document.getElementById('defend-btn');
        const playerSprite = document.querySelector('.player-sprite');
        
        if (defendBtn) {
            this.pulseElement(defendBtn);
        }
        
        if (playerSprite) {
            playerSprite.style.filter = 'brightness(1.3) drop-shadow(0 0 20px #667eea)';
            setTimeout(() => {
                playerSprite.style.filter = '';
            }, 1000);
        }
    }

    playMeditateAnimation() {
        const meditateBtn = document.getElementById('meditate-btn');
        const playerSprite = document.querySelector('.player-sprite');
        const animaParticles = document.getElementById('anima-particles');
        
        if (meditateBtn) {
            this.pulseElement(meditateBtn);
        }
        
        if (playerSprite) {
            playerSprite.style.filter = 'brightness(1.2) drop-shadow(0 0 25px #10b981)';
            setTimeout(() => {
                playerSprite.style.filter = '';
            }, 1500);
        }
        
        if (animaParticles) {
            animaParticles.style.opacity = '1';
            setTimeout(() => {
                animaParticles.style.opacity = '0.6';
            }, 1500);
        }
    }

    healPlayer(percentage) {
        const healthBar = document.getElementById('player-health-bar');
        const hpDisplay = document.getElementById('player-hp');
        const maxHpDisplay = document.getElementById('player-max-hp');
        
        if (healthBar && hpDisplay && maxHpDisplay) {
            const maxHp = parseInt(maxHpDisplay.textContent);
            const currentHp = parseInt(hpDisplay.textContent);
            const healAmount = Math.round(maxHp * (percentage / 100));
            const newHp = Math.min(currentHp + healAmount, maxHp);
            
            hpDisplay.textContent = newHp;
            healthBar.style.width = `${(newHp / maxHp) * 100}%`;
            
            this.showHealEffect(healAmount);
        }
    }

    showHealEffect(amount) {
        const playerSprite = document.querySelector('.player-sprite');
        if (playerSprite) {
            const healText = document.createElement('div');
            healText.className = 'heal-number';
            healText.textContent = `+${amount}`;
            healText.style.cssText = `
                position: absolute;
                top: 20%;
                left: 50%;
                transform: translateX(-50%);
                z-index: 1000;
                pointer-events: none;
                color: #10b981;
                font-size: 20px;
                font-weight: 900;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            `;
            
            playerSprite.appendChild(healText);
            
            setTimeout(() => {
                if (playerSprite.contains(healText)) {
                    playerSprite.removeChild(healText);
                }
            }, 1500);
        }
    }

    restoreAnima(percentage) {
        const animaBar = document.getElementById('player-anima-bar');
        const animaDisplay = document.getElementById('player-anima');
        const maxAnimaDisplay = document.getElementById('player-max-anima');
        
        if (animaBar && animaDisplay && maxAnimaDisplay) {
            const maxAnima = parseInt(maxAnimaDisplay.textContent);
            const currentAnima = parseInt(animaDisplay.textContent);
            const restoreAmount = Math.round(maxAnima * (percentage / 100));
            const newAnima = Math.min(currentAnima + restoreAmount, maxAnima);
            
            animaDisplay.textContent = newAnima;
            animaBar.style.width = `${(newAnima / maxAnima) * 100}%`;
        }
    }

    updateBattleStats(damage) {
        this.totalDamageDealt += damage;
        this.totalAttacks++;
        
        const avgDamageElement = document.getElementById('avg-damage');
        const currentTurnElement = document.getElementById('current-turn');
        const accuracyElement = document.getElementById('accuracy');
        
        if (avgDamageElement) {
            avgDamageElement.textContent = Math.round(this.totalDamageDealt / this.totalAttacks);
        }
        
        if (currentTurnElement) {
            currentTurnElement.textContent = this.currentTurn;
        }
        
        if (accuracyElement) {
            const accuracy = Math.round((this.totalAttacks / this.currentTurn) * 100);
            accuracyElement.textContent = `${Math.min(accuracy, 100)}%`;
        }
        
        this.currentTurn++;
    }

    logPremiumMessage(message, type = 'player') {
        const battleLog = document.getElementById('battle-log');
        if (!battleLog) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = `log-message ${type}-message`;
        
        const icon = this.getMessageIcon(type);
        messageElement.innerHTML = `
            <span class="message-icon">${icon}</span>
            <span class="message-text">${message}</span>
            <div class="message-glow"></div>
        `;
        
        battleLog.appendChild(messageElement);
        
        // Auto scroll to bottom
        battleLog.scrollTop = battleLog.scrollHeight;
        
        // Show new messages indicator
        this.showNewMessagesIndicator();
    }

    getMessageIcon(type) {
        const icons = {
            'player': '⚔️',
            'enemy': '👹',
            'system': '⚙️',
            'dragon': '🐉',
            'astral': '🌟',
            'restoration': '💚',
            'damage': '💥',
            'critical': '💀'
        };
        return icons[type] || '📢';
    }

    showNewMessagesIndicator() {
        const indicator = document.getElementById('new-messages-indicator');
        if (indicator) {
            indicator.style.display = 'block';
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 3000);
        }
    }

    clearBattleLog() {
        const battleLog = document.getElementById('battle-log');
        if (battleLog) {
            battleLog.innerHTML = `
                <div class="log-message system-message">
                    <span class="message-icon">🗑️</span>
                    <span class="message-text">Log de batalha limpo!</span>
                    <div class="message-glow"></div>
                </div>
            `;
        }
    }

    scrollLogToBottom() {
        const battleLog = document.getElementById('battle-log');
        if (battleLog) {
            battleLog.scrollTo({
                top: battleLog.scrollHeight,
                behavior: 'smooth'
            });
        }
    }

    showAttackPreview() {
        if (this.isLutadorClass() && this.dragonCadenceCombo > 0) {
            const nextDamage = this.calculatePremiumDamage();
            this.showToast(`🐉 Próximo ataque: ~${nextDamage} dano (+${this.dragonCadencePower}%)`, 'info');
        }
    }

    hideAttackPreview() {
        // Hide any preview tooltips
    }

    startBackgroundAnimations() {
        // Subtle background particles
        this.createBackgroundParticles();
        
        // Periodic astral charge glow
        setInterval(() => {
            this.astralChargesGlow();
        }, 5000);
    }

    createBackgroundParticles() {
        const arena = document.querySelector('.battle-arena');
        if (!arena) return;
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'bg-particle';
            particle.style.cssText = `
                position: absolute;
                width: 2px;
                height: 2px;
                background: rgba(65, 234, 212, 0.3);
                border-radius: 50%;
                pointer-events: none;
                z-index: 1;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: bgParticleFloat ${5 + Math.random() * 5}s ease-in-out infinite;
            `;
            
            arena.appendChild(particle);
        }
        
        // Add CSS for background particles
        if (!document.getElementById('bg-particles-style')) {
            const style = document.createElement('style');
            style.id = 'bg-particles-style';
            style.textContent = `
                @keyframes bgParticleFloat {
                    0%, 100% { 
                        transform: translateY(0px) rotate(0deg); 
                        opacity: 0.3; 
                    }
                    50% { 
                        transform: translateY(-20px) rotate(180deg); 
                        opacity: 0.6; 
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    astralChargesGlow() {
        const activeCharges = document.querySelectorAll('.astral-charge.active');
        activeCharges.forEach((charge, index) => {
            setTimeout(() => {
                charge.style.filter = 'brightness(1.5) drop-shadow(0 0 15px #41eadc)';
                setTimeout(() => {
                    charge.style.filter = '';
                }, 500);
            }, index * 100);
        });
    }

    setupMobileOptimizations() {
        // Touch feedback
        const buttons = document.querySelectorAll('.action-btn');
        buttons.forEach(button => {
            button.addEventListener('touchstart', (e) => {
                button.style.transform = 'scale(0.95)';
                navigator.vibrate && navigator.vibrate(50);
            });
            
            button.addEventListener('touchend', (e) => {
                setTimeout(() => {
                    button.style.transform = '';
                }, 150);
            });
        });
        
        // Prevent zoom on double tap
        let lastTap = 0;
        document.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 500 && tapLength > 0) {
                e.preventDefault();
            }
            lastTap = currentTime;
        });
    }

    setupPWAFeatures() {
        // Wake lock for battle sessions
        if ('wakeLock' in navigator) {
            this.wakeLock = null;
            this.requestWakeLock();
        }
        
        // Network status
        window.addEventListener('online', () => {
            this.logPremiumMessage('📶 Conexão restaurada!', 'system');
        });
        
        window.addEventListener('offline', () => {
            this.logPremiumMessage('📵 Modo offline ativo!', 'system');
        });
        
        // Battery status
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                if (battery.level < 0.2) {
                    this.logPremiumMessage('🔋 Bateria baixa! Considere economizar energia.', 'system');
                }
            });
        }
    }

    async requestWakeLock() {
        try {
            this.wakeLock = await navigator.wakeLock.request('screen');
            console.log('⚡ Wake lock ativo - tela não irá desligar durante a batalha');
        } catch (err) {
            console.log('❌ Wake lock não suportado:', err.message);
        }
    }

    // Utility animation methods
    animateElementIn(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 50);
    }

    pulseElement(element) {
        element.style.transform = 'scale(1.1)';
        element.style.filter = 'brightness(1.3)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
            element.style.filter = 'brightness(1)';
        }, 200);
    }

    shakeElement(element) {
        element.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
        
        // Add shake animation if not exists
        if (!document.getElementById('shake-animation')) {
            const style = document.createElement('style');
            style.id = 'shake-animation';
            style.textContent = `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    shakeScreen() {
        document.body.style.animation = 'screenShake 0.3s ease-in-out';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 300);
        
        // Add screen shake animation
        if (!document.getElementById('screen-shake-animation')) {
            const style = document.createElement('style');
            style.id = 'screen-shake-animation';
            style.textContent = `
                @keyframes screenShake {
                    0%, 100% { transform: translate(0); }
                    25% { transform: translate(-2px, 0); }
                    75% { transform: translate(2px, 0); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Vibration on mobile
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'premium-toast';
        
        const colors = {
            'info': '#41eadc',
            'success': '#10b981',
            'error': '#ef4444',
            'warning': '#f59e0b'
        };
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10001;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    setupTouchEvents() {
        // Add touch ripple effect
        document.addEventListener('touchstart', (e) => {
            if (e.target.matches('.action-btn, .astral-charge, .log-btn')) {
                this.createRipple(e);
            }
        });
    }

    createRipple(event) {
        const element = event.target;
        const rect = element.getBoundingClientRect();
        const ripple = document.createElement('div');
        
        const size = Math.max(rect.width, rect.height);
        const x = event.touches ? event.touches[0].clientX - rect.left - size/2 : event.clientX - rect.left - size/2;
        const y = event.touches ? event.touches[0].clientY - rect.top - size/2 : event.clientY - rect.top - size/2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            pointer-events: none;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            z-index: 1000;
        `;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => {
            if (element.contains(ripple)) {
                element.removeChild(ripple);
            }
        }, 600);
        
        // Add ripple animation
        if (!document.getElementById('ripple-animation')) {
            const style = document.createElement('style');
            style.id = 'ripple-animation';
            style.textContent = `
                @keyframes ripple {
                    0% { transform: scale(0); opacity: 1; }
                    100% { transform: scale(1); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Public API methods for integration with battle.js
    consumeAstralChargeForAction() {
        return this.consumeAstralCharge();
    }

    updateDragonCadenceCombo() {
        this.updateDragonCadence();
    }

    breakDragonCadenceCombo() {
        this.resetDragonCadence();
    }

    addBattleLogEntry(message, type = 'system') {
        this.logPremiumMessage(message, type);
    }

    showDamageNumber(damage, isCritical = false) {
        if (isCritical) {
            this.showCriticalEffect();
        }
        this.showDamageEffect(damage);
    }

    updateHealthBar(currentHp, maxHp, isPlayer = true) {
        const healthBar = document.getElementById(isPlayer ? 'player-health-bar' : 'enemy-health-bar');
        const hpDisplay = document.getElementById(isPlayer ? 'player-hp' : 'enemy-hp');
        
        if (healthBar && hpDisplay) {
            hpDisplay.textContent = currentHp;
            healthBar.style.width = `${(currentHp / maxHp) * 100}%`;
        }
    }

    updateAnimaBar(currentAnima, maxAnima) {
        const animaBar = document.getElementById('player-anima-bar');
        const animaDisplay = document.getElementById('player-anima');
        
        if (animaBar && animaDisplay) {
            animaDisplay.textContent = currentAnima;
            animaBar.style.width = `${(currentAnima / maxAnima) * 100}%`;
        }
    }

    getAstralCharges() {
        return this.astralCharges;
    }

    getDragonCadenceCombo() {
        return this.dragonCadenceCombo;
    }

    getDragonCadencePower() {
        return this.dragonCadencePower;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 Inicializando Battle Premium System...');
    window.battlePremium = new BattlePremiumEffects();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BattlePremiumEffects;
}