// 관리자 계정 정보 (실제 환경에서는 서버에서 관리해야 함)
const ADMIN_USERS = [
    { username: 'a', password: '123' },
    { username: 'manager', password: 'manager456' }
];

// 등급 변경 이력 배열 추가
let rankChanges = []; // 등급 변경 이력

// Firebase에서 데이터 로드 (로그인 시에는 불러오기만 수행)
async function loadDataFromStorage(isLoginLoad = false) {
    try {
        console.log('데이터 로드 시작...');
        
        // 1단계: 로컬스토리지에서 빠른 로딩
        const localCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
        const localPurchases = JSON.parse(localStorage.getItem('purchases') || '[]');
        const localGifts = JSON.parse(localStorage.getItem('gifts') || '[]');
        const localVisits = JSON.parse(localStorage.getItem('visits') || '[]');
        const localRankChanges = JSON.parse(localStorage.getItem('rankChanges') || '[]');
        const localLastUpdated = parseInt(localStorage.getItem('lastUpdated') || '0');
        
        // 로컬 데이터를 먼저 화면에 표시 (사용자 경험 향상)
        customers.length = 0;
        purchases.length = 0;
        gifts.length = 0;
        visits.length = 0;
        rankChanges.length = 0;
        
        customers.push(...localCustomers);
        purchases.push(...localPurchases);
        gifts.push(...localGifts);
        visits.push(...localVisits);
        rankChanges.push(...localRankChanges);
        
        console.log('로컬 데이터 로드 완료:', {
            customers: customers.length,
            purchases: purchases.length,
            gifts: gifts.length,
            visits: visits.length
        });
        
        // 2단계: Firebase에서 최신 데이터 확인 및 갱신
        if (window.FirebaseData) {
            try {
                const firebaseData = await window.FirebaseData.loadFromFirebase();
                
                if (firebaseData) {
                    const firebaseLastUpdated = firebaseData.lastUpdated || 0;
                    
                    // Firebase 데이터가 더 최신인 경우 로드
                    if (firebaseLastUpdated > localLastUpdated) {
                        console.log('Firebase에 더 최신 데이터 발견, 로드 중...');
                        
                        customers.length = 0;
                        purchases.length = 0;
                        gifts.length = 0;
                        visits.length = 0;
                        rankChanges.length = 0;
                        
                        customers.push(...(firebaseData.customers || []));
                        purchases.push(...(firebaseData.purchases || []));
                        gifts.push(...(firebaseData.gifts || []));
                        visits.push(...(firebaseData.visits || []));
                        rankChanges.push(...(firebaseData.rankChanges || []));
                        
                        // 로컬스토리지도 업데이트
    localStorage.setItem('customers', JSON.stringify(customers));
    localStorage.setItem('purchases', JSON.stringify(purchases));
    localStorage.setItem('gifts', JSON.stringify(gifts));
    localStorage.setItem('visits', JSON.stringify(visits));
                        localStorage.setItem('rankChanges', JSON.stringify(rankChanges));
                        localStorage.setItem('lastUpdated', firebaseLastUpdated.toString());
                        
                        if (window.FirebaseData && !isLoginLoad) {
                            window.FirebaseData.showSaveStatus('🔄 최신 데이터로 로드됨', 'success');
                        }
                        
                        console.log('Firebase 데이터 로드 완료:', {
                            customers: customers.length,
                            purchases: purchases.length,
                            lastUpdated: new Date(firebaseLastUpdated).toLocaleString()
                        });
                    } else {
                        console.log('로컬 데이터가 최신 상태입니다.');
                        if (window.FirebaseData && !isLoginLoad) {
                            window.FirebaseData.showSaveStatus('✓ 데이터 최신 상태', 'success', 2000);
                        }
                    }
                } else {
                    console.log('Firebase 데이터 없음, 로컬 데이터 사용');
                    // 로그인 직후에는 저장하지 않고 불러오기만 수행
                    console.log('로그인 직후이므로 데이터 불러오기만 실행');
                }
            } catch (firebaseError) {
                console.warn('Firebase 로드 실패, 로컬 데이터 사용:', firebaseError);
                if (window.FirebaseData && !isLoginLoad) {
                    window.FirebaseData.showSaveStatus('⚠ 오프라인 모드', 'info', 3000);
                }
            }
        }
        
        return true;
    } catch (error) {
        console.error('데이터 로드 오류:', error);
        
        // 초기화 실패 시 빈 배열로 초기화
        customers.length = 0;
        purchases.length = 0;
        gifts.length = 0;
        visits.length = 0;
        rankChanges.length = 0;
        
        customers.push([]);
        purchases.push([]);
        gifts.push([]);
        visits.push([]);
        rankChanges.push([]);
        
        if (window.FirebaseData && !isLoginLoad) {
            window.FirebaseData.showSaveStatus('❌ 데이터 로드 실패', 'error');
        }
        
        return false;
    }
}

// Firebase에 데이터 저장
async function saveDataToStorage() {
    try {
        // 로컬스토리지에 즉시 저장 (빠른 응답)
        localStorage.setItem('customers', JSON.stringify(customers));
        localStorage.setItem('purchases', JSON.stringify(purchases));
        localStorage.setItem('gifts', JSON.stringify(gifts));
        localStorage.setItem('visits', JSON.stringify(visits));
        localStorage.setItem('rankChanges', JSON.stringify(rankChanges));
        localStorage.setItem('lastUpdated', Date.now().toString());
        
        console.log('로컬스토리지 저장 완료, Firebase 저장 시작...');
        
        // Firebase에 영구저장 (재시도 로직 포함)
        if (window.FirebaseData) {
            const saveData = {
                customers: customers || [],
                purchases: purchases || [],  
                gifts: gifts || [],
                visits: visits || [],
                rankChanges: rankChanges || []
            };
            
            // 중요: Firebase 저장 성공까지 대기
            const success = await window.FirebaseData.saveToFirebase(saveData);
            
            if (!success) {
                console.warn('Firebase 저장 실패, 로컬 데이터는 유지됨');
                // 로컬스토리지에는 저장되었으므로 데이터 손실은 없음
                return false;
            }
            
            console.log('데이터 영구저장 완료 (로컬 + Firebase)');
            return true;
        } else {
            console.warn('Firebase 초기화 전, 로컬스토리지만 저장됨');
            return false;
        }
    } catch (error) {
        console.error('데이터 저장 오류:', error);
        
        // 중요한 오류 시 사용자에게 알림
        if (window.FirebaseData) {
            window.FirebaseData.showSaveStatus('❌ 데이터 저장 실패', 'error', 5000);
        }
        
        // 최소한 로컬스토리지라도 저장 시도
        try {
            localStorage.setItem('customers', JSON.stringify(customers));
            localStorage.setItem('purchases', JSON.stringify(purchases));
            localStorage.setItem('gifts', JSON.stringify(gifts));
            localStorage.setItem('visits', JSON.stringify(visits));
            localStorage.setItem('rankChanges', JSON.stringify(rankChanges));
            console.log('로컬스토리지 백업 저장 완료');
        } catch (localError) {
            console.error('로컬스토리지 저장도 실패:', localError);
            alert('⚠️ 데이터 저장에 실패했습니다!\n브라우저 저장소를 확인해주세요.');
        }
        
        return false;
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

// DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded', () => {
    // 창을 완전히 닫고 다시 킬 때마다 로그인 필요
    checkLoginStatus();
    
    // 브라우저 완전 종료 시에만 로그인 상태 초기화 (새로고침은 유지)
    window.addEventListener('beforeunload', (e) => {
        // 새로고침이 아닌 완전 종료인지 확인
        // (새로고침/F5는 로그인 상태 유지, 탭 닫기/브라우저 종료만 로그아웃)
        if (e.type === 'beforeunload' && !e.returnValue) {
            // 완전 종료가 아닌 새로고침인 경우 로그인 상태 유지
            console.log('🔄 새로고침 감지 - 로그인 상태 유지');
        }
    });
});

// 로그인 상태 확인 함수 (새로고침 시 로그인 유지)
function checkLoginStatus() {
    // localStorage에서 로그인 상태 확인 (새로고침 시에도 유지)
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (isLoggedIn) {
        console.log('🔐 기존 로그인 상태 확인됨 - 메인 시스템 초기화');
        // 로그인 상태가 있으면 바로 메인 시스템 초기화
        initializeMainSystem();
        
        // 새로고침 시 서버에서 최신 데이터 강제 로드
        setTimeout(() => {
            console.log('🔄 새로고침 감지 - 서버에서 최신 데이터 로드 중...');
            if (window.FirebaseData) {
                window.FirebaseData.forceSyncWithFirebase();
            }
        }, 1000);
        
    } else {
        console.log('🔐 새로운 세션 시작 - 로그인이 필요합니다');
        // 로그인 상태가 없으면 로그인 모달 표시
        showLoginModal();
    }
}

// 로그인 모달 표시
function showLoginModal() {
    const loginModal = new bootstrap.Modal(document.getElementById('login-modal'), {
        backdrop: 'static',
        keyboard: false
    });
    
    // 배경 완전 차단을 위한 강화된 처리 (모든 환경/기기 대응)
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.backgroundColor = '#000000';
    document.body.style.top = '0';
    document.body.style.left = '0';
    
    // 메인 컨테이너 완전 숨기기
    const mainContainer = document.querySelector('.container-fluid');
    if (mainContainer) {
        mainContainer.style.visibility = 'hidden';
        mainContainer.style.display = 'none';
    }
    
    // HTML 요소도 고정
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.position = 'fixed';
    document.documentElement.style.width = '100%';
    document.documentElement.style.height = '100%';
    
    loginModal.show();
    
    // 모달이 완전히 표시된 후 배경 강화
    document.getElementById('login-modal').addEventListener('shown.bs.modal', function () {
        // 추가 배경 오버레이 생성
        const overlay = document.createElement('div');
        overlay.id = 'login-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: rgba(0, 0, 0, 0.95);
            z-index: 1040;
            pointer-events: none;
        `;
        document.body.appendChild(overlay);
    });
    
    // 로그인 폼 이벤트 리스너
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // 엔터키 지원
    document.getElementById('login-id').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('login-password').focus();
        }
    });
    
    document.getElementById('login-password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin(e);
        }
    });
    
    // 로그인 아이디 필드에 포커스
    setTimeout(() => {
        document.getElementById('login-id').focus();
    }, 500);
}

// 로그인 처리
function handleLogin(e) {
    e.preventDefault();
    
    const loginId = document.getElementById('login-id').value.trim();
    const loginPassword = document.getElementById('login-password').value.trim();
    const errorDiv = document.getElementById('login-error');
    
    // 로그인 인증 (admin / grace1)
    if (loginId === 'admin' && loginPassword === 'grace1') {
        // 로그인 성공 (localStorage에 저장하여 새로고침 시에도 유지)
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('mainWindowLoggedIn', 'true'); // 고객상세페이지와 공유용
        errorDiv.classList.add('d-none');
        
        // 로그인 모달 닫기
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('login-modal'));
        loginModal.hide();
        
        // 배경 완전 복원 (모든 스타일 초기화)
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.backgroundColor = '';
        document.body.style.top = '';
        document.body.style.left = '';
        
        // HTML 요소 스타일 초기화
        document.documentElement.style.overflow = '';
        document.documentElement.style.position = '';
        document.documentElement.style.width = '';
        document.documentElement.style.height = '';
        
        // 메인 컨테이너 완전 복원
        const mainContainer = document.querySelector('.container-fluid');
        if (mainContainer) {
            mainContainer.style.visibility = 'visible';
            mainContainer.style.display = '';
        }
        
        // 추가 오버레이 제거
        const overlay = document.getElementById('login-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        // 메인 시스템 초기화 (로그인 직후에는 데이터 불러오기만 수행)
        initializeMainSystem();
        
        // 로그인 성공 후 고객목록 페이지로 이동
        setTimeout(() => {
            showPage('customer-list');
            localStorage.setItem('currentPage', 'customer-list');
            
            // 스크롤 완전 복원 (추가 보장)
            setTimeout(() => {
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.documentElement.style.overflow = '';
                document.documentElement.style.position = '';
                console.log('✅ 스크롤 복원 완료');
            }, 200);
        }, 100);
        
    } else {
        // 로그인 실패
        errorDiv.classList.remove('d-none');
        document.getElementById('login-id').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('login-id').focus();
    }
}

// 메인 시스템 초기화
function initializeMainSystem() {
    // 로그인 시 데이터 로드 (불러오기만 수행, 상태 메시지 표시 안함)
    loadDataFromStorage(true);

    // 사이드바 토글 기능
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarClose = document.getElementById('sidebar-close');

    // 사이드바 닫기 함수를 전역으로 정의
    window.closeSidebar = function() {
        sidebar.classList.remove('show');
        sidebarOverlay.classList.remove('show');
        document.body.style.overflow = ''; // 스크롤 복원
    };

    // 사이드바 열기
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.add('show');
        sidebarOverlay.classList.add('show');
        document.body.style.overflow = 'hidden'; // 스크롤 방지
    });

    // 사이드바 닫기 버튼 클릭
    sidebarClose.addEventListener('click', window.closeSidebar);

    // 오버레이 클릭 시 사이드바 닫기
    sidebarOverlay.addEventListener('click', window.closeSidebar);

    // ESC 키로 사이드바 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('show')) {
            window.closeSidebar();
        }
    });

    // 네비게이션 메뉴 이벤트 리스너 (페이지 상태 저장 기능 추가)
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.getAttribute('data-page');
            
            // 현재 페이지를 localStorage에 저장 (새로고침 시 복원용)
            localStorage.setItem('currentPage', targetPage);
            console.log(`📄 현재 페이지 저장: ${targetPage}`);
            
            // 페이지 전환 실행
            showPage(targetPage);
            
            // 모바일에서 메뉴 클릭 시 사이드바 닫기
            if (window.innerWidth < 992) {
                window.closeSidebar();
            }
        });
    });

    // 모바일 제목 클릭 시 메인페이지로 이동 (페이지 상태 저장)
    document.getElementById('mobile-title-home').addEventListener('click', () => {
        // 현재 페이지 저장 및 고객 목록 페이지로 이동
        localStorage.setItem('currentPage', 'customer-list');
        console.log('📄 모바일 홈 클릭: customer-list 페이지 저장');
        
        showPage('customer-list');
        
        // 사이드바가 열려있으면 닫기
        if (sidebar.classList.contains('show')) {
            window.closeSidebar();
        }
    });

    // 페이지 로드 시 마지막 페이지 복원 및 데이터 로드 (영구저장 시스템 초기화)
    setTimeout(async () => {
        console.log('🎯 UI 초기화 시작...');
        
        try {
            // 저장된 페이지 복원 (새로고침 시 현재 페이지 유지)
            const savedPage = localStorage.getItem('currentPage') || 'customer-list';
            console.log(`🔄 저장된 페이지 복원: ${savedPage}`);
            showPage(savedPage);
            
        loadCustomerList();
            loadBirthdayAlerts();
            loadRankingCounts();
            
            console.log('✅ UI 초기화 완료');
            
            // 영구저장 시스템 상태 확인 및 자동화 설정
            setTimeout(() => {
                if (window.FirebaseData && window.FirebaseData.isInitialized) {
                    console.log('🔥 Firebase 영구저장 시스템 활성화됨');
                    
                    // 변경사항이 있을 때만 저장하는 모드로 설정
                    console.log('🔄 변경사항 감지 시에만 저장하는 모드 활성화됨');
                    
                } else {
                    console.warn('⚠ Firebase 초기화 실패, 로컬 저장소만 사용');
                    // 로그인 시에는 상태 메시지 표시하지 않음
    }
            }, 1500);
            
        } catch (error) {
            console.error('❌ UI 초기화 중 오류:', error);
        }
    }, 500);

    // 나머지 이벤트 리스너들...
    setupEventListeners();
    
    // 로그아웃 버튼 이벤트 리스너 추가
    setupLogoutListeners();
}

// 페이지 전환 함수 (페이지 상태 관리)
function showPage(targetPage) {
    try {
        // 모든 페이지 숨기기
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('d-none');
        });
        
        // 선택된 페이지 표시
        const targetElement = document.getElementById(targetPage);
        if (targetElement) {
            targetElement.classList.remove('d-none');
            console.log(`✅ 페이지 전환 완료: ${targetPage}`);
        } else {
            console.warn(`⚠️ 페이지를 찾을 수 없음: ${targetPage}, 기본 페이지로 이동`);
            document.getElementById('customer-list').classList.remove('d-none');
            localStorage.setItem('currentPage', 'customer-list');
        }
        
        // 활성 메뉴 표시
        document.querySelectorAll('.nav-link').forEach(navLink => {
            navLink.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`.nav-link[data-page="${targetPage}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // 페이지별 특별한 로직 실행
        switch(targetPage) {
            case 'customer-list':
                // 고객 목록 페이지 진입 시 데이터 새로고침
                if (typeof loadCustomerList === 'function') {
                    loadCustomerList();
                }
                break;
            case 'birthday-alerts':
                // 생일 알림 페이지 진입 시 데이터 새로고침
                if (typeof loadBirthdayAlerts === 'function') {
                    loadBirthdayAlerts();
                }
                break;
            case 'customer-ranking':
                // 고객 등급 페이지 진입 시 데이터 새로고침
                if (typeof loadRankingCounts === 'function') {
                    loadRankingCounts();
                }
                break;
        }
        
    } catch (error) {
        console.error('페이지 전환 오류:', error);
        // 오류 시 기본 페이지로 이동
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('d-none');
        });
        document.getElementById('customer-list').classList.remove('d-none');
        localStorage.setItem('currentPage', 'customer-list');
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 고객 등록 폼 이벤트
    document.getElementById('customer-form').addEventListener('submit', (e) => {
                    e.preventDefault();
        addCustomer();
    });

    // 검색 기능
    document.getElementById('search-btn').addEventListener('click', searchCustomers);
    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchCustomers();
        }
    });
    // 검색창 내용 변경 시 실시간 검색 (빈 검색창일 때 전체 목록 표시)
    document.getElementById('search-input').addEventListener('input', () => {
        searchCustomers();
    });

    // 엑셀 다운로드
    document.getElementById('export-excel-btn').addEventListener('click', exportCustomersToExcel);

    // 엑셀 업로드
    document.getElementById('upload-excel-btn').addEventListener('click', handleExcelUpload);

    // 템플릿 다운로드
    document.getElementById('download-template-btn').addEventListener('click', downloadExcelTemplate);

    // 모바일 고객 등록 버튼 (페이지 상태 저장)
    document.getElementById('mobile-add-customer-btn').addEventListener('click', () => {
        // 현재 페이지 저장 및 고객 등록 페이지로 이동
        localStorage.setItem('currentPage', 'add-customer');
        console.log('📄 모바일 고객등록 클릭: add-customer 페이지 저장');
        
        showPage('add-customer');
    });

    // 엑셀업로드 토글 버튼
    document.getElementById('toggle-excel-upload-btn').addEventListener('click', () => {
        const excelSection = document.getElementById('excel-upload-section');
        const toggleBtn = document.getElementById('toggle-excel-upload-btn');
        
        if (excelSection.classList.contains('d-none')) {
            // 섹션 보이기
            excelSection.classList.remove('d-none');
            toggleBtn.innerHTML = '<i class="bi bi-file-earmark-excel"></i> 엑셀업로드 닫기';
            toggleBtn.classList.remove('btn-outline-info');
            toggleBtn.classList.add('btn-info');
        } else {
            // 섹션 숨기기
            excelSection.classList.add('d-none');
            toggleBtn.innerHTML = '<i class="bi bi-file-earmark-excel"></i> 엑셀업로드';
            toggleBtn.classList.remove('btn-info');
            toggleBtn.classList.add('btn-outline-info');
        }
    });

    // 고객등급 페이지 검색 및 필터 이벤트 리스너
    document.getElementById('ranking-search-btn').addEventListener('click', searchRankingList);
    document.getElementById('ranking-search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchRankingList();
        }
    });
    // 고객등급 페이지 검색창 실시간 검색 (빈 검색창일 때 전체 목록 표시)
    document.getElementById('ranking-search-input').addEventListener('input', () => {
        searchRankingList();
    });
    
    // 등급 필터 변경 시 즉시 검색
    document.getElementById('grade-filter').addEventListener('change', searchRankingList);
    
    // 정렬 옵션 변경 시 즉시 검색
    document.getElementById('sort-option').addEventListener('change', searchRankingList);

    // 기타 이벤트 리스너들...
}

// 고객 추가 함수 (영구저장 보장)
async function addCustomer() {
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const gender = document.getElementById('gender').value;
    const birthDate = document.getElementById('birth-date').value;
    const address = document.getElementById('address').value.trim();
    const mainBranch = document.getElementById('main-branch').value.trim();
    const email = document.getElementById('email').value.trim();
    const memo = document.getElementById('memo').value.trim();

    if (!name || !phone) {
        alert('이름과 전화번호는 필수 입력 항목입니다.');
                        return;
                    }
                    
    // 전화번호 중복 체크
    if (customers.some(customer => customer.phone === phone)) {
        alert('이미 등록된 전화번호입니다.');
                            return;
    }

    const newCustomer = {
        id: Date.now(),
        name,
        phone,
        gender,
        birthDate,
        address,
        mainBranch,
        email,
        memo,
        rank: '일반',
        totalAmount: 0,
        purchaseCount: 0,
        lastVisit: null,
        createdAt: new Date().toISOString()
    };

    // 저장 상태 표시
    if (window.FirebaseData) {
        window.FirebaseData.showSaveStatus('💾 고객 정보 저장 중...', 'info');
    }

    // 임시로 고객 추가
    customers.push(newCustomer);
    
    // 영구저장 시도 및 확인
    const saveSuccess = await saveDataToStorage();
    
    if (!saveSuccess) {
        // 저장 실패 시 고객 제거하고 사용자에게 알림
        customers.pop();
        alert('⚠️ 고객 정보 저장에 실패했습니다.\n\n인터넷 연결을 확인하고 다시 시도해주세요.\n데이터 손실 방지를 위해 등록이 취소되었습니다.');
            return;
        }
        
    // 저장 성공 확인
    console.log(`고객 "${name}" 영구저장 완료 (ID: ${newCustomer.id})`);
    
    // 폼 초기화
    document.getElementById('customer-form').reset();
    
    // 고객 목록 새로고침
    loadCustomerList();
    loadRankingCounts();
    
    alert(`✅ 고객 "${name}"님이 성공적으로 등록되었습니다.\n영구저장이 완료되었습니다.`);
}

// 고객 목록 렌더링 함수 (모바일 스크롤 문제 해결)
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

        // 마지막 항목인지 확인하여 여유 공간 추가
        const isLastItem = index === customerList.length - 1;
        const lastItemClass = isLastItem ? 'last-customer-item' : '';

        tr.innerHTML = `
            <td class="${lastItemClass}">${index + 1}</td>
            <td class="${lastItemClass}">${customer.name}</td>
            <td class="${lastItemClass}">${formatPhoneNumber(customer.phone)}</td>
            <td class="mobile-hide ${lastItemClass}">${formatDate(customer.birthdate)}</td>
            <td class="mobile-hide ${lastItemClass}">${customer.preferredStore || '-'}</td>
            <td class="${lastItemClass}"><span class="badge ${rankBadgeClass}">${rankText}</span></td>
            <td class="mobile-hide ${lastItemClass}">${formatDate(customer.lastVisit)}</td>
        `;
        
        // 행 클릭 이벤트 추가
        tr.style.cursor = 'pointer';
        tr.setAttribute('data-customer-id', customer.id);
        
        // 터치 피드백을 위한 이벤트 리스너들
        tr.addEventListener('touchstart', (e) => {
            tr.classList.add('touch-active');
        });
        
        tr.addEventListener('touchend', (e) => {
            setTimeout(() => {
                tr.classList.remove('touch-active');
            }, 150);
        });
        
        tr.addEventListener('touchcancel', (e) => {
            tr.classList.remove('touch-active');
        });
        
        tr.addEventListener('click', () => {
            // 단순한 터치 피드백 후 페이지 이동
            // 로그인 상태 공유 후 고객 상세 페이지 열기
            localStorage.setItem('mainWindowLoggedIn', 'true');
            window.open(`customer-details.html?id=${customer.id}`, `customer_${customer.id}`, 'width=1200,height=900,scrollbars=yes,resizable=yes');
        });
        
        tbody.appendChild(tr);
    });
}

// 고객 목록 로드 함수
function loadCustomerList() {
    // 검색창 초기화
    document.getElementById('search-input').value = '';
    // 전체 고객 목록 표시
    renderCustomerList(customers);
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
function recalculateCustomerPurchaseInfo(shouldSave = false) {
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
    
    // 변경사항이 있을 때만 저장
    if (shouldSave) {
        saveDataToStorage();
    }
}

// 고객 등급별 카운트 로드 함수
function loadRankingCounts() {
    // 구매 정보 재계산 (저장하지 않음)
    recalculateCustomerPurchaseInfo(false);
    
    const vvipCount = customers.filter(c => c.rank === 'vvip').length;
    const vipCount = customers.filter(c => c.rank === 'vip').length;
    const regularCount = customers.filter(c => c.rank === 'regular').length;
    
    document.getElementById('vvip-count').textContent = vvipCount;
    document.getElementById('vip-count').textContent = vipCount;
    document.getElementById('regular-count').textContent = regularCount;
    
    // 등급 목록 렌더링
    renderRankingList(customers);
}

// 등급 목록 렌더링 함수 (검색 및 필터 적용)
function renderRankingList(customerList, searchTerm = '', gradeFilter = '', sortOption = 'totalAmount-desc') {
    let filteredCustomers = [...customerList];
    
    // 검색 필터 적용
    if (searchTerm) {
        filteredCustomers = filteredCustomers.filter(customer => 
            customer.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    // 등급 필터 적용
    if (gradeFilter) {
        const gradeMap = {
            'VVIP': 'vvip',
            'VIP': 'vip',
            '일반': 'regular'
        };
        filteredCustomers = filteredCustomers.filter(customer => 
            customer.rank === gradeMap[gradeFilter]
        );
    }
    
    // 정렬 적용
    filteredCustomers.sort((a, b) => {
        switch (sortOption) {
            case 'totalAmount-desc':
                const diffDesc = (b.totalPurchase || 0) - (a.totalPurchase || 0);
                // 구매액이 같으면 이름으로 정렬
                return diffDesc !== 0 ? diffDesc : a.name.localeCompare(b.name, 'ko');
                
            case 'totalAmount-asc':
                const diffAsc = (a.totalPurchase || 0) - (b.totalPurchase || 0);
                // 구매액이 같으면 이름으로 정렬
                return diffAsc !== 0 ? diffAsc : a.name.localeCompare(b.name, 'ko');
                
            case 'purchaseCount-desc':
                const countDiffDesc = (b.purchaseCount || 0) - (a.purchaseCount || 0);
                // 구매횟수가 같으면 구매액 높은순으로 정렬
                return countDiffDesc !== 0 ? countDiffDesc : (b.totalPurchase || 0) - (a.totalPurchase || 0);
                
            case 'purchaseCount-asc':
                const countDiffAsc = (a.purchaseCount || 0) - (b.purchaseCount || 0);
                // 구매횟수가 같으면 구매액 낮은순으로 정렬
                return countDiffAsc !== 0 ? countDiffAsc : (a.totalPurchase || 0) - (b.totalPurchase || 0);
                
            case 'name-asc':
                return a.name.localeCompare(b.name, 'ko');
                
            default:
                // 기본: 구매액 높은순
                const defaultDiff = (b.totalPurchase || 0) - (a.totalPurchase || 0);
                return defaultDiff !== 0 ? defaultDiff : a.name.localeCompare(b.name, 'ko');
        }
    });
    
    const tbody = document.getElementById('ranking-list-body');
    tbody.innerHTML = '';
    
    // 결과 건수 표시 업데이트
    updateResultCount(filteredCustomers.length, customerList.length, searchTerm, gradeFilter);
    
    if (filteredCustomers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">검색 결과가 없습니다.</td></tr>';
        return;
    }
    
    filteredCustomers.forEach((customer, index) => {
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

// 등급 관리 검색 함수 (개선됨)
function searchRankingList() {
    const searchTerm = document.getElementById('ranking-search-input').value;
    const gradeFilter = document.getElementById('grade-filter').value;
    const sortOption = document.getElementById('sort-option').value;
    
    // 필터링된 결과로 테이블 렌더링
    renderRankingList(customers, searchTerm, gradeFilter, sortOption);
    
    // 필터링된 결과에 따른 통계 업데이트
    updateFilteredRankingStats(searchTerm, gradeFilter);
}

// 필터링된 결과에 따른 통계 업데이트 함수
function updateFilteredRankingStats(searchTerm, gradeFilter) {
    let filteredCustomers = [...customers];
    
    // 검색 필터 적용
    if (searchTerm) {
        filteredCustomers = filteredCustomers.filter(customer => 
            customer.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    // 등급 필터가 적용된 경우에는 전체 통계를 유지, 아니면 필터링된 통계 표시
    if (!gradeFilter && !searchTerm) {
        // 필터가 없으면 원래 통계 표시
        const vvipCount = customers.filter(c => c.rank === 'vvip').length;
        const vipCount = customers.filter(c => c.rank === 'vip').length;
        const regularCount = customers.filter(c => c.rank === 'regular').length;
        
        document.getElementById('vvip-count').textContent = vvipCount;
        document.getElementById('vip-count').textContent = vipCount;
        document.getElementById('regular-count').textContent = regularCount;
    } else if (searchTerm && !gradeFilter) {
        // 검색만 있는 경우 검색 결과의 등급별 통계 표시
        const vvipCount = filteredCustomers.filter(c => c.rank === 'vvip').length;
        const vipCount = filteredCustomers.filter(c => c.rank === 'vip').length;
        const regularCount = filteredCustomers.filter(c => c.rank === 'regular').length;
        
        document.getElementById('vvip-count').textContent = vvipCount;
        document.getElementById('vip-count').textContent = vipCount;
        document.getElementById('regular-count').textContent = regularCount;
    }
    // 등급 필터가 선택된 경우에는 원래 통계를 유지 (전체 현황 보여주기)
}

// 검색 결과 건수 표시 함수
function updateResultCount(filteredCount, totalCount, searchTerm, gradeFilter) {
    // 결과 표시 영역이 없으면 생성
    let resultCountDiv = document.getElementById('ranking-result-count');
    if (!resultCountDiv) {
        resultCountDiv = document.createElement('div');
        resultCountDiv.id = 'ranking-result-count';
        resultCountDiv.className = 'text-muted mb-2';
        
        // 테이블 위에 삽입
        const tableContainer = document.querySelector('#customer-ranking .table-responsive');
        tableContainer.parentNode.insertBefore(resultCountDiv, tableContainer);
    }
    
    // 결과 메시지 생성
    let message = '';
    if (searchTerm || gradeFilter) {
        const filterText = [];
        if (searchTerm) filterText.push(`"${searchTerm}"`);
        if (gradeFilter) filterText.push(`${gradeFilter} 등급`);
        
        message = `${filterText.join(', ')} 검색 결과: ${filteredCount}명 (전체 ${totalCount}명 중)`;
    } else {
        message = `전체 고객: ${totalCount}명`;
    }
    
    resultCountDiv.innerHTML = `<small><i class="bi bi-info-circle"></i> ${message}</small>`;
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
            // 로그인 상태 공유 후 고객 상세 페이지 열기
        localStorage.setItem('mainWindowLoggedIn', 'true');
        window.open(`customer-details.html?id=${customerId}#gift-tab`, `customer_${customerId}`, 'width=1200,height=900,scrollbars=yes,resizable=yes');
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
            // 로그인 상태 공유 후 고객 상세 페이지 열기
        localStorage.setItem('mainWindowLoggedIn', 'true');
        window.open(`customer-details.html?id=${customerId}#visit-tab`, `customer_${customerId}`, 'width=1200,height=900,scrollbars=yes,resizable=yes');
        });
    });
}

// 고객 상세 정보 새 창으로 열기
function openCustomerDetails(customerId) {
    // 로그인 상태 확인
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        alert('로그인이 필요합니다.');
        return;
    }
    
    // 고객상세페이지와 로그인 상태 공유를 위해 localStorage 업데이트
    localStorage.setItem('mainWindowLoggedIn', 'true');
    
    // 새 창으로 고객 상세 페이지 열기
    window.open(`customer-details.html?id=${customerId}`, `customer_${customerId}`, 'width=1200,height=900,scrollbars=yes,resizable=yes');
    return; // 모달 코드는 실행하지 않음
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
    
    // 모든 탭 푸터 숨기고 기본 정보 탭 푸터만 표시
    document.querySelectorAll('.tab-footer').forEach(footer => {
        footer.classList.add('d-none');
    });
    document.getElementById('info-tab-footer').classList.remove('d-none');
    
    // 첫 번째 탭을 기본 정보로 설정
    document.querySelectorAll('#customerTabs .nav-link').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector('#customerTabs .nav-link[href="#info-tab"]').classList.add('active');
    
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('show', 'active');
    });
    document.getElementById('info-tab').classList.add('show', 'active');
    
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



// 구매 이력 PDF 생성 함수 (고객 상세 페이지에서 사용)
function generatePurchasePDF(customerId) {
    // 고객 상세 페이지로 이동하여 PDF 다운로드
    alert('PDF 다운로드는 고객 상세 페이지에서 이용 가능합니다.\n고객 상세 페이지로 이동합니다.');
    openCustomerDetails(customerId);
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

// 고객 삭제 함수 (영구 삭제 보장)
async function deleteCustomer(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    // 삭제 확인
    if (!confirm(`정말로 ${customer.name} 고객의 정보를 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없으며, 관련된 모든 구매/선물/방문 이력도 함께 삭제됩니다.\n\n영구삭제를 진행하시겠습니까?`)) {
        return;
    }
    
    // 삭제 상태 표시
    if (window.FirebaseData) {
        window.FirebaseData.showSaveStatus('🗑️ 고객 정보 삭제 중...', 'info');
    }
    
    // 삭제할 데이터 백업 (복원용)
    const backupData = {
        customer: { ...customer },
        purchases: purchases.filter(p => p.customerId === customerId).map(p => ({ ...p })),
        gifts: gifts.filter(g => g.customerId === customerId).map(g => ({ ...g })),
        visits: visits.filter(v => v.customerId === customerId).map(v => ({ ...v }))
    };
    
    try {
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
        const customerIndex = customers.findIndex(c => c.id === customerId);
        if (customerIndex !== -1) {
            customers.splice(customerIndex, 1);
        }
        
        // 영구 삭제 시도 및 확인
        const saveSuccess = await saveDataToStorage();
        
        if (!saveSuccess) {
            // 삭제 실패 시 데이터 복원
            console.log('삭제 실패, 데이터 복원 중...');
            
            customers.push(backupData.customer);
            purchases.push(...backupData.purchases);
            gifts.push(...backupData.gifts);
            visits.push(...backupData.visits);
            
            alert('⚠️ 고객 정보 삭제에 실패했습니다.\n\n인터넷 연결을 확인하고 다시 시도해주세요.\n데이터 손실 방지를 위해 삭제가 취소되었습니다.');
            
            // 고객 목록 새로고침 (복원된 데이터로)
            loadCustomerList();
            return;
        }
        
        // 삭제 성공 확인
        console.log(`고객 "${customer.name}" 및 관련 데이터 영구삭제 완료 (ID: ${customerId})`);
        console.log(`삭제된 데이터: 구매 ${backupData.purchases.length}건, 선물 ${backupData.gifts.length}건, 방문 ${backupData.visits.length}건`);
            
            // 고객 목록 새로고침
            loadCustomerList();
        loadRankingCounts();
        
        // 성공 알림
        alert(`✅ "${customer.name}" 고객의 정보가 영구삭제되었습니다.\n\n삭제된 데이터:\n- 구매 이력: ${backupData.purchases.length}건\n- 선물 이력: ${backupData.gifts.length}건\n- 방문 이력: ${backupData.visits.length}건`);
        
    } catch (error) {
        console.error('고객 삭제 중 오류:', error);
        
        // 오류 시 데이터 복원
        customers.length = 0;
        purchases.length = 0;
        gifts.length = 0;
        visits.length = 0;
        
        // 로컬스토리지에서 데이터 복원
        const localCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
        const localPurchases = JSON.parse(localStorage.getItem('purchases') || '[]');
        const localGifts = JSON.parse(localStorage.getItem('gifts') || '[]');
        const localVisits = JSON.parse(localStorage.getItem('visits') || '[]');
        
        customers.push(...localCustomers);
        purchases.push(...localPurchases);
        gifts.push(...localGifts);
        visits.push(...localVisits);
        
        loadCustomerList();
        
        alert('❌ 고객 삭제 중 오류가 발생했습니다.\n데이터가 복원되었습니다.');
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


// 고객 검색 함수
function searchCustomers() {
    const searchTerm = document.getElementById('search-input').value.trim().toLowerCase();
    
    // 검색창이 비어 있으면 전체 고객 목록을 표시
    if (searchTerm === '') {
        renderCustomerList(customers);
        return;
    }
    
    // 검색어로 고객 필터링
    const searchResults = customers.filter(customer => {
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
    
    renderCustomerList(searchResults);
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
    reader.onload = async function(e) {
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
            
            await processExcelDataWithPurchases(customerData, purchaseData);
        } catch (error) {
            alert('엑셀 파일 읽기 중 오류가 발생했습니다: ' + error.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

// 고객정보와 구매이력을 함께 처리하는 함수
async function processExcelDataWithPurchases(customerData, purchaseData) {
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
    
    // 데이터 변경사항이 있을 때만 저장
    if (customerSuccessCount > 0 || purchaseSuccessCount > 0) {
        console.log('💾 엑셀 업로드 데이터 저장 중...');
        await saveDataToStorage();
        loadCustomerList();
        loadRankingCounts();
        console.log('✅ 엑셀 업로드 데이터 저장 완료');
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
async function processExcelData(data) {
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
        await saveDataToStorage();
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

// 간단한 테스트 함수 (개발용)
window.testReset = function() {
    alert('DB 초기화 버튼이 정상적으로 클릭되었습니다!');
    console.log('테스트 함수 호출됨 - 실제 초기화를 원하면 resetDatabase() 함수를 호출하세요');
};

// Firebase 연결 테스트 함수
window.testFirebase = function() {
    if (window.FirebaseData) {
        console.log('Firebase 연결 테스트 시작...');
        
        // 간단한 테스트 데이터로 저장/로드 테스트
        const testData = {
            customers: customers || [],
            purchases: purchases || [],
            gifts: gifts || [],
            visits: visits || [],
            rankChanges: rankChanges || []
        };
        
        window.FirebaseData.saveToFirebase(testData).then(success => {
            if (success) {
                alert('✅ Firebase 연결 테스트 성공!\n데이터가 안전하게 저장되고 있습니다.');
            } else {
                alert('⚠️ Firebase 저장 실패\n인터넷 연결을 확인해주세요.');
            }
        }).catch(error => {
            console.error('Firebase 테스트 오류:', error);
            alert('❌ Firebase 테스트 오류: ' + error.message);
        });
    } else {
        alert('Firebase 시스템을 찾을 수 없습니다.');
    }
};

// DB 초기화 직접 실행 함수 (콘솔에서 테스트용)
window.forceResetDB = function() {
    console.log('🔥 강제 DB 초기화 실행...');
    if (typeof window.resetDatabase === 'function') {
        window.resetDatabase();
    } else {
        console.error('resetDatabase 함수를 찾을 수 없습니다!');
        alert('resetDatabase 함수를 찾을 수 없습니다!');
    }
};

// DB 초기화 함수
// 로그아웃 기능
function logout() {
    // 로그아웃 확인
    if (!confirm('로그아웃 하시겠습니까?\n\n열려있는 모든 고객상세페이지가 닫힙니다.')) {
        return;
    }
    
    console.log('🔐 로그아웃 처리 시작...');
    
    // 1. 모든 로그인 상태 정리
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('mainWindowLoggedIn');
    localStorage.removeItem('currentPage');
    
    // 2. 고객상세페이지들에게 로그아웃 신호 전송
    localStorage.setItem('logoutSignal', Date.now().toString());
    
    // 3. 잠시 후 로그아웃 신호 제거
    setTimeout(() => {
        localStorage.removeItem('logoutSignal');
    }, 1000);
    
    // 4. 페이지 새로고침으로 로그인 화면 표시
    console.log('✅ 로그아웃 완료 - 페이지 새로고침');
    window.location.reload();
}

// 로그아웃 버튼 이벤트 리스너 설정
function setupLogoutListeners() {
    // 사이드바 로그아웃 버튼
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
    
    // 모바일 로그아웃 버튼
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
}

window.resetDatabase = async function resetDatabase() {
    console.log('🔥 DB 초기화 함수 시작됨!');
    
    // 현재 데이터 현황 확인 (안전하게 접근)
    const customerCount = (customers || []).length;
    const purchaseCount = (purchases || []).length;
    const giftCount = (gifts || []).length;
    const visitCount = (visits || []).length;
    
    console.log('현재 데이터 현황:', { customerCount, purchaseCount, giftCount, visitCount });
    
    // 확인 메시지
    const confirmMessage = `⚠️ 데이터베이스 초기화 ⚠️

현재 저장된 데이터:
• 고객 정보: ${customerCount}명
• 구매 이력: ${purchaseCount}건  
• 선물 이력: ${giftCount}건
• 방문 이력: ${visitCount}건

모든 데이터가 영구적으로 삭제됩니다.
이 작업은 되돌릴 수 없습니다.

정말로 초기화하시겠습니까?`;

    // 첫 번째 확인
    if (!confirm(confirmMessage)) {
        return;
    }
    
    // 두 번째 확인 (안전장치)
    const secondConfirm = prompt(`초기화를 진행하려면 '초기화'라고 입력하세요:`);
    if (secondConfirm !== '초기화') {
        alert('초기화가 취소되었습니다.');
        return;
    }
    
    try {
        console.log('DB 초기화 시작...');
        
        // 1. 글로벌 변수 완전 초기화 (여러 방법으로 확실히)
        window.customers = [];
        window.purchases = [];
        window.gifts = [];
        window.visits = [];
        
        // 전역 스코프의 변수들도 초기화
        if (typeof customers !== 'undefined') customers = [];
        if (typeof purchases !== 'undefined') purchases = [];
        if (typeof gifts !== 'undefined') gifts = [];
        if (typeof visits !== 'undefined') visits = [];
        if (typeof rankChanges !== 'undefined') rankChanges = [];
        
        console.log('글로벌 변수 초기화 완료');
        
        // 2. 로컬 스토리지 완전 삭제
        const keysToRemove = [
            'customers', 'purchases', 'gifts', 'visits', 
            'rankHistory', 'rankChanges', 'lastUpdated'
        ];
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log(`${key} 삭제 완료`);
        });
        
        // 3. 빈 배열로 로컬 스토리지에 저장
        const emptyData = {
            customers: [],
            purchases: [],
            gifts: [],
            visits: [],
            rankHistory: [],
            rankChanges: [],
            lastUpdated: Date.now()
        };
        
        Object.entries(emptyData).forEach(([key, value]) => {
            localStorage.setItem(key, JSON.stringify(value));
            console.log(`${key} 빈 데이터로 초기화 완료`);
        });
        
        console.log('로컬 데이터 초기화 완료');
        
        // 4. Firebase에도 빈 데이터 업로드
        if (window.FirebaseData) {
            console.log('Firebase 데이터 초기화 중...');
            try {
                const success = await window.FirebaseData.saveToFirebase(emptyData);
                if (success) {
                    console.log('Firebase 데이터 초기화 완료');
                } else {
                    console.log('Firebase 초기화 실패 - 네트워크 상태 확인 필요');
                }
            } catch (error) {
                console.error('Firebase 초기화 중 오류:', error);
            }
        } else {
            console.log('Firebase가 초기화되지 않음');
        }
        
        // 5. 모든 테이블 UI 즉시 비우기
        const customerTableBody = document.getElementById('customer-list-body');
        if (customerTableBody) {
            customerTableBody.innerHTML = '<tr><td colspan="8" class="text-center">등록된 고객이 없습니다.</td></tr>';
        }
        
        const giftTableBody = document.getElementById('gift-history-body');
        if (giftTableBody) {
            giftTableBody.innerHTML = '<tr><td colspan="7" class="text-center">선물 이력이 없습니다.</td></tr>';
        }
        
        const visitTableBody = document.getElementById('visit-list-body');
        if (visitTableBody) {
            visitTableBody.innerHTML = '<tr><td colspan="7" class="text-center">방문 이력이 없습니다.</td></tr>';
        }
        
        const rankingTableBody = document.getElementById('ranking-list-body');
        if (rankingTableBody) {
            rankingTableBody.innerHTML = '<tr><td colspan="6" class="text-center">등록된 고객이 없습니다.</td></tr>';
        }
        
        // 6. 등급 카운트 초기화
        const vvipCount = document.getElementById('vvip-count');
        const vipCount = document.getElementById('vip-count');
        const regularCount = document.getElementById('regular-count');
        
        if (vvipCount) vvipCount.textContent = '0';
        if (vipCount) vipCount.textContent = '0';
        if (regularCount) regularCount.textContent = '0';
        
        // 7. 생일 알림 초기화
        const thisMonthBirthdays = document.getElementById('this-month-birthdays');
        const nextMonthBirthdays = document.getElementById('next-month-birthdays');
        
        if (thisMonthBirthdays) {
            thisMonthBirthdays.innerHTML = '<li class="list-group-item text-center">이번 달 생일인 고객이 없습니다.</li>';
        }
        if (nextMonthBirthdays) {
            nextMonthBirthdays.innerHTML = '<li class="list-group-item text-center">다음 달 생일인 고객이 없습니다.</li>';
        }
        
        // 8. 데이터 다시 로드하여 메모리와 새로고침
        if (typeof loadDataFromStorage === 'function') {
            loadDataFromStorage();
            console.log('데이터 다시 로드 완료');
        }
        
        // 9. 모든 화면 새로고침
        if (typeof loadCustomerList === 'function') loadCustomerList();
        if (typeof loadBirthdayAlerts === 'function') loadBirthdayAlerts();
        if (typeof loadRankingCounts === 'function') loadRankingCounts();
        if (typeof renderRankingList === 'function') renderRankingList([]);
        
        console.log('화면 새로고침 완료');
        
        // 10. 모바일에서 사이드바 닫기
        if (window.innerWidth < 992 && window.closeSidebar) {
            window.closeSidebar();
        }
        
        // 11. 고객 목록 페이지로 이동
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('d-none');
        });
        const customerListPage = document.getElementById('customer-list');
        if (customerListPage) {
            customerListPage.classList.remove('d-none');
        }
        
        // 12. 활성 메뉴 변경
        document.querySelectorAll('.nav-link').forEach(navLink => {
            navLink.classList.remove('active');
        });
        const customerListLink = document.querySelector('.nav-link[data-page="customer-list"]');
        if (customerListLink) {
            customerListLink.classList.add('active');
        }
        
        console.log('DB 초기화 완료');
        alert('✅ 데이터베이스가 성공적으로 초기화되었습니다.\n모든 고객 정보가 삭제되었습니다.\n\n페이지가 새로고침됩니다.');
        
        // 13. 페이지 새로고침으로 완전 초기화 확인
        setTimeout(() => {
            location.reload();
        }, 1000);
        
    } catch (error) {
        console.error('DB 초기화 중 오류 발생:', error);
        alert('❌ 초기화 중 오류가 발생했습니다. 페이지를 새로고침 후 다시 시도해주세요.');
    }
};
