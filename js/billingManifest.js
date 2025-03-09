class BillingManifestManager {
    constructor() {
        this.bills = [];
        this.manifests = [];
        this.freightChallans = [];
    }

    // Billing Management
    createBill(data) {
        try {
            const {
                origin,
                destination,
                consignor,
                consignee,
                description,
                unit,
                quantity,
                weight,
                rate,
                payMode, // DUE, PAID, TO_PAY
                stCharge = 0,
                discount = 0,
                vat = 0
            } = data;

            // Validate required fields
            const requiredFields = ['origin', 'destination', 'consignor', 'consignee', 'description', 'unit', 'quantity', 'weight', 'rate', 'payMode'];
            const missingFields = requiredFields.filter(field => !data[field]);
            
            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            // Calculate amounts
            const freightAmount = weight * rate;
            const totalAmount = freightAmount + stCharge - discount + vat;

            const newBill = {
                id: this.generateId('bill'),
                billNo: this.generateBillNumber(),
                ...data,
                freightAmount,
                totalAmount,
                status: 'PENDING', // PENDING, IN_TRANSIT, DELIVERED
                manifestId: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            this.bills.push(newBill);
            this.notifyUpdate('Bill created successfully');
            return newBill;
        } catch (error) {
            this.notifyError(error.message);
            throw error;
        }
    }

    // Manifest Management
    createManifest(data) {
        try {
            const {
                billIds,
                truckId,
                driverId,
                agentId,
                branchId,
                remarks = ''
            } = data;

            if (!billIds || !billIds.length) {
                throw new Error('At least one bill is required for manifest');
            }

            // Validate all bills exist and are not already in a manifest
            const selectedBills = billIds.map(id => {
                const bill = this.bills.find(b => b.id === id && !b.manifestId);
                if (!bill) {
                    throw new Error(`Invalid or already manifested bill: ${id}`);
                }
                return bill;
            });

            // Calculate manifest totals
            const totals = selectedBills.reduce((acc, bill) => ({
                packages: acc.packages + bill.quantity,
                weight: acc.weight + bill.weight,
                amount: acc.amount + bill.totalAmount
            }), { packages: 0, weight: 0, amount: 0 });

            const newManifest = {
                id: this.generateId('manifest'),
                manifestNo: this.generateManifestNumber(),
                billIds,
                truckId,
                driverId,
                agentId,
                branchId,
                ...totals,
                remarks,
                status: 'CREATED', // CREATED, DISPATCHED, COMPLETED
                freightChallanId: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Update bills with manifest ID
            selectedBills.forEach(bill => {
                bill.manifestId = newManifest.id;
                bill.status = 'IN_TRANSIT';
                bill.updatedAt = new Date();
            });

            this.manifests.push(newManifest);
            this.notifyUpdate('Manifest created successfully');
            return newManifest;
        } catch (error) {
            this.notifyError(error.message);
            throw error;
        }
    }

    // Freight Challan Management
    createFreightChallan(data) {
        try {
            const {
                manifestIds,
                expenses = [], // Array of {type, amount}
                tds = 0,
                advance = 0
            } = data;

            if (!manifestIds || !manifestIds.length) {
                throw new Error('At least one manifest is required for freight challan');
            }

            // Validate all manifests exist and are not already in a challan
            const selectedManifests = manifestIds.map(id => {
                const manifest = this.manifests.find(m => m.id === id && !m.freightChallanId);
                if (!manifest) {
                    throw new Error(`Invalid or already assigned manifest: ${id}`);
                }
                return manifest;
            });

            // Calculate totals
            const totalFreight = selectedManifests.reduce((sum, m) => sum + m.amount, 0);
            const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
            const balance = totalFreight - totalExpenses - tds - advance;

            const newChallan = {
                id: this.generateId('challan'),
                challanNo: this.generateChallanNumber(),
                manifestIds,
                expenses,
                totalFreight,
                totalExpenses,
                tds,
                advance,
                balance,
                status: 'PENDING', // PENDING, APPROVED, PAID
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Update manifests with challan ID
            selectedManifests.forEach(manifest => {
                manifest.freightChallanId = newChallan.id;
                manifest.status = 'DISPATCHED';
                manifest.updatedAt = new Date();
            });

            this.freightChallans.push(newChallan);
            this.notifyUpdate('Freight challan created successfully');
            return newChallan;
        } catch (error) {
            this.notifyError(error.message);
            throw error;
        }
    }

    // Statement Generation
    generateDueStatement(consignorId, dateRange) {
        try {
            const dueBills = this.bills.filter(bill => 
                bill.consignor === consignorId &&
                bill.payMode === 'DUE' &&
                bill.createdAt >= dateRange.start &&
                bill.createdAt <= dateRange.end
            );

            const statement = {
                consignorId,
                dateRange,
                bills: dueBills,
                totalAmount: dueBills.reduce((sum, bill) => sum + bill.totalAmount, 0),
                generatedAt: new Date()
            };

            return statement;
        } catch (error) {
            this.notifyError('Error generating statement');
            throw error;
        }
    }

    // Utility functions
    generateId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateBillNumber() {
        return `BL${new Date().getFullYear()}${(this.bills.length + 1).toString().padStart(6, '0')}`;
    }

    generateManifestNumber() {
        return `MF${new Date().getFullYear()}${(this.manifests.length + 1).toString().padStart(6, '0')}`;
    }

    generateChallanNumber() {
        return `FC${new Date().getFullYear()}${(this.freightChallans.length + 1).toString().padStart(6, '0')}`;
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

// Initialize billing and manifest manager
window.billingManifest = new BillingManifestManager();
