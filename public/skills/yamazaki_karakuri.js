/**
 * Yamazaki Karakuri - Mestre dos Autômatos Mecânicos
 * Cultura: Japonesa Edo | Classe: Mecanista | Elemento: Engenharia Precisa
 */

class YamazakiKarakuriSkills {
    constructor() {
        this.characterName = "Yamazaki Karakuri";
        this.characterId = "4F3E2D1C0B";
        this.culture = "Japonesa Edo";
        this.classe = "Mecanista";
        this.element = "Engenharia Precisa";
        
        // Tipos de Karakuri (autômatos) disponíveis
        this.karakuriTypes = {
            tea_servant: { 
                name: "Karakuri Chadō", 
                function: "support", 
                healingPower: 40,
                description: "Autômato servo do chá - cura e regeneração"
            },
            archer: { 
                name: "Karakuri Kyūdō", 
                function: "ranged_attack", 
                accuracy: 0.95,
                damage: 85,
                description: "Autômato arqueiro - precisão extrema"
            },
            guardian: { 
                name: "Karakuri Bushi", 
                function: "protection", 
                defenseBonus: 60,
                counterAttack: 0.4,
                description: "Autômato guerreiro - defesa e contra-ataque"
            },
            dancer: { 
                name: "Karakuri Buyō", 
                function: "distraction", 
                confusionRate: 0.6,
                evasionBonus: 45,
                description: "Autômato dançarino - confusão e evasão"
            }
        };
        
        // Sistema de precisão e harmonia
        this.mechanicalHarmony = 0; // 0-100
        this.precisionLevel = 1; // 1-10
    }

    /**
     * ⚙️ Invocação do Karakuri Kyūdō
     * Constrói e ativa autômato arqueiro de precisão extrema
     */
    invocacaoDoKarakuriKyudo(battle, caster, target) {
        const skillData = {
            name: "⚙️ Invocação do Karakuri Kyūdō",
            description: "Constrói e ativa autômato arqueiro de precisão extrema",
            manaCost: 40,
            baseDamage: 85,
            type: "karakuri_summon",
            element: "mechanical_precision"
        };

        if (caster.currentMP < skillData.manaCost) {
            throw new Error('Energia de construção insuficiente');
        }

        caster.currentMP -= skillData.manaCost;

        // Inicializar sistema karakuri
        if (!caster.karakuriState) {
            caster.karakuriState = { 
                activeKarakuri: [], 
                mechanicalHarmony: 50, 
                precisionLevel: 1,
                workshop: {
                    materials: 100,
                    blueprints: ['tea_servant', 'archer', 'guardian'],
                    masterworks: 0
                }
            };
        }

        let damage = skillData.baseDamage;

        // Construir Karakuri Kyūdō
        if (!caster.karakuriState.activeKarakuri.includes('archer')) {
            caster.karakuriState.activeKarakuri.push('archer');
            
            // Buff do autômato arqueiro
            caster.statusEffects = caster.statusEffects || [];
            caster.statusEffects.push({
                type: 'karakuri_archer',
                name: 'Karakuri Kyūdō Ativo',
                duration: 6,
                rangedAccuracy: 0.95,
                precisionBonus: 40,
                doubleShot: 0.3,
                description: 'Autômato arqueiro - 95% precisão, +40 dano à distância, 30% chance tiro duplo'
            });
        }

        // Precisão mecânica extrema: quase sempre acerta crítico
        const precisionCritical = Math.random() < (0.6 + caster.karakuriState.precisionLevel * 0.05);
        if (precisionCritical) {
            damage = Math.floor(damage * (caster.critico || 2.3));
            
            // Marca de precisão: próximos ataques do grupo ganham bônus
            target.statusEffects = target.statusEffects || [];
            target.statusEffects.push({
                type: 'precision_marked',
                name: 'Alvo Marcado',
                duration: 4,
                criticalVulnerability: 0.4,
                description: 'Marcado com precisão - recebe 40% mais dano crítico'
            });
            
            battle.addToLog('precision', `🎯 O Karakuri Kyūdō dispara com perfeição mechanical inigualável!`);
        }

        // Harmonia mecânica: múltiplos ataques coordenados
        const harmonyLevel = caster.karakuriState.mechanicalHarmony / 100;
        if (harmonyLevel > 0.7 && Math.random() < 0.4) {
            // Ataque coordenado de todos os karakuri ativos
            const activeCount = caster.karakuriState.activeKarakuri.length;
            const bonusDamage = Math.floor(damage * 0.3 * activeCount);
            damage += bonusDamage;
            
            battle.addToLog('harmony', `⚙️ Todos os Karakuri atacam em perfeita harmonia mecânica!`);
        }

        // Aumentar harmonia e precisão
        caster.karakuriState.mechanicalHarmony = Math.min(caster.karakuriState.mechanicalHarmony + 15, 100);
        caster.karakuriState.precisionLevel = Math.min(caster.karakuriState.precisionLevel + 1, 10);

        // Chance de tiro duplo (mecanismo de recarga rápida)
        let totalDamage = damage;
        if (Math.random() < 0.3) {
            const secondShot = Math.floor(damage * 0.7);
            totalDamage += secondShot;
            battle.addToLog('mechanism', `🏹 O mecanismo de recarga permite um segundo disparo!`);
        }

        return {
            damage: totalDamage,
            manaCost: skillData.manaCost,
            effects: {
                animation: 'karakuri_archery',
                mechanicalGears: true,
                precisionAim: true,
                soundEffect: 'bow_mechanism'
            },
            statusApplied: ['karakuri_archer', 'precision_marked'],
            culturalNarrative: precisionCritical ? 
                `⚙️ "Seimei no wa!" O autômato de Yamazaki dispara com a precisão dos mestres artesãos!` :
                `🏹 Engrenagens giram em harmonia perfeita enquanto o Karakuri Kyūdō toma posição!`
        };
    }

    /**
     * 🍵 Ritual do Karakuri Chadō
     * Ativa autômato servo do chá que cura e harmoniza o grupo
     */
    ritualDoKarakuriChado(battle, caster, target) {
        const skillData = {
            name: "🍵 Ritual do Karakuri Chadō",
            description: "Ativa autômato servo do chá que cura e harmoniza o grupo",
            manaCost: 35,
            type: "healing_automation",
            element: "harmonious_service"
        };

        if (caster.currentMP < skillData.manaCost) {
            throw new Error('Serenidade insuficiente para o ritual');
        }

        caster.currentMP -= skillData.manaCost;

        // Sistema karakuri
        caster.karakuriState = caster.karakuriState || { 
            activeKarakuri: [], 
            mechanicalHarmony: 50, 
            precisionLevel: 1,
            workshop: { materials: 100, blueprints: [], masterworks: 0 }
        };

        // Ativar Karakuri Chadō
        if (!caster.karakuriState.activeKarakuri.includes('tea_servant')) {
            caster.karakuriState.activeKarakuri.push('tea_servant');
        }

        // Cura base do chá servido
        const baseHealing = Math.floor(caster.maxHP * 0.25); // 25% HP
        let totalHealing = baseHealing;

        // Harmonia do chá: cura aumentada pela harmonia mecânica
        const harmonyMultiplier = 1 + (caster.karakuriState.mechanicalHarmony / 100);
        totalHealing = Math.floor(totalHealing * harmonyMultiplier);

        // Aplicar cura
        caster.currentHP = Math.min(caster.maxHP, caster.currentHP + totalHealing);

        // Buff de serenidade e harmonia
        caster.statusEffects = caster.statusEffects || [];
        caster.statusEffects.push({
            type: 'chado_serenity',
            name: 'Serenidade do Chadō',
            duration: 6,
            mpRegeneration: 10,
            mentalClarity: 0.3,
            stressResistance: 0.8,
            description: 'Serenidade do chá - regenera 10 MP/turno, +30% resistência mental'
        });

        // Buff para todo o grupo (cerimônia do chá compartilhada)
        let groupHealing = 0;
        if (battle.allies) {
            const groupHeal = Math.floor(baseHealing * 0.6);
            battle.allies.forEach(ally => {
                if (ally !== caster) {
                    ally.currentHP = Math.min(ally.maxHP, ally.currentHP + groupHeal);
                    groupHealing += groupHeal;
                    
                    // Harmonia do grupo
                    ally.statusEffects = ally.statusEffects || [];
                    ally.statusEffects.push({
                        type: 'group_harmony',
                        name: 'Harmonia do Grupo',
                        duration: 4,
                        teamworkBonus: 0.2,
                        coordinationBonus: 15,
                        description: 'Harmonia compartilhada - +20% eficácia em ações coordenadas'
                    });
                }
            });
        }

        // Purificação: remove efeitos negativos
        const purificationChance = 0.7 + (caster.karakuriState.mechanicalHarmony / 200);
        if (Math.random() < purificationChance) {
            // Remove debuffs do caster
            const negativesRemoved = [];
            if (caster.statusEffects) {
                caster.statusEffects = caster.statusEffects.filter(effect => {
                    const isNegative = ['poison', 'burn', 'fear', 'confusion', 'weakness'].some(negative => 
                        effect.type.includes(negative)
                    );
                    if (isNegative) {
                        negativesRemoved.push(effect.name);
                        return false;
                    }
                    return true;
                });
            }
            
            if (negativesRemoved.length > 0) {
                battle.addToLog('purification', `🍵 O ritual do chá purifica: ${negativesRemoved.join(', ')}`);
            }
        }

        // Aumentar harmonia pela contemplação
        caster.karakuriState.mechanicalHarmony = Math.min(caster.karakuriState.mechanicalHarmony + 20, 100);

        return {
            damage: 0,
            healing: totalHealing,
            groupHealing: groupHealing,
            manaCost: skillData.manaCost,
            effects: {
                animation: 'tea_ceremony',
                steamRising: true,
                peacefulAura: true,
                soundEffect: 'tea_pouring'
            },
            statusApplied: ['chado_serenity', 'group_harmony'],
            purificationApplied: purificationChance > Math.random(),
            areaEffect: true,
            culturalNarrative: `🍵 "Wabi-sabi no kokoro..." O Karakuri Chadō serve chá perfeito, trazendo paz e harmonia para todos!`
        };
    }

    /**
     * 🛡️ Defesa do Karakuri Bushi
     * Ativa autômato guerreiro para proteção e contra-ataques
     */
    defesaDoKarakuriBushi(battle, caster, target) {
        const skillData = {
            name: "🛡️ Defesa do Karakuri Bushi",
            description: "Ativa autômato guerreiro para proteção e contra-ataques",
            manaCost: 50,
            baseDamage: 70,
            type: "defensive_automation",
            element: "protective_mechanism"
        };

        if (caster.currentMP < skillData.manaCost) {
            throw new Error('Energia defensiva insuficiente');
        }

        caster.currentMP -= skillData.manaCost;

        // Sistema karakuri
        caster.karakuriState = caster.karakuriState || { 
            activeKarakuri: [], 
            mechanicalHarmony: 50, 
            precisionLevel: 1
        };

        let damage = skillData.baseDamage;

        // Ativar Karakuri Bushi
        if (!caster.karakuriState.activeKarakuri.includes('guardian')) {
            caster.karakuriState.activeKarakuri.push('guardian');
        }

        // Postura defensiva do Bushi
        caster.statusEffects = caster.statusEffects || [];
        caster.statusEffects.push({
            type: 'karakuri_defense',
            name: 'Defesa do Bushi',
            duration: 7,
            defenseBonus: 60,
            counterChance: 0.4,
            damageReduction: 0.3,
            protectAllies: true,
            description: 'Karakuri Bushi ativo - +60 defesa, -30% dano, 40% contra-ataque, protege aliados'
        });

        // Ataque defensivo inicial
        if (target && target.currentHP > 0) {
            // Bônus baseado na harmonia mecânica
            const harmonyBonus = caster.karakuriState.mechanicalHarmony / 100;
            damage = Math.floor(damage * (1 + harmonyBonus * 0.5));

            // Aplicar efeito de "Marcado para Defesa"
            target.statusEffects = target.statusEffects || [];
            target.statusEffects.push({
                type: 'defensive_mark',
                name: 'Alvo Prioritário',
                duration: 5,
                threatLevel: 2,
                redirectAttacks: 0.6,
                description: 'Marcado pelo Bushi - 60% chance de ataques serem redirecionados'
            });
        }

        // Proteção estendida aos aliados
        if (battle.allies) {
            battle.allies.forEach(ally => {
                if (ally !== caster) {
                    ally.statusEffects = ally.statusEffects || [];
                    ally.statusEffects.push({
                        type: 'bushi_protection',
                        name: 'Proteção do Bushi',
                        duration: 5,
                        damageInterception: 0.3,
                        defenseBonus: 25,
                        description: 'Protegido pelo Karakuri - 30% chance de interceptar ataques, +25 defesa'
                    });
                }
            });
        }

        // Aumento da precisão defensiva
        caster.karakuriState.precisionLevel = Math.min(caster.karakuriState.precisionLevel + 2, 10);

        // Coordenação entre karakuri: bônus se múltiplos estão ativos
        const activeCount = caster.karakuriState.activeKarakuri.length;
        if (activeCount >= 2) {
            const coordinationBonus = Math.floor(damage * 0.2 * (activeCount - 1));
            damage += coordinationBonus;
            
            // Buff especial de coordenação
            caster.statusEffects.push({
                type: 'karakuri_coordination',
                name: 'Coordenação Mecânica',
                duration: 4,
                actionBonus: activeCount * 10,
                efficiencyBonus: 0.25,
                description: `Coordenação entre ${activeCount} Karakuri - múltiplas ações sincronizadas`
            });
            
            battle.addToLog('coordination', `⚙️ ${activeCount} Karakuri operam em perfeita sincronização!`);
        }

        return {
            damage: damage,
            manaCost: skillData.manaCost,
            effects: {
                animation: 'bushi_stance',
                defensivePosture: true,
                mechanicalShield: true,
                soundEffect: 'armor_clank'
            },
            statusApplied: ['karakuri_defense', 'defensive_mark', 'bushi_protection', 'karakuri_coordination'],
            areaEffect: true,
            culturalNarrative: activeCount >= 2 ? 
                `🛡️ "Bushidō no kokoro!" Os Karakuri se coordenam como verdadeiros samurai mecânicos!` :
                `⚙️ O Karakuri Bushi assume posição defensiva com a honra dos guerreiros!`
        };
    }

    // Processamento de efeitos únicos

    processKarakuriCoordination(character, battle) {
        if (!character.karakuriState || character.karakuriState.activeKarakuri.length === 0) {
            return null;
        }

        const activeKarakuri = character.karakuriState.activeKarakuri;
        const coordinationEffects = [];

        // Cada tipo de karakuri contribui diferentemente
        activeKarakuri.forEach(type => {
            switch(type) {
                case 'archer':
                    coordinationEffects.push({ type: 'precision', bonus: 15 });
                    break;
                case 'tea_servant':
                    coordinationEffects.push({ type: 'serenity', mpRegen: 5 });
                    break;
                case 'guardian':
                    coordinationEffects.push({ type: 'protection', defenseBonus: 20 });
                    break;
                case 'dancer':
                    coordinationEffects.push({ type: 'distraction', evasionBonus: 15 });
                    break;
            }
        });

        return {
            activeKarakuriCount: activeKarakuri.length,
            coordinationEffects: coordinationEffects,
            harmonyLevel: character.karakuriState.mechanicalHarmony
        };
    }

    processKarakuriCounterattack(character, battle, attacker) {
        const defenseEffect = character.statusEffects?.find(e => e.type === 'karakuri_defense');
        if (defenseEffect && Math.random() < defenseEffect.counterChance) {
            const counterDamage = Math.floor(character.attack * 0.6);
            
            // Bônus se múltiplos karakuri estão coordenados
            const activeCount = character.karakuriState?.activeKarakuri.length || 1;
            const finalDamage = Math.floor(counterDamage * (1 + activeCount * 0.1));
            
            return {
                counterDamage: finalDamage,
                counterType: 'mechanical',
                message: `⚙️ O Karakuri Bushi contra-ataca com precisão mecânica!`
            };
        }
        return null;
    }

    processGroupHarmonyEffect(battle, character) {
        const harmonyEffect = character.statusEffects?.find(e => e.type === 'group_harmony');
        if (harmonyEffect && battle.allies) {
            // Bônus de coordenação para ações do grupo
            const harmoniousAllies = battle.allies.filter(ally => 
                ally.statusEffects?.some(e => e.type === 'group_harmony')
            );
            
            if (harmoniousAllies.length >= 2) {
                return {
                    teamworkBonus: harmoniousAllies.length * 0.1,
                    coordinationBonus: harmoniousAllies.length * 5,
                    message: `🍵 A harmonia do grupo fortalece as ações coordenadas!`
                };
            }
        }
        return null;
    }

    // Utilitários

    getActiveKarakuriList(character) {
        return character.karakuriState ? character.karakuriState.activeKarakuri : [];
    }

    getMechanicalHarmonyLevel(character) {
        return character.karakuriState ? character.karakuriState.mechanicalHarmony : 0;
    }

    getPrecisionLevel(character) {
        return character.karakuriState ? character.karakuriState.precisionLevel : 1;
    }

    canBuildKarakuri(character, karakuriType) {
        if (!character.karakuriState) return false;
        
        const hasBlueprint = character.karakuriState.workshop?.blueprints.includes(karakuriType);
        const hasMaterials = character.karakuriState.workshop?.materials >= 30;
        const notActive = !character.karakuriState.activeKarakuri.includes(karakuriType);
        
        return hasBlueprint && hasMaterials && notActive;
    }

    // Metadata

    getSkillsMetadata() {
        return {
            characterId: this.characterId,
            characterName: this.characterName,
            culture: this.culture,
            skills: [
                {
                    id: 'invocacao_do_karakuri_kyudo',
                    name: '⚙️ Invocação do Karakuri Kyūdō',
                    manaCost: 40,
                    damage: 85,
                    type: 'karakuri_summon',
                    cooldown: 2,
                    description: 'Constrói e ativa autômato arqueiro de precisão extrema'
                },
                {
                    id: 'ritual_do_karakuri_chado',
                    name: '🍵 Ritual do Karakuri Chadō',
                    manaCost: 35,
                    damage: 0,
                    type: 'healing_automation',
                    cooldown: 2,
                    description: 'Ativa autômato servo do chá que cura e harmoniza o grupo'
                },
                {
                    id: 'defesa_do_karakuri_bushi',
                    name: '🛡️ Defesa do Karakuri Bushi',
                    manaCost: 50,
                    damage: 70,
                    type: 'defensive_automation',
                    cooldown: 3,
                    description: 'Ativa autômato guerreiro para proteção e contra-ataques'
                }
            ],
            culturalElements: [
                'Tradição japonesa de autômatos Karakuri',
                'Período Edo e artesanato mecânico',
                'Cerimônia do chá (Chadō) e harmonia',
                'Bushidō e espírito guerreiro mecânico',
                'Precisão e perfeição artesanal'
            ],
            karakuriSystem: {
                availableTypes: Object.keys(this.karakuriTypes),
                maxActiveKarakuri: 4,
                harmonyRange: [0, 100],
                precisionLevels: 10
            },
            karakuriTypes: this.karakuriTypes
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = YamazakiKarakuriSkills;
} else {
    window.YamazakiKarakuriSkills = YamazakiKarakuriSkills;
}