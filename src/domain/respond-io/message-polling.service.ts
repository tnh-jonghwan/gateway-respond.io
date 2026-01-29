import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RespondIO } from '@respond-io/typescript-sdk';

interface ContactState {
  lastMessageId: number;
  lastPolledAt: Date;
}

@Injectable()
export class MessagePollingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessagePollingService.name);
  private readonly client: RespondIO;
  private pollingInterval: NodeJS.Timeout | null = null;
  private readonly contactStates = new Map<string, ContactState>();
  
  // 설정
  private readonly POLL_INTERVAL_MS = 5000; // 5초마다 폴링
  private readonly CONTACTS_TO_MONITOR: string[] = []; // 모니터링할 contact IDs

  constructor(private readonly configService: ConfigService) {
    this.client = new RespondIO({
      apiToken: this.configService.get<string>('RESPOND_IO_API_KEY'),
      maxRetries: 3,
      timeout: 30000,
    });

    // 환경 변수에서 모니터링할 contacts 가져오기
    const contactsStr = this.configService.get<string>('POLLING_CONTACTS');
    if (contactsStr) {
      this.CONTACTS_TO_MONITOR = contactsStr.split(',').map(id => id.trim());
    }
  }

  onModuleInit() {
    const pollingEnabled = this.configService.get<string>('POLLING_ENABLED') === 'true';
    
    if (pollingEnabled && this.CONTACTS_TO_MONITOR.length > 0) {
      this.logger.log(`Starting message polling for ${this.CONTACTS_TO_MONITOR.length} contacts`);
      this.startPolling();
    } else {
      this.logger.warn('Message polling is disabled or no contacts configured');
    }
  }

  onModuleDestroy() {
    this.stopPolling();
  }

  private startPolling() {
    this.pollingInterval = setInterval(
      () => this.pollMessages(),
      this.POLL_INTERVAL_MS
    );
    
    // 시작 시 한번 즉시 실행
    this.pollMessages();
  }

  private stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.logger.log('Polling stopped');
    }
  }

  private async pollMessages() {
    for (const contactId of this.CONTACTS_TO_MONITOR) {
      try {
        await this.pollContactMessages(contactId);
      } catch (error) {
        this.logger.error(
          `Failed to poll messages for contact ${contactId}: ${error.message}`,
          error.stack
        );
      }
    }
  }

  private async pollContactMessages(contactId: string) {
    const contactIdentifier = `id:${contactId}` as `id:${number}`;
    
    try {
      // 최근 메시지 조회 (최대 10개)
      const response = await this.client.messaging.list(contactIdentifier, {
        limit: 10,
      });

      const messages = response.items;
      const state = this.contactStates.get(contactId);

      // 새로운 메시지 필터링
      const newMessages = state
        ? messages.filter(msg => msg.messageId > state.lastMessageId)
        : messages;

      if (newMessages.length > 0) {
        this.logger.log(`Found ${newMessages.length} new message(s) for contact ${contactId}`);
        
        // 새 메시지 처리
        for (const message of newMessages) {
          await this.handleNewMessage(contactId, message);
        }

        // 상태 업데이트
        const latestMessageId = Math.max(...messages.map(m => m.messageId));
        this.contactStates.set(contactId, {
          lastMessageId: latestMessageId,
          lastPolledAt: new Date(),
        });
      }
    } catch (error) {
      this.logger.error(`Error polling contact ${contactId}:`, error.message);
      throw error;
    }
  }

  private async handleNewMessage(contactId: string, message: any) {
    this.logger.log(`New message from contact ${contactId}:`, {
      messageId: message.messageId,
      traffic: message.traffic,
      type: message.message?.type,
      timestamp: new Date().toISOString(),
    });

    // 들어오는 메시지만 처리 (outgoing은 우리가 보낸 것)
    if (message.traffic === 'incoming') {
      // TODO: NATS로 발행하거나 다른 처리
      this.logger.log(`Processing incoming message: ${JSON.stringify(message.message)}`);
      
      // 예시: 자동 응답 (테스트용)
      // await this.sendAutoReply(contactId, message);
    }
  }

  // 자동 응답 예시 (테스트용)
  private async sendAutoReply(contactId: string, incomingMessage: any) {
    const contactIdentifier = `id:${contactId}` as `id:${number}`;
    
    try {
      await this.client.messaging.send(contactIdentifier, {
        message: {
          type: 'text',
          text: `메시지 확인했습니다: "${incomingMessage.message?.text}"`,
        },
      });
      
      this.logger.log(`Auto-reply sent to contact ${contactId}`);
    } catch (error) {
      this.logger.error(`Failed to send auto-reply: ${error.message}`);
    }
  }

  // 수동으로 특정 contact 폴링 (테스트용)
  async manualPoll(contactId: string) {
    this.logger.log(`Manual poll triggered for contact ${contactId}`);
    await this.pollContactMessages(contactId);
  }

  // 폴링 상태 조회
  getPollingStatus() {
    return {
      isActive: this.pollingInterval !== null,
      interval: this.POLL_INTERVAL_MS,
      monitoredContacts: this.CONTACTS_TO_MONITOR.length,
      contactStates: Array.from(this.contactStates.entries()).map(([id, state]) => ({
        contactId: id,
        lastMessageId: state.lastMessageId,
        lastPolledAt: state.lastPolledAt,
      })),
    };
  }
}
