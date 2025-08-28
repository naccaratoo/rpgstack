/**
 * Sprite Manager
 * 
 * Handles sprite file operations including upload, storage, cleanup,
 * and serving. Provides a clean interface for file system operations
 * while maintaining backward compatibility with existing file structure.
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export class SpriteManager {
  constructor(config = {}) {
    this.spritesDir = config.spritesDir || path.join(process.cwd(), 'assets', 'sprites');
    this.exportsDir = config.exportsDir || path.join(process.cwd(), 'exports');
    this.allowedTypes = config.allowedTypes || ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    this.maxFileSize = config.maxFileSize || 2 * 1024 * 1024; // 2MB
    this.baseUrl = config.baseUrl || 'http://localhost:3002';
  }

  /**
   * Initialize sprite manager and ensure directories exist
   */
  async initialize() {
    try {
      await fs.mkdir(this.spritesDir, { recursive: true });
      await fs.mkdir(this.exportsDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to initialize SpriteManager: ${error.message}`);
    }
  }

  /**
   * Save uploaded sprite file
   * @param {Object} file - Multer file object
   * @param {string} characterName - Character name for filename generation
   * @returns {Promise<string>} Saved filename
   */
  async saveSprite(file, characterName) {
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    if (!this.allowedTypes.includes(file.mimetype)) {
      throw new Error(`Unsupported file type: ${file.mimetype}. Allowed types: ${this.allowedTypes.join(', ')}`);
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      throw new Error(`File too large: ${file.size} bytes. Maximum allowed: ${this.maxFileSize} bytes`);
    }

    // Generate safe filename
    const filename = this._generateSafeFilename(characterName, file);
    const filepath = path.join(this.spritesDir, filename);

    try {
      // Handle different file sources (buffer, path, stream)
      if (file.buffer) {
        // File is in memory (from multer memoryStorage)
        await fs.writeFile(filepath, file.buffer);
      } else if (file.path) {
        // File is on disk (from multer diskStorage)
        await fs.copyFile(file.path, filepath);
        // Clean up temporary file
        await fs.unlink(file.path).catch(() => {});
      } else {
        throw new Error('Invalid file object: no buffer or path');
      }

      return filename;
    } catch (error) {
      throw new Error(`Failed to save sprite: ${error.message}`);
    }
  }

  /**
   * Delete sprite file
   * @param {string} filename - Sprite filename to delete
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async deleteSprite(filename) {
    if (!filename) {
      return false;
    }

    const filepath = path.join(this.spritesDir, filename);
    
    try {
      await fs.access(filepath);
      await fs.unlink(filepath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false; // File doesn't exist
      }
      throw new Error(`Failed to delete sprite: ${error.message}`);
    }
  }

  /**
   * Get sprite URL for web serving
   * @param {string} filename - Sprite filename
   * @returns {string} Public URL for sprite
   */
  getSpriteUrl(filename) {
    if (!filename) {
      return '';
    }
    return `${this.baseUrl}/assets/sprites/${filename}`;
  }

  /**
   * List all available sprites
   * @returns {Promise<Array>} Array of sprite information
   */
  async listSprites() {
    try {
      const files = await fs.readdir(this.spritesDir);
      const sprites = [];

      for (const file of files) {
        if (this._isImageFile(file)) {
          const filepath = path.join(this.spritesDir, file);
          const stats = await fs.stat(filepath);
          
          sprites.push({
            filename: file,
            url: this.getSpriteUrl(file),
            path: `assets/sprites/${file}`,
            size: stats.size,
            modified: stats.mtime.toISOString(),
          });
        }
      }

      // Sort by modification date (newest first)
      sprites.sort((a, b) => new Date(b.modified) - new Date(a.modified));

      return sprites;
    } catch (error) {
      console.warn('Failed to list sprites:', error.message);
      return [];
    }
  }

  /**
   * Rename sprite file
   * @param {string} oldFilename - Current filename
   * @param {string} newName - New name (without extension)
   * @returns {Promise<string>} New filename
   */
  async renameSprite(oldFilename, newName) {
    if (!oldFilename || !newName) {
      throw new Error('Both old filename and new name are required');
    }

    const oldPath = path.join(this.spritesDir, oldFilename);
    
    // Check if old file exists
    try {
      await fs.access(oldPath);
    } catch (error) {
      throw new Error('Original sprite file not found');
    }

    // Generate new filename with same extension
    const extension = path.extname(oldFilename);
    const newFilename = this._sanitizeFilename(newName) + extension;
    const newPath = path.join(this.spritesDir, newFilename);

    try {
      await fs.rename(oldPath, newPath);
      return newFilename;
    } catch (error) {
      throw new Error(`Failed to rename sprite: ${error.message}`);
    }
  }

  /**
   * Check if sprite file exists
   * @param {string} filename - Sprite filename to check
   * @returns {Promise<boolean>} True if exists
   */
  async spriteExists(filename) {
    if (!filename) {
      return false;
    }

    const filepath = path.join(this.spritesDir, filename);
    
    try {
      await fs.access(filepath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clean up orphaned sprite files
   * @param {Array<string>} usedFilenames - Array of filenames currently in use
   * @returns {Promise<Array<string>>} Array of deleted filenames
   */
  async cleanupOrphanedSprites(usedFilenames) {
    const allSprites = await this.listSprites();
    const usedSet = new Set(usedFilenames.filter(Boolean));
    const deletedFiles = [];

    for (const sprite of allSprites) {
      if (!usedSet.has(sprite.filename)) {
        try {
          await this.deleteSprite(sprite.filename);
          deletedFiles.push(sprite.filename);
        } catch (error) {
          console.warn(`Failed to delete orphaned sprite ${sprite.filename}:`, error.message);
        }
      }
    }

    return deletedFiles;
  }

  /**
   * Write export file
   * @param {string} filename - Export filename
   * @param {string} content - File content
   * @returns {Promise<void>}
   */
  async writeExportFile(filename, content) {
    const filepath = path.join(this.exportsDir, filename);
    
    try {
      await fs.writeFile(filepath, content, 'utf8');
    } catch (error) {
      throw new Error(`Failed to write export file: ${error.message}`);
    }
  }

  /**
   * Get export file path
   * @param {string} filename - Export filename
   * @returns {string} Full file path
   */
  getExportPath(filename) {
    return path.join(this.exportsDir, filename);
  }

  /**
   * Clean up temporary file
   * @param {string} filepath - Path to temporary file
   * @returns {Promise<void>}
   */
  async cleanupFile(filepath) {
    try {
      await fs.unlink(filepath);
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  /**
   * Get sprite manager statistics
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics() {
    const sprites = await this.listSprites();
    
    const stats = {
      totalSprites: sprites.length,
      totalSize: sprites.reduce((sum, sprite) => sum + sprite.size, 0),
      byExtension: {},
      averageSize: 0,
    };

    // Group by extension
    sprites.forEach(sprite => {
      const ext = path.extname(sprite.filename).toLowerCase();
      stats.byExtension[ext] = (stats.byExtension[ext] || 0) + 1;
    });

    // Calculate average size
    if (sprites.length > 0) {
      stats.averageSize = Math.round(stats.totalSize / sprites.length);
    }

    return stats;
  }

  // Private helper methods

  /**
   * Generate safe filename from character name
   * @private
   */
  _generateSafeFilename(characterName, file) {
    const sanitizedName = this._sanitizeFilename(characterName);
    const extension = path.extname(file.originalname || file.filename || '.png');
    
    // Add timestamp to ensure uniqueness
    const timestamp = Date.now();
    const hash = crypto.randomBytes(4).toString('hex');
    
    return `${sanitizedName}_${timestamp}_${hash}${extension}`;
  }

  /**
   * Sanitize filename to be filesystem safe
   * @private
   */
  _sanitizeFilename(name) {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 50) || 'character';
  }

  /**
   * Check if file is an image based on extension
   * @private
   */
  _isImageFile(filename) {
    const ext = path.extname(filename).toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
  }
}