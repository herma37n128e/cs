// 로컬 스토리지에서 데이터 로드
let customers = [];
let purchases = [];
let gifts = [];
let visits = [];

function loadDataFromStorage() {
    const storedCustomers = localStorage.getItem('customers');
    const storedPurchases = localStorage.getItem('purchases');
    const storedGifts = localStorage.getItem('gifts');
    const storedVisits = localStorage.getItem('visits');
    
    if (storedCustomers) customers = JSON.parse(storedCustomers);
    if (storedPurchases) purchases = JSON.parse(storedPurchases);
    if (storedGifts) gifts = JSON.parse(storedGifts);
    if (storedVisits) visits = JSON.parse(storedVisits);
}

// 로컬 스토리지에 데이터 저장
// 데이터 저장 함수 (Firebase 영구저장)
async function saveDataToStorage() {
    try {
        // 로컬스토리지에 즉시 저장
        localStorage.setItem('customers', JSON.stringify(customers));
        localStorage.setItem('purchases', JSON.stringify(purchases));
        localStorage.setItem('gifts', JSON.stringify(gifts));
        localStorage.setItem('visits', JSON.stringify(visits));
        localStorage.setItem('lastUpdated', Date.now().toString());
        
        // Firebase에 영구저장
        if (window.FirebaseData && window.opener && window.opener.FirebaseData) {
            const saveData = {
                customers: customers || [],
                purchases: purchases || [],
                gifts: gifts || [],
                visits: visits || [],
                rankChanges: JSON.parse(localStorage.getItem('rankChanges') || '[]')
            };
            
            const success = await window.opener.FirebaseData.saveToFirebase(saveData);
            if (success) {
                console.log('고객 상세 페이지에서 Firebase 저장 성공');
            }
        }
        
        return true;
    } catch (error) {
        console.error('데이터 저장 오류:', error);
        return false;
    }
}

// URL 파라미터에서 고객 ID 가져오기
function getCustomerIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return parseInt(urlParams.get('id'));
}

// DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded', () => {
    // 로컬 스토리지에서 데이터 로드
    loadDataFromStorage();
    
    // URL에서 고객 ID 가져오기
    const customerId = getCustomerIdFromUrl();
    
    // 고객 ID가 없으면 메인 페이지로 이동
    if (!customerId) {
        window.location.href = 'index.html';
        return;
    }
    
    // 고객 정보 로드
    loadCustomerDetails(customerId);
    
    // 돌아가기 버튼 이벤트 리스너
    document.getElementById('back-btn').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    // 창 닫기 버튼 이벤트 리스너
    document.getElementById('close-btn').addEventListener('click', () => {
        window.close();
    });
    
    // 탭 이벤트 리스너
    document.querySelectorAll('#customerTabs .nav-link').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            
                    if (tab.getAttribute('href') === '#purchase-tab') {
            loadCustomerPurchases(customerId);
        }
        });
    });
    
    // 편집 버튼 이벤트 리스너
    document.getElementById('edit-customer-btn').addEventListener('click', () => {
        editCustomerInfo(customerId);
    });
    
    // 삭제 버튼 이벤트 리스너
    document.getElementById('delete-customer-btn').addEventListener('click', () => {
        deleteCustomer(customerId);
    });
    
    // 모바일 기기에서 하단 패딩 추가
    document.body.classList.add('has-mobile-buttons');
    
    // 모든 고객의 등급을 새로운 기준으로 업데이트
    updateAllCustomerRanks();
    
    // 모바일 구매 추가 버튼 이벤트 리스너
    document.getElementById('mobile-add-purchase-btn').addEventListener('click', () => {
        document.getElementById('add-purchase-btn').click();
    });
    

    
    // 구매 기록 추가 버튼 이벤트 리스너
    document.getElementById('add-purchase-btn').addEventListener('click', () => {
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
        
        // 새 구매 기록 생성
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
        
        // 구매 기록 추가
        purchases.push(newPurchase);
        
        // 고객 정보 업데이트 (총 구매액, 구매 횟수)
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
        const modal = bootstrap.Modal.getInstance(document.getElementById('add-purchase-modal'));
        modal.hide();
        
        // 구매 이력 다시 로드
        loadCustomerPurchases(customerId);
        
        // 알림 표시
        alert('구매 기록이 추가되었습니다.');
    });
    

    
    // 구매 PDF 다운로드 버튼 이벤트 리스너
    document.getElementById('download-purchase-pdf').addEventListener('click', () => {
        generatePurchasePDF(customerId);
    });
});

// 고객 정보 로드 함수
function loadCustomerDetails(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
        alert('고객 정보를 찾을 수 없습니다.');
        window.location.href = 'index.html';
        return;
    }
    
    // 페이지 제목 업데이트
    document.title = `${customer.name} - 고객 상세 정보`;
    
    // 기본 정보 탭 내용 설정
    const infoContent = document.getElementById('customer-info-content');
    
    // 한글 등급 변환
    let rankText = '';
    if (customer.rank === 'vvip') rankText = 'VVIP';
    else if (customer.rank === 'vip') rankText = 'VIP';
    else rankText = '일반';
    
    // 성별 한글 변환
    let genderText = '-';
    if (customer.gender === 'male') genderText = '남성';
    else if (customer.gender === 'female') genderText = '여성';
    
    infoContent.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <p><strong>이름:</strong> ${customer.name}</p>
                <p><strong>성별:</strong> ${genderText}</p>
                <p><strong>전화번호:</strong> ${customer.phone}</p>
                <p><strong>생년월일:</strong> ${formatDate(customer.birthdate)}</p>
                <p><strong>주소:</strong> ${customer.address || '-'}</p>
            </div>
            <div class="col-md-6">
                <p><strong>주방문매장:</strong> ${customer.preferredStore || '-'}</p>
                <p><strong>이메일:</strong> ${customer.email || '-'}</p>
                <p><strong>등급:</strong> ${rankText}</p>
                <p><strong>총 구매액:</strong> ${formatCurrency(customer.totalPurchase)}</p>
                <p><strong>구매 횟수:</strong> ${customer.purchaseCount}회</p>
                <p><strong>최근 방문일:</strong> ${formatDate(customer.lastVisit)}</p>
            </div>
        </div>
        <div class="row">
            <div class="col-12">
                <p><strong>메모:</strong></p>
                <p>${customer.notes || '메모 없음'}</p>
            </div>
        </div>
    `;
    
    // 구매 이력 미리 로드
    loadCustomerPurchases(customerId);
}

// 고객별 구매 이력 로드 함수
function loadCustomerPurchases(customerId) {
    const customerPurchases = purchases.filter(p => p.customerId === customerId);
    const purchaseContent = document.getElementById('purchase-history-content');
    
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



// 고객 정보 편집 함수
function editCustomerInfo(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
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
        
        // 고객 정보 다시 로드
        loadCustomerDetails(editedCustomer.id);
        
        // 알림 표시
        alert('고객 정보가 수정되었습니다.');
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

// 고객 등급 자동 업데이트 함수
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
            
            // 메인 페이지로 이동
            alert('고객 정보가 삭제되었습니다.');
            window.location.href = 'index.html';
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
                        <div id="edit-purchase-items">
                            ${purchase.items.map((item, index) => `
                                <div class="purchase-item mb-3">
                                    <div class="row">
                                        <div class="col-md-7">
                                            <label class="form-label">상품명</label>
                                            <input type="text" class="form-control item-name" value="${item.name}" required>
                                        </div>
                                        <div class="col-md-5">
                                            <label class="form-label">가격</label>
                                            <input type="number" class="form-control item-price" value="${item.price}" required>
                                        </div>
                                    </div>
                                    ${index > 0 ? `<button type="button" class="btn btn-sm btn-outline-danger mt-2 remove-item-btn">- 삭제</button>` : ''}
                                </div>
                            `).join('')}
                        </div>
                        <div class="mb-3">
                            <button type="button" class="btn btn-sm btn-outline-secondary" id="edit-add-item-btn">+ 상품 추가</button>
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
            <div class="row">
                <div class="col-md-7">
                    <label class="form-label">상품명</label>
                    <input type="text" class="form-control item-name" required>
                </div>
                <div class="col-md-5">
                    <label class="form-label">가격</label>
                    <input type="number" class="form-control item-price" required>
                </div>
            </div>
            <button type="button" class="btn btn-sm btn-outline-danger mt-2 remove-item-btn">- 삭제</button>
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
            loadCustomerDetails(customerId);
            
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
            loadCustomerDetails(customerId);
            
            // 알림 표시
            alert('구매 기록이 삭제되었습니다.');
        }
    }
}

 