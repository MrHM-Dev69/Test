import { z } from "zod";

export const phoneSchema = z
  .string()
  .regex(/^09\d{9}$/, "شماره موبایل معتبر ایران را وارد کنید (مثال: 09123456789)");

export const otpRequestSchema = z.object({
  destination: z.union([phoneSchema, z.string().email()]),
  purpose: z.enum(["LOGIN", "REGISTER", "RESET_PASSWORD", "VERIFY_PHONE", "VERIFY_EMAIL"]),
});

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  phone: phoneSchema.optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).max(128),
  otpCode: z.string().length(6),
}).refine((data) => data.phone || data.email, {
  message: "شماره موبایل یا ایمیل الزامی است",
  path: ["phone"],
});

export const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1),
  totpCode: z.string().length(6).optional(),
});

export const otpLoginSchema = z.object({
  destination: z.union([phoneSchema, z.string().email()]),
  code: z.string().length(6),
});

export const resetPasswordSchema = z.object({
  destination: z.union([phoneSchema, z.string().email()]),
  code: z.string().length(6),
  newPassword: z.string().min(8).max(128),
});
