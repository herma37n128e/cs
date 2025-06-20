# 🏪 아서앤그레이스 고객관리시스템

> **완전한 온라인 고객관리 솔루션** - PC, 모바일, 태블릿에서 언제 어디서나 접속 가능

[![Deploy Status](https://img.shields.io/badge/deploy-ready-brightgreen)](https://github.com/herma37n128e/cs)
[![Security](https://img.shields.io/badge/security-enhanced-blue)](https://github.com/herma37n128e/cs)
[![Mobile](https://img.shields.io/badge/mobile-responsive-orange)](https://github.com/herma37n128e/cs)

## 🌟 주요 특징

- 🌐 **완전한 온라인 서비스** - 브라우저만 있으면 어디서든 접속
- 📱 **모바일 최적화** - 스마트폰, 태블릿에서 완벽 작동
- 🔒 **보안 강화** - 로컬 우선 + 선택적 클라우드 동기화
- ⚡ **실시간 동기화** - Firebase 연동으로 여러 기기 간 즉시 동기화
- 📊 **완전한 CRM** - 고객정보부터 구매이력까지 통합 관리

## 🚀 빠른 시작

### 온라인 접속 (추천)
1. 웹브라우저에서 배포된 사이트 접속
2. 비밀번호 입력: `grace1`
3. 즉시 사용 시작!

### 로컬 실행
```bash
# 저장소 클론
git clone https://github.com/herma37n128e/cs.git
cd cs

# 패키지 설치
npm install

# 개발 서버 시작
npm start

# 브라우저에서 http://localhost:3000 접속
```

## 📋 핵심 기능

### 👥 고객 관리
- ✅ 고객 정보 등록/수정/삭제
- ✅ 실시간 검색 (이름, 전화번호, 매장, 등급, 메모)
- ✅ 테이블 정렬 (이름, 생년월일, 매장, 등급, 방문일)
- ✅ 고객 등급 자동 관리 (VVIP/VIP/일반)
- ✅ 엑셀 가져오기/내보내기

### 💰 구매 이력 관리
- ✅ 상품별 구매 기록 관리
- ✅ 결제 방법, 담당자, 매장 정보
- ✅ 총 구매액 자동 계산
- ✅ 구매 이력 PDF 출력

### 🎁 선물 관리
- ✅ 고객별 선물 제공 기록
- ✅ 생일선물, 감사선물 등 분류
- ✅ 선물 제공 이유 및 내용 관리

### 📅 방문 관리
- ✅ 고객 방문 이력 추적
- ✅ 방문 주기 자동 계산
- ✅ 다음 방문 예정일 예측

### 🎂 생일 알림
- ✅ 이번 달 생일 고객 목록
- ✅ 다음 달 생일 고객 미리보기
- ✅ 생일 당일 고객 강조 표시

### ☁️ 클라우드 동기화
- ✅ Firebase Realtime Database 연동
- ✅ 여러 기기 간 실시간 동기화
- ✅ 자동 백업 및 복원
- ✅ 오프라인 모드 지원

## 🔐 보안 설정

### 기본 설정 (권장)
- **로컬 전용 모드**: 모든 데이터가 브라우저에만 저장
- **외부 연결 없음**: 완전한 프라이버시 보장
- **패스워드 보호**: `grace1`로 접근 제한

### Firebase 동기화 (선택사항)
```javascript
// 개인 Firebase 프로젝트 설정 필요
Firebase Database URL: https://your-project.firebaseio.com
API Key: your-api-key
```

## 📱 지원 플랫폼

| 플랫폼 | 지원 상태 | 기능 |
|--------|-----------|------|
| 🖥️ **데스크톱** | ✅ 완전 지원 | 모든 기능 |
| 📱 **모바일** | ✅ 완전 지원 | 터치 최적화 |
| 📟 **태블릿** | ✅ 완전 지원 | 반응형 레이아웃 |
| 🌐 **모든 브라우저** | ✅ 호환 | Chrome, Safari, Firefox, Edge |

## 🎯 GitHub Pages 배포

### GitHub Pages 자동 배포
```bash
# GitHub Actions 워크플로우 설정 완료
Branch: main
Directory: /
Auto Deploy: ✅
```

## 📊 시스템 요구사항

- **브라우저**: 모던 웹브라우저 (Chrome 70+, Safari 12+, Firefox 65+)
- **인터넷**: 초기 로딩용 (이후 오프라인 가능)
- **저장공간**: 브라우저 로컬 스토리지 지원
- **해상도**: 320px 이상 (모든 기기 지원)

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5
- **Icons**: Bootstrap Icons
- **Charts**: Chart.js (선택사항)
- **Storage**: LocalStorage + Firebase (선택)
- **Export**: SheetJS (엑셀), jsPDF (PDF)

## 📈 등급 시스템

| 등급 | 조건 | 혜택 |
|------|------|------|
| 🏆 **VVIP** | 총 구매액 2,000만원 이상 | 최고 등급 서비스 |
| 💎 **VIP** | 총 구매액 1,000만원 이상 | 우수 고객 서비스 |
| 👤 **일반** | 기본 등급 | 표준 서비스 |

*등급은 구매액에 따라 자동으로 승급됩니다*

## 📞 로그인 정보

- **비밀번호**: `grace1`
- **사용자명**: 필요 없음 (패스워드만 입력)

## 🔄 업데이트 내역

### v1.0.0 (최신)
- ✅ 온라인 배포 완료
- ✅ 모바일 최적화
- ✅ Firebase 실시간 동기화
- ✅ 보안 강화
- ✅ 테이블 정렬 기능
- ✅ 패스워드 통일 (grace1)

## 🆘 문제 해결

### 로그인 안될 때
- 비밀번호: `grace1` 정확히 입력
- 브라우저 캐시 삭제 후 재시도

### 데이터 안보일 때
- 브라우저 로컬 스토리지 확인
- 다른 브라우저에서 시도

### 동기화 안될 때
- 인터넷 연결 확인
- Firebase 설정 재확인

## 📧 지원

- **GitHub Issues**: [문제 신고](https://github.com/herma37n128e/cs/issues)
- **Documentation**: [배포 가이드](./DEPLOY.md)
- **Setup Guide**: [설정 가이드](./SETUP_GUIDE.md)

---

## 🎉 배포 완료!

**이제 어디서든 온라인으로 고객관리시스템을 사용할 수 있습니다!**

🌐 **웹브라우저에서 바로 접속** → 비밀번호 `grace1` 입력 → **즉시 사용 시작!**

[![Deploy Now](https://img.shields.io/badge/Deploy%20Now-GitHub%20Pages-181717?style=for-the-badge&logo=github)](https://pages.github.com)

*Made with ❤️ for Arthur & Grace* 