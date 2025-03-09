// Nepali Date Conversion Utility
class NepaliDate {
    constructor() {
        // Nepali date format mappings
        this.nepaliNumbers = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
        this.nepaliMonths = [
            'बैशाख', 'जेठ', 'असार', 'श्रावण', 'भदौ', 'असोज',
            'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फाल्गुन', 'चैत्र'
        ];
    }

    // Convert English number to Nepali
    convertToNepaliNumeral(number) {
        return number.toString().split('').map(digit => this.nepaliNumbers[digit]).join('');
    }

    // Get current Nepali date (simplified version - in real implementation would need proper calendar conversion)
    getCurrentNepaliDate() {
        const date = new Date();
        // This is a simplified conversion - in real implementation would need proper calendar calculation
        const year = 2080; // Example fixed year
        const month = 11; // Example fixed month (Falgun)
        const day = 25; // Example fixed day

        return {
            year: this.convertToNepaliNumeral(year),
            month: this.nepaliMonths[month - 1],
            day: this.convertToNepaliNumeral(day)
        };
    }

    // Format date to Nepali string
    formatNepaliDate() {
        const date = this.getCurrentNepaliDate();
        return `मिति: ${date.year} ${date.month} ${date.day}`;
    }
}

// Cargo Management System
class CargoManagement {
    constructor() {
        this.cargos = [];
    }

    // Add new cargo with validation
    addCargo(cargo) {
        try {
            // Validate required fields
            const requiredFields = ['description', 'origin', 'destination', 'weight', 'pickupDate', 'vehicleType'];
            const missingFields = requiredFields.filter(field => !cargo[field]);
            
            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            // Validate weight
            if (isNaN(cargo.weight) || cargo.weight <= 0) {
                throw new Error('Weight must be a positive number');
            }

            // Validate pickup date
            if (!cargo.pickupDate.year || !cargo.pickupDate.month || !cargo.pickupDate.day) {
                throw new Error('Invalid pickup date');
            }

            // Add cargo with generated ID and metadata
            const newCargo = {
                ...cargo,
                id: this.generateCargoId(),
                status: 'pending',
                createdDate: new Date()
            };

            this.cargos.push(newCargo);
            this.updateDashboard();
            return newCargo;
        } catch (error) {
            console.error('Error adding cargo:', error);
            throw error; // Re-throw to handle in UI layer
        }
    }

    // Generate unique cargo ID
    generateCargoId() {
        return 'CRG' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    // Update cargo status
    updateCargoStatus(cargoId, newStatus) {
        const cargo = this.cargos.find(c => c.id === cargoId);
        if (cargo) {
            cargo.status = newStatus;
            this.updateDashboard();
            return true;
        }
        return false;
    }

    // Get cargo statistics
    getStatistics() {
        return {
            total: this.cargos.length,
            inTransit: this.cargos.filter(c => c.status === 'in_transit').length,
            pending: this.cargos.filter(c => c.status === 'pending').length,
            delivered: this.cargos.filter(c => c.status === 'delivered').length
        };
    }

    // Update dashboard with latest statistics
    updateDashboard() {
        try {
            const stats = this.getStatistics();
            const elements = document.querySelectorAll('[data-stat]');
            
            if (elements.length === 0) {
                console.warn('No dashboard elements found with data-stat attribute');
                return;
            }

            elements.forEach(element => {
                const statType = element.dataset.stat;
                if (stats[statType] !== undefined) {
                    // Apply a subtle animation when updating numbers
                    element.style.transition = 'transform 0.2s ease-in-out';
                    element.style.transform = 'scale(1.1)';
                    element.textContent = stats[statType];
                    
                    setTimeout(() => {
                        element.style.transform = 'scale(1)';
                    }, 200);
                } else {
                    console.warn(`Unknown stat type: ${statType}`);
                }
            });
        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    }

    // Search cargo by ID
    searchCargo(cargoId) {
        return this.cargos.find(c => c.id === cargoId);
    }

    // Get recent shipments with proper date formatting
    getRecentShipments(limit = 5) {
        try {
            if (!Array.isArray(this.cargos)) {
                console.error('Cargos is not an array');
                return [];
            }

            return this.cargos
                .sort((a, b) => b.createdDate - a.createdDate)
                .slice(0, limit)
                .map(cargo => ({
                    ...cargo,
                    formattedDate: `${cargo.pickupDate.year}-${String(cargo.pickupDate.month).padStart(2, '0')}-${String(cargo.pickupDate.day).padStart(2, '0')}`
                }));
        } catch (error) {
            console.error('Error getting recent shipments:', error);
            return [];
        }
    }

    // Get status color classes for UI
    getStatusColorClasses(status) {
        const colorMap = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'in_transit': 'bg-green-100 text-green-800',
            'delivered': 'bg-blue-100 text-blue-800',
            'cancelled': 'bg-red-100 text-red-800'
        };
        return colorMap[status] || 'bg-gray-100 text-gray-800';
    }
}

// Vehicle Management System
class VehicleManagement {
    constructor() {
        this.vehicles = [];
    }

    // Add new vehicle
    addVehicle(vehicle) {
        vehicle.id = this.generateVehicleId();
        vehicle.status = 'available';
        this.vehicles.push(vehicle);
        return vehicle;
    }

    // Generate unique vehicle ID
    generateVehicleId() {
        return 'VEH' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    // Update vehicle status
    updateVehicleStatus(vehicleId, newStatus) {
        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        if (vehicle) {
            vehicle.status = newStatus;
            return true;
        }
        return false;
    }

    // Get available vehicles
    getAvailableVehicles() {
        return this.vehicles.filter(v => v.status === 'available');
    }
}

// Initialize systems
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Nepali Date
    const nepaliDate = new NepaliDate();
    const dateElement = document.getElementById('nepaliDate');
    if (dateElement) {
        dateElement.textContent = nepaliDate.formatNepaliDate();
    }

    // Initialize Cargo Management System
    const cargoSystem = new CargoManagement();
    window.cargoSystem = cargoSystem; // Make it globally accessible

    // Initialize Vehicle Management System
    const vehicleSystem = new VehicleManagement();
    window.vehicleSystem = vehicleSystem; // Make it globally accessible

    // Add event listeners for the new cargo button
    const newCargoBtn = document.querySelector('button');
    if (newCargoBtn) {
        newCargoBtn.addEventListener('click', () => {
            // TODO: Implement new cargo form modal
            console.log('New cargo button clicked');
        });
    }

    // Initialize monthly statistics chart
    const monthlyStatsChart = document.getElementById('monthlyStats');
    if (monthlyStatsChart) {
        // Chart initialization is already in index.html
        // Additional chart updates can be added here
    }
});
