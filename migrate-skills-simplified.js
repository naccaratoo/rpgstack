#!/usr/bin/env node

/**
 * RPGStack Skills Migration Script - Simplified Version
 * 
 * This script migrates character skills from frontend JavaScript files 
 * to the backend Skills API system using only required fields.
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3002/api';
const SKILLS_ENDPOINT = `${API_BASE_URL}/skills`;

/**
 * Simplified Skills Data - Core Fields Only
 */
const SIMPLIFIED_SKILLS = [
  // Aurelius Ignisvox - Roman Commander
  {
    name: "🔥 Comando das Legiões Flamejantes",
    description: "Invoca legiões espectrais romanas imbuídas com fogo militar",
    type: "combat",
    classe: "Armamentista",
    characterId: "A9C4N0001E",
    characterName: "Aurelius Ignisvox",
    damage: 85,
    anima_cost: 0,
    cooldown: 0
  },
  {
    name: "🛡️ Formação Testudo Flamejante",
    description: "Adota formação defensiva romana com escudos em chamas",
    type: "buff",
    classe: "Armamentista", 
    characterId: "A9C4N0001E",
    characterName: "Aurelius Ignisvox",
    damage: 0,
    anima_cost: 40,
    cooldown: 2
  },
  {
    name: "⚔️ Gladius Incendium",
    description: "Ataque preciso com gladius envolvido em chamas sagradas",
    type: "combat",
    classe: "Armamentista",
    characterId: "A9C4N0001E", 
    characterName: "Aurelius Ignisvox",
    damage: 90,
    anima_cost: 30,
    cooldown: 1
  },

  // Shi Wuxing - Chinese Master
  {
    name: "🌊 Ciclo dos Cinco Elementos",
    description: "Rotaciona através dos elementos Wu Xing com efeitos únicos",
    type: "magic",
    classe: "Arcano",
    characterId: "EA32D10F2D",
    characterName: "Shi Wuxing",
    damage: 75,
    anima_cost: 35,
    cooldown: 0
  },
  {
    name: "☯️ Harmonia do Yin Yang",
    description: "Equilibra energia vital entre Shi e o alvo",
    type: "utility",
    classe: "Arcano",
    characterId: "EA32D10F2D",
    characterName: "Shi Wuxing", 
    damage: 0,
    anima_cost: 25,
    cooldown: 1
  },
  {
    name: "🐉 Invocação do Dragão Imperial",
    description: "Canaliza o poder do dragão chinês para ataque devastador",
    type: "combat",
    classe: "Arcano",
    characterId: "EA32D10F2D",
    characterName: "Shi Wuxing",
    damage: 110,
    anima_cost: 60,
    cooldown: 3
  },

  // Miloš Železnikov - Slavic Warrior
  {
    name: "🔨 Forja do Dragão Eslavo",
    description: "Invoca técnicas ancestrais para forjar arma de escamas de dragão",
    type: "combat", 
    classe: "Lutador",
    characterId: "045CCF3515",
    characterName: "Miloš Železnikov",
    damage: 95,
    anima_cost: 0,
    cooldown: 0
  },
  {
    name: "⚒️ Martelo dos Ancestrais",
    description: "Invoca espíritos de ferreiros eslavos para guiar o ataque", 
    type: "combat",
    classe: "Lutador",
    characterId: "045CCF3515",
    characterName: "Miloš Železnikov",
    damage: 70,
    anima_cost: 30,
    cooldown: 1
  },
  {
    name: "🛡️ Koljčuga Drakonova",
    description: "Forja armadura temporária de escamas de dragão",
    type: "buff",
    classe: "Lutador",
    characterId: "045CCF3515", 
    characterName: "Miloš Železnikov",
    damage: 0,
    anima_cost: 45,
    cooldown: 2
  },

  // Pythia Kassandra - Greek Oracle
  {
    name: "🔮 Visão Oracular dos Três Destinos",
    description: "Vislumbra futuros possíveis para alterar o combate",
    type: "magic",
    classe: "Arcano",
    characterId: "7A8B9C0D1E",
    characterName: "Pythia Kassandra", 
    damage: 70,
    anima_cost: 35,
    cooldown: 0
  },
  {
    name: "🌪️ Tempestade Profética de Delfos",
    description: "Invoca os ventos sagrados carregados com fragmentos de profecias",
    type: "magic",
    classe: "Arcano",
    characterId: "7A8B9C0D1E",
    characterName: "Pythia Kassandra",
    damage: 95,
    anima_cost: 50,
    cooldown: 2
  },
  {
    name: "👁️ Olho de Apolo",
    description: "Canaliza a visão do deus para revelar e explorar todas as fraquezas",
    type: "utility",
    classe: "Arcano", 
    characterId: "7A8B9C0D1E",
    characterName: "Pythia Kassandra",
    damage: 0,
    anima_cost: 25,
    cooldown: 3
  },

  // Itzel Nahualli - Aztec Shaman
  {
    name: "🐆 Metamorfose do Ocelotl",
    description: "Transforma-se na forma sagrada do jaguar das sombras",
    type: "buff",
    classe: "Arcano",
    characterId: "2F3E4D5C6B", 
    characterName: "Itzel Nahualli",
    damage: 80,
    anima_cost: 35,
    cooldown: 1
  },
  {
    name: "🦅 Voo da Águia Dourada",
    description: "Transforma-se em águia e ataca do céu com precisão divina",
    type: "combat",
    classe: "Arcano",
    characterId: "2F3E4D5C6B",
    characterName: "Itzel Nahualli",
    damage: 75,
    anima_cost: 40,
    cooldown: 2
  },
  {
    name: "🐍 Serpente Emplumada", 
    description: "Canaliza o poder de Quetzalcoatl através de transformação serpentina",
    type: "magic",
    classe: "Arcano",
    characterId: "2F3E4D5C6B",
    characterName: "Itzel Nahualli",
    damage: 60,
    anima_cost: 45,
    cooldown: 2
  },

  // Giovanni da Ferrara - Italian Artisan
  {
    name: "⚙️ Balista da Precisão Florentina",
    description: "Dispara projétil de precisão usando engenharia avançada",
    type: "combat",
    classe: "Armamentista",
    characterId: "9A8B7C6D5E",
    characterName: "Giovanni da Ferrara",
    damage: 100,
    anima_cost: 25,
    cooldown: 1
  },
  {
    name: "🛠️ Oficina Portátil Renascentista",
    description: "Monta uma oficina temporária para criar dispositivos em batalha",
    type: "utility",
    classe: "Armamentista",
    characterId: "9A8B7C6D5E",
    characterName: "Giovanni da Ferrara", 
    damage: 0,
    anima_cost: 50,
    cooldown: 3
  },
  {
    name: "🎨 Máquina Voadora de Leonardo",
    description: "Voa temporariamente usando protótipo baseado nos estudos de da Vinci",
    type: "combat",
    classe: "Armamentista",
    characterId: "9A8B7C6D5E",
    characterName: "Giovanni da Ferrara",
    damage: 90,
    anima_cost: 60,
    cooldown: 2
  },

  // Yamazaki Karakuri - Japanese Engineer
  {
    name: "⚙️ Invocação do Karakuri Kyūdō",
    description: "Constrói e ativa autômato arqueiro de precisão extrema",
    type: "combat",
    classe: "Armamentista",
    characterId: "4F3E2D1C0B",
    characterName: "Yamazaki Karakuri",
    damage: 85,
    anima_cost: 40,
    cooldown: 2
  },
  {
    name: "🍵 Ritual do Karakuri Chadō",
    description: "Ativa autômato servo do chá que cura e harmoniza o grupo",
    type: "healing",
    classe: "Armamentista",
    characterId: "4F3E2D1C0B",
    characterName: "Yamazaki Karakuri",
    damage: 0,
    anima_cost: 35,
    cooldown: 2
  },
  {
    name: "🛡️ Defesa do Karakuri Bushi",
    description: "Ativa autômato guerreiro para proteção e contra-ataques",
    type: "buff",
    classe: "Armamentista",
    characterId: "4F3E2D1C0B",
    characterName: "Yamazaki Karakuri",
    damage: 70,
    anima_cost: 50,
    cooldown: 3
  }
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function migrateSkill(skill) {
  try {
    const response = await fetch(SKILLS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(skill)
    });
    
    const data = await response.json();
    
    return {
      success: response.ok,
      skill: skill,
      response: data
    };
  } catch (error) {
    return {
      success: false,
      skill: skill,
      error: error.message
    };
  }
}

async function migrateAllSkills() {
  console.log('🎯 Starting Simplified Skills Migration...');
  console.log(`📊 Total skills: ${SIMPLIFIED_SKILLS.length}`);
  
  const results = {
    total: SIMPLIFIED_SKILLS.length,
    successful: 0,
    failed: 0,
    details: []
  };
  
  for (let i = 0; i < SIMPLIFIED_SKILLS.length; i++) {
    const skill = SIMPLIFIED_SKILLS[i];
    console.log(`\n🔮 [${i+1}/${SIMPLIFIED_SKILLS.length}] Migrating: ${skill.name}`);
    
    const result = await migrateSkill(skill);
    results.details.push(result);
    
    if (result.success) {
      results.successful++;
      console.log(`   ✅ Success`);
      if (result.response?.data?.skill?.id) {
        console.log(`   🆔 ID: ${result.response.data.skill.id}`);
      }
    } else {
      results.failed++;
      console.log(`   ❌ Failed: ${result.error || result.response?.error || 'Unknown error'}`);
    }
    
    // Small delay between requests
    await delay(200);
  }
  
  console.log(`\n📋 Migration Summary:`);
  console.log(`   Total: ${results.total}`);
  console.log(`   Successful: ${results.successful} ✅`);
  console.log(`   Failed: ${results.failed} ❌`);
  console.log(`   Success Rate: ${((results.successful / results.total) * 100).toFixed(1)}%`);
  
  return results;
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');
  
  try {
    const response = await fetch(SKILLS_ENDPOINT);
    const data = await response.json();
    
    if (response.ok && data.success) {
      const totalSkills = data.data?.totalCount || data.data?.skills?.length || 0;
      console.log(`✅ Verification complete: ${totalSkills} skills in database`);
      
      // Group by character
      if (data.data?.skills) {
        const skillsByCharacter = {};
        data.data.skills.forEach(skill => {
          const char = skill.characterName || 'Unknown';
          if (!skillsByCharacter[char]) skillsByCharacter[char] = [];
          skillsByCharacter[char].push(skill.name);
        });
        
        console.log(`\n📊 Skills by Character:`);
        Object.entries(skillsByCharacter).forEach(([character, skills]) => {
          console.log(`   ${character}: ${skills.length} skills`);
          skills.forEach(skillName => {
            console.log(`      • ${skillName}`);
          });
        });
      }
      
      return { success: true, totalSkills };
    } else {
      console.error('❌ Verification failed:', data.error || 'Unknown error');
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Verification error:', error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log(`
🎭 RPGStack Skills Migration - Simplified Version
===============================================

This script will migrate ${SIMPLIFIED_SKILLS.length} skills from 7 characters
to the backend Skills API using minimal required fields.
`);

  try {
    const migrationResults = await migrateAllSkills();
    
    if (migrationResults.successful > 0) {
      const verification = await verifyMigration();
      
      if (verification.success) {
        console.log(`
🎉 Migration completed successfully!

The skills have been registered in the backend API and are now available via:
- GET ${SKILLS_ENDPOINT} (list all skills)
- GET ${SKILLS_ENDPOINT}/search?q=<term> (search skills)
- GET ${SKILLS_ENDPOINT}/type/<type> (skills by type)
- GET ${SKILLS_ENDPOINT}/statistics (skill statistics)

Each character now has their culturally authentic skills registered!
`);
      }
    } else {
      console.error('\n❌ Migration failed. No skills were registered.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Migration error:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { SIMPLIFIED_SKILLS, migrateAllSkills };