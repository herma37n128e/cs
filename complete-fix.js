// 아서앤그레이스 고객관리 시스템 - GitHub Pages 완전 통합 버전
console.log('🚀 아서앤그레이스 고객관리 시스템 시작');

// Firebase 클라우드 설정
const FIREBASE_CONFIG = {
    databaseURL: "https://customer-47ac0-default-rtdb.firebaseio.com/",
    projectId: "customer-47ac0",
    apiKey: "AIzaSyBWmNRMRRoo5Fv90ZaMiJzyFhQevWhRUes"
};

// 글로벌 데이터 변수
window.customers = [];
window.purchases = [];
window.gifts = [];
window.visits = [];
window.rankChanges = [];

// 현재 정렬 상태
let currentSort = { field: null, order: 'asc' };

// 로그인 관리
const LoginManager = {
    check: function() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const loginForm = document.getElementById('login-form');
        const mainContent = document.getElementById('main-content');
        
        console.log('로그인 상태:', isLoggedIn);
        
        if (isLoggedIn) {
            if (loginForm) loginForm.style.display = 'none';
            if (mainContent) mainContent.style.display = 'block';
            DataManager.load();
            NavigationManager.init();
            this.showPage('customer-list');
        } else {
            if (loginForm) loginForm.style.display = 'block';
            if (mainContent) mainContent.style.display = 'none';
        }
    },
    
    login: function(password) {
        if (password === 'grace1') {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', 'admin');
            this.check();
            StatusManager.show('success', '로그인 성공!');
            return true;
        } else {
            StatusManager.show('error', '비밀번호가 올바르지 않습니다');
            return false;
        }
    },
    
    logout: function() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        location.reload();
    },
    
    showPage: function(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('d-none');
        });
        
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.remove('d-none');
            
            // 페이지별 초기화
            if (pageId === 'customer-list') {
                CustomerManager.loadList();
            } else if (pageId === 'birthday-alerts') {
                CustomerManager.loadBirthdays();
            }
        }
    }
};

// 데이터 관리
const DataManager = {
    async load() {
        try {
            console.log('📥 데이터 로드 중...');
            const response = await fetch(`${FIREBASE_CONFIG.databaseURL}arthur_grace_customers.json`);
            
            if (response.ok) {
                const data = await response.json();
                if (data) {
                    window.customers = data.customers || [];
                    window.purchases = data.purchases || [];
                    window.gifts = data.gifts || [];
                    window.visits = data.visits || [];
                    window.rankChanges = data.rankChanges || [];
                    
                    console.log('✅ 데이터 로드 성공:', window.customers.length, '명');
                    StatusManager.show('success', '데이터 로드 완료');
                } else {
                    console.log('ℹ️ 새로운 데이터베이스');
                    StatusManager.show('info', '새 데이터베이스 시작');
                }
            }
        } catch (error) {
            console.error('❌ 데이터 로드 실패:', error);
            StatusManager.show('error', '데이터 로드 실패');
        }
    },
    
    async save() {
        try {
            console.log('💾 데이터 저장 중...');
            const data = {
                customers: window.customers,
                purchases: window.purchases,
                gifts: window.gifts,
                visits: window.visits,
                rankChanges: window.rankChanges,
                lastUpdated: new Date().toISOString()
            };
            
            const response = await fetch(`${FIREBASE_CONFIG.databaseURL}arthur_grace_customers.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                console.log('✅ 데이터 저장 성공');
                StatusManager.show('success', '클라우드 저장 완료');
                return true;
            }
        } catch (error) {
            console.error('❌ 데이터 저장 실패:', error);
            StatusManager.show('error', '저장 실패');
        }
        return false;
    }
};

// 네비게이션 관리
const NavigationManager = {
    init: function() {
        document.querySelectorAll('.nav-link[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                LoginManager.showPage(page);
                
                // 활성 메뉴 표시
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
        console.log('✅ 네비게이션 초기화 완료');
    }
};

// 고객 관리
const CustomerManager = {
    loadList: function() {
        const tbody = document.getElementById('customer-list-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        window.customers.forEach((customer, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${customer.name || '-'}</td>
                <td>${this.formatPhone(customer.phone)}</td>
                <td class="mobile-hide">${this.formatDate(customer.birthdate)}</td>
                <td class="mobile-hide">${customer.preferredStore || '-'}</td>
                <td><span class="badge ${this.getRankClass(customer.rank)}">${this.getRankText(customer.rank)}</span></td>
                <td class="mobile-hide">${this.formatDate(customer.lastVisit)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="CustomerManager.viewDetails(${customer.id})">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="CustomerManager.delete(${customer.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        console.log('✅ 고객 목록 렌더링 완료');
    },
    
    async add(customerData) {
        const newCustomer = {
            id: window.customers.length > 0 ? Math.max(...window.customers.map(c => c.id)) + 1 : 1,
            ...customerData,
            rank: 'regular',
            totalPurchase: 0,
            purchaseCount: 0,
            lastVisit: new Date().toISOString().split('T')[0]
        };
        
        window.customers.push(newCustomer);
        await DataManager.save();
        this.loadList();
        StatusManager.show('success', '고객 등록 완료');
    },
    
    async delete(customerId) {
        if (confirm('정말 삭제하시겠습니까?')) {
            window.customers = window.customers.filter(c => c.id !== customerId);
            await DataManager.save();
            this.loadList();
            StatusManager.show('success', '고객 삭제 완료');
        }
    },
    
    loadBirthdays: function() {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
        
        const thisMonth = window.customers.filter(customer => {
            if (!customer.birthdate) return false;
            const birthMonth = parseInt(customer.birthdate.split('-')[1]);
            return birthMonth === currentMonth;
        });
        
        const nextMonthList = window.customers.filter(customer => {
            if (!customer.birthdate) return false;
            const birthMonth = parseInt(customer.birthdate.split('-')[1]);
            return birthMonth === nextMonth;
        });
        
        this.renderBirthdayList('this-month-birthdays', thisMonth, '이번 달');
        this.renderBirthdayList('next-month-birthdays', nextMonthList, '다음 달');
    },
    
    renderBirthdayList: function(elementId, customers, title) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.innerHTML = '';
        
        if (customers.length === 0) {
            element.innerHTML = `<li class="list-group-item">${title} 생일인 고객이 없습니다.</li>`;
        } else {
            customers.forEach(customer => {
                const birthDay = customer.birthdate ? customer.birthdate.split('-')[2] : '?';
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${customer.name}</strong> (${this.getRankText(customer.rank)})
                            <div><small>${this.formatPhone(customer.phone)}</small></div>
                        </div>
                        <div class="birthday-date">${birthDay}일</div>
                    </div>
                `;
                element.appendChild(li);
            });
        }
    },
    
    formatPhone: function(phone) {
        if (!phone) return '-';
        return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    },
    
    formatDate: function(date) {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('ko-KR');
    },
    
    getRankClass: function(rank) {
        switch (rank) {
            case 'vvip': return 'bg-warning text-dark';
            case 'vip': return 'bg-primary';
            default: return 'bg-secondary';
        }
    },
    
    getRankText: function(rank) {
        switch (rank) {
            case 'vvip': return 'VVIP';
            case 'vip': return 'VIP';
            default: return '일반';
        }
    },
    
    viewDetails: function(customerId) {
        // 고객 상세보기 (추후 구현)
        alert('고객 상세 기능은 준비중입니다.');
    }
};

// 상태 표시
const StatusManager = {
    show: function(type, message) {
        let element = document.getElementById('status-display');
        if (!element) {
            element = document.createElement('div');
            element.id = 'status-display';
            element.style.cssText = `
                position: fixed; top: 20px; right: 20px; z-index: 9999;
                padding: 12px 16px; border-radius: 6px; font-size: 14px;
                min-width: 200px; text-align: center; font-weight: 500;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            `;
            document.body.appendChild(element);
        }
        
        const colors = {
            success: { bg: '#28a745', text: 'white', icon: '✅' },
            error: { bg: '#dc3545', text: 'white', icon: '❌' },
            info: { bg: '#17a2b8', text: 'white', icon: 'ℹ️' },
            warning: { bg: '#ffc107', text: 'black', icon: '⚠️' }
        };
        
        const color = colors[type] || colors.info;
        element.style.backgroundColor = color.bg;
        element.style.color = color.text;
        element.innerHTML = `${color.icon} ${message}`;
        element.style.display = 'block';
        
        // 3초 후 자동 숨김
        setTimeout(() => {
            element.style.display = 'none';
        }, 3000);
    }
};

// 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM 로드 완료');
    
    // 로그인 상태 체크
    LoginManager.check();
    
    // 로그인 폼 이벤트
    const loginForm = document.getElementById('login');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const password = document.getElementById('password').value.trim();
            LoginManager.login(password);
        });
    }
    
    // 로그아웃 버튼
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            LoginManager.logout();
        });
    }
    
    // 고객 등록 폼
    const customerForm = document.getElementById('customer-form');
    if (customerForm) {
        customerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const customerData = {
                name: formData.get('name') || document.getElementById('name').value,
                phone: formData.get('phone') || document.getElementById('phone').value,
                gender: formData.get('gender') || document.getElementById('gender').value,
                birthdate: formData.get('birthdate') || document.getElementById('birthdate').value,
                address: formData.get('address') || document.getElementById('address').value,
                preferredStore: formData.get('preferred-store') || document.getElementById('preferred-store').value,
                email: formData.get('email') || document.getElementById('email').value,
                notes: formData.get('notes') || document.getElementById('notes').value
            };
            
            if (!customerData.name || !customerData.phone) {
                StatusManager.show('error', '이름과 전화번호는 필수입니다');
                return;
            }
            
            await CustomerManager.add(customerData);
            this.reset();
            LoginManager.showPage('customer-list');
        });
    }
    
    // 검색 기능
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    if (searchInput && searchBtn) {
        const searchCustomers = () => {
            const term = searchInput.value.toLowerCase();
            if (!term) {
                CustomerManager.loadList();
                return;
            }
            
            const filtered = window.customers.filter(customer => 
                (customer.name && customer.name.toLowerCase().includes(term)) ||
                (customer.phone && customer.phone.includes(term)) ||
                (customer.preferredStore && customer.preferredStore.toLowerCase().includes(term))
            );
            
            const tbody = document.getElementById('customer-list-body');
            if (tbody) {
                tbody.innerHTML = '';
                filtered.forEach((customer, index) => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${index + 1}</td>
                        <td>${customer.name || '-'}</td>
                        <td>${CustomerManager.formatPhone(customer.phone)}</td>
                        <td class="mobile-hide">${CustomerManager.formatDate(customer.birthdate)}</td>
                        <td class="mobile-hide">${customer.preferredStore || '-'}</td>
                        <td><span class="badge ${CustomerManager.getRankClass(customer.rank)}">${CustomerManager.getRankText(customer.rank)}</span></td>
                        <td class="mobile-hide">${CustomerManager.formatDate(customer.lastVisit)}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" onclick="CustomerManager.viewDetails(${customer.id})">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="CustomerManager.delete(${customer.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        };
        
        searchBtn.addEventListener('click', searchCustomers);
        searchInput.addEventListener('input', searchCustomers);
    }
    
    // 모바일 고객 등록 버튼
    const mobileAddBtn = document.getElementById('mobile-add-customer-btn');
    if (mobileAddBtn) {
        mobileAddBtn.addEventListener('click', () => {
            LoginManager.showPage('add-customer');
        });
    }
    
    console.log('✅ 모든 이벤트 리스너 등록 완료');
});

// 글로벌 함수 등록
window.LoginManager = LoginManager;
window.DataManager = DataManager;
window.CustomerManager = CustomerManager;
window.StatusManager = StatusManager;

console.log('✅ 아서앤그레이스 고객관리 시스템 로드 완료!'); 