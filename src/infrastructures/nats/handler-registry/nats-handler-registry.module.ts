import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { NatsModule } from '../nats.module';
import { NatsMessageHandlerRegistry } from './nats-message-handler.registry';

@Module({
  imports: [DiscoveryModule, NatsModule],
  providers: [NatsMessageHandlerRegistry],
})
export class NatsHandlerRegistryModule {}
