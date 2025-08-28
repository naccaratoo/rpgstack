/**
 * Character Repository Interface
 * 
 * Abstract repository contract defining all character persistence operations.
 * Implements Repository pattern to decouple domain from infrastructure.
 * 
 * This interface ensures that domain layer doesn't depend on specific
 * storage implementations (JSON, database, etc.).
 */

export class CharacterRepository {
  /**
   * Find character by ID
   * @param {CharacterId} id - Character ID to find
   * @returns {Promise<Character|null>} Character or null if not found
   * @throws {Error} If operation fails
   */
  async findById(id) {
    throw new Error('CharacterRepository.findById must be implemented');
  }

  /**
   * Find all characters
   * @returns {Promise<Character[]>} Array of all characters
   * @throws {Error} If operation fails
   */
  async findAll() {
    throw new Error('CharacterRepository.findAll must be implemented');
  }

  /**
   * Find characters matching criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Character[]>} Matching characters
   * @throws {Error} If operation fails
   */
  async findByCriteria(criteria) {
    throw new Error('CharacterRepository.findByCriteria must be implemented');
  }

  /**
   * Save character (create or update)
   * @param {Character} character - Character to save
   * @returns {Promise<Character>} Saved character
   * @throws {Error} If operation fails or validation errors
   */
  async save(character) {
    throw new Error('CharacterRepository.save must be implemented');
  }

  /**
   * Delete character by ID
   * @param {CharacterId} id - Character ID to delete
   * @returns {Promise<boolean>} True if deleted, false if not found
   * @throws {Error} If operation fails
   */
  async delete(id) {
    throw new Error('CharacterRepository.delete must be implemented');
  }

  /**
   * Check if character exists by ID
   * @param {CharacterId} id - Character ID to check
   * @returns {Promise<boolean>} True if exists
   * @throws {Error} If operation fails
   */
  async exists(id) {
    throw new Error('CharacterRepository.exists must be implemented');
  }

  /**
   * Count total characters
   * @returns {Promise<number>} Total character count
   * @throws {Error} If operation fails
   */
  async count() {
    throw new Error('CharacterRepository.count must be implemented');
  }

  /**
   * Find characters by level range
   * @param {number} minLevel - Minimum level
   * @param {number} maxLevel - Maximum level
   * @returns {Promise<Character[]>} Characters in level range
   * @throws {Error} If operation fails
   */
  async findByLevelRange(minLevel, maxLevel) {
    throw new Error('CharacterRepository.findByLevelRange must be implemented');
  }

  /**
   * Find characters by AI type
   * @param {string} aiType - AI type to search for
   * @returns {Promise<Character[]>} Characters with specified AI type
   * @throws {Error} If operation fails
   */
  async findByAIType(aiType) {
    throw new Error('CharacterRepository.findByAIType must be implemented');
  }

  /**
   * Find characters by name (partial match, case insensitive)
   * @param {string} namePattern - Name pattern to search
   * @returns {Promise<Character[]>} Characters matching name pattern
   * @throws {Error} If operation fails
   */
  async findByName(namePattern) {
    throw new Error('CharacterRepository.findByName must be implemented');
  }

  /**
   * Get repository statistics
   * @returns {Promise<Object>} Repository statistics
   * @throws {Error} If operation fails
   */
  async getStatistics() {
    throw new Error('CharacterRepository.getStatistics must be implemented');
  }

  /**
   * Bulk save operation
   * @param {Character[]} characters - Characters to save
   * @returns {Promise<Character[]>} Saved characters
   * @throws {Error} If operation fails
   */
  async bulkSave(characters) {
    throw new Error('CharacterRepository.bulkSave must be implemented');
  }

  /**
   * Bulk delete operation
   * @param {CharacterId[]} ids - Character IDs to delete
   * @returns {Promise<number>} Number of deleted characters
   * @throws {Error} If operation fails
   */
  async bulkDelete(ids) {
    throw new Error('CharacterRepository.bulkDelete must be implemented');
  }

  /**
   * Transaction support for multiple operations
   * @param {Function} operations - Function containing operations
   * @returns {Promise<any>} Result of operations
   * @throws {Error} If transaction fails
   */
  async transaction(operations) {
    throw new Error('CharacterRepository.transaction must be implemented');
  }

  /**
   * Create backup of all character data
   * @returns {Promise<string>} Backup identifier or path
   * @throws {Error} If backup creation fails
   */
  async createBackup() {
    throw new Error('CharacterRepository.createBackup must be implemented');
  }

  /**
   * Restore from backup
   * @param {string} backupId - Backup identifier
   * @returns {Promise<void>} Completion promise
   * @throws {Error} If restore fails
   */
  async restoreFromBackup(backupId) {
    throw new Error('CharacterRepository.restoreFromBackup must be implemented');
  }
}