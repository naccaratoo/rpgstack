/**
 * Character Controller
 * 
 * Express.js controller that adapts HTTP requests to clean architecture
 * use cases while maintaining backward compatibility with existing API.
 * 
 * Responsibilities:
 * - HTTP request/response handling
 * - Input validation and sanitization  
 * - Error formatting and status codes
 * - Legacy API format compatibility
 * - File upload processing
 */

import { Character } from '../../../domain/entities/Character.js';
import { CharacterId } from '../../../domain/value-objects/CharacterId.js';

export class CharacterController {
  constructor(characterRepository, fileManager) {
    this.characterRepository = characterRepository;
    this.fileManager = fileManager;
  }

  /**
   * GET /api/test - Health check endpoint
   */
  async healthCheck(req, res) {
    try {
      const count = await this.characterRepository.count();
      res.json({
        status: 'OK',
        message: 'RPGStack Character Database is running',
        charactersCount: count,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        status: 'ERROR',
        message: 'Database connection failed',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/characters - List all characters
   */
  async listCharacters(req, res) {
    try {
      const characters = await this.characterRepository.findAll();
      
      // Convert to legacy format for API compatibility
      const charactersData = {};
      characters.forEach(character => {
        charactersData[character.id.toString()] = character.toLegacyFormat();
      });

      res.json({
        characters: charactersData,
        total: characters.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Error loading characters:', error);
      res.status(500).json({ 
        error: 'Failed to load characters',
        details: error.message,
      });
    }
  }

  /**
   * POST /api/characters - Create new character
   */
  async createCharacter(req, res) {
    try {
      // Extract and validate input data
      const characterData = this._extractCharacterData(req.body);
      
      // Handle sprite upload if present
      let spriteFileName = '';
      if (req.file) {
        spriteFileName = await this.fileManager.saveSprite(req.file, characterData.name);
      }

      // Create character with clean architecture
      const character = Character.create({
        ...characterData,
        sprite: spriteFileName,
      });

      // Save using repository
      const savedCharacter = await this.characterRepository.save(character);

      // Generate exports (maintain legacy behavior)
      await this._generateExports();

      // Return in legacy format
      res.json({
        character: savedCharacter.toLegacyFormat(),
        message: 'Character created successfully',
        id: savedCharacter.id.toString(),
      });

    } catch (error) {
      console.error('❌ Error creating character:', error);
      
      // Clean up uploaded file on error
      if (req.file) {
        await this.fileManager.cleanupFile(req.file.path).catch(() => {});
      }

      if (error.message.includes('validation') || error.message.includes('must be')) {
        res.status(400).json({ 
          error: 'Validation error',
          details: error.message,
        });
      } else if (error.message.includes('required') || error.message.includes('cannot be empty') || 
                 error.message.includes('validation') || error.message.includes('must be')) {
        res.status(400).json({ 
          error: 'Validation error',
          details: error.message,
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to create character',
          details: error.message,
        });
      }
    }
  }

  /**
   * PUT /api/characters/:id - Update character
   */
  async updateCharacter(req, res) {
    try {
      const characterId = CharacterId.fromString(req.params.id);
      
      // Find existing character
      const existingCharacter = await this.characterRepository.findById(characterId);
      if (!existingCharacter) {
        return res.status(404).json({ error: 'Character not found' });
      }

      // Extract update data
      const updateData = this._extractCharacterData(req.body, true);
      
      // Handle sprite upload if present
      if (req.file) {
        const spriteFileName = await this.fileManager.saveSprite(req.file, updateData.name || existingCharacter.name);
        updateData.sprite = spriteFileName;
      }

      // Update character
      const updatedCharacter = existingCharacter.update(updateData);
      const savedCharacter = await this.characterRepository.save(updatedCharacter);

      // Generate exports
      await this._generateExports();

      res.json({
        character: savedCharacter.toLegacyFormat(),
        message: 'Character updated successfully',
        id: savedCharacter.id.toString(),
      });

    } catch (error) {
      console.error('❌ Error updating character:', error);
      
      if (error.message.includes('Invalid character ID format')) {
        res.status(400).json({ error: 'Invalid character ID format' });
      } else if (error.message.includes('required') || error.message.includes('cannot be empty') || 
                 error.message.includes('validation') || error.message.includes('must be')) {
        res.status(400).json({ 
          error: 'Validation error',
          details: error.message,
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to update character',
          details: error.message,
        });
      }
    }
  }

  /**
   * DELETE /api/characters/:id - Delete character
   */
  async deleteCharacter(req, res) {
    try {
      const characterId = CharacterId.fromString(req.params.id);
      
      // Find character first to get sprite info
      const character = await this.characterRepository.findById(characterId);
      if (!character) {
        return res.status(404).json({ error: 'Character not found' });
      }

      // Delete from repository
      const deleted = await this.characterRepository.delete(characterId);
      
      if (deleted) {
        // Clean up sprite file if exists
        if (character.sprite) {
          await this.fileManager.deleteSprite(character.sprite).catch(() => {});
        }

        // Generate exports
        await this._generateExports();

        res.json({
          message: 'Character deleted successfully',
          id: req.params.id,
        });
      } else {
        res.status(404).json({ error: 'Character not found' });
      }

    } catch (error) {
      console.error('❌ Error deleting character:', error);
      
      if (error.message.includes('Invalid character ID format')) {
        res.status(400).json({ error: 'Invalid character ID format' });
      } else {
        res.status(500).json({ 
          error: 'Failed to delete character',
          details: error.message,
        });
      }
    }
  }

  /**
   * GET /api/generate-id - Generate new character ID
   */
  async generateId(req, res) {
    try {
      const newId = CharacterId.generate();
      
      res.json({
        id: newId.toString(),
        format: 'Hexadecimal 10 characters',
        example: `Character ID: ${newId.toString()}`,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/bulk-export - Export all characters
   */
  async bulkExport(req, res) {
    try {
      const characters = await this.characterRepository.findAll();
      const stats = await this.characterRepository.getStatistics();
      
      const exportData = {
        characters: characters.map(character => character.toLegacyFormat()),
        metadata: {
          exportDate: new Date().toISOString(),
          totalCharacters: characters.length,
          version: '2.0.0',
          ...stats,
        },
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="bulk_characters_export.json"');
      res.json(exportData);

    } catch (error) {
      console.error('❌ Error in bulk export:', error);
      res.status(500).json({ 
        error: 'Failed to export characters',
        details: error.message,
      });
    }
  }

  /**
   * POST /api/bulk-import - Import characters
   */
  async bulkImport(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileContent = req.file.buffer.toString('utf8');
      const importData = JSON.parse(fileContent);
      
      // Validate import data structure
      if (!importData.characters || !Array.isArray(importData.characters)) {
        return res.status(400).json({ error: 'Invalid file format' });
      }

      // Convert and validate characters
      const characters = [];
      for (const characterData of importData.characters) {
        try {
          // Convert legacy format to new format
          const character = this._convertLegacyCharacter(characterData);
          characters.push(character);
        } catch (error) {
          console.warn(`Skipping invalid character: ${error.message}`);
        }
      }

      if (characters.length === 0) {
        return res.status(400).json({ error: 'No valid characters found in import file' });
      }

      // Bulk save characters
      const savedCharacters = await this.characterRepository.bulkSave(characters);
      
      // Generate exports
      await this._generateExports();

      res.json({
        message: 'Characters imported successfully',
        imported: savedCharacters.length,
        total: importData.characters.length,
        skipped: importData.characters.length - savedCharacters.length,
      });

    } catch (error) {
      console.error('❌ Error in bulk import:', error);
      
      if (error instanceof SyntaxError) {
        res.status(400).json({ error: 'Invalid JSON file format' });
      } else {
        res.status(500).json({ 
          error: 'Failed to import characters',
          details: error.message,
        });
      }
    }
  }

  // Private helper methods

  /**
   * Extract and validate character data from request
   * @private
   * @param {boolean} isUpdate - Whether this is for an update operation
   */
  _extractCharacterData(body, isUpdate = false) {
    // Handle both camelCase and snake_case field names for compatibility
    const data = {};

    // Only include fields that are present in the body
    if (body.name !== undefined) {
      data.name = body.name?.trim();
    }
    
    if (body.level !== undefined) {
      data.level = parseInt(body.level, 10);
    }

    // Handle stats - only include stats that are present
    const stats = {};
    if (body.hp !== undefined) {
      stats.hp = parseInt(body.hp, 10);
    }
    if (body.maxHP !== undefined || body.max_hp !== undefined) {
      stats.maxHP = parseInt(body.maxHP || body.max_hp, 10);
    }
    if (body.attack !== undefined) {
      stats.attack = parseInt(body.attack, 10);
    }
    if (body.defense !== undefined) {
      stats.defense = parseInt(body.defense, 10);
    }
    
    if (Object.keys(stats).length > 0) {
      data.stats = stats;
    }

    if (body.ai_type !== undefined) {
      data.ai_type = body.ai_type;
    }
    
    if (body.gold !== undefined) {
      data.gold = parseInt(body.gold, 10);
    }
    
    if (body.experience !== undefined) {
      data.experience = parseInt(body.experience, 10);
    }
    
    if (body.skill_points !== undefined) {
      data.skill_points = parseInt(body.skill_points, 10);
    }

    // Validation - more lenient for updates
    if (!isUpdate) {
      // Required fields for creation
      if (!data.name) {
        throw new Error('Character name is required');
      }
      
      if (isNaN(data.level) || data.level < 1) {
        throw new Error('Valid character level is required');
      }

      if (!data.stats || isNaN(data.stats.hp) || isNaN(data.stats.maxHP) || 
          isNaN(data.stats.attack) || isNaN(data.stats.defense)) {
        throw new Error('Valid character stats are required');
      }

      if (!data.ai_type) {
        throw new Error('AI type is required');
      }
    } else {
      // Validation for updates (only validate fields that are being updated)
      if (data.name !== undefined && !data.name) {
        throw new Error('Character name cannot be empty');
      }
      
      if (data.level !== undefined && (isNaN(data.level) || data.level < 1)) {
        throw new Error('Valid character level is required');
      }

      if (data.stats) {
        if ((data.stats.hp !== undefined && isNaN(data.stats.hp)) ||
            (data.stats.maxHP !== undefined && isNaN(data.stats.maxHP)) ||
            (data.stats.attack !== undefined && isNaN(data.stats.attack)) ||
            (data.stats.defense !== undefined && isNaN(data.stats.defense))) {
          throw new Error('Valid character stats are required');
        }
      }

      if (data.ai_type !== undefined && !data.ai_type) {
        throw new Error('AI type cannot be empty');
      }
    }

    return data;
  }

  /**
   * Convert legacy character data to new format
   * @private
   */
  _convertLegacyCharacter(data) {
    // Handle both legacy and new ID formats
    let characterId;
    if (data.id) {
      characterId = CharacterId.fromString(data.id);
    } else {
      characterId = CharacterId.generate();
    }

    const characterData = {
      id: characterId,
      name: data.name,
      level: data.level,
      stats: {
        hp: data.hp,
        maxHP: data.max_hp || data.maxHP,
        attack: data.attack,
        defense: data.defense,
      },
      ai_type: data.ai_type,
      sprite: data.sprite || '',
      gold: data.gold || 0,
      experience: data.experience || 0,
      skill_points: data.skill_points || 0,
      metadata: {
        createdAt: data.created_at || data.createdAt || new Date().toISOString(),
        updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
        version: data.version || '1.0.0',
        legacy: data.legacy === true,
      },
    };

    return Character.fromData(characterData);
  }

  /**
   * Generate export files (maintain legacy behavior)
   * @private
   */
  async _generateExports() {
    try {
      const characters = await this.characterRepository.findAll();
      
      // Generate JavaScript export for game engines
      const jsExport = this._generateJavaScriptExport(characters);
      await this.fileManager.writeExportFile('character_database.js', jsExport);
      
    } catch (error) {
      console.warn('⚠️ Failed to generate exports:', error.message);
    }
  }

  /**
   * Generate JavaScript export format
   * @private
   */
  _generateJavaScriptExport(characters) {
    const charactersData = {};
    characters.forEach(character => {
      charactersData[character.id.toString()] = character.toLegacyFormat();
    });

    return `// RPGStack Character Database Export
// Generated: ${new Date().toISOString()}
// Total Characters: ${characters.length}

const CHARACTER_DATABASE = ${JSON.stringify(charactersData, null, 2)};

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CHARACTER_DATABASE; // CommonJS
} else if (typeof window !== 'undefined') {
  window.CHARACTER_DATABASE = CHARACTER_DATABASE; // Browser
}

// ES6 Module export
export default CHARACTER_DATABASE;
`;
  }
}