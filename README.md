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

## SDK API 

1️⃣ Contacts - 고객 관리
```typescript
client.contacts.get('id:123')              // 고객 조회
client.contacts.create('email:user@a.com', { firstName: 'John' }) // 고객 생성
client.contacts.update('id:123', { lastName: 'Doe' })  // 고객 정보 수정
client.contacts.delete('id:123')           // 고객 삭제
client.contacts.createOrUpdate(...)        // 있으면 업데이트, 없으면 생성
client.contacts.merge({ contactIds: [1, 2] }) // 중복 고객 병합
client.contacts.list(filter, pagination)   // 고객 목록 조회 (필터링)
client.contacts.addTags('id:123', ['VIP', 'Premium']) // 태그 추가
client.contacts.deleteTags('id:123', ['OLD']) // 태그 제거
client.contacts.listChannels('id:123')     // 고객의 연결된 채널들 조회
client.contacts.updateLifecycle('id:123', { name: 'lead' }) // 라이프사이클 단계 변경
```

2️⃣ Messaging - 메시지 전송 (현재 사용중)
```typescript
// 텍스트 메시지
client.messaging.send('id:123', {
  message: { type: 'text', text: 'Hello' }
})

// 첨부파일 (이미지, 비디오, 오디오, 파일)
client.messaging.send('id:123', {
  message: { type: 'attachment', attachment: { type: 'image', url: 'https://...' }}
})

// WhatsApp 템플릿 메시지
client.messaging.send('id:123', {
  message: { 
    type: 'whatsapp_template',
    template: { name: 'welcome_msg', languageCode: 'en' }
  }
})

// 이메일
client.messaging.send('email:user@a.com', {
  message: { 
    type: 'email', 
    text: 'Body', 
    subject: 'Subject',
    attachments: [...]
  }
})

client.messaging.get('id:123', messageId) // 메시지 조회
client.messaging.list('id:123')           // 고객의 메시지 히스토리
```

3️⃣ Comments - 내부 코멘트
```typescript
client.comments.create('id:123', {
  text: '@홍길동 이 고객 VIP 처리 부탁드립니다'
})
```

4️⃣ Conversations - 대화 관리
```typescript
// 상담원 배정
client.conversations.assign('id:123', {
  assignee: 'user@company.com'  // 또는 userId
})

// 배정 해제
client.conversations.assign('id:123', {
  assignee: null
})

// 대화 종료
client.conversations.updateStatus('id:123', {
  status: 'close',
  category: 'Resolved',
  summary: '문의 해결 완료'
})

// 대화 다시 열기
client.conversations.updateStatus('id:123', {
  status: 'open'
})
```

5️⃣ Space (Workspace) - 워크스페이스 설정
```typescript
// 팀원 관리
client.space.listUsers()           // 팀원 목록
client.space.getUser(userId)       // 특정 팀원 조회

// 커스텀 필드 관리
client.space.createCustomField({
  name: 'Membership Tier',
  dataType: 'list',
  allowedValues: ['Bronze', 'Silver', 'Gold']
})
client.space.listCustomFields()    // 커스텀 필드 목록

// 채널 관리
client.space.listChannels()        // WhatsApp, LINE 등 연결된 채널들

// WhatsApp 템플릿 조회
client.space.listTemplates(channelId)

// 태그 관리
client.space.createTag({ name: 'VIP', colorCode: '#FF0000' })
client.space.updateTag({ currentName: 'VIP', emoji: '⭐' })
client.space.deleteTag({ name: 'OLD' })

// 종료 노트 카테고리 조회
client.space.listClosingNotes()
```