# Sistema de Dano - RPG por Turnos

## Visão Geral

Este documento define o sistema de cálculo de dano para um RPG competitivo por turnos com equipes de 3 personagens. O sistema suporta ataques físicos, mágicos e skills de área (AoE).

## Atributos do Sistema

### Atributos Ofensivos
- **Ataque**: Determina o poder dos ataques físicos
- **Ataque Especial**: Determina o poder dos ataques mágicos

### Atributos Defensivos
- **Defesa**: Reduz dano de ataques físicos
- **Espírito (Defesa Especial)**: Reduz dano de ataques mágicos

---

## Fórmulas de Dano

### Dano Físico (Single Target)
```
Dano = (Ataque × Multiplicador_Skill + Dano_Base_Skill) × (100 ÷ (100 + Defesa)) × Modificadores
```

### Dano Mágico (Single Target)
```
Dano = (Ataque_Especial × Multiplicador_Skill + Dano_Base_Skill) × (100 ÷ (100 + Espírito)) × Modificadores
```

### Dano de Área (AoE)
```
Dano_Individual = Dano_Base × Redutor_AoE × Modificadores_Individuais
```

---

## Componentes das Skills

### Multiplicadores por Tipo de Skill

| Tipo de Skill | Multiplicador | Exemplo |
|---------------|---------------|---------|
| Básica | 1.0 | Ataque Normal |
| Intermediária | 1.5 - 2.0 | Corte Duplo |
| Poderosa | 2.5 - 3.0 | Devastação |
| Suporte | 0.5 - 1.0 | Toque Curativo |

### Dano Base por Categoria

| Categoria | Dano Base | Descrição |
|-----------|-----------|-----------|
| Skills Básicas | 10 - 50 | Skills iniciais e comuns |
| Skills Intermediárias | 30 - 80 | Skills de meio jogo |
| Skills Avançadas | 60 - 120 | Skills de alto nível |
| Skills Especiais | 100+ | Skills únicas/definitivas |

---

## Sistema de Defesa

A fórmula `100 ÷ (100 + Defesa)` cria uma curva de redução diminuente:

| Pontos de Defesa | Redução de Dano | Dano Recebido |
|------------------|-----------------|---------------|
| 0 | 0% | 100% |
| 50 | 33% | 67% |
| 100 | 50% | 50% |
| 150 | 60% | 40% |
| 200 | 67% | 33% |

---

## Sistema de Área (AoE)

### Tipos de Skills AoE

#### 1. Área Fixa
Atinge todos os alvos com dano reduzido uniforme:
- **Redutor**: 0.6x por alvo
- **Exemplo**: Explosão de Fogo

#### 2. Área com Foco
Alvo principal + dano splash nos demais:
- **Alvo Principal**: 1.0x do dano
- **Alvos Secundários**: 0.4x do dano
- **Exemplo**: Meteorito

#### 3. Área Decrescente
Dano diminui com a distância do epicentro:
- **Centro**: 1.0x do dano
- **Adjacentes**: 0.7x do dano
- **Bordas**: 0.4x do dano
- **Exemplo**: Onda de Choque

### Redutores de Área por Número de Alvos

| Número de Alvos | Redutor | Eficiência Total |
|-----------------|---------|------------------|
| 1 (Single) | 1.0x | 100% |
| 2 alvos | 0.8x | 160% |
| 3 alvos | 0.7x | 210% |
| Área total | 0.6x | 180% |

---

## Modificadores Opcionais

### Vantagem de Tipo
| Relação | Multiplicador | Exemplo |
|---------|---------------|---------|
| Super Efetivo | 2.0x | Fogo vs Gelo |
| Efetivo | 1.5x | Água vs Fogo |
| Normal | 1.0x | Neutro |
| Resistente | 0.5x | Fogo vs Água |
| Imune | 0.0x | Físico vs Fantasma |

### Outros Modificadores
- **Acerto Crítico**: 1.5x - 2.0x
- **Buffs de Ataque**: +20% - +50%
- **Debuffs de Defesa**: -20% - -50%
- **Posicionamento**: ±10% - ±20%
- **Estado do Personagem**: Varia conforme condição

---

## Balanceamento de Atributos

### Ranges Sugeridos (Nível 1-100)

| Atributo | Mínimo | Máximo | Observações |
|----------|--------|--------|-------------|
| Ataque | 50 | 300 | Personagens físicos |
| Ataque Especial | 50 | 300 | Personagens mágicos |
| Defesa | 30 | 200 | Tanks chegam ao máximo |
| Espírito | 30 | 200 | Resistência mágica |
| HP | 200 | 800 | Varia por classe |

### Arquétipos de Personagens

#### Tank
- **HP**: 600-800
- **Defesa/Espírito**: 150-200
- **Ataque/At.Especial**: 50-120
- **Papel**: Absorver dano e proteger aliados

#### DPS Físico
- **HP**: 300-500
- **Ataque**: 200-300
- **Defesa**: 50-100
- **Papel**: Alto dano físico single-target

#### Mago/DPS Mágico
- **HP**: 200-400
- **Ataque Especial**: 200-300
- **Espírito**: 80-150
- **Papel**: Dano mágico e AoE

#### Suporte
- **HP**: 300-500
- **Atributos**: Balanceados (100-150)
- **Papel**: Cura, buffs e utilidades

---

## Custos e Limitações

### Custos de MP (Mana Points)

| Tipo de Skill | Custo MP | Cooldown |
|---------------|----------|----------|
| Ataque Básico | 0 | 0 turnos |
| Skill Single | 10-20 | 0-2 turnos |
| Skill 2 Alvos | 15-25 | 2-3 turnos |
| Skill AoE | 25-40 | 3-4 turnos |
| Skill Especial | 35-50 | 4-6 turnos |

### Sistema de Cooldown
- **0 turnos**: Pode ser usada todo turno
- **2 turnos**: Deve esperar 2 turnos após uso
- **4+ turnos**: Skills poderosas com grande limitação

---

## Exemplos Práticos

### Exemplo 1: Ataque Single Target

**Guerreiro** (Ataque: 180) usa "Corte Feroz"
- Multiplicador: 1.8
- Dano Base: 25
- Alvo: Mago inimigo (Defesa: 60)

**Cálculo:**
```
Dano = (180 × 1.8 + 25) × (100 ÷ (100 + 60))
Dano = (324 + 25) × (100 ÷ 160)
Dano = 349 × 0.625
Dano Final = 218
```

### Exemplo 2: Skill AoE

**Mago** (Ataque Especial: 220) usa "Tempestade de Gelo"
- Multiplicador: 2.2
- Dano Base: 45
- Tipo: Área fixa (todos os inimigos)
- Redutor AoE: 0.6x

**Time inimigo:**
- Tank (Espírito: 140)
- DPS (Espírito: 70)
- Suporte (Espírito: 100)

**Cálculos:**
```
Dano Base = (220 × 2.2 + 45) = 529

Tank: 529 × (100÷240) × 0.6 = 529 × 0.42 × 0.6 = 133 dano
DPS: 529 × (100÷170) × 0.6 = 529 × 0.59 × 0.6 = 187 dano
Suporte: 529 × (100÷200) × 0.6 = 529 × 0.5 × 0.6 = 159 dano
```

---

## Considerações de Design

### Escalabilidade
- As fórmulas devem funcionar bem em todos os níveis
- Evitar que personagens de alto nível façam dano desproporcional
- Manter relevância de todas as classes durante o jogo

### Contramedidas
- **Caps de dano**: Limitar dano máximo (ex: 999 por hit)
- **Dano mínimo**: Sempre causar pelo menos 1-5% do dano calculado
- **Resistências**: Alguns inimigos podem ter resistências especiais

### Teste e Balanceamento
1. **Testes unitários**: Cada fórmula isoladamente
2. **Testes de combate**: Simulações de batalhas completas
3. **Análise estatística**: Coleta de dados de partidas reais
4. **Ajustes iterativos**: Modificações baseadas em feedback

---

## Notas de Implementação

### Ordem de Aplicação
1. Calcular dano base da skill
2. Aplicar modificadores de atributo
3. Aplicar redução por defesa
4. Aplicar redutor AoE (se aplicável)
5. Aplicar modificadores finais (crítico, tipo, etc.)
6. Aplicar limites mínimo/máximo
7. Arredondar resultado final

### Considerações Técnicas
- Usar aritmética de ponto flutuante para cálculos
- Arredondar apenas no resultado final
- Implementar logs detalhados para debug
- Permitir configuração fácil de constantes de balanceamento

---

## Glossário

- **AoE (Area of Effect)**: Habilidades que afetam múltiplos alvos
- **Crítico**: Ataque que causa dano amplificado baseado em chance
- **DPS**: Damage Per Second, personagem focado em causar dano
- **Multiplicador**: Fator que amplifica o dano base de uma skill
- **Redutor**: Fator que diminui o dano (usado em AoE para balanceamento)
- **Single Target**: Habilidades que afetam apenas um alvo
- **Splash**: Dano secundário que atinge alvos próximos ao principal
- **Taxa Crítica**: Percentual de chance de causar dano crítico (0-100%)