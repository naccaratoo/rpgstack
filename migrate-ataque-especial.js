/**
 * Script de Migração - Adicionar Campo "ataque_especial"
 * Este script atualiza todos os personagens existentes no banco de dados
 * para incluir o campo "ataque_especial" se ele não existir.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'data', 'characters.json');
const BACKUP_PATH = path.join(__dirname, 'data', 'characters_backup_before_migration.json');

async function migrateDatabase() {
    try {
        console.log('🔄 Iniciando migração do banco de dados...');
        console.log('📁 Arquivo do banco:', DB_PATH);

        // Ler banco de dados atual
        const data = await fs.readFile(DB_PATH, 'utf8');
        const database = JSON.parse(data);

        console.log('📊 Personagens encontrados:', Object.keys(database.characters || {}).length);

        // Criar backup antes da migração
        console.log('💾 Criando backup...');
        await fs.writeFile(BACKUP_PATH, JSON.stringify(database, null, 2));
        console.log('✅ Backup salvo em:', BACKUP_PATH);

        // Migrar personagens
        let migratedCount = 0;
        let alreadyUpdated = 0;

        for (const [id, character] of Object.entries(database.characters || {})) {
            if (!character.ataque_especial) {
                // Adicionar ataque_especial baseado no ataque normal
                character.ataque_especial = character.attack || 10;
                migratedCount++;
                console.log(`🔄 ${character.name}: ataque_especial = ${character.ataque_especial} (baseado em ATK: ${character.attack})`);
            } else {
                alreadyUpdated++;
                console.log(`✅ ${character.name}: ataque_especial já existe (${character.ataque_especial})`);
            }
        }

        // Salvar banco atualizado
        await fs.writeFile(DB_PATH, JSON.stringify(database, null, 2));

        console.log('\n📋 RELATÓRIO DE MIGRAÇÃO:');
        console.log('━'.repeat(50));
        console.log(`📊 Total de personagens: ${Object.keys(database.characters || {}).length}`);
        console.log(`🔄 Migrados (adicionado ataque_especial): ${migratedCount}`);
        console.log(`✅ Já atualizados: ${alreadyUpdated}`);
        console.log('━'.repeat(50));

        if (migratedCount > 0) {
            console.log('✅ Migração concluída com sucesso!');
            console.log('💡 O campo "ataque_especial" foi adicionado aos personagens que não o possuíam.');
            console.log('📄 Backup salvo em:', BACKUP_PATH);
        } else {
            console.log('ℹ️  Nenhuma migração necessária. Todos os personagens já possuem o campo ataque_especial.');
        }

        // Mostrar exemplos
        const examples = Object.values(database.characters || {}).slice(0, 3);
        if (examples.length > 0) {
            console.log('\n🎯 EXEMPLOS DE PERSONAGENS ATUALIZADOS:');
            console.log('━'.repeat(50));
            examples.forEach((char, index) => {
                console.log(`${index + 1}. ${char.name}:`);
                console.log(`   📊 Ataque: ${char.attack}`);
                console.log(`   ⚡ Ataque Especial: ${char.ataque_especial}`);
                console.log(`   🛡️  Defesa: ${char.defense}`);
                console.log(`   🌟 Defesa Especial: ${char.defesa_especial || 'N/A'}`);
                console.log('');
            });
        }

    } catch (error) {
        console.error('❌ Erro durante a migração:', error);
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
    console.log('🎮 RPGStack - Migração: Ataque Especial v4.7');
    console.log('═'.repeat(60));

    // Verificar se o banco existe
    const dbExists = await checkDatabaseExists();
    if (!dbExists) {
        console.error('❌ Arquivo do banco de dados não encontrado:', DB_PATH);
        console.log('💡 Certifique-se de que o servidor foi executado pelo menos uma vez.');
        process.exit(1);
    }

    // Confirmar migração
    console.log('⚠️  Este script irá:');
    console.log('   • Criar um backup do banco atual');
    console.log('   • Adicionar campo "ataque_especial" aos personagens');
    console.log('   • Usar o valor do "attack" como padrão para "ataque_especial"');
    console.log('');
    
    // Em ambiente de produção, você poderia adicionar uma confirmação aqui
    // Para este exemplo, vamos prosseguir automaticamente
    
    await migrateDatabase();
}

main().catch(console.error);