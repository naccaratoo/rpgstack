/**
 * MapAssets Value Object
 * 
 * Represents immutable map asset references including background images,
 * tilesets, music, and other game assets needed to render the map.
 */
export class MapAssets {
  /**
   * Creates new MapAssets
   * @param {Object} params - Parameters
   * @param {string} params.background - Background image filename
   * @param {string} params.tileset - Tileset image filename  
   * @param {string} params.music - Background music filename
   * @param {Array<string>} params.sounds - Array of sound effect filenames
   * @param {Array<string>} params.overlays - Array of overlay image filenames
   * @param {Object} params.metadata - Asset metadata (sizes, formats, etc.)
   * @throws {Error} If asset data is invalid
   */
  constructor({ 
    background = null, 
    tileset = null, 
    music = null, 
    sounds = [], 
    overlays = [],
    metadata = {}
  }) {
    this.validateAssets({ background, tileset, music, sounds, overlays, metadata });
    
    this.background = background;
    this.tileset = tileset;
    this.music = music;
    this.sounds = [...sounds]; // Defensive copy
    this.overlays = [...overlays]; // Defensive copy
    this.metadata = { ...metadata }; // Defensive copy
    
    Object.freeze(this.sounds);
    Object.freeze(this.overlays);
    Object.freeze(this.metadata);
    Object.freeze(this);
  }

  /**
   * Validates asset data
   * @param {Object} data - Data to validate
   * @throws {Error} If data is invalid
   */
  validateAssets({ background, tileset, music, sounds, overlays, metadata }) {
    // Background validation
    if (background !== null) {
      this.validateFilename(background, 'background');
      this.validateImageFormat(background, 'background');
    }

    // Tileset validation
    if (tileset !== null) {
      this.validateFilename(tileset, 'tileset');
      this.validateImageFormat(tileset, 'tileset');
    }

    // Music validation
    if (music !== null) {
      this.validateFilename(music, 'music');
      this.validateAudioFormat(music, 'music');
    }

    // Sounds validation
    if (!Array.isArray(sounds)) {
      throw new Error('Sounds must be an array');
    }
    if (sounds.length > 50) {
      throw new Error('Cannot have more than 50 sound files per map');
    }
    
    for (const [index, sound] of sounds.entries()) {
      this.validateFilename(sound, `sounds[${index}]`);
      this.validateAudioFormat(sound, `sounds[${index}]`);
    }

    // Overlays validation
    if (!Array.isArray(overlays)) {
      throw new Error('Overlays must be an array');
    }
    if (overlays.length > 20) {
      throw new Error('Cannot have more than 20 overlay files per map');
    }
    
    for (const [index, overlay] of overlays.entries()) {
      this.validateFilename(overlay, `overlays[${index}]`);
      this.validateImageFormat(overlay, `overlays[${index}]`);
    }

    // Metadata validation
    if (metadata !== null && typeof metadata !== 'object') {
      throw new Error('Metadata must be an object');
    }
  }

  /**
   * Validates filename format and safety
   * @param {string} filename - Filename to validate
   * @param {string} context - Context for error messages
   * @throws {Error} If filename is invalid
   */
  validateFilename(filename, context) {
    if (typeof filename !== 'string' || filename.trim().length === 0) {
      throw new Error(`${context} filename must be a non-empty string`);
    }

    // Check length
    if (filename.length > 255) {
      throw new Error(`${context} filename cannot exceed 255 characters`);
    }

    // Check for dangerous characters
    const dangerousChars = /[<>:"|?*\x00-\x1f]/;
    if (dangerousChars.test(filename)) {
      throw new Error(`${context} filename contains invalid characters`);
    }

    // Check for path traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new Error(`${context} filename cannot contain path separators or traversal attempts`);
    }

    // Check that it has an extension
    if (!filename.includes('.')) {
      throw new Error(`${context} filename must include a file extension`);
    }
  }

  /**
   * Validates image file format
   * @param {string} filename - Image filename to validate
   * @param {string} context - Context for error messages
   * @throws {Error} If image format is invalid
   */
  validateImageFormat(filename, context) {
    const extension = filename.toLowerCase().split('.').pop();
    const validImageFormats = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'];
    
    if (!validImageFormats.includes(extension)) {
      throw new Error(`${context} must be a valid image format: ${validImageFormats.join(', ')}`);
    }
  }

  /**
   * Validates audio file format
   * @param {string} filename - Audio filename to validate
   * @param {string} context - Context for error messages
   * @throws {Error} If audio format is invalid
   */
  validateAudioFormat(filename, context) {
    const extension = filename.toLowerCase().split('.').pop();
    const validAudioFormats = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'];
    
    if (!validAudioFormats.includes(extension)) {
      throw new Error(`${context} must be a valid audio format: ${validAudioFormats.join(', ')}`);
    }
  }

  /**
   * Gets all asset filenames as array
   * @returns {Array<string>} Array of all asset filenames
   */
  getAllFiles() {
    const files = [];
    
    if (this.background) files.push(this.background);
    if (this.tileset) files.push(this.tileset);
    if (this.music) files.push(this.music);
    files.push(...this.sounds);
    files.push(...this.overlays);
    
    return files;
  }

  /**
   * Gets count of total assets
   * @returns {number} Total number of asset files
   */
  getAssetCount() {
    return this.getAllFiles().length;
  }

  /**
   * Checks if assets include background image
   * @returns {boolean} True if has background
   */
  hasBackground() {
    return this.background !== null;
  }

  /**
   * Checks if assets include tileset
   * @returns {boolean} True if has tileset
   */
  hasTileset() {
    return this.tileset !== null;
  }

  /**
   * Checks if assets include music
   * @returns {boolean} True if has music
   */
  hasMusic() {
    return this.music !== null;
  }

  /**
   * Checks if assets include sound effects
   * @returns {boolean} True if has sounds
   */
  hasSounds() {
    return this.sounds.length > 0;
  }

  /**
   * Checks if assets include overlays
   * @returns {boolean} True if has overlays
   */
  hasOverlays() {
    return this.overlays.length > 0;
  }

  /**
   * Gets estimated total file size from metadata
   * @returns {number} Total estimated bytes (0 if no metadata)
   */
  getEstimatedSize() {
    if (!this.metadata.fileSizes) return 0;
    
    const { fileSizes } = this.metadata;
    let total = 0;
    
    for (const file of this.getAllFiles()) {
      if (fileSizes[file]) {
        total += fileSizes[file];
      }
    }
    
    return total;
  }

  /**
   * Creates new assets with updated background
   * @param {string} newBackground - New background filename
   * @returns {MapAssets} New instance with updated background
   */
  withBackground(newBackground) {
    return new MapAssets({
      background: newBackground,
      tileset: this.tileset,
      music: this.music,
      sounds: this.sounds,
      overlays: this.overlays,
      metadata: this.metadata
    });
  }

  /**
   * Creates new assets with updated tileset
   * @param {string} newTileset - New tileset filename
   * @returns {MapAssets} New instance with updated tileset
   */
  withTileset(newTileset) {
    return new MapAssets({
      background: this.background,
      tileset: newTileset,
      music: this.music,
      sounds: this.sounds,
      overlays: this.overlays,
      metadata: this.metadata
    });
  }

  /**
   * Creates new assets with updated music
   * @param {string} newMusic - New music filename
   * @returns {MapAssets} New instance with updated music
   */
  withMusic(newMusic) {
    return new MapAssets({
      background: this.background,
      tileset: this.tileset,
      music: newMusic,
      sounds: this.sounds,
      overlays: this.overlays,
      metadata: this.metadata
    });
  }

  /**
   * Adds sound to asset list
   * @param {string} sound - Sound filename to add
   * @returns {MapAssets} New instance with added sound
   */
  addSound(sound) {
    if (this.sounds.includes(sound)) {
      return this; // No change if sound already exists
    }
    
    const newSounds = [...this.sounds, sound];
    return new MapAssets({
      background: this.background,
      tileset: this.tileset,
      music: this.music,
      sounds: newSounds,
      overlays: this.overlays,
      metadata: this.metadata
    });
  }

  /**
   * Removes sound from asset list
   * @param {string} sound - Sound filename to remove
   * @returns {MapAssets} New instance with removed sound
   */
  removeSound(sound) {
    const newSounds = this.sounds.filter(s => s !== sound);
    if (newSounds.length === this.sounds.length) {
      return this; // No change if sound wasn't found
    }
    
    return new MapAssets({
      background: this.background,
      tileset: this.tileset,
      music: this.music,
      sounds: newSounds,
      overlays: this.overlays,
      metadata: this.metadata
    });
  }

  /**
   * Adds overlay to asset list
   * @param {string} overlay - Overlay filename to add
   * @returns {MapAssets} New instance with added overlay
   */
  addOverlay(overlay) {
    if (this.overlays.includes(overlay)) {
      return this; // No change if overlay already exists
    }
    
    const newOverlays = [...this.overlays, overlay];
    return new MapAssets({
      background: this.background,
      tileset: this.tileset,
      music: this.music,
      sounds: this.sounds,
      overlays: newOverlays,
      metadata: this.metadata
    });
  }

  /**
   * Removes overlay from asset list
   * @param {string} overlay - Overlay filename to remove
   * @returns {MapAssets} New instance with removed overlay
   */
  removeOverlay(overlay) {
    const newOverlays = this.overlays.filter(o => o !== overlay);
    if (newOverlays.length === this.overlays.length) {
      return this; // No change if overlay wasn't found
    }
    
    return new MapAssets({
      background: this.background,
      tileset: this.tileset,
      music: this.music,
      sounds: this.sounds,
      overlays: newOverlays,
      metadata: this.metadata
    });
  }

  /**
   * Updates asset metadata
   * @param {Object} newMetadata - New metadata object
   * @returns {MapAssets} New instance with updated metadata
   */
  withMetadata(newMetadata) {
    return new MapAssets({
      background: this.background,
      tileset: this.tileset,
      music: this.music,
      sounds: this.sounds,
      overlays: this.overlays,
      metadata: newMetadata
    });
  }

  /**
   * Equality comparison
   * @param {MapAssets} other - Other assets to compare
   * @returns {boolean} True if equal
   */
  equals(other) {
    if (!(other instanceof MapAssets)) return false;
    
    return this.background === other.background &&
           this.tileset === other.tileset &&
           this.music === other.music &&
           JSON.stringify(this.sounds.sort()) === JSON.stringify(other.sounds.sort()) &&
           JSON.stringify(this.overlays.sort()) === JSON.stringify(other.overlays.sort()) &&
           JSON.stringify(this.metadata) === JSON.stringify(other.metadata);
  }

  /**
   * String representation
   * @returns {string} Assets summary
   */
  toString() {
    const parts = [];
    const fileCount = this.getAssetCount();
    
    parts.push(`${fileCount} total files`);
    
    if (this.hasBackground()) parts.push('background');
    if (this.hasTileset()) parts.push('tileset');
    if (this.hasMusic()) parts.push('music');
    if (this.hasSounds()) parts.push(`${this.sounds.length} sounds`);
    if (this.hasOverlays()) parts.push(`${this.overlays.length} overlays`);
    
    return parts.join(', ');
  }

  /**
   * JSON serialization
   * @returns {Object} Plain object for JSON
   */
  toJSON() {
    return {
      background: this.background,
      tileset: this.tileset,
      music: this.music,
      sounds: this.sounds,
      overlays: this.overlays,
      metadata: this.metadata
    };
  }

  /**
   * Creates MapAssets from plain object
   * @param {Object} data - Plain object
   * @returns {MapAssets} New instance
   */
  static fromJSON(data) {
    return new MapAssets(data);
  }

  /**
   * Creates empty assets (no files)
   * @returns {MapAssets} Empty assets instance
   */
  static empty() {
    return new MapAssets({});
  }

  /**
   * Predefined common asset configurations
   */
  static get COMMON_ASSETS() {
    return {
      MINIMAL: new MapAssets({
        background: 'default_bg.png',
        tileset: 'basic_tiles.png'
      }),
      
      FOREST: new MapAssets({
        background: 'forest_bg.jpg',
        tileset: 'forest_tiles.png',
        music: 'forest_ambient.mp3',
        sounds: ['leaves_rustle.wav', 'bird_chirp.wav']
      }),
      
      DUNGEON: new MapAssets({
        background: 'dungeon_bg.png',
        tileset: 'stone_tiles.png',
        music: 'dungeon_theme.mp3',
        sounds: ['footsteps_stone.wav', 'drip.wav', 'echo.wav'],
        overlays: ['torch_glow.png', 'shadows.png']
      })
    };
  }
}