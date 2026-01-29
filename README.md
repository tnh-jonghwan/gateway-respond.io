# respond.io Gateway POC

NestJS 기반 respond.io API 연동 게이트웨이 서비스

## 📋 Features

- ✅ respond.io 공식 TypeScript SDK 사용
- ✅ 메시지 전송 API
- ✅ Webhook 수신 엔드포인트
- ✅ 환경 변수 기반 설정
- ✅ DTO 검증
- ✅ 자동 재시도 및 Rate Limiting (SDK 내장)

## 🚀 Quick Start

### 1. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어서 실제 값으로 수정:

```bash
RESPOND_IO_API_KEY=your_actual_api_key
RESPOND_IO_CHANNEL_ID=your_channel_id
PORT=3001
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run start:dev
```

서버가 `http://localhost:3000`에서 실행됩니다.

## 🔧 API 사용법

### 메시지 전송

```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "contact_123",
    "content": "Hello from gateway!"
  }'
```

**성공 응답:**
```json
{
  "success": true,
  "messageId": "msg_abc123",
  "sentAt": "2026-01-29T12:00:00Z"
}
```

**실패 응답:**
```json
{
  "success": false,
  "error": "Invalid recipient ID"
}
```

### Webhook 수신

respond.io에서 webhook URL을 다음과 같이 설정하세요:

```
POST http://your-server.com/webhook/respond-io
```

## 📁 프로젝트 구조

```
src/
├── main.ts                      # 애플리케이션 진입점
├── app.module.ts                # 루트 모듈
├── message/
│   ├── message.module.ts        # 메시지 모듈
│   ├── message.controller.ts    # 메시지 전송 API
│   └── dto/
│       └── send-message.dto.ts  # 요청 검증 DTO
└── respond-io/
    ├── respond-io.module.ts     # respond.io 모듈
    ├── respond-io.service.ts    # respond.io API 연동
    └── respond-io.controller.ts # Webhook 핸들러
```

## 📦 주요 의존성

**Production:**
- @nestjs/common, @nestjs/core, @nestjs/platform-express
- @nestjs/config - 환경 변수 관리
- **@respond-io/typescript-sdk** - 공식 respond.io SDK (타입 안전성, 자동 재시도, Rate Limiting)
- class-validator, class-transformer - DTO 검증

## 🔜 다음 단계 (POC 이후)

- [ ] NATS 통합 (starfruit과 이벤트 기반 통신)
- [ ] 재시도 로직 (Bull Queue)
- [ ] 메트릭 및 로깅
- [ ] 헬스체크 엔드포인트
- [ ] 에러 핸들링 개선

## 📝 Notes

- 현재 버전은 POC로 respond.io API 연동만 구현되어 있습니다
- `respond-io.service.ts`의 API 엔드포인트는 실제 respond.io 문서에 맞게 수정이 필요할 수 있습니다
- 프로덕션 환경에서는 적절한 에러 핸들링과 로깅을 추가하세요
