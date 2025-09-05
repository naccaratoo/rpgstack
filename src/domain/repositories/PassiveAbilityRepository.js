/**
 * PassiveAbility Repository Interface
 * 
 * Abstract repository contract defining all passive ability persistence operations.
 * Implements Repository pattern to decouple domain from infrastructure.
 * 
 * This interface ensures that domain layer doesn't depend on specific
 * storage implementations (JSON, database, etc.).
 */

export class PassiveAbilityRepository {
  /**
   * Find passive ability by ID
   * @param {PassiveAbilityId} id - PassiveAbility ID to find
   * @returns {Promise<PassiveAbility|null>} PassiveAbility or null if not found
   * @throws {Error} If operation fails
   */
  async findById(id) {
    throw new Error('PassiveAbilityRepository.findById must be implemented');
  }

  /**
   * Find all passive abilities
   * @returns {Promise<PassiveAbility[]>} Array of all passive abilities
   * @throws {Error} If operation fails
   */
  async findAll() {
    throw new Error('PassiveAbilityRepository.findAll must be implemented');
  }

  /**
   * Find passive abilities matching criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<PassiveAbility[]>} Matching passive abilities
   * @throws {Error} If operation fails
   */
  async findByCriteria(criteria) {
    throw new Error('PassiveAbilityRepository.findByCriteria must be implemented');
  }

  /**
   * Save passive ability (create or update)
   * @param {PassiveAbility} passiveAbility - PassiveAbility to save
   * @returns {Promise<PassiveAbility>} Saved passive ability
   * @throws {Error} If operation fails or validation errors
   */
  async save(passiveAbility) {
    throw new Error('PassiveAbilityRepository.save must be implemented');
  }

  /**
   * Delete passive ability by ID
   * @param {PassiveAbilityId} id - PassiveAbility ID to delete
   * @returns {Promise<boolean>} True if deleted, false if not found
   * @throws {Error} If operation fails
   */
  async delete(id) {
    throw new Error('PassiveAbilityRepository.delete must be implemented');
  }

  /**
   * Check if passive ability exists by ID
   * @param {PassiveAbilityId} id - PassiveAbility ID to check
   * @returns {Promise<boolean>} True if exists
   * @throws {Error} If operation fails
   */
  async exists(id) {
    throw new Error('PassiveAbilityRepository.exists must be implemented');
  }

  /**
   * Count total passive abilities
   * @returns {Promise<number>} Total passive ability count
   * @throws {Error} If operation fails
   */
  async count() {
    throw new Error('PassiveAbilityRepository.count must be implemented');
  }

  /**
   * Find passive abilities by culture
   * @param {string} culture - Culture to search for
   * @returns {Promise<PassiveAbility[]>} PassiveAbilities with specified culture
   * @throws {Error} If operation fails
   */
  async findByCulture(culture) {
    throw new Error('PassiveAbilityRepository.findByCulture must be implemented');
  }

  /**
   * Find passive abilities by trigger
   * @param {string} trigger - Trigger to search for
   * @returns {Promise<PassiveAbility[]>} PassiveAbilities with specified trigger
   * @throws {Error} If operation fails
   */
  async findByTrigger(trigger) {
    throw new Error('PassiveAbilityRepository.findByTrigger must be implemented');
  }

  /**
   * Find passive abilities by effect type
   * @param {string} effectType - Effect type to search for
   * @returns {Promise<PassiveAbility[]>} PassiveAbilities with specified effect type
   * @throws {Error} If operation fails
   */
  async findByEffectType(effectType) {
    throw new Error('PassiveAbilityRepository.findByEffectType must be implemented');
  }

  /**
   * Find passive abilities by rarity
   * @param {string} rarity - Rarity to search for
   * @returns {Promise<PassiveAbility[]>} PassiveAbilities with specified rarity
   * @throws {Error} If operation fails
   */
  async findByRarity(rarity) {
    throw new Error('PassiveAbilityRepository.findByRarity must be implemented');
  }

  /**
   * Find passive abilities by name (partial match, case insensitive)
   * @param {string} namePattern - Name pattern to search
   * @returns {Promise<PassiveAbility[]>} PassiveAbilities matching name pattern
   * @throws {Error} If operation fails
   */
  async findByName(namePattern) {
    throw new Error('PassiveAbilityRepository.findByName must be implemented');
  }

  /**
   * Find always active passive abilities
   * @returns {Promise<PassiveAbility[]>} All always active passive abilities
   * @throws {Error} If operation fails
   */
  async findAlwaysActive() {
    throw new Error('PassiveAbilityRepository.findAlwaysActive must be implemented');
  }

  /**
   * Find battle-triggered passive abilities
   * @returns {Promise<PassiveAbility[]>} All battle-triggered passive abilities
   * @throws {Error} If operation fails
   */
  async findBattleTriggered() {
    throw new Error('PassiveAbilityRepository.findBattleTriggered must be implemented');
  }

  /**
   * Find passive abilities by multiple cultures
   * @param {string[]} cultures - Array of cultures to search for
   * @returns {Promise<PassiveAbility[]>} PassiveAbilities from specified cultures
   * @throws {Error} If operation fails
   */
  async findByCultures(cultures) {
    throw new Error('PassiveAbilityRepository.findByCultures must be implemented');
  }

  /**
   * Get repository statistics
   * @returns {Promise<Object>} Repository statistics
   * @throws {Error} If operation fails
   */
  async getStatistics() {
    throw new Error('PassiveAbilityRepository.getStatistics must be implemented');
  }

  /**
   * Bulk save operation
   * @param {PassiveAbility[]} passiveAbilities - PassiveAbilities to save
   * @returns {Promise<PassiveAbility[]>} Saved passive abilities
   * @throws {Error} If operation fails
   */
  async bulkSave(passiveAbilities) {
    throw new Error('PassiveAbilityRepository.bulkSave must be implemented');
  }

  /**
   * Bulk delete operation
   * @param {PassiveAbilityId[]} ids - PassiveAbility IDs to delete
   * @returns {Promise<number>} Number of deleted passive abilities
   * @throws {Error} If operation fails
   */
  async bulkDelete(ids) {
    throw new Error('PassiveAbilityRepository.bulkDelete must be implemented');
  }

  /**
   * Transaction support for multiple operations
   * @param {Function} operations - Function containing operations
   * @returns {Promise<any>} Result of operations
   * @throws {Error} If transaction fails
   */
  async transaction(operations) {
    throw new Error('PassiveAbilityRepository.transaction must be implemented');
  }

  /**
   * Create backup of all passive ability data
   * @returns {Promise<string>} Backup identifier or path
   * @throws {Error} If backup creation fails
   */
  async createBackup() {
    throw new Error('PassiveAbilityRepository.createBackup must be implemented');
  }

  /**
   * Restore from backup
   * @param {string} backupId - Backup identifier
   * @returns {Promise<void>} Completion promise
   * @throws {Error} If restore fails
   */
  async restoreFromBackup(backupId) {
    throw new Error('PassiveAbilityRepository.restoreFromBackup must be implemented');
  }
}