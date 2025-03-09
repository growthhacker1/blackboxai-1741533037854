class GoodsManagementSystem {
    constructor() {
        this.receipts = [];
        this.deliveries = [];
        this.godownStock = {}; // Structure: { godownId: { billId: quantity } }
        this.stockMovements = [];
    }

    // Goods Receipt Management
    createReceipt(data) {
        try {
            const {
                manifestId,
                billId,
                godownId,
                receivedQuantity,
                actualWeight,
                condition = 'GOOD', // GOOD, DAMAGED, PARTIAL
                remarks = '',
                receivedBy
            } = data;

            if (!manifestId || !billId || !godownId || !receivedQuantity || !actualWeight || !receivedBy) {
                throw new Error('Missing required fields for goods receipt');
            }

            // Get original bill details
            const bill = window.billingManifest.bills.find(b => b.id === billId);
            if (!bill) {
                throw new Error('Bill not found');
            }

            // Calculate discrepancies
            const quantityDiff = receivedQuantity - bill.quantity;
            const weightDiff = actualWeight - bill.weight;

            const newReceipt = {
                id: this.generateId('receipt'),
                receiptNo: this.generateReceiptNumber(),
                manifestId,
                billId,
                godownId,
                receivedQuantity,
                actualWeight,
                quantityDiff,
                weightDiff,
                condition,
                remarks,
                receivedBy,
                status: 'RECEIVED',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Update godown stock
            this.updateGodownStock(godownId, billId, receivedQuantity, 'ADD');

            // Create stock movement record
            this.recordStockMovement({
                type: 'RECEIPT',
                receiptId: newReceipt.id,
                godownId,
                billId,
                quantity: receivedQuantity,
                date: new Date()
            });

            this.receipts.push(newReceipt);
            this.notifyUpdate('Goods receipt created successfully');
            return newReceipt;
        } catch (error) {
            this.notifyError(error.message);
            throw error;
        }
    }

    // Goods Delivery Management
    createDelivery(data) {
        try {
            const {
                billId,
                godownId,
                deliveredQuantity,
                deliveredTo,
                idProof = '',
                contactNumber = '',
                deliveryCharges = 0,
                remarks = ''
            } = data;

            if (!billId || !godownId || !deliveredQuantity || !deliveredTo) {
                throw new Error('Missing required fields for goods delivery');
            }

            // Check stock availability
            const availableStock = this.getGodownStock(godownId, billId);
            if (availableStock < deliveredQuantity) {
                throw new Error('Insufficient stock in godown');
            }

            const newDelivery = {
                id: this.generateId('delivery'),
                deliveryNo: this.generateDeliveryNumber(),
                billId,
                godownId,
                deliveredQuantity,
                deliveredTo,
                idProof,
                contactNumber,
                deliveryCharges,
                remarks,
                status: 'DELIVERED',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Update godown stock
            this.updateGodownStock(godownId, billId, deliveredQuantity, 'REMOVE');

            // Create stock movement record
            this.recordStockMovement({
                type: 'DELIVERY',
                deliveryId: newDelivery.id,
                godownId,
                billId,
                quantity: deliveredQuantity,
                date: new Date()
            });

            // Update bill status
            const bill = window.billingManifest.bills.find(b => b.id === billId);
            if (bill) {
                bill.status = 'DELIVERED';
                bill.updatedAt = new Date();
            }

            this.deliveries.push(newDelivery);
            this.notifyUpdate('Goods delivery created successfully');
            return newDelivery;
        } catch (error) {
            this.notifyError(error.message);
            throw error;
        }
    }

    // Stock Management
    updateGodownStock(godownId, billId, quantity, operation) {
        if (!this.godownStock[godownId]) {
            this.godownStock[godownId] = {};
        }
        
        if (!this.godownStock[godownId][billId]) {
            this.godownStock[godownId][billId] = 0;
        }

        if (operation === 'ADD') {
            this.godownStock[godownId][billId] += quantity;
        } else if (operation === 'REMOVE') {
            this.godownStock[godownId][billId] -= quantity;
        }
    }

    getGodownStock(godownId, billId) {
        return this.godownStock[godownId]?.[billId] || 0;
    }

    // Stock Movement Tracking
    recordStockMovement(movement) {
        this.stockMovements.push({
            id: this.generateId('movement'),
            ...movement
        });
    }

    // Stock Transfer between Godowns
    transferStock(data) {
        try {
            const {
                fromGodownId,
                toGodownId,
                billId,
                quantity,
                remarks = ''
            } = data;

            if (!fromGodownId || !toGodownId || !billId || !quantity) {
                throw new Error('Missing required fields for stock transfer');
            }

            // Check stock availability
            const availableStock = this.getGodownStock(fromGodownId, billId);
            if (availableStock < quantity) {
                throw new Error('Insufficient stock for transfer');
            }

            // Update stock in both godowns
            this.updateGodownStock(fromGodownId, billId, quantity, 'REMOVE');
            this.updateGodownStock(toGodownId, billId, quantity, 'ADD');

            // Record stock movement
            const transfer = {
                id: this.generateId('transfer'),
                fromGodownId,
                toGodownId,
                billId,
                quantity,
                remarks,
                date: new Date()
            };

            this.recordStockMovement({
                type: 'TRANSFER',
                transferId: transfer.id,
                fromGodownId,
                toGodownId,
                billId,
                quantity,
                date: new Date()
            });

            this.notifyUpdate('Stock transferred successfully');
            return transfer;
        } catch (error) {
            this.notifyError(error.message);
            throw error;
        }
    }

    // Report Generation
    generateGodownReport(godownId) {
        const stock = this.godownStock[godownId] || {};
        const stockItems = Object.entries(stock).map(([billId, quantity]) => {
            const bill = window.billingManifest.bills.find(b => b.id === billId);
            return {
                billId,
                billNo: bill?.billNo,
                description: bill?.description,
                quantity,
                unit: bill?.unit
            };
        });

        return {
            godownId,
            totalItems: stockItems.length,
            totalQuantity: stockItems.reduce((sum, item) => sum + item.quantity, 0),
            items: stockItems,
            generatedAt: new Date()
        };
    }

    // Utility functions
    generateId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateReceiptNumber() {
        return `GR${new Date().getFullYear()}${(this.receipts.length + 1).toString().padStart(6, '0')}`;
    }

    generateDeliveryNumber() {
        return `GD${new Date().getFullYear()}${(this.deliveries.length + 1).toString().padStart(6, '0')}`;
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

// Initialize goods management system
window.goodsManagement = new GoodsManagementSystem();
