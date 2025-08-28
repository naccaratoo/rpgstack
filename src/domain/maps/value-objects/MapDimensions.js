/**
 * MapDimensions Value Object
 * 
 * Represents immutable map dimensions with validation for game constraints.
 * Ensures maps are within reasonable bounds for performance and gameplay.
 */
export class MapDimensions {
  /**
   * Creates new MapDimensions
   * @param {Object} params - Parameters
   * @param {number} params.width - Map width in tiles (10-100)
   * @param {number} params.height - Map height in tiles (10-100)
   * @throws {Error} If dimensions are invalid
   */
  constructor({ width, height }) {
    this.validateDimensions({ width, height });
    
    this.width = width;
    this.height = height;
    Object.freeze(this);
  }

  /**
   * Validates map dimensions
   * @param {Object} dimensions - Dimensions to validate
   * @throws {Error} If dimensions are invalid
   */
  validateDimensions({ width, height }) {
    // Width validation
    if (!Number.isInteger(width)) {
      throw new Error('Map width must be an integer');
    }
    if (width < 10) {
      throw new Error('Map width must be at least 10 tiles');
    }
    if (width > 100) {
      throw new Error('Map width cannot exceed 100 tiles');
    }

    // Height validation
    if (!Number.isInteger(height)) {
      throw new Error('Map height must be an integer');
    }
    if (height < 10) {
      throw new Error('Map height must be at least 10 tiles');
    }
    if (height > 100) {
      throw new Error('Map height cannot exceed 100 tiles');
    }

    // Aspect ratio validation (prevent extreme ratios)
    const aspectRatio = Math.max(width, height) / Math.min(width, height);
    if (aspectRatio > 4) {
      throw new Error('Map aspect ratio cannot exceed 4:1 (too narrow/wide)');
    }
  }

  /**
   * Gets total tile count
   * @returns {number} Total tiles in map
   */
  getTileCount() {
    return this.width * this.height;
  }

  /**
   * Gets aspect ratio
   * @returns {number} Aspect ratio (width/height)
   */
  getAspectRatio() {
    return this.width / this.height;
  }

  /**
   * Checks if dimensions are square
   * @returns {boolean} True if square
   */
  isSquare() {
    return this.width === this.height;
  }

  /**
   * Gets size category based on tile count
   * @returns {string} Size category
   */
  getSizeCategory() {
    const tileCount = this.getTileCount();
    if (tileCount <= 400) return 'small';      // 20x20 or smaller
    if (tileCount <= 1600) return 'medium';    // 40x40 or smaller  
    if (tileCount <= 6400) return 'large';     // 80x80 or smaller
    return 'huge';                             // Larger than 80x80
  }

  /**
   * Creates new dimensions with updated width
   * @param {number} newWidth - New width value
   * @returns {MapDimensions} New instance with updated width
   */
  withWidth(newWidth) {
    return new MapDimensions({ 
      width: newWidth, 
      height: this.height 
    });
  }

  /**
   * Creates new dimensions with updated height
   * @param {number} newHeight - New height value
   * @returns {MapDimensions} New instance with updated height
   */
  withHeight(newHeight) {
    return new MapDimensions({ 
      width: this.width, 
      height: newHeight 
    });
  }

  /**
   * Creates scaled dimensions
   * @param {number} factor - Scale factor (e.g., 2.0 for double size)
   * @returns {MapDimensions} Scaled dimensions
   */
  scale(factor) {
    if (!Number.isFinite(factor) || factor <= 0) {
      throw new Error('Scale factor must be a positive number');
    }
    
    const newWidth = Math.round(this.width * factor);
    const newHeight = Math.round(this.height * factor);
    
    return new MapDimensions({ 
      width: newWidth, 
      height: newHeight 
    });
  }

  /**
   * Equality comparison
   * @param {MapDimensions} other - Other dimensions to compare
   * @returns {boolean} True if equal
   */
  equals(other) {
    return other instanceof MapDimensions &&
           this.width === other.width &&
           this.height === other.height;
  }

  /**
   * String representation
   * @returns {string} Dimensions as "widthxheight"
   */
  toString() {
    return `${this.width}x${this.height}`;
  }

  /**
   * JSON serialization
   * @returns {Object} Plain object for JSON
   */
  toJSON() {
    return {
      width: this.width,
      height: this.height
    };
  }

  /**
   * Creates MapDimensions from plain object
   * @param {Object} data - Plain object with width/height
   * @returns {MapDimensions} New instance
   */
  static fromJSON(data) {
    return new MapDimensions(data);
  }

  /**
   * Predefined common map sizes
   */
  static get COMMON_SIZES() {
    return {
      TINY: new MapDimensions({ width: 10, height: 10 }),
      SMALL: new MapDimensions({ width: 20, height: 20 }),
      MEDIUM: new MapDimensions({ width: 40, height: 30 }),
      LARGE: new MapDimensions({ width: 60, height: 45 }),
      HUGE: new MapDimensions({ width: 80, height: 60 }),
      MAXIMUM: new MapDimensions({ width: 100, height: 100 })
    };
  }
}