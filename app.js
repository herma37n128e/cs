// 관리자 계정 정보 (실제 환경에서는 서버에서 관리해야 함)
const ADMIN_USERS = [
    { username: 'admin', password: 'grace1' }
];

// 보안 강화된 로컬 동기화 설정 (기본: 로컬 전용)
window.FIREBASE_SYNC = {
    enabled: false, // 기본적으로 비활성화 (보안상 안전)
    databaseUrl: '', // 사용자가 직접 설정
    apiKey: '', // 사용자가 직접 설정
    syncInterval: 5000, // 5초마다 동기화 체크
    lastSyncTime: 0,
    deviceId: localStorage.getItem('deviceId') || generateDeviceId(),
    isSyncing: false,
    database: null, // Firebase 데이터베이스 참조
    autoSync: false, // 보안상 수동 설정으로 변경
    userPath: '' // 사용자별 데이터 경로
};

// 기기 고유 ID 생성
function generateDeviceId() {
    const deviceId = 'device_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('deviceId', deviceId);
    return deviceId;
}

// Firebase 동기화 상태 표시 (안전한 버전)
function updateSyncStatus(status, message = '') {
    const statusElement = document.getElementById('sync-status');
    if (!statusElement) {
        // 동기화 상태 요소가 없으면 단순히 콘솔에 로그만 출력
        console.log(`Firebase 동기화 상태: ${status}`, message);
        return;
    }
    
    const now = new Date().toLocaleTimeString('ko-KR');
    let statusText = '';
    let statusClass = '';
    
    switch (status) {
        case 'syncing':
            statusText = '🔄 Firebase 동기화 중...';
            statusClass = 'text-warning';
            break;
        case 'success':
            statusText = `✅ Firebase 동기화 완료 (${now})`;
            statusClass = 'text-success';
            break;
        case 'error':
            statusText = `❌ Firebase 동기화 실패: ${message}`;
            statusClass = 'text-danger';
            break;
        case 'offline':
            statusText = '📶 오프라인 모드';
            statusClass = 'text-secondary';
            break;
        case 'realtime':
            statusText = `🔥 Firebase 실시간 연결됨 (${now})`;
            statusClass = 'text-info';
            break;
        default:
            statusText = '⚪ Firebase 대기 중';
            statusClass = 'text-muted';
    }
    
    statusElement.innerHTML = `<small class="${statusClass}">${statusText}</small>`;
}

// Firebase에서 데이터 가져오기 (안전한 버전)
async function syncFromFirebase() {
    if (!window.FIREBASE_SYNC || !window.FIREBASE_SYNC.enabled || window.FIREBASE_SYNC.isSyncing) return;
    
    window.FIREBASE_SYNC.isSyncing = true;
    updateSyncStatus('syncing');
    
    try {
        const userPath = window.FIREBASE_SYNC.userPath || 'default';
        const response = await fetch(`${window.FIREBASE_SYNC.databaseUrl}/${userPath}/customerData.json?auth=${window.FIREBASE_SYNC.apiKey}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const firebaseData = await response.json();
            
            // Firebase 데이터가 있고, 로컬보다 최신인 경우
            if (firebaseData && firebaseData.lastUpdated > window.FIREBASE_SYNC.lastSyncTime) {
                // 현재 기기에서 수정한 것이 아닌 경우에만 동기화
                if (firebaseData.lastModifiedBy !== window.FIREBASE_SYNC.deviceId) {
                    // 로컬 데이터 업데이트 (전역 변수가 존재하는지 확인)
                    if (firebaseData.customers && typeof customers !== 'undefined') customers = firebaseData.customers;
                    if (firebaseData.purchases && typeof purchases !== 'undefined') purchases = firebaseData.purchases;
                    if (firebaseData.gifts && typeof gifts !== 'undefined') gifts = firebaseData.gifts;
                    if (firebaseData.visits && typeof visits !== 'undefined') visits = firebaseData.visits;
                    if (firebaseData.rankChanges && typeof rankChanges !== 'undefined') rankChanges = firebaseData.rankChanges;
                    
                    // 로컬 스토리지 업데이트 (함수가 존재하는지 확인)
                    if (typeof saveDataToStorage === 'function') {
                        saveDataToStorage();
                    }
                    
                    // UI 새로고침 (요소가 존재하는지 확인)
                    const customerListElement = document.getElementById('customer-list');
                    if (customerListElement && customerListElement.style.display !== 'none') {
                        if (typeof loadCustomerList === 'function') {
                            loadCustomerList();
                        }
                    }
                    
                    window.FIREBASE_SYNC.lastSyncTime = firebaseData.lastUpdated;
                    updateSyncStatus('success');
                    console.log('Firebase에서 데이터 동기화 완료');
                }
            } else {
                updateSyncStatus('success');
            }
        } else if (response.status === 404) {
            // 데이터가 없는 경우 (첫 사용)
            console.log('Firebase에 데이터가 없습니다. 로컬 데이터를 업로드합니다.');
            await syncToFirebase();
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('Firebase 동기화 오류:', error);
        updateSyncStatus('error', error.message);
    } finally {
        if (window.FIREBASE_SYNC) {
            window.FIREBASE_SYNC.isSyncing = false;
        }
    }
}

// Firebase에 데이터 저장하기 (안전한 버전)
async function syncToFirebase() {
    if (!window.FIREBASE_SYNC || !window.FIREBASE_SYNC.enabled || window.FIREBASE_SYNC.isSyncing) return;
    
    window.FIREBASE_SYNC.isSyncing = true;
    updateSyncStatus('syncing');
    
    try {
        const syncData = {
            customers: typeof customers !== 'undefined' ? customers : [],
            purchases: typeof purchases !== 'undefined' ? purchases : [],
            gifts: typeof gifts !== 'undefined' ? gifts : [],
            visits: typeof visits !== 'undefined' ? visits : [],
            rankChanges: typeof rankChanges !== 'undefined' ? rankChanges : [],
            lastUpdated: Date.now(),
            lastModifiedBy: window.FIREBASE_SYNC.deviceId,
            version: '1.0.0'
        };
        
        const userPath = window.FIREBASE_SYNC.userPath || 'default';
        const response = await fetch(`${window.FIREBASE_SYNC.databaseUrl}/${userPath}/customerData.json?auth=${window.FIREBASE_SYNC.apiKey}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(syncData)
        });
        
        if (response.ok) {
            window.FIREBASE_SYNC.lastSyncTime = syncData.lastUpdated;
            updateSyncStatus('success');
            console.log('Firebase에 데이터 저장 완료');
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('Firebase 동기화 오류:', error);
        updateSyncStatus('error', error.message);
    } finally {
        if (window.FIREBASE_SYNC) {
            window.FIREBASE_SYNC.isSyncing = false;
        }
    }
}

// Firebase 동기화 설정 함수 (안전한 버전)
function setupFirebaseSync(databaseUrl, apiKey) {
    if (!window.FIREBASE_SYNC) {
        console.error('FIREBASE_SYNC 객체가 초기화되지 않았습니다.');
        return;
    }
    
    window.FIREBASE_SYNC.enabled = true;
    window.FIREBASE_SYNC.databaseUrl = databaseUrl;
    window.FIREBASE_SYNC.apiKey = apiKey;
    
    // 사용자별 경로 생성 및 설정 저장
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
        console.error('로컬 스토리지 저장 오류:', error);
    }
    
    // 즉시 동기화 시작 (안전하게)
    try {
        syncFromFirebase();
    } catch (error) {
        console.error('즉시 Firebase 동기화 오류:', error);
    }
    
    // 정기적 동기화 시작
    try {
        startSyncInterval();
    } catch (error) {
        console.error('정기 Firebase 동기화 시작 오류:', error);
    }
    
    // 실시간 리스너 설정 시도
    try {
        setupRealtimeListener();
    } catch (error) {
        console.error('실시간 리스너 설정 오류:', error);
    }
    
    alert('Firebase 실시간 동기화가 활성화되었습니다!\n이제 모든 기기에서 실시간으로 데이터가 동기화됩니다.');
}

// Firebase 실시간 리스너 설정 (EventSource 사용)
function setupRealtimeListener() {
    if (!window.FIREBASE_SYNC || !window.FIREBASE_SYNC.enabled) return;
    
    const userPath = window.FIREBASE_SYNC.userPath || 'default';
    const eventSourceUrl = `${window.FIREBASE_SYNC.databaseUrl}/${userPath}/customerData.json?auth=${window.FIREBASE_SYNC.apiKey}`;
    
    try {
        // 기존 EventSource가 있으면 닫기
        if (window.FIREBASE_SYNC.eventSource) {
            window.FIREBASE_SYNC.eventSource.close();
        }
        
        // Server-Sent Events를 사용한 실시간 연결
        window.FIREBASE_SYNC.eventSource = new EventSource(eventSourceUrl);
        
        window.FIREBASE_SYNC.eventSource.onopen = function() {
            console.log('Firebase 실시간 연결 성공');
            updateSyncStatus('realtime');
        };
        
        window.FIREBASE_SYNC.eventSource.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                if (data && data.lastModifiedBy !== window.FIREBASE_SYNC.deviceId) {
                    console.log('Firebase에서 실시간 데이터 변경 감지');
                    syncFromFirebase();
                }
            } catch (error) {
                console.error('실시간 데이터 처리 오류:', error);
            }
        };
        
        window.FIREBASE_SYNC.eventSource.onerror = function(event) {
            console.error('Firebase 실시간 연결 오류:', event);
            updateSyncStatus('error', '실시간 연결 끊김');
            
            // 재연결 시도
            setTimeout(() => {
                if (window.FIREBASE_SYNC && window.FIREBASE_SYNC.enabled) {
                    setupRealtimeListener();
                }
            }, 5000);
        };
        
    } catch (error) {
        console.error('실시간 리스너 설정 실패:', error);
        // 실시간 연결 실패 시 정기 동기화로 대체
        startSyncInterval();
    }
}

// 정기적 동기화 시작 (Firebase 버전)
function startSyncInterval() {
    if (window.FIREBASE_SYNC && window.FIREBASE_SYNC.enabled) {
        // 기존 인터벌이 있으면 제거
        if (window.FIREBASE_SYNC.syncIntervalId) {
            clearInterval(window.FIREBASE_SYNC.syncIntervalId);
        }
        
        window.FIREBASE_SYNC.syncIntervalId = setInterval(() => {
            try {
                syncFromFirebase();
            } catch (error) {
                console.error('정기 Firebase 동기화 오류:', error);
            }
        }, window.FIREBASE_SYNC.syncInterval);
    }
}

// 보안 강화된 동기화 초기화 (사용자 설정 필요)
function initializeSecureSync() {
    console.log('보안 동기화 시스템 초기화...');
    
    // 사용자가 설정한 Firebase만 사용 (보안 강화)
    try {
        const config = localStorage.getItem('firebaseSyncConfig');
        if (config) {
            const parsedConfig = JSON.parse(config);
            if (parsedConfig.enabled && parsedConfig.databaseUrl && parsedConfig.apiKey) {
                // 사용자 설정이 있으면 동기화 활성화
                window.FIREBASE_SYNC.enabled = true;
                window.FIREBASE_SYNC.databaseUrl = parsedConfig.databaseUrl;
                window.FIREBASE_SYNC.apiKey = parsedConfig.apiKey;
                window.FIREBASE_SYNC.userPath = parsedConfig.userPath || generateUserPath();
                
                console.log('사용자 Firebase 설정으로 동기화 시작');
                
                // Firebase 동기화 시작
                setTimeout(() => {
                    try {
                        updateSyncStatus('syncing', 'Firebase 연결 중...');
                        syncFromFirebase();
                        setupRealtimeListener();
                    } catch (error) {
                        console.error('Firebase 동기화 시작 오류:', error);
                        updateSyncStatus('error', '동기화 실패');
                        startSyncInterval();
                    }
                }, 1000);
            } else {
                console.log('Firebase 설정 없음 - 로컬 전용 모드');
                updateSyncStatus('offline', '로컬 전용');
            }
        } else {
            console.log('동기화 설정 없음 - 보안 로컬 모드');
            updateSyncStatus('offline', '로컬 전용');
        }
    } catch (error) {
        console.error('동기화 설정 로드 오류:', error);
        updateSyncStatus('offline', '로컬 전용');
    }
}

// 사용자별 고유 경로 생성 (데이터 격리)
function generateUserPath() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const userPath = `users/${timestamp}_${random}`;
    
    // 사용자 경로를 설정에 저장
    try {
        const config = JSON.parse(localStorage.getItem('firebaseSyncConfig') || '{}');
        config.userPath = userPath;
        localStorage.setItem('firebaseSyncConfig', JSON.stringify(config));
    } catch (error) {
        console.error('사용자 경로 저장 오류:', error);
    }
    
    return userPath;
}

// 등급 변경 이력 배열 추가
let rankChanges = []; // 등급 변경 이력

// 로컬 스토리지에서 데이터 로드
function loadDataFromStorage() {
    customers = JSON.parse(localStorage.getItem('customers')) || [];
    purchases = JSON.parse(localStorage.getItem('purchases')) || [];
    gifts = JSON.parse(localStorage.getItem('gifts')) || [];
    visits = JSON.parse(localStorage.getItem('visits')) || [];
    rankChanges = JSON.parse(localStorage.getItem('rankChanges')) || []; // 등급 변경 이력 로드
}

// 로컬 스토리지에 데이터 저장
function saveDataToStorage() {
    localStorage.setItem('customers', JSON.stringify(customers));
    localStorage.setItem('purchases', JSON.stringify(purchases));
    localStorage.setItem('gifts', JSON.stringify(gifts));
    localStorage.setItem('visits', JSON.stringify(visits));
    localStorage.setItem('rankChanges', JSON.stringify(rankChanges)); // 등급 변경 이력 저장
    
    // Firebase 동기화가 활성화되어 있으면 Firebase에도 저장 (안전하게)
    if (window.FIREBASE_SYNC && window.FIREBASE_SYNC.enabled) {
        try {
            syncToFirebase();
        } catch (error) {
            console.error('Firebase 저장 오류:', error);
        }
    }
}

// 테스트용 샘플 데이터 (초기화됨)
let customers = [];

// 구매 이력 샘플 데이터 (초기화됨)
let purchases = [];

// 선물 이력 샘플 데이터 (초기화됨)
let gifts = [];

// 방문 이력 샘플 데이터 (초기화됨)
let visits = [];

// 정렬 상태 변수
let currentSort = {
    field: null,
    order: 'asc'
};

// DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded', () => {
    // 로컬 스토리지에서 데이터 로드
    loadDataFromStorage();
    
    // 보안 강화된 동기화 시작
    initializeSecureSync();
    
    // 로그인 상태 확인
    checkLoginStatus();
    
    // 로그인 폼 제출 이벤트 리스너
    document.getElementById('login').addEventListener('submit', (e) => {
        e.preventDefault();
        const password = document.getElementById('password').value;
        console.log('입력된 패스워드:', password);
        
        // 패스워드 전용 로그인 체크
        if (password === 'grace1') {
            performLogin();
        } else {
            // 로그인 실패
            alert('비밀번호가 올바르지 않습니다.');
        }
    });

    // 로그아웃 버튼 이벤트 리스너
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        performLogout();
    });

    // 네비게이션 메뉴 이벤트 리스너
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.getAttribute('data-page');
            
            // 모든 페이지 숨기기
            document.querySelectorAll('.page').forEach(page => {
                page.classList.add('d-none');
            });
            
            // 선택된 페이지 표시
            document.getElementById(targetPage).classList.remove('d-none');
            
            // 활성 메뉴 표시
            document.querySelectorAll('.nav-link').forEach(navLink => {
                navLink.classList.remove('active');
            });
            link.classList.add('active');
        });
    });

    // 고객 검색 기능 이벤트 리스너
    document.getElementById('search-btn').addEventListener('click', searchCustomers);
    
    // 검색창 입력 이벤트 리스너 (실시간 검색)
    document.getElementById('search-input').addEventListener('input', searchCustomers);

    // 고객 추가 폼 제출 이벤트 리스너
    document.getElementById('customer-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        // 폼에서 데이터 가져오기
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
        
        // 고객 추가
        customers.push(newCustomer);
        
        // 데이터 저장
        saveDataToStorage();
        
        // 폼 초기화
        document.getElementById('customer-form').reset();
        
        // 알림 표시
        alert('고객 정보가 성공적으로 저장되었습니다.');
        
        // 고객 목록 페이지로 이동 및 목록 새로고침
        document.querySelector('.nav-link[data-page="customer-list"]').click();
        loadCustomerList();
    });

    // 선물 검색 기능
    document.getElementById('gift-search-btn').addEventListener('click', () => {
        const searchTerm = document.getElementById('gift-search').value.toLowerCase();
        const filteredGifts = gifts.filter(gift => {
            const customer = customers.find(c => c.id === gift.customerId);
            return customer && customer.name.toLowerCase().includes(searchTerm);
        });
        renderGiftHistory(filteredGifts);
    });

    // 방문 검색 기능
    document.getElementById('visit-search-btn').addEventListener('click', () => {
        const searchTerm = document.getElementById('visit-search').value.toLowerCase();
        const filteredVisits = getVisitSummary().filter(summary => 
            summary.name.toLowerCase().includes(searchTerm)
        );
        renderVisitTracking(filteredVisits);
    });

    // 구매 PDF 다운로드 버튼 이벤트 리스너
    document.getElementById('download-purchase-pdf').addEventListener('click', () => {
        // 현재 보고 있는 고객 ID 가져오기
        const customerId = parseInt(document.querySelector('#purchase-history-content').getAttribute('data-customer-id'));
        if (customerId) {
            generatePurchasePDF(customerId);
        }
    });

    // 고객 상세 정보 모달 탭 이벤트 리스너
    document.querySelectorAll('#customerTabs .nav-link').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            // 현재 보고 있는 고객 ID 가져오기
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

    // 편집 버튼 이벤트 리스너
    document.getElementById('edit-customer-btn').addEventListener('click', () => {
        const customerId = parseInt(document.querySelector('#customer-info-content').getAttribute('data-customer-id'));
        editCustomerInfo(customerId);
    });

    // 삭제 버튼 이벤트 리스너
    document.getElementById('delete-customer-btn').addEventListener('click', () => {
        const customerId = parseInt(document.querySelector('#customer-info-content').getAttribute('data-customer-id'));
        // 모달 닫기
        const modal = bootstrap.Modal.getInstance(document.getElementById('customer-details-modal'));
        modal.hide();
        // 고객 삭제
        deleteCustomer(customerId);
    });



    // 구매 기록 추가 버튼 이벤트 리스너
    document.getElementById('add-purchase-btn').addEventListener('click', () => {
        const customerId = parseInt(document.querySelector('#purchase-history-content').getAttribute('data-customer-id'));
        document.getElementById('purchase-customer-id').value = customerId;
        document.getElementById('purchase-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('add-purchase-form').reset();
        
        // 기본 아이템 입력 필드 초기화
        const purchaseItems = document.getElementById('purchase-items');
        purchaseItems.innerHTML = `
            <div class="purchase-item mb-3">
                <div class="row g-2">
                    <div class="col-12 col-md-7">
                        <label class="form-label">상품명 *</label>
                        <input type="text" class="form-control item-name" required placeholder="구매하신 상품명을 입력하세요">
                    </div>
                    <div class="col-12 col-md-5">
                        <label class="form-label">가격 *</label>
                        <input type="number" class="form-control item-price" required placeholder="0">
                    </div>
                </div>
            </div>
        `;
        
        const purchaseModal = new bootstrap.Modal(document.getElementById('add-purchase-modal'));
        purchaseModal.show();
    });
    
    // 상품 추가 버튼 이벤트 리스너
    document.getElementById('add-item-btn').addEventListener('click', () => {
        const purchaseItems = document.getElementById('purchase-items');
        const newItem = document.createElement('div');
        newItem.className = 'purchase-item mb-3';
        newItem.innerHTML = `
            <div class="row g-2">
                <div class="col-12 col-md-7">
                    <label class="form-label">상품명 *</label>
                    <input type="text" class="form-control item-name" required placeholder="구매하신 상품명을 입력하세요">
                </div>
                <div class="col-12 col-md-5">
                    <label class="form-label">가격 *</label>
                    <input type="number" class="form-control item-price" required placeholder="0">
                </div>
            </div>
            <div class="d-grid mt-2">
                <button type="button" class="btn btn-sm btn-outline-danger remove-item-btn">
                    <i class="bi bi-trash"></i> 이 상품 삭제
                </button>
            </div>
        `;
        purchaseItems.appendChild(newItem);
        
        // 삭제 버튼 이벤트 리스너
        newItem.querySelector('.remove-item-btn').addEventListener('click', function() {
            this.closest('.purchase-item').remove();
        });
    });
    
    // 구매 기록 추가 폼 제출 이벤트 리스너
    document.getElementById('add-purchase-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const customerId = parseInt(document.getElementById('purchase-customer-id').value);
        const date = document.getElementById('purchase-date').value;
        const paymentMethod = document.getElementById('payment-method').value;
        const staff = document.getElementById('purchase-staff').value;
        const store = document.getElementById('purchase-store').value;
        const orderNumber = document.getElementById('purchase-order-number').value;
        const memo = document.getElementById('purchase-memo').value;
        
        // 상품 아이템 가져오기
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
            alert('상품을 최소 1개 이상 입력해주세요.');
            return;
        }
        
        // 구매 기록 추가
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
        
        // 고객 총 구매액 및 구매 횟수 업데이트
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            customer.totalPurchase += totalAmount;
            customer.purchaseCount += 1;
            
            // 고객 등급 자동 업데이트
            updateCustomerRank(customer);
        }
        
        // 데이터 저장
        saveDataToStorage();
        
        // 모달 닫기
        const purchaseModal = bootstrap.Modal.getInstance(document.getElementById('add-purchase-modal'));
        purchaseModal.hide();
        
        // 구매 이력 다시 로드
        loadCustomerPurchases(customerId);
        
        // 고객 상세 정보 업데이트 (총 구매액이 변경되었을 수 있음)
        openCustomerDetails(customerId);
        
        // 알림 표시
        alert('구매 기록이 추가되었습니다.');
    });
    
    // 선물 기록 추가 버튼 이벤트 리스너
    document.getElementById('add-customer-gift-btn').addEventListener('click', () => {
        const customerId = parseInt(document.querySelector('#customer-info-content').getAttribute('data-customer-id'));
        document.getElementById('gift-customer-id').value = customerId;
        document.getElementById('gift-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('add-gift-form').reset();
        
        const giftModal = new bootstrap.Modal(document.getElementById('add-gift-modal'));
        giftModal.show();
    });
    
    // 선물 기록 추가 폼 제출 이벤트 리스너
    document.getElementById('add-gift-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const customerId = parseInt(document.getElementById('gift-customer-id').value);
        const type = document.getElementById('gift-type').value;
        const description = document.getElementById('gift-description').value;
        const date = document.getElementById('gift-date').value;
        const reason = document.getElementById('gift-reason').value;
        
        // 새 선물 기록 생성
        const newGift = {
            id: gifts.length > 0 ? Math.max(...gifts.map(g => g.id)) + 1 : 1,
            customerId,
            type,
            description,
            date,
            reason
        };
        
        // 선물 기록 추가
        gifts.push(newGift);
        
        // 데이터 저장
        saveDataToStorage();
        
        // 모달 닫기
        const modal = bootstrap.Modal.getInstance(document.getElementById('add-gift-modal'));
        modal.hide();
        
        // 선물 이력 다시 로드
        loadCustomerGifts(customerId);
        
        // 알림 표시
        alert('선물 기록이 추가되었습니다.');
    });
    
    // 방문 기록 추가 버튼 이벤트 리스너
    document.getElementById('add-customer-visit-btn').addEventListener('click', () => {
        const customerId = parseInt(document.querySelector('#customer-info-content').getAttribute('data-customer-id'));
        document.getElementById('visit-customer-id').value = customerId;
        document.getElementById('visit-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('add-visit-form').reset();
        
        const visitModal = new bootstrap.Modal(document.getElementById('add-visit-modal'));
        visitModal.show();
    });
    
    // 방문 기록 추가 폼 제출 이벤트 리스너
    document.getElementById('add-visit-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const customerId = parseInt(document.getElementById('visit-customer-id').value);
        const date = document.getElementById('visit-date').value;
        const purpose = document.getElementById('visit-purpose').value;
        const note = document.getElementById('visit-note').value;
        
        // 새 방문 기록 생성
        const newVisit = {
            id: visits.length > 0 ? Math.max(...visits.map(v => v.id)) + 1 : 1,
            customerId,
            date,
            purpose,
            note
        };
        
        // 방문 기록 추가
        visits.push(newVisit);
        
        // 고객 정보 업데이트 (최근 방문일)
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            const visitDate = new Date(date);
            const lastVisitDate = new Date(customer.lastVisit);
            
            if (visitDate > lastVisitDate) {
                customer.lastVisit = date;
            }
        }
        
        // 데이터 저장
        saveDataToStorage();
        
        // 모달 닫기
        const modal = bootstrap.Modal.getInstance(document.getElementById('add-visit-modal'));
        modal.hide();
        
        // 방문 이력 다시 로드
        loadCustomerVisits(customerId);
        
        // 알림 표시
        alert('방문 기록이 추가되었습니다.');
    });

    // 로그인 상태 확인 함수
    function checkLoginStatus() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const username = localStorage.getItem('username');
        
        if (isLoggedIn && username) {
            // 로그인 상태로 화면 표시 (강제 전환)
            performLogin();
        } else {
            // 로그아웃 상태로 화면 표시 (강제 전환)
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

    // 메인 콘텐츠에 has-mobile-buttons 클래스 추가
    document.body.classList.add('has-mobile-buttons');
    
    // 모든 고객의 등급을 새로운 기준으로 업데이트
    updateAllCustomerRanks();
    
    // 모바일 고객 등록 버튼 이벤트 리스너
    document.getElementById('mobile-add-customer-btn').addEventListener('click', () => {
        // 고객 등록 페이지로 이동
        document.querySelector('.nav-link[data-page="add-customer"]').click();
    });

    // 엑셀 업로드 버튼 이벤트 리스너
    document.getElementById('upload-excel-btn').addEventListener('click', handleExcelUpload);

    // 템플릿 다운로드 버튼 이벤트 리스너
    document.getElementById('download-template-btn').addEventListener('click', downloadExcelTemplate);
    
    // 엑셀 다운로드 버튼 이벤트 리스너
    document.getElementById('export-excel-btn').addEventListener('click', exportCustomersToExcel);
});

// 고객 목록 렌더링 함수
function renderCustomerList(customerList) {
    const tbody = document.getElementById('customer-list-body');
    tbody.innerHTML = '';
    
    customerList.forEach((customer, index) => {
        const tr = document.createElement('tr');
        
        // 등급에 따른 배지 클래스 설정
        let rankBadgeClass = '';
        if (customer.rank === 'vvip') rankBadgeClass = 'badge-vvip';
        else if (customer.rank === 'vip') rankBadgeClass = 'badge-vip';
        else rankBadgeClass = 'badge-regular';
        
        // 한글 등급 변환
        let rankText = '';
        if (customer.rank === 'vvip') rankText = 'VVIP';
        else if (customer.rank === 'vip') rankText = 'VIP';
        else rankText = '일반';

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
                    <button class="btn btn-sm btn-outline-primary view-details" data-customer-id="${customer.id}" title="상세보기">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-customer" data-customer-id="${customer.id}" title="삭제">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // 상세보기 버튼 이벤트 리스너 추가
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', () => {
            const customerId = parseInt(button.getAttribute('data-customer-id'));
            // 새 창에서 고객 상세 정보 페이지 열기
            window.open(`customer-details.html?id=${customerId}`, `customer_${customerId}`, 'width=1000,height=800');
        });
    });
    
    // 삭제 버튼 이벤트 리스너 추가
    document.querySelectorAll('.delete-customer').forEach(button => {
        button.addEventListener('click', () => {
            const customerId = parseInt(button.getAttribute('data-customer-id'));
            deleteCustomer(customerId);
        });
    });
}

// 고객 목록 로드 함수
function loadCustomerList() {
    // 검색창 초기화
    document.getElementById('search-input').value = '';
    // 정렬 상태 초기화
    currentSort = { field: null, order: 'asc' };
    // 전체 고객 목록 표시
    renderCustomerList(customers);
    // 헤더 이벤트 리스너 재등록
    attachSortListeners();
}

// 생일 알림 로드 함수
function loadBirthdayAlerts() {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    
    // 이번 달 생일 고객
    const thisMonthBirthdays = customers.filter(customer => {
        if (!customer.birthdate) return false;
        try {
            const birthMonth = parseInt(customer.birthdate.split('-')[1]);
            return birthMonth === currentMonth;
        } catch (e) {
            return false;
        }
    });
    
    // 다음 달 생일 고객
    const nextMonthBirthdays = customers.filter(customer => {
        if (!customer.birthdate) return false;
        try {
            const birthMonth = parseInt(customer.birthdate.split('-')[1]);
            return birthMonth === nextMonth;
        } catch (e) {
            return false;
        }
    });
    
    // 이번 달 생일 목록 렌더링
    const thisMonthList = document.getElementById('this-month-birthdays');
    thisMonthList.innerHTML = '';
    
    if (thisMonthBirthdays.length === 0) {
        thisMonthList.innerHTML = '<li class="list-group-item">이번 달 생일인 고객이 없습니다.</li>';
    } else {
        thisMonthBirthdays.forEach(customer => {
            try {
                const birthDay = parseInt(customer.birthdate.split('-')[2]);
                const today = new Date().getDate();
                const li = document.createElement('li');
                li.className = 'list-group-item';
                
                // 오늘이 생일인 고객 강조
                if (birthDay === today) {
                    li.classList.add('list-group-item-danger');
                }
                
                li.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${customer.name}</strong> (${customer.rank.toUpperCase()})
                            <div><small>${customer.phone}</small></div>
                        </div>
                        <div class="birthday-date">${customer.birthdate.split('-')[1]}월 ${birthDay}일</div>
                    </div>
                `;
                thisMonthList.appendChild(li);
            } catch (e) {
                console.log('생년월일 처리 중 오류:', e);
            }
        });
    }
    
    // 다음 달 생일 목록 렌더링
    const nextMonthList = document.getElementById('next-month-birthdays');
    nextMonthList.innerHTML = '';
    
    if (nextMonthBirthdays.length === 0) {
        nextMonthList.innerHTML = '<li class="list-group-item">다음 달 생일인 고객이 없습니다.</li>';
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
                        <div class="birthday-date">${nextMonth}월 ${birthDay}일</div>
                    </div>
                `;
                nextMonthList.appendChild(li);
            } catch (e) {
                console.log('생년월일 처리 중 오류:', e);
            }
        });
    }
}

// 고객별 구매 정보 재계산 함수
function recalculateCustomerPurchaseInfo() {
    customers.forEach(customer => {
        // 해당 고객의 모든 구매 기록 찾기
        const customerPurchases = purchases.filter(p => p.customerId === customer.id);
        
        // 총 구매액과 구매 횟수 재계산
        let totalPurchase = 0;
        let purchaseCount = customerPurchases.length;
        
        customerPurchases.forEach(purchase => {
            totalPurchase += purchase.totalAmount || 0;
        });
        
        // 고객 정보 업데이트
        customer.totalPurchase = totalPurchase;
        customer.purchaseCount = purchaseCount;
        
        // 등급 업데이트
        updateCustomerRank(customer);
    });
    
    // 데이터 저장
    saveDataToStorage();
}

// 고객 등급별 카운트 로드 함수
function loadRankingCounts() {
    // 구매 정보 재계산
    recalculateCustomerPurchaseInfo();
    
    const vvipCount = customers.filter(c => c.rank === 'vvip').length;
    const vipCount = customers.filter(c => c.rank === 'vip').length;
    const regularCount = customers.filter(c => c.rank === 'regular').length;
    
    document.getElementById('vvip-count').textContent = vvipCount;
    document.getElementById('vip-count').textContent = vipCount;
    document.getElementById('regular-count').textContent = regularCount;
    
    // 고객 등급 목록 렌더링 (등급순 정렬)
    const tbody = document.getElementById('ranking-list-body');
    tbody.innerHTML = '';
    
    // 등급 순서로 정렬 (VVIP > VIP > 일반)
    const sortedCustomers = [...customers].sort((a, b) => {
        const rankOrder = { 'vvip': 3, 'vip': 2, 'regular': 1 };
        if (rankOrder[a.rank] !== rankOrder[b.rank]) {
            return rankOrder[b.rank] - rankOrder[a.rank];
        }
        // 같은 등급 내에서는 총 구매액 순으로 정렬
        return (b.totalPurchase || 0) - (a.totalPurchase || 0);
    });
    
    sortedCustomers.forEach((customer, index) => {
        const tr = document.createElement('tr');
        
        // 등급에 따른 배지 클래스 설정
        let rankBadgeClass = '';
        if (customer.rank === 'vvip') rankBadgeClass = 'badge-vvip';
        else if (customer.rank === 'vip') rankBadgeClass = 'badge-vip';
        else rankBadgeClass = 'badge-regular';
        
        // 한글 등급 변환
        let rankText = '';
        if (customer.rank === 'vvip') rankText = 'VVIP';
        else if (customer.rank === 'vip') rankText = 'VIP';
        else rankText = '일반';
        
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${customer.name}</td>
            <td><span class="badge ${rankBadgeClass}">${rankText}</span></td>
            <td>${formatCurrency(customer.totalPurchase || 0)}</td>
            <td>${customer.purchaseCount || 0}회</td>
            <td><button class="btn btn-sm btn-outline-secondary view-rank-history" data-customer-id="${customer.id}">등급 변경 이력</button></td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // 등급 변경 이력 버튼 이벤트 리스너
    document.querySelectorAll('.view-rank-history').forEach(button => {
        button.addEventListener('click', () => {
            const customerId = parseInt(button.getAttribute('data-customer-id'));
            viewRankChangeHistory(customerId);
        });
    });
}

// 선물 이력 렌더링 함수
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
                <td><button class="btn btn-sm btn-outline-primary view-customer-details" data-customer-id="${customer.id}">상세보기</button></td>
            `;
            
            tbody.appendChild(tr);
        }
    });
    
    if (giftList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">검색 결과가 없습니다.</td></tr>';
    }
    
    // 선물 이력에서 고객 상세보기 버튼 이벤트 리스너
    document.querySelectorAll('.view-customer-details').forEach(button => {
        button.addEventListener('click', () => {
            const customerId = parseInt(button.getAttribute('data-customer-id'));
            // 새 창에서 고객 상세 정보 페이지 열기 (선물 탭 활성화)
            window.open(`customer-details.html?id=${customerId}#gift-tab`, `customer_${customerId}`, 'width=1000,height=800');
        });
    });
}

// 방문 주기 요약 계산 함수
function getVisitSummary() {
    const summary = [];
    
    customers.forEach(customer => {
        // 고객별 방문 내역
        const customerVisits = visits.filter(v => v.customerId === customer.id);
        
        if (customerVisits.length > 0) {
            // 방문 날짜 정렬
            const sortedDates = customerVisits.map(v => new Date(v.date))
                .sort((a, b) => b - a);
            
            // 최근 방문일
            const lastVisit = sortedDates[0];
            
            // 방문 주기 계산 (평균 일수)
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
            
            // 다음 예상 방문일
            const nextExpectedVisit = new Date(lastVisit);
            nextExpectedVisit.setDate(nextExpectedVisit.getDate() + averageCycle);
            
            // 오늘과 다음 예상 방문일 사이의 일수
            const today = new Date();
            const diffTime = nextExpectedVisit - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // 요약 정보 추가
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

// 방문 주기 관리 렌더링 함수
function renderVisitTracking(summaryList) {
    const tbody = document.getElementById('visit-list-body');
    tbody.innerHTML = '';
    
    summaryList.forEach((summary, index) => {
        const tr = document.createElement('tr');
        
        // 다음 방문 예정일에 따른 클래스 설정
        let visitClass = '';
        if (summary.daysUntilNextVisit < 0) {
            visitClass = 'visit-due'; // 방문 예정일 지남
        } else if (summary.daysUntilNextVisit <= 7) {
            visitClass = 'visit-upcoming'; // 방문 예정일 일주일 이내
        } else {
            visitClass = 'visit-recent'; // 최근 방문
        }
        
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${summary.name}</td>
            <td>${formatDate(summary.lastVisit)}</td>
            <td>${summary.averageCycle > 0 ? summary.averageCycle + '일' : '-'}</td>
            <td>${summary.visitCount}회</td>
            <td class="${visitClass}">${formatDate(summary.nextExpectedVisit)}</td>
            <td><button class="btn btn-sm btn-outline-primary view-visit-details" data-customer-id="${summary.id}">상세보기</button></td>
        `;
        
        tbody.appendChild(tr);
    });
    
    if (summaryList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">검색 결과가 없습니다.</td></tr>';
    }
    
    // 상세보기 버튼 이벤트 리스너 추가
    document.querySelectorAll('.view-visit-details').forEach(button => {
        button.addEventListener('click', () => {
            const customerId = parseInt(button.getAttribute('data-customer-id'));
            // 새 창에서 고객 상세 정보 페이지 열기 (방문 탭 활성화)
            window.open(`customer-details.html?id=${customerId}#visit-tab`, `customer_${customerId}`, 'width=1000,height=800');
        });
    });
}

// 고객 상세 정보 모달 열기
function openCustomerDetails(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    const customerInfo = document.getElementById('customer-info-content');
    customerInfo.setAttribute('data-customer-id', customerId);
    
    // 고객 기본 정보 표시
    let genderText = '';
    if (customer.gender === 'male') genderText = '남성';
    else if (customer.gender === 'female') genderText = '여성';
    
    // 등급에 따른 배지 클래스 설정
    let rankBadgeClass = '';
    if (customer.rank === 'vvip') rankBadgeClass = 'badge-vvip';
    else if (customer.rank === 'vip') rankBadgeClass = 'badge-vip';
    else rankBadgeClass = 'badge-regular';
    
    // 한글 등급 변환
    let rankText = '';
    if (customer.rank === 'vvip') rankText = 'VVIP';
    else if (customer.rank === 'vip') rankText = 'VIP';
    else rankText = '일반';
    
    const customerHtml = `
        <div class="customer-detail-header mb-4">
            <h3>${customer.name} <small class="text-muted">(${genderText})</small></h3>
            <div class="d-flex flex-wrap gap-3 align-items-center mt-2">
                <div>
                    <span class="badge ${rankBadgeClass}">${rankText}</span>
                    <button class="btn btn-sm btn-outline-secondary ms-2 view-rank-history" data-customer-id="${customer.id}">
                        <i class="bi bi-clock-history"></i> 등급 이력
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
                    <div class="card-header">기본 정보</div>
                    <div class="card-body">
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item d-flex justify-content-between">
                                <span>주소</span>
                                <span class="text-muted">${customer.address || '-'}</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between">
                                <span>주방문매장</span>
                                <span class="text-muted">${customer.preferredStore || '-'}</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between">
                                <span>최근 방문일</span>
                                <span class="text-muted">${customer.lastVisit ? formatDate(customer.lastVisit) : '-'}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card h-100">
                    <div class="card-header">구매 정보</div>
                    <div class="card-body">
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item d-flex justify-content-between">
                                <span>총 구매액</span>
                                <span class="text-primary fw-bold">${formatCurrency(customer.totalPurchase)}</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between">
                                <span>구매 횟수</span>
                                <span>${customer.purchaseCount}회</span>
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
                                        <button class="btn btn-sm btn-primary" id="save-note-btn">저장</button>
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
    
    // 메모 편집 버튼 이벤트 리스너
    document.getElementById('edit-note-btn').addEventListener('click', () => {
        document.getElementById('customer-note').classList.add('d-none');
        document.getElementById('note-edit-form').classList.remove('d-none');
    });
    
    // 메모 편집 취소 버튼 이벤트 리스너
    document.getElementById('cancel-note-btn').addEventListener('click', () => {
        document.getElementById('customer-note').classList.remove('d-none');
        document.getElementById('note-edit-form').classList.add('d-none');
    });
    
    // 메모 저장 버튼 이벤트 리스너
    document.getElementById('save-note-btn').addEventListener('click', () => {
        const newNote = document.getElementById('note-input').value;
        customer.notes = newNote;
        
        // 데이터 저장
        saveDataToStorage();
        
        // UI 업데이트
        document.getElementById('customer-note').innerHTML = newNote || '-';
        document.getElementById('customer-note').classList.remove('d-none');
        document.getElementById('note-edit-form').classList.add('d-none');
    });
    
    // 등급 변경 이력 버튼 이벤트 리스너
    document.querySelector('.view-rank-history').addEventListener('click', () => {
        viewRankChangeHistory(customerId);
    });
    
    // 첫 번째 탭 (구매 이력) 로드
    loadCustomerPurchases(customerId);
    
    // 모달 표시
    const customerDetailsModal = new bootstrap.Modal(document.getElementById('customer-details-modal'));
    customerDetailsModal.show();
}

// 고객별 구매 이력 로드 함수
function loadCustomerPurchases(customerId) {
    const customerPurchases = purchases.filter(p => p.customerId === customerId);
    const purchaseContent = document.getElementById('purchase-history-content');
    purchaseContent.setAttribute('data-customer-id', customerId);
    
    if (customerPurchases.length === 0) {
        purchaseContent.innerHTML = '<p class="text-center">구매 이력이 없습니다.</p>';
        return;
    }
    
    let html = '<div class="table-responsive"><table class="table table-striped">';
    html += '<thead><tr><th>구매일</th><th>구매제품</th><th>결제금액</th><th>주문장번호</th><th>구매매장</th><th>담당셀러</th><th>메모</th><th>결제방법</th><th>관리</th></tr></thead><tbody>';
    
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
    
    // 구매 이력 수정 버튼 이벤트 리스너
    document.querySelectorAll('.edit-purchase').forEach(button => {
        button.addEventListener('click', () => {
            const purchaseId = parseInt(button.getAttribute('data-purchase-id'));
            editPurchaseRecord(purchaseId, customerId);
        });
    });
    
    // 구매 이력 삭제 버튼 이벤트 리스너
    document.querySelectorAll('.delete-purchase').forEach(button => {
        button.addEventListener('click', () => {
            const purchaseId = parseInt(button.getAttribute('data-purchase-id'));
            deletePurchaseRecord(purchaseId, customerId);
        });
    });
}

// 고객별 선물 이력 로드 함수
function loadCustomerGifts(customerId) {
    const customerGifts = gifts.filter(g => g.customerId === customerId);
    const giftContent = document.getElementById('gift-history-content');
    
    if (customerGifts.length === 0) {
        giftContent.innerHTML = '<p class="text-center">선물 이력이 없습니다.</p>';
        return;
    }
    
    let html = '<div class="table-responsive"><table class="table table-striped">';
    html += '<thead><tr><th>날짜</th><th>선물 종류</th><th>선물 내용</th><th>제공 이유</th><th>관리</th></tr></thead><tbody>';
    
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
    
    // 선물 이력 수정 버튼 이벤트 리스너
    document.querySelectorAll('.edit-gift').forEach(button => {
        button.addEventListener('click', () => {
            const giftId = parseInt(button.getAttribute('data-gift-id'));
            editGiftRecord(giftId, customerId);
        });
    });
    
    // 선물 이력 삭제 버튼 이벤트 리스너
    document.querySelectorAll('.delete-gift').forEach(button => {
        button.addEventListener('click', () => {
            const giftId = parseInt(button.getAttribute('data-gift-id'));
            deleteGiftRecord(giftId, customerId);
        });
    });
}

// 고객별 방문 이력 로드 함수
function loadCustomerVisits(customerId) {
    const customerVisits = visits.filter(v => v.customerId === customerId);
    const visitContent = document.getElementById('visit-history-content');
    
    if (customerVisits.length === 0) {
        visitContent.innerHTML = '<p class="text-center">방문 이력이 없습니다.</p>';
        return;
    }
    
    // 방문 날짜 기준으로 정렬 (최신순)
    const sortedVisits = [...customerVisits].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    let html = '<div class="table-responsive"><table class="table table-striped">';
    html += '<thead><tr><th>날짜</th><th>방문 목적</th><th>메모</th><th>관리</th></tr></thead><tbody>';
    
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
    
    // 방문 이력 수정 버튼 이벤트 리스너
    document.querySelectorAll('.edit-visit').forEach(button => {
        button.addEventListener('click', () => {
            const visitId = parseInt(button.getAttribute('data-visit-id'));
            editVisitRecord(visitId, customerId);
        });
    });
    
    // 방문 이력 삭제 버튼 이벤트 리스너
    document.querySelectorAll('.delete-visit').forEach(button => {
        button.addEventListener('click', () => {
            const visitId = parseInt(button.getAttribute('data-visit-id'));
            deleteVisitRecord(visitId, customerId);
        });
    });
}

// 구매 이력 PDF 생성 함수
function generatePurchasePDF(customerId) {
    const customer = customers.find(c => c.id === customerId);
    const customerPurchases = purchases.filter(p => p.customerId === customerId);
    
    if (!customer || customerPurchases.length === 0) {
        alert('PDF로 변환할 구매 이력이 없습니다.');
        return;
    }
    
    // PDF 생성
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // 제목
    doc.setFontSize(18);
    doc.text('아서앤그레이스 고객 구매 이력', 14, 20);
    
    // 고객 정보
    doc.setFontSize(12);
    doc.text(`고객명: ${customer.name}`, 14, 30);
    doc.text(`연락처: ${customer.phone}`, 14, 37);
    doc.text(`등급: ${customer.rank.toUpperCase()}`, 14, 44);
    doc.text(`총 구매액: ${formatCurrency(customer.totalPurchase)}`, 14, 51);
    
    // 구매 이력 테이블
    doc.setFontSize(14);
    doc.text('구매 이력', 14, 65);
    
    let yPosition = 75;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    customerPurchases.forEach((purchase, index) => {
        // 페이지 확인 및 새 페이지 추가
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }
        
        // 구매 정보
        doc.setFontSize(12);
        doc.text(`${index + 1}. 구매일: ${formatDate(purchase.date)}`, 14, yPosition);
        yPosition += 7;
        doc.text(`   결제 금액: ${formatCurrency(purchase.totalAmount)}`, 14, yPosition);
        yPosition += 7;
        doc.text(`   결제 방법: ${purchase.paymentMethod}`, 14, yPosition);
        yPosition += 7;
        
        // 주문장번호 추가
        if (purchase.orderNumber) {
            doc.text(`   주문장번호: ${purchase.orderNumber}`, 14, yPosition);
            yPosition += 7;
        }
        
        // 구매매장 정보 추가
        if (purchase.store) {
            doc.text(`   구매매장: ${purchase.store}`, 14, yPosition);
            yPosition += 7;
        }
        
        // 담당셀러 정보 추가
        if (purchase.staff) {
            doc.text(`   담당셀러: ${purchase.staff}`, 14, yPosition);
            yPosition += 7;
        }
        
        // 메모 정보 추가
        if (purchase.memo) {
            doc.text(`   메모: ${purchase.memo}`, 14, yPosition);
            yPosition += 7;
        }
        
        // 구매 항목
        doc.text('   구매 제품:', 14, yPosition);
        yPosition += 7;
        
        purchase.items.forEach(item => {
            doc.text(`   - ${item.name}: ${formatCurrency(item.price)}`, 20, yPosition);
            yPosition += 7;
        });
        
        // 구분선
        doc.setDrawColor(200, 200, 200);
        doc.line(14, yPosition, pageWidth - 14, yPosition);
        yPosition += 10;
    });
    
    // 날짜 형식의 파일명 생성
    const today = new Date();
    const fileName = `${customer.name}_구매이력_${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}.pdf`;
    
    // PDF 저장
    doc.save(fileName);
}

// 고객 정보 편집 함수
function editCustomerInfo(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    // 현재 모달을 숨기고 편집 모달 표시
    const currentModal = bootstrap.Modal.getInstance(document.getElementById('customer-details-modal'));
    currentModal.hide();
    
    // 편집 폼 생성
    const editForm = `
    <div class="modal fade" id="edit-customer-modal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">고객 정보 수정</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="edit-customer-form">
                        <input type="hidden" id="edit-customer-id" value="${customer.id}">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="edit-name" class="form-label">이름</label>
                                    <input type="text" class="form-control" id="edit-name" value="${customer.name}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-gender" class="form-label">성별</label>
                                    <select class="form-control" id="edit-gender">
                                        <option value="" ${!customer.gender ? 'selected' : ''}>선택 안함</option>
                                        <option value="male" ${customer.gender === 'male' ? 'selected' : ''}>남성</option>
                                        <option value="female" ${customer.gender === 'female' ? 'selected' : ''}>여성</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-phone" class="form-label">전화번호</label>
                                    <input type="tel" class="form-control" id="edit-phone" value="${customer.phone}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-birthdate" class="form-label">생년월일</label>
                                    <input type="date" class="form-control" id="edit-birthdate" value="${customer.birthdate}">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="edit-address" class="form-label">주소</label>
                                    <input type="text" class="form-control" id="edit-address" value="${customer.address || ''}">
                                </div>
                                <div class="mb-3">
                                    <label for="edit-preferred-store" class="form-label">주방문매장</label>
                                    <input type="text" class="form-control" id="edit-preferred-store" value="${customer.preferredStore || ''}">
                                </div>
                                <div class="mb-3">
                                    <label for="edit-email" class="form-label">이메일</label>
                                    <input type="email" class="form-control" id="edit-email" value="${customer.email || ''}">
                                </div>
                                <div class="mb-3">
                                    <label for="edit-rank" class="form-label">등급</label>
                                    <select class="form-control" id="edit-rank">
                                        <option value="vvip" ${customer.rank === 'vvip' ? 'selected' : ''}>VVIP</option>
                                        <option value="vip" ${customer.rank === 'vip' ? 'selected' : ''}>VIP</option>
                                        <option value="regular" ${customer.rank === 'regular' ? 'selected' : ''}>일반</option>
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
                            <button type="submit" class="btn btn-primary">저장</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // 편집 모달이 이미 있으면 제거
    const existingModal = document.getElementById('edit-customer-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 편집 모달 추가 및 표시
    document.body.insertAdjacentHTML('beforeend', editForm);
    const editModal = new bootstrap.Modal(document.getElementById('edit-customer-modal'));
    editModal.show();
    
    // 편집 폼 제출 이벤트 리스너
    document.getElementById('edit-customer-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        // 수정된 데이터 가져오기
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
        
        // 고객 데이터 업데이트
        const index = customers.findIndex(c => c.id === editedCustomer.id);
        if (index !== -1) {
            customers[index] = editedCustomer;
            
            // 데이터 저장
            saveDataToStorage();
        }
        
        // 모달 닫기
        editModal.hide();
        
        // 고객 목록 새로고침
        loadCustomerList();
        
        // 상세 정보 모달 다시 열기
        setTimeout(() => {
            openCustomerDetails(editedCustomer.id);
        }, 500);
    });
}

// 날짜 포맷 함수 (YYYY-MM-DD -> YYYY년 MM월 DD일)
function formatDate(dateString) {
    if (!dateString) return '-';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    
    return `${parts[0]}년 ${parts[1]}월 ${parts[2]}일`;
}

// 금액 포맷 함수 (1000000 -> 1,000,000원)
function formatCurrency(amount) {
    return amount.toLocaleString('ko-KR') + '원';
}

// 전화번호 포맷팅 함수
function formatPhoneNumber(phone) {
    if (!phone) return '-';
    
    // 숫자만 추출
    const cleaned = phone.replace(/\D/g, '');
    
    // 11자리 휴대폰 번호 (010-xxxx-xxxx)
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }
    // 10자리 번호 (010-xxx-xxxx 또는 02-xxx-xxxx)
    else if (cleaned.length === 10) {
        if (cleaned.startsWith('02')) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
        } else {
            return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
        }
    }
    // 8자리 번호 (02-xxx-xxxx)
    else if (cleaned.length === 8) {
        return cleaned.replace(/(\d{4})(\d{4})/, '02-$1-$2');
    }
    // 기타 형식은 원본 반환
    else {
        return phone;
    }
}

// 고객 등급 업데이트 함수
function updateCustomerRank(customer) {
    const oldRank = customer.rank;
    
    // 새 등급 기준: 2천만원 이상 VVIP, 천만원 이상 VIP, 나머지 일반
    if (customer.totalPurchase >= 20000000) {
        customer.rank = 'vvip';
    } else if (customer.totalPurchase >= 10000000) {
        customer.rank = 'vip';
    } else {
        customer.rank = 'regular';
    }
    
    // 등급이 변경되었을 경우 이력 추가
    if (oldRank !== customer.rank) {
        const rankChange = {
            id: rankChanges.length > 0 ? Math.max(...rankChanges.map(r => r.id)) + 1 : 1,
            customerId: customer.id,
            oldRank: oldRank,
            newRank: customer.rank,
            reason: `구매 누적 금액 ${formatCurrency(customer.totalPurchase)}에 따른 자동 등급 변경`,
            date: new Date().toISOString().split('T')[0],
            changedBy: localStorage.getItem('username') || '시스템'
        };
        
        rankChanges.push(rankChange);
        saveDataToStorage();
    }
    
    return customer;
}

// 모든 고객의 등급을 새로운 기준으로 업데이트하는 함수
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
        saveDataToStorage();
        console.log(`${updatedCount}명의 고객 등급이 새로운 기준으로 업데이트되었습니다.`);
    }
}

// 고객 삭제 함수
function deleteCustomer(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    // 삭제 확인
    if (confirm(`정말로 ${customer.name} 고객의 정보를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
        // 관련된 구매 이력, 선물 이력, 방문 이력도 함께 삭제
        const customerPurchases = purchases.filter(p => p.customerId === customerId);
        const customerGifts = gifts.filter(g => g.customerId === customerId);
        const customerVisits = visits.filter(v => v.customerId === customerId);
        
        // 구매 이력 삭제
        customerPurchases.forEach(purchase => {
            const index = purchases.findIndex(p => p.id === purchase.id);
            if (index !== -1) {
                purchases.splice(index, 1);
            }
        });
        
        // 선물 이력 삭제
        customerGifts.forEach(gift => {
            const index = gifts.findIndex(g => g.id === gift.id);
            if (index !== -1) {
                gifts.splice(index, 1);
            }
        });
        
        // 방문 이력 삭제
        customerVisits.forEach(visit => {
            const index = visits.findIndex(v => v.id === visit.id);
            if (index !== -1) {
                visits.splice(index, 1);
            }
        });
        
        // 고객 정보 삭제
        const index = customers.findIndex(c => c.id === customerId);
        if (index !== -1) {
            customers.splice(index, 1);
            
            // 데이터 저장
            saveDataToStorage();
            
            // 고객 목록 새로고침
            loadCustomerList();
            
            // 알림 표시
            alert('고객 정보가 삭제되었습니다.');
        }
    }
}

// 구매 기록 수정 함수
function editPurchaseRecord(purchaseId, customerId) {
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) return;
    
    // 구매 기록 수정 모달 생성
    const editForm = `
    <div class="modal fade" id="edit-purchase-modal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">구매 기록 수정</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="edit-purchase-form">
                        <input type="hidden" id="edit-purchase-id" value="${purchase.id}">
                        <input type="hidden" id="edit-purchase-customer-id" value="${purchase.customerId}">
                        <div class="mb-3">
                            <label for="edit-purchase-date" class="form-label">구매일</label>
                            <input type="date" class="form-control" id="edit-purchase-date" value="${purchase.date}" required>
                        </div>
                        <div class="card mb-3">
                            <div class="card-header">
                                <small class="text-muted">구매 상품 정보</small>
                            </div>
                            <div class="card-body">
                                <div id="edit-purchase-items">
                                    ${purchase.items.map((item, index) => `
                                        <div class="purchase-item mb-3">
                                            <div class="row g-2">
                                                <div class="col-12 col-md-7">
                                                    <label class="form-label">상품명 *</label>
                                                    <input type="text" class="form-control item-name" value="${item.name}" required placeholder="구매하신 상품명을 입력하세요">
                                                </div>
                                                <div class="col-12 col-md-5">
                                                    <label class="form-label">가격 *</label>
                                                    <input type="number" class="form-control item-price" value="${item.price}" required placeholder="0">
                                                </div>
                                            </div>
                                            ${index > 0 ? `
                                                <div class="d-grid mt-2">
                                                    <button type="button" class="btn btn-sm btn-outline-danger remove-item-btn">
                                                        <i class="bi bi-trash"></i> 이 상품 삭제
                                                    </button>
                                                </div>
                                            ` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                                <div class="d-grid">
                                    <button type="button" class="btn btn-outline-secondary" id="edit-add-item-btn">
                                        <i class="bi bi-plus-circle"></i> 상품 추가
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="edit-purchase-order-number" class="form-label">주문장번호</label>
                            <input type="text" class="form-control" id="edit-purchase-order-number" value="${purchase.orderNumber || ''}">
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label for="edit-purchase-store" class="form-label">구매매장</label>
                                <input type="text" class="form-control" id="edit-purchase-store" value="${purchase.store || ''}">
                            </div>
                            <div class="col-md-6">
                                <label for="edit-purchase-staff" class="form-label">담당셀러</label>
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
                                <option value="신용카드" ${purchase.paymentMethod === '신용카드' ? 'selected' : ''}>신용카드</option>
                                <option value="현금" ${purchase.paymentMethod === '현금' ? 'selected' : ''}>현금</option>
                                <option value="계좌이체" ${purchase.paymentMethod === '계좌이체' ? 'selected' : ''}>계좌이체</option>
                                <option value="기타" ${purchase.paymentMethod === '기타' ? 'selected' : ''}>기타</option>
                            </select>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">취소</button>
                            <button type="submit" class="btn btn-primary">저장</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // 기존 모달이 있으면 제거
    const existingModal = document.getElementById('edit-purchase-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 모달 추가 및 표시
    document.body.insertAdjacentHTML('beforeend', editForm);
    const editModal = new bootstrap.Modal(document.getElementById('edit-purchase-modal'));
    editModal.show();
    
    // 상품 추가 버튼 이벤트 리스너
    document.getElementById('edit-add-item-btn').addEventListener('click', () => {
        const purchaseItems = document.getElementById('edit-purchase-items');
        const newItem = document.createElement('div');
        newItem.className = 'purchase-item mb-3';
        newItem.innerHTML = `
            <div class="row g-2">
                <div class="col-12 col-md-7">
                    <label class="form-label">상품명 *</label>
                    <input type="text" class="form-control item-name" required placeholder="구매하신 상품명을 입력하세요">
                </div>
                <div class="col-12 col-md-5">
                    <label class="form-label">가격 *</label>
                    <input type="number" class="form-control item-price" required placeholder="0">
                </div>
            </div>
            <div class="d-grid mt-2">
                <button type="button" class="btn btn-sm btn-outline-danger remove-item-btn">
                    <i class="bi bi-trash"></i> 이 상품 삭제
                </button>
            </div>
        `;
        purchaseItems.appendChild(newItem);
        
        // 삭제 버튼 이벤트 리스너
        newItem.querySelector('.remove-item-btn').addEventListener('click', function() {
            this.closest('.purchase-item').remove();
        });
    });
    
    // 기존 상품 삭제 버튼 이벤트 리스너
    document.querySelectorAll('#edit-purchase-items .remove-item-btn').forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.purchase-item').remove();
        });
    });
    
    // 수정 폼 제출 이벤트 리스너
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
        
        // 상품 아이템 가져오기
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
            alert('상품을 최소 1개 이상 입력해주세요.');
            return;
        }
        
        // 구매 기록 수정
        const index = purchases.findIndex(p => p.id === purchaseId);
        if (index !== -1) {
            const oldPurchase = purchases[index];
            
            // 고객 총 구매액 업데이트 (기존 금액 빼고 새 금액 추가)
            const customer = customers.find(c => c.id === customerId);
            if (customer) {
                customer.totalPurchase -= oldPurchase.totalAmount;
                customer.totalPurchase += totalAmount;
                
                // 고객 등급 자동 업데이트
                updateCustomerRank(customer);
            }
            
            // 구매 기록 업데이트
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
            
            // 데이터 저장
            saveDataToStorage();
            
            // 모달 닫기
            editModal.hide();
            
            // 구매 이력 다시 로드
            loadCustomerPurchases(customerId);
            
            // 고객 상세 정보 업데이트 (총 구매액이 변경되었을 수 있음)
            openCustomerDetails(customerId);
            
            // 알림 표시
            alert('구매 기록이 수정되었습니다.');
        }
    });
}

// 구매 기록 삭제 함수
function deletePurchaseRecord(purchaseId, customerId) {
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) return;
    
    // 삭제 확인
    if (confirm('정말로 이 구매 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        // 고객 총 구매액 및 구매 횟수 업데이트
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            customer.totalPurchase -= purchase.totalAmount;
            customer.purchaseCount -= 1;
            
            // 고객 등급 자동 업데이트
            updateCustomerRank(customer);
        }
        
        // 구매 기록 삭제
        const index = purchases.findIndex(p => p.id === purchaseId);
        if (index !== -1) {
            purchases.splice(index, 1);
            
            // 데이터 저장
            saveDataToStorage();
            
            // 구매 이력 다시 로드
            loadCustomerPurchases(customerId);
            
            // 고객 상세 정보 업데이트 (총 구매액이 변경되었을 수 있음)
            openCustomerDetails(customerId);
            
            // 알림 표시
            alert('구매 기록이 삭제되었습니다.');
        }
    }
}

// 선물 기록 수정 함수
function editGiftRecord(giftId, customerId) {
    const gift = gifts.find(g => g.id === giftId);
    if (!gift) return;
    
    // 선물 기록 수정 모달 생성
    const editForm = `
    <div class="modal fade" id="edit-gift-modal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">선물 기록 수정</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="edit-gift-form">
                        <input type="hidden" id="edit-gift-id" value="${gift.id}">
                        <input type="hidden" id="edit-gift-customer-id" value="${gift.customerId}">
                        <div class="mb-3">
                            <label for="edit-gift-type" class="form-label">선물 종류</label>
                            <select class="form-control" id="edit-gift-type" required>
                                <option value="생일선물" ${gift.type === '생일선물' ? 'selected' : ''}>생일선물</option>
                                <option value="연말선물" ${gift.type === '연말선물' ? 'selected' : ''}>연말선물</option>
                                <option value="감사선물" ${gift.type === '감사선물' ? 'selected' : ''}>감사선물</option>
                                <option value="기타" ${gift.type === '기타' ? 'selected' : ''}>기타</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="edit-gift-description" class="form-label">선물 내용</label>
                            <input type="text" class="form-control" id="edit-gift-description" value="${gift.description}" required>
                        </div>
                        <div class="mb-3">
                            <label for="edit-gift-date" class="form-label">제공일</label>
                            <input type="date" class="form-control" id="edit-gift-date" value="${gift.date}" required>
                        </div>
                        <div class="mb-3">
                            <label for="edit-gift-reason" class="form-label">제공 이유</label>
                            <input type="text" class="form-control" id="edit-gift-reason" value="${gift.reason}" required>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">취소</button>
                            <button type="submit" class="btn btn-primary">저장</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // 기존 모달이 있으면 제거
    const existingModal = document.getElementById('edit-gift-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 모달 추가 및 표시
    document.body.insertAdjacentHTML('beforeend', editForm);
    const editModal = new bootstrap.Modal(document.getElementById('edit-gift-modal'));
    editModal.show();
    
    // 수정 폼 제출 이벤트 리스너
    document.getElementById('edit-gift-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const giftId = parseInt(document.getElementById('edit-gift-id').value);
        const customerId = parseInt(document.getElementById('edit-gift-customer-id').value);
        const type = document.getElementById('edit-gift-type').value;
        const description = document.getElementById('edit-gift-description').value;
        const date = document.getElementById('edit-gift-date').value;
        const reason = document.getElementById('edit-gift-reason').value;
        
        // 선물 기록 수정
        const index = gifts.findIndex(g => g.id === giftId);
        if (index !== -1) {
            // 선물 기록 업데이트
            gifts[index] = {
                ...gifts[index],
                type,
                description,
                date,
                reason
            };
            
            // 데이터 저장
            saveDataToStorage();
            
            // 모달 닫기
            editModal.hide();
            
            // 선물 이력 다시 로드
            loadCustomerGifts(customerId);
            
            // 알림 표시
            alert('선물 기록이 수정되었습니다.');
        }
    });
}

// 선물 기록 삭제 함수
function deleteGiftRecord(giftId, customerId) {
    const gift = gifts.find(g => g.id === giftId);
    if (!gift) return;
    
    // 삭제 확인
    if (confirm('정말로 이 선물 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        // 선물 기록 삭제
        const index = gifts.findIndex(g => g.id === giftId);
        if (index !== -1) {
            gifts.splice(index, 1);
            
            // 데이터 저장
            saveDataToStorage();
            
            // 선물 이력 다시 로드
            loadCustomerGifts(customerId);
            
            // 알림 표시
            alert('선물 기록이 삭제되었습니다.');
        }
    }
}

// 방문 기록 수정 함수
function editVisitRecord(visitId, customerId) {
    const visit = visits.find(v => v.id === visitId);
    if (!visit) return;
    
    // 방문 기록 수정 모달 생성
    const editForm = `
    <div class="modal fade" id="edit-visit-modal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">방문 기록 수정</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="edit-visit-form">
                        <input type="hidden" id="edit-visit-id" value="${visit.id}">
                        <input type="hidden" id="edit-visit-customer-id" value="${visit.customerId}">
                        <div class="mb-3">
                            <label for="edit-visit-date" class="form-label">방문일</label>
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
                            <button type="submit" class="btn btn-primary">저장</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // 기존 모달이 있으면 제거
    const existingModal = document.getElementById('edit-visit-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 모달 추가 및 표시
    document.body.insertAdjacentHTML('beforeend', editForm);
    const editModal = new bootstrap.Modal(document.getElementById('edit-visit-modal'));
    editModal.show();
    
    // 수정 폼 제출 이벤트 리스너
    document.getElementById('edit-visit-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const visitId = parseInt(document.getElementById('edit-visit-id').value);
        const customerId = parseInt(document.getElementById('edit-visit-customer-id').value);
        const date = document.getElementById('edit-visit-date').value;
        const purpose = document.getElementById('edit-visit-purpose').value;
        const note = document.getElementById('edit-visit-note').value;
        
        // 방문 기록 수정
        const index = visits.findIndex(v => v.id === visitId);
        if (index !== -1) {
            // 방문 기록 업데이트
            visits[index] = {
                ...visits[index],
                date,
                purpose,
                note
            };
            
            // 데이터 저장
            saveDataToStorage();
            
            // 고객 최근 방문일 업데이트
            const customer = customers.find(c => c.id === customerId);
            if (customer) {
                // 모든 방문 날짜 확인하여 최근 방문일 업데이트
                const customerVisits = visits.filter(v => v.customerId === customerId);
                if (customerVisits.length > 0) {
                    const sortedDates = customerVisits.map(v => v.date).sort((a, b) => 
                        new Date(b) - new Date(a)
                    );
                    customer.lastVisit = sortedDates[0];
                }
            }
            
            // 모달 닫기
            editModal.hide();
            
            // 방문 이력 다시 로드
            loadCustomerVisits(customerId);
            
            // 고객 상세 정보 업데이트 (최근 방문일이 변경되었을 수 있음)
            openCustomerDetails(customerId);
            
            // 알림 표시
            alert('방문 기록이 수정되었습니다.');
        }
    });
}

// 방문 기록 삭제 함수
function deleteVisitRecord(visitId, customerId) {
    const visit = visits.find(v => v.id === visitId);
    if (!visit) return;
    
    // 삭제 확인
    if (confirm('정말로 이 방문 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        // 방문 기록 삭제
        const index = visits.findIndex(v => v.id === visitId);
        if (index !== -1) {
            visits.splice(index, 1);
            
            // 데이터 저장
            saveDataToStorage();
            
            // 고객 최근 방문일 업데이트
            const customer = customers.find(c => c.id === customerId);
            if (customer) {
                // 모든 방문 날짜 확인하여 최근 방문일 업데이트
                const customerVisits = visits.filter(v => v.customerId === customerId);
                if (customerVisits.length > 0) {
                    const sortedDates = customerVisits.map(v => v.date).sort((a, b) => 
                        new Date(b) - new Date(a)
                    );
                    customer.lastVisit = sortedDates[0];
                } else {
                    // 방문 기록이 없으면 기본값으로 설정
                    customer.lastVisit = new Date().toISOString().split('T')[0];
                }
            }
            
            // 방문 이력 다시 로드
            loadCustomerVisits(customerId);
            
            // 고객 상세 정보 업데이트 (최근 방문일이 변경되었을 수 있음)
            openCustomerDetails(customerId);
            
            // 알림 표시
            alert('방문 기록이 삭제되었습니다.');
        }
    }
}

// 고객 검색 함수
function searchCustomers() {
    const searchTerm = document.getElementById('search-input').value.trim().toLowerCase();
    let displayedCustomers = customers;
    
    // 검색창이 비어있지 않으면 필터링
    if (searchTerm !== '') {
        displayedCustomers = customers.filter(customer => {
            // 기본 정보 검색
            const nameMatch = customer.name.toLowerCase().includes(searchTerm);
            const phoneMatch = customer.phone && customer.phone.toLowerCase().includes(searchTerm);
            const storeMatch = customer.preferredStore && customer.preferredStore.toLowerCase().includes(searchTerm);
            const notesMatch = customer.notes && customer.notes.toLowerCase().includes(searchTerm);
            
            // 등급 검색 (다양한 표현 지원)
            let rankMatch = false;
            if (customer.rank === 'vvip') {
                rankMatch = searchTerm.includes('vvip') || searchTerm.includes('브이브이아이피') || searchTerm.includes('최고등급');
            } else if (customer.rank === 'vip') {
                rankMatch = searchTerm.includes('vip') || searchTerm.includes('브이아이피') || searchTerm.includes('우수등급');
            } else if (customer.rank === 'regular') {
                rankMatch = searchTerm.includes('일반') || searchTerm.includes('레귤러') || searchTerm.includes('regular') || searchTerm.includes('기본');
            }
            
            return nameMatch || phoneMatch || storeMatch || notesMatch || rankMatch;
        });
    }
    
    // 현재 정렬 상태가 있으면 적용
    if (currentSort.field) {
        displayedCustomers = applySort(displayedCustomers, currentSort.field, currentSort.order);
    }
    
    renderCustomerList(displayedCustomers);
}

// 등급 변경 이력 보기 함수
function viewRankChangeHistory(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    const customerRankChanges = rankChanges.filter(rc => rc.customerId === customerId);
    
    // 등급 변경 이력 모달 생성
    const historyModal = `
    <div class="modal fade" id="rank-history-modal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${customer.name} 고객 등급 변경 이력</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <div>
                                <strong>현재 등급:</strong> 
                                <span class="badge ${customer.rank === 'vvip' ? 'badge-vvip' : customer.rank === 'vip' ? 'badge-vip' : 'badge-regular'}">
                                    ${customer.rank === 'vvip' ? 'VVIP' : customer.rank === 'vip' ? 'VIP' : '일반'}
                                </span>
                            </div>
                            <button class="btn btn-sm btn-primary" id="manual-rank-change-btn">수동 등급 변경</button>
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>변경일</th>
                                    <th>이전 등급</th>
                                    <th>변경 등급</th>
                                    <th>변경 사유</th>
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
                                                    ${rc.oldRank === 'vvip' ? 'VVIP' : rc.oldRank === 'vip' ? 'VIP' : '일반'}
                                                </span>
                                            </td>
                                            <td>
                                                <span class="badge ${rc.newRank === 'vvip' ? 'badge-vvip' : rc.newRank === 'vip' ? 'badge-vip' : 'badge-regular'}">
                                                    ${rc.newRank === 'vvip' ? 'VVIP' : rc.newRank === 'vip' ? 'VIP' : '일반'}
                                                </span>
                                            </td>
                                            <td>${rc.reason}</td>
                                            <td>${rc.changedBy}</td>
                                        </tr>
                                    `).join('') 
                                    : '<tr><td colspan="5" class="text-center">등급 변경 이력이 없습니다.</td></tr>'
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">닫기</button>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // 기존 모달이 있으면 제거
    const existingModal = document.getElementById('rank-history-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 모달 추가 및 표시
    document.body.insertAdjacentHTML('beforeend', historyModal);
    const modal = new bootstrap.Modal(document.getElementById('rank-history-modal'));
    modal.show();
    
    // 수동 등급 변경 버튼 이벤트 리스너
    document.getElementById('manual-rank-change-btn').addEventListener('click', () => {
        manualRankChange(customerId, modal);
    });
}

// 수동 등급 변경 함수
function manualRankChange(customerId, historyModal) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    // 수동 등급 변경 모달 생성
    const changeForm = `
    <div class="modal fade" id="manual-rank-change-modal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${customer.name} 고객 등급 수동 변경</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="rank-change-form">
                        <input type="hidden" id="rank-change-customer-id" value="${customer.id}">
                        <div class="mb-3">
                            <label for="current-rank" class="form-label">현재 등급</label>
                            <input type="text" class="form-control" id="current-rank" value="${customer.rank === 'vvip' ? 'VVIP' : customer.rank === 'vip' ? 'VIP' : '일반'}" disabled>
                        </div>
                        <div class="mb-3">
                            <label for="new-rank" class="form-label">변경 등급</label>
                            <select class="form-control" id="new-rank" required>
                                <option value="vvip" ${customer.rank === 'vvip' ? 'selected' : ''}>VVIP</option>
                                <option value="vip" ${customer.rank === 'vip' ? 'selected' : ''}>VIP</option>
                                <option value="regular" ${customer.rank === 'regular' ? 'selected' : ''}>일반</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="rank-change-reason" class="form-label">변경 사유</label>
                            <textarea class="form-control" id="rank-change-reason" rows="3" required></textarea>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">취소</button>
                            <button type="submit" class="btn btn-primary">저장</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // 기존 모달이 있으면 제거
    const existingModal = document.getElementById('manual-rank-change-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 모달 추가 및 표시
    document.body.insertAdjacentHTML('beforeend', changeForm);
    const modal = new bootstrap.Modal(document.getElementById('manual-rank-change-modal'));
    modal.show();
    
    // 수동 등급 변경 폼 제출 이벤트 리스너
    document.getElementById('rank-change-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const customerId = parseInt(document.getElementById('rank-change-customer-id').value);
        const newRank = document.getElementById('new-rank').value;
        const reason = document.getElementById('rank-change-reason').value;
        
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            const oldRank = customer.rank;
            
            // 등급이 변경된 경우에만 이력 추가
            if (oldRank !== newRank) {
                // 고객 등급 변경
                customer.rank = newRank;
                
                // 등급 변경 이력 추가
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
                
                // 데이터 저장
                saveDataToStorage();
                
                // 알림 표시
                alert('고객 등급이 변경되었습니다.');
                
                // 모달 닫기
                modal.hide();
                
                // 이력 모달 닫기
                historyModal.hide();
                
                // 고객 목록 새로고침
                loadCustomerList();
                
                // 등급 변경 이력 모달 다시 열기
                viewRankChangeHistory(customerId);
            } else {
                alert('같은 등급으로는 변경할 수 없습니다.');
            }
        }
    });
}

// 엑셀 업로드 처리 함수
function handleExcelUpload() {
    const fileInput = document.getElementById('excel-file');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('엑셀 파일을 선택해주세요.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // 고객정보 시트 처리
            let customerData = [];
            let purchaseData = [];
            
            // 시트별 데이터 추출
            console.log('🔍 발견된 시트:', workbook.SheetNames);
            
            workbook.SheetNames.forEach((sheetName, index) => {
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                console.log(`📋 시트 "${sheetName}" 데이터 (첫 3행):`, jsonData.slice(0, 3));
                
                if (index === 0) {
                    // 첫 번째 시트는 항상 고객정보로 간주
                    customerData = jsonData;
                    console.log('✅ 첫 번째 시트를 고객정보로 설정');
                } else if (index === 1) {
                    // 두 번째 시트는 항상 구매이력으로 간주
                    purchaseData = jsonData;
                    console.log('✅ 두 번째 시트를 구매이력으로 설정');
                } else if (sheetName.includes('고객') || sheetName.includes('customer') || workbook.SheetNames.length === 1) {
                    customerData = jsonData;
                    console.log('✅ 시트명으로 고객정보 인식');
                } else if (sheetName.includes('구매') || sheetName.includes('purchase')) {
                    purchaseData = jsonData;
                    console.log('✅ 시트명으로 구매이력 인식');
                }
            });
            
            // 단일 시트인 경우 고객정보로 처리
            if (workbook.SheetNames.length === 1 && customerData.length === 0) {
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                customerData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            }
            
            console.log('📊 최종 처리할 데이터:');
            console.log('고객정보 행 수:', customerData.length);
            console.log('구매이력 행 수:', purchaseData.length);
            
            processExcelDataWithPurchases(customerData, purchaseData);
        } catch (error) {
            alert('엑셀 파일 읽기 중 오류가 발생했습니다: ' + error.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

// 고객정보와 구매이력을 함께 처리하는 함수
function processExcelDataWithPurchases(customerData, purchaseData) {
    let customerSuccessCount = 0;
    let customerErrorCount = 0;
    let purchaseSuccessCount = 0;
    let purchaseErrorCount = 0;
    const errors = [];
    const customerPhoneMap = new Map(); // 전화번호로 고객 ID 매핑
    
    // 기존 고객들을 맵에 추가
    customers.forEach(customer => {
        const cleanPhone = customer.phone.replace(/[\s-]/g, '');
        customerPhoneMap.set(cleanPhone, customer.id);
    });
    console.log('💡 기존 고객 매핑 완료:', customerPhoneMap.size, '명');
    
    // 1단계: 고객정보 처리
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
                    phone: (row[2] || '').toString().replace(/[\s-]/g, ''), // 전화번호 정리
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
                    errors.push(`고객정보 ${i + 1}행: 이름과 전화번호는 필수입니다.`);
                    customerErrorCount++;
                    continue;
                }
                
                // 전화번호 중복 체크 (동일인으로 간주)
                const existingCustomer = customers.find(c => c.phone.replace(/[\s-]/g, '') === customer.phone);
                if (existingCustomer) {
                    // 기존 고객 정보를 업데이트하고 맵에 추가
                    customerPhoneMap.set(customer.phone, existingCustomer.id);
                    errors.push(`고객정보 ${i + 1}행: 전화번호 ${customer.phone}는 이미 존재합니다. (기존 고객과 연결)`);
                    customerErrorCount++;
                    continue;
                }
                
                customers.push(customer);
                customerPhoneMap.set(customer.phone, customer.id);
                customerSuccessCount++;
                
            } catch (error) {
                errors.push(`고객정보 ${i + 1}행: 데이터 처리 오류 - ${error.message}`);
                customerErrorCount++;
            }
        }
    }
    
    // 2단계: 구매이력 처리
    console.log('💰 구매이력 처리 시작...');
    console.log('구매이력 데이터 길이:', purchaseData.length);
    console.log('등록된 고객 수:', customers.length);
    console.log('고객 전화번호 맵:', Array.from(customerPhoneMap.entries()));
    
    if (purchaseData.length > 1) {
        console.log('구매이력 헤더:', purchaseData[0]);
        for (let i = 1; i < purchaseData.length; i++) {
            const row = purchaseData[i];
            
            // 처음 5행만 상세 로그 출력
            const isDetailLog = i <= 5;
            
            if (isDetailLog) {
                console.log(`📊 구매이력 ${i + 1}행 체크:`, { 'row존재': !!row, '길이': row?.length, '첫번째값': row?.[0] });
            }
            
            if (!row || row.length === 0 || (!row[0] && row[0] !== 0)) {
                if (isDetailLog) console.log(`⏭️ 구매이력 ${i + 1}행 건너뜀 (빈 행)`);
                continue;
            }
            
            try {
                // 디버깅: 원본 데이터 확인 (처음 5행만)
                if (isDetailLog) {
                    console.log(`\n🔍 구매이력 ${i + 1}행 원본:`, row);
                }
                
                // 전화번호 정리 (공백, 하이픈 제거)
                const customerPhone = (row[0] || '').toString().replace(/[\s-]/g, '');
                const purchaseDate = convertDate(row[1]);
                const itemName = row[2] || '';
                // 가격 처리 개선 (다양한 형태의 가격 형식 처리)
                let priceStr = (row[3] || '').toString()
                    .replace(/,/g, '')           // 콤마 제거
                    .replace(/원/g, '')          // '원' 문자 제거
                    .replace(/\s/g, '')          // 공백 제거
                    .replace(/[^0-9.-]/g, '');   // 숫자, 점, 하이픈 외 모든 문자 제거
                
                const price = parseFloat(priceStr) || 0;
                
                if (isDetailLog) {
                    console.log(`💰 가격 처리:`, {
                        '원본': row[3],
                        '처리후 문자열': priceStr,
                        '최종 숫자': price,
                        '유효한가': price > 0
                    });
                }
                const orderNumber = row[4] || '';
                const store = row[5] || '';
                const seller = row[6] || '';
                const paymentMethod = row[7] || '신용카드';
                const memo = row[8] || '';
                
                // 디버깅: 처리된 데이터 확인 (처음 5행만)
                if (isDetailLog) {
                    console.log(`📝 구매이력 ${i + 1}행 처리후:`, {
                        customerPhone, purchaseDate, itemName, price, orderNumber, store, seller, paymentMethod, memo
                    });
                    
                    // 필수 필드 검증 (더 자세한 로그)
                    console.log(`✅ 필수 필드 검증:`, {
                        '전화번호': customerPhone ? '✓' : '✗',
                        '상품명': itemName ? '✓' : '✗', 
                        '가격': price > 0 ? '✓' : '✗',
                        '가격값': price,
                        '가격문자열': priceStr
                    });
                }
                
                if (!customerPhone || !itemName || price <= 0) {
                    const reason = [];
                    if (!customerPhone) reason.push('전화번호 없음');
                    if (!itemName) reason.push('상품명 없음');
                    if (price <= 0) reason.push(`가격 오류(${price})`);
                    
                    errors.push(`구매이력 ${i + 1}행: ${reason.join(', ')} (전화번호:"${customerPhone}", 상품명:"${itemName}", 가격:${price})`);
                    purchaseErrorCount++;
                    if (isDetailLog) console.log(`❌ 구매이력 ${i + 1}행 실패: ${reason.join(', ')}`);
                    continue;
                }
                
                // 고객 찾기 (새로 등록된 고객 또는 기존 고객)
                let customerId = customerPhoneMap.get(customerPhone);
                if (isDetailLog) console.log(`👤 고객 찾기: 전화번호="${customerPhone}", 맵에서 찾은 ID=${customerId}`);
                
                if (!customerId) {
                    // 기존 고객에서 전화번호 정리해서 비교
                    const existingCustomer = customers.find(c => c.phone.replace(/[\s-]/g, '') === customerPhone);
                    if (existingCustomer) {
                        customerId = existingCustomer.id;
                        // 새로 등록된 고객과의 연결을 위해 맵에 추가
                        customerPhoneMap.set(customerPhone, customerId);
                        if (isDetailLog) console.log(`✅ 기존 고객 발견: ${existingCustomer.name} (ID: ${customerId})`);
                    } else {
                        // 맵에 있는 전화번호 목록 확인
                        const mapPhones = Array.from(customerPhoneMap.keys()).slice(0, 10).join(', ');
                        errors.push(`구매이력 ${i + 1}행: 전화번호 "${customerPhone}"에 해당하는 고객을 찾을 수 없습니다. (맵의 전화번호 예시: ${mapPhones}...)`);
                        purchaseErrorCount++;
                        continue;
                    }
                }
                
                // 구매 기록 추가
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
                
                // 고객 구매 정보 업데이트
                const customer = customers.find(c => c.id === customerId);
                if (customer) {
                    const oldTotal = customer.totalPurchase;
                    const oldCount = customer.purchaseCount;
                    
                    customer.totalPurchase += price;
                    customer.purchaseCount += 1;
                    customer.lastVisit = purchase.date;
                    updateCustomerRank(customer);
                    
                    console.log(`구매이력 추가: ${customer.name} (${customerPhone}) - 기존: ${formatCurrency(oldTotal)}/${oldCount}건 → 변경: ${formatCurrency(customer.totalPurchase)}/${customer.purchaseCount}건`);
                }
                
                purchaseSuccessCount++;
                
            } catch (error) {
                errors.push(`구매이력 ${i + 1}행: 데이터 처리 오류 - ${error.message}`);
                purchaseErrorCount++;
            }
        }
    }
    
    // 결과 저장 및 알림
    if (customerSuccessCount > 0 || purchaseSuccessCount > 0) {
        saveDataToStorage();
        loadCustomerList();
    }
    
    let message = `업로드 완료!\n`;
    message += `고객정보 - 성공: ${customerSuccessCount}명, 실패: ${customerErrorCount}명\n`;
    message += `구매이력 - 성공: ${purchaseSuccessCount}건, 실패: ${purchaseErrorCount}건`;
    
    if (errors.length > 0) {
        message += '\n\n💡 오류 해결 가이드:\n';
        message += '• 구매이력 시트의 고객전화번호가 고객정보 시트의 전화번호와 정확히 일치하는지 확인하세요\n';
        message += '• 전화번호에 공백이나 특수문자가 없는지 확인하세요\n';
        message += '• 가격이 숫자로 입력되었는지 확인하세요\n\n';
        message += '오류 내용:\n' + errors.slice(0, 15).join('\n');
        if (errors.length > 15) {
            message += `\n... 및 ${errors.length - 15}개 추가 오류`;
        }
    }
    
    // 긴 메시지를 위해 confirm 대신 새 창 사용
    if (message.length > 1000) {
        const newWindow = window.open('', '_blank', 'width=600,height=400');
        newWindow.document.write(`
            <html>
                <head><title>엑셀 업로드 결과</title></head>
                <body style="font-family: Arial; padding: 20px; white-space: pre-wrap;">
                    ${message.replace(/\n/g, '<br>')}
                    <br><br>
                    <button onclick="window.close()">닫기</button>
                </body>
            </html>
        `);
    } else {
        alert(message);
    }
    document.getElementById('excel-file').value = '';
}

// 기존 엑셀 데이터 처리 함수 (단일 시트 호환용)
function processExcelData(data) {
    if (data.length < 2) {
        alert('엑셀 파일에 데이터가 없습니다.');
        return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // 첫 번째 행은 헤더로 간주하고 건너뛰기
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        
        // 빈 행 건너뛰기
        if (!row || row.length === 0 || !row[0]) {
            continue;
        }
        
        try {
            // 엑셀 데이터를 고객 객체로 변환
            const customer = {
                id: customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1,
                name: row[0] || '',
                gender: convertGender(row[1]),
                phone: (row[2] || '').toString().replace(/[\s-]/g, ''), // 전화번호 정리
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
            
            // 필수 필드 검증
            if (!customer.name || !customer.phone) {
                errors.push(`${i + 1}행: 이름과 전화번호는 필수입니다.`);
                errorCount++;
                continue;
            }
            
            // 전화번호 중복 체크 (동일인으로 간주)
            if (customers.find(c => c.phone.replace(/[\s-]/g, '') === customer.phone)) {
                errors.push(`${i + 1}행: 전화번호 ${customer.phone}는 이미 존재합니다. (동일인으로 간주하여 생략)`);
                errorCount++;
                continue;
            }
            
            customers.push(customer);
            successCount++;
            
        } catch (error) {
            errors.push(`${i + 1}행: 데이터 처리 오류 - ${error.message}`);
            errorCount++;
        }
    }
    
    // 결과 저장 및 알림
    if (successCount > 0) {
        saveDataToStorage();
        loadCustomerList();
    }
    
    let message = `업로드 완료!\n성공: ${successCount}명, 실패: ${errorCount}명`;
    if (errors.length > 0) {
        message += '\n\n오류 내용:\n' + errors.slice(0, 5).join('\n');
        if (errors.length > 5) {
            message += `\n... 및 ${errors.length - 5}개 추가 오류`;
        }
    }
    
    alert(message);
    
    // 파일 입력 초기화
    document.getElementById('excel-file').value = '';
}

// 성별 변환 함수
function convertGender(value) {
    if (!value) return '';
    const str = value.toString().toLowerCase();
    if (str.includes('남') || str === 'm' || str === 'male') return 'male';
    if (str.includes('여') || str === 'f' || str === 'female') return 'female';
    return '';
}

// 날짜 변환 함수
function convertDate(value) {
    if (!value) return '';
    
    try {
        // 엑셀 날짜 형식 처리
        if (typeof value === 'number') {
            // Excel date serial number
            const date = new Date((value - 25569) * 86400 * 1000);
            return date.toISOString().split('T')[0];
        }
        
        // 문자열 날짜 처리
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

// 고객 데이터 엑셀 내보내기 함수
function exportCustomersToExcel() {
    if (customers.length === 0) {
        alert('내보낼 고객 데이터가 없습니다.');
        return;
    }
    
    // 고객정보 시트 데이터 준비
    const customerData = [
        ['번호', '이름', '성별', '전화번호', '생년월일', '주소', '주방문매장', '이메일', '등급', '총구매액', '구매횟수', '최근방문일', '메모']
    ];
    
    customers.forEach((customer, index) => {
        const genderText = customer.gender === 'male' ? '남성' : customer.gender === 'female' ? '여성' : '';
        const rankText = customer.rank === 'vvip' ? 'VVIP' : customer.rank === 'vip' ? 'VIP' : '일반';
        
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
    
    // 구매이력 시트 데이터 준비
    const purchaseData = [
        ['번호', '고객명', '고객전화번호', '구매일', '상품명', '가격', '주문장번호', '구매매장', '담당셀러', '결제방법', '메모']
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
                    purchase.paymentMethod || '신용카드',
                    purchase.memo || ''
                ]);
            });
        }
    });
    
    // 선물이력 시트 데이터 준비
    const giftData = [
        ['번호', '고객명', '고객전화번호', '선물종류', '선물내용', '제공일자', '제공이유']
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
    
    // 방문이력 시트 데이터 준비
    const visitData = [
        ['번호', '고객명', '고객전화번호', '방문일', '방문매장', '방문목적', '메모']
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
    
    // 워크북 생성
    const workbook = XLSX.utils.book_new();
    
    // 각 시트 추가
    const customerSheet = XLSX.utils.aoa_to_sheet(customerData);
    XLSX.utils.book_append_sheet(workbook, customerSheet, '고객정보');
    
    if (purchaseData.length > 1) {
        const purchaseSheet = XLSX.utils.aoa_to_sheet(purchaseData);
        XLSX.utils.book_append_sheet(workbook, purchaseSheet, '구매이력');
    }
    
    if (giftData.length > 1) {
        const giftSheet = XLSX.utils.aoa_to_sheet(giftData);
        XLSX.utils.book_append_sheet(workbook, giftSheet, '선물이력');
    }
    
    if (visitData.length > 1) {
        const visitSheet = XLSX.utils.aoa_to_sheet(visitData);
        XLSX.utils.book_append_sheet(workbook, visitSheet, '방문이력');
    }
    
    // 파일명에 현재 날짜 포함
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const fileName = `고객관리데이터_${dateStr}.xlsx`;
    
    // 파일 다운로드
    XLSX.writeFile(workbook, fileName);
    
    alert(`고객 데이터가 성공적으로 다운로드되었습니다!\n파일명: ${fileName}\n\n포함된 시트:\n- 고객정보 (${customers.length}명)\n- 구매이력 (${purchases.length}건)\n- 선물이력 (${gifts.length}건)\n- 방문이력 (${visits.length}건)`);
}

// 엑셀 템플릿 다운로드 함수
function downloadExcelTemplate() {
    // 고객 기본정보 시트
    const customerData = [
        ['이름', '성별', '전화번호', '생년월일', '주소', '주방문매장', '이메일', '메모'],
        ['홍길동', '남성', '010-1234-5678', '1990-01-01', '서울시 강남구', '강남점', 'hong@example.com', '우수고객'],
        ['김영희', '여성', '010-9876-5432', '1985-05-15', '서울시 서초구', '서초점', 'kim@example.com', '단골고객'],
        ['박철수', '남성', '010-5555-1234', '1988-12-25', '서울시 송파구', '잠실점', 'park@example.com', 'VIP고객']
    ];
    
    // 구매이력 시트 (고객 전화번호로 연결)
    const purchaseData = [
        ['고객전화번호', '구매일', '상품명', '가격', '주문장번호', '구매매장', '담당셀러', '결제방법', '메모'],
        ['010-1234-5678', '2024-01-15', '가죽 핸드백', '2800000', 'ORD-2024-001', '강남점', '김셀러', '신용카드', '신년 선물'],
        ['010-1234-5678', '2024-02-14', '실크 스카프', '450000', 'ORD-2024-002', '강남점', '김셀러', '신용카드', '발렌타인 선물'],
        ['010-9876-5432', '2024-01-20', '디자이너 코트', '3200000', 'ORD-2024-003', '서초점', '이셀러', '현금', '겨울 아우터'],
        ['010-5555-1234', '2024-03-01', '명품 시계', '5500000', 'ORD-2024-004', '잠실점', '박셀러', '신용카드', '생일 선물']
    ];
    
    const workbook = XLSX.utils.book_new();
    
    // 고객정보 시트 추가
    const customerSheet = XLSX.utils.aoa_to_sheet(customerData);
    XLSX.utils.book_append_sheet(workbook, customerSheet, '고객정보');
    
    // 구매이력 시트 추가
    const purchaseSheet = XLSX.utils.aoa_to_sheet(purchaseData);
    XLSX.utils.book_append_sheet(workbook, purchaseSheet, '구매이력');
    
    // 파일 다운로드
    XLSX.writeFile(workbook, '고객관리_통합템플릿.xlsx');
}

// 고객 정렬 함수
function sortCustomers(field) {
    // 현재 정렬 상태 확인
    if (currentSort.field === field) {
        // 같은 필드를 클릭한 경우 정렬 순서 변경
        currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
    } else {
        // 다른 필드를 클릭한 경우 새로운 필드로 오름차순 정렬
        currentSort.field = field;
        currentSort.order = 'asc';
    }
    
    // 헤더 스타일 업데이트
    updateSortHeaders();
    
    // 현재 표시 중인 고객 목록 가져오기
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    let displayedCustomers = customers;
    
    // 검색 필터 적용
    if (searchTerm) {
        displayedCustomers = customers.filter(customer => {
            return customer.name.toLowerCase().includes(searchTerm) ||
                   customer.phone.includes(searchTerm) ||
                   (customer.preferredStore && customer.preferredStore.toLowerCase().includes(searchTerm)) ||
                   (customer.notes && customer.notes.toLowerCase().includes(searchTerm)) ||
                   getRankText(customer.rank).toLowerCase().includes(searchTerm);
        });
    }
    
    // 정렬 적용
    displayedCustomers = applySort(displayedCustomers, field, currentSort.order);
    
    // 정렬된 목록 렌더링
    renderCustomerList(displayedCustomers);
}

// 정렬 헤더 스타일 업데이트 함수
function updateSortHeaders() {
    // 모든 정렬 헤더 초기화
    document.querySelectorAll('.sortable').forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
        const icon = header.querySelector('.sort-icon');
        if (icon) {
            icon.className = 'bi bi-arrow-down-up sort-icon';
        }
    });
    
    // 현재 정렬 필드 표시
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

// 등급 텍스트 변환 함수
function getRankText(rank) {
    switch (rank) {
        case 'vvip': return 'VVIP';
        case 'vip': return 'VIP';
        case 'regular': return '일반';
        default: return '일반';
    }
}

// 정렬 이벤트 리스너 등록 함수
function attachSortListeners() {
    document.querySelectorAll('.sortable').forEach(header => {
        // 기존 이벤트 리스너 제거 (중복 방지)
        header.removeEventListener('click', sortHandler);
        // 새 이벤트 리스너 추가
        header.addEventListener('click', sortHandler);
    });
}

// 정렬 이벤트 핸들러 함수
function sortHandler(event) {
    const sortField = event.currentTarget.getAttribute('data-sort');
    sortCustomers(sortField);
}

// 배열에 정렬 적용하는 함수
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
                // 등급 우선순위: vvip > vip > regular
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
        
        // 문자열 비교
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            const comparison = aValue.localeCompare(bValue, 'ko');
            return order === 'asc' ? comparison : -comparison;
        }
        
        // 숫자 비교
        if (aValue < bValue) {
            return order === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return order === 'asc' ? 1 : -1;
        }
        return 0;
    });
}



// 삭제됨 - 더 이상 동기화 비활성화 기능 없음 (항상 활성화)

// 로그인 수행 함수
function performLogin() {
    console.log('로그인 시작...');
    
    // 로그인 상태 저장
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('username', 'admin');
    
    // DOM 요소 가져오기
    const loginForm = document.getElementById('login-form');
    const mainContent = document.getElementById('main-content');
    
    console.log('loginForm:', loginForm);
    console.log('mainContent:', mainContent);
    
    // 즉시 페이지 전환 (여러 방법으로 강제)
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
    
    // 데이터 로드 (즉시)
    try {
        if (typeof loadCustomerList === 'function') loadCustomerList();
        if (typeof loadBirthdayAlerts === 'function') loadBirthdayAlerts();
        if (typeof loadRankingCounts === 'function') loadRankingCounts();
    } catch (error) {
        console.error('데이터 로드 오류:', error);
    }
    
    // 강제 리렌더링
    requestAnimationFrame(() => {
        if (mainContent) {
            mainContent.style.opacity = '0';
            requestAnimationFrame(() => {
                mainContent.style.opacity = '1';
            });
        }
    });
    
    console.log('로그인 완료');
}

// 로그아웃 수행 함수  
function performLogout() {
    console.log('로그아웃 시작...');
    
    // 로그인 상태 제거
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    
    // DOM 요소 가져오기
    const loginForm = document.getElementById('login-form');
    const mainContent = document.getElementById('main-content');
    const passwordInput = document.getElementById('password');
    
    console.log('logout - loginForm:', loginForm);
    console.log('logout - mainContent:', mainContent);
    
    // 즉시 페이지 전환 (여러 방법으로 강제)
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
    
    // 패스워드 입력창 초기화
    if (passwordInput) {
        passwordInput.value = '';
        // 약간의 지연 후 포커스 (화면 전환 후)
        setTimeout(() => {
            passwordInput.focus();
        }, 100);
    }
    
    // 강제 리렌더링
    requestAnimationFrame(() => {
        if (loginForm) {
            loginForm.style.opacity = '0';
            requestAnimationFrame(() => {
                loginForm.style.opacity = '1';
            });
        }
    });
    
    console.log('로그아웃 완료');
}
