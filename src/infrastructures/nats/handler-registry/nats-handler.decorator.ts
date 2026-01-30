import { SetMetadata } from '@nestjs/common';

export const NATS_HANDLER_METADATA = 'NATS_HANDLER';

export interface HandlerOptions {
  subject: string;
  payloadSchema?: new () => any;
}

/**
 * NATS 메시지 핸들러 데코레이터
 * 
 * @example
 * ```typescript
 * @NatsHandler({ subject: 'respondio' })
 * export class RespondIoNatsController {
 *   @NatsHandler({ subject: 'message.send', payloadSchema: SendMessageDto })
 *   async sendMessage(payload: SendMessageDto) {
 *     return { success: true };
 *   }
 * }
 * ```
 */
export const NatsHandler = (options: HandlerOptions) =>
  SetMetadata(NATS_HANDLER_METADATA, options);
