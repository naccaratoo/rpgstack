/**
 * Itzel Nahualli - Metamorfa das Sombras Sagradas
 * Cultura: Azteca/Mexica | Classe: Nahualli | Elemento: Transformação Espiritual
 */

class ItzelNahualliSkills {
    constructor() {
        this.characterName = "Itzel Nahualli";
        this.characterId = "2F3E4D5C6B";
        this.culture = "Azteca/Mexica";
        this.classe = "Nahualli";
        this.element = "Transformação Espiritual";
        
        // Formas animais disponíveis para transformação
        this.animalForms = {
            jaguar: { 
                name: "Ocelotl", 
                attackBonus: 40, 
                speedBonus: 30,
                ability: "shadowStrike",
                description: "Jaguar das sombras - força e furtividade"
            },
            eagle: { 
                name: "Cuauhtli", 
                evasionBonus: 50, 
                visionBonus: 40,
                ability: "skyDive",
                description: "Águia dourada - velocidade e visão aguçada"
            },
            serpent: { 
                name: "Coatl", 
                poisonPower: 60, 
                wisdomBonus: 35,
                ability: "venomStrike",
                description: "Serpente emplumada - veneno e sabedoria"
            },
            coyote: { 
                name: "Coyotl", 
                cunningBonus: 45, 
                trickPower: 50,
                ability: "illusionTrick",
                description: "Coyote astuto - engano e travessuras"
            }
        };
        
        // Sistema de conexão espiritual
        this.spiritualConnection = 0; // 0-100
    }

    /**
     * 🐆 Metamorfose do Ocelotl
     * Transforma-se na forma sagrada do jaguar das sombras
     */
    metamorfoseDoOcelotl(battle, caster, target) {
        const skillData = {
            name: "🐆 Metamorfose do Ocelotl",
            description: "Transforma-se na forma sagrada do jaguar das sombras",
            animaCost: 35,
            baseDamage: 80,
            type: "transformation",
            element: "shadow_spirit"
        };

        if (caster.currentAnima < skillData.animaCost) {
            throw new Error('Energia espiritual insuficiente para a metamorfose');
        }

        caster.currentAnima -= skillData.animaCost;

        // Inicializar sistema de transformação
        if (!caster.nahualliState) {
            caster.nahualliState = { 
                currentForm: 'human', 
                transformationLevel: 1, 
                spiritualEnergy: 50,
                lastTransformation: null 
            };
        }

        let damage = skillData.baseDamage;
        
        // Aplicar transformação em jaguar
        caster.nahualliState.currentForm = 'jaguar';
        caster.nahualliState.lastTransformation = 'ocelotl';
        caster.nahualliState.spiritualEnergy = Math.min(caster.nahualliState.spiritualEnergy + 15, 100);

        // Buff de forma jaguar
        caster.statusEffects = caster.statusEffects || [];
        caster.statusEffects.push({
            type: 'ocelotl_form',
            name: 'Forma do Ocelotl',
            duration: 4,
            attackBonus: 40,
            speedBonus: 30,
            shadowAfinity: 0.8,
            nightVision: true,
            description: 'Transformado em jaguar sagrado - +40 ataque, +30 velocidade, afinidade sombra'
        });

        // Habilidade especial: Ataque das Sombras
        const shadowStrikeChance = 0.6 + (caster.nahualliState.transformationLevel * 0.1);
        if (Math.random() < shadowStrikeChance) {
            damage = Math.floor(damage * 1.5); // +50% dano
            
            // Aplicar medo primal
            target.statusEffects = target.statusEffects || [];
            target.statusEffects.push({
                type: 'primal_fear',
                name: 'Medo Primal',
                duration: 3,
                accuracyReduction: 0.3,
                defenseReduction: 0.2,
                description: 'Aterrorizado pelo predador das sombras - -30% precisão, -20% defesa'
            });
            
            battle.addToLog('special', `🌙 O jaguar ataca das sombras com ferocidade ancestral!`);
        }

        // Ganhar experiência de transformação
        caster.nahualliState.transformationLevel = Math.min(caster.nahualliState.transformationLevel + 1, 10);

        return {
            damage: damage,
            animaCost: skillData.animaCost,
            effects: {
                animation: 'jaguar_transformation',
                shadowMist: true,
                animalRoar: true,
                soundEffect: 'jaguar_growl'
            },
            statusApplied: ['ocelotl_form', 'primal_fear'],
            culturalNarrative: `🐆 "In Ocelotl, in Teotl!" Itzel invoca os espíritos ancestrais e sua forma humana se dissolve em sombras felinas!`
        };
    }

    /**
     * 🦅 Voo da Águia Dourada
     * Transforma-se em águia e ataca do céu com precisão divina
     */
    vooDaAguiaDourada(battle, caster, target) {
        const skillData = {
            name: "🦅 Voo da Águia Dourada",
            description: "Transforma-se em águia e ataca do céu com precisão divina",
            animaCost: 40,
            baseDamage: 75,
            type: "aerial_transformation",
            element: "wind_spirit"
        };

        if (caster.currentAnima < skillData.animaCost) {
            throw new Error('Energia espiritual insuficiente para voar');
        }

        caster.currentAnima -= skillData.animaCost;

        // Sistema nahualli
        caster.nahualliState = caster.nahualliState || { 
            currentForm: 'human', 
            transformationLevel: 1, 
            spiritualEnergy: 50 
        };

        let damage = skillData.baseDamage;

        // Transformação em águia
        caster.nahualliState.currentForm = 'eagle';
        caster.nahualliState.lastTransformation = 'cuauhtli';

        // Buff de forma águia
        caster.statusEffects = caster.statusEffects || [];
        caster.statusEffects.push({
            type: 'cuauhtli_form',
            name: 'Forma do Cuauhtli',
            duration: 4,
            evasionBonus: 50,
            criticalBonus: 0.25,
            aerialAdvantage: true,
            description: 'Transformada em águia sagrada - +50 evasão, +25% crítico, vantagem aérea'
        });

        // Precisão aguçada: sempre acerta crítico se o inimigo estiver debilitado
        const targetHasDebuff = target.statusEffects && target.statusEffects.some(e => 
            e.type.includes('fear') || e.type.includes('poison') || e.type.includes('weakness')
        );

        if (targetHasDebuff) {
            damage = Math.floor(damage * (caster.critico || 2.5));
            battle.addToLog('critical', `🦅 A águia identifica a fraqueza e desfere golpe certeiro!`);
        }

        // Bônus baseado na altura (transformações anteriores)
        const heightBonus = caster.nahualliState.transformationLevel * 0.1;
        damage = Math.floor(damage * (1 + heightBonus));

        // Efeito especial: Vento Sagrado (reduz velocidade de todos os inimigos)
        if (battle.enemies) {
            battle.enemies.forEach(enemy => {
                if (enemy !== target) {
                    enemy.statusEffects = enemy.statusEffects || [];
                    enemy.statusEffects.push({
                        type: 'sacred_wind',
                        name: 'Vento Sagrado',
                        duration: 2,
                        speedReduction: 0.25,
                        description: 'Ventos místicos reduzem velocidade em 25%'
                    });
                }
            });
            battle.addToLog('area_effect', `🌪️ Ventos sagrados sopram pelo campo de batalha!`);
        }

        return {
            damage: damage,
            animaCost: skillData.animaCost,
            effects: {
                animation: 'eagle_dive',
                windTrails: true,
                goldenFeathers: true,
                soundEffect: 'eagle_cry'
            },
            statusApplied: ['cuauhtli_form', 'sacred_wind'],
            areaEffect: true,
            culturalNarrative: `🦅 Itzel se eleva aos céus como Cuauhtli e mergulha com a fúria dos ventos ancestrais!`
        };
    }

    /**
     * 🐍 Serpente Emplumada
     * Canaliza o poder de Quetzalcoatl através de transformação serpentina
     */
    serpenteEplumada(battle, caster, target) {
        const skillData = {
            name: "🐍 Serpente Emplumada",
            description: "Canaliza o poder de Quetzalcoatl através de transformação serpentina",
            animaCost: 45,
            baseDamage: 60,
            type: "divine_transformation",
            element: "feathered_serpent"
        };

        if (caster.currentAnima < skillData.animaCost) {
            throw new Error('Energia divina insuficiente');
        }

        caster.currentAnima -= skillData.animaCost;

        // Sistema nahualli
        caster.nahualliState = caster.nahualliState || { 
            currentForm: 'human', 
            transformationLevel: 1, 
            spiritualEnergy: 50 
        };

        let damage = skillData.baseDamage;

        // Transformação em serpente emplumada
        caster.nahualliState.currentForm = 'serpent';
        caster.nahualliState.lastTransformation = 'coatl';

        // Buff divino de Quetzalcoatl
        caster.statusEffects = caster.statusEffects || [];
        caster.statusEffects.push({
            type: 'coatl_wisdom',
            name: 'Sabedoria do Coatl',
            duration: 5,
            wisdomBonus: 35,
            animaRegeneration: 15,
            divineProtection: 0.3,
            description: 'Sabedoria da serpente emplumada - +35 sabedoria, regenera 15 MP/turno, 30% resistência mágica'
        });

        // Veneno sagrado: não mata, mas debilita severamente
        target.statusEffects = target.statusEffects || [];
        target.statusEffects.push({
            type: 'sacred_venom',
            name: 'Veneno Sagrado',
            duration: 4,
            damagePerTurn: Math.floor(target.maxHP * 0.08), // 8% HP por turno
            wisdomDrain: 20,
            healingReduction: 0.5,
            description: 'Veneno místico - 8% HP/turno, -20 sabedoria, -50% cura recebida'
        });

        // Cura espiritual para o grupo (se existir)
        let healingDone = 0;
        if (battle.allies) {
            const healAmount = Math.floor(caster.maxHP * 0.12); // 12% do HP máximo
            battle.allies.forEach(ally => {
                if (ally !== caster && ally.currentHP > 0) {
                    ally.currentHP = Math.min(ally.maxHP, ally.currentHP + healAmount);
                    healingDone += healAmount;
                }
            });
            if (healingDone > 0) {
                battle.addToLog('healing', `✨ A energia de Quetzalcoatl cura ${healingDone} HP dos aliados!`);
            }
        }

        // Sabedoria ancestral: chance de prever e counter próximo ataque
        caster.statusEffects.push({
            type: 'ancestral_foresight',
            name: 'Premonição Ancestral',
            duration: 3,
            counterChance: 0.4,
            counterDamage: Math.floor(caster.attack * 0.8),
            description: '40% chance de prever e contra-atacar'
        });

        return {
            damage: damage,
            healing: healingDone,
            animaCost: skillData.animaCost,
            effects: {
                animation: 'serpent_coil',
                featheredGlow: true,
                mysticVenom: true,
                soundEffect: 'serpent_hiss'
            },
            statusApplied: ['coatl_wisdom', 'sacred_venom', 'ancestral_foresight'],
            culturalNarrative: `🐍 "Quetzalcoatl, tlazohcamati!" Itzel se transforma na serpente emplumada, trazendo sabedoria e veneno divino!`
        };
    }

    // Processamento de efeitos especiais

    processNahualliFormChange(character, battle) {
        if (!character.nahualliState) return null;

        const form = character.nahualliState.currentForm;
        const formData = this.animalForms[form];
        
        if (formData) {
            return {
                activeForm: form,
                formBonuses: formData,
                transformationLevel: character.nahualliState.transformationLevel,
                spiritualEnergy: character.nahualliState.spiritualEnergy
            };
        }
        
        return null;
    }

    processAncestralForesightCounter(character, battle, incomingAttack) {
        const foresightEffect = character.statusEffects?.find(e => e.type === 'ancestral_foresight');
        if (foresightEffect && Math.random() < foresightEffect.counterChance) {
            return {
                counterDamage: foresightEffect.counterDamage,
                counterType: 'mystical',
                message: `🔮 Itzel previu o ataque e contra-ataca com sabedoria ancestral!`
            };
        }
        return null;
    }

    processSacredVenomDamage(character, battle) {
        const venomEffect = character.statusEffects?.find(e => e.type === 'sacred_venom');
        if (venomEffect) {
            const damage = venomEffect.damagePerTurn;
            character.currentHP = Math.max(1, character.currentHP - damage); // Não mata
            
            return {
                damageDealt: damage,
                message: `🐍 O veneno sagrado enfraquece mas não mata (${damage} dano)`
            };
        }
        return null;
    }

    // Utilitários

    getCurrentAnimalForm(character) {
        if (character.nahualliState && character.nahualliState.currentForm !== 'human') {
            return this.animalForms[character.nahualliState.currentForm];
        }
        return null;
    }

    getSpiritualConnectionLevel(character) {
        return character.nahualliState ? character.nahualliState.spiritualEnergy : 0;
    }

    canTransform(character, targetForm) {
        if (!character.nahualliState) return true;
        
        // Não pode transformar na mesma forma consecutivamente
        return character.nahualliState.lastTransformation !== targetForm;
    }

    // Metadata

    getSkillsMetadata() {
        return {
            characterId: this.characterId,
            characterName: this.characterName,
            culture: this.culture,
            skills: [
                {
                    id: 'metamorfose_do_ocelotl',
                    name: '🐆 Metamorfose do Ocelotl',
                    animaCost: 35,
                    damage: 80,
                    type: 'transformation',
                    cooldown: 1,
                    description: 'Transforma-se na forma sagrada do jaguar das sombras'
                },
                {
                    id: 'voo_da_aguia_dourada',
                    name: '🦅 Voo da Águia Dourada',
                    animaCost: 40,
                    damage: 75,
                    type: 'aerial_transformation',
                    cooldown: 2,
                    description: 'Transforma-se em águia e ataca do céu com precisão divina'
                },
                {
                    id: 'serpente_eplumada',
                    name: '🐍 Serpente Emplumada',
                    animaCost: 45,
                    damage: 60,
                    type: 'divine_transformation',
                    cooldown: 2,
                    description: 'Canaliza o poder de Quetzalcoatl através de transformação serpentina'
                }
            ],
            culturalElements: [
                'Nahualismo e xamanismo mexica',
                'Transformações em animais sagrados',
                'Conexão com Quetzalcoatl',
                'Jaguar, águia, serpente e coyote',
                'Sabedoria ancestral e venenos místicos'
            ],
            transformationSystem: {
                availableForms: Object.keys(this.animalForms),
                maxTransformationLevel: 10,
                spiritualEnergyRange: [0, 100]
            },
            animalForms: this.animalForms
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ItzelNahualliSkills;
} else {
    window.ItzelNahualliSkills = ItzelNahualliSkills;
}