/**
 * Sistema de Balanceamento Automático - RPGStack Battle System
 * Monitora e ajusta parâmetros de combate para manter equilíbrio
 */

export class AutoBalanceSystem {
    constructor() {
        this.config = {
            // Limites de balanceamento
            maxAverageBattleTime: 300000,  // 5 minutos
            minAverageBattleTime: 60000,   // 1 minuto
            maxWinRate: 0.75,              // 75% win rate máxima
            minWinRate: 0.25,              // 25% win rate mínima
            
            // Thresholds para ajustes
            damageVarianceThreshold: 0.3,   // 30% variação
            healingEfficiencyTarget: 0.4,   // 40% do dano
            
            // Configurações de ajuste
            adjustmentStep: 0.05,           // 5% por ajuste
            maxAdjustment: 0.20,            // 20% ajuste máximo
            
            // Sistema de análise
            sampleSize: 100,                // Batalhas para análise
            analysisInterval: 50,           // Análises a cada 50 batalhas
            
            debugMode: true
        };
        
        // Dados de análise
        this.battleStats = {
            battles: [],
            characterStats: new Map(),
            skillStats: new Map(),
            averages: {}
        };
        
        // Ajustes ativos
        this.activeAdjustments = {
            damageMultipliers: new Map(),
            defenseMultipliers: new Map(),
            skillCooldowns: new Map(),
            animaCosts: new Map()
        };
        
        console.log('✅ AutoBalanceSystem inicializado');
    }

    /**
     * Registrar resultado de batalha para análise
     */
    registerBattleResult(battleResult) {
        const battleData = {
            id: battleResult.battleId,
            duration: battleResult.duration,
            winner: battleResult.winner,
            playerTeam: battleResult.playerTeam,
            enemyTeam: battleResult.enemyTeam,
            damageDealt: battleResult.totalDamageDealt || 0,
            damageReceived: battleResult.totalDamageReceived || 0,
            skillsUsed: battleResult.skillsUsed || [],
            timestamp: Date.now()
        };
        
        this.battleStats.battles.push(battleData);
        
        // Manter apenas as últimas N batalhas
        if (this.battleStats.battles.length > this.config.sampleSize * 2) {
            this.battleStats.battles = this.battleStats.battles.slice(-this.config.sampleSize);
        }
        
        // Analisar se atingiu intervalo
        if (this.battleStats.battles.length % this.config.analysisInterval === 0) {
            this.performBalanceAnalysis();
        }
        
        if (this.config.debugMode) {
            console.log(`📊 [Balance] Batalha registrada: ${battleData.duration}ms, vencedor: ${battleData.winner}`);
        }
    }

    /**
     * Realizar análise de balanceamento
     */
    performBalanceAnalysis() {
        console.log('🔍 [Balance] Iniciando análise de balanceamento...');
        
        const recentBattles = this.battleStats.battles.slice(-this.config.sampleSize);
        
        if (recentBattles.length < 10) {
            console.log('⚠️ [Balance] Dados insuficientes para análise');
            return;
        }
        
        // Analisar métricas principais
        const analysis = {
            averageDuration: this._calculateAverageDuration(recentBattles),
            winRates: this._calculateWinRates(recentBattles),
            damageVariance: this._calculateDamageVariance(recentBattles),
            skillUsage: this._analyzeSkillUsage(recentBattles),
            characterPerformance: this._analyzeCharacterPerformance(recentBattles)
        };
        
        this._logAnalysisResults(analysis);
        
        // Aplicar ajustes necessários
        this._applyBalanceAdjustments(analysis);
        
        console.log('✅ [Balance] Análise de balanceamento concluída');
    }

    /**
     * Calcular duração média das batalhas
     */
    _calculateAverageDuration(battles) {
        const totalDuration = battles.reduce((sum, battle) => sum + battle.duration, 0);
        return totalDuration / battles.length;
    }

    /**
     * Calcular taxas de vitória
     */
    _calculateWinRates(battles) {
        const wins = { player: 0, enemy: 0, total: battles.length };
        
        battles.forEach(battle => {
            if (battle.winner === 'player') wins.player++;
            else if (battle.winner === 'enemy') wins.enemy++;
        });
        
        return {
            player: wins.player / wins.total,
            enemy: wins.enemy / wins.total,
            total: wins.total
        };
    }

    /**
     * Calcular variância de dano
     */
    _calculateDamageVariance(battles) {
        const damages = battles.map(b => b.damageDealt);
        const average = damages.reduce((sum, dmg) => sum + dmg, 0) / damages.length;
        
        const variance = damages.reduce((sum, dmg) => {
            return sum + Math.pow(dmg - average, 2);
        }, 0) / damages.length;
        
        const standardDeviation = Math.sqrt(variance);
        const coefficientOfVariation = standardDeviation / average;
        
        return {
            average,
            variance,
            standardDeviation,
            coefficientOfVariation
        };
    }

    /**
     * Analisar uso de skills
     */
    _analyzeSkillUsage(battles) {
        const skillCounts = new Map();
        const skillEffectiveness = new Map();
        
        battles.forEach(battle => {
            battle.skillsUsed.forEach(skill => {
                // Contar usos
                const currentCount = skillCounts.get(skill.id) || 0;
                skillCounts.set(skill.id, currentCount + 1);
                
                // Calcular efetividade
                if (skill.damage > 0) {
                    const effectiveness = skill.damage / (skill.animaCost || 1);
                    const currentEff = skillEffectiveness.get(skill.id) || [];
                    currentEff.push(effectiveness);
                    skillEffectiveness.set(skill.id, currentEff);
                }
            });
        });
        
        // Calcular médias de efetividade
        const avgEffectiveness = new Map();
        skillEffectiveness.forEach((values, skillId) => {
            const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
            avgEffectiveness.set(skillId, avg);
        });
        
        return {
            usage: skillCounts,
            effectiveness: avgEffectiveness
        };
    }

    /**
     * Analisar performance de personagens
     */
    _analyzeCharacterPerformance(battles) {
        const performance = new Map();
        
        battles.forEach(battle => {
            // Analisar equipe do jogador
            battle.playerTeam.forEach(char => {
                if (!performance.has(char.id)) {
                    performance.set(char.id, {
                        battles: 0,
                        wins: 0,
                        totalDamage: 0,
                        survivability: 0
                    });
                }
                
                const stats = performance.get(char.id);
                stats.battles++;
                stats.totalDamage += char.damageDealt || 0;
                
                if (battle.winner === 'player') {
                    stats.wins++;
                }
                
                if (char.finalHP > 0) {
                    stats.survivability++;
                }
            });
        });
        
        // Calcular médias
        performance.forEach((stats, charId) => {
            stats.winRate = stats.wins / stats.battles;
            stats.avgDamage = stats.totalDamage / stats.battles;
            stats.survivalRate = stats.survivability / stats.battles;
        });
        
        return performance;
    }

    /**
     * Aplicar ajustes de balanceamento
     */
    _applyBalanceAdjustments(analysis) {
        console.log('⚙️ [Balance] Aplicando ajustes...');
        
        // Ajuste de duração de batalha
        this._adjustBattleDuration(analysis.averageDuration);
        
        // Ajuste de win rates
        this._adjustWinRates(analysis.winRates);
        
        // Ajuste de variância de dano
        this._adjustDamageVariance(analysis.damageVariance);
        
        // Ajuste de skills desbalanceadas
        this._adjustSkillBalance(analysis.skillUsage);
        
        // Ajuste de personagens
        this._adjustCharacterBalance(analysis.characterPerformance);
        
        console.log('✅ [Balance] Ajustes aplicados');
    }

    /**
     * Ajustar duração de batalhas
     */
    _adjustBattleDuration(avgDuration) {
        if (avgDuration > this.config.maxAverageBattleTime) {
            // Batalhas muito longas - aumentar dano geral
            const adjustment = Math.min(this.config.adjustmentStep, this.config.maxAdjustment);
            this._applyGlobalDamageAdjustment(1 + adjustment);
            console.log(`⚡ [Balance] Batalhas longas detectadas (${(avgDuration/1000).toFixed(1)}s) - aumentando dano em ${(adjustment*100).toFixed(1)}%`);
            
        } else if (avgDuration < this.config.minAverageBattleTime) {
            // Batalhas muito rápidas - reduzir dano geral
            const adjustment = Math.min(this.config.adjustmentStep, this.config.maxAdjustment);
            this._applyGlobalDamageAdjustment(1 - adjustment);
            console.log(`🛡️ [Balance] Batalhas rápidas detectadas (${(avgDuration/1000).toFixed(1)}s) - reduzindo dano em ${(adjustment*100).toFixed(1)}%`);
        }
    }

    /**
     * Ajustar win rates
     */
    _adjustWinRates(winRates) {
        if (winRates.player > this.config.maxWinRate) {
            // Jogador vencendo demais - buffar inimigos
            const adjustment = this.config.adjustmentStep;
            this._adjustEnemyDifficulty(1 + adjustment);
            console.log(`🤖 [Balance] Taxa de vitória alta (${(winRates.player*100).toFixed(1)}%) - aumentando dificuldade em ${(adjustment*100).toFixed(1)}%`);
            
        } else if (winRates.player < this.config.minWinRate) {
            // Jogador perdendo demais - nerfar inimigos
            const adjustment = this.config.adjustmentStep;
            this._adjustEnemyDifficulty(1 - adjustment);
            console.log(`👤 [Balance] Taxa de vitória baixa (${(winRates.player*100).toFixed(1)}%) - reduzindo dificuldade em ${(adjustment*100).toFixed(1)}%`);
        }
    }

    /**
     * Ajustar variância de dano
     */
    _adjustDamageVariance(damageVariance) {
        if (damageVariance.coefficientOfVariation > this.config.damageVarianceThreshold) {
            console.log(`📊 [Balance] Alta variância de dano detectada (${(damageVariance.coefficientOfVariation*100).toFixed(1)}%) - estabilizando...`);
            // Implementar ajustes para reduzir variância
        }
    }

    /**
     * Ajustar balanceamento de skills
     */
    _adjustSkillBalance(skillUsage) {
        // Identificar skills muito usadas ou muito pouco usadas
        const totalBattles = this.config.analysisInterval;
        const avgUsage = Array.from(skillUsage.usage.values()).reduce((sum, count) => sum + count, 0) / skillUsage.usage.size;
        
        skillUsage.usage.forEach((count, skillId) => {
            const usageRate = count / totalBattles;
            
            if (usageRate > avgUsage * 2) {
                // Skill muito popular - aumentar custo ou reduzir poder
                console.log(`🔥 [Balance] Skill popular detectada: ${skillId} (${(usageRate*100).toFixed(1)}% uso)`);
            } else if (usageRate < avgUsage * 0.5) {
                // Skill pouco usada - reduzir custo ou aumentar poder
                console.log(`❄️ [Balance] Skill subutilizada detectada: ${skillId} (${(usageRate*100).toFixed(1)}% uso)`);
            }
        });
    }

    /**
     * Ajustar balanceamento de personagens
     */
    _adjustCharacterBalance(performance) {
        performance.forEach((stats, charId) => {
            if (stats.winRate > 0.8) {
                console.log(`💪 [Balance] Personagem forte detectado: ${charId} (${(stats.winRate*100).toFixed(1)}% vitórias)`);
            } else if (stats.winRate < 0.2) {
                console.log(`😔 [Balance] Personagem fraco detectado: ${charId} (${(stats.winRate*100).toFixed(1)}% vitórias)`);
            }
        });
    }

    /**
     * Aplicar ajuste global de dano
     */
    _applyGlobalDamageAdjustment(multiplier) {
        this.activeAdjustments.damageMultipliers.set('global', multiplier);
    }

    /**
     * Ajustar dificuldade dos inimigos
     */
    _adjustEnemyDifficulty(multiplier) {
        this.activeAdjustments.damageMultipliers.set('enemy', multiplier);
        this.activeAdjustments.defenseMultipliers.set('enemy', multiplier);
    }

    /**
     * Obter ajustes ativos para aplicar nos cálculos
     */
    getActiveAdjustments() {
        return {
            damageMultipliers: Object.fromEntries(this.activeAdjustments.damageMultipliers),
            defenseMultipliers: Object.fromEntries(this.activeAdjustments.defenseMultipliers),
            skillCooldowns: Object.fromEntries(this.activeAdjustments.skillCooldowns),
            animaCosts: Object.fromEntries(this.activeAdjustments.animaCosts)
        };
    }

    /**
     * Log dos resultados de análise
     */
    _logAnalysisResults(analysis) {
        if (!this.config.debugMode) return;
        
        console.log('\n📊 [Balance] Análise de Balanceamento:');
        console.log(`   ⏱️ Duração média: ${(analysis.averageDuration/1000).toFixed(1)}s`);
        console.log(`   🏆 Taxa vitória jogador: ${(analysis.winRates.player*100).toFixed(1)}%`);
        console.log(`   🤖 Taxa vitória inimigo: ${(analysis.winRates.enemy*100).toFixed(1)}%`);
        console.log(`   📊 Variância de dano: ${(analysis.damageVariance.coefficientOfVariation*100).toFixed(1)}%`);
        console.log(`   🎯 Skills analisadas: ${analysis.skillUsage.usage.size}`);
        console.log(`   👥 Personagens analisados: ${analysis.characterPerformance.size}`);
    }

    /**
     * Resetar ajustes (para testes)
     */
    resetAdjustments() {
        this.activeAdjustments.damageMultipliers.clear();
        this.activeAdjustments.defenseMultipliers.clear();
        this.activeAdjustments.skillCooldowns.clear();
        this.activeAdjustments.animaCosts.clear();
        
        console.log('🔄 [Balance] Ajustes resetados');
    }

    /**
     * Configurar sistema
     */
    setConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('⚙️ [Balance] Configuração atualizada');
    }

    /**
     * Obter estatísticas atuais
     */
    getStats() {
        return {
            battlesAnalyzed: this.battleStats.battles.length,
            activeAdjustments: this.getActiveAdjustments(),
            config: this.config
        };
    }
}