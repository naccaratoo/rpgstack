/**
 * RPGStack Skills Loader - Sistema de Carregamento Dinâmico
 * Versão: 4.3.0 (Modular Skills Architecture)
 * 
 * Gerencia o carregamento dinâmico de arquivos de skills dos personagens
 * e integração com o sistema de batalha.
 */

class SkillLoader {
    constructor() {
        this.loadedSkills = new Map();
        this.skillClasses = new Map();
        this.loadingPromises = new Map();
        
        // Mapeamento de personagens para arquivos de skills
        this.characterSkillMap = {
            // IDs dos personagens -> nomes dos arquivos
            "045CCF3515": "milos_zeleznikov",        // Miloš Železnikov
            "EA32D10F2D": "shi_wuxing",             // Shi Wuxing
            "A9C4N0001E": "aurelius_ignisvox",      // Aurelius Ignisvox
            "7A8B9C0D1E": "pythia_kassandra",       // Pythia Kassandra
            "2F3E4D5C6B": "itzel_nahualli",         // Itzel Nahualli
            "9A8B7C6D5E": "giovanni_da_ferrara",    // Giovanni da Ferrara
            "4F3E2D1C0B": "yamazaki_karakuri",      // Yamazaki Karakuri
            "8A9B0C1D2E": "aiyana_windtalker",      // Aiyana Windtalker
            "3F4E5D6C7B": "bjorn_ulfhednar",        // Björn Ulfhednar
            "6A7B8C9D0E": "hadji_abdul_rahman",     // Hadji Abdul-Rahman
            "1F2E3D4C5B": "lady_catherine",         // Lady Catherine Ashworth
            "5A6B7C8D9E": "oloye_ifa_babalawo",     // Ọlọ́yẹ̀ Ifá Babalawo
            "0F1E2D3C4B": "dmitri_raskolnikov",     // Dr. Dmitri Raskolnikov
            "4A5B6C7D8E": "mei_lin_punhos_jade",    // Mei Lin "Punhos de Jade"
            "9F0E1D2C3B": "kwame_asante"            // Kwame Asante
        };

        // Cache de skills por cultura para otimização
        this.cultureSkillCache = new Map();
        
        // Sistema de fallback para skills genéricas
        this.fallbackSkills = this.createFallbackSkills();
    }

    /**
     * Carrega skills de um personagem específico
     * @param {string} characterId - ID do personagem
     * @returns {Promise<Object>} Classe de skills carregada
     */
    async loadCharacterSkills(characterId) {
        // Verificar se já está carregado
        if (this.loadedSkills.has(characterId)) {
            return this.loadedSkills.get(characterId);
        }

        // Verificar se já está sendo carregado
        if (this.loadingPromises.has(characterId)) {
            return await this.loadingPromises.get(characterId);
        }

        // Obter nome do arquivo
        const skillFileName = this.characterSkillMap[characterId];
        if (!skillFileName) {
            console.warn(`⚠️ Skills não encontradas para personagem ${characterId}, usando fallback`);
            return this.getFallbackSkills(characterId);
        }

        // Criar promise de carregamento
        const loadingPromise = this.loadSkillFile(skillFileName, characterId);
        this.loadingPromises.set(characterId, loadingPromise);

        try {
            const skillClass = await loadingPromise;
            this.loadedSkills.set(characterId, skillClass);
            this.loadingPromises.delete(characterId);
            
            console.log(`✅ Skills carregadas para ${characterId}: ${skillFileName}`);
            return skillClass;
        } catch (error) {
            console.error(`❌ Erro ao carregar skills para ${characterId}:`, error);
            this.loadingPromises.delete(characterId);
            return this.getFallbackSkills(characterId);
        }
    }

    /**
     * Carrega arquivo de skills específico
     * @param {string} fileName - Nome do arquivo (sem extensão)
     * @param {string} characterId - ID do personagem
     * @returns {Promise<Object>} Instância da classe de skills
     */
    async loadSkillFile(fileName, characterId) {
        const scriptPath = `/skills/${fileName}.js`;
        
        return new Promise((resolve, reject) => {
            // Verificar se o script já foi carregado
            const existingScript = document.querySelector(`script[src="${scriptPath}"]`);
            if (existingScript) {
                // Aguardar carregamento se ainda está em progresso
                if (existingScript.dataset.loaded === 'true') {
                    const skillClass = this.instantiateSkillClass(fileName, characterId);
                    resolve(skillClass);
                } else {
                    existingScript.addEventListener('load', () => {
                        const skillClass = this.instantiateSkillClass(fileName, characterId);
                        resolve(skillClass);
                    });
                }
                return;
            }

            // Criar e carregar script
            const script = document.createElement('script');
            script.src = scriptPath;
            script.type = 'text/javascript';
            
            script.onload = () => {
                script.dataset.loaded = 'true';
                try {
                    const skillClass = this.instantiateSkillClass(fileName, characterId);
                    resolve(skillClass);
                } catch (error) {
                    reject(new Error(`Erro ao instanciar classe de skills: ${error.message}`));
                }
            };
            
            script.onerror = () => {
                reject(new Error(`Falha ao carregar arquivo de skills: ${scriptPath}`));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Instancia a classe de skills baseada no nome do arquivo
     * @param {string} fileName - Nome do arquivo
     * @param {string} characterId - ID do personagem
     * @returns {Object} Instância da classe de skills
     */
    instantiateSkillClass(fileName, characterId) {
        // Converter nome do arquivo para nome da classe
        const className = this.fileNameToClassName(fileName);
        
        // Verificar se a classe existe no escopo global
        if (typeof window[className] !== 'function') {
            throw new Error(`Classe ${className} não encontrada no escopo global`);
        }

        // Instanciar classe
        const skillInstance = new window[className]();
        
        // Verificar se a instância tem os métodos necessários
        this.validateSkillInstance(skillInstance, characterId);
        
        return skillInstance;
    }

    /**
     * Converte nome do arquivo para nome da classe
     * @param {string} fileName - Nome do arquivo (milos_zeleznikov)
     * @returns {string} Nome da classe (MilosZeleznikovSkills)
     */
    fileNameToClassName(fileName) {
        return fileName
            .split('_')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('') + 'Skills';
    }

    /**
     * Valida se uma instância de skills tem a estrutura correta
     * @param {Object} skillInstance - Instância a ser validada
     * @param {string} characterId - ID do personagem
     */
    validateSkillInstance(skillInstance, characterId) {
        const requiredMethods = ['getSkillsMetadata'];
        
        for (const method of requiredMethods) {
            if (typeof skillInstance[method] !== 'function') {
                throw new Error(`Método obrigatório ${method} não encontrado na classe de skills`);
            }
        }

        // Verificar se o characterId confere
        const metadata = skillInstance.getSkillsMetadata();
        if (metadata.characterId !== characterId) {
            console.warn(`⚠️ ID do personagem não confere: esperado ${characterId}, recebido ${metadata.characterId}`);
        }
    }

    /**
     * Carrega múltiplas skills em paralelo
     * @param {string[]} characterIds - Array de IDs de personagens
     * @returns {Promise<Map>} Map com skills carregadas
     */
    async loadMultipleSkills(characterIds) {
        const loadingPromises = characterIds.map(id => 
            this.loadCharacterSkills(id).then(skills => ({ id, skills }))
        );

        const results = await Promise.allSettled(loadingPromises);
        const skillsMap = new Map();

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                const { id, skills } = result.value;
                skillsMap.set(id, skills);
            } else {
                console.error(`❌ Falha ao carregar skills para ${characterIds[index]}:`, result.reason);
                skillsMap.set(characterIds[index], this.getFallbackSkills(characterIds[index]));
            }
        });

        return skillsMap;
    }

    /**
     * Executa uma skill específica
     * @param {string} characterId - ID do personagem
     * @param {string} skillId - ID da skill
     * @param {Object} battle - Instância da batalha
     * @param {Object} caster - Personagem que usa a skill
     * @param {Object} target - Alvo da skill
     * @returns {Promise<Object>} Resultado da execução da skill
     */
    async executeSkill(characterId, skillId, battle, caster, target) {
        const skillInstance = await this.loadCharacterSkills(characterId);
        
        // Converter skillId para nome do método
        const methodName = this.skillIdToMethodName(skillId);
        
        if (typeof skillInstance[methodName] !== 'function') {
            throw new Error(`Skill ${skillId} (método ${methodName}) não encontrada para personagem ${characterId}`);
        }

        // Executar skill
        try {
            const result = skillInstance[methodName](battle, caster, target);
            
            // Adicionar informações de contexto ao resultado
            return {
                ...result,
                skillId: skillId,
                characterId: characterId,
                executedAt: Date.now()
            };
        } catch (error) {
            console.error(`❌ Erro ao executar skill ${skillId}:`, error);
            throw error;
        }
    }

    /**
     * Converte ID da skill para nome do método
     * @param {string} skillId - ID da skill (forja_do_dragao_eslavo)
     * @returns {string} Nome do método (forjaDoDragaoEslavo)
     */
    skillIdToMethodName(skillId) {
        return skillId
            .split('_')
            .map((part, index) => 
                index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
            )
            .join('');
    }

    /**
     * Obtém lista de skills disponíveis para um personagem
     * @param {string} characterId - ID do personagem
     * @returns {Promise<Array>} Lista de skills disponíveis
     */
    async getAvailableSkills(characterId) {
        const skillInstance = await this.loadCharacterSkills(characterId);
        const metadata = skillInstance.getSkillsMetadata();
        return metadata.skills || [];
    }

    /**
     * Obtém informações culturais de um personagem
     * @param {string} characterId - ID do personagem
     * @returns {Promise<Object>} Informações culturais
     */
    async getCulturalInfo(characterId) {
        const skillInstance = await this.loadCharacterSkills(characterId);
        const metadata = skillInstance.getSkillsMetadata();
        return {
            culture: metadata.culture,
            culturalElements: metadata.culturalElements,
            characterName: metadata.characterName,
            classe: metadata.classe
        };
    }

    /**
     * Pré-carrega skills dos personagens mais comuns
     * @param {string[]} priorityCharacters - IDs de personagens prioritários
     */
    async preloadPrioritySkills(priorityCharacters = []) {
        // Se não especificado, usar os primeiros personagens
        if (priorityCharacters.length === 0) {
            priorityCharacters = Object.keys(this.characterSkillMap).slice(0, 5);
        }

        console.log(`🔄 Pré-carregando skills para ${priorityCharacters.length} personagens...`);
        
        const startTime = Date.now();
        await this.loadMultipleSkills(priorityCharacters);
        const endTime = Date.now();
        
        console.log(`✅ Skills pré-carregadas em ${endTime - startTime}ms`);
    }

    /**
     * Cria skills de fallback para personagens sem arquivo próprio
     * @returns {Object} Skills genéricas
     */
    createFallbackSkills() {
        return {
            getSkillsMetadata: () => ({
                characterId: 'fallback',
                characterName: 'Personagem Genérico',
                culture: 'Desconhecida',
                skills: [
                    {
                        id: 'ataque_basico',
                        name: '⚔️ Ataque Básico',
                        animaCost: 0,
                        damage: 50,
                        type: 'basic_attack',
                        cooldown: 0,
                        description: 'Ataque básico sem custo de Ânima'
                    },
                    {
                        id: 'investida_poderosa',
                        name: '💥 Investida Poderosa',
                        animaCost: 25,
                        damage: 80,
                        type: 'power_strike',
                        cooldown: 1,
                        description: 'Ataque mais forte que consome mana'
                    }
                ]
            }),
            ataqueBasico: (battle, caster, target) => ({
                damage: 50 + Math.floor(Math.random() * 20),
                effects: { animation: 'basic_attack' },
                culturalNarrative: `${caster.name} desfere um golpe básico!`
            }),
            investidaPoderosa: (battle, caster, target) => {
                if (caster.currentAnima < 25) {
                    throw new Error('Ânima insuficiente');
                }
                caster.currentAnima -= 25;
                return {
                    damage: 80 + Math.floor(Math.random() * 30),
                    animaCost: 25,
                    effects: { animation: 'power_strike' },
                    culturalNarrative: `${caster.name} concentra energia em um ataque poderoso!`
                };
            }
        };
    }

    /**
     * Retorna skills de fallback para um personagem específico
     * @param {string} characterId - ID do personagem
     * @returns {Object} Instância de skills de fallback
     */
    getFallbackSkills(characterId) {
        const fallback = this.createFallbackSkills();
        // Personalizar o fallback com o ID correto
        const originalMetadata = fallback.getSkillsMetadata;
        fallback.getSkillsMetadata = () => ({
            ...originalMetadata(),
            characterId: characterId
        });
        return fallback;
    }

    /**
     * Limpa cache de skills carregadas
     */
    clearCache() {
        this.loadedSkills.clear();
        this.skillClasses.clear();
        this.loadingPromises.clear();
        this.cultureSkillCache.clear();
        
        console.log('🧹 Cache de skills limpo');
    }

    /**
     * Obtém estatísticas do loader
     * @returns {Object} Estatísticas de uso
     */
    getStats() {
        return {
            loadedSkills: this.loadedSkills.size,
            cachedCultures: this.cultureSkillCache.size,
            availableCharacters: Object.keys(this.characterSkillMap).length,
            activeLoading: this.loadingPromises.size
        };
    }
}

// Instância global do skill loader
const skillLoader = new SkillLoader();

// Export para compatibilidade
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SkillLoader, skillLoader };
} else {
    window.SkillLoader = SkillLoader;
    window.skillLoader = skillLoader;
}

// Auto-inicialização quando o DOM estiver pronto
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🎮 RPGStack Skill Loader inicializado');
        
        // Pré-carregar skills dos personagens mais comuns (opcional)
        if (window.location.pathname.includes('battle')) {
            skillLoader.preloadPrioritySkills();
        }
    });
}