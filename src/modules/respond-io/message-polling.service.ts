import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RespondIO, RespondIOError } from '@respond-io/typescript-sdk';
import { ENV_KEYS } from '@common/const/env.const';
import { ContactState } from './types/polling.types';

@Injectable()
export class MessagePollingService implements OnModuleInit {
  private readonly logger = new Logger(MessagePollingService.name);
  private readonly client: RespondIO;
  private readonly contactStates = new Map<string, ContactState>();
  private readonly POLLING_ENABLED: boolean;

  constructor(private readonly configService: ConfigService) {
    const API_TOKEN = this.configService.get<string>(ENV_KEYS.RESPOND_IO_API_KEY);

    this.client = new RespondIO({
      apiToken: API_TOKEN,
      maxRetries: 3,
      timeout: 30000,
    });

    this.POLLING_ENABLED = this.configService.get<string>(ENV_KEYS.POLLING_ENABLED) === 'true';
  }

  onModuleInit() {
    this.logger.log(`Polling Service Initialized. Enabled: ${this.POLLING_ENABLED}`);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    if (!this.POLLING_ENABLED) {
      return;
    }

    this.logger.debug('Starting periodic message polling (Global Sync)...');
    try {
      await this.syncAllContacts();
    } catch (error) {
      this.logger.error('Error during global polling sync', error.stack);
    }
  }

  /**
   * 모든 활성 Contact를 조회하고, 각 Contact의 메시지를 동기화합니다.
   */
  async syncAllContacts() {
    try {
      // 1. 전체 Contact 목록 조회 (페이지네이션 고려하지 않음 - POC)
      // TODO: 실제 운영 시 Cursor 페이지네이션 구현 필요
      const contactsResponse = await this.client.contacts.list({
        search: '',
        filter: {
          $and: [],
        },
        timezone: 'Asia/Seoul',
      });
      const contacts = contactsResponse.items || [];

      this.logger.log(`Found ${contacts.length} contacts to sync.`);

      // 2. 각 Contact 별 메시지 풀링 (Rate Limit 고려하여 배치 병렬 처리)
      const BATCH_SIZE = 20;
      for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
        const contactBatch = contacts.slice(i, i + BATCH_SIZE);

        // 배치 내에서는 병렬로 실행
        await Promise.allSettled(
          contactBatch.map(contact =>
            this.executeWithRetry(() => this.syncContactMessages(String(contact.id)))
          )
        );
      }
    } catch (error) {
      this.logger.error('Failed to fetch contact list', error.stack);
    }
  }

  /**
   * 특정 Contact의 메시지를 가져와서 새로운 메시지가 있으면 처리합니다.
   */
  /**
   * 재시도 로직을 포함한 실행 래퍼 함수
   */
  private async executeWithRetry<T>(operation: () => Promise<T>, retryCount = 0): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof RespondIOError && error.isRateLimitError()) {
        const retryAfterSeconds = error.rateLimitInfo?.retryAfter || 1;
        // 여유 시간을 조금 더 둠 (+ 100ms)
        const waitTime = retryAfterSeconds * 1000 + 100;

        if (retryCount >= 3) {
          this.logger.error(`Max retries reached for contact polling. Abandoning operation.`);
          return null;
        }

        this.logger.warn(`Rate limit exceeded. Waiting ${waitTime}ms before retry... (Attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));

        return this.executeWithRetry(operation, retryCount + 1);
      }

      this.logger.error(`Error executing poller operation: ${error.message}`);
      return null;
    }
  }

  /**
   * 특정 Contact의 메시지를 가져와서 새로운 메시지가 있으면 처리합니다.
   */
  private async syncContactMessages(contactId: string) {
    const contactIdentifier = `id:${contactId}` as `id:${number}`;

    // 최근 메시지 5개 조회
    const response = await this.client.messaging.list(contactIdentifier, {
      limit: 5,
    });

    const messages = response.items || [];
    if (messages.length === 0) return;

    // 상태 확인
    const state = this.contactStates.get(contactId);

    // 최신 메시지 ID 찾기
    const latestMessageId = Math.max(...messages.map(m => m.messageId));

    // 새로운 메시지 필터링
    const newMessages = state
      ? messages.filter(msg => msg.messageId > state.lastMessageId)
      : messages; // 첫 실행 시에는 모든 메시지를 "새로운 것"으로 간주하거나, 필요 시 로직 조정 가능

    // 상태 업데이트
    this.contactStates.set(contactId, {
      ...state,
      lastMessageId: latestMessageId,
      lastPolledAt: new Date(),
      contactInfo: state?.contactInfo || { id: Number(contactId) } as any, // 간소화
    });

    // 새 메시지 처리
    if (newMessages.length > 0) {
      // 첫 실행(메모리에 상태 없음)일 경우, 너무 오래된 메시지는 무시하는 로직이 필요할 수 있음
      // POC에서는 단순히 "메모리에 없으면 다 처리"하거나 "첫 실행은 Skip" 하는 등 정책 결정 필요
      // 여기서는 "메모리에 없으면 -> 가장 최신 1개만 처리 or 전체 처리" 중 선택.
      // 안전하게: state가 없으면 최신 메시지 ID만 기록하고 처리는 스킵(과거 메시지 홍수 방지)
      if (!state) {
        this.logger.log(`First sync for contact ${contactId}. Initializing state with messageId ${latestMessageId}.`);
        return;
      }

      this.logger.log(`Found ${newMessages.length} new message(s) for contact ${contactId}`);
      for (const message of newMessages) {
        await this.handleNewMessage(contactId, message);
      }
    }
  }

  private async handleNewMessage(contactId: string, message: any) {
    this.logger.log(`[New Message] Contact: ${contactId}, MsgId: ${message.messageId}, Type: ${message.message?.type}`);
    this.logger.log(`Content: ${JSON.stringify(message.message)}`);
    // TODO: 이벤트 발행 or 비즈니스 로직 호출
  }
}
