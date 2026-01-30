import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RespondIO } from '@respond-io/typescript-sdk';
import { ENV_KEYS } from '@common/const/env.const';
import { ContactState } from './types/polling.types';

@Injectable()
export class MessagePollingService implements OnModuleInit {
  private readonly logger = new Logger(MessagePollingService.name);
  private readonly client: RespondIO;
  private readonly contactStates = new Map<string, ContactState>();
  private readonly POLLING_ENABLED: boolean;

  constructor(private readonly configService: ConfigService) {
    this.client = new RespondIO({
      apiToken: this.configService.get<string>(ENV_KEYS.RESPOND_IO_API_KEY),
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
        timezone: 'Asia/Seoul',
        filter: {},
      });
      const contacts = contactsResponse.items || [];

      this.logger.log(`Found ${contacts.length} contacts to sync.`);

      // 2. 각 Contact 별 메시지 풀링 (Rate Limit 고려하여 순차 처리)
      for (const contact of contacts) {
        await this.syncContactMessages(String(contact.id));

        // Rate Limiting 방지: 200ms 대기 (초당 5회 이하 유지)
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      this.logger.error('Failed to fetch contact list', error.stack);
    }
  }

  /**
   * 특정 Contact의 메시지를 가져와서 새로운 메시지가 있으면 처리합니다.
   */
  private async syncContactMessages(contactId: string) {
    const contactIdentifier = `id:${contactId}` as `id:${number}`;

    try {
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
    } catch (error) {
      this.logger.error(`Error syncing messages for contact ${contactId}: ${error.message}`);
    }
  }

  private async handleNewMessage(contactId: string, message: any) {
    this.logger.log(`[New Message] Contact: ${contactId}, MsgId: ${message.messageId}, Type: ${message.message?.type}`);
    this.logger.log(`Content: ${JSON.stringify(message.message)}`);
    // TODO: 이벤트 발행 or 비즈니스 로직 호출
  }
}
