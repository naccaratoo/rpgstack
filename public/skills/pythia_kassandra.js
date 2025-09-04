/**
 * Pythia Kassandra - Oráculo dos Ventos Divinos
 * Cultura: Grega Clássica | Classe: Oráculo | Elemento: Visões Proféticas
 */

class PythiaKassandraSkills {
    constructor() {
        this.characterName = "Pythia Kassandra";
        this.characterId = "7A8B9C0D1E";
        this.culture = "Grega Clássica";
        this.classe = "Oráculo";
        this.element = "Visões Proféticas";
        
        // Sistema de profecias
        this.prophecyTypes = {
            doom: { name: "Perdição", effect: "debuff_enemy", power: 1.3 },
            fortune: { name: "Fortuna", effect: "buff_self", power: 1.2 },
            insight: { name: "Discernimento", effect: "reveal_weakness", power: 1.5 },
            fate: { name: "Destino", effect: "alter_probability", power: 2.0 }
        };
    }

    /**
     * 🔮 Visão Oracular dos Três Destinos
     * Vislumbra futuros possíveis para alterar o combate
     */
    visaoOracularDosTresDestinos(battle, caster, target) {
        const skillData = {
            name: "🔮 Visão Oracular dos Três Destinos",
            description: "Vislumbra futuros possíveis para alterar o combate",
            manaCost: 35,
            baseDamage: 70,
            type: "prediction",
            element: "divine_sight"
        };

        if (caster.currentMP < skillData.manaCost) {
            throw new Error('Energia divina insuficiente para a visão oracular');
        }

        caster.currentMP -= skillData.manaCost;

        // Inicializar sistema de profecias
        if (!caster.prophecySystem) {
            caster.prophecySystem = {
                activeProphecies: [],
                oracleInsight: 0,
                divineBlessing: 0
            };
        }

        let damage = skillData.baseDamage;

        // Gerar três visões do futuro (aleatórias)
        const futureVisions = this.generateFutureVisions();
        
        // Escolher a visão mais favorável automaticamente (sabedoria oracular)
        const chosenVision = futureVisions.reduce((best, current) => 
            current.favorability > best.favorability ? current : best
        );

        // Aplicar efeito da visão escolhida
        switch (chosenVision.type) {
            case 'doom':
                // Visão de perdição para o inimigo
                target.statusEffects = target.statusEffects || [];
                target.statusEffects.push({
                    type: 'prophetic_doom',
                    name: 'Perdição Profetizada',
                    duration: 4,
                    damageAmplification: 0.3,
                    criticalVulnerability: 0.2,
                    description: 'Destinado ao fracasso - +30% dano recebido, +20% chance de levar crítico'
                });
                damage = Math.floor(damage * 1.4);
                break;

            case 'fortune':
                // Visão de fortuna própria
                caster.statusEffects = caster.statusEffects || [];
                caster.statusEffects.push({
                    type: 'prophetic_fortune',
                    name: 'Fortuna Profetizada',
                    duration: 5,
                    luckyStrike: 0.4,
                    dodgeChance: 0.25,
                    description: '40% chance de golpe de sorte, 25% esquiva'
                });
                damage = Math.floor(damage * 1.2);
                break;

            case 'insight':
                // Visão de fraqueza do inimigo
                const weakness = this.revealEnemyWeakness(target);
                damage = Math.floor(damage * 1.6);
                battle.addToLog('insight', `👁️ Kassandra vislumbra a fraqueza: ${weakness.description}!`);
                break;

            case 'fate':
                // Visão que altera o destino
                caster.prophecySystem.divineBlessing += 2;
                damage = Math.floor(damage * 2.0);
                battle.addToLog('divine', `✨ O DESTINO É REESCRITO! Kassandra canaliza poder divino puro!`);
                break;
        }

        // Aumentar insight oracular
        caster.prophecySystem.oracleInsight++;

        return {
            damage: damage,
            manaCost: skillData.manaCost,
            effects: {
                animation: 'oracle_vision',
                futureGlimpses: futureVisions,
                divineLight: true,
                soundEffect: 'prophecy_whispers'
            },
            statusApplied: [`prophetic_${chosenVision.type}`],
            visionDetails: {
                chosenVision: chosenVision,
                alternativeVisions: futureVisions.filter(v => v !== chosenVision)
            },
            culturalNarrative: `🔮 "${chosenVision.prophecy}" - Kassandra sussurra as palavras do oráculo enquanto o futuro se desenrola diante dela!`
        };
    }

    /**
     * 🌪️ Tempestade Profética de Delfos
     * Invoca os ventos sagrados carregados com fragmentos de profecias
     */
    tempestadeProfeticaDeDelfos(battle, caster, target) {
        const skillData = {
            name: "🌪️ Tempestade Profética de Delfos",
            description: "Invoca os ventos sagrados carregados com fragmentos de profecias",
            manaCost: 50,
            baseDamage: 95,
            type: "divine_storm",
            element: "prophetic_wind"
        };

        if (caster.currentMP < skillData.manaCost) {
            throw new Error('Energia divina insuficiente para invocar a tempestade');
        }

        caster.currentMP -= skillData.manaCost;

        let damage = skillData.baseDamage;

        // Bônus baseado no insight oracular acumulado
        const insightBonus = caster.prophecySystem ? caster.prophecySystem.oracleInsight * 0.1 : 0;
        damage = Math.floor(damage * (1 + insightBonus));

        // Efeito especial: múltiplas rajadas proféticas
        const windBursts = 3 + Math.floor(Math.random() * 3); // 3-5 rajadas
        let totalDamage = 0;

        for (let i = 0; i < windBursts; i++) {
            const burstDamage = Math.floor(damage / windBursts);
            const prophecyFragment = this.generateProphecyFragment();
            
            // Cada rajada pode ter efeito único
            if (prophecyFragment.effect === 'critical') {
                totalDamage += Math.floor(burstDamage * 1.5);
                battle.addToLog('prophetic', `💨 "${prophecyFragment.text}" - Rajada crítica!`);
            } else if (prophecyFragment.effect === 'healing') {
                const healAmount = Math.floor(burstDamage * 0.3);
                caster.currentHP = Math.min(caster.maxHP, caster.currentHP + healAmount);
                totalDamage += burstDamage;
                battle.addToLog('prophetic', `💨 "${prophecyFragment.text}" - Cura ${healAmount}!`);
            } else {
                totalDamage += burstDamage;
                battle.addToLog('prophetic', `💨 "${prophecyFragment.text}"`);
            }
        }

        // Chance de aplicar "Aura Profética"
        if (Math.random() < 0.6) {
            caster.statusEffects = caster.statusEffects || [];
            caster.statusEffects.push({
                type: 'prophetic_aura',
                name: 'Aura Profética',
                duration: 4,
                prophecyPower: 1.3,
                windShield: 0.2,
                description: 'Envolvida pelos ventos de Delfos - habilidades proféticas +30% poder, 20% evasão'
            });
        }

        return {
            damage: totalDamage,
            manaCost: skillData.manaCost,
            effects: {
                animation: 'prophetic_storm',
                windBursts: windBursts,
                oracleWhispers: true,
                screenShake: windBursts >= 5
            },
            statusApplied: ['prophetic_aura'],
            multiHit: windBursts,
            culturalNarrative: `🌪️ Os ventos sagrados de Delfos carregam ${windBursts} fragmentos proféticos em uma tempestade de revelação divina!`
        };
    }

    /**
     * 👁️ Olho de Apolo
     * Canaliza a visão do deus para revelar e explorar todas as fraquezas
     */
    olhoDeApolo(battle, caster, target) {
        const skillData = {
            name: "👁️ Olho de Apolo",
            description: "Canaliza a visão do deus para revelar e explorar todas as fraquezas",
            manaCost: 25,
            type: "divine_insight",
            element: "solar_sight"
        };

        if (caster.currentMP < skillData.manaCost) {
            throw new Error('Energia divina insuficiente para canalizar Apolo');
        }

        caster.currentMP -= skillData.manaCost;

        // Revelar informações completas do inimigo
        const enemyAnalysis = this.performCompleteAnalysis(target);

        // Aplicar buff de "Visão Divina"
        caster.statusEffects = caster.statusEffects || [];
        caster.statusEffects.push({
            type: 'divine_sight',
            name: 'Visão Divina de Apolo',
            duration: 6,
            criticalChance: 0.3,
            weaknessExploit: 0.5,
            perfectAccuracy: true,
            description: 'Enxerga através dos olhos de Apolo - +30% crítico, explora fraquezas, nunca erra'
        });

        // Marcar inimigo como "Analisado"
        target.statusEffects = target.statusEffects || [];
        target.statusEffects.push({
            type: 'analyzed',
            name: 'Completamente Analisado',
            duration: 8,
            vulnerabilityIncrease: 0.4,
            defensePenalty: 20,
            description: 'Todas as fraquezas reveladas - +40% dano recebido, -20 defesa'
        });

        return {
            damage: 0,
            manaCost: skillData.manaCost,
            effects: {
                animation: 'divine_eye_opening',
                solarBeam: true,
                revelation: true,
                soundEffect: 'apollo_blessing'
            },
            statusApplied: ['divine_sight', 'analyzed'],
            enemyAnalysis: enemyAnalysis,
            culturalNarrative: `👁️ O terceiro olho se abre! Kassandra vê através da luz de Apolo e todas as verdades são reveladas!`
        };
    }

    // Utilitários para sistema profético

    generateFutureVisions() {
        const visionTemplates = [
            { type: 'doom', prophecy: "Vejo sua queda em chamas douradas...", favorability: 0.8 },
            { type: 'fortune', prophecy: "Os ventos sussurram minha vitória...", favorability: 0.7 },
            { type: 'insight', prophecy: "A fraqueza se revela através da névoa...", favorability: 0.9 },
            { type: 'fate', prophecy: "O destino dobra-se à minha vontade...", favorability: 1.0 }
        ];

        // Selecionar 3 visões aleatórias
        const shuffled = [...visionTemplates].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3).map(template => ({
            ...template,
            favorability: template.favorability + (Math.random() - 0.5) * 0.3
        }));
    }

    generateProphecyFragment() {
        const fragments = [
            { text: "O ferro se voltará contra seu dono", effect: "damage" },
            { text: "Sangue manchará o chão sagrado", effect: "critical" },
            { text: "A luz curará as feridas da alma", effect: "healing" },
            { text: "Sombras dançam sobre o campo de batalha", effect: "damage" },
            { text: "O destino favorece os corajosos", effect: "critical" },
            { text: "Águas sagradas lavarão a dor", effect: "healing" }
        ];

        return fragments[Math.floor(Math.random() * fragments.length)];
    }

    revealEnemyWeakness(target) {
        const weaknesses = [
            { type: 'armor_gap', description: "falha na armadura no lado esquerdo", multiplier: 1.4 },
            { type: 'magical_vulnerability', description: "resistência mágica baixa", multiplier: 1.6 },
            { type: 'balance_issue', description: "postura instável", multiplier: 1.3 },
            { type: 'fear_of_fire', description: "teme as chamas", multiplier: 1.5 }
        ];

        const chosenWeakness = weaknesses[Math.floor(Math.random() * weaknesses.length)];
        
        // Aplicar fraqueza como debuff temporário
        target.statusEffects = target.statusEffects || [];
        target.statusEffects.push({
            type: 'revealed_weakness',
            name: `Fraqueza Revelada: ${chosenWeakness.description}`,
            duration: 3,
            damageMultiplier: chosenWeakness.multiplier,
            weaknessType: chosenWeakness.type
        });

        return chosenWeakness;
    }

    performCompleteAnalysis(target) {
        return {
            currentHP: target.currentHP,
            maxHP: target.maxHP,
            currentMP: target.currentMP,
            attack: target.attack,
            defense: target.defense,
            criticalChance: target.critico || 2.0,
            statusEffects: target.statusEffects || [],
            predictedNextAction: this.predictEnemyAction(target),
            optimalCounterStrategy: this.suggestCounterStrategy(target)
        };
    }

    predictEnemyAction(target) {
        // Simulação simples de predição
        const actions = ['attack', 'defend', 'special'];
        const weights = [0.5, 0.3, 0.2];
        
        // Ajustar pesos baseado na vida atual
        const hpPercent = target.currentHP / target.maxHP;
        if (hpPercent < 0.3) {
            weights[1] += 0.3; // mais defensivo
            weights[2] += 0.2; // mais especiais
            weights[0] -= 0.5; // menos ataques
        }

        return {
            mostLikely: actions[0],
            confidence: 0.7 + Math.random() * 0.3,
            reasoning: `Baseado na situação atual e padrões de comportamento`
        };
    }

    suggestCounterStrategy(target) {
        const hpPercent = target.currentHP / target.maxHP;
        
        if (hpPercent > 0.7) {
            return "Foque em dano sustentado e aplicação de debuffs";
        } else if (hpPercent > 0.3) {
            return "Prepare-se para ataques desesperados, mantenha defesas";
        } else {
            return "Finalize rapidamente antes que use habilidades especiais";
        }
    }

    // Processamento de efeitos

    processPropheticFortuneEffect(character, battle, actionType) {
        const effect = character.statusEffects?.find(e => e.type === 'prophetic_fortune');
        if (effect && actionType === 'attack') {
            if (Math.random() < effect.luckyStrike) {
                battle.addToLog('fortune', `🍀 A Fortuna Profetizada se manifesta em um golpe perfeito!`);
                return { luckyStrike: true, damageMultiplier: 1.5 };
            }
        }
        return null;
    }

    processDivineSightEffect(character, battle, target) {
        const effect = character.statusEffects?.find(e => e.type === 'divine_sight');
        if (effect) {
            // Aplicar exploração de fraqueza
            const analyzedEffect = target.statusEffects?.find(e => e.type === 'analyzed');
            if (analyzedEffect) {
                const bonusDamage = effect.weaknessExploit;
                return {
                    damageMultiplier: 1 + bonusDamage,
                    message: `👁️ A Visão Divina explora as fraquezas reveladas!`
                };
            }
        }
        return null;
    }

    // Metadata

    getSkillsMetadata() {
        return {
            characterId: this.characterId,
            characterName: this.characterName,
            culture: this.culture,
            skills: [
                {
                    id: 'visao_oracular_dos_tres_destinos',
                    name: '🔮 Visão Oracular dos Três Destinos',
                    manaCost: 35,
                    damage: 70,
                    type: 'prediction',
                    cooldown: 0,
                    description: 'Vislumbra futuros possíveis para alterar o combate'
                },
                {
                    id: 'tempestade_profetica_de_delfos',
                    name: '🌪️ Tempestade Profética de Delfos',
                    manaCost: 50,
                    damage: 95,
                    type: 'divine_storm',
                    cooldown: 2,
                    description: 'Invoca os ventos sagrados carregados com fragmentos de profecias'
                },
                {
                    id: 'olho_de_apolo',
                    name: '👁️ Olho de Apolo',
                    manaCost: 25,
                    damage: 0,
                    type: 'divine_insight',
                    cooldown: 3,
                    description: 'Canaliza a visão do deus para revelar e explorar todas as fraquezas'
                }
            ],
            culturalElements: [
                'Oráculo de Delfos e tradições proféticas',
                'Mitologia grega - Apolo e Kassandra',
                'Ventos sagrados e vapores terrestres',
                'Sistema de interpretação de presságios',
                'Tragédia da profetisa amaldiçoada'
            ],
            prophecySystem: this.prophecyTypes,
            divinePatron: 'Apolo - Deus da Profecia, Luz e Música'
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PythiaKassandraSkills;
} else {
    window.PythiaKassandraSkills = PythiaKassandraSkills;
}