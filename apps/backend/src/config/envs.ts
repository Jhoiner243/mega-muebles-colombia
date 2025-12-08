import 'dotenv/config';
import Joi from 'joi';

const schema = Joi.object({
  // Database
  DATABASE_URL: Joi.string().required(),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),
  POSTGRES_DB: Joi.string().required(),

  // App
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  APP_URL: Joi.string().default('http://localhost:3000'),
  FRONTEND_URL: Joi.string().default('http://localhost:4200'),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),

  // Optional services (for later phases)
  WOMPI_PUBLIC_KEY: Joi.string().optional(),
  WOMPI_PRIVATE_KEY: Joi.string().optional(),
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().optional(),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASS: Joi.string().optional(),
  TWILIO_ACCOUNT_SID: Joi.string().optional(),
  TWILIO_AUTH_TOKEN: Joi.string().optional(),
  TWILIO_PHONE_NUMBER: Joi.string().optional(),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: Joi.string().optional(),
  CLOUDINARY_API_KEY: Joi.string().optional(),
  CLOUDINARY_API_SECRET: Joi.string().optional(),
}).unknown(true);

const { error, value } = schema.validate(process.env, { allowUnknown: true });

if (error) {
  throw new Error(`Invalid environment variables: ${error.message}`);
}

export const envs = {
  // Database
  databaseUrl: value.DATABASE_URL as string,
  postgresUser: value.POSTGRES_USER as string,
  postgresPassword: value.POSTGRES_PASSWORD as string,
  postgresDb: value.POSTGRES_DB as string,

  // App
  port: value.PORT as number,
  nodeEnv: value.NODE_ENV as 'development' | 'production' | 'test',
  appUrl: value.APP_URL as string,
  frontendUrl: value.FRONTEND_URL as string,
  isProduction: value.NODE_ENV === 'production',
  isDevelopment: value.NODE_ENV === 'development',

  // JWT
  jwtSecret: value.JWT_SECRET as string,
  jwtExpiresIn: value.JWT_EXPIRES_IN as string,
  jwtRefreshSecret: value.JWT_REFRESH_SECRET as string,
  jwtRefreshExpiresIn: value.JWT_REFRESH_EXPIRES_IN as string,

  // Wompi
  wompiPublicKey: value.WOMPI_PUBLIC_KEY as string | undefined,
  wompiPrivateKey: value.WOMPI_PRIVATE_KEY as string | undefined,

  // Email (SMTP)
  smtp: {
    host: value.SMTP_HOST as string | undefined,
    port: value.SMTP_PORT as number | undefined,
    user: value.SMTP_USER as string | undefined,
    pass: value.SMTP_PASS as string | undefined,
  },

  // Twilio
  twilio: {
    accountSid: value.TWILIO_ACCOUNT_SID as string | undefined,
    authToken: value.TWILIO_AUTH_TOKEN as string | undefined,
    phoneNumber: value.TWILIO_PHONE_NUMBER as string | undefined,
  },

  // Cloudinary
  cloudinary: {
    cloudName: value.CLOUDINARY_CLOUD_NAME as string | undefined,
    apiKey: value.CLOUDINARY_API_KEY as string | undefined,
    apiSecret: value.CLOUDINARY_API_SECRET as string | undefined,
  },
};

export default envs;
