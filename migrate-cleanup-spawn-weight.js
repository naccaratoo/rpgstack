/**
 * Script de Limpeza - Remover Spawn Weight
 * Remove campo desnecessário: spawn_weight
 * 
 * RPGStack v4.7 - Simplificação do Sistema
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'data', 'characters.json');
const BACKUP_PATH = path.join(__dirname, 'data', 'characters_backup_spawn_weight.json');

async function cleanupSpawnWeight() {
    try {
        console.log('🧹 Iniciando limpeza do spawn_weight...');
        console.log('📁 Arquivo do banco:', DB_PATH);

        // Ler banco de dados atual
        const data = await fs.readFile(DB_PATH, 'utf8');
        const database = JSON.parse(data);

        console.log('📊 Personagens encontrados:', Object.keys(database.characters || {}).length);

        // Criar backup antes da limpeza
        console.log('💾 Criando backup...');
        await fs.writeFile(BACKUP_PATH, JSON.stringify(database, null, 2));
        console.log('✅ Backup salvo em:', BACKUP_PATH);

        // Limpar spawn_weight
        let cleanedCount = 0;
        let totalFieldsRemoved = 0;

        for (const [id, character] of Object.entries(database.characters || {})) {
            let fieldsRemovedFromChar = 0;

            // Remover spawn_weight
            if (character.spawn_weight !== undefined) {
                delete character.spawn_weight;
                fieldsRemovedFromChar++;
                totalFieldsRemoved++;
            }

            if (fieldsRemovedFromChar > 0) {
                cleanedCount++;
                console.log(`🧹 ${character.name}: removidos ${fieldsRemovedFromChar} campos spawn_weight`);
            } else {
                console.log(`✅ ${character.name}: já limpo`);
            }
        }

        // Salvar banco limpo
        await fs.writeFile(DB_PATH, JSON.stringify(database, null, 2));

        console.log('\n📋 RELATÓRIO DE LIMPEZA SPAWN_WEIGHT:');
        console.log('━'.repeat(50));
        console.log(`📊 Total de personagens: ${Object.keys(database.characters || {}).length}`);
        console.log(`🧹 Personagens limpos: ${cleanedCount}`);
        console.log(`🗑️  Total de campos removidos: ${totalFieldsRemoved}`);
        console.log('━'.repeat(50));

        if (totalFieldsRemoved > 0) {
            console.log('✅ Limpeza de spawn_weight concluída com sucesso!');
            console.log('🗑️  Campo removido: spawn_weight');
            console.log('💾 Backup salvo em:', BACKUP_PATH);
        } else {
            console.log('ℹ️  Nenhuma limpeza necessária. Banco já estava limpo.');
        }

        console.log('🎮 Sistema mais simples - Sem peso de spawn!');
        
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
    console.log('🎮 RPGStack - Limpeza: Spawn Weight v4.7');
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
    console.log('   • Remover campo: spawn_weight');
    console.log('   • Simplificar estrutura focando no combate');
    console.log('');
    
    await cleanupSpawnWeight();
}

main().catch(console.error);