const DataManager = {
    DB_NAME: 'BillsDB',
    DB_VERSION: 1,
    STORE_NAME: 'bills',
    DEFAULT_DATA: [
        { id: 1, date: '2026-01', type: 'water', amount: 36.50, usage: 10.00 },
        { id: 2, date: '2026-01', type: 'electricity', amount: 113.70, usage: 200.00 },
        { id: 3, date: '2026-01', type: 'gas', amount: 35.00, usage: 10.00 },
        { id: 4, date: '2026-01', type: 'property', amount: 180.00 },
        { id: 5, date: '2026-01', type: 'parking', amount: 200.00 },
        { id: 6, date: '2026-02', type: 'water', amount: 40.15, usage: 11.00 },
        { id: 7, date: '2025-03', type: 'water', amount: 33.85, usage: 9.27 },
        { id: 8, date: '2024-10', type: 'gas', amount: 38.50, usage: 11.00 }
    ],

    openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = () => reject('Failed to open database');

            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
                    // 只在数据库首次创建时添加默认数据
                    for (const bill of this.DEFAULT_DATA) {
                        store.add(bill);
                    }
                }
            };
        });
    },

    async init() {
        try {
            const db = await this.openDB();
            // 不再检查数据库计数，直接返回
            return Promise.resolve();
        } catch (error) {
            console.error('Error initializing database:', error);
            throw error;
        }
    },

    async getBills() {
        try {
            const db = await this.openDB();
            const transaction = db.transaction(this.STORE_NAME, 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.getAll();

            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject('Failed to get bills');
            });
        } catch (error) {
            console.error('Error getting bills:', error);
            return [];
        }
    },

    async save(bill) {
        try {
            const db = await this.openDB();
            const transaction = db.transaction(this.STORE_NAME, 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const newBill = { ...bill, id: bill.id || Date.now() };
            const request = store.put(newBill);

            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(newBill);
                request.onerror = () => reject('Failed to save bill');
            });
        } catch (error) {
            console.error('Error saving bill:', error);
            throw error;
        }
    },

    async delete(id) {
        try {
            const db = await this.openDB();
            const transaction = db.transaction(this.STORE_NAME, 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.delete(id);

            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve();
                request.onerror = () => reject('Failed to delete bill');
            });
        } catch (error) {
            console.error('Error deleting bill:', error);
            throw error;
        }
    },

    async clearAll() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME);

            request.onerror = () => reject('Failed to open database');

            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(this.STORE_NAME, 'readwrite');
                const store = transaction.objectStore(this.STORE_NAME);
                const clearRequest = store.clear();

                clearRequest.onsuccess = () => {
                    transaction.oncomplete = () => resolve();
                    transaction.onerror = () => reject('Failed to clear all bills');
                };

                clearRequest.onerror = () => reject('Failed to clear all bills');
            };
        });
    },

    async deleteByMonth(yearMonth) {
        try {
            const db = await this.openDB();
            const bills = await this.getBills();
            const monthBills = bills.filter(bill => bill.date === yearMonth);
            
            if (monthBills.length === 0) {
                return;
            }
            
            const transaction = db.transaction(this.STORE_NAME, 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            
            for (const bill of monthBills) {
                store.delete(bill.id);
            }
            
            return new Promise((resolve, reject) => {
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject('Failed to delete bills by month');
            });
        } catch (error) {
            console.error('Error deleting bills by month:', error);
            throw error;
        }
    }
};