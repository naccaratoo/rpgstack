# 🏹 Arsenal Adaptativo v2.0.0 REWORK - Complete Documentation

## 📋 Skill Overview

**Skill Name**: Arsenal Adaptativo v2.0.0 REWORK  
**ID**: `8AB7CDE5F9`  
**Class**: Armamentista  
**Version**: 2.0.0  
**Type**: Active Buff (Previously Passive)  
**Rework Date**: September 1, 2025

---

## 🔄 REWORK Summary

### **What Changed:**
- ❌ **Old Version**: Passive skill with simple 3% per alternation
- ✅ **New Version**: Active skill with tactical configuration system
- 🔧 **Cost**: Increased from 20 → 40 ânima
- ⏱️ **Duration**: Added 8 turns of active mode
- 🎯 **Complexity**: Simple alternation → Advanced configuration system

### **Why Rework:**
- **Consistency**: Align with Cadência do Dragão v6.0.0 active mechanics
- **Depth**: Provide meaningful tactical choices for Armamentista players
- **Balance**: Increase skill cost and complexity for powerful effects
- **Engagement**: Require player interaction and strategic planning

---

## ⚙️ New Mechanics v2.0.0

### **🎮 Activation Phase**
```
Player uses "Arsenal Adaptativo" skill
├── Costs: 40 ânima
├── Effect: Enters "Modo Arsenal" for 8 turns
├── Visual: Shows "🏹 ARSENAL ATIVO" indicator
└── Status: Ready to unlock configurations
```

### **🔧 Configuration System**
During active mode, each action type unlocks a specific configuration:

#### **🗡️ Configuração Ofensiva**
- **Trigger**: After performing any Attack action
- **Effect**: Next attack gains +25% critical damage
- **Duration**: 1 action (consumed on next attack)
- **Visual**: "⚔️ OFENSIVO" badge

#### **🛡️ Configuração Defensiva**  
- **Trigger**: After performing Defend action
- **Effect**: Next action has -50% ânima cost
- **Duration**: 1 action (consumed on next skill/action)
- **Visual**: "🛡️ DEFENSIVO" badge

#### **🧘 Configuração Suporte**
- **Trigger**: After performing Meditate action  
- **Effect**: Next skill ignores cooldown (if any)
- **Duration**: 1 action (consumed on next skill)
- **Visual**: "🧘 SUPORTE" badge

#### **🎯 Configuração Híbrida**
- **Trigger**: After using any Skill
- **Effect**: Next action has +15% general effectiveness
- **Duration**: 1 action (consumed on next action)
- **Visual**: "🎯 HÍBRIDO" badge

### **🔄 Combo System**
Consecutive different configurations provide escalating bonuses:

```
🎯 Combo Progression:
├── 2 Different Configs: +10% bonus to all effects
├── 3 Different Configs: +20% bonus to all effects  
├── 4 Different Configs: RESET + Free Arsenal Mode
└── Cycle Complete: New 8-turn Arsenal mode (0 ânima cost)
```

---

## 📐 Technical Implementation

### **Skill Data Structure v2.0.0**
```json
{
  "id": "8AB7CDE5F9",
  "name": "🏹 Arsenal Adaptativo v2.0.0 REWORK",
  "type": "buff",
  "classe": "Armamentista",
  "anima_cost": 40,
  "duration": 8,
  "effects": [{
    "type": "tactical_configuration",
    "configurations": {
      "offensive": {
        "trigger": "attack",
        "effect": "+25% critical damage",
        "duration": 1
      },
      "defensive": {
        "trigger": "defend", 
        "effect": "-50% anima cost next action",
        "duration": 1
      },
      "support": {
        "trigger": "meditate",
        "effect": "ignore cooldown next skill",
        "duration": 1
      },
      "hybrid": {
        "trigger": "skill",
        "effect": "+15% general effectiveness", 
        "duration": 1
      }
    },
    "combo_system": {
      "2_configs": "+10% bonus",
      "3_configs": "+20% bonus", 
      "4_configs": "reset + free arsenal mode"
    }
  }],
  "metadata": {
    "version": "2.0.0",
    "mechanic": "tactical_configurations",
    "activationRequired": true,
    "modeDuration": 8,
    "comboSystem": true
  }
}
```

### **Battle Integration Algorithm**
```javascript
// Activation
function activateArsenalAdaptativo(character) {
  if (character.anima >= 40) {
    character.anima -= 40;
    character.arsenalMode = {
      active: true,
      turnsRemaining: 8,
      currentConfigs: [],
      comboCount: 0
    };
    return { success: true, message: "🏹 ARSENAL ATIVO por 8 turnos" };
  }
  return { success: false, message: "Ânima insuficiente" };
}

// Configuration Unlock
function unlockConfiguration(character, actionType) {
  if (!character.arsenalMode.active) return;
  
  const configMap = {
    "attack": "offensive",
    "defend": "defensive", 
    "meditate": "support",
    "skill": "hybrid"
  };
  
  const newConfig = configMap[actionType];
  if (newConfig && !character.arsenalMode.currentConfigs.includes(newConfig)) {
    character.arsenalMode.currentConfigs.push(newConfig);
    character.arsenalMode.comboCount = character.arsenalMode.currentConfigs.length;
    
    // Check for cycle completion
    if (character.arsenalMode.comboCount >= 4) {
      resetCycleAndGrantFree(character);
    }
    
    return applyConfigurationEffect(character, newConfig);
  }
}

// Effect Application
function applyConfigurationEffect(character, config) {
  const comboBonus = character.arsenalMode.comboCount * 0.10;
  
  switch(config) {
    case "offensive":
      character.nextAttackCriticalBonus = 0.25 + comboBonus;
      break;
    case "defensive":
      character.nextActionAnimaReduction = 0.50 + comboBonus;
      break;
    case "support":
      character.nextSkillIgnoresCooldown = true;
      break;
    case "hybrid":
      character.nextActionEffectivenessBonus = 0.15 + comboBonus;
      break;
  }
}
```

---

## 🎯 Gameplay Examples

### **Example 1: Basic Configuration Unlocking**
```
Turn 1: Activate Arsenal Adaptativo (40 ânima)
        → Arsenal Mode: 8 turns remaining
        → Status: Ready for configurations

Turn 2: Basic Attack on enemy
        → Unlocks: 🗡️ Configuração Ofensiva
        → Effect: Next attack +25% critical damage
        → Arsenal Mode: 7 turns remaining

Turn 3: Basic Attack on enemy  
        → Consumes: Offensive configuration
        → Damage: Normal + 25% critical bonus
        → Arsenal Mode: 6 turns remaining

Turn 4: Defend action
        → Unlocks: 🛡️ Configuração Defensiva  
        → Effect: Next action -50% ânima cost
        → Combo: 2 different configs = +10% bonus
        → Arsenal Mode: 5 turns remaining

Turn 5: Use skill (e.g., healing skill costing 30 ânima)
        → Consumes: Defensive configuration  
        → Actual Cost: 15 ânima (50% reduction + 10% combo bonus)
        → Unlocks: 🎯 Configuração Híbrida
        → Combo: 3 different configs = +20% bonus
        → Arsenal Mode: 4 turns remaining
```

### **Example 2: Full Cycle Completion**
```
Arsenal Active: 8 turns, Combo: 0

Action Sequence:
├── Attack → 🗡️ Ofensiva (Combo: 1)
├── Defend → 🛡️ Defensiva (Combo: 2, +10% bonus)
├── Meditate → 🧘 Suporte (Combo: 3, +20% bonus)  
└── Use Skill → 🎯 Híbrida (Combo: 4, +30% bonus)

Cycle Complete Effect:
├── Reset combo counter to 0
├── Clear current configurations  
├── Grant FREE Arsenal Mode (8 turns, 0 ânima cost)
└── Player can immediately start new cycle
```

---

## ⚖️ Balance Considerations

### **Power Level Analysis**
- **Cost vs Benefit**: 40 ânima for 8 turns of tactical advantage
- **Opportunity Cost**: Player must diversify actions to maximize benefit
- **Skill Ceiling**: Rewards strategic planning and action variety
- **Counterplay**: Opponents can predict configurations based on player actions

### **Comparison with Other Skills**

| Skill | Cost | Duration | Complexity | Power |
|-------|------|----------|------------|-------|
| Cadência do Dragão | 50 ânima | 999 turns | Medium | Very High |
| Arsenal Adaptativo v2.0 | 40 ânima | 8 turns | High | High |
| Convergência Ânima | 20 ânima | Permanent | Low | Medium |

### **Synergies**
- **With Weapon Skills**: Critical damage bonus enhances weapon-based attacks
- **With Support Skills**: Cooldown ignoring allows rapid utility deployment  
- **With Defensive Play**: Ânima cost reduction enables sustained skill usage
- **With Mixed Strategies**: Rewards players who use varied tactical approaches

---

## 📊 Implementation Checklist

### **Database Integration**
- ✅ Updated skills.json with v2.0.0 data structure
- ✅ Added tactical_configuration effect type
- ✅ Implemented combo system metadata
- ✅ Set activation requirement flags

### **Battle System Integration**
- 📋 Implement configuration unlock triggers
- 📋 Add combo tracking system  
- 📋 Create configuration effect applications
- 📋 Build cycle reset and free mode logic

### **UI/UX Implementation**
- 📋 Design Arsenal Mode visual indicator
- 📋 Create configuration status badges
- 📋 Implement combo counter display
- 📋 Add configuration effect previews

### **Testing Requirements**
- 📋 Test all 4 configuration types
- 📋 Verify combo system progression  
- 📋 Validate cycle completion rewards
- 📋 Confirm ânima cost and duration accuracy

---

## 🚀 Future Enhancements

### **Potential v3.0.0 Features**
- **Configuration Combinations**: Unlock special effects when multiple configs active
- **Arsenal Mastery**: Permanent upgrades based on Arsenal usage frequency
- **Weapon-Specific Configs**: Different effects based on equipped weapon type
- **Team Arsenal**: Share configuration benefits with party members

### **Advanced Mechanics**
- **Configuration Stacking**: Allow multiple configurations of same type
- **Dynamic Duration**: Extend Arsenal Mode based on successful combos
- **Counter-Configuration**: Defensive options against enemy configuration prediction
- **Arsenal Overcharge**: Risk/reward mechanic for exceeding normal limits

---

## 📚 Documentation Standards

### **Version History**
- **v1.0.0**: Original passive alternation system
- **v2.0.0**: Active tactical configuration system (Current)

### **Dependencies**  
- **Skills System**: v4.0.0+ required
- **Battle System**: v5.0.0+ required  
- **Character Database**: Armamentista class integration
- **Ânima System**: Cost tracking and validation

### **Integration Points**
- **Character Selection**: Must validate Armamentista class
- **Battle Interface**: Configuration status display
- **Action Processing**: Trigger detection and effect application
- **Turn Management**: Duration countdown and mode expiration

---

**Skill Status**: ✅ **REWORK COMPLETE - READY FOR IMPLEMENTATION**  
**Documentation**: ✅ **COMPREHENSIVE AND UP-TO-DATE**  
**Integration**: 📋 **PENDING BATTLE SYSTEM IMPLEMENTATION**  

---

*🏹 Arsenal Adaptativo v2.0.0 REWORK - Advanced tactical configuration system for Armamentista class, providing strategic depth through active skill management and combo system mechanics. Designed for skilled players who enjoy complex tactical gameplay. 🎯*