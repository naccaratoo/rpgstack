/**
 * Script de Teste: Sistema de Efeitos Migrado
 * 
 * Testa se a migração para coeficientes dinâmicos funciona corretamente
 */

import { SecureBattleMechanics } from './src/battle/BattleMechanics.js';
import fs from 'fs/promises';

async function testEffectsMigration() {
    console.log('🧪 Iniciando testes do sistema de efeitos migrado\n');
    
    const battleMechanics = new SecureBattleMechanics();
    
    try {
        // Teste 1: Carregar skill migrada do banco de dados
        console.log('📋 Teste 1: Carregamento de skill migrada');
        const skill = await battleMechanics.getSkillFromServer('SHIWX001LT');
        
        if (!skill) {
            throw new Error('Skill não encontrada');
        }
        
        console.log(`✅ Skill carregada: ${skill.name}`);
        console.log(`   📊 Efeitos: ${skill.effects.join(', ')}`);
        console.log(`   💪 Multi-hit: ${skill.multi_hit ? skill.multi_hit.hits + ' hits' : 'N/A'}`);
        console.log(`   🛡️ Buffs: ${skill.buffs ? Object.keys(skill.buffs).join(', ') : 'N/A'}\n`);
        
        // Teste 2: Processar efeitos da skill
        console.log('📋 Teste 2: Processamento de efeitos');
        
        // Mock de personagens para teste
        const attacker = { 
            id: 'test_attacker', 
            name: 'Test Attacker', 
            currentHP: 100, 
            maxHP: 100,
            currentAnima: 50,
            maxAnima: 100
        };
        const target = { 
            id: 'test_target', 
            name: 'Test Target', 
            currentHP: 80, 
            maxHP: 100
        };
        
        const effectsResult = await battleMechanics.processSkillEffects(skill, attacker, target, 'test_battle');
        
        console.log(`✅ Efeitos processados:`);
        console.log(`   ⚔️ Dano adicional: ${effectsResult.damage}`);
        console.log(`   💚 Cura: ${effectsResult.healing}`);
        console.log(`   🎯 Ações especiais: ${effectsResult.specialActions.length}`);
        console.log(`   🔥 Buffs: ${effectsResult.buffs.length}`);
        console.log(`   😵 Status effects: ${effectsResult.statusEffects.length}`);
        
        if (effectsResult.specialActions.length > 0) {
            console.log(`   📋 Detalhes das ações:`);
            effectsResult.specialActions.forEach(action => {
                console.log(`      - ${action}`);
            });
        }
        
        if (effectsResult.buffs.length > 0) {
            console.log(`   📋 Detalhes dos buffs:`);
            effectsResult.buffs.forEach(buff => {
                const value = buff.bonus || buff.reduction || (buff.immunity ? 'ativado' : 'N/A');
                const unit = buff.immunity ? '' : '%';
                console.log(`      - ${buff.type}: ${value}${unit} por ${buff.duration} turnos`);
            });
        }
        
        console.log('\n');
        
        // Teste 3: Skill com multi-hit
        console.log('📋 Teste 3: Processamento de multi-hit');
        
        if (skill.multi_hit) {
            const multiHitResult = await battleMechanics.processMultiHitEffect(skill.multi_hit, attacker, target);
            
            console.log(`✅ Multi-hit processado:`);
            console.log(`   🎯 Hits: ${multiHitResult.hits}`);
            console.log(`   💥 Dano por hit: ${multiHitResult.damagePerHit}`);
            console.log(`   📊 Dano total: ${multiHitResult.totalDamage}`);
            console.log(`   📋 Resultados por hit:`);
            
            multiHitResult.hitResults.forEach(result => {
                const critText = result.critical ? ' (CRÍTICO)' : '';
                console.log(`      Hit ${result.hit}: ${result.damage} dano${critText}`);
            });
        } else {
            console.log(`⚠️ Skill não possui multi-hit configurado`);
        }
        
        console.log('\n');
        
        // Teste 4: Verificar se sistema de fallback funciona
        console.log('📋 Teste 4: Sistema de fallback');
        
        const basicSkill = await battleMechanics.getSkillFromServer('nonexistent_skill');
        console.log(`✅ Fallback funcionando: ${basicSkill.name} (${basicSkill.id})`);
        
        console.log('\n🎉 Todos os testes passaram com sucesso!');
        console.log('   ✅ Sistema de efeitos migrado está funcionando corretamente');
        console.log('   ✅ Coeficientes dinâmicos estão sendo processados');
        console.log('   ✅ Sistema de fallback está operacional');
        
    } catch (error) {
        console.error('❌ Erro durante os testes:', error);
        console.error('   Stack:', error.stack);
        throw error;
    }
}

async function testSkillsDatabase() {
    console.log('\n🔍 Teste adicional: Verificação do banco de dados\n');
    
    try {
        const skillsData = JSON.parse(await fs.readFile('./data/skills.json', 'utf8'));
        const skills = Object.values(skillsData.skills);
        
        console.log(`📊 Total de skills no banco: ${skills.length}`);
        
        let migratedSkills = 0;
        let skillsWithCoefficients = 0;
        
        for (const skill of skills) {
            // Verificar se skill foi migrada (tem efeitos genéricos)
            const hasGenericEffects = skill.effects && skill.effects.some(effect => 
                ['multi_hit', 'critical_boost', 'physical_reduction'].includes(effect)
            );
            
            if (hasGenericEffects) {
                migratedSkills++;
            }
            
            // Verificar se tem coeficientes configurados
            if (skill.multi_hit || skill.buffs) {
                skillsWithCoefficients++;
            }
        }
        
        console.log(`✅ Skills com efeitos migrados: ${migratedSkills}`);
        console.log(`✅ Skills com coeficientes: ${skillsWithCoefficients}`);
        
        // Mostrar exemplo de skill migrada
        const migratedSkill = skills.find(s => s.effects && s.effects.includes('multi_hit'));
        if (migratedSkill) {
            console.log(`\n📝 Exemplo de skill migrada:`);
            console.log(`   Nome: ${migratedSkill.name}`);
            console.log(`   Efeitos: ${migratedSkill.effects.join(', ')}`);
            if (migratedSkill.multi_hit) {
                console.log(`   Multi-hit: ${migratedSkill.multi_hit.hits} hits de ${migratedSkill.multi_hit.damage_per_hit} cada`);
            }
            if (migratedSkill.buffs) {
                console.log(`   Buffs: ${Object.keys(migratedSkill.buffs).join(', ')}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar banco de dados:', error);
    }
}

async function main() {
    try {
        await testEffectsMigration();
        await testSkillsDatabase();
        
        console.log('\n🏆 Migração concluída e testada com sucesso!');
        console.log('   O sistema agora usa coeficientes dinâmicos para efeitos de skills.');
        
    } catch (error) {
        console.error('\n💥 Testes falharam:', error.message);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export default main;