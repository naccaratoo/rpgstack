# 🎮 RPGStack

> **Complete RPG Development Stack** - A modular RPG development system starting with character management. Built with modern web technologies for cross-platform deployment.

![Project Status](https://img.shields.io/badge/Status-Phase%201%20Complete-brightgreen)
![Next Phase](https://img.shields.io/badge/Next-Maps%20Database-blue)
![Platform](https://img.shields.io/badge/Platform-Web%20%2B%20Mobile-orange)

## 🌟 **Project Vision**

RPGStack is a **complete modular RPG development framework** that includes:
- 🎲 **Cross-platform RPG game** (Web + Mobile)
- 🗺️ **Map-based exploration system** with boss progression  
- ⚔️ **Items & Skills databases** with complex relationships
- 📱 **React + React Native** implementation
- 🎯 **Modern game design principles** and optimization

---

## ✨ **Current Features (Character Database Module)**

### 🎨 **Professional Interface**
- **Dual View System**: Switch between Cards and Table layouts
- **Responsive Design**: Mobile-first, works on all screen sizes
- **Pagination**: 20 items per page with smart navigation
- **Search & Filter**: Real-time character filtering
- **Clean UI**: Modern design with consistent #6c757d theme

### 🗃️ **Character Management**
- **Hexadecimal IDs**: Unique, immutable character identification
- **Complete CRUD**: Create, Read, Update, Delete operations
- **Rich Data**: Name, class, level, HP, MP, stats, AI type, description
- **61+ Characters**: Pre-populated with diverse RPG characters

### 🖼️ **Sprite System**
- **Upload & Display**: Drag & drop sprite management
- **Rename Functionality**: Update sprite names without re-upload
- **Cache Busting**: Immediate sprite updates with timestamps
- **Local Storage**: Organized sprite file management

### 💾 **Data Management**
- **JSON Database**: Structured, human-readable data storage
- **Auto Backup**: Automatic backups on data changes
- **Manual Backup/Restore**: Full system backup with sprites
- **Export/Import**: Share data between instances
- **Data Validation**: Robust error handling and validation

---

## 🚀 **Quick Start**

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone [your-repo-url]
cd rpgstack

# Install dependencies
npm install

# Start the server
node server.js
```

### Usage
1. **Access the application**: Open `http://localhost:3002`
2. **Create characters**: Use the form on the left to add new characters
3. **Manage data**: Use action buttons for bulk operations
4. **Switch views**: Toggle between Cards and Table layouts
5. **Upload sprites**: Drag & drop images for character avatars

---

## 📋 **API Documentation**

### Character Endpoints
```javascript
GET    /api/characters           // Get all characters
POST   /api/characters           // Create new character
PUT    /api/characters/:id       // Update character
DELETE /api/characters/:id       // Delete character
```

### Sprite Management
```javascript
POST   /api/rename-sprite        // Rename character sprite
POST   /api/upload               // Upload new sprite
```

### System Operations
```javascript
GET    /api/backup               // Download system backup
POST   /api/restore              // Restore from backup
```

---

## 🏗️ **Architecture & Technology**

### **Current Stack**
- **Frontend**: Vanilla JavaScript with modern ES6+ features
- **Backend**: Node.js + Express.js
- **Database**: JSON-based with file system storage
- **UI**: Custom CSS with responsive design
- **Assets**: Local sprite management with caching

### **Data Structure**
```javascript
{
  id: "a1b2c3d4",           // Hexadecimal ID
  nome: "Dragon Knight",    // Character name
  classe: "Warrior",        // Character class
  nivel: 15,               // Character level
  hp: 150,                 // Health points
  mp: 50,                  // Mana points
  ataque: 85,              // Attack stat
  defesa: 70,              // Defense stat
  velocidade: 60,          // Speed stat
  inteligencia: 40,        // Intelligence stat
  sorte: 25,               // Luck stat
  tipo_ia: "Aggressive",   // AI behavior type
  descricao: "A mighty...", // Character description
  sprite: "dragon-knight.png" // Sprite filename
}
```

---

## 🎯 **Upcoming Features**

### **Phase 2: Maps Database** (Next 4 weeks)
- 🗺️ Map creation and management system
- 🏆 Achievement-based map unlocking
- 👹 Boss-character integration
- 🎨 Visual map editor interface

### **Phase 3: Items & Skills** (Following 5 weeks)
- ⚔️ Comprehensive items database (weapons, armor, consumables)
- 🔮 Skills system (active abilities, passive traits)
- 🔗 Character-item-skill relationships
- ⚖️ Stats calculation and balance system

### **Phase 4: Game Engine** (8 weeks)
- 🎲 Turn-based combat system
- 🗺️ 2D map navigation and exploration
- 📈 Character progression and leveling
- 💾 Advanced save/load functionality

### **Phase 5: Mobile App** (6 weeks)
- 📱 React Native cross-platform app
- 🎮 Touch-optimized game controls
- 🏪 App store deployment (iOS + Android)
- ☁️ Cloud save synchronization

---

## 🖼️ **Screenshots**

### Cards View (Default)
*Professional card layout with complete character information*

### Table View
*Compact table view with horizontal scroll for efficiency*

### Character Creation
*Comprehensive form interface with validation*

---

## 🛠️ **Development Setup**

### **Project Structure**
```
rpgstack/
├── server.js              # Main server file
├── index.html             # Frontend interface
├── style.css              # UI styling
├── script.js              # Frontend JavaScript
├── characters.json        # Character database
├── sprites/               # Character images
├── backups/              # System backups
├── CLAUDE.md             # Development log
├── Planning.md           # Project roadmap
└── tasks.md              # Development tasks
```

### **Code Quality**
- ✅ ESLint configuration for code consistency
- ✅ Prettier formatting for code style
- ✅ Pre-commit hooks for quality control
- ✅ Comprehensive error handling
- ✅ Modular, maintainable code structure

### **Terminal-Based Debugging**
- 📁 **`terminal-fixes/`** - Documentation repository for bugs resolved via terminal/CLI commands
- 🔧 **Manual Fix Knowledge Base** - Detailed reports of system-level debugging processes
- 🎯 **Learning Resource** - Command-line methodologies and root cause analysis documentation
- 📋 **Standardized Structure** - Each case includes commands, logs, and prevention strategies

---

## 🤝 **Contributing**

This project is part of a larger RPG game development initiative. Contributions are welcome!

### **How to Contribute**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Guidelines**
- Follow existing code style and conventions
- Add tests for new functionality
- Update documentation for any API changes
- Ensure responsive design principles
- Maintain the established UI/UX patterns

---

## 📊 **Project Stats**

- **Characters**: 61+ pre-populated diverse RPG characters
- **Features**: 15+ major features implemented
- **Code Quality**: 90%+ test coverage target
- **Performance**: <3s load time, 60fps target
- **Compatibility**: Modern browsers, mobile responsive

---

## 📚 **Documentation**

- **[Planning.md](Planning.md)**: Complete project roadmap and vision
- **[tasks.md](tasks.md)**: Detailed development milestones and tasks
- **[CLAUDE.md](CLAUDE.md)**: Development log and technical decisions
- **API Docs**: Comprehensive endpoint documentation (above)

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🎯 **Portfolio Highlights**

### **Technical Achievements**
- 🏗️ **Modular Architecture**: Clean, scalable system design
- 🎨 **Modern UI/UX**: Professional interface with dual-view system
- ⚡ **Performance Optimization**: Pagination, caching, efficient rendering
- 📱 **Responsive Design**: Mobile-first, cross-platform compatibility
- 🔒 **Data Integrity**: Robust backup/restore and validation systems

### **Game Development Skills**
- 🎲 **RPG Systems**: Character stats, progression, AI types
- 🗃️ **Database Design**: Relational data modeling for game entities
- 🖼️ **Asset Management**: Sprite handling, caching, optimization
- 🎯 **User Experience**: Intuitive interfaces for complex data management

---

## 🔗 **Links**

- **Live Demo**: [Coming Soon - Deployment in Progress]
- **GitHub Repository**: [Your Repository URL]
- **Project Documentation**: [Link to full docs]
- **Developer Portfolio**: [Your Portfolio URL]

---

## 🙋‍♂️ **Contact & Support**

- **Developer**: [Your Name]
- **Email**: [Your Email]
- **LinkedIn**: [Your LinkedIn]
- **Issues**: Use GitHub Issues for bug reports and feature requests

---

<div align="center">

**⭐ Star this project if you found it useful! ⭐**

*Part of a comprehensive RPG game development portfolio*

![Made with Love](https://img.shields.io/badge/Made%20with-💖-red)
![Open Source](https://img.shields.io/badge/Open%20Source-Yes-brightgreen)
![Portfolio Project](https://img.shields.io/badge/Portfolio-Project-blue)

</div>