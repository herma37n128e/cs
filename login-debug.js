// 로그인 디버깅 스크립트
console.log('=== 로그인 디버깅 시작 ===');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM 로드 완료');
    
    // 요소들 찾기
    const loginForm = document.getElementById('login');
    const passwordInput = document.getElementById('password');
    const loginFormContainer = document.getElementById('login-form');
    
    console.log('요소 확인:');
    console.log('- loginForm:', loginForm);
    console.log('- passwordInput:', passwordInput);
    console.log('- loginFormContainer:', loginFormContainer);
    
    if (!loginForm) {
        console.error('❌ 로그인 폼을 찾을 수 없습니다!');
        return;
    }
    
    if (!passwordInput) {
        console.error('❌ 비밀번호 입력 필드를 찾을 수 없습니다!');
        return;
    }
    
    console.log('✅ 모든 요소를 성공적으로 찾았습니다!');
    
    // 기존 이벤트 리스너 제거
    const newLoginForm = loginForm.cloneNode(true);
    loginForm.parentNode.replaceChild(newLoginForm, loginForm);
    
    // 새로운 이벤트 리스너 추가
    newLoginForm.addEventListener('submit', function(e) {
        console.log('🚀 로그인 폼 제출됨!');
        e.preventDefault();
        
        const newPasswordInput = document.getElementById('password');
        const password = newPasswordInput.value.trim();
        
        console.log('입력된 비밀번호:', password);
        console.log('비밀번호 길이:', password.length);
        
        if (password === 'grace1') {
            console.log('✅ 비밀번호 맞음! 로그인 진행...');
            
            // 로그인 성공 처리
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', 'admin');
            
            // UI 변경
            const loginFormContainer = document.getElementById('login-form');
            const mainContent = document.getElementById('main-content');
            
            if (loginFormContainer) {
                loginFormContainer.style.display = 'none';
                loginFormContainer.classList.add('d-none');
            }
            
            if (mainContent) {
                mainContent.style.display = 'block';
                mainContent.classList.remove('d-none');
            }
            
            console.log('✅ 로그인 완료!');
            alert('로그인 성공!');
            
        } else {
            console.log('❌ 비밀번호 틀림:', password);
            alert('비밀번호가 올바르지 않습니다. (정답: grace1)');
            newPasswordInput.focus();
        }
    });
    
    console.log('✅ 이벤트 리스너 등록 완료');
    
    // 버튼 직접 클릭 이벤트도 추가
    const submitButton = newLoginForm.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.addEventListener('click', function(e) {
            console.log('🖱️ 로그인 버튼 클릭됨!');
        });
    }
});

console.log('=== 로그인 디버깅 스크립트 로드 완료 ==='); 