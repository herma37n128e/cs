# 아서앤그레이스 고객관리시스템

아서앤그레이스 브랜드의 고객 정보를 효율적으로 관리할 수 있는 웹 기반 시스템입니다.

## 🌟 주요 기능

- **고객 정보 관리**: 고객 등록, 수정, 삭제
- **구매 이력 추적**: 상세한 구매 기록 관리
- **선물 이력 관리**: 고객별 선물 제공 내역
- **방문 주기 분석**: 고객 방문 패턴 추적
- **등급 시스템**: 총 구매액 기준 자동 등급 분류 (VVIP/VIP/일반)
- **생일 알림**: 이번 달/다음 달 생일 고객 알림
- **엑셀 데이터 처리**: 대량 데이터 업로드/다운로드
- **📱 모바일 최적화**: 반응형 디자인으로 모바일에서도 편리하게 사용
- **☁️ 실시간 클라우드 동기화**: 모든 기기에서 자동으로 데이터 동기화

## 🚀 클라우드 동기화 설정

### 1단계: JSONBin 계정 생성
1. [JSONBin.io](https://jsonbin.io/) 방문
2. 무료 계정 생성 (GitHub/Google 로그인 가능)
3. 대시보드에서 새 Bin 생성

### 2단계: API 키 및 Bin ID 획득
1. JSONBin 대시보드에서 **API Keys** 메뉴로 이동
2. **Create Access Key** 클릭하여 새 API 키 생성
3. 새 Bin을 생성하고 Bin ID 복사

### 3단계: 설정 파일 수정
`index.html`과 `customer-details.html`에서 다음 부분을 수정하세요:

```javascript
// 클라우드 동기화 설정
window.CLOUD_SYNC = {
    enabled: true,
    apiUrl: 'https://api.jsonbin.io/v3/b/YOUR_BIN_ID', // 여기에 실제 Bin ID 입력
    apiKey: '$2a$10$YOUR_API_KEY', // 여기에 실제 API Key 입력
    syncInterval: 30000, // 30초마다 동기화
    lastSyncTime: 0
};
```

### 4단계: 동기화 테스트
1. PC에서 고객 정보 입력
2. 모바일에서 같은 사이트 접속
3. 30초 후 자동으로 데이터 동기화 확인

## 💡 동기화 작동 원리

- **자동 감지**: 다른 기기에서 데이터 변경 시 자동으로 감지
- **충돌 방지**: 타임스탬프 기반으로 최신 데이터 우선 적용
- **기기 구분**: 각 기기에 고유 ID 부여로 무한 루프 방지
- **실시간 업데이트**: 데이터 변경 시 즉시 클라우드에 저장

## 🔧 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5.3
- **Icons**: Bootstrap Icons
- **PDF 생성**: jsPDF
- **Excel 처리**: SheetJS
- **클라우드 동기화**: JSONBin API

## 📱 모바일 최적화

- 터치 친화적 UI (최소 44px 버튼)
- 반응형 레이아웃 (768px 이하 모바일 최적화)
- 모바일 전용 하단 고정 버튼
- 스크롤 가능한 모달창
- 간소화된 폼 레이아웃

## 🎯 등급 시스템

- **VVIP**: 총 구매액 2,000만원 이상
- **VIP**: 총 구매액 1,000만원 이상  
- **일반**: 그 외 모든 고객

등급은 구매 기록 추가/수정/삭제 시 자동으로 업데이트됩니다.

## 🔐 보안

- 패스워드 기반 접근 제어
- 로컬 스토리지 데이터 암호화 (선택사항)
- HTTPS 사용 권장

## 📖 사용법

1. **로그인**: 비밀번호 입력 (기본값: 123, admin, password)
2. **고객 등록**: 개별 등록 또는 엑셀 업로드
3. **데이터 관리**: 구매, 선물, 방문 기록 추가
4. **동기화**: 다른 기기에서 자동으로 데이터 동기화

## 🌐 배포

### GitHub Pages
1. GitHub 저장소에 파일 업로드
2. Settings → Pages → Source를 main branch로 설정
3. 생성된 URL로 접속

### Netlify
1. `netlify.toml` 파일이 포함되어 있음
2. Netlify에 저장소 연결하여 자동 배포

## 🤝 기여

버그 리포트나 기능 제안은 GitHub Issues를 통해 제출해주세요.

## �� 라이선스

MIT License

## 🚀 접속 방법
웹사이트: [https://your-username.github.io/고객관리사이트](https://your-username.github.io/고객관리사이트)

## 🔐 로그인 정보
- **관리자**: admin / admin123
- **매니저**: manager / manager456

## 💾 데이터 저장
- 브라우저 로컬 스토리지 사용
- 각 기기별 독립적인 데이터 관리

## 📱 지원 환경
- PC, 태블릿, 스마트폰 모든 기기 지원
- Chrome, Firefox, Safari, Edge 등 모든 브라우저 지원

## 🛠️ 기술 스택
- HTML5, CSS3, JavaScript
- Bootstrap 5
- Bootstrap Icons
- jsPDF (PDF 생성)

---
© 2024 아서앤그레이스 고객관리시스템 