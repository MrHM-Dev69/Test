import { z } from "zod";

export const courseSchema = z.object({
  title: z.string().trim().min(3).max(200),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "اسلاگ فقط می‌تواند شامل حروف لاتین کوچک، عدد و خط تیره باشد"),
  description: z.string().trim().min(10),
  coverImage: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  categoryId: z.string().trim().min(1),
  domain: z.enum(["WEB", "WORDPRESS", "FIVEM", "VMP", "MTA", "GENERAL"]),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  durationMinutes: z.number().int().min(0).optional(),
  requirements: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  isFree: z.boolean(),
  price: z.number().min(0),
  salePrice: z.number().min(0).optional(),
  isPublished: z.boolean(),
  isFeatured: z.boolean(),
  sourceCodeUrl: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
});

export const courseUpdateSchema = courseSchema.partial();

export const sectionSchema = z.object({
  title: z.string().trim().min(2).max(200),
  order: z.number().int().min(0).optional(),
});

export const lessonSchema = z.object({
  title: z.string().trim().min(2).max(200),
  type: z.enum(["VIDEO", "ARTICLE", "QUIZ", "ATTACHMENT"]),
  contentBody: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  durationSeconds: z.number().int().min(0).optional(),
  isPreview: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export const quizSchema = z.object({
  questions: z
    .array(
      z.object({
        prompt: z.string().trim().min(2),
        choices: z.array(z.string().trim().min(1)).min(2),
        correctIndex: z.number().int().min(0),
        order: z.number().int().min(0),
      }),
    )
    .min(1),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "اسلاگ فقط می‌تواند شامل حروف لاتین کوچک، عدد و خط تیره باشد"),
  description: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  domain: z.enum(["WEB", "WORDPRESS", "FIVEM", "VMP", "MTA", "GENERAL"]),
  parentId: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  order: z.number().int().min(0).optional(),
});

export const adminGrantSchema = z.object({
  userId: z.string().trim().min(1),
  courseId: z.string().trim().min(1),
});

export const answerQuestionSchema = z.object({
  answer: z.string().trim().min(1).max(3000),
});

export const articleSchema = z.object({
  title: z.string().trim().min(3).max(200),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "اسلاگ فقط می‌تواند شامل حروف لاتین کوچک، عدد و خط تیره باشد"),
  type: z.enum(["ARTICLE", "TUTORIAL", "ROADMAP", "RESOURCE"]),
  excerpt: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  body: z.string().trim().min(10),
  coverImage: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  domain: z.enum(["WEB", "WORDPRESS", "FIVEM", "VMP", "MTA", "GENERAL"]),
  authorName: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  isPublished: z.boolean(),
  seoTitle: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  seoDescription: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
});

export const articleUpdateSchema = articleSchema.partial();
