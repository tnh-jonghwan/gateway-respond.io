import { Module } from '@nestjs/common';
import { MessageController } from './message.controller';
import { RespondIoModule } from '@modules/respond-io/respond-io.module';

@Module({
  imports: [RespondIoModule],
  providers: [MessageController],
})
export class MessageModule {}
