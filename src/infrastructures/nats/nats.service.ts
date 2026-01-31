import { Injectable, Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { Msg, PublishOptions, RequestOptions, Subscription } from 'nats';
import { NatsProvider } from './nats.provider';

interface HandlerOptions {
  handler: (payload: any) => Promise<any>;
  payloadSchema?: new () => any;
}

@Injectable()
export class NatsService {
  private readonly logger = new Logger(NatsService.name);

  constructor(private readonly natsProvider: NatsProvider) { }

  /**
   * Request/Reply Server: NATS 메시지를 구독하고 자동으로 응답
   * @param subject NATS subject
   * @param handlerOptions 핸들러 옵션 (handler, payloadSchema)
   */
  subscribeAndReply(subject: string, handlerOptions: HandlerOptions) {
    const msgQueue: Subscription = this.natsProvider.natsConnection.subscribe(subject, {
      queue: 'RESPONDIO_GATEWAY_QUEUE',
    });

    this.logger.log(`Subscribed to ${subject} (queue: RESPONDIO_GATEWAY_QUEUE)`);

    (async () => {
      for await (const msg of msgQueue) {
        try {
          this.logger.debug(`Received message: ${subject}`);

          // Payload 디코딩
          const payload = JSON.parse(new TextDecoder().decode(msg.data));

          // Payload 검증 (선택적)
          if (handlerOptions.payloadSchema) {
            const dto = plainToInstance(handlerOptions.payloadSchema, payload);
            const errors: ValidationError[] = await validate(dto);

            if (errors.length > 0) {
              const errorMessages = errors
                .map((error) => Object.values(error.constraints || {}).join(', '))
                .join('; ');

              this.logger.warn(`Validation failed for ${subject}: ${errorMessages}`);

              msg.respond(
                new TextEncoder().encode(
                  JSON.stringify({
                    success: false,
                    data: `Validation error: ${errorMessages}`,
                  }),
                ),
              );
              continue;
            }
          }

          // Handler 실행
          const result = await handlerOptions.handler(payload);

          // 성공 응답
          msg.respond(
            new TextEncoder().encode(
              JSON.stringify({
                success: true,
                data: result,
              }),
            ),
          );
        } catch (err) {
          this.logger.error(`Error processing message on ${subject}:`, err);

          // 에러 응답
          msg.respond(
            new TextEncoder().encode(
              JSON.stringify({
                success: false,
                data: {
                  message: err instanceof Error ? err.message : 'Unknown error',
                  name: err instanceof Error ? err.name : 'Error',
                },
              }),
            ),
          );
        }
      }
    })().then();
  }

  /**
   * 다른 서비스에 요청 보내기 (필요시 사용)
   * @param subject NATS subject
   * @param payload 요청 데이터
   * @param options RequestOptions
   */
  async sendRequest<T = any>(
    subject: string,
    payload: any,
    options?: RequestOptions,
  ): Promise<T> {
    const connection = this.natsProvider.natsConnection;

    const opts: RequestOptions = {
      timeout: options?.timeout || 10000,
      ...options,
    };

    const reply = await connection.request(
      subject,
      new TextEncoder().encode(JSON.stringify(payload)),
      opts,
    );

    const result: { success: boolean; data: T } = JSON.parse(
      new TextDecoder().decode(reply.data),
    );

    if (!result.success) {
      throw new Error(
        typeof result.data === 'string'
          ? result.data
          : JSON.stringify(result.data),
      );
    }

    return result.data;
  }

  /**
   * Pub/Sub: 이벤트 발행 (응답 안 기다림)
   * @param subject NATS subject
   * @param data 발행할 데이터
   * @param options PublishOptions
   */
  publishEvent(subject: string, data: any, options?: PublishOptions) {
    const connection = this.natsProvider.natsConnection;

    this.logger.debug(`Publishing event to ${subject}`);

    connection.publish(
      subject,
      new TextEncoder().encode(JSON.stringify(data)),
      options,
    );
  }

  /**
   * Subject 패턴 매칭 (Wildcard 지원)
   * @param pattern 패턴 (예: 'user.*', 'user.>')
   * @param subject Subject (예: 'user.get')
   */
  matchSubject(pattern: string, subject: string): boolean {
    const patternParts = pattern.split('.');
    const subjectParts = subject.split('.');

    if (patternParts.length > subjectParts.length && !pattern.includes('>')) {
      return false;
    }

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const subjectPart = subjectParts[i];

      if (patternPart === '>') {
        return true;
      }

      if (patternPart !== '*' && patternPart !== subjectPart) {
        return false;
      }
    }

    return patternParts.length === subjectParts.length;
  }
}
