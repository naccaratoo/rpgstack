# Sistema de Turnos para RPG - Inspirado em TCGs

## Visão Geral

Este sistema de turnos foi desenvolvido para jogos RPG, inspirado nos mecânicas de **Trading Card Games (TCGs)** como Yu-Gi-Oh! e Magic: The Gathering. O sistema implementa um ciclo infinito de fases que permite verificações automáticas, ações de jogadores e processamento de efeitos.

## Estrutura das Fases

O sistema opera em um ciclo de **3 fases principais**:

```
CHECK PHASE → PLAYER PHASE → END PHASE → [próximo jogador] → CHECK PHASE → ...
```

### 1. CHECK PHASE
**Propósito**: Verificações automáticas e processamento de efeitos passivos

**Ações executadas**:
- Verificação de condições de vitória/derrota
- Regeneração de recursos (Ânima, energia, etc.)
- Processamento de status effects ativos
- Execução de efeitos de início de turno
- Checagem de regras automáticas

### 2. PLAYER PHASE
**Propósito**: Fase ativa onde o jogador pode realizar suas ações

**Características**:
- Jogador pode jogar cartas/usar habilidades
- Realizar ataques ou movimentos
- Ativar itens ou equipamentos
- Fase interativa que aguarda input do jogador

### 3. END PHASE
**Propósito**: Limpeza e finalização do turno

**Ações executadas**:
- Execução de efeitos de fim de turno
- Limpeza de efeitos temporários
- Processamento de dano contínuo
- Preparação para o próximo jogador

---

## Arquitetura do Sistema

### Classe Principal: `TurnSystem`

```javascript
class TurnSystem {
    constructor() {
        this.currentPlayer = 0;           // Índice do jogador atual
        this.players = [];                // Array de jogadores
        this.currentPhase = 'CHECK';      // Fase atual
        this.turnNumber = 1;              // Número do turno global
        this.phaseOrder = ['CHECK', 'PLAYER', 'END'];
        this.currentPhaseIndex = 0;       // Índice da fase atual
        this.effects = {                  // Efeitos por fase
            checkPhase: [],
            playerPhase: [],
            endPhase: [],
            turnStart: [],
            turnEnd: []
        };
        this.gameState = {                // Estado global do jogo
            activeEffects: [],
            conditions: new Map(),
            eventQueue: []
        };
    }
}
```

### Estrutura do Jogador

```javascript
{
    id: 0,                              // ID único
    name: "Nome do Jogador",            // Nome do jogador
    data: {},                           // Dados customizados
    statusEffects: [],                  // Efeitos temporários
    resources: {                        // Recursos do jogador
        Ânima: 5,
        health: 100,
        // outros recursos...
    }
}
```

---

## Funcionalidades Principais

### 1. Gerenciamento de Jogadores

#### Adicionar Jogador
```javascript
turnSystem.addPlayer({
    name: "Mago Azul",
    resources: { health: 100, Ânima: 5 }
});
```

#### Obter Jogador Atual
```javascript
const currentPlayer = turnSystem.getCurrentPlayer();
```

### 2. Sistema de Efeitos

#### Registrar Efeito
```javascript
turnSystem.registerEffect('checkPhase', {
    id: 'regeneration',
    name: 'Regeneração Natural',
    execute: async (gameState, player) => {
        player.resources.health += 2;
        return "Jogador regenerou 2 de vida";
    },
    condition: (gameState, player) => player.resources.health < 100,
    duration: 5  // Opcional: duração em turnos
});
```

#### Estrutura de Efeito
- **id**: Identificador único do efeito
- **name**: Nome descritivo
- **execute**: Função que executa o efeito
- **condition**: Condição para executar (opcional)
- **duration**: Duração em turnos (opcional)

### 3. Controle de Fluxo

#### Avançar Uma Fase
```javascript
await turnSystem.nextStep();
```

#### Executar Turno Completo de um Jogador
```javascript
await turnSystem.executePlayerTurn();
```

#### Pular para Fase Específica
```javascript
turnSystem.skipToPhase('PLAYER');
```

### 4. Monitoramento

#### Obter Status do Jogo
```javascript
const status = turnSystem.getGameStatus();
console.log(status);
// {
//     currentPlayer: {...},
//     currentPhase: 'CHECK',
//     turnNumber: 3,
//     players: [...],
//     activeEffects: 2
// }
```

---

## Fluxo de Execução

### Ciclo de Uma Fase

1. **Log da Fase Atual**: Exibe qual fase está executando e para qual jogador
2. **Execução de Efeitos**: Processa todos os efeitos registrados para a fase
3. **Processamento da Fase**: Executa lógica específica da fase
4. **Avanço**: Move para próxima fase ou próximo jogador

### Transição Entre Jogadores

Quando a **END Phase** termina:

1. Chama `endTurn()` - processa fim de turno
2. Chama `nextPlayer()` - avança para próximo jogador
3. Reset para **CHECK Phase** (índice 0)
4. Continua o ciclo infinito

### Exemplo de Fluxo Completo

```
=== CHECK PHASE - Player Mago Azul ===
Check Phase: Mago Azul - Health: 100, Ânima: 6

=== PLAYER PHASE - Player Mago Azul ===
Mago Azul pode realizar suas ações agora.

=== END PHASE - Player Mago Azul ===
End Phase: Finalizando turno de Mago Azul
--- FIM DO TURNO de Mago Azul ---

>>> Passando para Guerreiro Vermelho <<<

=== CHECK PHASE - Player Guerreiro Vermelho ===
Check Phase: Guerreiro Vermelho - Health: 120, Ânima: 3
```

---

## Recursos Avançados

### 1. Sistema de Status Effects

```javascript
player.statusEffects.push({
    name: "Veneno",
    apply: (player) => player.resources.health -= 2,
    duration: 3,
    temporary: false
});
```

### 2. Condições de Vitória

O sistema automaticamente verifica condições de vitória na **CHECK Phase**:

```javascript
checkWinConditions() {
    this.players.forEach(player => {
        if (player.resources.health <= 0) {
            console.log(`${player.name} foi derrotado!`);
            // Implementar lógica de derrota
        }
    });
}
```

### 3. Regeneração Automática

Recursos podem ser regenerados automaticamente:

```javascript
regenerateResources(player) {
    player.resources.Ânima = Math.min(player.resources.Ânima + 1, 10);
}
```

### 4. Limpeza de Efeitos

Efeitos temporários são limpos automaticamente:

```javascript
cleanupTemporaryEffects(player) {
    player.statusEffects = player.statusEffects.filter(effect => !effect.temporary);
}
```

---

## Exemplo de Implementação

### Setup Básico

```javascript
// Criar sistema
const turnSystem = new TurnSystem();

// Adicionar jogadores
turnSystem.addPlayer({
    name: "Mago",
    resources: { health: 100, Ânima: 10 }
});

turnSystem.addPlayer({
    name: "Guerreiro", 
    resources: { health: 120, Ânima: 5 }
});

// Registrar efeito de regeneração
turnSystem.registerEffect('checkPhase', {
    id: 'heal',
    execute: async (gameState, player) => {
        if (player.resources.health < 100) {
            player.resources.health += 3;
            return `${player.name} regenerou 3 HP`;
        }
        return null;
    }
});

// Executar algumas fases
for (let i = 0; i < 6; i++) {
    await turnSystem.nextStep();
}
```

### Simulação Completa

```javascript
class GameExample {
    constructor() {
        this.turnSystem = new TurnSystem();
        this.setupGame();
    }

    async simulateGame(numSteps = 9) {
        console.log("=== SIMULAÇÃO ===");
        
        for (let i = 0; i < numSteps; i++) {
            await this.turnSystem.nextStep();
            const status = this.turnSystem.getGameStatus();
            console.log(`Próximo: ${status.currentPhase} de ${status.currentPlayer.name}`);
        }
    }
}

const game = new GameExample();
game.simulateGame(12);
```

---

## Vantagens do Sistema

### 1. **Flexibilidade**
- Fácil adição de novas fases
- Sistema de efeitos extensível
- Suporte a múltiplos jogadores

### 2. **Automação**
- Verificações automáticas de regras
- Processamento de efeitos sem intervenção
- Regeneração automática de recursos

### 3. **Inspiração em TCGs**
- Fases bem definidas como em Magic/Yu-Gi-Oh!
- Sistema de prioridade e timing
- Efeitos com condições e durações

### 4. **Escalabilidade**
- Adicionar novos tipos de efeitos
- Expandir recursos dos jogadores
- Implementar mecânicas complexas

---

## Possíveis Extensões

### 1. **Sistema de Prioridade**
Implementar stack de ações como em Magic

### 2. **Fases Customizadas**
Permitir criação de fases específicas do jogo

### 3. **Trigger System**
Efeitos que respondem a eventos específicos

### 4. **Multiplayer Assíncrono**
Suporte a jogos online com múltiplos jogadores

### 5. **Persistência**
Salvar/carregar estado do jogo

---

## Conclusão

Este sistema fornece uma base sólida para implementar mecânicas de turnos em RPGs, mantendo a flexibilidade e automatização características dos melhores TCGs. A arquitetura modular permite fácil extensão e customização para diferentes tipos de jogos.