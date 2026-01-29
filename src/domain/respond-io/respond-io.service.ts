import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RespondIO } from '@respond-io/typescript-sdk';

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

      // Use SDK's messaging client
      // contactId can be phone:+1234, email:user@email.com, or id:123
      const contactIdentifier: `phone:${string}` | `email:${string}` | `id:${number}` = 
        data.recipientId.includes('@') 
          ? `email:${data.recipientId}` as `email:${string}`
          : data.recipientId.startsWith('+') || /^\d+$/.test(data.recipientId)
            ? `phone:${data.recipientId}` as `phone:${string}`
            : `id:${parseInt(data.recipientId)}` as `id:${number}`;

      const response = await this.client.messaging.send(contactIdentifier, {
        message: {
          type: 'text',
          text: data.content,
        },
        // Optional: channelId if you want to specify channel
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
