/**
 * API Compatibility Tests
 * 
 * Integration tests to ensure the clean architecture implementation
 * maintains backward compatibility with existing API endpoints.
 */

import request from 'supertest';
import fs from 'fs/promises';
import path from 'path';
import { Server } from '../../../src/infrastructure/config/Server.js';

const TEST_PORT = 3999;
const TEST_DATA_DIR = path.join(process.cwd(), 'test-api-data');

describe('API Compatibility', () => {
  let server;
  let app;

  beforeAll(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist
    }

    // Create server with test configuration
    server = new Server({
      port: TEST_PORT,
      environment: 'test',
      requestLogging: false,
      database: {
        dataPath: TEST_DATA_DIR,
        backupPath: path.join(TEST_DATA_DIR, 'backups'),
        enableBackups: false,
      },
      fileSystem: {
        spritesDir: path.join(TEST_DATA_DIR, 'sprites'),
        exportsDir: path.join(TEST_DATA_DIR, 'exports'),
        baseUrl: `http://localhost:${TEST_PORT}`,
      },
    });

    await server.initialize();
    app = server.getApp();
  });

  afterAll(async () => {
    if (server) {
      await server.stop();
    }

    // Clean up test data
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Health Check Endpoints', () => {
    test('GET /api/test should return system status', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'OK',
        message: expect.any(String),
        charactersCount: expect.any(Number),
        timestamp: expect.any(String),
      });
    });

    test('GET /health should return detailed health information', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        services: expect.any(Object),
      });
    });
  });

  describe('Character CRUD Operations', () => {
    let createdCharacterId;

    test('POST /api/characters should create new character', async () => {
      const characterData = {
        name: 'Test Hero',
        level: 5,
        hp: 50,
        maxHP: 50,
        attack: 10,
        defense: 8,
        ai_type: 'aggressive',
        gold: 100,
        experience: 250,
        skill_points: 2,
      };

      const response = await request(app)
        .post('/api/characters')
        .send(characterData)
        .expect(200);

      expect(response.body).toMatchObject({
        character: expect.objectContaining({
          id: expect.any(String),
          name: 'Test Hero',
          level: 5,
          hp: 50,
          max_hp: 50,
          attack: 10,
          defense: 8,
          ai_type: 'aggressive',
          gold: 100,
          experience: 250,
          skill_points: 2,
        }),
        message: 'Character created successfully',
        id: expect.any(String),
      });

      createdCharacterId = response.body.character.id;
      expect(createdCharacterId).toMatch(/^[A-F0-9]{10}$/);
    });

    test('GET /api/characters should list all characters', async () => {
      const response = await request(app)
        .get('/api/characters')
        .expect(200);

      expect(response.body).toMatchObject({
        characters: expect.any(Object),
        total: expect.any(Number),
        timestamp: expect.any(String),
      });

      expect(response.body.total).toBeGreaterThan(0);
      expect(response.body.characters[createdCharacterId]).toBeDefined();
    });

    test('PUT /api/characters/:id should update character', async () => {
      const updateData = {
        name: 'Updated Hero',
        level: 10,
        hp: 80,
        maxHP: 100,
        attack: 15,
        defense: 12,
      };

      const response = await request(app)
        .put(`/api/characters/${createdCharacterId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        character: expect.objectContaining({
          id: createdCharacterId,
          name: 'Updated Hero',
          level: 10,
          hp: 80,
          max_hp: 100,
          attack: 15,
          defense: 12,
        }),
        message: 'Character updated successfully',
      });
    });

    test('DELETE /api/characters/:id should delete character', async () => {
      const response = await request(app)
        .delete(`/api/characters/${createdCharacterId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Character deleted successfully',
        id: createdCharacterId,
      });

      // Verify character is deleted
      const listResponse = await request(app)
        .get('/api/characters')
        .expect(200);

      expect(listResponse.body.characters[createdCharacterId]).toBeUndefined();
    });

    test('DELETE /api/characters/:id should return 404 for non-existent character', async () => {
      const fakeId = 'ABCDEF1234';
      
      const response = await request(app)
        .delete(`/api/characters/${fakeId}`)
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Character not found',
      });
    });
  });

  describe('Utility Endpoints', () => {
    test('GET /api/generate-id should generate valid character ID', async () => {
      const response = await request(app)
        .get('/api/generate-id')
        .expect(200);

      expect(response.body).toMatchObject({
        id: expect.stringMatching(/^[A-F0-9]{10}$/),
        format: 'Hexadecimal 10 characters',
        example: expect.any(String),
      });
    });

    test('GET /api/sprites should list available sprites', async () => {
      const response = await request(app)
        .get('/api/sprites')
        .expect(200);

      expect(response.body).toMatchObject({
        sprites: expect.any(Array),
        total: expect.any(Number),
      });
    });
  });

  describe('Bulk Operations', () => {
    test('GET /api/bulk-export should export all characters', async () => {
      // Create test character first
      await request(app)
        .post('/api/characters')
        .send({
          name: 'Export Test',
          level: 1,
          hp: 10,
          maxHP: 10,
          attack: 1,
          defense: 1,
          ai_type: 'passive',
        });

      const response = await request(app)
        .get('/api/bulk-export')
        .expect(200);

      expect(response.body).toMatchObject({
        characters: expect.any(Array),
        metadata: expect.objectContaining({
          exportDate: expect.any(String),
          totalCharacters: expect.any(Number),
          version: '2.0.0',
        }),
      });

      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    test('POST /api/bulk-import should import characters from file', async () => {
      const importData = {
        characters: [
          {
            name: 'Imported Hero 1',
            level: 3,
            hp: 30,
            max_hp: 30,
            attack: 5,
            defense: 3,
            ai_type: 'aggressive',
          },
          {
            name: 'Imported Hero 2',
            level: 7,
            hp: 70,
            max_hp: 70,
            attack: 12,
            defense: 8,
            ai_type: 'caster',
          },
        ],
      };

      const response = await request(app)
        .post('/api/bulk-import')
        .attach('bulkData', Buffer.from(JSON.stringify(importData)), 'test-import.json')
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Characters imported successfully',
        imported: 2,
        total: 2,
        skipped: 0,
      });

      // Verify characters were imported
      const listResponse = await request(app)
        .get('/api/characters')
        .expect(200);

      expect(listResponse.body.total).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Error Handling', () => {
    test('should return 400 for invalid character data', async () => {
      const invalidData = {
        name: '', // Invalid - empty name
        level: -1, // Invalid - negative level
        ai_type: 'invalid', // Invalid - unsupported AI type
      };

      const response = await request(app)
        .post('/api/characters')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: expect.any(String),
        details: expect.any(String),
      });
    });

    test('should return 400 for invalid character ID format', async () => {
      const response = await request(app)
        .put('/api/characters/invalid-id')
        .send({ name: 'Test' })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Invalid character ID format',
      });
    });

    test('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Not Found',
        message: expect.stringContaining('not found'),
      });
    });

    test('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/characters')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body).toMatchObject({
        error: expect.any(String),
      });
    });
  });

  describe('Legacy Format Compatibility', () => {
    test('should handle both max_hp and maxHP field names', async () => {
      // Test with legacy snake_case field
      const legacyData = {
        name: 'Legacy Hero',
        level: 5,
        hp: 50,
        max_hp: 50, // Legacy field name
        attack: 10,
        defense: 8,
        ai_type: 'guardian',
      };

      const response = await request(app)
        .post('/api/characters')
        .send(legacyData)
        .expect(200);

      expect(response.body.character).toMatchObject({
        name: 'Legacy Hero',
        hp: 50,
        max_hp: 50,
      });
    });

    test('should return data in legacy format', async () => {
      const characterData = {
        name: 'Format Test',
        level: 1,
        hp: 10,
        maxHP: 10,
        attack: 1,
        defense: 1,
        ai_type: 'passive',
      };

      const createResponse = await request(app)
        .post('/api/characters')
        .send(characterData)
        .expect(200);

      const character = createResponse.body.character;

      // Verify legacy format fields
      expect(character).toHaveProperty('max_hp'); // Legacy snake_case
      expect(character).toHaveProperty('created_at'); // Legacy timestamp
      expect(character).toHaveProperty('updated_at'); // Legacy timestamp
      expect(character).toHaveProperty('skill_points'); // Legacy snake_case
    });
  });

  describe('Performance and Stability', () => {
    test('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post('/api/characters')
          .send({
            name: `Concurrent Hero ${i}`,
            level: i + 1,
            hp: (i + 1) * 10,
            maxHP: (i + 1) * 10,
            attack: i + 1,
            defense: i + 1,
            ai_type: 'passive',
          })
      );

      const responses = await Promise.all(requests);
      
      responses.forEach((response, index) => {
        if (response.status !== 200) {
          console.log(`Request ${index} failed:`, response.status, response.body);
        }
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('character');
      });

      // Verify all characters were created
      const listResponse = await request(app)
        .get('/api/characters')
        .expect(200);

      expect(listResponse.body.total).toBeGreaterThanOrEqual(10);
    });

    test('should maintain data integrity under load', async () => {
      // Create a character
      const createResponse = await request(app)
        .post('/api/characters')
        .send({
          name: 'Integrity Test',
          level: 5,
          hp: 50,
          maxHP: 50,
          attack: 10,
          defense: 8,
          ai_type: 'tank',
        });

      const characterId = createResponse.body.character.id;

      // Perform multiple concurrent updates
      const updates = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .put(`/api/characters/${characterId}`)
          .send({
            level: 5 + i,
            hp: 50 + i * 10,
          })
      );

      await Promise.all(updates);

      // Verify final state
      const listResponse = await request(app)
        .get('/api/characters')
        .expect(200);

      const finalCharacter = listResponse.body.characters[characterId];
      expect(finalCharacter).toBeDefined();
      expect(finalCharacter.level).toBeGreaterThanOrEqual(5);
    });
  });
});