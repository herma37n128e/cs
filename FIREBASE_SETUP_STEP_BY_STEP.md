# 🔥 Firebase 클라우드 서버 설정 - 단계별 가이드

## 1단계: Firebase 프로젝트 생성

### 1-1. Firebase 콘솔 접속
1. 웹브라우저에서 **https://console.firebase.google.com/** 접속
2. **Google 계정으로 로그인** (Gmail 계정 사용)

### 1-2. 새 프로젝트 만들기
1. **"프로젝트 추가"** 버튼 클릭
2. **프로젝트 이름**: `arthur-grace-customers` 입력
3. **계속** 버튼 클릭
4. **Google Analytics 사용 설정**: 체크 해제 (불필요)
5. **프로젝트 만들기** 클릭
6. 프로젝트 생성 완료까지 기다리기 (1-2분)

## 2단계: Realtime Database 설정

### 2-1. 데이터베이스 만들기
1. 왼쪽 메뉴에서 **"Realtime Database"** 클릭
2. **"데이터베이스 만들기"** 버튼 클릭
3. **데이터베이스 위치**: `asia-southeast1 (Singapore)` 선택 (한국과 가까움)
4. **보안 규칙**: **"테스트 모드에서 시작"** 선택
5. **사용 설정** 클릭

### 2-2. 보안 규칙 설정 (임시)
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
⚠️ **주의**: 이는 테스트용입니다. 나중에 더 안전하게 변경하겠습니다.

## 3단계: 웹 앱 설정

### 3-1. 웹 앱 추가
1. 프로젝트 홈에서 **"웹 앱 추가"** 버튼 클릭 (</> 아이콘)
2. **앱 이름**: `아서앤그레이스-고객관리` 입력
3. **Firebase 호스팅 설정**: 체크 해제
4. **앱 등록** 클릭

### 3-2. 설정 정보 복사
다음과 같은 정보가 나타납니다:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "arthur-grace-customers.firebaseapp.com",
  databaseURL: "https://arthur-grace-customers-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "arthur-grace-customers",
  storageBucket: "arthur-grace-customers.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

**❗ 중요**: 이 정보를 복사해서 보관하세요!

## 4단계: 코드에 실제 설정 적용

이제 복사한 정보를 사용해서 코드를 수정하겠습니다.

### 완료 후 알려주세요!
위의 1-3단계를 완료하고 Firebase 설정 정보를 얻으시면, 저에게 알려주세요. 
그러면 실제 코드에 적용해드리겠습니다!

## 💡 도움말
- Firebase는 Google 계정만 있으면 무료로 사용 가능
- 무료 한도: 일일 연결 100개, 월 1GB 데이터
- 고객관리 용도로는 충분한 용량입니다 