/**
 * Script de Migração: Efeitos Hardcoded → Sistema de Coeficientes
 * 
 * Migra efeitos como "multi_hit_5x", "critical_boost_20%" para sistema
 * genérico com coeficientes dinâmicos por skill.
 */

import fs from 'fs/promises';
import path from 'path';

const DATA_PATH = './data/skills.json';
const BACKUP_PATH = './data/skills_backup_before_coefficients_migration.json';

// Mapeamento de efeitos hardcoded para genéricos
const EFFECT_MIGRATIONS = {
    // Multi-hit effects
    'multi_hit_5x': {
        newEffect: 'multi_hit',
        coefficients: {
            hits: 5,
            damage_per_hit: null, // Será extraído da skill
            independent_crits: true,
            total_damage_potential: null // Calculado automaticamente
        }
    },
    
    // Critical boost effects
    'critical_boost_20%': {
        newEffect: 'critical_boost',
        coefficients: {
            bonus: 20,
            duration: null, // Será extraído da skill.duration ou default
            description: 'Aumenta chance crítica em 20%'
        }
    },
    
    // Physical reduction effects
    'physical_reduction_80%': {
        newEffect: 'physical_reduction',
        coefficients: {
            reduction_percentage: 80,
            duration: null,
            description: 'Ataque físico reduzido em 80%'
        }
    }
};

// Efeitos que já são genéricos (não precisam migração)
const GENERIC_EFFECTS = [
    'intangibility',
    'spiritual_stun', 
    'healing',
    'purification',
    'pacify',
    'nature_unity',
    'projectile_deflection',
    'terrain_absorption',
    'movement_harmony',
    'qi_waves',
    'vitality_restoration',
    'critical_immunity'
];

async function backupData() {
    try {
        const data = await fs.readFile(DATA_PATH, 'utf8');
        await fs.writeFile(BACKUP_PATH, data, 'utf8');
        console.log(`✅ Backup criado: ${BACKUP_PATH}`);
    } catch (error) {
        console.error('❌ Erro ao criar backup:', error);
        throw error;
    }
}

function migrateSkillEffects(skill) {
    const migratedSkill = { ...skill };
    const newEffects = [];
    let hasChanges = false;
    
    // Processar cada efeito
    for (const effect of skill.effects || []) {
        if (EFFECT_MIGRATIONS[effect]) {
            const migration = EFFECT_MIGRATIONS[effect];
            
            // Adicionar efeito genérico
            if (!newEffects.includes(migration.newEffect)) {
                newEffects.push(migration.newEffect);
            }
            
            // Configurar coeficientes baseado no tipo
            switch (migration.newEffect) {
                case 'multi_hit':
                    migratedSkill.multi_hit = {
                        ...migration.coefficients,
                        damage_per_hit: skill.damage || 15,
                        total_damage_potential: (migration.coefficients.hits * (skill.damage || 15))
                    };
                    break;
                    
                case 'critical_boost':
                    if (!migratedSkill.buffs) migratedSkill.buffs = {};
                    migratedSkill.buffs.critical_rate = {
                        ...migration.coefficients,
                        duration: skill.duration || 2
                    };
                    break;
                    
                case 'physical_reduction':
                    if (!migratedSkill.buffs) migratedSkill.buffs = {};
                    migratedSkill.buffs.physical_reduction = {
                        ...migration.coefficients,
                        duration: skill.duration || 2
                    };
                    break;
            }
            
            hasChanges = true;
            console.log(`  🔄 Migrado: ${effect} → ${migration.newEffect}`);
            
        } else if (GENERIC_EFFECTS.includes(effect)) {
            // Efeito já é genérico, manter
            newEffects.push(effect);
        } else {
            // Efeito desconhecido, manter mas avisar
            newEffects.push(effect);
            console.log(`  ⚠️  Efeito desconhecido mantido: ${effect}`);
        }
    }
    
    migratedSkill.effects = newEffects;
    
    return { migratedSkill, hasChanges };
}

async function migrateSkills() {
    try {
        console.log('📦 Carregando skills...');
        const data = await fs.readFile(DATA_PATH, 'utf8');
        const skillsData = JSON.parse(data);
        
        let totalMigrations = 0;
        const migrationLog = [];
        
        console.log('\n🔄 Iniciando migração...\n');
        
        for (const [skillId, skill] of Object.entries(skillsData.skills)) {
            console.log(`⚙️  Processando: ${skill.name} (${skillId})`);
            
            const { migratedSkill, hasChanges } = migrateSkillEffects(skill);
            
            if (hasChanges) {
                skillsData.skills[skillId] = migratedSkill;
                totalMigrations++;
                migrationLog.push({
                    id: skillId,
                    name: skill.name,
                    oldEffects: skill.effects,
                    newEffects: migratedSkill.effects
                });
            } else {
                console.log(`  ✅ Sem alterações necessárias`);
            }
            
            console.log(''); // Linha em branco
        }
        
        // Salvar dados migrados
        await fs.writeFile(DATA_PATH, JSON.stringify(skillsData, null, 2), 'utf8');
        
        // Salvar log de migração
        const logPath = './data/migration_log_effects_to_coefficients.json';
        await fs.writeFile(logPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            totalSkills: Object.keys(skillsData.skills).length,
            migratedSkills: totalMigrations,
            details: migrationLog
        }, null, 2), 'utf8');
        
        console.log('🎉 Migração concluída!');
        console.log(`   📊 Skills processadas: ${Object.keys(skillsData.skills).length}`);
        console.log(`   🔄 Skills migradas: ${totalMigrations}`);
        console.log(`   📋 Log salvo em: ${logPath}`);
        
    } catch (error) {
        console.error('❌ Erro durante migração:', error);
        throw error;
    }
}

async function main() {
    try {
        console.log('🚀 Iniciando migração: Efeitos → Coeficientes\n');
        
        await backupData();
        await migrateSkills();
        
        console.log('\n✅ Migração concluída com sucesso!');
        console.log('   💡 Execute os testes para verificar se tudo funciona corretamente');
        
    } catch (error) {
        console.error('\n💥 Migração falhou:', error);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { main as migrateEffectsToCoefficients };