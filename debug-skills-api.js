/**
 * Script de Debug: API de Skills
 * 
 * Testa se a API está retornando dados no formato correto para o modal
 */

import fetch from 'node-fetch';

async function debugSkillsAPI() {
    console.log('🔍 Debugando API de Skills...\n');
    
    const baseUrl = 'http://localhost:3002';
    
    try {
        // Teste 1: Endpoint /api/skills (todos)
        console.log('📋 Teste 1: GET /api/skills');
        const allResponse = await fetch(`${baseUrl}/api/skills`);
        const allData = await allResponse.json();
        
        console.log('Status:', allResponse.status);
        console.log('Estrutura da resposta:');
        console.log('- success:', allData.success);
        console.log('- data.skills é array:', Array.isArray(allData.data?.skills));
        console.log('- data.skills tipo:', typeof allData.data?.skills);
        console.log('- Quantidade de skills:', allData.data?.totalCount || Object.keys(allData.data?.skills || {}).length);
        
        if (allData.data?.skills) {
            const skills = Array.isArray(allData.data.skills) 
                ? allData.data.skills 
                : Object.values(allData.data.skills);
            
            console.log('- Primeira skill ID:', skills[0]?.id);
            console.log('- Primeira skill tem multi_hit:', !!skills[0]?.multi_hit);
            console.log('- Primeira skill tem buffs:', !!skills[0]?.buffs);
        }
        
        console.log('\n');
        
        // Teste 2: Endpoint /api/skills/:id (individual)
        const testSkillId = 'SHIWX001LT';
        console.log(`📋 Teste 2: GET /api/skills/${testSkillId}`);
        const singleResponse = await fetch(`${baseUrl}/api/skills/${testSkillId}`);
        const singleData = await singleResponse.json();
        
        console.log('Status:', singleResponse.status);
        console.log('Estrutura da resposta:');
        console.log('- success:', singleData.success);
        console.log('- data.skill existe:', !!singleData.data?.skill);
        
        if (singleData.data?.skill) {
            const skill = singleData.data.skill;
            console.log('- Skill ID:', skill.id);
            console.log('- Skill nome:', skill.name);
            console.log('- Tem multi_hit:', !!skill.multi_hit);
            console.log('- Tem buffs:', !!skill.buffs);
            console.log('- Effects:', skill.effects);
            
            if (skill.multi_hit) {
                console.log('- Multi-hit hits:', skill.multi_hit.hits);
                console.log('- Multi-hit damage_per_hit:', skill.multi_hit.damage_per_hit);
            }
            
            if (skill.buffs) {
                console.log('- Buffs keys:', Object.keys(skill.buffs));
            }
        }
        
        console.log('\n');
        
        // Teste 3: Verificar se skill tem coeficientes editáveis
        console.log('📋 Teste 3: Verificação de coeficientes editáveis');
        
        if (singleData.success && singleData.data?.skill) {
            const skill = singleData.data.skill;
            let coefficientsFound = 0;
            
            if (skill.multi_hit) {
                console.log('✅ Multi-hit encontrado:', skill.multi_hit);
                coefficientsFound++;
            } else {
                console.log('❌ Multi-hit não encontrado');
            }
            
            if (skill.buffs) {
                console.log('✅ Buffs encontrados:', Object.keys(skill.buffs));
                coefficientsFound += Object.keys(skill.buffs).length;
            } else {
                console.log('❌ Buffs não encontrados');
            }
            
            console.log(`\n📊 Total de coeficientes encontrados: ${coefficientsFound}`);
            
            if (coefficientsFound > 0) {
                console.log('✅ A skill DEVERIA mostrar coeficientes editáveis');
            } else {
                console.log('❌ A skill NÃO TEM coeficientes editáveis');
            }
        }
        
    } catch (error) {
        console.error('❌ Erro durante debug:', error.message);
        console.error('Stack:', error.stack);
    }
}

async function main() {
    console.log('🚀 Iniciando debug da API de Skills');
    console.log('   Certifique-se de que o servidor está rodando na porta 3002\n');
    
    await debugSkillsAPI();
    
    console.log('\n🏁 Debug concluído!');
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export default main;