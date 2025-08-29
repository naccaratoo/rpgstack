import express from 'express';
import multer from 'multer';
import { MapController } from '../controllers/MapController.js';

/**
 * Map Routes Configuration
 * 
 * Defines all HTTP routes for the Maps API with proper middleware
 * configuration for file uploads and request handling.
 */

// Configure multer for asset uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 20 // Maximum 20 files per request
  },
  fileFilter: (req, file, cb) => {
    // Allow images and audio files
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/x-m4a', 'audio/aac'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  }
});

/**
 * Creates Express router with all map routes
 * @param {MapController} mapController - Configured map controller
 * @returns {express.Router} Configured router
 */
export function createMapRoutes(mapController) {
  const router = express.Router();

  // Basic CRUD operations
  router.get('/', mapController.getAllMaps.bind(mapController));
  router.post('/', mapController.createMap.bind(mapController));
  router.get('/:id', mapController.getMap.bind(mapController));
  router.put('/:id', mapController.updateMap.bind(mapController));
  router.delete('/:id', mapController.deleteMap.bind(mapController));

  // Boss operations
  router.post('/:id/defeat-boss', mapController.defeatBoss.bind(mapController));
  router.post('/:id/reset-boss', mapController.resetBoss.bind(mapController));

  // Player progress operations
  router.get('/unlocked', mapController.getUnlockedMaps.bind(mapController));
  router.get('/progression', mapController.getMapProgression.bind(mapController));
  router.post('/:id/unlock', mapController.unlockMap.bind(mapController));

  // Player-specific routes
  router.get('/player/:playerId/progress', mapController.getPlayerProgress.bind(mapController));
  router.get('/player/:playerId/analytics', mapController.getProgressionAnalytics.bind(mapController));

  // Asset management
  router.post('/:id/assets', 
    upload.fields([
      { name: 'background', maxCount: 1 },
      { name: 'tileset', maxCount: 1 },
      { name: 'music', maxCount: 1 },
      { name: 'sounds', maxCount: 10 },
      { name: 'overlays', maxCount: 5 }
    ]),
    mapController.uploadAssets.bind(mapController)
  );

  // Bulk operations
  router.post('/bulk-import', mapController.bulkImport.bind(mapController));
  router.get('/export', mapController.exportMaps.bind(mapController));

  // Statistics
  router.get('/statistics', mapController.getStatistics.bind(mapController));

  return router;
}