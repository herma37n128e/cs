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

// Firebase?�서 ?�이??가?�오�?(?�전??버전)
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
            
            // Firebase ?�이?��? ?�고, 로컬보다 최신??경우
            if (firebaseData && firebaseData.lastUpdated > window.FIREBASE_SYNC.lastSyncTime) {
                // ?�재 기기?�서 ?�정??것이 ?�닌 경우?�만 ?�기??
                if (firebaseData.lastModifiedBy !== window.FIREBASE_SYNC.deviceId) {
                    // 로컬 ?�이???�데?�트
                    if (firebaseData.customers) customers = firebaseData.customers;
                    if (firebaseData.purchases) purchases = firebaseData.purchases;
                    if (firebaseData.gifts) gifts = firebaseData.gifts;
                    if (firebaseData.visits) visits = firebaseData.visits;
                    
                    // Firebase???�??(중복 방�?�??�해 ?�거)
                    
                    // ?�재 ?�이지 ?�로고침
                    const customerId = getCustomerIdFromUrl();
                    if (customerId) {
                        loadCustomerDetails(customerId);
                    }
                    
                    window.FIREBASE_SYNC.lastSyncTime = firebaseData.lastUpdated;
                    console.log('Firebase?�서 ?�이???�기???�료');
                }
            }
        } else if (response.status === 404) {
            // ?�이?��? ?�는 경우 (�??�용)
            console.log('Firebase???�이?��? ?�습?�다. 로컬 ?�이?��? ?�로?�합?�다.');
            await syncToFirebase();
        }
    } catch (error) {
        console.error('Firebase ?�기???�류:', error);
    } finally {
        if (window.FIREBASE_SYNC) {
            window.FIREBASE_SYNC.isSyncing = false;
        }
    }
}

// Firebase???�이???�?�하�?(?�전??버전)
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
            console.log('Firebase???�이???�???�료');
        }
    } catch (error) {
        console.error('Firebase ?�기???�류:', error);
    } finally {
        if (window.FIREBASE_SYNC) {
            window.FIREBASE_SYNC.isSyncing = false;
        }
    }
}

// Firebase ?�동 ?�기??초기??
async function initializeFirebaseSync() {
    console.log('Firebase ?�동 ?�기???�스??초기??..');
    
    try {
        // 고정???�이??경로 ?�용 (?�이???�구 보존)
        const userPath = window.FIREBASE_SYNC.userPath;
        
        console.log('Firebase ?�동 ?�기???�작 - ?�이??경로:', userPath);
        
        // Firebase ?�기???�작
        setTimeout(() => {
            try {
                syncFromFirebase();
                startUpdateChecker();
            } catch (error) {
                console.error('Firebase ?�기???�작 ?�류:', error);
                startUpdateChecker();
            }
        }, 1000);
        
        console.log('Firebase ?�결 ?�료 - ?�이???�구 보존 모드');
        
    } catch (error) {
        console.error('?�기???�정 로드 ?�류:', error);
        startUpdateChecker();
    }
}



// ?�기?�으�?Firebase ?�데?�트 ?�인
function startUpdateChecker() {
    if (window.FIREBASE_SYNC && window.FIREBASE_SYNC.enabled) {
        setInterval(() => {
            if (!window.FIREBASE_SYNC.isSyncing) {
                syncFromFirebase();
            }
        }, window.FIREBASE_SYNC.syncInterval);
        console.log(`Firebase ?�데?�트 ?�인 ?�작 (${window.FIREBASE_SYNC.syncInterval}ms 간격)`);
    }
}

// 로컬 ?�토리�??�서 ?�이??로드
let customers = [];
let purchases = [];
let gifts = [];
let visits = [];

// Firebase?�서 ?�이??로드 (로컬 ?�토리�? ?�거)
async function loadDataFromFirebase() {
    console.log('Firebase?�서 ?�이??로드 �?..');
    
    if (!window.FIREBASE_SYNC || !window.FIREBASE_SYNC.enabled) {
        console.log('Firebase ?�결 ?�됨 - �??�이?�로 초기??);
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
                console.log('Firebase?�서 ?�이??로드 ?�료');
            } else {
                // ?�이?��? ?�으�?�?배열�?초기??
                customers = [];
                purchases = [];
                gifts = [];
                visits = [];
                console.log('Firebase???�이???�음 - �??�이?�로 초기??);
            }
        } else if (response.status === 404) {
            // �??�용??- �??�이?�로 ?�작
            customers = [];
            purchases = [];
            gifts = [];
            visits = [];
            console.log('???�용??- �??�이?�로 초기??);
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('Firebase ?�이??로드 ?�류:', error);
        // ?�류 ??�??�이?�로 초기??
        customers = [];
        purchases = [];
        gifts = [];
        visits = [];
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
            return true;
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('Firebase ?�이???�???�류:', error);
        return false;
    }
}

// URL ?�라미터?�서 고객 ID 가?�오�?
function getCustomerIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return parseInt(urlParams.get('id'));
}

// DOM??로드?????�행
document.addEventListener('DOMContentLoaded', async () => {
    // Firebase ?�동 ?�기???�작
    await initializeFirebaseSync();
    
    // Firebase?�서 ?�이??로드
    await loadDataFromFirebase();
    
    // URL?�서 고객 ID 가?�오�?
    const customerId = getCustomerIdFromUrl();
    
    // 고객 ID가 ?�으�?메인 ?�이지�??�동
    if (!customerId) {
        window.location.href = 'index.html';
        return;
    }
    
    // 고객 ?�보 로드
    loadCustomerDetails(customerId);
    
    // ?�아가�?버튼 ?�벤??리스??
    document.getElementById('back-btn').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    // �??�기 버튼 ?�벤??리스??
    document.getElementById('close-btn').addEventListener('click', () => {
        window.close();
    });
    
    // ???�벤??리스??
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
    
    // ?�집 버튼 ?�벤??리스??
    document.getElementById('edit-customer-btn').addEventListener('click', () => {
        editCustomerInfo(customerId);
    });
    
    // ??�� 버튼 ?�벤??리스??
    document.getElementById('delete-customer-btn').addEventListener('click', () => {
        deleteCustomer(customerId);
    });
    
    // 모바??기기?�서 ?�단 ?�딩 추�?
    document.body.classList.add('has-mobile-buttons');
    
    // 모든 고객???�급???�로??기�??�로 ?�데?�트
    updateAllCustomerRanks();
    
    // 모바??구매 추�? 버튼 ?�벤??리스??
    document.getElementById('mobile-add-purchase-btn').addEventListener('click', () => {
        document.getElementById('add-purchase-btn').click();
    });
    
    // 모바???�물 추�? 버튼 ?�벤??리스??
    document.getElementById('mobile-add-gift-btn').addEventListener('click', () => {
        document.getElementById('add-customer-gift-btn').click();
    });
    
    // 모바??방문 추�? 버튼 ?�벤??리스??
    document.getElementById('mobile-add-visit-btn').addEventListener('click', () => {
        document.getElementById('add-customer-visit-btn').click();
    });
    
    // 구매 기록 추�? 버튼 ?�벤??리스??
    document.getElementById('add-purchase-btn').addEventListener('click', () => {
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
        
        // ??구매 기록 ?�성
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
        
        // 구매 기록 추�?
        purchases.push(newPurchase);
        
        // 고객 ?�보 ?�데?�트 (�?구매?? 구매 ?�수)
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
        const modal = bootstrap.Modal.getInstance(document.getElementById('add-purchase-modal'));
        modal.hide();
        
        // 구매 ?�력 ?�시 로드
        loadCustomerPurchases(customerId);
        
        // ?�림 ?�시
        alert('구매 기록??추�??�었?�니??');
    });
    
    // ?�물 기록 추�? 버튼 ?�벤??리스??
    document.getElementById('add-customer-gift-btn').addEventListener('click', () => {
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
    
    // 구매 PDF ?�운로드 버튼 ?�벤??리스??
    document.getElementById('download-purchase-pdf').addEventListener('click', () => {
        generatePurchasePDF(customerId);
    });
});

// 고객 ?�보 로드 ?�수
function loadCustomerDetails(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
        alert('고객 ?�보�?찾을 ???�습?�다.');
        window.location.href = 'index.html';
        return;
    }
    
    // ?�이지 ?�목 ?�데?�트
    document.title = `${customer.name} - 고객 ?�세 ?�보`;
    
    // 기본 ?�보 ???�용 ?�정
    const infoContent = document.getElementById('customer-info-content');
    
    // ?��? ?�급 변??
    let rankText = '';
    if (customer.rank === 'vvip') rankText = 'VVIP';
    else if (customer.rank === 'vip') rankText = 'VIP';
    else rankText = '?�반';
    
    // ?�별 ?��? 변??
    let genderText = '-';
    if (customer.gender === 'male') genderText = '?�성';
    else if (customer.gender === 'female') genderText = '?�성';
    
    infoContent.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <p><strong>?�름:</strong> ${customer.name}</p>
                <p><strong>?�별:</strong> ${genderText}</p>
                <p><strong>?�화번호:</strong> ${customer.phone}</p>
                <p><strong>?�년?�일:</strong> ${formatDate(customer.birthdate)}</p>
                <p><strong>주소:</strong> ${customer.address || '-'}</p>
            </div>
            <div class="col-md-6">
                <p><strong>주방문매??</strong> ${customer.preferredStore || '-'}</p>
                <p><strong>?�메??</strong> ${customer.email || '-'}</p>
                <p><strong>?�급:</strong> ${rankText}</p>
                <p><strong>�?구매??</strong> ${formatCurrency(customer.totalPurchase)}</p>
                <p><strong>구매 ?�수:</strong> ${customer.purchaseCount}??/p>
                <p><strong>최근 방문??</strong> ${formatDate(customer.lastVisit)}</p>
            </div>
        </div>
        <div class="row">
            <div class="col-12">
                <p><strong>메모:</strong></p>
                <p>${customer.notes || '메모 ?�음'}</p>
            </div>
        </div>
    `;
    
    // 구매 ?�력, ?�물 ?�력, 방문 ?�력 미리 로드
    loadCustomerPurchases(customerId);
    loadCustomerGifts(customerId);
    loadCustomerVisits(customerId);
}

// 고객�?구매 ?�력 로드 ?�수
function loadCustomerPurchases(customerId) {
    const customerPurchases = purchases.filter(p => p.customerId === customerId);
    const purchaseContent = document.getElementById('purchase-history-content');
    
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

// 고객 ?�보 ?�집 ?�수
function editCustomerInfo(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
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
        
        // 고객 ?�보 ?�시 로드
        loadCustomerDetails(editedCustomer.id);
        
        // ?�림 ?�시
        alert('고객 ?�보가 ?�정?�었?�니??');
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

// 고객 ?�급 ?�동 ?�데?�트 ?�수
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
            
            // 메인 ?�이지�??�동
            alert('고객 ?�보가 ??��?�었?�니??');
            window.location.href = 'index.html';
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
                        <div id="edit-purchase-items">
                            ${purchase.items.map((item, index) => `
                                <div class="purchase-item mb-3">
                                    <div class="row">
                                        <div class="col-md-7">
                                            <label class="form-label">?�품�?/label>
                                            <input type="text" class="form-control item-name" value="${item.name}" required>
                                        </div>
                                        <div class="col-md-5">
                                            <label class="form-label">가�?/label>
                                            <input type="number" class="form-control item-price" value="${item.price}" required>
                                        </div>
                                    </div>
                                    ${index > 0 ? `<button type="button" class="btn btn-sm btn-outline-danger mt-2 remove-item-btn">- ??��</button>` : ''}
                                </div>
                            `).join('')}
                        </div>
                        <div class="mb-3">
                            <button type="button" class="btn btn-sm btn-outline-secondary" id="edit-add-item-btn">+ ?�품 추�?</button>
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
            <div class="row">
                <div class="col-md-7">
                    <label class="form-label">?�품�?/label>
                    <input type="text" class="form-control item-name" required>
                </div>
                <div class="col-md-5">
                    <label class="form-label">가�?/label>
                    <input type="number" class="form-control item-price" required>
                </div>
            </div>
            <button type="button" class="btn btn-sm btn-outline-danger mt-2 remove-item-btn">- ??��</button>
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
            loadCustomerDetails(customerId);
            
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
            loadCustomerDetails(customerId);
            
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
            loadCustomerDetails(customerId);
            
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
            loadCustomerDetails(customerId);
            
            // ?�림 ?�시
            alert('방문 기록????��?�었?�니??');
        }
    }
} 
