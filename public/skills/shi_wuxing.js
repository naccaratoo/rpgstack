/**
 * Shi Wuxing - Mestre dos Cinco Elementos
 * Cultura: Chinesa Imperial | Classe: Naturalista | Elemento: Wu Xing (Cinco Elementos)
 */

class ShiWuxingSkills {
    constructor() {
        this.characterName = "Shi Wuxing";
        this.characterId = "EA32D10F2D";
        this.culture = "Chinesa Imperial";
        this.classe = "Naturalista";
        this.element = "Wu Xing (Cinco Elementos)";
        
        // Sistema Wu Xing - ciclo dos cinco elementos
        this.elements = {
            wood: { name: "Madeira (木)", strength: "earth", weakness: "metal", color: "#228B22" },
            fire: { name: "Fogo (火)", strength: "metal", weakness: "water", color: "#DC143C" },
            earth: { name: "Terra (土)", strength: "water", weakness: "wood", color: "#DAA520" },
            metal: { name: "Metal (金)", strength: "wood", weakness: "fire", color: "#C0C0C0" },
            water: { name: "Água (水)", strength: "fire", weakness: "earth", color: "#4169E1" }
        };
    }

    /**
     * 🌊 Ciclo dos Cinco Elementos
     * Rotaciona através dos elementos Wu Xing, cada um com efeito único
     */
    cicloDosCincoElementos(battle, caster, target) {
        const skillData = {
            name: "🌊 Ciclo dos Cinco Elementos",
            description: "Rotaciona através dos elementos Wu Xing com efeitos únicos",
            animaCost: 35,
            baseDamage: 75,
            type: "elemental_cycle",
            element: "wu_xing"
        };

        if (caster.currentAnima < skillData.animaCost) {
            throw new Error('Qi insuficiente para canalizar os elementos');
        }

        caster.currentAnima -= skillData.animaCost;

        // Inicializar ou avançar ciclo elemental
        if (!caster.elementalCycle) {
            caster.elementalCycle = { current: 'wood', cycle: 0 };
        }

        const currentElement = caster.elementalCycle.current;
        const elementData = this.elements[currentElement];
        let damage = skillData.baseDamage;

        // Efeito específico de cada elemento
        let elementalEffect = null;
        let specialNarrative = "";

        switch (currentElement) {
            case 'wood':
                // Madeira: Regeneração e crescimento
                const healAmount = Math.floor(caster.maxHP * 0.2);
                caster.currentHP = Math.min(caster.maxHP, caster.currentHP + healAmount);
                elementalEffect = { type: 'heal', value: healAmount };
                specialNarrative = `🌱 A energia da Madeira flui através de Shi, restaurando ${healAmount} de vida!`;
                break;

            case 'fire':
                // Fogo: Dano aumentado e chance de queimar
                damage = Math.floor(damage * 1.3);
                if (Math.random() < 0.4) {
                    target.statusEffects = target.statusEffects || [];
                    target.statusEffects.push({
                        type: 'burn',
                        name: 'Chamas do Fogo Imperial',
                        duration: 3,
                        damagePerTurn: Math.floor(target.maxHP * 0.08),
                        description: 'Queimadura elemental - 8% HP por turno'
                    });
                    elementalEffect = { type: 'burn', duration: 3 };
                    specialNarrative = `🔥 As chamas imperiais envolvem o inimigo em fogo eterno!`;
                }
                break;

            case 'earth':
                // Terra: Defesa aumentada e estabilidade
                caster.statusEffects = caster.statusEffects || [];
                caster.statusEffects.push({
                    type: 'earth_stability',
                    name: 'Estabilidade da Terra',
                    duration: 4,
                    defenseBonus: 25,
                    statusResistance: 0.5,
                    description: 'Defesa +25, 50% resistência a status negativos'
                });
                elementalEffect = { type: 'earth_defense', bonus: 25 };
                specialNarrative = `⛰️ A força da Terra endurece a pele de Shi como jade imperial!`;
                break;

            case 'metal':
                // Metal: Precisão aumentada e penetração de armadura
                damage = Math.floor(damage * 1.15);
                const armorPiercing = Math.floor(target.defense * 0.4);
                damage += armorPiercing;
                elementalEffect = { type: 'armor_pierce', value: armorPiercing };
                specialNarrative = `⚔️ O Metal corta através das defesas como lâmina imperial!`;
                break;

            case 'water':
                // Água: Adaptabilidade e debuff no inimigo
                target.statusEffects = target.statusEffects || [];
                target.statusEffects.push({
                    type: 'water_erosion',
                    name: 'Erosão da Água',
                    duration: 3,
                    attackReduction: 20,
                    speedReduction: 0.3,
                    description: 'Ataque -20, velocidade reduzida pela persistência da água'
                });
                elementalEffect = { type: 'water_debuff', duration: 3 };
                specialNarrative = `🌊 A persistência da Água erode a força do inimigo!`;
                break;
        }

        // Avançar para próximo elemento no ciclo
        const elementOrder = ['wood', 'fire', 'earth', 'metal', 'water'];
        const currentIndex = elementOrder.indexOf(currentElement);
        const nextIndex = (currentIndex + 1) % elementOrder.length;
        caster.elementalCycle.current = elementOrder[nextIndex];
        caster.elementalCycle.cycle++;

        // Bônus por completar ciclos completos
        const completeCycles = Math.floor(caster.elementalCycle.cycle / 5);
        const cycleBonus = completeCycles * 0.1; // +10% por ciclo completo
        damage = Math.floor(damage * (1 + cycleBonus));

        return {
            damage: damage,
            animaCost: skillData.animaCost,
            effects: {
                animation: `element_${currentElement}`,
                elementalGlow: elementData.color,
                particles: `${currentElement}_particles`
            },
            statusApplied: elementalEffect ? [elementalEffect.type] : [],
            elementalEffect: elementalEffect,
            culturalNarrative: `${specialNarrative} Próximo elemento: ${this.elements[caster.elementalCycle.current].name}`
        };
    }

    /**
     * ☯️ Harmonia do Yin Yang
     * Equilibra energia vital entre Shi e o alvo
     */
    harmoniaDoYinYang(battle, caster, target) {
        const skillData = {
            name: "☯️ Harmonia do Yin Yang",
            description: "Equilibra energia vital entre Shi e o alvo",
            animaCost: 25,
            type: "balance_harmony",
            element: "yin_yang"
        };

        if (caster.currentAnima < skillData.animaCost) {
            throw new Error('Qi insuficiente para canalizar Yin Yang');
        }

        caster.currentAnima -= skillData.animaCost;

        // Calcular HP médio entre os dois
        const totalHP = caster.currentHP + target.currentHP;
        const averageHP = Math.floor(totalHP / 2);

        const casterHPDiff = averageHP - caster.currentHP;
        const targetHPDiff = averageHP - target.currentHP;

        // Aplicar equalização gradual (70% da diferença)
        const equalizationRate = 0.7;
        
        const casterHPChange = Math.floor(casterHPDiff * equalizationRate);
        const targetHPChange = Math.floor(targetHPDiff * equalizationRate);

        // Limitar pelos HP máximos
        caster.currentHP = Math.max(0, Math.min(caster.maxHP, caster.currentHP + casterHPChange));
        target.currentHP = Math.max(0, Math.min(target.maxHP, target.currentHP + targetHPChange));

        // Aplicar efeito de harmonia (reduz dano de ambos os lados)
        const harmonyEffect = {
            type: 'yin_yang_harmony',
            name: 'Harmonia Yin Yang',
            duration: 3,
            damageReduction: 0.25,
            description: 'Harmonia reduz dano dado e recebido em 25%'
        };

        caster.statusEffects = caster.statusEffects || [];
        target.statusEffects = target.statusEffects || [];
        caster.statusEffects.push({ ...harmonyEffect });
        target.statusEffects.push({ ...harmonyEffect });

        return {
            damage: Math.abs(targetHPChange) < Math.abs(casterHPChange) ? Math.abs(targetHPChange) : 0,
            healing: casterHPChange > 0 ? casterHPChange : 0,
            animaCost: skillData.animaCost,
            effects: {
                animation: 'yin_yang_circle',
                harmonyGlow: true,
                soundEffect: 'harmony_chimes'
            },
            statusApplied: ['yin_yang_harmony'],
            culturalNarrative: `☯️ Shi invoca a sabedoria ancestral do equilíbrio: "No conflito, busque a harmonia; na harmonia, encontre a força."`
        };
    }

    /**
     * 🐉 Invocação do Dragão Imperial
     * Canaliza o poder do dragão chinês para ataque devastador
     */
    invocacaoDoDragaoImperial(battle, caster, target) {
        const skillData = {
            name: "🐉 Invocação do Dragão Imperial",
            description: "Canaliza o poder do dragão chinês para ataque devastador",
            animaCost: 60,
            baseDamage: 110,
            type: "dragon_summon",
            element: "imperial_dragon"
        };

        if (caster.currentAnima < skillData.animaCost) {
            throw new Error('Qi insuficiente para invocar o Dragão Imperial');
        }

        caster.currentAnima -= skillData.animaCost;

        let damage = skillData.baseDamage;

        // Poder aumenta com base nos elementos já canalizados
        const elementsCanneled = caster.elementalCycle ? caster.elementalCycle.cycle : 0;
        const elementalMastery = Math.min(elementsCanneled * 0.05, 0.5); // Max 50% bonus
        damage = Math.floor(damage * (1 + elementalMastery));

        // Chance crítica aumentada baseada na harmonia cósmica
        let criticalChance = 0.15;
        const harmonyEffect = caster.statusEffects?.find(e => e.type === 'yin_yang_harmony');
        if (harmonyEffect) {
            criticalChance += 0.2; // +20% se em harmonia
        }

        const isCritical = Math.random() < criticalChance;
        if (isCritical) {
            damage = Math.floor(damage * (caster.critico || 2.5));
        }

        // Efeito especial: Marca do Dragão (aumenta dano de próximos ataques)
        caster.statusEffects = caster.statusEffects || [];
        caster.statusEffects.push({
            type: 'dragon_mark',
            name: 'Marca do Dragão Imperial',
            duration: 5,
            attackBonus: 30,
            criticalBonus: 0.1,
            description: 'Imbuído com poder dracônico - +30 ataque, +10% crítico'
        });

        // Chance de intimidação (reduz ataque do inimigo)
        if (Math.random() < 0.6) {
            target.statusEffects = target.statusEffects || [];
            target.statusEffects.push({
                type: 'dragon_intimidation',
                name: 'Intimidação Dracônica',
                duration: 2,
                attackReduction: 25,
                description: 'Intimidado pela majestade do dragão - ataque reduzido'
            });
        }

        return {
            damage: damage,
            isCritical: isCritical,
            animaCost: skillData.animaCost,
            effects: {
                animation: 'imperial_dragon_descent',
                dragonRoar: true,
                screenShake: true,
                particles: 'golden_dragon_flames'
            },
            statusApplied: ['dragon_mark', 'dragon_intimidation'],
            culturalNarrative: isCritical ? 
                `🐉 O DRAGÃO IMPERIAL DESPERTA! Shi canaliza o poder dos imperadores celestiais em um ataque lendário!` :
                `🐲 As escamas douradas brilham enquanto o dragão responde ao chamado de Shi!`
        };
    }

    // Processamento de efeitos únicos

    processElementalCycleEffect(character, battle) {
        if (character.elementalCycle) {
            const cycleCount = character.elementalCycle.cycle;
            const completeCycles = Math.floor(cycleCount / 5);
            
            // A cada ciclo completo, recuperar um pouco de mana
            if (cycleCount % 5 === 0 && cycleCount > 0) {
                const animaRestore = 20 + (completeCycles * 5);
                character.currentAnima = Math.min(character.maxAnima, character.currentAnima + animaRestore);
                battle.addToLog('cultural', `🌟 Shi completa um ciclo Wu Xing e recupera ${animaRestore} de Qi!`);
            }
        }
    }

    processDragonMarkEffect(character, battle) {
        const effect = character.statusEffects?.find(e => e.type === 'dragon_mark');
        if (effect) {
            // Aplicar bônus de ataque
            character.attack = (character.baseAttack || character.attack) + effect.attackBonus;
            
            effect.duration--;
            if (effect.duration <= 0) {
                character.attack = character.baseAttack || character.attack;
                battle.addToLog('system', `A Marca do Dragão Imperial se desvanece de ${character.name}...`);
            }
        }
    }

    // Utilitários

    getCurrentElementInfo(character) {
        if (!character.elementalCycle) return null;
        
        const current = character.elementalCycle.current;
        const elementData = this.elements[current];
        
        return {
            current: current,
            name: elementData.name,
            color: elementData.color,
            cycle: character.elementalCycle.cycle,
            completeCycles: Math.floor(character.elementalCycle.cycle / 5)
        };
    }

    // Metadata para o sistema

    getSkillsMetadata() {
        return {
            characterId: this.characterId,
            characterName: this.characterName,
            culture: this.culture,
            skills: [
                {
                    id: 'ciclo_dos_cinco_elementos',
                    name: '🌊 Ciclo dos Cinco Elementos',
                    animaCost: 35,
                    damage: 75,
                    type: 'elemental_cycle',
                    cooldown: 0,
                    description: 'Rotaciona através dos elementos Wu Xing com efeitos únicos'
                },
                {
                    id: 'harmonia_do_yin_yang',
                    name: '☯️ Harmonia do Yin Yang',
                    animaCost: 25,
                    damage: 0,
                    type: 'balance_harmony',
                    cooldown: 1,
                    description: 'Equilibra energia vital entre Shi e o alvo'
                },
                {
                    id: 'invocacao_do_dragao_imperial',
                    name: '🐉 Invocação do Dragão Imperial',
                    animaCost: 60,
                    damage: 110,
                    type: 'dragon_summon',
                    cooldown: 3,
                    description: 'Canaliza o poder do dragão chinês para ataque devastador'
                }
            ],
            culturalElements: [
                'Filosofia Wu Xing (Cinco Elementos)',
                'Princípios Yin Yang',
                'Mitologia do Dragão Imperial',
                'Medicina Tradicional Chinesa',
                'Feng Shui e harmonia cósmica'
            ],
            elementalCycle: this.elements
        };
    }
}

// Export para compatibilidade
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShiWuxingSkills;
} else {
    window.ShiWuxingSkills = ShiWuxingSkills;
}