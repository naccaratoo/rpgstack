# Deprecated Files - RPGStack

Este diretório contém arquivos que foram **DEPRECIADOS** por motivos de segurança.

## ⚠️ AVISO DE SEGURANÇA

### battlemechanics-insecure.js
- **INSEGURO**: Pode ser modificado via inspecionar elemento
- **VULNERÁVEL**: Cálculos de dano feitos no cliente
- **SUBSTITUÍDO POR**: `/src/battle/BattleMechanics.js` (backend seguro)
- **CLIENTE SEGURO**: `/public/secure-battle-client.js`

## 🔐 Sistema Anti-Cheat Atual

O sistema atual usa:
1. **Backend**: Fórmulas de dano oficiais em `/src/battle/BattleMechanics.js`
2. **Cliente**: Comunicação segura via `/public/secure-battle-client.js`
3. **APIs**: Rotas seguras `/api/secure-battle/*`

## 📋 Status da Migração

- ✅ Fórmulas de dano migradas para backend
- ✅ Validações de equipe migradas
- ✅ Sistema de IA migrado
- ✅ Sistema de swaps migrado
- ✅ Status effects migrados
- ✅ Frontend refatorado para usar APIs seguras
- ✅ battlemechanics.js removido do sistema ativo

**Data da depreciação:** 05/09/2025
**Motivo:** Implementação de sistema anti-cheat completo