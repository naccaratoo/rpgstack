// State global da aplicação
let appState = {
    characters: [],
    loadedSkills: new Map(),
    currentTest: null,
    passives: new Map()
};

// Variáveis globais para modal de edição
let currentEditingSkill = null;

// ========================
// MODAL DE EDIÇÃO DE SKILLS
// ========================

// Abrir modal de edição de skill
async function openSkillEditModal(skillId) {
    try {
        log(`Abrindo modal de edição para skill ID: ${skillId}`, 'info');
        
        // Buscar dados da skill da API (agora corrigida)
        const response = await fetch(`/api/skills/${skillId}`);
        const skillResponse = await response.json();
        
        let skill = null;
        if (skillResponse.success && skillResponse.data && skillResponse.data.skill) {
            skill = skillResponse.data.skill;
            console.log('✅ Skill carregada da API:', skill.name);
            console.log('✅ Multi-hit presente:', !!skill.multi_hit);
            console.log('✅ Buffs presente:', !!skill.buffs);
        }
        
        if (!skill) {
            log(`Skill não encontrada: ${skillId}`, 'error');
            return;
        }
        
        console.log('Full skill object loaded for editing:', JSON.stringify(skill, null, 2));
        
        currentEditingSkill = skill;
        
        // Preencher form com dados da skill
        document.getElementById('editSkillId').value = skill.id;
        document.getElementById('editSkillName').value = skill.name || '';
        document.getElementById('editSkillDamage').value = skill.damage || 0;
        document.getElementById('editSkillAnimaCost').value = skill.anima_cost || 0;
        document.getElementById('editSkillCooldown').value = skill.cooldown || 0;
        document.getElementById('editSkillDuration').value = skill.duration || 0;
        document.getElementById('editSkillType').value = skill.type || 'combat';
        document.getElementById('editSkillDescription').value = skill.description || '';
        document.getElementById('editSkillEffects').value = skill.effects ? skill.effects.join(', ') : '';
        document.getElementById('editSkillCulturalAuth').value = skill.cultural_authenticity || '';
        
        // Determinar e definir afinidades (principal e secundária)
        let affinities = [];
        
        // Se skill já tem afinidades salvas (como array)
        if (skill.affinity && Array.isArray(skill.affinity)) {
            affinities = skill.affinity;
        }
        // Se skill tem afinidade como string única (migração)
        else if (skill.affinity && typeof skill.affinity === 'string') {
            affinities = [skill.affinity];
        }
        // Se não tem nada, determinar automaticamente
        else {
            affinities = determineSkillAffinities(skill);
        }
        
        // Preencher campos de afinidade
        document.getElementById('editSkillAffinity1').value = affinities[0] || 'marcial';
        document.getElementById('editSkillAffinity2').value = affinities[1] || '';
        
        // Carregar coeficientes de efeitos
        loadEffectCoefficients(skill);
        
        // Abrir modal
        const modal = document.getElementById('skillEditModal');
        modal.style.display = 'flex';
        
        log(`Modal de edição aberto para: ${skill.name}`, 'success');
        
    } catch (error) {
        log(`Erro ao abrir modal de edição: ${error.message}`, 'error');
    }
}

// Fechar modal de edição
function closeSkillEditModal() {
    const modal = document.getElementById('skillEditModal');
    modal.style.display = 'none';
    currentEditingSkill = null;
    log('Modal de edição de skill fechado', 'info');
}

// Salvar edições da skill
async function saveSkillEdit() {
    try {
        console.log('💾 DEBUG: saveSkillEdit chamado!');
        console.trace('💾 DEBUG: Stack trace do save');
        
        if (!currentEditingSkill) {
            log('Nenhuma skill sendo editada', 'error');
            return;
        }
        
        log('Salvando alterações da skill...', 'info');
        
        // Coletar dados do form
        const formData = {
            id: document.getElementById('editSkillId').value,
            name: document.getElementById('editSkillName').value,
            damage: parseInt(document.getElementById('editSkillDamage').value) || 0,
            anima_cost: parseInt(document.getElementById('editSkillAnimaCost').value) || 0,
            cooldown: parseInt(document.getElementById('editSkillCooldown').value) || 0,
            duration: parseInt(document.getElementById('editSkillDuration').value) || 0,
            type: document.getElementById('editSkillType').value,
            description: document.getElementById('editSkillDescription').value,
            effects: document.getElementById('editSkillEffects').value
                .split(',')
                .map(e => e.trim())
                .filter(e => e.length > 0),
            cultural_authenticity: document.getElementById('editSkillCulturalAuth').value,
            affinity: [
                document.getElementById('editSkillAffinity1').value,
                document.getElementById('editSkillAffinity2').value
            ].filter(aff => aff && aff.trim() !== '') // Remove valores vazios
        };
        
        // Coletar coeficientes dos efeitos (apenas se existem controles)
        const coefficients = collectEffectCoefficients();
        
        // Manter dados que não estão no form, preservando coeficientes existentes
        const updatedSkill = {
            ...currentEditingSkill,
            ...formData,
            updated_at: new Date().toISOString()
        };
        
        // Apenas sobrescrever coeficientes se foram coletados novos valores
        if (coefficients.multi_hit) {
            updatedSkill.multi_hit = coefficients.multi_hit;
        }
        if (coefficients.buffs && Object.keys(coefficients.buffs).length > 0) {
            updatedSkill.buffs = coefficients.buffs;
        }
        if (coefficients.battlefield_effects && Object.keys(coefficients.battlefield_effects).length > 0) {
            updatedSkill.battlefield_effects = coefficients.battlefield_effects;
        }
        
        // Recalcular total_damage_potential para multi-hit
        if (updatedSkill.multi_hit) {
            updatedSkill.multi_hit.total_damage_potential = 
                updatedSkill.multi_hit.hits * updatedSkill.multi_hit.damage_per_hit;
        }
        
        // Atualizar descrições dos buffs
        if (updatedSkill.buffs) {
            Object.keys(updatedSkill.buffs).forEach(buffKey => {
                const buff = updatedSkill.buffs[buffKey];
                if (buffKey === 'critical_rate' && buff.bonus) {
                    buff.description = `Aumenta chance crítica em ${buff.bonus}% por ${buff.duration} turnos`;
                }
                else if (buffKey === 'critical_immunity') {
                    buff.description = `Imune a danos críticos por ${buff.duration} turnos`;
                }
                else if (buffKey === 'affinity_immunity' && buff.immunity_affinity) {
                    const affinityNames = {
                        'comercial': 'Comercial',
                        'marcial': 'Marcial', 
                        'elemental': 'Elemental',
                        'arcano': 'Arcano',
                        'espiritual': 'Espiritual',
                        'tecnologia': 'Tecnologia'
                    };
                    const affinityName = affinityNames[buff.immunity_affinity] || buff.immunity_affinity;
                    buff.description = `Imune a ataques e efeitos com afinidade ${affinityName} por ${buff.duration} turnos`;
                }
                else if (buffKey === 'physical_reduction' && buff.reduction_percentage) {
                    buff.description = `Ataque físico reduzido em ${buff.reduction_percentage}% (dividido por ${Math.round(100/(100-buff.reduction_percentage))}) por ${buff.duration} turnos`;
                }
                else if (buffKey === 'healing' && buff.heal_amount) {
                    const targetText = buff.target_type === 'area' ? 'todos os aliados' : 
                                     buff.target_type === 'self' ? 'próprio personagem' : 
                                     'personagem específico';
                    buff.description = `Cura ${buff.heal_amount} HP em ${targetText}`;
                }
                else if (buffKey === 'purification' && buff.dispel_type) {
                    const dispelText = buff.dispel_type === 'all' ? 'todos os debuffs' : 
                                     buff.dispel_type === 'specific' ? 'um debuff específico' : 
                                     'o último debuff';
                    const targetText = buff.target_type === 'area' ? 'todos os aliados' : 
                                     buff.target_type === 'self' ? 'próprio personagem' : 
                                     'personagem específico';
                    buff.description = `Remove ${dispelText} de ${targetText}`;
                }
            });
        }
        
        // DEBUG: Log completo do payload antes de enviar
        console.log('🚀 DEBUG: Payload completo sendo enviado:', JSON.stringify(updatedSkill, null, 2));
        console.log('🚀 DEBUG: Multi-hit no payload:', updatedSkill.multi_hit);
        console.log('🚀 DEBUG: Buffs no payload:', updatedSkill.buffs);
        console.log('🚀 DEBUG: Battlefield_effects no payload:', updatedSkill.battlefield_effects);
        console.log('🚀 DEBUG: Cultural authenticity no payload:', updatedSkill.cultural_authenticity);
        
        // Enviar para o servidor
        const response = await fetch(`/api/skills/${updatedSkill.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedSkill)
        });
        
        if (!response.ok) {
            throw new Error('Erro ao salvar skill');
        }
        
        const result = await response.json();
        log(`Skill "${updatedSkill.name}" salva com sucesso!`, 'success');
        
        // Fechar modal
        closeSkillEditModal();
        
        // Recarregar skills para mostrar mudanças
        await loadSkillsFromAPI();
        
    } catch (error) {
        log(`Erro ao salvar skill: ${error.message}`, 'error');
    }
}

// ========================
// SISTEMA DE AFINIDADES
// ========================

// Mapeamento de Classes para Afinidades
const AFFINITY_MAPPING = {
    'Lutador': 'marcial',
    'Naturalista': 'elemental',
    'Mago': 'arcano',
    'Clérigo': 'espiritual',
    'Sacerdote': 'espiritual',
    'Xamã': 'elemental',
    'Guerreiro': 'marcial',
    'Assassino': 'marcial',
    'Engenheiro': 'tecnologia',
    'Inventor': 'tecnologia',
    'Artificer': 'tecnologia',
    'Mercador': 'comercial',
    'Diplomata': 'comercial',
    'Nobre': 'comercial',
    'Bardo': 'comercial'
};

// Configuração de Afinidades
const AFFINITY_CONFIG = {
    marcial: {
        name: 'Marcial',
        icon: '⚔️',
        color: '#FF6B6B',
        description: 'Artes de combate físico direto'
    },
    elemental: {
        name: 'Elemental', 
        icon: '🌿',
        color: '#4ECDC4',
        description: 'Harmonia com forças naturais'
    },
    arcano: {
        name: 'Arcano',
        icon: '🔮', 
        color: '#9B59B6',
        description: 'Manipulação de energias místicas'
    },
    espiritual: {
        name: 'Espiritual',
        icon: '✨',
        color: '#F1C40F',
        description: 'Conexão com planos superiores'
    },
    tecnologia: {
        name: 'Tecnologia',
        icon: '⚙️',
        color: '#3498DB',
        description: 'Domínio de invenções e mecanismos'
    },
    comercial: {
        name: 'Comercial',
        icon: '💼',
        color: '#E67E22',
        description: 'Habilidades de negociação e influência social'
    }
};

// Obter afinidade principal de uma skill (para compatibilidade)
function getSkillAffinity(skill) {
    if (skill.affinity && Array.isArray(skill.affinity) && skill.affinity.length > 0) {
        return skill.affinity[0];
    }
    if (skill.affinity && typeof skill.affinity === 'string') {
        return skill.affinity;
    }
    return AFFINITY_MAPPING[skill.classe] || 'marcial';
}

// Obter todas as afinidades de uma skill
function getSkillAffinities(skill) {
    if (skill.affinity && Array.isArray(skill.affinity)) {
        return skill.affinity.filter(aff => aff && aff.trim() !== '');
    }
    if (skill.affinity && typeof skill.affinity === 'string') {
        return [skill.affinity];
    }
    const fallback = AFFINITY_MAPPING[skill.classe] || 'marcial';
    return [fallback];
}

// Filtrar skills por afinidade
function filterByAffinity(affinity) {
    currentSkillsFilter = `affinity:${affinity}`;
    
    // Atualizar botões ativos
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[onclick="filterByAffinity('${affinity}')"]`).classList.add('active');
    
    // Filtrar skills por afinidade
    const filteredSkills = allSkills.filter(skill => getSkillAffinity(skill) === affinity);
    
    // Atualizar grid
    const skillsGrid = document.getElementById('skills-grid');
    if (filteredSkills.length > 0) {
        skillsGrid.innerHTML = renderSkillsGridWithDelete(filteredSkills);
    } else {
        const config = AFFINITY_CONFIG[affinity];
        skillsGrid.innerHTML = `
            <div class="no-skills-message">
                <div class="no-skills-icon">${config.icon}</div>
                <h3>Nenhuma skill encontrada</h3>
                <p>Não há skills de afinidade <strong>${config.name}</strong> disponíveis no momento.</p>
            </div>
        `;
    }
    
    log(`Filtro por afinidade aplicado: ${config.name} (${filteredSkills.length} skills)`, 'info');
}

// ========================
// COEFICIENTES DE EFEITOS
// ========================

// Carregar coeficientes dos efeitos no modal
function loadEffectCoefficients(skill) {
    console.log('🔧 DEBUG: loadEffectCoefficients chamado para:', skill?.name);
    
    const container = document.getElementById('effectCoefficients');
    if (!container) {
        console.error('❌ DEBUG: Container effectCoefficients não encontrado');
        return;
    }
    
    container.innerHTML = ''; // Limpar conteúdo anterior
    
    console.log('🔍 DEBUG: Analisando skill completa:', JSON.stringify(skill, null, 2));
    console.log('🔍 DEBUG: Multi-hit tipo:', typeof skill.multi_hit, skill.multi_hit);
    console.log('🔍 DEBUG: Buffs tipo:', typeof skill.buffs, skill.buffs);
    console.log('🔍 DEBUG: Effects tipo:', typeof skill.effects, skill.effects);
    
    let coefficientsAdded = 0;
    
    // Processar multi-hit
    if (skill.multi_hit && typeof skill.multi_hit === 'object') {
        console.log('✅ DEBUG: Adicionando coeficiente multi-hit:', skill.multi_hit);
        try {
            const multiHitElement = createMultiHitCoefficient(skill.multi_hit);
            container.appendChild(multiHitElement);
            coefficientsAdded++;
            console.log('✅ DEBUG: Multi-hit adicionado com sucesso');
        } catch (error) {
            console.error('❌ DEBUG: Erro ao criar multi-hit:', error);
        }
    } else {
        console.log('❌ DEBUG: Multi-hit não é objeto válido:', skill.multi_hit);
    }
    
    // Processar buffs
    if (skill.buffs && typeof skill.buffs === 'object') {
        const buffKeys = Object.keys(skill.buffs);
        console.log('✅ DEBUG: Processando buffs:', buffKeys);
        
        buffKeys.forEach(buffKey => {
            console.log(`✅ DEBUG: Adicionando buff ${buffKey}:`, skill.buffs[buffKey]);
            try {
                const buffElement = createBuffCoefficient(buffKey, skill.buffs[buffKey]);
                container.appendChild(buffElement);
                coefficientsAdded++;
                console.log(`✅ DEBUG: Buff ${buffKey} adicionado com sucesso`);
            } catch (error) {
                console.error(`❌ DEBUG: Erro ao criar buff ${buffKey}:`, error);
            }
        });
    } else {
        console.log('❌ DEBUG: Buffs não é objeto válido:', skill.buffs);
    }

    // Processar battlefield_effects
    if (skill.battlefield_effects && typeof skill.battlefield_effects === 'object') {
        const battlefieldKeys = Object.keys(skill.battlefield_effects);
        console.log('✅ DEBUG: Processando battlefield_effects:', battlefieldKeys);
        
        battlefieldKeys.forEach(battlefieldKey => {
            console.log(`✅ DEBUG: Adicionando battlefield_effect ${battlefieldKey}:`, skill.battlefield_effects[battlefieldKey]);
            try {
                const battlefieldElement = createBattlefieldCoefficient(battlefieldKey, skill.battlefield_effects[battlefieldKey]);
                container.appendChild(battlefieldElement);
                coefficientsAdded++;
                console.log(`✅ DEBUG: Battlefield_effect ${battlefieldKey} adicionado com sucesso`);
            } catch (error) {
                console.error(`❌ DEBUG: Erro ao criar battlefield_effect ${battlefieldKey}:`, error);
            }
        });
    } else {
        console.log('❌ DEBUG: Battlefield_effects não é objeto válido:', skill.battlefield_effects);
    }
    
    // Resultado final
    console.log(`📊 DEBUG: Total de coeficientes adicionados: ${coefficientsAdded}`);
    
    if (coefficientsAdded === 0) {
        const noCoeffMessage = '<div class="no-coefficients">Esta skill não possui coeficientes editáveis</div>';
        container.innerHTML = noCoeffMessage;
        console.log('❌ DEBUG: Nenhum coeficiente encontrado, mostrando mensagem padrão');
        console.log('🔍 DEBUG: HTML inserido:', noCoeffMessage);
    } else {
        console.log(`✅ DEBUG: ${coefficientsAdded} controles de coeficientes adicionados com sucesso`);
        console.log('🔍 DEBUG: Conteúdo final do container:', container.innerHTML.substring(0, 200) + '...');
    }
}

// Criar controle para multi-hit
function createMultiHitCoefficient(multiHit) {
    const div = document.createElement('div');
    div.className = 'effect-coefficient';
    div.innerHTML = `
        <div class="effect-coefficient-header">
            <span class="effect-name">🎯 Multi-Hit</span>
            <span class="effect-type">Ataque Múltiplo</span>
        </div>
        <div class="coefficient-controls">
            <div class="coefficient-input">
                <label>Número de Hits:</label>
                <input type="number" name="multiHit_hits" value="${multiHit.hits || 5}" min="1" max="20">
            </div>
            <div class="coefficient-input">
                <label>Dano por Hit:</label>
                <input type="number" name="multiHit_damagePerHit" value="${multiHit.damage_per_hit || 15}" min="1" max="500">
            </div>
            <div class="coefficient-input">
                <label>Críticos Independentes:</label>
                <select name="multiHit_independentCrits">
                    <option value="true" ${multiHit.independent_crits ? 'selected' : ''}>Sim</option>
                    <option value="false" ${!multiHit.independent_crits ? 'selected' : ''}>Não</option>
                </select>
            </div>
        </div>
    `;
    return div;
}

// Criar controle para buff
function createBuffCoefficient(buffKey, buffData) {
    const div = document.createElement('div');
    div.className = 'effect-coefficient';
    
    const buffNames = {
        'critical_rate': '⚡ Aumento Crítico',
        'critical_immunity': '🛡️ Imunidade Crítica', 
        'physical_reduction': '⬇️ Redução Física',
        'affinity_immunity': '🌟 Imunidade por Afinidade',
        'healing': '💚 Cura',
        'purification': '✨ Purificação'
    };
    
    const buffName = buffNames[buffKey] || buffKey;
    
    let controls = '<div class="coefficient-controls">';
    
    // Bônus numérico
    if (buffData.bonus !== undefined) {
        controls += `
            <div class="coefficient-input">
                <label>Bônus (%):</label>
                <input type="number" name="buff_${buffKey}_bonus" value="${buffData.bonus}" min="0" max="200">
            </div>
        `;
    }
    
    // Redução percentual
    if (buffData.reduction_percentage !== undefined) {
        controls += `
            <div class="coefficient-input">
                <label>Redução (%):</label>
                <input type="number" name="buff_${buffKey}_reduction" value="${buffData.reduction_percentage}" min="0" max="100">
            </div>
        `;
    }
    
    // Duração
    if (buffData.duration !== undefined) {
        controls += `
            <div class="coefficient-input">
                <label>Duração (turnos):</label>
                <input type="number" name="buff_${buffKey}_duration" value="${buffData.duration}" min="0" max="10">
            </div>
        `;
    }
    
    // Imunidade
    if (buffData.immunity !== undefined) {
        controls += `
            <div class="coefficient-input">
                <label>Imunidade:</label>
                <select name="buff_${buffKey}_immunity">
                    <option value="true" ${buffData.immunity ? 'selected' : ''}>Ativa</option>
                    <option value="false" ${!buffData.immunity ? 'selected' : ''}>Inativa</option>
                </select>
            </div>
        `;
    }
    
    // Imunidade por Afinidade
    if (buffData.immunity_affinity !== undefined) {
        controls += `
            <div class="coefficient-input">
                <label>Afinidade da Imunidade:</label>
                <select name="buff_${buffKey}_immunityAffinity">
                    <option value="comercial" ${buffData.immunity_affinity === 'comercial' ? 'selected' : ''}>🏪 Comercial</option>
                    <option value="marcial" ${buffData.immunity_affinity === 'marcial' ? 'selected' : ''}>⚔️ Marcial</option>
                    <option value="elemental" ${buffData.immunity_affinity === 'elemental' ? 'selected' : ''}>🌿 Elemental</option>
                    <option value="arcano" ${buffData.immunity_affinity === 'arcano' ? 'selected' : ''}>🔮 Arcano</option>
                    <option value="espiritual" ${buffData.immunity_affinity === 'espiritual' ? 'selected' : ''}>✨ Espiritual</option>
                    <option value="tecnologia" ${buffData.immunity_affinity === 'tecnologia' ? 'selected' : ''}>⚙️ Tecnologia</option>
                </select>
            </div>
        `;
    }
    
    // Healing Controls
    if (buffData.heal_amount !== undefined) {
        controls += `
            <div class="coefficient-input">
                <label>Valor de Cura:</label>
                <input type="number" name="buff_${buffKey}_healAmount" value="${buffData.heal_amount}" min="0" max="500">
            </div>
        `;
    }
    
    if (buffData.target_type !== undefined) {
        controls += `
            <div class="coefficient-input">
                <label>Tipo de Alvo:</label>
                <select name="buff_${buffKey}_targetType">
                    <option value="self" ${buffData.target_type === 'self' ? 'selected' : ''}>Próprio Personagem</option>
                    <option value="single" ${buffData.target_type === 'single' ? 'selected' : ''}>Personagem Específico</option>
                    <option value="area" ${buffData.target_type === 'area' ? 'selected' : ''}>Área (Toda Equipe)</option>
                </select>
            </div>
        `;
    }
    
    if (buffData.target_scope !== undefined) {
        controls += `
            <div class="coefficient-input">
                <label>Escopo do Alvo:</label>
                <select name="buff_${buffKey}_targetScope">
                    <option value="allies" ${buffData.target_scope === 'allies' ? 'selected' : ''}>Aliados</option>
                    <option value="self" ${buffData.target_scope === 'self' ? 'selected' : ''}>Próprio</option>
                    <option value="enemies" ${buffData.target_scope === 'enemies' ? 'selected' : ''}>Inimigos</option>
                </select>
            </div>
        `;
    }
    
    // Purification Controls
    if (buffData.dispel_type !== undefined) {
        controls += `
            <div class="coefficient-input">
                <label>Tipo de Dispel:</label>
                <select name="buff_${buffKey}_dispelType">
                    <option value="all" ${buffData.dispel_type === 'all' ? 'selected' : ''}>Todos os Debuffs</option>
                    <option value="specific" ${buffData.dispel_type === 'specific' ? 'selected' : ''}>Debuff Específico</option>
                    <option value="latest" ${buffData.dispel_type === 'latest' ? 'selected' : ''}>Último Debuff</option>
                </select>
            </div>
        `;
    }
    
    controls += '</div>';
    
    div.innerHTML = `
        <div class="effect-coefficient-header">
            <span class="effect-name">${buffName}</span>
            <span class="effect-type">Buff Temporário</span>
        </div>
        ${controls}
    `;
    
    return div;
}

// Criar controle para battlefield effect
function createBattlefieldCoefficient(battlefieldKey, battlefieldData) {
    const div = document.createElement('div');
    div.className = 'effect-coefficient battlefield-effect';
    
    const battlefieldNames = {
        'commercial_restriction': '🚫 Restrição Comercial',
        'affinity_block': '🔒 Bloqueio de Afinidade',
        'area_effect': '🌍 Efeito de Área'
    };
    
    const battlefieldName = battlefieldNames[battlefieldKey] || battlefieldKey;
    
    let controls = '<div class="coefficient-controls">';
    
    // Target
    if (battlefieldData.target !== undefined) {
        controls += `
            <div class="coefficient-input">
                <label>Alvo:</label>
                <select name="battlefield_${battlefieldKey}_target">
                    <option value="all_participants" ${battlefieldData.target === 'all_participants' ? 'selected' : ''}>Todos os Participantes</option>
                    <option value="enemies" ${battlefieldData.target === 'enemies' ? 'selected' : ''}>Inimigos</option>
                    <option value="allies" ${battlefieldData.target === 'allies' ? 'selected' : ''}>Aliados</option>
                </select>
            </div>
        `;
    }
    
    // Tipo de restrição
    if (battlefieldData.restriction_type !== undefined) {
        controls += `
            <div class="coefficient-input">
                <label>Tipo de Restrição:</label>
                <select name="battlefield_${battlefieldKey}_restrictionType">
                    <option value="affinity" ${battlefieldData.restriction_type === 'affinity' ? 'selected' : ''}>Por Afinidade</option>
                    <option value="skill_type" ${battlefieldData.restriction_type === 'skill_type' ? 'selected' : ''}>Por Tipo de Skill</option>
                    <option value="damage" ${battlefieldData.restriction_type === 'damage' ? 'selected' : ''}>Por Dano</option>
                </select>
            </div>
        `;
    }
    
    // Afinidade restrita
    if (battlefieldData.restricted_affinity !== undefined) {
        controls += `
            <div class="coefficient-input">
                <label>Afinidade Restrita:</label>
                <select name="battlefield_${battlefieldKey}_restrictedAffinity">
                    <option value="comercial" ${battlefieldData.restricted_affinity === 'comercial' ? 'selected' : ''}>🏪 Comercial</option>
                    <option value="marcial" ${battlefieldData.restricted_affinity === 'marcial' ? 'selected' : ''}>⚔️ Marcial</option>
                    <option value="elemental" ${battlefieldData.restricted_affinity === 'elemental' ? 'selected' : ''}>🌿 Elemental</option>
                    <option value="arcano" ${battlefieldData.restricted_affinity === 'arcano' ? 'selected' : ''}>🔮 Arcano</option>
                    <option value="espiritual" ${battlefieldData.restricted_affinity === 'espiritual' ? 'selected' : ''}>✨ Espiritual</option>
                    <option value="tecnologia" ${battlefieldData.restricted_affinity === 'tecnologia' ? 'selected' : ''}>⚙️ Tecnologia</option>
                </select>
            </div>
        `;
    }
    
    // Duração
    if (battlefieldData.duration !== undefined) {
        controls += `
            <div class="coefficient-input">
                <label>Duração (turnos):</label>
                <input type="number" name="battlefield_${battlefieldKey}_duration" value="${battlefieldData.duration}" min="0" max="10">
            </div>
        `;
    }
    
    controls += '</div>';
    
    div.innerHTML = `
        <div class="effect-coefficient-header">
            <span class="effect-name">${battlefieldName}</span>
            <span class="effect-type">Efeito de Campo</span>
        </div>
        ${controls}
    `;
    
    return div;
}

// Definições dos efeitos que podem ter coeficientes
function getEffectDefinitions() {
    return {
        'multi_hit_5x': {
            name: 'Multi-Hit',
            hasCoefficients: false // Processado separadamente
        },
        'critical_boost_20%': {
            name: 'Aumento Crítico',
            hasCoefficients: false // Processado via buffs
        },
        'physical_reduction_80%': {
            name: 'Redução Física',
            hasCoefficients: false // Processado via buffs
        }
    };
}

// Coletar dados dos coeficientes para salvar
function collectEffectCoefficients() {
    console.log('📦 DEBUG: collectEffectCoefficients chamado');
    
    const coefficients = {};
    const container = document.getElementById('effectCoefficients');
    if (!container) {
        console.log('❌ DEBUG: Container effectCoefficients não encontrado');
        return coefficients;
    }
    
    console.log('📦 DEBUG: Container encontrado, conteúdo:', container.innerHTML.substring(0, 100) + '...');
    
    // Coletar todos os inputs da seção de coeficientes
    const inputs = container.querySelectorAll('input, select');
    console.log(`📦 DEBUG: Encontrados ${inputs.length} inputs/selects`);
    
    inputs.forEach(input => {
        const name = input.name;
        const value = input.type === 'number' ? parseFloat(input.value) || 0 : input.value;
        
        if (name.startsWith('multiHit_')) {
            if (!coefficients.multi_hit) coefficients.multi_hit = {};
            const key = name.replace('multiHit_', '');
            
            // Converter nomes para formato JSON
            if (key === 'hits') coefficients.multi_hit.hits = value;
            else if (key === 'damagePerHit') coefficients.multi_hit.damage_per_hit = value;
            else if (key === 'independentCrits') coefficients.multi_hit.independent_crits = value === 'true';
        }
        
        else if (name.startsWith('buff_')) {
            if (!coefficients.buffs) coefficients.buffs = {};
            const parts = name.split('_');
            
            // Reconstruir o nome completo do buff (pode ter underscores como critical_rate, critical_immunity, etc.)
            const buffName = parts.slice(1, -1).join('_'); // Tudo exceto primeiro e último elemento
            const property = parts[parts.length - 1]; // Último elemento
            
            console.log(`📦 DEBUG: Processando buff - Nome: ${buffName}, Propriedade: ${property}, Valor: ${value}`);
            
            if (!coefficients.buffs[buffName]) coefficients.buffs[buffName] = {};
            
            if (property === 'bonus') coefficients.buffs[buffName].bonus = value;
            else if (property === 'reduction') coefficients.buffs[buffName].reduction_percentage = value;
            else if (property === 'duration') coefficients.buffs[buffName].duration = value;
            else if (property === 'immunity') coefficients.buffs[buffName].immunity = value === 'true' || value === true;
            else if (property === 'immunityAffinity') coefficients.buffs[buffName].immunity_affinity = value;
            else if (property === 'healAmount') coefficients.buffs[buffName].heal_amount = value;
            else if (property === 'targetType') coefficients.buffs[buffName].target_type = value;
            else if (property === 'targetScope') coefficients.buffs[buffName].target_scope = value;
            else if (property === 'dispelType') coefficients.buffs[buffName].dispel_type = value;
            
            console.log(`📦 DEBUG: Buff ${buffName} atualizado:`, coefficients.buffs[buffName]);
        }
        
        else if (name.startsWith('battlefield_')) {
            if (!coefficients.battlefield_effects) coefficients.battlefield_effects = {};
            const parts = name.split('_');
            
            // Reconstruir o nome do battlefield effect
            const battlefieldName = parts.slice(1, -1).join('_');
            const property = parts[parts.length - 1];
            
            console.log(`📦 DEBUG: Processando battlefield - Nome: ${battlefieldName}, Propriedade: ${property}, Valor: ${value}`);
            
            if (!coefficients.battlefield_effects[battlefieldName]) coefficients.battlefield_effects[battlefieldName] = {};
            
            if (property === 'target') coefficients.battlefield_effects[battlefieldName].target = value;
            else if (property === 'restrictionType') coefficients.battlefield_effects[battlefieldName].restriction_type = value;
            else if (property === 'restrictedAffinity') coefficients.battlefield_effects[battlefieldName].restricted_affinity = value;
            else if (property === 'duration') coefficients.battlefield_effects[battlefieldName].duration = value;
            
            console.log(`📦 DEBUG: Battlefield ${battlefieldName} atualizado:`, coefficients.battlefield_effects[battlefieldName]);
        }
    });
    
    console.log('📦 DEBUG: Coeficientes coletados:', JSON.stringify(coefficients, null, 2));
    return coefficients;
}

// Função para determinar as afinidades de uma skill (até 2)
function determineSkillAffinities(skill) {
    const affinities = [];
    
    // Mapeamento direto por classe do personagem (afinidade principal)
    const AFFINITY_MAPPING = {
        'Lutador': 'marcial',
        'Naturalista': 'elemental', 
        'Engenheiro': 'tecnologia',
        'Mercador': 'comercial',
        'Arcano': 'arcano',
        'Oráculo': 'espiritual',
        'Curandeiro Ritualista': 'espiritual'
    };
    
    if (skill.classe && AFFINITY_MAPPING[skill.classe]) {
        affinities.push(AFFINITY_MAPPING[skill.classe]);
    }
    
    // Análise de palavras-chave na descrição para afinidades secundárias
    const description = (skill.description || '').toLowerCase();
    const name = (skill.name || '').toLowerCase();
    const text = description + ' ' + name;
    
    // Detectar múltiplas afinidades baseado em conteúdo
    const detectedAffinities = [];
    
    if (text.includes('místic') || text.includes('mágic') || text.includes('arcano') || text.includes('feitiç')) {
        detectedAffinities.push('arcano');
    }
    if (text.includes('espiritual') || text.includes('sagrado') || text.includes('cura') || text.includes('budis') || text.includes('divind')) {
        detectedAffinities.push('espiritual');
    }
    if (text.includes('tecnológic') || text.includes('mecânic') || text.includes('dispositiv') || text.includes('engenhar')) {
        detectedAffinities.push('tecnologia');
    }
    if (text.includes('comercial') || text.includes('negócio') || text.includes('mercad') || text.includes('diplomac')) {
        detectedAffinities.push('comercial');
    }
    if (text.includes('natural') || text.includes('element') || text.includes('plant') || text.includes('animal') || text.includes('terra') || text.includes('água') || text.includes('fogo') || text.includes('ar')) {
        detectedAffinities.push('elemental');
    }
    if (text.includes('combat') || text.includes('físic') || text.includes('luta') || text.includes('golpe') || text.includes('ataque')) {
        detectedAffinities.push('marcial');
    }
    
    // Combinar afinidades detectadas com a principal
    detectedAffinities.forEach(aff => {
        if (!affinities.includes(aff) && affinities.length < 2) {
            affinities.push(aff);
        }
    });
    
    // Fallback por tipo de skill se nenhuma foi detectada
    if (affinities.length === 0) {
        if (skill.type === 'healing') affinities.push('espiritual');
        else if (skill.type === 'magic') affinities.push('arcano');
        else if (skill.type === 'utility') affinities.push('elemental');
        else affinities.push('marcial'); // Padrão: marcial
    }
    
    // Garantir que temos pelo menos 1 e no máximo 2 afinidades
    return affinities.slice(0, 2);
}

// Função de compatibilidade para determinar afinidade principal
function determineSkillAffinity(skill) {
    const affinities = determineSkillAffinities(skill);
    return affinities[0] || 'marcial';
}

// Função para validar que as afinidades não são duplicadas
function validateAffinities() {
    const affinity1 = document.getElementById('editSkillAffinity1').value;
    const affinity2 = document.getElementById('editSkillAffinity2').value;
    
    // Se afinidade secundária é igual à principal, resetar
    if (affinity2 && affinity1 === affinity2) {
        document.getElementById('editSkillAffinity2').value = '';
        
        // Mostrar feedback visual temporário
        const select2 = document.getElementById('editSkillAffinity2');
        const originalStyle = select2.style.borderColor;
        select2.style.borderColor = '#ff6b6b';
        select2.style.boxShadow = '0 0 5px rgba(255, 107, 107, 0.5)';
        
        setTimeout(() => {
            select2.style.borderColor = originalStyle;
            select2.style.boxShadow = '';
        }, 2000);
        
        console.log('🚫 Afinidade duplicada removida. Afinidades devem ser diferentes.');
    }
}

// Database da Habilidade Ancestral
const ANCESTRAL_PASSIVES = {
    "045CCF3515": { // Miloš Železnikov
        name: "🔨 Maestria Ancestral da Forja",
        trigger: "Ao Defender",
        description: "A paciência eslava e técnicas ancestrais aumentam a precisão da próxima criação. Quando Miloš defende, sua próxima habilidade de forja ganha +20% de poder e chance aumentada de criar armas especiais.",
        effects: [
            { name: "Bônus de Forja", value: "+20%" },
            { name: "Chance Arma Draconiana", value: "+15%" },
            { name: "Aquecimento da Forja", value: "Progressivo" }
        ],
        culture: "Eslava",
        characterName: "Miloš Železnikov"
    },
    "EA32D10F2D": { // Shi Wuxing
        name: "💎 Sabedoria dos Cinco Dhyāni-Budas (五智金剛覺)",
        trigger: "Acúmulo por Diversidade (5 tipos de habilidades)",
        description: "O Vajra dos Cinco Dhyāni-Budas ressoa com cada ação de Shi, transformando os cinco venenos mentais em sabedorias transcendentes. Quando todas as cinco pontas do vajra se iluminam através do combate consciente, Shi manifesta temporariamente a perfeição búdica, onde cada movimento torna-se expressão da compaixão universal.",
        effects: [
            { name: "Transformação de Kleśas", value: "Debuffs → Bônus" },
            { name: "Mandala Búdico", value: "40 Ânima + 30 HP (área)" },
            { name: "Samādhi Supremo", value: "5 habilidades com efeito x2" },
            { name: "Sabedorias Individuais", value: "Bônus por Dhyāni-Buddha" }
        ],
        culture: "Budismo Chan Shaolin",
        characterName: "Shi Wuxing",
        artifact: "Vajra dos Cinco Dhyāni-Budas (五智金剛杵)"
    },
    "A9C4N0001E": { // Aurelius Ignisvox
        name: "⚔️ Disciplina Militar Romana",
        trigger: "Uso Consecutivo",
        description: "A disciplina das legiões romanas fortalece com cada comando. Uso consecutivo de habilidades militares aumenta o rank de comando e a eficácia das formações.",
        effects: [
            { name: "Bônus Veterano", value: "+5% por uso" },
            { name: "Rank de Comando", value: "Escala até 5" },
            { name: "Chance Centurião", value: "+10% por rank" }
        ],
        culture: "Romana Imperial",
        characterName: "Aurelius Ignisvox"
    },
    "7A8B9C0D1E": { // Pythia Kassandra
        name: "🔮 Visão Oracular Contínua",
        trigger: "Início de Combate",
        description: "A conexão com Apolo revela fragmentos do futuro constantemente. Pythia começa batalhas com insight oracular e ganha visões adicionais conforme usa suas habilidades proféticas.",
        effects: [
            { name: "Insight Inicial", value: "Primordial" },
            { name: "Acúmulo de Sabedoria", value: "+1 por skill" },
            { name: "Favor de Apolo", value: "Críticos aprimorados" }
        ],
        culture: "Grega Clássica",
        characterName: "Pythia Kassandra"
    },
    "2F3E4D5C6B": { // Itzel Nahualli
        name: "🐆 Conexão Espiritual Animal",
        trigger: "Por Transformação",
        description: "Cada transformação fortalece a conexão com os espíritos animais. Itzel ganha energia espiritual permanente e pode acessar múltiplas formas com maior facilidade.",
        effects: [
            { name: "Energia Espiritual", value: "+15 por forma" },
            { name: "Evolução", value: "Progresso permanente" },
            { name: "Versatilidade", value: "Formas não repetem" }
        ],
        culture: "Azteca/Mexica",
        characterName: "Itzel Nahualli"
    },
    "9A8B7C6D5E": { // Giovanni da Ferrara
        name: "🎨 Genialidade Renascentista",
        trigger: "Ao Criar Invenções",
        description: "A inspiração renascentista e o conhecimento multidisciplinar aceleram a criação. Giovanni ganha inspiração permanente e suas oficinas tornam-se mais eficientes com o uso.",
        effects: [
            { name: "Inspiração", value: "+10 por criação" },
            { name: "Eficiência da Oficina", value: "Duração aumentada" },
            { name: "Maestria Técnica", value: "+15% qualidade" }
        ],
        culture: "Italiana Renascentista",
        characterName: "Giovanni da Ferrara"
    },
    "4F3E2D1C0B": { // Yamazaki Karakuri
        name: "⚙️ Harmonia Mecânica Perfeita",
        trigger: "Karakuri Ativos",
        description: "Múltiplos autômatos operam em sincronia perfeita. A harmonia mecânica aumenta com cada Karakuri ativo, proporcionando bônus de coordenação exponencial.",
        effects: [
            { name: "Harmonia", value: "+15 por Karakuri" },
            { name: "Coordenação", value: "Bônus multiplicativo" },
            { name: "Precisão", value: "Escala por harmonia" }
        ],
        culture: "Japonesa Edo",
        characterName: "Yamazaki Karakuri"
    }
};

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    log('Sistema de Skills Modular carregado', 'success');
    await loadCharacterData();
    await loadSkillsFromAPI();
    renderPassivesGrid();
    updateStats();
});

// Carregar dados dos personagens
async function loadCharacterData() {
    try {
        log('Carregando dados dos personagens...', 'info');
        
        const response = await fetch('/api/characters');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        appState.characters = Object.values(data.characters);
        
        log(`${appState.characters.length} personagens carregados`, 'success');
        renderCharacterGrid();
        
    } catch (error) {
        log(`Erro ao carregar personagens: ${error.message}`, 'error');
    }
}

// Renderizar grid de personagens
function renderCharacterGrid() {
    const grid = document.getElementById('characterGrid');
    
    if (appState.characters.length === 0) {
        grid.innerHTML = '<div class="loading">Nenhum personagem encontrado</div>';
        return;
    }

    grid.innerHTML = appState.characters.map(char => `
        <div class="character-card" onclick="loadCharacterSkills('${char.id}')">
            <h3>${char.name}</h3>
            <div class="character-info">
                <span>Cultura: ${char.cultura || 'Desconhecida'}</span>
                <span>Classe: ${char.classe || 'Indefinida'}</span>
            </div>
            <div class="skills-list" id="skills-${char.id}">
                <div style="opacity: 0.5; font-style: italic;">Clique para carregar skills</div>
            </div>
        </div>
    `).join('');
}

// Renderizar grid da habilidade ancestral
function renderPassivesGrid() {
    const grid = document.getElementById('passivesGrid');
    
    const availablePassives = Object.entries(ANCESTRAL_PASSIVES);
    
    if (availablePassives.length === 0) {
        grid.innerHTML = '<div class="loading">Nenhuma habilidade ancestral disponível</div>';
        return;
    }

    grid.innerHTML = availablePassives.map(([characterId, passive]) => `
        <div class="passive-card" onclick="showAncestralModal('${characterId}')">
            <div class="passive-header">
                <h3 class="passive-name">${passive.name}</h3>
                <span class="passive-trigger">${passive.trigger}</span>
            </div>
            
            <div class="passive-description">
                ${passive.description}
            </div>
            
            <div class="passive-effects">
                <h4>⚡ Efeitos:</h4>
                ${passive.effects.map(effect => `
                    <div class="effect-item">
                        <span>${effect.name}:</span>
                        <span class="effect-value">${effect.value}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="character-meta">
                <span>${passive.characterName}</span>
                <span class="culture-tag">${passive.culture}</span>
            </div>
        </div>
    `).join('');
    
    log(`${availablePassives.length} habilidades ancestrais renderizadas`, 'success');
}

// Carregar skills de um personagem específico
async function loadCharacterSkills(characterId) {
    const startTime = Date.now();
    
    try {
        log(`Carregando skills para personagem ${characterId}...`, 'info');
        
        const skillInstance = await skillLoader.loadCharacterSkills(characterId);
        const skills = await skillLoader.getAvailableSkills(characterId);
        const culturalInfo = await skillLoader.getCulturalInfo(characterId);
        
        appState.loadedSkills.set(characterId, skillInstance);
        
        const endTime = Date.now();
        const loadTime = endTime - startTime;
        
        log(`Skills carregadas para ${culturalInfo.characterName} em ${loadTime}ms`, 'success');
        
        // Atualizar display de skills
        const skillsContainer = document.getElementById(`skills-${characterId}`);
        if (skillsContainer) {
            skillsContainer.innerHTML = skills.map(skill => `
                <div class="skill-item" onclick="testSkill('${characterId}', '${skill.id}')">
                    <div class="skill-name">${skill.name}</div>
                    <div class="skill-details">
                        <span>Custo: ${skill.animaCost} Ânima</span>
                        <span>Dano: ${skill.damage}</span>
                        <span>Tipo: ${skill.type}</span>
                    </div>
                </div>
            `).join('');
        }
        
        updateStats();
        document.getElementById('loadingTime').textContent = loadTime + 'ms';
        
    } catch (error) {
        log(`Erro ao carregar skills: ${error.message}`, 'error');
    }
}

// Carregar todas as skills
async function loadAllSkills() {
    const startTime = Date.now();
    log('Iniciando carregamento de todas as skills...', 'info');
    
    try {
        const characterIds = appState.characters.map(char => char.id);
        const skillsMap = await skillLoader.loadMultipleSkills(characterIds);
        
        // Atualizar state
        for (const [id, skills] of skillsMap) {
            appState.loadedSkills.set(id, skills);
        }
        
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        
        log(`Todas as skills carregadas em ${totalTime}ms`, 'success');
        
        // Atualizar interface para todos os personagens
        for (const char of appState.characters) {
            if (skillsMap.has(char.id)) {
                const skills = await skillLoader.getAvailableSkills(char.id);
                const skillsContainer = document.getElementById(`skills-${char.id}`);
                if (skillsContainer) {
                    skillsContainer.innerHTML = skills.map(skill => `
                        <div class="skill-item" onclick="testSkill('${char.id}', '${skill.id}')">
                            <div class="skill-name">${skill.name}</div>
                            <div class="skill-details">
                                <span>Custo: ${skill.animaCost} Ânima</span>
                                <span>Dano: ${skill.damage}</span>
                            </div>
                        </div>
                    `).join('');
                }
            }
        }
        
        updateStats();
        document.getElementById('loadingTime').textContent = totalTime + 'ms';
        
    } catch (error) {
        log(`Erro no carregamento em massa: ${error.message}`, 'error');
    }
}

// Testar uma skill específica
async function testSkill(characterId, skillId) {
    try {
        log(`Testando skill ${skillId} do personagem ${characterId}...`, 'skill');
        
        // Criar objetos mock para teste
        const mockBattle = {
            addToLog: (type, message) => log(`[Battle] ${message}`, 'skill'),
            addVisualEffect: (effect, target) => log(`[Effect] ${effect} em ${target.name}`, 'info')
        };
        
        const character = appState.characters.find(c => c.id === characterId);
        const mockCaster = {
            ...character,
            currentHP: character.hp || 100,
            currentAnima: character.anima || 50,
            statusEffects: []
        };
        
        const mockTarget = {
            name: 'Inimigo de Teste',
            currentHP: 80,
            maxHP: 100,
            defense: 15,
            statusEffects: []
        };

        // Executar skill
        const result = await skillLoader.executeSkill(characterId, skillId, mockBattle, mockCaster, mockTarget);
        
        log(`Skill executada com sucesso!`, 'success');
        log(`Resultado: ${JSON.stringify(result, null, 2)}`, 'info');
        
        if (result.culturalNarrative) {
            log(`Narrativa Cultural: "${result.culturalNarrative}"`, 'skill');
        }
        
    } catch (error) {
        log(`Erro ao executar skill: ${error.message}`, 'error');
    }
}

// Testar skill aleatória
async function testRandomSkill() {
    if (appState.loadedSkills.size === 0) {
        log('Nenhuma arte combativa carregada para teste', 'warning');
        return;
    }

    const characterIds = Array.from(appState.loadedSkills.keys());
    const randomCharacterId = characterIds[Math.floor(Math.random() * characterIds.length)];
    
    const skills = await skillLoader.getAvailableSkills(randomCharacterId);
    if (skills.length > 0) {
        const randomSkill = skills[Math.floor(Math.random() * skills.length)];
        await testSkill(randomCharacterId, randomSkill.id);
    }
}

// Limpar cache
function clearCache() {
    skillLoader.clearCache();
    appState.loadedSkills.clear();
    log('Cache limpo', 'info');
    updateStats();
    renderCharacterGrid();
}

// Atualizar estatísticas
function updateStats() {
    try {
        const loadedSkills = appState.loadedSkills.size;
        const availableCharacters = appState.characters.length || 15;
        const activeLoading = 0; // Como não temos tracking de loading ativo
        
        const loadedElement = document.getElementById('loadedSkillsCount');
        const availableElement = document.getElementById('availableCharactersCount');
        const activeElement = document.getElementById('activeLoadingCount');
        
        if (loadedElement) loadedElement.textContent = loadedSkills;
        if (availableElement) availableElement.textContent = availableCharacters;
        if (activeElement) activeElement.textContent = activeLoading;
    } catch (error) {
        console.warn('Erro ao atualizar stats:', error.message);
    }
}

// Função de log
function log(message, type = 'info') {
    const logContainer = document.getElementById('activityLog');
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = `[${timestamp}] ${message}`;
    
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
    
    // Limitar a 100 entradas no log
    while (logContainer.children.length > 100) {
        logContainer.removeChild(logContainer.firstChild);
    }
}

// Limpar log
function clearLog() {
    document.getElementById('activityLog').innerHTML = 
        '<div class="log-entry info">Log limpo</div>';
}

// Funções para Artes Combativas
let currentSkillsFilter = 'all';
let allSkills = [];

// Função para carregar skills da API
async function loadSkillsFromAPI() {
    try {
        log('Carregando skills da API...', 'info');
        
        const response = await fetch('/api/skills');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        allSkills = data.data?.skills || [];
        
        log(`${allSkills.length} artes combativas carregadas da API`, 'success');
        
        // Renderizar no grid
        const skillsGrid = document.getElementById('skills-grid');
        if (allSkills.length > 0) {
            skillsGrid.innerHTML = renderSkillsGridWithDelete(allSkills);
        } else {
            skillsGrid.innerHTML = '<div class="loading">📝 Nenhuma arte combativa disponível</div>';
        }
        
        // Incluir skills do Shi Wuxing no log
        const shiSkills = allSkills.filter(skill => skill.character_id === 'EA32D10F2D');
        if (shiSkills.length > 0) {
            log(`✅ Skills do Shi Wuxing encontradas: ${shiSkills.map(s => s.name).join(', ')}`, 'success');
        }
        
        // Disparar evento para compatibilidade
        document.dispatchEvent(new CustomEvent('skillsLoaded', {
            detail: { skills: allSkills }
        }));
        
    } catch (error) {
        log(`Erro ao carregar skills: ${error.message}`, 'error');
    }
}

// Escutar evento de skills carregadas
document.addEventListener('skillsLoaded', function(event) {
    allSkills = event.detail.skills;
    log(`${allSkills.length} artes combativas carregadas`, 'success');
    
    // Incluir skills do Shi Wuxing no log
    const shiSkills = allSkills.filter(skill => skill.character_id === 'EA32D10F2D');
    if (shiSkills.length > 0) {
        log(`✅ Skills do Shi Wuxing migradas: ${shiSkills.map(s => s.name).join(', ')}`, 'success');
    }
});

// Filtrar skills por tipo
function filterSkills(filterType) {
    currentSkillsFilter = filterType;
    
    // Atualizar botões ativos
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Filtrar skills
    let filteredSkills = allSkills;
    if (filterType !== 'all') {
        filteredSkills = allSkills.filter(skill => skill.type === filterType);
    }
    
    // Atualizar grid
    const skillsGrid = document.getElementById('skills-grid');
    if (filteredSkills.length > 0) {
        skillsGrid.innerHTML = renderSkillsGridWithDelete(filteredSkills);
    } else {
        skillsGrid.innerHTML = `
            <div class="loading">
                📝 Nenhuma arte combativa encontrada para o filtro "${filterType}"
            </div>
        `;
    }
    
    log(`Filtro aplicado: ${filterType} (${filteredSkills.length} skills)`, 'info');
}

// Buscar skills do Shi Wuxing especificamente
function showShiWuxingSkills() {
    const shiSkills = allSkills.filter(skill => skill.character_id === 'EA32D10F2D');
    const skillsGrid = document.getElementById('skills-grid');
    
    if (shiSkills.length > 0) {
        skillsGrid.innerHTML = renderSkillsGridWithDelete(shiSkills);
        log(`Mostrando ${shiSkills.length} skills do Shi Wuxing`, 'success');
    } else {
        skillsGrid.innerHTML = '<div class="loading">❌ Nenhuma arte combativa do Shi Wuxing encontrada</div>';
        log('Nenhuma arte combativa do Shi Wuxing encontrada', 'error');
    }
}

// Função para deletar skill
async function deleteSkill(skillId, skillName) {
    try {
        log(`Deletando skill ${skillName} (ID: ${skillId})...`, 'warning');
        
        const response = await fetch(`/api/skills/${skillId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            log(`✅ Skill "${skillName}" deletada com sucesso`, 'success');
            
            // Remover da lista local
            allSkills = allSkills.filter(skill => skill.id !== skillId);
            
            // Remover do skillLoader se disponível
            if (window.skillLoader) {
                window.skillLoader.removeSkill(skillId);
            } else {
                // Fallback: recarregar interface manualmente
                const skillsGrid = document.getElementById('skills-grid');
                if (allSkills.length > 0) {
                    skillsGrid.innerHTML = renderSkillsGridWithDelete(allSkills);
                } else {
                    skillsGrid.innerHTML = '<div class="loading">📝 Nenhuma arte combativa disponível</div>';
                }
            }
            
            // Atualizar contador
            updateSkillCount();
            
        } else {
            throw new Error(result.message || 'Erro desconhecido');
        }
        
    } catch (error) {
        log(`❌ Erro ao deletar skill: ${error.message}`, 'error');
    }
}

// Criar modal de delete dinamicamente
function createDeleteModal() {
    const modalHTML = `
        <div id="deleteModal" class="modal" style="display: none;">
            <div class="modal-content delete-modal">
                <div class="modal-header">
                    <h2>🗑️ Confirmar Exclusão</h2>
                    <span class="close" onclick="document.getElementById('deleteModal').style.display='none'">&times;</span>
                </div>
                <div class="modal-body">
                    <p>Tem certeza que deseja deletar a skill:</p>
                    <div class="delete-skill-name" style="font-weight: bold; color: #e74c3c; margin: 10px 0; text-align: center;"></div>
                    <p style="color: #888; font-size: 0.9em;">Esta ação não pode ser desfeita.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn secondary delete-cancel-btn">Cancelar</button>
                    <button type="button" class="btn danger delete-confirm-btn">🗑️ Deletar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Mostrar modal de confirmação de delete
function showDeleteModal(skillId, skillName) {
    const modal = document.getElementById('deleteModal');
    if (!modal) {
        createDeleteModal();
        return showDeleteModal(skillId, skillName);
    }
    
    const skillNameElement = modal.querySelector('.delete-skill-name');
    skillNameElement.textContent = skillName;
    
    const confirmBtn = modal.querySelector('.delete-confirm-btn');
    const cancelBtn = modal.querySelector('.delete-cancel-btn');
    
    // Remover listeners antigos
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    
    // Adicionar novos listeners
    const newConfirmBtn = modal.querySelector('.delete-confirm-btn');
    const newCancelBtn = modal.querySelector('.delete-cancel-btn');
    
    newConfirmBtn.addEventListener('click', async () => {
        modal.style.display = 'none';
        await deleteSkill(skillId, skillName);
    });
    
    newCancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        log(`Cancelado delete da skill "${skillName}"`, 'info');
    });
    
    modal.style.display = 'flex';
}

// Criar modal de confirmação de delete
function createDeleteModal() {
    const modal = document.createElement('div');
    modal.id = 'deleteModal';
    modal.className = 'delete-modal';
    
    modal.innerHTML = `
        <div class="delete-modal-content">
            <h3>Confirmar Exclusão</h3>
            <p>Tem certeza de que deseja deletar a skill "<strong class="delete-skill-name"></strong>"?</p>
            <p style="font-size: 0.85rem; opacity: 0.7; margin-top: 15px;">Esta ação não pode ser desfeita.</p>
            <div class="delete-modal-actions">
                <button class="delete-cancel-btn">◊ Cancelar</button>
                <button class="delete-confirm-btn">⚔ Deletar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Fechar modal ao clicar no fundo
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Fechar modal com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            modal.style.display = 'none';
        }
    });
}

// Função para renderizar skills com botão de delete
function renderSkillsGridWithDelete(skills) {
    return skills.map(skill => {
        const affinities = getSkillAffinities(skill);
        const primaryAffinity = affinities[0];
        
        // Criar indicadores para todas as afinidades
        const affinityIndicators = affinities.map((affinity, index) => {
            const affinityConfig = AFFINITY_CONFIG[affinity];
            const isSecondary = index > 0;
            
            return `
                <div class="affinity-indicator ${affinity} ${isSecondary ? 'secondary' : 'primary'}" 
                     title="Afinidade ${isSecondary ? 'Secundária' : 'Principal'}: ${affinityConfig.name}">
                    ${affinityConfig.icon}
                </div>
            `;
        }).join('');
        
        return `
        <div class="skill-card ${skill.type} ${primaryAffinity}" data-skill-id="${skill.id}" onclick="openSkillEditModal('${skill.id}')">
            <button class="skill-delete-btn" onclick="event.stopPropagation(); showDeleteModal('${skill.id}', '${skill.name.replace(/'/g, '\\\'')}')" title="Deletar Skill">
                ⚔
            </button>
            
            <!-- Indicadores de Afinidade -->
            <div class="affinity-indicators">
                ${affinityIndicators}
            </div>
            
            <div class="skill-header">
                <h3 class="skill-name">${skill.name}</h3>
            </div>
            
            <div class="skill-stats">
                <div class="stat">
                    <span class="label">Dano:</span>
                    <span class="value">${skill.damage || 0}</span>
                </div>
                <div class="stat">
                    <span class="label">Ânima:</span>
                    <span class="value">${skill.anima_cost || 0}</span>
                </div>
                <div class="stat">
                    <span class="label">Cooldown:</span>
                    <span class="value">${skill.cooldown || 0}t</span>
                </div>
                <div class="stat">
                    <span class="label">Tipo:</span>
                    <span class="value">${skill.type}</span>
                </div>
            </div>
            
            <div class="skill-description">
                ${skill.description || 'Sem descrição disponível'}
            </div>
            
            ${skill.effects && skill.effects.length > 0 ? `
                <div class="skill-effects">
                    <strong>Efeitos:</strong><br>
                    ${skill.effects.map(effect => `<span class="effect">${effect}</span>`).join(' ')}
                </div>
            ` : ''}
            
            ${skill.cultural_authenticity ? `
                <div class="cultural-authenticity">
                    <strong>Autenticidade Cultural:</strong>
                    <p>${skill.cultural_authenticity}</p>
                </div>
            ` : ''}
        </div>
        `;
    }).join('');
}

// Função para atualizar contador de skills
function updateSkillCount() {
    const countElement = document.getElementById('skill-count');
    if (countElement) {
        countElement.textContent = allSkills.length;
    }
}

// Mostrar modal de habilidade ancestral
function showAncestralModal(characterId) {
    const passive = ANCESTRAL_PASSIVES[characterId];
    if (!passive) {
        log(`Habilidade ancestral não encontrada para ${characterId}`, 'error');
        return;
    }
    
    // Criar modal se não existir
    let modal = document.getElementById('ancestralModal');
    if (!modal) {
        createAncestralModal();
        modal = document.getElementById('ancestralModal');
    }
    
    // Preencher conteúdo do modal
    const modalContent = modal.querySelector('.ancestral-modal-content');
    modalContent.innerHTML = `
        <button class="ancestral-close-btn" onclick="closeAncestralModal()">✕</button>
        
        <h2 class="modal-ancestral-name">${passive.name}</h2>
        
        <div class="modal-character-info">
            <div class="modal-character-name">${passive.characterName}</div>
            <div class="modal-culture">${passive.culture}</div>
        </div>
        
        ${passive.artifact ? `
            <div class="modal-artifact">
                <strong>🏺 Artefato Cultural:</strong>
                ${passive.artifact}
            </div>
        ` : ''}
        
        <div class="modal-trigger">
            <strong>⚡ Trigger:</strong> ${passive.trigger}
        </div>
        
        <div class="modal-description">
            ${passive.description}
        </div>
        
        <div class="modal-effects">
            <h4>⚡ Efeitos da Habilidade Ancestral</h4>
            ${passive.effects.map(effect => `
                <div class="modal-effect-item">
                    <span>${effect.name}</span>
                    <span class="modal-effect-value">${effect.value}</span>
                </div>
            `).join('')}
        </div>
    `;
    
    // Mostrar modal com animação
    modal.style.display = 'flex';
    
    log(`Modal da habilidade ancestral "${passive.name}" aberto`, 'info');
}

// Criar modal de habilidade ancestral
function createAncestralModal() {
    const modal = document.createElement('div');
    modal.id = 'ancestralModal';
    modal.className = 'ancestral-modal';
    
    modal.innerHTML = `
        <div class="ancestral-modal-content">
            <!-- Conteúdo será preenchido dinamicamente -->
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Fechar modal ao clicar no fundo
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeAncestralModal();
        }
    });
    
    // Fechar modal com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeAncestralModal();
        }
    });
}

// Fechar modal de habilidade ancestral
function closeAncestralModal() {
    const modal = document.getElementById('ancestralModal');
    if (modal) {
        modal.style.display = 'none';
        log('Modal de habilidade ancestral fechado', 'info');
    }
}

// Atualizar stats periodicamente
setInterval(updateStats, 2000);

// Adicionar event listener para fechar modal com ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('skillEditModal');
        if (modal && modal.style.display === 'flex') {
            closeSkillEditModal();
        }
    }
});

// Teste simples para ver se as funções estão disponíveis
console.log('Modal functions loaded:', {
    openSkillEditModal: typeof openSkillEditModal,
    closeSkillEditModal: typeof closeSkillEditModal,
    saveSkillEdit: typeof saveSkillEdit
});

// Função de teste para verificar se o modal funciona
window.testModal = function() {
    console.log('Testing modal with first skill...');
    if (allSkills && allSkills.length > 0) {
        openSkillEditModal(allSkills[0].id);
    } else {
        console.log('No skills available for testing');
    }
};