import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  connect,
  DebugEvents,
  Events,
  jwtAuthenticator,
  NatsConnection,
} from 'nats';
import { ENV_KEYS, NodeEnv } from '@common/const/env.const';

interface JWTResponse {
  value: string;
}

@Injectable()
export class NatsProvider implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NatsProvider.name);
  #natsConnection: NatsConnection;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const servers: string[] = this.configService
      .get<string>(ENV_KEYS.NATS_URL)
      .split(',')
      .map((s) => s.trim());
    
    this.logger.log(`NATS 서버에 연결 중: ${servers.join(', ')}`);

    const nodeEnv = this.configService.get<string>(ENV_KEYS.NODE_ENV);

    // Local 환경: user/password 인증
    if (nodeEnv === NodeEnv.LOCAL || nodeEnv === NodeEnv.DEVELOPMENT) {
      const user = this.configService.get<string>(ENV_KEYS.NATS_USER);
      const pass = this.configService.get<string>(ENV_KEYS.NATS_PASSWORD);

      if (user && pass) {
        this.logger.log('NATS User/Password 인증 사용');
        this.#natsConnection = await connect({
          servers,
          user,
          pass,
          maxReconnectAttempts: -1,
          reconnectTimeWait: 2000,
          waitOnFirstConnect: true,
        });
      } else {
        // 로컬 개발 환경에서 인증 없이 연결
        this.logger.log('NATS 인증 없이 연결');
        this.#natsConnection = await connect({
          servers,
          maxReconnectAttempts: -1,
          reconnectTimeWait: 2000,
          waitOnFirstConnect: true,
        });
      }
    } else {
      // Production 환경: JWT 인증
      const authUrl = this.configService.get<string>(ENV_KEYS.NATS_AUTH_URL);
      const accessKey = this.configService.get<string>(ENV_KEYS.NATS_ACCESS_KEY);
      const secretKey = this.configService.get<string>(ENV_KEYS.NATS_SECRET_KEY);

      if (!authUrl || !accessKey || !secretKey) {
        throw new Error(
          'Production 환경에서는 NATS_AUTH_URL, NATS_ACCESS_KEY, NATS_SECRET_KEY가 필요합니다',
        );
      }

      this.logger.log('NATS JWT 인증 사용');
      const jwt = await this.#getJWT(authUrl, accessKey, secretKey);

      this.#natsConnection = await connect({
        servers,
        authenticator: jwtAuthenticator(
          jwt,
          new TextEncoder().encode(secretKey),
        ),
        maxReconnectAttempts: -1,
        reconnectTimeWait: 2000,
        waitOnFirstConnect: true,
      });
    }

    // 연결 상태 모니터링
    (async () => {
      for await (const s of this.#natsConnection.status()) {
        switch (s.type) {
          case Events.Disconnect:
            this.logger.warn(`NATS 연결 끊김 - ${JSON.stringify(s.data)}`);
            break;

          case Events.LDM:
            this.logger.log('NATS 재연결 요청됨');
            break;

          case Events.Reconnect:
            this.logger.log(`NATS 재연결됨 - ${JSON.stringify(s.data)}`);
            break;

          case Events.Error:
            this.logger.error('NATS 권한 에러');
            break;

          case DebugEvents.Reconnecting:
            this.logger.log('NATS 재연결 시도 중');
            break;

          case DebugEvents.StaleConnection:
            this.logger.warn('NATS 연결이 오래되었습니다');
            break;

          default:
            this.logger.debug(`NATS 상태: ${String(s.type)}`);
            break;
        }
      }
    })().then();

    this.logger.log('NATS에 성공적으로 연결되었습니다');
  }

  async onModuleDestroy() {
    this.logger.log('NATS 연결을 종료합니다...');
    await this.#natsConnection?.drain();
    this.logger.log('NATS 연결이 종료되었습니다');
  }

  async #getJWT(
    authUrl: string,
    accessKey: string,
    secretKey: string,
  ): Promise<string> {
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        secret_key: secretKey,
      }),
    });

    if (!response.ok) {
      throw new Error(`NATS JWT 인증 실패: ${response.status}`);
    }

    const data = (await response.json()) as JWTResponse;
    return data.value;
  }

  get natsConnection(): NatsConnection {
    return this.#natsConnection;
  }

  checkNats() {
    const isConnected = this.#natsConnection?.isClosed() === false;
    return {
      isConnected,
      serverInfo: this.#natsConnection?.info,
    };
  }
}
