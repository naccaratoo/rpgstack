/**
 * 🎮 RPGStack - Battle Elements Configuration
 * Especificações de dimensões e proporções dos elementos da interface de batalha
 * @version 1.0.0
 * @author RPGStack Team
 */

const BattleElements = {
    // 📏 Dimensões dos Painéis de Informação
    characterInfo: {
        // Painéis principais
        width: {
            min: '120px',
            max: '140px'
        },
        padding: '6px 8px',
        borderRadius: '8px',
        fontSize: '11px',
        transform: 'scale(0.85)', // Redução de 15% no tamanho
        
        // Nome do personagem
        name: {
            fontSize: '12px',
            marginBottom: '6px',
            fontWeight: 'bold'
        },
        
        // Barras de vida e ânima
        healthBar: {
            width: '100px',
            height: '8px',
            borderRadius: '4px'
        },
        
        // Texto das barras
        barText: {
            fontSize: '9px',
            marginTop: '3px',
            fontWeight: 'bold'
        },
        
        // Badge de nível
        levelBadge: {
            padding: '2px 6px',
            borderRadius: '10px',
            fontSize: '8px',
            marginTop: '6px'
        }
    },

    // 🖼️ Sprites dos Personagens
    characterSprite: {
        width: '60px',
        height: '60px',
        borderRadius: '6px',
        border: '2px solid rgba(255, 255, 255, 0.8)',
        boxShadow: '0 3px 12px rgba(0, 0, 0, 0.3)'
    },

    // 🎯 Botões de Ação
    actionButtons: {
        padding: '12px 20px',
        borderRadius: '10px',
        fontSize: '14px',
        minHeight: '45px',
        gap: '8px',
        
        // Cores dos botões
        colors: {
            attack: {
                background: 'linear-gradient(135deg, #ff4757, #c44569)',
                borderLeft: '4px solid #ff3838'
            },
            defend: {
                background: 'linear-gradient(135deg, #74b9ff, #0984e3)',
                borderLeft: '4px solid #3742fa'
            },
            meditate: {
                background: 'linear-gradient(135deg, #00cec9, #00b894)',
                borderLeft: '4px solid #00a085'
            },
            skill: {
                background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)',
                borderLeft: '3px solid #fd79a8',
                minHeight: '35px',
                fontSize: '12px'
            }
        }
    },

    // 📊 Painel de Estatísticas
    statsPanel: {
        padding: '15px',
        borderRadius: '15px',
        gap: '15px',
        
        statItem: {
            padding: '10px',
            borderRadius: '8px',
            gap: '5px',
            
            label: {
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.5px'
            },
            
            value: {
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#74b9ff',
                textShadow: '0 0 10px rgba(116, 185, 255, 0.3)'
            }
        }
    },

    // 🏟️ Áreas da Arena
    arenaAreas: {
        enemy: {
            gridArea: 'enemy-area',
            padding: '20px',
            borderRadius: '15px',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
        },
        
        player: {
            gridArea: 'player-area',
            padding: '20px',
            borderRadius: '15px',
            background: 'linear-gradient(135deg, #2d1b69 0%, #11998e 100%)'
        }
    },

    // 📝 Log de Batalha
    battleLog: {
        gridArea: 'battle-log',
        padding: '15px',
        borderRadius: '15px',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        
        message: {
            margin: '3px 0',
            padding: '6px 10px',
            borderRadius: '15px',
            borderLeft: '3px solid #3498db',
            fontSize: '12px',
            lineHeight: '1.4'
        }
    },

    // 🎮 Menu de Ações
    actionMenu: {
        gridArea: 'actions',
        padding: '15px',
        borderRadius: '15px',
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        gap: '10px'
    },

    // 📱 Responsividade Mobile
    mobile: {
        breakpoint: '768px',
        gridTemplate: {
            areas: `
                "enemy-area enemy-area"
                "player-area player-area"
                "actions battle-log"
                "stats stats"
            `,
            rows: '1fr 1fr 200px 150px',
            columns: '1fr 1fr'
        },
        
        adjustments: {
            gap: '8px',
            padding: '8px',
            statsPanel: {
                flexDirection: 'row',
                gap: '10px'
            }
        }
    },

    // 🌟 Sistema de Cargas Astrais
    astralCharges: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 100,
        
        display: {
            background: 'rgba(0,0,0,0.7)',
            padding: '8px 15px',
            borderRadius: '20px',
            color: '#74b9ff',
            fontWeight: 'bold',
            border: '2px solid #4a5568'
        }
    },

    // 🎯 Indicador de Turno
    turnIndicator: {
        position: 'absolute',
        top: '15px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '13px',
        textAlign: 'center'
    }
};

/**
 * 🔧 Funções Utilitárias para Aplicar Estilos
 */
const ElementsUtils = {
    /**
     * Aplica estilos de um objeto de configuração a um elemento
     * @param {HTMLElement} element - Elemento DOM
     * @param {Object} styles - Objeto com estilos CSS
     */
    applyStyles(element, styles) {
        if (!element || !styles) return;
        
        Object.keys(styles).forEach(property => {
            if (typeof styles[property] === 'string') {
                element.style[property] = styles[property];
            }
        });
    },

    /**
     * Redimensiona elementos de informação dos personagens
     */
    resizeCharacterInfo() {
        const enemyInfo = document.querySelector('.enemy-info');
        const playerInfo = document.querySelector('.player-info');
        
        if (enemyInfo) {
            this.applyStyles(enemyInfo, {
                minWidth: BattleElements.characterInfo.width.min,
                maxWidth: BattleElements.characterInfo.width.max,
                padding: BattleElements.characterInfo.padding,
                fontSize: BattleElements.characterInfo.fontSize,
                transform: BattleElements.characterInfo.transform
            });
        }
        
        if (playerInfo) {
            this.applyStyles(playerInfo, {
                minWidth: BattleElements.characterInfo.width.min,
                maxWidth: BattleElements.characterInfo.width.max,
                padding: BattleElements.characterInfo.padding,
                fontSize: BattleElements.characterInfo.fontSize,
                transform: BattleElements.characterInfo.transform
            });
        }
    },

    /**
     * Aplica configurações responsivas
     */
    applyResponsiveSettings() {
        const mediaQuery = window.matchMedia(`(max-width: ${BattleElements.mobile.breakpoint})`);
        
        const applyMobileStyles = (matches) => {
            const battleContainer = document.querySelector('.battle-container');
            if (matches && battleContainer) {
                battleContainer.style.gridTemplateAreas = BattleElements.mobile.gridTemplate.areas;
                battleContainer.style.gridTemplateRows = BattleElements.mobile.gridTemplate.rows;
                battleContainer.style.gridTemplateColumns = BattleElements.mobile.gridTemplate.columns;
            }
        };
        
        // Aplica na inicialização
        applyMobileStyles(mediaQuery.matches);
        
        // Escuta mudanças na mídia query
        mediaQuery.addEventListener('change', (e) => applyMobileStyles(e.matches));
    },

    /**
     * Inicializa todas as configurações de elementos
     */
    init() {
        // Aguarda o DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.resizeCharacterInfo();
                this.applyResponsiveSettings();
            });
        } else {
            this.resizeCharacterInfo();
            this.applyResponsiveSettings();
        }
    }
};

// 🚀 Exporta para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BattleElements, ElementsUtils };
} else {
    window.BattleElements = BattleElements;
    window.ElementsUtils = ElementsUtils;
}

// 🎯 Auto-inicialização
ElementsUtils.init();