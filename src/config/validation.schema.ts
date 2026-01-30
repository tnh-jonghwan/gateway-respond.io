import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Respond.io
  RESPOND_IO_API_KEY: Joi.string().required(),
  
  // 폴링 방식
  POLLING_ENABLED: Joi.string().valid('true', 'false').default('false'),
  
  // Server
  PORT: Joi.number().default(3001),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  
  // NATS
  NATS_URL: Joi.string().default('nats://localhost:4222'),
  
  // JWT Auth (Production)
  NATS_AUTH_URL: Joi.string().allow('').optional(),
  NATS_ACCESS_KEY: Joi.string().allow('').optional(),
  NATS_SECRET_KEY: Joi.string().allow('').optional(),
  
  // User/Password Auth (Local)
  NATS_USER: Joi.string().allow('').optional(),
  NATS_PASSWORD: Joi.string().allow('').optional(),
});
