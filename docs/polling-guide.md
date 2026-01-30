# Polling 방식 POC 가이드

## 📋 개요

Growth 플랜 사용을 위한 Polling 기반 메시지 수신 구현. Webhook 대신 주기적으로 API를 호출하여 새 메시지를 확인합니다.

## ⚙️ 설정

### 1️⃣ 환경 변수 (.env)

``bash
# respond.io API
RESPOND_IO_API_KEY=your_api_key_here

# Polling 활성화
POLLING_ENABLED=true
```

### 2️⃣ 서버 실행

```bash
pnpm run start:dev
```

로그 확인:
```
[MessagePollingService] Starting message polling for 3 contacts
[MessagePollingService] Found 2 new message(s) for contact 123
```

## 🔌 API 엔드포인트

### 폴링 상태 확인
```bash
GET http://localhost:3001/polling/status
```

응답:
```json
{
  "isActive": true,
  "interval": 5000,
  "monitoredContacts": 3,
  "contactStates": [
    {
      "contactId": "123",
      "lastMessageId": 45678,
      "lastPolledAt": "2026-01-29T06:21:00.000Z"
    }
  ]
}
```

### 수동 폴링 트리거
```bash
POST http://localhost:3001/polling/manual/123
```

특정 contact의 메시지를 즉시 조회합니다.

## 🔄 동작 방식

1. **주기적 폴링** (기본 5초 간격)
   ```
   MessagePollingService
     ↓ 5초마다
   respond.io API (messaging.list)
     ↓
   새 메시지 감지
     ↓
   handleNewMessage()
     ↓
   로깅 또는 NATS 발행
   ```

2. **중복 방지**
   - 각 contact의 마지막 메시지 ID 저장
   - 새로운 메시지만 처리

3. **자동 시작/종료**
   - 앱 시작 시 자동 폴링 시작 (`OnModuleInit`)
   - 앱 종료 시 자동 정리 (`OnModuleDestroy`)

## ⚠️ 주의사항

### 장점
- ✅ Growth 플랜으로 사용 가능 ($159/월)
- ✅ Webhook 설정 불필요
- ✅ 구현이 간단함

### 단점
- ❌ 실시간성 떨어짐 (5초 지연)
- ❌ API 요청 횟수 증가 (rate limit 주의)
- ❌ 모든 contact를 모니터링하기 어려움
- ❌ 서버 리소스 사용 증가

## 📊 비용 비교

| 플랜 | 월 비용 | Webhook | Polling | 실시간성 |
|------|---------|---------|---------|----------|
| Growth | $159 | ❌ | ✅ | ~5초 지연 |
| Advanced | $279 | ✅ | ✅ | 즉시 |
| **차이** | **+$120** | | | |

## 🎯 권장사항

### Polling이 적합한 경우:
- Contact 수가 적음 (< 10명)
- 실시간 응답이 덜 중요함
- 예산 제약이 있음

### Webhook(Advanced)가 필요한 경우:
- Contact 수가 많음
- 실시간 응답 필수
- 시스템 확장성 중요

## 🔧 커스터마이징

### 폴링 간격 변경

`message-polling.service.ts`:
```typescript
private readonly POLL_INTERVAL_MS = 10000; // 10초로 변경
```

### 자동 응답 활성화

`handleNewMessage()` 메서드에서 주석 해제:
```typescript
await this.sendAutoReply(contactId, message);
```

### NATS 연동 추가

`handleNewMessage()` 메서드:
```typescript
// NATS publish
await this.natsClient.emit('message.received', {
  contactId,
  message,
});
```


**Polling 브랜치**: 현재 `polling` 브랜치에서 작업 중입니다.
