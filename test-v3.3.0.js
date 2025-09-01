/**
 * Teste básico para verificar as implementações do RPGStack v3.3.0
 */

import { BattleMechanics } from './src/domain/services/BattleMechanics.js';
import { Character } from './src/domain/entities/Character.js';
import { Skill } from './src/domain/entities/Skill.js';

console.log('🧪 Iniciando testes RPGStack v3.3.0...\n');

// Test 1: Sistema de Classes
console.log('1️⃣ Testando sistema de classes...');
try {
  const skill = Skill.create({
    name: 'Fireball',
    description: 'Bola de fogo mágica',
    type: 'magic',
    classe: 'Arcano',
    level: 1,
    damage: 30,
    anima_cost: 15,
    cooldown: 3
  });
  console.log('✅ Skill criada com classe:', skill.classe);
} catch (error) {
  console.log('❌ Erro ao criar skill:', error.message);
}

// Test 2: Character com novos campos
console.log('\n2️⃣ Testando personagem com novos campos...');
try {
  const character = Character.create({
    name: 'Gandalf',
    level: 5,
    stats: {
      hp: 80,
      maxHP: 100,
      attack: 25,
      defense: 15
    },
    ai_type: 'caster',
    classe: 'Arcano',
    anima: 120,
    critico: 1.2
  });
  console.log('✅ Personagem criado:');
  console.log(`   - Nome: ${character.name}`);
  console.log(`   - Classe: ${character.classe}`);
  console.log(`   - Ânima: ${character.anima}`);
  console.log(`   - Crítico: ${character.critico}`);
} catch (error) {
  console.log('❌ Erro ao criar personagem:', error.message);
}

// Test 3: Battle Mechanics
console.log('\n3️⃣ Testando mecânicas de batalha...');
try {
  const battleMechanics = new BattleMechanics();
  
  // Teste de vantagem
  const hasAdvantage = battleMechanics.hasAdvantage('Lutador', 'Armamentista');
  console.log('✅ Lutador tem vantagem sobre Armamentista:', hasAdvantage);
  
  // Teste de cálculo de dano
  const attacker = { attack: 50, classe: 'Lutador', critico: 1.1 };
  const defender = { defense: 20, classe: 'Armamentista' };
  const damage = battleMechanics.calculateBasicAttackDamage(attacker, defender);
  console.log('✅ Dano calculado com vantagem:', damage);
  
  // Teste de meditação
  const character = { hp: 70, maxHP: 100, anima: 80 };
  const meditation = battleMechanics.meditate(character);
  console.log('✅ Meditação:', meditation.message);
  
} catch (error) {
  console.log('❌ Erro nas mecânicas de batalha:', error.message);
}

// Test 4: Validação de classes
console.log('\n4️⃣ Testando validação de classes...');
try {
  const validClasses = BattleMechanics.getValidClasses();
  console.log('✅ Classes válidas:', validClasses);
  
  const invalidClass = BattleMechanics.isValidClass('Ninja');
  const validClass = BattleMechanics.isValidClass('Lutador');
  console.log('✅ Ninja é válida:', invalidClass);
  console.log('✅ Lutador é válida:', validClass);
} catch (error) {
  console.log('❌ Erro na validação:', error.message);
}

// Test 5: Sistema de defesa
console.log('\n5️⃣ Testando sistema de defesa...');
try {
  const battleMechanics = new BattleMechanics();
  const characterId = 'test-123';
  
  // Definir como defendendo
  battleMechanics.setDefending(characterId, true);
  const isDefending = battleMechanics.isDefending(characterId);
  console.log('✅ Personagem está defendendo:', isDefending);
  
  // Aplicar defesa no dano
  const damage = 50;
  const finalDamage = battleMechanics.applyDefense(damage, characterId);
  console.log('✅ Dano original:', damage, '| Dano após defesa:', finalDamage);
  
  // Reset estado
  battleMechanics.resetTurnStates(characterId);
  const isDefendingAfterReset = battleMechanics.isDefending(characterId);
  console.log('✅ Defendendo após reset:', isDefendingAfterReset);
  
} catch (error) {
  console.log('❌ Erro no sistema de defesa:', error.message);
}

console.log('\n🎉 Testes concluídos!');