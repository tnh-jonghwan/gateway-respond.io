import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from '@config/validation.schema';
import { RespondIoModule } from '@domain/respond-io/respond-io.module';
import { MessageModule } from '@domain/message/message.module';
import { HealthCheckModule } from '@domain/health-check/health-check.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema,
      validationOptions: {
        abortEarly: false, // 모든 에러를 한번에 표시
      },
    }),
    HealthCheckModule,
    RespondIoModule,
    MessageModule,
  ],
})
export class AppModule {}

