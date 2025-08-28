/**
 * Server Configuration
 * 
 * Clean architecture server setup that integrates all layers
 * while maintaining backward compatibility with existing endpoints.
 * 
 * Features:
 * - Dependency injection setup
 * - Clean architecture integration
 * - Legacy API compatibility
 * - Error handling and logging
 * - Performance monitoring
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { DatabaseFactory } from './DatabaseFactory.js';
import { SpriteManager } from '../file-system/SpriteManager.js';
import { createCharacterRoutes } from '../web/routes/characterRoutes.js';

export class Server {
  constructor(config = {}) {
    this.config = {
      port: config.port || 3002,
      host: config.host || 'localhost',
      environment: config.environment || 'development',
      
      // Database configuration
      database: config.database || {},
      
      // File system configuration
      fileSystem: config.fileSystem || {},
      
      // Middleware configuration
      cors: config.cors !== false,
      staticFiles: config.staticFiles !== false,
      requestLogging: config.requestLogging !== false,
      
      // Error handling
      detailedErrors: config.detailedErrors !== false,
      
      ...config,
    };

    this.app = null;
    this.server = null;
    this.databaseFactory = null;
    this.spriteManager = null;
    this._isInitialized = false;
  }

  /**
   * Initialize server and all dependencies
   */
  async initialize() {
    try {
      // Initialize Express app
      this.app = express();
      
      // Initialize database factory
      await this._initializeDatabase();
      
      // Initialize file system services
      await this._initializeFileSystem();
      
      // Setup middleware
      this._setupMiddleware();
      
      // Setup routes
      await this._setupRoutes();
      
      // Setup error handling
      this._setupErrorHandling();
      
      this._isInitialized = true;
      console.log('✅ Server initialized successfully');
      
    } catch (error) {
      console.error('❌ Server initialization failed:', error);
      throw error;
    }
  }

  /**
   * Start the server
   */
  async start() {
    if (!this._isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.config.port, this.config.host, (error) => {
        if (error) {
          reject(error);
        } else {
          console.log(`🚀 RPGStack server running at http://${this.config.host}:${this.config.port}`);
          console.log(`📊 Environment: ${this.config.environment}`);
          resolve(this.server);
        }
      });
    });
  }

  /**
   * Stop the server
   */
  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('🛑 Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Get server health information
   */
  async getHealth() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.config.environment,
      version: '2.0.0',
      services: {},
    };

    // Check database health
    if (this.databaseFactory) {
      try {
        health.services.database = await this.databaseFactory.healthCheck();
      } catch (error) {
        health.services.database = { status: 'unhealthy', error: error.message };
        health.status = 'degraded';
      }
    }

    // Check file system health
    if (this.spriteManager) {
      try {
        const stats = await this.spriteManager.getStatistics();
        health.services.fileSystem = { 
          status: 'healthy', 
          sprites: stats.totalSprites,
          totalSize: stats.totalSize,
        };
      } catch (error) {
        health.services.fileSystem = { status: 'unhealthy', error: error.message };
        health.status = 'degraded';
      }
    }

    return health;
  }

  /**
   * Get server statistics
   */
  async getStatistics() {
    const stats = {
      server: {
        uptime: process.uptime(),
        environment: this.config.environment,
        nodeVersion: process.version,
        platform: process.platform,
      },
      memory: process.memoryUsage(),
    };

    if (this.databaseFactory) {
      stats.database = await this.databaseFactory.getStatistics();
    }

    if (this.spriteManager) {
      stats.fileSystem = await this.spriteManager.getStatistics();
    }

    return stats;
  }

  /**
   * Get Express app instance (for testing)
   */
  getApp() {
    return this.app;
  }

  /**
   * Get database factory instance
   */
  getDatabaseFactory() {
    return this.databaseFactory;
  }

  /**
   * Get sprite manager instance
   */
  getSpriteManager() {
    return this.spriteManager;
  }

  // Private setup methods

  /**
   * Initialize database factory and repositories
   * @private
   */
  async _initializeDatabase() {
    const dbConfig = {
      type: 'json',
      dataPath: path.join(process.cwd(), 'data'),
      backupPath: path.join(process.cwd(), 'backups'),
      enableBackups: true,
      maxBackups: 10,
      ...this.config.database,
    };

    this.databaseFactory = new DatabaseFactory();
    await this.databaseFactory.initialize(dbConfig);

    console.log('✅ Database factory initialized');
  }

  /**
   * Initialize file system services
   * @private
   */
  async _initializeFileSystem() {
    const fileConfig = {
      spritesDir: path.join(process.cwd(), 'assets', 'sprites'),
      exportsDir: path.join(process.cwd(), 'exports'),
      baseUrl: `http://${this.config.host}:${this.config.port}`,
      ...this.config.fileSystem,
    };

    this.spriteManager = new SpriteManager(fileConfig);
    await this.spriteManager.initialize();

    console.log('✅ File system services initialized');
  }

  /**
   * Setup Express middleware
   * @private
   */
  _setupMiddleware() {
    // CORS
    if (this.config.cors) {
      this.app.use(cors());
    }

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Static files
    if (this.config.staticFiles) {
      this.app.use(express.static('public'));
      this.app.use('/assets', express.static(path.join(process.cwd(), 'assets')));
    }

    // Request logging
    if (this.config.requestLogging) {
      this.app.use((req, res, next) => {
        console.log(`📝 ${req.method} ${req.url} - ${new Date().toISOString()}`);
        next();
      });
    }

    console.log('✅ Middleware configured');
  }

  /**
   * Setup application routes
   * @private
   */
  async _setupRoutes() {
    // Get repository instances
    const characterRepository = await this.databaseFactory.getCharacterRepository();

    // Setup API routes with clean architecture
    const characterRoutes = createCharacterRoutes(characterRepository, this.spriteManager);
    this.app.use('/api', characterRoutes);

    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      const health = await this.getHealth();
      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    });

    // Statistics endpoint
    this.app.get('/stats', async (req, res) => {
      try {
        const stats = await this.getStatistics();
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get statistics' });
      }
    });

    // Legacy backup endpoints (if needed)
    this._setupLegacyRoutes(characterRepository);

    // Default route - Character Database
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'public', 'character-database.html'));
    });

    console.log('✅ Routes configured');
  }

  /**
   * Setup legacy routes for backward compatibility
   * @private
   */
  _setupLegacyRoutes(characterRepository) {
    // Legacy backup endpoints (maintain API compatibility)
    this.app.post('/api/backup', async (req, res) => {
      try {
        const backupId = await characterRepository.createBackup();
        res.json({
          message: 'Backup created successfully',
          backupId,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to create backup' });
      }
    });

    this.app.post('/api/restore/:filename', async (req, res) => {
      try {
        await characterRepository.restoreFromBackup(req.params.filename);
        res.json({
          message: 'Restore completed successfully',
          filename: req.params.filename,
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to restore backup' });
      }
    });
  }

  /**
   * Setup error handling
   * @private
   */
  _setupErrorHandling() {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({ 
        error: 'Not Found',
        message: `Route ${req.method} ${req.url} not found`,
      });
    });

    // Global error handler
    this.app.use((error, req, res, next) => {
      console.error('❌ Server error:', error);

      const response = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };

      if (this.config.detailedErrors || this.config.environment === 'development') {
        response.details = error.message;
        response.stack = error.stack;
      }

      res.status(error.status || 500).json(response);
    });

    console.log('✅ Error handling configured');
  }

  // Static factory methods

  /**
   * Create server for development environment
   */
  static async createForDevelopment(port = 3002) {
    return new Server({
      port,
      environment: 'development',
      requestLogging: true,
      detailedErrors: true,
    });
  }

  /**
   * Create server for production environment
   */
  static async createForProduction(port = 3002) {
    return new Server({
      port,
      environment: 'production',
      requestLogging: false,
      detailedErrors: false,
    });
  }

  /**
   * Create server for testing environment
   */
  static async createForTesting(port = 0) {
    return new Server({
      port,
      environment: 'test',
      requestLogging: false,
      detailedErrors: true,
      database: {
        enableBackups: false,
        dataPath: path.join(process.cwd(), 'test-data'),
      },
    });
  }
}