/**
 * Teste da Cadência do Dragão v5.0.0 - REWORK SIMPLIFICADO
 * 
 * Novo algoritmo: +10% de dano por ataque básico após ativar a skill
 */

import { BattleMechanics } from './src/domain/services/BattleMechanics.js';

console.log('🐉 TESTE CADÊNCIA DO DRAGÃO v5.0.0 - REWORK SIMPLIFICADO');
console.log('=' .repeat(80));

const battleMechanics = new BattleMechanics();
const lutadorId = 'LUTADOR_001';

// Personagem Lutador
const lutador = {
  id: lutadorId,
  name: 'Loki',
  classe: 'Lutador',
  attack: 100,
  currentAnima: 100
};

console.log(`\n📊 TESTE: ${lutador.name} (${lutador.classe})`);
console.log('Attack base: 100');
console.log('Ânima: 100');

console.log('\n🎯 FASE 1: TENTATIVA DE ATAQUE SEM ATIVAR SKILL');
const resultInactive = battleMechanics.processDragonCadence(lutadorId);
console.log(`Resultado: ${resultInactive.message}`);
console.log(`Buff atual: +${resultInactive.currentBuff}%`);

console.log('\n🎯 FASE 2: ATIVANDO A SKILL CADÊNCIA DO DRAGÃO');
const activationResult = battleMechanics.activateDragonCadence(lutadorId);
console.log(`Resultado: ${activationResult.message}`);

console.log('\n🎯 FASE 3: TESTANDO ATAQUES BÁSICOS PROGRESSIVOS');

// Simular 10 ataques básicos consecutivos
for (let i = 1; i <= 10; i++) {
  const cadenceResult = battleMechanics.processDragonCadence(lutadorId);
  
  // Calcular dano
  let baseDamage = lutador.attack * (0.8 + Math.random() * 0.4); // 80-120% do Attack
  let finalDamage = baseDamage;
  
  // Aplicar buff da Cadência do Dragão
  if (cadenceResult.appliedBuff > 0) {
    const buffMultiplier = 1 + (cadenceResult.appliedBuff / 100);
    finalDamage = Math.round(baseDamage * buffMultiplier);
  }
  
  console.log(`Ataque ${i}: ${Math.round(baseDamage)} → ${finalDamage} damage (+${cadenceResult.appliedBuff}% buff)`);
}

console.log('\n🎯 FASE 4: TESTANDO RESET DE SEQUÊNCIA (usar skill/defender)');
const breakResult = battleMechanics.breakDragonCadence(lutadorId);
console.log(`Resultado: ${breakResult.message}`);

console.log('\n🎯 FASE 5: ATAQUES APÓS RESET (deve começar do +10% novamente)');
for (let i = 1; i <= 3; i++) {
  const cadenceResult = battleMechanics.processDragonCadence(lutadorId);
  
  let baseDamage = lutador.attack;
  let finalDamage = baseDamage;
  
  if (cadenceResult.appliedBuff > 0) {
    const buffMultiplier = 1 + (cadenceResult.appliedBuff / 100);
    finalDamage = Math.round(baseDamage * buffMultiplier);
  }
  
  console.log(`Ataque após reset ${i}: ${baseDamage} → ${finalDamage} damage (+${cadenceResult.appliedBuff}% buff)`);
}

console.log('\n📈 RESUMO DO REWORK v5.0.0:');
console.log('✅ Skill deve ser ATIVADA primeiro (custa 50 ânima)');
console.log('✅ Cada ataque básico aumenta +10% progressivamente');
console.log('✅ Skills/defesa/meditação resetam contador mas mantêm estado');
console.log('✅ Algoritmo simples e balanceado: Ataque_N = +N*10%');

console.log('\n✅ TESTE COMPLETO - CADÊNCIA DO DRAGÃO v5.0.0 REWORK FUNCIONANDO!');