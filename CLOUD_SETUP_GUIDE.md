# 실제 클라우드 서버 설정 가이드

## 🌐 Firebase 클라우드 데이터베이스 설정

### 1단계: Firebase 프로젝트 생성

1. **Firebase 콘솔 접속**: https://console.firebase.google.com/
2. **Google 계정으로 로그인**
3. **"프로젝트 추가" 클릭**
4. **프로젝트 이름**: `arthur-grace-customer-system` (또는 원하는 이름)
5. **Google Analytics 비활성화** (필요에 따라)
6. **프로젝트 생성** 클릭

### 2단계: Realtime Database 설정

1. **왼쪽 메뉴에서 "Realtime Database" 클릭**
2. **"데이터베이스 만들기" 클릭**
3. **보안 규칙**: 
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
   ⚠️ **주의**: 이는 테스트용입니다. 실제 운영시에는 보안 규칙을 더 엄격하게 설정하세요.

### 3단계: 설정 정보 가져오기

1. **프로젝트 설정** (톱니바퀴 아이콘) 클릭
2. **"일반" 탭에서 "앱 추가" → "웹" 선택**
3. **앱 이름**: `아서앤그레이스 고객관리`
4. **Firebase SDK 설정** 복사

### 4단계: 코드에 실제 설정 적용

`firebase-setup.js` 파일에서 다음 부분을 수정하세요:

```javascript
// 실제 Firebase 프로젝트 설정으로 변경
const FIREBASE_CONFIG = {
    // Firebase 콘솔에서 복사한 실제 값들
    databaseURL: "https://YOUR-PROJECT-ID-default-rtdb.firebaseio.com/",
    projectId: "YOUR-PROJECT-ID",
    apiKey: "YOUR-ACTUAL-API-KEY"
};
```

## 🔧 간단한 대안: JSONBin 사용

Firebase가 복잡하다면 더 간단한 클라우드 저장소인 JSONBin을 사용할 수 있습니다:

### JSONBin 설정

1. **JSONBin 접속**: https://jsonbin.io/
2. **무료 계정 가입**
3. **API Key 생성**

### JSONBin용 코드

```javascript
// JSONBin 설정
const JSONBIN_CONFIG = {
    apiKey: "YOUR-JSONBIN-API-KEY",
    binId: "YOUR-BIN-ID" // 첫 저장 후 생성됨
};

// JSONBin에 저장
async function saveToJSONBin(data) {
    const response = await fetch('https://api.jsonbin.io/v3/b', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': JSONBIN_CONFIG.apiKey
        },
        body: JSON.stringify(data)
    });
    
    const result = await response.json();
    return result;
}
```

## 🚀 가장 간단한 방법: GitHub Gist

개발 테스트용으로는 GitHub Gist를 사용할 수도 있습니다:

1. **GitHub 계정 로그인**
2. **새 Gist 생성**: https://gist.github.com/
3. **파일명**: `customer-data.json`
4. **공개 Gist로 생성**
5. **Raw URL 사용하여 데이터 저장/로드**

## 💡 추천사항

**초보자용**: GitHub Gist (무료, 간단)
**중급자용**: JSONBin (무료 한도 있음, 쉬움)
**전문가용**: Firebase (무료 한도 크지만 설정 복잡)

## 📞 도움이 필요하시면

어떤 방법을 선택하시든 설정 과정에서 도움이 필요하시면 언제든 말씀해 주세요! 