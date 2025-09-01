/**
 * CapCrit.js - Critical Cap System for Instant Kill Mechanics
 * Version: 1.0.0
 * 
 * Sistema que controla instant kills baseado em crítico exato de 100%
 * Apenas personagens com exatamente 100% de crítico podem dar instant kill
 * Personagens meditando são imunes a instant kill por crítico
 */

class CapCritSystem {
    constructor() {
        this.version = '1.0.0';
        this.name = 'Critical Cap System';
        this.exactCriticalThreshold = 100; // Exatamente 100% para instant kill
    }

    /**
     * Calcula a chance crítica final do personagem
     * @param {Object} character - Dados do personagem
     * @param {number} skillBaseCritical - Crítico base da skill (ex: 30%)
     * @returns {number} Chance crítica final
     */
    calculateFinalCritical(character, skillBaseCritical = 0) {
        const characterCritical = character.critico || 0;
        const finalCritical = skillBaseCritical + characterCritical;
        
        console.log(`🎯 CapCrit: ${character.name}`);
        console.log(`   Skill Base: ${skillBaseCritical}%`);
        console.log(`   Character: ${characterCritical}%`);
        console.log(`   Final: ${finalCritical}%`);
        
        return finalCritical;
    }

    /**
     * Verifica se o personagem tem direito a instant kill
     * @param {Object} character - Dados do personagem
     * @param {number} skillBaseCritical - Crítico base da skill
     * @returns {boolean} True se tem direito a instant kill
     */
    hasInstantKillRight(character, skillBaseCritical = 30) {
        const finalCritical = this.calculateFinalCritical(character, skillBaseCritical);
        const hasExact100 = finalCritical === this.exactCriticalThreshold;
        
        console.log(`💀 CapCrit Instant Kill Check: ${character.name}`);
        console.log(`   Final Critical: ${finalCritical}%`);
        console.log(`   Exact 100%: ${hasExact100}`);
        console.log(`   Instant Kill Right: ${hasExact100}`);
        
        return hasExact100;
    }

    /**
     * Verifica se o alvo está protegido contra instant kill
     * @param {Object} target - Personagem alvo
     * @returns {boolean} True se está protegido
     */
    isProtectedFromInstantKill(target) {
        const isMeditating = target.isMeditating || target.meditationActive || false;
        
        console.log(`🛡️ CapCrit Protection Check: ${target.name}`);
        console.log(`   Is Meditating: ${isMeditating}`);
        console.log(`   Protected: ${isMeditating}`);
        
        return isMeditating;
    }

    /**
     * Processa um ataque crítico e determina se causa instant kill
     * @param {Object} attacker - Personagem atacante
     * @param {Object} target - Personagem alvo
     * @param {number} skillBaseCritical - Crítico base da skill
     * @returns {Object} Resultado do ataque crítico
     */
    processCriticalAttack(attacker, target, skillBaseCritical = 30) {
        const hasInstantKillRight = this.hasInstantKillRight(attacker, skillBaseCritical);
        const targetProtected = this.isProtectedFromInstantKill(target);
        
        const result = {
            attacker: attacker.name,
            target: target.name,
            attackerCritical: this.calculateFinalCritical(attacker, skillBaseCritical),
            hasInstantKillRight: hasInstantKillRight,
            targetProtected: targetProtected,
            instantKillOccurs: hasInstantKillRight && !targetProtected,
            damageType: 'normal'
        };

        if (result.instantKillOccurs) {
            result.damageType = 'instant_kill';
            result.message = `💀 INSTANT KILL! ${attacker.name} (100% crítico exato) eliminou ${target.name}!`;
        } else if (hasInstantKillRight && targetProtected) {
            result.damageType = 'critical_blocked';
            result.message = `🛡️ CRITICAL BLOCKED! ${target.name} estava meditando e bloqueou o instant kill de ${attacker.name}!`;
        } else if (!hasInstantKillRight) {
            result.damageType = 'critical_normal';
            result.message = `⚡ Crítico normal! ${attacker.name} (${result.attackerCritical}% crítico) causou dano crítico em ${target.name}.`;
        }

        console.log(`🎯 CapCrit Attack Result:`, result);
        return result;
    }

    /**
     * Valida as estatísticas de um personagem para instant kill
     * @param {Object} character - Dados do personagem
     * @returns {Object} Relatório de validação
     */
    validateCharacterForInstantKill(character) {
        const arsenalCritical = this.calculateFinalCritical(character, 30);
        const hasInstantKillCapability = arsenalCritical === 100;
        
        const report = {
            characterName: character.name,
            characterCritical: character.critico || 0,
            arsenalBaseCritical: 30,
            finalCritical: arsenalCritical,
            hasInstantKillCapability: hasInstantKillCapability,
            instantKillRate: hasInstantKillCapability ? '100%' : '0%',
            classification: hasInstantKillCapability ? 'INSTANT_KILLER' : 'NORMAL_FIGHTER'
        };

        console.log(`📊 CapCrit Character Validation: ${character.name}`);
        console.log(`   Character Critical: ${report.characterCritical}`);
        console.log(`   Final Critical: ${report.finalCritical}%`);
        console.log(`   Instant Kill Capable: ${report.hasInstantKillCapability}`);
        console.log(`   Classification: ${report.classification}`);

        return report;
    }

    /**
     * Gera relatório completo do sistema para todos os personagens
     * @param {Array} characters - Array de personagens
     * @returns {Object} Relatório completo
     */
    generateSystemReport(characters) {
        const report = {
            systemVersion: this.version,
            exactCriticalThreshold: this.exactCriticalThreshold,
            characters: {},
            instantKillers: [],
            normalFighters: [],
            summary: {}
        };

        characters.forEach(character => {
            const validation = this.validateCharacterForInstantKill(character);
            report.characters[character.name] = validation;

            if (validation.hasInstantKillCapability) {
                report.instantKillers.push(character.name);
            } else {
                report.normalFighters.push(character.name);
            }
        });

        report.summary = {
            totalCharacters: characters.length,
            instantKillersCount: report.instantKillers.length,
            normalFightersCount: report.normalFighters.length,
            instantKillPercentage: (report.instantKillers.length / characters.length * 100).toFixed(1) + '%'
        };

        console.log(`📋 CapCrit System Report Generated:`, report);
        return report;
    }

    /**
     * Simula uma batalha com o sistema CapCrit
     * @param {Object} attacker - Atacante
     * @param {Object} target - Alvo
     * @param {boolean} targetMeditating - Se o alvo está meditando
     * @returns {Object} Resultado da simulação
     */
    simulateBattle(attacker, target, targetMeditating = false) {
        // Configura estado de meditação do alvo
        target.isMeditating = targetMeditating;

        const attackResult = this.processCriticalAttack(attacker, target, 30);
        
        const simulation = {
            scenario: `${attacker.name} vs ${target.name}`,
            targetMeditating: targetMeditating,
            result: attackResult,
            outcome: attackResult.instantKillOccurs ? 'INSTANT_VICTORY' : 'NORMAL_BATTLE',
            explanation: attackResult.message
        };

        console.log(`🎮 CapCrit Battle Simulation:`, simulation);
        return simulation;
    }
}

// Instância global do sistema
const capCritSystem = new CapCritSystem();

// Funções de conveniência para uso global
window.CapCrit = {
    system: capCritSystem,
    
    // Funções principais
    calculateCritical: (character, skillBase = 30) => capCritSystem.calculateFinalCritical(character, skillBase),
    hasInstantKill: (character, skillBase = 30) => capCritSystem.hasInstantKillRight(character, skillBase),
    isProtected: (target) => capCritSystem.isProtectedFromInstantKill(target),
    processAttack: (attacker, target, skillBase = 30) => capCritSystem.processCriticalAttack(attacker, target, skillBase),
    
    // Funções de relatório
    validateCharacter: (character) => capCritSystem.validateCharacterForInstantKill(character),
    generateReport: (characters) => capCritSystem.generateSystemReport(characters),
    
    // Função de simulação
    simulate: (attacker, target, targetMeditating = false) => capCritSystem.simulateBattle(attacker, target, targetMeditating)
};

console.log('🎯 CapCrit System v1.0.0 loaded successfully');
console.log('📋 Available functions: CapCrit.calculateCritical, CapCrit.hasInstantKill, CapCrit.isProtected, CapCrit.processAttack');
console.log('📊 Reporting functions: CapCrit.validateCharacter, CapCrit.generateReport');
console.log('🎮 Simulation function: CapCrit.simulate');

// Exports removidos para compatibilidade com navegador
// Sistema disponível globalmente através de window.CapCrit