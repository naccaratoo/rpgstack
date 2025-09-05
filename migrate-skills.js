#!/usr/bin/env node

/**
 * RPGStack Skills Migration Script
 * 
 * This script migrates character skills from frontend JavaScript files 
 * to the backend Skills API system, ensuring proper data structure 
 * and cultural authenticity preservation.
 * 
 * Usage: node migrate-skills.js
 */

import fetch from 'node-fetch'; // You may need to install: npm install node-fetch
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API Configuration
const API_BASE_URL = 'http://localhost:3002/api';
const SKILLS_ENDPOINT = `${API_BASE_URL}/skills`;

// Migration configuration
const CONFIG = {
  batchSize: 10,
  retryAttempts: 3,
  retryDelay: 1000,
  validateData: true,
  backupExisting: true
};

/**
 * Skill Type Mapping from Frontend to Backend
 * Maps custom frontend types to valid backend types
 */
const SKILL_TYPE_MAPPING = {
  // Frontend types -> Backend valid types
  "command_magic": "combat",
  "defensive_formation": "buff", 
  "weapon_mastery": "combat",
  "elemental_cycle": "magic",
  "balance_harmony": "utility",
  "dragon_summon": "combat",
  "weapon_craft": "combat",
  "ancestral_summon": "combat",
  "defensive_craft": "buff",
  "prediction": "magic",
  "divine_storm": "magic",
  "divine_insight": "utility",
  "transformation": "buff",
  "aerial_transformation": "combat", 
  "divine_transformation": "magic",
  "mechanical_weapon": "combat",
  "setup_ability": "utility",
  "aerial_invention": "combat",
  "karakuri_summon": "combat",
  "healing_automation": "healing",
  "defensive_automation": "buff"
};

/**
 * Class Mapping from Frontend to Backend
 */
const CLASS_MAPPING = {
  "Armamentista": "Armamentista",
  "Naturalista": "Arcano", // Maps to Arcano since Naturalista isn't in valid classes
  "Artífice": "Lutador", // Maps to Lutador
  "Oráculo": "Arcano",
  "Nahualli": "Arcano", 
  "Inventor": "Armamentista",
  "Mecanista": "Armamentista"
};

/**
 * Character Skills Data Extracted from Frontend Files
 * Each character has 3 skills with cultural authenticity preserved
 */
const SKILLS_DATA = {
  // Aurelius Ignisvox - Roman Commander Skills
  "aurelius_ignisvox": {
    characterName: "Aurelius Ignisvox",
    characterId: "A9C4N0001E",
    culture: "Romana Imperial",
    classe: "Armamentista",
    element: "Fogo Militar",
    skills: [
      {
        id: "comando_das_legioes_flamejantes",
        name: "🔥 Comando das Legiões Flamejantes",
        description: "Invoca legiões espectrais romanas imbuídas com fogo militar",
        type: "combat", // Mapped from command_magic
        element: "military_fire",
        classe: "Armamentista",
        culture: "Romana Imperial",
        characterId: "A9C4N0001E",
        characterName: "Aurelius Ignisvox",
        skillType: "active",
        manaCost: 0,
        animaCost: 0,
        baseDamage: 85,
        baseHealing: 0,
        cooldown: 0,
        castTime: 0,
        range: "single_target",
        areaEffect: false,
        requirements: {
          level: 1,
          prerequisites: []
        },
        effects: {
          statusEffects: ["centurion_discipline", "military_burn"],
          animation: "legion_charge",
          soundEffect: "war_horns"
        },
        culturalElements: [
          "Táticas militares romanas",
          "Formações de combate das legiões", 
          "Disciplina e hierarquia militar",
          "Culto imperial e fogo sagrado"
        ],
        balanceData: {
          powerLevel: 85,
          versatility: 7,
          strategicValue: 9
        }
      },
      {
        id: "formacao_testudo_flamejante",
        name: "🛡️ Formação Testudo Flamejante", 
        description: "Adota formação defensiva romana com escudos em chamas",
        type: "defensive_formation",
        element: "military_fire",
        classe: "Armamentista",
        culture: "Romana Imperial",
        characterId: "A9C4N0001E",
        characterName: "Aurelius Ignisvox",
        skillType: "active",
        manaCost: 0,
        animaCost: 40,
        baseDamage: 0,
        baseHealing: 15, // 15% HP moral boost
        cooldown: 2,
        castTime: 1,
        range: "self",
        areaEffect: false,
        requirements: {
          level: 1,
          prerequisites: []
        },
        effects: {
          statusEffects: ["testudo_formation", "flame_counterattack"],
          animation: "testudo_formation",
          soundEffect: "shields_clank"
        },
        culturalElements: [
          "Formação tartaruga das legiões",
          "Escudos flamejantes",
          "Contra-ataque militar disciplinado",
          "Moral e resistência romana"
        ],
        balanceData: {
          powerLevel: 75,
          versatility: 8,
          strategicValue: 10
        }
      },
      {
        id: "gladius_incendium", 
        name: "⚔️ Gladius Incendium",
        description: "Ataque preciso com gladius envolvido em chamas sagradas",
        type: "weapon_mastery",
        element: "sacred_fire",
        classe: "Armamentista", 
        culture: "Romana Imperial",
        characterId: "A9C4N0001E",
        characterName: "Aurelius Ignisvox",
        skillType: "active",
        manaCost: 0,
        animaCost: 30,
        baseDamage: 90,
        baseHealing: 0,
        cooldown: 1,
        castTime: 0,
        range: "melee",
        areaEffect: false,
        requirements: {
          level: 1,
          prerequisites: []
        },
        effects: {
          statusEffects: ["legion_mark"],
          animation: "gladius_thrust", 
          soundEffect: "blade_fire",
          armorPiercing: true,
          criticalChance: 0.25
        },
        culturalElements: [
          "Gladius e técnicas legionárias",
          "Precisão militar romana",
          "Fogo sagrado imperial",
          "Penetração de armadura"
        ],
        balanceData: {
          powerLevel: 90,
          versatility: 6,
          strategicValue: 7
        }
      }
    ]
  },

  // Shi Wuxing - Chinese Master Skills  
  "shi_wuxing": {
    characterName: "Shi Wuxing",
    characterId: "EA32D10F2D", 
    culture: "Chinesa Imperial",
    classe: "Naturalista",
    element: "Wu Xing (Cinco Elementos)",
    skills: [
      {
        id: "ciclo_dos_cinco_elementos",
        name: "🌊 Ciclo dos Cinco Elementos", 
        description: "Rotaciona através dos elementos Wu Xing com efeitos únicos",
        type: "elemental_cycle",
        element: "wu_xing",
        classe: "Naturalista",
        culture: "Chinesa Imperial", 
        characterId: "EA32D10F2D",
        characterName: "Shi Wuxing",
        skillType: "active",
        manaCost: 0,
        animaCost: 35,
        baseDamage: 75,
        baseHealing: 20, // Wood element healing
        cooldown: 0,
        castTime: 1,
        range: "single_target",
        areaEffect: false,
        requirements: {
          level: 1,
          prerequisites: []
        },
        effects: {
          statusEffects: ["elemental_cycle", "wu_xing_mastery"],
          animation: "element_cycle",
          soundEffect: "elemental_harmony"
        },
        culturalElements: [
          "Filosofia Wu Xing (Cinco Elementos)",
          "Ciclo de geração e destruição elemental",
          "Medicina Tradicional Chinesa",
          "Harmonia cósmica"
        ],
        balanceData: {
          powerLevel: 75,
          versatility: 10,
          strategicValue: 9
        }
      },
      {
        id: "harmonia_do_yin_yang",
        name: "☯️ Harmonia do Yin Yang",
        description: "Equilibra energia vital entre Shi e o alvo",
        type: "balance_harmony",
        element: "yin_yang", 
        classe: "Naturalista",
        culture: "Chinesa Imperial",
        characterId: "EA32D10F2D",
        characterName: "Shi Wuxing",
        skillType: "active",
        manaCost: 0,
        animaCost: 25,
        baseDamage: 0, // Variable based on HP difference
        baseHealing: 0, // Variable based on HP difference  
        cooldown: 1,
        castTime: 2,
        range: "single_target",
        areaEffect: false,
        requirements: {
          level: 1,
          prerequisites: []
        },
        effects: {
          statusEffects: ["yin_yang_harmony"],
          animation: "yin_yang_circle",
          soundEffect: "harmony_chimes"
        },
        culturalElements: [
          "Princípios Yin Yang",
          "Equilíbrio de energia vital",
          "Filosofia dualista chinesa",
          "Harmonia entre opostos"
        ],
        balanceData: {
          powerLevel: 60,
          versatility: 9,
          strategicValue: 10
        }
      },
      {
        id: "invocacao_do_dragao_imperial",
        name: "🐉 Invocação do Dragão Imperial",
        description: "Canaliza o poder do dragão chinês para ataque devastador",
        type: "dragon_summon",
        element: "imperial_dragon",
        classe: "Naturalista",
        culture: "Chinesa Imperial",
        characterId: "EA32D10F2D", 
        characterName: "Shi Wuxing",
        skillType: "active",
        manaCost: 0,
        animaCost: 60,
        baseDamage: 110,
        baseHealing: 0,
        cooldown: 3,
        castTime: 2,
        range: "single_target",
        areaEffect: false,
        requirements: {
          level: 1,
          prerequisites: []
        },
        effects: {
          statusEffects: ["dragon_mark", "dragon_intimidation"],
          animation: "imperial_dragon_descent",
          soundEffect: "dragon_roar",
          criticalChance: 0.35
        },
        culturalElements: [
          "Mitologia do Dragão Imperial",
          "Poder dos imperadores celestiais", 
          "Intimidação dracônica",
          "Marca do poder dracônico"
        ],
        balanceData: {
          powerLevel: 110,
          versatility: 8,
          strategicValue: 9
        }
      }
    ]
  },

  // Miloš Železnikov - Slavic Warrior Skills
  "milos_zeleznikov": {
    characterName: "Miloš Železnikov",
    characterId: "045CCF3515",
    culture: "Eslava",
    classe: "Artífice", 
    element: "Ferro e Fogo Ancestral",
    skills: [
      {
        id: "forja_do_dragao_eslavo",
        name: "🔨 Forja do Dragão Eslavo",
        description: "Invoca técnicas ancestrais para forjar arma de escamas de dragão",
        type: "weapon_craft",
        element: "fire_metal",
        classe: "Artífice",
        culture: "Eslava",
        characterId: "045CCF3515",
        characterName: "Miloš Železnikov", 
        skillType: "active",
        manaCost: 0,
        animaCost: 0,
        baseDamage: 95,
        baseHealing: 0,
        cooldown: 0,
        castTime: 1,
        range: "single_target",
        areaEffect: false,
        requirements: {
          level: 1,
          prerequisites: []
        },
        effects: {
          statusEffects: ["dragon_weapon", "forge_heat"],
          animation: "forge_hammer",
          soundEffect: "metal_clang"
        },
        culturalElements: [
          "Tradições metalúrgicas dos Cárpatos",
          "Forja draconiana ancestral",
          "Calor crescente da forja",
          "Artesanato eslavo tradicional"
        ],
        balanceData: {
          powerLevel: 95,
          versatility: 7,
          strategicValue: 8
        }
      },
      {
        id: "martelo_dos_ancestrais", 
        name: "⚒️ Martelo dos Ancestrais",
        description: "Invoca espíritos de ferreiros eslavos para guiar o ataque",
        type: "ancestral_summon",
        element: "spirit_metal",
        classe: "Artífice",
        culture: "Eslava", 
        characterId: "045CCF3515",
        characterName: "Miloš Železnikov",
        skillType: "active",
        manaCost: 0,
        animaCost: 30,
        baseDamage: 70,
        baseHealing: 0,
        cooldown: 1,
        castTime: 1,
        range: "single_target", 
        areaEffect: false,
        requirements: {
          level: 1,
          prerequisites: []
        },
        effects: {
          statusEffects: ["armor_dent"],
          animation: "ancestral_hammer",
          soundEffect: "hammer_echo",
          criticalChance: 0.2
        },
        culturalElements: [
          "Espíritos ancestrais de ferreiros",
          "Sabedoria metalúrgica eslava",
          "Redução de defesa inimiga",
          "Ecos dos martelos ancestrais"
        ],
        balanceData: {
          powerLevel: 70,
          versatility: 6,
          strategicValue: 7
        }
      },
      {
        id: "koljcuga_drakonova",
        name: "🛡️ Koljčuga Drakonova",
        description: "Forja armadura temporária de escamas de dragão",
        type: "defensive_craft",
        element: "dragon_metal",
        classe: "Artífice",
        culture: "Eslava",
        characterId: "045CCF3515",
        characterName: "Miloš Železnikov",
        skillType: "active", 
        manaCost: 0,
        animaCost: 45,
        baseDamage: 0,
        baseHealing: 15, // 15% HP protection boost
        cooldown: 2,
        castTime: 2,
        range: "self",
        areaEffect: false,
        requirements: {
          level: 1,
          prerequisites: []
        },
        effects: {
          statusEffects: ["dragon_armor"],
          animation: "armor_forge",
          soundEffect: "dragon_scales"
        },
        culturalElements: [
          "Koljčuga (cota de malha eslava)",
          "Escamas de dragão eslavo",
          "Resistência mágica draconiana", 
          "Proteção ancestral"
        ],
        balanceData: {
          powerLevel: 60,
          versatility: 8,
          strategicValue: 9
        }
      }
    ]
  },

  // Pythia Kassandra - Greek Oracle Skills
  "pythia_kassandra": {
    characterName: "Pythia Kassandra",
    characterId: "7A8B9C0D1E",
    culture: "Grega Clássica",
    classe: "Oráculo",
    element: "Visões Proféticas",
    skills: [
      {
        id: "visao_oracular_dos_tres_destinos",
        name: "🔮 Visão Oracular dos Três Destinos",
        description: "Vislumbra futuros possíveis para alterar o combate",
        type: "prediction",
        element: "divine_sight", 
        classe: "Oráculo",
        culture: "Grega Clássica",
        characterId: "7A8B9C0D1E",
        characterName: "Pythia Kassandra",
        skillType: "active",
        manaCost: 0,
        animaCost: 35,
        baseDamage: 70,
        baseHealing: 0,
        cooldown: 0,
        castTime: 2,
        range: "single_target",
        areaEffect: false,
        requirements: {
          level: 1,
          prerequisites: []
        },
        effects: {
          statusEffects: ["prophetic_doom", "prophetic_fortune", "prophetic_insight"],
          animation: "oracle_vision",
          soundEffect: "prophecy_whispers"
        },
        culturalElements: [
          "Oráculo de Delfos e tradições proféticas",
          "Três destinos possíveis",
          "Visões do futuro",
          "Sabedoria oracular ancestral"
        ],
        balanceData: {
          powerLevel: 70,
          versatility: 10,
          strategicValue: 10
        }
      },
      {
        id: "tempestade_profetica_de_delfos",
        name: "🌪️ Tempestade Profética de Delfos",
        description: "Invoca os ventos sagrados carregados com fragmentos de profecias",
        type: "divine_storm",
        element: "prophetic_wind",
        classe: "Oráculo",
        culture: "Grega Clássica", 
        characterId: "7A8B9C0D1E",
        characterName: "Pythia Kassandra",
        skillType: "active",
        manaCost: 0,
        animaCost: 50,
        baseDamage: 95,
        baseHealing: 0,
        cooldown: 2,
        castTime: 2,
        range: "single_target",
        areaEffect: true,
        requirements: {
          level: 1,
          prerequisites: []
        },
        effects: {
          statusEffects: ["prophetic_aura"],
          animation: "prophetic_storm", 
          soundEffect: "wind_prophecies",
          multiHit: true
        },
        culturalElements: [
          "Ventos sagrados de Delfos",
          "Fragmentos proféticos múltiplos",
          "Tempestade de revelação divina",
          "Aura profética ancestral"
        ],
        balanceData: {
          powerLevel: 95,
          versatility: 8,
          strategicValue: 9
        }
      },
      {
        id: "olho_de_apolo",
        name: "👁️ Olho de Apolo", 
        description: "Canaliza a visão do deus para revelar e explorar todas as fraquezas",
        type: "divine_insight",
        element: "solar_sight",
        classe: "Oráculo",
        culture: "Grega Clássica",
        characterId: "7A8B9C0D1E",
        characterName: "Pythia Kassandra",
        skillType: "active",
        manaCost: 0,
        animaCost: 25,
        baseDamage: 0,
        baseHealing: 0,
        cooldown: 3,
        castTime: 1,
        range: "single_target",
        areaEffect: false,
        requirements: {
          level: 1,
          prerequisites: []
        },
        effects: {
          statusEffects: ["divine_sight", "analyzed"],
          animation: "divine_eye_opening",
          soundEffect: "apollo_blessing"
        },
        culturalElements: [
          "Apolo - Deus da Profecia e Luz",
          "Visão divina completa",
          "Análise anatômica divina", 
          "Revelação de fraquezas"
        ],
        balanceData: {
          powerLevel: 50,
          versatility: 9,
          strategicValue: 10
        }
      }
    ]
  },

  // Itzel Nahualli - Aztec Shaman Skills
  "itzel_nahualli": {
    characterName: "Itzel Nahualli",
    characterId: "2F3E4D5C6B",
    culture: "Azteca/Mexica",
    classe: "Nahualli", 
    element: "Transformação Espiritual",
    skills: [
      {
        id: "metamorfose_do_ocelotl",
        name: "🐆 Metamorfose do Ocelotl",
        description: "Transforma-se na forma sagrada do jaguar das sombras",
        type: "transformation",
        element: "shadow_spirit",
        classe: "Nahualli",
        culture: "Azteca/Mexica",
        characterId: "2F3E4D5C6B",
        characterName: "Itzel Nahualli",
        skillType: "active",
        manaCost: 0,
        animaCost: 35,
        baseDamage: 80,
        baseHealing: 0,
        cooldown: 1,
        castTime: 1,
        range: "single_target",
        areaEffect: false,
        requirements: {
          level: 1,
          prerequisites: []
        },
        effects: {
          statusEffects: ["ocelotl_form", "primal_fear"],
          animation: "jaguar_transformation",
          soundEffect: "jaguar_growl"
        },
        culturalElements: [
          "Nahualismo e xamanismo mexica",
          "Transformação em jaguar sagrado",
          "Sombras e furtividade felina",
          "Medo primal do predador"
        ],
        balanceData: {
          powerLevel: 80,
          versatility: 8,
          strategicValue: 8
        }
      },
      {
        id: "voo_da_aguia_dourada", 
        name: "🦅 Voo da Águia Dourada",
        description: "Transforma-se em águia e ataca do céu com precisão divina",
        type: "aerial_transformation",
        element: "wind_spirit",
        classe: "Nahualli",
        culture: "Azteca/Mexica",
        characterId: "2F3E4D5C6B",
        characterName: "Itzel Nahualli",
        skillType: "active",
        manaCost: 0, 
        animaCost: 40,
        baseDamage: 75,
        baseHealing: 0,
        cooldown: 2,
        castTime: 1,
        range: "single_target",
        areaEffect: true,
        requirements: {
          level: 1,
          prerequisites: []
        },
        effects: {
          statusEffects: ["cuauhtli_form", "sacred_wind"],
          animation: "eagle_dive",
          soundEffect: "eagle_cry"
        },
        culturalElements: [
          "Cuauhtli (águia dourada sagrada)",
          "Voo divino e precisão aérea", 
          "Ventos sagrados dos céus",
          "Visão aguçada da águia"
        ],
        balanceData: {
          powerLevel: 75,
          versatility: 9,
          strategicValue: 8
        }
      },
      {
        id: "serpente_emplumada",
        name: "🐍 Serpente Emplumada",
        description: "Canaliza o poder de Quetzalcoatl através de transformação serpentina",
        type: "divine_transformation", 
        element: "feathered_serpent",
        classe: "Nahualli",
        culture: "Azteca/Mexica",
        characterId: "2F3E4D5C6B",
        characterName: "Itzel Nahualli",
        skillType: "active",
        manaCost: 0,
        animaCost: 45,
        baseDamage: 60,
        baseHealing: 12, // Group healing
        cooldown: 2,
        castTime: 2,
        range: "single_target",
        areaEffect: true,
        requirements: {
          level: 1,
          prerequisites: []
        },
        effects: {
          statusEffects: ["coatl_wisdom", "sacred_venom", "ancestral_foresight"],
          animation: "serpent_coil",
          soundEffect: "serpent_hiss"
        },
        culturalElements: [
          "Quetzalcoatl - Serpente Emplumada",
          "Sabedoria divina e cura grupal",
          "Veneno sagrado não-letal", 
          "Premonição ancestral"
        ],
        balanceData: {
          powerLevel: 60,
          versatility: 10,
          strategicValue: 10
        }
      }
    ]
  },

  // Giovanni da Ferrara - Italian Artisan Skills
  "giovanni_da_ferrara": {
    characterName: "Giovanni da Ferrara",
    characterId: "9A8B7C6D5E",
    culture: "Italiana Renascentista",
    classe: "Inventor",
    element: "Engenharia Mecânica",
    skills: [
      {
        id: "balista_da_precisao_florentina",
        name: "⚙️ Balista da Precisão Florentina",
        description: "Dispara projétil de precisão usando engenharia avançada",
        type: "mechanical_weapon",
        element: "engineering",
        classe: "Inventor",
        culture: "Italiana Renascentista", 
        characterId: "9A8B7C6D5E",
        characterName: "Giovanni da Ferrara",
        skillType: "active",
        manaCost: 0,
        animaCost: 25,
        baseDamage: 100,
        baseHealing: 0,
        cooldown: 1,
        castTime: 1,
        range: "ranged",
        areaEffect: false,
        requirements: {
          level: 1,
          prerequisites: []
        },
        effects: {
          statusEffects: ["ballista_setup", "vital_point_marked"],
          animation: "ballista_shot",
          soundEffect: "crossbow_release",
          multiShot: true
        },
        culturalElements: [
          "Engenharia renascentista italiana",
          "Precisão florentina artesanal",
          "Estudo anatômico científico",
          "Balística e mecanismos"
        ],
        balanceData: {
          powerLevel: 100,
          versatility: 7,
          strategicValue: 8
        }
      },
      {
        id: "oficina_portatil_renascentista",
        name: "🛠️ Oficina Portátil Renascentista", 
        description: "Monta uma oficina temporária para criar dispositivos em batalha",
        type: "setup_ability",
        element: "creative_engineering",
        classe: "Inventor",
        culture: "Italiana Renascentista",
        characterId: "9A8B7C6D5E",
        characterName: "Giovanni da Ferrara",
        skillType: "active",
        manaCost: 0,
        animaCost: 50,
        baseDamage: 0,
        baseHealing: 20, // Inspiration healing
        cooldown: 3,
        castTime: 2,
        range: "area",
        areaEffect: true,
        requirements: {
          level: 1,
          prerequisites: []
        },
        effects: {
          statusEffects: ["renaissance_workshop", "smoke_concealment", "renaissance_inspiration"],
          animation: "workshop_assembly",
          soundEffect: "workshop_sounds"
        },
        culturalElements: [
          "Oficinas renascentistas",
          "Genialidade inventiva italiana",
          "Dispositivos múltiplos criados",
          "Inspiração para o grupo"
        ],
        balanceData: {
          powerLevel: 70,
          versatility: 10,
          strategicValue: 10
        }
      },
      {
        id: "maquina_voadora_de_leonardo",
        name: "🎨 Máquina Voadora de Leonardo",
        description: "Voa temporariamente usando protótipo baseado nos estudos de da Vinci",
        type: "aerial_invention",
        element: "renaissance_flight",
        classe: "Inventor", 
        culture: "Italiana Renascentista",
        characterId: "9A8B7C6D5E", 
        characterName: "Giovanni da Ferrara",
        skillType: "active",
        manaCost: 0,
        animaCost: 60,
        baseDamage: 90,
        baseHealing: 0,
        cooldown: 2,
        castTime: 2,
        range: "aerial",
        areaEffect: true,
        requirements: {
          level: 1,
          prerequisites: []
        },
        effects: {
          statusEffects: ["leonardo_flight", "aerial_stun", "anatomical_study"],
          animation: "leonardo_flight",
          soundEffect: "wind_wings"
        },
        culturalElements: [
          "Estudos de Leonardo da Vinci",
          "Máquina voadora renascentista",
          "Ataque de mergulho aéreo",
          "Estudo anatômico do alto"
        ],
        balanceData: {
          powerLevel: 90,
          versatility: 9, 
          strategicValue: 9
        }
      }
    ]
  },

  // Yamazaki Karakuri - Japanese Engineer Skills
  "yamazaki_karakuri": {
    characterName: "Yamazaki Karakuri",
    characterId: "4F3E2D1C0B",
    culture: "Japonesa Edo",
    classe: "Mecanista",
    element: "Engenharia Precisa",
    skills: [
      {
        id: "invocacao_do_karakuri_kyudo",
        name: "⚙️ Invocação do Karakuri Kyūdō",
        description: "Constrói e ativa autômato arqueiro de precisão extrema",
        type: "karakuri_summon",
        element: "mechanical_precision",
        classe: "Mecanista",
        culture: "Japonesa Edo", 
        characterId: "4F3E2D1C0B",
        characterName: "Yamazaki Karakuri",
        skillType: "active",
        manaCost: 0,
        animaCost: 40,
        baseDamage: 85,
        baseHealing: 0,
        cooldown: 2,
        castTime: 1,
        range: "ranged",
        areaEffect: false,
        requirements: {
          level: 1,
          prerequisites: []
        },
        effects: {
          statusEffects: ["karakuri_archer", "precision_marked"],
          animation: "karakuri_archery",
          soundEffect: "bow_mechanism",
          criticalChance: 0.65,
          doubleShot: true
        },
        culturalElements: [
          "Tradição japonesa de autômatos Karakuri",
          "Kyūdō (arte do arco japonesa)", 
          "Precisão mecânica extrema",
          "Harmonia entre engrenagens"
        ],
        balanceData: {
          powerLevel: 85,
          versatility: 8,
          strategicValue: 9
        }
      },
      {
        id: "ritual_do_karakuri_chado",
        name: "🍵 Ritual do Karakuri Chadō",
        description: "Ativa autômato servo do chá que cura e harmoniza o grupo",
        type: "healing_automation",
        element: "harmonious_service",
        classe: "Mecanista",
        culture: "Japonesa Edo",
        characterId: "4F3E2D1C0B",
        characterName: "Yamazaki Karakuri",
        skillType: "active",
        manaCost: 0,
        animaCost: 35,
        baseDamage: 0,
        baseHealing: 25, // Base + group healing
        cooldown: 2,
        castTime: 2,
        range: "area",
        areaEffect: true,
        requirements: {
          level: 1,
          prerequisites: []
        },
        effects: {
          statusEffects: ["chado_serenity", "group_harmony"],
          animation: "tea_ceremony",
          soundEffect: "tea_pouring",
          purification: true
        },
        culturalElements: [
          "Cerimônia do chá (Chadō)",
          "Autômato servo tradicional", 
          "Harmonia do grupo",
          "Purificação e serenidade"
        ],
        balanceData: {
          powerLevel: 60,
          versatility: 9,
          strategicValue: 10
        }
      },
      {
        id: "defesa_do_karakuri_bushi",
        name: "🛡️ Defesa do Karakuri Bushi",
        description: "Ativa autômato guerreiro para proteção e contra-ataques",
        type: "defensive_automation",
        element: "protective_mechanism",
        classe: "Mecanista",
        culture: "Japonesa Edo",
        characterId: "4F3E2D1C0B", 
        characterName: "Yamazaki Karakuri",
        skillType: "active",
        manaCost: 0,
        animaCost: 50,
        baseDamage: 70,
        baseHealing: 0,
        cooldown: 3,
        castTime: 1,
        range: "area",
        areaEffect: true,
        requirements: {
          level: 1,
          prerequisites: []
        },
        effects: {
          statusEffects: ["karakuri_defense", "defensive_mark", "bushi_protection", "karakuri_coordination"],
          animation: "bushi_stance",
          soundEffect: "armor_clank",
          counterChance: 0.4
        },
        culturalElements: [
          "Bushidō e espírito guerreiro",
          "Karakuri Bushi (autômato samurai)", 
          "Proteção coordenada do grupo",
          "Contra-ataques mecânicos"
        ],
        balanceData: {
          powerLevel: 70,
          versatility: 8,
          strategicValue: 10
        }
      }
    ]
  }
};

/**
 * Utility Functions
 */
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeApiCall(url, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'RPGStack-Migration-Script/1.0'
    }
  };

  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    const response = await fetch(url, mergedOptions);
    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: data
    };
  } catch (error) {
    console.error(`API call failed for ${url}:`, error.message);
    return {
      success: false,
      status: 0,
      error: error.message
    };
  }
}

async function retryApiCall(url, options, maxRetries = CONFIG.retryAttempts) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`  Attempt ${attempt}/${maxRetries}...`);
    
    const result = await makeApiCall(url, options);
    
    if (result.success) {
      return result;
    }
    
    lastError = result;
    
    if (attempt < maxRetries) {
      console.log(`  Failed, retrying in ${CONFIG.retryDelay}ms...`);
      await delay(CONFIG.retryDelay);
    }
  }
  
  return lastError;
}

/**
 * Validation Functions
 */
function validateSkillData(skill) {
  const required = ['id', 'name', 'description', 'type', 'characterId', 'characterName'];
  const missing = required.filter(field => !skill[field]);
  
  if (missing.length > 0) {
    return {
      valid: false,
      errors: [`Missing required fields: ${missing.join(', ')}`]
    };
  }
  
  // Additional validation
  const errors = [];
  
  if (typeof skill.baseDamage !== 'number' || skill.baseDamage < 0) {
    errors.push('baseDamage must be a non-negative number');
  }
  
  if (typeof skill.animaCost !== 'number' || skill.animaCost < 0) {
    errors.push('animaCost must be a non-negative number');
  }
  
  if (typeof skill.cooldown !== 'number' || skill.cooldown < 0) {
    errors.push('cooldown must be a non-negative number');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Migration Functions
 */
async function checkApiConnection() {
  console.log('🔍 Checking API connection...');
  
  const result = await makeApiCall(`${API_BASE_URL}/test`);
  
  if (result.success) {
    console.log('✅ API connection established');
    console.log(`   Server: ${result.data.message}`);
    return true;
  } else {
    console.error('❌ Failed to connect to API');
    console.error(`   Status: ${result.status}`);
    console.error(`   Error: ${result.error || result.data?.error || 'Unknown error'}`);
    return false;
  }
}

async function backupExistingSkills() {
  if (!CONFIG.backupExisting) {
    return { success: true };
  }
  
  console.log('💾 Creating backup of existing skills...');
  
  const result = await makeApiCall(SKILLS_ENDPOINT);
  
  if (result.success) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(__dirname, `skills_backup_${timestamp}.json`);
    
    try {
      await fs.writeFile(backupPath, JSON.stringify(result.data, null, 2));
      console.log(`✅ Backup created: ${backupPath}`);
      return { success: true, backupPath };
    } catch (error) {
      console.error('❌ Failed to create backup file:', error.message);
      return { success: false, error: error.message };
    }
  } else {
    console.log('⚠️  No existing skills found to backup');
    return { success: true };
  }
}

/**
 * Transform skill data to match backend requirements
 */
function transformSkillData(skill) {
  const transformed = { ...skill };
  
  // Map skill type to valid backend type
  if (skill.type && SKILL_TYPE_MAPPING[skill.type]) {
    transformed.type = SKILL_TYPE_MAPPING[skill.type];
  }
  
  // Map classe to valid backend classe
  if (skill.classe && CLASS_MAPPING[skill.classe]) {
    transformed.classe = CLASS_MAPPING[skill.classe];
  }
  
  // Ensure required fields have default values
  transformed.level = transformed.level || 1;
  transformed.damage = transformed.baseDamage || 0;
  transformed.healing = transformed.baseHealing || 0;
  transformed.manaCost = transformed.manaCost || 0;
  transformed.cooldown = transformed.cooldown || 0;
  
  // Remove any undefined or null values
  Object.keys(transformed).forEach(key => {
    if (transformed[key] === undefined || transformed[key] === null) {
      delete transformed[key];
    }
  });
  
  return transformed;
}

async function migrateSkill(skill) {
  // Transform skill data to match backend requirements
  const transformedSkill = transformSkillData(skill);
  
  if (CONFIG.validateData) {
    const validation = validateSkillData(transformedSkill);
    if (!validation.valid) {
      return {
        success: false,
        skill: transformedSkill,
        errors: validation.errors
      };
    }
  }
  
  const result = await retryApiCall(SKILLS_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(transformedSkill)
  });
  
  return {
    success: result.success,
    skill: transformedSkill,
    response: result.data,
    errors: result.success ? [] : [result.error || result.data?.error || 'Unknown error']
  };
}

async function migrateAllSkills() {
  console.log('🎯 Starting skills migration...\n');
  
  const results = {
    total: 0,
    successful: 0,
    failed: 0,
    details: []
  };
  
  // Count total skills
  for (const characterData of Object.values(SKILLS_DATA)) {
    results.total += characterData.skills.length;
  }
  
  console.log(`📊 Total skills to migrate: ${results.total}`);
  
  // Process each character's skills
  for (const [characterKey, characterData] of Object.entries(SKILLS_DATA)) {
    console.log(`\n🎭 Processing ${characterData.characterName} (${characterData.culture})`);
    console.log(`   ${characterData.skills.length} skills to migrate:`);
    
    for (const skill of characterData.skills) {
      console.log(`\n   🔮 Migrating: ${skill.name}`);
      
      const result = await migrateSkill(skill);
      results.details.push(result);
      
      if (result.success) {
        results.successful++;
        console.log(`   ✅ Success: ${skill.name}`);
        if (result.response?.metadata) {
          console.log(`      Skill ID: ${result.response.data?.skill?.id || 'Generated'}`);
        }
      } else {
        results.failed++;
        console.log(`   ❌ Failed: ${skill.name}`);
        console.log(`      Errors: ${result.errors.join(', ')}`);
      }
      
      // Small delay to prevent overwhelming the API
      await delay(100);
    }
  }
  
  return results;
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');
  
  const result = await makeApiCall(SKILLS_ENDPOINT);
  
  if (result.success) {
    const skillsData = result.data;
    console.log(`✅ Migration verified:`);
    console.log(`   Total skills in database: ${skillsData.data?.totalCount || skillsData.data?.skills?.length || 0}`);
    
    if (skillsData.data?.skills) {
      const skillsByCharacter = {};
      skillsData.data.skills.forEach(skill => {
        if (!skillsByCharacter[skill.characterName]) {
          skillsByCharacter[skill.characterName] = [];
        }
        skillsByCharacter[skill.characterName].push(skill);
      });
      
      console.log(`   Skills by character:`);
      for (const [character, skills] of Object.entries(skillsByCharacter)) {
        console.log(`     ${character}: ${skills.length} skills`);
      }
    }
    
    return { success: true, data: skillsData.data };
  } else {
    console.error('❌ Failed to verify migration');
    return { success: false, error: result.error };
  }
}

/**
 * Main Migration Process
 */
async function main() {
  console.log(`
🎭 RPGStack Skills Migration Script
===================================

This script will migrate ${Object.keys(SKILLS_DATA).length} characters' skills 
from frontend JavaScript files to the backend API.

Configuration:
- API Base URL: ${API_BASE_URL}
- Batch Size: ${CONFIG.batchSize}
- Retry Attempts: ${CONFIG.retryAttempts}
- Validate Data: ${CONFIG.validateData}
- Create Backup: ${CONFIG.backupExisting}
`);

  try {
    // Step 1: Check API connection
    const apiConnected = await checkApiConnection();
    if (!apiConnected) {
      console.error('\n❌ Cannot proceed without API connection');
      process.exit(1);
    }
    
    // Step 2: Backup existing data
    const backup = await backupExistingSkills();
    if (!backup.success) {
      console.error('\n❌ Backup failed:', backup.error);
      process.exit(1);
    }
    
    // Step 3: Migrate skills
    const migrationResults = await migrateAllSkills();
    
    // Step 4: Print summary
    console.log(`
📋 Migration Summary
===================
Total Skills: ${migrationResults.total}
Successful: ${migrationResults.successful} ✅
Failed: ${migrationResults.failed} ❌
Success Rate: ${((migrationResults.successful / migrationResults.total) * 100).toFixed(1)}%
`);
    
    if (migrationResults.failed > 0) {
      console.log('\n❌ Failed Skills:');
      migrationResults.details
        .filter(result => !result.success)
        .forEach(result => {
          console.log(`   • ${result.skill.name}: ${result.errors.join(', ')}`);
        });
    }
    
    // Step 5: Verify migration
    const verification = await verifyMigration();
    
    if (verification.success && migrationResults.successful > 0) {
      console.log(`
🎉 Migration completed successfully!

The skills have been registered in the backend and are now available via:
- GET ${SKILLS_ENDPOINT} (list all skills)
- GET ${SKILLS_ENDPOINT}/search?q=<term> (search skills)  
- GET ${SKILLS_ENDPOINT}/type/<type> (skills by type)
- GET ${SKILLS_ENDPOINT}/classe/<classe> (skills by class)
- GET ${SKILLS_ENDPOINT}/statistics (skill statistics)

Each character now has their 3 culturally authentic skills properly
registered with the backend Skills API system.
`);
    } else if (migrationResults.successful === 0) {
      console.error('\n❌ Migration failed completely. No skills were registered.');
      process.exit(1);
    } else {
      console.log('\n⚠️  Partial migration completed. Some skills may not be available.');
    }
    
  } catch (error) {
    console.error('\n💥 Migration script error:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Execute migration
if (import.meta.url === `file://${__filename}`) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { SKILLS_DATA, migrateAllSkills };