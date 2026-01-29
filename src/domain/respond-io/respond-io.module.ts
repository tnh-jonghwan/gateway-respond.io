import { Module } from '@nestjs/common';
import { RespondIoService } from './respond-io.service';
import { RespondIoController } from './respond-io.controller';

@Module({
  providers: [RespondIoService],
  controllers: [RespondIoController],
  exports: [RespondIoService],
})
export class RespondIoModule {}
