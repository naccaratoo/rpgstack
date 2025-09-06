/**
 * Teste direto dos coeficientes do modal
 * 
 * Simula o comportamento do loadEffectCoefficients
 */

import fs from 'fs/promises';

// Simular as funções do modal
function loadEffectCoefficients(skill) {
    console.log('🔧 Carregando coeficientes para skill:', skill.name);
    console.log('📋 Multi-hit:', skill.multi_hit);
    console.log('🛡️ Buffs:', skill.buffs);
    console.log('⚡ Effects:', skill.effects);
    
    let coefficientsAdded = 0;
    
    // Processar multi-hit
    if (skill.multi_hit) {
        console.log('✅ Adicionando coeficiente multi-hit');
        console.log('   - Hits:', skill.multi_hit.hits);
        console.log('   - Dano por hit:', skill.multi_hit.damage_per_hit);
        console.log('   - Críticos independentes:', skill.multi_hit.independent_crits);
        coefficientsAdded++;
    } else {
        console.log('❌ Multi-hit não encontrado');
    }
    
    // Processar buffs
    if (skill.buffs) {
        Object.keys(skill.buffs).forEach(buffKey => {
            console.log(`✅ Adicionando coeficiente buff: ${buffKey}`);
            console.log(`   - Dados:`, skill.buffs[buffKey]);
            coefficientsAdded++;
        });
    } else {
        console.log('❌ Buffs não encontrados');
    }
    
    // Resultado final
    if (coefficientsAdded === 0) {
        console.log('❌ RESULTADO: Esta skill não possui coeficientes editáveis');
        return false;
    } else {
        console.log(`✅ RESULTADO: Adicionados ${coefficientsAdded} controles de coeficientes`);
        return true;
    }
}

async function testModalCoefficients() {
    try {
        console.log('🧪 Testando carregamento de coeficientes do modal\n');
        
        // Carregar dados das skills
        const skillsData = JSON.parse(await fs.readFile('./data/skills.json', 'utf8'));
        const testSkillId = 'SHIWX001LT';
        const skill = skillsData.skills[testSkillId];
        
        if (!skill) {
            throw new Error(`Skill ${testSkillId} não encontrada`);
        }
        
        console.log(`🎯 Testando skill: ${skill.name}\n`);
        
        // Testar carregamento de coeficientes
        const hasCoefficients = loadEffectCoefficients(skill);
        
        console.log('\n📊 Análise detalhada:');
        
        // Verificar estrutura de dados
        console.log('\n🔍 Verificação de estrutura:');
        console.log('- skill.multi_hit é objeto:', typeof skill.multi_hit === 'object' && skill.multi_hit !== null);
        console.log('- skill.buffs é objeto:', typeof skill.buffs === 'object' && skill.buffs !== null);
        console.log('- skill.effects é array:', Array.isArray(skill.effects));
        
        // Verificar conteúdo
        console.log('\n📝 Verificação de conteúdo:');
        if (skill.multi_hit) {
            console.log('- multi_hit.hits:', skill.multi_hit.hits);
            console.log('- multi_hit.damage_per_hit:', skill.multi_hit.damage_per_hit);
            console.log('- multi_hit.independent_crits:', skill.multi_hit.independent_crits);
        }
        
        if (skill.buffs) {
            console.log('- buffs keys:', Object.keys(skill.buffs));
            Object.entries(skill.buffs).forEach(([key, value]) => {
                console.log(`  - ${key}:`, value);
            });
        }
        
        console.log('\n🎯 CONCLUSÃO:');
        if (hasCoefficients) {
            console.log('✅ A skill DEVE mostrar coeficientes no modal');
            console.log('   Se não está mostrando, o problema é no JavaScript do frontend');
        } else {
            console.log('❌ A skill NÃO tem coeficientes para mostrar');
            console.log('   Isso seria o comportamento esperado');
        }
        
    } catch (error) {
        console.error('❌ Erro durante teste:', error.message);
        console.error('Stack:', error.stack);
    }
}

async function main() {
    console.log('🚀 Teste direto dos coeficientes do modal\n');
    await testModalCoefficients();
    console.log('\n🏁 Teste concluído!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export default main;