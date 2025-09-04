import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para calcular defesa especial baseada na classe e cultura
function calculateSpecialDefense(character) {
    let baseDefense = 10; // Defesa especial base
    
    // Bônus por classe
    const classBonus = {
        'Arcano': 25,                    // Resistência mágica natural
        'Oráculo': 30,                   // Proteção espiritual elevada
        'Curandeiro Ritualista': 35,     // Máxima resistência espiritual
        'Guardião da Natureza': 20,      // Conexão natural com espíritos
        'Artífice': 15,                  // Proteção por artefatos
        'Mercador-Diplomata': 18,        // Proteção social e mental
        'Lutador': 12,                   // Disciplina mental
        'Armamentista': 8,               // Foco em defesa física
        'Naturalista': 22                // Harmonia com elementos
    };
    
    // Bônus por cultura (personagens culturais têm resistência ancestral)
    const cultureBonus = character.cultura ? 15 : 0;
    
    // Bônus por nível (mesmo que todos sejam nível 1, mantemos a fórmula)
    const levelBonus = Math.floor(character.level * 0.5);
    
    // Bônus baseado na ânima (quanto mais ânima, maior resistência espiritual)
    const animaBonus = Math.floor(character.anima * 0.1);
    
    return baseDefense + 
           (classBonus[character.classe] || 10) + 
           cultureBonus + 
           levelBonus + 
           animaBonus;
}

async function addSpecialDefenseToCharacters() {
    try {
        // Lê o arquivo atual
        const filePath = path.join(__dirname, 'data', 'characters.json');
        const data = await fs.readFile(filePath, 'utf8');
        const charactersData = JSON.parse(data);
        
        console.log('🛡️ Adicionando Defesa Especial (Espírito) para todos os personagens...');
        
        let updatedCount = 0;
        
        // Adiciona defesa especial para todos os personagens
        Object.keys(charactersData.characters).forEach(id => {
            const character = charactersData.characters[id];
            
            // Calcula a defesa especial
            const specialDefense = calculateSpecialDefense(character);
            
            // Adiciona o campo
            character.defesa_especial = specialDefense;
            character.updated_at = new Date().toISOString();
            
            console.log(`  ✅ ${character.name} (${character.classe}): Defesa Especial = ${specialDefense}`);
            if (character.cultura) {
                console.log(`     🎭 Cultural: ${character.cultura} (+15 bônus)`);
            }
            
            updatedCount++;
        });
        
        // Salva o arquivo atualizado
        await fs.writeFile(filePath, JSON.stringify(charactersData, null, 2));
        
        console.log(`\\n✅ Defesa Especial (Espírito) adicionada com sucesso!`);
        console.log(`📊 Personagens atualizados: ${updatedCount}`);
        console.log(`\\n📋 Sistema de Defesa Especial:`);
        console.log(`   🛡️ Defesa Física: Reduz dano físico`);
        console.log(`   🌟 Defesa Especial: Reduz dano mágico/espiritual`);
        console.log(`\\n🎯 Bônus por Classe:`);
        console.log(`   • Curandeiro Ritualista: +35 (máxima resistência)`);
        console.log(`   • Oráculo: +30 (proteção espiritual)`);
        console.log(`   • Arcano: +25 (resistência mágica)`);
        console.log(`   • Naturalista: +22 (harmonia elemental)`);
        console.log(`   • Guardião da Natureza: +20 (conexão natural)`);
        console.log(`   • Mercador-Diplomata: +18 (proteção mental)`);
        console.log(`   • Artífice: +15 (proteção por artefatos)`);
        console.log(`   • Lutador: +12 (disciplina mental)`);
        console.log(`   • Armamentista: +8 (foco físico)`);
        console.log(`\\n🎭 Bônus Cultural: +15 para personagens com herança ancestral`);
        
    } catch (error) {
        console.error('❌ Erro ao adicionar defesa especial:', error);
    }
}

addSpecialDefenseToCharacters();