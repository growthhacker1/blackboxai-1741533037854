class MasterConfig {
    constructor() {
        this.countries = [];
        this.units = [];
        this.descriptions = [];
        this.godowns = [];
        this.series = [];
        this.narrations = [];
        this.agents = [];
        
        // Initialize with default data
        this.initializeDefaults();
    }

    initializeDefaults() {
        // Countries
        this.countries = [
            { id: 1, code: 'NPL', name: 'Nepal', active: true }
        ];

        // Units
        this.units = [
            { id: 1, code: 'PKG', name: 'Package', active: true },
            { id: 2, code: 'KG', name: 'Kilogram', active: true },
            { id: 3, code: 'FIXED', name: 'Fixed', active: true },
            { id: 4, code: 'CASE', name: 'Case', active: true },
            { id: 5, code: 'TRAY', name: 'Tray', active: true },
            { id: 6, code: 'SMALL', name: 'Small', active: true },
            { id: 7, code: 'MEDIUM', name: 'Medium', active: true },
            { id: 8, code: 'LARGE', name: 'Large', active: true }
        ];

        // Descriptions/Content Types
        this.descriptions = [
            { id: 1, code: 'KIRANA', name: 'Kirana Goods', active: true },
            { id: 2, code: 'GARLIC', name: 'Garlic Flakes', active: true },
            { id: 3, code: 'FOOD_CHEM', name: 'Food Chemical', active: true }
        ];

        // Godowns (Warehouses)
        this.godowns = [
            { 
                id: 1, 
                code: 'KTM_WH1',
                name: 'Kathmandu Warehouse 1',
                address: 'Balaju, Kathmandu',
                contact: '+977-1-4444444',
                manager: 'Ram Sharma',
                capacity: 1000,
                active: true
            }
        ];

        // Series
        this.series = [
            { id: 1, code: 'KTM8182', branch: 'Kathmandu', prefix: 'KTM', year: '8182', active: true },
            { id: 2, code: 'PKR8182', branch: 'Pokhara', prefix: 'PKR', year: '8182', active: true }
        ];

        // Narrations
        this.narrations = [
            { id: 1, code: 'STD_DEL', text: 'Standard Delivery', active: true },
            { id: 2, code: 'EXP_DEL', text: 'Express Delivery', active: true },
            { id: 3, code: 'FRAGILE', text: 'Handle with Care - Fragile Items', active: true }
        ];

        // Agents
        this.agents = [
            { id: 1, code: 'AYUSH', name: 'Ayush Transport', contact: '+977-9841111111', active: true },
            { id: 2, code: 'SELF', name: 'Self Transport', contact: 'N/A', active: true },
            { id: 3, code: 'FULL_TRIP', name: 'Full Trip Transport', contact: '+977-9842222222', active: true },
            { id: 4, code: 'BRJ_BR', name: 'Birgunj Branch', contact: '+977-9843333333', active: true }
        ];
    }

    // Generic CRUD operations
    getList(type) {
        switch(type.toLowerCase()) {
            case 'countries': return this.countries;
            case 'units': return this.units;
            case 'descriptions': return this.descriptions;
            case 'godowns': return this.godowns;
            case 'series': return this.series;
            case 'narrations': return this.narrations;
            case 'agents': return this.agents;
            default: throw new Error('Invalid master type');
        }
    }

    add(type, item) {
        const list = this.getList(type);
        const newId = Math.max(...list.map(x => x.id), 0) + 1;
        item.id = newId;
        item.active = true;
        list.push(item);
        return item;
    }

    update(type, item) {
        const list = this.getList(type);
        const index = list.findIndex(x => x.id === item.id);
        if (index === -1) throw new Error('Item not found');
        list[index] = { ...list[index], ...item };
        return list[index];
    }

    delete(type, id) {
        const list = this.getList(type);
        const index = list.findIndex(x => x.id === id);
        if (index === -1) throw new Error('Item not found');
        list[index].active = false;
        return true;
    }

    // Search functionality
    search(type, query) {
        const list = this.getList(type);
        query = query.toLowerCase();
        return list.filter(item => 
            item.active && (
                (item.name && item.name.toLowerCase().includes(query)) ||
                (item.code && item.code.toLowerCase().includes(query))
            )
        );
    }
}

// Initialize master configuration globally
window.masterConfig = new MasterConfig();
