# 🔐 Diretrizes de Segurança - RPGStack

## 📋 Sumário
- [Princípios Fundamentais](#princípios-fundamentais)
- [Backend vs Frontend: Onde Armazenar](#backend-vs-frontend-onde-armazenar)
- [Exemplos Técnicos de Vulnerabilidades](#exemplos-técnicos-de-vulnerabilidades)
- [Implementação Segura](#implementação-segura)
- [Casos de Uso Práticos](#casos-de-uso-práticos)
- [Checklist de Segurança](#checklist-de-segurança)

---

## 🎯 Princípios Fundamentais

### **"NUNCA CONFIE NO FRONTEND"**

O frontend é **sempre** considerado território inimigo. Qualquer dado ou lógica no cliente pode ser:
- 🔍 **Inspecionado** (DevTools, View Source)
- ✏️ **Modificado** (Console JavaScript, Extensions)  
- 🚫 **Bypassado** (Desabilitar JavaScript, Requests diretas)
- 🔄 **Interceptado** (Proxy, Network Monitor)

### **Regra de Ouro**
> **Backend = Fonte da Verdade | Frontend = Interface de Apresentação**

---

## 🏛️ Backend vs Frontend: Onde Armazenar

### ✅ **BACKEND (Seguro)**
```
📊 Stats de Personagens (HP, ATK, DEF)
💰 Moedas e Recursos do Jogador
🎮 Lógica de Batalha e Cálculos de Dano
🔑 Dados de Autenticação e Sessões
📈 Progressão e Experiência
🛡️ Validações e Regras de Negócio
🏆 Rankings e Leaderboards
💎 Itens e Inventário
```

### ❌ **FRONTEND (Inseguro)**
```
❌ Stats reais dos personagens
❌ Cálculos de dano
❌ Validação de recursos
❌ Lógica de progressão
❌ Verificação de cheats
❌ Dados sensíveis de qualquer tipo
```

### ✅ **FRONTEND (Aceitável)**
```
🎨 Preferências de UI/UX
🔊 Configurações de Audio/Video
🌐 Cache de dados não-críticos
📱 Estado temporário da interface
🎯 Feedback visual e animações
```

---

## 🚨 Exemplos Técnicos de Vulnerabilidades

### **1. Manipulação de Stats via DevTools**

#### ❌ **VULNERÁVEL (Frontend):**
```javascript
// public/battle.js - INSEGURO
let playerHP = 100;
let playerAttack = 50;

function calculateDamage(attack, defense) {
    return Math.max(1, attack - defense); // ← Pode ser modificado
}

// CHEAT POSSÍVEL:
// Console: playerAttack = 99999; playerHP = 99999;
```

#### ✅ **SEGURO (Backend):**
```javascript
// src/battle/BattleMechanics.js - SEGURO
async calculateDamage(attackerId, defenderId) {
    // Stats SEÂnimaRE buscados do banco de dados
    const attacker = await this.loadCharacterFromDatabase(attackerId);
    const defender = await this.loadCharacterFromDatabase(defenderId);
    
    const damage = (attacker.attack * 1.2) * (100 / (100 + defender.defense));
    return Math.max(1, Math.floor(damage));
}
```

### **2. Bypass de Validações**

#### ❌ **VULNERÁVEL:**
```javascript
// Frontend - FACILMENTE BYPASSADO
function canUseSkill(skillCost, currentAnima) {
    if (currentAnima < skillCost) {
        alert("Não tem Ânima suficiente!");
        return false; // ← Pode ser sempre true via console
    }
    return true;
}

// CHEAT: Redefinir função
// canUseSkill = () => true;
```

#### ✅ **SEGURO:**
```javascript
// Backend - VALIDAÇÃO REAL
async processSkillUsage(battleId, characterId, skillId) {
    const character = await this.loadCharacterFromDatabase(characterId);
    const skill = await this.getSkillData(skillId);
    
    // Validação SERVER-SIDE (não pode ser bypassada)
    if (character.currentAnima < skill.cost) {
        throw new Error("Ânima insuficiente");
    }
    
    // Deduzir Ânima no banco de dados
    character.currentAnima -= skill.cost;
    await this.saveCharacterState(character);
    
    return this.calculateSkillDamage(character, skill);
}
```

### **3. Manipulação de Requests HTTP**

#### ❌ **VULNERÁVEL (Dados no Request):**
```javascript
// Cliente envia stats - INSEGURO
fetch('/api/attack', {
    method: 'POST',
    body: JSON.stringify({
        attackerId: 'player1',
        attack: 999999, // ← Pode ser modificado no network inspector
        damage: 999999  // ← Valor falso
    })
});
```

#### ✅ **SEGURO (Apenas IDs):**
```javascript
// Cliente envia apenas identificadores - SEGURO
fetch('/api/secure-battle/attack', {
    method: 'POST',
    body: JSON.stringify({
        battleId: 'abc123',
        attackerId: 'char_001', // ← Apenas ID
        targetId: 'char_002',   // ← Backend busca stats reais
        skillId: 'fireball'     // ← Backend valida disponibilidade
    })
});

// Backend valida TUDO e calcula o resultado real
```

### **4. Storage Local Manipulation**

#### ❌ **VULNERÁVEL:**
```javascript
// localStorage pode ser editado facilmente
localStorage.setItem('playerGold', '999999');
localStorage.setItem('playerLevel', '100');

// Ou via DevTools → Application → Local Storage
```

#### ✅ **SEGURO:**
```javascript
// Dados críticos APENAS no banco de dados
// Frontend recebe apenas dados de exibição
const displayData = await fetch('/api/player/display-data').then(r => r.json());
// displayData contém apenas HP atual, não máximo real nem outros stats
```

---

## 🛡️ Implementação Segura

### **Padrão de Comunicação Segura**

#### **1. Cliente → Servidor (Request)**
```javascript
// ✅ ENVIAR: Apenas comandos e IDs
{
    "action": "attack",
    "battleId": "uuid-here",
    "attackerId": "char_001",
    "targetId": "char_002",
    "skillId": "basic_attack"
}

// ❌ NUNCA ENVIAR: Stats, cálculos ou resultados
{
    "damage": 150,          // ← Pode ser falsificado
    "newHP": 50,           // ← Pode ser falsificado  
    "attackPower": 999     // ← Pode ser falsificado
}
```

#### **2. Servidor → Cliente (Response)**
```javascript
// ✅ ENVIAR: Apenas resultados calculados e dados para UI
{
    "success": true,
    "damage": 67,           // ← Calculado no servidor
    "targetNewHP": 33,      // ← Estado real atualizado
    "isCritical": false,    // ← Determinado pelo servidor
    "battleState": "ongoing" // ← Estado controlado pelo servidor
}

// ❌ NUNCA ENVIAR: Stats completos ou lógica interna
{
    "targetMaxHP": 100,     // ← Pode revelar informações
    "defenseFormula": "...", // ← Expõe lógica interna
    "serverSeed": 12345     // ← Dados internos sensíveis
}
```

### **Arquitetura de Camadas Seguras**

```
┌─────────────────────────────────────────┐
│             FRONTEND                    │
│  ┌─────────────────────────────────┐   │
│  │        UI/UX Layer              │   │ ← Apenas apresentação
│  │   - Botões e formulários        │   │
│  │   - Animações e efeitos         │   │
│  │   - Estados temporários         │   │
│  └─────────────────────────────────┘   │
│                   │                     │
│           API Calls (HTTPS)             │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│             BACKEND                     │
│  ┌─────────────────────────────────┐   │
│  │     Authentication Layer        │   │ ← Verificação de sessão
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │       Validation Layer          │   │ ← Validações rigorosas
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │      Business Logic Layer       │   │ ← Cálculos e regras
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │       Database Layer            │   │ ← Fonte da verdade
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 🎮 Casos de Uso Práticos

### **Sistema de Batalha RPG**

#### ❌ **Implementação Insegura:**
```javascript
// Frontend faz tudo - VULNERÁVEL
class InsecureBattle {
    constructor() {
        this.playerHP = 100;     // ← Modificável via console
        this.playerAttack = 50;  // ← Modificável via console
        this.enemyHP = 80;       // ← Modificável via console
    }
    
    attack() {
        // Cálculo no frontend - INSEGURO
        const damage = this.playerAttack - this.enemyDefense;
        this.enemyHP -= damage;
        
        if (this.enemyHP <= 0) {
            this.victory(); // ← Pode ser chamado diretamente
        }
    }
}
```

#### ✅ **Implementação Segura:**
```javascript
// Frontend apenas envia comandos - SEGURO
class SecureBattleClient {
    async attack(skillId) {
        const response = await fetch('/api/secure-battle/attack', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${this.token}` },
            body: JSON.stringify({
                battleId: this.battleId,
                skillId: skillId
            })
        });
        
        const result = await response.json();
        
        // Apenas atualiza interface com dados do servidor
        this.updateUI(result.battleState);
        this.playAnimation(result.animations);
        
        return result;
    }
}
```

### **Sistema de Economia de Jogo**

#### ❌ **Vulnerável:**
```javascript
// localStorage = facilmente editável
let playerGold = parseInt(localStorage.getItem('gold')) || 0;

function buyItem(itemCost) {
    if (playerGold >= itemCost) {  // ← Fácil de burlar
        playerGold -= itemCost;
        localStorage.setItem('gold', playerGold.toString());
        return true;
    }
    return false;
}

// CHEAT: localStorage.setItem('gold', '999999');
```

#### ✅ **Seguro:**
```javascript
// Todas as transações no servidor
async function buyItem(itemId) {
    try {
        const response = await fetch('/api/shop/purchase', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ itemId })
        });
        
        if (!response.ok) {
            throw new Error(await response.text());
        }
        
        const result = await response.json();
        // result = { success: true, newGold: 150, itemAdded: {...} }
        
        this.updateGoldDisplay(result.newGold);
        this.addToInventory(result.itemAdded);
        
        return result;
    } catch (error) {
        console.error('Erro na compra:', error);
        return { success: false, error: error.message };
    }
}
```

---

## 📋 Checklist de Segurança

### **✅ Backend Seguro**
- [ ] **Autenticação**: Todas as rotas críticas requerem autenticação válida
- [ ] **Autorização**: Verificar se usuário pode executar ação específica
- [ ] **Validação de entrada**: Sanitizar e validar todos os dados de entrada
- [ ] **Rate limiting**: Limitar número de requests por usuário/IP
- [ ] **Logs de auditoria**: Registrar todas as ações importantes
- [ ] **Dados no banco**: Stats e recursos armazenados apenas no banco de dados
- [ ] **Cálculos server-side**: Toda lógica de negócio executada no servidor
- [ ] **Sessões seguras**: Tokens com expiração e renovação automática

### **✅ Frontend Seguro**
- [ ] **Apenas UI**: Frontend foca apenas em interface e experiência
- [ ] **Não expor secrets**: Nenhum dado sensível em código cliente
- [ ] **Validação visual**: Feedback imediato, mas validação real no backend
- [ ] **HTTPS**: Todas as comunicações criptografadas
- [ ] **Sanitização**: Limpar dados antes de exibir (XSS protection)
- [ ] **Error handling**: Não vazar informações em mensagens de erro
- [ ] **Obfuscação**: Minificar código para dificultar análise

### **✅ Comunicação Segura**
- [ ] **API endpoints**: Rotas bem definidas e documentadas
- [ ] **Input validation**: Validar formato e tipo de todos os parâmetros
- [ ] **Output filtering**: Enviar apenas dados necessários para o cliente
- [ ] **Error codes**: Códigos padronizados sem vazar informações
- [ ] **Timeouts**: Definir limites para requests longos
- [ ] **Idempotência**: Requests seguros podem ser repetidos

---

## 🔧 Ferramentas de Desenvolvimento Seguro

### **Validação e Testing**
```bash
# Testes de segurança automatizados
npm install --save-dev jest supertest

# Análise estática de código
npm install --save-dev eslint-plugin-security

# Verificação de dependências
npm audit

# Testes de penetração básicos
npm install --save-dev owasp-zap-baseline
```

### **Monitoramento em Produção**
```javascript
// Logs estruturados
const winston = require('winston');

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ 
            filename: 'security.log',
            level: 'warn' 
        })
    ]
});

// Log de tentativas suspeitas
function logSuspiciousActivity(userId, action, data) {
    logger.warn('Suspicious activity detected', {
        userId,
        action,
        data,
        timestamp: new Date().toISOString(),
        ip: req.ip
    });
}
```

---

## 🌐 APIs e Endpoints do RPGStack

### **Configuração do Servidor**
```
🚀 Porta: 3002 (http://localhost:3002)
🔒 Protocolo: HTTP (Desenvolvimento) / HTTPS (Produção)
🆔 Versão: RPGStack Server v3.1.0
```

### **APIs Seguras Implementadas**

#### **🔐 Sistema de Batalha Anti-Cheat**
```
POST   /api/secure-battle/start         - Iniciar batalha 3v3 segura
GET    /api/secure-battle/:id          - Obter estado da batalha
POST   /api/secure-battle/:id/attack   - Executar ataque (stats do backend)
POST   /api/secure-battle/:id/swap     - Executar troca de personagem
DELETE /api/secure-battle/:id          - Encerrar batalha
```

#### **👥 Gerenciamento de Personagens**
```
GET    /api/characters                 - Listar personagens (sem stats sensíveis)
POST   /api/characters                 - Criar novo personagem
GET    /api/characters/:id             - Obter dados de personagem
PUT    /api/characters/:id             - Atualizar personagem
DELETE /api/characters/:id             - Remover personagem
```

#### **🎯 Sistema de Skills**
```
GET    /api/skills                     - Listar skills disponíveis
GET    /api/skills/:characterId        - Skills de personagem específico
POST   /api/skills/validate            - Validar uso de skill
```

#### **🗺️ Sistema de Mapas**
```
GET    /api/v2/maps                    - Listar mapas disponíveis
GET    /api/v2/maps/:id                - Dados de mapa específico
POST   /api/v2/maps                    - Criar novo mapa
```

#### **🖼️ Assets e Recursos**
```
GET    /assets/sprites/                - Sprites de personagens
GET    /api/sprites                    - Lista de sprites disponíveis
GET    /api/test                       - Endpoint de teste da API
```

### **Exemplo de Request Seguro**

#### **Iniciar Batalha Segura:**
```javascript
// REQUEST
POST http://localhost:3002/api/secure-battle/start
Content-Type: application/json

{
    "playerTeam": [
        {"id": "045CCF3515", "name": "Miloš Železnikov"},
        {"id": "EA32D10F2D", "name": "Shi Wuxing"},
        {"id": "13BF61B218", "name": "Aurelius Ignisvox"}
    ],
    "enemyTeam": [
        {"id": "7A8B9C0D1E", "name": "Pythia Kassandra"},
        {"id": "2F3E4D5C6B", "name": "Itzel Nahualli"},
        {"id": "9A8B7C6D5E", "name": "Giovanni da Ferrara"}
    ],
    "battleType": "3v3"
}

// RESPONSE SEGURA
{
    "battleId": "abc123def456",
    "battle": {
        "id": "abc123def456",
        "type": "3v3",
        "status": "active",
        "currentTurn": "player",
        "round": 1,
        "playerTeam": {
            "activeIndex": 0,
            "swapsUsed": 0,
            "maxSwaps": 1,
            "characters": [
                {
                    "id": "045CCF3515",
                    "currentHP": 120,  // ← Stats do banco
                    "maxHP": 120,      // ← Não enviados pelo cliente
                    "currentAnima": 60,   // ← Calculados no backend
                    "maxÂnima": 60,       // ← Seguros contra cheat
                    "status": "active"
                }
                // ... outros personagens
            ]
        },
        "enemyTeam": { /* ... */ },
        "log": []
    }
}
```

#### **Executar Ataque Seguro:**
```javascript
// REQUEST (apenas IDs e comandos)
POST http://localhost:3002/api/secure-battle/abc123def456/attack
Content-Type: application/json

{
    "attackerId": "045CCF3515",     // ← Apenas ID
    "targetId": "7A8B9C0D1E",       // ← Backend busca stats reais
    "skillData": {                   // ← Opcional
        "type": "physical",
        "skillId": "basic_attack"
    }
}

// RESPONSE (resultados calculados no backend)
{
    "success": true,
    "damage": 67,                    // ← Calculado com fórmulas oficiais
    "isCritical": false,             // ← Baseado no stat crítico real
    "targetDefeated": false,         // ← Estado real atualizado
    "battle": {                      // ← Estado atualizado seguro
        "enemyTeam": {
            "characters": [
                {
                    "id": "7A8B9C0D1E",
                    "currentHP": 53,  // ← HP real após dano
                    "status": "active"
                }
            ]
        }
    }
}
```

### **🚨 Endpoints DEPRECIADOS (Inseguros)**

#### **❌ REMOVIDOS por Vulnerabilidades:**
```
❌ /api/battle/calculate-damage    - Cálculo no frontend (inseguro)
❌ /api/player/stats               - Stats completos expostos
❌ /api/battle/apply-damage        - Dano enviado pelo cliente
❌ /api/characters/full-stats      - Stats sensíveis expostos
```

### **🔒 Medidas de Segurança por Endpoint**

#### **Rate Limiting:**
```
🕒 /api/secure-battle/* : 10 requests/segundo por IP
🕒 /api/characters/*    : 5 requests/segundo por usuário  
🕒 /api/sprites         : 50 requests/minuto por IP
```

#### **Validação de Entrada:**
```javascript
// Exemplo: Validação de battleId
function validateBattleId(battleId) {
    // Formato: hexadecimal, 32 caracteres
    const regex = /^[a-f0-9]{32}$/i;
    if (!regex.test(battleId)) {
        throw new Error('Battle ID inválido');
    }
}

// Exemplo: Validação de characterId  
function validateCharacterId(characterId) {
    // Formato: hexadecimal, 10 caracteres
    const regex = /^[A-F0-9]{10}$/;
    if (!regex.test(characterId)) {
        throw new Error('Character ID inválido');
    }
}
```

#### **Headers de Segurança:**
```javascript
// Middleware de segurança aplicado
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY'); 
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});
```

### **📊 Monitoramento de APIs**

#### **Logs de Segurança:**
```javascript
// Exemplo de log de ataque suspeito
{
    "timestamp": "2025-09-05T04:42:53.481Z",
    "level": "warn",
    "message": "Tentativa de dano inválido detectada",
    "data": {
        "ip": "192.168.1.100",
        "endpoint": "/api/secure-battle/attack",
        "battleId": "abc123def456",
        "suspiciousData": {
            "damage": 999999,  // ← Valor suspeito enviado
            "reason": "Damage muito alto para stats reais"
        }
    }
}
```

#### **Métricas de Uso:**
```
📈 Requests/minuto por endpoint
🕒 Tempo médio de resposta
❌ Taxa de erro por endpoint
🚨 Tentativas de acesso suspeitas
```

---

## 📚 Referências e Estudos Adicionais

### **OWASP Top 10 - Principais Vulnerabilidades**
1. **A01:2021 - Broken Access Control**
2. **A02:2021 - Cryptographic Failures** 
3. **A03:2021 - Injection**
4. **A04:2021 - Insecure Design**
5. **A05:2021 - Security Misconfiguration**

### **Recursos Recomendados**
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

### **Documentação Interna**
- [`/src/battle/BattleMechanics.js`](../src/battle/BattleMechanics.js) - Exemplo de implementação segura
- [`/public/secure-battle-client.js`](../public/secure-battle-client.js) - Cliente seguro de referência
- [`/deprecated/README.md`](../deprecated/README.md) - Histórico de correções de segurança

---

## ⚠️ Lembre-se

> **"Segurança não é um recurso, é um requisito fundamental."**

Todo desenvolvedor deve entender que **dados sensíveis e lógica crítica NUNCA devem estar no frontend**. O cliente é sempre território inimigo, e nossa responsabilidade é proteger a integridade do sistema e dos dados dos usuários.

**Data de criação:** 05/09/2025  
**Versão:** 1.0  
**Status:** ✅ Aplicado no RPGStack v4.7.2