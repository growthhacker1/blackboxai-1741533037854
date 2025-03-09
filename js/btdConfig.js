class BTDManager {
    constructor() {
        this.branches = [];
        this.trucks = [];
        this.drivers = [];
        this.places = [];
    }

    // Branch Management
    createBranch(data) {
        try {
            const { name, code, address, phone, email } = data;
            
            if (!name || !code) {
                throw new Error('Branch name and code are required');
            }

            const newBranch = {
                id: this.generateId('branch'),
                name,
                code,
                address,
                phone,
                email,
                status: 'ACTIVE',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            this.branches.push(newBranch);
            this.notifyUpdate('Branch created successfully');
            return newBranch;
        } catch (error) {
            this.notifyError(error.message);
            throw error;
        }
    }

    // Truck Management
    createTruck(data) {
        try {
            const { 
                number, 
                model, 
                capacity,
                ownerName,
                ownerContact,
                documents = {} // Registration, insurance, etc.
            } = data;

            if (!number) {
                throw new Error('Truck number is required');
            }

            const newTruck = {
                id: this.generateId('truck'),
                number,
                model,
                capacity,
                ownerName,
                ownerContact,
                documents,
                status: 'AVAILABLE', // AVAILABLE, IN_TRANSIT, MAINTENANCE
                currentLocation: null,
                currentDriver: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            this.trucks.push(newTruck);
            
            // Create ledger for truck
            if (window.accountingSystem) {
                window.accountingSystem.createLedger({
                    name: `Truck - ${number}`,
                    groupId: 1, // Assets group
                    notes: `Ledger for truck ${number}`
                });
            }

            this.notifyUpdate('Truck created successfully');
            return newTruck;
        } catch (error) {
            this.notifyError(error.message);
            throw error;
        }
    }

    // Driver Management
    createDriver(data) {
        try {
            const { 
                name,
                licenseNumber,
                contact,
                address,
                documents = {} // License, citizenship, etc.
            } = data;

            if (!name || !licenseNumber) {
                throw new Error('Driver name and license number are required');
            }

            const newDriver = {
                id: this.generateId('driver'),
                name,
                licenseNumber,
                contact,
                address,
                documents,
                status: 'AVAILABLE', // AVAILABLE, ON_DUTY, ON_LEAVE
                currentTruck: null,
                currentLocation: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            this.drivers.push(newDriver);
            
            // Create ledger for driver
            if (window.accountingSystem) {
                window.accountingSystem.createLedger({
                    name: `Driver - ${name}`,
                    groupId: 2, // Liabilities group (for salary/advances)
                    notes: `Ledger for driver ${name}`
                });
            }

            this.notifyUpdate('Driver created successfully');
            return newDriver;
        } catch (error) {
            this.notifyError(error.message);
            throw error;
        }
    }

    // Place Management
    createPlace(data) {
        try {
            const { name, district, state, country, type } = data;
            
            if (!name || !district) {
                throw new Error('Place name and district are required');
            }

            const newPlace = {
                id: this.generateId('place'),
                name,
                district,
                state,
                country: country || 'NEPAL',
                type: type || 'CITY', // CITY, TOWN, VILLAGE
                createdAt: new Date(),
                updatedAt: new Date()
            };

            this.places.push(newPlace);
            this.notifyUpdate('Place created successfully');
            return newPlace;
        } catch (error) {
            this.notifyError(error.message);
            throw error;
        }
    }

    // Assignment Operations
    assignDriverToTruck(driverId, truckId) {
        try {
            const driver = this.drivers.find(d => d.id === driverId);
            const truck = this.trucks.find(t => t.id === truckId);

            if (!driver || !truck) {
                throw new Error('Driver or truck not found');
            }

            if (driver.status !== 'AVAILABLE') {
                throw new Error('Driver is not available');
            }

            if (truck.status !== 'AVAILABLE') {
                throw new Error('Truck is not available');
            }

            // Update driver status
            driver.status = 'ON_DUTY';
            driver.currentTruck = truckId;
            driver.updatedAt = new Date();

            // Update truck status
            truck.currentDriver = driverId;
            truck.updatedAt = new Date();

            this.notifyUpdate('Driver assigned to truck successfully');
            return { driver, truck };
        } catch (error) {
            this.notifyError(error.message);
            throw error;
        }
    }

    // Utility functions
    generateId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Notification system
    notifyUpdate(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300 ease-in-out';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    notifyError(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300 ease-in-out';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize BTD manager
window.btdManager = new BTDManager();
