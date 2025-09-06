/**
 * RPGStack Skill Loader
 * Carrega skills do sistema moderno via API
 */

class SkillLoader {
    constructor() {
        this.skills = new Map();
        this.loaded = false;
        this.apiUrl = '/api/skills';
    }

    async loadAllSkills() {
        try {
            console.log('🔄 Carregando skills da API moderna...');
            
            const response = await fetch(this.apiUrl);
            const result = await response.json();

            if (result.success && result.data && result.data.skills) {
                const skills = result.data.skills;
                
                // Popular Map de skills
                skills.forEach(skill => {
                    this.skills.set(skill.id, skill);
                });

                this.loaded = true;
                
                console.log(`✅ ${skills.length} skills carregadas com sucesso!`);
                console.log('📊 Skills por classe:', this.getSkillsByClass());
                
                // Atualizar UI se existir
                this.updateUI(skills);
                
                return skills;
            } else {
                throw new Error('Resposta inválida da API: ' + result.error);
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar skills:', error);
            this.showError(error.message);
            return [];
        }
    }

    getSkillsByClass() {
        const classes = {};
        this.skills.forEach(skill => {
            classes[skill.classe] = (classes[skill.classe] || 0) + 1;
        });
        return classes;
    }

    getSkillsByCharacter(characterId) {
        return Array.from(this.skills.values())
            .filter(skill => skill.character_id === characterId);
    }

    updateUI(skills) {
        // Atualizar contador de skills se elemento existir
        const skillCount = document.getElementById('skill-count');
        if (skillCount) {
            skillCount.textContent = skills.length;
        }

        // Atualizar lista de skills se elemento existir
        const skillsList = document.getElementById('skills-list');
        if (skillsList) {
            skillsList.innerHTML = this.renderSkillsList(skills);
        }

        // Atualizar cards de skills se elemento existir
        const skillsGrid = document.getElementById('skills-grid');
        if (skillsGrid) {
            skillsGrid.innerHTML = this.renderSkillsGrid(skills);
        }

        // Trigger evento customizado
        document.dispatchEvent(new CustomEvent('skillsLoaded', { 
            detail: { skills, count: skills.length } 
        }));
    }

    renderSkillsList(skills) {
        return skills.map(skill => `
            <div class="skill-item" data-skill-id="${skill.id}">
                <h3 class="skill-name">${skill.name}</h3>
                <div class="skill-info">
                    <span class="skill-type">${skill.type}</span>
                    <span class="skill-class">${skill.classe}</span>
                    <span class="skill-damage">${skill.damage} DMG</span>
                    <span class="skill-cost">${skill.anima_cost} ânima</span>
                </div>
                <p class="skill-description">${skill.description}</p>
                ${skill.cultural_authenticity ? `
                    <div class="cultural-info">
                        🏮 <em>${skill.cultural_authenticity}</em>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    renderSkillsGrid(skills) {
        return skills.map(skill => `
            <div class="skill-card ${skill.type}" data-skill-id="${skill.id}">
                <button class="skill-delete-btn" onclick="showDeleteModal('${skill.id}', '${skill.name.replace(/'/g, '\\\'')}')" title="Deletar Skill">
                    ⚔
                </button>
                <div class="skill-header">
                    <h3 class="skill-name">${skill.name}</h3>
                    <span class="skill-level">Nível ${skill.level}</span>
                </div>
                
                <div class="skill-stats">
                    <div class="stat">
                        <span class="label">Tipo:</span>
                        <span class="value">${skill.type}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Classe:</span>
                        <span class="value">${skill.classe}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Dano:</span>
                        <span class="value">${skill.damage}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Ânima:</span>
                        <span class="value">${skill.anima_cost}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Cooldown:</span>
                        <span class="value">${skill.cooldown}</span>
                    </div>
                </div>

                <p class="skill-description">${skill.description}</p>

                ${skill.effects && skill.effects.length > 0 ? `
                    <div class="skill-effects">
                        <strong>Efeitos:</strong>
                        ${skill.effects.map(effect => `<span class="effect">${effect}</span>`).join('')}
                    </div>
                ` : ''}

                ${skill.cultural_authenticity ? `
                    <div class="cultural-authenticity">
                        <strong>🏮 Autenticidade Cultural:</strong>
                        <p>${skill.cultural_authenticity}</p>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <h3>❌ Erro ao carregar skills</h3>
            <p>${message}</p>
            <button onclick="skillLoader.loadAllSkills()">🔄 Tentar novamente</button>
        `;
        
        const container = document.querySelector('.container') || document.body;
        container.insertBefore(errorDiv, container.firstChild);
    }

    // Métodos de filtro e busca
    filterByClass(className) {
        return Array.from(this.skills.values())
            .filter(skill => skill.classe === className);
    }

    filterByType(type) {
        return Array.from(this.skills.values())
            .filter(skill => skill.type === type);
    }

    searchByName(query) {
        const searchTerm = query.toLowerCase();
        return Array.from(this.skills.values())
            .filter(skill => 
                skill.name.toLowerCase().includes(searchTerm) ||
                skill.description.toLowerCase().includes(searchTerm)
            );
    }

    // Método para remover skill da lista local
    removeSkill(skillId) {
        this.skills.delete(skillId);
        console.log(`🗑️ Skill ${skillId} removida do cache local`);
        
        // Atualizar interface
        const remainingSkills = Array.from(this.skills.values());
        this.updateUI(remainingSkills);
        
        return remainingSkills;
    }

    getSkillById(skillId) {
        return this.skills.get(skillId);
    }
}

// Instância global
const skillLoader = new SkillLoader();

// Auto-carregar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        skillLoader.loadAllSkills();
    });
} else {
    skillLoader.loadAllSkills();
}

// Expor globalmente para compatibilidade
window.skillLoader = skillLoader;
window.loadedSkills = skillLoader.skills;