// Draggable Battle Log System
class DraggableBattleLog {
    constructor() {
        this.battleLog = null;
        this.isDragging = false;
        this.isResizing = false;
        this.startX = 0;
        this.startY = 0;
        this.startWidth = 0;
        this.startHeight = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.xOffset = 0;
        this.yOffset = 0;
        
        this.init();
    }
    
    init() {
        this.battleLog = document.getElementById('battle-log-container');
        if (!this.battleLog) return;
        
        // Drag functionality
        const dragHandle = this.battleLog.querySelector('.drag-handle');
        if (dragHandle) {
            dragHandle.addEventListener('mousedown', this.dragStart.bind(this));
            dragHandle.addEventListener('touchstart', this.dragStart.bind(this));
        }
        
        // Also allow dragging from the battle-log itself (but not from content area)
        this.battleLog.addEventListener('mousedown', this.dragStart.bind(this));
        this.battleLog.addEventListener('touchstart', this.dragStart.bind(this));
        
        // Resize functionality
        const resizeHandle = this.battleLog.querySelector('.resize-handle');
        if (resizeHandle) {
            resizeHandle.addEventListener('mousedown', this.resizeStart.bind(this));
            resizeHandle.addEventListener('touchstart', this.resizeStart.bind(this));
        }
        
        // Global event listeners
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        document.addEventListener('touchmove', this.handleTouchMove.bind(this));
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Prevent default drag behavior
        this.battleLog.addEventListener('dragstart', (e) => e.preventDefault());
        
        // Double click to reset
        this.battleLog.addEventListener('dblclick', this.resetPosition.bind(this));
        
        // Load saved position and size
        this.loadSettings();
    }
    
    dragStart(e) {
        // Don't drag if clicking on scroll content, resize handle, or interactive elements
        const target = e.target;
        if (target.classList.contains('resize-handle') ||
            target.classList.contains('log-content') ||
            target.closest('.log-content') ||
            target.tagName === 'BUTTON' ||
            target.tagName === 'INPUT') {
            return;
        }
        
        // Only allow dragging from drag handle or battle-log container
        if (!target.classList.contains('drag-handle') && 
            !target.classList.contains('battle-log')) {
            return;
        }
        
        this.isDragging = true;
        this.battleLog.classList.add('dragging');
        
        if (e.type === 'touchstart') {
            this.startX = e.touches[0].clientX - this.xOffset;
            this.startY = e.touches[0].clientY - this.yOffset;
        } else {
            this.startX = e.clientX - this.xOffset;
            this.startY = e.clientY - this.yOffset;
        }
        
        e.preventDefault();
    }
    
    resizeStart(e) {
        this.isResizing = true;
        this.battleLog.classList.add('dragging'); // Use same visual feedback
        
        const rect = this.battleLog.getBoundingClientRect();
        this.startWidth = rect.width;
        this.startHeight = rect.height;
        
        if (e.type === 'touchstart') {
            this.startX = e.touches[0].clientX;
            this.startY = e.touches[0].clientY;
        } else {
            this.startX = e.clientX;
            this.startY = e.clientY;
        }
        
        e.preventDefault();
        e.stopPropagation();
    }
    
    handleMouseMove(e) {
        if (this.isDragging) {
            this.drag(e.clientX, e.clientY);
        } else if (this.isResizing) {
            this.resize(e.clientX, e.clientY);
        }
    }
    
    handleTouchMove(e) {
        if (this.isDragging) {
            this.drag(e.touches[0].clientX, e.touches[0].clientY);
        } else if (this.isResizing) {
            this.resize(e.touches[0].clientX, e.touches[0].clientY);
        }
        e.preventDefault();
    }
    
    drag(clientX, clientY) {
        this.currentX = clientX - this.startX;
        this.currentY = clientY - this.startY;
        
        this.xOffset = this.currentX;
        this.yOffset = this.currentY;
        
        // Apply boundaries
        const rect = this.battleLog.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;
        const minX = -rect.width + 100; // Allow partial off-screen
        const minY = 0;
        
        this.xOffset = Math.max(minX, Math.min(maxX, this.xOffset));
        this.yOffset = Math.max(minY, Math.min(maxY, this.yOffset));
        
        this.setTransform();
    }
    
    resize(clientX, clientY) {
        const deltaX = clientX - this.startX;
        const deltaY = clientY - this.startY;
        
        const newWidth = Math.max(250, Math.min(600, this.startWidth + deltaX));
        const newHeight = Math.max(120, Math.min(400, this.startHeight + deltaY));
        
        this.battleLog.style.width = newWidth + 'px';
        this.battleLog.style.height = newHeight + 'px';
        this.battleLog.style.maxHeight = newHeight + 'px';
        this.battleLog.style.minHeight = Math.min(120, newHeight) + 'px';
    }
    
    handleMouseUp() {
        this.endDragResize();
    }
    
    handleTouchEnd() {
        this.endDragResize();
    }
    
    endDragResize() {
        if (this.isDragging || this.isResizing) {
            this.isDragging = false;
            this.isResizing = false;
            this.battleLog.classList.remove('dragging');
            this.saveSettings();
        }
    }
    
    setTransform() {
        this.battleLog.style.transform = `translate(${this.xOffset}px, ${this.yOffset}px)`;
    }
    
    saveSettings() {
        const rect = this.battleLog.getBoundingClientRect();
        const settings = {
            x: this.xOffset,
            y: this.yOffset,
            width: rect.width,
            height: rect.height
        };
        localStorage.setItem('battleLogSettings', JSON.stringify(settings));
    }
    
    loadSettings() {
        const savedSettings = localStorage.getItem('battleLogSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            
            this.xOffset = settings.x || 0;
            this.yOffset = settings.y || 0;
            
            if (settings.width) {
                this.battleLog.style.width = settings.width + 'px';
            }
            if (settings.height) {
                this.battleLog.style.height = settings.height + 'px';
                this.battleLog.style.maxHeight = settings.height + 'px';
            }
            
            this.setTransform();
        }
    }
    
    resetPosition() {
        this.xOffset = 0;
        this.yOffset = 0;
        this.battleLog.style.transform = 'translate(0px, 0px)';
        this.battleLog.style.width = '400px';
        this.battleLog.style.height = '180px';
        this.battleLog.style.maxHeight = '200px';
        this.battleLog.style.minHeight = '160px';
        localStorage.removeItem('battleLogSettings');
    }
    
    // Public methods
    centerBattleLog() {
        const rect = this.battleLog.getBoundingClientRect();
        this.xOffset = (window.innerWidth - rect.width) / 2 - rect.left;
        this.yOffset = (window.innerHeight - rect.height) / 2 - rect.top;
        this.setTransform();
        this.saveSettings();
    }
    
    minimizeBattleLog() {
        this.battleLog.style.height = '40px';
        this.battleLog.style.minHeight = '40px';
        this.battleLog.classList.add('minimized');
    }
    
    maximizeBattleLog() {
        this.battleLog.style.height = '180px';
        this.battleLog.style.minHeight = '160px';
        this.battleLog.classList.remove('minimized');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.draggableBattleLog = new DraggableBattleLog();
});