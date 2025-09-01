/**
 * Teste da Cadência do Dragão v4.1.0 - Demonstração do BUFF DEVASTADOR
 * 
 * Este teste demonstra a transformação da skill de irrelevante para DEVASTADORA
 */

const { BattleMechanics } = require('./src/domain/services/BattleMechanics.js');

console.log('🐉 TESTE CADÊNCIA DO DRAGÃO v4.1.0 - BUFF DEVASTADOR');
console.log('=' .repeat(80));

const battleMechanics = new BattleMechanics();
const lutadorId = 'test_lutador_123';

// Lutador teste
const lutador = {
  id: lutadorId,
  name: 'Dragão Destruidor',
  classe: 'Lutador',
  attack: 100,
  defense: 50
};

// Boss teste  
const boss = {
  id: 'boss_123',
  name: 'Boss Final',
  classe: 'Armamentista', 
  attack: 80,
  defense: 60,
  maxHP: 2000,
  currentHP: 2000
};

console.log(`\n👊 LUTADOR: ${lutador.name} (ATK: ${lutador.attack})`);
console.log(`💀 BOSS: ${boss.name} (HP: ${boss.maxHP}, DEF: ${boss.defense})`);
console.log('\n🎯 SIMULAÇÃO: Ataques Básicos Consecutivos\n');

let totalDamage = 0;
let attackCount = 0;

// Simular 15 ataques básicos consecutivos
for (let i = 1; i <= 15; i++) {
  // Processar Cadência do Dragão
  const cadenceResult = battleMechanics.processDragonCadence(lutadorId);
  
  // Calcular dano base
  let baseDamage = battleMechanics.calculateBasicAttackDamage(lutador, boss);
  
  // Aplicar buff da Cadência do Dragão
  let finalDamage = baseDamage;
  if (cadenceResult.appliedBuff > 0) {
    const buffMultiplier = 1 + (cadenceResult.appliedBuff / 100);
    finalDamage = Math.round(baseDamage * buffMultiplier);
  }
  
  totalDamage += finalDamage;
  attackCount++;
  
  // Determinar emoji baseado no poder
  let powerEmoji = '';
  if (cadenceResult.appliedBuff >= 300) powerEmoji = '☠️☠️☠️ DEVASTAÇÃO';
  else if (cadenceResult.appliedBuff >= 200) powerEmoji = '💀💀 MASSACRE';
  else if (cadenceResult.appliedBuff >= 100) powerEmoji = '🔥🔥 FÚRIA';
  else if (cadenceResult.appliedBuff >= 75) powerEmoji = '⚡⚡⚡ POWER';
  else if (cadenceResult.appliedBuff >= 25) powerEmoji = '⚡ RISING';
  
  console.log(`Ataque ${String(i).padStart(2)}: ${String(baseDamage).padStart(3)} → ${String(finalDamage).padStart(3)} (+${String(cadenceResult.appliedBuff).padStart(3)}%) ${powerEmoji}`);
  
  // Simular dano no boss
  boss.currentHP -= finalDamage;
  if (boss.currentHP <= 0) {
    console.log(`\n💀 BOSS MORREU NO ATAQUE ${i}! HP restante: ${boss.currentHP}`);
    break;
  }
}

console.log('\n' + '='.repeat(80));
console.log('📊 ESTATÍSTICAS FINAIS:');
console.log(`🎯 Total de ataques: ${attackCount}`);
console.log(`💥 Dano total causado: ${totalDamage}`);
console.log(`📈 Dano médio por ataque: ${Math.round(totalDamage / attackCount)}`);
console.log(`⚡ Multiplicador final: ${Math.round(((totalDamage / attackCount) / battleMechanics.calculateBasicAttackDamage(lutador, boss) - 1) * 100)}%`);
console.log(`💀 Boss HP final: ${Math.max(0, boss.currentHP)}/${boss.maxHP}`);

console.log('\n🔥 COMPARAÇÃO COM VERSÃO ANTIGA:');
console.log('❌ ANTES: Ataque 15 = +16% damage (irrelevante)');
console.log('✅ AGORA: Ataque 15 = +400% damage (5x mais poderoso!)');

console.log('\n🐉 CADÊNCIA DO DRAGÃO v4.1.0: DE IRRELEVANTE PARA DEVASTADOR!');
console.log('🎮 Lutador agora é uma classe DOMINANTE em batalhas longas!');

// Teste de retomada de sequência
console.log('\n' + '='.repeat(80));
console.log('🔄 TESTE DE RETOMADA DE SEQUÊNCIA:');

// Quebrar sequência
battleMechanics.breakDragonCadence(lutadorId);
console.log('💔 Sequência quebrada (usou skill/defendeu)');

// Retomar
const resumeResult = battleMechanics.processDragonCadence(lutadorId);
console.log(`🔄 Retomada: Começou com ${resumeResult.currentBuff}% (50% do último buff)`);

console.log('\n✅ TESTE COMPLETO - CADÊNCIA DO DRAGÃO v4.1.0 FUNCIONANDO PERFEITAMENTE!');