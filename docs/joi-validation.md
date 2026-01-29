# respond.io Gateway POC - 환경 변수 검증 추가

## 변경사항

### ✅ Joi Validation 추가

**설치:**
```bash
pnpm add joi
```

**구조:**
```
src/
├── config/
│   └── validation.schema.ts  # Joi 검증 스키마
└── app.module.ts              # ConfigModule에 스키마 적용
```

### 📝 환경 변수 검증

`src/config/validation.schema.ts`:
```typescript
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // respond.io (필수)
  RESPOND_IO_API_KEY: Joi.string().required(),
  
  // Server
  PORT: Joi.number().default(3001),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
});
```

### 🔧 AppModule 설정

```typescript
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env',
  validationSchema,        // ← Joi 스키마 추가
  validationOptions: {
    abortEarly: false,     // 모든 에러를 한번에 표시
  },
})
```

### 🎯 이점

**Before (수동 체크):**
```typescript
constructor(private readonly configService: ConfigService) {
  const apiToken = this.configService.get<string>('RESPOND_IO_API_KEY');
  
  if (!apiToken) {
    this.logger.warn('RESPOND_IO_API_KEY is not configured');  // ⚠️ 경고만 하고 진행
  }
  
  this.client = new RespondIO({ apiToken });  // undefined로 실행될 수 있음
}
```

**After (Joi validation):**
```typescript
constructor(private readonly configService: ConfigService) {
  // Joi validation ensures RESPOND_IO_API_KEY exists
  const apiToken = this.configService.get<string>('RESPOND_IO_API_KEY');
  
  this.client = new RespondIO({ apiToken });  // ✅ 항상 값이 보장됨
}
```

**앱 시작 시 검증:**
```bash
# .env에 RESPOND_IO_API_KEY가 없으면
❌ Error: Config validation error: "RESPOND_IO_API_KEY" is required
⛔ 앱이 시작조차 안됨 (Fail Fast!)
```

### 📋 핵심 개선사항

1. **Fail Fast**: 잘못된 설정으로 앱이 시작되는 것을 방지
2. **명시적 에러**: 어떤 환경 변수가 누락되었는지 정확히 표시
3. **타입 안전성**: ConfigService에서 가져온 값이 항상 존재함을 보장
4. **코드 간결화**: 각 서비스에서 수동 체크 불필요

---

**완료!** 이제 환경 변수 검증이 앱 시작 시 자동으로 이루어집니다. 🎉
