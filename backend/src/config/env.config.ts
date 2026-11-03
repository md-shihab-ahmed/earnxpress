import { z } from 'zod';

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  API_PREFIX: z.string().default('api/v1'),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  COOKIE_SECRET: z.string().min(16).default('dev_cookie_secret_earnxpress_secure_789!'),
  BUYER_FEE_PERCENTAGE: z.coerce.number().default(2.0),
  WORKER_FEE_PERCENTAGE: z.coerce.number().default(4.0),
  FAILURE_SURCHARGE_PERCENTAGE: z.coerce.number().default(2.0),
  FAILURE_SURCHARGE_ACTIVE: z.coerce.boolean().default(false),
  THROTTLE_TTL: z.coerce.number().default(60),
  THROTTLE_LIMIT: z.coerce.number().default(120),
  DEMO_FAUCET_AMOUNT_CENTS: z.coerce.number().default(100000),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = EnvSchema.safeParse(config);
  if (!result.success) {
    const errorDetails = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
    throw new Error(`Environment validation failed: ${errorDetails}`);
  }
  return result.data;
}
