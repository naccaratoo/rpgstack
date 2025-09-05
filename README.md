# 🎭 RPGStack v4.5 - Sistema de Turnos Refatorado: Arquitetura Modular

**Framework completo para jogos RPG com sistema de batalha 3v3, arquitetura modular e sistema de turnos com timer funcional**

---

## 🚀 **Visão Geral**

O RPGStack é um sistema de RPG web moderno que combina mecânicas clássicas de batalha por turnos com uma identidade visual sofisticada inspirada no Art Nouveau. O projeto apresenta o sistema **Éclat Mystique Universal**, uma implementação elegante que unifica TODAS as interfaces sob uma mesma filosofia visual Art Nouveau, transformando a experiência de jogo em uma jornada aristocrática mística coerente.

### ✨ **Principais Características v4.5**
- 🏗️ **Arquitetura Modular Refatorada** - Separação correta entre lógica (BattleMechanics) e UI (Battle)
- ⏰ **Sistema de Turnos com Timer** - Timer de 20 segundos funcional com callbacks para UI
- 🔄 **Sistema de Trocas Inteligente** - Limitado a 1 troca por turno, não consome ação principal
- 🎯 **Validação de Ações Completa** - Verificações antes de executar qualquer ação
- 🧪 **Suite de Testes Integrados** - Arquivos dedicados para validação do sistema
- 🎮 **Sistema de Batalha 3v3** com interface Art Nouveau elegante
- 📜 **Habilidades Ancestrais (Passivas)** - Sistema completo de passivas culturais únicas
- ⚔️ **15 Skills Culturais Ativas** - Cada personagem com habilidade ancestral autêntica
- 🎭 **Sistema Cultural CHRONOS** - 15 personagens de 15 culturas diferentes
- 🌟 **Defesa Especial (Espírito)** - Mecânica de resistência mágica balanceada
- 🎨 **Design Art Nouveau Unificado** - Todas as páginas com ornamentações ⟨ ❦ ⟩ e ◊
- ⚡ **Performance Otimizada** - 35KB single-file, zero dependências
- 📱 **Totalmente Responsivo** - Desktop, tablet e mobile
- 🌐 **API RESTful** completa para dados de personagens e classes
- ♿ **Acessibilidade WCAG AA** com navegação por teclado

---

## 🎯 **Funcionalidades Principais**

### **🏗️ Sistema de Turnos Refatorado (v4.5)**
- **Arquitetura Modular**: Separação clara entre `battlemechanics.js` (lógica) e `battle.js` (UI)
- **Timer Funcional**: Sistema de 20 segundos por turno com avisos visuais aos 5 segundos
- **Sistema de Callbacks**: Comunicação elegante entre camada lógica e interface
- **Validação Robusta**: Verificações completas antes de executar qualquer ação
- **Sistema de Trocas**: Limitado a 1 troca por turno, não consome ação principal
- **Timeout Automático**: Executa ataque básico quando tempo esgota
- **Testes Integrados**: Suite completa de testes para validação do sistema
- **Compatibilidade Total**: Mantém compatibilidade com sistema 3v3 existente

### **📜 Sistema de Habilidades Ancestrais (Passivas)**
- **7 Passivas Culturais Implementadas** - Habilidades que definem a essência cultural
- **Triggers Únicos**: "Ao Defender", "A cada 5 turnos", "Uso Consecutivo", "Início de Combate"
- **Efeitos Progressivos** - Crescem com uso e permanência no combate
- **Interface Dedicada** - Seção visual exclusiva com cards Art Nouveau
- **Autenticidade Cultural** - Cada passiva reflete genuinamente tradições milenares

### **⚔️ Sistema de Skills Ativas**
- **15 Skills Ancestrais Únicas** - Uma habilidade especial para cada cultura
- **Tipos Variados**: weapon_mastery, elemental_cycle, command_magic, prediction, transform, summon, illusion, teleport, charm, divine_healing, mega_heal, weapon_craft, spirit_call
- **Balanceamento Cultural** - Dano e mana baseados na tradição de cada cultura
- **Descrições Autênticas** - Cada skill reflete genuinamente sua herança cultural
- **100% Cobertura** - Todos os personagens possuem identidade através de suas habilidades

### **🎭 Sistema Cultural CHRONOS**
- **15 Personagens Ancestrais** representando 15 culturas distintas
- **6 Classes Civilizacionais**: Oráculo, Curandeiro Ritualista, Guardião da Natureza, Artífice, Mercador-Diplomata, Naturalista
- **Artefatos Culturais** únicos para cada personagem
- **Interface Art Nouveau** dedicada com filtros por cultura e classe
- **"Dignitas Personae"** - filosofia de representação cultural respeitosa

### **🌟 Sistema de Defesa Especial**
- **Defesa Física**: Reduz dano de ataques básicos e físicos
- **Defesa Especial (Espírito)**: Reduz dano mágico e espiritual
- **Cálculo Balanceado**: Baseado em classe, cultura, nível e ânima
- **Integração Completa**: Suporte em todas as interfaces e batalhas

### **🏆 Duelo Ancestral 4v4**
- Sistema de batalha tática com troca estratégica de personagens
- Vantagem de classes: Lutador > Armamentista > Arcano > Lutador (+20% dano)
- IA inteligente com lógica de comportamento adaptativo
- Interface elegante com feedback visual cinematográfico

### **🎭 Sistema Éclat Mystique**
- Paleta cromática: Dourado (#D4AF37), Burgundy (#722F37), Esmeralda (#355E3B)
- Tipografia hierárquica: Playfair Display, Cinzel, Dancing Script, Georgia
- Ornamentações temáticas e animações suaves
- Nomenclatura aristocrática: "Turno I, II, III", "Crônicas da Batalha"

### **📊 Gerenciamento de Dados**
- Database de personagens com upload de sprites
- Sistema de classes dinâmico e editável
- Integração com skills e habilidades especiais
- Fallback system para máxima disponibilidade

---

## 🛠️ **Instalação e Uso**

### **Pré-requisitos**
- Node.js 14+
- NPM ou Yarn

### **Iniciando o Servidor**
```bash
cd rpgstack
node server.js
```

### **Acesso**
- **Interface Principal**: `http://localhost:3002`
- **Sistema de Batalha**: `http://localhost:3002/battle.html`
- **Duelo 4v4**: `http://localhost:3002/battle-4v4.html`
- **Skills e Passivas**: `http://localhost:3002/skills.html` **(NOVO v4.4)**
- **Personagens Culturais**: `http://localhost:3002/cultural-characters.html`
- **Database de Personagens**: `http://localhost:3002/character-database.html`
- **Database de Classes**: `http://localhost:3002/class-database.html`

---

## 📁 **Estrutura do Projeto**

```
rpgstack/
├── public/                 # Assets e páginas web
│   ├── battle.html        # Sistema de batalha básico (35KB)
│   ├── battle-4v4.html    # Duelo ancestral 4v4 (73KB)
│   ├── skills.html        # Sistema de Skills e Passivas (NOVO v4.4)
│   ├── skills/            # Módulos de skills por personagem
│   │   ├── skill-loader.js          # Engine de carregamento dinâmico
│   │   ├── milos_zeleznikov.js      # Skills eslavas
│   │   ├── shi_wuxing.js           # Skills chinesas
│   │   ├── aurelius_ignisvox.js    # Skills romanas
│   │   ├── pythia_kassandra.js     # Skills gregas
│   │   ├── itzel_nahualli.js       # Skills astecas
│   │   ├── giovanni_da_ferrara.js  # Skills renascentistas
│   │   └── yamazaki_karakuri.js    # Skills japonesas
│   ├── cultural-characters.html  # Sistema Cultural CHRONOS
│   ├── character-database.html   # Gerenciamento de personagens
│   ├── class-database.html      # Gerenciamento de classes
│   ├── skin-manager.html        # Gerenciador de skins
│   └── index.html         # Navegação centralizada
├── data/                  # Dados do jogo
│   └── characters.json    # Database com personagens culturais
├── uploads/               # Sprites de personagens
├── public/Skins/          # Sistema de skins
├── direcao de arte/       # Documentação de design
└── server.js             # Servidor Node.js/Express
```

---

## 🎨 **Sistema de Skins**

### **Éclat Mystique: Básica**
Implementação fundamental do design Art Nouveau, otimizada para performance e compatibilidade máxima.

**Características:**
- Arquivo único HTML com CSS/JS inline
- Paleta de 3 cores principais + neutros
- Ornamentações essenciais do movimento artístico
- Funcionalidades completas de batalha

### **Futuros Temas**
- Éclat Mystique: Premium (elementos 3D ornamentais)
- Temas sazonais e alternativos
- Customização via CSS custom properties

---

## 🔧 **API Endpoints**

### **Personagens**
- `GET /api/characters` - Lista todos os personagens
- `POST /api/characters` - Cria novo personagem
- `PUT /api/characters/:id` - Atualiza personagem
- `DELETE /api/characters/:id` - Remove personagem

### **Classes**
- `GET /api/classes` - Lista todas as classes
- `POST /api/classes` - Cria nova classe
- `DELETE /api/classes/:className` - Remove classe

### **Skills**
- `GET /api/skills` - Lista todas as habilidades
- `GET /api/v2/maps` - Informações de mapas

---

## 🎮 **Controles do Jogo**

### **Atalhos de Teclado**
- **1**: Atacar
- **2**: Defender
- **3**: Meditar
- **4**: Trocar de Herói (4v4)
- **5**: Habilidades
- **ESC**: Cancelar ações/fechar menus

### **Interação**
- **Mouse**: Cliques em todos os elementos
- **Touch**: Interface otimizada para dispositivos móveis
- **Navegação**: Totalmente acessível via teclado

---

## 📊 **Especificações Técnicas**

### **Performance**
- **Carregamento**: < 2s em conexões normais
- **Interativo**: < 1s após carregamento
- **Memory Usage**: ~15MB em uso ativo
- **Compatibilidade**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### **Responsividade**
- **Desktop**: 1200px+ (layout completo com ornamentações)
- **Tablet**: 768px-1200px (flex adaptativo)
- **Mobile**: <768px (grid em coluna, touch-friendly)
- **Small**: <480px (interface otimizada)

---

## 🔮 **Roadmap**

### **v4.4 Release Notes (Atual)**
- ✅ **Habilidades Ancestrais (Passivas)** - 7 passivas culturais implementadas
- ✅ **Interface de Skills Dedicada** - Página `/skills.html` com design Art Nouveau
- ✅ **Sistema Modular de Skills** - Carregamento dinâmico por personagem
- ✅ **Triggers Únicos** - 6 tipos diferentes de ativação de passivas
- ✅ **Documentação Completa** - Sessão 6 adicionada ao reworkbattle.md

### **v4.5 - Expansão de Skills (Planejado)**
- [ ] 8 passivas restantes para personagens não implementados
- [ ] Sistema de combo entre skills culturais
- [ ] Efeitos visuais únicos para cada skill ancestral
- [ ] Progressão de poder baseada em uso cultural

### **v4.5 - Melhorias de Combate**
- [ ] Sistema de dano mágico vs defesa especial
- [ ] Resistências culturais específicas
- [ ] Mecânicas de sinergia entre culturas aliadas
- [ ] Balanceamento avançado por região geográfica

### **v5.0 - Multiplayer**
- [ ] Batalhas online via WebSocket
- [ ] Sistema de matchmaking e ranking
- [ ] Modo espectador
- [ ] Compartilhamento de replays

---

## 🎭 **Filosofia do Projeto**

O RPGStack foi desenvolvido com a filosofia **"Chronos Culturalis"** - uma abordagem que combina elementos culturais históricos com mecânicas de jogo modernas. O movimento Art Nouveau (1890-1910) fornece a base estética, enquanto referências como o jogo "Reverse 1999" inspiram a implementação visual contemporânea.

### **Princípios de Design**
- **Elegância Aristocrática**: Sofisticação sem complexidade excessiva
- **Funcionalidade Primeiro**: Interface clara e intuitiva
- **Autenticidade Cultural**: Elementos genuínos do Art Nouveau
- **Performance Moderna**: Otimização para web atual

---

## 🏆 **Conquistas v4.4**

- ✅ **Habilidades Ancestrais (Passivas)** - 7 passivas culturais implementadas
- ✅ **Interface de Skills Dedicada** - Página `/skills.html` completa
- ✅ **Sistema Modular de Skills** - Carregamento dinâmico por personagem
- ✅ **Design Art Nouveau para Passivas** - Cards elegantes com efeitos
- ✅ **Database de Passivas** - Sistema JavaScript robusto
- ✅ **Triggers Únicos** - 6 tipos diferentes de ativação
- ✅ **Frontend Redesign Completo** - Todas as 7 páginas unificadas com Art Nouveau
- ✅ **Éclat Mystique Universal** - Paleta, tipografia e ornamentação padronizadas
- ✅ **15 Skills Culturais Ativas** - Sistema 100% completo
- ✅ **Sistema Cultural CHRONOS** com 15 personagens de 15 culturas
- ✅ **Defesa Especial (Espírito)** implementada em todo o sistema
- ✅ **6 Classes Civilizacionais** balanceadas com skills temáticas
- ✅ **Skills Ancestrais Autênticas** representando tradições milenares
- ✅ **Interface Cultural Art Nouveau** com filtros avançados
- ✅ **Sistema de Batalha 4v4** Pokemon-style implementado
- ✅ **Estética Art Nouveau Completa** com skin Éclat Mystique
- ✅ **Navegação Centralizada** via interface unificada
- ✅ **Performance Otimizada** com arquivos single-file
- ✅ **API RESTful Completa** para todos os dados
- ✅ **Responsividade Total** em todos os dispositivos
- ✅ **Acessibilidade WCAG AA** implementada
- ✅ **Coerência Visual Total** - Experiência unificada em todas as telas

---

## 📜 **Habilidades Ancestrais (Passivas) Implementadas**

### **🔨 Maestria Ancestral da Forja** (Miloš Železnikov - Eslava)
**Trigger:** Ao Defender • **Efeito:** +20% poder próxima forja, +15% chance Arma Draconiana

### **☯️ Ciclo Perpétuo dos Elementos** (Shi Wuxing - Chinesa Imperial)
**Trigger:** A cada 5 turnos • **Efeito:** Regenera 20+ MP, +10% maestria elemental por ciclo

### **⚔️ Disciplina Militar Romana** (Aurelius Ignisvox - Romana Imperial)
**Trigger:** Uso Consecutivo • **Efeito:** +5% veterano por uso, rank comando escala até 5

### **🔮 Visão Oracular Contínua** (Pythia Kassandra - Grega Clássica)
**Trigger:** Início de Combate • **Efeito:** Insight inicial nível 1, +1 sabedoria por skill

### **🐆 Conexão Espiritual Animal** (Itzel Nahualli - Azteca/Mexica)
**Trigger:** Por Transformação • **Efeito:** +15 energia espiritual por forma, progresso permanente

### **🎨 Genialidade Renascentista** (Giovanni da Ferrara - Italiana Renascentista)
**Trigger:** Ao Criar Invenções • **Efeito:** +10 inspiração por criação, +15% qualidade

### **⚙️ Harmonia Mecânica Perfeita** (Yamazaki Karakuri - Japonesa Edo)
**Trigger:** Karakuri Ativos • **Efeito:** +15 harmonia por Karakuri, bônus multiplicativo

---

## ⚔️ **Showcase de Skills Ativas Culturais**

### **🔨 Forja do Dragão Eslavo** (Miloš Železnikov)
*Cultura Eslava* - Invoca técnicas ancestrais para forjar arma de escamas de dragão

### **🌊 Ciclo dos Cinco Elementos** (Shi Wuxing) 
*Cultura Chinesa* - Canaliza Wu Xing (五行): Madeira → Fogo → Terra → Metal → Água

### **🏛️ Decreto Senatorial Arcano** (Aurelius Ignisvox)
*Cultura Romana* - Combina autoridade política com poder arcano em decreto mágico

### **🔮 Visão Oracular Délfica** (Pythia Kassandra)
*Grécia Antiga* - Prevê o futuro através dos vapores sagrados de Delphi

### **🐆 Transformação Jaguar** (Itzel Nahualli)
*Asteca/Mexica* - Transforma-se em jaguar durante rituais de sangue

### **⚙️ Autômato Celestial** (Giovanni da Ferrara)
*Renascimento Italiano* - Cria autômatos movidos por engrenagens celestiais

### **🎭 Boneca Viva** (Yamazaki Karakuri)
*Japão Período Edo* - Bonecas karakuri que imitam vida humana

### **🌪️ Chamado dos Quatro Ventos** (Aiyana Windtalker)
*Lakota/Dakota* - Invoca espíritos dos ventos das Grandes Planícies

### **🐺 Fúria do Fenrir** (Björn Ulfhednar)
*Viking/Nórdico* - Canaliza o espírito do lobo primordial

### **✨ Tapete das Mil e Uma Noites** (Hadji Abdul-Rahman)
*Califado Abássida* - Tapete voador tecido com fios de luz estelar

### **🍵 Chá da Revelação** (Lady Catherine Ashworth)
*Inglaterra Vitoriana* - Serviço de chá que revela segredos alheios

### **🪙 Leitura dos 256 Odús** (Babalawo)
*Reino de Oyó/Iorubá* - Divinhação através dos 256 caminhos do Ifá

### **🧪 Elixir da Imortalidade Russa** (Dr. Dmitri Raskolnikov)
*Império Russo* - Frasco de vodka benta com propriedades regenerativas

### **💎 Forja de Jade Imperial** (Mei Lin "Punhos de Jade")
*China Imperial* - Transforma qi em jade sólido para criar armas

### **🥁 Tambores Ancestrais** (Kwame Asante)
*Reino Ashanti/Gana* - Tambores falantes que se comunicam com ancestrais

---

## 📚 **Documentação**

- `/direcao de arte/eclat-mystique-basica.md` - Especificação da skin básica
- `/direcao de arte/eclat-mystique-duelo-ancestral.md` - Documentação visual completa
- `/CHANGELOG-v4.0.md` - Notas de lançamento detalhadas
- Documentação técnica disponível nos arquivos de direção de arte

---

## 👥 **Créditos**

**Desenvolvimento**: Claude Code (Anthropic)  
**Design System**: Baseado em Art Nouveau + Reverse 1999  
**Inspiração**: Gustav Klimt, Alphonse Mucha  
**Filosofia**: Chronos Culturalis approach  

---

## 📄 **Licença**

Este projeto é desenvolvido para fins educacionais e de demonstração. Para uso comercial, consulte os termos apropriados.

---

**🎮 RPGStack v4.4** - *"Habilidades Ancestrais: Passivas Culturais que Definem Identidade"*

*Sistema completo de skills ativas e passivas culturalmente autênticas com interface Art Nouveau unificada*