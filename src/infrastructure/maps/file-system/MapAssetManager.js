import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { MapAssets } from '../../../domain/maps/value-objects/MapAssets.js';
import { DatabaseError, ValidationError } from '../../../application/errors/ApplicationErrors.js';

/**
 * MapAssetManager - Infrastructure Layer
 * 
 * Manages map asset files including backgrounds, tilesets, music, and sounds.
 * Provides upload, optimization, validation, and cleanup operations with
 * support for multiple formats and automatic asset processing.
 */
export class MapAssetManager {
  /**
   * Creates new MapAssetManager
   * @param {string} assetsPath - Base path for map assets
   * @param {Object} options - Configuration options
   */
  constructor(assetsPath = 'assets/maps', options = {}) {
    this.assetsPath = path.resolve(assetsPath);
    this.options = {
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB default
      allowedImageFormats: options.allowedImageFormats || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'],
      allowedAudioFormats: options.allowedAudioFormats || ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'],
      generateThumbnails: options.generateThumbnails !== false, // Default true
      thumbnailSize: options.thumbnailSize || { width: 200, height: 200 },
      optimizeImages: options.optimizeImages !== false, // Default true
      ...options
    };
  }

  /**
   * Initializes asset manager and ensures directories exist
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Create main assets directory
      await fs.mkdir(this.assetsPath, { recursive: true });
      
      // Create subdirectories
      const subdirs = ['backgrounds', 'tilesets', 'music', 'sounds', 'overlays', 'thumbnails'];
      for (const subdir of subdirs) {
        await fs.mkdir(path.join(this.assetsPath, subdir), { recursive: true });
      }
      
      console.log(`✅ MapAssetManager: Initialized with assets path ${this.assetsPath}`);
    } catch (error) {
      console.error('❌ MapAssetManager: Failed to initialize:', error.message);
      throw new DatabaseError('Failed to initialize map asset manager', error);
    }
  }

  /**
   * Uploads and processes map assets
   * @param {string} mapId - Map identifier
   * @param {Object} assetFiles - Asset files to upload
   * @param {Buffer} assetFiles.background - Background image buffer
   * @param {Buffer} assetFiles.tileset - Tileset image buffer
   * @param {Buffer} assetFiles.music - Music file buffer
   * @param {Array<Buffer>} assetFiles.sounds - Sound effect buffers
   * @param {Array<Buffer>} assetFiles.overlays - Overlay image buffers
   * @returns {Promise<Object>} Processed asset references
   */
  async uploadMapAssets(mapId, assetFiles) {
    try {
      console.log(`📁 MapAssetManager: Uploading assets for map ${mapId}`);
      
      const processedAssets = {
        background: null,
        tileset: null,
        music: null,
        sounds: [],
        overlays: [],
        metadata: {
          uploadDate: new Date().toISOString(),
          fileSizes: {},
          dimensions: {},
          optimized: this.options.optimizeImages
        }
      };

      // Process background image
      if (assetFiles.background) {
        const filename = await this._processImageAsset(
          assetFiles.background, 
          'background', 
          `${mapId}_background`,
          'backgrounds'
        );
        processedAssets.background = filename;
        processedAssets.metadata.fileSizes[filename] = assetFiles.background.length;
      }

      // Process tileset image
      if (assetFiles.tileset) {
        const filename = await this._processImageAsset(
          assetFiles.tileset, 
          'tileset', 
          `${mapId}_tileset`,
          'tilesets'
        );
        processedAssets.tileset = filename;
        processedAssets.metadata.fileSizes[filename] = assetFiles.tileset.length;
      }

      // Process music file
      if (assetFiles.music) {
        const filename = await this._processAudioAsset(
          assetFiles.music,
          'music',
          `${mapId}_music`,
          'music'
        );
        processedAssets.music = filename;
        processedAssets.metadata.fileSizes[filename] = assetFiles.music.length;
      }

      // Process sound effects
      if (assetFiles.sounds && Array.isArray(assetFiles.sounds)) {
        for (let i = 0; i < assetFiles.sounds.length; i++) {
          const soundBuffer = assetFiles.sounds[i];
          const filename = await this._processAudioAsset(
            soundBuffer,
            'sound',
            `${mapId}_sound_${i}`,
            'sounds'
          );
          processedAssets.sounds.push(filename);
          processedAssets.metadata.fileSizes[filename] = soundBuffer.length;
        }
      }

      // Process overlay images
      if (assetFiles.overlays && Array.isArray(assetFiles.overlays)) {
        for (let i = 0; i < assetFiles.overlays.length; i++) {
          const overlayBuffer = assetFiles.overlays[i];
          const filename = await this._processImageAsset(
            overlayBuffer,
            'overlay',
            `${mapId}_overlay_${i}`,
            'overlays'
          );
          processedAssets.overlays.push(filename);
          processedAssets.metadata.fileSizes[filename] = overlayBuffer.length;
        }
      }

      console.log(`✅ MapAssetManager: Successfully uploaded ${Object.keys(assetFiles).length} asset types for map ${mapId}`);
      return processedAssets;

    } catch (error) {
      console.error(`❌ MapAssetManager: Failed to upload assets for map ${mapId}:`, error.message);
      throw new DatabaseError('Failed to upload map assets', error);
    }
  }

  /**
   * Gets asset file information
   * @param {string} mapId - Map identifier
   * @returns {Promise<Object>} Asset information
   */
  async getMapAssetInfo(mapId) {
    try {
      const assetInfo = {
        mapId: mapId,
        assets: {},
        totalSize: 0,
        lastModified: null
      };

      // Check each asset type directory
      const assetTypes = ['backgrounds', 'tilesets', 'music', 'sounds', 'overlays'];
      
      for (const assetType of assetTypes) {
        const assetDir = path.join(this.assetsPath, assetType);
        
        try {
          const files = await fs.readdir(assetDir);
          const mapAssets = files.filter(file => file.startsWith(`${mapId}_`));
          
          assetInfo.assets[assetType] = [];
          
          for (const file of mapAssets) {
            const filePath = path.join(assetDir, file);
            const stats = await fs.stat(filePath);
            
            assetInfo.assets[assetType].push({
              filename: file,
              size: stats.size,
              modified: stats.mtime.toISOString()
            });
            
            assetInfo.totalSize += stats.size;
            
            if (!assetInfo.lastModified || stats.mtime > new Date(assetInfo.lastModified)) {
              assetInfo.lastModified = stats.mtime.toISOString();
            }
          }
          
        } catch (error) {
          // Directory might not exist, continue
          assetInfo.assets[assetType] = [];
        }
      }

      return assetInfo;

    } catch (error) {
      console.error(`❌ MapAssetManager: Failed to get asset info for map ${mapId}:`, error.message);
      throw new DatabaseError('Failed to get map asset information', error);
    }
  }

  /**
   * Generates thumbnail for an image asset
   * @param {string} assetPath - Path to original image
   * @param {string} filename - Original filename
   * @returns {Promise<string>} Thumbnail filename
   */
  async generateThumbnail(assetPath, filename) {
    try {
      if (!this.options.generateThumbnails) {
        return null;
      }

      const thumbnailFilename = `thumb_${filename}`;
      const thumbnailPath = path.join(this.assetsPath, 'thumbnails', thumbnailFilename);
      
      await sharp(assetPath)
        .resize(this.options.thumbnailSize.width, this.options.thumbnailSize.height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
      
      console.log(`📸 MapAssetManager: Generated thumbnail ${thumbnailFilename}`);
      return thumbnailFilename;

    } catch (error) {
      console.warn(`⚠️ MapAssetManager: Failed to generate thumbnail for ${filename}:`, error.message);
      return null;
    }
  }

  /**
   * Optimizes an image asset
   * @param {Buffer} imageBuffer - Original image buffer
   * @param {string} format - Target format
   * @returns {Promise<Buffer>} Optimized image buffer
   */
  async optimizeImage(imageBuffer, format = 'webp') {
    try {
      if (!this.options.optimizeImages) {
        return imageBuffer;
      }

      let pipeline = sharp(imageBuffer);
      
      // Apply optimizations based on format
      switch (format.toLowerCase()) {
        case 'webp':
          pipeline = pipeline.webp({ quality: 85, effort: 4 });
          break;
        case 'png':
          pipeline = pipeline.png({ compressionLevel: 6, adaptiveFiltering: true });
          break;
        case 'jpg':
        case 'jpeg':
          pipeline = pipeline.jpeg({ quality: 85, progressive: true });
          break;
        default:
          return imageBuffer; // No optimization for unknown formats
      }
      
      const optimizedBuffer = await pipeline.toBuffer();
      
      const savings = imageBuffer.length - optimizedBuffer.length;
      if (savings > 0) {
        console.log(`🎯 MapAssetManager: Optimized image - saved ${savings} bytes`);
      }
      
      return optimizedBuffer;

    } catch (error) {
      console.warn('⚠️ MapAssetManager: Failed to optimize image, using original:', error.message);
      return imageBuffer;
    }
  }

  /**
   * Cleans up assets for a specific map
   * @param {string} mapId - Map identifier
   * @returns {Promise<number>} Number of files deleted
   */
  async cleanupMapAssets(mapId) {
    try {
      let deletedCount = 0;
      
      const assetTypes = ['backgrounds', 'tilesets', 'music', 'sounds', 'overlays', 'thumbnails'];
      
      for (const assetType of assetTypes) {
        const assetDir = path.join(this.assetsPath, assetType);
        
        try {
          const files = await fs.readdir(assetDir);
          const mapFiles = files.filter(file => file.startsWith(`${mapId}_`) || file.startsWith(`thumb_${mapId}_`));
          
          for (const file of mapFiles) {
            const filePath = path.join(assetDir, file);
            await fs.unlink(filePath);
            deletedCount++;
          }
          
        } catch (error) {
          // Directory might not exist or be empty, continue
        }
      }

      console.log(`🗑️ MapAssetManager: Cleaned up ${deletedCount} asset files for map ${mapId}`);
      return deletedCount;

    } catch (error) {
      console.error(`❌ MapAssetManager: Failed to cleanup assets for map ${mapId}:`, error.message);
      throw new DatabaseError('Failed to cleanup map assets', error);
    }
  }

  /**
   * Validates asset file
   * @param {Buffer} fileBuffer - File buffer to validate
   * @param {string} expectedType - Expected asset type ('image' or 'audio')
   * @param {string} filename - Original filename
   * @throws {ValidationError} If validation fails
   */
  async validateAssetFile(fileBuffer, expectedType, filename) {
    // Size validation
    if (fileBuffer.length > this.options.maxFileSize) {
      throw new ValidationError(`File ${filename} exceeds maximum size of ${this.options.maxFileSize} bytes`);
    }

    // Get file extension
    const extension = path.extname(filename).toLowerCase().substring(1);
    
    // Format validation
    if (expectedType === 'image') {
      if (!this.options.allowedImageFormats.includes(extension)) {
        throw new ValidationError(`Image format ${extension} not allowed. Allowed formats: ${this.options.allowedImageFormats.join(', ')}`);
      }
      
      // Validate image using Sharp
      try {
        const metadata = await sharp(fileBuffer).metadata();
        
        // Check minimum dimensions
        if (metadata.width < 64 || metadata.height < 64) {
          throw new ValidationError(`Image ${filename} too small. Minimum dimensions: 64x64`);
        }
        
        // Check maximum dimensions
        if (metadata.width > 4096 || metadata.height > 4096) {
          throw new ValidationError(`Image ${filename} too large. Maximum dimensions: 4096x4096`);
        }
        
      } catch (sharpError) {
        throw new ValidationError(`Invalid image file ${filename}: ${sharpError.message}`);
      }
      
    } else if (expectedType === 'audio') {
      if (!this.options.allowedAudioFormats.includes(extension)) {
        throw new ValidationError(`Audio format ${extension} not allowed. Allowed formats: ${this.options.allowedAudioFormats.join(', ')}`);
      }
      
      // Basic audio validation (check for common audio headers)
      const audioHeaders = {
        'mp3': [0xFF, 0xFB], // MP3 frame header
        'wav': [0x52, 0x49, 0x46, 0x46], // RIFF header
        'ogg': [0x4F, 0x67, 0x67, 0x53], // OggS header
        'flac': [0x66, 0x4C, 0x61, 0x43], // fLaC header
      };
      
      const header = audioHeaders[extension];
      if (header && !this._bufferStartsWith(fileBuffer, header)) {
        throw new ValidationError(`File ${filename} does not appear to be a valid ${extension} file`);
      }
    }
  }

  /**
   * Gets storage statistics
   * @returns {Promise<Object>} Storage statistics
   */
  async getStorageStats() {
    try {
      const stats = {
        totalSize: 0,
        fileCount: 0,
        typeBreakdown: {},
        oldestFile: null,
        newestFile: null
      };

      const assetTypes = ['backgrounds', 'tilesets', 'music', 'sounds', 'overlays', 'thumbnails'];
      
      for (const assetType of assetTypes) {
        const assetDir = path.join(this.assetsPath, assetType);
        stats.typeBreakdown[assetType] = { count: 0, size: 0 };
        
        try {
          const files = await fs.readdir(assetDir);
          
          for (const file of files) {
            const filePath = path.join(assetDir, file);
            const fileStats = await fs.stat(filePath);
            
            stats.totalSize += fileStats.size;
            stats.fileCount++;
            stats.typeBreakdown[assetType].count++;
            stats.typeBreakdown[assetType].size += fileStats.size;
            
            // Track oldest and newest files
            if (!stats.oldestFile || fileStats.mtime < new Date(stats.oldestFile.modified)) {
              stats.oldestFile = { filename: file, type: assetType, modified: fileStats.mtime.toISOString() };
            }
            
            if (!stats.newestFile || fileStats.mtime > new Date(stats.newestFile.modified)) {
              stats.newestFile = { filename: file, type: assetType, modified: fileStats.mtime.toISOString() };
            }
          }
          
        } catch (error) {
          // Directory might not exist, continue
        }
      }

      return stats;

    } catch (error) {
      console.error('❌ MapAssetManager: Failed to get storage stats:', error.message);
      throw new DatabaseError('Failed to get storage statistics', error);
    }
  }

  /**
   * Processes an image asset
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} assetType - Type of asset
   * @param {string} baseName - Base filename
   * @param {string} subdir - Subdirectory
   * @returns {Promise<string>} Final filename
   * @private
   */
  async _processImageAsset(imageBuffer, assetType, baseName, subdir) {
    // Validate image
    await this.validateAssetFile(imageBuffer, 'image', `${baseName}.tmp`);
    
    // Determine format and extension
    const metadata = await sharp(imageBuffer).metadata();
    const originalFormat = metadata.format;
    const targetFormat = this.options.optimizeImages ? 'webp' : originalFormat;
    const extension = targetFormat === 'webp' ? 'webp' : originalFormat;
    
    const filename = `${baseName}.${extension}`;
    const filePath = path.join(this.assetsPath, subdir, filename);
    
    // Optimize image if enabled
    const processedBuffer = await this.optimizeImage(imageBuffer, targetFormat);
    
    // Save processed image
    await fs.writeFile(filePath, processedBuffer);
    
    // Generate thumbnail for backgrounds and tilesets
    if ((assetType === 'background' || assetType === 'tileset') && this.options.generateThumbnails) {
      await this.generateThumbnail(filePath, filename);
    }
    
    console.log(`🖼️ MapAssetManager: Processed ${assetType} image: ${filename}`);
    return filename;
  }

  /**
   * Processes an audio asset
   * @param {Buffer} audioBuffer - Audio buffer
   * @param {string} assetType - Type of asset
   * @param {string} baseName - Base filename
   * @param {string} subdir - Subdirectory
   * @returns {Promise<string>} Final filename
   * @private
   */
  async _processAudioAsset(audioBuffer, assetType, baseName, subdir) {
    // Determine format from buffer (simplified detection)
    let extension = 'mp3'; // Default
    
    if (this._bufferStartsWith(audioBuffer, [0x52, 0x49, 0x46, 0x46])) {
      extension = 'wav';
    } else if (this._bufferStartsWith(audioBuffer, [0x4F, 0x67, 0x67, 0x53])) {
      extension = 'ogg';
    } else if (this._bufferStartsWith(audioBuffer, [0x66, 0x4C, 0x61, 0x43])) {
      extension = 'flac';
    }
    
    // Validate audio
    await this.validateAssetFile(audioBuffer, 'audio', `${baseName}.${extension}`);
    
    const filename = `${baseName}.${extension}`;
    const filePath = path.join(this.assetsPath, subdir, filename);
    
    // Save audio file
    await fs.writeFile(filePath, audioBuffer);
    
    console.log(`🎵 MapAssetManager: Processed ${assetType} audio: ${filename}`);
    return filename;
  }

  /**
   * Checks if buffer starts with specific bytes
   * @param {Buffer} buffer - Buffer to check
   * @param {Array<number>} bytes - Bytes to match
   * @returns {boolean} True if buffer starts with bytes
   * @private
   */
  _bufferStartsWith(buffer, bytes) {
    if (buffer.length < bytes.length) return false;
    
    for (let i = 0; i < bytes.length; i++) {
      if (buffer[i] !== bytes[i]) return false;
    }
    
    return true;
  }
}