# Maps Database System - Phase 2 Architecture

## 🗺️ Maps System Overview

### Core Concepts
- **Map-based exploration system** - Each map represents a unique game area
- **Boss progression system** - Maps unlock by defeating previous map bosses  
- **Achievement-based unlocks** - Alternative unlock methods through achievements
- **Visual map editor** - Interface for creating and editing maps
- **Character-Map relationships** - Track player progress and boss defeats

## Domain Model Design

### Map Entity
```javascript
export class Map {
  constructor({
    id,           // MapId value object (immutable hex)
    name,         // Required string (3-50 chars)
    description,  // Optional string (max 500 chars)
    difficulty,   // Integer 1-10
    dimensions,   // MapDimensions value object {width, height}
    boss,         // BossData value object
    unlockReq,    // UnlockRequirement value object
    rewards,      // MapRewards value object
    assets,       // MapAssets value object (background, tiles)
    metadata      // Metadata value object
  })
}
```

### Value Objects

#### MapId
- 10-character hexadecimal (same pattern as CharacterId)
- Immutable, cryptographically secure
- Used as foreign key in achievement and progress systems

#### MapDimensions
```javascript
export class MapDimensions {
  constructor({ width, height }) {
    // Width: 10-100 tiles
    // Height: 10-100 tiles
    // Aspect ratio validation
  }
}
```

#### BossData
```javascript
export class BossData {
  constructor({
    characterId,  // Reference to existing character
    spawnPoint,   // {x, y} coordinates
    difficulty,   // Multiplier for boss stats
    drops,        // Special rewards for defeating boss
    isDefeated    // Track defeat status per player/session
  })
}
```

#### UnlockRequirement
```javascript
export class UnlockRequirement {
  constructor({
    type,         // 'boss_defeat' | 'achievement' | 'level' | 'always'
    targetMapId,  // Required map completion (for boss_defeat)
    targetBossId, // Specific boss defeat requirement
    achievement,  // Achievement name required
    playerLevel,  // Minimum level requirement
    description   // Human-readable requirement
  })
}
```

#### MapRewards
```javascript
export class MapRewards {
  constructor({
    experience,   // Base experience for completion
    goldRange,    // [min, max] gold reward
    items,        // Array of item drops
    unlocks       // Array of maps/features this unlocks
  })
}
```

## Clean Architecture Structure

```
src/domain/maps/
├── entities/
│   └── Map.js                    # Core map entity
├── value-objects/
│   ├── MapId.js                  # Map identification
│   ├── MapDimensions.js          # Map size and layout
│   ├── BossData.js               # Boss configuration
│   ├── UnlockRequirement.js      # Unlock logic
│   ├── MapRewards.js             # Reward system
│   └── MapAssets.js              # Asset management
├── repositories/
│   └── MapRepository.js          # Data access interface
└── services/
    └── MapDomainService.js       # Domain business logic

src/application/maps/
├── services/
│   ├── MapService.js             # Application orchestration
│   └── MapProgressService.js     # Progress tracking
├── use-cases/
│   ├── CreateMapUseCase.js       # Map creation workflow
│   ├── UnlockMapUseCase.js       # Map unlocking logic
│   └── DefeatBossUseCase.js      # Boss defeat processing
└── dto/
    ├── MapCreateDTO.js           # Creation data transfer
    └── MapProgressDTO.js         # Progress data transfer

src/infrastructure/maps/
├── repositories/
│   └── JsonMapRepository.js      # JSON file storage
├── file-system/
│   └── MapAssetManager.js        # Map image/asset handling
└── web/
    ├── controllers/
    │   └── MapController.js      # HTTP endpoints
    └── routes/
        └── mapRoutes.js          # Route definitions
```

## API Design

### REST Endpoints
```
GET    /api/v2/maps              # List all maps with unlock status
POST   /api/v2/maps              # Create new map
GET    /api/v2/maps/:id          # Get specific map details
PUT    /api/v2/maps/:id          # Update map (admin only)
DELETE /api/v2/maps/:id          # Delete map (admin only)

# Progress Tracking
GET    /api/v2/maps/:id/progress # Get player progress for map
POST   /api/v2/maps/:id/defeat-boss # Record boss defeat
GET    /api/v2/maps/unlocked     # Get all unlocked maps for player

# Map Assets
POST   /api/v2/maps/:id/assets   # Upload map background/tiles
GET    /api/v2/maps/:id/assets   # Get map asset information
DELETE /api/v2/maps/:id/assets   # Remove map assets

# Map Editor
GET    /api/v2/maps/:id/editor   # Get map editor data
POST   /api/v2/maps/:id/editor   # Save map editor changes
```

## Database Schema (JSON)

### maps.json
```json
{
  "maps": [
    {
      "id": "1A2B3C4D5E",
      "name": "Forest Entrance",
      "description": "A peaceful forest path leading deeper into the wilderness",
      "difficulty": 1,
      "dimensions": {
        "width": 20,
        "height": 15
      },
      "boss": {
        "characterId": "F5B70CFAC9",
        "spawnPoint": { "x": 18, "y": 7 },
        "difficulty": 1.0,
        "drops": ["healing_potion", "forest_key"],
        "isDefeated": false
      },
      "unlockRequirement": {
        "type": "always",
        "description": "Starting area - always available"
      },
      "rewards": {
        "experience": 100,
        "goldRange": [10, 25],
        "items": ["minor_health_potion"],
        "unlocks": ["2B3C4D5E6F"]
      },
      "assets": {
        "background": "forest_bg.jpg",
        "tileset": "forest_tiles.png",
        "music": "forest_theme.mp3"
      },
      "metadata": {
        "createdAt": "2025-08-28T12:00:00.000Z",
        "updatedAt": "2025-08-28T12:00:00.000Z",
        "version": "2.0.0"
      }
    }
  ],
  "progress": [
    {
      "playerId": "default",
      "mapProgress": [
        {
          "mapId": "1A2B3C4D5E",
          "unlocked": true,
          "bossDefeated": false,
          "completionCount": 0,
          "firstUnlock": "2025-08-28T12:00:00.000Z",
          "lastPlayed": "2025-08-28T12:00:00.000Z"
        }
      ]
    }
  ]
}
```

## Integration with Character System

### Boss Character Integration
- Maps reference existing Character IDs for boss encounters
- Boss difficulty multipliers applied to character base stats
- Character AI types influence boss behavior patterns
- Boss defeats trigger character experience/gold rewards

### Unlock Progression Chain
```
Forest Entrance (always) → 
  defeat Forest Guardian → 
    unlock Mountain Pass → 
      defeat Mountain Troll → 
        unlock Crystal Caves → etc.
```

## Frontend Interface

### Maps Management Interface
- **Map List View**: Grid of map cards with unlock status
- **Map Detail View**: Full map information with boss details
- **Map Editor**: Drag-and-drop visual map creator
- **Progress Tracking**: Visual progression tree/map
- **Boss Battle Interface**: Character selection and battle simulation

### Visual Design Concepts
- **Map Cards**: Preview image, name, difficulty, unlock status
- **Progression Tree**: Visual flowchart showing unlock paths
- **Boss Encounters**: Character portraits with defeat status
- **Achievement Integration**: Achievement badges and requirements
- **Asset Management**: Upload and preview map backgrounds/tilesets

## Success Metrics

### Technical Metrics
- ✅ All maps stored with immutable hex IDs
- ✅ Clean Architecture compliance (SOLID principles)
- ✅ Boss-Character relationship integrity maintained
- ✅ Unlock progression logic validated
- ✅ Asset management (backgrounds, tilesets, music)

### Functional Metrics  
- ✅ Map creation with visual editor
- ✅ Boss configuration with character integration
- ✅ Unlock requirement validation
- ✅ Progress tracking per player
- ✅ Achievement system integration
- ✅ Export functionality for game engines

## Implementation Priority

### Phase 2.1: Core Domain (Week 1)
- MapId, MapDimensions, BossData value objects
- Map entity with business logic
- MapRepository interface
- Domain services

### Phase 2.2: Application Layer (Week 2)  
- MapService application orchestration
- Map creation/editing use cases
- Progress tracking services
- Boss defeat processing

### Phase 2.3: Infrastructure (Week 3)
- JsonMapRepository implementation
- Map asset management system
- HTTP controllers and routes
- Database migration from characters.json pattern

### Phase 2.4: Presentation (Week 4)
- Maps management interface
- Visual map editor
- Progress tracking dashboard
- Integration with existing character interface

This architecture builds on the proven Character Database patterns while introducing the map-specific domain concepts needed for a complete RPG system.