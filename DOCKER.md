# Docker Compose로 respond.io Gateway 실행하기

## 사전 준비

1. **Docker 및 Docker Compose 설치 확인**
   ```bash
   docker --version
   docker-compose --version
   ```

---

## 실행 방법

### 1. 모든 서비스 시작 (NATS + Gateway)

```bash
docker-compose up -d
```

**실행되는 서비스**:
- `nats`: NATS 서버 (포트 4222)
- `gateway`: respond.io Gateway (포트 3001)

### 2. 로그 확인

```bash
# 모든 서비스 로그
docker-compose logs -f

# Gateway만
docker-compose logs -f gateway

# NATS만
docker-compose logs -f nats
```

### 3. 상태 확인

```bash
# 컨테이너 상태
docker-compose ps

# Gateway 헬스체크
curl http://localhost:3001/HealthCheck

# NATS 모니터링
curl http://localhost:8222/varz
```

### 4. 서비스 중지

```bash
# 정지 (컨테이너 유지)
docker-compose stop

# 정지 및 삭제
docker-compose down

# 볼륨까지 삭제
docker-compose down -v
```

---

## 개발 모드

로컬 개발 시 코드 변경을 실시간 반영하려면:

```bash
# Gateway만 로컬에서 실행, NATS는 Docker로
docker-compose up -d nats

# 로컬에서 Gateway 실행
pnpm start:dev
```

**.env 설정**:
```env
NATS_ENABLED=true
NATS_URL=nats://localhost:4222
```

---

## Production 배포

### 1. 이미지 빌드

```bash
docker-compose build
```

### 2. 환경 변수 설정 (.env)

```env
NODE_ENV=production
NATS_ENABLED=true
NATS_AUTH_URL=https://your-nats-auth-server
NATS_ACCESS_KEY=your_access_key
NATS_SECRET_KEY=your_secret_key
```

### 3. 배포

```bash
docker-compose up -d
```

---

## NATS CLI 사용

### 설치

```bash
# Mac
brew install nats-io/nats-tools/nats

# Linux
curl -sf https://binaries.nats.dev/nats-io/natscli/nats@latest | sh
```

### 테스트

```bash
# Request/Reply 테스트
nats req respondio.message.send '{"contactId":"123","text":"Hello"}'

# Pub/Sub 구독
nats sub "respondio.>"

# 서버 정보
nats server info
```

---

## 트러블슈팅

### NATS 연결 실패

```bash
# NATS 컨테이너 로그 확인
docker-compose logs nats

# NATS 컨테이너 재시작
docker-compose restart nats
```

### Gateway 시작 실패

```bash
# Gateway 로그 확인
docker-compose logs gateway

# 환경 변수 확인
docker-compose exec gateway env | grep NATS
```

### 포트 충돌

```bash
# 사용 중인 포트 확인
lsof -i :3001
lsof -i :4222

# docker-compose.yml에서 포트 변경
ports:
  - "3002:3001"  # 호스트:컨테이너
```

---

## 네트워크 구성

```
┌─────────────────────────────────────┐
│  Docker Network: respondio-network  │
│                                     │
│  ┌──────────┐      ┌──────────┐    │
│  │   NATS   │◄────►│ Gateway  │    │
│  │  :4222   │      │  :3001   │    │
│  └──────────┘      └──────────┘    │
│       ↑                  ↑          │
└───────┼──────────────────┼──────────┘
        │                  │
    :4222 (외부)      :3001 (외부)
```

---

## 유용한 명령어

```bash
# Gateway 셸 접속
docker-compose exec gateway sh

# NATS 컨테이너에서 nats CLI 사용
docker-compose exec nats sh
nats pub test "Hello World"

# 이미지 재빌드
docker-compose build --no-cache

# 리소스 정리
docker system prune -a
```
