import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────
// Personal Brand domain — zod validation schemas shared by admin API routes
// (server-side) and, where useful, client forms.
// ─────────────────────────────────────────────────────────────────────────

const optionalUrl = z
  .string()
  .trim()
  .url("آدرس معتبر نیست")
  .optional()
  .or(z.literal("").transform(() => undefined));

const optionalString = z
  .string()
  .trim()
  .optional()
  .or(z.literal("").transform(() => undefined));

export const socialLinksSchema = z
  .object({
    github: optionalUrl,
    linkedin: optionalUrl,
    twitter: optionalUrl,
    instagram: optionalUrl,
    telegram: optionalUrl,
  })
  .partial()
  .optional();

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "نام کامل الزامی است"),
  headline: z.string().trim().min(2, "عنوان الزامی است"),
  bio: z.string().trim().min(10, "بیوگرافی الزامی است"),
  avatarUrl: optionalUrl,
  resumeFileUrl: optionalUrl,
  email: z.string().trim().email("ایمیل معتبر نیست").optional().or(z.literal("").transform(() => undefined)),
  phone: optionalString,
  location: optionalString,
  availability: optionalString,
  yearsExperience: z.coerce.number().int().min(0).max(80).optional(),
  socialLinks: socialLinksSchema,
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const skillLevelEnum = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]);

export const skillSchema = z.object({
  name: z.string().trim().min(1, "نام مهارت الزامی است"),
  category: optionalString,
  level: skillLevelEnum.default("INTERMEDIATE"),
  iconUrl: optionalUrl,
  order: z.coerce.number().int().default(0),
});

export type SkillInput = z.infer<typeof skillSchema>;

const dateInput = z.coerce.date();
const optionalDateInput = z
  .union([z.coerce.date(), z.literal(""), z.null(), z.undefined()])
  .optional()
  .transform((v) => (v instanceof Date ? v : undefined));

export const experienceSchema = z.object({
  role: z.string().trim().min(1, "عنوان شغلی الزامی است"),
  company: z.string().trim().min(1, "نام شرکت الزامی است"),
  location: optionalString,
  startDate: dateInput,
  endDate: optionalDateInput,
  isCurrent: z.coerce.boolean().default(false),
  description: z.string().trim().min(1, "توضیحات الزامی است"),
  order: z.coerce.number().int().default(0),
});

export type ExperienceInput = z.infer<typeof experienceSchema>;

export const educationSchema = z.object({
  degree: z.string().trim().min(1, "مقطع تحصیلی الزامی است"),
  institution: z.string().trim().min(1, "نام موسسه الزامی است"),
  fieldOfStudy: optionalString,
  startDate: dateInput,
  endDate: optionalDateInput,
  isCurrent: z.coerce.boolean().default(false),
  description: optionalString,
  order: z.coerce.number().int().default(0),
});

export type EducationInput = z.infer<typeof educationSchema>;

export const certificateSchema = z.object({
  title: z.string().trim().min(1, "عنوان الزامی است"),
  issuer: z.string().trim().min(1, "صادرکننده الزامی است"),
  issueDate: dateInput,
  expiryDate: optionalDateInput,
  credentialUrl: optionalUrl,
  imageUrl: optionalUrl,
  order: z.coerce.number().int().default(0),
});

export type CertificateInput = z.infer<typeof certificateSchema>;

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugField = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "نامک الزامی است")
  .regex(slugRegex, "نامک فقط می‌تواند شامل حروف انگلیسی کوچک، عدد و خط تیره باشد");

export const serviceSchema = z.object({
  title: z.string().trim().min(1, "عنوان الزامی است"),
  slug: slugField,
  description: z.string().trim().min(1, "توضیحات الزامی است"),
  iconUrl: optionalUrl,
  priceFrom: z.coerce.number().min(0).optional(),
  domain: optionalString,
  order: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true),
});

export type ServiceInput = z.infer<typeof serviceSchema>;

export const portfolioProjectSchema = z.object({
  title: z.string().trim().min(1, "عنوان الزامی است"),
  slug: slugField,
  description: z.string().trim().min(1, "توضیحات الزامی است"),
  category: optionalString,
  technologies: z.array(z.string().trim().min(1)).default([]),
  images: z.array(z.string().trim().min(1)).default([]),
  liveUrl: optionalUrl,
  repoUrl: optionalUrl,
  features: z.array(z.string().trim().min(1)).default([]),
  isFeatured: z.coerce.boolean().default(false),
  date: dateInput.default(() => new Date()),
  order: z.coerce.number().int().default(0),
});

export type PortfolioProjectInput = z.infer<typeof portfolioProjectSchema>;

export const testimonialSchema = z.object({
  authorName: z.string().trim().min(1, "نام الزامی است"),
  authorRole: optionalString,
  avatarUrl: optionalUrl,
  content: z.string().trim().min(1, "متن نظر الزامی است"),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  isFeatured: z.coerce.boolean().default(false),
  order: z.coerce.number().int().default(0),
});

export type TestimonialInput = z.infer<typeof testimonialSchema>;

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "نام الزامی است").max(120),
  email: z.string().trim().email("ایمیل معتبر نیست"),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  subject: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  message: z.string().trim().min(10, "پیام باید حداقل ۱۰ کاراکتر باشد").max(5000),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
