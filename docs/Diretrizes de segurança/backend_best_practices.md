# Backend RPG - Boas Práticas e Roadmap Incremental

## PRINCÍPIO FUNDAMENTAL: NUNCA QUEBRAR O QUE FUNCIONA

### 1. Estratégia de Migração Segura

#### Fase 1: Coexistência (Híbrido Client-Server)
- ✅ **MANTER** toda lógica atual do cliente funcionando
- ✅ **ADICIONAR** validação paralela no servidor (sem afetar o cliente)
- ✅ **COMPARAR** resultados entre cliente e servidor
- ✅ **LOGAR** discrepâncias sem bloquear ações

```javascript
// Exemplo: Validação Híbrida
async function processSkillUse(skillData) {
    // 1. Executar lógica atual do cliente (continua funcionando)
    const clientResult = calculateDamageClient(skillData);
    
    // 2. Validar no servidor (paralelo, não bloqueia)
    const serverValidation = await validateSkillServer(skillData);
    
    // 3. Comparar e logar (sem afetar gameplay)
    if (clientResult.damage !== serverValidation.expectedDamage) {
        console.warn('Discrepância detectada:', {
            client: clientResult.damage,
            server: serverValidation.expectedDamage
        });
    }
    
    // 4. USAR resultado do cliente (por enquanto)
    return clientResult;
}
```

#### Fase 2: Validação Progressiva
- ✅ Implementar validações server-side uma de cada vez
- ✅ Começar com validações não-críticas (cooldowns, recursos)
- ✅ Validar critical path por último (dano, death)

#### Fase 3: Transição Gradual
- ✅ Mover uma validação por vez para server-side
- ✅ A/B testing com rollback instantâneo
- ✅ Monitoramento contínuo de performance

### 2. Arquitetura Híbrida Recomendada

```typescript
interface GameValidation {
    // Fase 1: Client-side (atual, mantém funcionando)
    clientValidation: boolean;
    
    // Fase 2: Server validation (paralela, não bloqueia)
    serverValidation?: {
        isValid: boolean;
        reason?: string;
        suggestedAction?: string;
    };
    
    // Fase 3: Authority (gradualmente migra para servidor)
    authority: 'client' | 'server';
}
```

### 3. Sistema de Rollback e Recuperação

```javascript
// Sistema de backup para rollback instantâneo
class GameStateManager {
    private backupStates = new Map();
    
    createBackup(gameState) {
        this.backupStates.set(Date.now(), JSON.stringify(gameState));
    }
    
    rollback(timestamp) {
        const backup = this.backupStates.get(timestamp);
        if (backup) {
            return JSON.parse(backup);
        }
    }
    
    // Auto-cleanup de backups antigos
    cleanup() {
        const cutoff = Date.now() - (30 * 60 * 1000); // 30 min
        for (const [timestamp] of this.backupStates) {
            if (timestamp < cutoff) {
                this.backupStates.delete(timestamp);
            }
        }
    }
}
```

## ROADMAP INCREMENTAL (8 Fases)

### Fase 1: Preparação e Monitoramento
**Objetivo**: Estabelecer base de monitoramento sem afetar funcionalidade
- [ ] Implementar logging detalhado no cliente
- [ ] Criar sistema de métricas (performance, ações por minuto)
- [ ] Estabelecer baseline de performance
- [ ] **TESTAR**: Garantir que nada mudou no gameplay

### Fase 2: Validação de Recursos (Não-Crítica)
**Objetivo**: Validar HP/MP no servidor (paralelo)
- [ ] Endpoint para validar recursos disponíveis
- [ ] Comparar cálculos cliente vs servidor
- [ ] Logar discrepâncias (sem bloquear)
- [ ] **TESTAR**: Funcionalidade inalterada, logs funcionando

### Fase 3: Validação de Cooldowns
**Objetivo**: Server-side cooldown tracking
- [ ] Implementar tracking de cooldowns no servidor
- [ ] Validação paralela de cooldowns
- [ ] Sistema de sincronização de cooldowns
- [ ] **TESTAR**: Cooldowns funcionam identicamente

### Fase 4: Validação de Alcance e Targeting
**Objetivo**: Validar posicionamento e alvos válidos
- [ ] Validação de alcance de skills
- [ ] Verificação de line-of-sight (se aplicável)
- [ ] Validação de alvos válidos
- [ ] **TESTAR**: Targeting funciona perfeitamente

### Fase 5: Cálculo de Dano Híbrido
**Objetivo**: Implementar cálculo de dano no servidor (ainda usando cliente)
- [ ] Implementar fórmulas de dano no servidor
- [ ] Comparação cliente vs servidor
- [ ] Sistema de reconciliação de diferenças
- [ ] **TESTAR**: Dano calculado identicamente

### Fase 6: Transição do Authority (CRÍTICA)
**Objetivo**: Mover authority gradualmente para servidor
- [ ] A/B testing com % pequena de usuários
- [ ] Sistema de rollback automático
- [ ] Monitoramento de performance em tempo real
- [ ] **TESTAR**: Experiência idêntica para usuários

### Fase 7: Anti-Cheat e Detecção
**Objetivo**: Implementar sistemas de detecção avançada
- [ ] Rate limiting inteligente
- [ ] Detecção de anomalias estatísticas
- [ ] Sistema de flags e warnings
- [ ] **TESTAR**: Falsos positivos mínimos

### Fase 8: Otimização e Polimento
**Objetivo**: Otimizar performance e completar migração
- [ ] Cache otimizado para dados frequentes
- [ ] Compressão de mensagens
- [ ] Load balancing (se necessário)
- [ ] **TESTAR**: Performance superior ao sistema anterior

## CHECKLIST DE SEGURANÇA (Para Cada Fase)

### Antes de Implementar Qualquer Mudança:
- [ ] **BACKUP**: Código atual está commitado e funcional
- [ ] **TESTES**: Todos os testes existentes passam
- [ ] **PERFORMANCE**: Baseline estabelecido
- [ ] **ROLLBACK**: Plano de rollback definido e testado

### Durante a Implementação:
- [ ] **LOGGING**: Logs detalhados de todas as operações
- [ ] **MÉTRICAS**: Monitoramento contínuo de performance
- [ ] **TESTES**: Testes automatizados para nova funcionalidade
- [ ] **DOCUMENTAÇÃO**: Atualização deste documento

### Após Implementação:
- [ ] **VALIDAÇÃO**: Funcionalidade anterior inalterada
- [ ] **PERFORMANCE**: Sem degradação de performance
- [ ] **MONITORAMENTO**: 24h de monitoramento sem issues
- [ ] **DOCUMENTAÇÃO**: Atualização completa do backend_rework.md

## PATTERNS DE IMPLEMENTAÇÃO SEGURA

### Pattern 1: Wrapper de Validação
```javascript
// Wrapper que mantém funcionalidade atual + adiciona validação
function wrapWithValidation(originalFunction, serverValidator) {
    return async function(...args) {
        // 1. Executar função original (garantia de funcionalidade)
        const originalResult = await originalFunction.apply(this, args);
        
        // 2. Validar no servidor (paralelo)
        if (serverValidator) {
            serverValidator.validate(args, originalResult)
                .catch(error => console.warn('Server validation failed:', error));
        }
        
        // 3. Retornar resultado original (sem mudanças)
        return originalResult;
    };
}
```

### Pattern 2: Circuit Breaker
```javascript
// Sistema que automaticamente reverte para cliente se servidor falha
class ServerValidationCircuitBreaker {
    constructor(failureThreshold = 5, timeout = 30000) {
        this.failureCount = 0;
        this.failureThreshold = failureThreshold;
        this.timeout = timeout;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.nextAttempt = 0;
    }
    
    async call(serverFunction, fallbackFunction) {
        if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttempt) {
                return fallbackFunction();
            }
            this.state = 'HALF_OPEN';
        }
        
        try {
            const result = await serverFunction();
            this.reset();
            return result;
        } catch (error) {
            this.recordFailure();
            return fallbackFunction();
        }
    }
    
    recordFailure() {
        this.failureCount++;
        if (this.failureCount >= this.failureThreshold) {
            this.state = 'OPEN';
            this.nextAttempt = Date.now() + this.timeout;
        }
    }
    
    reset() {
        this.failureCount = 0;
        this.state = 'CLOSED';
    }
}
```

### Pattern 3: Feature Flag System
```javascript
// Sistema de flags para ativar/desativar funcionalidades
class FeatureFlags {
    constructor() {
        this.flags = {
            'server-damage-calculation': false,
            'server-cooldown-validation': false,
            'server-resource-validation': false
        };
    }
    
    isEnabled(flag) {
        return this.flags[flag] || false;
    }
    
    enable(flag) {
        this.flags[flag] = true;
        this.logFlagChange(flag, true);
    }
    
    disable(flag) {
        this.flags[flag] = false;
        this.logFlagChange(flag, false);
    }
}
```

## MÉTRICAS CRÍTICAS A MONITORAR

### Performance Metrics:
- **Response Time**: < 100ms para validações
- **Throughput**: Ações processadas por segundo
- **Error Rate**: < 0.1% de falhas
- **Memory Usage**: Crescimento de memória

### Business Metrics:
- **Player Retention**: Não deve degradar
- **Session Duration**: Deve manter ou melhorar
- **User Satisfaction**: Feedback qualitativo

### Technical Metrics:
- **False Positives**: < 0.01% de flags incorretos
- **Rollback Frequency**: < 1 por dia
- **Sync Issues**: Discrepâncias cliente/servidor

## REGRAS DE OURO

1. **NUNCA** quebrar funcionalidade existente
2. **SEMPRE** ter plano de rollback
3. **TESTAR** cada fase isoladamente
4. **MONITORAR** métricas continuamente
5. **DOCUMENTAR** cada mudança neste arquivo
6. **VALIDAR** com usuários reais antes de prosseguir

## ESTRUTURA DE DOCUMENTAÇÃO

### Organização dos Arquivos:
```
docs/
└── reworkbackend/
    ├── README.md                    # Índice principal e overview
    ├── progress-tracking.md         # Progresso detalhado por fase
    ├── architecture-decisions.md    # Decisões arquiteturais (ADRs)
    ├── rollback-procedures.md      # Procedimentos de rollback
    ├── performance-metrics.md       # Métricas e benchmarks
    ├── issues-and-solutions.md     # Histórico de problemas
    └── api-documentation.md         # Documentação da API backend
```

## PROCESSO DE ATUALIZAÇÃO DA DOCUMENTAÇÃO

### OBRIGATÓRIO: Ao Final de Cada Sessão de Desenvolvimento

#### 1. Atualizar `docs/reworkbackend/progress-tracking.md`:
```bash
# Criar estrutura se não existir
mkdir -p docs/reworkbackend
```

#### 2. Template de Update para `progress-tracking.md`:
```markdown
## Update [DATA] - Fase [X]: [NOME_FASE]

### Progresso:
- [x] Item completado
- [ ] Item pendente
- [?] Item com issues

### Issues Encontrados:
- **Issue**: Descrição do problema
- **Solução**: Como foi resolvido
- **Impacto**: Efeito na aplicação

### Métricas (atualizar performance-metrics.md):
- Response Time: [dados]ms
- Error Rate: [dados]%
- Memory Usage: [dados]MB
- User Impact: [qualitativo]

### Decisões Arquiteturais (documentar em architecture-decisions.md):
- **Decisão**: O que foi decidido
- **Contexto**: Por que foi necessário
- **Alternativas**: O que mais foi considerado
- **Consequências**: Impactos esperados

### Próximos Passos:
1. [Ação específica com responsável]
2. [Ação específica com prazo]

### Rollback Plan (detalhar em rollback-procedures.md):
- **Trigger**: Quando fazer rollback
- **Steps**: Como executar (comandos específicos)
- **Recovery Time**: Tempo estimado
- **Validation**: Como verificar sucesso
```

#### 3. Criar `docs/reworkbackend/README.md` (Índice Principal):
```markdown
# Backend Rework - Documentação Completa

## Status Atual
- **Fase**: [Número e Nome]
- **Última Atualização**: [Data]
- **Estado**: [Desenvolvimento/Teste/Produção]

## Navegação Rápida
- [📊 Progresso Atual](./progress-tracking.md)
- [🏗️ Decisões Arquiteturais](./architecture-decisions.md)
- [📈 Métricas de Performance](./performance-metrics.md)
- [🚨 Procedimentos de Rollback](./rollback-procedures.md)
- [🐛 Issues e Soluções](./issues-and-solutions.md)
- [📚 API Documentation](./api-documentation.md)

## Workflow de Desenvolvimento
1. Implementar seguindo roadmap incremental
2. Testar funcionalidade atual (não quebrar)
3. Documentar mudanças (todos os arquivos relevantes)
4. Commit com tag descritiva
5. Deploy incremental com monitoramento

## Contatos e Responsabilidades
- **Lead Developer**: [Nome]
- **QA**: [Nome]
- **DevOps**: [Nome]
```

#### 4. Template para `docs/reworkbackend/architecture-decisions.md`:
```markdown
# Decisões Arquiteturais (ADRs)

## ADR-001: [DATA] - [TÍTULO DA DECISÃO]

### Status
[Proposta/Aceita/Substituída/Descontinuada]

### Contexto
Por que esta decisão foi necessária?

### Decisão
O que foi decidido?

### Consequências
- **Positivas**: Benefícios esperados
- **Negativas**: Trade-offs aceitos
- **Riscos**: O que pode dar errado

### Implementação
- **Fase**: Em qual fase será implementado
- **Responsável**: Quem implementará
- **Prazo**: Quando deve estar pronto

---
```

#### 5. Template para `docs/reworkbackend/rollback-procedures.md`:
```markdown
# Procedimentos de Rollback

## Rollback Geral - Emergência

### Quando Executar
- Performance degradou > 50%
- Error rate > 1%
- Funcionalidade crítica quebrou
- Dados corrompidos

### Comandos de Rollback
```bash
# 1. Parar serviços
docker-compose down

# 2. Restaurar código anterior
git revert [commit-hash]

# 3. Restaurar banco (se necessário)
pg_restore -d rpg_db backup_[timestamp].sql

# 4. Reiniciar serviços
docker-compose up -d

# 5. Verificar saúde
curl http://localhost:8080/health
```

### Rollback por Fase
#### Fase 1: [Nome]
- **Trigger**: [Condição específica]
- **Steps**: [Passos específicos]
- **Validation**: [Como verificar]

---
```

#### 6. Template para `docs/reworkbackend/performance-metrics.md`:
```markdown
# Métricas de Performance

## Baseline (Antes do Rework)
- **Response Time**: [X]ms médio
- **Throughput**: [Y] ações/segundo
- **Memory Usage**: [Z]MB médio
- **Error Rate**: [W]%

## Metas do Projeto
- **Response Time**: < 100ms (melhoria de [X]%)
- **Throughput**: > [Y+20%] ações/segundo
- **Memory Usage**: < [Z-10%]MB
- **Error Rate**: < 0.1%

## Histórico de Medições
### [DATA] - Fase [X]
- Response Time: [valor] (trend: ↑↓→)
- Throughput: [valor] (trend: ↑↓→)
- Memory Usage: [valor] (trend: ↑↓→)
- Error Rate: [valor] (trend: ↑↓→)

## Alertas Configurados
- Response Time > 200ms → Warning
- Response Time > 500ms → Critical
- Error Rate > 0.5% → Warning
- Error Rate > 1% → Critical
- Memory Usage > 80% → Warning
```

### SCRIPT DE AUTOMAÇÃO

#### Criar `scripts/update-docs.sh`:
```bash
#!/bin/bash

# Script para facilitar atualização da documentação
# Uso: ./scripts/update-docs.sh "Fase 2: Validação de Recursos"

PHASE=$1
DATE=$(date +"%Y-%m-%d %H:%M")
DOCS_DIR="docs/reworkbackend"

# Criar estrutura se não existir
mkdir -p $DOCS_DIR

# Função para criar template se arquivo não existir
create_if_not_exists() {
    local file=$1
    local content=$2
    
    if [ ! -f "$file" ]; then
        echo "$content" > "$file"
        echo "✅ Criado: $file"
    fi
}

# Criar README se não existir
create_if_not_exists "$DOCS_DIR/README.md" "# Backend Rework - Documentação

## Status Atual
- **Fase**: $PHASE
- **Última Atualização**: $DATE
- **Estado**: Desenvolvimento

[Adicionar conteúdo conforme template...]"

# Criar entrada no progress-tracking.md
echo "
## Update $DATE - $PHASE

### Progresso:
- [ ] [Adicionar itens específicos]

### Issues Encontrados:
- **Issue**: [Descrever problema encontrado]
- **Solução**: [Como foi resolvido]
- **Impacto**: [Efeito na aplicação]

### Próximos Passos:
1. [Definir próxima ação]

---
" >> "$DOCS_DIR/progress-tracking.md"

echo "📝 Documentação atualizada em $DOCS_DIR"
echo "🔧 Edite os arquivos para completar a documentação da sessão"
echo "💡 Não esqueça de commitar as mudanças!"
```

### CHECKLIST DE DOCUMENTAÇÃO POR SESSÃO

#### Antes de Começar uma Sessão:
- [ ] Verificar se estrutura `docs/reworkbackend/` existe
- [ ] Revisar progresso da última sessão
- [ ] Definir objetivos claros para a sessão atual

#### Durante a Sessão:
- [ ] Anotar decisões importantes em rascunho
- [ ] Documentar issues encontrados e soluções
- [ ] Registrar métricas de performance

#### Ao Final da Sessão (OBRIGATÓRIO):
- [ ] Executar `./scripts/update-docs.sh "Fase X: Nome"`
- [ ] Atualizar `progress-tracking.md` com progresso real
- [ ] Documentar decisões em `architecture-decisions.md`
- [ ] Atualizar métricas em `performance-metrics.md`
- [ ] Revisar/atualizar procedimentos de rollback
- [ ] Commit com mensagem descritiva: `docs: update rework progress - Fase X`
- [ ] Validar que nada foi quebrado na sessão

### EXEMPLO DE COMMIT MESSAGE:
```
docs: update backend rework progress - Fase 2

- Implemented resource validation endpoint
- Added hybrid client-server validation
- Performance baseline: 95ms avg response time
- No breaking changes to existing functionality

Files updated:
- docs/reworkbackend/progress-tracking.md
- docs/reworkbackend/performance-metrics.md
- docs/reworkbackend/architecture-decisions.md
```

---

**LEMBRETE CRÍTICO**: Este documento deve ser atualizado AO FINAL DE CADA SESSÃO. É o histórico vivo do projeto e garantia de que não perderemos progresso ou repetiremos erros.

**STATUS ATUAL**: Documento base criado - Fase 0 completa
**PRÓXIMO PASSO**: Avaliar código atual e definir Fase 1 específica para o projeto