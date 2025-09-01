/**
 * ClassManager.js - Core class management functionality for RPGStack Classes Module
 * Version: 3.3.0
 */

export class ClassManager {
    constructor() {
        this.classes = new Map();
        this.loadBaseClasses();
    }

    /**
     * Load base classes from existing battle mechanics
     */
    loadBaseClasses() {
        const baseClasses = [
            {
                id: this.generateId(),
                name: 'Lutador',
                description: 'Especialista em combate corpo a corpo',
                rarity: 'Common',
                stats: {
                    attack: 1.5,
                    defense: 1.0,
                    anima: 0.8,
                    speed: 1.2
                },
                advantages: ['Armamentista'],
                disadvantages: ['Arcano'],
                skills: [],
                baseHP: 120,
                baseAnima: 80,
                criticalMultiplier: 1.0
            },
            {
                id: this.generateId(),
                name: 'Armamentista',
                description: 'Especialista em armas e equipamentos',
                rarity: 'Common',
                stats: {
                    attack: 1.2,
                    defense: 1.5,
                    anima: 0.7,
                    speed: 1.0
                },
                advantages: ['Arcano'],
                disadvantages: ['Lutador'],
                skills: [],
                baseHP: 110,
                baseAnima: 70,
                criticalMultiplier: 1.1
            },
            {
                id: this.generateId(),
                name: 'Arcano',
                description: 'Especialista em magia e habilidades místicas',
                rarity: 'Common',
                stats: {
                    attack: 0.8,
                    defense: 0.7,
                    anima: 2.0,
                    speed: 1.3
                },
                advantages: ['Lutador'],
                disadvantages: ['Armamentista'],
                skills: [],
                baseHP: 80,
                baseAnima: 150,
                criticalMultiplier: 1.3
            }
        ];

        baseClasses.forEach(cls => {
            this.classes.set(cls.id, cls);
        });
    }

    /**
     * Generate hexadecimal ID
     */
    generateId() {
        return Math.random().toString(16).substring(2, 12).toUpperCase();
    }

    /**
     * Create new class
     */
    createClass(classData) {
        const classObj = {
            id: this.generateId(),
            name: classData.name,
            description: classData.description || '',
            rarity: classData.rarity || 'Common',
            stats: {
                attack: parseFloat(classData.attack) || 1.0,
                defense: parseFloat(classData.defense) || 1.0,
                anima: parseFloat(classData.anima) || 1.0,
                speed: parseFloat(classData.speed) || 1.0
            },
            advantages: classData.advantages || [],
            disadvantages: classData.disadvantages || [],
            skills: classData.skills || [],
            baseHP: parseInt(classData.baseHP) || 100,
            baseAnima: parseInt(classData.baseAnima) || 100,
            criticalMultiplier: parseFloat(classData.criticalMultiplier) || 1.0,
            createdAt: new Date().toISOString(),
            isGenerated: classData.isGenerated || false
        };

        this.classes.set(classObj.id, classObj);
        return classObj;
    }

    /**
     * Get all classes
     */
    getAllClasses() {
        return Array.from(this.classes.values());
    }

    /**
     * Get class by ID
     */
    getClassById(id) {
        return this.classes.get(id);
    }

    /**
     * Get class by name
     */
    getClassByName(name) {
        return Array.from(this.classes.values()).find(cls => cls.name === name);
    }

    /**
     * Update class
     */
    updateClass(id, updates) {
        const existingClass = this.classes.get(id);
        if (!existingClass) {
            throw new Error(`Class with ID ${id} not found`);
        }

        const updatedClass = {
            ...existingClass,
            ...updates,
            id: existingClass.id, // Preserve ID
            updatedAt: new Date().toISOString()
        };

        this.classes.set(id, updatedClass);
        return updatedClass;
    }

    /**
     * Delete class
     */
    deleteClass(id) {
        const cls = this.classes.get(id);
        if (cls) {
            this.classes.delete(id);
            return true;
        }
        return false;
    }

    /**
     * Validate class data
     */
    validateClass(classData) {
        const errors = [];

        if (!classData.name || classData.name.trim().length === 0) {
            errors.push('Class name is required');
        }

        if (classData.stats) {
            if (classData.stats.attack < 0.1 || classData.stats.attack > 3.0) {
                errors.push('Attack stat must be between 0.1 and 3.0');
            }
            if (classData.stats.defense < 0.1 || classData.stats.defense > 3.0) {
                errors.push('Defense stat must be between 0.1 and 3.0');
            }
            if (classData.stats.anima < 0.1 || classData.stats.anima > 3.0) {
                errors.push('Anima stat must be between 0.1 and 3.0');
            }
            if (classData.stats.speed < 0.1 || classData.stats.speed > 3.0) {
                errors.push('Speed stat must be between 0.1 and 3.0');
            }
        }

        return errors;
    }

    /**
     * Check for class name conflicts
     */
    hasNameConflict(name, excludeId = null) {
        return Array.from(this.classes.values()).some(cls => 
            cls.name.toLowerCase() === name.toLowerCase() && cls.id !== excludeId
        );
    }

    /**
     * Get classes by rarity
     */
    getClassesByRarity(rarity) {
        return Array.from(this.classes.values()).filter(cls => cls.rarity === rarity);
    }

    /**
     * Get class statistics
     */
    getClassStats() {
        const allClasses = Array.from(this.classes.values());
        const stats = {
            total: allClasses.length,
            byRarity: {},
            generated: allClasses.filter(cls => cls.isGenerated).length,
            manual: allClasses.filter(cls => !cls.isGenerated).length
        };

        // Count by rarity
        allClasses.forEach(cls => {
            stats.byRarity[cls.rarity] = (stats.byRarity[cls.rarity] || 0) + 1;
        });

        return stats;
    }

    /**
     * Export classes data
     */
    exportClasses() {
        return {
            version: '3.3.0',
            exportDate: new Date().toISOString(),
            classes: Array.from(this.classes.values())
        };
    }

    /**
     * Import classes data
     */
    importClasses(data) {
        if (!data.classes || !Array.isArray(data.classes)) {
            throw new Error('Invalid import data format');
        }

        const imported = [];
        data.classes.forEach(classData => {
            try {
                const cls = this.createClass(classData);
                imported.push(cls);
            } catch (error) {
                console.warn(`Failed to import class ${classData.name}:`, error.message);
            }
        });

        return imported;
    }

    /**
     * Calculate total stat points for a class
     */
    calculateTotalStats(classData) {
        if (!classData.stats) return 0;
        return classData.stats.attack + classData.stats.defense + classData.stats.anima + classData.stats.speed;
    }

    /**
     * Check if class is balanced (total stats around 4.0)
     */
    isClassBalanced(classData, tolerance = 0.5) {
        const total = this.calculateTotalStats(classData);
        return Math.abs(total - 4.0) <= tolerance;
    }
}