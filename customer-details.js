// Firebase ?êÎèô ?ôÍ∏∞???§Ï†ï (Í∏∞Î≥∏: ?êÎèô ?úÏÑ±??
window.FIREBASE_SYNC = {
    enabled: true, // ?êÎèô ?ôÍ∏∞???úÏÑ±??
    databaseUrl: 'https://customer-management-db-default-rtdb.firebaseio.com', // Í∏∞Î≥∏ Firebase DB
    apiKey: 'AIzaSyBxVq2K8J9X4L5M3N7P8Q1R2S3T4U5V6W7', // Í∏∞Î≥∏ API Key
    syncInterval: 5000, // 5Ï¥àÎßà???ôÍ∏∞??Ï≤¥ÌÅ¨
    lastSyncTime: 0,
    deviceId: localStorage.getItem('deviceId') || generateDeviceId(),
    isSyncing: false,
    database: null, // Firebase ?∞Ïù¥?∞Î≤†?¥Ïä§ Ï∞∏Ï°∞
    autoSync: true, // ?êÎèô ?ôÍ∏∞???úÏÑ±??
    userPath: 'arthur_grace_customer_system' // Í≥†Ï†ï???∞Ïù¥??Í≤ΩÎ°ú (?∞Ïù¥???ÅÍµ¨ Î≥¥Ï°¥)
};

// Í∏∞Í∏∞ Í≥†Ïú† ID ?ùÏÑ±
function generateDeviceId() {
    const deviceId = 'device_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('deviceId', deviceId);
    return deviceId;
}

// Firebase?êÏÑú ?∞Ïù¥??Í∞Ä?∏Ïò§Í∏?(?àÏ†Ñ??Î≤ÑÏ†Ñ)
async function syncFromFirebase() {
    if (!window.FIREBASE_SYNC || !window.FIREBASE_SYNC.enabled || window.FIREBASE_SYNC.isSyncing) return;
    
    window.FIREBASE_SYNC.isSyncing = true;
    
    try {
        const userPath = window.FIREBASE_SYNC.userPath;
        const response = await fetch(`${window.FIREBASE_SYNC.databaseUrl}/${userPath}/customerData.json?auth=${window.FIREBASE_SYNC.apiKey}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const firebaseData = await response.json();
            
            // Firebase ?∞Ïù¥?∞Í? ?àÍ≥†, Î°úÏª¨Î≥¥Îã§ ÏµúÏã†??Í≤ΩÏö∞
            if (firebaseData && firebaseData.lastUpdated > window.FIREBASE_SYNC.lastSyncTime) {
                // ?ÑÏû¨ Í∏∞Í∏∞?êÏÑú ?òÏ†ï??Í≤ÉÏù¥ ?ÑÎãå Í≤ΩÏö∞?êÎßå ?ôÍ∏∞??
                if (firebaseData.lastModifiedBy !== window.FIREBASE_SYNC.deviceId) {
                    // Î°úÏª¨ ?∞Ïù¥???ÖÎç∞?¥Ìä∏
                    if (firebaseData.customers) customers = firebaseData.customers;
                    if (firebaseData.purchases) purchases = firebaseData.purchases;
                    if (firebaseData.gifts) gifts = firebaseData.gifts;
                    if (firebaseData.visits) visits = firebaseData.visits;
                    
                    // Firebase???Ä??(Ï§ëÎ≥µ Î∞©Ï?Î•??ÑÌï¥ ?úÍ±∞)
                    
                    // ?ÑÏû¨ ?òÏù¥ÏßÄ ?àÎ°úÍ≥†Ïπ®
                    const customerId = getCustomerIdFromUrl();
                    if (customerId) {
                        loadCustomerDetails(customerId);
                    }
                    
                    window.FIREBASE_SYNC.lastSyncTime = firebaseData.lastUpdated;
                    console.log('Firebase?êÏÑú ?∞Ïù¥???ôÍ∏∞???ÑÎ£å');
                }
            }
        } else if (response.status === 404) {
            // ?∞Ïù¥?∞Í? ?ÜÎäî Í≤ΩÏö∞ (Ï≤??¨Ïö©)
            console.log('Firebase???∞Ïù¥?∞Í? ?ÜÏäµ?àÎã§. Î°úÏª¨ ?∞Ïù¥?∞Î? ?ÖÎ°ú?úÌï©?àÎã§.');
            await syncToFirebase();
        }
    } catch (error) {
        console.error('Firebase ?ôÍ∏∞???§Î•ò:', error);
    } finally {
        if (window.FIREBASE_SYNC) {
            window.FIREBASE_SYNC.isSyncing = false;
        }
    }
}

// Firebase???∞Ïù¥???Ä?•ÌïòÍ∏?(?àÏ†Ñ??Î≤ÑÏ†Ñ)
async function syncToFirebase() {
    if (!window.FIREBASE_SYNC || !window.FIREBASE_SYNC.enabled || window.FIREBASE_SYNC.isSyncing) return;
    
    window.FIREBASE_SYNC.isSyncing = true;
    
    try {
        const syncData = {
            customers: customers || [],
            purchases: purchases || [],
            gifts: gifts || [],
            visits: visits || [],
            lastUpdated: Date.now(),
            lastModifiedBy: window.FIREBASE_SYNC.deviceId,
            version: '1.0.0'
        };
        
        const userPath = window.FIREBASE_SYNC.userPath;
        const response = await fetch(`${window.FIREBASE_SYNC.databaseUrl}/${userPath}/customerData.json?auth=${window.FIREBASE_SYNC.apiKey}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(syncData)
        });
        
        if (response.ok) {
            window.FIREBASE_SYNC.lastSyncTime = syncData.lastUpdated;
            console.log('Firebase???∞Ïù¥???Ä???ÑÎ£å');
        }
    } catch (error) {
        console.error('Firebase ?ôÍ∏∞???§Î•ò:', error);
    } finally {
        if (window.FIREBASE_SYNC) {
            window.FIREBASE_SYNC.isSyncing = false;
        }
    }
}

// Firebase ?êÎèô ?ôÍ∏∞??Ï¥àÍ∏∞??
async function initializeFirebaseSync() {
    console.log('Firebase ?êÎèô ?ôÍ∏∞???úÏä§??Ï¥àÍ∏∞??..');
    
    try {
        // Í≥†Ï†ï???∞Ïù¥??Í≤ΩÎ°ú ?¨Ïö© (?∞Ïù¥???ÅÍµ¨ Î≥¥Ï°¥)
        const userPath = window.FIREBASE_SYNC.userPath;
        
        console.log('Firebase ?êÎèô ?ôÍ∏∞???úÏûë - ?∞Ïù¥??Í≤ΩÎ°ú:', userPath);
        
        // Firebase ?ôÍ∏∞???úÏûë
        setTimeout(() => {
            try {
                syncFromFirebase();
                startUpdateChecker();
            } catch (error) {
                console.error('Firebase ?ôÍ∏∞???úÏûë ?§Î•ò:', error);
                startUpdateChecker();
            }
        }, 1000);
        
        console.log('Firebase ?∞Í≤∞ ?ÑÎ£å - ?∞Ïù¥???ÅÍµ¨ Î≥¥Ï°¥ Î™®Îìú');
        
    } catch (error) {
        console.error('?ôÍ∏∞???§Ï†ï Î°úÎìú ?§Î•ò:', error);
        startUpdateChecker();
    }
}



// ?ïÍ∏∞?ÅÏúºÎ°?Firebase ?ÖÎç∞?¥Ìä∏ ?ïÏù∏
function startUpdateChecker() {
    if (window.FIREBASE_SYNC && window.FIREBASE_SYNC.enabled) {
        setInterval(() => {
            if (!window.FIREBASE_SYNC.isSyncing) {
                syncFromFirebase();
            }
        }, window.FIREBASE_SYNC.syncInterval);
        console.log(`Firebase ?ÖÎç∞?¥Ìä∏ ?ïÏù∏ ?úÏûë (${window.FIREBASE_SYNC.syncInterval}ms Í∞ÑÍ≤©)`);
    }
}

// Î°úÏª¨ ?§ÌÜ†Î¶¨Ï??êÏÑú ?∞Ïù¥??Î°úÎìú
let customers = [];
let purchases = [];
let gifts = [];
let visits = [];

// Firebase?êÏÑú ?∞Ïù¥??Î°úÎìú (Î°úÏª¨ ?§ÌÜ†Î¶¨Ï? ?úÍ±∞)
async function loadDataFromFirebase() {
    console.log('Firebase?êÏÑú ?∞Ïù¥??Î°úÎìú Ï§?..');
    
    if (!window.FIREBASE_SYNC || !window.FIREBASE_SYNC.enabled) {
        console.log('Firebase ?∞Í≤∞ ?àÎê® - Îπ??∞Ïù¥?∞Î°ú Ï¥àÍ∏∞??);
        customers = [];
        purchases = [];
        gifts = [];
        visits = [];
        return;
    }
    
    try {
        const userPath = window.FIREBASE_SYNC.userPath;
        const response = await fetch(`${window.FIREBASE_SYNC.databaseUrl}/${userPath}/customerData.json?auth=${window.FIREBASE_SYNC.apiKey}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const firebaseData = await response.json();
            
            if (firebaseData) {
                customers = firebaseData.customers || [];
                purchases = firebaseData.purchases || [];
                gifts = firebaseData.gifts || [];
                visits = firebaseData.visits || [];
                
                window.FIREBASE_SYNC.lastSyncTime = firebaseData.lastUpdated || Date.now();
                console.log('Firebase?êÏÑú ?∞Ïù¥??Î°úÎìú ?ÑÎ£å');
            } else {
                // ?∞Ïù¥?∞Í? ?ÜÏúºÎ©?Îπ?Î∞∞Ïó¥Î°?Ï¥àÍ∏∞??
                customers = [];
                purchases = [];
                gifts = [];
                visits = [];
                console.log('Firebase???∞Ïù¥???ÜÏùå - Îπ??∞Ïù¥?∞Î°ú Ï¥àÍ∏∞??);
            }
        } else if (response.status === 404) {
            // Ï≤??¨Ïö©??- Îπ??∞Ïù¥?∞Î°ú ?úÏûë
            customers = [];
            purchases = [];
            gifts = [];
            visits = [];
            console.log('???¨Ïö©??- Îπ??∞Ïù¥?∞Î°ú Ï¥àÍ∏∞??);
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('Firebase ?∞Ïù¥??Î°úÎìú ?§Î•ò:', error);
        // ?§Î•ò ??Îπ??∞Ïù¥?∞Î°ú Ï¥àÍ∏∞??
        customers = [];
        purchases = [];
        gifts = [];
        visits = [];
    }
}

// Firebase???∞Ïù¥???Ä??(Î°úÏª¨ ?§ÌÜ†Î¶¨Ï? ?úÍ±∞)
async function saveDataToFirebase() {
    console.log('Firebase???∞Ïù¥???Ä??Ï§?..');
    
    if (!window.FIREBASE_SYNC || !window.FIREBASE_SYNC.enabled) {
        console.log('Firebase ?∞Í≤∞ ?àÎê® - ?Ä???§Ìå®');
        return false;
    }
    
    try {
        const syncData = {
            customers: customers || [],
            purchases: purchases || [],
            gifts: gifts || [],
            visits: visits || [],
            lastUpdated: Date.now(),
            lastModifiedBy: window.FIREBASE_SYNC.deviceId,
            version: '1.0.0'
        };
        
        const userPath = window.FIREBASE_SYNC.userPath;
        const response = await fetch(`${window.FIREBASE_SYNC.databaseUrl}/${userPath}/customerData.json?auth=${window.FIREBASE_SYNC.apiKey}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(syncData)
        });
        
        if (response.ok) {
            window.FIREBASE_SYNC.lastSyncTime = syncData.lastUpdated;
            console.log('Firebase???∞Ïù¥???Ä???ÑÎ£å');
            return true;
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('Firebase ?∞Ïù¥???Ä???§Î•ò:', error);
        return false;
    }
}

// URL ?åÎùºÎØ∏ÌÑ∞?êÏÑú Í≥†Í∞ù ID Í∞Ä?∏Ïò§Í∏?
function getCustomerIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return parseInt(urlParams.get('id'));
}

// DOM??Î°úÎìú?????§Ìñâ
document.addEventListener('DOMContentLoaded', async () => {
    // Firebase ?êÎèô ?ôÍ∏∞???úÏûë
    await initializeFirebaseSync();
    
    // Firebase?êÏÑú ?∞Ïù¥??Î°úÎìú
    await loadDataFromFirebase();
    
    // URL?êÏÑú Í≥†Í∞ù ID Í∞Ä?∏Ïò§Í∏?
    const customerId = getCustomerIdFromUrl();
    
    // Í≥†Í∞ù IDÍ∞Ä ?ÜÏúºÎ©?Î©îÏù∏ ?òÏù¥ÏßÄÎ°??¥Îèô
    if (!customerId) {
        window.location.href = 'index.html';
        return;
    }
    
    // Í≥†Í∞ù ?ïÎ≥¥ Î°úÎìú
    loadCustomerDetails(customerId);
    
    // ?åÏïÑÍ∞ÄÍ∏?Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('back-btn').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    // Ï∞??´Í∏∞ Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('close-btn').addEventListener('click', () => {
        window.close();
    });
    
    // ???¥Î≤§??Î¶¨Ïä§??
    document.querySelectorAll('#customerTabs .nav-link').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (tab.getAttribute('href') === '#purchase-tab') {
                loadCustomerPurchases(customerId);
            } else if (tab.getAttribute('href') === '#gift-tab') {
                loadCustomerGifts(customerId);
            } else if (tab.getAttribute('href') === '#visit-tab') {
                loadCustomerVisits(customerId);
            }
        });
    });
    
    // ?∏Ïßë Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('edit-customer-btn').addEventListener('click', () => {
        editCustomerInfo(customerId);
    });
    
    // ??†ú Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('delete-customer-btn').addEventListener('click', () => {
        deleteCustomer(customerId);
    });
    
    // Î™®Î∞î??Í∏∞Í∏∞?êÏÑú ?òÎã® ?®Îî© Ï∂îÍ?
    document.body.classList.add('has-mobile-buttons');
    
    // Î™®Îì† Í≥†Í∞ù???±Í∏â???àÎ°ú??Í∏∞Ï??ºÎ°ú ?ÖÎç∞?¥Ìä∏
    updateAllCustomerRanks();
    
    // Î™®Î∞î??Íµ¨Îß§ Ï∂îÍ? Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('mobile-add-purchase-btn').addEventListener('click', () => {
        document.getElementById('add-purchase-btn').click();
    });
    
    // Î™®Î∞î???†Î¨º Ï∂îÍ? Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('mobile-add-gift-btn').addEventListener('click', () => {
        document.getElementById('add-customer-gift-btn').click();
    });
    
    // Î™®Î∞î??Î∞©Î¨∏ Ï∂îÍ? Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('mobile-add-visit-btn').addEventListener('click', () => {
        document.getElementById('add-customer-visit-btn').click();
    });
    
    // Íµ¨Îß§ Í∏∞Î°ù Ï∂îÍ? Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('add-purchase-btn').addEventListener('click', () => {
        document.getElementById('purchase-customer-id').value = customerId;
        document.getElementById('purchase-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('add-purchase-form').reset();
        
        // Í∏∞Î≥∏ ?ÑÏù¥???ÖÎ†• ?ÑÎìú Ï¥àÍ∏∞??
        const purchaseItems = document.getElementById('purchase-items');
        purchaseItems.innerHTML = `
            <div class="purchase-item mb-3">
                <div class="row g-2">
                    <div class="col-12 col-md-7">
                        <label class="form-label">?ÅÌíàÎ™?*</label>
                        <input type="text" class="form-control item-name" required placeholder="Íµ¨Îß§?òÏã† ?ÅÌíàÎ™ÖÏùÑ ?ÖÎ†•?òÏÑ∏??>
                    </div>
                    <div class="col-12 col-md-5">
                        <label class="form-label">Í∞ÄÍ≤?*</label>
                        <input type="number" class="form-control item-price" required placeholder="0">
                    </div>
                </div>
            </div>
        `;
        
        const purchaseModal = new bootstrap.Modal(document.getElementById('add-purchase-modal'));
        purchaseModal.show();
    });
    
    // ?ÅÌíà Ï∂îÍ? Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('add-item-btn').addEventListener('click', () => {
        const purchaseItems = document.getElementById('purchase-items');
        const newItem = document.createElement('div');
        newItem.className = 'purchase-item mb-3';
        newItem.innerHTML = `
            <div class="row g-2">
                <div class="col-12 col-md-7">
                    <label class="form-label">?ÅÌíàÎ™?*</label>
                    <input type="text" class="form-control item-name" required placeholder="Íµ¨Îß§?òÏã† ?ÅÌíàÎ™ÖÏùÑ ?ÖÎ†•?òÏÑ∏??>
                </div>
                <div class="col-12 col-md-5">
                    <label class="form-label">Í∞ÄÍ≤?*</label>
                    <input type="number" class="form-control item-price" required placeholder="0">
                </div>
            </div>
            <div class="d-grid mt-2">
                <button type="button" class="btn btn-sm btn-outline-danger remove-item-btn">
                    <i class="bi bi-trash"></i> ???ÅÌíà ??†ú
                </button>
            </div>
        `;
        purchaseItems.appendChild(newItem);
        
        // ??†ú Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
        newItem.querySelector('.remove-item-btn').addEventListener('click', function() {
            this.closest('.purchase-item').remove();
        });
    });
    
    // Íµ¨Îß§ Í∏∞Î°ù Ï∂îÍ? ???úÏ∂ú ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('add-purchase-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const customerId = parseInt(document.getElementById('purchase-customer-id').value);
        const date = document.getElementById('purchase-date').value;
        const paymentMethod = document.getElementById('payment-method').value;
        const staff = document.getElementById('purchase-staff').value;
        const store = document.getElementById('purchase-store').value;
        const orderNumber = document.getElementById('purchase-order-number').value;
        const memo = document.getElementById('purchase-memo').value;
        
        // ?ÅÌíà ?ÑÏù¥??Í∞Ä?∏Ïò§Í∏?
        const items = [];
        let totalAmount = 0;
        
        document.querySelectorAll('.purchase-item').forEach(item => {
            const name = item.querySelector('.item-name').value;
            const price = parseInt(item.querySelector('.item-price').value);
            
            if (name && price) {
                items.push({ name, price });
                totalAmount += price;
            }
        });
        
        if (items.length === 0) {
            alert('?ÅÌíà??ÏµúÏÜå 1Í∞??¥ÏÉÅ ?ÖÎ†•?¥Ï£º?∏Ïöî.');
            return;
        }
        
        // ??Íµ¨Îß§ Í∏∞Î°ù ?ùÏÑ±
        const newPurchase = {
            id: purchases.length > 0 ? Math.max(...purchases.map(p => p.id)) + 1 : 1,
            customerId,
            date,
            items,
            totalAmount,
            orderNumber,
            store,
            staff,
            memo,
            paymentMethod
        };
        
        // Íµ¨Îß§ Í∏∞Î°ù Ï∂îÍ?
        purchases.push(newPurchase);
        
        // Í≥†Í∞ù ?ïÎ≥¥ ?ÖÎç∞?¥Ìä∏ (Ï¥?Íµ¨Îß§?? Íµ¨Îß§ ?üÏàò)
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            customer.totalPurchase += totalAmount;
            customer.purchaseCount += 1;
            
            // Í≥†Í∞ù ?±Í∏â ?êÎèô ?ÖÎç∞?¥Ìä∏
            updateCustomerRank(customer);
        }
        
        // ?∞Ïù¥???Ä??
        saveDataToFirebase();
        
        // Î™®Îã¨ ?´Í∏∞
        const modal = bootstrap.Modal.getInstance(document.getElementById('add-purchase-modal'));
        modal.hide();
        
        // Íµ¨Îß§ ?¥Î†• ?§Ïãú Î°úÎìú
        loadCustomerPurchases(customerId);
        
        // ?åÎ¶º ?úÏãú
        alert('Íµ¨Îß§ Í∏∞Î°ù??Ï∂îÍ??òÏóà?µÎãà??');
    });
    
    // ?†Î¨º Í∏∞Î°ù Ï∂îÍ? Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('add-customer-gift-btn').addEventListener('click', () => {
        document.getElementById('gift-customer-id').value = customerId;
        document.getElementById('gift-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('add-gift-form').reset();
        
        const giftModal = new bootstrap.Modal(document.getElementById('add-gift-modal'));
        giftModal.show();
    });
    
    // ?†Î¨º Í∏∞Î°ù Ï∂îÍ? ???úÏ∂ú ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('add-gift-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const customerId = parseInt(document.getElementById('gift-customer-id').value);
        const type = document.getElementById('gift-type').value;
        const description = document.getElementById('gift-description').value;
        const date = document.getElementById('gift-date').value;
        const reason = document.getElementById('gift-reason').value;
        
        // ???†Î¨º Í∏∞Î°ù ?ùÏÑ±
        const newGift = {
            id: gifts.length > 0 ? Math.max(...gifts.map(g => g.id)) + 1 : 1,
            customerId,
            type,
            description,
            date,
            reason
        };
        
        // ?†Î¨º Í∏∞Î°ù Ï∂îÍ?
        gifts.push(newGift);
        
        // ?∞Ïù¥???Ä??
        saveDataToFirebase();
        
        // Î™®Îã¨ ?´Í∏∞
        const modal = bootstrap.Modal.getInstance(document.getElementById('add-gift-modal'));
        modal.hide();
        
        // ?†Î¨º ?¥Î†• ?§Ïãú Î°úÎìú
        loadCustomerGifts(customerId);
        
        // ?åÎ¶º ?úÏãú
        alert('?†Î¨º Í∏∞Î°ù??Ï∂îÍ??òÏóà?µÎãà??');
    });
    
    // Î∞©Î¨∏ Í∏∞Î°ù Ï∂îÍ? Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('add-customer-visit-btn').addEventListener('click', () => {
        document.getElementById('visit-customer-id').value = customerId;
        document.getElementById('visit-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('add-visit-form').reset();
        
        const visitModal = new bootstrap.Modal(document.getElementById('add-visit-modal'));
        visitModal.show();
    });
    
    // Î∞©Î¨∏ Í∏∞Î°ù Ï∂îÍ? ???úÏ∂ú ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('add-visit-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const customerId = parseInt(document.getElementById('visit-customer-id').value);
        const date = document.getElementById('visit-date').value;
        const purpose = document.getElementById('visit-purpose').value;
        const note = document.getElementById('visit-note').value;
        
        // ??Î∞©Î¨∏ Í∏∞Î°ù ?ùÏÑ±
        const newVisit = {
            id: visits.length > 0 ? Math.max(...visits.map(v => v.id)) + 1 : 1,
            customerId,
            date,
            purpose,
            note
        };
        
        // Î∞©Î¨∏ Í∏∞Î°ù Ï∂îÍ?
        visits.push(newVisit);
        
        // Í≥†Í∞ù ?ïÎ≥¥ ?ÖÎç∞?¥Ìä∏ (ÏµúÍ∑º Î∞©Î¨∏??
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            const visitDate = new Date(date);
            const lastVisitDate = new Date(customer.lastVisit);
            
            if (visitDate > lastVisitDate) {
                customer.lastVisit = date;
            }
        }
        
        // ?∞Ïù¥???Ä??
        saveDataToFirebase();
        
        // Î™®Îã¨ ?´Í∏∞
        const modal = bootstrap.Modal.getInstance(document.getElementById('add-visit-modal'));
        modal.hide();
        
        // Î∞©Î¨∏ ?¥Î†• ?§Ïãú Î°úÎìú
        loadCustomerVisits(customerId);
        
        // ?åÎ¶º ?úÏãú
        alert('Î∞©Î¨∏ Í∏∞Î°ù??Ï∂îÍ??òÏóà?µÎãà??');
    });
    
    // Íµ¨Îß§ PDF ?§Ïö¥Î°úÎìú Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('download-purchase-pdf').addEventListener('click', () => {
        generatePurchasePDF(customerId);
    });
});

// Í≥†Í∞ù ?ïÎ≥¥ Î°úÎìú ?®Ïàò
function loadCustomerDetails(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
        alert('Í≥†Í∞ù ?ïÎ≥¥Î•?Ï∞æÏùÑ ???ÜÏäµ?àÎã§.');
        window.location.href = 'index.html';
        return;
    }
    
    // ?òÏù¥ÏßÄ ?úÎ™© ?ÖÎç∞?¥Ìä∏
    document.title = `${customer.name} - Í≥†Í∞ù ?ÅÏÑ∏ ?ïÎ≥¥`;
    
    // Í∏∞Î≥∏ ?ïÎ≥¥ ???¥Ïö© ?§Ï†ï
    const infoContent = document.getElementById('customer-info-content');
    
    // ?úÍ? ?±Í∏â Î≥Ä??
    let rankText = '';
    if (customer.rank === 'vvip') rankText = 'VVIP';
    else if (customer.rank === 'vip') rankText = 'VIP';
    else rankText = '?ºÎ∞ò';
    
    // ?±Î≥Ñ ?úÍ? Î≥Ä??
    let genderText = '-';
    if (customer.gender === 'male') genderText = '?®ÏÑ±';
    else if (customer.gender === 'female') genderText = '?¨ÏÑ±';
    
    infoContent.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <p><strong>?¥Î¶Ñ:</strong> ${customer.name}</p>
                <p><strong>?±Î≥Ñ:</strong> ${genderText}</p>
                <p><strong>?ÑÌôîÎ≤àÌò∏:</strong> ${customer.phone}</p>
                <p><strong>?ùÎÖÑ?îÏùº:</strong> ${formatDate(customer.birthdate)}</p>
                <p><strong>Ï£ºÏÜå:</strong> ${customer.address || '-'}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Ï£ºÎ∞©Î¨∏Îß§??</strong> ${customer.preferredStore || '-'}</p>
                <p><strong>?¥Î©î??</strong> ${customer.email || '-'}</p>
                <p><strong>?±Í∏â:</strong> ${rankText}</p>
                <p><strong>Ï¥?Íµ¨Îß§??</strong> ${formatCurrency(customer.totalPurchase)}</p>
                <p><strong>Íµ¨Îß§ ?üÏàò:</strong> ${customer.purchaseCount}??/p>
                <p><strong>ÏµúÍ∑º Î∞©Î¨∏??</strong> ${formatDate(customer.lastVisit)}</p>
            </div>
        </div>
        <div class="row">
            <div class="col-12">
                <p><strong>Î©îÎ™®:</strong></p>
                <p>${customer.notes || 'Î©îÎ™® ?ÜÏùå'}</p>
            </div>
        </div>
    `;
    
    // Íµ¨Îß§ ?¥Î†•, ?†Î¨º ?¥Î†•, Î∞©Î¨∏ ?¥Î†• ÎØ∏Î¶¨ Î°úÎìú
    loadCustomerPurchases(customerId);
    loadCustomerGifts(customerId);
    loadCustomerVisits(customerId);
}

// Í≥†Í∞ùÎ≥?Íµ¨Îß§ ?¥Î†• Î°úÎìú ?®Ïàò
function loadCustomerPurchases(customerId) {
    const customerPurchases = purchases.filter(p => p.customerId === customerId);
    const purchaseContent = document.getElementById('purchase-history-content');
    
    if (customerPurchases.length === 0) {
        purchaseContent.innerHTML = '<p class="text-center">Íµ¨Îß§ ?¥Î†•???ÜÏäµ?àÎã§.</p>';
        return;
    }
    
    let html = '<div class="table-responsive"><table class="table table-striped">';
    html += '<thead><tr><th>Íµ¨Îß§??/th><th>Íµ¨Îß§?úÌíà</th><th>Í≤∞Ï†úÍ∏àÏï°</th><th>Ï£ºÎ¨∏?•Î≤à??/th><th>Íµ¨Îß§Îß§Ïû•</th><th>?¥Îãπ?Ä??/th><th>Î©îÎ™®</th><th>Í≤∞Ï†úÎ∞©Î≤ï</th><th>Í¥ÄÎ¶?/th></tr></thead><tbody>';
    
    customerPurchases.forEach(purchase => {
        html += `<tr>
            <td>${formatDate(purchase.date)}</td>
            <td>
                <ul class="list-unstyled">
                    ${purchase.items.map(item => `<li>${item.name} (${formatCurrency(item.price)})</li>`).join('')}
                </ul>
            </td>
            <td>${formatCurrency(purchase.totalAmount)}</td>
            <td>${purchase.orderNumber || '-'}</td>
            <td>${purchase.store || '-'}</td>
            <td>${purchase.staff || '-'}</td>
            <td>${purchase.memo || '-'}</td>
            <td>${purchase.paymentMethod}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary edit-purchase" data-purchase-id="${purchase.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger delete-purchase" data-purchase-id="${purchase.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    });
    
    html += '</tbody></table></div>';
    purchaseContent.innerHTML = html;
    
    // Íµ¨Îß§ ?¥Î†• ?òÏ†ï Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.querySelectorAll('.edit-purchase').forEach(button => {
        button.addEventListener('click', () => {
            const purchaseId = parseInt(button.getAttribute('data-purchase-id'));
            editPurchaseRecord(purchaseId, customerId);
        });
    });
    
    // Íµ¨Îß§ ?¥Î†• ??†ú Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.querySelectorAll('.delete-purchase').forEach(button => {
        button.addEventListener('click', () => {
            const purchaseId = parseInt(button.getAttribute('data-purchase-id'));
            deletePurchaseRecord(purchaseId, customerId);
        });
    });
}

// Í≥†Í∞ùÎ≥??†Î¨º ?¥Î†• Î°úÎìú ?®Ïàò
function loadCustomerGifts(customerId) {
    const customerGifts = gifts.filter(g => g.customerId === customerId);
    const giftContent = document.getElementById('gift-history-content');
    
    if (customerGifts.length === 0) {
        giftContent.innerHTML = '<p class="text-center">?†Î¨º ?¥Î†•???ÜÏäµ?àÎã§.</p>';
        return;
    }
    
    let html = '<div class="table-responsive"><table class="table table-striped">';
    html += '<thead><tr><th>?†Ïßú</th><th>?†Î¨º Ï¢ÖÎ•ò</th><th>?†Î¨º ?¥Ïö©</th><th>?úÍ≥µ ?¥Ïú†</th><th>Í¥ÄÎ¶?/th></tr></thead><tbody>';
    
    customerGifts.forEach(gift => {
        html += `<tr>
            <td>${formatDate(gift.date)}</td>
            <td>${gift.type}</td>
            <td>${gift.description}</td>
            <td>${gift.reason}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary edit-gift" data-gift-id="${gift.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger delete-gift" data-gift-id="${gift.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    });
    
    html += '</tbody></table></div>';
    giftContent.innerHTML = html;
    
    // ?†Î¨º ?¥Î†• ?òÏ†ï Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.querySelectorAll('.edit-gift').forEach(button => {
        button.addEventListener('click', () => {
            const giftId = parseInt(button.getAttribute('data-gift-id'));
            editGiftRecord(giftId, customerId);
        });
    });
    
    // ?†Î¨º ?¥Î†• ??†ú Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.querySelectorAll('.delete-gift').forEach(button => {
        button.addEventListener('click', () => {
            const giftId = parseInt(button.getAttribute('data-gift-id'));
            deleteGiftRecord(giftId, customerId);
        });
    });
}

// Í≥†Í∞ùÎ≥?Î∞©Î¨∏ ?¥Î†• Î°úÎìú ?®Ïàò
function loadCustomerVisits(customerId) {
    const customerVisits = visits.filter(v => v.customerId === customerId);
    const visitContent = document.getElementById('visit-history-content');
    
    if (customerVisits.length === 0) {
        visitContent.innerHTML = '<p class="text-center">Î∞©Î¨∏ ?¥Î†•???ÜÏäµ?àÎã§.</p>';
        return;
    }
    
    // Î∞©Î¨∏ ?†Ïßú Í∏∞Ï??ºÎ°ú ?ïÎ†¨ (ÏµúÏã†??
    const sortedVisits = [...customerVisits].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    let html = '<div class="table-responsive"><table class="table table-striped">';
    html += '<thead><tr><th>?†Ïßú</th><th>Î∞©Î¨∏ Î™©Ï†Å</th><th>Î©îÎ™®</th><th>Í¥ÄÎ¶?/th></tr></thead><tbody>';
    
    sortedVisits.forEach(visit => {
        html += `<tr>
            <td>${formatDate(visit.date)}</td>
            <td>${visit.purpose}</td>
            <td>${visit.note || '-'}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary edit-visit" data-visit-id="${visit.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger delete-visit" data-visit-id="${visit.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    });
    
    html += '</tbody></table></div>';
    visitContent.innerHTML = html;
    
    // Î∞©Î¨∏ ?¥Î†• ?òÏ†ï Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.querySelectorAll('.edit-visit').forEach(button => {
        button.addEventListener('click', () => {
            const visitId = parseInt(button.getAttribute('data-visit-id'));
            editVisitRecord(visitId, customerId);
        });
    });
    
    // Î∞©Î¨∏ ?¥Î†• ??†ú Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.querySelectorAll('.delete-visit').forEach(button => {
        button.addEventListener('click', () => {
            const visitId = parseInt(button.getAttribute('data-visit-id'));
            deleteVisitRecord(visitId, customerId);
        });
    });
}

// Í≥†Í∞ù ?ïÎ≥¥ ?∏Ïßë ?®Ïàò
function editCustomerInfo(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    // ?∏Ïßë ???ùÏÑ±
    const editForm = `
    <div class="modal fade" id="edit-customer-modal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Í≥†Í∞ù ?ïÎ≥¥ ?òÏ†ï</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="edit-customer-form">
                        <input type="hidden" id="edit-customer-id" value="${customer.id}">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="edit-name" class="form-label">?¥Î¶Ñ</label>
                                    <input type="text" class="form-control" id="edit-name" value="${customer.name}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-gender" class="form-label">?±Î≥Ñ</label>
                                    <select class="form-control" id="edit-gender">
                                        <option value="" ${!customer.gender ? 'selected' : ''}>?†ÌÉù ?àÌï®</option>
                                        <option value="male" ${customer.gender === 'male' ? 'selected' : ''}>?®ÏÑ±</option>
                                        <option value="female" ${customer.gender === 'female' ? 'selected' : ''}>?¨ÏÑ±</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-phone" class="form-label">?ÑÌôîÎ≤àÌò∏</label>
                                    <input type="tel" class="form-control" id="edit-phone" value="${customer.phone}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-birthdate" class="form-label">?ùÎÖÑ?îÏùº</label>
                                    <input type="date" class="form-control" id="edit-birthdate" value="${customer.birthdate}">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="edit-address" class="form-label">Ï£ºÏÜå</label>
                                    <input type="text" class="form-control" id="edit-address" value="${customer.address || ''}">
                                </div>
                                <div class="mb-3">
                                    <label for="edit-preferred-store" class="form-label">Ï£ºÎ∞©Î¨∏Îß§??/label>
                                    <input type="text" class="form-control" id="edit-preferred-store" value="${customer.preferredStore || ''}">
                                </div>
                                <div class="mb-3">
                                    <label for="edit-email" class="form-label">?¥Î©î??/label>
                                    <input type="email" class="form-control" id="edit-email" value="${customer.email || ''}">
                                </div>
                                <div class="mb-3">
                                    <label for="edit-rank" class="form-label">?±Í∏â</label>
                                    <select class="form-control" id="edit-rank">
                                        <option value="vvip" ${customer.rank === 'vvip' ? 'selected' : ''}>VVIP</option>
                                        <option value="vip" ${customer.rank === 'vip' ? 'selected' : ''}>VIP</option>
                                        <option value="regular" ${customer.rank === 'regular' ? 'selected' : ''}>?ºÎ∞ò</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="edit-notes" class="form-label">Î©îÎ™®</label>
                            <textarea class="form-control" id="edit-notes" rows="3">${customer.notes || ''}</textarea>
                        </div>
                        <div class="text-end">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Ï∑®ÏÜå</button>
                            <button type="submit" class="btn btn-primary">?Ä??/button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // ?∏Ïßë Î™®Îã¨???¥Î? ?àÏúºÎ©??úÍ±∞
    const existingModal = document.getElementById('edit-customer-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // ?∏Ïßë Î™®Îã¨ Ï∂îÍ? Î∞??úÏãú
    document.body.insertAdjacentHTML('beforeend', editForm);
    const editModal = new bootstrap.Modal(document.getElementById('edit-customer-modal'));
    editModal.show();
    
    // ?∏Ïßë ???úÏ∂ú ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('edit-customer-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        // ?òÏ†ï???∞Ïù¥??Í∞Ä?∏Ïò§Í∏?
        const editedCustomer = {
            id: parseInt(document.getElementById('edit-customer-id').value),
            name: document.getElementById('edit-name').value,
            gender: document.getElementById('edit-gender').value,
            phone: document.getElementById('edit-phone').value,
            birthdate: document.getElementById('edit-birthdate').value,
            address: document.getElementById('edit-address').value || '',
            preferredStore: document.getElementById('edit-preferred-store').value || '',
            email: document.getElementById('edit-email').value || '',
            rank: document.getElementById('edit-rank').value,
            notes: document.getElementById('edit-notes').value || '',
            totalPurchase: customer.totalPurchase,
            purchaseCount: customer.purchaseCount,
            lastVisit: customer.lastVisit
        };
        
        // Í≥†Í∞ù ?∞Ïù¥???ÖÎç∞?¥Ìä∏
        const index = customers.findIndex(c => c.id === editedCustomer.id);
        if (index !== -1) {
            customers[index] = editedCustomer;
            
            // ?∞Ïù¥???Ä??
            saveDataToFirebase();
        }
        
        // Î™®Îã¨ ?´Í∏∞
        editModal.hide();
        
        // Í≥†Í∞ù ?ïÎ≥¥ ?§Ïãú Î°úÎìú
        loadCustomerDetails(editedCustomer.id);
        
        // ?åÎ¶º ?úÏãú
        alert('Í≥†Í∞ù ?ïÎ≥¥Í∞Ä ?òÏ†ï?òÏóà?µÎãà??');
    });
}

// Íµ¨Îß§ ?¥Î†• PDF ?ùÏÑ± ?®Ïàò
function generatePurchasePDF(customerId) {
    const customer = customers.find(c => c.id === customerId);
    const customerPurchases = purchases.filter(p => p.customerId === customerId);
    
    if (!customer || customerPurchases.length === 0) {
        alert('PDFÎ°?Î≥Ä?òÌï† Íµ¨Îß§ ?¥Î†•???ÜÏäµ?àÎã§.');
        return;
    }
    
    // PDF ?ùÏÑ±
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // ?úÎ™©
    doc.setFontSize(18);
    doc.text('?ÑÏÑú?§Í∑∏?àÏù¥??Í≥†Í∞ù Íµ¨Îß§ ?¥Î†•', 14, 20);
    
    // Í≥†Í∞ù ?ïÎ≥¥
    doc.setFontSize(12);
    doc.text(`Í≥†Í∞ùÎ™? ${customer.name}`, 14, 30);
    doc.text(`?∞ÎùΩÏ≤? ${customer.phone}`, 14, 37);
    doc.text(`?±Í∏â: ${customer.rank.toUpperCase()}`, 14, 44);
    doc.text(`Ï¥?Íµ¨Îß§?? ${formatCurrency(customer.totalPurchase)}`, 14, 51);
    
    // Íµ¨Îß§ ?¥Î†• ?åÏù¥Î∏?
    doc.setFontSize(14);
    doc.text('Íµ¨Îß§ ?¥Î†•', 14, 65);
    
    let yPosition = 75;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    customerPurchases.forEach((purchase, index) => {
        // ?òÏù¥ÏßÄ ?ïÏù∏ Î∞????òÏù¥ÏßÄ Ï∂îÍ?
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }
        
        // Íµ¨Îß§ ?ïÎ≥¥
        doc.setFontSize(12);
        doc.text(`${index + 1}. Íµ¨Îß§?? ${formatDate(purchase.date)}`, 14, yPosition);
        yPosition += 7;
        doc.text(`   Í≤∞Ï†ú Í∏àÏï°: ${formatCurrency(purchase.totalAmount)}`, 14, yPosition);
        yPosition += 7;
        doc.text(`   Í≤∞Ï†ú Î∞©Î≤ï: ${purchase.paymentMethod}`, 14, yPosition);
        yPosition += 7;
        
        // Ï£ºÎ¨∏?•Î≤à??Ï∂îÍ?
        if (purchase.orderNumber) {
            doc.text(`   Ï£ºÎ¨∏?•Î≤à?? ${purchase.orderNumber}`, 14, yPosition);
            yPosition += 7;
        }
        
        // Íµ¨Îß§Îß§Ïû• ?ïÎ≥¥ Ï∂îÍ?
        if (purchase.store) {
            doc.text(`   Íµ¨Îß§Îß§Ïû•: ${purchase.store}`, 14, yPosition);
            yPosition += 7;
        }
        
        // ?¥Îãπ?Ä???ïÎ≥¥ Ï∂îÍ?
        if (purchase.staff) {
            doc.text(`   ?¥Îãπ?Ä?? ${purchase.staff}`, 14, yPosition);
            yPosition += 7;
        }
        
        // Î©îÎ™® ?ïÎ≥¥ Ï∂îÍ?
        if (purchase.memo) {
            doc.text(`   Î©îÎ™®: ${purchase.memo}`, 14, yPosition);
            yPosition += 7;
        }
        
        // Íµ¨Îß§ ??™©
        doc.text('   Íµ¨Îß§ ?úÌíà:', 14, yPosition);
        yPosition += 7;
        
        purchase.items.forEach(item => {
            doc.text(`   - ${item.name}: ${formatCurrency(item.price)}`, 20, yPosition);
            yPosition += 7;
        });
        
        // Íµ¨Î∂Ñ??
        doc.setDrawColor(200, 200, 200);
        doc.line(14, yPosition, pageWidth - 14, yPosition);
        yPosition += 10;
    });
    
    // ?†Ïßú ?ïÏãù???åÏùºÎ™??ùÏÑ±
    const today = new Date();
    const fileName = `${customer.name}_Íµ¨Îß§?¥Î†•_${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}.pdf`;
    
    // PDF ?Ä??
    doc.save(fileName);
}

// Í≥†Í∞ù ?±Í∏â ?êÎèô ?ÖÎç∞?¥Ìä∏ ?®Ïàò
function updateCustomerRank(customer) {
    const oldRank = customer.rank;
    
    // ???±Í∏â Í∏∞Ï?: 2Ï≤úÎßå???¥ÏÉÅ VVIP, Ï≤úÎßå???¥ÏÉÅ VIP, ?òÎ®∏ÏßÄ ?ºÎ∞ò
    if (customer.totalPurchase >= 20000000) {
        customer.rank = 'vvip';
    } else if (customer.totalPurchase >= 10000000) {
        customer.rank = 'vip';
    } else {
        customer.rank = 'regular';
    }
    
    return customer;
}

// Î™®Îì† Í≥†Í∞ù???±Í∏â???àÎ°ú??Í∏∞Ï??ºÎ°ú ?ÖÎç∞?¥Ìä∏?òÎäî ?®Ïàò
function updateAllCustomerRanks() {
    let updatedCount = 0;
    
    customers.forEach(customer => {
        const oldRank = customer.rank;
        updateCustomerRank(customer);
        
        if (oldRank !== customer.rank) {
            updatedCount++;
        }
    });
    
    if (updatedCount > 0) {
        saveDataToFirebase();
        console.log(`${updatedCount}Î™ÖÏùò Í≥†Í∞ù ?±Í∏â???àÎ°ú??Í∏∞Ï??ºÎ°ú ?ÖÎç∞?¥Ìä∏?òÏóà?µÎãà??`);
    }
}

// ?†Ïßú ?¨Îß∑ ?®Ïàò (YYYY-MM-DD -> YYYY??MM??DD??
function formatDate(dateString) {
    if (!dateString) return '-';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    
    return `${parts[0]}??${parts[1]}??${parts[2]}??;
}

// Í∏àÏï° ?¨Îß∑ ?®Ïàò (1000000 -> 1,000,000??
function formatCurrency(amount) {
    return amount.toLocaleString('ko-KR') + '??;
}

// Í≥†Í∞ù ??†ú ?®Ïàò
function deleteCustomer(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    // ??†ú ?ïÏù∏
    if (confirm(`?ïÎßêÎ°?${customer.name} Í≥†Í∞ù???ïÎ≥¥Î•???†ú?òÏãúÍ≤†Ïäµ?àÍπå? ???ëÏóÖ?Ä ?òÎèåÎ¶????ÜÏäµ?àÎã§.`)) {
        // Í¥Ä?®Îêú Íµ¨Îß§ ?¥Î†•, ?†Î¨º ?¥Î†•, Î∞©Î¨∏ ?¥Î†•???®Íªò ??†ú
        const customerPurchases = purchases.filter(p => p.customerId === customerId);
        const customerGifts = gifts.filter(g => g.customerId === customerId);
        const customerVisits = visits.filter(v => v.customerId === customerId);
        
        // Íµ¨Îß§ ?¥Î†• ??†ú
        customerPurchases.forEach(purchase => {
            const index = purchases.findIndex(p => p.id === purchase.id);
            if (index !== -1) {
                purchases.splice(index, 1);
            }
        });
        
        // ?†Î¨º ?¥Î†• ??†ú
        customerGifts.forEach(gift => {
            const index = gifts.findIndex(g => g.id === gift.id);
            if (index !== -1) {
                gifts.splice(index, 1);
            }
        });
        
        // Î∞©Î¨∏ ?¥Î†• ??†ú
        customerVisits.forEach(visit => {
            const index = visits.findIndex(v => v.id === visit.id);
            if (index !== -1) {
                visits.splice(index, 1);
            }
        });
        
        // Í≥†Í∞ù ?ïÎ≥¥ ??†ú
        const index = customers.findIndex(c => c.id === customerId);
        if (index !== -1) {
            customers.splice(index, 1);
            
            // ?∞Ïù¥???Ä??
            saveDataToFirebase();
            
            // Î©îÏù∏ ?òÏù¥ÏßÄÎ°??¥Îèô
            alert('Í≥†Í∞ù ?ïÎ≥¥Í∞Ä ??†ú?òÏóà?µÎãà??');
            window.location.href = 'index.html';
        }
    }
}

// Íµ¨Îß§ Í∏∞Î°ù ?òÏ†ï ?®Ïàò
function editPurchaseRecord(purchaseId, customerId) {
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) return;
    
    // Íµ¨Îß§ Í∏∞Î°ù ?òÏ†ï Î™®Îã¨ ?ùÏÑ±
    const editForm = `
    <div class="modal fade" id="edit-purchase-modal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Íµ¨Îß§ Í∏∞Î°ù ?òÏ†ï</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="edit-purchase-form">
                        <input type="hidden" id="edit-purchase-id" value="${purchase.id}">
                        <input type="hidden" id="edit-purchase-customer-id" value="${purchase.customerId}">
                        <div class="mb-3">
                            <label for="edit-purchase-date" class="form-label">Íµ¨Îß§??/label>
                            <input type="date" class="form-control" id="edit-purchase-date" value="${purchase.date}" required>
                        </div>
                        <div id="edit-purchase-items">
                            ${purchase.items.map((item, index) => `
                                <div class="purchase-item mb-3">
                                    <div class="row">
                                        <div class="col-md-7">
                                            <label class="form-label">?ÅÌíàÎ™?/label>
                                            <input type="text" class="form-control item-name" value="${item.name}" required>
                                        </div>
                                        <div class="col-md-5">
                                            <label class="form-label">Í∞ÄÍ≤?/label>
                                            <input type="number" class="form-control item-price" value="${item.price}" required>
                                        </div>
                                    </div>
                                    ${index > 0 ? `<button type="button" class="btn btn-sm btn-outline-danger mt-2 remove-item-btn">- ??†ú</button>` : ''}
                                </div>
                            `).join('')}
                        </div>
                        <div class="mb-3">
                            <button type="button" class="btn btn-sm btn-outline-secondary" id="edit-add-item-btn">+ ?ÅÌíà Ï∂îÍ?</button>
                        </div>
                        <div class="mb-3">
                            <label for="edit-purchase-order-number" class="form-label">Ï£ºÎ¨∏?•Î≤à??/label>
                            <input type="text" class="form-control" id="edit-purchase-order-number" value="${purchase.orderNumber || ''}">
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label for="edit-purchase-store" class="form-label">Íµ¨Îß§Îß§Ïû•</label>
                                <input type="text" class="form-control" id="edit-purchase-store" value="${purchase.store || ''}">
                            </div>
                            <div class="col-md-6">
                                <label for="edit-purchase-staff" class="form-label">?¥Îãπ?Ä??/label>
                                <input type="text" class="form-control" id="edit-purchase-staff" value="${purchase.staff || ''}">
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="edit-purchase-memo" class="form-label">Î©îÎ™®</label>
                            <textarea class="form-control" id="edit-purchase-memo" rows="2">${purchase.memo || ''}</textarea>
                        </div>
                        <div class="mb-3">
                            <label for="edit-payment-method" class="form-label">Í≤∞Ï†ú Î∞©Î≤ï</label>
                            <select class="form-control" id="edit-payment-method" required>
                                <option value="?†Ïö©Ïπ¥Îìú" ${purchase.paymentMethod === '?†Ïö©Ïπ¥Îìú' ? 'selected' : ''}>?†Ïö©Ïπ¥Îìú</option>
                                <option value="?ÑÍ∏à" ${purchase.paymentMethod === '?ÑÍ∏à' ? 'selected' : ''}>?ÑÍ∏à</option>
                                <option value="Í≥ÑÏ¢å?¥Ï≤¥" ${purchase.paymentMethod === 'Í≥ÑÏ¢å?¥Ï≤¥' ? 'selected' : ''}>Í≥ÑÏ¢å?¥Ï≤¥</option>
                                <option value="Í∏∞Ì?" ${purchase.paymentMethod === 'Í∏∞Ì?' ? 'selected' : ''}>Í∏∞Ì?</option>
                            </select>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Ï∑®ÏÜå</button>
                            <button type="submit" class="btn btn-primary">?Ä??/button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // Í∏∞Ï°¥ Î™®Îã¨???àÏúºÎ©??úÍ±∞
    const existingModal = document.getElementById('edit-purchase-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Î™®Îã¨ Ï∂îÍ? Î∞??úÏãú
    document.body.insertAdjacentHTML('beforeend', editForm);
    const editModal = new bootstrap.Modal(document.getElementById('edit-purchase-modal'));
    editModal.show();
    
    // ?ÅÌíà Ï∂îÍ? Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('edit-add-item-btn').addEventListener('click', () => {
        const purchaseItems = document.getElementById('edit-purchase-items');
        const newItem = document.createElement('div');
        newItem.className = 'purchase-item mb-3';
        newItem.innerHTML = `
            <div class="row">
                <div class="col-md-7">
                    <label class="form-label">?ÅÌíàÎ™?/label>
                    <input type="text" class="form-control item-name" required>
                </div>
                <div class="col-md-5">
                    <label class="form-label">Í∞ÄÍ≤?/label>
                    <input type="number" class="form-control item-price" required>
                </div>
            </div>
            <button type="button" class="btn btn-sm btn-outline-danger mt-2 remove-item-btn">- ??†ú</button>
        `;
        purchaseItems.appendChild(newItem);
        
        // ??†ú Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
        newItem.querySelector('.remove-item-btn').addEventListener('click', function() {
            this.closest('.purchase-item').remove();
        });
    });
    
    // Í∏∞Ï°¥ ?ÅÌíà ??†ú Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.querySelectorAll('#edit-purchase-items .remove-item-btn').forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.purchase-item').remove();
        });
    });
    
    // ?òÏ†ï ???úÏ∂ú ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('edit-purchase-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const purchaseId = parseInt(document.getElementById('edit-purchase-id').value);
        const customerId = parseInt(document.getElementById('edit-purchase-customer-id').value);
        const date = document.getElementById('edit-purchase-date').value;
        const paymentMethod = document.getElementById('edit-payment-method').value;
        const staff = document.getElementById('edit-purchase-staff').value;
        const store = document.getElementById('edit-purchase-store').value;
        const orderNumber = document.getElementById('edit-purchase-order-number').value;
        const memo = document.getElementById('edit-purchase-memo').value;
        
        // ?ÅÌíà ?ÑÏù¥??Í∞Ä?∏Ïò§Í∏?
        const items = [];
        let totalAmount = 0;
        
        document.querySelectorAll('#edit-purchase-items .purchase-item').forEach(item => {
            const name = item.querySelector('.item-name').value;
            const price = parseInt(item.querySelector('.item-price').value);
            
            if (name && price) {
                items.push({ name, price });
                totalAmount += price;
            }
        });
        
        if (items.length === 0) {
            alert('?ÅÌíà??ÏµúÏÜå 1Í∞??¥ÏÉÅ ?ÖÎ†•?¥Ï£º?∏Ïöî.');
            return;
        }
        
        // Íµ¨Îß§ Í∏∞Î°ù ?òÏ†ï
        const index = purchases.findIndex(p => p.id === purchaseId);
        if (index !== -1) {
            const oldPurchase = purchases[index];
            
            // Í≥†Í∞ù Ï¥?Íµ¨Îß§???ÖÎç∞?¥Ìä∏ (Í∏∞Ï°¥ Í∏àÏï° ÎπºÍ≥† ??Í∏àÏï° Ï∂îÍ?)
            const customer = customers.find(c => c.id === customerId);
            if (customer) {
                customer.totalPurchase -= oldPurchase.totalAmount;
                customer.totalPurchase += totalAmount;
                
                // Í≥†Í∞ù ?±Í∏â ?êÎèô ?ÖÎç∞?¥Ìä∏
                updateCustomerRank(customer);
            }
            
            // Íµ¨Îß§ Í∏∞Î°ù ?ÖÎç∞?¥Ìä∏
            purchases[index] = {
                ...oldPurchase,
                date,
                items,
                totalAmount,
                orderNumber,
                store,
                staff,
                memo,
                paymentMethod
            };
            
            // ?∞Ïù¥???Ä??
            saveDataToFirebase();
            
            // Î™®Îã¨ ?´Í∏∞
            editModal.hide();
            
            // Íµ¨Îß§ ?¥Î†• ?§Ïãú Î°úÎìú
            loadCustomerPurchases(customerId);
            
            // Í≥†Í∞ù ?ÅÏÑ∏ ?ïÎ≥¥ ?ÖÎç∞?¥Ìä∏ (Ï¥?Íµ¨Îß§?°Ïù¥ Î≥ÄÍ≤ΩÎêò?àÏùÑ ???àÏùå)
            loadCustomerDetails(customerId);
            
            // ?åÎ¶º ?úÏãú
            alert('Íµ¨Îß§ Í∏∞Î°ù???òÏ†ï?òÏóà?µÎãà??');
        }
    });
}

// Íµ¨Îß§ Í∏∞Î°ù ??†ú ?®Ïàò
function deletePurchaseRecord(purchaseId, customerId) {
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) return;
    
    // ??†ú ?ïÏù∏
    if (confirm('?ïÎßêÎ°???Íµ¨Îß§ Í∏∞Î°ù????†ú?òÏãúÍ≤†Ïäµ?àÍπå? ???ëÏóÖ?Ä ?òÎèåÎ¶????ÜÏäµ?àÎã§.')) {
        // Í≥†Í∞ù Ï¥?Íµ¨Îß§??Î∞?Íµ¨Îß§ ?üÏàò ?ÖÎç∞?¥Ìä∏
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            customer.totalPurchase -= purchase.totalAmount;
            customer.purchaseCount -= 1;
            
            // Í≥†Í∞ù ?±Í∏â ?êÎèô ?ÖÎç∞?¥Ìä∏
            updateCustomerRank(customer);
        }
        
        // Íµ¨Îß§ Í∏∞Î°ù ??†ú
        const index = purchases.findIndex(p => p.id === purchaseId);
        if (index !== -1) {
            purchases.splice(index, 1);
            
            // ?∞Ïù¥???Ä??
            saveDataToFirebase();
            
            // Íµ¨Îß§ ?¥Î†• ?§Ïãú Î°úÎìú
            loadCustomerPurchases(customerId);
            
            // Í≥†Í∞ù ?ÅÏÑ∏ ?ïÎ≥¥ ?ÖÎç∞?¥Ìä∏ (Ï¥?Íµ¨Îß§?°Ïù¥ Î≥ÄÍ≤ΩÎêò?àÏùÑ ???àÏùå)
            loadCustomerDetails(customerId);
            
            // ?åÎ¶º ?úÏãú
            alert('Íµ¨Îß§ Í∏∞Î°ù????†ú?òÏóà?µÎãà??');
        }
    }
}

// ?†Î¨º Í∏∞Î°ù ?òÏ†ï ?®Ïàò
function editGiftRecord(giftId, customerId) {
    const gift = gifts.find(g => g.id === giftId);
    if (!gift) return;
    
    // ?†Î¨º Í∏∞Î°ù ?òÏ†ï Î™®Îã¨ ?ùÏÑ±
    const editForm = `
    <div class="modal fade" id="edit-gift-modal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">?†Î¨º Í∏∞Î°ù ?òÏ†ï</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="edit-gift-form">
                        <input type="hidden" id="edit-gift-id" value="${gift.id}">
                        <input type="hidden" id="edit-gift-customer-id" value="${gift.customerId}">
                        <div class="mb-3">
                            <label for="edit-gift-type" class="form-label">?†Î¨º Ï¢ÖÎ•ò</label>
                            <select class="form-control" id="edit-gift-type" required>
                                <option value="?ùÏùº?†Î¨º" ${gift.type === '?ùÏùº?†Î¨º' ? 'selected' : ''}>?ùÏùº?†Î¨º</option>
                                <option value="?∞Îßê?†Î¨º" ${gift.type === '?∞Îßê?†Î¨º' ? 'selected' : ''}>?∞Îßê?†Î¨º</option>
                                <option value="Í∞êÏÇ¨?†Î¨º" ${gift.type === 'Í∞êÏÇ¨?†Î¨º' ? 'selected' : ''}>Í∞êÏÇ¨?†Î¨º</option>
                                <option value="Í∏∞Ì?" ${gift.type === 'Í∏∞Ì?' ? 'selected' : ''}>Í∏∞Ì?</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="edit-gift-description" class="form-label">?†Î¨º ?¥Ïö©</label>
                            <input type="text" class="form-control" id="edit-gift-description" value="${gift.description}" required>
                        </div>
                        <div class="mb-3">
                            <label for="edit-gift-date" class="form-label">?úÍ≥µ??/label>
                            <input type="date" class="form-control" id="edit-gift-date" value="${gift.date}" required>
                        </div>
                        <div class="mb-3">
                            <label for="edit-gift-reason" class="form-label">?úÍ≥µ ?¥Ïú†</label>
                            <input type="text" class="form-control" id="edit-gift-reason" value="${gift.reason}" required>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Ï∑®ÏÜå</button>
                            <button type="submit" class="btn btn-primary">?Ä??/button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // Í∏∞Ï°¥ Î™®Îã¨???àÏúºÎ©??úÍ±∞
    const existingModal = document.getElementById('edit-gift-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Î™®Îã¨ Ï∂îÍ? Î∞??úÏãú
    document.body.insertAdjacentHTML('beforeend', editForm);
    const editModal = new bootstrap.Modal(document.getElementById('edit-gift-modal'));
    editModal.show();
    
    // ?òÏ†ï ???úÏ∂ú ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('edit-gift-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const giftId = parseInt(document.getElementById('edit-gift-id').value);
        const customerId = parseInt(document.getElementById('edit-gift-customer-id').value);
        const type = document.getElementById('edit-gift-type').value;
        const description = document.getElementById('edit-gift-description').value;
        const date = document.getElementById('edit-gift-date').value;
        const reason = document.getElementById('edit-gift-reason').value;
        
        // ?†Î¨º Í∏∞Î°ù ?òÏ†ï
        const index = gifts.findIndex(g => g.id === giftId);
        if (index !== -1) {
            // ?†Î¨º Í∏∞Î°ù ?ÖÎç∞?¥Ìä∏
            gifts[index] = {
                ...gifts[index],
                type,
                description,
                date,
                reason
            };
            
            // ?∞Ïù¥???Ä??
            saveDataToFirebase();
            
            // Î™®Îã¨ ?´Í∏∞
            editModal.hide();
            
            // ?†Î¨º ?¥Î†• ?§Ïãú Î°úÎìú
            loadCustomerGifts(customerId);
            
            // ?åÎ¶º ?úÏãú
            alert('?†Î¨º Í∏∞Î°ù???òÏ†ï?òÏóà?µÎãà??');
        }
    });
}

// ?†Î¨º Í∏∞Î°ù ??†ú ?®Ïàò
function deleteGiftRecord(giftId, customerId) {
    const gift = gifts.find(g => g.id === giftId);
    if (!gift) return;
    
    // ??†ú ?ïÏù∏
    if (confirm('?ïÎßêÎ°????†Î¨º Í∏∞Î°ù????†ú?òÏãúÍ≤†Ïäµ?àÍπå? ???ëÏóÖ?Ä ?òÎèåÎ¶????ÜÏäµ?àÎã§.')) {
        // ?†Î¨º Í∏∞Î°ù ??†ú
        const index = gifts.findIndex(g => g.id === giftId);
        if (index !== -1) {
            gifts.splice(index, 1);
            
            // ?∞Ïù¥???Ä??
            saveDataToFirebase();
            
            // ?†Î¨º ?¥Î†• ?§Ïãú Î°úÎìú
            loadCustomerGifts(customerId);
            
            // ?åÎ¶º ?úÏãú
            alert('?†Î¨º Í∏∞Î°ù????†ú?òÏóà?µÎãà??');
        }
    }
}

// Î∞©Î¨∏ Í∏∞Î°ù ?òÏ†ï ?®Ïàò
function editVisitRecord(visitId, customerId) {
    const visit = visits.find(v => v.id === visitId);
    if (!visit) return;
    
    // Î∞©Î¨∏ Í∏∞Î°ù ?òÏ†ï Î™®Îã¨ ?ùÏÑ±
    const editForm = `
    <div class="modal fade" id="edit-visit-modal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Î∞©Î¨∏ Í∏∞Î°ù ?òÏ†ï</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="edit-visit-form">
                        <input type="hidden" id="edit-visit-id" value="${visit.id}">
                        <input type="hidden" id="edit-visit-customer-id" value="${visit.customerId}">
                        <div class="mb-3">
                            <label for="edit-visit-date" class="form-label">Î∞©Î¨∏??/label>
                            <input type="date" class="form-control" id="edit-visit-date" value="${visit.date}" required>
                        </div>
                        <div class="mb-3">
                            <label for="edit-visit-purpose" class="form-label">Î∞©Î¨∏ Î™©Ï†Å</label>
                            <input type="text" class="form-control" id="edit-visit-purpose" value="${visit.purpose}" required>
                        </div>
                        <div class="mb-3">
                            <label for="edit-visit-note" class="form-label">Î©îÎ™®</label>
                            <textarea class="form-control" id="edit-visit-note" rows="3">${visit.note || ''}</textarea>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Ï∑®ÏÜå</button>
                            <button type="submit" class="btn btn-primary">?Ä??/button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // Í∏∞Ï°¥ Î™®Îã¨???àÏúºÎ©??úÍ±∞
    const existingModal = document.getElementById('edit-visit-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Î™®Îã¨ Ï∂îÍ? Î∞??úÏãú
    document.body.insertAdjacentHTML('beforeend', editForm);
    const editModal = new bootstrap.Modal(document.getElementById('edit-visit-modal'));
    editModal.show();
    
    // ?òÏ†ï ???úÏ∂ú ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('edit-visit-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const visitId = parseInt(document.getElementById('edit-visit-id').value);
        const customerId = parseInt(document.getElementById('edit-visit-customer-id').value);
        const date = document.getElementById('edit-visit-date').value;
        const purpose = document.getElementById('edit-visit-purpose').value;
        const note = document.getElementById('edit-visit-note').value;
        
        // Î∞©Î¨∏ Í∏∞Î°ù ?òÏ†ï
        const index = visits.findIndex(v => v.id === visitId);
        if (index !== -1) {
            // Î∞©Î¨∏ Í∏∞Î°ù ?ÖÎç∞?¥Ìä∏
            visits[index] = {
                ...visits[index],
                date,
                purpose,
                note
            };
            
            // ?∞Ïù¥???Ä??
            saveDataToFirebase();
            
            // Í≥†Í∞ù ÏµúÍ∑º Î∞©Î¨∏???ÖÎç∞?¥Ìä∏
            const customer = customers.find(c => c.id === customerId);
            if (customer) {
                // Î™®Îì† Î∞©Î¨∏ ?†Ïßú ?ïÏù∏?òÏó¨ ÏµúÍ∑º Î∞©Î¨∏???ÖÎç∞?¥Ìä∏
                const customerVisits = visits.filter(v => v.customerId === customerId);
                if (customerVisits.length > 0) {
                    const sortedDates = customerVisits.map(v => v.date).sort((a, b) => 
                        new Date(b) - new Date(a)
                    );
                    customer.lastVisit = sortedDates[0];
                }
            }
            
            // Î™®Îã¨ ?´Í∏∞
            editModal.hide();
            
            // Î∞©Î¨∏ ?¥Î†• ?§Ïãú Î°úÎìú
            loadCustomerVisits(customerId);
            
            // Í≥†Í∞ù ?ÅÏÑ∏ ?ïÎ≥¥ ?ÖÎç∞?¥Ìä∏ (ÏµúÍ∑º Î∞©Î¨∏?ºÏù¥ Î≥ÄÍ≤ΩÎêò?àÏùÑ ???àÏùå)
            loadCustomerDetails(customerId);
            
            // ?åÎ¶º ?úÏãú
            alert('Î∞©Î¨∏ Í∏∞Î°ù???òÏ†ï?òÏóà?µÎãà??');
        }
    });
}

// Î∞©Î¨∏ Í∏∞Î°ù ??†ú ?®Ïàò
function deleteVisitRecord(visitId, customerId) {
    const visit = visits.find(v => v.id === visitId);
    if (!visit) return;
    
    // ??†ú ?ïÏù∏
    if (confirm('?ïÎßêÎ°???Î∞©Î¨∏ Í∏∞Î°ù????†ú?òÏãúÍ≤†Ïäµ?àÍπå? ???ëÏóÖ?Ä ?òÎèåÎ¶????ÜÏäµ?àÎã§.')) {
        // Î∞©Î¨∏ Í∏∞Î°ù ??†ú
        const index = visits.findIndex(v => v.id === visitId);
        if (index !== -1) {
            visits.splice(index, 1);
            
            // ?∞Ïù¥???Ä??
            saveDataToFirebase();
            
            // Í≥†Í∞ù ÏµúÍ∑º Î∞©Î¨∏???ÖÎç∞?¥Ìä∏
            const customer = customers.find(c => c.id === customerId);
            if (customer) {
                // Î™®Îì† Î∞©Î¨∏ ?†Ïßú ?ïÏù∏?òÏó¨ ÏµúÍ∑º Î∞©Î¨∏???ÖÎç∞?¥Ìä∏
                const customerVisits = visits.filter(v => v.customerId === customerId);
                if (customerVisits.length > 0) {
                    const sortedDates = customerVisits.map(v => v.date).sort((a, b) => 
                        new Date(b) - new Date(a)
                    );
                    customer.lastVisit = sortedDates[0];
                } else {
                    // Î∞©Î¨∏ Í∏∞Î°ù???ÜÏúºÎ©?Í∏∞Î≥∏Í∞íÏúºÎ°??§Ï†ï
                    customer.lastVisit = new Date().toISOString().split('T')[0];
                }
            }
            
            // Î∞©Î¨∏ ?¥Î†• ?§Ïãú Î°úÎìú
            loadCustomerVisits(customerId);
            
            // Í≥†Í∞ù ?ÅÏÑ∏ ?ïÎ≥¥ ?ÖÎç∞?¥Ìä∏ (ÏµúÍ∑º Î∞©Î¨∏?ºÏù¥ Î≥ÄÍ≤ΩÎêò?àÏùÑ ???àÏùå)
            loadCustomerDetails(customerId);
            
            // ?åÎ¶º ?úÏãú
            alert('Î∞©Î¨∏ Í∏∞Î°ù????†ú?òÏóà?µÎãà??');
        }
    }
} 
