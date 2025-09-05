# 📋 Instruções de Documentação do RPGStack

## 📝 **Diretrizes para Manutenção de Documentação**

### 🔄 **Sistema de Changelog**
- **Atualizar o changelog a cada alteração feita**
- **Arquivo atual**: `CHANGELOG0509202500.md` (872 linhas)
- **Limite de arquivo**: 2000 linhas
- **Quando atingir o limite**, criar novo arquivo seguindo a lógica:
  ```
  Changelog+DATADEHOJE+numeracaodecimal(00,01,02 etc...).extensao
  
  Exemplo:
  - Changelog05092025-01.md
  - Changelog05092025-02.md
  ```

### 📁 **Estrutura de Documentação**
- **Sempre criar arquivos .md** ou procurar arquivo .md específico para atualizações
- **Todos os arquivos .md devem ser criados na pasta `/docs`**
- **Exemplo**: Para alterações na API de skills → editar/criar `SKILLS_API_DOCUMENTATION.md` em `/docs`

### 🗂️ **Organização por Assunto**
```
/docs
├── CHANGELOG*.md                    # Histórico de mudanças
├── SKILLS_API_DOCUMENTATION.md     # API de Skills
├── /Reworkbattle                   # Sistema de batalha
├── /segurança                      # Diretrizes de segurança
└── /direcao de arte               # Design e filosofia
```

### ✅ **Processo de Atualização**
1. **Ler todos os arquivos da pasta docs e subpastas**
2. **Ler o README.md**
3. **Atualizar o changelog com cada alteração**
4. **Criar/atualizar documentação específica conforme necessário**
5. **Manter organização por categorias**

### 🎯 **Responsabilidades**
- **Toda sessão deve terminar com changelog atualizado**
- **Mudanças significativas devem ter documentação específica**
- **Manter coerência entre README.md e documentos específicos**
- **Preservar histórico completo de mudanças**

---

## 📊 **Status Atual da Documentação**

### 📋 **Arquivos Principais**
- ✅ **CHANGELOG0509202500.md** - 872 linhas (ativo)
- ✅ **SKILLS_API_DOCUMENTATION.md** - Completo
- ✅ **README.md** - Atualizado v4.7.2

### 📁 **Documentação Especializada**
- ✅ **Sistema de Batalha** - 7 arquivos em `/Reworkbattle`
- ✅ **Diretrizes de Segurança** - 2 arquivos em `/segurança`  
- ✅ **Direção de Arte** - 4 arquivos em `/direcao de arte`

### 🔄 **Próximas Atualizações**
- [ ] Migração de Skills para Backend
- [ ] Sistema de Turnos TCG
- [ ] Habilidades Ancestrais Passivas
- [ ] Integração Skills ↔ Batalhas

---

*Instruções implementadas em conformidade com as diretrizes de documentação do projeto RPGStack*