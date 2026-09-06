import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_JWT_SECRET: z.string().min(16),
  AUTH_SESSION_COOKIE_NAME: z.string().default("__session"),
  AUTH_ADMIN_2FA_ISSUER: z.string().default("BrandPlatform"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  TIMEZONE: z.string().default("Asia/Tehran"),

  ACTIVE_PAYMENT_PROVIDER: z
    .enum(["ZARINPAL", "IDPAY", "NEXTPAY", "CUSTOM_GATEWAY"])
    .default("ZARINPAL"),
  ZARINPAL_MERCHANT_ID: z.string().default(""),
  ZARINPAL_SANDBOX: z.string().default("true"),
  IDPAY_API_KEY: z.string().default(""),
  IDPAY_SANDBOX: z.string().default("true"),
  NEXTPAY_API_KEY: z.string().default(""),

  ACTIVE_SMS_PROVIDER: z.enum(["KAVENEGAR", "SMSIR"]).default("KAVENEGAR"),
  KAVENEGAR_API_KEY: z.string().default(""),
  KAVENEGAR_SENDER: z.string().default(""),
  SMSIR_API_KEY: z.string().default(""),
  SMSIR_LINE_NUMBER: z.string().default(""),

  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.string().default("587"),
  SMTP_USER: z.string().default(""),
  SMTP_PASSWORD: z.string().default(""),
  SMTP_FROM: z.string().default("no-reply@example.com"),

  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  STORAGE_LOCAL_PRIVATE_DIR: z.string().default("./storage/private"),
  STORAGE_LOCAL_PUBLIC_DIR: z.string().default("./public/uploads"),
  S3_ENDPOINT: z.string().default(""),
  S3_BUCKET: z.string().default(""),
  S3_ACCESS_KEY_ID: z.string().default(""),
  S3_SECRET_ACCESS_KEY: z.string().default(""),
  S3_REGION: z.string().default(""),

  DOWNLOAD_SIGNING_SECRET: z.string().min(16),
  DOWNLOAD_URL_TTL_SECONDS: z.string().default("300"),
});

// Parsed once, at module load, so a misconfigured deployment fails fast at
// startup rather than surfacing as an obscure runtime error mid-request.
export const env = envSchema.parse(process.env);

export const isProd = env.NODE_ENV === "production";
