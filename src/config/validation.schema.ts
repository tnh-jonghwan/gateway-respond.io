import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // respond.io
  RESPOND_IO_API_KEY: Joi.string().required(),
  
  // Polling (Growth plan)
  POLLING_ENABLED: Joi.string().valid('true', 'false').default('false'),
  POLLING_CONTACTS: Joi.string().allow('').default(''), // comma-separated contact IDs
  
  // Server
  PORT: Joi.number().default(3001),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
});
