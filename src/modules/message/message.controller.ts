import { Injectable, Logger } from '@nestjs/common';
import { NatsHandler } from '@infrastructures/nats/handler-registry/nats-handler.decorator';
import { SendMessageDto } from './dto/send-message.dto';
import { RespondIoService } from '@modules/respond-io/respond-io.service';

/**
 * Message Controller - NATS 기반
 * Starfruit -> Gateway -> respond.io
 * 
 * Subject Convention: respondio.starfruit.req.*
 * - Service Provider: respondio
 * - Service Requester: starfruit
 */
@NatsHandler({ subject: 'respondio.pub' })
@Injectable()
export class MessageController {
  private readonly logger = new Logger(MessageController.name);

  constructor(private readonly respondIoService: RespondIoService) { }

  /**
   * 메시지 전송 이벤트 구독 (Pub/Sub)
   * Subject: respondio.pub.message.send
   */
  @NatsHandler({
    subject: 'message.send',
    payloadSchema: SendMessageDto,
  })
  async sendMessage(dto: SendMessageDto) {
    this.logger.log(`Received message send event for recipient: ${dto.recipientId}`);

    // Call API (No return value needed effectively)
    await this.respondIoService.sendMessage(dto);
  }
}
