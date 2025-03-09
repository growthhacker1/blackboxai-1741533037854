class UserManagementSystem {
    constructor() {
        this.users = [];
        this.roles = [
            { id: 1, name: 'SUPER_ADMIN', permissions: ['*'] },
            { id: 2, name: 'MANAGER', permissions: [
                'VIEW_DASHBOARD',
                'MANAGE_BILLS',
                'MANAGE_MANIFESTS',
                'MANAGE_CHALLANS',
                'MANAGE_GOODS',
                'VIEW_REPORTS',
                'MANAGE_USERS'
            ]},
            { id: 3, name: 'STAFF', permissions: [
                'VIEW_DASHBOARD',
                'MANAGE_BILLS',
                'MANAGE_MANIFESTS',
                'MANAGE_GOODS'
            ]}
        ];
        this.settings = {
            company: {
                name: '',
                address: '',
                phone: '',
                email: '',
                pan: '',
                logo: null
            },
            vat: {
                enabled: false,
                rate: 13
            },
            backup: {
                autoBackup: true,
                frequency: 'DAILY', // DAILY, WEEKLY, MONTHLY
                lastBackup: null
            },
            printing: {
                format: 'A4',
                copies: {
                    bill: 3,
                    manifest: 2,
                    challan: 2
                },
                headers: {
                    bill: true,
                    manifest: true,
                    challan: true
                }
            },
            notifications: {
                email: false,
                sms: false,
                desktop: true
            }
        };
        this.currentUser = null;
    }

    // User Management
    createUser(data) {
        try {
            const {
                username,
                password,
                fullName,
                email,
                roleId,
                branchId,
                contact = '',
                address = ''
            } = data;

            // Validate required fields
            if (!username || !password || !fullName || !email || !roleId || !branchId) {
                throw new Error('Missing required fields for user creation');
            }

            // Check if username or email already exists
            if (this.users.some(u => u.username === username)) {
                throw new Error('Username already exists');
            }
            if (this.users.some(u => u.email === email)) {
                throw new Error('Email already exists');
            }

            const newUser = {
                id: this.generateId('user'),
                username,
                passwordHash: this.hashPassword(password),
                fullName,
                email,
                roleId,
                branchId,
                contact,
                address,
                status: 'ACTIVE',
                lastLogin: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            this.users.push(newUser);
            this.notifyUpdate('User created successfully');
            return this.sanitizeUser(newUser);
        } catch (error) {
            this.notifyError(error.message);
            throw error;
        }
    }

    // Authentication
    login(username, password) {
        try {
            const user = this.users.find(u => u.username === username);
            if (!user) {
                throw new Error('Invalid username or password');
            }

            if (user.status !== 'ACTIVE') {
                throw new Error('User account is not active');
            }

            if (!this.verifyPassword(password, user.passwordHash)) {
                throw new Error('Invalid username or password');
            }

            user.lastLogin = new Date();
            this.currentUser = this.sanitizeUser(user);
            
            window.reportsEnquiry.logAudit('USER_LOGIN', {
                userId: user.id,
                username: user.username
            });

            this.notifyUpdate('Login successful');
            return this.currentUser;
        } catch (error) {
            this.notifyError(error.message);
            throw error;
        }
    }

    logout() {
        if (this.currentUser) {
            window.reportsEnquiry.logAudit('USER_LOGOUT', {
                userId: this.currentUser.id,
                username: this.currentUser.username
            });
        }
        this.currentUser = null;
        this.notifyUpdate('Logout successful');
    }

    // Settings Management
    updateSettings(section, updates) {
        try {
            if (!this.settings[section]) {
                throw new Error('Invalid settings section');
            }

            this.settings[section] = {
                ...this.settings[section],
                ...updates
            };

            window.reportsEnquiry.logAudit('SETTINGS_UPDATED', {
                section,
                updates
            });

            this.notifyUpdate('Settings updated successfully');
            return this.settings[section];
        } catch (error) {
            this.notifyError(error.message);
            throw error;
        }
    }

    // Permission Management
    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        const role = this.roles.find(r => r.id === this.currentUser.roleId);
        if (!role) return false;

        return role.permissions.includes('*') || role.permissions.includes(permission);
    }

    // Backup Management
    async createBackup() {
        try {
            const backup = {
                timestamp: new Date(),
                data: {
                    users: this.users,
                    settings: this.settings,
                    masterData: {
                        countries: window.masterData.countries,
                        units: window.masterData.units,
                        descriptions: window.masterData.descriptions,
                        godowns: window.masterData.godowns,
                        series: window.masterData.series,
                        narrations: window.masterData.narrations,
                        agents: window.masterData.agents
                    },
                    accounting: {
                        ledgers: window.accountingSystem.ledgers,
                        groups: window.accountingSystem.groups,
                        vouchers: window.accountingSystem.vouchers,
                        transactions: window.accountingSystem.transactions
                    },
                    btd: {
                        branches: window.btdManager.branches,
                        trucks: window.btdManager.trucks,
                        drivers: window.btdManager.drivers,
                        places: window.btdManager.places
                    },
                    billing: {
                        bills: window.billingManifest.bills,
                        manifests: window.billingManifest.manifests,
                        freightChallans: window.billingManifest.freightChallans
                    },
                    goods: {
                        receipts: window.goodsManagement.receipts,
                        deliveries: window.goodsManagement.deliveries,
                        godownStock: window.goodsManagement.godownStock,
                        stockMovements: window.goodsManagement.stockMovements
                    },
                    auditLogs: window.reportsEnquiry.auditLogs
                }
            };

            // In a real application, this would save to a file or server
            const backupStr = JSON.stringify(backup);
            console.log('Backup created:', backup);

            this.settings.backup.lastBackup = backup.timestamp;
            window.reportsEnquiry.logAudit('BACKUP_CREATED', {
                timestamp: backup.timestamp
            });

            this.notifyUpdate('Backup created successfully');
            return backup;
        } catch (error) {
            this.notifyError('Failed to create backup');
            throw error;
        }
    }

    // Utility functions
    generateId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    hashPassword(password) {
        // In a real application, use a proper password hashing library
        return btoa(password);
    }

    verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    }

    sanitizeUser(user) {
        const { passwordHash, ...safeUser } = user;
        return safeUser;
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

// Initialize user management system
window.userManagement = new UserManagementSystem();
