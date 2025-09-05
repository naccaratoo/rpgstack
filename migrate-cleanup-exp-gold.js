/**
 * Script de Limpeza - Remover Experience e Gold/Drops
 * Remove campos desnecessários: experience, goldRange, drops
 * 
 * RPGStack v4.7 - Simplificação do Sistema
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'data', 'characters.json');
const BACKUP_PATH = path.join(__dirname, 'data', 'characters_backup_cleanup.json');

async function cleanupDatabase() {
    try {
        console.log('🧹 Iniciando limpeza do banco de dados...');
        console.log('📁 Arquivo do banco:', DB_PATH);

        // Ler banco de dados atual
        const data = await fs.readFile(DB_PATH, 'utf8');
        const database = JSON.parse(data);

        console.log('📊 Personagens encontrados:', Object.keys(database.characters || {}).length);

        // Criar backup antes da limpeza
        console.log('💾 Criando backup...');
        await fs.writeFile(BACKUP_PATH, JSON.stringify(database, null, 2));
        console.log('✅ Backup salvo em:', BACKUP_PATH);

        // Limpar campos desnecessários
        let cleanedCount = 0;
        let totalFieldsRemoved = 0;

        for (const [id, character] of Object.entries(database.characters || {})) {
            let fieldsRemovedFromChar = 0;

            // Remover experience
            if (character.experience !== undefined) {
                delete character.experience;
                fieldsRemovedFromChar++;
                totalFieldsRemoved++;
            }

            // Remover goldRange
            if (character.goldRange !== undefined) {
                delete character.goldRange;
                fieldsRemovedFromChar++;
                totalFieldsRemoved++;
            }

            // Remover drops
            if (character.drops !== undefined) {
                delete character.drops;
                fieldsRemovedFromChar++;
                totalFieldsRemoved++;
            }

            if (fieldsRemovedFromChar > 0) {
                cleanedCount++;
                console.log(`🧹 ${character.name}: removidos ${fieldsRemovedFromChar} campos desnecessários`);
            } else {
                console.log(`✅ ${character.name}: já limpo`);
            }
        }

        // Salvar banco limpo
        await fs.writeFile(DB_PATH, JSON.stringify(database, null, 2));

        console.log('\n📋 RELATÓRIO DE LIMPEZA:');
        console.log('━'.repeat(50));
        console.log(`📊 Total de personagens: ${Object.keys(database.characters || {}).length}`);
        console.log(`🧹 Personagens limpos: ${cleanedCount}`);
        console.log(`🗑️  Total de campos removidos: ${totalFieldsRemoved}`);
        console.log('━'.repeat(50));

        if (totalFieldsRemoved > 0) {
            console.log('✅ Limpeza concluída com sucesso!');
            console.log('🗑️  Campos removidos: experience, goldRange, drops');
            console.log('💾 Backup salvo em:', BACKUP_PATH);
        } else {
            console.log('ℹ️  Nenhuma limpeza necessária. Banco já estava limpo.');
        }

        // Mostrar estrutura limpa
        const examples = Object.values(database.characters || {}).slice(0, 2);
        if (examples.length > 0) {
            console.log('\n🎯 EXEMPLOS DE ESTRUTURA LIMPA:');
            console.log('━'.repeat(50));
            examples.forEach((char, index) => {
                console.log(`${index + 1}. ${char.name}:`);
                console.log(`   📊 Campos mantidos:`);
                console.log(`   ├── Stats: attack(${char.attack}), defense(${char.defense})`);
                console.log(`   ├── Stats especiais: ataque_especial(${char.ataque_especial}), defesa_especial(${char.defesa_especial})`);
                console.log(`   ├── Combate: hp(${char.hp}), anima(${char.anima}), critico(${char.critico})`);
                console.log(`   ├── Sistema: level(${char.level}), classe(${char.classe}), ai_type(${char.ai_type})`);
                console.log(`   └── Skills: ${char.skills ? char.skills.length : 0} habilidades`);
                console.log('');
            });
        }

        console.log('🎮 Sistema simplificado - Foco no combate e balanceamento!');
        
    } catch (error) {
        console.error('❌ Erro durante a limpeza:', error);
        console.error('Stack:', error.stack);
        
        // Tentar restaurar backup se algo der errado
        try {
            console.log('🔄 Tentando restaurar backup...');
            const backup = await fs.readFile(BACKUP_PATH, 'utf8');
            await fs.writeFile(DB_PATH, backup);
            console.log('✅ Backup restaurado com sucesso.');
        } catch (restoreError) {
            console.error('❌ Falha ao restaurar backup:', restoreError);
        }
        
        process.exit(1);
    }
}

// Verificar se o arquivo do banco existe
async function checkDatabaseExists() {
    try {
        await fs.access(DB_PATH);
        return true;
    } catch {
        return false;
    }
}

async function main() {
    console.log('🎮 RPGStack - Limpeza: Experience & Gold v4.7');
    console.log('═'.repeat(60));

    // Verificar se o banco existe
    const dbExists = await checkDatabaseExists();
    if (!dbExists) {
        console.error('❌ Arquivo do banco de dados não encontrado:', DB_PATH);
        console.log('💡 Certifique-se de que o servidor foi executado pelo menos uma vez.');
        process.exit(1);
    }

    // Confirmar limpeza
    console.log('⚠️  Este script irá:');
    console.log('   • Criar um backup do banco atual');
    console.log('   • Remover campos: experience, goldRange, drops');
    console.log('   • Simplificar estrutura focando no combate');
    console.log('');
    
    await cleanupDatabase();
}

main().catch(console.error);