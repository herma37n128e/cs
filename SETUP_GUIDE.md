# 🚀 클라우드 저장소 설정 가이드

## 1단계: JSONBin에서 Bin 생성

1. [JSONBin.io](https://jsonbin.io/) 접속
2. 로그인 또는 회원가입
3. **"Create Bin"** 버튼 클릭
4. 다음 초기 데이터를 입력:

```json
{
  "customers": [],
  "purchases": [],
  "gifts": [],
  "visits": [],
  "rankHistory": [],
  "lastUpdated": 0,
  "deviceId": "initial"
}
```

5. **"Create"** 클릭
6. 생성된 **Bin ID** 복사 (예: `6855411b8a456b7966b1f04d`)

## 2단계: 파일 수정

### ✅ 이미 설정 완료!
현재 파일들은 다음 설정으로 업데이트되어 있습니다:

- **API 키**: `$2a$10$aXe4NjIJeIjuC1INFQ3t5OmVlMRmnXviDO7jWWi7R9bgiXjOXNX5S`
- **Bin ID**: `6855411b8a456b7966b1f04d`

index.html과 customer-details.html 파일에 이미 적용되어 있으므로 별도 수정이 필요하지 않습니다.

## 3단계: GitHub 업로드

1. GitHub 저장소에 모든 파일 업로드
2. GitHub Pages 설정 (Settings → Pages → main branch)
3. 생성된 URL로 접속하여 테스트

## 4단계: 동기화 테스트

1. PC에서 고객 정보 입력
2. 모바일에서 같은 URL 접속
3. 30초 후 데이터 동기화 확인

## ⚠️ 중요사항

- **API 키 보안**: 공개 저장소에 업로드 시 API 키가 노출됩니다
- **무료 한도**: JSONBin 무료 계정은 월 10,000 요청 제한
- **인터넷 필요**: 오프라인에서는 동기화 불가

## 🔧 문제 해결

### 동기화가 안 될 때
1. 브라우저 개발자 도구 → Console 탭에서 에러 확인
2. Bin ID와 API 키가 정확한지 확인
3. JSONBin 계정 상태 확인

### 데이터가 사라졌을 때
1. JSONBin 대시보드에서 Bin 내용 확인
2. 로컬 스토리지 백업 파일 사용
3. 데이터 백업 기능으로 정기적 백업 권장 