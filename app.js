// 관리자 계정 ?�보 (?�제 ?�경?�서???�버?�서 관리해????
const ADMIN_USERS = [
    { username: 'admin', password: 'grace1' }
];

// Firebase ?�동 ?�기???�정 (기본: ?�동 ?�성??
window.FIREBASE_SYNC = {
    enabled: true, // ?�동 ?�기???�성??
    databaseUrl: 'https://customer-management-db-default-rtdb.firebaseio.com', // 기본 Firebase DB
    apiKey: 'AIzaSyBxVq2K8J9X4L5M3N7P8Q1R2S3T4U5V6W7', // 기본 API Key
    syncInterval: 5000, // 5초마???�기??체크
    lastSyncTime: 0,
    deviceId: localStorage.getItem('deviceId') || generateDeviceId(),
    isSyncing: false,
    database: null, // Firebase ?�이?�베?�스 참조
    autoSync: true, // ?�동 ?�기???�성??
    userPath: 'arthur_grace_customer_system' // 고정???�이??경로 (?�이???�구 보존)
};

// 기기 고유 ID ?�성
function generateDeviceId() {
    const deviceId = 'device_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('deviceId', deviceId);
    return deviceId;
}

// Firebase ?�기???�태 ?�시 (?�전??버전)
function updateSyncStatus(status, message = '') {
    const statusElement = document.getElementById('sync-status');
    if (!statusElement) {
        // ?�기???�태 ?�소가 ?�으�??�순??콘솔??로그�?출력
        console.log(`Firebase ?�기???�태: ${status}`, message);
        return;
    }
    
    const now = new Date().toLocaleTimeString('ko-KR');
    let statusText = '';
    let statusClass = '';
    
    switch (status) {
        case 'syncing':
            statusText = '?�� Firebase ?�기??�?..';
            statusClass = 'text-warning';
            break;
        case 'success':
            statusText = `??Firebase ?�기???�료 (${now})`;
            statusClass = 'text-success';
            break;
        case 'error':
            statusText = `??Firebase ?�기???�패: ${message}`;
            statusClass = 'text-danger';
            break;
        case 'offline':
            statusText = '?�� ?�프?�인 모드';
            statusClass = 'text-secondary';
            break;
        case 'realtime':
            statusText = `?�� Firebase ?�시�??�결??(${now})`;
            statusClass = 'text-info';
            break;
        default:
            statusText = '??Firebase ?��?�?;
            statusClass = 'text-muted';
    }
    
    statusElement.innerHTML = `<small class="${statusClass}">${statusText}</small>`;
}

// Firebase?�서 최신 ?�이???�인 �??�기??
async function checkFirebaseUpdates() {
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
            
            // Firebase ?�이?��? ?�고, 로컬보다 최신??경우
            if (firebaseData && firebaseData.lastUpdated > window.FIREBASE_SYNC.lastSyncTime) {
                // ?�재 기기?�서 ?�정??것이 ?�닌 경우?�만 ?�기??
                if (firebaseData.lastModifiedBy !== window.FIREBASE_SYNC.deviceId) {
                    // ?�이???�데?�트
                    customers = firebaseData.customers || [];
                    purchases = firebaseData.purchases || [];
                    gifts = firebaseData.gifts || [];
                    visits = firebaseData.visits || [];
                    rankChanges = firebaseData.rankChanges || [];
                    
                    // UI ?�로고침
                    const customerListElement = document.getElementById('customer-list');
                    if (customerListElement && customerListElement.style.display !== 'none') {
                        if (typeof loadCustomerList === 'function') {
                            loadCustomerList();
                        }
                    }
                    
                    window.FIREBASE_SYNC.lastSyncTime = firebaseData.lastUpdated;
                    updateSyncStatus('success');
                    console.log('Firebase?�서 최신 ?�이???�기???�료');
                }
            }
        }
    } catch (error) {
        console.error('Firebase ?�데?�트 ?�인 ?�류:', error);
        updateSyncStatus('error', error.message);
    } finally {
        if (window.FIREBASE_SYNC) {
            window.FIREBASE_SYNC.isSyncing = false;
        }
    }
}

// Firebase ?�기???�정 ?�수 (?�전??버전)
function setupFirebaseSync(databaseUrl, apiKey) {
    if (!window.FIREBASE_SYNC) {
        console.error('FIREBASE_SYNC 객체가 초기?�되지 ?�았?�니??');
        return;
    }
    
    window.FIREBASE_SYNC.enabled = true;
    window.FIREBASE_SYNC.databaseUrl = databaseUrl;
    window.FIREBASE_SYNC.apiKey = apiKey;
    
    // ?�용?�별 경로 ?�성 �??�정 ?�??
    const userPath = generateUserPath();
    window.FIREBASE_SYNC.userPath = userPath;
    
    try {
        localStorage.setItem('firebaseSyncConfig', JSON.stringify({
            databaseUrl: databaseUrl,
            apiKey: apiKey,
            userPath: userPath,
            enabled: true
        }));
    } catch (error) {
        console.error('로컬 ?�토리�? ?�???�류:', error);
    }
    
    // 즉시 ?�기???�작 (?�전?�게)
    try {
        syncFromFirebase();
    } catch (error) {
        console.error('즉시 Firebase ?�기???�류:', error);
    }
    
    // ?�기???�기???�작
    try {
        startSyncInterval();
    } catch (error) {
        console.error('?�기 Firebase ?�기???�작 ?�류:', error);
    }
    
    // ?�시�?리스???�정 ?�도
    try {
        setupRealtimeListener();
    } catch (error) {
        console.error('?�시�?리스???�정 ?�류:', error);
    }
    
    alert('Firebase ?�시�??�기?��? ?�성?�되?�습?�다!\n?�제 모든 기기?�서 ?�시간으�??�이?��? ?�기?�됩?�다.');
}

// Firebase ?�시�?리스???�정 (EventSource ?�용)
function setupRealtimeListener() {
    if (!window.FIREBASE_SYNC || !window.FIREBASE_SYNC.enabled) return;
    
    const userPath = window.FIREBASE_SYNC.userPath || 'default';
    const eventSourceUrl = `${window.FIREBASE_SYNC.databaseUrl}/${userPath}/customerData.json?auth=${window.FIREBASE_SYNC.apiKey}`;
    
    try {
        // 기존 EventSource가 ?�으�??�기
        if (window.FIREBASE_SYNC.eventSource) {
            window.FIREBASE_SYNC.eventSource.close();
        }
        
        // Server-Sent Events�??�용???�시�??�결
        window.FIREBASE_SYNC.eventSource = new EventSource(eventSourceUrl);
        
        window.FIREBASE_SYNC.eventSource.onopen = function() {
            console.log('Firebase ?�시�??�결 ?�공');
            updateSyncStatus('realtime');
        };
        
        window.FIREBASE_SYNC.eventSource.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                if (data && data.lastModifiedBy !== window.FIREBASE_SYNC.deviceId) {
                    console.log('Firebase?�서 ?�시�??�이??변�?감�?');
                    syncFromFirebase();
                }
            } catch (error) {
                console.error('?�시�??�이??처리 ?�류:', error);
            }
        };
        
        window.FIREBASE_SYNC.eventSource.onerror = function(event) {
            console.error('Firebase ?�시�??�결 ?�류:', event);
            updateSyncStatus('error', '?�시�??�결 ?��?');
            
            // ?�연�??�도
            setTimeout(() => {
                if (window.FIREBASE_SYNC && window.FIREBASE_SYNC.enabled) {
                    setupRealtimeListener();
                }
            }, 5000);
        };
        
    } catch (error) {
        console.error('?�시�?리스???�정 ?�패:', error);
        // ?�시�??�결 ?�패 ???�기 ?�기?�로 ?��?
        startSyncInterval();
    }
}

// ?�기???�기???�작 (Firebase 버전)
// ?�기?�으�?Firebase ?�데?�트 ?�인
function startUpdateChecker() {
    if (window.FIREBASE_SYNC && window.FIREBASE_SYNC.enabled) {
        // 기존 ?�터벌이 ?�으�??�거
        if (window.FIREBASE_SYNC.updateIntervalId) {
            clearInterval(window.FIREBASE_SYNC.updateIntervalId);
        }
        
        window.FIREBASE_SYNC.updateIntervalId = setInterval(() => {
            try {
                checkFirebaseUpdates();
            } catch (error) {
                console.error('Firebase ?�데?�트 ?�인 ?�류:', error);
            }
        }, window.FIREBASE_SYNC.syncInterval);
        console.log(`Firebase ?�데?�트 ?�인 ?�작 (${window.FIREBASE_SYNC.syncInterval}ms 간격)`);
    }
}

// Firebase 직접 ?�동 초기??
async function initializeFirebaseConnection() {
    console.log('Firebase 직접 ?�동 ?�스??초기??..');
    
    try {
        // 고정???�이??경로 ?�용 (?�이???�구 보존)
        const userPath = window.FIREBASE_SYNC.userPath;
        
        console.log('Firebase 직접 ?�동 ?�작 - ?�이??경로:', userPath);
        updateSyncStatus('syncing', 'Firebase ?�결 �?..');
        
        // Firebase?�서 ?�이??로드
        await loadDataFromFirebase();
        
        // ?�기?�으�??�데?�트 ?�인
        startUpdateChecker();
        
        console.log('Firebase ?�결 ?�료 - ?�이???�구 보존 모드');
        
    } catch (error) {
        console.error('Firebase ?�동 초기???�류:', error);
        updateSyncStatus('error', 'Firebase ?�결 ?�패');
        // ?�류 ?�에??�??�이?�로 ?�작
        customers = [];
        purchases = [];
        gifts = [];
        visits = [];
        rankChanges = [];
    }
}

// Firebase ?�정 ?�??(?�이???�구 보존)
function saveFirebaseConfig() {
    try {
        const config = {
            enabled: true,
            databaseUrl: window.FIREBASE_SYNC.databaseUrl,
            apiKey: window.FIREBASE_SYNC.apiKey,
            userPath: window.FIREBASE_SYNC.userPath
        };
        localStorage.setItem('firebaseSyncConfig', JSON.stringify(config));
        console.log('Firebase ?�정 ?�???�료 - ?�이???�구 보존');
    } catch (error) {
        console.error('Firebase ?�정 ?�???�류:', error);
    }
}

// ?�급 변�??�력 배열 추�?
let rankChanges = []; // ?�급 변�??�력

// Firebase?�서 ?�이??로드 (로컬 ?�토리�? ?�거)
async function loadDataFromFirebase() {
    console.log('Firebase?�서 ?�이??로드 �?..');
    
    if (!window.FIREBASE_SYNC || !window.FIREBASE_SYNC.enabled) {
        console.log('Firebase ?�결 ?�됨 - �??�이?�로 초기??);
        customers = [];
        purchases = [];
        gifts = [];
        visits = [];
        rankChanges = [];
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
                rankChanges = firebaseData.rankChanges || [];
                
                window.FIREBASE_SYNC.lastSyncTime = firebaseData.lastUpdated || Date.now();
                console.log('Firebase?�서 ?�이??로드 ?�료');
                updateSyncStatus('success');
            } else {
                // ?�이?��? ?�으�?�?배열�?초기??
                customers = [];
                purchases = [];
                gifts = [];
                visits = [];
                rankChanges = [];
                console.log('Firebase???�이???�음 - �??�이?�로 초기??);
            }
        } else if (response.status === 404) {
            // �??�용??- �??�이?�로 ?�작
            customers = [];
            purchases = [];
            gifts = [];
            visits = [];
            rankChanges = [];
            console.log('???�용??- �??�이?�로 초기??);
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('Firebase ?�이??로드 ?�류:', error);
        updateSyncStatus('error', error.message);
        // ?�류 ??�??�이?�로 초기??
        customers = [];
        purchases = [];
        gifts = [];
        visits = [];
        rankChanges = [];
    }
}

// Firebase???�이???�??(로컬 ?�토리�? ?�거)
async function saveDataToFirebase() {
    console.log('Firebase???�이???�??�?..');
    
    if (!window.FIREBASE_SYNC || !window.FIREBASE_SYNC.enabled) {
        console.log('Firebase ?�결 ?�됨 - ?�???�패');
        return false;
    }
    
    try {
        const syncData = {
            customers: customers || [],
            purchases: purchases || [],
            gifts: gifts || [],
            visits: visits || [],
            rankChanges: rankChanges || [],
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
            console.log('Firebase???�이???�???�료');
            updateSyncStatus('success');
            return true;
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('Firebase ?�이???�???�류:', error);
        updateSyncStatus('error', error.message);
        return false;
    }
}

// ?�스?�용 ?�플 ?�이??(초기?�됨)
let customers = [];

// 구매 ?�력 ?�플 ?�이??(초기?�됨)
let purchases = [];

// ?�물 ?�력 ?�플 ?�이??(초기?�됨)
let gifts = [];

// 방문 ?�력 ?�플 ?�이??(초기?�됨)
let visits = [];

// ?�렬 ?�태 변??
let currentSort = {
    field: null,
    order: 'asc'
};

// DOM??로드?????�행
document.addEventListener('DOMContentLoaded', async () => {
    // Firebase?�서 직접 ?�이??로드
    await initializeFirebaseConnection();
    
    // 로그???�태 ?�인
    checkLoginStatus();
    
    // 로그?????�출 ?�벤??리스??
    document.getElementById('login').addEventListener('submit', (e) => {
        e.preventDefault();
        const password = document.getElementById('password').value;
        console.log('?�력???�스?�드:', password);
        
        // ?�스?�드 ?�용 로그??체크
        if (password === 'grace1') {
            performLogin();
        } else {
            // 로그???�패
            alert('비�?번호가 ?�바르�? ?�습?�다.');
        }
    });

    // 로그?�웃 버튼 ?�벤??리스??
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        performLogout();
    });

    // ?�비게이??메뉴 ?�벤??리스??
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.getAttribute('data-page');
            
            // 모든 ?�이지 ?�기�?
            document.querySelectorAll('.page').forEach(page => {
                page.classList.add('d-none');
            });
            
            // ?�택???�이지 ?�시
            document.getElementById(targetPage).classList.remove('d-none');
            
            // ?�성 메뉴 ?�시
            document.querySelectorAll('.nav-link').forEach(navLink => {
                navLink.classList.remove('active');
            });
            link.classList.add('active');
        });
    });

    // 고객 검??기능 ?�벤??리스??
    document.getElementById('search-btn').addEventListener('click', searchCustomers);
    
    // 검?�창 ?�력 ?�벤??리스??(?�시�?검??
    document.getElementById('search-input').addEventListener('input', searchCustomers);

    // 고객 추�? ???�출 ?�벤??리스??
    document.getElementById('customer-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // ?�에???�이??가?�오�?
        const newCustomer = {
            id: customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1,
            name: document.getElementById('name').value,
            gender: document.getElementById('gender').value,
            phone: document.getElementById('phone').value,
            birthdate: document.getElementById('birthdate').value,
            address: document.getElementById('address').value || '',
            preferredStore: document.getElementById('preferred-store').value || '',
            email: document.getElementById('email').value || '',
            notes: document.getElementById('notes').value || '',
            rank: 'regular',
            totalPurchase: 0,
            purchaseCount: 0,
            lastVisit: new Date().toISOString().split('T')[0]
        };
        
        // 고객 추�?
        customers.push(newCustomer);
        
        // Firebase???�이???�??
        await saveDataToFirebase();
        
        // ??초기??
        document.getElementById('customer-form').reset();
        
        // ?�림 ?�시
        alert('고객 ?�보가 ?�공?�으�??�?�되?�습?�다.');
        
        // 고객 목록 ?�이지�??�동 �?목록 ?�로고침
        document.querySelector('.nav-link[data-page="customer-list"]').click();
        loadCustomerList();
    });

    // ?�물 검??기능
    document.getElementById('gift-search-btn').addEventListener('click', () => {
        const searchTerm = document.getElementById('gift-search').value.toLowerCase();
        const filteredGifts = gifts.filter(gift => {
            const customer = customers.find(c => c.id === gift.customerId);
            return customer && customer.name.toLowerCase().includes(searchTerm);
        });
        renderGiftHistory(filteredGifts);
    });

    // 방문 검??기능
    document.getElementById('visit-search-btn').addEventListener('click', () => {
        const searchTerm = document.getElementById('visit-search').value.toLowerCase();
        const filteredVisits = getVisitSummary().filter(summary => 
            summary.name.toLowerCase().includes(searchTerm)
        );
        renderVisitTracking(filteredVisits);
    });

    // 구매 PDF ?�운로드 버튼 ?�벤??리스??
    document.getElementById('download-purchase-pdf').addEventListener('click', () => {
        // ?�재 보고 ?�는 고객 ID 가?�오�?
        const customerId = parseInt(document.querySelector('#purchase-history-content').getAttribute('data-customer-id'));
        if (customerId) {
            generatePurchasePDF(customerId);
        }
    });

    // 고객 ?�세 ?�보 모달 ???�벤??리스??
    document.querySelectorAll('#customerTabs .nav-link').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            // ?�재 보고 ?�는 고객 ID 가?�오�?
            const customerId = parseInt(document.querySelector('#customer-info-content').getAttribute('data-customer-id'));
            
            if (tab.getAttribute('href') === '#purchase-tab') {
                loadCustomerPurchases(customerId);
            } else if (tab.getAttribute('href') === '#gift-tab') {
                loadCustomerGifts(customerId);
            } else if (tab.getAttribute('href') === '#visit-tab') {
                loadCustomerVisits(customerId);
            }
        });
    });

    // ?�집 버튼 ?�벤??리스??
    document.getElementById('edit-customer-btn').addEventListener('click', () => {
        const customerId = parseInt(document.querySelector('#customer-info-content').getAttribute('data-customer-id'));
        editCustomerInfo(customerId);
    });

    // ??�� 버튼 ?�벤??리스??
    document.getElementById('delete-customer-btn').addEventListener('click', () => {
        const customerId = parseInt(document.querySelector('#customer-info-content').getAttribute('data-customer-id'));
        // 모달 ?�기
        const modal = bootstrap.Modal.getInstance(document.getElementById('customer-details-modal'));
        modal.hide();
        // 고객 ??��
        deleteCustomer(customerId);
    });



    // 구매 기록 추�? 버튼 ?�벤??리스??
    document.getElementById('add-purchase-btn').addEventListener('click', () => {
        const customerId = parseInt(document.querySelector('#purchase-history-content').getAttribute('data-customer-id'));
        document.getElementById('purchase-customer-id').value = customerId;
        document.getElementById('purchase-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('add-purchase-form').reset();
        
        // 기본 ?�이???�력 ?�드 초기??
        const purchaseItems = document.getElementById('purchase-items');
        purchaseItems.innerHTML = `
            <div class="purchase-item mb-3">
                <div class="row g-2">
                    <div class="col-12 col-md-7">
                        <label class="form-label">?�품�?*</label>
                        <input type="text" class="form-control item-name" required placeholder="구매?�신 ?�품명을 ?�력?�세??>
                    </div>
                    <div class="col-12 col-md-5">
                        <label class="form-label">가�?*</label>
                        <input type="number" class="form-control item-price" required placeholder="0">
                    </div>
                </div>
            </div>
        `;
        
        const purchaseModal = new bootstrap.Modal(document.getElementById('add-purchase-modal'));
        purchaseModal.show();
    });
    
    // ?�품 추�? 버튼 ?�벤??리스??
    document.getElementById('add-item-btn').addEventListener('click', () => {
        const purchaseItems = document.getElementById('purchase-items');
        const newItem = document.createElement('div');
        newItem.className = 'purchase-item mb-3';
        newItem.innerHTML = `
            <div class="row g-2">
                <div class="col-12 col-md-7">
                    <label class="form-label">?�품�?*</label>
                    <input type="text" class="form-control item-name" required placeholder="구매?�신 ?�품명을 ?�력?�세??>
                </div>
                <div class="col-12 col-md-5">
                    <label class="form-label">가�?*</label>
                    <input type="number" class="form-control item-price" required placeholder="0">
                </div>
            </div>
            <div class="d-grid mt-2">
                <button type="button" class="btn btn-sm btn-outline-danger remove-item-btn">
                    <i class="bi bi-trash"></i> ???�품 ??��
                </button>
            </div>
        `;
        purchaseItems.appendChild(newItem);
        
        // ??�� 버튼 ?�벤??리스??
        newItem.querySelector('.remove-item-btn').addEventListener('click', function() {
            this.closest('.purchase-item').remove();
        });
    });
    
    // 구매 기록 추�? ???�출 ?�벤??리스??
    document.getElementById('add-purchase-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const customerId = parseInt(document.getElementById('purchase-customer-id').value);
        const date = document.getElementById('purchase-date').value;
        const paymentMethod = document.getElementById('payment-method').value;
        const staff = document.getElementById('purchase-staff').value;
        const store = document.getElementById('purchase-store').value;
        const orderNumber = document.getElementById('purchase-order-number').value;
        const memo = document.getElementById('purchase-memo').value;
        
        // ?�품 ?�이??가?�오�?
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
            alert('?�품??최소 1�??�상 ?�력?�주?�요.');
            return;
        }
        
        // 구매 기록 추�?
        const newPurchase = {
            id: purchases.length > 0 ? Math.max(...purchases.map(p => p.id)) + 1 : 1,
            customerId: customerId,
            date: date,
            items: items,
            totalAmount: totalAmount,
            paymentMethod: paymentMethod,
            staff: staff,
            store: store,
            orderNumber: orderNumber,
            memo: memo
        };
        
        purchases.push(newPurchase);
        
        // 고객 �?구매??�?구매 ?�수 ?�데?�트
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            customer.totalPurchase += totalAmount;
            customer.purchaseCount += 1;
            
            // 고객 ?�급 ?�동 ?�데?�트
            updateCustomerRank(customer);
        }
        
        // ?�이???�??
        saveDataToFirebase();
        
        // 모달 ?�기
        const purchaseModal = bootstrap.Modal.getInstance(document.getElementById('add-purchase-modal'));
        purchaseModal.hide();
        
        // 구매 ?�력 ?�시 로드
        loadCustomerPurchases(customerId);
        
        // 고객 ?�세 ?�보 ?�데?�트 (�?구매?�이 변경되?�을 ???�음)
        openCustomerDetails(customerId);
        
        // ?�림 ?�시
        alert('구매 기록??추�??�었?�니??');
    });
    
    // ?�물 기록 추�? 버튼 ?�벤??리스??
    document.getElementById('add-customer-gift-btn').addEventListener('click', () => {
        const customerId = parseInt(document.querySelector('#customer-info-content').getAttribute('data-customer-id'));
        document.getElementById('gift-customer-id').value = customerId;
        document.getElementById('gift-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('add-gift-form').reset();
        
        const giftModal = new bootstrap.Modal(document.getElementById('add-gift-modal'));
        giftModal.show();
    });
    
    // ?�물 기록 추�? ???�출 ?�벤??리스??
    document.getElementById('add-gift-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const customerId = parseInt(document.getElementById('gift-customer-id').value);
        const type = document.getElementById('gift-type').value;
        const description = document.getElementById('gift-description').value;
        const date = document.getElementById('gift-date').value;
        const reason = document.getElementById('gift-reason').value;
        
        // ???�물 기록 ?�성
        const newGift = {
            id: gifts.length > 0 ? Math.max(...gifts.map(g => g.id)) + 1 : 1,
            customerId,
            type,
            description,
            date,
            reason
        };
        
        // ?�물 기록 추�?
        gifts.push(newGift);
        
        // ?�이???�??
        saveDataToFirebase();
        
        // 모달 ?�기
        const modal = bootstrap.Modal.getInstance(document.getElementById('add-gift-modal'));
        modal.hide();
        
        // ?�물 ?�력 ?�시 로드
        loadCustomerGifts(customerId);
        
        // ?�림 ?�시
        alert('?�물 기록??추�??�었?�니??');
    });
    
    // 방문 기록 추�? 버튼 ?�벤??리스??
    document.getElementById('add-customer-visit-btn').addEventListener('click', () => {
        const customerId = parseInt(document.querySelector('#customer-info-content').getAttribute('data-customer-id'));
        document.getElementById('visit-customer-id').value = customerId;
        document.getElementById('visit-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('add-visit-form').reset();
        
        const visitModal = new bootstrap.Modal(document.getElementById('add-visit-modal'));
        visitModal.show();
    });
    
    // 방문 기록 추�? ???�출 ?�벤??리스??
    document.getElementById('add-visit-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const customerId = parseInt(document.getElementById('visit-customer-id').value);
        const date = document.getElementById('visit-date').value;
        const purpose = document.getElementById('visit-purpose').value;
        const note = document.getElementById('visit-note').value;
        
        // ??방문 기록 ?�성
        const newVisit = {
            id: visits.length > 0 ? Math.max(...visits.map(v => v.id)) + 1 : 1,
            customerId,
            date,
            purpose,
            note
        };
        
        // 방문 기록 추�?
        visits.push(newVisit);
        
        // 고객 ?�보 ?�데?�트 (최근 방문??
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            const visitDate = new Date(date);
            const lastVisitDate = new Date(customer.lastVisit);
            
            if (visitDate > lastVisitDate) {
                customer.lastVisit = date;
            }
        }
        
        // ?�이???�??
        saveDataToFirebase();
        
        // 모달 ?�기
        const modal = bootstrap.Modal.getInstance(document.getElementById('add-visit-modal'));
        modal.hide();
        
        // 방문 ?�력 ?�시 로드
        loadCustomerVisits(customerId);
        
        // ?�림 ?�시
        alert('방문 기록??추�??�었?�니??');
    });

    // 로그???�태 ?�인 ?�수
    function checkLoginStatus() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const username = localStorage.getItem('username');
        
        if (isLoggedIn && username) {
            // 로그???�태�??�면 ?�시 (강제 ?�환)
            performLogin();
        } else {
            // 로그?�웃 ?�태�??�면 ?�시 (강제 ?�환)
            const loginForm = document.getElementById('login-form');
            const mainContent = document.getElementById('main-content');
            
            if (mainContent) {
                mainContent.style.display = 'none';
                mainContent.classList.add('d-none');
            }
            
            if (loginForm) {
                loginForm.style.display = 'block';
                loginForm.classList.remove('d-none');
            }
        }
    }

    // 메인 콘텐츠에 has-mobile-buttons ?�래??추�?
    document.body.classList.add('has-mobile-buttons');
    
    // 모든 고객???�급???�로??기�??�로 ?�데?�트
    updateAllCustomerRanks();
    
    // 모바??고객 ?�록 버튼 ?�벤??리스??
    document.getElementById('mobile-add-customer-btn').addEventListener('click', () => {
        // 고객 ?�록 ?�이지�??�동
        document.querySelector('.nav-link[data-page="add-customer"]').click();
    });

    // ?��? ?�로??버튼 ?�벤??리스??
    document.getElementById('upload-excel-btn').addEventListener('click', handleExcelUpload);

    // ?�플�??�운로드 버튼 ?�벤??리스??
    document.getElementById('download-template-btn').addEventListener('click', downloadExcelTemplate);
    
    // ?��? ?�운로드 버튼 ?�벤??리스??
    document.getElementById('export-excel-btn').addEventListener('click', exportCustomersToExcel);
});

// 고객 목록 ?�더�??�수
function renderCustomerList(customerList) {
    const tbody = document.getElementById('customer-list-body');
    tbody.innerHTML = '';
    
    customerList.forEach((customer, index) => {
        const tr = document.createElement('tr');
        
        // ?�급???�른 배�? ?�래???�정
        let rankBadgeClass = '';
        if (customer.rank === 'vvip') rankBadgeClass = 'badge-vvip';
        else if (customer.rank === 'vip') rankBadgeClass = 'badge-vip';
        else rankBadgeClass = 'badge-regular';
        
        // ?��? ?�급 변??
        let rankText = '';
        if (customer.rank === 'vvip') rankText = 'VVIP';
        else if (customer.rank === 'vip') rankText = 'VIP';
        else rankText = '?�반';

        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${customer.name}</td>
            <td>${formatPhoneNumber(customer.phone)}</td>
            <td class="mobile-hide">${formatDate(customer.birthdate)}</td>
            <td class="mobile-hide">${customer.preferredStore || '-'}</td>
            <td><span class="badge ${rankBadgeClass}">${rankText}</span></td>
            <td class="mobile-hide">${formatDate(customer.lastVisit)}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary view-details" data-customer-id="${customer.id}" title="?�세보기">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-customer" data-customer-id="${customer.id}" title="??��">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // ?�세보기 버튼 ?�벤??리스??추�?
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', () => {
            const customerId = parseInt(button.getAttribute('data-customer-id'));
            // ??창에??고객 ?�세 ?�보 ?�이지 ?�기
            window.open(`customer-details.html?id=${customerId}`, `customer_${customerId}`, 'width=1000,height=800');
        });
    });
    
    // ??�� 버튼 ?�벤??리스??추�?
    document.querySelectorAll('.delete-customer').forEach(button => {
        button.addEventListener('click', () => {
            const customerId = parseInt(button.getAttribute('data-customer-id'));
            deleteCustomer(customerId);
        });
    });
}

// 고객 목록 로드 ?�수
function loadCustomerList() {
    // 검?�창 초기??
    document.getElementById('search-input').value = '';
    // ?�렬 ?�태 초기??
    currentSort = { field: null, order: 'asc' };
    // ?�체 고객 목록 ?�시
    renderCustomerList(customers);
    // ?�더 ?�벤??리스???�등�?
    attachSortListeners();
}

// ?�일 ?�림 로드 ?�수
function loadBirthdayAlerts() {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    
    // ?�번 ???�일 고객
    const thisMonthBirthdays = customers.filter(customer => {
        if (!customer.birthdate) return false;
        try {
            const birthMonth = parseInt(customer.birthdate.split('-')[1]);
            return birthMonth === currentMonth;
        } catch (e) {
            return false;
        }
    });
    
    // ?�음 ???�일 고객
    const nextMonthBirthdays = customers.filter(customer => {
        if (!customer.birthdate) return false;
        try {
            const birthMonth = parseInt(customer.birthdate.split('-')[1]);
            return birthMonth === nextMonth;
        } catch (e) {
            return false;
        }
    });
    
    // ?�번 ???�일 목록 ?�더�?
    const thisMonthList = document.getElementById('this-month-birthdays');
    thisMonthList.innerHTML = '';
    
    if (thisMonthBirthdays.length === 0) {
        thisMonthList.innerHTML = '<li class="list-group-item">?�번 ???�일??고객???�습?�다.</li>';
    } else {
        thisMonthBirthdays.forEach(customer => {
            try {
                const birthDay = parseInt(customer.birthdate.split('-')[2]);
                const today = new Date().getDate();
                const li = document.createElement('li');
                li.className = 'list-group-item';
                
                // ?�늘???�일??고객 강조
                if (birthDay === today) {
                    li.classList.add('list-group-item-danger');
                }
                
                li.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${customer.name}</strong> (${customer.rank.toUpperCase()})
                            <div><small>${customer.phone}</small></div>
                        </div>
                        <div class="birthday-date">${customer.birthdate.split('-')[1]}??${birthDay}??/div>
                    </div>
                `;
                thisMonthList.appendChild(li);
            } catch (e) {
                console.log('?�년?�일 처리 �??�류:', e);
            }
        });
    }
    
    // ?�음 ???�일 목록 ?�더�?
    const nextMonthList = document.getElementById('next-month-birthdays');
    nextMonthList.innerHTML = '';
    
    if (nextMonthBirthdays.length === 0) {
        nextMonthList.innerHTML = '<li class="list-group-item">?�음 ???�일??고객???�습?�다.</li>';
    } else {
        nextMonthBirthdays.forEach(customer => {
            try {
                const birthDay = parseInt(customer.birthdate.split('-')[2]);
                const li = document.createElement('li');
                li.className = 'list-group-item';
                
                li.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${customer.name}</strong> (${customer.rank.toUpperCase()})
                            <div><small>${customer.phone}</small></div>
                        </div>
                        <div class="birthday-date">${nextMonth}??${birthDay}??/div>
                    </div>
                `;
                nextMonthList.appendChild(li);
            } catch (e) {
                console.log('?�년?�일 처리 �??�류:', e);
            }
        });
    }
}

// 고객�?구매 ?�보 ?�계???�수
function recalculateCustomerPurchaseInfo() {
    customers.forEach(customer => {
        // ?�당 고객??모든 구매 기록 찾기
        const customerPurchases = purchases.filter(p => p.customerId === customer.id);
        
        // �?구매?�과 구매 ?�수 ?�계??
        let totalPurchase = 0;
        let purchaseCount = customerPurchases.length;
        
        customerPurchases.forEach(purchase => {
            totalPurchase += purchase.totalAmount || 0;
        });
        
        // 고객 ?�보 ?�데?�트
        customer.totalPurchase = totalPurchase;
        customer.purchaseCount = purchaseCount;
        
        // ?�급 ?�데?�트
        updateCustomerRank(customer);
    });
    
    // ?�이???�??
    saveDataToFirebase();
}

// 고객 ?�급�?카운??로드 ?�수
function loadRankingCounts() {
    // 구매 ?�보 ?�계??
    recalculateCustomerPurchaseInfo();
    
    const vvipCount = customers.filter(c => c.rank === 'vvip').length;
    const vipCount = customers.filter(c => c.rank === 'vip').length;
    const regularCount = customers.filter(c => c.rank === 'regular').length;
    
    document.getElementById('vvip-count').textContent = vvipCount;
    document.getElementById('vip-count').textContent = vipCount;
    document.getElementById('regular-count').textContent = regularCount;
    
    // 고객 ?�급 목록 ?�더�?(?�급???�렬)
    const tbody = document.getElementById('ranking-list-body');
    tbody.innerHTML = '';
    
    // ?�급 ?�서�??�렬 (VVIP > VIP > ?�반)
    const sortedCustomers = [...customers].sort((a, b) => {
        const rankOrder = { 'vvip': 3, 'vip': 2, 'regular': 1 };
        if (rankOrder[a.rank] !== rankOrder[b.rank]) {
            return rankOrder[b.rank] - rankOrder[a.rank];
        }
        // 같�? ?�급 ?�에?�는 �?구매???�으�??�렬
        return (b.totalPurchase || 0) - (a.totalPurchase || 0);
    });
    
    sortedCustomers.forEach((customer, index) => {
        const tr = document.createElement('tr');
        
        // ?�급???�른 배�? ?�래???�정
        let rankBadgeClass = '';
        if (customer.rank === 'vvip') rankBadgeClass = 'badge-vvip';
        else if (customer.rank === 'vip') rankBadgeClass = 'badge-vip';
        else rankBadgeClass = 'badge-regular';
        
        // ?��? ?�급 변??
        let rankText = '';
        if (customer.rank === 'vvip') rankText = 'VVIP';
        else if (customer.rank === 'vip') rankText = 'VIP';
        else rankText = '?�반';
        
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${customer.name}</td>
            <td><span class="badge ${rankBadgeClass}">${rankText}</span></td>
            <td>${formatCurrency(customer.totalPurchase || 0)}</td>
            <td>${customer.purchaseCount || 0}??/td>
            <td><button class="btn btn-sm btn-outline-secondary view-rank-history" data-customer-id="${customer.id}">?�급 변�??�력</button></td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // ?�급 변�??�력 버튼 ?�벤??리스??
    document.querySelectorAll('.view-rank-history').forEach(button => {
        button.addEventListener('click', () => {
            const customerId = parseInt(button.getAttribute('data-customer-id'));
            viewRankChangeHistory(customerId);
        });
    });
}

// ?�물 ?�력 ?�더�??�수
function renderGiftHistory(giftList) {
    const tbody = document.getElementById('gift-history-body');
    tbody.innerHTML = '';
    
    giftList.forEach((gift, index) => {
        const customer = customers.find(c => c.id === gift.customerId);
        if (customer) {
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${customer.name}</td>
                <td>${gift.type}</td>
                <td>${gift.description}</td>
                <td>${formatDate(gift.date)}</td>
                <td>${gift.reason}</td>
                <td><button class="btn btn-sm btn-outline-primary view-customer-details" data-customer-id="${customer.id}">?�세보기</button></td>
            `;
            
            tbody.appendChild(tr);
        }
    });
    
    if (giftList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">검??결과가 ?�습?�다.</td></tr>';
    }
    
    // ?�물 ?�력?�서 고객 ?�세보기 버튼 ?�벤??리스??
    document.querySelectorAll('.view-customer-details').forEach(button => {
        button.addEventListener('click', () => {
            const customerId = parseInt(button.getAttribute('data-customer-id'));
            // ??창에??고객 ?�세 ?�보 ?�이지 ?�기 (?�물 ???�성??
            window.open(`customer-details.html?id=${customerId}#gift-tab`, `customer_${customerId}`, 'width=1000,height=800');
        });
    });
}

// 방문 주기 ?�약 계산 ?�수
function getVisitSummary() {
    const summary = [];
    
    customers.forEach(customer => {
        // 고객�?방문 ?�역
        const customerVisits = visits.filter(v => v.customerId === customer.id);
        
        if (customerVisits.length > 0) {
            // 방문 ?�짜 ?�렬
            const sortedDates = customerVisits.map(v => new Date(v.date))
                .sort((a, b) => b - a);
            
            // 최근 방문??
            const lastVisit = sortedDates[0];
            
            // 방문 주기 계산 (?�균 ?�수)
            let averageCycle = 0;
            if (sortedDates.length > 1) {
                let totalDays = 0;
                for (let i = 0; i < sortedDates.length - 1; i++) {
                    const diffTime = Math.abs(sortedDates[i] - sortedDates[i + 1]);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    totalDays += diffDays;
                }
                averageCycle = Math.round(totalDays / (sortedDates.length - 1));
            }
            
            // ?�음 ?�상 방문??
            const nextExpectedVisit = new Date(lastVisit);
            nextExpectedVisit.setDate(nextExpectedVisit.getDate() + averageCycle);
            
            // ?�늘�??�음 ?�상 방문???�이???�수
            const today = new Date();
            const diffTime = nextExpectedVisit - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // ?�약 ?�보 추�?
            summary.push({
                id: customer.id,
                name: customer.name,
                lastVisit: lastVisit.toISOString().split('T')[0],
                averageCycle: averageCycle,
                visitCount: customerVisits.length,
                nextExpectedVisit: nextExpectedVisit.toISOString().split('T')[0],
                daysUntilNextVisit: diffDays
            });
        }
    });
    
    return summary;
}

// 방문 주기 관�??�더�??�수
function renderVisitTracking(summaryList) {
    const tbody = document.getElementById('visit-list-body');
    tbody.innerHTML = '';
    
    summaryList.forEach((summary, index) => {
        const tr = document.createElement('tr');
        
        // ?�음 방문 ?�정?�에 ?�른 ?�래???�정
        let visitClass = '';
        if (summary.daysUntilNextVisit < 0) {
            visitClass = 'visit-due'; // 방문 ?�정??지??
        } else if (summary.daysUntilNextVisit <= 7) {
            visitClass = 'visit-upcoming'; // 방문 ?�정???�주???�내
        } else {
            visitClass = 'visit-recent'; // 최근 방문
        }
        
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${summary.name}</td>
            <td>${formatDate(summary.lastVisit)}</td>
            <td>${summary.averageCycle > 0 ? summary.averageCycle + '?? : '-'}</td>
            <td>${summary.visitCount}??/td>
            <td class="${visitClass}">${formatDate(summary.nextExpectedVisit)}</td>
            <td><button class="btn btn-sm btn-outline-primary view-visit-details" data-customer-id="${summary.id}">?�세보기</button></td>
        `;
        
        tbody.appendChild(tr);
    });
    
    if (summaryList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">검??결과가 ?�습?�다.</td></tr>';
    }
    
    // ?�세보기 버튼 ?�벤??리스??추�?
    document.querySelectorAll('.view-visit-details').forEach(button => {
        button.addEventListener('click', () => {
            const customerId = parseInt(button.getAttribute('data-customer-id'));
            // ??창에??고객 ?�세 ?�보 ?�이지 ?�기 (방문 ???�성??
            window.open(`customer-details.html?id=${customerId}#visit-tab`, `customer_${customerId}`, 'width=1000,height=800');
        });
    });
}

// 고객 ?�세 ?�보 모달 ?�기
function openCustomerDetails(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    const customerInfo = document.getElementById('customer-info-content');
    customerInfo.setAttribute('data-customer-id', customerId);
    
    // 고객 기본 ?�보 ?�시
    let genderText = '';
    if (customer.gender === 'male') genderText = '?�성';
    else if (customer.gender === 'female') genderText = '?�성';
    
    // ?�급???�른 배�? ?�래???�정
    let rankBadgeClass = '';
    if (customer.rank === 'vvip') rankBadgeClass = 'badge-vvip';
    else if (customer.rank === 'vip') rankBadgeClass = 'badge-vip';
    else rankBadgeClass = 'badge-regular';
    
    // ?��? ?�급 변??
    let rankText = '';
    if (customer.rank === 'vvip') rankText = 'VVIP';
    else if (customer.rank === 'vip') rankText = 'VIP';
    else rankText = '?�반';
    
    const customerHtml = `
        <div class="customer-detail-header mb-4">
            <h3>${customer.name} <small class="text-muted">(${genderText})</small></h3>
            <div class="d-flex flex-wrap gap-3 align-items-center mt-2">
                <div>
                    <span class="badge ${rankBadgeClass}">${rankText}</span>
                    <button class="btn btn-sm btn-outline-secondary ms-2 view-rank-history" data-customer-id="${customer.id}">
                        <i class="bi bi-clock-history"></i> ?�급 ?�력
                    </button>
                </div>
                <div><i class="bi bi-telephone"></i> ${customer.phone}</div>
                ${customer.email ? `<div><i class="bi bi-envelope"></i> ${customer.email}</div>` : ''}
                ${customer.birthdate ? `<div><i class="bi bi-calendar"></i> ${formatDate(customer.birthdate)}</div>` : ''}
            </div>
        </div>
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card h-100">
                    <div class="card-header">기본 ?�보</div>
                    <div class="card-body">
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item d-flex justify-content-between">
                                <span>주소</span>
                                <span class="text-muted">${customer.address || '-'}</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between">
                                <span>주방문매??/span>
                                <span class="text-muted">${customer.preferredStore || '-'}</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between">
                                <span>최근 방문??/span>
                                <span class="text-muted">${customer.lastVisit ? formatDate(customer.lastVisit) : '-'}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card h-100">
                    <div class="card-header">구매 ?�보</div>
                    <div class="card-body">
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item d-flex justify-content-between">
                                <span>�?구매??/span>
                                <span class="text-primary fw-bold">${formatCurrency(customer.totalPurchase)}</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between">
                                <span>구매 ?�수</span>
                                <span>${customer.purchaseCount}??/span>
                            </li>
                            <li class="list-group-item">
                                <div class="d-flex justify-content-between mb-2">
                                    <span>메모</span>
                                    <button class="btn btn-sm btn-outline-secondary" id="edit-note-btn">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                </div>
                                <div id="customer-note">${customer.notes || '-'}</div>
                                <div id="note-edit-form" class="d-none">
                                    <div class="input-group mb-2">
                                        <textarea class="form-control" id="note-input">${customer.notes || ''}</textarea>
                                    </div>
                                    <div class="d-flex justify-content-end">
                                        <button class="btn btn-sm btn-secondary me-2" id="cancel-note-btn">취소</button>
                                        <button class="btn btn-sm btn-primary" id="save-note-btn">?�??/button>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    customerInfo.innerHTML = customerHtml;
    
    // 메모 ?�집 버튼 ?�벤??리스??
    document.getElementById('edit-note-btn').addEventListener('click', () => {
        document.getElementById('customer-note').classList.add('d-none');
        document.getElementById('note-edit-form').classList.remove('d-none');
    });
    
    // 메모 ?�집 취소 버튼 ?�벤??리스??
    document.getElementById('cancel-note-btn').addEventListener('click', () => {
        document.getElementById('customer-note').classList.remove('d-none');
        document.getElementById('note-edit-form').classList.add('d-none');
    });
    
    // 메모 ?�??버튼 ?�벤??리스??
    document.getElementById('save-note-btn').addEventListener('click', () => {
        const newNote = document.getElementById('note-input').value;
        customer.notes = newNote;
        
        // ?�이???�??
        saveDataToFirebase();
        
        // UI ?�데?�트
        document.getElementById('customer-note').innerHTML = newNote || '-';
        document.getElementById('customer-note').classList.remove('d-none');
        document.getElementById('note-edit-form').classList.add('d-none');
    });
    
    // ?�급 변�??�력 버튼 ?�벤??리스??
    document.querySelector('.view-rank-history').addEventListener('click', () => {
        viewRankChangeHistory(customerId);
    });
    
    // �?번째 ??(구매 ?�력) 로드
    loadCustomerPurchases(customerId);
    
    // 모달 ?�시
    const customerDetailsModal = new bootstrap.Modal(document.getElementById('customer-details-modal'));
    customerDetailsModal.show();
}

// 고객�?구매 ?�력 로드 ?�수
function loadCustomerPurchases(customerId) {
    const customerPurchases = purchases.filter(p => p.customerId === customerId);
    const purchaseContent = document.getElementById('purchase-history-content');
    purchaseContent.setAttribute('data-customer-id', customerId);
    
    if (customerPurchases.length === 0) {
        purchaseContent.innerHTML = '<p class="text-center">구매 ?�력???�습?�다.</p>';
        return;
    }
    
    let html = '<div class="table-responsive"><table class="table table-striped">';
    html += '<thead><tr><th>구매??/th><th>구매?�품</th><th>결제금액</th><th>주문?�번??/th><th>구매매장</th><th>?�당?�??/th><th>메모</th><th>결제방법</th><th>관�?/th></tr></thead><tbody>';
    
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
    
    // 구매 ?�력 ?�정 버튼 ?�벤??리스??
    document.querySelectorAll('.edit-purchase').forEach(button => {
        button.addEventListener('click', () => {
            const purchaseId = parseInt(button.getAttribute('data-purchase-id'));
            editPurchaseRecord(purchaseId, customerId);
        });
    });
    
    // 구매 ?�력 ??�� 버튼 ?�벤??리스??
    document.querySelectorAll('.delete-purchase').forEach(button => {
        button.addEventListener('click', () => {
            const purchaseId = parseInt(button.getAttribute('data-purchase-id'));
            deletePurchaseRecord(purchaseId, customerId);
        });
    });
}

// 고객�??�물 ?�력 로드 ?�수
function loadCustomerGifts(customerId) {
    const customerGifts = gifts.filter(g => g.customerId === customerId);
    const giftContent = document.getElementById('gift-history-content');
    
    if (customerGifts.length === 0) {
        giftContent.innerHTML = '<p class="text-center">?�물 ?�력???�습?�다.</p>';
        return;
    }
    
    let html = '<div class="table-responsive"><table class="table table-striped">';
    html += '<thead><tr><th>?�짜</th><th>?�물 종류</th><th>?�물 ?�용</th><th>?�공 ?�유</th><th>관�?/th></tr></thead><tbody>';
    
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
    
    // ?�물 ?�력 ?�정 버튼 ?�벤??리스??
    document.querySelectorAll('.edit-gift').forEach(button => {
        button.addEventListener('click', () => {
            const giftId = parseInt(button.getAttribute('data-gift-id'));
            editGiftRecord(giftId, customerId);
        });
    });
    
    // ?�물 ?�력 ??�� 버튼 ?�벤??리스??
    document.querySelectorAll('.delete-gift').forEach(button => {
        button.addEventListener('click', () => {
            const giftId = parseInt(button.getAttribute('data-gift-id'));
            deleteGiftRecord(giftId, customerId);
        });
    });
}

// 고객�?방문 ?�력 로드 ?�수
function loadCustomerVisits(customerId) {
    const customerVisits = visits.filter(v => v.customerId === customerId);
    const visitContent = document.getElementById('visit-history-content');
    
    if (customerVisits.length === 0) {
        visitContent.innerHTML = '<p class="text-center">방문 ?�력???�습?�다.</p>';
        return;
    }
    
    // 방문 ?�짜 기�??�로 ?�렬 (최신??
    const sortedVisits = [...customerVisits].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    let html = '<div class="table-responsive"><table class="table table-striped">';
    html += '<thead><tr><th>?�짜</th><th>방문 목적</th><th>메모</th><th>관�?/th></tr></thead><tbody>';
    
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
    
    // 방문 ?�력 ?�정 버튼 ?�벤??리스??
    document.querySelectorAll('.edit-visit').forEach(button => {
        button.addEventListener('click', () => {
            const visitId = parseInt(button.getAttribute('data-visit-id'));
            editVisitRecord(visitId, customerId);
        });
    });
    
    // 방문 ?�력 ??�� 버튼 ?�벤??리스??
    document.querySelectorAll('.delete-visit').forEach(button => {
        button.addEventListener('click', () => {
            const visitId = parseInt(button.getAttribute('data-visit-id'));
            deleteVisitRecord(visitId, customerId);
        });
    });
}

// 구매 ?�력 PDF ?�성 ?�수
function generatePurchasePDF(customerId) {
    const customer = customers.find(c => c.id === customerId);
    const customerPurchases = purchases.filter(p => p.customerId === customerId);
    
    if (!customer || customerPurchases.length === 0) {
        alert('PDF�?변?�할 구매 ?�력???�습?�다.');
        return;
    }
    
    // PDF ?�성
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // ?�목
    doc.setFontSize(18);
    doc.text('?�서?�그?�이??고객 구매 ?�력', 14, 20);
    
    // 고객 ?�보
    doc.setFontSize(12);
    doc.text(`고객�? ${customer.name}`, 14, 30);
    doc.text(`?�락�? ${customer.phone}`, 14, 37);
    doc.text(`?�급: ${customer.rank.toUpperCase()}`, 14, 44);
    doc.text(`�?구매?? ${formatCurrency(customer.totalPurchase)}`, 14, 51);
    
    // 구매 ?�력 ?�이�?
    doc.setFontSize(14);
    doc.text('구매 ?�력', 14, 65);
    
    let yPosition = 75;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    customerPurchases.forEach((purchase, index) => {
        // ?�이지 ?�인 �????�이지 추�?
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }
        
        // 구매 ?�보
        doc.setFontSize(12);
        doc.text(`${index + 1}. 구매?? ${formatDate(purchase.date)}`, 14, yPosition);
        yPosition += 7;
        doc.text(`   결제 금액: ${formatCurrency(purchase.totalAmount)}`, 14, yPosition);
        yPosition += 7;
        doc.text(`   결제 방법: ${purchase.paymentMethod}`, 14, yPosition);
        yPosition += 7;
        
        // 주문?�번??추�?
        if (purchase.orderNumber) {
            doc.text(`   주문?�번?? ${purchase.orderNumber}`, 14, yPosition);
            yPosition += 7;
        }
        
        // 구매매장 ?�보 추�?
        if (purchase.store) {
            doc.text(`   구매매장: ${purchase.store}`, 14, yPosition);
            yPosition += 7;
        }
        
        // ?�당?�???�보 추�?
        if (purchase.staff) {
            doc.text(`   ?�당?�?? ${purchase.staff}`, 14, yPosition);
            yPosition += 7;
        }
        
        // 메모 ?�보 추�?
        if (purchase.memo) {
            doc.text(`   메모: ${purchase.memo}`, 14, yPosition);
            yPosition += 7;
        }
        
        // 구매 ??��
        doc.text('   구매 ?�품:', 14, yPosition);
        yPosition += 7;
        
        purchase.items.forEach(item => {
            doc.text(`   - ${item.name}: ${formatCurrency(item.price)}`, 20, yPosition);
            yPosition += 7;
        });
        
        // 구분??
        doc.setDrawColor(200, 200, 200);
        doc.line(14, yPosition, pageWidth - 14, yPosition);
        yPosition += 10;
    });
    
    // ?�짜 ?�식???�일�??�성
    const today = new Date();
    const fileName = `${customer.name}_구매?�력_${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}.pdf`;
    
    // PDF ?�??
    doc.save(fileName);
}

// 고객 ?�보 ?�집 ?�수
function editCustomerInfo(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    // ?�재 모달???�기�??�집 모달 ?�시
    const currentModal = bootstrap.Modal.getInstance(document.getElementById('customer-details-modal'));
    currentModal.hide();
    
    // ?�집 ???�성
    const editForm = `
    <div class="modal fade" id="edit-customer-modal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">고객 ?�보 ?�정</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="edit-customer-form">
                        <input type="hidden" id="edit-customer-id" value="${customer.id}">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="edit-name" class="form-label">?�름</label>
                                    <input type="text" class="form-control" id="edit-name" value="${customer.name}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-gender" class="form-label">?�별</label>
                                    <select class="form-control" id="edit-gender">
                                        <option value="" ${!customer.gender ? 'selected' : ''}>?�택 ?�함</option>
                                        <option value="male" ${customer.gender === 'male' ? 'selected' : ''}>?�성</option>
                                        <option value="female" ${customer.gender === 'female' ? 'selected' : ''}>?�성</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-phone" class="form-label">?�화번호</label>
                                    <input type="tel" class="form-control" id="edit-phone" value="${customer.phone}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-birthdate" class="form-label">?�년?�일</label>
                                    <input type="date" class="form-control" id="edit-birthdate" value="${customer.birthdate}">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="edit-address" class="form-label">주소</label>
                                    <input type="text" class="form-control" id="edit-address" value="${customer.address || ''}">
                                </div>
                                <div class="mb-3">
                                    <label for="edit-preferred-store" class="form-label">주방문매??/label>
                                    <input type="text" class="form-control" id="edit-preferred-store" value="${customer.preferredStore || ''}">
                                </div>
                                <div class="mb-3">
                                    <label for="edit-email" class="form-label">?�메??/label>
                                    <input type="email" class="form-control" id="edit-email" value="${customer.email || ''}">
                                </div>
                                <div class="mb-3">
                                    <label for="edit-rank" class="form-label">?�급</label>
                                    <select class="form-control" id="edit-rank">
                                        <option value="vvip" ${customer.rank === 'vvip' ? 'selected' : ''}>VVIP</option>
                                        <option value="vip" ${customer.rank === 'vip' ? 'selected' : ''}>VIP</option>
                                        <option value="regular" ${customer.rank === 'regular' ? 'selected' : ''}>?�반</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="edit-notes" class="form-label">메모</label>
                            <textarea class="form-control" id="edit-notes" rows="3">${customer.notes || ''}</textarea>
                        </div>
                        <div class="text-end">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">취소</button>
                            <button type="submit" class="btn btn-primary">?�??/button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // ?�집 모달???��? ?�으�??�거
    const existingModal = document.getElementById('edit-customer-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // ?�집 모달 추�? �??�시
    document.body.insertAdjacentHTML('beforeend', editForm);
    const editModal = new bootstrap.Modal(document.getElementById('edit-customer-modal'));
    editModal.show();
    
    // ?�집 ???�출 ?�벤??리스??
    document.getElementById('edit-customer-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        // ?�정???�이??가?�오�?
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
        
        // 고객 ?�이???�데?�트
        const index = customers.findIndex(c => c.id === editedCustomer.id);
        if (index !== -1) {
            customers[index] = editedCustomer;
            
            // ?�이???�??
            saveDataToFirebase();
        }
        
        // 모달 ?�기
        editModal.hide();
        
        // 고객 목록 ?�로고침
        loadCustomerList();
        
        // ?�세 ?�보 모달 ?�시 ?�기
        setTimeout(() => {
            openCustomerDetails(editedCustomer.id);
        }, 500);
    });
}

// ?�짜 ?�맷 ?�수 (YYYY-MM-DD -> YYYY??MM??DD??
function formatDate(dateString) {
    if (!dateString) return '-';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    
    return `${parts[0]}??${parts[1]}??${parts[2]}??;
}

// 금액 ?�맷 ?�수 (1000000 -> 1,000,000??
function formatCurrency(amount) {
    return amount.toLocaleString('ko-KR') + '??;
}

// ?�화번호 ?�맷???�수
function formatPhoneNumber(phone) {
    if (!phone) return '-';
    
    // ?�자�?추출
    const cleaned = phone.replace(/\D/g, '');
    
    // 11?�리 ?��???번호 (010-xxxx-xxxx)
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }
    // 10?�리 번호 (010-xxx-xxxx ?�는 02-xxx-xxxx)
    else if (cleaned.length === 10) {
        if (cleaned.startsWith('02')) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
        } else {
            return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
        }
    }
    // 8?�리 번호 (02-xxx-xxxx)
    else if (cleaned.length === 8) {
        return cleaned.replace(/(\d{4})(\d{4})/, '02-$1-$2');
    }
    // 기�? ?�식?� ?�본 반환
    else {
        return phone;
    }
}

// 고객 ?�급 ?�데?�트 ?�수
function updateCustomerRank(customer) {
    const oldRank = customer.rank;
    
    // ???�급 기�?: 2천만???�상 VVIP, 천만???�상 VIP, ?�머지 ?�반
    if (customer.totalPurchase >= 20000000) {
        customer.rank = 'vvip';
    } else if (customer.totalPurchase >= 10000000) {
        customer.rank = 'vip';
    } else {
        customer.rank = 'regular';
    }
    
    // ?�급??변경되?�을 경우 ?�력 추�?
    if (oldRank !== customer.rank) {
        const rankChange = {
            id: rankChanges.length > 0 ? Math.max(...rankChanges.map(r => r.id)) + 1 : 1,
            customerId: customer.id,
            oldRank: oldRank,
            newRank: customer.rank,
            reason: `구매 ?�적 금액 ${formatCurrency(customer.totalPurchase)}???�른 ?�동 ?�급 변�?,
            date: new Date().toISOString().split('T')[0],
            changedBy: localStorage.getItem('username') || '?�스??
        };
        
        rankChanges.push(rankChange);
        saveDataToFirebase();
    }
    
    return customer;
}

// 모든 고객???�급???�로??기�??�로 ?�데?�트?�는 ?�수
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
        console.log(`${updatedCount}명의 고객 ?�급???�로??기�??�로 ?�데?�트?�었?�니??`);
    }
}

// 고객 ??�� ?�수
function deleteCustomer(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    // ??�� ?�인
    if (confirm(`?�말�?${customer.name} 고객???�보�???��?�시겠습?�까? ???�업?� ?�돌�????�습?�다.`)) {
        // 관?�된 구매 ?�력, ?�물 ?�력, 방문 ?�력???�께 ??��
        const customerPurchases = purchases.filter(p => p.customerId === customerId);
        const customerGifts = gifts.filter(g => g.customerId === customerId);
        const customerVisits = visits.filter(v => v.customerId === customerId);
        
        // 구매 ?�력 ??��
        customerPurchases.forEach(purchase => {
            const index = purchases.findIndex(p => p.id === purchase.id);
            if (index !== -1) {
                purchases.splice(index, 1);
            }
        });
        
        // ?�물 ?�력 ??��
        customerGifts.forEach(gift => {
            const index = gifts.findIndex(g => g.id === gift.id);
            if (index !== -1) {
                gifts.splice(index, 1);
            }
        });
        
        // 방문 ?�력 ??��
        customerVisits.forEach(visit => {
            const index = visits.findIndex(v => v.id === visit.id);
            if (index !== -1) {
                visits.splice(index, 1);
            }
        });
        
        // 고객 ?�보 ??��
        const index = customers.findIndex(c => c.id === customerId);
        if (index !== -1) {
            customers.splice(index, 1);
            
            // ?�이???�??
            saveDataToFirebase();
            
            // 고객 목록 ?�로고침
            loadCustomerList();
            
            // ?�림 ?�시
            alert('고객 ?�보가 ??��?�었?�니??');
        }
    }
}

// 구매 기록 ?�정 ?�수
function editPurchaseRecord(purchaseId, customerId) {
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) return;
    
    // 구매 기록 ?�정 모달 ?�성
    const editForm = `
    <div class="modal fade" id="edit-purchase-modal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">구매 기록 ?�정</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="edit-purchase-form">
                        <input type="hidden" id="edit-purchase-id" value="${purchase.id}">
                        <input type="hidden" id="edit-purchase-customer-id" value="${purchase.customerId}">
                        <div class="mb-3">
                            <label for="edit-purchase-date" class="form-label">구매??/label>
                            <input type="date" class="form-control" id="edit-purchase-date" value="${purchase.date}" required>
                        </div>
                        <div class="card mb-3">
                            <div class="card-header">
                                <small class="text-muted">구매 ?�품 ?�보</small>
                            </div>
                            <div class="card-body">
                                <div id="edit-purchase-items">
                                    ${purchase.items.map((item, index) => `
                                        <div class="purchase-item mb-3">
                                            <div class="row g-2">
                                                <div class="col-12 col-md-7">
                                                    <label class="form-label">?�품�?*</label>
                                                    <input type="text" class="form-control item-name" value="${item.name}" required placeholder="구매?�신 ?�품명을 ?�력?�세??>
                                                </div>
                                                <div class="col-12 col-md-5">
                                                    <label class="form-label">가�?*</label>
                                                    <input type="number" class="form-control item-price" value="${item.price}" required placeholder="0">
                                                </div>
                                            </div>
                                            ${index > 0 ? `
                                                <div class="d-grid mt-2">
                                                    <button type="button" class="btn btn-sm btn-outline-danger remove-item-btn">
                                                        <i class="bi bi-trash"></i> ???�품 ??��
                                                    </button>
                                                </div>
                                            ` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                                <div class="d-grid">
                                    <button type="button" class="btn btn-outline-secondary" id="edit-add-item-btn">
                                        <i class="bi bi-plus-circle"></i> ?�품 추�?
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="edit-purchase-order-number" class="form-label">주문?�번??/label>
                            <input type="text" class="form-control" id="edit-purchase-order-number" value="${purchase.orderNumber || ''}">
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label for="edit-purchase-store" class="form-label">구매매장</label>
                                <input type="text" class="form-control" id="edit-purchase-store" value="${purchase.store || ''}">
                            </div>
                            <div class="col-md-6">
                                <label for="edit-purchase-staff" class="form-label">?�당?�??/label>
                                <input type="text" class="form-control" id="edit-purchase-staff" value="${purchase.staff || ''}">
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="edit-purchase-memo" class="form-label">메모</label>
                            <textarea class="form-control" id="edit-purchase-memo" rows="2">${purchase.memo || ''}</textarea>
                        </div>
                        <div class="mb-3">
                            <label for="edit-payment-method" class="form-label">결제 방법</label>
                            <select class="form-control" id="edit-payment-method" required>
                                <option value="?�용카드" ${purchase.paymentMethod === '?�용카드' ? 'selected' : ''}>?�용카드</option>
                                <option value="?�금" ${purchase.paymentMethod === '?�금' ? 'selected' : ''}>?�금</option>
                                <option value="계좌?�체" ${purchase.paymentMethod === '계좌?�체' ? 'selected' : ''}>계좌?�체</option>
                                <option value="기�?" ${purchase.paymentMethod === '기�?' ? 'selected' : ''}>기�?</option>
                            </select>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">취소</button>
                            <button type="submit" class="btn btn-primary">?�??/button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // 기존 모달???�으�??�거
    const existingModal = document.getElementById('edit-purchase-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 모달 추�? �??�시
    document.body.insertAdjacentHTML('beforeend', editForm);
    const editModal = new bootstrap.Modal(document.getElementById('edit-purchase-modal'));
    editModal.show();
    
    // ?�품 추�? 버튼 ?�벤??리스??
    document.getElementById('edit-add-item-btn').addEventListener('click', () => {
        const purchaseItems = document.getElementById('edit-purchase-items');
        const newItem = document.createElement('div');
        newItem.className = 'purchase-item mb-3';
        newItem.innerHTML = `
            <div class="row g-2">
                <div class="col-12 col-md-7">
                    <label class="form-label">?�품�?*</label>
                    <input type="text" class="form-control item-name" required placeholder="구매?�신 ?�품명을 ?�력?�세??>
                </div>
                <div class="col-12 col-md-5">
                    <label class="form-label">가�?*</label>
                    <input type="number" class="form-control item-price" required placeholder="0">
                </div>
            </div>
            <div class="d-grid mt-2">
                <button type="button" class="btn btn-sm btn-outline-danger remove-item-btn">
                    <i class="bi bi-trash"></i> ???�품 ??��
                </button>
            </div>
        `;
        purchaseItems.appendChild(newItem);
        
        // ??�� 버튼 ?�벤??리스??
        newItem.querySelector('.remove-item-btn').addEventListener('click', function() {
            this.closest('.purchase-item').remove();
        });
    });
    
    // 기존 ?�품 ??�� 버튼 ?�벤??리스??
    document.querySelectorAll('#edit-purchase-items .remove-item-btn').forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.purchase-item').remove();
        });
    });
    
    // ?�정 ???�출 ?�벤??리스??
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
        
        // ?�품 ?�이??가?�오�?
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
            alert('?�품??최소 1�??�상 ?�력?�주?�요.');
            return;
        }
        
        // 구매 기록 ?�정
        const index = purchases.findIndex(p => p.id === purchaseId);
        if (index !== -1) {
            const oldPurchase = purchases[index];
            
            // 고객 �?구매???�데?�트 (기존 금액 빼고 ??금액 추�?)
            const customer = customers.find(c => c.id === customerId);
            if (customer) {
                customer.totalPurchase -= oldPurchase.totalAmount;
                customer.totalPurchase += totalAmount;
                
                // 고객 ?�급 ?�동 ?�데?�트
                updateCustomerRank(customer);
            }
            
            // 구매 기록 ?�데?�트
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
            
            // ?�이???�??
            saveDataToFirebase();
            
            // 모달 ?�기
            editModal.hide();
            
            // 구매 ?�력 ?�시 로드
            loadCustomerPurchases(customerId);
            
            // 고객 ?�세 ?�보 ?�데?�트 (�?구매?�이 변경되?�을 ???�음)
            openCustomerDetails(customerId);
            
            // ?�림 ?�시
            alert('구매 기록???�정?�었?�니??');
        }
    });
}

// 구매 기록 ??�� ?�수
function deletePurchaseRecord(purchaseId, customerId) {
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) return;
    
    // ??�� ?�인
    if (confirm('?�말�???구매 기록????��?�시겠습?�까? ???�업?� ?�돌�????�습?�다.')) {
        // 고객 �?구매??�?구매 ?�수 ?�데?�트
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            customer.totalPurchase -= purchase.totalAmount;
            customer.purchaseCount -= 1;
            
            // 고객 ?�급 ?�동 ?�데?�트
            updateCustomerRank(customer);
        }
        
        // 구매 기록 ??��
        const index = purchases.findIndex(p => p.id === purchaseId);
        if (index !== -1) {
            purchases.splice(index, 1);
            
            // ?�이???�??
            saveDataToFirebase();
            
            // 구매 ?�력 ?�시 로드
            loadCustomerPurchases(customerId);
            
            // 고객 ?�세 ?�보 ?�데?�트 (�?구매?�이 변경되?�을 ???�음)
            openCustomerDetails(customerId);
            
            // ?�림 ?�시
            alert('구매 기록????��?�었?�니??');
        }
    }
}

// ?�물 기록 ?�정 ?�수
function editGiftRecord(giftId, customerId) {
    const gift = gifts.find(g => g.id === giftId);
    if (!gift) return;
    
    // ?�물 기록 ?�정 모달 ?�성
    const editForm = `
    <div class="modal fade" id="edit-gift-modal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">?�물 기록 ?�정</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="edit-gift-form">
                        <input type="hidden" id="edit-gift-id" value="${gift.id}">
                        <input type="hidden" id="edit-gift-customer-id" value="${gift.customerId}">
                        <div class="mb-3">
                            <label for="edit-gift-type" class="form-label">?�물 종류</label>
                            <select class="form-control" id="edit-gift-type" required>
                                <option value="?�일?�물" ${gift.type === '?�일?�물' ? 'selected' : ''}>?�일?�물</option>
                                <option value="?�말?�물" ${gift.type === '?�말?�물' ? 'selected' : ''}>?�말?�물</option>
                                <option value="감사?�물" ${gift.type === '감사?�물' ? 'selected' : ''}>감사?�물</option>
                                <option value="기�?" ${gift.type === '기�?' ? 'selected' : ''}>기�?</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="edit-gift-description" class="form-label">?�물 ?�용</label>
                            <input type="text" class="form-control" id="edit-gift-description" value="${gift.description}" required>
                        </div>
                        <div class="mb-3">
                            <label for="edit-gift-date" class="form-label">?�공??/label>
                            <input type="date" class="form-control" id="edit-gift-date" value="${gift.date}" required>
                        </div>
                        <div class="mb-3">
                            <label for="edit-gift-reason" class="form-label">?�공 ?�유</label>
                            <input type="text" class="form-control" id="edit-gift-reason" value="${gift.reason}" required>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">취소</button>
                            <button type="submit" class="btn btn-primary">?�??/button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // 기존 모달???�으�??�거
    const existingModal = document.getElementById('edit-gift-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 모달 추�? �??�시
    document.body.insertAdjacentHTML('beforeend', editForm);
    const editModal = new bootstrap.Modal(document.getElementById('edit-gift-modal'));
    editModal.show();
    
    // ?�정 ???�출 ?�벤??리스??
    document.getElementById('edit-gift-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const giftId = parseInt(document.getElementById('edit-gift-id').value);
        const customerId = parseInt(document.getElementById('edit-gift-customer-id').value);
        const type = document.getElementById('edit-gift-type').value;
        const description = document.getElementById('edit-gift-description').value;
        const date = document.getElementById('edit-gift-date').value;
        const reason = document.getElementById('edit-gift-reason').value;
        
        // ?�물 기록 ?�정
        const index = gifts.findIndex(g => g.id === giftId);
        if (index !== -1) {
            // ?�물 기록 ?�데?�트
            gifts[index] = {
                ...gifts[index],
                type,
                description,
                date,
                reason
            };
            
            // ?�이???�??
            saveDataToFirebase();
            
            // 모달 ?�기
            editModal.hide();
            
            // ?�물 ?�력 ?�시 로드
            loadCustomerGifts(customerId);
            
            // ?�림 ?�시
            alert('?�물 기록???�정?�었?�니??');
        }
    });
}

// ?�물 기록 ??�� ?�수
function deleteGiftRecord(giftId, customerId) {
    const gift = gifts.find(g => g.id === giftId);
    if (!gift) return;
    
    // ??�� ?�인
    if (confirm('?�말�????�물 기록????��?�시겠습?�까? ???�업?� ?�돌�????�습?�다.')) {
        // ?�물 기록 ??��
        const index = gifts.findIndex(g => g.id === giftId);
        if (index !== -1) {
            gifts.splice(index, 1);
            
            // ?�이???�??
            saveDataToFirebase();
            
            // ?�물 ?�력 ?�시 로드
            loadCustomerGifts(customerId);
            
            // ?�림 ?�시
            alert('?�물 기록????��?�었?�니??');
        }
    }
}

// 방문 기록 ?�정 ?�수
function editVisitRecord(visitId, customerId) {
    const visit = visits.find(v => v.id === visitId);
    if (!visit) return;
    
    // 방문 기록 ?�정 모달 ?�성
    const editForm = `
    <div class="modal fade" id="edit-visit-modal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">방문 기록 ?�정</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="edit-visit-form">
                        <input type="hidden" id="edit-visit-id" value="${visit.id}">
                        <input type="hidden" id="edit-visit-customer-id" value="${visit.customerId}">
                        <div class="mb-3">
                            <label for="edit-visit-date" class="form-label">방문??/label>
                            <input type="date" class="form-control" id="edit-visit-date" value="${visit.date}" required>
                        </div>
                        <div class="mb-3">
                            <label for="edit-visit-purpose" class="form-label">방문 목적</label>
                            <input type="text" class="form-control" id="edit-visit-purpose" value="${visit.purpose}" required>
                        </div>
                        <div class="mb-3">
                            <label for="edit-visit-note" class="form-label">메모</label>
                            <textarea class="form-control" id="edit-visit-note" rows="3">${visit.note || ''}</textarea>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">취소</button>
                            <button type="submit" class="btn btn-primary">?�??/button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // 기존 모달???�으�??�거
    const existingModal = document.getElementById('edit-visit-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 모달 추�? �??�시
    document.body.insertAdjacentHTML('beforeend', editForm);
    const editModal = new bootstrap.Modal(document.getElementById('edit-visit-modal'));
    editModal.show();
    
    // ?�정 ???�출 ?�벤??리스??
    document.getElementById('edit-visit-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const visitId = parseInt(document.getElementById('edit-visit-id').value);
        const customerId = parseInt(document.getElementById('edit-visit-customer-id').value);
        const date = document.getElementById('edit-visit-date').value;
        const purpose = document.getElementById('edit-visit-purpose').value;
        const note = document.getElementById('edit-visit-note').value;
        
        // 방문 기록 ?�정
        const index = visits.findIndex(v => v.id === visitId);
        if (index !== -1) {
            // 방문 기록 ?�데?�트
            visits[index] = {
                ...visits[index],
                date,
                purpose,
                note
            };
            
            // ?�이???�??
            saveDataToFirebase();
            
            // 고객 최근 방문???�데?�트
            const customer = customers.find(c => c.id === customerId);
            if (customer) {
                // 모든 방문 ?�짜 ?�인?�여 최근 방문???�데?�트
                const customerVisits = visits.filter(v => v.customerId === customerId);
                if (customerVisits.length > 0) {
                    const sortedDates = customerVisits.map(v => v.date).sort((a, b) => 
                        new Date(b) - new Date(a)
                    );
                    customer.lastVisit = sortedDates[0];
                }
            }
            
            // 모달 ?�기
            editModal.hide();
            
            // 방문 ?�력 ?�시 로드
            loadCustomerVisits(customerId);
            
            // 고객 ?�세 ?�보 ?�데?�트 (최근 방문?�이 변경되?�을 ???�음)
            openCustomerDetails(customerId);
            
            // ?�림 ?�시
            alert('방문 기록???�정?�었?�니??');
        }
    });
}

// 방문 기록 ??�� ?�수
function deleteVisitRecord(visitId, customerId) {
    const visit = visits.find(v => v.id === visitId);
    if (!visit) return;
    
    // ??�� ?�인
    if (confirm('?�말�???방문 기록????��?�시겠습?�까? ???�업?� ?�돌�????�습?�다.')) {
        // 방문 기록 ??��
        const index = visits.findIndex(v => v.id === visitId);
        if (index !== -1) {
            visits.splice(index, 1);
            
            // ?�이???�??
            saveDataToFirebase();
            
            // 고객 최근 방문???�데?�트
            const customer = customers.find(c => c.id === customerId);
            if (customer) {
                // 모든 방문 ?�짜 ?�인?�여 최근 방문???�데?�트
                const customerVisits = visits.filter(v => v.customerId === customerId);
                if (customerVisits.length > 0) {
                    const sortedDates = customerVisits.map(v => v.date).sort((a, b) => 
                        new Date(b) - new Date(a)
                    );
                    customer.lastVisit = sortedDates[0];
                } else {
                    // 방문 기록???�으�?기본값으�??�정
                    customer.lastVisit = new Date().toISOString().split('T')[0];
                }
            }
            
            // 방문 ?�력 ?�시 로드
            loadCustomerVisits(customerId);
            
            // 고객 ?�세 ?�보 ?�데?�트 (최근 방문?�이 변경되?�을 ???�음)
            openCustomerDetails(customerId);
            
            // ?�림 ?�시
            alert('방문 기록????��?�었?�니??');
        }
    }
}

// 고객 검???�수
function searchCustomers() {
    const searchTerm = document.getElementById('search-input').value.trim().toLowerCase();
    let displayedCustomers = customers;
    
    // 검?�창??비어?��? ?�으�??�터�?
    if (searchTerm !== '') {
        displayedCustomers = customers.filter(customer => {
            // 기본 ?�보 검??
            const nameMatch = customer.name.toLowerCase().includes(searchTerm);
            const phoneMatch = customer.phone && customer.phone.toLowerCase().includes(searchTerm);
            const storeMatch = customer.preferredStore && customer.preferredStore.toLowerCase().includes(searchTerm);
            const notesMatch = customer.notes && customer.notes.toLowerCase().includes(searchTerm);
            
            // ?�급 검??(?�양???�현 지??
            let rankMatch = false;
            if (customer.rank === 'vvip') {
                rankMatch = searchTerm.includes('vvip') || searchTerm.includes('브이브이?�이??) || searchTerm.includes('최고?�급');
            } else if (customer.rank === 'vip') {
                rankMatch = searchTerm.includes('vip') || searchTerm.includes('브이?�이??) || searchTerm.includes('?�수?�급');
            } else if (customer.rank === 'regular') {
                rankMatch = searchTerm.includes('?�반') || searchTerm.includes('?�귤??) || searchTerm.includes('regular') || searchTerm.includes('기본');
            }
            
            return nameMatch || phoneMatch || storeMatch || notesMatch || rankMatch;
        });
    }
    
    // ?�재 ?�렬 ?�태가 ?�으�??�용
    if (currentSort.field) {
        displayedCustomers = applySort(displayedCustomers, currentSort.field, currentSort.order);
    }
    
    renderCustomerList(displayedCustomers);
}

// ?�급 변�??�력 보기 ?�수
function viewRankChangeHistory(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    const customerRankChanges = rankChanges.filter(rc => rc.customerId === customerId);
    
    // ?�급 변�??�력 모달 ?�성
    const historyModal = `
    <div class="modal fade" id="rank-history-modal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${customer.name} 고객 ?�급 변�??�력</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <div>
                                <strong>?�재 ?�급:</strong> 
                                <span class="badge ${customer.rank === 'vvip' ? 'badge-vvip' : customer.rank === 'vip' ? 'badge-vip' : 'badge-regular'}">
                                    ${customer.rank === 'vvip' ? 'VVIP' : customer.rank === 'vip' ? 'VIP' : '?�반'}
                                </span>
                            </div>
                            <button class="btn btn-sm btn-primary" id="manual-rank-change-btn">?�동 ?�급 변�?/button>
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>변경일</th>
                                    <th>?�전 ?�급</th>
                                    <th>변�??�급</th>
                                    <th>변�??�유</th>
                                    <th>변경자</th>
                                </tr>
                            </thead>
                            <tbody id="rank-history-body">
                                ${customerRankChanges.length > 0 ? 
                                    customerRankChanges.sort((a, b) => new Date(b.date) - new Date(a.date))
                                    .map(rc => `
                                        <tr>
                                            <td>${formatDate(rc.date)}</td>
                                            <td>
                                                <span class="badge ${rc.oldRank === 'vvip' ? 'badge-vvip' : rc.oldRank === 'vip' ? 'badge-vip' : 'badge-regular'}">
                                                    ${rc.oldRank === 'vvip' ? 'VVIP' : rc.oldRank === 'vip' ? 'VIP' : '?�반'}
                                                </span>
                                            </td>
                                            <td>
                                                <span class="badge ${rc.newRank === 'vvip' ? 'badge-vvip' : rc.newRank === 'vip' ? 'badge-vip' : 'badge-regular'}">
                                                    ${rc.newRank === 'vvip' ? 'VVIP' : rc.newRank === 'vip' ? 'VIP' : '?�반'}
                                                </span>
                                            </td>
                                            <td>${rc.reason}</td>
                                            <td>${rc.changedBy}</td>
                                        </tr>
                                    `).join('') 
                                    : '<tr><td colspan="5" class="text-center">?�급 변�??�력???�습?�다.</td></tr>'
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">?�기</button>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // 기존 모달???�으�??�거
    const existingModal = document.getElementById('rank-history-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 모달 추�? �??�시
    document.body.insertAdjacentHTML('beforeend', historyModal);
    const modal = new bootstrap.Modal(document.getElementById('rank-history-modal'));
    modal.show();
    
    // ?�동 ?�급 변�?버튼 ?�벤??리스??
    document.getElementById('manual-rank-change-btn').addEventListener('click', () => {
        manualRankChange(customerId, modal);
    });
}

// ?�동 ?�급 변�??�수
function manualRankChange(customerId, historyModal) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    // ?�동 ?�급 변�?모달 ?�성
    const changeForm = `
    <div class="modal fade" id="manual-rank-change-modal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${customer.name} 고객 ?�급 ?�동 변�?/h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="rank-change-form">
                        <input type="hidden" id="rank-change-customer-id" value="${customer.id}">
                        <div class="mb-3">
                            <label for="current-rank" class="form-label">?�재 ?�급</label>
                            <input type="text" class="form-control" id="current-rank" value="${customer.rank === 'vvip' ? 'VVIP' : customer.rank === 'vip' ? 'VIP' : '?�반'}" disabled>
                        </div>
                        <div class="mb-3">
                            <label for="new-rank" class="form-label">변�??�급</label>
                            <select class="form-control" id="new-rank" required>
                                <option value="vvip" ${customer.rank === 'vvip' ? 'selected' : ''}>VVIP</option>
                                <option value="vip" ${customer.rank === 'vip' ? 'selected' : ''}>VIP</option>
                                <option value="regular" ${customer.rank === 'regular' ? 'selected' : ''}>?�반</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="rank-change-reason" class="form-label">변�??�유</label>
                            <textarea class="form-control" id="rank-change-reason" rows="3" required></textarea>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">취소</button>
                            <button type="submit" class="btn btn-primary">?�??/button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // 기존 모달???�으�??�거
    const existingModal = document.getElementById('manual-rank-change-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 모달 추�? �??�시
    document.body.insertAdjacentHTML('beforeend', changeForm);
    const modal = new bootstrap.Modal(document.getElementById('manual-rank-change-modal'));
    modal.show();
    
    // ?�동 ?�급 변�????�출 ?�벤??리스??
    document.getElementById('rank-change-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const customerId = parseInt(document.getElementById('rank-change-customer-id').value);
        const newRank = document.getElementById('new-rank').value;
        const reason = document.getElementById('rank-change-reason').value;
        
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            const oldRank = customer.rank;
            
            // ?�급??변경된 경우?�만 ?�력 추�?
            if (oldRank !== newRank) {
                // 고객 ?�급 변�?
                customer.rank = newRank;
                
                // ?�급 변�??�력 추�?
                const rankChange = {
                    id: rankChanges.length > 0 ? Math.max(...rankChanges.map(r => r.id)) + 1 : 1,
                    customerId: customer.id,
                    oldRank: oldRank,
                    newRank: customer.rank,
                    reason: reason,
                    date: new Date().toISOString().split('T')[0],
                    changedBy: localStorage.getItem('username') || '관리자'
                };
                
                rankChanges.push(rankChange);
                
                // ?�이???�??
                saveDataToFirebase();
                
                // ?�림 ?�시
                alert('고객 ?�급??변경되?�습?�다.');
                
                // 모달 ?�기
                modal.hide();
                
                // ?�력 모달 ?�기
                historyModal.hide();
                
                // 고객 목록 ?�로고침
                loadCustomerList();
                
                // ?�급 변�??�력 모달 ?�시 ?�기
                viewRankChangeHistory(customerId);
            } else {
                alert('같�? ?�급?�로??변경할 ???�습?�다.');
            }
        }
    });
}

// ?��? ?�로??처리 ?�수
async function handleExcelUpload() {
    const fileInput = document.getElementById('excel-file');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('?��? ?�일???�택?�주?�요.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // 고객?�보 ?�트 처리
            let customerData = [];
            let purchaseData = [];
            
            // ?�트�??�이??추출
            console.log('?�� 발견???�트:', workbook.SheetNames);
            
            workbook.SheetNames.forEach((sheetName, index) => {
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                console.log(`?�� ?�트 "${sheetName}" ?�이??(�?3??:`, jsonData.slice(0, 3));
                
                if (index === 0) {
                    // �?번째 ?�트????�� 고객?�보�?간주
                    customerData = jsonData;
                    console.log('??�?번째 ?�트�?고객?�보�??�정');
                } else if (index === 1) {
                    // ??번째 ?�트????�� 구매?�력?�로 간주
                    purchaseData = jsonData;
                    console.log('????번째 ?�트�?구매?�력?�로 ?�정');
                } else if (sheetName.includes('고객') || sheetName.includes('customer') || workbook.SheetNames.length === 1) {
                    customerData = jsonData;
                    console.log('???�트명으�?고객?�보 ?�식');
                } else if (sheetName.includes('구매') || sheetName.includes('purchase')) {
                    purchaseData = jsonData;
                    console.log('???�트명으�?구매?�력 ?�식');
                }
            });
            
            // ?�일 ?�트??경우 고객?�보�?처리
            if (workbook.SheetNames.length === 1 && customerData.length === 0) {
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                customerData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            }
            
            console.log('?�� 최종 처리???�이??');
            console.log('고객?�보 ????', customerData.length);
            console.log('구매?�력 ????', purchaseData.length);
            
            await processExcelDataWithPurchases(customerData, purchaseData);
        } catch (error) {
            alert('?��? ?�일 ?�기 �??�류가 발생?�습?�다: ' + error.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

// 고객?�보?� 구매?�력???�께 처리?�는 ?�수
async function processExcelDataWithPurchases(customerData, purchaseData) {
    let customerSuccessCount = 0;
    let customerErrorCount = 0;
    let purchaseSuccessCount = 0;
    let purchaseErrorCount = 0;
    const errors = [];
    const customerPhoneMap = new Map(); // ?�화번호�?고객 ID 매핑
    
    // 기존 고객?�을 맵에 추�?
    customers.forEach(customer => {
        const cleanPhone = customer.phone.replace(/[\s-]/g, '');
        customerPhoneMap.set(cleanPhone, customer.id);
    });
    console.log('?�� 기존 고객 매핑 ?�료:', customerPhoneMap.size, '�?);
    
    // 1?�계: 고객?�보 처리
    if (customerData.length > 1) {
        for (let i = 1; i < customerData.length; i++) {
            const row = customerData[i];
            
            if (!row || row.length === 0 || !row[0]) {
                continue;
            }
            
            try {
                const customer = {
                    id: customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1,
                    name: row[0] || '',
                    gender: convertGender(row[1]),
                    phone: (row[2] || '').toString().replace(/[\s-]/g, ''), // ?�화번호 ?�리
                    birthdate: convertDate(row[3]),
                    address: row[4] || '',
                    preferredStore: row[5] || '',
                    email: row[6] || '',
                    notes: row[7] || '',
                    rank: 'regular',
                    totalPurchase: 0,
                    purchaseCount: 0,
                    lastVisit: new Date().toISOString().split('T')[0]
                };
                
                if (!customer.name || !customer.phone) {
                    errors.push(`고객?�보 ${i + 1}?? ?�름�??�화번호???�수?�니??`);
                    customerErrorCount++;
                    continue;
                }
                
                // ?�화번호 중복 체크 (?�일?�으�?간주)
                const existingCustomer = customers.find(c => c.phone.replace(/[\s-]/g, '') === customer.phone);
                if (existingCustomer) {
                    // 기존 고객 ?�보�??�데?�트?�고 맵에 추�?
                    customerPhoneMap.set(customer.phone, existingCustomer.id);
                    errors.push(`고객?�보 ${i + 1}?? ?�화번호 ${customer.phone}???��? 존재?�니?? (기존 고객�??�결)`);
                    customerErrorCount++;
                    continue;
                }
                
                customers.push(customer);
                customerPhoneMap.set(customer.phone, customer.id);
                customerSuccessCount++;
                
            } catch (error) {
                errors.push(`고객?�보 ${i + 1}?? ?�이??처리 ?�류 - ${error.message}`);
                customerErrorCount++;
            }
        }
    }
    
    // 2?�계: 구매?�력 처리
    console.log('?�� 구매?�력 처리 ?�작...');
    console.log('구매?�력 ?�이??길이:', purchaseData.length);
    console.log('?�록??고객 ??', customers.length);
    console.log('고객 ?�화번호 �?', Array.from(customerPhoneMap.entries()));
    
    if (purchaseData.length > 1) {
        console.log('구매?�력 ?�더:', purchaseData[0]);
        for (let i = 1; i < purchaseData.length; i++) {
            const row = purchaseData[i];
            
            // 처음 5?�만 ?�세 로그 출력
            const isDetailLog = i <= 5;
            
            if (isDetailLog) {
                console.log(`?�� 구매?�력 ${i + 1}??체크:`, { 'row존재': !!row, '길이': row?.length, '첫번째값': row?.[0] });
            }
            
            if (!row || row.length === 0 || (!row[0] && row[0] !== 0)) {
                if (isDetailLog) console.log(`??�� 구매?�력 ${i + 1}??건너?� (�???`);
                continue;
            }
            
            try {
                // ?�버�? ?�본 ?�이???�인 (처음 5?�만)
                if (isDetailLog) {
                    console.log(`\n?�� 구매?�력 ${i + 1}???�본:`, row);
                }
                
                // ?�화번호 ?�리 (공백, ?�이???�거)
                const customerPhone = (row[0] || '').toString().replace(/[\s-]/g, '');
                const purchaseDate = convertDate(row[1]);
                const itemName = row[2] || '';
                // 가�?처리 개선 (?�양???�태??가�??�식 처리)
                let priceStr = (row[3] || '').toString()
                    .replace(/,/g, '')           // 콤마 ?�거
                    .replace(/??g, '')          // '?? 문자 ?�거
                    .replace(/\s/g, '')          // 공백 ?�거
                    .replace(/[^0-9.-]/g, '');   // ?�자, ?? ?�이????모든 문자 ?�거
                
                const price = parseFloat(priceStr) || 0;
                
                if (isDetailLog) {
                    console.log(`?�� 가�?처리:`, {
                        '?�본': row[3],
                        '처리??문자??: priceStr,
                        '최종 ?�자': price,
                        '?�효?��?': price > 0
                    });
                }
                const orderNumber = row[4] || '';
                const store = row[5] || '';
                const seller = row[6] || '';
                const paymentMethod = row[7] || '?�용카드';
                const memo = row[8] || '';
                
                // ?�버�? 처리???�이???�인 (처음 5?�만)
                if (isDetailLog) {
                    console.log(`?�� 구매?�력 ${i + 1}??처리??`, {
                        customerPhone, purchaseDate, itemName, price, orderNumber, store, seller, paymentMethod, memo
                    });
                    
                    // ?�수 ?�드 검�?(???�세??로그)
                    console.log(`???�수 ?�드 검�?`, {
                        '?�화번호': customerPhone ? '?? : '??,
                        '?�품�?: itemName ? '?? : '??, 
                        '가�?: price > 0 ? '?? : '??,
                        '가격값': price,
                        '가격문?�열': priceStr
                    });
                }
                
                if (!customerPhone || !itemName || price <= 0) {
                    const reason = [];
                    if (!customerPhone) reason.push('?�화번호 ?�음');
                    if (!itemName) reason.push('?�품�??�음');
                    if (price <= 0) reason.push(`가�??�류(${price})`);
                    
                    errors.push(`구매?�력 ${i + 1}?? ${reason.join(', ')} (?�화번호:"${customerPhone}", ?�품�?"${itemName}", 가�?${price})`);
                    purchaseErrorCount++;
                    if (isDetailLog) console.log(`??구매?�력 ${i + 1}???�패: ${reason.join(', ')}`);
                    continue;
                }
                
                // 고객 찾기 (?�로 ?�록??고객 ?�는 기존 고객)
                let customerId = customerPhoneMap.get(customerPhone);
                if (isDetailLog) console.log(`?�� 고객 찾기: ?�화번호="${customerPhone}", 맵에??찾�? ID=${customerId}`);
                
                if (!customerId) {
                    // 기존 고객?�서 ?�화번호 ?�리?�서 비교
                    const existingCustomer = customers.find(c => c.phone.replace(/[\s-]/g, '') === customerPhone);
                    if (existingCustomer) {
                        customerId = existingCustomer.id;
                        // ?�로 ?�록??고객과의 ?�결???�해 맵에 추�?
                        customerPhoneMap.set(customerPhone, customerId);
                        if (isDetailLog) console.log(`??기존 고객 발견: ${existingCustomer.name} (ID: ${customerId})`);
                    } else {
                        // 맵에 ?�는 ?�화번호 목록 ?�인
                        const mapPhones = Array.from(customerPhoneMap.keys()).slice(0, 10).join(', ');
                        errors.push(`구매?�력 ${i + 1}?? ?�화번호 "${customerPhone}"???�당?�는 고객??찾을 ???�습?�다. (맵의 ?�화번호 ?�시: ${mapPhones}...)`);
                        purchaseErrorCount++;
                        continue;
                    }
                }
                
                // 구매 기록 추�?
                const purchase = {
                    id: purchases.length > 0 ? Math.max(...purchases.map(p => p.id)) + 1 : 1,
                    customerId: customerId,
                    date: purchaseDate || new Date().toISOString().split('T')[0],
                    items: [{ name: itemName, price: price }],
                    totalAmount: price,
                    orderNumber: orderNumber,
                    paymentMethod: paymentMethod,
                    store: store,
                    seller: seller,
                    memo: memo
                };
                
                purchases.push(purchase);
                
                // 고객 구매 ?�보 ?�데?�트
                const customer = customers.find(c => c.id === customerId);
                if (customer) {
                    const oldTotal = customer.totalPurchase;
                    const oldCount = customer.purchaseCount;
                    
                    customer.totalPurchase += price;
                    customer.purchaseCount += 1;
                    customer.lastVisit = purchase.date;
                    updateCustomerRank(customer);
                    
                    console.log(`구매?�력 추�?: ${customer.name} (${customerPhone}) - 기존: ${formatCurrency(oldTotal)}/${oldCount}�???변�? ${formatCurrency(customer.totalPurchase)}/${customer.purchaseCount}�?);
                }
                
                purchaseSuccessCount++;
                
            } catch (error) {
                errors.push(`구매?�력 ${i + 1}?? ?�이??처리 ?�류 - ${error.message}`);
                purchaseErrorCount++;
            }
        }
    }
    
    // 결과 ?�??�??�림
    if (customerSuccessCount > 0 || purchaseSuccessCount > 0) {
        await saveDataToFirebase();
        loadCustomerList();
    }
    
    let message = `?�로???�료!\n`;
    message += `고객?�보 - ?�공: ${customerSuccessCount}�? ?�패: ${customerErrorCount}�?n`;
    message += `구매?�력 - ?�공: ${purchaseSuccessCount}�? ?�패: ${purchaseErrorCount}�?;
    
    if (errors.length > 0) {
        message += '\n\n?�� ?�류 ?�결 가?�드:\n';
        message += '??구매?�력 ?�트??고객?�화번호가 고객?�보 ?�트???�화번호?� ?�확???�치?�는지 ?�인?�세??n';
        message += '???�화번호??공백?�나 ?�수문자가 ?�는지 ?�인?�세??n';
        message += '??가격이 ?�자�??�력?�었?��? ?�인?�세??n\n';
        message += '?�류 ?�용:\n' + errors.slice(0, 15).join('\n');
        if (errors.length > 15) {
            message += `\n... �?${errors.length - 15}�?추�? ?�류`;
        }
    }
    
    // �?메시지�??�해 confirm ?�????�??�용
    if (message.length > 1000) {
        const newWindow = window.open('', '_blank', 'width=600,height=400');
        newWindow.document.write(`
            <html>
                <head><title>?��? ?�로??결과</title></head>
                <body style="font-family: Arial; padding: 20px; white-space: pre-wrap;">
                    ${message.replace(/\n/g, '<br>')}
                    <br><br>
                    <button onclick="window.close()">?�기</button>
                </body>
            </html>
        `);
    } else {
        alert(message);
    }
    document.getElementById('excel-file').value = '';
}

// 기존 ?��? ?�이??처리 ?�수 (?�일 ?�트 ?�환??
async function processExcelData(data) {
    if (data.length < 2) {
        alert('?��? ?�일???�이?��? ?�습?�다.');
        return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // �?번째 ?��? ?�더�?간주?�고 건너?�기
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        
        // �???건너?�기
        if (!row || row.length === 0 || !row[0]) {
            continue;
        }
        
        try {
            // ?��? ?�이?��? 고객 객체�?변??
            const customer = {
                id: customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1,
                name: row[0] || '',
                gender: convertGender(row[1]),
                phone: (row[2] || '').toString().replace(/[\s-]/g, ''), // ?�화번호 ?�리
                birthdate: convertDate(row[3]),
                address: row[4] || '',
                preferredStore: row[5] || '',
                email: row[6] || '',
                notes: row[7] || '',
                rank: 'regular',
                totalPurchase: 0,
                purchaseCount: 0,
                lastVisit: new Date().toISOString().split('T')[0]
            };
            
            // ?�수 ?�드 검�?
            if (!customer.name || !customer.phone) {
                errors.push(`${i + 1}?? ?�름�??�화번호???�수?�니??`);
                errorCount++;
                continue;
            }
            
            // ?�화번호 중복 체크 (?�일?�으�?간주)
            if (customers.find(c => c.phone.replace(/[\s-]/g, '') === customer.phone)) {
                errors.push(`${i + 1}?? ?�화번호 ${customer.phone}???��? 존재?�니?? (?�일?�으�?간주?�여 ?�략)`);
                errorCount++;
                continue;
            }
            
            customers.push(customer);
            successCount++;
            
        } catch (error) {
            errors.push(`${i + 1}?? ?�이??처리 ?�류 - ${error.message}`);
            errorCount++;
        }
    }
    
    // 결과 ?�??�??�림
    if (successCount > 0) {
        await saveDataToFirebase();
        loadCustomerList();
    }
    
    let message = `?�로???�료!\n?�공: ${successCount}�? ?�패: ${errorCount}�?;
    if (errors.length > 0) {
        message += '\n\n?�류 ?�용:\n' + errors.slice(0, 5).join('\n');
        if (errors.length > 5) {
            message += `\n... �?${errors.length - 5}�?추�? ?�류`;
        }
    }
    
    alert(message);
    
    // ?�일 ?�력 초기??
    document.getElementById('excel-file').value = '';
}

// ?�별 변???�수
function convertGender(value) {
    if (!value) return '';
    const str = value.toString().toLowerCase();
    if (str.includes('??) || str === 'm' || str === 'male') return 'male';
    if (str.includes('??) || str === 'f' || str === 'female') return 'female';
    return '';
}

// ?�짜 변???�수
function convertDate(value) {
    if (!value) return '';
    
    try {
        // ?��? ?�짜 ?�식 처리
        if (typeof value === 'number') {
            // Excel date serial number
            const date = new Date((value - 25569) * 86400 * 1000);
            return date.toISOString().split('T')[0];
        }
        
        // 문자???�짜 처리
        const str = value.toString();
        if (str.includes('-') || str.includes('/')) {
            const date = new Date(str);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
        }
        
        return '';
    } catch (error) {
        return '';
    }
}

// 고객 ?�이???��? ?�보?�기 ?�수
function exportCustomersToExcel() {
    if (customers.length === 0) {
        alert('?�보??고객 ?�이?��? ?�습?�다.');
        return;
    }
    
    // 고객?�보 ?�트 ?�이??준�?
    const customerData = [
        ['번호', '?�름', '?�별', '?�화번호', '?�년?�일', '주소', '주방문매??, '?�메??, '?�급', '총구매액', '구매?�수', '최근방문??, '메모']
    ];
    
    customers.forEach((customer, index) => {
        const genderText = customer.gender === 'male' ? '?�성' : customer.gender === 'female' ? '?�성' : '';
        const rankText = customer.rank === 'vvip' ? 'VVIP' : customer.rank === 'vip' ? 'VIP' : '?�반';
        
        customerData.push([
            index + 1,
            customer.name || '',
            genderText,
            formatPhoneNumber(customer.phone) || '',
            customer.birthdate || '',
            customer.address || '',
            customer.preferredStore || '',
            customer.email || '',
            rankText,
            customer.totalPurchase || 0,
            customer.purchaseCount || 0,
            customer.lastVisit || '',
            customer.notes || ''
        ]);
    });
    
    // 구매?�력 ?�트 ?�이??준�?
    const purchaseData = [
        ['번호', '고객�?, '고객?�화번호', '구매??, '?�품�?, '가�?, '주문?�번??, '구매매장', '?�당?�??, '결제방법', '메모']
    ];
    
    purchases.forEach((purchase, index) => {
        const customer = customers.find(c => c.id === purchase.customerId);
        if (customer) {
            purchase.items.forEach(item => {
                purchaseData.push([
                    index + 1,
                    customer.name || '',
                    formatPhoneNumber(customer.phone) || '',
                    purchase.date || '',
                    item.name || '',
                    item.price || 0,
                    purchase.orderNumber || '',
                    purchase.store || '',
                    purchase.seller || '',
                    purchase.paymentMethod || '?�용카드',
                    purchase.memo || ''
                ]);
            });
        }
    });
    
    // ?�물?�력 ?�트 ?�이??준�?
    const giftData = [
        ['번호', '고객�?, '고객?�화번호', '?�물종류', '?�물?�용', '?�공?�자', '?�공?�유']
    ];
    
    gifts.forEach((gift, index) => {
        const customer = customers.find(c => c.id === gift.customerId);
        if (customer) {
            giftData.push([
                index + 1,
                customer.name || '',
                formatPhoneNumber(customer.phone) || '',
                gift.type || '',
                gift.description || '',
                gift.date || '',
                gift.reason || ''
            ]);
        }
    });
    
    // 방문?�력 ?�트 ?�이??준�?
    const visitData = [
        ['번호', '고객�?, '고객?�화번호', '방문??, '방문매장', '방문목적', '메모']
    ];
    
    visits.forEach((visit, index) => {
        const customer = customers.find(c => c.id === visit.customerId);
        if (customer) {
            visitData.push([
                index + 1,
                customer.name || '',
                formatPhoneNumber(customer.phone) || '',
                visit.date || '',
                visit.store || '',
                visit.purpose || '',
                visit.memo || ''
            ]);
        }
    });
    
    // ?�크�??�성
    const workbook = XLSX.utils.book_new();
    
    // �??�트 추�?
    const customerSheet = XLSX.utils.aoa_to_sheet(customerData);
    XLSX.utils.book_append_sheet(workbook, customerSheet, '고객?�보');
    
    if (purchaseData.length > 1) {
        const purchaseSheet = XLSX.utils.aoa_to_sheet(purchaseData);
        XLSX.utils.book_append_sheet(workbook, purchaseSheet, '구매?�력');
    }
    
    if (giftData.length > 1) {
        const giftSheet = XLSX.utils.aoa_to_sheet(giftData);
        XLSX.utils.book_append_sheet(workbook, giftSheet, '?�물?�력');
    }
    
    if (visitData.length > 1) {
        const visitSheet = XLSX.utils.aoa_to_sheet(visitData);
        XLSX.utils.book_append_sheet(workbook, visitSheet, '방문?�력');
    }
    
    // ?�일명에 ?�재 ?�짜 ?�함
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const fileName = `고객관리데?�터_${dateStr}.xlsx`;
    
    // ?�일 ?�운로드
    XLSX.writeFile(workbook, fileName);
    
    alert(`고객 ?�이?��? ?�공?�으�??�운로드?�었?�니??\n?�일�? ${fileName}\n\n?�함???�트:\n- 고객?�보 (${customers.length}�?\n- 구매?�력 (${purchases.length}�?\n- ?�물?�력 (${gifts.length}�?\n- 방문?�력 (${visits.length}�?`);
}

// ?��? ?�플�??�운로드 ?�수
function downloadExcelTemplate() {
    // 고객 기본?�보 ?�트
    const customerData = [
        ['?�름', '?�별', '?�화번호', '?�년?�일', '주소', '주방문매??, '?�메??, '메모'],
        ['?�길??, '?�성', '010-1234-5678', '1990-01-01', '?�울??강남�?, '강남??, 'hong@example.com', '?�수고객'],
        ['김?�희', '?�성', '010-9876-5432', '1985-05-15', '?�울???�초�?, '?�초??, 'kim@example.com', '?�골고객'],
        ['박철??, '?�성', '010-5555-1234', '1988-12-25', '?�울???�파�?, '?�실??, 'park@example.com', 'VIP고객']
    ];
    
    // 구매?�력 ?�트 (고객 ?�화번호�??�결)
    const purchaseData = [
        ['고객?�화번호', '구매??, '?�품�?, '가�?, '주문?�번??, '구매매장', '?�당?�??, '결제방법', '메모'],
        ['010-1234-5678', '2024-01-15', '가�??�드�?, '2800000', 'ORD-2024-001', '강남??, '김?�??, '?�용카드', '?�년 ?�물'],
        ['010-1234-5678', '2024-02-14', '?�크 ?�카??, '450000', 'ORD-2024-002', '강남??, '김?�??, '?�용카드', '발렌?�???�물'],
        ['010-9876-5432', '2024-01-20', '?�자?�너 코트', '3200000', 'ORD-2024-003', '?�초??, '?��???, '?�금', '겨울 ?�우??],
        ['010-5555-1234', '2024-03-01', '명품 ?�계', '5500000', 'ORD-2024-004', '?�실??, '박�???, '?�용카드', '?�일 ?�물']
    ];
    
    const workbook = XLSX.utils.book_new();
    
    // 고객?�보 ?�트 추�?
    const customerSheet = XLSX.utils.aoa_to_sheet(customerData);
    XLSX.utils.book_append_sheet(workbook, customerSheet, '고객?�보');
    
    // 구매?�력 ?�트 추�?
    const purchaseSheet = XLSX.utils.aoa_to_sheet(purchaseData);
    XLSX.utils.book_append_sheet(workbook, purchaseSheet, '구매?�력');
    
    // ?�일 ?�운로드
    XLSX.writeFile(workbook, '고객관�??�합?�플�?xlsx');
}

// 고객 ?�렬 ?�수
function sortCustomers(field) {
    // ?�재 ?�렬 ?�태 ?�인
    if (currentSort.field === field) {
        // 같�? ?�드�??�릭??경우 ?�렬 ?�서 변�?
        currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
    } else {
        // ?�른 ?�드�??�릭??경우 ?�로???�드�??�름차순 ?�렬
        currentSort.field = field;
        currentSort.order = 'asc';
    }
    
    // ?�더 ?��????�데?�트
    updateSortHeaders();
    
    // ?�재 ?�시 중인 고객 목록 가?�오�?
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    let displayedCustomers = customers;
    
    // 검???�터 ?�용
    if (searchTerm) {
        displayedCustomers = customers.filter(customer => {
            return customer.name.toLowerCase().includes(searchTerm) ||
                   customer.phone.includes(searchTerm) ||
                   (customer.preferredStore && customer.preferredStore.toLowerCase().includes(searchTerm)) ||
                   (customer.notes && customer.notes.toLowerCase().includes(searchTerm)) ||
                   getRankText(customer.rank).toLowerCase().includes(searchTerm);
        });
    }
    
    // ?�렬 ?�용
    displayedCustomers = applySort(displayedCustomers, field, currentSort.order);
    
    // ?�렬??목록 ?�더�?
    renderCustomerList(displayedCustomers);
}

// ?�렬 ?�더 ?��????�데?�트 ?�수
function updateSortHeaders() {
    // 모든 ?�렬 ?�더 초기??
    document.querySelectorAll('.sortable').forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
        const icon = header.querySelector('.sort-icon');
        if (icon) {
            icon.className = 'bi bi-arrow-down-up sort-icon';
        }
    });
    
    // ?�재 ?�렬 ?�드 ?�시
    if (currentSort.field) {
        const currentHeader = document.querySelector(`[data-sort="${currentSort.field}"]`);
        if (currentHeader) {
            currentHeader.classList.add(`sort-${currentSort.order}`);
            const icon = currentHeader.querySelector('.sort-icon');
            if (icon) {
                if (currentSort.order === 'asc') {
                    icon.className = 'bi bi-sort-up sort-icon';
                } else {
                    icon.className = 'bi bi-sort-down sort-icon';
                }
            }
        }
    }
}

// ?�급 ?�스??변???�수
function getRankText(rank) {
    switch (rank) {
        case 'vvip': return 'VVIP';
        case 'vip': return 'VIP';
        case 'regular': return '?�반';
        default: return '?�반';
    }
}

// ?�렬 ?�벤??리스???�록 ?�수
function attachSortListeners() {
    document.querySelectorAll('.sortable').forEach(header => {
        // 기존 ?�벤??리스???�거 (중복 방�?)
        header.removeEventListener('click', sortHandler);
        // ???�벤??리스??추�?
        header.addEventListener('click', sortHandler);
    });
}

// ?�렬 ?�벤???�들???�수
function sortHandler(event) {
    const sortField = event.currentTarget.getAttribute('data-sort');
    sortCustomers(sortField);
}

// 배열???�렬 ?�용?�는 ?�수
function applySort(customerArray, field, order) {
    return customerArray.sort((a, b) => {
        let aValue, bValue;
        
        switch (field) {
            case 'name':
                aValue = a.name || '';
                bValue = b.name || '';
                break;
            case 'birthdate':
                aValue = a.birthdate || '0';
                bValue = b.birthdate || '0';
                break;
            case 'preferredStore':
                aValue = a.preferredStore || '';
                bValue = b.preferredStore || '';
                break;
            case 'rank':
                // ?�급 ?�선?�위: vvip > vip > regular
                const rankOrder = { 'vvip': 3, 'vip': 2, 'regular': 1 };
                aValue = rankOrder[a.rank] || 0;
                bValue = rankOrder[b.rank] || 0;
                break;
            case 'lastVisit':
                aValue = a.lastVisit || '0';
                bValue = b.lastVisit || '0';
                break;
            default:
                return 0;
        }
        
        // 문자??비교
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            const comparison = aValue.localeCompare(bValue, 'ko');
            return order === 'asc' ? comparison : -comparison;
        }
        
        // ?�자 비교
        if (aValue < bValue) {
            return order === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return order === 'asc' ? 1 : -1;
        }
        return 0;
    });
}



// ??��??- ???�상 ?�기??비활?�화 기능 ?�음 (??�� ?�성??

// 로그???�행 ?�수
function performLogin() {
    console.log('로그???�작...');
    
    // 로그???�태 ?�??
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('username', 'admin');
    
    // DOM ?�소 가?�오�?
    const loginForm = document.getElementById('login-form');
    const mainContent = document.getElementById('main-content');
    
    console.log('loginForm:', loginForm);
    console.log('mainContent:', mainContent);
    
    // 즉시 ?�이지 ?�환 (?�러 방법?�로 강제)
    if (loginForm) {
        loginForm.style.display = 'none';
        loginForm.style.visibility = 'hidden';
        loginForm.classList.add('d-none', 'force-hide');
        loginForm.classList.remove('force-show');
    }
    
    if (mainContent) {
        mainContent.style.display = 'block';
        mainContent.style.visibility = 'visible';
        mainContent.classList.remove('d-none', 'force-hide');
        mainContent.classList.add('force-show');
    }
    
    // ?�이??로드 (즉시)
    try {
        if (typeof loadCustomerList === 'function') loadCustomerList();
        if (typeof loadBirthdayAlerts === 'function') loadBirthdayAlerts();
        if (typeof loadRankingCounts === 'function') loadRankingCounts();
    } catch (error) {
        console.error('?�이??로드 ?�류:', error);
    }
    
    // 강제 리렌?�링
    requestAnimationFrame(() => {
        if (mainContent) {
            mainContent.style.opacity = '0';
            requestAnimationFrame(() => {
                mainContent.style.opacity = '1';
            });
        }
    });
    
    console.log('로그???�료');
}

// 로그?�웃 ?�행 ?�수  
function performLogout() {
    console.log('로그?�웃 ?�작...');
    
    // 로그???�태 ?�거
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    
    // DOM ?�소 가?�오�?
    const loginForm = document.getElementById('login-form');
    const mainContent = document.getElementById('main-content');
    const passwordInput = document.getElementById('password');
    
    console.log('logout - loginForm:', loginForm);
    console.log('logout - mainContent:', mainContent);
    
    // 즉시 ?�이지 ?�환 (?�러 방법?�로 강제)
    if (mainContent) {
        mainContent.style.display = 'none';
        mainContent.style.visibility = 'hidden';
        mainContent.classList.add('d-none', 'force-hide');
        mainContent.classList.remove('force-show');
    }
    
    if (loginForm) {
        loginForm.style.display = 'block';
        loginForm.style.visibility = 'visible';
        loginForm.classList.remove('d-none', 'force-hide');
        loginForm.classList.add('force-show');
    }
    
    // ?�스?�드 ?�력�?초기??
    if (passwordInput) {
        passwordInput.value = '';
        // ?�간??지?????�커??(?�면 ?�환 ??
        setTimeout(() => {
            passwordInput.focus();
        }, 100);
    }
    
    // 강제 리렌?�링
    requestAnimationFrame(() => {
        if (loginForm) {
            loginForm.style.opacity = '0';
            requestAnimationFrame(() => {
                loginForm.style.opacity = '1';
            });
        }
    });
    
    console.log('로그?�웃 ?�료');
}
