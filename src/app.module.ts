import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { validationSchema } from '@config/validation.schema';
import { RespondIoModule } from '@modules/respond-io/respond-io.module';
import { MessageModule } from '@modules/message/message.module';
import { HealthCheckModule } from '@modules/health-check/health-check.module';

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
    ScheduleModule.forRoot(),
    HealthCheckModule,
    RespondIoModule,
    MessageModule,
  ],
})
export class AppModule { }

