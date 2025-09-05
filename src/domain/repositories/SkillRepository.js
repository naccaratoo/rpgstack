/**
 * Skill Repository Interface
 * 
 * Abstract repository contract defining all skill persistence operations.
 * Implements Repository pattern to decouple domain from infrastructure.
 * 
 * This interface ensures that domain layer doesn't depend on specific
 * storage implementations (JSON, database, etc.).
 */

export class SkillRepository {
  /**
   * Find skill by ID
   * @param {SkillId} id - Skill ID to find
   * @returns {Promise<Skill|null>} Skill or null if not found
   * @throws {Error} If operation fails
   */
  async findById(id) {
    throw new Error('SkillRepository.findById must be implemented');
  }

  /**
   * Find all skills
   * @returns {Promise<Skill[]>} Array of all skills
   * @throws {Error} If operation fails
   */
  async findAll() {
    throw new Error('SkillRepository.findAll must be implemented');
  }

  /**
   * Find skills matching criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Skill[]>} Matching skills
   * @throws {Error} If operation fails
   */
  async findByCriteria(criteria) {
    throw new Error('SkillRepository.findByCriteria must be implemented');
  }

  /**
   * Save skill (create or update)
   * @param {Skill} skill - Skill to save
   * @returns {Promise<Skill>} Saved skill
   * @throws {Error} If operation fails or validation errors
   */
  async save(skill) {
    throw new Error('SkillRepository.save must be implemented');
  }

  /**
   * Delete skill by ID
   * @param {SkillId} id - Skill ID to delete
   * @returns {Promise<boolean>} True if deleted, false if not found
   * @throws {Error} If operation fails
   */
  async delete(id) {
    throw new Error('SkillRepository.delete must be implemented');
  }

  /**
   * Check if skill exists by ID
   * @param {SkillId} id - Skill ID to check
   * @returns {Promise<boolean>} True if exists
   * @throws {Error} If operation fails
   */
  async exists(id) {
    throw new Error('SkillRepository.exists must be implemented');
  }

  /**
   * Count total skills
   * @returns {Promise<number>} Total skill count
   * @throws {Error} If operation fails
   */
  async count() {
    throw new Error('SkillRepository.count must be implemented');
  }

  /**
   * Find skills by type
   * @param {string} type - Skill type to search for
   * @returns {Promise<Skill[]>} Skills with specified type
   * @throws {Error} If operation fails
   */
  async findByType(type) {
    throw new Error('SkillRepository.findByType must be implemented');
  }

  /**
   * Find skills by element
   * @param {string} element - Element to search for
   * @returns {Promise<Skill[]>} Skills with specified element
   * @throws {Error} If operation fails
   */
  async findByElement(element) {
    throw new Error('SkillRepository.findByElement must be implemented');
  }

  /**
   * Find skills by level range
   * @param {number} minLevel - Minimum level
   * @param {number} maxLevel - Maximum level
   * @returns {Promise<Skill[]>} Skills in level range
   * @throws {Error} If operation fails
   */
  async findByLevelRange(minLevel, maxLevel) {
    throw new Error('SkillRepository.findByLevelRange must be implemented');
  }

  /**
   * Find skills by damage range
   * @param {number} minDamage - Minimum damage
   * @param {number} maxDamage - Maximum damage
   * @returns {Promise<Skill[]>} Skills in damage range
   * @throws {Error} If operation fails
   */
  async findByDamageRange(minDamage, maxDamage) {
    throw new Error('SkillRepository.findByDamageRange must be implemented');
  }

  /**
   * Find skills by mana cost range
   * @param {number} minCost - Minimum mana cost
   * @param {number} maxCost - Maximum mana cost
   * @returns {Promise<Skill[]>} Skills in mana cost range
   * @throws {Error} If operation fails
   */
  async findByManaCostRange(minCost, maxCost) {
    throw new Error('SkillRepository.findByManaCostRange must be implemented');
  }

  /**
   * Find skills by name (partial match, case insensitive)
   * @param {string} namePattern - Name pattern to search
   * @returns {Promise<Skill[]>} Skills matching name pattern
   * @throws {Error} If operation fails
   */
  async findByName(namePattern) {
    throw new Error('SkillRepository.findByName must be implemented');
  }

  /**
   * Find passive skills
   * @returns {Promise<Skill[]>} All passive skills
   * @throws {Error} If operation fails
   */
  async findPassiveSkills() {
    throw new Error('SkillRepository.findPassiveSkills must be implemented');
  }

  /**
   * Find combat skills (combat and magic types)
   * @returns {Promise<Skill[]>} All combat skills
   * @throws {Error} If operation fails
   */
  async findCombatSkills() {
    throw new Error('SkillRepository.findCombatSkills must be implemented');
  }

  /**
   * Find skills with prerequisites
   * @returns {Promise<Skill[]>} Skills that have prerequisites
   * @throws {Error} If operation fails
   */
  async findSkillsWithPrerequisites() {
    throw new Error('SkillRepository.findSkillsWithPrerequisites must be implemented');
  }

  /**
   * Find skills without prerequisites (learnable by default)
   * @returns {Promise<Skill[]>} Skills without prerequisites
   * @throws {Error} If operation fails
   */
  async findBasicSkills() {
    throw new Error('SkillRepository.findBasicSkills must be implemented');
  }

  /**
   * Get repository statistics
   * @returns {Promise<Object>} Repository statistics
   * @throws {Error} If operation fails
   */
  async getStatistics() {
    throw new Error('SkillRepository.getStatistics must be implemented');
  }

  /**
   * Bulk save operation
   * @param {Skill[]} skills - Skills to save
   * @returns {Promise<Skill[]>} Saved skills
   * @throws {Error} If operation fails
   */
  async bulkSave(skills) {
    throw new Error('SkillRepository.bulkSave must be implemented');
  }

  /**
   * Bulk delete operation
   * @param {SkillId[]} ids - Skill IDs to delete
   * @returns {Promise<number>} Number of deleted skills
   * @throws {Error} If operation fails
   */
  async bulkDelete(ids) {
    throw new Error('SkillRepository.bulkDelete must be implemented');
  }

  /**
   * Transaction support for multiple operations
   * @param {Function} operations - Function containing operations
   * @returns {Promise<any>} Result of operations
   * @throws {Error} If transaction fails
   */
  async transaction(operations) {
    throw new Error('SkillRepository.transaction must be implemented');
  }

  /**
   * Create backup of all skill data
   * @returns {Promise<string>} Backup identifier or path
   * @throws {Error} If backup creation fails
   */
  async createBackup() {
    throw new Error('SkillRepository.createBackup must be implemented');
  }

  /**
   * Restore from backup
   * @param {string} backupId - Backup identifier
   * @returns {Promise<void>} Completion promise
   * @throws {Error} If restore fails
   */
  async restoreFromBackup(backupId) {
    throw new Error('SkillRepository.restoreFromBackup must be implemented');
  }
}