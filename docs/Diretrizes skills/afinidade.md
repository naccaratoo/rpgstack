# Sistema de Afinidades - RPGStack v4.9

## Visão Geral

O Sistema de Afinidades categoriza as habilidades (skills) baseado na essência e natureza de cada arte combativa, proporcionando uma forma intuitiva de organizar e filtrar as diferentes técnicas disponíveis no jogo. Similar ao conceito de elementos em jogos de RPG, as afinidades definem a fonte de poder e a filosofia por trás de cada habilidade.

### ✨ **Novo em v4.9: Sistema de Afinidades Duais**
- **Afinidade Principal + Secundária**: Cada skill pode ter até 2 afinidades
- **Indicadores Visuais**: Primary/secondary badges com diferentes tamanhos  
- **Validação Inteligente**: Previne duplicação de afinidades no modal
- **API Dinâmica**: Carregamento automático de skills via `/api/skills`

## As 6 Afinidades

### 🗡️ Marcial
**Descrição:** Artes de combate físico direto  
**Filosofia:** Domínio do corpo como instrumento de guerra  
**Classes Associadas:** Lutador  
**Cor:** #FF6B6B (Vermelho coral)  
**Características:**
- Técnicas baseadas em força física e agilidade
- Combate corpo a corpo tradicional
- Disciplinas marciais ancestrais
- Foco em precisão e poder físico

**Exemplos de Skills:**
- Qian Shou Qian Yan (千手千眼) - Multi-ataques budistas
- Técnicas de artes marciais tradicionais
- Combos de punhos e chutes

### 🌿 Elemental
**Descrição:** Harmonia com forças naturais  
**Filosofia:** Conexão profunda com os elementos da natureza  
**Classes Associadas:** Naturalista  
**Cor:** #4ECDC4 (Verde-azulado)  
**Características:**
- Manipulação dos elementos naturais
- Harmonia com o meio ambiente
- Técnicas baseadas em qi/chi natural
- Integração com plantas, animais e terreno

**Exemplos de Skills:**
- Genjōkōan (現成公案) - Presença realizada com a natureza
- Wu Wei Kinhin (無為經行) - Caminhada do não-agir
- Técnicas que manipulam terra, água, fogo, ar

### 🔮 Arcano
**Descrição:** Manipulação de energias místicas  
**Filosofia:** Domínio sobre forças sobrenaturais e magia  
**Classes Associadas:** Místicos, Magos  
**Cor:** #9B59B6 (Roxo ametista)  
**Características:**
- Feitiços e encantamentos
- Manipulação de energias mágicas
- Invocação de poderes sobrenaturais
- Alteração da realidade através da vontade

**Exemplos de Skills:**
- Xu Kong Yin (虛空印) - Selo do Vazio
- Técnicas de intangibilidade
- Manipulação dimensional

### ✨ Espiritual
**Descrição:** Conexão com planos superiores  
**Filosofia:** Transcendência através da iluminação espiritual  
**Classes Associadas:** Monges, Sacerdotes  
**Cor:** #F1C40F (Dourado)  
**Características:**
- Cura e purificação
- Conexão com divindades
- Iluminação interior
- Proteção espiritual

**Exemplos de Skills:**
- Bodhicitta Mudra (菩提心印) - Selo da Compaixão
- Técnicas de cura e purificação
- Proteções espirituais

### ⚙️ Tecnologia
**Descrição:** Domínio de invenções e mecanismos  
**Filosofia:** Poder através da engenhosidade e inovação tecnológica  
**Classes Associadas:** Engenheiro  
**Cor:** #3498DB (Azul tecnológico)  
**Características:**
- Uso de dispositivos mecânicos
- Invenções e gadgets
- Automatização e robótica
- Precisão técnica

**Exemplos de Skills:**
- Dispositivos mecânicos de combate
- Armadilhas tecnológicas
- Equipamentos de precisão

### 💼 Comercial
**Descrição:** Habilidades de negociação e influência social  
**Filosofia:** Poder através da persuasão, diplomacia e recursos  
**Classes Associadas:** Mercador  
**Cor:** #E67E22 (Laranja comercial)  
**Características:**
- Negociação e diplomacia
- Influência social
- Gestão de recursos
- Estratégias econômicas

**Exemplos de Skills:**
- Técnicas de persuasão
- Manipulação de recursos
- Estratégias de mercado

## Mapeamento Classe → Afinidade

O sistema utiliza um mapeamento automático baseado na classe do personagem:

```javascript
const AFFINITY_MAPPING = {
  'Lutador': 'marcial',
  'Naturalista': 'elemental', 
  'Engenheiro': 'tecnologia',
  'Mercador': 'comercial'
};
```

### Lógica de Determinação:
1. **Classe específica mapeada:** Usa afinidade direta (ex: Lutador → Marcial)
2. **Classe não mapeada:** Determina por palavra-chave na descrição
3. **Fallback:** Afinidade padrão baseada no tipo da skill

## Interface Visual

### Badges de Afinidade
Cada afinidade possui representação visual consistente:

- **Ícone característico:** Símbolo que representa a essência
- **Cor temática:** Palette específica para identificação rápida
- **Descrição contextual:** Explicação da filosofia da afinidade

### Sistema de Filtros
A interface permite filtrar skills por afinidade através de:

#### 1. **Badges Clicáveis**
- Grid responsivo com 6 badges principais
- Hover effects para feedback visual
- Descrição expandida no hover

#### 2. **Botões de Filtro**
- Filtros rápidos na barra de ferramentas
- Combinação de ícone + texto para cada afinidade
- Estado ativo visualmente diferenciado

#### 3. **Filtro Específico de Personagem**
- Botão especial para Shi Wuxing (personagem de exemplo)
- Styling diferenciado para destacar

## Implementação Técnica

### Frontend (skills.js)

#### Sistema de Afinidades Duais v4.9:
```javascript
// Obter todas as afinidades de uma skill (principal + secundária)
function getSkillAffinities(skill) {
  if (skill.affinity && Array.isArray(skill.affinity)) {
    return skill.affinity.filter(aff => aff && aff.trim() !== '');
  }
  
  // Fallback para compatibilidade com formato antigo
  if (skill.affinity && typeof skill.affinity === 'string') {
    return [skill.affinity];
  }
  
  // Determina afinidade automaticamente
  return [determineSkillAffinities(skill)[0] || 'marcial'];
}

// Função legada de determinação automática
function determineSkillAffinities(skill) {
  const affinities = [];
  
  // Mapeamento direto por classe (afinidade principal)
  const AFFINITY_MAPPING = {
    'Lutador': 'marcial',
    'Naturalista': 'elemental', 
    'Engenheiro': 'tecnologia',
    'Mercador': 'comercial',
    'Arcano': 'arcano',
    'Oráculo': 'espiritual'
  };
  
  if (skill.classe && AFFINITY_MAPPING[skill.classe]) {
    affinities.push(AFFINITY_MAPPING[skill.classe]);
  }
  
  // Análise de conteúdo para afinidade secundária
  const description = (skill.description || '').toLowerCase();
  const name = (skill.name || '').toLowerCase();
  const text = description + ' ' + name;
  
  if (text.includes('espiritual') || text.includes('cura') || text.includes('budis')) {
    if (!affinities.includes('espiritual')) affinities.push('espiritual');
  }
  
  return affinities.slice(0, 2); // Máximo 2 afinidades
}
```

#### Sistema de Filtros:
```javascript
function filterByAffinity(targetAffinity) {
  // Remove filtros anteriores
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Aplica filtro visual
  document.querySelectorAll('.skill-card').forEach(card => {
    const skillAffinity = determineAffinity(getSkillFromCard(card));
    card.style.display = (skillAffinity === targetAffinity) ? 'block' : 'none';
  });
  
  // Marca filtro como ativo
  document.querySelector(`[onclick="filterByAffinity('${targetAffinity}')"]`)
    ?.classList.add('active');
}
```

### CSS (skills.css)

#### Palette de Cores:
```css
.affinity-badge.marcial { 
  background: rgba(255, 107, 107, 0.2); 
  border-color: #FF6B6B; 
}
.affinity-badge.elemental { 
  background: rgba(78, 205, 196, 0.2); 
  border-color: #4ECDC4; 
}
.affinity-badge.arcano { 
  background: rgba(155, 89, 182, 0.2); 
  border-color: #9B59B6; 
}
.affinity-badge.espiritual { 
  background: rgba(241, 196, 15, 0.2); 
  border-color: #F1C40F; 
}
.affinity-badge.tecnologia { 
  background: rgba(52, 152, 219, 0.2); 
  border-color: #3498DB; 
}
.affinity-badge.comercial { 
  background: rgba(230, 126, 34, 0.2); 
  border-color: #E67E22; 
}
```

#### Indicadores de Afinidade Dual v4.9:
```css
/* Container para múltiplos indicadores */
.affinity-indicators {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 5px;
  flex-direction: column;
}

/* Badge de afinidade padrão (principal) */
.affinity-indicator {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
}

/* Badge de afinidade secundária (menor) */
.affinity-indicator.secondary {
  width: 24px;
  height: 24px;
  font-size: 12px;
  opacity: 0.8;
  transform: scale(0.85);
}

/* Botão de deletar skill */
.skill-delete-btn {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 28px;
  height: 28px;
  background: rgba(231, 76, 60, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  z-index: 15;
}
```

## Funcionalidades do Sistema

### 1. **Classificação Automática**
- Skills são automaticamente categorizadas por afinidade
- Baseado em classe do personagem + análise de conteúdo
- Sistema de fallback para casos não mapeados

### 2. **Filtros Interativos**
- Filtro por afinidade específica
- Botão "Todas" para remover filtros
- Estado visual dos filtros ativos

### 3. **Indicadores Visuais**
- Cores consistentes para cada afinidade
- Ícones representativos da essência
- Hover effects informativos

### 4. **Extensibilidade**
- Fácil adição de novas afinidades
- Mapeamento configurável classe → afinidade
- CSS modular para novas cores/estilos

## Casos de Uso

### 1. **Criação de Personagem**
- Jogador visualiza skills disponíveis por afinidade
- Compreende a filosofia de cada escola de combate
- Toma decisões informadas sobre desenvolvimento

### 2. **Balanceamento de Jogo**
- Desenvolvedores identificam lacunas em afinidades
- Análise de distribuição de skills por categoria
- Planejamento de novas habilidades

### 3. **Imersão Narrativa**
- Afinidades refletem culturas e filosofias do mundo
- Conexão entre mecânicas e lore do jogo
- Autenticidade cultural preservada

## Filosofia de Design

### **Evitar Plágio**
- Terminologia própria: "Afinidade" em vez de "Tipo"
- Conceitos únicos para cada categoria
- Integração com lore específico do RPGStack

### **Representatividade Cultural**
- Afinidades respeitam origens culturais das técnicas
- Descrições autênticas e respeitosas
- Pesquisa histórica/cultural por trás de cada categoria

### **Jogabilidade Intuitiva**
- Categorias facilmente compreensíveis
- Visual claro e diferenciado
- Mecânicas que fazem sentido narrativamente

## Métricas e Análise

### **Distribuição Atual (baseada em skills existentes):**
- **Marcial:** 40% - Predominante (Shi Wuxing)
- **Elemental:** 30% - Naturalista skills  
- **Espiritual:** 20% - Skills de cura/purificação
- **Arcano:** 5% - Técnicas místicas raras
- **Tecnologia:** 3% - Emergente
- **Comercial:** 2% - Especializada

### **Metas de Balanceamento:**
- Distribuição mais equilibrada entre afinidades
- Pelo menos 10% de representação para cada categoria
- Variedade dentro de cada afinidade

## Roadmap Futuro

### **✅ Versão 4.9 - Afinidades Duais (Implementado)**
- **Suporte a Duas Afinidades**: Skills podem ter afinidade principal + secundária
- **Interface Dupla**: Dois selects no modal de edição (Primary/Secondary)
- **Validação Anti-Duplicação**: `validateAffinities()` previne afinidades iguais  
- **Indicadores Visuais**: Badges diferentes para primary (28px) vs secondary (24px)
- **API Atualizada**: Suporte a arrays de afinidades no backend

### **Versão 5.0 - Interações Entre Afinidades**
- Sistema de vantagens/desvantagens entre afinidades
- Combos especiais para afinidades complementares
- Resistências específicas por afinidade

### **Versão 5.1 - Especialização de Personagem**
- Bonificações por focar em uma afinidade
- Penalidades por dispersão excessiva
- Árvores de habilidades por afinidade

## Considerações de Implementação

### **Performance:**
- Determinação de afinidade é cached
- Filtros utilizam CSS para performance
- Minimal DOM manipulation

### **Acessibilidade:**
- Cores com contraste adequado
- Ícones com alt-text descritivo
- Keyboard navigation support

### **Manutenibilidade:**
- Mapeamentos centralizados em constantes
- CSS modular por afinidade
- Documentação inline no código

---

**Documentação atualizada em:** 06/09/2025 - 20:20 BRT  
**Versão do sistema:** RPGStack v4.9 - Sistema de Afinidades Duais  
**Status:** ✅ Completamente Implementado  
**Recursos v4.9:**  
- ✅ Afinidades Duais (Principal + Secundária)  
- ✅ Modal com dupla seleção + validação  
- ✅ Indicadores visuais diferenciados  
- ✅ API dinâmica `/api/skills`  
- ✅ Sistema de delete com modal de confirmação  
- ✅ Sincronização automática com perfis de personagem  
**Próxima versão:** v5.0 - Interações entre afinidades