class ReportsEnquirySystem {
    constructor() {
        this.auditLogs = [];
    }

    // Financial Reports
    generateFinancialReport(data) {
        try {
            const {
                type, // LEDGER_STATEMENT, TRIAL_BALANCE, BALANCE_SHEET, PROFIT_LOSS
                fromDate,
                toDate,
                ledgerId = null,
                branchId = null
            } = data;

            let report = {
                type,
                fromDate,
                toDate,
                generatedAt: new Date()
            };

            switch (type) {
                case 'LEDGER_STATEMENT':
                    if (!ledgerId) throw new Error('Ledger ID is required');
                    report = {
                        ...report,
                        ...this.getLedgerStatement(ledgerId, fromDate, toDate)
                    };
                    break;

                case 'TRIAL_BALANCE':
                    report = {
                        ...report,
                        ...window.accountingSystem.generateTrialBalance(toDate)
                    };
                    break;

                case 'BALANCE_SHEET':
                    report = {
                        ...report,
                        ...window.accountingSystem.generateBalanceSheet(toDate)
                    };
                    break;

                case 'PROFIT_LOSS':
                    report = {
                        ...report,
                        ...this.getProfitLossStatement(fromDate, toDate)
                    };
                    break;

                default:
                    throw new Error('Invalid report type');
            }

            this.logAudit('REPORT_GENERATED', {
                reportType: type,
                parameters: { fromDate, toDate, ledgerId, branchId }
            });

            return report;
        } catch (error) {
            this.notifyError(error.message);
            throw error;
        }
    }

    // Operational Reports
    generateOperationalReport(data) {
        try {
            const {
                type, // MANIFEST_SUMMARY, CHALLAN_SUMMARY, GODOWN_STOCK, DELIVERY_STATUS
                fromDate,
                toDate,
                branchId = null,
                godownId = null
            } = data;

            let report = {
                type,
                fromDate,
                toDate,
                generatedAt: new Date()
            };

            switch (type) {
                case 'MANIFEST_SUMMARY':
                    report = {
                        ...report,
                        ...this.getManifestSummary(fromDate, toDate, branchId)
                    };
                    break;

                case 'CHALLAN_SUMMARY':
                    report = {
                        ...report,
                        ...this.getChallanSummary(fromDate, toDate, branchId)
                    };
                    break;

                case 'GODOWN_STOCK':
                    if (!godownId) throw new Error('Godown ID is required');
                    report = {
                        ...report,
                        ...window.goodsManagement.generateGodownReport(godownId)
                    };
                    break;

                case 'DELIVERY_STATUS':
                    report = {
                        ...report,
                        ...this.getDeliveryStatusReport(fromDate, toDate, branchId)
                    };
                    break;

                default:
                    throw new Error('Invalid report type');
            }

            this.logAudit('REPORT_GENERATED', {
                reportType: type,
                parameters: { fromDate, toDate, branchId, godownId }
            });

            return report;
        } catch (error) {
            this.notifyError(error.message);
            throw error;
        }
    }

    // Enquiry System
    searchByNumber(number) {
        try {
            // Search in bills
            const bill = window.billingManifest.bills.find(b => 
                b.billNo === number || b.id === number
            );
            if (bill) return { type: 'BILL', data: bill };

            // Search in manifests
            const manifest = window.billingManifest.manifests.find(m => 
                m.manifestNo === number || m.id === number
            );
            if (manifest) return { type: 'MANIFEST', data: manifest };

            // Search in challans
            const challan = window.billingManifest.freightChallans.find(c => 
                c.challanNo === number || c.id === number
            );
            if (challan) return { type: 'CHALLAN', data: challan };

            // Search in goods receipts
            const receipt = window.goodsManagement.receipts.find(r => 
                r.receiptNo === number || r.id === number
            );
            if (receipt) return { type: 'RECEIPT', data: receipt };

            // Search in goods deliveries
            const delivery = window.goodsManagement.deliveries.find(d => 
                d.deliveryNo === number || d.id === number
            );
            if (delivery) return { type: 'DELIVERY', data: delivery };

            throw new Error('No record found with the given number');
        } catch (error) {
            this.notifyError(error.message);
            throw error;
        }
    }

    // Report Helper Methods
    getLedgerStatement(ledgerId, fromDate, toDate) {
        const ledger = window.accountingSystem.ledgers.find(l => l.id === ledgerId);
        if (!ledger) throw new Error('Ledger not found');

        const transactions = window.accountingSystem.transactions
            .filter(t => 
                t.ledgerId === ledgerId &&
                t.date >= fromDate &&
                t.date <= toDate
            )
            .sort((a, b) => a.date - b.date);

        let balance = ledger.openingBalance;
        const entries = transactions.map(t => {
            balance += t.type === 'DEBIT' ? t.amount : -t.amount;
            return {
                date: t.date,
                voucherId: t.voucherId,
                type: t.type,
                amount: t.amount,
                balance,
                narration: t.narration
            };
        });

        return {
            ledgerName: ledger.name,
            openingBalance: ledger.openingBalance,
            entries,
            closingBalance: balance
        };
    }

    getProfitLossStatement(fromDate, toDate) {
        const transactions = window.accountingSystem.transactions
            .filter(t => t.date >= fromDate && t.date <= toDate);

        const income = transactions
            .filter(t => {
                const ledger = window.accountingSystem.ledgers.find(l => l.id === t.ledgerId);
                return ledger && window.accountingSystem.groups.find(g => g.id === ledger.groupId).code === 'INC';
            })
            .reduce((sum, t) => sum + (t.type === 'CREDIT' ? t.amount : -t.amount), 0);

        const expenses = transactions
            .filter(t => {
                const ledger = window.accountingSystem.ledgers.find(l => l.id === t.ledgerId);
                return ledger && window.accountingSystem.groups.find(g => g.id === ledger.groupId).code === 'EXP';
            })
            .reduce((sum, t) => sum + (t.type === 'DEBIT' ? t.amount : -t.amount), 0);

        return {
            income,
            expenses,
            netProfit: income - expenses
        };
    }

    getManifestSummary(fromDate, toDate, branchId) {
        const manifests = window.billingManifest.manifests
            .filter(m => 
                m.createdAt >= fromDate &&
                m.createdAt <= toDate &&
                (!branchId || m.branchId === branchId)
            );

        return {
            totalManifests: manifests.length,
            totalWeight: manifests.reduce((sum, m) => sum + m.weight, 0),
            totalAmount: manifests.reduce((sum, m) => sum + m.amount, 0),
            statusWise: {
                CREATED: manifests.filter(m => m.status === 'CREATED').length,
                DISPATCHED: manifests.filter(m => m.status === 'DISPATCHED').length,
                COMPLETED: manifests.filter(m => m.status === 'COMPLETED').length
            },
            manifests: manifests.map(m => ({
                manifestNo: m.manifestNo,
                bills: m.billIds.length,
                weight: m.weight,
                amount: m.amount,
                status: m.status
            }))
        };
    }

    getChallanSummary(fromDate, toDate, branchId) {
        const challans = window.billingManifest.freightChallans
            .filter(c => 
                c.createdAt >= fromDate &&
                c.createdAt <= toDate &&
                (!branchId || c.branchId === branchId)
            );

        return {
            totalChallans: challans.length,
            totalFreight: challans.reduce((sum, c) => sum + c.totalFreight, 0),
            totalExpenses: challans.reduce((sum, c) => sum + c.totalExpenses, 0),
            totalBalance: challans.reduce((sum, c) => sum + c.balance, 0),
            statusWise: {
                PENDING: challans.filter(c => c.status === 'PENDING').length,
                APPROVED: challans.filter(c => c.status === 'APPROVED').length,
                PAID: challans.filter(c => c.status === 'PAID').length
            },
            challans: challans.map(c => ({
                challanNo: c.challanNo,
                manifests: c.manifestIds.length,
                freight: c.totalFreight,
                expenses: c.totalExpenses,
                balance: c.balance,
                status: c.status
            }))
        };
    }

    getDeliveryStatusReport(fromDate, toDate, branchId) {
        const deliveries = window.goodsManagement.deliveries
            .filter(d => 
                d.createdAt >= fromDate &&
                d.createdAt <= toDate &&
                (!branchId || d.branchId === branchId)
            );

        return {
            totalDeliveries: deliveries.length,
            totalCharges: deliveries.reduce((sum, d) => sum + d.deliveryCharges, 0),
            deliveries: deliveries.map(d => {
                const bill = window.billingManifest.bills.find(b => b.id === d.billId);
                return {
                    deliveryNo: d.deliveryNo,
                    billNo: bill?.billNo,
                    deliveredTo: d.deliveredTo,
                    quantity: d.deliveredQuantity,
                    charges: d.deliveryCharges,
                    date: d.createdAt
                };
            })
        };
    }

    // Audit Logging
    logAudit(action, details) {
        const log = {
            id: this.generateId('audit'),
            action,
            details,
            timestamp: new Date(),
            userId: window.currentUser?.id || 'SYSTEM'
        };
        this.auditLogs.push(log);
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

// Initialize reports and enquiry system
window.reportsEnquiry = new ReportsEnquirySystem();
