import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import cors from 'cors';
import crypto from 'crypto';
import chokidar from 'chokidar';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { SkillController } from './src/presentation/controllers/SkillController.js';
import { PassiveAbilityController } from './src/presentation/controllers/PassiveAbilityController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3002;

// Middleware básico
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// IMPORTANTE: Servir arquivos de sprites estaticamente
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Configurar multer
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = path.join(__dirname, 'assets', 'sprites');
    try {
      await fs.mkdir(dir, { recursive: true });
      cb(null, dir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Extract character name from the request
    const characterName = req.body.name || 'character';
    const extension = file.originalname.split('.').pop().toLowerCase();
    
    // Use spriteFilename if provided, otherwise generate from character name
    const filename = req.body.spriteFilename || 
                    `${characterName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}.${extension}`;
    cb(null, filename);
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato não suportado'));
    }
  },
});

// Configurar multer para bulk import (memory storage)
const bulkUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for JSON files
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos JSON são aceitos para importação em massa'));
    }
  },
});

// Caminhos
const DB_PATH = path.join(__dirname, 'data', 'characters.json');
const JS_EXPORT_PATH = path.join(__dirname, 'exports', 'character_database.js');
const BACKUPS_PATH = path.join(__dirname, 'backups');

// **FUNÇÃO ATUALIZADA**: Gerar ID único sem conflito com IDs existentes
function generateUniqueHexId(existingIds = []) {
  let id;
  let attempts = 0;
  const maxAttempts = 1000;
  
  do {
    // Gerar 5 bytes aleatórios e converter para hex (10 caracteres)
    id = crypto.randomBytes(5).toString('hex').toUpperCase();
    attempts++;
    
    if (attempts >= maxAttempts) {
      throw new Error('Não foi possível gerar um ID único após múltiplas tentativas');
    }
    // Verificar contra TODOS os IDs existentes (HEX e legados)
  } while (existingIds.includes(id) || existingIds.includes(id.toLowerCase()));
  
  return id;
}

// **FUNÇÃO ATUALIZADA**: Verificar banco sem alterar IDs existentes
async function initializeDatabase() {
  try {
    const data = await loadDatabase();
    
    // Log dos IDs existentes sem alterá-los
    const existingIds = Object.keys(data.characters || {});
    if (existingIds.length > 0) {
      console.log('📋 IDs existentes encontrados (MANTIDOS INTACTOS):');
      existingIds.forEach(id => {
        const char = data.characters[id];
        const idType = /^[A-F0-9]{10}$/i.test(id) ? 'HEX' : 'LEGACY';
        console.log(`   • ${char.name}: ${id} (${idType})`);
      });
      console.log(`✅ Total: ${existingIds.length} personagens preservados`);
    }
    
    // Remover nextId se existir (sistema legado)
    if (data.nextId) {
      console.log('🔄 Removendo campo nextId (sistema legado)...');
      delete data.nextId;
      await saveDatabase(data);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Erro na inicialização:', error);
    return await loadDatabase();
  }
}

// Inicializar pastas
async function initializeDirectories() {
  const dirs = [
    path.join(__dirname, 'data'),
    path.join(__dirname, 'assets', 'sprites'),
    path.join(__dirname, 'exports'),
    path.join(__dirname, 'public'),
  ];
  
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log('✅ Pasta criada:', dir);
    } catch (error) {
      console.log('ℹ️  Pasta já existe:', dir);
    }
  }
}

// Carregar banco
async function loadDatabase() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    const parsed = JSON.parse(data);
    
    // Remover nextId se existir (sistema antigo)
    if (parsed.nextId) {
      delete parsed.nextId;
    }
    
    return parsed;
  } catch (error) {
    console.log('📄 Criando novo banco de dados...');
    return { characters: {} };
  }
}

// Salvar banco
async function saveDatabase(data) {
  try {
    // Garantir que nextId não seja salvo
    const dataToSave = {
      characters: data.characters || {},
      system_classes: data.system_classes || [],
    };
    
    await fs.writeFile(DB_PATH, JSON.stringify(dataToSave, null, 2));
    await exportToJavaScript(dataToSave);
    console.log('💾 Banco de dados salvo!');
  } catch (error) {
    console.error('❌ Erro ao salvar:', error);
  }
}

// **NOVO**: Sistema de Backup (com Sprites)
async function createBackup(trigger = 'manual') {
  try {
    const data = await loadDatabase();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFolderName = `backup_${timestamp}_${trigger}`;
    const backupFolderPath = path.join(BACKUPS_PATH, backupFolderName);
    const dataFileName = 'characters.json';
    const spritesFolder = 'sprites';
    
    const backupData = {
      timestamp: new Date().toISOString(),
      trigger: trigger,
      version: '3.2.0',
      total_characters: Object.keys(data.characters || {}).length,
      characters: data.characters || {},
      includes_sprites: true,
    };
    
    // Garantir que os diretórios existem
    await fs.mkdir(BACKUPS_PATH, { recursive: true });
    await fs.mkdir(backupFolderPath, { recursive: true });
    await fs.mkdir(path.join(backupFolderPath, spritesFolder), { recursive: true });
    
    // Salvar dados JSON
    const dataFilePath = path.join(backupFolderPath, dataFileName);
    await fs.writeFile(dataFilePath, JSON.stringify(backupData, null, 2));
    
    // Fazer backup das sprites
    const spritesBackedUp = [];
    const spritesPath = path.join(__dirname, 'assets', 'sprites');
    
    for (const character of Object.values(data.characters || {})) {
      if (character.sprite) {
        try {
          const sourcePath = path.join(__dirname, character.sprite);
          const fileName = path.basename(character.sprite);
          const destinationPath = path.join(backupFolderPath, spritesFolder, fileName);
          
          // Verificar se o arquivo existe antes de copiar
          await fs.access(sourcePath);
          await fs.copyFile(sourcePath, destinationPath);
          spritesBackedUp.push(fileName);
          
        } catch (spriteError) {
          console.warn(`⚠️  Sprite não encontrada para backup: ${character.sprite}`);
        }
      }
    }
    
    console.log(`📦 Backup criado: ${backupFolderName} (${backupData.total_characters} personagens, ${spritesBackedUp.length} sprites)`);
    
    // Limpar backups antigos (manter apenas os 10 mais recentes automáticos)
    if (trigger === 'auto') {
      await cleanOldBackups();
    }
    
    return { 
      success: true, 
      filename: backupFolderName, 
      data: backupData,
      sprites_backed_up: spritesBackedUp.length,
    };
  } catch (error) {
    console.error('❌ Erro ao criar backup:', error);
    return { success: false, error: error.message };
  }
}

async function listBackups() {
  try {
    await fs.mkdir(BACKUPS_PATH, { recursive: true });
    const items = await fs.readdir(BACKUPS_PATH);
    const backups = [];
    
    for (const item of items) {
      // Processar tanto pastas (novo formato) quanto arquivos JSON (antigo formato)
      const itemPath = path.join(BACKUPS_PATH, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory() && item.startsWith('backup_')) {
        // Novo formato: pasta com sprites
        try {
          const dataFilePath = path.join(itemPath, 'characters.json');
          const content = await fs.readFile(dataFilePath, 'utf8');
          const backupData = JSON.parse(content);
          
          // Contar sprites na pasta
          const spritesPath = path.join(itemPath, 'sprites');
          let spriteCount = 0;
          try {
            const sprites = await fs.readdir(spritesPath);
            spriteCount = sprites.length;
          } catch (err) {
            spriteCount = 0;
          }
          
          backups.push({
            filename: item,
            timestamp: backupData.timestamp,
            trigger: backupData.trigger,
            size: await getFolderSize(itemPath),
            characters: backupData.total_characters || 0,
            sprites: spriteCount,
            includes_sprites: true,
            type: 'folder',
          });
        } catch (err) {
          console.warn(`Backup de pasta corrompido ignorado: ${item}`);
        }
      } else if (stats.isFile() && item.endsWith('.json') && item.startsWith('backup_')) {
        // Formato antigo: apenas JSON
        try {
          const content = await fs.readFile(itemPath, 'utf8');
          const backupData = JSON.parse(content);
          
          backups.push({
            filename: item,
            timestamp: backupData.timestamp,
            trigger: backupData.trigger,
            size: stats.size,
            characters: backupData.total_characters || 0,
            sprites: 0,
            includes_sprites: false,
            type: 'json',
          });
        } catch (err) {
          console.warn(`Backup JSON corrompido ignorado: ${item}`);
        }
      }
    }
    
    // Ordenar por data (mais recente primeiro)
    return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    console.error('❌ Erro ao listar backups:', error);
    return [];
  }
}

// Função auxiliar para calcular tamanho da pasta
async function getFolderSize(folderPath) {
  let totalSize = 0;
  try {
    const items = await fs.readdir(folderPath);
    for (const item of items) {
      const itemPath = path.join(folderPath, item);
      const stats = await fs.stat(itemPath);
      if (stats.isFile()) {
        totalSize += stats.size;
      } else if (stats.isDirectory()) {
        totalSize += await getFolderSize(itemPath);
      }
    }
  } catch (error) {
    console.warn('Erro ao calcular tamanho da pasta:', error);
  }
  return totalSize;
}

async function restoreFromBackup(filename) {
  try {
    const backupPath = path.join(BACKUPS_PATH, filename);
    const stats = await fs.stat(backupPath);
    
    let backupData;
    let hasSprites = false;
    let spritesRestored = 0;
    
    // Criar backup do estado atual antes de restaurar
    await createBackup('pre-restore');
    
    if (stats.isDirectory()) {
      // Novo formato: pasta com sprites
      const dataFilePath = path.join(backupPath, 'characters.json');
      const backupContent = await fs.readFile(dataFilePath, 'utf8');
      backupData = JSON.parse(backupContent);
      hasSprites = backupData.includes_sprites || false;
      
      // Restaurar sprites se existirem
      if (hasSprites) {
        const spritesBackupPath = path.join(backupPath, 'sprites');
        const spritesDestPath = path.join(__dirname, 'assets', 'sprites');
        
        try {
          const spriteFiles = await fs.readdir(spritesBackupPath);
          
          for (const spriteFile of spriteFiles) {
            try {
              const sourcePath = path.join(spritesBackupPath, spriteFile);
              const destPath = path.join(spritesDestPath, spriteFile);
              
              await fs.copyFile(sourcePath, destPath);
              spritesRestored++;
            } catch (spriteError) {
              console.warn(`⚠️  Erro ao restaurar sprite: ${spriteFile}`, spriteError.message);
            }
          }
          
          console.log(`🖼️  Sprites restauradas: ${spritesRestored}/${spriteFiles.length}`);
        } catch (spritesError) {
          console.warn('⚠️  Erro ao acessar pasta de sprites do backup:', spritesError.message);
        }
      }
      
    } else {
      // Formato antigo: apenas JSON
      const backupContent = await fs.readFile(backupPath, 'utf8');
      backupData = JSON.parse(backupContent);
    }
    
    // Restaurar dados do banco
    const dataToRestore = {
      characters: backupData.characters || {},
    };
    
    await saveDatabase(dataToRestore);
    
    const restoredCount = Object.keys(dataToRestore.characters).length;
    console.log(`🔄 Banco restaurado do backup: ${filename} (${restoredCount} personagens, ${spritesRestored} sprites)`);
    
    return { 
      success: true, 
      characters: restoredCount,
      sprites: spritesRestored,
      includes_sprites: hasSprites,
    };
  } catch (error) {
    console.error('❌ Erro ao restaurar backup:', error);
    return { success: false, error: error.message };
  }
}

async function cleanOldBackups() {
  try {
    const backups = await listBackups();
    const autoBackups = backups.filter(b => b.trigger === 'auto');
    
    if (autoBackups.length > 10) {
      const toDelete = autoBackups.slice(10); // Manter apenas os 10 mais recentes
      
      for (const backup of toDelete) {
        const backupPath = path.join(BACKUPS_PATH, backup.filename);
        
        if (backup.type === 'folder') {
          // Remover pasta recursivamente
          await fs.rm(backupPath, { recursive: true, force: true });
        } else {
          // Remover arquivo JSON
          await fs.unlink(backupPath);
        }
        
        console.log(`🗑️ Backup antigo removido: ${backup.filename}`);
      }
    }
  } catch (error) {
    console.error('❌ Erro ao limpar backups:', error);
  }
}

// **FUNÇÃO ATUALIZADA**: Exportar JS preservando IDs originais
async function exportToJavaScript(data) {
  try {
    let jsCode = '// RPGStack Characters - Generated automatically\n';
    jsCode += `// Generated at: ${new Date().toISOString()}\n`;
    jsCode += '// Mixed ID System: Legacy IDs preserved + New Hexadecimal IDs\n\n';
    jsCode += 'const CharacterDatabase = {\n';
    
    const characters = Object.values(data.characters || {});
    let legacyCount = 0;
    let hexCount = 0;
    
    characters.forEach((char, index) => {
      const key = char.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const isHexId = /^[A-F0-9]{10}$/i.test(char.id);
      const idType = isHexId ? 'HEX' : 'LEGACY';
      
      if (isHexId) hexCount++;
      else legacyCount++;
      
      jsCode += `  // ID: ${char.id} (${idType})\n`;
      jsCode += `  "${key}": ${JSON.stringify(char, null, 4)}`;
      if (index < characters.length - 1) jsCode += ',';
      jsCode += '\n\n';
    });
    
    jsCode += '};\n\n';
    jsCode += '// Statistics:\n';
    jsCode += `// Total characters: ${characters.length}\n`;
    jsCode += `// Legacy IDs: ${legacyCount}\n`;
    jsCode += `// Hexadecimal IDs: ${hexCount}\n\n`;
    
    if (legacyCount > 0) {
      jsCode += '// Legacy ID Examples (PRESERVED):\n';
      characters.filter(char => !/^[A-F0-9]{10}$/i.test(char.id)).slice(0, 3).forEach(char => {
        jsCode += `// ${char.name}: ${char.id}\n`;
      });
    }
    
    if (hexCount > 0) {
      jsCode += '// Hexadecimal ID Examples:\n';
      characters.filter(char => /^[A-F0-9]{10}$/i.test(char.id)).slice(0, 3).forEach(char => {
        jsCode += `// ${char.name}: ${char.id}\n`;
      });
    }
    
    jsCode += '\nmodule.exports = CharacterDatabase;\n';
    jsCode += '// For ES6: export default CharacterDatabase;\n';
    
    await fs.writeFile(JS_EXPORT_PATH, jsCode);
    console.log('🚀 JavaScript export created!');
  } catch (error) {
    console.error('❌ Erro ao exportar:', error);
  }
}

// ROTAS

// Teste de conexão
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API funcionando com sistema ID preservado!',
    timestamp: new Date().toISOString(),
    idSystem: {
      newCharacters: 'Hexadecimal 10 characters',
      existingCharacters: 'Preserved original IDs',
      immutable: true,
    },
  });
});

// GET: Obter todos os personagens
app.get('/api/characters', async (req, res) => {
  try {
    const data = await loadDatabase();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// **ROTA ATUALIZADA**: Criar novo personagem APENAS com ID hexadecimal
app.post('/api/characters', upload.single('sprite'), async (req, res) => {
  try {
    console.log('📝 Recebendo novo personagem...');
    console.log('📋 Dados recebidos do frontend:', req.body);
    const data = await loadDatabase();
    
    const {
      name, level, hp, attack, defense, defesa_especial, ataque_especial,
      aiType, description,
      skills, spriteFilename, classe, anima, critico,
    } = req.body;
    
    console.log('📊 Campos extraídos - classe:', classe, 'anima:', anima, 'critico:', critico);

    // **IMPORTANTE**: APENAS personagens NOVOS recebem ID hexadecimal
    const existingIds = Object.keys(data.characters || {});
    const newId = generateUniqueHexId(existingIds);
    console.log(`🔢 Novo ID hexadecimal gerado: ${newId}`);

    // Processar sprite
    let spritePath = null;
    if (req.file) {
      spritePath = `assets/sprites/${req.file.filename}`;
      console.log(`🖼️  Sprite salva: ${spritePath}`);
    } else if (spriteFilename) {
      spritePath = `assets/sprites/${spriteFilename}`;
    }

    // Criar personagem com ID hexadecimal IMUTÁVEL
    const character = {
      id: newId, // ID hexadecimal PERMANENTE - nunca será alterado
      name,
      level: parseInt(level),
      hp: parseInt(hp),
      maxHP: parseInt(hp),
      attack: parseInt(attack),
      defense: parseInt(defense),
      defesa_especial: parseInt(defesa_especial) || 10,
      ataque_especial: parseInt(ataque_especial) || parseInt(attack),
      sprite: spritePath,
      color: 0x4a5d23,
      borderColor: 0x2d3614,
      size: 12,
      ai_type: aiType,
      description,
      skills: JSON.parse(skills || '[]'),
      classe: classe || 'Lutador', // Campo classe adicionado
      anima: parseInt(anima) || 100, // Campo anima adicionado
      critico: parseFloat(critico) || 1.0, // Campo critico adicionado
      created_at: new Date().toISOString(),
    };

    data.characters[newId] = character;
    await saveDatabase(data);

    console.log(`✅ Personagem '${name}' salvo com ID PERMANENTE: ${newId}`);

    res.json({ 
      success: true, 
      character,
      message: `Personagem salvo com ID PERMANENTE: ${newId}!`,
      idInfo: {
        id: newId,
        type: 'HEXADECIMAL',
        immutable: true,
        note: 'Este ID nunca será alterado e pode ser usado como referência',
      },
      files: {
        sprite: spritePath,
        database: 'data/characters.json',
        export: 'exports/character_database.js',
      },
    });

  } catch (error) {
    console.error('❌ Erro ao salvar personagem:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST: Upload apenas de sprite (base64)
app.post('/api/upload-sprite', async (req, res) => {
  try {
    const { imageData, filename } = req.body;
    
    if (!imageData || !filename) {
      return res.status(400).json({ error: 'Dados insuficientes' });
    }

    // Decodificar base64
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Salvar arquivo
    const dir = path.join(__dirname, 'assets', 'sprites');
    await fs.mkdir(dir, { recursive: true });
    
    const filePath = path.join(dir, filename);
    await fs.writeFile(filePath, buffer);
    
    console.log(`🖼️  Sprite salva: assets/sprites/${filename}`);
    
    res.json({ 
      success: true, 
      path: `assets/sprites/${filename}`,
      message: 'Sprite salva automaticamente!',
      url: `http://localhost:${PORT}/assets/sprites/${filename}`,
    });

  } catch (error) {
    console.error('❌ Erro ao salvar sprite:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST: Renomear sprite existente
app.post('/api/rename-sprite', async (req, res) => {
  try {
    const { oldFilename, newFilename } = req.body;
    
    if (!oldFilename || !newFilename) {
      return res.status(400).json({ error: 'Nome antigo e novo são obrigatórios' });
    }

    if (oldFilename === newFilename) {
      return res.json({ success: true, message: 'Nomes iguais, nenhuma alteração necessária' });
    }

    const spritesDir = path.join(__dirname, 'assets', 'sprites');
    const oldPath = path.join(spritesDir, oldFilename);
    const newPath = path.join(spritesDir, newFilename);

    // Verificar se o arquivo antigo existe
    try {
      await fs.access(oldPath);
    } catch (error) {
      return res.status(404).json({ error: `Arquivo não encontrado: ${oldFilename}` });
    }

    // Verificar se o novo nome já existe
    try {
      await fs.access(newPath);
      return res.status(409).json({ error: `Arquivo já existe: ${newFilename}` });
    } catch (error) {
      // Arquivo não existe, ok para renomear
    }

    // Renomear o arquivo
    await fs.rename(oldPath, newPath);
    
    console.log(`📝 Sprite renomeada: ${oldFilename} → ${newFilename}`);
    
    res.json({
      success: true,
      message: `Sprite renomeada de ${oldFilename} para ${newFilename}`,
      oldPath: `assets/sprites/${oldFilename}`,
      newPath: `assets/sprites/${newFilename}`,
      newUrl: `http://localhost:${PORT}/assets/sprites/${newFilename}`,
    });

  } catch (error) {
    console.error('❌ Erro ao renomear sprite:', error);
    res.status(500).json({ error: error.message });
  }
});

// **ROTA ATUALIZADA**: Excluir personagem por ID hexadecimal
app.delete('/api/characters/:id', async (req, res) => {
  try {
    const id = req.params.id; // Agora é string hexadecimal
    console.log(`🗑️  Solicitação de exclusão recebida para ID: ${id}`);
    
    // Criar backup antes de deletar
    try {
      await createBackup('auto');
      console.log('📦 Backup automático criado antes da exclusão');
    } catch (backupError) {
      console.warn('⚠️  Erro ao criar backup, prosseguindo com exclusão:', backupError.message);
    }
    
    const data = await loadDatabase();
    
    if (data.characters[id]) {
      const character = data.characters[id];
      console.log(`🗑️  Excluindo personagem: ${character.name} (ID: ${id})`);
      
      // Tentar remover sprite se existir
      if (character.sprite) {
        try {
          await fs.unlink(path.join(__dirname, character.sprite));
          console.log(`🖼️  Sprite removida: ${character.sprite}`);
        } catch (e) {
          console.log('ℹ️  Sprite não encontrada:', character.sprite);
        }
      }
      
      delete data.characters[id];
      await saveDatabase(data);
      
      res.json({ success: true, message: `Personagem excluído automaticamente! (ID: ${id})` });
    } else {
      res.status(404).json({ error: 'Personagem não encontrado' });
    }
  } catch (error) {
    console.error('❌ Erro ao excluir:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT: Atualizar personagem existente (preservando ID IMUTÁVEL)
app.put('/api/characters/:id', upload.single('sprite'), async (req, res) => {
  try {
    console.log('📝 Atualizando personagem...');
    const data = await loadDatabase();
    const id = req.params.id; // ID é IMUTÁVEL
    
    if (!data.characters[id]) {
      return res.status(404).json({ error: 'Personagem não encontrado' });
    }
    
    const existingCharacter = data.characters[id];
    console.log(`🔄 Atualizando personagem: ${existingCharacter.name} (ID: ${id})`);
    
    const {
      name, level, hp, attack, defense, defesa_especial, ataque_especial,
      aiType, description,
      skills, spriteFilename, classe, anima, critico,
    } = req.body;

    // Processar sprite se fornecida
    let spritePath = existingCharacter.sprite; // Manter sprite existente por padrão
    if (req.file) {
      spritePath = `assets/sprites/${req.file.filename}`;
      console.log(`🖼️  Nova sprite salva: ${spritePath}`);
      
      // Remover sprite antiga se existir e for diferente
      if (existingCharacter.sprite && existingCharacter.sprite !== spritePath) {
        try {
          await fs.unlink(path.join(__dirname, existingCharacter.sprite));
          console.log(`🗑️  Sprite antiga removida: ${existingCharacter.sprite}`);
        } catch (e) {
          console.log('ℹ️  Sprite antiga não encontrada:', existingCharacter.sprite);
        }
      }
    } else if (spriteFilename) {
      spritePath = `assets/sprites/${spriteFilename}`;
    }

    // Atualizar personagem preservando ID IMUTÁVEL e data de criação
    const updatedCharacter = {
      ...existingCharacter, // Manter dados existentes
      id: id, // ID NUNCA MUDA (IMUTÁVEL)
      name: name || existingCharacter.name,
      level: level ? parseInt(level) : existingCharacter.level,
      hp: hp ? parseInt(hp) : existingCharacter.hp,
      maxHP: hp ? parseInt(hp) : existingCharacter.maxHP,
      attack: attack ? parseInt(attack) : existingCharacter.attack,
      defense: defense ? parseInt(defense) : existingCharacter.defense,
      defesa_especial: defesa_especial ? parseInt(defesa_especial) : (existingCharacter.defesa_especial || 10),
      ataque_especial: ataque_especial ? parseInt(ataque_especial) : (existingCharacter.ataque_especial || existingCharacter.attack),
      sprite: spritePath,
      ai_type: aiType || existingCharacter.ai_type,
      description: description !== undefined ? description : existingCharacter.description,
      skills: skills ? JSON.parse(skills) : existingCharacter.skills,
      classe: classe || existingCharacter.classe,
      anima: anima ? parseInt(anima) : existingCharacter.anima,
      critico: critico ? parseFloat(critico) : existingCharacter.critico,
      updated_at: new Date().toISOString(), // Adicionar timestamp de atualização
    };

    data.characters[id] = updatedCharacter;
    await saveDatabase(data);

    console.log(`✅ Personagem '${updatedCharacter.name}' atualizado! ID PRESERVADO: ${id}`);

    res.json({ 
      success: true, 
      character: updatedCharacter,
      message: `Personagem atualizado com sucesso! ID preservado: ${id}`,
      idInfo: {
        id: id,
        preserved: true,
        immutable: true,
      },
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar personagem:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET: Baixar arquivo exportado
app.get('/api/export/js', (req, res) => {
  console.log('📥 Download do arquivo JavaScript solicitado');
  res.download(JS_EXPORT_PATH, 'character_database.js', (err) => {
    if (err) {
      console.error('❌ Erro no download JS:', err);
      res.status(500).json({ error: 'Arquivo não encontrado' });
    }
  });
});


// GET: Listar sprites disponíveis
app.get('/api/sprites', async (req, res) => {
  try {
    const spritesDir = path.join(__dirname, 'assets', 'sprites');
    const files = await fs.readdir(spritesDir);
    const sprites = files
      .filter(file => /\.(png|jpg|jpeg|gif|webp)$/i.test(file))
      .map(file => ({
        filename: file,
        url: `http://localhost:${PORT}/assets/sprites/${file}`,
        path: `assets/sprites/${file}`,
      }));
    
    res.json({ sprites, total: sprites.length });
  } catch (error) {
    res.json({ sprites: [], total: 0 });
  }
});

// **NOVA ROTA**: Gerar novo ID hexadecimal (para testes)
app.get('/api/generate-id', async (req, res) => {
  try {
    const data = await loadDatabase();
    const existingIds = Object.keys(data.characters || {});
    const newId = generateUniqueHexId(existingIds);
    
    res.json({
      id: newId,
      format: 'Hexadecimal 10 characters',
      example: `Character ID: ${newId}`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// **NOVA ROTA**: Obter classes disponíveis
app.get('/api/classes', async (req, res) => {
  try {
    const data = await loadDatabase();
    
    // Extrair classes únicas dos personagens
    const classes = new Set();
    Object.values(data.characters || {}).forEach(char => {
      if (char.classe) {
        classes.add(char.classe);
      }
    });
    
    // Adicionar classes persistentes do sistema (se existir)
    if (data.system_classes && Array.isArray(data.system_classes)) {
      data.system_classes.forEach(classe => classes.add(classe));
    }
    
    res.json({
      success: true,
      classes: Array.from(classes).sort(),
      total: classes.size
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// **NOVA ROTA**: Adicionar nova classe ao sistema
app.post('/api/classes', async (req, res) => {
  try {
    const { className } = req.body;
    
    if (!className || typeof className !== 'string') {
      return res.status(400).json({ error: 'Nome da classe é obrigatório' });
    }
    
    const cleanClassName = className.trim();
    if (!cleanClassName) {
      return res.status(400).json({ error: 'Nome da classe não pode estar vazio' });
    }
    
    const data = await loadDatabase();
    
    // Inicializar array de classes do sistema se não existir
    if (!data.system_classes) {
      data.system_classes = [];
    }
    
    // Verificar se a classe já existe
    const existingClasses = new Set();
    Object.values(data.characters || {}).forEach(char => {
      if (char.classe) existingClasses.add(char.classe);
    });
    data.system_classes.forEach(classe => existingClasses.add(classe));
    
    if (existingClasses.has(cleanClassName)) {
      return res.status(409).json({ error: 'Classe já existe no sistema' });
    }
    
    // Adicionar nova classe
    data.system_classes.push(cleanClassName);
    await saveDatabase(data);
    
    console.log(`✅ Nova classe adicionada: ${cleanClassName}`);
    
    res.json({
      success: true,
      message: `Classe '${cleanClassName}' adicionada com sucesso`,
      className: cleanClassName
    });
  } catch (error) {
    console.error('❌ Erro ao adicionar classe:', error);
    res.status(500).json({ error: error.message });
  }
});

// **NOVA ROTA**: Deletar classe do sistema
app.delete('/api/classes/:className', async (req, res) => {
  try {
    const { className } = req.params;
    
    if (!className || typeof className !== 'string') {
      return res.status(400).json({ error: 'Nome da classe é obrigatório' });
    }
    
    const cleanClassName = decodeURIComponent(className.trim());
    if (!cleanClassName) {
      return res.status(400).json({ error: 'Nome da classe não pode estar vazio' });
    }
    
    const data = await loadDatabase();
    
    // Verificar se a classe está sendo usada por personagens
    const charactersUsingClass = Object.values(data.characters || {}).filter(char => char.classe === cleanClassName);
    if (charactersUsingClass.length > 0) {
      return res.status(409).json({ 
        error: `Não é possível deletar a classe "${cleanClassName}" pois está sendo usada por ${charactersUsingClass.length} personagem(s)`,
        charactersCount: charactersUsingClass.length
      });
    }
    
    // Verificar se a classe existe no sistema
    if (!data.system_classes || !data.system_classes.includes(cleanClassName)) {
      return res.status(404).json({ error: 'Classe não encontrada no sistema' });
    }
    
    // Remover classe do array
    data.system_classes = data.system_classes.filter(classe => classe !== cleanClassName);
    await saveDatabase(data);
    
    console.log(`🗑️ Classe removida: ${cleanClassName}`);
    
    res.json({
      success: true,
      message: `Classe '${cleanClassName}' removida com sucesso`,
      className: cleanClassName
    });
  } catch (error) {
    console.error('❌ Erro ao remover classe:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST: Bulk import characters from JSON file
app.post('/api/bulk-import', bulkUpload.single('bulkData'), async (req, res) => {
  try {
    console.log('📥 Iniciando importação em massa...');
    
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    
    // Criar backup antes da importação
    await createBackup('auto');

    // Read and parse the uploaded JSON file
    const fileContent = req.file.buffer.toString('utf8');
    let importData;
    
    try {
      importData = JSON.parse(fileContent);
    } catch (parseError) {
      return res.status(400).json({ error: 'Arquivo JSON inválido' });
    }

    // Validate structure
    if (!importData.characters || typeof importData.characters !== 'object') {
      return res.status(400).json({ error: 'Estrutura de dados inválida. Esperado: {"characters": {...}}' });
    }

    const data = await loadDatabase();
    const existingIds = Object.keys(data.characters || {});
    const importCharacters = importData.characters;
    
    let imported = 0;
    let skipped = 0;
    let conflicts = 0;
    const results = [];

    // Process each character
    for (const [importId, character] of Object.entries(importCharacters)) {
      try {
        // Validate character data
        if (!character.name || !character.level || !character.hp) {
          results.push({
            id: importId,
            name: character.name || 'Unknown',
            status: 'skipped',
            reason: 'Dados obrigatórios ausentes (name, level, hp)',
          });
          skipped++;
          continue;
        }

        let finalId = importId;
        
        // Handle ID conflicts
        if (existingIds.includes(importId)) {
          // Generate new hex ID for conflicting imports
          finalId = generateUniqueHexId([...existingIds, ...Object.keys(data.characters)]);
          conflicts++;
          results.push({
            id: importId,
            newId: finalId,
            name: character.name,
            status: 'conflict_resolved',
            reason: `ID ${importId} já existe. Novo ID gerado: ${finalId}`,
          });
        } else {
          results.push({
            id: finalId,
            name: character.name,
            status: 'imported',
            reason: 'Importado com sucesso',
          });
        }

        // Create character with proper structure
        const importedCharacter = {
          id: finalId,
          name: character.name,
          level: parseInt(character.level) || 1,
          hp: parseInt(character.hp) || 10,
          maxHP: parseInt(character.hp) || 10,
          attack: parseInt(character.attack) || 1,
          defense: parseInt(character.defense) || 1,
          defesa_especial: parseInt(character.defesa_especial) || 10,
          ataque_especial: parseInt(character.ataque_especial) || parseInt(character.attack) || 1,
          sprite: character.sprite || null,
          color: character.color || 0x4a5d23,
          borderColor: character.borderColor || 0x2d3614,
          size: character.size || 12,
          ai_type: character.ai_type || 'aggressive',
          description: character.description || '',
          skills: Array.isArray(character.skills) ? character.skills : [],
          created_at: character.created_at || new Date().toISOString(),
          imported_at: new Date().toISOString(),
        };

        data.characters[finalId] = importedCharacter;
        existingIds.push(finalId);
        imported++;

      } catch (charError) {
        results.push({
          id: importId,
          name: character.name || 'Unknown',
          status: 'error',
          reason: `Erro ao processar: ${charError.message}`,
        });
        skipped++;
      }
    }

    await saveDatabase(data);

    const summary = {
      total: Object.keys(importCharacters).length,
      imported,
      skipped,
      conflicts,
      results,
    };

    console.log(`✅ Importação concluída: ${imported} importados, ${skipped} ignorados, ${conflicts} conflitos resolvidos`);

    res.json({
      success: true,
      message: `Importação concluída: ${imported} personagens importados`,
      summary,
    });

  } catch (error) {
    console.error('❌ Erro na importação em massa:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET: Bulk export all characters
app.get('/api/bulk-export', async (req, res) => {
  try {
    console.log('📤 Iniciando exportação em massa...');
    const data = await loadDatabase();
    
    const exportData = {
      exported_at: new Date().toISOString(),
      version: '3.2.0',
      total_characters: Object.keys(data.characters || {}).length,
      characters: data.characters || {},
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="bulk_characters_export.json"');
    
    console.log(`✅ Exportação concluída: ${exportData.total_characters} personagens`);
    res.json(exportData);

  } catch (error) {
    console.error('❌ Erro na exportação em massa:', error);
    res.status(500).json({ error: error.message });
  }
});

// **NOVO**: Backup System Endpoints

// POST: Criar backup manual
app.post('/api/backup', async (req, res) => {
  try {
    console.log('📦 Solicitação de backup manual recebida');
    const result = await createBackup('manual');
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Backup criado com sucesso',
        filename: result.filename,
        characters: result.data.total_characters,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('❌ Erro ao criar backup:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET: Listar backups disponíveis
app.get('/api/backups', async (req, res) => {
  try {
    const backups = await listBackups();
    res.json({
      success: true,
      backups: backups,
    });
  } catch (error) {
    console.error('❌ Erro ao listar backups:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST: Restaurar do backup
app.post('/api/restore/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    console.log(`🔄 Solicitação de restore do backup: ${filename}`);
    
    const result = await restoreFromBackup(filename);
    
    if (result.success) {
      res.json({
        success: true,
        message: `Banco restaurado com sucesso (${result.characters} personagens)`,
        characters: result.characters,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('❌ Erro ao restaurar backup:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE: Remover backup específico (pasta ou arquivo)
app.delete('/api/backup/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(BACKUPS_PATH, filename);
    
    // Verificar se o backup existe
    await fs.access(backupPath);
    
    const stats = await fs.stat(backupPath);
    
    if (stats.isDirectory()) {
      // Remover pasta de backup recursivamente
      await fs.rm(backupPath, { recursive: true, force: true });
      console.log(`🗑️ Backup pasta removido: ${filename}`);
    } else {
      // Remover arquivo JSON
      await fs.unlink(backupPath);
      console.log(`🗑️ Backup arquivo removido: ${filename}`);
    }
    
    res.json({
      success: true,
      message: `Backup ${filename} removido com sucesso`,
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'Backup não encontrado' });
    } else {
      console.error('❌ Erro ao remover backup:', error);
      res.status(500).json({ error: error.message });
    }
  }
});

// Página Principal (RPGStack Hub)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Character Database Module
app.get('/characters', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'character-database.html'));
});

// Skills Database Module
app.get('/skills', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'skills.html'));
});

// Classes Database Module
app.get('/class-database', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'class-database.html'));
});

// Maps Database Module
app.get('/maps', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'maps-database.html'));
});

// Middleware de erro para upload
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Arquivo muito grande! Máximo 2MB.',
      });
    }
  }
  
  if (error.message === 'Formato não suportado') {
    return res.status(400).json({
      error: 'Formato de arquivo não suportado! Use PNG, JPG, GIF ou WEBP.',
    });
  }
  
  next(error);
});

// =====================================
// MAPS SYSTEM INTEGRATION
// =====================================

// Import Maps system components
import { JsonMapRepository } from './src/infrastructure/maps/repositories/JsonMapRepository.js';
import { MapAssetManager } from './src/infrastructure/maps/file-system/MapAssetManager.js';
import { MapService } from './src/application/maps/services/MapService.js';
import { MapProgressService } from './src/application/maps/services/MapProgressService.js';
import { MapController } from './src/infrastructure/maps/web/controllers/MapController.js';
import { createMapRoutes } from './src/infrastructure/maps/web/routes/mapRoutes.js';
import { JsonCharacterRepository } from './src/infrastructure/repositories/JsonCharacterRepository.js';
import { SecureBattleMechanics } from './src/battle/BattleMechanics.js';

// Maps system instances
let mapRepository;
let mapAssetManager;
let mapService;
let mapProgressService;
let mapController;

// Initialize Maps system
async function initializeMapsSystem() {
  try {
    console.log('🗺️ Inicializando Maps System...');
    
    // Create Maps repository
    mapRepository = new JsonMapRepository('data/maps.json', 'backups/maps/');
    await mapRepository.initialize();
    
    // Create asset manager
    mapAssetManager = new MapAssetManager('assets/maps');
    await mapAssetManager.initialize();
    
    // Create character repository for Maps system
    const characterRepository = new JsonCharacterRepository('data/characters.json', 'backups/characters/');
    await characterRepository.initialize();
    
    // Create Maps services
    mapService = new MapService(mapRepository, characterRepository, mapAssetManager);
    mapProgressService = new MapProgressService(mapRepository, null, characterRepository); // Progress repository will be implemented later
    
    // Create Maps controller
    mapController = new MapController(mapService, mapProgressService);
    
    // Setup Maps API routes
    const mapRoutes = createMapRoutes(mapController);
    app.use('/api/v2/maps', mapRoutes);
    
    console.log('✅ Maps System inicializado com sucesso');
    console.log('🌐 Maps API disponível em /api/v2/maps');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar Maps System:', error);
    throw error;
  }
}

// 🎯 **SKILLS SYSTEM** - Skills Management System
console.log('🎯 Inicializando Skills System...');

// Initialize Skills Controller
const skillController = new SkillController();

// Initialize PassiveAbility Controller  
const passiveAbilityController = new PassiveAbilityController();

// Skills API Routes (specific routes first, then parameterized routes)
app.get('/api/skills/search', skillController.searchSkills);
app.get('/api/skills/basic', skillController.getBasicSkills);
app.get('/api/skills/combat', skillController.getCombatSkills);
app.get('/api/skills/statistics', skillController.getSkillStatistics);
app.get('/api/skills/generate-id', skillController.generateSkillId);
app.get('/api/skills/categories', skillController.getValidSkillCategories);
app.get('/api/skills/type/:type', skillController.getSkillsByType);
app.get('/api/skills/classe/:classe', skillController.getSkillsByClasse);
app.get('/api/skills/category/:category', skillController.getSkillsByCategory);
app.get('/api/skills/:id', skillController.getSkill);
app.get('/api/skills', skillController.getAllSkills);

app.post('/api/skills', skillController.createSkill);
app.post('/api/skills/batch', skillController.createSkillsBatch);
app.post('/api/skills/validate/category', skillController.validateSkillCategory);

app.put('/api/skills/:id', skillController.updateSkill);

app.delete('/api/skills/:id', skillController.deleteSkill);

// Skill sprite endpoints (using memory storage for buffer access)
const skillSpriteUpload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato não suportado'));
    }
  }
});

app.post('/api/skills/:id/sprite', skillSpriteUpload.single('sprite'), skillController.uploadSkillSprite);
app.delete('/api/skills/:id/sprite', skillController.removeSkillSprite);

console.log('✅ Skills System inicializado com sucesso');
console.log('🎯 Skills API disponível em /api/skills');

// PassiveAbility API Routes
app.get('/api/passive-abilities/search', passiveAbilityController.searchPassiveAbilities);
app.get('/api/passive-abilities/always-active', passiveAbilityController.getAlwaysActivePassiveAbilities);
app.get('/api/passive-abilities/battle-triggered', passiveAbilityController.getBattleTriggeredPassiveAbilities);
app.get('/api/passive-abilities/statistics', passiveAbilityController.getPassiveAbilityStatistics);
app.get('/api/passive-abilities/generate-id', passiveAbilityController.generatePassiveAbilityId);
app.get('/api/passive-abilities/valid-cultures', passiveAbilityController.getValidCultures);
app.get('/api/passive-abilities/valid-triggers', passiveAbilityController.getValidTriggers);
app.get('/api/passive-abilities/valid-effect-types', passiveAbilityController.getValidEffectTypes);
app.get('/api/passive-abilities/culture/:culture', passiveAbilityController.getPassiveAbilitiesByCulture);
app.get('/api/passive-abilities/trigger/:trigger', passiveAbilityController.getPassiveAbilitiesByTrigger);
app.get('/api/passive-abilities/:id', passiveAbilityController.getPassiveAbility);
app.get('/api/passive-abilities', passiveAbilityController.getAllPassiveAbilities);

app.post('/api/passive-abilities', passiveAbilityController.createPassiveAbility);
app.post('/api/passive-abilities/batch', passiveAbilityController.createPassiveAbilitiesBatch);

app.put('/api/passive-abilities/:id', passiveAbilityController.updatePassiveAbility);
app.delete('/api/passive-abilities/:id', passiveAbilityController.deletePassiveAbility);

console.log('✅ PassiveAbilities System inicializado com sucesso');
console.log('🎭 PassiveAbilities API disponível em /api/passive-abilities');

// ⚔️ **SECURE BATTLE SYSTEM** - Anti-Cheat Backend
const secureBattleMechanics = new SecureBattleMechanics();

// Cleanup old battles every 5 minutes
setInterval(() => {
  secureBattleMechanics.cleanupOldBattles();
}, 5 * 60 * 1000);

// ⚔️ **SECURE BATTLE ROUTES** - Anti-Cheat System

// Iniciar batalha 3v3 segura
app.post('/api/secure-battle/start', async (req, res) => {
  try {
    const { playerTeam, enemyTeam, battleType } = req.body;
    
    if (!playerTeam || !Array.isArray(playerTeam) || playerTeam.length !== 3) {
      return res.status(400).json({ error: 'Equipe do jogador deve ter exatamente 3 personagens' });
    }

    if (!enemyTeam || !Array.isArray(enemyTeam) || enemyTeam.length !== 3) {
      return res.status(400).json({ error: 'Equipe inimiga deve ter exatamente 3 personagens' });
    }

    // Validar que todos os personagens existem no banco
    const data = await loadDatabase();
    
    for (const char of [...playerTeam, ...enemyTeam]) {
      if (!data.characters[char.id]) {
        return res.status(404).json({ error: `Personagem ${char.id} não encontrado` });
      }
    }

    const result = await secureBattleMechanics.createSecureBattle(playerTeam, enemyTeam, battleType || '3v3');
    
    console.log(`⚔️ Nova batalha segura iniciada: ${result.battleId}`);
    
    res.json({
      success: true,
      battleId: result.battleId,
      battle: result.battle
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar batalha segura:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obter estado atual da batalha
app.get('/api/secure-battle/:battleId', (req, res) => {
  try {
    const { battleId } = req.params;
    const battle = secureBattleMechanics.getBattle(battleId);
    
    if (!battle) {
      return res.status(404).json({ error: 'Batalha não encontrada' });
    }

    res.json({
      success: true,
      battle: battle
    });

  } catch (error) {
    console.error('❌ Erro ao buscar batalha:', error);
    res.status(500).json({ error: error.message });
  }
});

// Executar ataque seguro
app.post('/api/secure-battle/:battleId/attack', async (req, res) => {
  try {
    const { battleId } = req.params;
    const { attackerId, targetId, skillData } = req.body;

    if (!attackerId || !targetId) {
      return res.status(400).json({ error: 'Atacante e alvo são obrigatórios' });
    }

    const result = await secureBattleMechanics.executeAttack(battleId, attackerId, targetId, skillData);
    
    console.log(`⚔️ Ataque executado na batalha ${battleId}: ${result.damage} de dano`);
    
    res.json(result);

  } catch (error) {
    console.error('❌ Erro ao executar ataque:', error);
    res.status(400).json({ error: error.message });
  }
});

// Executar troca segura
app.post('/api/secure-battle/:battleId/swap', (req, res) => {
  try {
    const { battleId } = req.params;
    const { fromIndex, toIndex, newActiveIndex } = req.body;

    console.log(`🔄 [DEBUG] Swap request - battleId: ${battleId}, fromIndex: ${fromIndex}, toIndex: ${toIndex}, newActiveIndex: ${newActiveIndex}`);

    // Aceitar tanto o formato antigo (newActiveIndex) quanto o novo (toIndex)
    const targetIndex = newActiveIndex !== undefined ? newActiveIndex : toIndex;

    if (targetIndex === undefined || targetIndex === null) {
      return res.status(400).json({ error: 'Índice do personagem de destino é obrigatório (toIndex ou newActiveIndex)' });
    }

    const result = secureBattleMechanics.executeSwap(battleId, targetIndex);
    
    console.log(`⚔️ Troca executada na batalha ${battleId}: ${result.swapsRemaining} trocas restantes`);
    
    res.json(result);

  } catch (error) {
    console.error('❌ Erro ao executar troca:', error);
    res.status(400).json({ error: error.message });
  }
});

// Encerrar batalha
app.delete('/api/secure-battle/:battleId', (req, res) => {
  try {
    const { battleId } = req.params;
    
    if (secureBattleMechanics.activeBattles.has(battleId)) {
      secureBattleMechanics.activeBattles.delete(battleId);
      console.log(`⚔️ Batalha encerrada: ${battleId}`);
      res.json({ success: true, message: 'Batalha encerrada com sucesso' });
    } else {
      res.status(404).json({ error: 'Batalha não encontrada' });
    }

  } catch (error) {
    console.error('❌ Erro ao encerrar batalha:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/battle/:battleId', (req, res) => {
  try {
    const { battleId } = req.params;
    const battle = battles.get(battleId);
    
    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    res.json({
      success: true,
      battle: {
        id: battle.id,
        player: battle.player,
        enemy: battle.enemy,
        turn: battle.turn,
        round: battle.round,
        status: battle.status,
        log: battle.log
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar batalha:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/battle/:battleId/action', (req, res) => {
  try {
    const { battleId } = req.params;
    const { action, target } = req.body;
    const battle = battles.get(battleId);
    
    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    if (battle.status !== 'active') {
      return res.status(400).json({ error: 'Battle is not active' });
    }

    if (battle.turn !== 'player') {
      return res.status(400).json({ error: 'Not player turn' });
    }

    // Process player action
    let actionResult = processPlayerAction(battle, action);
    battle.log.push(actionResult);

    // Check battle end
    if (battle.player.currentHP <= 0) {
      battle.status = 'defeat';
      battle.log.push({ message: `${battle.player.name} foi derrotado!`, type: 'defeat' });
    } else if (battle.enemy.currentHP <= 0) {
      battle.status = 'victory';
      battle.log.push({ message: `${battle.enemy.name} foi derrotado!`, type: 'victory' });
    } else {
      // Enemy turn
      battle.turn = 'enemy';
      setTimeout(() => {
        if (battles.has(battleId) && battle.status === 'active') {
          const enemyResult = processEnemyAction(battle);
          battle.log.push(enemyResult);
          
          // Check battle end after enemy action
          if (battle.player.currentHP <= 0) {
            battle.status = 'defeat';
            battle.log.push({ message: `${battle.player.name} foi derrotado!`, type: 'defeat' });
          } else {
            battle.turn = 'player';
            battle.round++;
          }
        }
      }, 1000);
    }

    res.json({
      success: true,
      battle: {
        id: battle.id,
        player: battle.player,
        enemy: battle.enemy,
        turn: battle.turn,
        round: battle.round,
        status: battle.status,
        log: battle.log.slice(-10) // Return last 10 log entries
      }
    });

  } catch (error) {
    console.error('❌ Erro ao processar ação de batalha:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/battle/:battleId', (req, res) => {
  try {
    const { battleId } = req.params;
    
    if (battles.has(battleId)) {
      battles.delete(battleId);
      console.log(`⚔️ Batalha encerrada: ${battleId}`);
      res.json({ success: true, message: 'Battle ended' });
    } else {
      res.status(404).json({ error: 'Battle not found' });
    }

  } catch (error) {
    console.error('❌ Erro ao encerrar batalha:', error);
    res.status(500).json({ error: error.message });
  }
});

// Battle action processors
function processPlayerAction(battle, action) {
  switch (action) {
    case 'attack':
      return processAttack(battle.player, battle.enemy, 'attack');
    case 'defend':
      battle.player.defending = true;
      return { message: `${battle.player.name} está se defendendo!`, type: 'defend' };
    case 'skill':
      if (battle.player.currentMP >= 10) {
        battle.player.currentMP -= 10;
        return processAttack(battle.player, battle.enemy, 'skill');
      } else {
        return { message: 'MP insuficiente!', type: 'error' };
      }
    case 'item':
      const healAmount = Math.floor(battle.player.maxHP * 0.3);
      const oldHP = battle.player.currentHP;
      battle.player.currentHP = Math.min(battle.player.maxHP, battle.player.currentHP + healAmount);
      const actualHeal = battle.player.currentHP - oldHP;
      return { message: `${battle.player.name} recuperou ${actualHeal} HP!`, type: 'heal' };
    default:
      return { message: 'Ação inválida!', type: 'error' };
  }
}

function processEnemyAction(battle) {
  const action = Math.random();
  
  if (action < 0.7) {
    return processAttack(battle.enemy, battle.player, 'attack');
  } else if (action < 0.9) {
    return processAttack(battle.enemy, battle.player, 'skill');
  } else {
    battle.enemy.defending = true;
    return { message: `${battle.enemy.name} está se defendendo!`, type: 'defend' };
  }
}

function processAttack(attacker, defender, type) {
  let baseDamage;
  
  if (type === 'skill') {
    baseDamage = Math.floor(attacker.attack * 1.5) - Math.floor(defender.defense * 0.5);
  } else {
    baseDamage = attacker.attack - Math.floor(defender.defense * 0.7);
  }
  
  // Add randomness and defending modifier
  const randomMultiplier = 0.8 + (Math.random() * 0.4);
  let finalDamage = Math.floor(baseDamage * randomMultiplier);
  
  if (defender.defending) {
    finalDamage = Math.floor(finalDamage * 0.5);
  }
  
  finalDamage = Math.max(1, finalDamage);
  defender.currentHP = Math.max(0, defender.currentHP - finalDamage);
  
  const actionText = type === 'skill' ? 'usou uma habilidade' : 'atacou';
  return {
    message: `${attacker.name} ${actionText} ${defender.name} causando ${finalDamage} de dano!`,
    type: 'damage',
    damage: finalDamage
  };
}

// Route to serve battle interface
app.get('/battle', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'battle.html'));
});

// **FUNÇÃO ATUALIZADA**: Inicializar servidor SEM migração de IDs
async function startServer() {
  try {
    await initializeDirectories();
    
    // Inicializar banco SEM alterar IDs existentes
    await initializeDatabase();
    
    // Inicializar Maps System
    await initializeMapsSystem();
    
    // Configurar auto-reload do banco de dados
    console.log('🔄 Configurando auto-reload do banco de dados...');
    let reloadTimeout;
    chokidar.watch(DB_PATH, { ignoreInitial: true })
      .on('change', () => {
        // Debounce: aguardar 500ms sem mudanças antes de recarregar
        clearTimeout(reloadTimeout);
        reloadTimeout = setTimeout(async () => {
          console.log('🔄 Banco de dados modificado, recarregando...');
          try {
            // A API já recarrega automaticamente via loadDatabase()
            console.log('✅ Sistema atualizado com mudanças do banco!');
          } catch (error) {
            console.error('❌ Erro ao recarregar banco:', error);
          }
        }, 500);
      })
      .on('error', (error) => {
        console.error('❌ Erro no watcher do banco:', error);
      });
    
    console.log('✅ Auto-reload configurado para:', DB_PATH);
    
    app.listen(PORT, () => {
      console.log(`
🎮 RPGStack Server v3.1.0
🔒 Sistema de ID: IMUTÁVEL (IDs existentes PRESERVADOS)
🆕 Novos personagens: HEXADECIMAL (10 caracteres)
🚀 Servidor rodando em: http://localhost:${PORT}
📁 Estrutura de pastas criada:
   ├── assets/sprites/     (🖼️  Sprites acessíveis em /assets/sprites/)
   ├── data/              (💾 Banco de dados JSON)  
   ├── exports/           (🚀 Arquivos exportados)
   └── public/            (🌐 Frontend)

💡 Acesse: http://localhost:${PORT}
🧪 Teste API: http://localhost:${PORT}/api/test
🖼️  Sprites: http://localhost:${PORT}/assets/sprites/
📋 Lista sprites: http://localhost:${PORT}/api/sprites

🔒 GARANTIA DE IMUTABILIDADE:
   ├── IDs existentes: NUNCA alterados
   ├── Novos IDs: ${crypto.randomBytes(5).toString('hex').toUpperCase()}
   └── Referências: Seguras para uso futuro
      `);
    });
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
  }
}

startServer().catch(console.error);