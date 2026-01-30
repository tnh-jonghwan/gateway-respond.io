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
@NatsHandler({ subject: 'respondio.starfruit' })
@Injectable()
export class MessageController {
  private readonly logger = new Logger(MessageController.name);

  constructor(private readonly respondIoService: RespondIoService) {}

  /**
   * 메시지 전송
   * Subject: respondio.starfruit.req.message.send
   */
  @NatsHandler({
    subject: 'req.message.send',
    payloadSchema: SendMessageDto,
  })
  async sendMessage(dto: SendMessageDto) {
    const result = await this.respondIoService.sendMessage(dto);

    return {
      success: true,
      messageId: result.messageId,
      sentAt: new Date().toISOString(),
    };
  }
}
