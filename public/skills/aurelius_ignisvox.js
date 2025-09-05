/**
 * Aurelius Ignisvox - Comandante das Legiões de Fogo
 * Cultura: Romana Imperial | Classe: Armamentista | Elemento: Fogo Militar
 */

class AureliusIgnisvoxSkills {
    constructor() {
        this.characterName = "Aurelius Ignisvox";
        this.characterId = "A9C4N0001E";
        this.culture = "Romana Imperial";
        this.classe = "Armamentista";
        this.element = "Fogo Militar";
        
        // Formações militares romanas
        this.formations = {
            testudo: { name: "Testudo", defenseBonus: 40, description: "Formação tartaruga" },
            cuneus: { name: "Cuneus", attackBonus: 30, description: "Formação cunha" },
            fulcum: { name: "Fulcum", balanceBonus: 20, description: "Formação suporte" }
        };
    }

    /**
     * 🔥 Comando das Legiões Flamejantes
     * Invoca legiões espectrais romanas imbuídas com fogo militar
     */
    comandoDasLegioesFlamejantes(battle, caster, target) {
        const skillData = {
            name: "🔥 Comando das Legiões Flamejantes",
            description: "Invoca legiões espectrais romanas imbuídas com fogo militar",
            animaCost: 0,
            baseDamage: 85,
            type: "command_magic",
            element: "military_fire"
        };

        // Inicializar sistema de comando se não existir
        if (!caster.legionCommand) {
            caster.legionCommand = { 
                activeFormation: null, 
                commandRank: 1, 
                veteranBonus: 0 
            };
        }

        let damage = skillData.baseDamage;

        // Bônus baseado no rank de comando
        const rankBonus = caster.legionCommand.commandRank * 0.1; // +10% per rank
        damage = Math.floor(damage * (1 + rankBonus));

        // Bônus veterano: aumenta com uso sucessivo
        caster.legionCommand.veteranBonus = Math.min(caster.legionCommand.veteranBonus + 1, 10);
        const veteranMultiplier = 1 + (caster.legionCommand.veteranBonus * 0.05); // +5% per uso
        damage = Math.floor(damage * veteranMultiplier);

        // Chance de invocar Centurião Espectral
        const centurionChance = 0.3 + (caster.legionCommand.commandRank * 0.1);
        const summonsCenturion = Math.random() < centurionChance;

        if (summonsCenturion) {
            // Centurião oferece buff de disciplina
            caster.statusEffects = caster.statusEffects || [];
            caster.statusEffects.push({
                type: 'centurion_discipline',
                name: 'Disciplina do Centurião',
                duration: 4,
                attackBonus: 25,
                criticalBonus: 0.15,
                description: 'Liderança militar - +25 ataque, +15% crítico'
            });
            
            damage = Math.floor(damage * 1.25); // +25% damage com centurião
            battle.addToLog('summon', `⚔️ Um Centurião Espectral surge para liderar a carga!`);
        }

        // Efeito: chance de queimar baseada na disciplina militar
        const burnChance = 0.4 + (veteranMultiplier - 1);
        if (Math.random() < burnChance) {
            target.statusEffects = target.statusEffects || [];
            target.statusEffects.push({
                type: 'military_burn',
                name: 'Chamas Militares',
                duration: 3,
                damagePerTurn: Math.floor(target.maxHP * 0.1),
                disciplineReduction: 0.2,
                description: 'Queimado por fogo disciplinado - 10% HP por turno, -20% precisão'
            });
        }

        return {
            damage: damage,
            effects: {
                animation: 'legion_charge',
                legionGhosts: true,
                fireTrails: true,
                soundEffect: 'war_horns'
            },
            statusApplied: summonsCenturion ? ['centurion_discipline', 'military_burn'] : ['military_burn'],
            culturalNarrative: summonsCenturion ? 
                `🏛️ "Legio XIII Gemina, AD GLORIAM!" As legiões fantasmas respondem ao comando de Aurelius com disciplina eterna!` :
                `⚔️ Os estandartes flamejantes tremulam enquanto guerreiros espectrais avançam em formação perfeita!`
        };
    }

    /**
     * 🛡️ Formação Testudo Flamejante
     * Adota formação defensiva romana com escudos em chamas
     */
    formacaoTestudoFlamejante(battle, caster, target) {
        const skillData = {
            name: "🛡️ Formação Testudo Flamejante",
            description: "Adota formação defensiva romana com escudos em chamas",
            animaCost: 40,
            type: "defensive_formation",
            element: "military_fire"
        };

        if (caster.currentAnima < skillData.animaCost) {
            throw new Error('Stamina insuficiente para formar Testudo');
        }

        caster.currentAnima -= skillData.animaCost;

        // Aplicar formação Testudo
        caster.legionCommand = caster.legionCommand || { activeFormation: null, commandRank: 1, veteranBonus: 0 };
        caster.legionCommand.activeFormation = 'testudo';

        // Buff de formação Testudo
        caster.statusEffects = caster.statusEffects || [];
        caster.statusEffects.push({
            type: 'testudo_formation',
            name: 'Formação Testudo',
            duration: 5,
            defenseBonus: 40,
            fireReflection: 0.3,
            damageReduction: 0.4,
            description: 'Formação tartaruga - +40 defesa, reflete 30% dano de fogo, -40% dano recebido'
        });

        // Contra-ataque flamejante quando atacado
        caster.statusEffects.push({
            type: 'flame_counterattack',
            name: 'Contra-ataque Flamejante',
            duration: 5,
            counterDamage: Math.floor(caster.attack * 0.6),
            counterChance: 0.5,
            description: '50% chance de contra-atacar com fogo militar'
        });

        // Cura pequena representando moral elevado
        const moralHeal = Math.floor(caster.maxHP * 0.15);
        caster.currentHP = Math.min(caster.maxHP, caster.currentHP + moralHeal);

        // Aumentar rank de comando
        caster.legionCommand.commandRank = Math.min(caster.legionCommand.commandRank + 1, 5);

        return {
            damage: 0,
            healing: moralHeal,
            animaCost: skillData.animaCost,
            effects: {
                animation: 'testudo_formation',
                shieldWall: true,
                flameShields: true,
                soundEffect: 'shields_clank'
            },
            statusApplied: ['testudo_formation', 'flame_counterattack'],
            culturalNarrative: `🛡️ "TESTUDO!" Aurelius berra o comando e escudos flamejantes se erguem em formação impenetrável!`
        };
    }

    /**
     * ⚔️ Gladius Incendium
     * Ataque preciso com gladius envolvido em chamas sagradas
     */
    gladiusIncendium(battle, caster, target) {
        const skillData = {
            name: "⚔️ Gladius Incendium",
            description: "Ataque preciso com gladius envolvido em chamas sagradas",
            animaCost: 30,
            baseDamage: 90,
            type: "weapon_mastery",
            element: "sacred_fire"
        };

        if (caster.currentAnima < skillData.animaCost) {
            throw new Error('Stamina insuficiente para acender Gladius');
        }

        caster.currentAnima -= skillData.animaCost;

        let damage = skillData.baseDamage;

        // Bônus baseado na formação ativa
        if (caster.legionCommand && caster.legionCommand.activeFormation) {
            const formation = this.formations[caster.legionCommand.activeFormation];
            if (formation && formation.attackBonus) {
                damage += formation.attackBonus;
                battle.addToLog('formation', `⚔️ Formação ${formation.name} amplifica o golpe!`);
            }
        }

        // Precisão romana: chance crítica aumentada
        let criticalChance = 0.25; // 25% base
        
        // Bônus de disciplina militar
        const disciplineEffect = caster.statusEffects?.find(e => e.type === 'centurion_discipline');
        if (disciplineEffect) {
            criticalChance += disciplineEffect.criticalBonus;
        }

        const isCritical = Math.random() < criticalChance;
        if (isCritical) {
            damage = Math.floor(damage * (caster.critico || 2.2));
            battle.addToLog('critical', `🗡️ O Gladius encontra a brecha perfeita com precisão romana!`);
        }

        // Efeito especial: ignora parcialmente armadura (penetração)
        const armorPiercing = Math.floor(target.defense * 0.5);
        damage += armorPiercing;

        // Marca o inimigo para próximos ataques da legião
        target.statusEffects = target.statusEffects || [];
        target.statusEffects.push({
            type: 'legion_mark',
            name: 'Marca da Legião',
            duration: 3,
            vulnerabilityIncrease: 0.2,
            description: 'Marcado pelas legiões - recebe 20% mais dano de Aurelius'
        });

        return {
            damage: damage,
            isCritical: isCritical,
            animaCost: skillData.animaCost,
            effects: {
                animation: 'gladius_thrust',
                flameTrail: true,
                sparkShower: true,
                soundEffect: 'blade_fire'
            },
            statusApplied: ['legion_mark'],
            armorPiercing: armorPiercing,
            culturalNarrative: isCritical ? 
                `⚔️ "GLORIA ROMAE!" O gladius perfura com a precisão de mil veteranos!` :
                `🔥 A lâmina sagrada corta o ar deixando rastro de chamas militares!`
        };
    }

    // Processamento de efeitos únicos

    processTestudoFormationEffect(character, battle, incomingDamage, damageType) {
        const effect = character.statusEffects?.find(e => e.type === 'testudo_formation');
        if (effect) {
            let damageReduction = 0;
            
            // Redução geral de dano
            damageReduction += Math.floor(incomingDamage * effect.damageReduction);
            
            // Reflexão específica contra fogo
            if (damageType === 'fire' || damageType === 'magic') {
                const reflectedDamage = Math.floor(incomingDamage * effect.fireReflection);
                battle.addToLog('reflect', `🛡️ Os escudos flamejantes refletem ${reflectedDamage} de dano!`);
                return {
                    damageReduction: damageReduction,
                    reflectedDamage: reflectedDamage
                };
            }
            
            return { damageReduction: damageReduction };
        }
        return null;
    }

    processFlameCounterattackEffect(character, battle, attacker) {
        const effect = character.statusEffects?.find(e => e.type === 'flame_counterattack');
        if (effect && Math.random() < effect.counterChance) {
            const counterDamage = effect.counterDamage;
            battle.addToLog('counter', `🔥 Aurelius contra-ataca com chamas militares causando ${counterDamage} de dano!`);
            
            return {
                counterDamage: counterDamage,
                counterType: 'fire'
            };
        }
        return null;
    }

    processLegionMarkVulnerability(attacker, target, damage) {
        if (attacker.characterId === this.characterId) {
            const markEffect = target.statusEffects?.find(e => e.type === 'legion_mark');
            if (markEffect) {
                const bonusDamage = Math.floor(damage * markEffect.vulnerabilityIncrease);
                return {
                    bonusDamage: bonusDamage,
                    message: `⚔️ A Marca da Legião amplia o dano em ${bonusDamage}!`
                };
            }
        }
        return null;
    }

    // Utilitários

    getActiveFormation(character) {
        if (character.legionCommand && character.legionCommand.activeFormation) {
            return this.formations[character.legionCommand.activeFormation];
        }
        return null;
    }

    getCommandRank(character) {
        return character.legionCommand ? character.legionCommand.commandRank : 1;
    }

    // Metadata

    getSkillsMetadata() {
        return {
            characterId: this.characterId,
            characterName: this.characterName,
            culture: this.culture,
            skills: [
                {
                    id: 'comando_das_legioes_flamejantes',
                    name: '🔥 Comando das Legiões Flamejantes',
                    animaCost: 0,
                    damage: 85,
                    type: 'command_magic',
                    cooldown: 0,
                    description: 'Invoca legiões espectrais romanas imbuídas com fogo militar'
                },
                {
                    id: 'formacao_testudo_flamejante',
                    name: '🛡️ Formação Testudo Flamejante',
                    animaCost: 40,
                    damage: 0,
                    type: 'defensive_formation',
                    cooldown: 2,
                    description: 'Adota formação defensiva romana com escudos em chamas'
                },
                {
                    id: 'gladius_incendium',
                    name: '⚔️ Gladius Incendium',
                    animaCost: 30,
                    damage: 90,
                    type: 'weapon_mastery',
                    cooldown: 1,
                    description: 'Ataque preciso com gladius envolvido em chamas sagradas'
                }
            ],
            culturalElements: [
                'Táticas militares romanas',
                'Formações de combate das legiões',
                'Disciplina e hierarquia militar',
                'Culto imperial e fogo sagrado',
                'Gladius e equipamentos legionários'
            ],
            formations: this.formations,
            commandSystem: {
                ranks: ['Manipularius', 'Centurio', 'Tribunus', 'Legatus', 'Imperator'],
                bonusPerRank: 10,
                maxRank: 5
            }
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AureliusIgnisvoxSkills;
} else {
    window.AureliusIgnisvoxSkills = AureliusIgnisvoxSkills;
}