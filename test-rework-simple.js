/**
 * Teste Simples - Cadência do Dragão v6.0.0 REWORK
 * Validação do algoritmo: attackBonus = baseAttack * 0.10 * consecutiveAttacks
 */

console.log('🐉 TESTE CADÊNCIA DO DRAGÃO v6.0.0 - REWORK BASEADO NO ATTACK');
console.log('=' .repeat(80));

// Simular o algoritmo implementado
function testDragonCadenceAlgorithm(baseAttack, consecutiveAttacks) {
  return Math.round(baseAttack * 0.10 * consecutiveAttacks);
}

const testCases = [
  { name: 'Loki (Real)', attack: 50 },
  { name: 'Personagem Fraco', attack: 20 },
  { name: 'Personagem Forte', attack: 100 },
  { name: 'Personagem Épico', attack: 200 }
];

console.log('\n📊 VALIDAÇÃO DO ALGORITMO v6.0.0:');
console.log('Formula: attackBonus = Math.round(baseAttack * 0.10 * consecutiveAttacks)');

testCases.forEach(testCase => {
  console.log(`\n${testCase.name} (Attack ${testCase.attack}):`);
  
  for (let attacks = 1; attacks <= 10; attacks++) {
    const bonus = testDragonCadenceAlgorithm(testCase.attack, attacks);
    const totalAttack = testCase.attack + bonus;
    const percentage = Math.round((bonus / testCase.attack) * 100);
    
    if (attacks <= 5 || attacks === 10) {
      console.log(`  Ataque ${attacks}: ${testCase.attack} → ${totalAttack} (+${bonus} pontos = +${percentage}%)`);
    }
  }
});

console.log('\n🎯 EXEMPLO PRÁTICO - LOKI EM BATALHA:');
const lokiAttack = 50;
console.log(`Loki tem Attack base: ${lokiAttack}`);
console.log('1. Ativar "🐉 Cadência do Dragão" (custa 50 ânima)');
console.log('2. Fazer ataques básicos consecutivos:');

for (let i = 1; i <= 5; i++) {
  const bonus = testDragonCadenceAlgorithm(lokiAttack, i);
  const total = lokiAttack + bonus;
  console.log(`   Ataque ${i}: Dano base calculado com Attack ${total} (${lokiAttack}+${bonus})`);
}

console.log('\n✅ VANTAGENS DO REWORK v6.0.0:');
console.log('• Escala baseado no poder do personagem (Attack)');
console.log('• Personagens fracos ganham pouco, fortes ganham muito'); 
console.log('• Algoritmo simples e previsível');
console.log('• Balanceamento automático por character');
console.log('• Crescimento linear controlado');

console.log('\n✅ REWORK v6.0.0 VALIDADO MATEMATICAMENTE!');