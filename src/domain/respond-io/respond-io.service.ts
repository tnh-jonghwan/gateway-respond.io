import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RespondIO } from '@respond-io/typescript-sdk';
import { toContactIdentifier } from './utils/contact-identifier.util';

@Injectable()
export class RespondIoService {
  private readonly logger = new Logger(RespondIoService.name);
  private readonly client: RespondIO;

  constructor(private readonly configService: ConfigService) {
    this.client = new RespondIO({
      apiToken: this.configService.get<string>('RESPOND_IO_API_KEY'),
      maxRetries: 3, // optional
      timeout: 30000, // optional
    });

    this.logger.log('respond.io SDK initialized');
  }

  async sendMessage(data: { recipientId: string; content: string }) {
    try {
      this.logger.log(`Sending message to ${data.recipientId}`);

      // recipientId를 ContactIdentifier로 변환
      const contactIdentifier = toContactIdentifier(data.recipientId);

      const response = await this.client.messaging.send(contactIdentifier, {
        message: {
          type: 'text',
          text: data.content,
        },
        // channelId: '123', // <- 특정 채널 지정, 지정하지 않으면 가장 최근에 활성화된 채널을 자동 선택
      });

      this.logger.log(`Message sent successfully: ${response.messageId}`);

      return {
        messageId: response.messageId.toString(),
        externalId: response.messageId.toString(),
      };
    } catch (error) {
      this.logger.error(`Failed to send message: ${error.message}`, error.stack);
      
      // SDK provides detailed error messages
      throw new Error(error.message || 'Failed to send message via respond.io');
    }
  }

  async handleWebhook(payload: any) {
    this.logger.log('Webhook received:', JSON.stringify(payload, null, 2));
    
    // POC에서는 단순 로깅
    // 추후 NATS 발행 등 추가 처리
    
    return { status: 'received', timestamp: new Date().toISOString() };
  }
}
