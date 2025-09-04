/**
 * Giovanni da Ferrara - Mestre Inventor do Renascimento
 * Cultura: Italiana Renascentista | Classe: Inventor | Elemento: Engenharia Mecânica
 */

class GiovannaDaFerraraSkills {
    constructor() {
        this.characterName = "Giovanni da Ferrara";
        this.characterId = "9A8B7C6D5E";
        this.culture = "Italiana Renascentista";
        this.classe = "Inventor";
        this.element = "Engenharia Mecânica";
        
        // Sistema de invenções disponíveis
        this.inventions = {
            ballista: { 
                name: "Balista Mecânica", 
                damage: 120, 
                accuracy: 0.9,
                type: "siege_weapon",
                description: "Balista de precisão com mecanismo aprimorado"
            },
            flying_machine: { 
                name: "Máquina Voadora", 
                evasion: 60, 
                mobility: 80,
                type: "aerial_device",
                description: "Dispositivo de voo baseado em estudos de Leonardo"
            },
            clockwork_armor: { 
                name: "Armadura Mecânica", 
                defense: 50, 
                strength: 40,
                type: "mechanical_enhancement",
                description: "Armadura com mecanismos de engrenagem"
            },
            alchemical_bombs: { 
                name: "Bombas Alquímicas", 
                areaEffect: true, 
                damage: 80,
                type: "explosive_device",
                description: "Explosivos com compostos alquímicos"
            }
        };
        
        // Nível de maestria nas artes renascentistas
        this.renaissanceMastery = {
            engineering: 1,
            alchemy: 1,
            artistry: 1,
            philosophy: 1
        };
    }

    /**
     * ⚙️ Balista da Precisão Florentina
     * Dispara projétil de precisão usando engenharia avançada
     */
    balistaDaPrecisaoFlorentina(battle, caster, target) {
        const skillData = {
            name: "⚙️ Balista da Precisão Florentina",
            description: "Dispara projétil de precisão usando engenharia avançada",
            manaCost: 25,
            baseDamage: 100,
            type: "mechanical_weapon",
            element: "engineering"
        };

        if (caster.currentMP < skillData.manaCost) {
            throw new Error('Energia de criação insuficiente');
        }

        caster.currentMP -= skillData.manaCost;

        // Inicializar sistema renascentista
        if (!caster.renaissanceState) {
            caster.renaissanceState = { 
                activeInventions: [], 
                inspiration: 50, 
                engineeringLevel: 1,
                workshop: {
                    materials: 100,
                    blueprints: [],
                    masterpieces: 0
                }
            };
        }

        let damage = skillData.baseDamage;

        // Precisão renascentista: bônus baseado no nível de engenharia
        const engineeringBonus = caster.renaissanceState.engineeringLevel * 0.15;
        damage = Math.floor(damage * (1 + engineeringBonus));

        // Análise do alvo (estudo anatômico)
        const anatomyStudy = Math.random() < 0.4; // 40% chance
        if (anatomyStudy) {
            damage = Math.floor(damage * 1.6); // +60% por precisão anatômica
            
            // Aplicar efeito de "Ponto Vital Identificado"
            target.statusEffects = target.statusEffects || [];
            target.statusEffects.push({
                type: 'vital_point_marked',
                name: 'Ponto Vital Marcado',
                duration: 3,
                criticalVulnerability: 0.3,
                description: 'Anatomia estudada - recebe 30% mais dano crítico'
            });
            
            battle.addToLog('analysis', `📐 Giovanni identifica pontos vitais com precisão científica!`);
        }

        // Construir a balista (adiciona à lista de invenções ativas)
        if (!caster.renaissanceState.activeInventions.includes('ballista')) {
            caster.renaissanceState.activeInventions.push('ballista');
            
            // Buff permanente enquanto a balista estiver ativa
            caster.statusEffects = caster.statusEffects || [];
            caster.statusEffects.push({
                type: 'ballista_setup',
                name: 'Balista Posicionada',
                duration: 6,
                rangedBonus: 30,
                accuracyBonus: 0.25,
                siegeCapability: true,
                description: 'Balista ativa - +30 dano à distância, +25% precisão'
            });
        }

        // Ganhar experiência em engenharia
        caster.renaissanceState.engineeringLevel = Math.min(caster.renaissanceState.engineeringLevel + 1, 10);
        caster.renaissanceState.inspiration = Math.min(caster.renaissanceState.inspiration + 10, 100);

        // Chance de criar múltiplos projéteis (rajada mecânica)
        const multiShotChance = 0.3 + (engineeringBonus * 0.5);
        let totalDamage = damage;
        
        if (Math.random() < multiShotChance) {
            const extraShots = Math.floor(Math.random() * 3) + 1; // 1-3 tiros extras
            totalDamage = Math.floor(damage * (1 + extraShots * 0.4)); // +40% por tiro extra
            battle.addToLog('mechanism', `⚙️ O mecanismo dispara ${extraShots + 1} projéteis em sequência!`);
        }

        return {
            damage: totalDamage,
            manaCost: skillData.manaCost,
            effects: {
                animation: 'ballista_shot',
                mechanicalGears: true,
                precisionTarget: true,
                soundEffect: 'crossbow_release'
            },
            statusApplied: ['ballista_setup', 'vital_point_marked'],
            culturalNarrative: anatomyStudy ? 
                `⚙️ "Eureka!" Giovanni combina arte, ciência e engenharia em um tiro de precisão mortal!` :
                `🎯 Com a precisão de um mestre artesão, Giovanni dispara sua invenção mecânica!`
        };
    }

    /**
     * 🛠️ Oficina Portátil Renascentista
     * Monta uma oficina temporária para criar dispositivos em batalha
     */
    oficinaPortatilRenascentista(battle, caster, target) {
        const skillData = {
            name: "🛠️ Oficina Portátil Renascentista",
            description: "Monta uma oficina temporária para criar dispositivos em batalha",
            manaCost: 50,
            type: "setup_ability",
            element: "creative_engineering"
        };

        if (caster.currentMP < skillData.manaCost) {
            throw new Error('Inspiração insuficiente para montar oficina');
        }

        caster.currentMP -= skillData.manaCost;

        // Sistema renascentista
        caster.renaissanceState = caster.renaissanceState || { 
            activeInventions: [], 
            inspiration: 50, 
            engineeringLevel: 1,
            workshop: { materials: 100, blueprints: [], masterpieces: 0 }
        };

        // Montar oficina
        caster.renaissanceState.workshop.materials = Math.min(caster.renaissanceState.workshop.materials + 80, 200);
        caster.renaissanceState.inspiration = Math.min(caster.renaissanceState.inspiration + 25, 100);

        // Buff da oficina ativa
        caster.statusEffects = caster.statusEffects || [];
        caster.statusEffects.push({
            type: 'renaissance_workshop',
            name: 'Oficina Renascentista',
            duration: 8,
            inventionSpeedBonus: 2,
            qualityBonus: 0.3,
            materialEfficiency: 0.4,
            description: 'Oficina ativa - invenções 2x mais rápidas, +30% qualidade, -40% custo material'
        });

        // Criar 3 dispositivos aleatórios imediatamente
        const availableDevices = ['smoke_bomb', 'spring_trap', 'mechanical_bird'];
        const createdDevices = [];
        
        for (let i = 0; i < 3; i++) {
            const deviceType = availableDevices[Math.floor(Math.random() * availableDevices.length)];
            createdDevices.push(deviceType);
            
            if (!caster.renaissanceState.activeInventions.includes(deviceType)) {
                caster.renaissanceState.activeInventions.push(deviceType);
            }
        }

        // Efeitos dos dispositivos criados
        const deviceEffects = {
            smoke_bomb: {
                effect: 'concealment',
                bonus: 40,
                description: 'Bomba de fumaça - +40 evasão'
            },
            spring_trap: {
                effect: 'counter_trap',
                damage: Math.floor(caster.attack * 0.7),
                description: 'Armadilha de mola - contra-ataque automático'
            },
            mechanical_bird: {
                effect: 'reconnaissance',
                accuracyBonus: 0.3,
                description: 'Pássaro mecânico - +30% precisão do grupo'
            }
        };

        // Aplicar efeitos dos dispositivos
        createdDevices.forEach(device => {
            const deviceData = deviceEffects[device];
            if (deviceData.effect === 'concealment') {
                caster.statusEffects.push({
                    type: 'smoke_concealment',
                    name: 'Cortina de Fumaça',
                    duration: 4,
                    evasionBonus: deviceData.bonus,
                    description: deviceData.description
                });
            }
        });

        // Curar HP baseado na inspiração (satisfação de criar)
        const inspirationHeal = Math.floor(caster.maxHP * (caster.renaissanceState.inspiration / 100) * 0.2);
        caster.currentHP = Math.min(caster.maxHP, caster.currentHP + inspirationHeal);

        // Buff para aliados próximos (inspiração renascentista)
        if (battle.allies) {
            battle.allies.forEach(ally => {
                if (ally !== caster) {
                    ally.statusEffects = ally.statusEffects || [];
                    ally.statusEffects.push({
                        type: 'renaissance_inspiration',
                        name: 'Inspiração Renascentista',
                        duration: 5,
                        creativityBonus: 20,
                        learningRate: 1.3,
                        description: 'Inspirado pela genialidade - +20 em todas habilidades'
                    });
                }
            });
        }

        return {
            damage: 0,
            healing: inspirationHeal,
            manaCost: skillData.manaCost,
            effects: {
                animation: 'workshop_assembly',
                gearSteam: true,
                blueprintGlow: true,
                soundEffect: 'workshop_sounds'
            },
            statusApplied: ['renaissance_workshop', 'smoke_concealment', 'renaissance_inspiration'],
            inventionsCreated: createdDevices,
            areaEffect: true,
            culturalNarrative: `🛠️ "L'arte è la regina di tutte le scienze!" Giovanni monta sua oficina e a genialidade renascentista floresce!`
        };
    }

    /**
     * 🎨 Máquina Voadora de Leonardo
     * Voa temporariamente usando protótipo baseado nos estudos de da Vinci
     */
    maquinaVoadoraDeLeonardo(battle, caster, target) {
        const skillData = {
            name: "🎨 Máquina Voadora de Leonardo",
            description: "Voa temporariamente usando protótipo baseado nos estudos de da Vinci",
            manaCost: 60,
            baseDamage: 90,
            type: "aerial_invention",
            element: "renaissance_flight"
        };

        if (caster.currentMP < skillData.manaCost) {
            throw new Error('Inspiração insuficiente para voar');
        }

        caster.currentMP -= skillData.manaCost;

        // Sistema renascentista
        caster.renaissanceState = caster.renaissanceState || { 
            activeInventions: [], 
            inspiration: 50, 
            engineeringLevel: 1
        };

        let damage = skillData.baseDamage;

        // Ativar máquina voadora
        if (!caster.renaissanceState.activeInventions.includes('flying_machine')) {
            caster.renaissanceState.activeInventions.push('flying_machine');
        }

        // Buff de voo renascentista
        caster.statusEffects = caster.statusEffects || [];
        caster.statusEffects.push({
            type: 'leonardo_flight',
            name: 'Voo de Leonardo',
            duration: 5,
            aerialAdvantage: true,
            evasionBonus: 60,
            mobilityBonus: 80,
            heightAdvantage: 2,
            description: 'Voando com máquina de Leonardo - +60 evasão, +80 mobilidade, vantagem aérea'
        });

        // Ataque de mergulho (dive attack)
        const diveAttack = Math.random() < 0.7; // 70% chance
        if (diveAttack) {
            damage = Math.floor(damage * 1.8); // +80% dano no mergulho
            
            // Chance de atordoar pela surpresa do ataque aéreo
            if (Math.random() < 0.5) {
                target.statusEffects = target.statusEffects || [];
                target.statusEffects.push({
                    type: 'aerial_stun',
                    name: 'Atordoado pelo Céu',
                    duration: 2,
                    actionReduction: 0.5,
                    description: 'Surpreso pelo ataque aéreo - 50% chance de perder ação'
                });
            }
            
            battle.addToLog('aerial', `🎨 Giovanni mergulha dos céus como um verdadeiro aviador renascentista!`);
        }

        // Inspiração artística: cria sketch do campo de batalha
        const artisticInspiration = Math.random() < 0.4; // 40% chance
        if (artisticInspiration) {
            caster.renaissanceState.inspiration = Math.min(caster.renaissanceState.inspiration + 20, 100);
            
            // Sketch revela pontos fracos de todos os inimigos
            if (battle.enemies) {
                battle.enemies.forEach(enemy => {
                    enemy.statusEffects = enemy.statusEffects || [];
                    enemy.statusEffects.push({
                        type: 'anatomical_study',
                        name: 'Estudo Anatômico',
                        duration: 4,
                        defensiveWeakness: 0.25,
                        description: 'Anatomia esboçada - recebe 25% mais dano'
                    });
                });
            }
            
            battle.addToLog('art', `🎨 Do alto, Giovanni esboça a anatomia dos inimigos com precisão artística!`);
        }

        // Evolução da engenharia aeronáutica
        caster.renaissanceState.engineeringLevel = Math.min(caster.renaissanceState.engineeringLevel + 2, 10);

        return {
            damage: damage,
            manaCost: skillData.manaCost,
            effects: {
                animation: 'leonardo_flight',
                wingSpread: true,
                aerialTrails: true,
                soundEffect: 'wind_wings'
            },
            statusApplied: ['leonardo_flight', 'aerial_stun', 'anatomical_study'],
            areaEffect: artisticInspiration,
            culturalNarrative: diveAttack ? 
                `🎨 "Volare! Come un uccello!" Giovanni voa pelos ares e mergulha com graça renascentista!` :
                `✨ A máquina voadora eleva Giovanni aos céus, realizando o sonho eterno da humanidade!`
        };
    }

    // Processamento de efeitos únicos

    processRenaissanceWorkshopEffect(character, battle) {
        const workshopEffect = character.statusEffects?.find(e => e.type === 'renaissance_workshop');
        if (workshopEffect) {
            // Produção contínua de pequenos dispositivos
            if (Math.random() < 0.3) { // 30% chance por turno
                const newDevice = ['healing_potion', 'smoke_pellet', 'flash_powder'][Math.floor(Math.random() * 3)];
                
                return {
                    deviceCreated: newDevice,
                    message: `🛠️ A oficina de Giovanni produz: ${newDevice}!`
                };
            }
        }
        return null;
    }

    processLeonardoFlightAdvantage(character, battle, incomingAttack) {
        const flightEffect = character.statusEffects?.find(e => e.type === 'leonardo_flight');
        if (flightEffect) {
            // Vantagem aérea: resistência a ataques terrestres
            const evasionBonus = flightEffect.evasionBonus;
            const groundAttackReduction = incomingAttack.isGroundBased ? 0.4 : 0.1;
            
            return {
                damageReduction: Math.floor(incomingAttack.damage * groundAttackReduction),
                evasionBonus: evasionBonus,
                message: flightEffect.heightAdvantage > 1 ? 
                    `🎨 Giovanni evita o ataque voando ainda mais alto!` :
                    `✈️ A máquina voadora proporciona vantagem tática!`
            };
        }
        return null;
    }

    // Utilitários

    getActiveInventions(character) {
        return character.renaissanceState ? character.renaissanceState.activeInventions : [];
    }

    getRenaissanceMasteryLevel(character) {
        if (!character.renaissanceState) return 1;
        
        const total = character.renaissanceState.engineeringLevel + 
                     (character.renaissanceState.inspiration / 20);
        return Math.min(Math.floor(total / 2), 10);
    }

    canCreateInvention(character, inventionType) {
        if (!character.renaissanceState) return false;
        
        const workshopActive = character.statusEffects?.some(e => e.type === 'renaissance_workshop');
        const hasMaterials = character.renaissanceState.workshop?.materials >= 20;
        
        return workshopActive && hasMaterials;
    }

    // Metadata

    getSkillsMetadata() {
        return {
            characterId: this.characterId,
            characterName: this.characterName,
            culture: this.culture,
            skills: [
                {
                    id: 'balista_da_precisao_florentina',
                    name: '⚙️ Balista da Precisão Florentina',
                    manaCost: 25,
                    damage: 100,
                    type: 'mechanical_weapon',
                    cooldown: 1,
                    description: 'Dispara projétil de precisão usando engenharia avançada'
                },
                {
                    id: 'oficina_portatil_renascentista',
                    name: '🛠️ Oficina Portátil Renascentista',
                    manaCost: 50,
                    damage: 0,
                    type: 'setup_ability',
                    cooldown: 3,
                    description: 'Monta uma oficina temporária para criar dispositivos em batalha'
                },
                {
                    id: 'maquina_voadora_de_leonardo',
                    name: '🎨 Máquina Voadora de Leonardo',
                    manaCost: 60,
                    damage: 90,
                    type: 'aerial_invention',
                    cooldown: 2,
                    description: 'Voa temporariamente usando protótipo baseado nos estudos de da Vinci'
                }
            ],
            culturalElements: [
                'Genialidade renascentista italiana',
                'Engenharia e invenções de Leonardo da Vinci',
                'Arte, ciência e filosofia integradas',
                'Oficinas e ateliês renascentistas',
                'Precisão anatômica e estudos científicos'
            ],
            inventionSystem: {
                availableInventions: Object.keys(this.inventions),
                masteryAreas: ['engineering', 'alchemy', 'artistry', 'philosophy'],
                maxWorkshopMaterials: 200,
                inspirationRange: [0, 100]
            },
            inventions: this.inventions
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GiovannaDaFerraraSkills;
} else {
    window.GiovannaDaFerraraSkills = GiovannaDaFerraraSkills;
}