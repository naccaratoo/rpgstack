# Classes do RPGStack

## advantagePool - Classes Disponíveis

O `advantagePool` do ClassGenerator.js contém todas as classes que podem ser usadas como vantagens e desvantagens na geração algorítmica de classes:

### Classes Principais do Sistema
- **Lutador** 🥊 - Especialista em combate corpo a corpo
- **Armamentista** 🏹 - Mestre em armas à distância e equipamentos
- **Arcano** ✨ - Especialista em magia e artes místicas
- **Assassino** 🗡️ - Especialista em ataques furtivos e críticos
- **Paladino** ⚔️ - Guerreiro sagrado com poderes divinos
- **Druida** 🌿 - Conectado com a natureza e transformações
- **Necromante** 💀 - Mestre da magia da morte e não-mortos
- **Bardo** 🎵 - Artista que usa música e conhecimento como arma
- **Ranger** 🏹 - Explorador e rastreador especialista em sobrevivência
- **Monge** 🥋 - Lutador disciplinado com poderes internos
- **Universal** 🌟 - Classe versátil compatível com todas as habilidades

### Classes Adicionais
- **Guerreiro** ⚔️ - Combatente tradicional focado em força
- **Mago** 🔮 - Conjurador de magias elemental
- **Clérigo** ✨ - Curandeiro com poderes divinos
- **Ladino** 🔓 - Especialista em stealth e habilidades furtivas
- **Bárbaro** 🪓 - Lutador feroz com fúria descontrolada
- **Feiticeiro** ⚡ - Usuário inato de magia elemental
- **Bruxo** 🌙 - Praticante de magia sombria e contratos místicos
- **Explorador** 🗺️ - Aventureiro especialista em descobertas
- **Caçador** 🏹 - Especialista em rastrear e abater presas
- **Guardião** 🛡️ - Protetor dedicado à defesa
- **Místico** 🔮 - Buscador de conhecimentos ocultos
- **Elementalista** 🌊 - Controlador dos elementos naturais
- **Invocador** 👹 - Especialista em convocar criaturas
- **Templário** ⛪ - Guerreiro sagrado da ordem
- **Xamã** 🌟 - Curandeiro espiritual e guia ancestral

## Implementação

O `advantagePool` é usado pelo ClassGenerator.js para:

1. **Gerar Vantagens** - Classes escolhidas aleatoriamente que beneficiam o personagem
2. **Gerar Desvantagens** - Classes que representam fraquezas ou limitações
3. **Balanceamento** - Sistema de vantagens vs desvantagens para equilíbrio

### Exemplo de Uso
```javascript
const { advantages, disadvantages } = this.generateAdvantages();
// advantages: ['Lutador', 'Arcano'] - Bônus de combate e magia
// disadvantages: ['Bárbaro'] - Penalidade em controle/estratégia
```

## Localização no Código
- **Arquivo:** `/public/ClassGenerator.js`
- **Linha:** 27-33
- **Total:** 26 classes disponíveis no pool