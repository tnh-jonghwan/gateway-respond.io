import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // respond.io
  RESPOND_IO_API_KEY: Joi.string().required(),
  
  // Server
  PORT: Joi.number().default(3001),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
});
