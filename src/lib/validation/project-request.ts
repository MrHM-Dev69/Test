import { z } from "zod";

export const PROJECT_TYPE_VALUES = [
  "WEBSITE",
  "WORDPRESS",
  "FIVEM",
  "VMP",
  "MTA",
  "PLUGIN",
  "SCRIPT",
  "UI_UX",
  "OTHER",
] as const;

export const BUDGET_RANGE_VALUES = [
  "UNDER_10M",
  "R10M_30M",
  "R30M_70M",
  "OVER_70M",
  "NOT_DECIDED",
] as const;

export const PROJECT_PRIORITY_VALUES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

export const projectRequestSchema = z.object({
  contactName: z.string().trim().min(2, "نام باید حداقل ۲ حرف باشد").max(120),
  contactEmail: z.string().trim().email("ایمیل معتبر نیست"),
  contactPhone: z
    .string()
    .trim()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  projectType: z.enum(PROJECT_TYPE_VALUES),
  categoryDomain: z
    .enum(["WEB", "WORDPRESS", "FIVEM", "VMP", "MTA", "GENERAL"])
    .optional()
    .or(z.literal("").transform(() => undefined)),
  description: z.string().trim().min(20, "توضیحات باید حداقل ۲۰ حرف باشد").max(5000),
  requirements: z
    .string()
    .trim()
    .max(5000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  budgetRange: z.enum(BUDGET_RANGE_VALUES),
  deadline: z
    .string()
    .trim()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  priority: z.enum(PROJECT_PRIORITY_VALUES),
});

export type ProjectRequestInput = z.infer<typeof projectRequestSchema>;

export const PROJECT_TYPE_LABELS: Record<(typeof PROJECT_TYPE_VALUES)[number], string> = {
  WEBSITE: "طراحی وب‌سایت",
  WORDPRESS: "وردپرس",
  FIVEM: "FiveM",
  VMP: "VMP",
  MTA: "MTA",
  PLUGIN: "پلاگین",
  SCRIPT: "اسکریپت",
  UI_UX: "طراحی UI/UX",
  OTHER: "سایر",
};

export const BUDGET_RANGE_LABELS: Record<(typeof BUDGET_RANGE_VALUES)[number], string> = {
  UNDER_10M: "کمتر از ۱۰ میلیون تومان",
  R10M_30M: "۱۰ تا ۳۰ میلیون تومان",
  R30M_70M: "۳۰ تا ۷۰ میلیون تومان",
  OVER_70M: "بیشتر از ۷۰ میلیون تومان",
  NOT_DECIDED: "هنوز مشخص نیست",
};

export const PROJECT_PRIORITY_LABELS: Record<(typeof PROJECT_PRIORITY_VALUES)[number], string> = {
  LOW: "کم",
  NORMAL: "عادی",
  HIGH: "بالا",
  URGENT: "فوری",
};
