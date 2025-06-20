// Firebase 온라인 데이터베이스 설정
console.log('=== Firebase 온라인 설정 시작 ===');

// 실제 Firebase 프로젝트 설정 (사용자의 실제 Firebase)
const FIREBASE_CONFIG = {
    // 사용자의 실제 Firebase 프로젝트 설정
    databaseURL: "https://customer-47ac0-default-rtdb.firebaseio.com/",
    projectId: "customer-47ac0",
    // Firebase API 키 (실제 키)
    apiKey: "AIzaSyBWmNRMRRoo5Fv90ZaMiJzyFhQevWhRUes"
};

// 데이터 저장 경로
const DATA_PATH = 'arthur_grace_customers';

// 온라인 데이터 저장 함수
async function saveToOnlineDB(data) {
    try {
        console.log('📤 온라인 데이터베이스에 저장 중...');
        
        const timestamp = new Date().toISOString();
        const saveData = {
            ...data,
            lastUpdated: timestamp,
            deviceId: localStorage.getItem('deviceId') || 'unknown'
        };
        
        const response = await fetch(`${FIREBASE_CONFIG.databaseURL}${DATA_PATH}.json`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(saveData)
        });
        
        if (response.ok) {
            console.log('✅ 온라인 저장 성공!');
            showSaveStatus('success', '온라인 저장 완료');
            return true;
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
    } catch (error) {
        console.error('❌ 온라인 저장 실패:', error);
        showSaveStatus('error', '온라인 저장 실패: ' + error.message);
        return false;
    }
}

// 온라인 데이터 로드 함수
async function loadFromOnlineDB() {
    try {
        console.log('📥 온라인 데이터베이스에서 로드 중...');
        
        const response = await fetch(`${FIREBASE_CONFIG.databaseURL}${DATA_PATH}.json`);
        
        if (response.ok) {
            const data = await response.json();
            if (data) {
                console.log('✅ 온라인 로드 성공!');
                showSaveStatus('success', '온라인 데이터 로드 완료');
                return data;
            } else {
                console.log('ℹ️ 온라인에 저장된 데이터가 없습니다.');
                return null;
            }
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
    } catch (error) {
        console.error('❌ 온라인 로드 실패:', error);
        showSaveStatus('error', '온라인 로드 실패: ' + error.message);
        return null;
    }
}

// 저장 상태 표시 함수
function showSaveStatus(type, message) {
    const statusElement = document.getElementById('save-status');
    if (statusElement) {
        const now = new Date().toLocaleTimeString('ko-KR');
        let className = '';
        let icon = '';
        
        switch (type) {
            case 'success':
                className = 'text-success';
                icon = '✅';
                break;
            case 'error':
                className = 'text-danger';
                icon = '❌';
                break;
            case 'loading':
                className = 'text-warning';
                icon = '⏳';
                break;
            default:
                className = 'text-muted';
                icon = 'ℹ️';
        }
        
        statusElement.innerHTML = `<small class="${className}">${icon} ${message} (${now})</small>`;
    }
}

// 자동 저장 기능
let autoSaveTimer = null;

function scheduleAutoSave(data) {
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
    }
    
    autoSaveTimer = setTimeout(() => {
        saveToOnlineDB(data);
    }, 2000); // 2초 후 자동 저장
}

// 고객 데이터 저장 (기존 함수 오버라이드)
async function saveCustomerData() {
    const data = {
        customers: window.customers || [],
        purchases: window.purchases || [],
        gifts: window.gifts || [],
        visits: window.visits || [],
        rankChanges: window.rankChanges || []
    };
    
    // 로컬 저장소에도 백업
    try {
        localStorage.setItem('customerData', JSON.stringify(data));
        console.log('💾 로컬 저장소 백업 완료');
    } catch (e) {
        console.warn('⚠️ 로컬 저장소 백업 실패:', e);
    }
    
    // 온라인 저장
    return await saveToOnlineDB(data);
}

// 고객 데이터 로드 (기존 함수 오버라이드)
async function loadCustomerData() {
    // 먼저 온라인에서 로드 시도
    const onlineData = await loadFromOnlineDB();
    
    if (onlineData) {
        // 온라인 데이터가 있으면 사용
        window.customers = onlineData.customers || [];
        window.purchases = onlineData.purchases || [];
        window.gifts = onlineData.gifts || [];
        window.visits = onlineData.visits || [];
        window.rankChanges = onlineData.rankChanges || [];
        
        console.log('📊 온라인 데이터 적용 완료');
        return true;
    } else {
        // 온라인 데이터가 없으면 로컬 백업 사용
        try {
            const localData = localStorage.getItem('customerData');
            if (localData) {
                const data = JSON.parse(localData);
                window.customers = data.customers || [];
                window.purchases = data.purchases || [];
                window.gifts = data.gifts || [];
                window.visits = data.visits || [];
                window.rankChanges = data.rankChanges || [];
                
                console.log('💾 로컬 백업 데이터 적용 완료');
                return true;
            }
        } catch (e) {
            console.warn('⚠️ 로컬 백업 로드 실패:', e);
        }
        
        // 기본 데이터 초기화
        window.customers = [];
        window.purchases = [];
        window.gifts = [];
        window.visits = [];
        window.rankChanges = [];
        
        console.log('🆕 기본 데이터로 초기화');
        return false;
    }
}

// 실시간 동기화 (주기적으로 온라인 데이터 확인)
function startRealTimeSync() {
    setInterval(async () => {
        const onlineData = await loadFromOnlineDB();
        if (onlineData && onlineData.lastUpdated) {
            const localLastUpdate = localStorage.getItem('lastUpdate');
            if (!localLastUpdate || onlineData.lastUpdated > localLastUpdate) {
                console.log('🔄 온라인에서 새로운 데이터 감지, 동기화 중...');
                await loadCustomerData();
                
                // UI 새로고침
                if (typeof loadCustomerList === 'function') {
                    loadCustomerList();
                }
                
                localStorage.setItem('lastUpdate', onlineData.lastUpdated);
                showSaveStatus('success', '실시간 동기화 완료');
            }
        }
    }, 10000); // 10초마다 확인
}

// 페이지 로드 시 자동 실행
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Firebase 온라인 데이터베이스 초기화...');
    
    // 상태 표시 영역 추가
    const statusContainer = document.querySelector('.container');
    if (statusContainer) {
        const statusDiv = document.createElement('div');
        statusDiv.innerHTML = '<div id="save-status" class="text-center mt-2"></div>';
        statusContainer.insertBefore(statusDiv, statusContainer.firstChild);
    }
    
    // 데이터 로드
    await loadCustomerData();
    
    // 실시간 동기화 시작
    startRealTimeSync();
    
    showSaveStatus('success', '온라인 데이터베이스 연결 완료');
    console.log('✅ Firebase 온라인 설정 완료');
});

// 글로벌 함수로 내보내기
window.saveCustomerData = saveCustomerData;
window.loadCustomerData = loadCustomerData;
window.scheduleAutoSave = scheduleAutoSave;

console.log('=== Firebase 온라인 설정 로드 완료 ==='); 