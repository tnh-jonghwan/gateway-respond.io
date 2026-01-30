/**
 * 환경 변수 키 상수
 */
export const ENV_KEYS = {
  // respond.io
  RESPOND_IO_API_KEY: 'RESPOND_IO_API_KEY',
  RESPOND_IO_CHANNEL_ID: 'RESPOND_IO_CHANNEL_ID',

  // Polling
  POLLING_ENABLED: 'POLLING_ENABLED',

  // Server
  PORT: 'PORT',
  NODE_ENV: 'NODE_ENV',

  // NATS
  NATS_URL: 'NATS_URL',
  NATS_USER: 'NATS_USER',
  NATS_PASSWORD: 'NATS_PASSWORD',
  NATS_AUTH_URL: 'NATS_AUTH_URL',
  NATS_ACCESS_KEY: 'NATS_ACCESS_KEY',
  NATS_SECRET_KEY: 'NATS_SECRET_KEY',
} as const;

/**
 * Node 환경 타입
 */
export enum NodeEnv {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
  LOCAL = 'local',
}

/**
 * 기본값
 */
export const ENV_DEFAULTS = {
  PORT: 3001,
  NODE_ENV: NodeEnv.DEVELOPMENT,
  NATS_URL: 'nats://localhost:4222',
} as const;
