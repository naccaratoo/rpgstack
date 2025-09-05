/**
 * Miloš Železnikov - Mestre Ferreiro Eslavo
 * Cultura: Eslava | Classe: Artífice | Elemento: Ferro e Fogo Ancestral
 */

class MilosZeleznikovSkills {
    constructor() {
        this.characterName = "Miloš Železnikov";
        this.characterId = "045CCF3515";
        this.culture = "Eslava";
        this.classe = "Artífice";
        this.element = "Ferro e Fogo Ancestral";
    }

    /**
     * 🔨 Forja do Dragão Eslavo
     * Invoca técnicas ancestrais para forjar arma de escamas de dragão durante o combate
     */
    forjaDoDragaoEslavo(battle, caster, target) {
        const skillData = {
            name: "🔨 Forja do Dragão Eslavo",
            description: "Invoca técnicas ancestrais para forjar arma de escamas de dragão",
            animaCost: 0,
            baseDamage: 95,
            type: "weapon_craft",
            element: "fire_metal",
            culturalAuthenticity: "Baseada em tradições metalúrgicas eslavas dos Cárpatos"
        };

        // Animação de forja mística
        const forgeAnimation = this.createForgeAnimation();

        // Calcular dano com bônus cultural
        let damage = skillData.baseDamage;
        
        // Bônus de artífice: +20% damage se atacar após defender
        if (caster.previousAction === 'defend') {
            damage = Math.floor(damage * 1.2);
            battle.addToLog('cultural', `${caster.name} forja com precisão aperfeiçoada pela paciência eslava!`);
        }

        // Bônus de temperatura: aumenta com cada uso consecutivo (forja aquecendo)
        if (!caster.forgeHeat) caster.forgeHeat = 0;
        caster.forgeHeat = Math.min(caster.forgeHeat + 1, 5);
        const heatBonus = caster.forgeHeat * 0.1; // +10% por nível de aquecimento
        damage = Math.floor(damage * (1 + heatBonus));

        // Chance especial de criar "Arma Draconiana" temporária
        const dragonWeaponChance = 0.25 + (caster.forgeHeat * 0.05); // 25% + 5% por nível
        const createsDragonWeapon = Math.random() < dragonWeaponChance;

        if (createsDragonWeapon) {
            // Aplicar buff "Arma Draconiana" 
            caster.statusEffects = caster.statusEffects || [];
            caster.statusEffects.push({
                type: 'dragon_weapon',
                name: 'Arma Draconiana',
                duration: 3,
                attackBonus: 25,
                description: 'Arma forjada com escamas de dragão - +25 ataque'
            });
            
            damage = Math.floor(damage * 1.3); // +30% damage na criação
            battle.addToLog('legendary', `🐉 Miloš forja uma Arma Draconiana! As escamas de dragão brilham com poder ancestral!`);
        }

        // Aplicar dano e efeitos visuais
        return {
            damage: damage,
            effects: {
                animation: forgeAnimation,
                screenShake: createsDragonWeapon,
                soundEffect: 'forge_hammer',
                particles: 'fire_sparks'
            },
            statusApplied: createsDragonWeapon ? ['dragon_weapon'] : [],
            culturalNarrative: this.getForgeNarrative(caster.forgeHeat, createsDragonWeapon)
        };
    }

    /**
     * ⚒️ Martelo dos Ancestrais
     * Invoca espíritos de ferreiros eslavos para guiar o ataque
     */
    marteloDoAncesrais(battle, caster, target) {
        const skillData = {
            name: "⚒️ Martelo dos Ancestrais",
            description: "Invoca espíritos de ferreiros eslavos para guiar o ataque",
            animaCost: 30,
            baseDamage: 70,
            type: "ancestral_summon",
            element: "spirit_metal"
        };

        // Verificar se tem mana suficiente
        if (caster.currentAnima < skillData.animaCost) {
            throw new Error('Ânima insuficiente para invocar os ancestrais');
        }

        // Consumir mana
        caster.currentAnima -= skillData.animaCost;

        let damage = skillData.baseDamage;

        // Cada personagem derrotado aumenta o poder (ancestrais se unem)
        const defeatedEnemies = battle.defeatedEnemies || 0;
        const ancestralPower = defeatedEnemies * 0.15; // +15% por inimigo derrotado
        damage = Math.floor(damage * (1 + ancestralPower));

        // Chance de crítico aumentada baseada na experiência de combate
        const criticalChance = 0.2 + (defeatedEnemies * 0.05);
        const isCritical = Math.random() < criticalChance;

        if (isCritical) {
            damage = Math.floor(damage * (caster.critico || 2.0));
            battle.addToLog('critical', `👻 Os ancestrais eslavos guiam o martelo com precisão mortal!`);
        }

        // Efeito: reduz defesa do inimigo por 2 turnos (metal amassado)
        target.statusEffects = target.statusEffects || [];
        target.statusEffects.push({
            type: 'armor_dent',
            name: 'Armadura Amassada',
            duration: 2,
            defenseReduction: 15,
            description: 'Defesa reduzida pelo martelo ancestral'
        });

        return {
            damage: damage,
            isCritical: isCritical,
            animaCost: skillData.animaCost,
            effects: {
                animation: 'ancestral_hammer',
                ghostSpirits: true,
                soundEffect: 'hammer_echo'
            },
            statusApplied: ['armor_dent'],
            culturalNarrative: `Os espíritos de mil ferreiros eslavos convergem no martelo de Miloš, cada batida ecoando com a sabedoria ancestral!`
        };
    }

    /**
     * 🛡️ Koljčuga Drakonova
     * Forja armadura temporária de escamas de dragão
     */
    koljcugaDrakonova(battle, caster, target) {
        const skillData = {
            name: "🛡️ Koljčuga Drakonova", 
            description: "Forja armadura temporária de escamas de dragão",
            animaCost: 45,
            type: "defensive_craft",
            element: "dragon_metal"
        };

        if (caster.currentAnima < skillData.animaCost) {
            throw new Error('Ânima insuficiente para forjar Koljčuga');
        }

        caster.currentAnima -= skillData.animaCost;

        // Aplicar buff de armadura draconiana
        caster.statusEffects = caster.statusEffects || [];
        caster.statusEffects.push({
            type: 'dragon_armor',
            name: 'Koljčuga Drakonova',
            duration: 4,
            defenseBonus: 30,
            magicResistance: 40,
            description: 'Armadura de escamas de dragão - +30 defesa, +40% resistência mágica'
        });

        // Cura pequena (representando proteção)
        const healAmount = Math.floor(caster.maxHP * 0.15);
        caster.currentHP = Math.min(caster.maxHP, caster.currentHP + healAmount);

        return {
            damage: 0,
            healing: healAmount,
            animaCost: skillData.animaCost,
            effects: {
                animation: 'armor_forge',
                dragonGlow: true,
                soundEffect: 'dragon_scales'
            },
            statusApplied: ['dragon_armor'],
            culturalNarrative: `Miloš invoca as técnicas secretas dos Cárpatos, forjando uma armadura que brilha com o poder dos dragões eslavos!`
        };
    }

    // Utilitários e animações

    createForgeAnimation() {
        return {
            type: 'forge_sequence',
            duration: 2000,
            stages: [
                { time: 0, effect: 'hammer_raise' },
                { time: 500, effect: 'forge_strike', sound: 'metal_clang' },
                { time: 1000, effect: 'fire_burst', particles: 'sparks' },
                { time: 1500, effect: 'weapon_glow', light: 'dragon_fire' }
            ]
        };
    }

    getForgeNarrative(forgeHeat, isDragonWeapon) {
        const heatNarratives = [
            "A forja de Miloš está fria, mas suas mãos experientes começam o trabalho...",
            "O metal aquece sob as batidas ritmadas, ecoando tradições ancestrais...",
            "A forja brilha intensamente, cada movimento guiado pelos espíritos dos Cárpatos...",
            "O fogo atinge temperaturas lendárias, dignos dos dragões eslavos...",
            "A forja pulsa com poder sobrenatural, as chamas dançam em cores impossíveis...",
            "🔥 A FORJA ANCESTRAL ATINGE SEU PICO! Os espíritos de mil mestres ferreiros convergem!"
        ];

        let narrative = heatNarratives[forgeHeat] || heatNarratives[0];
        
        if (isDragonWeapon) {
            narrative += " ✨ Uma energia draconiana permeia o metal, criando algo verdadeiramente lendário!";
        }

        return narrative;
    }

    // Status effects específicos do personagem

    processDragonWeaponEffect(character, battle) {
        const effect = character.statusEffects.find(e => e.type === 'dragon_weapon');
        if (effect) {
            // Adicionar bônus de ataque
            character.attack = (character.baseAttack || character.attack) + effect.attackBonus;
            
            // Efeito visual contínuo
            battle.addVisualEffect('dragon_weapon_glow', character);
            
            effect.duration--;
            if (effect.duration <= 0) {
                character.attack = character.baseAttack || character.attack;
                battle.addToLog('system', `A Arma Draconiana de ${character.name} perde seu brilho...`);
            }
        }
    }

    processDragonArmorEffect(character, battle) {
        const effect = character.statusEffects.find(e => e.type === 'dragon_armor');
        if (effect) {
            // Aplicar resistências
            if (battle.lastDamageType === 'magic') {
                const reduction = Math.floor(battle.lastDamage * (effect.magicResistance / 100));
                battle.lastDamage -= reduction;
                battle.addToLog('resist', `Koljčuga Drakonova absorve ${reduction} de dano mágico!`);
            }
            
            effect.duration--;
            if (effect.duration <= 0) {
                battle.addToLog('system', `A Koljčuga Drakonova de ${character.name} se desfaz em cinzas douradas...`);
            }
        }
    }

    // Metadata para o sistema de skills

    getSkillsMetadata() {
        return {
            characterId: this.characterId,
            characterName: this.characterName,
            culture: this.culture,
            skills: [
                {
                    id: 'forja_do_dragao_eslavo',
                    name: '🔨 Forja do Dragão Eslavo',
                    animaCost: 0,
                    damage: 95,
                    type: 'weapon_craft',
                    cooldown: 0,
                    description: 'Invoca técnicas ancestrais para forjar arma de escamas de dragão'
                },
                {
                    id: 'martelo_dos_ancestrais',
                    name: '⚒️ Martelo dos Ancestrais',
                    animaCost: 30,
                    damage: 70,
                    type: 'ancestral_summon',
                    cooldown: 1,
                    description: 'Invoca espíritos de ferreiros eslavos para guiar o ataque'
                },
                {
                    id: 'koljcuga_drakonova',
                    name: '🛡️ Koljčuga Drakonova',
                    animaCost: 45,
                    damage: 0,
                    type: 'defensive_craft',
                    cooldown: 2,
                    description: 'Forja armadura temporária de escamas de dragão'
                }
            ],
            culturalElements: [
                'Tradições metalúrgicas dos Cárpatos',
                'Espíritos ancestrais de ferreiros',
                'Mitologia de dragões eslavos',
                'Resistência cultural através da arte'
            ]
        };
    }
}

// Export para compatibilidade Node.js e Browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MilosZeleznikovSkills;
} else {
    window.MilosZeleznikovSkills = MilosZeleznikovSkills;
}