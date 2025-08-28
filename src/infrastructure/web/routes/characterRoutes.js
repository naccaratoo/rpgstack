/**
 * Character Routes
 * 
 * Express.js routes that integrate the clean architecture with
 * the existing API endpoints. Maintains backward compatibility
 * while using the new domain layer and repository pattern.
 */

import express from 'express';
import multer from 'multer';
import { CharacterController } from '../controllers/CharacterController.js';

export function createCharacterRoutes(characterRepository, spriteManager) {
  const router = express.Router();
  const controller = new CharacterController(characterRepository, spriteManager);

  // Configure multer for file uploads
  const storage = multer.memoryStorage(); // Use memory storage for better control
  
  const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Unsupported file type'), false);
      }
    },
  });

  const bulkUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for bulk uploads
  });

  // Bind controller methods to maintain 'this' context
  const healthCheck = controller.healthCheck.bind(controller);
  const listCharacters = controller.listCharacters.bind(controller);
  const createCharacter = controller.createCharacter.bind(controller);
  const updateCharacter = controller.updateCharacter.bind(controller);
  const deleteCharacter = controller.deleteCharacter.bind(controller);
  const generateId = controller.generateId.bind(controller);
  const bulkExport = controller.bulkExport.bind(controller);
  const bulkImport = controller.bulkImport.bind(controller);

  // Health check endpoint
  router.get('/test', healthCheck);

  // Character CRUD endpoints
  router.get('/characters', listCharacters);
  router.post('/characters', upload.single('sprite'), createCharacter);
  router.put('/characters/:id', upload.single('sprite'), updateCharacter);
  router.delete('/characters/:id', deleteCharacter);

  // Utility endpoints
  router.get('/generate-id', generateId);

  // Bulk operations
  router.get('/bulk-export', bulkExport);
  router.post('/bulk-import', bulkUpload.single('bulkData'), bulkImport);

  // Sprite upload endpoint (separate from character creation)
  router.post('/upload-sprite', upload.single('sprite'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const characterName = req.body.characterName || 'character';
      const filename = await spriteManager.saveSprite(req.file, characterName);
      
      res.json({
        message: 'Sprite uploaded successfully',
        filename: filename,
        url: spriteManager.getSpriteUrl(filename),
      });

    } catch (error) {
      console.error('❌ Error uploading sprite:', error);
      res.status(400).json({ 
        error: 'Failed to upload sprite',
        details: error.message,
      });
    }
  });

  // Sprite rename endpoint
  router.post('/rename-sprite', async (req, res) => {
    try {
      const { oldFilename, newName } = req.body;
      
      if (!oldFilename || !newName) {
        return res.status(400).json({ error: 'Both oldFilename and newName are required' });
      }

      const newFilename = await spriteManager.renameSprite(oldFilename, newName);
      
      res.json({
        message: 'Sprite renamed successfully',
        oldFilename,
        newFilename,
        newUrl: spriteManager.getSpriteUrl(newFilename),
      });

    } catch (error) {
      console.error('❌ Error renaming sprite:', error);
      res.status(400).json({ 
        error: 'Failed to rename sprite',
        details: error.message,
      });
    }
  });

  // List sprites endpoint
  router.get('/sprites', async (req, res) => {
    try {
      const sprites = await spriteManager.listSprites();
      res.json({ 
        sprites, 
        total: sprites.length,
      });
    } catch (error) {
      console.error('❌ Error listing sprites:', error);
      res.json({ sprites: [], total: 0 });
    }
  });

  // Export download endpoints (legacy compatibility)
  router.get('/export/js', (req, res) => {
    const exportPath = spriteManager.getExportPath('character_database.js');
    res.download(exportPath, 'character_database.js', (err) => {
      if (err) {
        console.error('❌ Error downloading JS export:', err);
        res.status(500).json({ error: 'Export file not found' });
      }
    });
  });

  // Error handling middleware for multer
  router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large' });
      }
      return res.status(400).json({ error: 'File upload error', details: error.message });
    }
    
    if (error.message === 'Unsupported file type') {
      return res.status(400).json({ error: 'Unsupported file type' });
    }
    
    next(error);
  });

  return router;
}