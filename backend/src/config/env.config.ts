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
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  ENABLE_SWAGGER: z.coerce.boolean().default(false),
  ENABLE_DEMO_FAUCET: z.coerce.boolean().default(false),
  BUYER_FEE_PERCENTAGE: z.coerce.number().default(2.0),
  WORKER_FEE_PERCENTAGE: z.coerce.number().default(4.0),
  FAILURE_SURCHARGE_PERCENTAGE: z.coerce.number().default(2.0),
  FAILURE_SURCHARGE_ACTIVE: z.coerce.boolean().default(false),
  THROTTLE_TTL: z.coerce.number().default(60),
  THROTTLE_LIMIT: z.coerce.number().default(120),
  DEMO_FAUCET_AMOUNT_CENTS: z.coerce.number().default(100000),
  ENABLE_REAL_PAYMENTS: z.coerce.boolean().default(false),
  BASE_FRONTEND_URL: z.string().default('http://localhost:3000'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  SSLCOMMERZ_STORE_ID: z.string().optional(),
  SSLCOMMERZ_STORE_PASS: z.string().optional(),
  SSLCOMMERZ_IS_SANDBOX: z.coerce.boolean().default(true),
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_WEBHOOK_ID: z.string().optional(),
  PAYPAL_ENVIRONMENT: z.enum(['sandbox', 'live']).default('sandbox'),
  SANDBOX_MOCK_WEBHOOK_SECRET: z.string().default('earnxpress_sandbox_webhook_secret_key_999!'),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = EnvSchema.safeParse(config);
  if (!result.success) {
    const errorDetails = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
    throw new Error(`Environment validation failed: ${errorDetails}`);
  }

  const data = result.data;

  // Strict production invariants
  if (data.NODE_ENV === 'production') {
    const insecureSecrets: string[] = [];
    if (data.JWT_ACCESS_SECRET.startsWith('dev_')) insecureSecrets.push('JWT_ACCESS_SECRET');
    if (data.JWT_REFRESH_SECRET.startsWith('dev_')) insecureSecrets.push('JWT_REFRESH_SECRET');
    if (data.COOKIE_SECRET.startsWith('dev_')) insecureSecrets.push('COOKIE_SECRET');

    if (insecureSecrets.length > 0) {
      throw new Error(
        `Production Security Blocker: Insecure development secret detected in [${insecureSecrets.join(
          ', ',
        )}]. Production environment requires cryptographically secure, high-entropy secrets.`
      );
    }

    if (data.ENABLE_REAL_PAYMENTS) {
      const hasStripe = Boolean(data.STRIPE_SECRET_KEY && data.STRIPE_WEBHOOK_SECRET);
      const hasSSLCommerz = Boolean(data.SSLCOMMERZ_STORE_ID && data.SSLCOMMERZ_STORE_PASS);
      const hasPayPal = Boolean(data.PAYPAL_CLIENT_ID && data.PAYPAL_CLIENT_SECRET);
      if (!hasStripe && !hasSSLCommerz && !hasPayPal) {
        throw new Error(
          'Production Payment Blocker: ENABLE_REAL_PAYMENTS is true, but no verified payment gateway credentials (Stripe, SSLCommerz, or PayPal) are configured.',
        );
      }
    }
  }

  return data;
}
