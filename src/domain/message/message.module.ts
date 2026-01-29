import { Module } from '@nestjs/common';
import { MessageController } from './message.controller';
import { RespondIoModule } from '@domain/respond-io/respond-io.module';

@Module({
  imports: [RespondIoModule],
  controllers: [MessageController],
})
export class MessageModule {}
