# 🎮 RPGStack Server Documentation v4.3
**Servidor Node.js/Express com APIs RESTful para Sistema Cultural de RPG**

---

## 📋 **Visão Geral do Servidor**

### **🚀 Informações Básicas**
- **Versão**: RPGStack Server v3.1.0 (Backend v4.3)
- **Porto**: `3002`
- **URL Base**: `http://localhost:3002`
- **Arquitetura**: Node.js + Express + Clean Architecture
- **Database**: JSON Files com Sistema de Backup
- **Sistema de IDs**: Hexadecimal 10 caracteres (IMUTÁVEL)

### **🎯 Filosofia do Sistema**
- **Chronos Culturalis**: Representação cultural respeitosa
- **Éclat Mystique**: Design Art Nouveau unificado
- **15 Culturas**: Personagens de 15 civilizações diferentes
- **Skills Ancestrais**: Habilidades culturalmente autênticas

---

## 🗂️ **Estrutura de Pastas**

```
rpgstack/
├── server.js                 # Servidor principal
├── package.json              # Dependências e scripts
├── data/                     # 💾 Banco de dados JSON
│   ├── characters.json       # Personagens culturais
│   └── maps.json            # Sistema de mapas
├── assets/                   # 🖼️  Assets estáticos
│   ├── sprites/             # Sprites de personagens
│   └── maps/                # Assets de mapas
├── exports/                  # 🚀 Arquivos exportados
│   └── character_database.js # Export JavaScript
├── backups/                  # 📦 Sistema de backup
│   ├── backup_*/            # Backups com sprites
│   └── maps/                # Backups de mapas
├── public/                   # 🌐 Frontend
│   ├── index.html           # Hub principal
│   ├── battle.html          # Sistema de batalha
│   ├── battle-4v4.html      # Duelo 4v4
│   ├── cultural-characters.html # Personagens culturais
│   ├── character-database.html  # Gerenciamento
│   └── class-database.html      # Classes
└── src/                      # 🏗️  Arquitetura limpa
    ├── application/         # Casos de uso
    ├── domain/              # Entidades e regras
    ├── infrastructure/      # Adaptadores
    └── presentation/        # Controllers
```

---

## 🔧 **Tecnologias e Dependências**

### **📦 Dependências Principais**
```json
{
  "cors": "^2.8.5",           // Cross-Origin Resource Sharing
  "express": "^4.18.2",       // Web framework
  "multer": "^1.4.5-lts.1",   // Upload de arquivos
  "sharp": "^0.34.3"          // Processamento de imagens
}
```

### **🛠️ DevDependencies**
```json
{
  "eslint": "^9.34.0",        // Linting
  "jest": "^30.1.0",          // Testes
  "nodemon": "^3.0.2",        // Auto-reload
  "prettier": "^3.6.2",       // Formatação
  "supertest": "^7.1.4"       // Testes de API
}
```

### **📜 Scripts Disponíveis**
```bash
npm start                    # Iniciar servidor
npm run dev                  # Modo desenvolvimento (nodemon)
npm run lint                 # Verificar código
npm run lint:fix            # Corrigir problemas automaticamente
npm run format              # Formatar código
npm test                    # Executar testes
npm run test:watch          # Testes em modo watch
npm run test:coverage       # Cobertura de testes
```

---

## 🌐 **APIs e Endpoints**

### **🧪 Core System**

#### **GET `/api/test`**
Endpoint de verificação de status da API
```json
{
  "success": true,
  "message": "API funcionando com sistema ID preservado!",
  "timestamp": "2025-09-04T20:43:53.791Z",
  "idSystem": {
    "newCharacters": "Hexadecimal 10 characters",
    "existingCharacters": "Preserved original IDs",
    "immutable": true
  }
}
```

#### **GET `/api/generate-id`**
Gera novo ID hexadecimal único para testes
```json
{
  "id": "A1B2C3D4E5",
  "format": "Hexadecimal 10 characters",
  "example": "Character ID: A1B2C3D4E5"
}
```

---

### **👥 Characters API**

#### **GET `/api/characters`**
Retorna todos os personagens culturais
```json
{
  "characters": {
    "045CCF3515": {
      "id": "045CCF3515",
      "name": "Miloš Železnikov",
      "level": 45,
      "hp": 180,
      "maxHP": 180,
      "attack": 85,
      "defense": 70,
      "defesa_especial": 45,
      "sprite": "assets/sprites/milo_eleznikov.webp",
      "classe": "Artífice",
      "anima": 120,
      "critico": 1.8,
      "skills": ["forja_do_dragao_eslavo"],
      "culture": "Eslava",
      "description": "Mestre ferreiro dos Cárpatos..."
    }
  }
}
```

#### **POST `/api/characters`**
Cria novo personagem com ID hexadecimal
- **Multipart form**: Suporte a upload de sprite
- **ID Sistema**: Gera automaticamente ID único
- **Campos obrigatórios**: name, level, hp, attack, defense

**Exemplo de resposta:**
```json
{
  "success": true,
  "character": { ... },
  "message": "Personagem salvo com ID PERMANENTE: A1B2C3D4E5!",
  "idInfo": {
    "id": "A1B2C3D4E5",
    "type": "HEXADECIMAL",
    "immutable": true,
    "note": "Este ID nunca será alterado e pode ser usado como referência"
  }
}
```

#### **PUT `/api/characters/:id`**
Atualiza personagem existente (ID IMUTÁVEL)
- **ID Preservation**: ID original nunca é alterado
- **Sprite Replacement**: Suporte a nova sprite
- **Timestamps**: Adiciona `updated_at`

#### **DELETE `/api/characters/:id`**
Remove personagem e sua sprite
- **Backup Automático**: Cria backup antes da exclusão
- **Cleanup**: Remove sprite associada do sistema

---

### **🎯 Skills API**

#### **GET `/api/skills`**
Lista todas as habilidades ancestrais
```json
{
  "success": true,
  "skills": [
    {
      "id": "forja_do_dragao_eslavo",
      "name": "Forja do Dragão Eslavo",
      "type": "weapon_craft",
      "culture": "Eslava",
      "classe": "Artífice",
      "mana_cost": 80,
      "damage": 120,
      "description": "Invoca técnicas ancestrais para forjar arma de escamas de dragão",
      "cultural_authenticity": "Baseada em tradições metalúrgicas eslavas dos Cárpatos"
    }
  ]
}
```

#### **GET `/api/skills/search?query=dragao`**
Busca skills por termo
- **Campos**: name, description, culture, type
- **Case-insensitive**: Busca flexível

#### **GET `/api/skills/type/:type`**
Skills por tipo específico
- **Tipos**: weapon_mastery, elemental_cycle, command_magic, prediction, transform, summon, illusion, teleport, charm, divine_healing, mega_heal, weapon_craft, spirit_call

#### **GET `/api/skills/classe/:classe`**
Skills por classe de personagem
- **Classes**: Oráculo, Curandeiro Ritualista, Guardião da Natureza, Artífice, Mercador-Diplomata, Naturalista

#### **POST `/api/skills`**
Criar nova skill ancestral
```json
{
  "name": "Nova Habilidade",
  "type": "elemental",
  "culture": "Japonesa",
  "classe": "Guardião da Natureza",
  "mana_cost": 60,
  "damage": 90,
  "description": "Descrição da habilidade...",
  "cultural_authenticity": "Baseada em tradições..."
}
```

#### **GET `/api/skills/statistics`**
Estatísticas do sistema de skills
```json
{
  "total_skills": 15,
  "by_type": {
    "weapon_craft": 3,
    "elemental_cycle": 2,
    "transform": 2
  },
  "by_culture": {
    "Eslava": 1,
    "Chinesa": 2,
    "Asteca": 1
  },
  "by_classe": {
    "Artífice": 3,
    "Guardião da Natureza": 4
  }
}
```

---

### **🎭 Classes API**

#### **GET `/api/classes`**
Lista todas as classes disponíveis
```json
{
  "success": true,
  "classes": [
    "Oráculo",
    "Curandeiro Ritualista", 
    "Guardião da Natureza",
    "Artífice",
    "Mercador-Diplomata",
    "Naturalista"
  ],
  "total": 6
}
```

#### **POST `/api/classes`**
Adiciona nova classe ao sistema
```json
{
  "className": "Nova Classe"
}
```

#### **DELETE `/api/classes/:className`**
Remove classe (apenas se não estiver em uso)
- **Validação**: Verifica se há personagens usando a classe
- **Proteção**: Impede exclusão de classes em uso

---

### **🗺️ Maps API v2**

#### **GET `/api/v2/maps`**
Sistema completo de mapas
```json
{
  "success": true,
  "maps": [
    {
      "id": "MAP001",
      "name": "Floresta Ancestral",
      "type": "exploration",
      "culture": "Celta",
      "difficulty": "medium",
      "characters": ["character_ids..."],
      "assets": {
        "background": "assets/maps/forest_bg.jpg",
        "music": "assets/audio/celtic_ambient.mp3"
      }
    }
  ]
}
```

---

### **🖼️ Assets API**

#### **GET `/api/sprites`**
Lista todas as sprites disponíveis
```json
{
  "sprites": [
    {
      "filename": "milo_eleznikov.webp",
      "url": "http://localhost:3002/assets/sprites/milo_eleznikov.webp",
      "path": "assets/sprites/milo_eleznikov.webp"
    }
  ],
  "total": 15
}
```

#### **POST `/api/upload-sprite`**
Upload de sprite via base64
```json
{
  "imageData": "data:image/webp;base64,UklGRv...",
  "filename": "personagem.webp"
}
```

#### **POST `/api/rename-sprite`**
Renomear sprite existente
```json
{
  "oldFilename": "old_name.webp",
  "newFilename": "new_name.webp"
}
```

---

### **⚔️ Battle System API**

#### **POST `/api/battle/start`**
Inicia nova batalha
```json
{
  "playerId": "045CCF3515"
}
```

**Resposta:**
```json
{
  "success": true,
  "battle": {
    "id": "a1b2c3d4",
    "player": { ... },
    "enemy": { ... },
    "turn": "player",
    "round": 1
  }
}
```

#### **GET `/api/battle/:battleId`**
Status da batalha atual
```json
{
  "success": true,
  "battle": {
    "id": "a1b2c3d4",
    "player": {
      "name": "Miloš",
      "currentHP": 150,
      "maxHP": 180,
      "currentMP": 40,
      "defending": false
    },
    "enemy": { ... },
    "turn": "player",
    "round": 3,
    "status": "active",
    "log": [...]
  }
}
```

#### **POST `/api/battle/:battleId/action`**
Executar ação de batalha
```json
{
  "action": "attack", // "attack", "defend", "skill", "item"
  "target": "enemy"
}
```

#### **DELETE `/api/battle/:battleId`**
Encerrar batalha
```json
{
  "success": true,
  "message": "Battle ended"
}
```

---

### **📦 Backup System API**

#### **POST `/api/backup`**
Criar backup manual
```json
{
  "success": true,
  "message": "Backup criado com sucesso",
  "filename": "backup_2025-09-04T20-43-53_manual",
  "characters": 15
}
```

#### **GET `/api/backups`**
Listar backups disponíveis
```json
{
  "success": true,
  "backups": [
    {
      "filename": "backup_2025-09-04T20-43-53_manual",
      "timestamp": "2025-09-04T20:43:53.791Z",
      "trigger": "manual",
      "size": 2048576,
      "characters": 15,
      "sprites": 15,
      "includes_sprites": true,
      "type": "folder"
    }
  ]
}
```

#### **POST `/api/restore/:filename`**
Restaurar do backup
```json
{
  "success": true,
  "message": "Banco restaurado com sucesso (15 personagens)",
  "characters": 15
}
```

#### **DELETE `/api/backup/:filename`**
Remover backup específico
```json
{
  "success": true,
  "message": "Backup backup_2025-09-04_manual removido com sucesso"
}
```

---

### **📥📤 Import/Export API**

#### **POST `/api/bulk-import`**
Importação em massa de personagens
- **Formato**: JSON file upload
- **Conflitos**: Auto-resolve com novos IDs
- **Backup**: Cria backup antes da importação

#### **GET `/api/bulk-export`**
Exportação em massa
```json
{
  "exported_at": "2025-09-04T20:43:53.791Z",
  "version": "3.2.0",
  "total_characters": 15,
  "characters": { ... }
}
```

#### **GET `/api/export/js`**
Download do arquivo JavaScript exportado
- **Arquivo**: `character_database.js`
- **Formato**: CommonJS module

---

## 🛡️ **Sistema de Segurança**

### **🔒 ID Immutability System**
- **IDs Existentes**: NUNCA alterados (PRESERVADOS)
- **Novos IDs**: Hexadecimal 10 caracteres
- **Geração**: Crypto-secure random bytes
- **Conflitos**: Auto-resolução com novos IDs únicos
- **Referências**: Seguras para uso em frontends

### **📁 File Upload Security**
```javascript
// Tipos permitidos
const allowedTypes = [
  'image/png', 'image/jpeg', 
  'image/jpg', 'image/gif', 
  'image/webp'
];

// Limits
const limits = {
  fileSize: 2 * 1024 * 1024, // 2MB
  files: 1
};
```

### **🚫 Validation & Sanitization**
- **Input Validation**: Todos os endpoints
- **SQL Injection**: N/A (JSON database)
- **XSS Prevention**: Input sanitization
- **File Type**: MIME type verification
- **Path Traversal**: Secured file paths

---

## 🎮 **Frontend Routes**

### **📄 Static Pages**
```
GET /                        # Hub principal (index.html)
GET /characters             # Database de personagens
GET /skills                 # Database de skills
GET /class-database         # Gerenciamento de classes
GET /maps                   # Database de mapas
GET /battle                 # Sistema de batalha
```

### **🖼️ Static Assets**
```
/assets/sprites/*           # Sprites de personagens
/assets/maps/*              # Assets de mapas  
/public/*                   # Frontend files
```

---

## ⚙️ **Configuração e Inicialização**

### **🚀 Startup Process**
1. **Initialize Directories**: Criar estrutura de pastas
2. **Initialize Database**: Carregar characters.json (SEM alterar IDs)
3. **Initialize Maps System**: Configurar sistema de mapas
4. **Initialize Skills System**: Carregar skills ancestrais
5. **Start Server**: Express listening on port 3002

### **🔧 Environment Variables**
```bash
PORT=3002                   # Porta do servidor (padrão)
NODE_ENV=development        # Ambiente de execução
```

### **📋 Sistema Requirements**
- **Node.js**: >= 18.0.0
- **NPM**: >= 8.0.0
- **Memory**: ~15MB em uso ativo
- **Storage**: ~50MB para assets
- **OS**: Linux, Windows, macOS

---

## 🎯 **Features Específicas v4.3**

### **🎭 Sistema Cultural CHRONOS**
- **15 Personagens**: De 15 culturas diferentes
- **Skills Ancestrais**: 100% culturalmente autênticas
- **6 Classes Civilizacionais**: Especializações temáticas
- **Defesa Especial**: Sistema de resistência mágica
- **Art Nouveau**: Design unificado Éclat Mystique

### **⚔️ Battle System 4v4**
- **Pokemon-style**: Troca estratégica de personagens
- **IA Inteligente**: Comportamento adaptativo
- **Vantagem de Classes**: Sistema balanceado
- **Feedback Visual**: Damage numbers cinematográficos

### **🎨 Visual Features**
- **Éclat Mystique**: Paleta dourada/burgundy/esmeralda
- **Ornamentações**: ⟨ ❦ ⟩ e ◊ symbols
- **Tipografia**: Playfair Display, Cinzel, Dancing Script
- **Responsivo**: Desktop, tablet, mobile

### **📊 Performance Otimizada**
- **Single-file HTML**: 35KB otimizado
- **Zero Dependências**: CSS/JS inline
- **Fast Load**: < 2s loading time
- **Memory Efficient**: ~15MB usage

---

## 📈 **Monitoring e Logs**

### **🔍 Server Logs**
```bash
🎮 RPGStack Server v3.1.0
🔒 Sistema de ID: IMUTÁVEL (IDs existentes PRESERVADOS)
🆕 Novos personagens: HEXADECIMAL (10 caracteres)
🚀 Servidor rodando em: http://localhost:3002

✅ Skills System inicializado com sucesso
🎯 Skills API disponível em /api/skills
✅ Maps System inicializado com sucesso
🌐 Maps API disponível em /api/v2/maps

📋 IDs existentes encontrados (MANTIDOS INTACTOS):
   • Miloš Železnikov: 045CCF3515 (HEX)
   • Shi Wuxing: EA32D10F2D (HEX)
   • Aurelius Ignisvox: A9C4N0001E (LEGACY)
   [...]
✅ Total: 15 personagens preservados
```

### **📊 Health Checks**
- **API Status**: `/api/test`
- **Character Count**: Database total
- **Skills Available**: Skills system status
- **Maps Loaded**: Maps system status
- **Battles Active**: Active battle count

---

## 🔧 **Troubleshooting**

### **❌ Problemas Comuns**

#### **Port 3002 já em uso**
```bash
# Verificar processo
lsof -i :3002

# Matar processo
kill -9 <PID>

# Iniciar servidor
npm start
```

#### **Erro de upload de sprite**
- **Verificar formato**: PNG, JPG, GIF, WEBP
- **Verificar tamanho**: Máximo 2MB
- **Verificar permissões**: assets/sprites/ writable

#### **Character ID conflicts**
- **Sistema Imutável**: IDs existentes NUNCA mudam
- **Auto-resolve**: Novos IDs únicos gerados automaticamente
- **Backup**: Sistema cria backup antes de alterações

#### **Database corruption**
- **Backup System**: Restaurar do backup mais recente
- **JSON Validation**: Verificar estrutura do characters.json
- **Fallback**: Sistema cria novo database se necessário

### **🛠️ Debug Mode**
```bash
# Iniciar com logs detalhados
DEBUG=* npm start

# Verificar status das APIs
curl http://localhost:3002/api/test
curl http://localhost:3002/api/characters
curl http://localhost:3002/api/skills
```

---

## 📚 **Documentação Adicional**

### **🔗 Referencias Relacionadas**
- `/direcao de arte/eclat-mystique-basica.md` - Documentação visual
- `/direcao de arte/chronos_culturalis_philosophy.md` - Filosofia cultural
- `/direcao de arte/cultural_adaptive_game_design.md` - Design adaptativo
- `README.md` - Visão geral do projeto

### **🌐 URLs de Desenvolvimento**
- **Hub Principal**: `http://localhost:3002`
- **API Documentation**: `http://localhost:3002/api/test`
- **Character Database**: `http://localhost:3002/characters`
- **Skills Database**: `http://localhost:3002/skills`
- **Battle System**: `http://localhost:3002/battle`
- **Assets**: `http://localhost:3002/assets/sprites/`

---

## 🎯 **Roadmap Técnico**

### **v4.4 - Skills Expansion**
- [ ] Skills secundárias multiclasse
- [ ] Sistema de combo entre skills
- [ ] Efeitos visuais únicos por skill
- [ ] Progressão baseada em uso cultural

### **v4.5 - Battle Improvements**  
- [ ] Dano mágico vs defesa especial
- [ ] Resistências culturais específicas
- [ ] Sinergia entre culturas aliadas
- [ ] Balanceamento por região geográfica

### **v5.0 - Multiplayer**
- [ ] WebSocket real-time battles
- [ ] Matchmaking system
- [ ] Player rankings
- [ ] Battle replays

---

**📅 Última Atualização**: 04 de setembro de 2025  
**⏱️ Versão do Documento**: v4.3.0  
**🎮 Desenvolvido por**: Claude Code (Anthropic)  
**🌐 Status**: ✅ SERVIDOR ATIVO em http://localhost:3002

*Esta documentação cobre todas as funcionalidades do servidor RPGStack v4.3, incluindo APIs, endpoints, sistemas de segurança e troubleshooting para desenvolvimento e produção.*