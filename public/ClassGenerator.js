/**
 * ClassGenerator.js - Algorithmic class generation logic for RPGStack Classes Module
 * Version: 3.3.0
 */

export class ClassGenerator {
    constructor() {
        this.rarityMultipliers = {
            'Common': { min: 0.8, max: 1.2, budget: 4.0 },
            'Rare': { min: 0.7, max: 1.4, budget: 4.5 },
            'Epic': { min: 0.6, max: 1.6, budget: 5.0 },
            'Legendary': { min: 0.5, max: 2.0, budget: 5.5 }
        };

        this.classNamePrefixes = [
            'Sombra', 'Ferro', 'Cristal', 'Vento', 'Chama', 'Gelo', 'Trovão',
            'Terra', 'Luz', 'Sangue', 'Espírito', 'Astral', 'Temporal', 'Void',
            'Élfico', 'Dracônico', 'Celestial', 'Infernal', 'Arcano', 'Primal'
        ];

        this.classNameSuffixes = [
            'mante', 'guarda', 'lâmina', 'punho', 'mente', 'coração', 'alma',
            'senhor', 'mestre', 'cavaleiro', 'assassino', 'sábio', 'oráculo',
            'invocador', 'destruidor', 'protetor', 'caçador', 'andarilho', 'guardião'
        ];

        this.advantagePool = [
            'Lutador', 'Armamentista', 'Arcano', 'Assassino', 'Paladino',
            'Druida', 'Necromante', 'Bardo', 'Ranger', 'Monge', 'Universal',
            'Guerreiro', 'Mago', 'Clérigo', 'Ladino', 'Bárbaro', 'Feiticeiro',
            'Bruxo', 'Explorador', 'Caçador', 'Guardião', 'Místico',
            'Elementalista', 'Invocador', 'Templário', 'Xamã'
        ];
    }

    /**
     * Generate a balanced class using algorithmic distribution
     */
    generateBalancedClass(rarity = 'Common', options = {}) {
        const config = this.rarityMultipliers[rarity];
        if (!config) {
            throw new Error(`Invalid rarity: ${rarity}`);
        }

        // Generate class name
        const name = options.name || this.generateClassName();

        // Generate stat distribution
        const stats = this.generateStatDistribution(config);

        // Generate advantages/disadvantages
        const { advantages, disadvantages } = this.generateAdvantages();

        // Generate base values based on stats
        const baseHP = this.calculateBaseHP(stats);
        const baseAnima = this.calculateBaseAnima(stats);
        const criticalMultiplier = this.calculateCriticalMultiplier(stats, rarity);

        return {
            name,
            description: this.generateDescription(name, stats),
            rarity,
            stats,
            advantages,
            disadvantages,
            skills: [],
            baseHP,
            baseAnima,
            criticalMultiplier,
            isGenerated: true,
            generationAlgorithm: 'balanced_v1.0'
        };
    }

    /**
     * Generate random class with specified focus
     */
    generateFocusedClass(focus = 'balanced', rarity = 'Common') {
        const config = this.rarityMultipliers[rarity];
        let stats;

        switch (focus) {
            case 'attack':
                stats = this.generateAttackFocusedStats(config);
                break;
            case 'defense':
                stats = this.generateDefenseFocusedStats(config);
                break;
            case 'magic':
                stats = this.generateMagicFocusedStats(config);
                break;
            case 'speed':
                stats = this.generateSpeedFocusedStats(config);
                break;
            default:
                stats = this.generateStatDistribution(config);
        }

        const name = this.generateClassName();
        const { advantages, disadvantages } = this.generateAdvantages();

        return {
            name,
            description: this.generateDescription(name, stats, focus),
            rarity,
            stats,
            advantages,
            disadvantages,
            skills: [],
            baseHP: this.calculateBaseHP(stats),
            baseAnima: this.calculateBaseAnima(stats),
            criticalMultiplier: this.calculateCriticalMultiplier(stats, rarity),
            isGenerated: true,
            generationAlgorithm: `${focus}_focused_v1.0`
        };
    }

    /**
     * Generate hybrid class combining two existing classes
     */
    generateHybridClass(class1, class2, rarity = 'Rare') {
        const name = `${class1.name} ${class2.name}`.replace(/(.{15}).+/, '$1...');
        
        // Blend stats from both classes
        const stats = {
            attack: this.blendStats(class1.stats.attack, class2.stats.attack),
            defense: this.blendStats(class1.stats.defense, class2.stats.defense),
            anima: this.blendStats(class1.stats.anima, class2.stats.anima),
            speed: this.blendStats(class1.stats.speed, class2.stats.speed)
        };

        // Normalize to rarity budget
        this.normalizeStats(stats, this.rarityMultipliers[rarity].budget);

        // Combine advantages/disadvantages
        const advantages = [...new Set([...class1.advantages, ...class2.advantages])].slice(0, 2);
        const disadvantages = [...new Set([...class1.disadvantages, ...class2.disadvantages])].slice(0, 2);

        return {
            name,
            description: `Híbrido que combina características de ${class1.name} e ${class2.name}`,
            rarity,
            stats,
            advantages,
            disadvantages,
            skills: [],
            baseHP: this.calculateBaseHP(stats),
            baseAnima: this.calculateBaseAnima(stats),
            criticalMultiplier: this.calculateCriticalMultiplier(stats, rarity),
            isGenerated: true,
            generationAlgorithm: 'hybrid_v1.0',
            parentClasses: [class1.name, class2.name]
        };
    }

    /**
     * Generate stat distribution within budget
     */
    generateStatDistribution(config) {
        const { min, max, budget } = config;
        let remaining = budget;
        const stats = {};

        // Generate three stats first
        const statNames = ['attack', 'defense', 'anima', 'speed'];
        for (let i = 0; i < 3; i++) {
            const minAllowed = Math.max(min, remaining - (3 - i - 1) * max);
            const maxAllowed = Math.min(max, remaining - (3 - i - 1) * min);
            const value = this.randomInRange(minAllowed, maxAllowed);
            stats[statNames[i]] = this.roundToDecimal(value, 1);
            remaining -= stats[statNames[i]];
        }

        // Assign remaining to last stat
        stats.speed = this.roundToDecimal(Math.max(min, Math.min(max, remaining)), 1);

        return stats;
    }

    /**
     * Generate attack-focused stats
     */
    generateAttackFocusedStats(config) {
        const stats = this.generateStatDistribution(config);
        // Boost attack at expense of other stats
        const boost = this.randomInRange(0.2, 0.4);
        stats.attack = Math.min(config.max, stats.attack + boost);
        
        // Redistribute excess
        const excess = (stats.attack + boost) - Math.min(config.max, stats.attack + boost);
        if (excess > 0) {
            const otherStats = ['defense', 'anima', 'speed'];
            otherStats.forEach(stat => {
                stats[stat] = Math.max(config.min, stats[stat] - excess / 3);
            });
        }

        return this.normalizeStats(stats, config.budget);
    }

    /**
     * Generate defense-focused stats
     */
    generateDefenseFocusedStats(config) {
        const stats = this.generateStatDistribution(config);
        const boost = this.randomInRange(0.2, 0.4);
        stats.defense = Math.min(config.max, stats.defense + boost);
        
        const excess = (stats.defense + boost) - Math.min(config.max, stats.defense + boost);
        if (excess > 0) {
            const otherStats = ['attack', 'anima', 'speed'];
            otherStats.forEach(stat => {
                stats[stat] = Math.max(config.min, stats[stat] - excess / 3);
            });
        }

        return this.normalizeStats(stats, config.budget);
    }

    /**
     * Generate magic-focused stats
     */
    generateMagicFocusedStats(config) {
        const stats = this.generateStatDistribution(config);
        const boost = this.randomInRange(0.3, 0.6);
        stats.anima = Math.min(config.max, stats.anima + boost);
        
        const excess = (stats.anima + boost) - Math.min(config.max, stats.anima + boost);
        if (excess > 0) {
            const otherStats = ['attack', 'defense', 'speed'];
            otherStats.forEach(stat => {
                stats[stat] = Math.max(config.min, stats[stat] - excess / 3);
            });
        }

        return this.normalizeStats(stats, config.budget);
    }

    /**
     * Generate speed-focused stats
     */
    generateSpeedFocusedStats(config) {
        const stats = this.generateStatDistribution(config);
        const boost = this.randomInRange(0.2, 0.5);
        stats.speed = Math.min(config.max, stats.speed + boost);
        
        const excess = (stats.speed + boost) - Math.min(config.max, stats.speed + boost);
        if (excess > 0) {
            const otherStats = ['attack', 'defense', 'anima'];
            otherStats.forEach(stat => {
                stats[stat] = Math.max(config.min, stats[stat] - excess / 3);
            });
        }

        return this.normalizeStats(stats, config.budget);
    }

    /**
     * Normalize stats to fit within budget
     */
    normalizeStats(stats, targetBudget) {
        const currentTotal = stats.attack + stats.defense + stats.anima + stats.speed;
        const factor = targetBudget / currentTotal;

        stats.attack = this.roundToDecimal(stats.attack * factor, 1);
        stats.defense = this.roundToDecimal(stats.defense * factor, 1);
        stats.anima = this.roundToDecimal(stats.anima * factor, 1);
        stats.speed = this.roundToDecimal(stats.speed * factor, 1);

        return stats;
    }

    /**
     * Generate class name
     */
    generateClassName() {
        const prefix = this.classNamePrefixes[Math.floor(Math.random() * this.classNamePrefixes.length)];
        const suffix = this.classNameSuffixes[Math.floor(Math.random() * this.classNameSuffixes.length)];
        return `${prefix}${suffix}`;
    }

    /**
     * Generate advantages and disadvantages
     */
    generateAdvantages() {
        const shuffled = [...this.advantagePool].sort(() => Math.random() - 0.5);
        const advantages = shuffled.slice(0, this.randomInt(1, 3));
        const disadvantages = shuffled.slice(3, 3 + this.randomInt(1, 2));
        
        return { advantages, disadvantages };
    }

    /**
     * Generate description based on stats and focus
     */
    generateDescription(name, stats, focus = null) {
        let description = `Classe ${name} `;

        if (focus) {
            const focusDescriptions = {
                attack: 'especializada em combate ofensivo',
                defense: 'focada em resistência e proteção',
                magic: 'dominando artes místicas e ânima',
                speed: 'priorizando agilidade e mobilidade'
            };
            description += focusDescriptions[focus] || 'com habilidades equilibradas';
        } else {
            // Auto-detect focus based on highest stat
            const highest = Object.entries(stats).reduce((a, b) => stats[a[0]] > stats[b[0]] ? a : b);
            const statDescriptions = {
                attack: 'com foco em ataque',
                defense: 'com ênfase em defesa',
                anima: 'especializada em magia',
                speed: 'priorizando velocidade'
            };
            description += statDescriptions[highest[0]] || 'com características balanceadas';
        }

        return description + '.';
    }

    /**
     * Calculate base HP from stats
     */
    calculateBaseHP(stats) {
        const base = 100;
        const defenseMod = (stats.defense - 1.0) * 30;
        const attackMod = (stats.attack - 1.0) * 10;
        return Math.round(base + defenseMod + attackMod);
    }

    /**
     * Calculate base Anima from stats
     */
    calculateBaseAnima(stats) {
        const base = 100;
        const animaMod = (stats.anima - 1.0) * 50;
        return Math.round(base + animaMod);
    }

    /**
     * Calculate critical multiplier
     */
    calculateCriticalMultiplier(stats, rarity) {
        let base = 1.0;
        
        // Speed contributes to critical chance
        base += (stats.speed - 1.0) * 0.1;
        
        // Rarity bonus
        const rarityBonus = {
            'Common': 0.0,
            'Rare': 0.1,
            'Epic': 0.2,
            'Legendary': 0.3
        };
        
        base += rarityBonus[rarity] || 0.0;
        
        return this.roundToDecimal(Math.max(1.0, Math.min(2.0, base)), 1);
    }

    /**
     * Blend two stat values for hybrid generation
     */
    blendStats(stat1, stat2) {
        const weight = this.randomInRange(0.3, 0.7);
        return this.roundToDecimal(stat1 * weight + stat2 * (1 - weight), 1);
    }

    /**
     * Utility: Random number in range
     */
    randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    /**
     * Utility: Random integer
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Utility: Round to decimal places
     */
    roundToDecimal(number, decimals) {
        return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }

    /**
     * Validate generated class
     */
    validateGeneratedClass(classData) {
        const errors = [];
        
        // Check stat bounds
        Object.entries(classData.stats).forEach(([stat, value]) => {
            if (value < 0.1 || value > 3.0) {
                errors.push(`${stat} value ${value} is out of bounds (0.1-3.0)`);
            }
        });

        // Check total stats
        const total = Object.values(classData.stats).reduce((sum, val) => sum + val, 0);
        if (total < 3.0 || total > 6.0) {
            errors.push(`Total stats ${total} is out of acceptable range (3.0-6.0)`);
        }

        // Check critical multiplier
        if (classData.criticalMultiplier < 1.0 || classData.criticalMultiplier > 2.0) {
            errors.push(`Critical multiplier ${classData.criticalMultiplier} is out of bounds (1.0-2.0)`);
        }

        return errors;
    }

    /**
     * Generate multiple classes at once
     */
    generateClassBatch(count = 5, options = {}) {
        const classes = [];
        const { rarity = 'Common', focus = 'balanced', allowDuplicateNames = false } = options;
        const usedNames = new Set();

        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let classData;
            
            do {
                classData = this.generateFocusedClass(focus, rarity);
                attempts++;
            } while (!allowDuplicateNames && usedNames.has(classData.name) && attempts < 10);

            if (!usedNames.has(classData.name)) {
                usedNames.add(classData.name);
                classes.push(classData);
            }
        }

        return classes;
    }
}