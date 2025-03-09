class MasterDataManager {
    constructor() {
        this.countries = [{ id: 1, name: 'NEPAL' }];
        this.units = [
            { id: 1, name: 'PKG' },
            { id: 2, name: 'KG' },
            { id: 3, name: 'FIXED' },
            { id: 4, name: 'CASE' },
            { id: 5, name: 'SMALL' },
            { id: 6, name: 'MEDIUM' },
            { id: 7, name: 'LARGE' }
        ];
        this.descriptions = [
            { id: 1, name: 'Kirana Goods' },
            { id: 2, name: 'Garlic Flakes' },
            { id: 3, name: 'Chemicals' }
        ];
        this.godowns = [
            { id: 1, name: 'AADARSHNAGAR', address: 'Kathmandu', capacity: 1000 },
            { id: 2, name: 'AMAR CHOWK', address: 'Pokhara', capacity: 800 }
        ];
        this.series = [
            { id: 1, name: 'KTM8182', branch: 'Kathmandu' },
            { id: 2, name: 'PKR8182', branch: 'Pokhara' }
        ];
        this.narrations = [
            { id: 1, text: 'Freight Charges' },
            { id: 2, text: 'Loading Charges' },
            { id: 3, text: 'Unloading Charges' }
        ];
        this.agents = [
            { id: 1, name: 'SELF' },
            { id: 2, name: 'AYUSH' }
        ];
    }

    // Generic CRUD operations for all master data types
    add(type, item) {
        if (!this[type]) {
            throw new Error(`Invalid master data type: ${type}`);
        }
        const newId = Math.max(...this[type].map(x => x.id)) + 1;
        const newItem = { ...item, id: newId };
        this[type].push(newItem);
        this.notifyUpdate(type);
        return newItem;
    }

    update(type, id, updates) {
        if (!this[type]) {
            throw new Error(`Invalid master data type: ${type}`);
        }
        const index = this[type].findIndex(item => item.id === id);
        if (index === -1) {
            throw new Error(`Item not found in ${type} with id ${id}`);
        }
        this[type][index] = { ...this[type][index], ...updates };
        this.notifyUpdate(type);
        return this[type][index];
    }

    delete(type, id) {
        if (!this[type]) {
            throw new Error(`Invalid master data type: ${type}`);
        }
        const index = this[type].findIndex(item => item.id === id);
        if (index === -1) {
            throw new Error(`Item not found in ${type} with id ${id}`);
        }
        this[type].splice(index, 1);
        this.notifyUpdate(type);
    }

    getList(type) {
        if (!this[type]) {
            throw new Error(`Invalid master data type: ${type}`);
        }
        return [...this[type]];
    }

    // Notification system for updates
    notifyUpdate(type) {
        const event = new CustomEvent('masterDataUpdate', {
            detail: { type, data: this.getList(type) }
        });
        document.dispatchEvent(event);
        
        // Show notification
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300 ease-in-out';
        notification.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize master data manager
window.masterData = new MasterDataManager();
