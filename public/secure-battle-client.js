/**
 * RPGStack Secure Battle Client
 * Cliente que comunica apenas com APIs seguras do backend
 * Substitui o battlemechanics.js inseguro
 */

class SecureBattleClient {
    constructor() {
        this.currentBattleId = null;
        this.battleState = null;
        this.isProcessing = false;
    }

    /**
     * Iniciar nova batalha segura
     */
    async startSecureBattle(playerTeam, enemyTeam, battleType = '3v3') {
        try {
            console.log('🔐 [DEBUG] Iniciando batalha segura...', { playerTeam, enemyTeam, battleType });
            const response = await fetch('/api/secure-battle/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    playerTeam: playerTeam,
                    enemyTeam: enemyTeam,
                    battleType: battleType
                })
            });

            console.log('🔐 [DEBUG] Response status:', response.status);
            console.log('🔐 [DEBUG] Response URL:', response.url);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.log('🔐 [DEBUG] Error response:', errorText);
                throw new Error(`Erro ao iniciar batalha: ${response.status}`);
            }

            const result = await response.json();
            this.currentBattleId = result.battleId;
            this.battleState = result.battle;

            return result;
        } catch (error) {
            console.error('❌ Erro ao iniciar batalha segura:', error);
            throw error;
        }
    }

    /**
     * Obter estado atual da batalha
     */
    async getBattleState() {
        if (!this.currentBattleId) {
            throw new Error('Nenhuma batalha ativa');
        }

        try {
            const response = await fetch(`/api/secure-battle/${this.currentBattleId}`);
            
            if (!response.ok) {
                throw new Error(`Erro ao obter estado: ${response.status}`);
            }

            const battleState = await response.json();
            this.battleState = battleState;
            
            return battleState;
        } catch (error) {
            console.error('❌ Erro ao obter estado da batalha:', error);
            throw error;
        }
    }

    /**
     * Executar ataque seguro
     */
    async executeSecureAttack(attackerId, targetId, skillData = null) {
        if (!this.currentBattleId || this.isProcessing) {
            return { success: false, reason: 'Batalha não disponível ou processando' };
        }

        this.isProcessing = true;

        try {
            const response = await fetch(`/api/secure-battle/${this.currentBattleId}/attack`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    attackerId: attackerId,
                    targetId: targetId,
                    skillData: skillData
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ Server error details:', errorData);
                if (errorData.stack) {
                    console.error('❌ Stack trace:', errorData.stack);
                }
                throw new Error(`Erro no ataque: ${response.status} - ${errorData.error || 'Unknown error'}`);
            }

            const result = await response.json();
            this.battleState = result.battle;

            return result;
        } catch (error) {
            console.error('❌ Erro ao executar ataque:', error);
            return { success: false, error: error.message };
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Executar troca segura
     */
    async executeSecureSwap(fromIndex, toIndex) {
        if (!this.currentBattleId || this.isProcessing) {
            return { success: false, reason: 'Batalha não disponível ou processando' };
        }

        this.isProcessing = true;

        try {
            const response = await fetch(`/api/secure-battle/${this.currentBattleId}/swap`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fromIndex: fromIndex,
                    toIndex: toIndex
                })
            });

            if (!response.ok) {
                throw new Error(`Erro na troca: ${response.status}`);
            }

            const result = await response.json();
            this.battleState = result.battle;

            return result;
        } catch (error) {
            console.error('❌ Erro ao executar troca:', error);
            return { success: false, error: error.message };
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Finalizar batalha
     */
    async endBattle() {
        if (!this.currentBattleId) {
            return { success: false, reason: 'Nenhuma batalha ativa' };
        }

        try {
            const response = await fetch(`/api/secure-battle/${this.currentBattleId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`Erro ao finalizar batalha: ${response.status}`);
            }

            const result = await response.json();
            this.currentBattleId = null;
            this.battleState = null;

            return result;
        } catch (error) {
            console.error('❌ Erro ao finalizar batalha:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Validar equipe localmente (validação básica)
     */
    validateTeamBasic(team) {
        if (!Array.isArray(team) || team.length !== 3) {
            return { valid: false, error: 'Equipe deve ter exatamente 3 personagens' };
        }

        for (let i = 0; i < team.length; i++) {
            const char = team[i];
            if (!char || !char.id || !char.name) {
                return { valid: false, error: `Personagem ${i + 1} inválido` };
            }
        }

        return { valid: true };
    }

    /**
     * Obter personagem ativo de um time
     */
    getActiveCharacter(teamType = 'player') {
        if (!this.battleState || !this.battleState[`${teamType}Team`]) {
            return null;
        }

        const team = this.battleState[`${teamType}Team`];
        return team.characters[team.activeIndex];
    }

    /**
     * Verificar se batalha está ativa
     */
    isBattleActive() {
        return this.currentBattleId !== null && 
               this.battleState !== null && 
               this.battleState.status === 'active';
    }

    /**
     * Obter estatísticas da batalha atual
     */
    getBattleStats() {
        if (!this.battleState) {
            return null;
        }

        return {
            battleId: this.currentBattleId,
            type: this.battleState.type,
            currentTurn: this.battleState.currentTurn,
            round: this.battleState.round,
            playerActiveChar: this.getActiveCharacter('player'),
            enemyActiveChar: this.getActiveCharacter('enemy'),
            playerSwapsRemaining: this.battleState.playerTeam.maxSwaps - this.battleState.playerTeam.swapsUsed,
            enemySwapsRemaining: this.battleState.enemyTeam.maxSwaps - this.battleState.enemyTeam.swapsUsed
        };
    }

    /**
     * Sincronizar estado periodicamente
     */
    startStateSync(interval = 5000) {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        this.syncInterval = setInterval(async () => {
            if (this.isBattleActive() && !this.isProcessing) {
                try {
                    await this.getBattleState();
                } catch (error) {
                    console.warn('⚠️ Erro na sincronização automática:', error);
                }
            }
        }, interval);
    }

    /**
     * Parar sincronização
     */
    stopStateSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    /**
     * Limpar estado local
     */
    cleanup() {
        this.stopStateSync();
        this.currentBattleId = null;
        this.battleState = null;
        this.isProcessing = false;
    }
}

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecureBattleClient;
} else {
    window.SecureBattleClient = SecureBattleClient;
}