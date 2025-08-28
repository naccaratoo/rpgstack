/**
 * MapRepository Interface
 * 
 * Abstract repository interface defining the contract for map data persistence.
 * Implementations must provide all these methods while maintaining the same
 * interface for dependency inversion compliance.
 */
export class MapRepository {
  /**
   * Creates a new map in the repository
   * @param {Map} map - Map entity to create
   * @returns {Promise<Map>} Created map with any repository-assigned fields
   * @throws {Error} If creation fails or map already exists
   */
  async create(map) {
    throw new Error('MapRepository.create() must be implemented by subclass');
  }

  /**
   * Retrieves a map by its ID
   * @param {MapId} mapId - Unique map identifier
   * @returns {Promise<Map|null>} Map entity if found, null otherwise
   * @throws {Error} If retrieval fails
   */
  async findById(mapId) {
    throw new Error('MapRepository.findById() must be implemented by subclass');
  }

  /**
   * Retrieves all maps in the repository
   * @returns {Promise<Array<Map>>} Array of all map entities
   * @throws {Error} If retrieval fails
   */
  async findAll() {
    throw new Error('MapRepository.findAll() must be implemented by subclass');
  }

  /**
   * Updates an existing map
   * @param {Map} map - Updated map entity
   * @returns {Promise<Map>} Updated map entity
   * @throws {Error} If update fails or map not found
   */
  async update(map) {
    throw new Error('MapRepository.update() must be implemented by subclass');
  }

  /**
   * Deletes a map from the repository
   * @param {MapId} mapId - ID of map to delete
   * @returns {Promise<boolean>} True if deleted, false if not found
   * @throws {Error} If deletion fails
   */
  async delete(mapId) {
    throw new Error('MapRepository.delete() must be implemented by subclass');
  }

  /**
   * Saves a map (create or update based on existence)
   * @param {Map} map - Map entity to save
   * @returns {Promise<Map>} Saved map entity
   * @throws {Error} If save operation fails
   */
  async save(map) {
    const existing = await this.findById(map.id);
    return existing ? await this.update(map) : await this.create(map);
  }

  /**
   * Finds maps by difficulty range
   * @param {number} minDifficulty - Minimum difficulty (inclusive)
   * @param {number} maxDifficulty - Maximum difficulty (inclusive)
   * @returns {Promise<Array<Map>>} Maps within difficulty range
   * @throws {Error} If query fails
   */
  async findByDifficultyRange(minDifficulty, maxDifficulty) {
    throw new Error('MapRepository.findByDifficultyRange() must be implemented by subclass');
  }

  /**
   * Finds maps by unlock requirement type
   * @param {string} unlockType - Type of unlock requirement
   * @returns {Promise<Array<Map>>} Maps with specified unlock type
   * @throws {Error} If query fails
   */
  async findByUnlockType(unlockType) {
    throw new Error('MapRepository.findByUnlockType() must be implemented by subclass');
  }

  /**
   * Finds maps that are unlocked for a specific player state
   * @param {Object} playerState - Player's current state
   * @param {Array<string>} playerState.defeatedBosses - Defeated boss IDs
   * @param {Array<string>} playerState.achievements - Player achievements
   * @param {number} playerState.level - Player level
   * @param {Array<string>} playerState.completedMaps - Completed map IDs
   * @returns {Promise<Array<Map>>} Unlocked maps for player
   * @throws {Error} If query fails
   */
  async findUnlockedForPlayer(playerState) {
    throw new Error('MapRepository.findUnlockedForPlayer() must be implemented by subclass');
  }

  /**
   * Finds maps by name (case-insensitive partial match)
   * @param {string} namePattern - Name pattern to search for
   * @returns {Promise<Array<Map>>} Maps matching name pattern
   * @throws {Error} If query fails
   */
  async findByName(namePattern) {
    throw new Error('MapRepository.findByName() must be implemented by subclass');
  }

  /**
   * Finds maps that use a specific character as boss
   * @param {CharacterId} characterId - Character ID used as boss
   * @returns {Promise<Array<Map>>} Maps using the character as boss
   * @throws {Error} If query fails
   */
  async findByBossCharacter(characterId) {
    throw new Error('MapRepository.findByBossCharacter() must be implemented by subclass');
  }

  /**
   * Finds maps by size category
   * @param {string} sizeCategory - Size category ('small', 'medium', 'large', 'huge')
   * @returns {Promise<Array<Map>>} Maps in specified size category
   * @throws {Error} If query fails
   */
  async findBySize(sizeCategory) {
    throw new Error('MapRepository.findBySize() must be implemented by subclass');
  }

  /**
   * Finds completed maps (boss defeated)
   * @returns {Promise<Array<Map>>} Maps with defeated bosses
   * @throws {Error} If query fails
   */
  async findCompleted() {
    throw new Error('MapRepository.findCompleted() must be implemented by subclass');
  }

  /**
   * Finds incomplete maps (boss alive)
   * @returns {Promise<Array<Map>>} Maps with active bosses
   * @throws {Error} If query fails
   */
  async findIncomplete() {
    throw new Error('MapRepository.findIncomplete() must be implemented by subclass');
  }

  /**
   * Gets total count of maps in repository
   * @returns {Promise<number>} Total map count
   * @throws {Error} If count fails
   */
  async count() {
    throw new Error('MapRepository.count() must be implemented by subclass');
  }

  /**
   * Checks if a map exists
   * @param {MapId} mapId - Map ID to check
   * @returns {Promise<boolean>} True if map exists
   * @throws {Error} If check fails
   */
  async exists(mapId) {
    const map = await this.findById(mapId);
    return map !== null;
  }

  /**
   * Performs bulk save operations (transaction-safe if supported)
   * @param {Array<Map>} maps - Array of maps to save
   * @returns {Promise<Array<Map>>} Array of saved maps
   * @throws {Error} If bulk save fails
   */
  async bulkSave(maps) {
    throw new Error('MapRepository.bulkSave() must be implemented by subclass');
  }

  /**
   * Performs bulk delete operations (transaction-safe if supported)
   * @param {Array<MapId>} mapIds - Array of map IDs to delete
   * @returns {Promise<number>} Number of maps actually deleted
   * @throws {Error} If bulk delete fails
   */
  async bulkDelete(mapIds) {
    throw new Error('MapRepository.bulkDelete() must be implemented by subclass');
  }

  /**
   * Creates a backup of all map data
   * @param {string} backupPath - Path to store backup
   * @returns {Promise<string>} Path to created backup file
   * @throws {Error} If backup creation fails
   */
  async backup(backupPath) {
    throw new Error('MapRepository.backup() must be implemented by subclass');
  }

  /**
   * Restores map data from backup
   * @param {string} backupPath - Path to backup file
   * @param {Object} options - Restore options
   * @param {boolean} options.merge - If true, merge with existing data
   * @param {boolean} options.overwrite - If true, overwrite existing maps
   * @returns {Promise<number>} Number of maps restored
   * @throws {Error} If restore fails
   */
  async restore(backupPath, options = {}) {
    throw new Error('MapRepository.restore() must be implemented by subclass');
  }

  /**
   * Validates repository data integrity
   * @returns {Promise<Object>} Validation results
   * @throws {Error} If validation fails
   */
  async validateIntegrity() {
    throw new Error('MapRepository.validateIntegrity() must be implemented by subclass');
  }

  /**
   * Optimizes repository storage (implementation-specific)
   * @returns {Promise<Object>} Optimization results
   * @throws {Error} If optimization fails
   */
  async optimize() {
    throw new Error('MapRepository.optimize() must be implemented by subclass');
  }

  /**
   * Gets repository statistics
   * @returns {Promise<Object>} Repository statistics
   * @throws {Error} If statistics collection fails
   */
  async getStatistics() {
    throw new Error('MapRepository.getStatistics() must be implemented by subclass');
  }

  /**
   * Finds maps with specific asset requirements
   * @param {Object} assetCriteria - Asset search criteria
   * @param {boolean} assetCriteria.hasBackground - Must have background
   * @param {boolean} assetCriteria.hasMusic - Must have music
   * @param {boolean} assetCriteria.hasSounds - Must have sound effects
   * @returns {Promise<Array<Map>>} Maps matching asset criteria
   * @throws {Error} If query fails
   */
  async findByAssetCriteria(assetCriteria) {
    throw new Error('MapRepository.findByAssetCriteria() must be implemented by subclass');
  }

  /**
   * Transaction support (if available in implementation)
   * @param {Function} transactionCallback - Callback to execute in transaction
   * @returns {Promise<any>} Result of transaction callback
   * @throws {Error} If transaction fails or not supported
   */
  async transaction(transactionCallback) {
    // Default implementation: execute without transaction
    console.warn('Transaction support not implemented in this repository');
    return await transactionCallback(this);
  }
}