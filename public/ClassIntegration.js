/**
 * ClassIntegration.js - Integration with existing RPGStack modules
 * Version: 3.3.0
 */

export class ClassIntegration {
    constructor() {
        this.battleMechanicsCache = null;
        this.characterCache = new Map();
        this.skillsCache = new Map();
    }

    /**
     * Initialize integration with existing battle mechanics
     */
    async initializeBattleMechanics() {
        try {
            // Import battle mechanics if available
            if (window.BattleMechanics) {
                this.battleMechanics = new window.BattleMechanics();
                return true;
            }
            return false;
        } catch (error) {
            console.warn('Battle mechanics not available:', error.message);
            return false;
        }
    }

    /**
     * Sync new class with battle mechanics advantage system
     */
    syncClassWithBattleMechanics(classData) {
        if (!this.battleMechanics) {
            console.warn('Battle mechanics not initialized');
            return classData;
        }

        // Validate advantages against existing system
        const validClasses = this.getValidClassNames();
        const filteredAdvantages = classData.advantages.filter(cls => 
            validClasses.includes(cls)
        );
        const filteredDisadvantages = classData.disadvantages.filter(cls => 
            validClasses.includes(cls)
        );

        return {
            ...classData,
            advantages: filteredAdvantages,
            disadvantages: filteredDisadvantages,
            isSynced: true
        };
    }

    /**
     * Get valid class names from battle mechanics
     */
    getValidClassNames() {
        if (this.battleMechanics && this.battleMechanics.constructor.getValidClasses) {
            return this.battleMechanics.constructor.getValidClasses();
        }
        
        // Fallback to base classes
        return ['Lutador', 'Armamentista', 'Arcano'];
    }

    /**
     * Calculate battle advantage for new class
     */
    calculateBattleAdvantage(attackerClass, defenderClass) {
        if (!this.battleMechanics) {
            // Fallback calculation
            return this.fallbackAdvantageCalculation(attackerClass, defenderClass);
        }

        try {
            return this.battleMechanics.hasAdvantage(attackerClass, defenderClass);
        } catch (error) {
            console.warn('Error calculating advantage:', error.message);
            return this.fallbackAdvantageCalculation(attackerClass, defenderClass);
        }
    }

    /**
     * Fallback advantage calculation for generated classes
     */
    fallbackAdvantageCalculation(attackerClass, defenderClass) {
        // Simple rock-paper-scissors logic
        const advantages = {
            'Lutador': ['Armamentista'],
            'Armamentista': ['Arcano'],
            'Arcano': ['Lutador']
        };

        return advantages[attackerClass]?.includes(defenderClass) || false;
    }

    /**
     * Integrate class with character creation
     */
    async integrateWithCharacterCreation(classData) {
        try {
            // Check if character database is available
            const response = await fetch('/api/classes/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ classe: classData.name })
            });

            if (!response.ok) {
                throw new Error('Class validation failed');
            }

            const result = await response.json();
            return {
                ...classData,
                isValidForCharacters: result.valid,
                integrationStatus: 'success'
            };
        } catch (error) {
            console.warn('Character integration failed:', error.message);
            return {
                ...classData,
                isValidForCharacters: false,
                integrationStatus: 'failed',
                integrationError: error.message
            };
        }
    }

    /**
     * Sync class with skills module
     */
    async syncWithSkillsModule(classData) {
        try {
            // Fetch available skills for this class
            const response = await fetch(`/api/skills?classe=${encodeURIComponent(classData.name)}`);
            
            if (response.ok) {
                const skills = await response.json();
                return {
                    ...classData,
                    availableSkills: skills,
                    skillsIntegrated: true
                };
            }
        } catch (error) {
            console.warn('Skills integration failed:', error.message);
        }

        return {
            ...classData,
            availableSkills: [],
            skillsIntegrated: false
        };
    }

    /**
     * Create character with new class
     */
    async createCharacterWithClass(characterData, classData) {
        const characterPayload = {
            ...characterData,
            classe: classData.name,
            anima: classData.baseAnima,
            critico: classData.criticalMultiplier,
            stats: {
                ...characterData.stats,
                maxHP: Math.round((characterData.stats?.maxHP || 100) * classData.stats.defense),
            }
        };

        try {
            const response = await fetch('/api/characters', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(characterPayload)
            });

            if (!response.ok) {
                throw new Error(`Character creation failed: ${response.statusText}`);
            }

            const character = await response.json();
            this.characterCache.set(character.id, { ...character, classData });
            return character;
        } catch (error) {
            console.error('Failed to create character with new class:', error.message);
            throw error;
        }
    }

    /**
     * Apply class stats to existing character
     */
    applyClassStatsToCharacter(character, classData) {
        const baseStats = character.stats || {};
        
        return {
            ...character,
            classe: classData.name,
            anima: classData.baseAnima,
            critico: classData.criticalMultiplier,
            stats: {
                hp: baseStats.hp || baseStats.maxHP || classData.baseHP,
                maxHP: Math.round((baseStats.maxHP || classData.baseHP) * classData.stats.defense),
                attack: Math.round((baseStats.attack || 20) * classData.stats.attack),
                defense: Math.round((baseStats.defense || 15) * classData.stats.defense)
            }
        };
    }

    /**
     * Validate class compatibility with existing system
     */
    validateClassCompatibility(classData) {
        const issues = [];
        
        // Check stat ranges
        Object.entries(classData.stats).forEach(([stat, value]) => {
            if (value < 0.1 || value > 3.0) {
                issues.push(`${stat} value ${value} is outside acceptable range (0.1-3.0)`);
            }
        });

        // Check critical multiplier
        if (classData.criticalMultiplier < 1.0 || classData.criticalMultiplier > 2.0) {
            issues.push(`Critical multiplier ${classData.criticalMultiplier} is outside range (1.0-2.0)`);
        }

        // Check base values
        if (classData.baseHP < 50 || classData.baseHP > 200) {
            issues.push(`Base HP ${classData.baseHP} is outside typical range (50-200)`);
        }

        if (classData.baseAnima < 30 || classData.baseAnima > 300) {
            issues.push(`Base Anima ${classData.baseAnima} is outside typical range (30-300)`);
        }

        return {
            isCompatible: issues.length === 0,
            issues
        };
    }

    /**
     * Export class for backend integration
     */
    exportClassForBackend(classData) {
        return {
            id: classData.id,
            name: classData.name,
            description: classData.description,
            rarity: classData.rarity,
            stats: classData.stats,
            advantages: classData.advantages,
            disadvantages: classData.disadvantages,
            baseHP: classData.baseHP,
            baseAnima: classData.baseAnima,
            criticalMultiplier: classData.criticalMultiplier,
            isGenerated: classData.isGenerated,
            createdAt: classData.createdAt || new Date().toISOString(),
            version: '3.3.0'
        };
    }

    /**
     * Sync all classes with backend
     */
    async syncAllClassesWithBackend(classes) {
        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        for (const classData of classes) {
            try {
                const exportData = this.exportClassForBackend(classData);
                const response = await fetch('/api/classes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(exportData)
                });

                if (response.ok) {
                    results.success++;
                } else {
                    results.failed++;
                    results.errors.push({
                        class: classData.name,
                        error: `HTTP ${response.status}: ${response.statusText}`
                    });
                }
            } catch (error) {
                results.failed++;
                results.errors.push({
                    class: classData.name,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Load classes from backend
     */
    async loadClassesFromBackend() {
        try {
            const response = await fetch('/api/classes');
            if (!response.ok) {
                throw new Error(`Failed to load classes: ${response.statusText}`);
            }
            
            const classes = await response.json();
            return classes.map(cls => ({
                ...cls,
                loadedFromBackend: true,
                loadedAt: new Date().toISOString()
            }));
        } catch (error) {
            console.error('Failed to load classes from backend:', error.message);
            return [];
        }
    }

    /**
     * Update battle mechanics with new class
     */
    updateBattleMechanicsWithClass(classData) {
        if (!this.battleMechanics) {
            return false;
        }

        try {
            // Add class to valid classes list if method exists
            if (this.battleMechanics.addValidClass) {
                this.battleMechanics.addValidClass(classData.name);
            }

            // Update advantage mappings
            if (this.battleMechanics.setAdvantages) {
                this.battleMechanics.setAdvantages(classData.name, classData.advantages);
                this.battleMechanics.setDisadvantages(classData.name, classData.disadvantages);
            }

            return true;
        } catch (error) {
            console.warn('Failed to update battle mechanics:', error.message);
            return false;
        }
    }

    /**
     * Generate integration report
     */
    generateIntegrationReport(classData) {
        const report = {
            className: classData.name,
            timestamp: new Date().toISOString(),
            battleMechanics: {
                available: !!this.battleMechanics,
                synced: classData.isSynced || false,
                validAdvantages: classData.advantages?.length || 0,
                validDisadvantages: classData.disadvantages?.length || 0
            },
            character: {
                compatible: this.validateClassCompatibility(classData).isCompatible,
                issues: this.validateClassCompatibility(classData).issues
            },
            skills: {
                integrated: classData.skillsIntegrated || false,
                availableSkills: classData.availableSkills?.length || 0
            },
            backend: {
                synced: classData.backendSynced || false,
                lastSync: classData.lastBackendSync || null
            }
        };

        return report;
    }

    /**
     * Cleanup integration data
     */
    cleanup() {
        this.characterCache.clear();
        this.skillsCache.clear();
        this.battleMechanicsCache = null;
    }
}