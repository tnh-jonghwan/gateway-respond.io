import { Module } from '@nestjs/common';
import { RespondIoService } from './respond-io.service';
import { RespondIoController } from './respond-io.controller';
import { MessagePollingService } from './message-polling.service';
import { PollingController } from './polling.controller';

@Module({
  providers: [RespondIoService, MessagePollingService],
  controllers: [RespondIoController, PollingController],
  exports: [RespondIoService, MessagePollingService],
})
export class RespondIoModule {}
