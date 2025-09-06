# Sistema de Efeitos - RPGStack v4.5

## Visão Geral

O Sistema de Efeitos do RPGStack utiliza uma arquitetura de **coeficientes dinâmicos** que permite criar habilidades complexas e variadas sem duplicação de código. Cada efeito é genérico e seus valores específicos são definidos por coeficientes únicos para cada skill.

## Arquitetura do Sistema

### Estrutura de uma Skill

```json
{
  "id": "SHIWX001LT",
  "name": "👁️ Qian Shou Qian Yan - Mil Mãos, Mil Olhos",
  "type": "combat",
  "damage": 15,
  "anima_cost": 25,
  "cooldown": 3,
  "duration": 2,
  
  // Array de efeitos genéricos
  "effects": [
    "multi_hit",
    "critical_boost", 
    "critical_immunity",
    "physical_reduction"
  ],
  
  // Coeficientes específicos para multi-hit
  "multi_hit": {
    "hits": 5,
    "damage_per_hit": 15,
    "independent_crits": true,
    "total_damage_potential": 75
  },
  
  // Coeficientes específicos para buffs
  "buffs": {
    "critical_rate": {
      "bonus": 20,
      "duration": 2,
      "description": "Aumenta chance crítica em 20%"
    },
    "critical_immunity": {
      "immunity": true,
      "duration": 2,
      "description": "Imune a danos críticos por 2 turnos"
    },
    "physical_reduction": {
      "reduction_percentage": 80,
      "duration": 2,
      "description": "Ataque físico reduzido em 80%"
    }
  }
}
```

## Tipos de Efeitos

### 1. Multi-Hit Effects

**Efeito:** `"multi_hit"`

**Configuração:**
```json
"multi_hit": {
  "hits": 7,                    // Número de ataques
  "damage_per_hit": 20,         // Dano por ataque individual
  "independent_crits": true,    // Cada hit pode ser crítico independentemente
  "total_damage_potential": 140 // Dano máximo possível (calculado automaticamente)
}
```

**Como funciona:**
- Skill executa múltiplos ataques em sequência
- Cada hit pode ter chance crítica independente se `independent_crits: true`
- Dano total = `hits × damage_per_hit` (+ bônus críticos)

### 2. Critical Boost Effects

**Efeito:** `"critical_boost"`

**Configuração:**
```json
"buffs": {
  "critical_rate": {
    "bonus": 25,                // +25% de chance crítica
    "duration": 3,              // Por 3 turnos
    "description": "Aumenta chance crítica em 25%"
  }
}
```

### 3. Physical Reduction Effects

**Efeito:** `"physical_reduction"`

**Configuração:**
```json
"buffs": {
  "physical_reduction": {
    "reduction_percentage": 60,  // Reduz ataque físico em 60%
    "duration": 2,               // Por 2 turnos
    "description": "Ataque físico reduzido em 60%"
  }
}
```

### 4. Immunity Effects

**Efeito:** `"critical_immunity"`

**Configuração:**
```json
"buffs": {
  "critical_immunity": {
    "immunity": true,
    "duration": 3,
    "description": "Imune a danos críticos por 3 turnos"
  }
}
```

### 5. Healing Effects

**Efeito:** `"healing"`

**Configuração v4.9:**
```json
{
  "damage": 120,  // Quantidade base de cura
  "effects": ["healing"],
  "buffs": {
    "healing": {
      "heal_amount": 120,           // Quantidade exata de cura
      "target_type": "area",        // Tipo: "single", "area", "self"
      "target_scope": "allies",     // Escopo: "allies", "self", "enemies"
      "description": "Cura 120 HP em todos os aliados"
    }
  }
}
```

**Opções de Alvo v4.9:**
- **target_type:**
  - `"self"` - Apenas o usuário
  - `"single"` - Um aliado específico
  - `"area"` - Múltiplos alvos
- **target_scope:**
  - `"self"` - Próprio usuário
  - `"allies"` - Aliados apenas
  - `"enemies"` - Inimigos apenas

### 6. Purification Effects

**Efeito:** `"purification"`

**Configuração v4.9:**
```json
{
  "effects": ["purification"],
  "buffs": {
    "purification": {
      "dispel_type": "all",          // Tipo: "all", "debuffs", "buffs", "specific"
      "target_type": "area",         // Tipo: "single", "area", "self"
      "target_scope": "allies",      // Escopo: "allies", "self", "enemies"
      "description": "Remove todos os debuffs de todos os aliados"
    }
  }
}
```

**Opções de Purificação v4.9:**
- **dispel_type:**
  - `"all"` - Remove todos os efeitos
  - `"debuffs"` - Apenas efeitos negativos
  - `"buffs"` - Apenas efeitos positivos
  - `"specific"` - Efeito específico (requer campo adicional)

### 7. Status Effects

**Efeitos disponíveis:**
- `"intangibility"` - Imune a ataques físicos
- `"spiritual_stun"` - Atordoamento espiritual  
- `"purification"` - Remove efeitos negativos
- `"affinity_immunity"` - Imunidade a afinidades específicas

## Processamento dos Efeitos

### Fluxo de Execução

1. **Carregamento da Skill** - Sistema carrega skill do banco de dados
2. **Validação** - Verifica custos de Ânima e cooldown
3. **Processamento de Efeitos** - `processSkillEffects()` analisa cada efeito
4. **Cálculo de Dano** - Combina dano base + dano dos efeitos
5. **Aplicação** - Aplica dano, cura, buffs e status effects
6. **Log** - Registra todos os resultados no battle log

### Método `processSkillEffects()`

```javascript
const effectsResult = await battleMechanics.processSkillEffects(skill, attacker, target, battleId);

// Retorna:
{
  damage: 82,           // Dano adicional dos efeitos
  healing: 0,           // Cura aplicada
  statusEffects: [],    // Status effects para aplicar
  buffs: [              // Buffs para aplicar
    {
      type: 'critical_rate',
      target: 'attacker',
      bonus: 20,
      duration: 2
    }
  ],
  specialActions: [     // Ações especiais executadas
    "Multi-Hit: 5 ataques por 15 cada"
  ]
}
```

## Exemplo Prático

### Criando uma Nova Skill com Multi-Hit de 8 Ataques

**Antes (sistema antigo - INCORRETO):**
```json
"effects": ["multi_hit_8x"]  // ❌ Precisaria criar novo efeito hardcoded
```

**Depois (sistema atual - CORRETO):**
```json
{
  "effects": ["multi_hit"],
  "multi_hit": {
    "hits": 8,
    "damage_per_hit": 12,
    "independent_crits": true
  }
}
```

### Criando Critical Boost Variável

**Para +15% crítico por 4 turnos:**
```json
{
  "effects": ["critical_boost"],
  "buffs": {
    "critical_rate": {
      "bonus": 15,
      "duration": 4,
      "description": "Aumenta chance crítica em 15%"
    }
  }
}
```

**Para +30% crítico por 1 turno:**
```json
{
  "effects": ["critical_boost"],
  "buffs": {
    "critical_rate": {
      "bonus": 30,
      "duration": 1,
      "description": "Aumenta chance crítica em 30%"
    }
  }
}
```

## Vantagens do Sistema

### ✅ Flexibilidade Total
- **Multi-hit**: Qualquer quantidade de hits (1, 3, 5, 7, 10, etc.)
- **Critical boost**: Qualquer porcentagem (5%, 15%, 25%, 50%, etc.)
- **Duração**: Qualquer número de turnos

### ✅ Zero Duplicação de Código
- Um efeito `"multi_hit"` serve para todas as variações
- Um efeito `"critical_boost"` serve para todos os bônus críticos
- Não precisa criar `"multi_hit_3x"`, `"multi_hit_7x"`, etc.

### ✅ Facilidade de Balanceamento
- Alterar coeficientes é simples e direto
- Cada skill pode ter valores únicos
- Fácil de experimentar e ajustar

### ✅ Extensibilidade
- Novos coeficientes podem ser adicionados facilmente
- Sistema preparado para futuros efeitos
- Interface de edição já suporta coeficientes dinâmicos

## Interface de Edição v4.9

O sistema inclui uma interface web para edição de skills em `/public/skills/skills.html` que permite:

- **Editar coeficientes em tempo real**
- **Visualizar efeitos aplicados**
- **Testar diferentes configurações**
- **Salvar alterações no banco de dados**
- **Preservação automática de dados** durante salvamento
- **✨ Novo v4.9:** Sistema de exclusão com modal de confirmação
- **✨ Novo v4.9:** Carregamento dinâmico via API `/api/skills`
- **✨ Novo v4.9:** Sincronização automática com perfis de personagem

### Coeficientes Editáveis na Interface:

#### 🎯 Multi-Hit
- **Número de Hits**: Controle deslizante (1-20)
- **Dano por Hit**: Input numérico
- **Críticos Independentes**: Toggle Sim/Não
- **Cálculo automático** do total damage potential

#### ⚡ Aumento Crítico
- **Bônus (%)**: Input numérico (0-200%)
- **Duração (turnos)**: Input numérico (0-10)
- **Descrição**: Gerada automaticamente

#### 🛡️ Imunidade Crítica
- **Duração (turnos)**: Input numérico (0-10)
- **Imunidade**: Toggle Ativa/Inativa
- **Status visual**: Indicador de ativação

#### ⬇️ Redução Física
- **Redução (%)**: Input numérico (0-100%)
- **Duração (turnos)**: Input numérico (0-10)
- **Cálculo visual**: Mostra divisor equivalente

#### ✨ Novo v4.9: 💚 Cura
- **Quantidade de Cura**: Input numérico (0-999)
- **Tipo de Alvo**: Select (self/single/area)
- **Escopo do Alvo**: Select (self/allies/enemies)
- **Descrição**: Gerada automaticamente

#### ✨ Novo v4.9: 🧹 Purificação
- **Tipo de Dispel**: Select (all/debuffs/buffs/specific)
- **Tipo de Alvo**: Select (self/single/area)
- **Escopo do Alvo**: Select (self/allies/enemies)
- **Descrição**: Gerada automaticamente

### Arquitetura da Interface

A interface utiliza **mapeamento dinâmico** entre elementos HTML e estrutura JSON:

```javascript
// Coleta automática de coeficientes
function collectEffectCoefficients() {
  const coefficients = {};
  
  // Multi-hit: inputs com prefixo 'multiHit_'
  if (name.startsWith('multiHit_')) {
    coefficients.multi_hit = {
      hits: parseInt(value),
      damage_per_hit: parseInt(value),
      independent_crits: value === 'true'
    };
  }
  
  // Buffs: inputs com padrão 'buff_{nome}_{propriedade}'
  else if (name.startsWith('buff_')) {
    const parts = name.split('_');
    const buffName = parts.slice(1, -1).join('_');
    const property = parts[parts.length - 1];
    
    if (!coefficients.buffs[buffName]) coefficients.buffs[buffName] = {};
    
    // ✨ v4.9: Mapeamento expandido para healing/purification
    if (property === 'healAmount') coefficients.buffs[buffName].heal_amount = parseInt(value);
    else if (property === 'targetType') coefficients.buffs[buffName].target_type = value;
    else if (property === 'targetScope') coefficients.buffs[buffName].target_scope = value;
    else if (property === 'dispelType') coefficients.buffs[buffName].dispel_type = value;
    else coefficients.buffs[buffName][property] = isNaN(value) ? value : parseInt(value);
  }
}
```

### Preservação de Dados

**Sistema de preservação automática** garante que coeficientes não sejam perdidos:

```javascript
// SkillService.js - Atualização segura
const updatedSkill = new Skill({
  // ... outros campos
  multi_hit: sanitizedData.multi_hit ?? existingSkill.multi_hit,
  buffs: sanitizedData.buffs ?? existingSkill.buffs,
  cultural_authenticity: sanitizedData.cultural_authenticity ?? existingSkill.cultural_authenticity
});
```

**Frontend - Preservação condicional:**
```javascript
// Apenas sobrescrever coeficientes se foram coletados novos valores
if (coefficients.multi_hit) {
  updatedSkill.multi_hit = coefficients.multi_hit;
}
if (coefficients.buffs && Object.keys(coefficients.buffs).length > 0) {
  updatedSkill.buffs = coefficients.buffs;
}
```

## Problemas Resolvidos e Soluções v4.9

### 🔧 Problema: Perda de Coeficientes Durante Salvamento

**Sintoma:** Após salvar uma skill no modal de edição, os coeficientes `multi_hit` e `buffs` eram perdidos, voltando para `null`.

**Causa Raiz:** 
1. **SkillService**: Não tratava campos `multi_hit`, `buffs`, `cultural_authenticity` durante updates
2. **Frontend**: Desalinhamento entre chaves esperadas e geradas na coleta de coeficientes

**Solução Implementada:**

#### Backend (SkillService.js):
```javascript
// Adicionado tratamento dos campos críticos
async _validateAndSanitizeUpdateData(updateData, existingSkill) {
  // ... outros campos
  
  // SISTEMA DE COEFICIENTES DINÂMICOS - Preservar multi_hit e buffs
  if (updateData.multi_hit !== undefined) {
    sanitized.multi_hit = updateData.multi_hit;
  }
  if (updateData.buffs !== undefined) {
    sanitized.buffs = updateData.buffs;
  }
  if (updateData.cultural_authenticity !== undefined) {
    sanitized.cultural_authenticity = updateData.cultural_authenticity;
  }
}
```

#### Frontend (skills.js):
```javascript
// Processamento corrigido para nomes compostos de buffs
else if (name.startsWith('buff_')) {
  const parts = name.split('_');
  
  // Reconstruir o nome completo do buff (critical_rate, critical_immunity, etc.)
  const buffName = parts.slice(1, -1).join('_'); 
  const property = parts[parts.length - 1];
  
  if (!coefficients.buffs[buffName]) coefficients.buffs[buffName] = {};
  coefficients.buffs[buffName][property] = value;
}
```

### 🔧 Problema: Mapeamento Incorreto de Chaves de Buffs

**Sintoma:** Interface mostrava coeficientes na primeira visualização, mas não após salvamento.

**Causa:** Função `collectEffectCoefficients()` não processava corretamente nomes como `critical_rate`, truncando para `critical`.

**Solução:** Algoritmo robusto de parsing que preserva underscores em nomes de buffs.

### 🔧 Problema: Inconsistência de Dados

**Sintoma:** Dados alternavam entre formatos após cada operação de salvamento.

**Solução:** 
1. **Validação rigorosa** de formatos esperados
2. **Restauração automática** de dados corrompidos
3. **Debug logging** extensivo para rastreamento

### 🔧 v4.9: Problema de API Retornando Buffs: null

**Sintoma:** Modal de edição mostrava "Esta skill não possui coeficientes editáveis" mesmo para skills com dados de `buffs`.

**Causa Raiz:** 
1. **Skill.js**: Faltavam getters para `buffs`, `multi_hit`, `battlefield_effects`, `affinity`
2. **JsonSkillRepository.js**: Não passava explicitamente os campos dinâmicos para o construtor da entidade

**Solução Implementada:**

#### Domain Entity (Skill.js):
```javascript
// Adicionados getters essenciais para API
get multi_hit() { return this._multi_hit; }
get buffs() { return this._buffs; }
get battlefield_effects() { return this._battlefield_effects; }
get affinity() { return this._affinity; }
```

#### Repository (JsonSkillRepository.js):
```javascript
// Carregamento explícito de campos dinâmicos
const skill = new Skill({
  ...skillData,
  multi_hit: skillData.multi_hit || null,
  buffs: skillData.buffs || null,
  battlefield_effects: skillData.battlefield_effects || null,
  affinity: skillData.affinity || '',
  cultural_authenticity: skillData.cultural_authenticity || ''
});
```

### 🔧 v4.9: Funcionalidade de Delete Ausente

**Sintoma:** Botão de deletar skills desapareceu após implementação do sistema de afinidades.

**Causa:** Função `createDeleteModal()` estava sendo chamada mas não existia no código.

**Solução Implementada:**

#### Frontend (skills.js):
```javascript
function createDeleteModal() {
  let modal = document.getElementById('deleteModal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'deleteModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2>🗑️ Confirmar Exclusão</h2>
        <p>Tem certeza que deseja excluir esta skill permanentemente?</p>
        <div class="modal-buttons">
          <button onclick="executeSkillDeletion()" class="delete-btn">🗑️ Excluir</button>
          <button onclick="closeDeleteModal()" class="cancel-btn">❌ Cancelar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  return modal;
}
```

### ✅ Status Atual v4.9: Sistema Totalmente Funcional

- ✅ **Preservação de dados** durante salvamento
- ✅ **Mapeamento correto** de coeficientes  
- ✅ **Interface responsiva** com feedback em tempo real
- ✅ **Validação robusta** de entrada
- ✅ **Debug logging** completo
- ✅ **✨ v4.9:** API retorna buffs corretamente via getters
- ✅ **✨ v4.9:** Sistema de delete funcional com modal de confirmação
- ✅ **✨ v4.9:** Coeficientes de cura e purificação implementados
- ✅ **✨ v4.9:** Sincronização automática entre skills e perfis de personagem

## Migração de Skills Antigas

Para migrar skills do sistema antigo, use o script:

```bash
node migrate-effects-to-coefficients.js
```

O script automaticamente:
1. **Faz backup** dos dados originais
2. **Converte efeitos hardcoded** para genéricos
3. **Cria coeficientes apropriados** baseados nos valores existentes
4. **Gera log detalhado** da migração

## Teste do Sistema

Execute os testes para verificar o funcionamento:

```bash
node test-effects-migration.js
```

Os testes verificam:
- ✅ Carregamento correto de skills
- ✅ Processamento de efeitos
- ✅ Cálculo de multi-hit
- ✅ Sistema de fallback
- ✅ Integridade do banco de dados

## Considerações de Performance

### Otimizações Implementadas:
- **Cache de skills** para evitar leituras repetidas do disco
- **Processamento assíncrono** para não bloquear o sistema
- **Validação eficiente** dos coeficientes
- **Log estruturado** para debugging

### Monitoramento:
- Sistema registra tempo de processamento
- Logs detalhados de aplicação de efeitos
- Métricas de performance no battle log

## Próximos Passos

### Funcionalidades Planejadas:
1. **Efeitos condicionais** baseados no HP atual
2. **Combos de efeitos** que se potencializam mutuamente  
3. **Efeitos temporais** que mudam ao longo do combate
4. **Sistema de resistências** específicas por personagem
5. **Efeitos de área** que afetam múltiplos alvos

### Melhorias na Interface:
1. **Preview em tempo real** dos efeitos
2. **Calculadora de dano** integrada
3. **Biblioteca de templates** de efeitos comuns
4. **Sistema de versionamento** para skills

## Debugging e Monitoramento

### Logs de Debug Disponíveis:

```javascript
// Frontend - Console do navegador
console.log('🔍 DEBUG: Skills por classe:', skillsByClass);
console.log('📦 DEBUG: Coeficientes coletados:', coefficients);
console.log('🚀 DEBUG: Payload sendo enviado:', updatedSkill);

// Backend - Console do servidor
this.logger.info('Updating skill', { 
  id: id.toString(), 
  updates: Object.keys(updateData) 
});
```

### Comandos de Teste:

```bash
# Testar API de Skills
node debug-skills-api.js

# Verificar integridade dos dados
node migrate-effects-to-coefficients.js --dry-run

# Backup de segurança
cp data/skills.json data/skills_backup_$(date +%Y%m%d_%H%M%S).json
```

### Estrutura de Arquivos:

```
rpgstack/
├── data/
│   ├── skills.json                              # Banco principal
│   ├── skills_backup_before_coefficients_migration.json  # Backup original
│   └── migration_log_effects_to_coefficients.json        # Log de migração
├── src/
│   ├── application/services/SkillService.js     # Backend service
│   └── domain/entities/Skill.js                 # Entidade de domínio
└── public/
    └── skills/
        ├── skills.html                          # Interface web
        ├── skills.js                            # Lógica frontend
        └── skills.css                           # Estilos
```

---

**Documentação atualizada em:** 06/09/2025 - 20:30 BRT  
**Versão do sistema:** RPGStack v4.9 - Sistema de Coeficientes Dinâmicos Expandido  
**Status:** ✅ Sistema totalmente funcional e testado  
**Recursos v4.9:**  
- ✅ **Coeficientes de Cura e Purificação**: Target selection completo  
- ✅ **Fix de API**: Getters em Skill.js + Repository corrigido  
- ✅ **Sistema de Delete**: Modal de confirmação funcional  
- ✅ **Sincronização**: Skills ↔ Character profiles dinâmica  
- ✅ **Interface Expandida**: Controles para todos os novos coeficientes  
**Autor:** Sistema de Efeitos com Coeficientes Dinâmicos  
**Última atualização:** v4.9 - Healing/Purification + Delete System