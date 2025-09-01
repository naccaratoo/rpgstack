## 🗂️ Atualizações de Módulos

### 🔮 Módulo Skills-Database
- Alterar o nome do sistema de **elementos** para **classes**.
- Por enquanto, o sistema de classes terá apenas **três classes registradas**:
  - **Lutador**
  - **Armamentista**
  - **Arcano**
- Alterar o nome da mecânica **"mana"** para **"Ânima"**.

### 👤 Módulo Character-Database
- Acrescentar a opção de **escolher a classe do personagem** na criação.
- Acrescentar a opção de **alterar a classe do personagem** na edição de personagens já criados.
- Acrescentar a opção de **escolher a quantidade de Ânima do personagem**.
- O valor da **Ânima inicia em 100**.
- Acrescentar a opção de **alterar a quantidade de Ânima** em personagens já criados.

### ⚔️ Módulo Battle-Mechanics (Novo)
- **Sistema de vantagem de classes**
- **Mecânica de defesa**
- **Mecânica de meditação**
- **Sistema de atributo crítico**

---

# 📜 Documento de Contexto - Sistema de Classes e Mecânicas de Batalha

## ⚔️ Sistema de Vantagem de Classes

Durante a evolução do sistema de batalha do RPGStack, foi solicitada a inclusão de um **sistema de vantagem de classes**.

### Regras de Vantagem
- **Lutador** tem vantagem sobre **Armamentista**
- **Armamentista** tem vantagem sobre **Arcano**
- **Arcano** tem vantagem sobre **Lutador**

### Efeitos da Vantagem
- Personagens que possuem vantagem de classe causam **+10% de dano**.
- Personagens que possuem vantagem de classe recebem **-10% de dano**.

### Implementação Técnica
- Criada uma tabela de vantagens (`classAdvantages`) em JavaScript.
- Funções auxiliares:
  - `hasAdvantage(attackerClass, defenderClass)`
  - `applyClassModifiers(damage, attackerClass, defenderClass)`
- O modificador é aplicado **após o cálculo de dano base**.

---

## 🛡️ Sistema de Defesa

### Mecânica de Defesa
- O botão **defend-btn** (módulo de batalha) irá chamar o evento defesa.
- Ao utilizar defesa, o personagem fica **imune a qualquer dano que não seja um crítico**.

### Implementação Técnica
- Estado de defesa deve ser rastreado por turno.
- Verificação de estado defensivo antes do cálculo de dano.
- Apenas ataques críticos penetram a defesa.

---

## 🧘 Sistema de Meditação

### Mecânica de Meditação
- Ao meditar (**meditate-btn**), o personagem recupera:
  - **10% de seu Ânima máximo**
  - **5% de sua vida máxima**

### Implementação Técnica
- Função de recuperação baseada nos valores máximos dos atributos.
- Limitação por valores máximos (não pode exceder HP/Ânima máximos).

---

## 🧮 Fórmula de Dano Base

O cálculo de dano foi revisado para separar o **dano base** dos **modificadores de vantagem**.

### Fórmulas
- **Ataque Normal**:
  ```js
  (ATK - (DEF * 0.7)) * variacao
  ```

- **Habilidade (com skill)**:
  ```js
  ((ATK * (skill.power / 10)) - (DEF * 0.5)) * variacao
  ```

📌 **Nota**:  
- `skill.power` é o atributo de poder da habilidade (exemplo: Raio Congelante = 40).  
- O poder da skill é convertido em coeficiente (`power / 10`).  
- Exemplo: `Raio Congelante (power = 40)` → coeficiente = 4.0  
  Fórmula: `(ATK * 4.0 - DEF * 0.5) * variacao`  

Onde `variacao` originalmente era `random(0.8 ~ 1.2)`.

---

## 🎯 Alteração: Substituição de Random por Atributo Crítico

Foi definido que a aleatoriedade do dano (`random(0.8 ~ 1.2)`) será substituída por um novo atributo chamado **`critico`**.

### Nova Fórmula
```js
damage *= attacker.critico;
```

Se o atributo não estiver definido, o valor padrão é **1.0**.

---

## 📝 PRD - Sistema de Classes e Mecânicas

### Contexto
- Implementar sistema completo de classes com vantagens.
- Adicionar mecânicas de defesa e meditação.
- Substituir aleatoriedade por atributo crítico.
- Renomear "mana" para "Ânima".

### Objetivos
1. Implementar sistema de classes no **skills-database**.
2. Adicionar suporte a classes e Ânima no **character-database**.
3. Criar módulo **battle-mechanics** com todas as mecânicas de combate.

### Requisitos Funcionais

#### Skills-Database
- Renomear sistema de "elementos" para "classes".
- Registrar três classes: Lutador, Armamentista, Arcano.
- Renomear "mana" para "Ânima" em todo o sistema.

#### Character-Database
- **Campo classe**: seleção obrigatória na criação.
- **Campo Ânima**: valor numérico (padrão: 100).
- **Edição**: permitir alteração de classe e Ânima.
- **API**: suporte completo para os novos campos.

#### Battle-Mechanics (Novo Módulo)
- **Sistema de vantagens**: tabela de classes e modificadores.
- **Mecânica de defesa**: imunidade a dano não-crítico.
- **Mecânica de meditação**: recuperação de HP (5%) e Ânima (10%).
- **Atributo crítico**: substituir aleatoriedade por `critico`.

### Critérios de Aceite
- Classes podem ser criadas e editadas em personagens.
- Ânima pode ser configurada e alterada.
- Sistema de vantagens funciona corretamente em batalha.
- Defesa bloqueia dano não-crítico.
- Meditação recupera HP e Ânima conforme especificado.
- Atributo crítico substitui completamente a aleatoriedade.
- API retorna todos os novos campos corretamente.

### Estrutura Técnica Sugerida

#### Tabela de Vantagens
```js
const classAdvantages = {
  'Lutador': 'Armamentista',
  'Armamentista': 'Arcano', 
  'Arcano': 'Lutador'
};
```

#### Estados de Batalha
```js
const battleStates = {
  defending: false,
  meditating: false
};
```

#### Cálculo de Dano Atualizado
```js
function calculateDamage(attacker, defender, skill = null) {
  let damage;
  
  if (skill) {
    damage = ((attacker.ATK * (skill.power / 10)) - (defender.DEF * 0.5));
  } else {
    damage = (attacker.ATK - (defender.DEF * 0.7));
  }
  
  // Aplicar crítico
  damage *= (attacker.critico || 1.0);
  
  // Aplicar vantagem de classe
  damage = applyClassModifiers(damage, attacker.class, defender.class);
  
  // Verificar defesa
  if (defender.defending && !isCriticalHit()) {
    damage = 0;
  }
  
  return Math.max(0, damage);
}
```

### Próximos Passos
1. Atualizar **skills-database** (renomeações e classes).
2. Atualizar **character-database** (campos classe e Ânima).
3. Criar módulo **battle-mechanics** (vantagens, defesa, meditação).
4. Implementar **atributo crítico** no sistema de dano.
5. Migrar dados existentes.
6. Testes de integração.

**Status**: Em planejamento  
**Versão Alvo**: 3.3.0  
**Data Estimada**: Setembro/2025

---

## 🔄 Resumo das Principais Mudanças

### Nomenclatura
- **Elementos** → **Classes**
- **Mana** → **Ânima**

### Novas Mecânicas
- **Vantagem de classes** (ciclo pedra-papel-tesoura)
- **Sistema de defesa** (imunidade a dano não-crítico)
- **Sistema de meditação** (recuperação de HP e Ânima)
- **Atributo crítico** (substitui aleatoriedade)

### Novos Atributos
- **classe**: Lutador/Armamentista/Arcano
- **anima**: valor numérico (padrão: 100)
- **critico**: multiplicador de dano (padrão: 1.0)