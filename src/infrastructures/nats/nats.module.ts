import { Global, Module } from '@nestjs/common';
import { NatsProvider } from './nats.provider';
import { NatsService } from './nats.service';

@Global()
@Module({
  providers: [NatsProvider, NatsService],
  exports: [NatsProvider, NatsService],
})
export class NatsModule {}
