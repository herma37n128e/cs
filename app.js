// Í¥ÄÎ¶¨Ïûê Í≥ÑÏ†ï ?ïÎ≥¥ (?§Ï†ú ?òÍ≤Ω?êÏÑú???úÎ≤Ñ?êÏÑú Í¥ÄÎ¶¨Ìï¥????
const ADMIN_USERS = [
    { username: 'admin', password: 'grace1' }
];

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

// Firebase ?ôÍ∏∞???ÅÌÉú ?úÏãú (?àÏ†Ñ??Î≤ÑÏ†Ñ)
function updateSyncStatus(status, message = '') {
    const statusElement = document.getElementById('sync-status');
    if (!statusElement) {
        // ?ôÍ∏∞???ÅÌÉú ?îÏÜåÍ∞Ä ?ÜÏúºÎ©??®Ïàú??ÏΩòÏÜî??Î°úÍ∑∏Îß?Ï∂úÎ†•
        console.log(`Firebase ?ôÍ∏∞???ÅÌÉú: ${status}`, message);
        return;
    }
    
    const now = new Date().toLocaleTimeString('ko-KR');
    let statusText = '';
    let statusClass = '';
    
    switch (status) {
        case 'syncing':
            statusText = '?îÑ Firebase ?ôÍ∏∞??Ï§?..';
            statusClass = 'text-warning';
            break;
        case 'success':
            statusText = `??Firebase ?ôÍ∏∞???ÑÎ£å (${now})`;
            statusClass = 'text-success';
            break;
        case 'error':
            statusText = `??Firebase ?ôÍ∏∞???§Ìå®: ${message}`;
            statusClass = 'text-danger';
            break;
        case 'offline':
            statusText = '?ì∂ ?§ÌîÑ?ºÏù∏ Î™®Îìú';
            statusClass = 'text-secondary';
            break;
        case 'realtime':
            statusText = `?î• Firebase ?§ÏãúÍ∞??∞Í≤∞??(${now})`;
            statusClass = 'text-info';
            break;
        default:
            statusText = '??Firebase ?ÄÍ∏?Ï§?;
            statusClass = 'text-muted';
    }
    
    statusElement.innerHTML = `<small class="${statusClass}">${statusText}</small>`;
}

// Firebase?êÏÑú ÏµúÏã† ?∞Ïù¥???ïÏù∏ Î∞??ôÍ∏∞??
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
            
            // Firebase ?∞Ïù¥?∞Í? ?àÍ≥†, Î°úÏª¨Î≥¥Îã§ ÏµúÏã†??Í≤ΩÏö∞
            if (firebaseData && firebaseData.lastUpdated > window.FIREBASE_SYNC.lastSyncTime) {
                // ?ÑÏû¨ Í∏∞Í∏∞?êÏÑú ?òÏ†ï??Í≤ÉÏù¥ ?ÑÎãå Í≤ΩÏö∞?êÎßå ?ôÍ∏∞??
                if (firebaseData.lastModifiedBy !== window.FIREBASE_SYNC.deviceId) {
                    // ?∞Ïù¥???ÖÎç∞?¥Ìä∏
                    customers = firebaseData.customers || [];
                    purchases = firebaseData.purchases || [];
                    gifts = firebaseData.gifts || [];
                    visits = firebaseData.visits || [];
                    rankChanges = firebaseData.rankChanges || [];
                    
                    // UI ?àÎ°úÍ≥†Ïπ®
                    const customerListElement = document.getElementById('customer-list');
                    if (customerListElement && customerListElement.style.display !== 'none') {
                        if (typeof loadCustomerList === 'function') {
                            loadCustomerList();
                        }
                    }
                    
                    window.FIREBASE_SYNC.lastSyncTime = firebaseData.lastUpdated;
                    updateSyncStatus('success');
                    console.log('Firebase?êÏÑú ÏµúÏã† ?∞Ïù¥???ôÍ∏∞???ÑÎ£å');
                }
            }
        }
    } catch (error) {
        console.error('Firebase ?ÖÎç∞?¥Ìä∏ ?ïÏù∏ ?§Î•ò:', error);
        updateSyncStatus('error', error.message);
    } finally {
        if (window.FIREBASE_SYNC) {
            window.FIREBASE_SYNC.isSyncing = false;
        }
    }
}

// Firebase ?ôÍ∏∞???§Ï†ï ?®Ïàò (?àÏ†Ñ??Î≤ÑÏ†Ñ)
function setupFirebaseSync(databaseUrl, apiKey) {
    if (!window.FIREBASE_SYNC) {
        console.error('FIREBASE_SYNC Í∞ùÏ≤¥Í∞Ä Ï¥àÍ∏∞?îÎêòÏßÄ ?äÏïò?µÎãà??');
        return;
    }
    
    window.FIREBASE_SYNC.enabled = true;
    window.FIREBASE_SYNC.databaseUrl = databaseUrl;
    window.FIREBASE_SYNC.apiKey = apiKey;
    
    // ?¨Ïö©?êÎ≥Ñ Í≤ΩÎ°ú ?ùÏÑ± Î∞??§Ï†ï ?Ä??
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
        console.error('Î°úÏª¨ ?§ÌÜ†Î¶¨Ï? ?Ä???§Î•ò:', error);
    }
    
    // Ï¶âÏãú ?ôÍ∏∞???úÏûë (?àÏ†Ñ?òÍ≤å)
    try {
        syncFromFirebase();
    } catch (error) {
        console.error('Ï¶âÏãú Firebase ?ôÍ∏∞???§Î•ò:', error);
    }
    
    // ?ïÍ∏∞???ôÍ∏∞???úÏûë
    try {
        startSyncInterval();
    } catch (error) {
        console.error('?ïÍ∏∞ Firebase ?ôÍ∏∞???úÏûë ?§Î•ò:', error);
    }
    
    // ?§ÏãúÍ∞?Î¶¨Ïä§???§Ï†ï ?úÎèÑ
    try {
        setupRealtimeListener();
    } catch (error) {
        console.error('?§ÏãúÍ∞?Î¶¨Ïä§???§Ï†ï ?§Î•ò:', error);
    }
    
    alert('Firebase ?§ÏãúÍ∞??ôÍ∏∞?îÍ? ?úÏÑ±?îÎêò?àÏäµ?àÎã§!\n?¥Ï†ú Î™®Îì† Í∏∞Í∏∞?êÏÑú ?§ÏãúÍ∞ÑÏúºÎ°??∞Ïù¥?∞Í? ?ôÍ∏∞?îÎê©?àÎã§.');
}

// Firebase ?§ÏãúÍ∞?Î¶¨Ïä§???§Ï†ï (EventSource ?¨Ïö©)
function setupRealtimeListener() {
    if (!window.FIREBASE_SYNC || !window.FIREBASE_SYNC.enabled) return;
    
    const userPath = window.FIREBASE_SYNC.userPath || 'default';
    const eventSourceUrl = `${window.FIREBASE_SYNC.databaseUrl}/${userPath}/customerData.json?auth=${window.FIREBASE_SYNC.apiKey}`;
    
    try {
        // Í∏∞Ï°¥ EventSourceÍ∞Ä ?àÏúºÎ©??´Í∏∞
        if (window.FIREBASE_SYNC.eventSource) {
            window.FIREBASE_SYNC.eventSource.close();
        }
        
        // Server-Sent EventsÎ•??¨Ïö©???§ÏãúÍ∞??∞Í≤∞
        window.FIREBASE_SYNC.eventSource = new EventSource(eventSourceUrl);
        
        window.FIREBASE_SYNC.eventSource.onopen = function() {
            console.log('Firebase ?§ÏãúÍ∞??∞Í≤∞ ?±Í≥µ');
            updateSyncStatus('realtime');
        };
        
        window.FIREBASE_SYNC.eventSource.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                if (data && data.lastModifiedBy !== window.FIREBASE_SYNC.deviceId) {
                    console.log('Firebase?êÏÑú ?§ÏãúÍ∞??∞Ïù¥??Î≥ÄÍ≤?Í∞êÏ?');
                    syncFromFirebase();
                }
            } catch (error) {
                console.error('?§ÏãúÍ∞??∞Ïù¥??Ï≤òÎ¶¨ ?§Î•ò:', error);
            }
        };
        
        window.FIREBASE_SYNC.eventSource.onerror = function(event) {
            console.error('Firebase ?§ÏãúÍ∞??∞Í≤∞ ?§Î•ò:', event);
            updateSyncStatus('error', '?§ÏãúÍ∞??∞Í≤∞ ?äÍ?');
            
            // ?¨Ïó∞Í≤??úÎèÑ
            setTimeout(() => {
                if (window.FIREBASE_SYNC && window.FIREBASE_SYNC.enabled) {
                    setupRealtimeListener();
                }
            }, 5000);
        };
        
    } catch (error) {
        console.error('?§ÏãúÍ∞?Î¶¨Ïä§???§Ï†ï ?§Ìå®:', error);
        // ?§ÏãúÍ∞??∞Í≤∞ ?§Ìå® ???ïÍ∏∞ ?ôÍ∏∞?îÎ°ú ?ÄÏ≤?
        startSyncInterval();
    }
}

// ?ïÍ∏∞???ôÍ∏∞???úÏûë (Firebase Î≤ÑÏ†Ñ)
// ?ïÍ∏∞?ÅÏúºÎ°?Firebase ?ÖÎç∞?¥Ìä∏ ?ïÏù∏
function startUpdateChecker() {
    if (window.FIREBASE_SYNC && window.FIREBASE_SYNC.enabled) {
        // Í∏∞Ï°¥ ?∏ÌÑ∞Î≤åÏù¥ ?àÏúºÎ©??úÍ±∞
        if (window.FIREBASE_SYNC.updateIntervalId) {
            clearInterval(window.FIREBASE_SYNC.updateIntervalId);
        }
        
        window.FIREBASE_SYNC.updateIntervalId = setInterval(() => {
            try {
                checkFirebaseUpdates();
            } catch (error) {
                console.error('Firebase ?ÖÎç∞?¥Ìä∏ ?ïÏù∏ ?§Î•ò:', error);
            }
        }, window.FIREBASE_SYNC.syncInterval);
        console.log(`Firebase ?ÖÎç∞?¥Ìä∏ ?ïÏù∏ ?úÏûë (${window.FIREBASE_SYNC.syncInterval}ms Í∞ÑÍ≤©)`);
    }
}

// Firebase ÏßÅÏ†ë ?∞Îèô Ï¥àÍ∏∞??
async function initializeFirebaseConnection() {
    console.log('Firebase ÏßÅÏ†ë ?∞Îèô ?úÏä§??Ï¥àÍ∏∞??..');
    
    try {
        // Í≥†Ï†ï???∞Ïù¥??Í≤ΩÎ°ú ?¨Ïö© (?∞Ïù¥???ÅÍµ¨ Î≥¥Ï°¥)
        const userPath = window.FIREBASE_SYNC.userPath;
        
        console.log('Firebase ÏßÅÏ†ë ?∞Îèô ?úÏûë - ?∞Ïù¥??Í≤ΩÎ°ú:', userPath);
        updateSyncStatus('syncing', 'Firebase ?∞Í≤∞ Ï§?..');
        
        // Firebase?êÏÑú ?∞Ïù¥??Î°úÎìú
        await loadDataFromFirebase();
        
        // ?ïÍ∏∞?ÅÏúºÎ°??ÖÎç∞?¥Ìä∏ ?ïÏù∏
        startUpdateChecker();
        
        console.log('Firebase ?∞Í≤∞ ?ÑÎ£å - ?∞Ïù¥???ÅÍµ¨ Î≥¥Ï°¥ Î™®Îìú');
        
    } catch (error) {
        console.error('Firebase ?∞Îèô Ï¥àÍ∏∞???§Î•ò:', error);
        updateSyncStatus('error', 'Firebase ?∞Í≤∞ ?§Ìå®');
        // ?§Î•ò ?úÏóê??Îπ??∞Ïù¥?∞Î°ú ?úÏûë
        customers = [];
        purchases = [];
        gifts = [];
        visits = [];
        rankChanges = [];
    }
}

// Firebase ?§Ï†ï ?Ä??(?∞Ïù¥???ÅÍµ¨ Î≥¥Ï°¥)
function saveFirebaseConfig() {
    try {
        const config = {
            enabled: true,
            databaseUrl: window.FIREBASE_SYNC.databaseUrl,
            apiKey: window.FIREBASE_SYNC.apiKey,
            userPath: window.FIREBASE_SYNC.userPath
        };
        localStorage.setItem('firebaseSyncConfig', JSON.stringify(config));
        console.log('Firebase ?§Ï†ï ?Ä???ÑÎ£å - ?∞Ïù¥???ÅÍµ¨ Î≥¥Ï°¥');
    } catch (error) {
        console.error('Firebase ?§Ï†ï ?Ä???§Î•ò:', error);
    }
}

// ?±Í∏â Î≥ÄÍ≤??¥Î†• Î∞∞Ïó¥ Ï∂îÍ?
let rankChanges = []; // ?±Í∏â Î≥ÄÍ≤??¥Î†•

// Firebase?êÏÑú ?∞Ïù¥??Î°úÎìú (Î°úÏª¨ ?§ÌÜ†Î¶¨Ï? ?úÍ±∞)
async function loadDataFromFirebase() {
    console.log('Firebase?êÏÑú ?∞Ïù¥??Î°úÎìú Ï§?..');
    
    if (!window.FIREBASE_SYNC || !window.FIREBASE_SYNC.enabled) {
        console.log('Firebase ?∞Í≤∞ ?àÎê® - Îπ??∞Ïù¥?∞Î°ú Ï¥àÍ∏∞??);
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
                console.log('Firebase?êÏÑú ?∞Ïù¥??Î°úÎìú ?ÑÎ£å');
                updateSyncStatus('success');
            } else {
                // ?∞Ïù¥?∞Í? ?ÜÏúºÎ©?Îπ?Î∞∞Ïó¥Î°?Ï¥àÍ∏∞??
                customers = [];
                purchases = [];
                gifts = [];
                visits = [];
                rankChanges = [];
                console.log('Firebase???∞Ïù¥???ÜÏùå - Îπ??∞Ïù¥?∞Î°ú Ï¥àÍ∏∞??);
            }
        } else if (response.status === 404) {
            // Ï≤??¨Ïö©??- Îπ??∞Ïù¥?∞Î°ú ?úÏûë
            customers = [];
            purchases = [];
            gifts = [];
            visits = [];
            rankChanges = [];
            console.log('???¨Ïö©??- Îπ??∞Ïù¥?∞Î°ú Ï¥àÍ∏∞??);
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('Firebase ?∞Ïù¥??Î°úÎìú ?§Î•ò:', error);
        updateSyncStatus('error', error.message);
        // ?§Î•ò ??Îπ??∞Ïù¥?∞Î°ú Ï¥àÍ∏∞??
        customers = [];
        purchases = [];
        gifts = [];
        visits = [];
        rankChanges = [];
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
            console.log('Firebase???∞Ïù¥???Ä???ÑÎ£å');
            updateSyncStatus('success');
            return true;
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('Firebase ?∞Ïù¥???Ä???§Î•ò:', error);
        updateSyncStatus('error', error.message);
        return false;
    }
}

// ?åÏä§?∏Ïö© ?òÌîå ?∞Ïù¥??(Ï¥àÍ∏∞?îÎê®)
let customers = [];

// Íµ¨Îß§ ?¥Î†• ?òÌîå ?∞Ïù¥??(Ï¥àÍ∏∞?îÎê®)
let purchases = [];

// ?†Î¨º ?¥Î†• ?òÌîå ?∞Ïù¥??(Ï¥àÍ∏∞?îÎê®)
let gifts = [];

// Î∞©Î¨∏ ?¥Î†• ?òÌîå ?∞Ïù¥??(Ï¥àÍ∏∞?îÎê®)
let visits = [];

// ?ïÎ†¨ ?ÅÌÉú Î≥Ä??
let currentSort = {
    field: null,
    order: 'asc'
};

// DOM??Î°úÎìú?????§Ìñâ
document.addEventListener('DOMContentLoaded', async () => {
    // Firebase?êÏÑú ÏßÅÏ†ë ?∞Ïù¥??Î°úÎìú
    await initializeFirebaseConnection();
    
    // Î°úÍ∑∏???ÅÌÉú ?ïÏù∏
    checkLoginStatus();
    
    // Î°úÍ∑∏?????úÏ∂ú ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('login').addEventListener('submit', (e) => {
        e.preventDefault();
        const password = document.getElementById('password').value;
        console.log('?ÖÎ†•???®Ïä§?åÎìú:', password);
        
        // ?®Ïä§?åÎìú ?ÑÏö© Î°úÍ∑∏??Ï≤¥ÌÅ¨
        if (password === 'grace1') {
            performLogin();
        } else {
            // Î°úÍ∑∏???§Ìå®
            alert('ÎπÑÎ?Î≤àÌò∏Í∞Ä ?¨Î∞îÎ•¥Ï? ?äÏäµ?àÎã§.');
        }
    });

    // Î°úÍ∑∏?ÑÏõÉ Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        performLogout();
    });

    // ?§ÎπÑÍ≤åÏù¥??Î©îÎâ¥ ?¥Î≤§??Î¶¨Ïä§??
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.getAttribute('data-page');
            
            // Î™®Îì† ?òÏù¥ÏßÄ ?®Í∏∞Í∏?
            document.querySelectorAll('.page').forEach(page => {
                page.classList.add('d-none');
            });
            
            // ?†ÌÉù???òÏù¥ÏßÄ ?úÏãú
            document.getElementById(targetPage).classList.remove('d-none');
            
            // ?úÏÑ± Î©îÎâ¥ ?úÏãú
            document.querySelectorAll('.nav-link').forEach(navLink => {
                navLink.classList.remove('active');
            });
            link.classList.add('active');
        });
    });

    // Í≥†Í∞ù Í≤Ä??Í∏∞Îä• ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('search-btn').addEventListener('click', searchCustomers);
    
    // Í≤Ä?âÏ∞Ω ?ÖÎ†• ?¥Î≤§??Î¶¨Ïä§??(?§ÏãúÍ∞?Í≤Ä??
    document.getElementById('search-input').addEventListener('input', searchCustomers);

    // Í≥†Í∞ù Ï∂îÍ? ???úÏ∂ú ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('customer-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // ?ºÏóê???∞Ïù¥??Í∞Ä?∏Ïò§Í∏?
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
        
        // Í≥†Í∞ù Ï∂îÍ?
        customers.push(newCustomer);
        
        // Firebase???∞Ïù¥???Ä??
        await saveDataToFirebase();
        
        // ??Ï¥àÍ∏∞??
        document.getElementById('customer-form').reset();
        
        // ?åÎ¶º ?úÏãú
        alert('Í≥†Í∞ù ?ïÎ≥¥Í∞Ä ?±Í≥µ?ÅÏúºÎ°??Ä?•Îêò?àÏäµ?àÎã§.');
        
        // Í≥†Í∞ù Î™©Î°ù ?òÏù¥ÏßÄÎ°??¥Îèô Î∞?Î™©Î°ù ?àÎ°úÍ≥†Ïπ®
        document.querySelector('.nav-link[data-page="customer-list"]').click();
        loadCustomerList();
    });

    // ?†Î¨º Í≤Ä??Í∏∞Îä•
    document.getElementById('gift-search-btn').addEventListener('click', () => {
        const searchTerm = document.getElementById('gift-search').value.toLowerCase();
        const filteredGifts = gifts.filter(gift => {
            const customer = customers.find(c => c.id === gift.customerId);
            return customer && customer.name.toLowerCase().includes(searchTerm);
        });
        renderGiftHistory(filteredGifts);
    });

    // Î∞©Î¨∏ Í≤Ä??Í∏∞Îä•
    document.getElementById('visit-search-btn').addEventListener('click', () => {
        const searchTerm = document.getElementById('visit-search').value.toLowerCase();
        const filteredVisits = getVisitSummary().filter(summary => 
            summary.name.toLowerCase().includes(searchTerm)
        );
        renderVisitTracking(filteredVisits);
    });

    // Íµ¨Îß§ PDF ?§Ïö¥Î°úÎìú Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('download-purchase-pdf').addEventListener('click', () => {
        // ?ÑÏû¨ Î≥¥Í≥† ?àÎäî Í≥†Í∞ù ID Í∞Ä?∏Ïò§Í∏?
        const customerId = parseInt(document.querySelector('#purchase-history-content').getAttribute('data-customer-id'));
        if (customerId) {
            generatePurchasePDF(customerId);
        }
    });

    // Í≥†Í∞ù ?ÅÏÑ∏ ?ïÎ≥¥ Î™®Îã¨ ???¥Î≤§??Î¶¨Ïä§??
    document.querySelectorAll('#customerTabs .nav-link').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            // ?ÑÏû¨ Î≥¥Í≥† ?àÎäî Í≥†Í∞ù ID Í∞Ä?∏Ïò§Í∏?
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

    // ?∏Ïßë Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('edit-customer-btn').addEventListener('click', () => {
        const customerId = parseInt(document.querySelector('#customer-info-content').getAttribute('data-customer-id'));
        editCustomerInfo(customerId);
    });

    // ??†ú Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('delete-customer-btn').addEventListener('click', () => {
        const customerId = parseInt(document.querySelector('#customer-info-content').getAttribute('data-customer-id'));
        // Î™®Îã¨ ?´Í∏∞
        const modal = bootstrap.Modal.getInstance(document.getElementById('customer-details-modal'));
        modal.hide();
        // Í≥†Í∞ù ??†ú
        deleteCustomer(customerId);
    });



    // Íµ¨Îß§ Í∏∞Î°ù Ï∂îÍ? Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('add-purchase-btn').addEventListener('click', () => {
        const customerId = parseInt(document.querySelector('#purchase-history-content').getAttribute('data-customer-id'));
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
        
        // Íµ¨Îß§ Í∏∞Î°ù Ï∂îÍ?
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
        
        // Í≥†Í∞ù Ï¥?Íµ¨Îß§??Î∞?Íµ¨Îß§ ?üÏàò ?ÖÎç∞?¥Ìä∏
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
        const purchaseModal = bootstrap.Modal.getInstance(document.getElementById('add-purchase-modal'));
        purchaseModal.hide();
        
        // Íµ¨Îß§ ?¥Î†• ?§Ïãú Î°úÎìú
        loadCustomerPurchases(customerId);
        
        // Í≥†Í∞ù ?ÅÏÑ∏ ?ïÎ≥¥ ?ÖÎç∞?¥Ìä∏ (Ï¥?Íµ¨Îß§?°Ïù¥ Î≥ÄÍ≤ΩÎêò?àÏùÑ ???àÏùå)
        openCustomerDetails(customerId);
        
        // ?åÎ¶º ?úÏãú
        alert('Íµ¨Îß§ Í∏∞Î°ù??Ï∂îÍ??òÏóà?µÎãà??');
    });
    
    // ?†Î¨º Í∏∞Î°ù Ï∂îÍ? Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('add-customer-gift-btn').addEventListener('click', () => {
        const customerId = parseInt(document.querySelector('#customer-info-content').getAttribute('data-customer-id'));
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
        const customerId = parseInt(document.querySelector('#customer-info-content').getAttribute('data-customer-id'));
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

    // Î°úÍ∑∏???ÅÌÉú ?ïÏù∏ ?®Ïàò
    function checkLoginStatus() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const username = localStorage.getItem('username');
        
        if (isLoggedIn && username) {
            // Î°úÍ∑∏???ÅÌÉúÎ°??îÎ©¥ ?úÏãú (Í∞ïÏ†ú ?ÑÌôò)
            performLogin();
        } else {
            // Î°úÍ∑∏?ÑÏõÉ ?ÅÌÉúÎ°??îÎ©¥ ?úÏãú (Í∞ïÏ†ú ?ÑÌôò)
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

    // Î©îÏù∏ ÏΩòÌÖêÏ∏†Ïóê has-mobile-buttons ?¥Îûò??Ï∂îÍ?
    document.body.classList.add('has-mobile-buttons');
    
    // Î™®Îì† Í≥†Í∞ù???±Í∏â???àÎ°ú??Í∏∞Ï??ºÎ°ú ?ÖÎç∞?¥Ìä∏
    updateAllCustomerRanks();
    
    // Î™®Î∞î??Í≥†Í∞ù ?±Î°ù Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('mobile-add-customer-btn').addEventListener('click', () => {
        // Í≥†Í∞ù ?±Î°ù ?òÏù¥ÏßÄÎ°??¥Îèô
        document.querySelector('.nav-link[data-page="add-customer"]').click();
    });

    // ?ëÏ? ?ÖÎ°ú??Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('upload-excel-btn').addEventListener('click', handleExcelUpload);

    // ?úÌîåÎ¶??§Ïö¥Î°úÎìú Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('download-template-btn').addEventListener('click', downloadExcelTemplate);
    
    // ?ëÏ? ?§Ïö¥Î°úÎìú Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('export-excel-btn').addEventListener('click', exportCustomersToExcel);
});

// Í≥†Í∞ù Î™©Î°ù ?åÎçîÎß??®Ïàò
function renderCustomerList(customerList) {
    const tbody = document.getElementById('customer-list-body');
    tbody.innerHTML = '';
    
    customerList.forEach((customer, index) => {
        const tr = document.createElement('tr');
        
        // ?±Í∏â???∞Î•∏ Î∞∞Ï? ?¥Îûò???§Ï†ï
        let rankBadgeClass = '';
        if (customer.rank === 'vvip') rankBadgeClass = 'badge-vvip';
        else if (customer.rank === 'vip') rankBadgeClass = 'badge-vip';
        else rankBadgeClass = 'badge-regular';
        
        // ?úÍ? ?±Í∏â Î≥Ä??
        let rankText = '';
        if (customer.rank === 'vvip') rankText = 'VVIP';
        else if (customer.rank === 'vip') rankText = 'VIP';
        else rankText = '?ºÎ∞ò';

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
                    <button class="btn btn-sm btn-outline-primary view-details" data-customer-id="${customer.id}" title="?ÅÏÑ∏Î≥¥Í∏∞">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-customer" data-customer-id="${customer.id}" title="??†ú">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // ?ÅÏÑ∏Î≥¥Í∏∞ Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??Ï∂îÍ?
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', () => {
            const customerId = parseInt(button.getAttribute('data-customer-id'));
            // ??Ï∞ΩÏóê??Í≥†Í∞ù ?ÅÏÑ∏ ?ïÎ≥¥ ?òÏù¥ÏßÄ ?¥Í∏∞
            window.open(`customer-details.html?id=${customerId}`, `customer_${customerId}`, 'width=1000,height=800');
        });
    });
    
    // ??†ú Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??Ï∂îÍ?
    document.querySelectorAll('.delete-customer').forEach(button => {
        button.addEventListener('click', () => {
            const customerId = parseInt(button.getAttribute('data-customer-id'));
            deleteCustomer(customerId);
        });
    });
}

// Í≥†Í∞ù Î™©Î°ù Î°úÎìú ?®Ïàò
function loadCustomerList() {
    // Í≤Ä?âÏ∞Ω Ï¥àÍ∏∞??
    document.getElementById('search-input').value = '';
    // ?ïÎ†¨ ?ÅÌÉú Ï¥àÍ∏∞??
    currentSort = { field: null, order: 'asc' };
    // ?ÑÏ≤¥ Í≥†Í∞ù Î™©Î°ù ?úÏãú
    renderCustomerList(customers);
    // ?§Îçî ?¥Î≤§??Î¶¨Ïä§???¨Îì±Î°?
    attachSortListeners();
}

// ?ùÏùº ?åÎ¶º Î°úÎìú ?®Ïàò
function loadBirthdayAlerts() {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    
    // ?¥Î≤à ???ùÏùº Í≥†Í∞ù
    const thisMonthBirthdays = customers.filter(customer => {
        if (!customer.birthdate) return false;
        try {
            const birthMonth = parseInt(customer.birthdate.split('-')[1]);
            return birthMonth === currentMonth;
        } catch (e) {
            return false;
        }
    });
    
    // ?§Ïùå ???ùÏùº Í≥†Í∞ù
    const nextMonthBirthdays = customers.filter(customer => {
        if (!customer.birthdate) return false;
        try {
            const birthMonth = parseInt(customer.birthdate.split('-')[1]);
            return birthMonth === nextMonth;
        } catch (e) {
            return false;
        }
    });
    
    // ?¥Î≤à ???ùÏùº Î™©Î°ù ?åÎçîÎß?
    const thisMonthList = document.getElementById('this-month-birthdays');
    thisMonthList.innerHTML = '';
    
    if (thisMonthBirthdays.length === 0) {
        thisMonthList.innerHTML = '<li class="list-group-item">?¥Î≤à ???ùÏùº??Í≥†Í∞ù???ÜÏäµ?àÎã§.</li>';
    } else {
        thisMonthBirthdays.forEach(customer => {
            try {
                const birthDay = parseInt(customer.birthdate.split('-')[2]);
                const today = new Date().getDate();
                const li = document.createElement('li');
                li.className = 'list-group-item';
                
                // ?§Îäò???ùÏùº??Í≥†Í∞ù Í∞ïÏ°∞
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
                console.log('?ùÎÖÑ?îÏùº Ï≤òÎ¶¨ Ï§??§Î•ò:', e);
            }
        });
    }
    
    // ?§Ïùå ???ùÏùº Î™©Î°ù ?åÎçîÎß?
    const nextMonthList = document.getElementById('next-month-birthdays');
    nextMonthList.innerHTML = '';
    
    if (nextMonthBirthdays.length === 0) {
        nextMonthList.innerHTML = '<li class="list-group-item">?§Ïùå ???ùÏùº??Í≥†Í∞ù???ÜÏäµ?àÎã§.</li>';
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
                console.log('?ùÎÖÑ?îÏùº Ï≤òÎ¶¨ Ï§??§Î•ò:', e);
            }
        });
    }
}

// Í≥†Í∞ùÎ≥?Íµ¨Îß§ ?ïÎ≥¥ ?¨Í≥Ñ???®Ïàò
function recalculateCustomerPurchaseInfo() {
    customers.forEach(customer => {
        // ?¥Îãπ Í≥†Í∞ù??Î™®Îì† Íµ¨Îß§ Í∏∞Î°ù Ï∞æÍ∏∞
        const customerPurchases = purchases.filter(p => p.customerId === customer.id);
        
        // Ï¥?Íµ¨Îß§?°Í≥º Íµ¨Îß§ ?üÏàò ?¨Í≥Ñ??
        let totalPurchase = 0;
        let purchaseCount = customerPurchases.length;
        
        customerPurchases.forEach(purchase => {
            totalPurchase += purchase.totalAmount || 0;
        });
        
        // Í≥†Í∞ù ?ïÎ≥¥ ?ÖÎç∞?¥Ìä∏
        customer.totalPurchase = totalPurchase;
        customer.purchaseCount = purchaseCount;
        
        // ?±Í∏â ?ÖÎç∞?¥Ìä∏
        updateCustomerRank(customer);
    });
    
    // ?∞Ïù¥???Ä??
    saveDataToFirebase();
}

// Í≥†Í∞ù ?±Í∏âÎ≥?Ïπ¥Ïö¥??Î°úÎìú ?®Ïàò
function loadRankingCounts() {
    // Íµ¨Îß§ ?ïÎ≥¥ ?¨Í≥Ñ??
    recalculateCustomerPurchaseInfo();
    
    const vvipCount = customers.filter(c => c.rank === 'vvip').length;
    const vipCount = customers.filter(c => c.rank === 'vip').length;
    const regularCount = customers.filter(c => c.rank === 'regular').length;
    
    document.getElementById('vvip-count').textContent = vvipCount;
    document.getElementById('vip-count').textContent = vipCount;
    document.getElementById('regular-count').textContent = regularCount;
    
    // Í≥†Í∞ù ?±Í∏â Î™©Î°ù ?åÎçîÎß?(?±Í∏â???ïÎ†¨)
    const tbody = document.getElementById('ranking-list-body');
    tbody.innerHTML = '';
    
    // ?±Í∏â ?úÏÑúÎ°??ïÎ†¨ (VVIP > VIP > ?ºÎ∞ò)
    const sortedCustomers = [...customers].sort((a, b) => {
        const rankOrder = { 'vvip': 3, 'vip': 2, 'regular': 1 };
        if (rankOrder[a.rank] !== rankOrder[b.rank]) {
            return rankOrder[b.rank] - rankOrder[a.rank];
        }
        // Í∞ôÏ? ?±Í∏â ?¥Ïóê?úÎäî Ï¥?Íµ¨Îß§???úÏúºÎ°??ïÎ†¨
        return (b.totalPurchase || 0) - (a.totalPurchase || 0);
    });
    
    sortedCustomers.forEach((customer, index) => {
        const tr = document.createElement('tr');
        
        // ?±Í∏â???∞Î•∏ Î∞∞Ï? ?¥Îûò???§Ï†ï
        let rankBadgeClass = '';
        if (customer.rank === 'vvip') rankBadgeClass = 'badge-vvip';
        else if (customer.rank === 'vip') rankBadgeClass = 'badge-vip';
        else rankBadgeClass = 'badge-regular';
        
        // ?úÍ? ?±Í∏â Î≥Ä??
        let rankText = '';
        if (customer.rank === 'vvip') rankText = 'VVIP';
        else if (customer.rank === 'vip') rankText = 'VIP';
        else rankText = '?ºÎ∞ò';
        
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${customer.name}</td>
            <td><span class="badge ${rankBadgeClass}">${rankText}</span></td>
            <td>${formatCurrency(customer.totalPurchase || 0)}</td>
            <td>${customer.purchaseCount || 0}??/td>
            <td><button class="btn btn-sm btn-outline-secondary view-rank-history" data-customer-id="${customer.id}">?±Í∏â Î≥ÄÍ≤??¥Î†•</button></td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // ?±Í∏â Î≥ÄÍ≤??¥Î†• Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.querySelectorAll('.view-rank-history').forEach(button => {
        button.addEventListener('click', () => {
            const customerId = parseInt(button.getAttribute('data-customer-id'));
            viewRankChangeHistory(customerId);
        });
    });
}

// ?†Î¨º ?¥Î†• ?åÎçîÎß??®Ïàò
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
                <td><button class="btn btn-sm btn-outline-primary view-customer-details" data-customer-id="${customer.id}">?ÅÏÑ∏Î≥¥Í∏∞</button></td>
            `;
            
            tbody.appendChild(tr);
        }
    });
    
    if (giftList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Í≤Ä??Í≤∞Í≥ºÍ∞Ä ?ÜÏäµ?àÎã§.</td></tr>';
    }
    
    // ?†Î¨º ?¥Î†•?êÏÑú Í≥†Í∞ù ?ÅÏÑ∏Î≥¥Í∏∞ Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.querySelectorAll('.view-customer-details').forEach(button => {
        button.addEventListener('click', () => {
            const customerId = parseInt(button.getAttribute('data-customer-id'));
            // ??Ï∞ΩÏóê??Í≥†Í∞ù ?ÅÏÑ∏ ?ïÎ≥¥ ?òÏù¥ÏßÄ ?¥Í∏∞ (?†Î¨º ???úÏÑ±??
            window.open(`customer-details.html?id=${customerId}#gift-tab`, `customer_${customerId}`, 'width=1000,height=800');
        });
    });
}

// Î∞©Î¨∏ Ï£ºÍ∏∞ ?îÏïΩ Í≥ÑÏÇ∞ ?®Ïàò
function getVisitSummary() {
    const summary = [];
    
    customers.forEach(customer => {
        // Í≥†Í∞ùÎ≥?Î∞©Î¨∏ ?¥Ïó≠
        const customerVisits = visits.filter(v => v.customerId === customer.id);
        
        if (customerVisits.length > 0) {
            // Î∞©Î¨∏ ?†Ïßú ?ïÎ†¨
            const sortedDates = customerVisits.map(v => new Date(v.date))
                .sort((a, b) => b - a);
            
            // ÏµúÍ∑º Î∞©Î¨∏??
            const lastVisit = sortedDates[0];
            
            // Î∞©Î¨∏ Ï£ºÍ∏∞ Í≥ÑÏÇ∞ (?âÍ∑† ?ºÏàò)
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
            
            // ?§Ïùå ?àÏÉÅ Î∞©Î¨∏??
            const nextExpectedVisit = new Date(lastVisit);
            nextExpectedVisit.setDate(nextExpectedVisit.getDate() + averageCycle);
            
            // ?§ÎäòÍ≥??§Ïùå ?àÏÉÅ Î∞©Î¨∏???¨Ïù¥???ºÏàò
            const today = new Date();
            const diffTime = nextExpectedVisit - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // ?îÏïΩ ?ïÎ≥¥ Ï∂îÍ?
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

// Î∞©Î¨∏ Ï£ºÍ∏∞ Í¥ÄÎ¶??åÎçîÎß??®Ïàò
function renderVisitTracking(summaryList) {
    const tbody = document.getElementById('visit-list-body');
    tbody.innerHTML = '';
    
    summaryList.forEach((summary, index) => {
        const tr = document.createElement('tr');
        
        // ?§Ïùå Î∞©Î¨∏ ?àÏ†ï?ºÏóê ?∞Î•∏ ?¥Îûò???§Ï†ï
        let visitClass = '';
        if (summary.daysUntilNextVisit < 0) {
            visitClass = 'visit-due'; // Î∞©Î¨∏ ?àÏ†ï??ÏßÄ??
        } else if (summary.daysUntilNextVisit <= 7) {
            visitClass = 'visit-upcoming'; // Î∞©Î¨∏ ?àÏ†ï???ºÏ£º???¥ÎÇ¥
        } else {
            visitClass = 'visit-recent'; // ÏµúÍ∑º Î∞©Î¨∏
        }
        
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${summary.name}</td>
            <td>${formatDate(summary.lastVisit)}</td>
            <td>${summary.averageCycle > 0 ? summary.averageCycle + '?? : '-'}</td>
            <td>${summary.visitCount}??/td>
            <td class="${visitClass}">${formatDate(summary.nextExpectedVisit)}</td>
            <td><button class="btn btn-sm btn-outline-primary view-visit-details" data-customer-id="${summary.id}">?ÅÏÑ∏Î≥¥Í∏∞</button></td>
        `;
        
        tbody.appendChild(tr);
    });
    
    if (summaryList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Í≤Ä??Í≤∞Í≥ºÍ∞Ä ?ÜÏäµ?àÎã§.</td></tr>';
    }
    
    // ?ÅÏÑ∏Î≥¥Í∏∞ Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??Ï∂îÍ?
    document.querySelectorAll('.view-visit-details').forEach(button => {
        button.addEventListener('click', () => {
            const customerId = parseInt(button.getAttribute('data-customer-id'));
            // ??Ï∞ΩÏóê??Í≥†Í∞ù ?ÅÏÑ∏ ?ïÎ≥¥ ?òÏù¥ÏßÄ ?¥Í∏∞ (Î∞©Î¨∏ ???úÏÑ±??
            window.open(`customer-details.html?id=${customerId}#visit-tab`, `customer_${customerId}`, 'width=1000,height=800');
        });
    });
}

// Í≥†Í∞ù ?ÅÏÑ∏ ?ïÎ≥¥ Î™®Îã¨ ?¥Í∏∞
function openCustomerDetails(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    const customerInfo = document.getElementById('customer-info-content');
    customerInfo.setAttribute('data-customer-id', customerId);
    
    // Í≥†Í∞ù Í∏∞Î≥∏ ?ïÎ≥¥ ?úÏãú
    let genderText = '';
    if (customer.gender === 'male') genderText = '?®ÏÑ±';
    else if (customer.gender === 'female') genderText = '?¨ÏÑ±';
    
    // ?±Í∏â???∞Î•∏ Î∞∞Ï? ?¥Îûò???§Ï†ï
    let rankBadgeClass = '';
    if (customer.rank === 'vvip') rankBadgeClass = 'badge-vvip';
    else if (customer.rank === 'vip') rankBadgeClass = 'badge-vip';
    else rankBadgeClass = 'badge-regular';
    
    // ?úÍ? ?±Í∏â Î≥Ä??
    let rankText = '';
    if (customer.rank === 'vvip') rankText = 'VVIP';
    else if (customer.rank === 'vip') rankText = 'VIP';
    else rankText = '?ºÎ∞ò';
    
    const customerHtml = `
        <div class="customer-detail-header mb-4">
            <h3>${customer.name} <small class="text-muted">(${genderText})</small></h3>
            <div class="d-flex flex-wrap gap-3 align-items-center mt-2">
                <div>
                    <span class="badge ${rankBadgeClass}">${rankText}</span>
                    <button class="btn btn-sm btn-outline-secondary ms-2 view-rank-history" data-customer-id="${customer.id}">
                        <i class="bi bi-clock-history"></i> ?±Í∏â ?¥Î†•
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
                    <div class="card-header">Í∏∞Î≥∏ ?ïÎ≥¥</div>
                    <div class="card-body">
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item d-flex justify-content-between">
                                <span>Ï£ºÏÜå</span>
                                <span class="text-muted">${customer.address || '-'}</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between">
                                <span>Ï£ºÎ∞©Î¨∏Îß§??/span>
                                <span class="text-muted">${customer.preferredStore || '-'}</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between">
                                <span>ÏµúÍ∑º Î∞©Î¨∏??/span>
                                <span class="text-muted">${customer.lastVisit ? formatDate(customer.lastVisit) : '-'}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card h-100">
                    <div class="card-header">Íµ¨Îß§ ?ïÎ≥¥</div>
                    <div class="card-body">
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item d-flex justify-content-between">
                                <span>Ï¥?Íµ¨Îß§??/span>
                                <span class="text-primary fw-bold">${formatCurrency(customer.totalPurchase)}</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between">
                                <span>Íµ¨Îß§ ?üÏàò</span>
                                <span>${customer.purchaseCount}??/span>
                            </li>
                            <li class="list-group-item">
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Î©îÎ™®</span>
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
                                        <button class="btn btn-sm btn-secondary me-2" id="cancel-note-btn">Ï∑®ÏÜå</button>
                                        <button class="btn btn-sm btn-primary" id="save-note-btn">?Ä??/button>
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
    
    // Î©îÎ™® ?∏Ïßë Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('edit-note-btn').addEventListener('click', () => {
        document.getElementById('customer-note').classList.add('d-none');
        document.getElementById('note-edit-form').classList.remove('d-none');
    });
    
    // Î©îÎ™® ?∏Ïßë Ï∑®ÏÜå Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('cancel-note-btn').addEventListener('click', () => {
        document.getElementById('customer-note').classList.remove('d-none');
        document.getElementById('note-edit-form').classList.add('d-none');
    });
    
    // Î©îÎ™® ?Ä??Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('save-note-btn').addEventListener('click', () => {
        const newNote = document.getElementById('note-input').value;
        customer.notes = newNote;
        
        // ?∞Ïù¥???Ä??
        saveDataToFirebase();
        
        // UI ?ÖÎç∞?¥Ìä∏
        document.getElementById('customer-note').innerHTML = newNote || '-';
        document.getElementById('customer-note').classList.remove('d-none');
        document.getElementById('note-edit-form').classList.add('d-none');
    });
    
    // ?±Í∏â Î≥ÄÍ≤??¥Î†• Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.querySelector('.view-rank-history').addEventListener('click', () => {
        viewRankChangeHistory(customerId);
    });
    
    // Ï≤?Î≤àÏß∏ ??(Íµ¨Îß§ ?¥Î†•) Î°úÎìú
    loadCustomerPurchases(customerId);
    
    // Î™®Îã¨ ?úÏãú
    const customerDetailsModal = new bootstrap.Modal(document.getElementById('customer-details-modal'));
    customerDetailsModal.show();
}

// Í≥†Í∞ùÎ≥?Íµ¨Îß§ ?¥Î†• Î°úÎìú ?®Ïàò
function loadCustomerPurchases(customerId) {
    const customerPurchases = purchases.filter(p => p.customerId === customerId);
    const purchaseContent = document.getElementById('purchase-history-content');
    purchaseContent.setAttribute('data-customer-id', customerId);
    
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

// Í≥†Í∞ù ?ïÎ≥¥ ?∏Ïßë ?®Ïàò
function editCustomerInfo(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    // ?ÑÏû¨ Î™®Îã¨???®Í∏∞Í≥??∏Ïßë Î™®Îã¨ ?úÏãú
    const currentModal = bootstrap.Modal.getInstance(document.getElementById('customer-details-modal'));
    currentModal.hide();
    
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
        
        // Í≥†Í∞ù Î™©Î°ù ?àÎ°úÍ≥†Ïπ®
        loadCustomerList();
        
        // ?ÅÏÑ∏ ?ïÎ≥¥ Î™®Îã¨ ?§Ïãú ?¥Í∏∞
        setTimeout(() => {
            openCustomerDetails(editedCustomer.id);
        }, 500);
    });
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

// ?ÑÌôîÎ≤àÌò∏ ?¨Îß∑???®Ïàò
function formatPhoneNumber(phone) {
    if (!phone) return '-';
    
    // ?´ÏûêÎß?Ï∂îÏ∂ú
    const cleaned = phone.replace(/\D/g, '');
    
    // 11?êÎ¶¨ ?¥Î???Î≤àÌò∏ (010-xxxx-xxxx)
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }
    // 10?êÎ¶¨ Î≤àÌò∏ (010-xxx-xxxx ?êÎäî 02-xxx-xxxx)
    else if (cleaned.length === 10) {
        if (cleaned.startsWith('02')) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
        } else {
            return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
        }
    }
    // 8?êÎ¶¨ Î≤àÌò∏ (02-xxx-xxxx)
    else if (cleaned.length === 8) {
        return cleaned.replace(/(\d{4})(\d{4})/, '02-$1-$2');
    }
    // Í∏∞Ì? ?ïÏãù?Ä ?êÎ≥∏ Î∞òÌôò
    else {
        return phone;
    }
}

// Í≥†Í∞ù ?±Í∏â ?ÖÎç∞?¥Ìä∏ ?®Ïàò
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
    
    // ?±Í∏â??Î≥ÄÍ≤ΩÎêò?àÏùÑ Í≤ΩÏö∞ ?¥Î†• Ï∂îÍ?
    if (oldRank !== customer.rank) {
        const rankChange = {
            id: rankChanges.length > 0 ? Math.max(...rankChanges.map(r => r.id)) + 1 : 1,
            customerId: customer.id,
            oldRank: oldRank,
            newRank: customer.rank,
            reason: `Íµ¨Îß§ ?ÑÏ†Å Í∏àÏï° ${formatCurrency(customer.totalPurchase)}???∞Î•∏ ?êÎèô ?±Í∏â Î≥ÄÍ≤?,
            date: new Date().toISOString().split('T')[0],
            changedBy: localStorage.getItem('username') || '?úÏä§??
        };
        
        rankChanges.push(rankChange);
        saveDataToFirebase();
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
            
            // Í≥†Í∞ù Î™©Î°ù ?àÎ°úÍ≥†Ïπ®
            loadCustomerList();
            
            // ?åÎ¶º ?úÏãú
            alert('Í≥†Í∞ù ?ïÎ≥¥Í∞Ä ??†ú?òÏóà?µÎãà??');
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
                        <div class="card mb-3">
                            <div class="card-header">
                                <small class="text-muted">Íµ¨Îß§ ?ÅÌíà ?ïÎ≥¥</small>
                            </div>
                            <div class="card-body">
                                <div id="edit-purchase-items">
                                    ${purchase.items.map((item, index) => `
                                        <div class="purchase-item mb-3">
                                            <div class="row g-2">
                                                <div class="col-12 col-md-7">
                                                    <label class="form-label">?ÅÌíàÎ™?*</label>
                                                    <input type="text" class="form-control item-name" value="${item.name}" required placeholder="Íµ¨Îß§?òÏã† ?ÅÌíàÎ™ÖÏùÑ ?ÖÎ†•?òÏÑ∏??>
                                                </div>
                                                <div class="col-12 col-md-5">
                                                    <label class="form-label">Í∞ÄÍ≤?*</label>
                                                    <input type="number" class="form-control item-price" value="${item.price}" required placeholder="0">
                                                </div>
                                            </div>
                                            ${index > 0 ? `
                                                <div class="d-grid mt-2">
                                                    <button type="button" class="btn btn-sm btn-outline-danger remove-item-btn">
                                                        <i class="bi bi-trash"></i> ???ÅÌíà ??†ú
                                                    </button>
                                                </div>
                                            ` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                                <div class="d-grid">
                                    <button type="button" class="btn btn-outline-secondary" id="edit-add-item-btn">
                                        <i class="bi bi-plus-circle"></i> ?ÅÌíà Ï∂îÍ?
                                    </button>
                                </div>
                            </div>
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
            openCustomerDetails(customerId);
            
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
            openCustomerDetails(customerId);
            
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
            openCustomerDetails(customerId);
            
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
            openCustomerDetails(customerId);
            
            // ?åÎ¶º ?úÏãú
            alert('Î∞©Î¨∏ Í∏∞Î°ù????†ú?òÏóà?µÎãà??');
        }
    }
}

// Í≥†Í∞ù Í≤Ä???®Ïàò
function searchCustomers() {
    const searchTerm = document.getElementById('search-input').value.trim().toLowerCase();
    let displayedCustomers = customers;
    
    // Í≤Ä?âÏ∞Ω??ÎπÑÏñ¥?àÏ? ?äÏúºÎ©??ÑÌÑ∞Îß?
    if (searchTerm !== '') {
        displayedCustomers = customers.filter(customer => {
            // Í∏∞Î≥∏ ?ïÎ≥¥ Í≤Ä??
            const nameMatch = customer.name.toLowerCase().includes(searchTerm);
            const phoneMatch = customer.phone && customer.phone.toLowerCase().includes(searchTerm);
            const storeMatch = customer.preferredStore && customer.preferredStore.toLowerCase().includes(searchTerm);
            const notesMatch = customer.notes && customer.notes.toLowerCase().includes(searchTerm);
            
            // ?±Í∏â Í≤Ä??(?§Ïñë???úÌòÑ ÏßÄ??
            let rankMatch = false;
            if (customer.rank === 'vvip') {
                rankMatch = searchTerm.includes('vvip') || searchTerm.includes('Î∏åÏù¥Î∏åÏù¥?ÑÏù¥??) || searchTerm.includes('ÏµúÍ≥†?±Í∏â');
            } else if (customer.rank === 'vip') {
                rankMatch = searchTerm.includes('vip') || searchTerm.includes('Î∏åÏù¥?ÑÏù¥??) || searchTerm.includes('?∞Ïàò?±Í∏â');
            } else if (customer.rank === 'regular') {
                rankMatch = searchTerm.includes('?ºÎ∞ò') || searchTerm.includes('?àÍ∑§??) || searchTerm.includes('regular') || searchTerm.includes('Í∏∞Î≥∏');
            }
            
            return nameMatch || phoneMatch || storeMatch || notesMatch || rankMatch;
        });
    }
    
    // ?ÑÏû¨ ?ïÎ†¨ ?ÅÌÉúÍ∞Ä ?àÏúºÎ©??ÅÏö©
    if (currentSort.field) {
        displayedCustomers = applySort(displayedCustomers, currentSort.field, currentSort.order);
    }
    
    renderCustomerList(displayedCustomers);
}

// ?±Í∏â Î≥ÄÍ≤??¥Î†• Î≥¥Í∏∞ ?®Ïàò
function viewRankChangeHistory(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    const customerRankChanges = rankChanges.filter(rc => rc.customerId === customerId);
    
    // ?±Í∏â Î≥ÄÍ≤??¥Î†• Î™®Îã¨ ?ùÏÑ±
    const historyModal = `
    <div class="modal fade" id="rank-history-modal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${customer.name} Í≥†Í∞ù ?±Í∏â Î≥ÄÍ≤??¥Î†•</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <div>
                                <strong>?ÑÏû¨ ?±Í∏â:</strong> 
                                <span class="badge ${customer.rank === 'vvip' ? 'badge-vvip' : customer.rank === 'vip' ? 'badge-vip' : 'badge-regular'}">
                                    ${customer.rank === 'vvip' ? 'VVIP' : customer.rank === 'vip' ? 'VIP' : '?ºÎ∞ò'}
                                </span>
                            </div>
                            <button class="btn btn-sm btn-primary" id="manual-rank-change-btn">?òÎèô ?±Í∏â Î≥ÄÍ≤?/button>
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Î≥ÄÍ≤ΩÏùº</th>
                                    <th>?¥Ï†Ñ ?±Í∏â</th>
                                    <th>Î≥ÄÍ≤??±Í∏â</th>
                                    <th>Î≥ÄÍ≤??¨Ïú†</th>
                                    <th>Î≥ÄÍ≤ΩÏûê</th>
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
                                                    ${rc.oldRank === 'vvip' ? 'VVIP' : rc.oldRank === 'vip' ? 'VIP' : '?ºÎ∞ò'}
                                                </span>
                                            </td>
                                            <td>
                                                <span class="badge ${rc.newRank === 'vvip' ? 'badge-vvip' : rc.newRank === 'vip' ? 'badge-vip' : 'badge-regular'}">
                                                    ${rc.newRank === 'vvip' ? 'VVIP' : rc.newRank === 'vip' ? 'VIP' : '?ºÎ∞ò'}
                                                </span>
                                            </td>
                                            <td>${rc.reason}</td>
                                            <td>${rc.changedBy}</td>
                                        </tr>
                                    `).join('') 
                                    : '<tr><td colspan="5" class="text-center">?±Í∏â Î≥ÄÍ≤??¥Î†•???ÜÏäµ?àÎã§.</td></tr>'
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">?´Í∏∞</button>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // Í∏∞Ï°¥ Î™®Îã¨???àÏúºÎ©??úÍ±∞
    const existingModal = document.getElementById('rank-history-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Î™®Îã¨ Ï∂îÍ? Î∞??úÏãú
    document.body.insertAdjacentHTML('beforeend', historyModal);
    const modal = new bootstrap.Modal(document.getElementById('rank-history-modal'));
    modal.show();
    
    // ?òÎèô ?±Í∏â Î≥ÄÍ≤?Î≤ÑÌäº ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('manual-rank-change-btn').addEventListener('click', () => {
        manualRankChange(customerId, modal);
    });
}

// ?òÎèô ?±Í∏â Î≥ÄÍ≤??®Ïàò
function manualRankChange(customerId, historyModal) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    // ?òÎèô ?±Í∏â Î≥ÄÍ≤?Î™®Îã¨ ?ùÏÑ±
    const changeForm = `
    <div class="modal fade" id="manual-rank-change-modal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${customer.name} Í≥†Í∞ù ?±Í∏â ?òÎèô Î≥ÄÍ≤?/h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="rank-change-form">
                        <input type="hidden" id="rank-change-customer-id" value="${customer.id}">
                        <div class="mb-3">
                            <label for="current-rank" class="form-label">?ÑÏû¨ ?±Í∏â</label>
                            <input type="text" class="form-control" id="current-rank" value="${customer.rank === 'vvip' ? 'VVIP' : customer.rank === 'vip' ? 'VIP' : '?ºÎ∞ò'}" disabled>
                        </div>
                        <div class="mb-3">
                            <label for="new-rank" class="form-label">Î≥ÄÍ≤??±Í∏â</label>
                            <select class="form-control" id="new-rank" required>
                                <option value="vvip" ${customer.rank === 'vvip' ? 'selected' : ''}>VVIP</option>
                                <option value="vip" ${customer.rank === 'vip' ? 'selected' : ''}>VIP</option>
                                <option value="regular" ${customer.rank === 'regular' ? 'selected' : ''}>?ºÎ∞ò</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="rank-change-reason" class="form-label">Î≥ÄÍ≤??¨Ïú†</label>
                            <textarea class="form-control" id="rank-change-reason" rows="3" required></textarea>
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
    const existingModal = document.getElementById('manual-rank-change-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Î™®Îã¨ Ï∂îÍ? Î∞??úÏãú
    document.body.insertAdjacentHTML('beforeend', changeForm);
    const modal = new bootstrap.Modal(document.getElementById('manual-rank-change-modal'));
    modal.show();
    
    // ?òÎèô ?±Í∏â Î≥ÄÍ≤????úÏ∂ú ?¥Î≤§??Î¶¨Ïä§??
    document.getElementById('rank-change-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const customerId = parseInt(document.getElementById('rank-change-customer-id').value);
        const newRank = document.getElementById('new-rank').value;
        const reason = document.getElementById('rank-change-reason').value;
        
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            const oldRank = customer.rank;
            
            // ?±Í∏â??Î≥ÄÍ≤ΩÎêú Í≤ΩÏö∞?êÎßå ?¥Î†• Ï∂îÍ?
            if (oldRank !== newRank) {
                // Í≥†Í∞ù ?±Í∏â Î≥ÄÍ≤?
                customer.rank = newRank;
                
                // ?±Í∏â Î≥ÄÍ≤??¥Î†• Ï∂îÍ?
                const rankChange = {
                    id: rankChanges.length > 0 ? Math.max(...rankChanges.map(r => r.id)) + 1 : 1,
                    customerId: customer.id,
                    oldRank: oldRank,
                    newRank: customer.rank,
                    reason: reason,
                    date: new Date().toISOString().split('T')[0],
                    changedBy: localStorage.getItem('username') || 'Í¥ÄÎ¶¨Ïûê'
                };
                
                rankChanges.push(rankChange);
                
                // ?∞Ïù¥???Ä??
                saveDataToFirebase();
                
                // ?åÎ¶º ?úÏãú
                alert('Í≥†Í∞ù ?±Í∏â??Î≥ÄÍ≤ΩÎêò?àÏäµ?àÎã§.');
                
                // Î™®Îã¨ ?´Í∏∞
                modal.hide();
                
                // ?¥Î†• Î™®Îã¨ ?´Í∏∞
                historyModal.hide();
                
                // Í≥†Í∞ù Î™©Î°ù ?àÎ°úÍ≥†Ïπ®
                loadCustomerList();
                
                // ?±Í∏â Î≥ÄÍ≤??¥Î†• Î™®Îã¨ ?§Ïãú ?¥Í∏∞
                viewRankChangeHistory(customerId);
            } else {
                alert('Í∞ôÏ? ?±Í∏â?ºÎ°ú??Î≥ÄÍ≤ΩÌï† ???ÜÏäµ?àÎã§.');
            }
        }
    });
}

// ?ëÏ? ?ÖÎ°ú??Ï≤òÎ¶¨ ?®Ïàò
async function handleExcelUpload() {
    const fileInput = document.getElementById('excel-file');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('?ëÏ? ?åÏùº???†ÌÉù?¥Ï£º?∏Ïöî.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Í≥†Í∞ù?ïÎ≥¥ ?úÌä∏ Ï≤òÎ¶¨
            let customerData = [];
            let purchaseData = [];
            
            // ?úÌä∏Î≥??∞Ïù¥??Ï∂îÏ∂ú
            console.log('?îç Î∞úÍ≤¨???úÌä∏:', workbook.SheetNames);
            
            workbook.SheetNames.forEach((sheetName, index) => {
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                console.log(`?ìã ?úÌä∏ "${sheetName}" ?∞Ïù¥??(Ï≤?3??:`, jsonData.slice(0, 3));
                
                if (index === 0) {
                    // Ï≤?Î≤àÏß∏ ?úÌä∏????ÉÅ Í≥†Í∞ù?ïÎ≥¥Î°?Í∞ÑÏ£º
                    customerData = jsonData;
                    console.log('??Ï≤?Î≤àÏß∏ ?úÌä∏Î•?Í≥†Í∞ù?ïÎ≥¥Î°??§Ï†ï');
                } else if (index === 1) {
                    // ??Î≤àÏß∏ ?úÌä∏????ÉÅ Íµ¨Îß§?¥Î†•?ºÎ°ú Í∞ÑÏ£º
                    purchaseData = jsonData;
                    console.log('????Î≤àÏß∏ ?úÌä∏Î•?Íµ¨Îß§?¥Î†•?ºÎ°ú ?§Ï†ï');
                } else if (sheetName.includes('Í≥†Í∞ù') || sheetName.includes('customer') || workbook.SheetNames.length === 1) {
                    customerData = jsonData;
                    console.log('???úÌä∏Î™ÖÏúºÎ°?Í≥†Í∞ù?ïÎ≥¥ ?∏Ïãù');
                } else if (sheetName.includes('Íµ¨Îß§') || sheetName.includes('purchase')) {
                    purchaseData = jsonData;
                    console.log('???úÌä∏Î™ÖÏúºÎ°?Íµ¨Îß§?¥Î†• ?∏Ïãù');
                }
            });
            
            // ?®Ïùº ?úÌä∏??Í≤ΩÏö∞ Í≥†Í∞ù?ïÎ≥¥Î°?Ï≤òÎ¶¨
            if (workbook.SheetNames.length === 1 && customerData.length === 0) {
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                customerData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            }
            
            console.log('?ìä ÏµúÏ¢Ö Ï≤òÎ¶¨???∞Ïù¥??');
            console.log('Í≥†Í∞ù?ïÎ≥¥ ????', customerData.length);
            console.log('Íµ¨Îß§?¥Î†• ????', purchaseData.length);
            
            await processExcelDataWithPurchases(customerData, purchaseData);
        } catch (error) {
            alert('?ëÏ? ?åÏùº ?ΩÍ∏∞ Ï§??§Î•òÍ∞Ä Î∞úÏÉù?àÏäµ?àÎã§: ' + error.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

// Í≥†Í∞ù?ïÎ≥¥?Ä Íµ¨Îß§?¥Î†•???®Íªò Ï≤òÎ¶¨?òÎäî ?®Ïàò
async function processExcelDataWithPurchases(customerData, purchaseData) {
    let customerSuccessCount = 0;
    let customerErrorCount = 0;
    let purchaseSuccessCount = 0;
    let purchaseErrorCount = 0;
    const errors = [];
    const customerPhoneMap = new Map(); // ?ÑÌôîÎ≤àÌò∏Î°?Í≥†Í∞ù ID Îß§Ìïë
    
    // Í∏∞Ï°¥ Í≥†Í∞ù?§ÏùÑ ÎßµÏóê Ï∂îÍ?
    customers.forEach(customer => {
        const cleanPhone = customer.phone.replace(/[\s-]/g, '');
        customerPhoneMap.set(cleanPhone, customer.id);
    });
    console.log('?í° Í∏∞Ï°¥ Í≥†Í∞ù Îß§Ìïë ?ÑÎ£å:', customerPhoneMap.size, 'Î™?);
    
    // 1?®Í≥Ñ: Í≥†Í∞ù?ïÎ≥¥ Ï≤òÎ¶¨
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
                    phone: (row[2] || '').toString().replace(/[\s-]/g, ''), // ?ÑÌôîÎ≤àÌò∏ ?ïÎ¶¨
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
                    errors.push(`Í≥†Í∞ù?ïÎ≥¥ ${i + 1}?? ?¥Î¶ÑÍ≥??ÑÌôîÎ≤àÌò∏???ÑÏàò?ÖÎãà??`);
                    customerErrorCount++;
                    continue;
                }
                
                // ?ÑÌôîÎ≤àÌò∏ Ï§ëÎ≥µ Ï≤¥ÌÅ¨ (?ôÏùº?∏ÏúºÎ°?Í∞ÑÏ£º)
                const existingCustomer = customers.find(c => c.phone.replace(/[\s-]/g, '') === customer.phone);
                if (existingCustomer) {
                    // Í∏∞Ï°¥ Í≥†Í∞ù ?ïÎ≥¥Î•??ÖÎç∞?¥Ìä∏?òÍ≥† ÎßµÏóê Ï∂îÍ?
                    customerPhoneMap.set(customer.phone, existingCustomer.id);
                    errors.push(`Í≥†Í∞ù?ïÎ≥¥ ${i + 1}?? ?ÑÌôîÎ≤àÌò∏ ${customer.phone}???¥Î? Ï°¥Ïû¨?©Îãà?? (Í∏∞Ï°¥ Í≥†Í∞ùÍ≥??∞Í≤∞)`);
                    customerErrorCount++;
                    continue;
                }
                
                customers.push(customer);
                customerPhoneMap.set(customer.phone, customer.id);
                customerSuccessCount++;
                
            } catch (error) {
                errors.push(`Í≥†Í∞ù?ïÎ≥¥ ${i + 1}?? ?∞Ïù¥??Ï≤òÎ¶¨ ?§Î•ò - ${error.message}`);
                customerErrorCount++;
            }
        }
    }
    
    // 2?®Í≥Ñ: Íµ¨Îß§?¥Î†• Ï≤òÎ¶¨
    console.log('?í∞ Íµ¨Îß§?¥Î†• Ï≤òÎ¶¨ ?úÏûë...');
    console.log('Íµ¨Îß§?¥Î†• ?∞Ïù¥??Í∏∏Ïù¥:', purchaseData.length);
    console.log('?±Î°ù??Í≥†Í∞ù ??', customers.length);
    console.log('Í≥†Í∞ù ?ÑÌôîÎ≤àÌò∏ Îß?', Array.from(customerPhoneMap.entries()));
    
    if (purchaseData.length > 1) {
        console.log('Íµ¨Îß§?¥Î†• ?§Îçî:', purchaseData[0]);
        for (let i = 1; i < purchaseData.length; i++) {
            const row = purchaseData[i];
            
            // Ï≤òÏùå 5?âÎßå ?ÅÏÑ∏ Î°úÍ∑∏ Ï∂úÎ†•
            const isDetailLog = i <= 5;
            
            if (isDetailLog) {
                console.log(`?ìä Íµ¨Îß§?¥Î†• ${i + 1}??Ï≤¥ÌÅ¨:`, { 'rowÏ°¥Ïû¨': !!row, 'Í∏∏Ïù¥': row?.length, 'Ï≤´Î≤àÏß∏Í∞í': row?.[0] });
            }
            
            if (!row || row.length === 0 || (!row[0] && row[0] !== 0)) {
                if (isDetailLog) console.log(`??∏è Íµ¨Îß§?¥Î†• ${i + 1}??Í±¥ÎÑà?Ä (Îπ???`);
                continue;
            }
            
            try {
                // ?îÎ≤ÑÍπ? ?êÎ≥∏ ?∞Ïù¥???ïÏù∏ (Ï≤òÏùå 5?âÎßå)
                if (isDetailLog) {
                    console.log(`\n?îç Íµ¨Îß§?¥Î†• ${i + 1}???êÎ≥∏:`, row);
                }
                
                // ?ÑÌôîÎ≤àÌò∏ ?ïÎ¶¨ (Í≥µÎ∞±, ?òÏù¥???úÍ±∞)
                const customerPhone = (row[0] || '').toString().replace(/[\s-]/g, '');
                const purchaseDate = convertDate(row[1]);
                const itemName = row[2] || '';
                // Í∞ÄÍ≤?Ï≤òÎ¶¨ Í∞úÏÑ† (?§Ïñë???ïÌÉú??Í∞ÄÍ≤??ïÏãù Ï≤òÎ¶¨)
                let priceStr = (row[3] || '').toString()
                    .replace(/,/g, '')           // ÏΩ§Îßà ?úÍ±∞
                    .replace(/??g, '')          // '?? Î¨∏Ïûê ?úÍ±∞
                    .replace(/\s/g, '')          // Í≥µÎ∞± ?úÍ±∞
                    .replace(/[^0-9.-]/g, '');   // ?´Ïûê, ?? ?òÏù¥????Î™®Îì† Î¨∏Ïûê ?úÍ±∞
                
                const price = parseFloat(priceStr) || 0;
                
                if (isDetailLog) {
                    console.log(`?í∞ Í∞ÄÍ≤?Ï≤òÎ¶¨:`, {
                        '?êÎ≥∏': row[3],
                        'Ï≤òÎ¶¨??Î¨∏Ïûê??: priceStr,
                        'ÏµúÏ¢Ö ?´Ïûê': price,
                        '?†Ìö®?úÍ?': price > 0
                    });
                }
                const orderNumber = row[4] || '';
                const store = row[5] || '';
                const seller = row[6] || '';
                const paymentMethod = row[7] || '?†Ïö©Ïπ¥Îìú';
                const memo = row[8] || '';
                
                // ?îÎ≤ÑÍπ? Ï≤òÎ¶¨???∞Ïù¥???ïÏù∏ (Ï≤òÏùå 5?âÎßå)
                if (isDetailLog) {
                    console.log(`?ìù Íµ¨Îß§?¥Î†• ${i + 1}??Ï≤òÎ¶¨??`, {
                        customerPhone, purchaseDate, itemName, price, orderNumber, store, seller, paymentMethod, memo
                    });
                    
                    // ?ÑÏàò ?ÑÎìú Í≤ÄÏ¶?(???êÏÑ∏??Î°úÍ∑∏)
                    console.log(`???ÑÏàò ?ÑÎìú Í≤ÄÏ¶?`, {
                        '?ÑÌôîÎ≤àÌò∏': customerPhone ? '?? : '??,
                        '?ÅÌíàÎ™?: itemName ? '?? : '??, 
                        'Í∞ÄÍ≤?: price > 0 ? '?? : '??,
                        'Í∞ÄÍ≤©Í∞í': price,
                        'Í∞ÄÍ≤©Î¨∏?êÏó¥': priceStr
                    });
                }
                
                if (!customerPhone || !itemName || price <= 0) {
                    const reason = [];
                    if (!customerPhone) reason.push('?ÑÌôîÎ≤àÌò∏ ?ÜÏùå');
                    if (!itemName) reason.push('?ÅÌíàÎ™??ÜÏùå');
                    if (price <= 0) reason.push(`Í∞ÄÍ≤??§Î•ò(${price})`);
                    
                    errors.push(`Íµ¨Îß§?¥Î†• ${i + 1}?? ${reason.join(', ')} (?ÑÌôîÎ≤àÌò∏:"${customerPhone}", ?ÅÌíàÎ™?"${itemName}", Í∞ÄÍ≤?${price})`);
                    purchaseErrorCount++;
                    if (isDetailLog) console.log(`??Íµ¨Îß§?¥Î†• ${i + 1}???§Ìå®: ${reason.join(', ')}`);
                    continue;
                }
                
                // Í≥†Í∞ù Ï∞æÍ∏∞ (?àÎ°ú ?±Î°ù??Í≥†Í∞ù ?êÎäî Í∏∞Ï°¥ Í≥†Í∞ù)
                let customerId = customerPhoneMap.get(customerPhone);
                if (isDetailLog) console.log(`?ë§ Í≥†Í∞ù Ï∞æÍ∏∞: ?ÑÌôîÎ≤àÌò∏="${customerPhone}", ÎßµÏóê??Ï∞æÏ? ID=${customerId}`);
                
                if (!customerId) {
                    // Í∏∞Ï°¥ Í≥†Í∞ù?êÏÑú ?ÑÌôîÎ≤àÌò∏ ?ïÎ¶¨?¥ÏÑú ÎπÑÍµê
                    const existingCustomer = customers.find(c => c.phone.replace(/[\s-]/g, '') === customerPhone);
                    if (existingCustomer) {
                        customerId = existingCustomer.id;
                        // ?àÎ°ú ?±Î°ù??Í≥†Í∞ùÍ≥ºÏùò ?∞Í≤∞???ÑÌï¥ ÎßµÏóê Ï∂îÍ?
                        customerPhoneMap.set(customerPhone, customerId);
                        if (isDetailLog) console.log(`??Í∏∞Ï°¥ Í≥†Í∞ù Î∞úÍ≤¨: ${existingCustomer.name} (ID: ${customerId})`);
                    } else {
                        // ÎßµÏóê ?àÎäî ?ÑÌôîÎ≤àÌò∏ Î™©Î°ù ?ïÏù∏
                        const mapPhones = Array.from(customerPhoneMap.keys()).slice(0, 10).join(', ');
                        errors.push(`Íµ¨Îß§?¥Î†• ${i + 1}?? ?ÑÌôîÎ≤àÌò∏ "${customerPhone}"???¥Îãπ?òÎäî Í≥†Í∞ù??Ï∞æÏùÑ ???ÜÏäµ?àÎã§. (ÎßµÏùò ?ÑÌôîÎ≤àÌò∏ ?àÏãú: ${mapPhones}...)`);
                        purchaseErrorCount++;
                        continue;
                    }
                }
                
                // Íµ¨Îß§ Í∏∞Î°ù Ï∂îÍ?
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
                
                // Í≥†Í∞ù Íµ¨Îß§ ?ïÎ≥¥ ?ÖÎç∞?¥Ìä∏
                const customer = customers.find(c => c.id === customerId);
                if (customer) {
                    const oldTotal = customer.totalPurchase;
                    const oldCount = customer.purchaseCount;
                    
                    customer.totalPurchase += price;
                    customer.purchaseCount += 1;
                    customer.lastVisit = purchase.date;
                    updateCustomerRank(customer);
                    
                    console.log(`Íµ¨Îß§?¥Î†• Ï∂îÍ?: ${customer.name} (${customerPhone}) - Í∏∞Ï°¥: ${formatCurrency(oldTotal)}/${oldCount}Í±???Î≥ÄÍ≤? ${formatCurrency(customer.totalPurchase)}/${customer.purchaseCount}Í±?);
                }
                
                purchaseSuccessCount++;
                
            } catch (error) {
                errors.push(`Íµ¨Îß§?¥Î†• ${i + 1}?? ?∞Ïù¥??Ï≤òÎ¶¨ ?§Î•ò - ${error.message}`);
                purchaseErrorCount++;
            }
        }
    }
    
    // Í≤∞Í≥º ?Ä??Î∞??åÎ¶º
    if (customerSuccessCount > 0 || purchaseSuccessCount > 0) {
        await saveDataToFirebase();
        loadCustomerList();
    }
    
    let message = `?ÖÎ°ú???ÑÎ£å!\n`;
    message += `Í≥†Í∞ù?ïÎ≥¥ - ?±Í≥µ: ${customerSuccessCount}Î™? ?§Ìå®: ${customerErrorCount}Î™?n`;
    message += `Íµ¨Îß§?¥Î†• - ?±Í≥µ: ${purchaseSuccessCount}Í±? ?§Ìå®: ${purchaseErrorCount}Í±?;
    
    if (errors.length > 0) {
        message += '\n\n?í° ?§Î•ò ?¥Í≤∞ Í∞Ä?¥Îìú:\n';
        message += '??Íµ¨Îß§?¥Î†• ?úÌä∏??Í≥†Í∞ù?ÑÌôîÎ≤àÌò∏Í∞Ä Í≥†Í∞ù?ïÎ≥¥ ?úÌä∏???ÑÌôîÎ≤àÌò∏?Ä ?ïÌôï???ºÏπò?òÎäîÏßÄ ?ïÏù∏?òÏÑ∏??n';
        message += '???ÑÌôîÎ≤àÌò∏??Í≥µÎ∞±?¥ÎÇò ?πÏàòÎ¨∏ÏûêÍ∞Ä ?ÜÎäîÏßÄ ?ïÏù∏?òÏÑ∏??n';
        message += '??Í∞ÄÍ≤©Ïù¥ ?´ÏûêÎ°??ÖÎ†•?òÏóà?îÏ? ?ïÏù∏?òÏÑ∏??n\n';
        message += '?§Î•ò ?¥Ïö©:\n' + errors.slice(0, 15).join('\n');
        if (errors.length > 15) {
            message += `\n... Î∞?${errors.length - 15}Í∞?Ï∂îÍ? ?§Î•ò`;
        }
    }
    
    // Í∏?Î©îÏãúÏßÄÎ•??ÑÌï¥ confirm ?Ä????Ï∞??¨Ïö©
    if (message.length > 1000) {
        const newWindow = window.open('', '_blank', 'width=600,height=400');
        newWindow.document.write(`
            <html>
                <head><title>?ëÏ? ?ÖÎ°ú??Í≤∞Í≥º</title></head>
                <body style="font-family: Arial; padding: 20px; white-space: pre-wrap;">
                    ${message.replace(/\n/g, '<br>')}
                    <br><br>
                    <button onclick="window.close()">?´Í∏∞</button>
                </body>
            </html>
        `);
    } else {
        alert(message);
    }
    document.getElementById('excel-file').value = '';
}

// Í∏∞Ï°¥ ?ëÏ? ?∞Ïù¥??Ï≤òÎ¶¨ ?®Ïàò (?®Ïùº ?úÌä∏ ?∏Ìôò??
async function processExcelData(data) {
    if (data.length < 2) {
        alert('?ëÏ? ?åÏùº???∞Ïù¥?∞Í? ?ÜÏäµ?àÎã§.');
        return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Ï≤?Î≤àÏß∏ ?âÏ? ?§ÎçîÎ°?Í∞ÑÏ£º?òÍ≥† Í±¥ÎÑà?∞Í∏∞
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        
        // Îπ???Í±¥ÎÑà?∞Í∏∞
        if (!row || row.length === 0 || !row[0]) {
            continue;
        }
        
        try {
            // ?ëÏ? ?∞Ïù¥?∞Î? Í≥†Í∞ù Í∞ùÏ≤¥Î°?Î≥Ä??
            const customer = {
                id: customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1,
                name: row[0] || '',
                gender: convertGender(row[1]),
                phone: (row[2] || '').toString().replace(/[\s-]/g, ''), // ?ÑÌôîÎ≤àÌò∏ ?ïÎ¶¨
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
            
            // ?ÑÏàò ?ÑÎìú Í≤ÄÏ¶?
            if (!customer.name || !customer.phone) {
                errors.push(`${i + 1}?? ?¥Î¶ÑÍ≥??ÑÌôîÎ≤àÌò∏???ÑÏàò?ÖÎãà??`);
                errorCount++;
                continue;
            }
            
            // ?ÑÌôîÎ≤àÌò∏ Ï§ëÎ≥µ Ï≤¥ÌÅ¨ (?ôÏùº?∏ÏúºÎ°?Í∞ÑÏ£º)
            if (customers.find(c => c.phone.replace(/[\s-]/g, '') === customer.phone)) {
                errors.push(`${i + 1}?? ?ÑÌôîÎ≤àÌò∏ ${customer.phone}???¥Î? Ï°¥Ïû¨?©Îãà?? (?ôÏùº?∏ÏúºÎ°?Í∞ÑÏ£º?òÏó¨ ?ùÎûµ)`);
                errorCount++;
                continue;
            }
            
            customers.push(customer);
            successCount++;
            
        } catch (error) {
            errors.push(`${i + 1}?? ?∞Ïù¥??Ï≤òÎ¶¨ ?§Î•ò - ${error.message}`);
            errorCount++;
        }
    }
    
    // Í≤∞Í≥º ?Ä??Î∞??åÎ¶º
    if (successCount > 0) {
        await saveDataToFirebase();
        loadCustomerList();
    }
    
    let message = `?ÖÎ°ú???ÑÎ£å!\n?±Í≥µ: ${successCount}Î™? ?§Ìå®: ${errorCount}Î™?;
    if (errors.length > 0) {
        message += '\n\n?§Î•ò ?¥Ïö©:\n' + errors.slice(0, 5).join('\n');
        if (errors.length > 5) {
            message += `\n... Î∞?${errors.length - 5}Í∞?Ï∂îÍ? ?§Î•ò`;
        }
    }
    
    alert(message);
    
    // ?åÏùº ?ÖÎ†• Ï¥àÍ∏∞??
    document.getElementById('excel-file').value = '';
}

// ?±Î≥Ñ Î≥Ä???®Ïàò
function convertGender(value) {
    if (!value) return '';
    const str = value.toString().toLowerCase();
    if (str.includes('??) || str === 'm' || str === 'male') return 'male';
    if (str.includes('??) || str === 'f' || str === 'female') return 'female';
    return '';
}

// ?†Ïßú Î≥Ä???®Ïàò
function convertDate(value) {
    if (!value) return '';
    
    try {
        // ?ëÏ? ?†Ïßú ?ïÏãù Ï≤òÎ¶¨
        if (typeof value === 'number') {
            // Excel date serial number
            const date = new Date((value - 25569) * 86400 * 1000);
            return date.toISOString().split('T')[0];
        }
        
        // Î¨∏Ïûê???†Ïßú Ï≤òÎ¶¨
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

// Í≥†Í∞ù ?∞Ïù¥???ëÏ? ?¥Î≥¥?¥Í∏∞ ?®Ïàò
function exportCustomersToExcel() {
    if (customers.length === 0) {
        alert('?¥Î≥¥??Í≥†Í∞ù ?∞Ïù¥?∞Í? ?ÜÏäµ?àÎã§.');
        return;
    }
    
    // Í≥†Í∞ù?ïÎ≥¥ ?úÌä∏ ?∞Ïù¥??Ï§ÄÎπ?
    const customerData = [
        ['Î≤àÌò∏', '?¥Î¶Ñ', '?±Î≥Ñ', '?ÑÌôîÎ≤àÌò∏', '?ùÎÖÑ?îÏùº', 'Ï£ºÏÜå', 'Ï£ºÎ∞©Î¨∏Îß§??, '?¥Î©î??, '?±Í∏â', 'Ï¥ùÍµ¨Îß§Ïï°', 'Íµ¨Îß§?üÏàò', 'ÏµúÍ∑ºÎ∞©Î¨∏??, 'Î©îÎ™®']
    ];
    
    customers.forEach((customer, index) => {
        const genderText = customer.gender === 'male' ? '?®ÏÑ±' : customer.gender === 'female' ? '?¨ÏÑ±' : '';
        const rankText = customer.rank === 'vvip' ? 'VVIP' : customer.rank === 'vip' ? 'VIP' : '?ºÎ∞ò';
        
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
    
    // Íµ¨Îß§?¥Î†• ?úÌä∏ ?∞Ïù¥??Ï§ÄÎπ?
    const purchaseData = [
        ['Î≤àÌò∏', 'Í≥†Í∞ùÎ™?, 'Í≥†Í∞ù?ÑÌôîÎ≤àÌò∏', 'Íµ¨Îß§??, '?ÅÌíàÎ™?, 'Í∞ÄÍ≤?, 'Ï£ºÎ¨∏?•Î≤à??, 'Íµ¨Îß§Îß§Ïû•', '?¥Îãπ?Ä??, 'Í≤∞Ï†úÎ∞©Î≤ï', 'Î©îÎ™®']
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
                    purchase.paymentMethod || '?†Ïö©Ïπ¥Îìú',
                    purchase.memo || ''
                ]);
            });
        }
    });
    
    // ?†Î¨º?¥Î†• ?úÌä∏ ?∞Ïù¥??Ï§ÄÎπ?
    const giftData = [
        ['Î≤àÌò∏', 'Í≥†Í∞ùÎ™?, 'Í≥†Í∞ù?ÑÌôîÎ≤àÌò∏', '?†Î¨ºÏ¢ÖÎ•ò', '?†Î¨º?¥Ïö©', '?úÍ≥µ?ºÏûê', '?úÍ≥µ?¥Ïú†']
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
    
    // Î∞©Î¨∏?¥Î†• ?úÌä∏ ?∞Ïù¥??Ï§ÄÎπ?
    const visitData = [
        ['Î≤àÌò∏', 'Í≥†Í∞ùÎ™?, 'Í≥†Í∞ù?ÑÌôîÎ≤àÌò∏', 'Î∞©Î¨∏??, 'Î∞©Î¨∏Îß§Ïû•', 'Î∞©Î¨∏Î™©Ï†Å', 'Î©îÎ™®']
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
    
    // ?åÌÅ¨Î∂??ùÏÑ±
    const workbook = XLSX.utils.book_new();
    
    // Í∞??úÌä∏ Ï∂îÍ?
    const customerSheet = XLSX.utils.aoa_to_sheet(customerData);
    XLSX.utils.book_append_sheet(workbook, customerSheet, 'Í≥†Í∞ù?ïÎ≥¥');
    
    if (purchaseData.length > 1) {
        const purchaseSheet = XLSX.utils.aoa_to_sheet(purchaseData);
        XLSX.utils.book_append_sheet(workbook, purchaseSheet, 'Íµ¨Îß§?¥Î†•');
    }
    
    if (giftData.length > 1) {
        const giftSheet = XLSX.utils.aoa_to_sheet(giftData);
        XLSX.utils.book_append_sheet(workbook, giftSheet, '?†Î¨º?¥Î†•');
    }
    
    if (visitData.length > 1) {
        const visitSheet = XLSX.utils.aoa_to_sheet(visitData);
        XLSX.utils.book_append_sheet(workbook, visitSheet, 'Î∞©Î¨∏?¥Î†•');
    }
    
    // ?åÏùºÎ™ÖÏóê ?ÑÏû¨ ?†Ïßú ?¨Ìï®
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const fileName = `Í≥†Í∞ùÍ¥ÄÎ¶¨Îç∞?¥ÌÑ∞_${dateStr}.xlsx`;
    
    // ?åÏùº ?§Ïö¥Î°úÎìú
    XLSX.writeFile(workbook, fileName);
    
    alert(`Í≥†Í∞ù ?∞Ïù¥?∞Í? ?±Í≥µ?ÅÏúºÎ°??§Ïö¥Î°úÎìú?òÏóà?µÎãà??\n?åÏùºÎ™? ${fileName}\n\n?¨Ìï®???úÌä∏:\n- Í≥†Í∞ù?ïÎ≥¥ (${customers.length}Î™?\n- Íµ¨Îß§?¥Î†• (${purchases.length}Í±?\n- ?†Î¨º?¥Î†• (${gifts.length}Í±?\n- Î∞©Î¨∏?¥Î†• (${visits.length}Í±?`);
}

// ?ëÏ? ?úÌîåÎ¶??§Ïö¥Î°úÎìú ?®Ïàò
function downloadExcelTemplate() {
    // Í≥†Í∞ù Í∏∞Î≥∏?ïÎ≥¥ ?úÌä∏
    const customerData = [
        ['?¥Î¶Ñ', '?±Î≥Ñ', '?ÑÌôîÎ≤àÌò∏', '?ùÎÖÑ?îÏùº', 'Ï£ºÏÜå', 'Ï£ºÎ∞©Î¨∏Îß§??, '?¥Î©î??, 'Î©îÎ™®'],
        ['?çÍ∏∏??, '?®ÏÑ±', '010-1234-5678', '1990-01-01', '?úÏö∏??Í∞ïÎÇ®Íµ?, 'Í∞ïÎÇ®??, 'hong@example.com', '?∞ÏàòÍ≥†Í∞ù'],
        ['ÍπÄ?ÅÌù¨', '?¨ÏÑ±', '010-9876-5432', '1985-05-15', '?úÏö∏???úÏ¥àÍµ?, '?úÏ¥à??, 'kim@example.com', '?®Í≥®Í≥†Í∞ù'],
        ['Î∞ïÏ≤†??, '?®ÏÑ±', '010-5555-1234', '1988-12-25', '?úÏö∏???°ÌååÍµ?, '?†Ïã§??, 'park@example.com', 'VIPÍ≥†Í∞ù']
    ];
    
    // Íµ¨Îß§?¥Î†• ?úÌä∏ (Í≥†Í∞ù ?ÑÌôîÎ≤àÌò∏Î°??∞Í≤∞)
    const purchaseData = [
        ['Í≥†Í∞ù?ÑÌôîÎ≤àÌò∏', 'Íµ¨Îß§??, '?ÅÌíàÎ™?, 'Í∞ÄÍ≤?, 'Ï£ºÎ¨∏?•Î≤à??, 'Íµ¨Îß§Îß§Ïû•', '?¥Îãπ?Ä??, 'Í≤∞Ï†úÎ∞©Î≤ï', 'Î©îÎ™®'],
        ['010-1234-5678', '2024-01-15', 'Í∞ÄÏ£??∏ÎìúÎ∞?, '2800000', 'ORD-2024-001', 'Í∞ïÎÇ®??, 'ÍπÄ?Ä??, '?†Ïö©Ïπ¥Îìú', '?†ÎÖÑ ?†Î¨º'],
        ['010-1234-5678', '2024-02-14', '?§ÌÅ¨ ?§Ïπ¥??, '450000', 'ORD-2024-002', 'Í∞ïÎÇ®??, 'ÍπÄ?Ä??, '?†Ïö©Ïπ¥Îìú', 'Î∞úÎ†å?Ä???†Î¨º'],
        ['010-9876-5432', '2024-01-20', '?îÏûê?¥ÎÑà ÏΩîÌä∏', '3200000', 'ORD-2024-003', '?úÏ¥à??, '?¥Ï???, '?ÑÍ∏à', 'Í≤®Ïö∏ ?ÑÏö∞??],
        ['010-5555-1234', '2024-03-01', 'Î™ÖÌíà ?úÍ≥Ñ', '5500000', 'ORD-2024-004', '?†Ïã§??, 'Î∞ïÏ???, '?†Ïö©Ïπ¥Îìú', '?ùÏùº ?†Î¨º']
    ];
    
    const workbook = XLSX.utils.book_new();
    
    // Í≥†Í∞ù?ïÎ≥¥ ?úÌä∏ Ï∂îÍ?
    const customerSheet = XLSX.utils.aoa_to_sheet(customerData);
    XLSX.utils.book_append_sheet(workbook, customerSheet, 'Í≥†Í∞ù?ïÎ≥¥');
    
    // Íµ¨Îß§?¥Î†• ?úÌä∏ Ï∂îÍ?
    const purchaseSheet = XLSX.utils.aoa_to_sheet(purchaseData);
    XLSX.utils.book_append_sheet(workbook, purchaseSheet, 'Íµ¨Îß§?¥Î†•');
    
    // ?åÏùº ?§Ïö¥Î°úÎìú
    XLSX.writeFile(workbook, 'Í≥†Í∞ùÍ¥ÄÎ¶??µÌï©?úÌîåÎ¶?xlsx');
}

// Í≥†Í∞ù ?ïÎ†¨ ?®Ïàò
function sortCustomers(field) {
    // ?ÑÏû¨ ?ïÎ†¨ ?ÅÌÉú ?ïÏù∏
    if (currentSort.field === field) {
        // Í∞ôÏ? ?ÑÎìúÎ•??¥Î¶≠??Í≤ΩÏö∞ ?ïÎ†¨ ?úÏÑú Î≥ÄÍ≤?
        currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
    } else {
        // ?§Î•∏ ?ÑÎìúÎ•??¥Î¶≠??Í≤ΩÏö∞ ?àÎ°ú???ÑÎìúÎ°??§Î¶ÑÏ∞®Ïàú ?ïÎ†¨
        currentSort.field = field;
        currentSort.order = 'asc';
    }
    
    // ?§Îçî ?§Ì????ÖÎç∞?¥Ìä∏
    updateSortHeaders();
    
    // ?ÑÏû¨ ?úÏãú Ï§ëÏù∏ Í≥†Í∞ù Î™©Î°ù Í∞Ä?∏Ïò§Í∏?
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    let displayedCustomers = customers;
    
    // Í≤Ä???ÑÌÑ∞ ?ÅÏö©
    if (searchTerm) {
        displayedCustomers = customers.filter(customer => {
            return customer.name.toLowerCase().includes(searchTerm) ||
                   customer.phone.includes(searchTerm) ||
                   (customer.preferredStore && customer.preferredStore.toLowerCase().includes(searchTerm)) ||
                   (customer.notes && customer.notes.toLowerCase().includes(searchTerm)) ||
                   getRankText(customer.rank).toLowerCase().includes(searchTerm);
        });
    }
    
    // ?ïÎ†¨ ?ÅÏö©
    displayedCustomers = applySort(displayedCustomers, field, currentSort.order);
    
    // ?ïÎ†¨??Î™©Î°ù ?åÎçîÎß?
    renderCustomerList(displayedCustomers);
}

// ?ïÎ†¨ ?§Îçî ?§Ì????ÖÎç∞?¥Ìä∏ ?®Ïàò
function updateSortHeaders() {
    // Î™®Îì† ?ïÎ†¨ ?§Îçî Ï¥àÍ∏∞??
    document.querySelectorAll('.sortable').forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
        const icon = header.querySelector('.sort-icon');
        if (icon) {
            icon.className = 'bi bi-arrow-down-up sort-icon';
        }
    });
    
    // ?ÑÏû¨ ?ïÎ†¨ ?ÑÎìú ?úÏãú
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

// ?±Í∏â ?çÏä§??Î≥Ä???®Ïàò
function getRankText(rank) {
    switch (rank) {
        case 'vvip': return 'VVIP';
        case 'vip': return 'VIP';
        case 'regular': return '?ºÎ∞ò';
        default: return '?ºÎ∞ò';
    }
}

// ?ïÎ†¨ ?¥Î≤§??Î¶¨Ïä§???±Î°ù ?®Ïàò
function attachSortListeners() {
    document.querySelectorAll('.sortable').forEach(header => {
        // Í∏∞Ï°¥ ?¥Î≤§??Î¶¨Ïä§???úÍ±∞ (Ï§ëÎ≥µ Î∞©Ï?)
        header.removeEventListener('click', sortHandler);
        // ???¥Î≤§??Î¶¨Ïä§??Ï∂îÍ?
        header.addEventListener('click', sortHandler);
    });
}

// ?ïÎ†¨ ?¥Î≤§???∏Îì§???®Ïàò
function sortHandler(event) {
    const sortField = event.currentTarget.getAttribute('data-sort');
    sortCustomers(sortField);
}

// Î∞∞Ïó¥???ïÎ†¨ ?ÅÏö©?òÎäî ?®Ïàò
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
                // ?±Í∏â ?∞ÏÑ†?úÏúÑ: vvip > vip > regular
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
        
        // Î¨∏Ïûê??ÎπÑÍµê
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            const comparison = aValue.localeCompare(bValue, 'ko');
            return order === 'asc' ? comparison : -comparison;
        }
        
        // ?´Ïûê ÎπÑÍµê
        if (aValue < bValue) {
            return order === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return order === 'asc' ? 1 : -1;
        }
        return 0;
    });
}



// ??†ú??- ???¥ÏÉÅ ?ôÍ∏∞??ÎπÑÌôú?±Ìôî Í∏∞Îä• ?ÜÏùå (??ÉÅ ?úÏÑ±??

// Î°úÍ∑∏???òÌñâ ?®Ïàò
function performLogin() {
    console.log('Î°úÍ∑∏???úÏûë...');
    
    // Î°úÍ∑∏???ÅÌÉú ?Ä??
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('username', 'admin');
    
    // DOM ?îÏÜå Í∞Ä?∏Ïò§Í∏?
    const loginForm = document.getElementById('login-form');
    const mainContent = document.getElementById('main-content');
    
    console.log('loginForm:', loginForm);
    console.log('mainContent:', mainContent);
    
    // Ï¶âÏãú ?òÏù¥ÏßÄ ?ÑÌôò (?¨Îü¨ Î∞©Î≤ï?ºÎ°ú Í∞ïÏ†ú)
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
    
    // ?∞Ïù¥??Î°úÎìú (Ï¶âÏãú)
    try {
        if (typeof loadCustomerList === 'function') loadCustomerList();
        if (typeof loadBirthdayAlerts === 'function') loadBirthdayAlerts();
        if (typeof loadRankingCounts === 'function') loadRankingCounts();
    } catch (error) {
        console.error('?∞Ïù¥??Î°úÎìú ?§Î•ò:', error);
    }
    
    // Í∞ïÏ†ú Î¶¨Î†å?îÎßÅ
    requestAnimationFrame(() => {
        if (mainContent) {
            mainContent.style.opacity = '0';
            requestAnimationFrame(() => {
                mainContent.style.opacity = '1';
            });
        }
    });
    
    console.log('Î°úÍ∑∏???ÑÎ£å');
}

// Î°úÍ∑∏?ÑÏõÉ ?òÌñâ ?®Ïàò  
function performLogout() {
    console.log('Î°úÍ∑∏?ÑÏõÉ ?úÏûë...');
    
    // Î°úÍ∑∏???ÅÌÉú ?úÍ±∞
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    
    // DOM ?îÏÜå Í∞Ä?∏Ïò§Í∏?
    const loginForm = document.getElementById('login-form');
    const mainContent = document.getElementById('main-content');
    const passwordInput = document.getElementById('password');
    
    console.log('logout - loginForm:', loginForm);
    console.log('logout - mainContent:', mainContent);
    
    // Ï¶âÏãú ?òÏù¥ÏßÄ ?ÑÌôò (?¨Îü¨ Î∞©Î≤ï?ºÎ°ú Í∞ïÏ†ú)
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
    
    // ?®Ïä§?åÎìú ?ÖÎ†•Ï∞?Ï¥àÍ∏∞??
    if (passwordInput) {
        passwordInput.value = '';
        // ?ΩÍ∞Ñ??ÏßÄ?????¨Ïª§??(?îÎ©¥ ?ÑÌôò ??
        setTimeout(() => {
            passwordInput.focus();
        }, 100);
    }
    
    // Í∞ïÏ†ú Î¶¨Î†å?îÎßÅ
    requestAnimationFrame(() => {
        if (loginForm) {
            loginForm.style.opacity = '0';
            requestAnimationFrame(() => {
                loginForm.style.opacity = '1';
            });
        }
    });
    
    console.log('Î°úÍ∑∏?ÑÏõÉ ?ÑÎ£å');
}
