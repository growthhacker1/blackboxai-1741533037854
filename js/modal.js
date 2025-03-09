class Modal {
    constructor() {
        this.createModalElement();
        this.bindEvents();
    }

    createModalElement() {
        const modalHTML = `
            <div id="cargoModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden overflow-y-auto h-full w-full">
                <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                    <div class="mt-3">
                        <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">New Cargo Entry</h3>
                        <form id="cargoForm" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Cargo Description</label>
                                <input type="text" id="cargoDescription" required
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Origin</label>
                                <input type="text" id="origin" required
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Destination</label>
                                <input type="text" id="destination" required
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Weight (kg)</label>
                                <input type="number" id="weight" required
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Pickup Date (BS)</label>
                                <div class="flex space-x-2">
                                    <select id="pickupYear" class="mt-1 block w-1/3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                    </select>
                                    <select id="pickupMonth" class="mt-1 block w-1/3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                    </select>
                                    <select id="pickupDay" class="mt-1 block w-1/3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Vehicle Type</label>
                                <select id="vehicleType" required
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                    <option value="truck">Truck</option>
                                    <option value="van">Van</option>
                                    <option value="pickup">Pickup</option>
                                </select>
                            </div>
                            <div class="flex justify-end space-x-3 mt-5">
                                <button type="button" id="cancelBtn"
                                    class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                                    Cancel
                                </button>
                                <button type="submit"
                                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                    Save Cargo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('cargoModal');
        this.form = document.getElementById('cargoForm');
        
        // Initialize Nepali date dropdowns
        this.initializeDateDropdowns();
    }

    initializeDateDropdowns() {
        const yearSelect = document.getElementById('pickupYear');
        const monthSelect = document.getElementById('pickupMonth');
        const daySelect = document.getElementById('pickupDay');

        // Add years (2070-2090)
        for (let year = 2070; year <= 2090; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (year === 2080) option.selected = true; // Current year
            yearSelect.appendChild(option);
        }

        // Add months
        const nepaliMonths = [
            'बैशाख', 'जेठ', 'असार', 'श्रावण', 'भदौ', 'असोज',
            'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फाल्गुन', 'चैत्र'
        ];
        nepaliMonths.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = index + 1;
            option.textContent = month;
            monthSelect.appendChild(option);
        });

        // Add days (1-32)
        for (let day = 1; day <= 32; day++) {
            const option = document.createElement('option');
            option.value = day;
            option.textContent = day;
            daySelect.appendChild(option);
        }
    }

    bindEvents() {
        // Show modal
        const newCargoBtn = document.querySelector('button');
        if (newCargoBtn) {
            newCargoBtn.addEventListener('click', () => this.show());
        }

        // Hide modal
        document.getElementById('cancelBtn').addEventListener('click', () => this.hide());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hide();
        });

        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    }

    show() {
        this.modal.classList.remove('hidden');
    }

    hide() {
        this.modal.classList.add('hidden');
        this.form.reset();
    }

    handleSubmit() {
        try {
            // Get form data with trimmed values
            const formData = {
                description: document.getElementById('cargoDescription').value.trim(),
                origin: document.getElementById('origin').value.trim(),
                destination: document.getElementById('destination').value.trim(),
                weight: parseFloat(document.getElementById('weight').value),
                pickupDate: {
                    year: parseInt(document.getElementById('pickupYear').value),
                    month: parseInt(document.getElementById('pickupMonth').value),
                    day: parseInt(document.getElementById('pickupDay').value)
                },
                vehicleType: document.getElementById('vehicleType').value
            };

            // Client-side validation
            if (!formData.description) throw new Error('Please enter cargo description');
            if (!formData.origin) throw new Error('Please enter origin');
            if (!formData.destination) throw new Error('Please enter destination');
            if (isNaN(formData.weight) || formData.weight <= 0) throw new Error('Please enter a valid weight');
            
            // Add cargo to the system
            if (!window.cargoSystem) {
                throw new Error('Cargo management system not initialized');
            }

            const newCargo = window.cargoSystem.addCargo(formData);
            console.log('New cargo added:', newCargo);
            
            // Update the recent shipments table
            this.updateRecentShipmentsTable();

            // Show success message
            this.showNotification('Cargo entry created successfully!', 'success');
            
            // Hide modal
            this.hide();

        } catch (error) {
            console.error('Error submitting cargo:', error);
            this.showNotification(error.message, 'error');
        }
    }

    updateRecentShipmentsTable() {
        try {
            const recentShipments = window.cargoSystem.getRecentShipments();
            const tbody = document.querySelector('table tbody');
            
            if (!tbody) {
                console.error('Table body not found');
                return;
            }

            if (recentShipments.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="px-6 py-4 text-center text-gray-500">
                            No shipments available
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = recentShipments.map(shipment => `
                <tr class="hover:bg-gray-50 transition-colors duration-200">
                    <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">#${shipment.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${this.escapeHtml(shipment.destination)}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${window.cargoSystem.getStatusColorClasses(shipment.status)}">
                            ${this.formatStatus(shipment.status)}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">${shipment.formattedDate}</td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error updating shipments table:', error);
            this.showNotification('Error updating shipments table', 'error');
        }
    }

    // Format status for display
    formatStatus(status) {
        return status.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    // Escape HTML to prevent XSS
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    showNotification(message, type = 'success') {
        // Remove any existing notifications
        const existingNotification = document.querySelector('.notification-toast');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification-toast fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 ease-in-out ${
            type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`;
        notification.textContent = message;
        
        // Add slide-in animation
        notification.style.transform = 'translateX(100%)';
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Remove notification after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}

// Initialize modal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cargoModal = new Modal();
});
