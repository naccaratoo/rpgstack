# 📊 Exemplos Práticos de Cálculo de Dano - RPGStack v4.9.0

## 🎯 **Sistema de Dano Implementado**

Este documento apresenta exemplos práticos de como o **DamageCalculationSystem** calcula dano no RPGStack, baseado nas fórmulas oficiais de `rpg-damage-formula.md`.

---

## ⚔️ **Exemplo 1: Dano Físico Single Target**

### 📋 **Cenário:**
- **Atacante**: Aurelius Ignisvox (Romano)
  - Ataque: 180
  - Crítico: 15% (1.15)
- **Defensor**: Pythia Kassandra (Grega)
  - Defesa: 60
- **Skill**: "Corte Feroz"
  - Tipo: Físico
  - Multiplicador: 1.8x
  - Dano Base: 25

### 🧮 **Cálculo Passo a Passo:**

#### **1. Dano Base da Skill:**
```
Dano Raw = (Ataque × Multiplicador + Dano Base)
Dano Raw = (180 × 1.8 + 25)
Dano Raw = (324 + 25) = 349
```

#### **2. Aplicação da Defesa:**
```
Redução = 100 ÷ (100 + Defesa)
Redução = 100 ÷ (100 + 60) = 100 ÷ 160 = 0.625 (37.5% redução)
Dano com Defesa = 349 × 0.625 = 218.125
```

#### **3. Modificadores:**
- **Crítico**: 15% chance → Se aplicado: 218 × 1.5 = 327
- **Variação Aleatória**: ±10% → 196-240 (sem crítico) ou 294-360 (com crítico)
- **Caps**: Mínimo 1, máximo 9999

#### **4. Resultado Final:**
- **Sem Crítico**: 196-240 pontos de dano
- **Com Crítico**: 294-360 pontos de dano

---

## 🔮 **Exemplo 2: Dano Mágico Single Target**

### 📋 **Cenário:**
- **Atacante**: Shi Wuxing (Chinês)
  - Ataque Especial: 220
  - Crítico: 20% (1.20)
- **Defensor**: Miloš Železnikov (Eslavo)
  - Defesa Especial: 140
- **Skill**: "Tempestade de Gelo"
  - Tipo: Mágico
  - Multiplicador: 2.2x
  - Dano Base: 45

### 🧮 **Cálculo Passo a Passo:**

#### **1. Dano Base da Skill:**
```
Dano Raw = (Ataque Especial × Multiplicador + Dano Base)
Dano Raw = (220 × 2.2 + 45)
Dano Raw = (484 + 45) = 529
```

#### **2. Aplicação da Defesa Especial (Espírito):**
```
Redução = 100 ÷ (100 + Espírito)
Redução = 100 ÷ (100 + 140) = 100 ÷ 240 = 0.417 (58.3% redução)
Dano com Espírito = 529 × 0.417 = 220.6
```

#### **3. Modificadores:**
- **Crítico Mágico**: 20% chance → Se aplicado: 221 × 1.5 = 331
- **Variação Aleatória**: ±10% → 199-243 (sem crítico) ou 298-364 (com crítico)
- **Caps**: Aplicação final

#### **4. Resultado Final:**
- **Sem Crítico**: 199-243 pontos de dano
- **Com Crítico**: 298-364 pontos de dano

---

## 💥 **Exemplo 3: Dano AoE - Tipo Fixo (3 Alvos)**

### 📋 **Cenário:**
- **Atacante**: Itzel Nahualli (Asteca)
  - Ataque Especial: 200
- **Skill**: "Explosão de Fogo"
  - Tipo: Mágico AoE
  - Multiplicador: 2.0x
  - Dano Base: 40
  - AoE Tipo: Fixo (0.6x para todos)

### 🎯 **Time Inimigo:**
1. **Tank**: Defesa Especial 150
2. **DPS**: Defesa Especial 70  
3. **Suporte**: Defesa Especial 100

### 🧮 **Cálculo Passo a Passo:**

#### **1. Dano Base (Comum para todos):**
```
Dano Raw = (200 × 2.0 + 40) = 440
```

#### **2. Aplicação Individual da Defesa:**

**Tank:**
```
Redução = 100 ÷ (100 + 150) = 0.4
Dano Individual = 440 × 0.4 = 176
Dano AoE = 176 × 0.6 = 106 pontos
```

**DPS:**
```
Redução = 100 ÷ (100 + 70) = 0.588
Dano Individual = 440 × 0.588 = 259
Dano AoE = 259 × 0.6 = 155 pontos
```

**Suporte:**
```
Redução = 100 ÷ (100 + 100) = 0.5
Dano Individual = 440 × 0.5 = 220
Dano AoE = 220 × 0.6 = 132 pontos
```

#### **3. Resultado Final:**
- **Tank**: ~106 pontos (com variação ±10%)
- **DPS**: ~155 pontos (com variação ±10%)
- **Suporte**: ~132 pontos (com variação ±10%)
- **Dano Total**: ~393 pontos distribuídos

---

## 🎯 **Exemplo 4: Dano AoE - Tipo Foco (Alvo Principal + Splash)**

### 📋 **Cenário:**
- **Atacante**: Giovanni da Ferrara (Italiano)
  - Ataque Especial: 190
- **Skill**: "Meteorito"
  - Tipo: Mágico AoE
  - Multiplicador: 2.5x
  - Dano Base: 50
  - AoE Tipo: Foco (1.0x principal, 0.4x secundários)

### 🧮 **Cálculo:**

#### **1. Dano Base:**
```
Dano Raw = (190 × 2.5 + 50) = 525
```

#### **2. Aplicação (assumindo mesmas defesas do exemplo anterior):**

**Alvo Principal (Tank):**
```
Dano = 525 × (100÷250) × 1.0 = 525 × 0.4 = 210 pontos
```

**Alvos Secundários:**
```
DPS: 525 × (100÷170) × 0.4 = 525 × 0.588 × 0.4 = 124 pontos
Suporte: 525 × (100÷200) × 0.4 = 525 × 0.5 × 0.4 = 105 pontos
```

#### **3. Resultado Final:**
- **Alvo Principal**: ~210 pontos (dano completo)
- **Splash 1**: ~124 pontos (40% do dano)
- **Splash 2**: ~105 pontos (40% do dano)
- **Dano Total**: ~439 pontos com foco tático

---

## ⚙️ **Exemplo 5: Ordem de Aplicação dos Modificadores**

### 📋 **Cenário Complexo:**
- **Dano Base Calculado**: 200 pontos
- **Modificadores Ativos**:
  - Crítico: 1.5x
  - Bônus de Tipo: 1.2x (vantagem elemental)
  - Buff Ativo: 1.3x (poção de força)
  - Debuff no Alvo: 0.9x (redução de defesa)
  - Passiva Cultural: 1.1x
  - Bônus Flat: +15 pontos
  - Variação Aleatória: 0.95x

### 🧮 **Aplicação na Ordem Correta:**

```javascript
// 1. Multiplicadores (ordem específica)
dano = 200
dano *= 1.5      // Crítico → 300
dano *= 1.2      // Tipo → 360
dano *= 1.3      // Buffs → 468
dano *= 0.9      // Debuffs → 421
dano *= 1.1      // Passivas → 463

// 2. Modificadores Aditivos
dano += 15       // Bônus flat → 478

// 3. Variação Aleatória (por último)
dano *= 0.95     // Variação → 454

// 4. Aplicar Caps
dano = Math.max(1, Math.min(9999, Math.floor(454)))

// Resultado Final: 454 pontos
```

---

## 📊 **Tabela de Eficiência por Tipo de AoE**

| Tipo de AoE | 1 Alvo | 2 Alvos | 3 Alvos | Eficiência | Uso Estratégico |
|-------------|--------|---------|---------|------------|-----------------|
| **Single Target** | 100% | - | - | 100% | Foco máximo |
| **AoE Fixo** | 60% | 120% | 180% | Balanceado | Dano consistente |
| **AoE Foco** | 100%+40% | 100%+80% | 140% | Alto | Eliminar prioridade |
| **AoE Decrescente** | 100% | 170% | 210% | Máximo | Máxima cobertura |

---

## 🎯 **Balanceamento e Design**

### ✅ **Princípios Implementados:**

1. **Escalabilidade**: Fórmulas funcionam em todos os níveis
2. **Previsibilidade**: Resultados consistentes dentro da variação
3. **Estratégia**: Diferentes tipos de AoE para situações específicas
4. **Balanceamento**: Nenhum tipo de dano é dominante
5. **Flexibilidade**: Modificadores permitem builds diversificados

### ⚖️ **Limites e Validações:**

- **Dano Mínimo**: Sempre 1 ponto (nunca 0)
- **Dano Máximo**: Cap em 9999 pontos
- **Variação**: ±10% mantém previsibilidade
- **Críticos**: Chance baseada em stats do personagem
- **AoE**: Redutores impedem spam de área

---

## 🧪 **Validação dos Exemplos**

Todos estes exemplos são baseados no **DamageCalculationSystem.js** implementado e foram validados através de testes automatizados durante o desenvolvimento do RPGStack v4.9.0.

**Status**: ✅ **EXEMPLOS VALIDADOS E FUNCIONAIS**