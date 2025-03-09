class MasterConfigUI {
    constructor() {
        this.currentTab = 'countries';
        this.bindEvents();
        this.setupTableStructure();
        this.loadData();
    }

    bindEvents() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                this.switchTab(button.dataset.tab);
            });
        });

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Add new button
        document.getElementById('addNewBtn').addEventListener('click', () => {
            this.showModal();
        });

        // Form submission
        document.getElementById('configForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });
    }

    setupTableStructure() {
        this.tableStructure = {
            countries: ['Code', 'Name', 'Active', 'Actions'],
            units: ['Code', 'Name', 'Active', 'Actions'],
            descriptions: ['Code', 'Name', 'Active', 'Actions'],
            godowns: ['Code', 'Name', 'Address', 'Contact', 'Manager', 'Capacity', 'Active', 'Actions'],
            series: ['Code', 'Branch', 'Prefix', 'Year', 'Active', 'Actions'],
            narrations: ['Code', 'Text', 'Active', 'Actions'],
            agents: ['Code', 'Name', 'Contact', 'Active', 'Actions']
        };

        this.formFields = {
            countries: [
                { name: 'code', label: 'Code', type: 'text', required: true },
                { name: 'name', label: 'Name', type: 'text', required: true }
            ],
            units: [
                { name: 'code', label: 'Code', type: 'text', required: true },
                { name: 'name', label: 'Name', type: 'text', required: true }
            ],
            descriptions: [
                { name: 'code', label: 'Code', type: 'text', required: true },
                { name: 'name', label: 'Name', type: 'text', required: true }
            ],
            godowns: [
                { name: 'code', label: 'Code', type: 'text', required: true },
                { name: 'name', label: 'Name', type: 'text', required: true },
                { name: 'address', label: 'Address', type: 'text', required: true },
                { name: 'contact', label: 'Contact', type: 'tel', required: true },
                { name: 'manager', label: 'Manager', type: 'text', required: true },
                { name: 'capacity', label: 'Capacity', type: 'number', required: true }
            ],
            series: [
                { name: 'code', label: 'Code', type: 'text', required: true },
                { name: 'branch', label: 'Branch', type: 'text', required: true },
                { name: 'prefix', label: 'Prefix', type: 'text', required: true },
                { name: 'year', label: 'Year', type: 'text', required: true }
            ],
            narrations: [
                { name: 'code', label: 'Code', type: 'text', required: true },
                { name: 'text', label: 'Text', type: 'text', required: true }
            ],
            agents: [
                { name: 'code', label: 'Code', type: 'text', required: true },
                { name: 'name', label: 'Name', type: 'text', required: true },
                { name: 'contact', label: 'Contact', type: 'tel', required: true }
            ]
        };
    }

    switchTab(tab) {
        this.currentTab = tab;
        
        // Update tab UI
        document.querySelectorAll('.tab-button').forEach(button => {
            if (button.dataset.tab === tab) {
                button.classList.add('border-blue-500', 'text-blue-600');
                button.classList.remove('border-transparent', 'text-gray-500');
            } else {
                button.classList.remove('border-blue-500', 'text-blue-600');
                button.classList.add('border-transparent', 'text-gray-500');
            }
        });

        // Update table headers
        const headers = this.tableStructure[tab];
        const headerRow = document.getElementById('tableHeaders');
        headerRow.innerHTML = headers.map(header => `
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ${header}
            </th>
        `).join('');

        // Load data for the current tab
        this.loadData();
    }

    loadData() {
        const data = window.masterConfig.getList(this.currentTab);
        this.renderTable(data);
    }

    renderTable(data) {
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = data.map(item => this.renderTableRow(item)).join('');

        // Bind action buttons
        tbody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => this.showModal(btn.dataset.id));
        });
        tbody.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => this.toggleActive(btn.dataset.id));
        });
    }

    renderTableRow(item) {
        const fields = this.tableStructure[this.currentTab];
        const cells = fields.map(field => {
            if (field === 'Actions') {
                return `
                    <td class="px-6 py-4 whitespace-nowrap">
                        <button class="edit-btn text-blue-600 hover:text-blue-800 mr-2" data-id="${item.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="toggle-btn ${item.active ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'}" data-id="${item.id}">
                            <i class="fas ${item.active ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        </button>
                    </td>
                `;
            } else if (field === 'Active') {
                return `
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }">
                            ${item.active ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                `;
            } else {
                const key = field.toLowerCase();
                return `
                    <td class="px-6 py-4 whitespace-nowrap">
                        ${item[key] || ''}
                    </td>
                `;
            }
        });
        return `<tr>${cells.join('')}</tr>`;
    }

    showModal(id = null) {
        const modal = document.getElementById('configModal');
        const form = document.getElementById('configForm');
        const title = document.getElementById('modalTitle');

        // Clear previous form
        form.innerHTML = '';

        // Set title
        title.textContent = id ? 'Edit Item' : 'Add New Item';

        // Get item if editing
        const item = id ? window.masterConfig.getList(this.currentTab).find(x => x.id === parseInt(id)) : null;

        // Add form fields
        this.formFields[this.currentTab].forEach(field => {
            const value = item ? item[field.name] : '';
            form.innerHTML += `
                <div>
                    <label class="block text-sm font-medium text-gray-700">${field.label}</label>
                    <input type="${field.type}" name="${field.name}" value="${value}"
                        ${field.required ? 'required' : ''}
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                </div>
            `;
        });

        // Add buttons
        form.innerHTML += `
            <div class="flex justify-end space-x-3 mt-5">
                <button type="button" onclick="document.getElementById('configModal').classList.add('hidden')"
                    class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                    Cancel
                </button>
                <button type="submit"
                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    ${id ? 'Update' : 'Save'}
                </button>
            </div>
        `;

        // Show modal
        modal.classList.remove('hidden');
    }

    handleFormSubmit() {
        const form = document.getElementById('configForm');
        const formData = {};
        this.formFields[this.currentTab].forEach(field => {
            formData[field.name] = form.elements[field.name].value;
        });

        try {
            window.masterConfig.add(this.currentTab, formData);
            this.loadData();
            document.getElementById('configModal').classList.add('hidden');
            this.showNotification('Item saved successfully!', 'success');
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    handleSearch(query) {
        const data = window.masterConfig.search(this.currentTab, query);
        this.renderTable(data);
    }

    toggleActive(id) {
        try {
            window.masterConfig.update(this.currentTab, { 
                id: parseInt(id), 
                active: !window.masterConfig.getList(this.currentTab).find(x => x.id === parseInt(id)).active 
            });
            this.loadData();
            this.showNotification('Status updated successfully!', 'success');
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 ease-in-out ${
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

// Initialize UI when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.masterConfigUI = new MasterConfigUI();
});
