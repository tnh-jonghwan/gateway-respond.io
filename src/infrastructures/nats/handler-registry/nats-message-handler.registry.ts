import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import {
  HandlerOptions,
  NATS_HANDLER_METADATA,
} from './nats-handler.decorator';
import { NatsService } from '../nats.service';

@Injectable()
export class NatsMessageHandlerRegistry implements OnModuleInit {
  private readonly logger = new Logger(NatsMessageHandlerRegistry.name);

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
    private readonly natsService: NatsService,
  ) {}

  onModuleInit() {
    this.logger.log('Scanning for NATS handlers...');

    const controllers = this.discoveryService.getControllers();
    const providers = this.discoveryService.getProviders();

    // Scan controllers
    controllers.forEach((wrapper: InstanceWrapper) => {
      const { instance } = wrapper;
      if (!instance) {
        return;
      }
      this.registerHandlers(instance);
    });

    // Scan providers  
    providers.forEach((wrapper: InstanceWrapper) => {
      const { instance } = wrapper;
      if (!instance) {
        return;
      }

      // Check if this provider has NATS handler metadata
      const classMetadata = this.reflector.get(
        NATS_HANDLER_METADATA,
        instance.constructor,
      );

      if (classMetadata) {
        this.registerHandlers(instance);
      }
    });

    this.logger.log('NATS handler registration complete');
  }

  private registerHandlers(instance: any) {
    const prototype = Object.getPrototypeOf(instance);

    // 클래스 레벨 메타데이터 (subject prefix)
    const classMetadata = this.reflector.get<HandlerOptions>(
      NATS_HANDLER_METADATA,
      instance.constructor,
    );
    const classSubjectPrefix = classMetadata?.subject || '';

    // 메서드 스캔
    this.metadataScanner.scanFromPrototype(
      instance,
      prototype,
      (methodName: string) => {
        const methodMetadata = this.reflector.get<HandlerOptions>(
          NATS_HANDLER_METADATA,
          prototype[methodName],
        );

        if (!methodMetadata) {
          return;
        }

        // Subject 조합 (클래스 prefix + 메서드 subject)
        const fullSubject = classSubjectPrefix
          ? `${classSubjectPrefix}.${methodMetadata.subject}`
          : methodMetadata.subject;

        // NATS 구독 등록
        this.natsService.subscribeAndReply(fullSubject, {
          handler: prototype[methodName].bind(instance),
          payloadSchema: methodMetadata.payloadSchema,
        });
      },
    );
  }
}
